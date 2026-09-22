import "server-only";

import { randomUUID } from "node:crypto";
import { getTodayIsoDate } from "@/app/shared";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/app/infrastructure/persistence";
import type { Person } from "@/app/features/people";
import type { Room } from "@/app/features/rooms";
import type { LinkedParent, ParentKid } from "@/app/features/family";
import type { KidFormValues } from "../schemas";
import type { Kid } from "../types";
import { normalizeSlug } from "../utils";

function createUniqueSlug(name: string, kids: readonly Kid[]): string {
  const baseSlug = normalizeSlug(name);

  if (!baseSlug) {
    throw new Error("Cannot create a kid slug from an empty normalized name.");
  }

  const existingSlugs = new Set(kids.map((kid) => kid.slug));
  let candidate = baseSlug;
  let suffix = 2;

  while (existingSlugs.has(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function selectKidFormValues(values: KidFormValues): KidFormValues {
  return {
    name: values.name,
    birthDate: values.birthDate,
    roomId: values.roomId,
    allergies: values.allergies,
    medicalNotes: values.medicalNotes,
  };
}

/**
 * Reads the canonical kid collection from disk.
 *
 * @returns A freshly parsed, immutable list of kids.
 */
export function getKids(): Promise<readonly Kid[]> {
  return readCollection<Kid>("kids.json");
}

/**
 * Reads the canonical room collection from disk.
 *
 * @returns A freshly parsed, immutable list of rooms.
 */
export function getRooms(): Promise<readonly Room[]> {
  return readCollection<Room>("rooms.json");
}

/**
 * Reads the canonical people collection from disk.
 *
 * @returns A freshly parsed, immutable list of people.
 */
export function getPeople(): Promise<readonly Person[]> {
  return readCollection<Person>("people.json");
}

/**
 * Reads the canonical parent-to-kid relationship collection from disk.
 *
 * @returns A freshly parsed, immutable list of parent-to-kid relationships.
 */
export function getParentKids(): Promise<readonly ParentKid[]> {
  return readCollection<ParentKid>("parent-kids.json");
}

/**
 * Finds a kid by its stable identifier.
 *
 * @param id - Stable kid identifier to find.
 * @returns The matching kid, or `null` when it does not exist.
 */
export async function getKidById(id: string): Promise<Kid | null> {
  const kids = await getKids();

  return kids.find((kid) => kid.id === id) ?? null;
}

/**
 * Finds a kid by its profile slug.
 *
 * @param slug - Profile slug to find.
 * @returns The matching kid, or `null` when it does not exist.
 */
export async function getKidBySlug(slug: string): Promise<Kid | null> {
  const kids = await getKids();

  return kids.find((kid) => kid.slug === slug) ?? null;
}

/**
 * Resolves the room assigned to a kid.
 *
 * @param kid - Kid whose room reference should be resolved.
 * @returns The assigned room, or `null` when the reference is missing.
 */
export async function getKidRoom(kid: Pick<Kid, "roomId">): Promise<Room | null> {
  const rooms = await getRooms();

  return rooms.find((room) => room.id === kid.roomId) ?? null;
}

/**
 * Resolves the safe parent data linked to a kid.
 *
 * @param kidId - Stable kid identifier whose parent relationships should be resolved.
 * @returns The linked parents whose people records still exist.
 */
export async function getLinkedParentsByKidId(kidId: string): Promise<LinkedParent[]> {
  const [parentKids, people] = await Promise.all([getParentKids(), getPeople()]);

  return parentKids
    .filter((parentKid) => parentKid.kidId === kidId)
    .flatMap((parentKid) => {
      const person = people.find((candidate) => candidate.id === parentKid.parentId);

      if (!person) {
        return [];
      }

      return [
        {
          id: person.id,
          name: person.name,
          relationship: parentKid.relationship,
          status: person.status,
        },
      ];
    });
}

/**
 * Creates and atomically persists a kid with server-managed fields.
 *
 * @param values - Validated editable values to persist.
 * @returns The newly persisted kid.
 */
export function createKid(values: KidFormValues): Promise<Kid> {
  return withWriteLock(async () => {
    const kids = await getKids();
    const editableValues = selectKidFormValues(values);
    const kid: Kid = {
      id: randomUUID(),
      slug: createUniqueSlug(editableValues.name, kids),
      ...editableValues,
      enrollmentDate: getTodayIsoDate(),
      status: "active",
    };

    await writeCollection("kids.json", [...kids, kid]);

    return kid;
  });
}

/**
 * Updates editable kid fields while preserving its stable and managed fields.
 *
 * @param id - Stable identifier of the kid to update.
 * @param values - Validated editable values to persist.
 * @returns The updated kid, or `null` when the identifier does not exist.
 */
export function updateKid(id: string, values: KidFormValues): Promise<Kid | null> {
  return withWriteLock(async () => {
    const kids = await getKids();
    const kidIndex = kids.findIndex((kid) => kid.id === id);

    if (kidIndex === -1) {
      return null;
    }

    const editableValues = selectKidFormValues(values);
    const updatedKid: Kid = {
      ...kids[kidIndex],
      ...editableValues,
    };
    const updatedKids = [...kids];
    updatedKids[kidIndex] = updatedKid;

    await writeCollection("kids.json", updatedKids);

    return updatedKid;
  });
}
