import { expect, test } from "@playwright/test";

const DAYCARE_ID = process.env.E2E_LOGIN_ABUSE_DAYCARE_ID;

test.describe("credential login abuse protection", () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.skip(
      !DAYCARE_ID,
      "Set E2E_LOGIN_ABUSE_DAYCARE_ID to run login abuse scenarios.",
    );
  });

  test("keeps invalid and blocked login responses generic", async ({ page }) => {
    const email = `login-abuse-${Date.now()}@example.test`;
    await page.goto(`/auth/login?daycareId=${DAYCARE_ID}`);

    const submitInvalidLogin = async () => {
      await page.getByLabel("EMAIL").fill(email);
      await page.getByLabel("CONTRASEÑA").fill("invalid-password");
      await page.getByRole("button", { name: "Iniciar sesión" }).click();
      await expect(page.getByRole("alert")).toHaveText(
        "El email o la contraseña no son válidos.",
      );
    };

    await submitInvalidLogin();
    const firstMessage = await page.getByRole("alert").textContent();

    for (let attempt = 1; attempt < 5; attempt += 1) {
      await submitInvalidLogin();
    }

    await submitInvalidLogin();
    await expect(page.getByRole("alert")).toHaveText(firstMessage ?? "");
  });

  test("rejects an overlong UTF-8 password without truncating it", async ({ page }) => {
    await page.goto(`/auth/login?daycareId=${DAYCARE_ID}`);
    await page.getByLabel("EMAIL").fill(`long-password-${Date.now()}@example.test`);
    await page.getByLabel("CONTRASEÑA").fill("😀".repeat(19));
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByRole("alert")).toHaveText(
      "El email o la contraseña no son válidos.",
    );
  });
});
