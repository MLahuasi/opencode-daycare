import { LinkButton } from "@/app/components/ui";

/**
 * Renders the neutral fallback for missing or unauthorized post details.
 *
 * @returns An accessible not-found state without disclosing authorization data.
 */
export default function PostDetailNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <section
        aria-labelledby="post-detail-not-found-title"
        className="w-full max-w-lg rounded-[22px] border border-(--color-border) bg-(--color-surface) p-8 text-center shadow-(--shadow-card)"
      >
        <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.12em] text-(--color-muted)">
          Detalle de publicación
        </p>
        <h1
          className="font-display text-2xl font-semibold text-foreground"
          id="post-detail-not-found-title"
        >
          Esta publicación no está disponible
        </h1>
        <p className="mt-3 text-(--color-text)">
          La publicación no existe o no tienes autorización para verla.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <LinkButton href="/home" variant="soft">
            Volver al inicio
          </LinkButton>
          <LinkButton href="/family-feed" variant="ghost">
            Ir al feed familiar
          </LinkButton>
        </div>
      </section>
    </main>
  );
}
