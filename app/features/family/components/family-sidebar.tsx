import { Avatar, Brand, LinkButton } from "@/app/components/ui";
import { LogoutButton } from "@/app/components/layout";
import type { Person } from "@/app/features/people";
import { familyNavigationConfig, type FamilyNavigationIcon } from "@/app/shared/config";
import type { ReactNode } from "react";
import styles from "./family-sidebar.module.css";

type FamilySidebarProps = {
  className?: string;
  person: Pick<Person, "name">;
};

function NavigationIcon({ name }: { name: FamilyNavigationIcon }) {
  const paths: Record<FamilyNavigationIcon, ReactNode> = {
    feed: (
      <>
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
    summary: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    account: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={styles.navigationIcon}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

/**
 * Renders the family sidebar and its responsive mobile navigation.
 *
 * @param props - Family sidebar configuration.
 * @param props.className - Optional classes applied to the sidebar.
 * @param props.person - Parent identity shown in the sidebar profile.
 * @returns The family navigation shell.
 */
export function FamilySidebar({ className = "", person }: FamilySidebarProps) {
  const initial = person.name.trim().charAt(0).toUpperCase();

  return (
    <>
      <aside
        aria-label={familyNavigationConfig.navigationLabel}
        className={`${styles.sidebar} ${className}`}
      >
        <Brand name="OpenDayCare" room="Familia" />
        <nav aria-label="Secciones" className={styles.navigation}>
          {familyNavigationConfig.items.map((item) => (
            <LinkButton
              aria-current={item.active ? "page" : undefined}
              className={`${styles.navigationButton} ${item.active ? styles.navigationButtonActive : ""}`}
              href={item.href}
              key={item.href}
              variant="ghost"
            >
              <NavigationIcon name={item.icon} />
              {item.label}
            </LinkButton>
          ))}
        </nav>
        <div className={styles.profile}>
          <Avatar initial={initial} size="md" tone="purple" />
          <div className={styles.profileDetails}>
            <p>{person.name}</p>
            <span>Familia</span>
          </div>
          <LogoutButton label="Cerrar sesión" />
        </div>
      </aside>

      <nav aria-label="Navegación familiar móvil" className={styles.mobileNavigation}>
        {familyNavigationConfig.items.map((item) => (
          <LinkButton
            aria-current={item.active ? "page" : undefined}
            className={`${styles.mobileNavigationButton} ${item.active ? styles.mobileNavigationButtonActive : ""}`}
            href={item.href}
            key={item.href}
            variant="ghost"
          >
            <NavigationIcon name={item.icon} />
            <span>{item.label}</span>
          </LinkButton>
        ))}
      </nav>
    </>
  );
}
