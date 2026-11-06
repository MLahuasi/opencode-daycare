import "server-only";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PostAuthorizationPolicy } from "@/application/post";
import { deleteComment, getPostDetail, updateComment } from "@/application/post";
import { getFamilyFeedProjection } from "@/application/family/feed";
import { createPostgresFamilyFeedComposition } from "@/composition/family/family-feed-composition-postgres";
import { createPostgresPostComposition } from "@/composition/post/postgres-composition";
import { PostgresKidRepository } from "../repositories/kid-repository";
import { PostgresParentKidRepository } from "../repositories/parent-kid-repository";
import { PostgresPostCommentRepository } from "../repositories/post-comment-repository";
import { PostgresPostReactionRepository } from "../repositories/post-reaction-repository";
import { PostgresPostAccessRepository } from "../repositories/post-access-repository";
import { PostgresPostRepository } from "../repositories/post-repository";
import { PostgresRoomRepository } from "../repositories/room-repository";
import { withRemoteDbTestTransaction } from "./remote-db-test-context";

function createIds() {
  return {
    daycareId: randomUUID(),
    otherDaycareId: randomUUID(),
    staffId: randomUUID(),
    parentId: randomUUID(),
    otherParentId: randomUUID(),
    otherStaffId: randomUUID(),
    roomId: randomUUID(),
    kidId: randomUUID(),
    postId: randomUUID(),
    otherPostId: randomUUID(),
    commentId: randomUUID(),
    reactionId: randomUUID(),
  };
}

/**
 * Runs opt-in PostgreSQL checks for the General Family Feed.
 *
 * The complete scenario runs in one transaction and is always rolled back.
 * It covers tenant filtering, authorized Staff/parent visibility, Post detail
 * relations, and the comment/reaction PostgreSQL adapters.
 */
export async function runRemoteGeneralPersistenceTests(): Promise<void> {
  const ids = createIds();

  await withRemoteDbTestTransaction(async (client) => {
    const currentDaycare = {
      getCurrentDaycareId: async () => ids.daycareId,
    };
    const rooms = new PostgresRoomRepository(client);
    const kids = new PostgresKidRepository(client);
    const parentKids = new PostgresParentKidRepository(client);
    const access = new PostgresPostAccessRepository(client, currentDaycare);
    const posts = new PostgresPostRepository(client, currentDaycare, access);
    const comments = new PostgresPostCommentRepository(client, currentDaycare);
    const reactions = new PostgresPostReactionRepository(client, currentDaycare);
    const authorization = new PostAuthorizationPolicy(access);

    await client`
      INSERT INTO daycares (id, name, brand_name)
      VALUES
        (${ids.daycareId}, 'Remote General Test', 'General Brand'),
        (${ids.otherDaycareId}, 'Remote General Other Tenant', 'Other Brand')
    `;
    await client`
      INSERT INTO people (id, daycare_id, name, email, job_title, status)
      VALUES
        (${ids.staffId}, ${ids.daycareId}, 'General Staff', 'general-staff@example.test', 'Teacher', 'active'),
        (${ids.parentId}, ${ids.daycareId}, 'General Parent', 'general-parent@example.test', null, 'active'),
        (${ids.otherParentId}, ${ids.daycareId}, 'Other General Parent', 'other-general-parent@example.test', null, 'active'),
        (${ids.otherStaffId}, ${ids.otherDaycareId}, 'Other Staff', 'other-staff@example.test', 'Teacher', 'active')
    `;
    await client`
      INSERT INTO people_roles (daycare_id, person_id, role_id)
      SELECT ${ids.daycareId}, ${ids.staffId}, id
      FROM roles
      WHERE code IN ('personal', 'teacher')
    `;
    await client`
      INSERT INTO people_roles (daycare_id, person_id, role_id)
      SELECT ${ids.daycareId}, person_id, id
      FROM (VALUES (${ids.parentId}), (${ids.otherParentId})) AS parents(person_id)
      CROSS JOIN roles
      WHERE roles.code = 'parent'
    `;
    await client`
      INSERT INTO people_roles (daycare_id, person_id, role_id)
      SELECT ${ids.otherDaycareId}, ${ids.otherStaffId}, id
      FROM roles
      WHERE code IN ('personal', 'teacher')
    `;
    await rooms.create({ daycareId: ids.daycareId, id: ids.roomId, name: 'General Room' });
    await client`
      INSERT INTO staff_rooms (daycare_id, person_id, room_id)
      VALUES (${ids.daycareId}, ${ids.staffId}, ${ids.roomId})
    `;
    await kids.create({
      daycareId: ids.daycareId,
      id: ids.kidId,
      slug: `general-${ids.kidId}`,
      name: 'General Kid',
      birthDate: '2020-01-01',
      roomId: ids.roomId,
      enrollmentDate: '2026-01-01',
      medicalNotes: '',
      allergies: '',
      status: 'active',
    });
    await parentKids.create({
      daycareId: ids.daycareId,
      id: randomUUID(),
      parentId: ids.parentId,
      kidId: ids.kidId,
      relationship: 'guardian',
      photoSharingConsent: true,
    });
    await parentKids.create({
      daycareId: ids.daycareId,
      id: randomUUID(),
      parentId: ids.otherParentId,
      kidId: ids.kidId,
      relationship: 'guardian',
      photoSharingConsent: true,
    });

    const post = await posts.create({
      daycareId: ids.daycareId,
      id: ids.postId,
      type: 'activity',
      authorId: ids.staffId,
      createdAt: '2026-11-06T10:00:00.000Z',
      updatedAt: '2026-11-06T10:00:00.000Z',
      body: 'General feed test',
      media: [],
      kidIds: [ids.kidId],
      roomId: null,
    });
    await client`
      INSERT INTO feed (id, daycare_id, type, author_id, body, created_at, updated_at)
      VALUES (${ids.otherPostId}, ${ids.otherDaycareId}, 'activity', ${ids.otherStaffId}, 'Other tenant post', now(), now())
    `;

    await comments.create({
      daycareId: ids.daycareId,
      id: ids.commentId,
      postId: ids.postId,
      authorId: ids.parentId,
      body: 'Remote comment',
      createdAt: '2026-11-06T10:01:00.000Z',
      updatedAt: null,
    });
    await reactions.create({
      daycareId: ids.daycareId,
      id: ids.reactionId,
      postId: ids.postId,
      personId: ids.parentId,
      type: 'love',
      createdAt: '2026-11-06T10:02:00.000Z',
    });
    await assert.rejects(
      () =>
        reactions.create({
          daycareId: ids.daycareId,
          id: randomUUID(),
          postId: ids.postId,
          personId: ids.parentId,
          type: 'love',
          createdAt: '2026-11-06T10:02:01.000Z',
        }),
      /Reaction identity already exists/,
    );

    assert.deepEqual((await posts.findAll()).map((item) => item.id), [ids.postId]);
    assert.equal(await authorization.canView(
      { daycareId: ids.daycareId, personId: ids.parentId, roles: ['parent'] },
      post,
    ), true);
    assert.equal(await authorization.canView(
      { daycareId: ids.daycareId, personId: ids.staffId, roles: ['personal', 'teacher'] },
      post,
    ), true);
    assert.equal(await authorization.canView(
      { daycareId: ids.daycareId, personId: ids.parentId, roles: ['parent'] },
      { ...post, daycareId: ids.otherDaycareId, id: ids.otherPostId },
    ), false);

    assert.equal((await comments.findByPostId(ids.postId)).length, 1);
    assert.equal((await comments.findByPostIds([ids.postId, ids.otherPostId])).length, 1);
    assert.equal((await comments.findById(ids.commentId))?.updatedAt, null);
    assert.equal((await reactions.findByPostId(ids.postId)).length, 1);
    assert.equal((await reactions.findByPostIds([ids.postId, ids.otherPostId])).length, 1);

    const dependencies = createPostgresPostComposition(client, currentDaycare);
    const otherParentViewer = {
      daycareId: ids.daycareId,
      personId: ids.otherParentId,
      roles: ['parent'] as const,
    };
    assert.equal(
      await updateComment(
        dependencies,
        {
          authorId: ids.otherParentId,
          body: 'Unauthorized update',
          commentId: ids.commentId,
        },
        otherParentViewer,
      ),
      null,
    );
    assert.equal(
      await deleteComment(dependencies, ids.commentId, otherParentViewer),
      false,
    );

    const detailWithEngagement = await getPostDetail(
      dependencies,
      ids.postId,
      { daycareId: ids.daycareId, personId: ids.parentId, roles: ['parent'] },
    );
    assert.equal(detailWithEngagement?.post.engagement.commentCount, 1);
    assert.equal(detailWithEngagement?.post.engagement.reactionCount, 1);

    await reactions.delete(ids.reactionId);
    const toggleReaction = {
      daycareId: ids.daycareId,
      id: randomUUID(),
      postId: ids.postId,
      personId: ids.parentId,
      type: 'love' as const,
      createdAt: '2026-11-06T10:02:30.000Z',
    };
    const toggleResults = await Promise.all([
      reactions.toggle(toggleReaction),
      reactions.toggle({ ...toggleReaction, id: randomUUID() }),
    ]);
    assert.equal(toggleResults.filter(Boolean).length, 1);
    assert.equal((await reactions.findByPostId(ids.postId)).length, 0);

    const familyFeed = await getFamilyFeedProjection(
      createPostgresFamilyFeedComposition(client, currentDaycare),
      ids.parentId,
    );
    assert.deepEqual(familyFeed.posts.map((item) => item.id), [ids.postId]);

    const detail = await getPostDetail(
      dependencies,
      ids.postId,
      { daycareId: ids.daycareId, personId: ids.parentId, roles: ['parent'] },
    );
    assert.equal(detail?.post.id, ids.postId);
    assert.equal(detail?.comments.length, 1);
    assert.equal(detail?.reactions.length, 0);

    const updated = await comments.update({
      daycareId: ids.daycareId,
      id: ids.commentId,
      postId: ids.postId,
      authorId: ids.parentId,
      body: 'Updated remote comment',
      createdAt: '2026-11-06T10:01:00.000Z',
      updatedAt: '2026-11-06T10:03:00.000Z',
    });
    assert.equal(updated?.body, 'Updated remote comment');
    assert.equal(await comments.delete(ids.commentId), true);
    assert.equal((await reactions.findByPostId(ids.postId)).length, 0);
  });
}
