import {
  calculateAge,
  getKidsInRooms,
  getParentKids,
  getRooms,
  parseCommaSeparatedTags,
} from "@/application/kid";
import type { KidListItem } from "@/application/kid";
import type { ParentKid } from "@/domain/family";
import type { Kid } from "@/domain/kid";
import type { Room } from "@/domain/room";
import { KidsFilter, KidsHeader } from "./_components";
import styles from "./_components/kids-list.module.css";
import { createKidComposition, getKidAuthorization } from "@/composition/kid";
import { getTodayIsoDate } from "@/utils";
import { requireStaffSession } from "@/composition/auth";

function toKidListItem(
  kid: Kid,
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
  const session = await requireStaffSession();
  const authorization = await getKidAuthorization(session.user.daycareId, session.user.personId);
  const dependencies = createKidComposition(session.user.daycareId);

  const [kids, parentKids, rooms] = await Promise.all([
    getKidsInRooms(dependencies, authorization.assignedRoomIds),
    getParentKids(dependencies),
    getRooms(dependencies),
  ]);
  const today = getTodayIsoDate();
  const authorizedRooms = rooms.filter((room) => authorization.assignedRoomIds.includes(room.id));
  const listItems = kids.map((kid) =>
    toKidListItem(kid, today, parentKids, authorizedRooms),
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
