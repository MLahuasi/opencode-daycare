import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  Kid,
  LinkedParent,
  ParentKid,
  Person,
  Room,
} from "../types";

type KidCollectionFile =
  | "kids.json"
  | "parent-kids.json"
  | "people.json"
  | "rooms.json";

const KIDS_DATA_DIRECTORY = path.join(
  process.cwd(),
  "app",
  "data",
  "mocks",
  "kids",
);

async function readCollection<T>(fileName: KidCollectionFile): Promise<readonly T[]> {
  const filePath = path.join(KIDS_DATA_DIRECTORY, fileName);
  const contents = await readFile(filePath, "utf8");
  const collection: unknown = JSON.parse(contents);

  if (!Array.isArray(collection)) {
    throw new Error(`Expected ${fileName} to contain a JSON array.`);
  }

  return collection as T[];
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
