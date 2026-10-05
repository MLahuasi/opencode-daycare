import { randomUUID } from "node:crypto";
import { getTodayIsoDate } from "@/utils";
import type { Kid } from "@/domain/kid";
import type { KidDependencies } from "../kid-dependencies";
import type { KidFormValues } from "../dto";
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
 * Creates and persists a Kid with server-managed fields.
 *
 * @param dependencies - Ports used to read and persist Kids.
 * @param values - Validated editable values to persist.
 * @returns The newly persisted Kid.
 */
export async function createKid(
  dependencies: KidDependencies,
  values: KidFormValues,
): Promise<Kid> {
  const kids = await dependencies.kids.findAll();
  const editableValues = selectKidFormValues(values);
  const kid: Kid = {
    id: randomUUID(),
    slug: createUniqueSlug(editableValues.name, kids),
    ...editableValues,
    enrollmentDate: getTodayIsoDate(),
    status: "active",
  };

  await dependencies.kids.create(kid);

  return kid;
}

/**
 * Updates editable Kid fields while preserving managed fields.
 *
 * @param dependencies - Ports used to read and persist Kids.
 * @param id - Stable identifier of the Kid to update.
 * @param values - Validated editable values to persist.
 * @returns The updated Kid, or null when the identifier does not exist.
 */
export async function updateKid(
  dependencies: KidDependencies,
  id: string,
  values: KidFormValues,
): Promise<Kid | null> {
  const kid = await dependencies.kids.findById(id);

  if (!kid) {
    return null;
  }

  const updatedKid: Kid = {
    ...kid,
    ...selectKidFormValues(values),
  };

  await dependencies.kids.update(updatedKid);

  return updatedKid;
}
