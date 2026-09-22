import { LinkButton } from "@/app/components/ui";
import styles from "@/app/features/kids/components/kid-profile.module.css";

/**
 * Renders the accessible not-found state for an unknown kid profile slug.
 *
 * @returns The Kids profile not-found page.
 */
export default function KidNotFound() {
  return (
    <main className={styles.notFoundPage}>
      <div className={styles.notFoundCard}>
        <p className={styles.notFoundEyebrow}>Perfil no encontrado</p>
        <h1>No encontramos este perfil</h1>
        <p>El niño que buscas no existe o ya no está disponible.</p>
        <LinkButton href="/kids">Volver a Niños</LinkButton>
      </div>
    </main>
  );
}
