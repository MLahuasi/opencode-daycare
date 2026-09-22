"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/app/components/ui";
import styles from "./staff-sidebar.module.css";

type LogoutButtonProps = {
  label: string;
};

/**
 * Signs out the current NextAuth session and returns to the login route.
 *
 * @param props - Logout button configuration.
 * @param props.label - Accessible label for the logout control.
 * @returns A configured logout button.
 */
export function LogoutButton({ label }: LogoutButtonProps) {
  return (
    <Button
      aria-label={label}
      className={styles.logoutButton}
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      variant="ghost"
    >
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </svg>
    </Button>
  );
}
