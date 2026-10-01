import styles from "./kid-profile.module.css";

type KidMedicalNotesProps = {
  notes: string;
};

/**
 * Renders the medical notes area of a kid profile.
 *
 * @param props - Medical notes content.
 * @param props.notes - Notes to display on the profile.
 * @returns A visually distinguished medical notes panel.
 */
export function KidMedicalNotes({ notes }: KidMedicalNotesProps) {
  return (
    <section aria-labelledby="medical-notes-heading" className={styles.medicalNotes}>
      <span aria-hidden="true" className={styles.medicalIcon}>
        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="m10.3 3.9-8.5 14a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3l-8.5-14a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </span>
      <div>
        <h2 id="medical-notes-heading">Alergias y notas</h2>
        <p>{notes}</p>
      </div>
    </section>
  );
}
