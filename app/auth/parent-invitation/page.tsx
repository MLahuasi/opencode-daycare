import styles from "@/app/features/auth/components/auth.module.css";

/**
 * Explains that parent invitations must be opened from the email link.
 *
 * @returns The public parent invitation information page.
 */
export default function ParentInvitationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-10 max-sm:p-6">
      <section className={styles.activationContent}>
        <div aria-hidden="true" className={styles.activationMark}>
          <svg fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>
        <h1>Invitación familiar</h1>
        <p className={styles.activationIntro}>
          Para activar tu cuenta, abre el enlace personal que recibiste por email.
        </p>
      </section>
    </main>
  );
}
