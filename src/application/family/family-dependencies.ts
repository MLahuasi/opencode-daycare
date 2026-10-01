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
  InvitationRepository,
  TransactionRunner,
} from "./ports";

/** Persistence and clock capabilities required by Family use cases. */
export type FamilyDependencies = {
  /** Invitation persistence port. */
  invitations: InvitationRepository;
  /** Person persistence port. */
  people: FamilyPersonRepository;
  /** Parent-kid relationship persistence port. */
  parentKids: FamilyParentKidRepository;
  /** Stable identifier generation port. */
  identifiers: IdentifierGenerator;
  /** Invitation token generation port. */
  invitationCodes: InvitationCodeGenerator;
  /** Invitation expiration policy port. */
  invitationExpiration: InvitationExpirationPolicy;
  /** Current-time provider. */
  clock: Clock;
  /** Atomic write transaction port. */
  transaction: TransactionRunner;
};

/** Additional capabilities required to activate invitation credentials. */
export type FamilyAcceptanceDependencies = FamilyDependencies & {
  /** Credential persistence port from Auth. */
  credentials: import("../auth/ports").CredentialRepository;
  /** Password hashing port from Auth. */
  passwordHasher: import("../auth/ports").PasswordHasher;
};

/** Creates a pending person and invitation without creating ParentKid. */
export type CreateInvitation = (
  input: CreateInvitationInput,
) => Promise<CreatedInvitation>;
