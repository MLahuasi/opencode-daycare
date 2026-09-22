import { AuthShell, LoginForm } from "@/app/features/auth";

/**
 * Renders the login route using the shared authentication shell.
 *
 * @returns The login page.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ activated?: string | string[] }>;
}) {
  const params = await searchParams;
  const activated = Array.isArray(params.activated)
    ? params.activated[0] === "1"
    : params.activated === "1";

  return (
    <AuthShell
      description="Publica momentos, gestiona las salas y mantén a las familias cerca, desde un solo lugar."
      eyebrow="Sala Soles"
      title={<>El día de cada niño,<br />compartido con su familia.</>}
    >
      <LoginForm activated={activated} />
    </AuthShell>
  );
}
