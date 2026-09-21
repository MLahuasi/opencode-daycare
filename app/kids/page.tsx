import {
  calculateAge,
  KidsFilter,
  KidsHeader,
} from "@/app/features/kids";
import type { Kid, KidListItem, ParentKid } from "@/app/features/kids";
import type { Room } from "@/app/features/rooms";
import { getKids, getParentKids, getRooms } from "@/app/features/kids/server";
import { getTodayIsoDate, parseCommaSeparatedTags } from "@/app/shared";
import styles from "@/app/features/kids/components/kids-list.module.css";

const AVATAR_TONES = ["blue", "pink", "green", "yellow", "purple"] as const;

function toKidListItem(
  kid: Kid,
  index: number,
  asOfDate: string,
  parentKids: readonly ParentKid[],
  rooms: readonly Room[],
): KidListItem {
  return {
    slug: kid.slug,
    name: kid.name,
    room: rooms.find((room) => room.id === kid.roomId)?.name ?? "Sin sala asignada",
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
export default async function KidsPage() {
  const [kids, parentKids, rooms] = await Promise.all([
    getKids(),
    getParentKids(),
    getRooms(),
  ]);
  const today = getTodayIsoDate();
  const listItems = kids.map((kid, index) =>
    toKidListItem(kid, index, today, parentKids, rooms),
  );

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <KidsHeader addHref="/kids/new" />
        <KidsFilter items={listItems} />
      </div>
    </main>
  );
}
