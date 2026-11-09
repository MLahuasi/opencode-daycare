import {
  getInvitationStatus,
  isInvitationExpired,
  type Invitation,
} from "@/domain/family";
import { isValidActivationPassword } from "@/domain/auth";
import type { Person } from "@/domain/person";
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

/** Error raised when an invitation duplicates an existing parent-kid link. */
export class ExistingInvitationParentKidError extends Error {}

/** Error raised when the invitation cannot be accepted. */
export class InvalidInvitationAcceptanceError extends Error {}

/**
 * Creates a pending person and invitation, without linking the parent yet.
 *
 * @param dependencies - Ports and factories required to persist the invitation.
 * @param input - Parent and kid values used to create the invitation.
 * @param input.name - Parent display name.
 * @param input.email - Parent email address.
 * @param input.kidId - Stable kid identifier.
 * @param input.relationship - Parent relationship with the kid.
 * @returns The newly created pending person and invitation.
 * @throws ExistingInvitationPersonError when the email belongs to another role.
 * @throws ExistingInvitationParentKidError when the parent is already linked to the kid.
 */
export async function createInvitation(
  dependencies: FamilyDependencies,
  input: CreateInvitationInput,
): Promise<CreatedInvitation> {
  const email = input.email.trim().toLowerCase();
  const kid = await dependencies.kids.findById(input.kidId);

  if (!kid) {
    throw new Error("Cannot create an invitation for a missing kid.");
  }

  const existingPerson = await dependencies.people.findByEmail(kid.daycareId, email);

  if (existingPerson && !existingPerson.roles.includes("parent")) {
    throw new ExistingInvitationPersonError(
      "The invitation email belongs to a non-parent person.",
    );
  }

  const person: Person = existingPerson ?? {
    daycareId: kid.daycareId,
    id: dependencies.identifiers.create(),
    name: input.name.trim(),
    email,
    roles: ["parent"],
    status: "pending",
  };
  const existingParentKid = await dependencies.parentKids.findByParentAndKid(
    person.id,
    input.kidId,
  );

  if (existingParentKid) {
    throw new ExistingInvitationParentKidError(
      "The parent is already linked to this kid.",
    );
  }

  const now = dependencies.clock.now();
  const invitation: Invitation = {
    daycareId: person.daycareId,
    id: dependencies.identifiers.create(),
    personId: person.id,
    kidId: input.kidId,
    relationship: input.relationship,
    code: dependencies.invitationCodes.create(
      (await dependencies.invitations.findAll()).map((candidate) => candidate.code),
    ),
    expiresAt: dependencies.invitationExpiration.getExpiration(now),
    sentAt: null,
    acceptedAt: null,
  };

  if (!existingPerson) {
    await dependencies.people.create(person);
  }
  await dependencies.invitations.create(invitation);

  return { invitation, person };
}

/**
 * Completes the persisted Family side of an accepted invitation.
 *
 * @param dependencies - Ports required to inspect and persist relationships.
 * @param invitation - Invitation being accepted.
 * @param person - Person accepting the invitation.
 * @param photoSharingConsent - Whether photo sharing is allowed.
 * @returns A promise that resolves after the ParentKid relationship is stored.
 * @throws ExistingParentKidError when the relationship already exists.
 */
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
    id: dependencies.identifiers.create(),
    daycareId: invitation.daycareId,
    parentId: person.id,
    kidId: invitation.kidId,
    relationship: invitation.relationship,
    photoSharingConsent,
  });
}

/**
 * Validates and atomically accepts an invitation.
 *
 * @param dependencies - Family and credential ports used by the transaction.
 * @param input - Token, email, password and consent submitted by the parent.
 * @param input.code - Invitation token from the email URL.
 * @param input.email - Email address supplied by the parent.
 * @param input.password - New password for a pending parent account.
 * @param input.photoSharingConsent - Whether photo sharing is allowed.
 * @returns A promise that resolves after account activation and linking finish.
 * @throws InvalidInvitationAcceptanceError when validation or persistence fails.
 */
export async function acceptInvitation(
  dependencies: FamilyAcceptanceDependencies,
  input: AcceptInvitationInput,
): Promise<void> {
  const invitation = await dependencies.invitations.findByCode(input.code.trim());

  if (
    !invitation ||
    invitation.daycareId !== input.daycareId ||
    getInvitationStatus(invitation, dependencies.clock.now()) !== "pending"
  ) {
    throw new InvalidInvitationAcceptanceError("The invitation is not valid.");
  }

  const person = await dependencies.people.findById(invitation.personId);
  const email = input.email.trim().toLowerCase();

  if (!person || person.email.toLowerCase() !== email) {
    throw new InvalidInvitationAcceptanceError("The invitation email does not match.");
  }

  const existingActiveParent = person.roles.includes("parent") && person.status === "active";

  if (!existingActiveParent && (!input.password || !isValidActivationPassword(input.password))) {
    throw new InvalidInvitationAcceptanceError("The activation password is invalid.");
  }

  const parentKidId = dependencies.identifiers.create();

  await dependencies.transaction.run(async (transactionRepositories) => {
    const currentInvitation = transactionRepositories
      ? await transactionRepositories.invitations.findByCode(
          invitation.daycareId,
          input.code.trim(),
        )
      : await dependencies.invitations.findByCode(input.code.trim());

    if (
      !currentInvitation ||
      isInvitationExpired(currentInvitation, dependencies.clock.now()) ||
      currentInvitation.acceptedAt
    ) {
      throw new InvalidInvitationAcceptanceError("The invitation is no longer valid.");
    }

    if (transactionRepositories) {
      const transactionPerson = await transactionRepositories.people.findById(
        invitation.daycareId,
        person.id,
      );
      const existingParentKid = await transactionRepositories.parentKids.findByParentAndKid(
        invitation.daycareId,
        person.id,
        currentInvitation.kidId,
      );

      if (!transactionPerson || existingParentKid) {
        throw new ExistingParentKidError("The parent is already linked to this kid.");
      }

      await transactionRepositories.parentKids.create({
        id: parentKidId,
        daycareId: currentInvitation.daycareId,
        parentId: person.id,
        kidId: currentInvitation.kidId,
        relationship: currentInvitation.relationship,
        photoSharingConsent: input.photoSharingConsent,
      });
    } else {
      await createParentKidFromInvitation(
        dependencies,
        currentInvitation,
        person,
        input.photoSharingConsent,
      );
    }

    if (!existingActiveParent && input.password) {
      const credential = {
        daycareId: person.daycareId,
        id: dependencies.identifiers.create(),
        personId: person.id,
        passwordHash: await dependencies.passwordHasher.hash(input.password),
      };

      if (transactionRepositories) {
        await transactionRepositories.credentials.upsert(credential);
        await transactionRepositories.people.ensureRole(
          person.daycareId,
          person.id,
          "parent",
        );
        await transactionRepositories.people.update({ ...person, status: "active" });
      } else {
        await dependencies.credentials.upsert(credential);
        await dependencies.people.update({ ...person, status: "active" });
      }
    }

    const acceptedAt = dependencies.clock.now().toISOString();
    const acceptedInvitation = transactionRepositories
      ? await transactionRepositories.invitations.markAccepted(
          invitation.daycareId,
          currentInvitation.id,
          acceptedAt,
        )
      : await dependencies.invitations.markAccepted(currentInvitation.id, acceptedAt);

    if (!acceptedInvitation) {
      throw new InvalidInvitationAcceptanceError("The invitation could not be accepted.");
    }
  });
}
