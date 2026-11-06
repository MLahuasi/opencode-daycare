import "server-only";

import type { CurrentDaycareReader } from "@/application/daycare/ports";
import type { PostReactionRepository as PostReactionRepositoryPort } from "@/application/post/ports";
import type { PostReaction } from "@/domain/post";
import type { PostgresQueryClient } from "../client/postgres-client";
import { mapFeedReactionRow } from "../mappers";
import type { Tables } from "../types";

/** PostgreSQL persistence adapter for daycare-scoped Post reactions. */
export class PostgresPostReactionRepository
  implements PostReactionRepositoryPort
{
  public constructor(
    private readonly client: PostgresQueryClient,
    private readonly currentDaycare: CurrentDaycareReader,
  ) {}

  /** Lists reactions belonging to the current daycare. */
  async findAll(): Promise<readonly PostReaction[]> {
    const daycareId = await this.currentDaycare.getCurrentDaycareId();
    const rows = await this.client<Tables<"feed_reactions">[]>`
      SELECT daycare_id, id, feed_id, person_id, type,
             created_at, updated_at
      FROM feed_reactions
      WHERE daycare_id = ${daycareId}
      ORDER BY created_at, id
    `;

    return rows.map(mapFeedReactionRow);
  }

  /** Lists reactions for one Post within the current daycare. */
  async findByPostId(postId: string): Promise<readonly PostReaction[]> {
    return this.findByPostIds([postId]);
  }

  /** Lists reactions for a set of Posts within the current daycare. */
  async findByPostIds(postIds: readonly string[]): Promise<readonly PostReaction[]> {
    if (postIds.length === 0) return [];

    const daycareId = await this.currentDaycare.getCurrentDaycareId();
    const rows = await this.client<Tables<"feed_reactions">[]>`
      SELECT daycare_id, id, feed_id, person_id, type,
             created_at, updated_at
      FROM feed_reactions
      WHERE daycare_id = ${daycareId}
        AND feed_id IN ${this.client(postIds)}
      ORDER BY feed_id, created_at, id
    `;

    return rows.map(mapFeedReactionRow);
  }

  /** Inserts a reaction after confirming its tenant is the current daycare. */
  async create(reaction: PostReaction): Promise<void> {
    await this.assertCurrentDaycare(reaction.daycareId);
    await this.assertAggregateOwnership(
      reaction.daycareId,
      reaction.postId,
      reaction.personId,
    );

    await this.client`
      INSERT INTO feed_reactions (
        daycare_id, id, feed_id, person_id, type, created_at
      )
      VALUES (
        ${reaction.daycareId}, ${reaction.id}, ${reaction.postId},
        ${reaction.personId}, ${reaction.type}, ${reaction.createdAt}
      )
    `;
  }

  /** Atomically toggles the tenant-scoped reaction identity. */
  async toggle(reaction: PostReaction): Promise<boolean> {
    await this.assertCurrentDaycare(reaction.daycareId);
    await this.assertAggregateOwnership(
      reaction.daycareId,
      reaction.postId,
      reaction.personId,
    );
    return this.client.begin(async (transaction) => {
      await transaction`LOCK TABLE feed_reactions IN SHARE ROW EXCLUSIVE MODE`;
      await transaction`
        SELECT pg_advisory_xact_lock(hashtextextended(
          ${`${reaction.daycareId}:${reaction.postId}:${reaction.personId}:${reaction.type}`},
          0
        ))
      `;
      const existing = await transaction<{ id: string }[]>`
        SELECT id
        FROM feed_reactions
        WHERE daycare_id = ${reaction.daycareId}
          AND feed_id = ${reaction.postId}
          AND person_id = ${reaction.personId}
          AND type = ${reaction.type}
        LIMIT 1
        FOR UPDATE
      `;
      if (existing[0]) {
        await transaction`
          DELETE FROM feed_reactions
          WHERE daycare_id = ${reaction.daycareId}
            AND id = ${existing[0].id}
        `;
        return false;
      }
      await transaction`
        INSERT INTO feed_reactions (
          daycare_id, id, feed_id, person_id, type, created_at
        )
        VALUES (
          ${reaction.daycareId}, ${reaction.id}, ${reaction.postId},
          ${reaction.personId}, ${reaction.type}, ${reaction.createdAt}
        )
      `;
      return true;
    });
  }

  /** Deletes a reaction only inside the current daycare. */
  async delete(id: string): Promise<boolean> {
    const daycareId = await this.currentDaycare.getCurrentDaycareId();
    const rows = await this.client<{ id: string }[]>`
      DELETE FROM feed_reactions
      WHERE daycare_id = ${daycareId}
        AND id = ${id}
      RETURNING id
    `;

    return rows.length > 0;
  }

  private async assertCurrentDaycare(daycareId: string): Promise<void> {
    const currentDaycareId = await this.currentDaycare.getCurrentDaycareId();
    if (currentDaycareId !== daycareId) {
      throw new Error("Reaction daycare does not match the current daycare");
    }
  }

  private async assertAggregateOwnership(
    daycareId: string,
    postId: string,
    personId: string,
  ): Promise<void> {
    const rows = await this.client<{ id: string }[]>`
      SELECT feed.id
      FROM feed
      INNER JOIN people
        ON people.daycare_id = feed.daycare_id
       AND people.id = ${personId}
      WHERE feed.daycare_id = ${daycareId}
        AND feed.id = ${postId}
      LIMIT 1
    `;
    if (!rows[0]) {
      throw new Error("Reaction aggregate does not belong to the current daycare");
    }
  }
}
