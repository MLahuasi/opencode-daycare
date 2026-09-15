export type StaffNavigationIcon = "feed" | "children" | "alerts" | "account";

export type StaffNavigationItem = {
  label: string;
  icon: StaffNavigationIcon;
  active?: boolean;
};

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
    { label: "Feed", icon: "feed", active: true },
    { label: "Niños", icon: "children" },
    { label: "Avisos", icon: "alerts" },
    { label: "Mi cuenta", icon: "account" },
  ] satisfies readonly StaffNavigationItem[],
} as const;
