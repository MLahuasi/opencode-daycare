import type { Invitation, ParentKid } from "@/src/domain/family";
import type { Person } from "@/src/domain/person";
import type {
  CreateInvitationInput,
  CreatedInvitation,
} from "./dto/invitation";

/** Persistence and clock capabilities required by Family use cases. */
export type FamilyDependencies = {
  invitations: {
    findByCode(code: string): Promise<Invitation | null>;
    create(invitation: Invitation): Promise<void>;
    markAccepted(id: string, acceptedAt: string): Promise<Invitation | null>;
  };
  people: {
    findById(id: string): Promise<Person | null>;
    findByEmail(email: string): Promise<Person | null>;
    create(person: Person): Promise<void>;
    update(person: Person): Promise<void>;
  };
  parentKids: {
    findByParentAndKid(parentId: string, kidId: string): Promise<ParentKid | null>;
    create(parentKid: ParentKid): Promise<void>;
  };
  createId(): string;
  createCode(): string;
  getInvitationExpiration(now: Date): string;
  now(): Date;
  runInTransaction<T>(operation: () => Promise<T>): Promise<T>;
};

/** Additional capabilities required to activate invitation credentials. */
export type FamilyAcceptanceDependencies = FamilyDependencies & {
  credentials: {
    upsert(credential: {
      id: string;
      personId: string;
      passwordHash: string;
    }): Promise<void>;
  };
  passwordHasher: {
    hash(password: string): Promise<string>;
  };
};

/** Creates a pending person and invitation without creating ParentKid. */
export type CreateInvitation = (
  input: CreateInvitationInput,
) => Promise<CreatedInvitation>;
