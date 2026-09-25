/** A configured destination in the family navigation. */
export type FamilyNavigationItem = {
  label: string;
  href: string;
  active?: boolean;
};

/** Application-level navigation copy and destinations for family accounts. */
export type FamilyNavigationConfig = {
  navigationLabel: string;
  items: readonly FamilyNavigationItem[];
};

/** Navigation destinations shared by the family feed shell. */
export const familyNavigationConfig = {
  navigationLabel: "Navegación familiar",
  items: [
    { label: "Feed", href: "/family-feed", active: true },
    { label: "Resumen del día", href: "/family-feed/day-summary" },
    { label: "Mi cuenta", href: "/family-feed/account" },
  ],
} satisfies FamilyNavigationConfig;
