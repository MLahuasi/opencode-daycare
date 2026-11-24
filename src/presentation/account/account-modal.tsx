"use client";

import { useEffect } from "react";
import { Button } from "@/presentation/ui";
import type { AccountModalProps } from "./account-types";
import styles from "./account-forms.module.css";

/** Renders the shared accessible account dialog shell. */
export function AccountModal({
  children,
  idPrefix,
  onClose,
  restoreFocusId,
  title,
}: AccountModalProps) {
  const closeId = `${idPrefix}-modal-close`;
  const titleId = `${idPrefix}-modal-title`;

  useEffect(() => {
    document.getElementById(closeId)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.setTimeout(() => document.getElementById(restoreFocusId)?.focus(), 0);
    };
  }, [closeId, onClose, restoreFocusId]);

  return (
    <div
      className={styles.modalBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.modal}
        role="dialog"
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} id={titleId}>
            {title}
          </h2>
          <Button
            aria-label="Cerrar ventana"
            autoFocus
            className={styles.closeButton}
            id={closeId}
            onClick={onClose}
            variant="ghost"
          >
            ×
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
