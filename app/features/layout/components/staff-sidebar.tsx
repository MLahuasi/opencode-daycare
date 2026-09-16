import { Avatar, Brand, Button, LinkButton } from "@/app/components/ui";
import type { ReactNode } from "react";
import { staffSidebarMock } from "@/app/data/mocks";
import type {
  StaffNavigationIcon,
  StaffNavigationSection,
} from "@/app/features/layout/types";
import styles from "./staff-sidebar.module.css";

type StaffSidebarProps = {
  activeSection?: StaffNavigationSection;
  className?: string;
};

type NavigationControlProps = {
  activeSection: StaffNavigationSection;
  item: (typeof staffSidebarMock.navigationItems)[number];
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
 * Renders one navigation control while keeping only Kids navigable.
 *
 * @param props - Navigation control options.
 * @param props.activeSection - Currently active section.
 * @param props.item - Navigation item configuration.
 * @param props.mobile - Whether the compact mobile treatment is used.
 * @returns A presentational button or the real Kids route link.
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

  if (item.icon === "children") {
    return (
      <LinkButton
        aria-current={active ? "page" : undefined}
        className={className}
        href="/kids"
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
 * @param props.className - Optional classes applied to the desktop sidebar.
 * @returns The responsive staff navigation.
 */
export function StaffSidebar({ activeSection = "feed", className = "" }: StaffSidebarProps) {
  return (
    <>
      <aside className={`${styles.sidebar} ${className}`} aria-label={staffSidebarMock.navigationLabel}>
        <Brand name={staffSidebarMock.brand.name} room={staffSidebarMock.brand.room} />

        <Button className={styles.newPostButton}>
          <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {staffSidebarMock.newPostLabel}
        </Button>

        <nav className={styles.navigation} aria-label={staffSidebarMock.sectionsLabel}>
          {staffSidebarMock.navigationItems.map((item) => (
            <NavigationControl activeSection={activeSection} item={item} key={item.label} />
          ))}
        </nav>

        <div className={styles.profile}>
          <Avatar
            aria-hidden="true"
            className={styles.avatar}
            initial={staffSidebarMock.profile.initial}
          />
          <div className={styles.profileDetails}>
            <p>{staffSidebarMock.profile.name}</p>
            <span className={styles.profileRole}>{staffSidebarMock.profile.role}</span>
          </div>
          <Button aria-label={staffSidebarMock.logoutLabel} className={styles.logoutButton} variant="ghost">
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </Button>
        </div>
      </aside>

      <nav className={styles.mobileNavigation} aria-label={staffSidebarMock.mobileNavigationLabel}>
        {staffSidebarMock.navigationItems.map((item) => (
          <NavigationControl activeSection={activeSection} item={item} key={item.label} mobile />
        ))}
      </nav>
    </>
  );
}
