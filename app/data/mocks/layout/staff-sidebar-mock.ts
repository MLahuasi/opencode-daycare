import type { StaffNavigationItem } from "@/app/features/layout";

export const staffSidebarMock = {
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
  ] satisfies readonly StaffNavigationItem[],
} as const;
