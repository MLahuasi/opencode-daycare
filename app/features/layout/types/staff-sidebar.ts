export type StaffNavigationIcon = "feed" | "children" | "alerts" | "account";

export type StaffNavigationItem = {
  label: string;
  icon: StaffNavigationIcon;
  active?: boolean;
};
