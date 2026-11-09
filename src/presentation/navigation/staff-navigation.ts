import type { StaffNavigationConfig } from "@/presentation/layout";

type StaffNavigationStaticConfig = Omit<
  StaffNavigationConfig,
  "brand" | "profile"
>;

/**
 * Transversal copy and navigation items used by the staff shell.
 *
 * Lives in shared config because it is application-level navigation
 * configuration, not a mutable fixture nor a domain model.
 */
export const staffNavigationConfig = {
  navigationLabel: "Navegación principal",
  sectionsLabel: "Secciones",
  mobileNavigationLabel: "Navegación móvil",
  newPostLabel: "Nueva publicación",
  logoutLabel: "Cerrar sesión",
  navigationItems: [
    { label: "Feed", icon: "feed", href: "/home", active: true },
    { label: "Niños", icon: "children", href: "/kids" },
    { label: "Avisos", icon: "alerts" },
    { label: "Mi cuenta", icon: "account" },
  ],
} satisfies StaffNavigationStaticConfig;
