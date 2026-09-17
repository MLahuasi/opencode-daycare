import { AuthShell, LoginForm } from "@/app/features/auth";

/**
 * Renders the login route using the shared authentication shell.
 *
 * @returns The login page.
 */
export default function LoginPage() {
  return (
    <AuthShell
      description="Publica momentos, gestiona las salas y mantén a las familias cerca, desde un solo lugar."
      eyebrow="Sala Soles"
      title={<>El día de cada niño,<br />compartido con su familia.</>}
    >
      <LoginForm />
    </AuthShell>
  );
}
