import "server-only";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { hasPersonCapability } from "@/domain/person";
import { PostgresCredentialRepository } from "../repositories/credential-repository";
import { PostgresKidRepository } from "../repositories/kid-repository";
import { PostgresPersonRepository } from "../repositories/person-repository";
import { PostgresPersonRoleRepository } from "../repositories/person-role-repository";
import { PostgresPostRepository } from "../repositories/post-repository";
import { PostgresPostAccessRepository } from "../repositories/post-access-repository";
import { PostgresStaffShellRepository } from "../repositories/staff-shell-repository";
import { PostgresRoomRepository } from "../repositories/room-repository";
import { withRemoteDbTestTransaction } from "./remote-db-test-context";

function createIds() {
  return {
    daycareId: randomUUID(),
    otherDaycareId: randomUUID(),
    personId: randomUUID(),
    otherPersonId: randomUUID(),
    noRolePersonId: randomUUID(),
    roomIds: [randomUUID(), randomUUID(), randomUUID()],
  };
}

/**
 * Runs opt-in checks for multi-role login data, tenant isolation and Staff Shell
 * projections. Every scenario is rolled back by the remote test context.
 */
export async function runRemoteMultirolePersistenceTests(): Promise<void> {
  const ids = createIds();

  await withRemoteDbTestTransaction(async (client) => {
    const people = new PostgresPersonRepository(client);
    const roles = new PostgresPersonRoleRepository(client);
    const credentials = new PostgresCredentialRepository(client);
    const rooms = new PostgresRoomRepository(client);
    const kids = new PostgresKidRepository(client);
    const currentDaycare = {
      getCurrentDaycareId: async () => ids.daycareId,
    };
    const access = new PostgresPostAccessRepository(client, currentDaycare);
    const posts = new PostgresPostRepository(client, currentDaycare, access);
    const staffShell = new PostgresStaffShellRepository(client);

    await client`
      INSERT INTO daycares (id, name, brand_name)
      VALUES
        (${ids.daycareId}, 'Multi-role Test', 'MultiRole Daycare'),
        (${ids.otherDaycareId}, 'Other Tenant', 'Other Brand')
    `;
    await client`
      INSERT INTO roles (id, code)
      VALUES
        (${randomUUID()}, 'admin'),
        (${randomUUID()}, 'personal'),
        (${randomUUID()}, 'teacher'),
        (${randomUUID()}, 'parent')
      ON CONFLICT (code) DO NOTHING
    `;
    await client`
      INSERT INTO people (id, daycare_id, name, email, job_title, status)
      VALUES
        (${ids.personId}, ${ids.daycareId}, 'Multi Role Person', 'multi@example.test', 'Maestra', 'active'),
        (${ids.otherPersonId}, ${ids.otherDaycareId}, 'Other Tenant Person', 'multi@example.test', 'Personal', 'active'),
        (${ids.noRolePersonId}, ${ids.daycareId}, 'No Role Person', 'no-role@example.test', 'Personal', 'active')
    `;
    await client`
      INSERT INTO people_roles (daycare_id, person_id, role_id)
      SELECT ${ids.daycareId}, ${ids.personId}, id
      FROM roles
      WHERE code IN ('admin', 'personal', 'teacher')
    `;
    await client`
      INSERT INTO people_roles (daycare_id, person_id, role_id)
      SELECT ${ids.otherDaycareId}, ${ids.otherPersonId}, id
      FROM roles
      WHERE code = 'parent'
    `;
    await credentials.upsert({
      daycareId: ids.daycareId,
      id: randomUUID(),
      personId: ids.personId,
      passwordHash: "multi-role-password-hash",
    });
    await credentials.upsert({
      daycareId: ids.daycareId,
      id: randomUUID(),
      personId: ids.noRolePersonId,
      passwordHash: "no-role-password-hash",
    });

    assert.deepEqual(
      await roles.findByPersonAndDaycare(ids.personId, ids.daycareId),
      ["admin", "personal", "teacher"],
    );
    assert.deepEqual(
      await roles.findByPersonAndDaycare(ids.personId, ids.otherDaycareId),
      [],
    );
    assert.deepEqual(
      await roles.findByPersonAndDaycare(ids.otherPersonId, ids.otherDaycareId),
      ["parent"],
    );
    assert.deepEqual(await roles.findByPersonAndDaycare(ids.noRolePersonId, ids.daycareId), []);
    assert.deepEqual((await people.findByEmail(ids.daycareId, "multi@example.test"))?.roles, [
      "admin",
      "personal",
      "teacher",
    ]);
    assert.equal(
      await credentials.findByPersonId(ids.daycareId, ids.noRolePersonId) !== null,
      true,
    );

    assert.equal(hasPersonCapability(["admin", "personal", "teacher"], "staff-shell"), true);
    assert.equal(hasPersonCapability(["admin", "personal", "teacher"], "manage-posts"), true);
    assert.equal(hasPersonCapability(["admin"], "staff-shell"), false);
    assert.equal(hasPersonCapability(["parent"], "family-feed"), true);

    for (const [index, roomId] of ids.roomIds.entries()) {
      await rooms.create({
        daycareId: ids.daycareId,
        id: roomId,
        name: ["Soles", "Girasoles", "Patitos"][index],
      });
    }
    await client`
      INSERT INTO staff_rooms (daycare_id, person_id, room_id)
      SELECT ${ids.daycareId}, ${ids.personId}, id
      FROM rooms
      WHERE daycare_id = ${ids.daycareId}
    `;
    const navigation = await staffShell.findByPerson(ids.daycareId, ids.personId);
    assert.deepEqual(navigation?.roomNames, ["Girasoles", "Patitos", "Soles"]);
    assert.equal(navigation?.brandName, "MultiRole Daycare");
    assert.equal(navigation?.jobTitle, "Maestra");

    const emptyNavigation = await staffShell.findByPerson(
      ids.daycareId,
      ids.noRolePersonId,
    );
    assert.deepEqual(emptyNavigation?.roomNames, []);
    assert.deepEqual(await kids.findAll(ids.daycareId), []);
    assert.deepEqual(await posts.findAll(), []);
  });
}
