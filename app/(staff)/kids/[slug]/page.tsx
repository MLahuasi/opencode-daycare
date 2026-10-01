import { LinkButton } from "@/src/components/ui";
import {
  calculateAge,
  getKidRoom,
  getKids,
  getLinkedParentsByKidId,
} from "@/src/application/kid";
import {
  KidBasicInfo,
  KidMedicalNotes,
  KidParents,
  KidProfileActions,
  KidProfileHeader,
} from "./_components";
import styles from "./_components/kid-profile.module.css";
import { getTodayIsoDate } from "@/src/utils";
import { requireStaffSession } from "@/auth";
import { createKidComposition } from "@/src/infrastructure/composition/kid";
import { notFound } from "next/navigation";

const AVATAR_TONES = ["blue", "pink", "green", "yellow", "purple"] as const;

/**
 * Returns the canonical kid slugs generated at build time.
 *
 * @returns The canonical profile route parameters.
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const kids = await getKids(createKidComposition());

  return kids.map((kid) => ({ slug: kid.slug }));
}

/**
 * Renders a kid profile resolved from the canonical slug.
 *
 * @param props - Dynamic profile route parameters.
 * @param props.params - Promise containing the requested kid slug.
 * @returns The resolved kid profile or the route's not-found boundary.
 */
export default async function KidProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ invitation?: string | string[] }>;
}) {
  await requireStaffSession();

  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const rawInvitation = resolvedSearchParams.invitation;
  const invitationStatus = Array.isArray(rawInvitation)
    ? rawInvitation[0]
    : rawInvitation;
  const dependencies = createKidComposition();
  const kids = await getKids(dependencies);
  const kidIndex = kids.findIndex((candidate) => candidate.slug === slug);
  const kid = kids[kidIndex];

  if (!kid) {
    notFound();
  }

  const [room, linkedParents] = await Promise.all([
    getKidRoom(dependencies, kid),
    getLinkedParentsByKidId(dependencies, kid.id),
  ]);
  const roomName = room?.name ?? "Sin sala asignada";
  const age = calculateAge(kid.birthDate, getTodayIsoDate());
  const avatarTone = AVATAR_TONES[kidIndex % AVATAR_TONES.length];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <LinkButton className={styles.backLink} href="/kids" variant="ghost">
          <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver a Niños
        </LinkButton>
        {invitationStatus === "sent" ? (
          <p className={styles.invitationSuccess} role="status">
            La invitación fue enviada correctamente. El padre o la madre recibirá un correo para activar su cuenta.
          </p>
        ) : null}
        <div className={styles.profileColumns}>
          <div className={styles.profileMainColumn}>
            <KidProfileHeader
              age={age}
              avatarTone={avatarTone}
              editHref={`/kids/edit/${kid.id}`}
              kid={kid}
              roomName={roomName}
            />
            <KidMedicalNotes notes={kid.medicalNotes} />
            <KidBasicInfo kid={kid} roomName={roomName} />
          </div>
          <div className={styles.profileSideColumn}>
            <KidProfileActions />
            <KidParents kidSlug={kid.slug} parents={linkedParents} />
          </div>
        </div>
      </div>
    </main>
  );
}
