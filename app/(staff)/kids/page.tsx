import {
  calculateAge,
  getKids,
  getParentKids,
  getRooms,
  parseCommaSeparatedTags,
} from "@/src/application/kid";
import type { KidListItem, ParentKidRecord } from "@/src/application/kid";
import type { Kid } from "@/src/domain/kid";
import type { Room } from "@/src/domain/room";
import { KidsFilter, KidsHeader } from "./_components";
import styles from "./_components/kids-list.module.css";
import { createKidComposition } from "@/src/composition/kid";
import { getTodayIsoDate } from "@/src/utils";
import { requireStaffSession } from "@/auth";

const AVATAR_TONES = ["blue", "pink", "green", "yellow", "purple"] as const;

function toKidListItem(
  kid: Kid,
  index: number,
  asOfDate: string,
  parentKids: readonly ParentKidRecord[],
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
  await requireStaffSession();
  const dependencies = createKidComposition();

  const [kids, parentKids, rooms] = await Promise.all([
    getKids(dependencies),
    getParentKids(dependencies),
    getRooms(dependencies),
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
