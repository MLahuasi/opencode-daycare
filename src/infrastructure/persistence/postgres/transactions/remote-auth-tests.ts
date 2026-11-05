import "server-only";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PostgresClientProvider } from "../client/postgres-client-provider";
import { PostgresCredentialRepository } from "../repositories/credential-repository";
import { PostgresInvitationRepository } from "../repositories/invitation-repository";
import { PostgresParentKidRepository } from "../repositories/parent-kid-repository";
import { PostgresPersonRepository } from "../repositories/person-repository";
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
    const credentials = new PostgresCredentialRepository(client);

    await client`
      INSERT INTO daycares (id, name)
      VALUES
        (${ids.firstDaycareId}, ${`Remote Auth ${ids.firstDaycareId}`}),
        (${ids.secondDaycareId}, ${`Remote Auth ${ids.secondDaycareId}`})
    `;
    await client`
      INSERT INTO people (id, daycare_id, name, email, role, status)
      VALUES
        (${ids.firstPersonId}, ${ids.firstDaycareId}, 'Remote Parent A', ${email}, 'parent', 'active'),
        (${ids.secondPersonId}, ${ids.secondDaycareId}, 'Remote Parent B', ${email}, 'parent', 'active')
    `;

    const firstPerson = await people.findByEmail(ids.firstDaycareId, email);
    const secondPerson = await people.findByEmail(ids.secondDaycareId, email);
    const wrongTenantPerson = await people.findByEmail(ids.firstDaycareId, "missing@example.test");

    assert.equal(firstPerson?.id, ids.firstPersonId);
    assert.equal(secondPerson?.id, ids.secondPersonId);
    assert.equal(wrongTenantPerson, null);

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
        INSERT INTO daycares (id, name)
        VALUES (${ids.firstDaycareId}, ${`Rollback Auth ${ids.firstDaycareId}`})
      `;
      await client`
        INSERT INTO people (id, daycare_id, name, email, role, status)
        VALUES (${ids.firstPersonId}, ${ids.firstDaycareId}, 'Rollback Parent', ${email}, 'parent', 'pending')
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
