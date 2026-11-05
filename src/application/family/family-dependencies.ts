import type {
  CreateInvitationInput,
  CreatedInvitation,
} from "./dto/invitation";
import type {
  Clock,
  FamilyParentKidRepository,
  FamilyPersonRepository,
  IdentifierGenerator,
  InvitationCodeGenerator,
  InvitationExpirationPolicy,
  InvitationMailer,
  InvitationRepository,
} from "./ports";
import type { AuthTransactionRunner } from "../auth/ports";
import type { KidRepository } from "../kid/ports";

/** Persistence and clock capabilities required by Family use cases. */
export type FamilyDependencies = {
  /** Invitation persistence port. */
  invitations: InvitationRepository;
  /** Person persistence port. */
  people: FamilyPersonRepository;
  /** Parent-kid relationship persistence port. */
  parentKids: FamilyParentKidRepository;
  /** Kid lookup used to resolve the invitation tenant. */
  kids: KidRepository;
  /** Stable identifier generation port. */
  identifiers: IdentifierGenerator;
  /** Invitation token generation port. */
  invitationCodes: InvitationCodeGenerator;
  /** Invitation expiration policy port. */
  invitationExpiration: InvitationExpirationPolicy;
  /** Current-time provider. */
  clock: Clock;
  /** Atomic write transaction port. */
  transaction: AuthTransactionRunner;
  /** Invitation email delivery port. */
  mailer: InvitationMailer;
};

/** Additional capabilities required to activate invitation credentials. */
export type FamilyAcceptanceDependencies = FamilyDependencies & {
  /** Credential persistence port from Auth. */
  credentials: import("../auth/ports").CredentialRepository;
  /** Password hashing port from Auth. */
  passwordHasher: import("../auth/ports").PasswordHasher;
};

/**
 * Creates a pending person and invitation without creating ParentKid.
 *
 * @param input - Person and kid data required for the invitation.
 * @returns The created person and invitation records.
 */
export type CreateInvitation = (
  input: CreateInvitationInput,
) => Promise<CreatedInvitation>;
