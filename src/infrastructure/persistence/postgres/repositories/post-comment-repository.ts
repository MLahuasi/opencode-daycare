import "server-only";

import type { PostCommentRepository as PostCommentRepositoryPort } from "@/application/post/ports";
import type { CurrentDaycareReader } from "@/application/daycare/ports";
import type { PostComment } from "@/domain/post";
import type { PostgresQueryClient } from "../client/postgres-client";
import { mapFeedCommentRow } from "../mappers";
import type { Tables } from "../types";

/** PostgreSQL persistence adapter for daycare-scoped Post comments. */
export class PostgresPostCommentRepository
  implements PostCommentRepositoryPort
{
  public constructor(
    private readonly client: PostgresQueryClient,
    private readonly currentDaycare: CurrentDaycareReader,
  ) {}

  /** Lists comments belonging to the current daycare. */
  async findAll(): Promise<readonly PostComment[]> {
    const daycareId = await this.currentDaycare.getCurrentDaycareId();
    const rows = await this.client<Tables<"feed_comments">[]>`
      SELECT daycare_id, id, feed_id, author_id, body,
             created_at, updated_at
      FROM feed_comments
      WHERE daycare_id = ${daycareId}
      ORDER BY created_at, id
    `;

    return rows.map(mapFeedCommentRow);
  }

  /** Lists comments for one Post within the current daycare. */
  async findByPostId(postId: string): Promise<readonly PostComment[]> {
    return this.findByPostIds([postId]);
  }

  /** Lists comments for a set of Posts within the current daycare. */
  async findByPostIds(postIds: readonly string[]): Promise<readonly PostComment[]> {
    if (postIds.length === 0) return [];

    const daycareId = await this.currentDaycare.getCurrentDaycareId();
    const rows = await this.client<Tables<"feed_comments">[]>`
      SELECT daycare_id, id, feed_id, author_id, body,
             created_at, updated_at
      FROM feed_comments
      WHERE daycare_id = ${daycareId}
        AND feed_id IN ${this.client(postIds)}
      ORDER BY feed_id, created_at, id
    `;

    return rows.map(mapFeedCommentRow);
  }

  /** Finds a comment only when it belongs to the current daycare. */
  async findById(id: string): Promise<PostComment | null> {
    const daycareId = await this.currentDaycare.getCurrentDaycareId();
    const rows = await this.client<Tables<"feed_comments">[]>`
      SELECT daycare_id, id, feed_id, author_id, body,
             created_at, updated_at
      FROM feed_comments
      WHERE daycare_id = ${daycareId}
        AND id = ${id}
      LIMIT 1
    `;

    return rows[0] ? mapFeedCommentRow(rows[0]) : null;
  }

  /** Inserts a comment after confirming its tenant is the current daycare. */
  async create(comment: PostComment): Promise<void> {
    await this.assertCurrentDaycare(comment.daycareId);

    await this.client`
      INSERT INTO feed_comments (
        daycare_id, id, feed_id, author_id, body, created_at, updated_at
      )
      VALUES (
        ${comment.daycareId}, ${comment.id}, ${comment.postId},
        ${comment.authorId}, ${comment.body}, ${comment.createdAt},
        ${comment.updatedAt}
      )
    `;
  }

  /** Updates a comment only inside its current daycare. */
  async update(comment: PostComment): Promise<PostComment | null> {
    await this.assertCurrentDaycare(comment.daycareId);

    const rows = await this.client<Tables<"feed_comments">[]>`
      UPDATE feed_comments
      SET body = ${comment.body},
          updated_at = ${comment.updatedAt}
      WHERE daycare_id = ${comment.daycareId}
        AND id = ${comment.id}
      RETURNING daycare_id, id, feed_id, author_id, body,
                created_at, updated_at
    `;

    return rows[0] ? mapFeedCommentRow(rows[0]) : null;
  }

  /** Deletes a comment only inside the current daycare. */
  async delete(id: string): Promise<boolean> {
    const daycareId = await this.currentDaycare.getCurrentDaycareId();
    const rows = await this.client<{ id: string }[]>`
      DELETE FROM feed_comments
      WHERE daycare_id = ${daycareId}
        AND id = ${id}
      RETURNING id
    `;

    return rows.length > 0;
  }

  private async assertCurrentDaycare(daycareId: string): Promise<void> {
    const currentDaycareId = await this.currentDaycare.getCurrentDaycareId();
    if (currentDaycareId !== daycareId) {
      throw new Error("Comment daycare does not match the current daycare");
    }
  }
}
