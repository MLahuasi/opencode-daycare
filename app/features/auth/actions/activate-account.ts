"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import {
  readCollection,
  withJsonTransaction,
  writeCollection,
} from "@/app/infrastructure";
import type { ParentKid } from "@/app/features/family";
import type { Person } from "@/app/features/people";
import { isInvitationExpired, isValidActivationPassword } from "../utils";
import type { Credential, Invitation } from "../types";

export type ActivationActionErrors = {
  code?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
};

/** Serializable feedback returned by the account activation action. */
export type ActivationActionState = {
  errors: ActivationActionErrors;
  message: string;
};

const EMPTY_ERRORS: ActivationActionErrors = {};

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function getValidationErrors(
  code: string,
  email: string,
  password: string,
  passwordConfirmation: string,
  requiresNewCredentials: boolean,
): ActivationActionErrors {
  const errors: ActivationActionErrors = {};

  if (!code) {
    errors.code = "Ingresa el código de invitación.";
  }

  if (!email) {
    errors.email = "Ingresa tu email.";
  }

  if (requiresNewCredentials && !password) {
    errors.password = "Ingresa una contraseña.";
  }

  if (requiresNewCredentials && !passwordConfirmation) {
    errors.passwordConfirmation = "Confirma tu contraseña.";
  }

  if (
    requiresNewCredentials &&
    password &&
    passwordConfirmation &&
    password !== passwordConfirmation
  ) {
    errors.passwordConfirmation = "Las contraseñas no coinciden.";
  }

  return errors;
}

/**
 * Activates an invited account and persists all related records atomically.
 *
 * @param _previousState - Previous form feedback required by the action contract.
 * @param formData - Submitted invitation and password fields.
 * @returns Validation or persistence feedback when activation cannot complete.
 */
export async function activateAccountAction(
  _previousState: ActivationActionState,
  formData: FormData,
): Promise<ActivationActionState> {
  const code = readText(formData, "code");
  const email = readText(formData, "email").toLowerCase();
  const password = readText(formData, "password");
  const passwordConfirmation = readText(formData, "passwordConfirmation");
  const invitations = await readCollection<Invitation>("invitation.json");
  const invitation = invitations.find((candidate) => candidate.code === code);

  if (!invitation) {
    return {
      errors: { code: "El código de invitación no es válido." },
      message: "No pudimos activar la cuenta.",
    };
  }

  if (invitation.acceptedAt) {
    return {
      errors: { code: "El código de invitación ya fue utilizado." },
      message: "No pudimos activar la cuenta.",
    };
  }

  if (isInvitationExpired(invitation)) {
    return {
      errors: { code: "El código de invitación ya venció." },
      message: "No pudimos activar la cuenta.",
    };
  }

  const people = await readCollection<Person>("people.json");
  const person = people.find((candidate) => candidate.id === invitation.personId);

  if (!person || person.email.toLowerCase() !== email) {
    return {
      errors: { email: "El email no coincide con la invitación." },
      message: "No pudimos activar la cuenta.",
    };
  }

  if (
    person.role !== "parent" ||
    (person.status !== "pending" && person.status !== "active")
  ) {
    return {
      errors: {
        code: "La invitación no corresponde a una cuenta de familia válida.",
      },
      message: "No pudimos activar la cuenta.",
    };
  }

  const existingActiveParent = person.role === "parent" && person.status === "active";
  const errors = getValidationErrors(
    code,
    email,
    password,
    passwordConfirmation,
    !existingActiveParent,
  );

  if (Object.keys(errors).length > 0) {
    return { errors, message: "Revisa los campos marcados." };
  }

  if (!existingActiveParent && !isValidActivationPassword(password)) {
    return {
      errors: {
        password:
          "Usa al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.",
      },
      message: "Revisa los campos marcados.",
    };
  }

  const photoSharingConsent = formData.get("photoSharingConsent") !== null;
  const passwordHash = existingActiveParent
    ? null
    : await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  try {
    await withJsonTransaction(
      ["credential.json", "people.json", "parent-kids.json", "invitation.json"],
      async () => {
        const [credentials, currentPeople, parentKids, currentInvitations] =
          await Promise.all([
            readCollection<Credential>("credential.json"),
            readCollection<Person>("people.json"),
            readCollection<ParentKid>("parent-kids.json"),
            readCollection<Invitation>("invitation.json"),
          ]);
        const credential: Credential | null = passwordHash
          ? {
              id: `credential-${person.id}`,
              personId: person.id,
              passwordHash,
            }
          : null;
        const alreadyLinked = parentKids.some(
          (candidate) =>
            candidate.parentId === person.id && candidate.kidId === invitation.kidId,
        );

        if (alreadyLinked) {
          throw new Error("The parent is already linked to this kid.");
        }
        const updatedPeople = existingActiveParent
          ? currentPeople
          : currentPeople.map((candidate) =>
              candidate.id === person.id
                ? { ...candidate, status: "active" as const }
                : candidate,
            );
        const updatedParentKids = [
          ...parentKids.filter(
            (candidate) =>
              !(
                candidate.parentId === person.id &&
                candidate.kidId === invitation.kidId
              ),
          ),
          {
            id: `parent-kid-${person.id}-${invitation.kidId}`,
            parentId: person.id,
            kidId: invitation.kidId,
            relationship: invitation.relationship,
            photoSharingConsent,
          },
        ];
        const updatedInvitations = currentInvitations.map((candidate) =>
          candidate.id === invitation.id
            ? { ...candidate, acceptedAt: now }
            : candidate,
        );

        if (credential) {
          await writeCollection("credential.json", [
            ...credentials.filter((candidate) => candidate.personId !== person.id),
            credential,
          ]);
        }
        await writeCollection("people.json", updatedPeople);
        await writeCollection("parent-kids.json", updatedParentKids);
        await writeCollection("invitation.json", updatedInvitations);
      },
    );
  } catch {
    return {
      errors: EMPTY_ERRORS,
      message: "No pudimos activar la cuenta. Inténtalo nuevamente.",
    };
  }

  redirect(existingActiveParent ? "/auth/login" : "/auth/login?activated=1");
}
