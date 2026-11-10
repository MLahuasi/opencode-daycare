import { expect, test, type Page } from "@playwright/test";

const DAYCARE_ID = process.env.E2E_DAYCARE_ID;
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD;

function pngBuffer(size: number): Buffer {
  const buffer = Buffer.alloc(size);
  buffer.set([
    0x89, 0x50, 0x4e, 0x47,
    0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x00,
  ]);
  return buffer;
}

async function signIn(page: Page) {
  if (!DAYCARE_ID || !STAFF_EMAIL || !STAFF_PASSWORD) {
    throw new Error(
      "Set E2E_DAYCARE_ID, E2E_STAFF_EMAIL and E2E_STAFF_PASSWORD to run authenticated tests.",
    );
  }

  await page.goto(`/auth/login?daycareId=${DAYCARE_ID}`);
  await page.getByLabel("EMAIL").fill(STAFF_EMAIL);
  await page.getByLabel("CONTRASEÑA").fill(STAFF_PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL("**/home");
}

test.describe("HTTP security boundary", () => {
  test("protects HTML navigation with a per-request CSP nonce", async ({ request }) => {
    const firstResponse = await request.get(`/auth/login?daycareId=${DAYCARE_ID ?? "00000000-0000-0000-0000-000000000000"}`);
    const secondResponse = await request.get(`/auth/login?daycareId=${DAYCARE_ID ?? "00000000-0000-0000-0000-000000000000"}`);
    const firstCsp = firstResponse.headers()["content-security-policy"];
    const secondCsp = secondResponse.headers()["content-security-policy"];

    expect(firstResponse.ok()).toBeTruthy();
    expect(firstCsp).toBeTruthy();
    expect(secondCsp).toBeTruthy();
    expect(firstCsp).toContain("script-src");
    expect(firstCsp).toContain("frame-ancestors 'none'");
    expect(firstCsp).not.toContain("'unsafe-inline'");

    const firstNonce = firstCsp?.match(/'nonce-([^']+)'/)?.[1];
    const secondNonce = secondCsp?.match(/'nonce-([^']+)'/)?.[1];
    expect(firstNonce).toBeTruthy();
    expect(secondNonce).toBeTruthy();
    expect(firstNonce).not.toBe(secondNonce);
  });

  test("sends defensive headers and omits HSTS on local HTTP", async ({ request }) => {
    const response = await request.get(`/auth/login?daycareId=${DAYCARE_ID ?? "00000000-0000-0000-0000-000000000000"}`);
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["permissions-policy"]).toContain("microphone=()");
    expect(headers["strict-transport-security"]).toBeUndefined();
  });

  test("keeps the root redirect in the navigation boundary", async ({ request }) => {
    const response = await request.get("/", { maxRedirects: 0 });

    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/home");
  });

  test("rejects image types and sizes in the browser", async ({ page }) => {
    test.skip(
      !DAYCARE_ID || !STAFF_EMAIL || !STAFF_PASSWORD,
      "Requires an authenticated staff fixture configured through E2E_* variables.",
    );
    await signIn(page);
    await page.goto("/posts/new");

    const input = page.locator('input[type="file"][name="images"]');
    await input.setInputFiles({
      name: "oversized.png",
      mimeType: "image/png",
      buffer: pngBuffer(5 * 1024 * 1024 + 1),
    });
    await expect(page.getByRole("alert")).toContainText("5.0 MB");

    await input.setInputFiles({
      name: "not-an-image.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await expect(page.getByRole("alert")).toContainText("JPEG, PNG o WebP");
  });

  test("rejects a fifth image in one operation", async ({ page }) => {
    test.skip(
      !DAYCARE_ID || !STAFF_EMAIL || !STAFF_PASSWORD,
      "Requires an authenticated staff fixture configured through E2E_* variables.",
    );
    await signIn(page);
    await page.goto("/posts/new");

    await page.locator('input[type="file"][name="images"]').setInputFiles(
      Array.from({ length: 5 }, (_, index) => ({
        name: `image-${index}.png`,
        mimeType: "image/png",
        buffer: pngBuffer(1024),
      })),
    );
    await expect(page.getByRole("alert")).toContainText("hasta 4 imágenes nuevas");
  });
});
