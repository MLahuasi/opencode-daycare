import { Avatar, LinkButton } from "@/app/components/ui";
import type { Kid } from "../types";
import styles from "./kid-profile.module.css";

type KidProfileHeaderProps = {
  age: number;
  avatarTone: "coral" | "blue" | "pink" | "green" | "yellow" | "purple";
  editHref: string;
  kid: Kid;
  roomName: string;
};

/**
 * Renders a kid's profile identity and the presentational edit control.
 *
 * @param props - Profile identity options.
 * @param props.age - Age derived from the kid's birth date.
 * @param props.avatarTone - Visual tone assigned to the kid's avatar.
 * @param props.editHref - Destination for editing the current kid.
 * @param props.kid - Canonical kid data used for identity fields.
 * @param props.roomName - Display name resolved from the kid's room reference.
 * @returns The profile identity header.
 */
export function KidProfileHeader({
  age,
  avatarTone,
  editHref,
  kid,
  roomName,
}: KidProfileHeaderProps) {
  return (
    <header className={styles.profileHeader}>
      <Avatar
        aria-hidden="true"
        className={styles.profileAvatar}
        initial={kid.name.trim().charAt(0).toUpperCase()}
        size="lg"
        tone={avatarTone}
      />
      <div className={styles.profileIdentity}>
        <h1>{kid.name}</h1>
        <p>{age} años · Sala {roomName}</p>
      </div>
      <LinkButton className={styles.editButton} href={editHref} variant="ghost">
        Editar
      </LinkButton>
    </header>
  );
}
