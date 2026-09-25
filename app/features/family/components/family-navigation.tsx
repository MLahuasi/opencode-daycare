import { LinkButton } from "@/app/components/ui";
import type { FamilyNavigationConfig } from "@/app/shared/config";
import styles from "./family-navigation.module.css";

type FamilyNavigationProps = {
  className?: string;
  navigation: FamilyNavigationConfig;
};

/**
 * Renders the configured navigation for an authenticated family account.
 *
 * @param props - Family navigation configuration.
 * @param props.className - Optional classes applied to the navigation.
 * @param props.navigation - Labels, destinations, and active state.
 * @returns The family navigation landmark.
 */
export function FamilyNavigation({
  className = "",
  navigation,
}: FamilyNavigationProps) {
  return (
    <nav
      aria-label={navigation.navigationLabel}
      className={`${styles.navigation} ${className}`}
    >
      {navigation.items.map((item) => (
        <LinkButton
          aria-current={item.active ? "page" : undefined}
          className={`${styles.link} ${item.active ? styles.active : ""}`}
          href={item.href}
          key={item.href}
          variant="ghost"
        >
          {item.label}
        </LinkButton>
      ))}
    </nav>
  );
}
