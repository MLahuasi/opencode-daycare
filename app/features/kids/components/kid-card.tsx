import Link from "next/link";
import { Avatar, Badge } from "@/app/components/ui";
import type { KidListItem } from "@/app/features/kids/types";
import styles from "./kids-list.module.css";

type KidCardProps = {
  kid: KidListItem;
};

const ALLERGY_BADGE_VARIANTS = [
  "coral",
  "pink",
  "green",
  "yellow",
  "blue",
  "purple",
] as const;

function getAvatarTone(value: string): "coral" | "blue" | "pink" | "green" | "yellow" | "purple" {
  switch (value) {
    case "blue":
    case "pink":
    case "green":
    case "yellow":
    case "purple":
    case "coral":
      return value;
    default:
      return "coral";
  }
}

function getParentLabel(parentCount: number): string {
  return parentCount === 1
    ? "1 padre vinculado"
    : `${parentCount} padres vinculados`;
}

/**
 * Renders a navigable, non-medical summary card for one kid.
 *
 * @param props - Card content options.
 * @param props.kid - Safe list DTO used to render the card.
 * @returns A link to the kid's canonical profile route.
 */
export function KidCard({ kid }: KidCardProps) {
  return (
    <Link className={styles.card} href={`/kids/${kid.slug}`}>
      <Avatar
        aria-hidden="true"
        className={styles.cardAvatar}
        initial={kid.initial}
        tone={getAvatarTone(kid.avatarTone)}
      />
      <span className={styles.cardContent}>
        <span className={styles.cardName}>{kid.name}</span>
        <span className={styles.cardMeta}>
          {kid.age} años · {getParentLabel(kid.parentCount)}
        </span>
      </span>
      {kid.allergies.map((allergy, index) => (
        <Badge
          key={`${allergy}-${index}`}
          variant={ALLERGY_BADGE_VARIANTS[index % ALLERGY_BADGE_VARIANTS.length]}
        >
          {allergy}
        </Badge>
      ))}
      {kid.shouldLinkParent ? <Badge variant="pink">Vincular</Badge> : null}
      {kid.allergies.length === 0 && !kid.shouldLinkParent ? (
        <span aria-hidden="true" className={styles.cardArrow}>
          ›
        </span>
      ) : null}
    </Link>
  );
}
