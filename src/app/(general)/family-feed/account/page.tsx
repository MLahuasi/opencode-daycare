import { redirect } from "next/navigation";
import {
  getFamilyFeedContext,
} from "@/application/family/feed";
import { getSessionPersonRoles, requireActiveSession } from "@/composition/auth";
import { createFamilyFeedComposition } from "@/composition/family";
import { FamilySidebar } from "@/presentation/layout";
import { Avatar } from "@/presentation/ui";
import { AccountProfileForm } from "./_components/account-profile-form";
import { PasswordForm } from "./_components/password-form";
import styles from "./account.module.css";

/**
 * Renders the authenticated family account shell and its persisted profile data.
 *
 * @returns The family account shell.
 */
export default async function FamilyAccountPage() {
  const session = await requireActiveSession();
  const roles = await getSessionPersonRoles(
    session.user.daycareId,
    session.user.personId,
  );

  if (!roles.includes("parent")) {
    redirect("/home");
  }

  const familyContext = await getFamilyFeedContext(
    createFamilyFeedComposition(session.user.daycareId),
    session.user.personId,
  );

  return (
    <div className={styles.shell}>
      <FamilySidebar activeHref="/family-feed/account" person={familyContext.person} />
      <main className={styles.content}>
        <div className={styles.container}>
          <header className={styles.heading}>
            <p className={styles.eyebrow}>Ajustes</p>
            <h1 className={styles.title}>Mi cuenta</h1>
          </header>

          <div className={styles.profileCard}>
            <Avatar
              initial={familyContext.person.name.trim().charAt(0).toUpperCase()}
              size="lg"
              tone="purple"
            />
            <div className={styles.profileSummary}>
              <p className={styles.profileName}>{familyContext.person.name}</p>
              <p className={styles.profileEmail}>{familyContext.person.email}</p>
            </div>
          </div>

          <section
            aria-labelledby="account-profile-heading"
            className={styles.section}
          >
            <h2 className={styles.sectionTitle} id="account-profile-heading">
              Datos personales
            </h2>
            <AccountProfileForm
              name={familyContext.person.name}
              phone={familyContext.person.phone}
            />
          </section>
          <section
            aria-labelledby="account-password-heading"
            className={styles.section}
          >
            <h2 className={styles.sectionTitle} id="account-password-heading">
              Contraseña
            </h2>
            <PasswordForm />
          </section>
        </div>
      </main>
    </div>
  );
}
