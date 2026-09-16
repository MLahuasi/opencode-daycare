import { LinkButton } from "@/app/components/ui";
import { kids, parents } from "@/app/data/mocks";
import {
  KidBasicInfo,
  KidMedicalNotes,
  KidParents,
  KidProfileActions,
  KidProfileHeader,
} from "@/app/features/kids";
import { calculateAge } from "@/app/features/kids/utils";
import { notFound } from "next/navigation";
import styles from "@/app/features/kids/components/kid-profile.module.css";

const AVATAR_TONES = ["blue", "pink", "green", "yellow", "purple"] as const;

function getTodayIsoDate(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
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

  const linkedParents = parents.filter((parent) => kid.parentIds.includes(parent.id));
  const age = calculateAge(kid.birthDate, getTodayIsoDate());
  const avatarTone = AVATAR_TONES[kidIndex % AVATAR_TONES.length];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <LinkButton className={styles.backLink} href="/kids" variant="ghost">
          <span aria-hidden="true">←</span>
          Volver a Niños
        </LinkButton>
        <div className={styles.profileColumns}>
          <div className={styles.profileMainColumn}>
            <KidProfileHeader age={age} avatarTone={avatarTone} kid={kid} />
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
