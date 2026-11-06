import "server-only";

import type { CurrentDaycareReader } from "@/application/daycare/ports";
import type { PersistedPost, Post } from "@/domain/post";
import type {
  PostgresClient,
  PostgresQueryClient,
} from "../client/postgres-client";
import {
  mapFeedMediaRow,
  mapFeedRow,
} from "../mappers";
import type { Tables } from "../types";

const EMPTY_ENGAGEMENT = {
  reactionCount: 0,
  commentCount: 0,
  viewerHasLoved: false,
} as const;

type FeedKidRow = Pick<Tables<"feed_kids">, "feed_id" | "kid_id">;

/** PostgreSQL reader for the normalized Post aggregate. */
export class PostgresPostRepository {
  public constructor(
    private readonly client: PostgresClient,
    private readonly currentDaycare: CurrentDaycareReader,
  ) {}

  /** Reads all valid Posts and rebuilds their normalized destinations and media. */
  async findAll(): Promise<readonly PersistedPost[]> {
    const daycareId = await this.currentDaycare.getCurrentDaycareId();
    const feedRows = await this.client<Tables<"feed">[]>`
      SELECT f.author_id, f.body, f.created_at, f.daycare_id, f.id,
             f.room_id, f.type, f.updated_at
      FROM feed AS f
      WHERE f.daycare_id = ${daycareId}
        AND EXISTS (
          SELECT 1
          FROM people AS author
          WHERE author.daycare_id = f.daycare_id
            AND author.id = f.author_id
        )
        AND (
          f.room_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM rooms AS room
            WHERE room.daycare_id = f.daycare_id
              AND room.id = f.room_id
          )
        )
        AND NOT EXISTS (
          SELECT 1
          FROM feed_kids AS destination
          LEFT JOIN kids AS kid
            ON kid.daycare_id = destination.daycare_id
           AND kid.id = destination.kid_id
          WHERE destination.feed_id = f.id
            AND (
              destination.daycare_id <> f.daycare_id
              OR kid.id IS NULL
            )
        )
        AND NOT EXISTS (
          SELECT 1
          FROM feed_media AS media
          WHERE media.feed_id = f.id
            AND media.daycare_id <> f.daycare_id
        )
      ORDER BY f.created_at, f.id
    `;

    if (feedRows.length === 0) {
      return [];
    }

    const feedIds = feedRows.map((row) => row.id);
    const feedKidRows = await this.client<FeedKidRow[]>`
      SELECT feed_id, kid_id
      FROM feed_kids
      WHERE daycare_id = ${daycareId}
        AND feed_id IN ${this.client(feedIds)}
      ORDER BY feed_id, kid_id
    `;
    const mediaRows = await this.client<Tables<"feed_media">[]>`
      SELECT alt, asset_id, bytes, created_at, daycare_id, delivery_type,
             feed_id, format, height, id, original_name, position,
             public_id, resource_type, updated_at, width
      FROM feed_media
      WHERE daycare_id = ${daycareId}
        AND feed_id IN ${this.client(feedIds)}
      ORDER BY feed_id, position, id
    `;

    const kidIdsByFeed = new Map<string, string[]>();
    for (const row of feedKidRows) {
      const kidIds = kidIdsByFeed.get(row.feed_id) ?? [];
      kidIds.push(row.kid_id);
      kidIdsByFeed.set(row.feed_id, kidIds);
    }

    const mediaByFeed = new Map<string, ReturnType<typeof mapFeedMediaRow>[]>();
    for (const row of mediaRows) {
      const media = mediaByFeed.get(row.feed_id) ?? [];
      media.push(mapFeedMediaRow(row));
      mediaByFeed.set(row.feed_id, media);
    }

    return feedRows.map((row) =>
      mapFeedRow(row, {
        kidIds: kidIdsByFeed.get(row.id) ?? [],
        media: mediaByFeed.get(row.id) ?? [],
      }),
    );
  }

  /** Finds one valid Post in the current daycare. */
  async findById(id: string): Promise<PersistedPost | null> {
    const posts = await this.findAll();
    return posts.find((post) => post.id === id) ?? null;
  }

  /** Creates the Post aggregate and all normalized child rows atomically. */
  async create(post: PersistedPost): Promise<Post> {
    await this.assertCurrentDaycare(post.daycareId);

    await this.client.begin(async (transaction) => {
      await this.insertRoot(transaction, post);
      await this.insertDestinations(transaction, post);
      await this.insertMedia(transaction, post);
    });

    return this.project(post);
  }

  /** Replaces the Post aggregate and its destinations and media atomically. */
  async update(post: PersistedPost): Promise<Post | null> {
    await this.assertCurrentDaycare(post.daycareId);

    const updated = await this.client.begin(async (transaction) => {
      const rows = await transaction<{ id: string }[]>`
        UPDATE feed
        SET type = ${post.type},
            author_id = ${post.authorId},
            created_at = ${post.createdAt},
            updated_at = ${post.updatedAt},
            body = ${post.body},
            room_id = ${post.roomId}
        WHERE daycare_id = ${post.daycareId}
          AND id = ${post.id}
        RETURNING id
      `;

      if (!rows[0]) {
        return false;
      }

      await transaction`
        DELETE FROM feed_kids
        WHERE daycare_id = ${post.daycareId}
          AND feed_id = ${post.id}
      `;
      await transaction`
        DELETE FROM feed_media
        WHERE daycare_id = ${post.daycareId}
          AND feed_id = ${post.id}
      `;
      await this.insertDestinations(transaction, post);
      await this.insertMedia(transaction, post);

      return true;
    });

    return updated ? this.project(post) : null;
  }

  private async assertCurrentDaycare(daycareId: string): Promise<void> {
    const currentDaycareId = await this.currentDaycare.getCurrentDaycareId();
    if (currentDaycareId !== daycareId) {
      throw new Error("Post daycare does not match the current daycare");
    }
  }

  private async insertRoot(
    transaction: PostgresQueryClient,
    post: PersistedPost,
  ): Promise<void> {
    await transaction`
      INSERT INTO feed (
        daycare_id, id, type, author_id, created_at, updated_at, body, room_id
      )
      VALUES (
        ${post.daycareId}, ${post.id}, ${post.type}, ${post.authorId},
        ${post.createdAt}, ${post.updatedAt}, ${post.body}, ${post.roomId}
      )
    `;
  }

  private async insertDestinations(
    transaction: PostgresQueryClient,
    post: PersistedPost,
  ): Promise<void> {
    for (const kidId of post.kidIds) {
      await transaction`
        INSERT INTO feed_kids (daycare_id, feed_id, kid_id)
        VALUES (${post.daycareId}, ${post.id}, ${kidId})
      `;
    }
  }

  private async insertMedia(
    transaction: PostgresQueryClient,
    post: PersistedPost,
  ): Promise<void> {
    for (const [position, media] of post.media.entries()) {
      await transaction`
        INSERT INTO feed_media (
          daycare_id, feed_id, position, id, public_id, asset_id,
          resource_type, delivery_type, format, width, height, bytes,
          original_name, alt
        )
        VALUES (
          ${post.daycareId}, ${post.id}, ${position}, ${media.id},
          ${media.publicId}, ${media.assetId}, ${media.resourceType},
          ${media.deliveryType}, ${media.format}, ${media.width},
          ${media.height}, ${media.bytes}, ${media.originalName}, ${media.alt}
        )
      `;
    }
  }

  private project(post: PersistedPost): Post {
    return { ...post, engagement: { ...EMPTY_ENGAGEMENT } };
  }
}
