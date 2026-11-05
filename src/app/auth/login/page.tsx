import { AuthShell, LoginForm } from "@/presentation/auth";

/**
 * Renders the login route using the shared authentication shell.
 *
 * @returns The login page.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    activated?: string | string[];
    daycareId?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const activated = Array.isArray(params.activated)
    ? params.activated[0] === "1"
    : params.activated === "1";
  const daycareId = Array.isArray(params.daycareId)
    ? params.daycareId[0]
    : params.daycareId;

  return (
    <AuthShell
      description="Publica momentos, gestiona las salas y mantén a las familias cerca, desde un solo lugar."
      eyebrow="Sala Soles"
      title={<>El día de cada niño,<br />compartido con su familia.</>}
    >
      <LoginForm activated={activated} daycareId={daycareId} />
    </AuthShell>
  );
}
