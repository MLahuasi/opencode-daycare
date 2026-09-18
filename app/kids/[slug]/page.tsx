import { LinkButton } from "@/app/components/ui";
import { kids, parentKids, people } from "@/app/data/mocks";
import {
  KidBasicInfo,
  KidMedicalNotes,
  KidParents,
  KidProfileActions,
  KidProfileHeader,
} from "@/app/features/kids";
import { calculateAge } from "@/app/features/kids/utils";
import { getTodayIsoDate } from "@/app/shared";
import { notFound } from "next/navigation";
import styles from "@/app/features/kids/components/kid-profile.module.css";

const AVATAR_TONES = ["blue", "pink", "green", "yellow", "purple"] as const;

/**
 * Returns the canonical kid slugs generated at build time.
 *
 * @returns The eight static profile route parameters.
 */
export function generateStaticParams(): Array<{ slug: string }> {
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
  const { slug } = await params;
  const kidIndex = kids.findIndex((candidate) => candidate.slug === slug);
  const kid = kids[kidIndex];

  if (!kid) {
    notFound();
  }

  const linkedParents = parentKids
    .filter((parentKid) => parentKid.kidId === kid.id)
    .map((parentKid) => {
      const person = people.find((candidate) => candidate.id === parentKid.parentId);

      if (!person) {
        return null;
      }

      return {
        id: person.id,
        name: person.name,
        relationship: parentKid.relationship,
        status: person.status,
      };
    })
    .filter((parent): parent is NonNullable<typeof parent> => parent !== null);
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
              editHref={`/kids/${kid.id}/edit`}
              kid={kid}
            />
            <KidMedicalNotes notes={kid.medicalNotes} />
            <KidBasicInfo kid={kid} />
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
