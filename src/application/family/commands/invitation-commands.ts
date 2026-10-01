import {
  getInvitationStatus,
  isInvitationExpired,
  type Invitation,
} from "@/src/domain/family";
import { isValidActivationPassword } from "@/src/domain/auth";
import type { Person } from "@/src/domain/person";
import type {
  CreateInvitationInput,
  CreatedInvitation,
} from "../dto/invitation";
import type { FamilyDependencies } from "../family-dependencies";
import type { FamilyAcceptanceDependencies } from "../family-dependencies";
import type { AcceptInvitationInput } from "../dto/invitation";

/** Error raised when an invitation email already belongs to a person. */
export class ExistingInvitationPersonError extends Error {}

/** Error raised when a parent is already linked to a kid. */
export class ExistingParentKidError extends Error {}

/** Error raised when the invitation cannot be accepted. */
export class InvalidInvitationAcceptanceError extends Error {}

/** Creates a pending person and invitation, without linking the parent yet. */
export async function createInvitation(
  dependencies: FamilyDependencies,
  input: CreateInvitationInput,
): Promise<CreatedInvitation> {
  const email = input.email.trim().toLowerCase();
  const existingPerson = await dependencies.people.findByEmail(email);

  if (existingPerson) {
    throw new ExistingInvitationPersonError("The invitation email already exists.");
  }

  const person: Person = {
    id: dependencies.createId(),
    name: input.name.trim(),
    email,
    role: "parent",
    status: "pending",
  };
  const now = dependencies.now();
  const invitation: Invitation = {
    id: dependencies.createId(),
    personId: person.id,
    kidId: input.kidId,
    relationship: input.relationship,
    code: dependencies.createCode(),
    expiresAt: dependencies.getInvitationExpiration(now),
    sentAt: null,
    acceptedAt: null,
  };

  await dependencies.people.create(person);
  await dependencies.invitations.create(invitation);

  return { invitation, person };
}

/** Completes the persisted Family side of an accepted invitation. */
export async function createParentKidFromInvitation(
  dependencies: FamilyDependencies,
  invitation: Invitation,
  person: Person,
  photoSharingConsent: boolean,
): Promise<void> {
  const existingParentKid = await dependencies.parentKids.findByParentAndKid(
    person.id,
    invitation.kidId,
  );

  if (existingParentKid) {
    throw new ExistingParentKidError("The parent is already linked to this kid.");
  }

  await dependencies.parentKids.create({
    id: `parent-kid-${person.id}-${invitation.kidId}`,
    parentId: person.id,
    kidId: invitation.kidId,
    relationship: invitation.relationship,
    photoSharingConsent,
  });
}

/** Validates and atomically accepts an invitation. */
export async function acceptInvitation(
  dependencies: FamilyAcceptanceDependencies,
  input: AcceptInvitationInput,
): Promise<void> {
  const invitation = await dependencies.invitations.findByCode(input.code.trim());

  if (!invitation || getInvitationStatus(invitation, dependencies.now()) !== "pending") {
    throw new InvalidInvitationAcceptanceError("The invitation is not valid.");
  }

  const person = await dependencies.people.findById(invitation.personId);
  const email = input.email.trim().toLowerCase();

  if (!person || person.email.toLowerCase() !== email) {
    throw new InvalidInvitationAcceptanceError("The invitation email does not match.");
  }

  const existingActiveParent = person.role === "parent" && person.status === "active";

  if (!existingActiveParent && (!input.password || !isValidActivationPassword(input.password))) {
    throw new InvalidInvitationAcceptanceError("The activation password is invalid.");
  }

  await dependencies.runInTransaction(async () => {
    const currentInvitation = await dependencies.invitations.findByCode(input.code.trim());

    if (
      !currentInvitation ||
      isInvitationExpired(currentInvitation, dependencies.now()) ||
      currentInvitation.acceptedAt
    ) {
      throw new InvalidInvitationAcceptanceError("The invitation is no longer valid.");
    }

    await createParentKidFromInvitation(
      dependencies,
      currentInvitation,
      person,
      input.photoSharingConsent,
    );

    if (!existingActiveParent && input.password) {
      await dependencies.credentials.upsert({
        id: `credential-${person.id}`,
        personId: person.id,
        passwordHash: await dependencies.passwordHasher.hash(input.password),
      });
      await dependencies.people.update({ ...person, status: "active" });
    }

    const acceptedAt = dependencies.now().toISOString();
    const acceptedInvitation = await dependencies.invitations.markAccepted(
      currentInvitation.id,
      acceptedAt,
    );

    if (!acceptedInvitation) {
      throw new InvalidInvitationAcceptanceError("The invitation could not be accepted.");
    }
  });
}
