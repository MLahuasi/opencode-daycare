import "server-only";

import { randomUUID } from "node:crypto";
import type { Person } from "@/app/features/people";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/app/infrastructure/persistence";

/**
 * Creates and persists a pending parent person.
 *
 * @param values - Normalized parent identity values.
 * @param values.name - Parent's full name.
 * @param values.email - Parent's normalized email address.
 * @returns The newly persisted pending parent.
 * @throws When another person already uses the email address.
 */
export function createPendingParent(values: Pick<Person, "name" | "email">): Promise<Person> {
  return withWriteLock(async () => {
    const people = await readCollection<Person>("people.json");
    const emailAlreadyExists = people.some(
      (person) => person.email.trim().toLowerCase() === values.email,
    );

    if (emailAlreadyExists) {
      throw new Error("A person with this email already exists.");
    }

    const parent: Person = {
      id: randomUUID(),
      name: values.name,
      email: values.email,
      role: "parent",
      status: "pending",
    };

    await writeCollection("people.json", [...people, parent]);

    return parent;
  });
}
