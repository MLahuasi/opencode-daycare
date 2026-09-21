export type StaffNavigationIcon = "feed" | "children" | "alerts" | "account";

export type StaffNavigationSection = StaffNavigationIcon;

export type StaffNavigationItem = {
  label: string;
  icon: StaffNavigationIcon;
  href?: string;
  active?: boolean;
};

/** Copy and navigation profile shown by the staff sidebar. */
export type StaffNavigationConfig = {
  navigationLabel: string;
  sectionsLabel: string;
  mobileNavigationLabel: string;
  brand: {
    name: string;
    room: string;
  };
  newPostLabel: string;
  profile: {
    initial: string;
    name: string;
    role: string;
  };
  logoutLabel: string;
  navigationItems: readonly StaffNavigationItem[];
};