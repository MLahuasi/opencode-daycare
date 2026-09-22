import { Avatar, Brand, Button, LinkButton } from "@/app/components/ui";
import type { ReactNode } from "react";
import type {
  StaffNavigationConfig,
  StaffNavigationIcon,
  StaffNavigationItem,
  StaffNavigationSection,
} from "./staff-navigation";
import styles from "./staff-sidebar.module.css";
import { LogoutButton } from "./logout-button";

type StaffSidebarProps = {
  activeSection?: StaffNavigationSection;
  className?: string;
  navigation: StaffNavigationConfig;
};

type NavigationControlProps = {
  activeSection: StaffNavigationSection;
  item: StaffNavigationItem;
  mobile?: boolean;
};

/**
 * Renders an icon used by the staff navigation controls.
 *
 * @param props - Icon configuration.
 * @param props.name - Identifier for the icon to render.
 * @returns An inline SVG icon.
 */
function NavigationIcon({ name }: { name: StaffNavigationIcon }) {
  const paths: Record<StaffNavigationIcon, ReactNode> = {
    feed: <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
    children: (
      <>
        <circle cx="9" cy="7" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
      </>
    ),
    alerts: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
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
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

/**
 * Renders one navigation control using the route configured by its item.
 *
 * @param props - Navigation control options.
 * @param props.activeSection - Currently active section.
 * @param props.item - Navigation item configuration.
 * @param props.mobile - Whether the compact mobile treatment is used.
 * @returns A presentational button or a configured application route link.
 */
function NavigationControl({ activeSection, item, mobile = false }: NavigationControlProps) {
  const active = item.icon === activeSection;
  const className = `${mobile ? styles.mobileNavigationButton : styles.navigationButton} ${active ? (mobile ? styles.mobileNavigationButtonActive : styles.navigationButtonActive) : ""}`;
  const content = (
    <>
      <NavigationIcon name={item.icon} />
      {mobile ? <span>{item.label}</span> : item.label}
    </>
  );

  if (item.href) {
    return (
      <LinkButton
        aria-current={active ? "page" : undefined}
        className={className}
        href={item.href}
        variant="ghost"
      >
        {content}
      </LinkButton>
    );
  }

  return (
    <Button
      aria-current={active ? "page" : undefined}
      className={className}
      variant="ghost"
    >
      {content}
    </Button>
  );
}

/**
 * Renders the desktop staff sidebar and the mobile bottom navigation.
 *
 * @param props - Sidebar customization options.
 * @param props.activeSection - Section marked as the current page in both navigation variants.
 * @param props.className - Optional classes applied to the desktop sidebar.
 * @returns The responsive staff navigation.
 */
export function StaffSidebar({ activeSection = "feed", className = "", navigation }: StaffSidebarProps) {
  return (
    <>
      <aside className={`${styles.sidebar} ${className}`} aria-label={navigation.navigationLabel}>
        <Brand name={navigation.brand.name} room={navigation.brand.room} />

        <Button className={styles.newPostButton}>
          <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {navigation.newPostLabel}
        </Button>

        <nav className={styles.navigation} aria-label={navigation.sectionsLabel}>
          {navigation.navigationItems.map((item) => (
            <NavigationControl activeSection={activeSection} item={item} key={item.label} />
          ))}
        </nav>

        <div className={styles.profile}>
          <Avatar
            aria-hidden="true"
            className={styles.avatar}
            initial={navigation.profile.initial}
          />
          <div className={styles.profileDetails}>
            <p>{navigation.profile.name}</p>
            <span className={styles.profileRole}>{navigation.profile.role}</span>
          </div>
          <LogoutButton label={navigation.logoutLabel} />
        </div>
      </aside>

      <nav className={styles.mobileNavigation} aria-label={navigation.mobileNavigationLabel}>
        {navigation.navigationItems.map((item) => (
          <NavigationControl activeSection={activeSection} item={item} key={item.label} mobile />
        ))}
      </nav>
    </>
  );
}
