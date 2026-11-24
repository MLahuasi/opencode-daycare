import type { StaffNavigationConfig } from "@/presentation/layout";
import type { StaffNavigationProjection } from "@/application/staff";

/**
 * Transversal copy and navigation profile used by the staff shell.
 *
 * Lives in shared config because it is application-level navigation
 * configuration, not a mutable fixture nor a domain model.
 */
/**
 * Builds the Staff Shell navigation from persisted brand and profile data.
 *
 * @param projection - Dynamic Staff Shell data loaded from PostgreSQL.
 * @returns Complete navigation configuration for the Staff Sidebar.
 */
export function createStaffNavigationConfig(
  projection: StaffNavigationProjection,
): StaffNavigationConfig {
  return {
    navigationLabel: "Navegación principal",
    sectionsLabel: "Secciones",
    mobileNavigationLabel: "Navegación móvil",
    brand: projection.brand,
    newPostLabel: "Nueva publicación",
    profile: projection.profile,
    logoutLabel: "Cerrar sesión",
    navigationItems: [
      { label: "Feed", icon: "feed", href: "/home", active: true },
      { label: "Niños", icon: "children", href: "/kids" },
      { label: "Avisos", icon: "alerts" },
      { label: "Mi cuenta", icon: "account", href: "/account" },
    ],
  };
}
