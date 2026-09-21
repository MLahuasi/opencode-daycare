import type { StaffNavigationConfig } from "@/app/components/layout";

/**
 * Transversal copy and navigation profile used by the staff shell.
 *
 * Lives in shared config because it is application-level navigation
 * configuration, not a mutable fixture nor a domain model.
 */
export const staffNavigationConfig = {
  navigationLabel: "Navegación principal",
  sectionsLabel: "Secciones",
  mobileNavigationLabel: "Navegación móvil",
  brand: {
    name: "OpenDayCare",
    room: "Sala Soles",
  },
  newPostLabel: "Nueva publicación",
  profile: {
    initial: "C",
    name: "Caro Giménez",
    role: "Maestra · Soles",
  },
  logoutLabel: "Cerrar sesión",
  navigationItems: [
    { label: "Feed", icon: "feed", href: "/", active: true },
    { label: "Niños", icon: "children", href: "/kids" },
    { label: "Avisos", icon: "alerts" },
    { label: "Mi cuenta", icon: "account" },
  ],
} satisfies StaffNavigationConfig;