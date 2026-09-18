import { ActivateAccountForm } from "@/app/features/auth";
import type {
  ActivationInvitationState,
  ActivationKidCardData,
} from "@/app/features/auth";
import { invitations } from "@/app/data/mocks";
import {
  getKids,
  getParentKids,
  getPeople,
  getRooms,
} from "@/app/features/kids/services";

type ActivationSearchParams = {
  code?: string | string[];
};

type ActivationResolution = {
  code: string;
  email: string;
  invitationState: ActivationInvitationState;
  kid: ActivationKidCardData | null;
};

async function resolveActivation(code: string | undefined): Promise<ActivationResolution> {
  if (!code) {
    return { code: "", email: "", invitationState: "none", kid: null };
  }

  const invitation = invitations.find((candidate) => candidate.code === code);

  if (!invitation) {
    return { code, email: "", invitationState: "unknown", kid: null };
  }

  if (invitation.acceptedAt) {
    return { code, email: "", invitationState: "accepted", kid: null };
  }

  if (invitation.expiresAt <= new Date()) {
    return { code, email: "", invitationState: "expired", kid: null };
  }

  const [kids, parentKids, people, rooms] = await Promise.all([
    getKids(),
    getParentKids(),
    getPeople(),
    getRooms(),
  ]);
  const person = people.find((candidate) => candidate.id === invitation.personId);
  const parentKid = parentKids.find((candidate) => candidate.parentId === invitation.personId);
  const kid = parentKid ? kids.find((candidate) => candidate.id === parentKid.kidId) : undefined;
  const room = kid ? rooms.find((candidate) => candidate.id === kid.roomId) : undefined;

  if (!person || !kid || !room) {
    return { code, email: "", invitationState: "unknown", kid: null };
  }

  return {
    code,
    email: person.email,
    invitationState: "valid",
    kid: {
      initial: kid.name.trim().charAt(0).toUpperCase(),
      name: kid.name,
      room: room.name,
    },
  };
}

/**
 * Renders the account activation route resolved from an invitation code.
 *
 * @param props - Route search parameters.
 * @param props.searchParams - Promise containing the optional invitation code.
 * @returns The account activation page.
 */
export default async function ActivateAccountPage({
  searchParams,
}: {
  searchParams: Promise<ActivationSearchParams>;
}) {
  const params = await searchParams;
  const rawCode = params.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;
  const resolution = await resolveActivation(code);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-page)] p-10 max-sm:p-6">
      <ActivateAccountForm {...resolution} />
    </main>
  );
}
