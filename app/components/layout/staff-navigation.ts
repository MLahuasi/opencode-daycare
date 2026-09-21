export type StaffNavigationIcon = "feed" | "children" | "alerts" | "account";

export type StaffNavigationSection = StaffNavigationIcon;

export type StaffNavigationItem = {
  label: string;
  icon: StaffNavigationIcon;
  href?: string;
  active?: boolean;
};