import type { Kid } from "@/app/features/kids/types";
import { APP_LOCALE } from "@/app/shared";
import styles from "./kid-profile.module.css";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`)).replaceAll(".", "");
}

function formatMonth(value: string): string {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`)).replaceAll(".", "");
}

type KidBasicInfoProps = {
  kid: Kid;
  roomName: string;
};

/**
 * Renders the canonical basic information for a kid.
 *
 * @param props - Basic information options.
 * @param props.kid - Kid whose dates and room are displayed.
 * @param props.roomName - Display name resolved from the kid's room reference.
 * @returns A basic information definition list.
 */
export function KidBasicInfo({ kid, roomName }: KidBasicInfoProps) {
  return (
    <dl className={styles.basicInfo}>
      <div>
        <dt>Fecha de nacimiento</dt>
        <dd>{formatDate(kid.birthDate)}</dd>
      </div>
      <div>
        <dt>Sala</dt>
        <dd>{roomName}</dd>
      </div>
      <div>
        <dt>Ingreso</dt>
        <dd>{formatMonth(kid.enrollmentDate)}</dd>
      </div>
    </dl>
  );
}
