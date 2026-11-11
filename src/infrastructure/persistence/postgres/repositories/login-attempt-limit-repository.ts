import "server-only";

import { createHmac } from "node:crypto";
import { LOGIN_RATE_LIMITS } from "@/config/server";
import type { PostgresQueryClient } from "../client/postgres-client";

type LoginLimitPurpose = "account" | "ip";

type LoginFailureRow = {
  failure_count: number;
  blocked_until: string | null;
};

/** Result of recording a failed login attempt. */
export type LoginAttemptFailureResult = {
  failureCount: number;
  blockedUntil: string | null;
};

/** PostgreSQL adapter for HMAC-keyed login abuse counters. */
export class PostgresLoginAttemptLimitRepository {
  public constructor(
    private readonly client: PostgresQueryClient,
    private readonly hmacSecret: string,
  ) {}

  /**
   * Checks whether an account or IP key is currently blocked.
   *
   * @param purpose - Key namespace used for the account or IP counter.
   * @param identifier - Normalized account identifier or sanitized IP.
   * @returns Whether the key is blocked.
   */
  async isBlocked(
    purpose: LoginLimitPurpose,
    identifier: string,
  ): Promise<boolean> {
    const keyHash = this.createKeyHash(purpose, identifier);
    const rows = await this.client<{ blocked: boolean }[]>`
      SELECT private.is_login_attempt_blocked(${keyHash}) AS blocked
    `;

    return rows[0]?.blocked === true;
  }

  /**
   * Records one failed login attempt atomically.
   *
   * @param purpose - Key namespace used for the account or IP counter.
   * @param identifier - Normalized account identifier or sanitized IP.
   * @returns The resulting failure count and block timestamp.
   */
  async recordFailure(
    purpose: LoginLimitPurpose,
    identifier: string,
  ): Promise<LoginAttemptFailureResult> {
    const keyHash = this.createKeyHash(purpose, identifier);
    const failureLimit =
      purpose === "account"
        ? LOGIN_RATE_LIMITS.accountFailureLimit
        : LOGIN_RATE_LIMITS.ipFailureLimit;
    const rows = await this.client<LoginFailureRow[]>`
      SELECT failure_count, blocked_until
      FROM private.record_login_failure(
        ${keyHash},
        ${failureLimit},
        ${LOGIN_RATE_LIMITS.windowSeconds},
        ${LOGIN_RATE_LIMITS.blockSeconds}
      )
    `;
    const row = rows[0];

    if (!row) {
      throw new Error("Login failure counter did not return a result.");
    }

    return {
      failureCount: row.failure_count,
      blockedUntil: row.blocked_until,
    };
  }

  /**
   * Removes the account counter after a successful login.
   *
   * @param identifier - Normalized account identifier.
   */
  async clearAccount(identifier: string): Promise<void> {
    const keyHash = this.createKeyHash("account", identifier);
    await this.client`
      SELECT private.clear_login_attempt_limit(${keyHash})
    `;
  }

  private createKeyHash(
    purpose: LoginLimitPurpose,
    identifier: string,
  ): Buffer {
    return createHmac("sha256", this.hmacSecret)
      .update(`${purpose}:${identifier}`, "utf8")
      .digest();
  }
}
