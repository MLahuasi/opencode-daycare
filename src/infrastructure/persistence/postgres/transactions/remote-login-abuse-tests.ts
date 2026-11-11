import "server-only";

import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { LOGIN_RATE_LIMITS } from "@/config/server";
import type { PostgresQueryClient } from "../client/postgres-client";
import { PostgresLoginAttemptLimitRepository } from "../repositories/login-attempt-limit-repository";
import { withRemoteDbTestTransaction } from "./remote-db-test-context";

const TEST_HMAC_SECRET = "remote-login-abuse-test-secret";

function hashKey(purpose: "account" | "ip", identifier: string): Buffer {
  return createHmac("sha256", TEST_HMAC_SECRET)
    .update(`${purpose}:${identifier}`, "utf8")
    .digest();
}

/**
 * Runs opt-in transactional checks for the persistent login abuse counters.
 *
 * The complete scenario is rolled back. Short SQL windows are used only for
 * expiry assertions so the test never waits fifteen minutes.
 */
export async function runRemoteLoginAbusePersistenceTests(): Promise<void> {
  const unavailableClient = ((() =>
    Promise.reject(new Error("database unavailable"))) as unknown) as PostgresQueryClient;
  await assert.rejects(
    new PostgresLoginAttemptLimitRepository(
      unavailableClient,
      TEST_HMAC_SECRET,
    ).isBlocked("account", "fail-closed@example.test"),
    /database unavailable/,
  );

  await withRemoteDbTestTransaction(async (client) => {
    const limits = new PostgresLoginAttemptLimitRepository(
      client,
      TEST_HMAC_SECRET,
    );
    const account = `login-abuse-${randomUUID()}@example.test`;

    for (let failure = 1; failure <= LOGIN_RATE_LIMITS.accountFailureLimit; failure += 1) {
      const result = await limits.recordFailure("account", account);
      assert.equal(result.failureCount, failure);
      assert.equal(
        result.blockedUntil !== null,
        failure === LOGIN_RATE_LIMITS.accountFailureLimit,
      );
    }
    assert.equal(await limits.isBlocked("account", account), true);

    const blockedResult = await limits.recordFailure("account", account);
    assert.equal(blockedResult.failureCount, LOGIN_RATE_LIMITS.accountFailureLimit);

    await limits.clearAccount(account);
    assert.equal(await limits.isBlocked("account", account), false);

    const concurrentIp = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
    const concurrentResults = await Promise.all(
      Array.from({ length: LOGIN_RATE_LIMITS.ipFailureLimit }, () =>
        limits.recordFailure("ip", concurrentIp),
      ),
    );
    assert.deepEqual(
      concurrentResults.map((result) => result.failureCount).sort((a, b) => a - b),
      Array.from({ length: LOGIN_RATE_LIMITS.ipFailureLimit }, (_, index) => index + 1),
    );
    assert.equal(await limits.isBlocked("ip", concurrentIp), true);

    const expiringKey = hashKey("account", `expiry-${randomUUID()}`);
    const firstExpiryResult = await client<{ failure_count: number; blocked_until: string | null }[]>`
      SELECT failure_count, blocked_until
      FROM private.record_login_failure(${expiringKey}, 2, 1, 1)
    `;
    assert.equal(firstExpiryResult[0]?.failure_count, 1);
    assert.equal(firstExpiryResult[0]?.blocked_until, null);

    await client`SELECT pg_sleep(1.1)`;
    const resetAfterExpiry = await client<{ failure_count: number; blocked_until: string | null }[]>`
      SELECT failure_count, blocked_until
      FROM private.record_login_failure(${expiringKey}, 2, 1, 1)
    `;
    assert.equal(resetAfterExpiry[0]?.failure_count, 1);
    assert.equal(resetAfterExpiry[0]?.blocked_until, null);

    const blockingKey = hashKey("account", `blocking-${randomUUID()}`);
    await client`
      SELECT private.record_login_failure(${blockingKey}, 1, 1, 1)
    `;
    assert.equal(
      (await client<{ blocked: boolean }[]>`
        SELECT private.is_login_attempt_blocked(${blockingKey}) AS blocked
      `)[0]?.blocked,
      true,
    );
    await client`SELECT pg_sleep(1.1)`;
    assert.equal(
      (await client<{ blocked: boolean }[]>`
        SELECT private.is_login_attempt_blocked(${blockingKey}) AS blocked
      `)[0]?.blocked,
      false,
    );

    const storedHashes = await client<{ key_hash: Buffer }[]>`
      SELECT key_hash
      FROM private.login_attempt_limits
      WHERE key_hash = ${hashKey("ip", concurrentIp)}
    `;
    assert.equal(storedHashes.length, 1);
    for (const row of storedHashes) {
      assert.equal(row.key_hash.length, 32);
    }
  });
}
