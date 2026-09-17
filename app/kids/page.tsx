import { kids, parentKids } from "@/app/data/mocks";
import { KidsFilter, KidsHeader } from "@/app/features/kids";
import { calculateAge } from "@/app/features/kids/utils";
import type { KidListItem } from "@/app/features/kids/types";
import { getTodayIsoDate, parseCommaSeparatedTags } from "@/app/shared";
import styles from "@/app/features/kids/components/kids-list.module.css";

const AVATAR_TONES = ["blue", "pink", "green", "yellow", "purple"] as const;

function toKidListItem(
  kid: (typeof kids)[number],
  index: number,
  asOfDate: string,
): KidListItem {
  return {
    slug: kid.slug,
    name: kid.name,
    room: kid.room,
    initial: kid.name.trim().charAt(0).toUpperCase(),
    age: calculateAge(kid.birthDate, asOfDate),
    parentCount: parentKids.filter((parentKid) => parentKid.kidId === kid.id).length,
    avatarTone: AVATAR_TONES[index % AVATAR_TONES.length],
    shouldLinkParent: parentKids.every((parentKid) => parentKid.kidId !== kid.id),
    allergies: parseCommaSeparatedTags(kid.allergies),
  };
}

/**
 * Renders the server-projected Kids list and its local search boundary.
 *
 * @returns The Kids list page with a safe DTO payload for the client filter.
 */
export default function KidsPage() {
  const today = getTodayIsoDate();
  const listItems = kids.map((kid, index) => toKidListItem(kid, index, today));

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <KidsHeader />
        <KidsFilter items={listItems} />
      </div>
    </main>
  );
}
