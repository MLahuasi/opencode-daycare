/** Icon identifiers supported by the family sidebar. */
export type FamilyNavigationIcon = "feed" | "summary" | "account";

/** A configured destination in the family navigation. */
export type FamilyNavigationItem = {
  icon: FamilyNavigationIcon;
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
    { icon: "feed", label: "Feed", href: "/family-feed", active: true },
    {
      icon: "summary",
      label: "Resumen del día",
      href: "/family-feed/day-summary",
    },
    { icon: "account", label: "Mi cuenta", href: "/family-feed/account" },
  ],
} satisfies FamilyNavigationConfig;
