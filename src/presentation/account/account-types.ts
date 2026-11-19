import type { ReactNode } from "react";

/** Validation state shared by profile forms. */
export type AccountProfileState = {
  errors: { name?: string; phone?: string };
  message: string;
};

/** Validation state shared by password forms. */
export type AccountPasswordState = {
  errors: { password?: string; confirmation?: string };
  message: string;
};

/** Server Action signature accepted by the profile form. */
export type AccountProfileAction = (
  state: AccountProfileState,
  formData: FormData,
) => Promise<AccountProfileState>;

/** Server Action signature accepted by the password form. */
export type AccountPasswordAction = (
  state: AccountPasswordState,
  formData: FormData,
) => Promise<AccountPasswordState>;

/** Common dialog configuration supplied by account route consumers. */
export type AccountModalProps = {
  children: ReactNode;
  idPrefix: string;
  onClose: () => void;
  restoreFocusId: string;
  title: string;
};
