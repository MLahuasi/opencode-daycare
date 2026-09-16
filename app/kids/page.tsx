import { kids } from "@/app/data/mocks";
import { KidsFilter, KidsHeader } from "@/app/features/kids";
import { calculateAge } from "@/app/features/kids/utils";
import type { KidListItem } from "@/app/features/kids/types";
import styles from "@/app/features/kids/components/kids-list.module.css";

const AVATAR_TONES = ["blue", "pink", "green", "yellow", "purple"] as const;

function getTodayIsoDate(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}

function toKidListItem(
  kid: (typeof kids)[number],
  index: number,
): KidListItem {
  return {
    slug: kid.slug,
    name: kid.name,
    initial: kid.name.trim().charAt(0).toUpperCase(),
    age: calculateAge(kid.birthDate, getTodayIsoDate()),
    parentCount: kid.parentIds.length,
    avatarTone: AVATAR_TONES[index % AVATAR_TONES.length],
    shouldLinkParent: kid.parentIds.length === 0,
  };
}

/**
 * Renders the server-projected Kids list and its local search boundary.
 *
 * @returns The Kids list page with a safe DTO payload for the client filter.
 */
export default function KidsPage() {
  const listItems = kids.map(toKidListItem);
  const room = kids[0]?.room ?? "";

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <KidsHeader room={room} totalCount={listItems.length} />
        <section aria-labelledby="kids-room-heading" className={styles.roomSection}>
          <div className={styles.roomHeading}>
            <h2 id="kids-room-heading">{room}</h2>
            <span>{listItems.length} niños</span>
            <i aria-hidden="true" />
          </div>
          <KidsFilter items={listItems} />
        </section>
      </div>
    </main>
  );
}
