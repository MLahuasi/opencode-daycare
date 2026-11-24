import { redirect } from "next/navigation";
import { requireStaffSession } from "@/composition/auth";
import { createStaffAccountComposition, createStaffShellComposition } from "@/composition/staff";
import { Avatar, CheckboxField } from "@/presentation/ui";
import { LogoutButton, StaffSidebar } from "@/presentation/layout";
import { createStaffNavigationConfig } from "@/presentation/navigation";
import { AccountSettingsActions } from "./_components/account-settings-actions";
import styles from "./account.module.css";

/** Renders the authenticated staff account page. */
export default async function StaffAccountPage() {
  const session = await requireStaffSession();
  const [account, navigation] = await Promise.all([
    createStaffAccountComposition().getAccount(session.user.daycareId, session.user.personId),
    createStaffShellComposition().getNavigation(session.user.daycareId, session.user.personId),
  ]);

  if (!account || !navigation) redirect("/auth/login");
  const role = account.jobTitle?.trim() || "Personal";
  const rooms = account.roomNames.length > 0 ? account.roomNames.join(", ") : "Sin salas asignadas";

  return (
    <div className={styles.shell}>
      <StaffSidebar activeSection="account" navigation={createStaffNavigationConfig(navigation)} />
      <main className={styles.content}>
        <div className={styles.container}>
          <header className={styles.heading}><p className={styles.eyebrow}>Ajustes</p><h1 className={styles.title}>Mi cuenta</h1></header>
          <section aria-labelledby="staff-profile-heading" className={styles.profileCard}>
            <Avatar aria-hidden="true" initial={account.name.trim().charAt(0).toUpperCase() || "?"} size="lg" />
            <div className={styles.profileSummary}>
              <h2 className={styles.profileName} id="staff-profile-heading">{account.name}</h2>
              <p className={styles.profileEmail}>{account.email}</p>
              <p className={styles.profileMeta}>{role} · {rooms}</p>
              <p className={styles.profilePhone}>{account.phone ?? "Teléfono no configurado"}</p>
            </div>
            <AccountSettingsActions mode="profile" name={account.name} phone={account.phone} />
          </section>
          <section aria-labelledby="staff-notifications-heading" className={styles.section}>
            <p className={styles.sectionLabel} id="staff-notifications-heading">Notificaciones</p>
            <div className={styles.notificationList}>
              <CheckboxField checked className={styles.notificationRow} disabled indicatorClassName={styles.switch} label="Nuevos comentarios de familias" />
              <CheckboxField checked className={styles.notificationRow} disabled indicatorClassName={styles.switch} label="Recordatorio de resumen (17:00)" />
            </div>
          </section>
          <section aria-label="Seguridad y soporte" className={styles.securitySection}>
            <AccountSettingsActions mode="security" name={account.name} phone={account.phone} />
          </section>
          <LogoutButton className={styles.pageLogout} label="Cerrar sesión" showLabel />
        </div>
      </main>
    </div>
  );
}
