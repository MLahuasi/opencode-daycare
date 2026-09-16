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
      <span aria-hidden="true" className={styles.medicalIcon}>!</span>
      <div>
        <h2 id="medical-notes-heading">Alergias y notas</h2>
        <p>{notes}</p>
      </div>
    </section>
  );
}
