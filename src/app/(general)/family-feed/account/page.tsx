import { redirect } from "next/navigation";
import {
  getFamilyFeedContext,
} from "@/application/family/feed";
import { getSessionPersonRoles, requireActiveSession } from "@/composition/auth";
import { createFamilyFeedComposition } from "@/composition/family";
import { FamilySidebar } from "@/presentation/layout";
import { AccountProfileForm } from "./_components/account-profile-form";
import { PasswordForm } from "./_components/password-form";
import styles from "../family-feed.module.css";

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
        <h1>Ajustes</h1>
        <p>Mi cuenta</p>
        <section aria-labelledby="account-profile-heading">
          <h2 id="account-profile-heading">Datos personales</h2>
          <p>{familyContext.person.email}</p>
          <AccountProfileForm
            name={familyContext.person.name}
            phone={familyContext.person.phone}
          />
        </section>
        <section aria-labelledby="account-password-heading">
          <h2 id="account-password-heading">Contraseña</h2>
          <PasswordForm />
        </section>
      </main>
    </div>
  );
}
