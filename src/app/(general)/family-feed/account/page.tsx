import { redirect } from "next/navigation";
import {
  getFamilyFeedContext,
} from "@/application/family/feed";
import { getSessionPersonRoles, requireActiveSession } from "@/composition/auth";
import { createFamilyFeedComposition } from "@/composition/family";
import { FamilySidebar } from "@/presentation/layout";
import {
  Avatar,
  Badge,
  Button,
  CheckboxField,
  getAvatarToneByPosition,
} from "@/presentation/ui";
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
  const roomsById = new Map(familyContext.rooms.map((room) => [room.id, room]));

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

          <section aria-labelledby="account-kids-heading" className={styles.section}>
            <p className={styles.sectionLabel} id="account-kids-heading">
              Mis hijos
            </p>
            {familyContext.activeKids.length > 0 ? (
              <div className={styles.kidsList}>
                {familyContext.activeKids.map((kid, index) => (
                  <div className={styles.kidRow} key={kid.id}>
                    <Avatar
                      initial={kid.name.trim().charAt(0).toUpperCase()}
                      size="md"
                      tone={getAvatarToneByPosition(index)}
                    />
                    <div className={styles.kidDetails}>
                      <p className={styles.kidName}>{kid.name}</p>
                      <p className={styles.kidRoom}>
                        {roomsById.get(kid.roomId)?.name ?? "Sala no asignada"}
                      </p>
                    </div>
                    <Badge variant="neutral">Solo lectura</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.mutedText}>No tienes hijos vinculados.</p>
            )}
          </section>

          <section
            aria-labelledby="account-notifications-heading"
            className={styles.section}
          >
            <p className={styles.sectionLabel} id="account-notifications-heading">
              Notificaciones
            </p>
            <div className={styles.notificationList}>
              <CheckboxField
                checked
                className={styles.notificationRow}
                disabled
                indicatorClassName={styles.switch}
                label="Avisos cuando se publica algo"
              />
              <CheckboxField
                checked
                className={styles.notificationRow}
                disabled
                indicatorClassName={styles.switch}
                label="Resumen diario"
              />
            </div>
            <p className={styles.mutedText}>
              Las preferencias de notificaciones estarán disponibles próximamente.
            </p>
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

          <section aria-labelledby="account-support-heading" className={styles.section}>
            <p className={styles.sectionLabel} id="account-support-heading">
              Ayuda y soporte
            </p>
            <Button className={styles.supportButton} disabled variant="ghost">
              Soporte próximamente
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
