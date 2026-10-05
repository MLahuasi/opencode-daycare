import { ParentInvitationForm } from "../_components";
import { validateInvitationToken } from "@/src/application/family";
import { getKidById } from "@/src/application/kid";
import { createFamilyComposition } from "@/src/composition/family";
import { createKidComposition } from "@/src/composition/kid";
import styles from "@/app/features/auth/components/auth.module.css";

type ParentInvitationPageProps = {
  /** Dynamic token route parameters. */
  params: Promise<{ token: string }>;
};

/**
 * Resolves a public invitation token and renders its safe acceptance state.
 *
 * @param props - Dynamic token route parameters.
 * @param props.params - Promise containing the invitation token.
 * @returns The acceptance form for valid tokens or a generic invalid-token message.
 */
export default async function ParentInvitationTokenPage({
  params,
}: ParentInvitationPageProps) {
  const { token } = await params;
  const resolution = await validateInvitationToken(createFamilyComposition(), token);

  if (resolution.status !== "valid" || !resolution.invitation || !resolution.person) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-10 max-sm:p-6">
        <section className={styles.activationContent}>
          <h1>Invitación no disponible</h1>
          <p className={styles.activationIntro}>
            Este enlace no es válido, ya venció o ya fue utilizado.
          </p>
        </section>
      </main>
    );
  }

  const kid = await getKidById(createKidComposition(), resolution.invitation.kidId);

  if (!kid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-10 max-sm:p-6">
        <section className={styles.activationContent}>
          <h1>Invitación no disponible</h1>
          <p className={styles.activationIntro}>No pudimos resolver esta invitación.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-10 max-sm:p-6">
      <ParentInvitationForm
        code={token}
        email={resolution.person.email}
        existingActiveParent={resolution.person.status === "active"}
        kidName={kid.name}
      />
    </main>
  );
}
