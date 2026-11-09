import "server-only";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { isCredentialLoginEligible } from "@/application/auth";
import { PostgresClientProvider } from "../client/postgres-client-provider";
import { PostgresCredentialRepository } from "../repositories/credential-repository";
import { PostgresInvitationRepository } from "../repositories/invitation-repository";
import { PostgresParentKidRepository } from "../repositories/parent-kid-repository";
import { PostgresPersonRepository } from "../repositories/person-repository";
import { PostgresPersonRoleRepository } from "../repositories/person-role-repository";
import { withRemoteDbTestTransaction } from "./remote-db-test-context";

const ROLLBACK_MARKER = "remote-auth-test-rollback";

function createIds() {
  return {
    firstDaycareId: randomUUID(),
    secondDaycareId: randomUUID(),
    firstPersonId: randomUUID(),
    secondPersonId: randomUUID(),
    firstCredentialId: randomUUID(),
    secondCredentialId: randomUUID(),
    firstKidId: randomUUID(),
    secondKidId: randomUUID(),
    firstRoomId: randomUUID(),
    firstInvitationId: randomUUID(),
    secondInvitationId: randomUUID(),
  };
}

/**
 * Runs the opt-in remote PostgreSQL Auth persistence checks.
 *
 * Every scenario uses generated PostgreSQL identifiers and is enclosed by
 * withRemoteDbTestTransaction, so no test data survives a successful run.
 * The helper throws RemoteDbTestsDisabledError unless RUN_REMOTE_DB_TESTS=true.
 */
export async function runRemoteAuthPersistenceTests(): Promise<void> {
  const ids = createIds();
  const email = `remote-auth-${ids.firstPersonId}@example.test`;

  await withRemoteDbTestTransaction(async (client) => {
    const people = new PostgresPersonRepository(client);
    const personRoles = new PostgresPersonRoleRepository(client);
    const credentials = new PostgresCredentialRepository(client);

    const roleRows = await client<{ id: string; code: string }[]>`
      SELECT id, code::text
      FROM roles
      WHERE code IN ('admin', 'parent', 'teacher')
    `;
    const roleIds = new Map(roleRows.map((row) => [row.code, row.id]));
    const parentRoleId = roleIds.get("parent");
    const teacherRoleId = roleIds.get("teacher");
    if (!parentRoleId || !teacherRoleId) {
      throw new Error("Remote Auth test requires seeded parent and teacher roles");
    }

    await client`
      INSERT INTO daycares (id, name, brand_name)
      VALUES
        (${ids.firstDaycareId}, ${`Remote Auth ${ids.firstDaycareId}`}, 'Remote Auth'),
        (${ids.secondDaycareId}, ${`Remote Auth ${ids.secondDaycareId}`}, 'Other Auth')
    `;
    await client`
      INSERT INTO people (id, daycare_id, name, email, job_title, status)
      VALUES
        (${ids.firstPersonId}, ${ids.firstDaycareId}, 'Remote Parent A', ${email}, 'Parent', 'active'),
        (${ids.secondPersonId}, ${ids.secondDaycareId}, 'Remote Parent B', ${email}, 'Parent', 'active')
    `;
    await client`
      INSERT INTO people_roles (daycare_id, person_id, role_id)
      VALUES
        (${ids.firstDaycareId}, ${ids.firstPersonId}, ${parentRoleId}),
        (${ids.secondDaycareId}, ${ids.secondPersonId}, ${teacherRoleId})
    `;

    const firstPerson = await people.findByEmail(ids.firstDaycareId, email);
    const secondPerson = await people.findByEmail(ids.secondDaycareId, email);
    const wrongTenantPerson = await people.findByEmail(ids.firstDaycareId, "missing@example.test");

    assert.equal(firstPerson?.id, ids.firstPersonId);
    assert.equal(secondPerson?.id, ids.secondPersonId);
    assert.equal(wrongTenantPerson, null);
    assert.deepEqual(await personRoles.findRoles(ids.firstPersonId, ids.firstDaycareId), ["parent"]);
    assert.deepEqual(await personRoles.findRoles(ids.secondPersonId, ids.secondDaycareId), ["teacher"]);
    assert.deepEqual(await personRoles.findRoles(ids.firstPersonId, ids.secondDaycareId), []);
    assert.deepEqual(await personRoles.findRoles(ids.secondPersonId, ids.firstDaycareId), []);
    assert.equal(
      isCredentialLoginEligible(
        firstPerson,
        {
          daycareId: ids.firstDaycareId,
          id: ids.firstCredentialId,
          personId: ids.firstPersonId,
          passwordHash: "remote-test-hash-a",
        },
        ["parent"],
        ids.firstDaycareId,
      ),
      true,
    );
    assert.equal(
      isCredentialLoginEligible(
        firstPerson,
        {
          daycareId: ids.firstDaycareId,
          id: ids.firstCredentialId,
          personId: ids.firstPersonId,
          passwordHash: "remote-test-hash-a",
        },
        [],
        ids.firstDaycareId,
      ),
      false,
    );
    assert.equal(
      isCredentialLoginEligible(
        firstPerson,
        {
          daycareId: ids.secondDaycareId,
          id: ids.secondCredentialId,
          personId: ids.firstPersonId,
          passwordHash: "remote-test-hash-b",
        },
        ["parent"],
        ids.firstDaycareId,
      ),
      false,
    );

    await credentials.upsert({
      daycareId: ids.firstDaycareId,
      id: ids.firstCredentialId,
      personId: ids.firstPersonId,
      passwordHash: "remote-test-hash-a",
    });
    await credentials.upsert({
      daycareId: ids.secondDaycareId,
      id: ids.secondCredentialId,
      personId: ids.secondPersonId,
      passwordHash: "remote-test-hash-b",
    });

    assert.equal(
      (await credentials.findByPersonId(ids.firstDaycareId, ids.firstPersonId))?.id,
      ids.firstCredentialId,
    );
    assert.equal(
      await credentials.findByPersonId(ids.firstDaycareId, ids.secondPersonId),
      null,
    );
  });

  try {
    await withRemoteDbTestTransaction(async (client) => {
      const credentials = new PostgresCredentialRepository(client);
      const invitations = new PostgresInvitationRepository(client);
      const parentKids = new PostgresParentKidRepository(client);

      await client`
        INSERT INTO daycares (id, name, brand_name)
        VALUES (${ids.firstDaycareId}, ${`Rollback Auth ${ids.firstDaycareId}`}, 'Rollback Auth')
      `;
      await client`
        INSERT INTO people (id, daycare_id, name, email, job_title, status)
        VALUES (${ids.firstPersonId}, ${ids.firstDaycareId}, 'Rollback Parent', ${email}, 'Parent', 'pending')
      `;
      await client`
        INSERT INTO rooms (id, daycare_id, name)
        VALUES (${ids.firstRoomId}, ${ids.firstDaycareId}, 'Rollback Room')
      `;
      await client`
        INSERT INTO kids (
          id, daycare_id, slug, name, birth_date, room_id,
          enrollment_date, medical_notes, allergies, status
        )
        VALUES (
          ${ids.firstKidId}, ${ids.firstDaycareId}, ${`rollback-${ids.firstKidId}`},
          'Rollback Kid', '2020-01-01',
          ${ids.firstRoomId},
          '2026-01-01', '', '', 'active'
        )
      `;

      await credentials.upsert({
        daycareId: ids.firstDaycareId,
        id: ids.firstCredentialId,
        personId: ids.firstPersonId,
        passwordHash: "rollback-test-hash",
      });
      await parentKids.create({
        daycareId: ids.firstDaycareId,
        id: randomUUID(),
        parentId: ids.firstPersonId,
        kidId: ids.firstKidId,
        relationship: "guardian",
        photoSharingConsent: true,
      });
      await invitations.create({
        daycareId: ids.firstDaycareId,
        id: ids.firstInvitationId,
        personId: ids.firstPersonId,
        kidId: ids.firstKidId,
        relationship: "guardian",
        code: `RB-${ids.firstInvitationId}`,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        sentAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
      });

      throw new Error(ROLLBACK_MARKER);
    });
  } catch (error) {
    assert.equal((error as Error).message, ROLLBACK_MARKER);
  }

  const verificationClient = new PostgresClientProvider().createClient();

  try {
    const [peopleRows, credentialRows, relationshipRows, invitationRows] =
      await Promise.all([
        verificationClient<{ count: string }[]>`
          SELECT count(*)::text AS count FROM people
          WHERE id IN (${ids.firstPersonId}, ${ids.secondPersonId})
        `,
        verificationClient<{ count: string }[]>`
          SELECT count(*)::text AS count FROM credential
          WHERE id = ${ids.firstCredentialId}
        `,
        verificationClient<{ count: string }[]>`
          SELECT count(*)::text AS count FROM parent_kids
          WHERE parent_id = ${ids.firstPersonId} AND kid_id = ${ids.firstKidId}
        `,
        verificationClient<{ count: string }[]>`
          SELECT count(*)::text AS count FROM invitation
          WHERE id = ${ids.firstInvitationId}
        `,
      ]);

    assert.equal(peopleRows[0]?.count, "0");
    assert.equal(credentialRows[0]?.count, "0");
    assert.equal(relationshipRows[0]?.count, "0");
    assert.equal(invitationRows[0]?.count, "0");
  } finally {
    await verificationClient.end({ timeout: 5 });
  }
}
