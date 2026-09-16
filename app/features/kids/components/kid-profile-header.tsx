import { Avatar, Button } from "@/app/components/ui";
import type { Kid } from "@/app/features/kids/types";
import styles from "./kid-profile.module.css";

type KidProfileHeaderProps = {
  age: number;
  avatarTone: "coral" | "blue" | "pink" | "green" | "yellow" | "purple";
  kid: Kid;
};

/**
 * Renders a kid's profile identity and the presentational edit control.
 *
 * @param props - Profile identity options.
 * @param props.age - Age derived from the kid's birth date.
 * @param props.avatarTone - Visual tone assigned to the kid's avatar.
 * @param props.kid - Canonical kid data used for identity fields.
 * @returns The profile identity header.
 */
export function KidProfileHeader({ age, avatarTone, kid }: KidProfileHeaderProps) {
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
        <p>{age} años · Sala {kid.room}</p>
      </div>
      <Button className={styles.editButton} variant="ghost">
        Editar
      </Button>
    </header>
  );
}
