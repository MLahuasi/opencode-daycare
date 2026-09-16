import { Avatar, Button } from "@/app/components/ui";
import type { ReactNode } from "react";
import {
  staffSidebarMock,
  type StaffNavigationIcon,
} from "@/app/data/mocks";
import styles from "./staff-sidebar.module.css";

type StaffSidebarProps = {
  className?: string;
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
 * Renders the desktop staff sidebar and the mobile bottom navigation.
 *
 * @param props - Sidebar customization options.
 * @param props.className - Optional classes applied to the desktop sidebar.
 * @returns The responsive staff navigation.
 */
export function StaffSidebar({ className = "" }: StaffSidebarProps) {
  return (
    <>
      <aside className={`${styles.sidebar} ${className}`} aria-label={staffSidebarMock.navigationLabel}>
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true">
            <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </div>
          <div>
            <p className={styles.brandName}>{staffSidebarMock.brand.name}</p>
            <p className={styles.roomName}>{staffSidebarMock.brand.room}</p>
          </div>
        </div>

        <Button className={styles.newPostButton}>
          <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {staffSidebarMock.newPostLabel}
        </Button>

        <nav className={styles.navigation} aria-label={staffSidebarMock.sectionsLabel}>
          {staffSidebarMock.navigationItems.map(({ active, icon, label }) => (
            <Button
              aria-current={active ? "page" : undefined}
              className={`${styles.navigationButton} ${active ? styles.navigationButtonActive : ""}`}
              key={label}
              variant="ghost"
            >
              <NavigationIcon name={icon} />
              {label}
            </Button>
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
            <span>{staffSidebarMock.profile.role}</span>
          </div>
          <Button aria-label={staffSidebarMock.logoutLabel} className={styles.logoutButton} variant="ghost">
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </Button>
        </div>
      </aside>

      <nav className={styles.mobileNavigation} aria-label={staffSidebarMock.mobileNavigationLabel}>
        {staffSidebarMock.navigationItems.map(({ active, icon, label }) => (
          <Button
            aria-current={active ? "page" : undefined}
            className={`${styles.mobileNavigationButton} ${active ? styles.mobileNavigationButtonActive : ""}`}
            key={label}
            variant="ghost"
          >
            <NavigationIcon name={icon} />
            <span>{label}</span>
          </Button>
        ))}
      </nav>
    </>
  );
}
