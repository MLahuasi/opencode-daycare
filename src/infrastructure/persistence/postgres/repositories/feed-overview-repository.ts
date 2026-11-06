import "server-only";

import type { PostgresQueryClient } from "../client/postgres-client";
import type { Tables } from "../types";

export type FeedOverviewRecord = {
  roomLabel: string;
  greeting: string;
  attendance: string;
  date: string;
  composerPrompt: string;
  publishedTodayLabel: string;
};

/** PostgreSQL reader for the tenant-scoped Staff feed overview. */
export class PostgresFeedOverviewRepository {
  public constructor(private readonly client: PostgresQueryClient) {}

  async findAll(daycareId: string): Promise<readonly FeedOverviewRecord[]> {
    const rows = await this.client<Tables<"feed_overview">[]>`
      SELECT room_label, greeting, attendance, date, composer_prompt,
             published_today_label
      FROM feed_overview
      WHERE daycare_id = ${daycareId}
      ORDER BY date DESC
    `;

    return rows.map((row) => ({
      roomLabel: row.room_label,
      greeting: row.greeting,
      attendance: row.attendance,
      date: row.date,
      composerPrompt: row.composer_prompt,
      publishedTodayLabel: row.published_today_label,
    }));
  }
}
