import "server-only";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PostgresClientProvider } from "../client/postgres-client-provider";
import { PostgresKidRepository } from "../repositories/kid-repository";
import { PostgresParentKidRepository } from "../repositories/parent-kid-repository";
import { PostgresPostAccessRepository } from "../repositories/post-access-repository";
import { PostgresPostRepository } from "../repositories/post-repository";
import { PostgresRoomRepository } from "../repositories/room-repository";
import { PostgresPersonRoleRepository } from "../repositories/person-role-repository";
import { PostgresStaffShellRepository } from "../repositories/staff-shell-repository";
import { withRemoteDbTestTransaction } from "./remote-db-test-context";

function createIds() {
  return {
    daycareId: randomUUID(),
    otherDaycareId: randomUUID(),
    staffId: randomUUID(),
    parentId: randomUUID(),
    roomId: randomUUID(),
    secondRoomId: randomUUID(),
    otherRoomId: randomUUID(),
    kidId: randomUUID(),
    otherKidId: randomUUID(),
    parentKidId: randomUUID(),
    postId: randomUUID(),
    mediaId: randomUUID(),
    replacementMediaId: randomUUID(),
  };
}

function createPostRecord(
  ids: ReturnType<typeof createIds>,
  overrides: Partial<{
    kidIds: string[];
    media: Array<{
      daycareId: string;
      id: string;
      publicId: string;
      assetId: string;
      resourceType: "image";
      deliveryType: "authenticated";
      format: "jpg";
      width: number;
      height: number;
      bytes: number;
      originalName: string;
      alt: string | null;
    }>;
    roomId: string | null;
  }> = {},
) {
  return {
    daycareId: ids.daycareId,
    id: ids.postId,
    type: "activity" as const,
    authorId: ids.staffId,
    createdAt: "2026-11-06T10:00:00.000Z",
    updatedAt: "2026-11-06T10:00:00.000Z",
    body: "Remote Staff persistence test",
    kidIds: overrides.kidIds ?? [ids.kidId],
    roomId: overrides.roomId ?? null,
    media: overrides.media ?? [
      {
        daycareId: ids.daycareId,
        id: ids.mediaId,
        publicId: "remote/staff/media",
        assetId: "remote-staff-asset",
        resourceType: "image" as const,
        deliveryType: "authenticated" as const,
        format: "jpg" as const,
        width: 640,
        height: 480,
        bytes: 1024,
        originalName: "remote.jpg",
        alt: null,
      },
    ],
  };
}

/**
 * Runs opt-in remote Staff/Post persistence checks.
 *
 * Every write runs inside withRemoteDbTestTransaction. The helper requires
 * RUN_REMOTE_DB_TESTS=true and rolls back the outer transaction on success.
 */
export async function runRemoteStaffPersistenceTests(): Promise<void> {
  const ids = createIds();

  await withRemoteDbTestTransaction(async (client) => {
    const currentDaycare = {
      getCurrentDaycareId: async () => ids.daycareId,
    };
    const rooms = new PostgresRoomRepository(client);
    const kids = new PostgresKidRepository(client);
    const parentKids = new PostgresParentKidRepository(client);
    const personRoles = new PostgresPersonRoleRepository(client);
    const staffShell = new PostgresStaffShellRepository(client);
    const access = new PostgresPostAccessRepository(client, currentDaycare);
    const posts = new PostgresPostRepository(client, currentDaycare, access);

    await client`
      INSERT INTO daycares (id, name, brand_name)
      VALUES
        (${ids.daycareId}, 'Remote Staff Test', 'Staff Brand'),
        (${ids.otherDaycareId}, 'Remote Staff Other Tenant', 'Other Brand')
    `;
    await client`
      INSERT INTO people (id, daycare_id, name, email, job_title, status)
      VALUES
        (${ids.staffId}, ${ids.daycareId}, 'Remote Staff', 'staff-remote@example.test', 'Teacher', 'active'),
        (${ids.parentId}, ${ids.daycareId}, 'Remote Parent', 'parent-remote@example.test', null, 'active')
    `;
    await client`
      INSERT INTO people_roles (daycare_id, person_id, role_id)
      SELECT ${ids.daycareId}, ${ids.staffId}, id
      FROM roles
      WHERE code IN ('personal', 'teacher')
    `;
    await client`
      INSERT INTO people_roles (daycare_id, person_id, role_id)
      SELECT ${ids.daycareId}, ${ids.parentId}, id
      FROM roles
      WHERE code = 'parent'
    `;
    await rooms.create({ daycareId: ids.daycareId, id: ids.roomId, name: "Remote Room" });
    await rooms.create({
      daycareId: ids.daycareId,
      id: ids.secondRoomId,
      name: "Remote Second Room",
    });
    await rooms.create({
      daycareId: ids.otherDaycareId,
      id: ids.otherRoomId,
      name: "Other Tenant Room",
    });
    await kids.create({
      daycareId: ids.daycareId,
      id: ids.kidId,
      slug: `remote-${ids.kidId}`,
      name: "Remote Kid",
      birthDate: "2020-01-01",
      roomId: ids.roomId,
      enrollmentDate: "2026-01-01",
      medicalNotes: "",
      allergies: "",
      status: "active",
    });
    await kids.create({
      daycareId: ids.otherDaycareId,
      id: ids.otherKidId,
      slug: `other-${ids.otherKidId}`,
      name: "Other Tenant Kid",
      birthDate: "2020-01-01",
      roomId: ids.otherRoomId,
      enrollmentDate: "2026-01-01",
      medicalNotes: "",
      allergies: "",
      status: "active",
    });
    await client`
      INSERT INTO staff_rooms (daycare_id, person_id, room_id)
      VALUES
        (${ids.daycareId}, ${ids.staffId}, ${ids.roomId}),
        (${ids.daycareId}, ${ids.staffId}, ${ids.secondRoomId})
    `;

    assert.deepEqual(await kids.findAll(ids.daycareId), []);
    assert.deepEqual(await posts.findAll(), []);
    assert.deepEqual(
      await staffShell.findByPerson(ids.daycareId, ids.staffId),
      {
        brandName: "Staff Brand",
        personName: "Remote Staff",
        jobTitle: "Teacher",
        roomNames: ["Remote Room", "Remote Second Room"],
      },
    );
    await parentKids.create({
      daycareId: ids.daycareId,
      id: ids.parentKidId,
      parentId: ids.parentId,
      kidId: ids.kidId,
      relationship: "guardian",
      photoSharingConsent: true,
    });

    assert.deepEqual(await access.findStaffRoomIds(ids.staffId), [ids.roomId, ids.secondRoomId]);
    assert.deepEqual(await personRoles.findRoles(ids.staffId, ids.daycareId), ["personal", "teacher"]);
    assert.deepEqual(await personRoles.findRoles(ids.staffId, ids.otherDaycareId), []);
    assert.deepEqual(await personRoles.findRoles(ids.parentId, ids.daycareId), ["parent"]);
    assert.deepEqual(await parentKids.findByKidId(ids.daycareId, ids.kidId).then((rows) => rows.map((row) => row.id)), [ids.parentKidId]);
    assert.equal(await kids.findById(ids.daycareId, ids.otherKidId), null);
    assert.equal(await rooms.findById(ids.daycareId, ids.otherRoomId), null);

    const created = await posts.create(createPostRecord(ids));
    assert.equal(created.id, ids.postId);
    const stored = await posts.findById(ids.postId);
    assert.deepEqual(stored?.kidIds, [ids.kidId]);
    assert.deepEqual(stored?.media.map((media) => media.id), [ids.mediaId]);

    const updated = await posts.update(
      createPostRecord(ids, {
        kidIds: [],
        roomId: ids.roomId,
        media: [
          {
            ...createPostRecord(ids).media[0],
            id: ids.replacementMediaId,
            publicId: "remote/staff/replacement",
          },
          createPostRecord(ids).media[0],
        ],
      }),
    );
    assert.equal(updated?.id, ids.postId);
    assert.deepEqual((await posts.findById(ids.postId))?.kidIds, []);
    assert.deepEqual(
      (await posts.findById(ids.postId))?.media.map((media) => media.id),
      [ids.replacementMediaId, ids.mediaId],
    );

    const invalidTarget = createPostRecord(ids, {
      kidIds: [ids.otherKidId],
      roomId: null,
    });
    const invalidTargetPostId = randomUUID();
    await assert.rejects(
      () => posts.create({ ...invalidTarget, id: invalidTargetPostId }),
      /does not have access to every destination kid/,
    );

    const duplicateMedia = createPostRecord(ids, {
      media: [createPostRecord(ids).media[0], createPostRecord(ids).media[0]],
    });
    const duplicateMediaPostId = randomUUID();
    await assert.rejects(
      () => posts.create({ ...duplicateMedia, id: duplicateMediaPostId }),
    );
    const remainingRows = await client<{ count: string }[]>`
      SELECT count(*)::text AS count
      FROM feed
      WHERE id IN (${invalidTargetPostId}, ${duplicateMediaPostId})
    `;
    assert.equal(remainingRows[0]?.count, "0");
  });

  const verificationClient = new PostgresClientProvider().createClient();
  try {
    const rows = await verificationClient<{ count: string }[]>`
      SELECT count(*)::text AS count
      FROM feed
      WHERE id = ${ids.postId}
    `;
    assert.equal(rows[0]?.count, "0");
  } finally {
    await verificationClient.end({ timeout: 5 });
  }
}
