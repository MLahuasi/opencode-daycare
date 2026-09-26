import {
  Avatar,
  Badge,
  CommentIcon,
  LinkButton,
  PhotoIcon,
  type BadgeVariant,
} from "@/app/components/ui";
import type { PostDetail } from "../types";
import styles from "./post-detail-view.module.css";

const postTypeLabels: Record<PostDetail["post"]["type"], string> = {
  achievement: "Logro",
  activity: "Actividad",
  announcement: "Anuncio",
  food: "Alimentación",
  mood: "Estado de ánimo",
  nap: "Descanso",
};

const postTypeBadgeVariants: Record<PostDetail["post"]["type"], BadgeVariant> = {
  achievement: "green",
  activity: "blue",
  announcement: "announcement",
  food: "yellow",
  mood: "pink",
  nap: "purple",
};

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

type PostDetailViewProps = {
  backHref: string;
  className?: string;
  detail: PostDetail;
};

/**
 * Renders an authorized post detail in read-only mode.
 *
 * @param props - Detail content and role-specific return destination.
 * @param props.backHref - Feed URL used by the return link.
 * @param props.className - Optional classes applied to the content landmark.
 * @param props.detail - Server-authorized post detail projection.
 * @returns The visual post detail and its read-only relationships.
 */
export function PostDetailView({
  backHref,
  className = "",
  detail,
}: PostDetailViewProps) {
  const { author, comments, post, reactions, recipient } = detail;

  return (
    <main className={`${styles.main} ${className}`}>
      <div className={styles.container}>
        <LinkButton className={styles.backLink} href={backHref} variant="ghost">
          <span aria-hidden="true" className={styles.backIcon}>
            ←
          </span>
          Volver al feed
        </LinkButton>

        <article className={styles.card}>
          <header className={styles.postHeader}>
            <Avatar initial={getInitial(post.subject)} size="lg" tone="blue" />
            <div className={styles.headingCopy}>
              <h1>{recipient.kind === "kid" ? recipient.label.replace(/^familia de /, "") : recipient.label}</h1>
              <p>
                <time dateTime={post.createdAt}>{detail.createdAtLabel}</time>
                <span aria-hidden="true"> · </span>
                {author.name}
                <span aria-hidden="true"> · </span>
                {recipient.label}
              </p>
            </div>
            <Badge className={styles.typeBadge} variant={postTypeBadgeVariants[post.type]}>
              <span aria-hidden="true" className={styles.typeDot} />
              {postTypeLabels[post.type]}
            </Badge>
          </header>

          <p className={styles.body}>{post.body}</p>

          {post.media.length > 0 ? (
            <div className={styles.mediaGallery}>
              {post.media.map((media) => (
                <figure className={styles.mediaFigure} key={media.id}>
                  {media.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={media.alt ?? media.originalName} src={media.url} />
                  ) : (
                    <div aria-label="Imagen no disponible" className={styles.mediaPlaceholder} role="img">
                      <PhotoIcon />
                      <span>Imagen no disponible</span>
                    </div>
                  )}
                  <figcaption>{media.alt ?? media.originalName}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className={styles.emptyMedia} role="status">
              <PhotoIcon />
              <span>Esta publicación no tiene imágenes.</span>
            </div>
          )}

          <div className={styles.reactionSummary} aria-label={`${reactions.length} reacciones`}>
            <span className={styles.reactionAvatars}>
              {reactions.slice(0, 3).map((reaction) => (
                <Avatar
                  className={styles.reactionAvatar}
                  initial={getInitial(reaction.person.name)}
                  key={reaction.id}
                  size="sm"
                  tone="purple"
                />
              ))}
            </span>
            <span>
              {reactions.length === 0
                ? "Aún no hay reacciones"
                : `${reactions.length} ${reactions.length === 1 ? "persona" : "personas"} reaccionaron`}
            </span>
          </div>
        </article>

        <section aria-labelledby="comments-heading" className={styles.commentsSection}>
          <h2 id="comments-heading">Comentarios · {comments.length}</h2>
          {comments.length > 0 ? (
            <div className={styles.commentsList}>
              {comments.map((comment) => (
                <article className={styles.comment} key={comment.id}>
                  <Avatar initial={getInitial(comment.author.name)} tone="purple" />
                  <div className={styles.commentBody}>
                    <header className={styles.commentHeader}>
                      <strong>{comment.author.name}</strong>
                      <span>{comment.author.role === "personal" ? "· maestra" : "· familia"}</span>
                      <time dateTime={comment.createdAt}>{comment.timeLabel}</time>
                    </header>
                    <p>{comment.body}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyComments} role="status">
              Todavía no hay comentarios en esta publicación.
            </p>
          )}
          <div className={styles.readOnlyNotice} role="note">
            <CommentIcon />
            <span>Los comentarios se muestran en modo lectura.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
