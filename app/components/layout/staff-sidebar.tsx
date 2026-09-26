import {
  Avatar,
  BellIcon,
  Brand,
  Button,
  HomeIcon,
  LinkButton,
  PeopleIcon,
  PlusIcon,
  UserIcon,
} from "@/app/components/ui";
import type { ComponentType, SVGAttributes } from "react";
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
  const icons: Record<StaffNavigationIcon, ComponentType<SVGAttributes<SVGSVGElement>>> = {
    feed: HomeIcon,
    children: PeopleIcon,
    alerts: BellIcon,
    account: UserIcon,
  };
  const Icon = icons[name];

  return <Icon className={styles.navigationIcon} strokeWidth="2" />;
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
          <PlusIcon strokeWidth="2.4" />
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
