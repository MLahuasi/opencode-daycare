import { LinkButton } from "@/app/components/ui";
import {
  calculateAge,
  KidBasicInfo,
  KidMedicalNotes,
  KidParents,
  KidProfileActions,
  KidProfileHeader,
  kidProfileStyles as styles,
} from "@/app/features/kids";
import {
  getKidRoom,
  getKids,
  getLinkedParentsByKidId,
} from "@/app/features/kids/server";
import { getTodayIsoDate } from "@/app/shared";
import { requireStaffSession } from "@/auth";
import { notFound } from "next/navigation";

const AVATAR_TONES = ["blue", "pink", "green", "yellow", "purple"] as const;

/**
 * Returns the canonical kid slugs generated at build time.
 *
 * @returns The canonical profile route parameters.
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const kids = await getKids();

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
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireStaffSession();

  const { slug } = await params;
  const kids = await getKids();
  const kidIndex = kids.findIndex((candidate) => candidate.slug === slug);
  const kid = kids[kidIndex];

  if (!kid) {
    notFound();
  }

  const [room, linkedParents] = await Promise.all([
    getKidRoom(kid),
    getLinkedParentsByKidId(kid.id),
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
            <KidParents parents={linkedParents} />
          </div>
        </div>
      </div>
    </main>
  );
}
