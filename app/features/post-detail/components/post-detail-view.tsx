import {
  Avatar,
  Badge,
  LinkButton,
  PhotoIcon,
  type BadgeVariant,
} from "@/src/components/ui";
import { DeleteCommentButton } from "@/app/features/family";
import { deleteFeedCommentAction } from "@/app/features/family/server";
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
  viewerPersonId?: string;
};

/**
 * Renders an authorized post detail in read-only mode.
 *
 * @param props - Detail content and role-specific return destination.
 * @param props.backHref - Feed URL used by the return link.
 * @param props.className - Optional classes applied to the content landmark.
 * @param props.detail - Server-authorized post detail projection.
 * @param props.viewerPersonId - Authenticated person's identifier, when available.
 * @returns The visual post detail and its read-only relationships.
 */
export function PostDetailView({
  backHref,
  className = "",
  detail,
  viewerPersonId,
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
          <div className={styles.commentsHeading}>
            <h2 id="comments-heading">Comentarios · {comments.length}</h2>
            {detail.viewerRole === "parent" || detail.viewerRole === "personal" ? (
              <LinkButton
                href={`/post-comment/new?postId=${encodeURIComponent(post.id)}`}
                variant="soft"
              >
                Comentar
              </LinkButton>
            ) : null}
          </div>
          {comments.length > 0 ? (
            <div className={styles.commentsList}>
              {comments.map((comment) => (
                <article className={styles.comment} key={comment.id}>
                  <Avatar initial={getInitial(comment.author.name)} tone="purple" />
                  <div className={styles.commentBody}>
                    <header className={styles.commentHeader}>
                      <strong>{comment.author.name}</strong>
                      <span>{comment.author.role === "personal" ? "· maestra" : "· familia"}</span>
                      <time dateTime={comment.createdAt}>
                        {comment.timeLabel}
                        {comment.updatedAt ? " · editado" : ""}
                      </time>
                    </header>
                    <p>{comment.body}</p>
                    {(detail.viewerRole === "parent" || detail.viewerRole === "personal") &&
                    comment.authorId === viewerPersonId ? (
                      <div className={styles.commentActions}>
                        <LinkButton
                          href={`/post-comment/edit?id=${encodeURIComponent(comment.id)}`}
                          variant="ghost"
                        >
                          Editar
                        </LinkButton>
                        <DeleteCommentButton
                          action={deleteFeedCommentAction}
                          className={styles.deleteAction}
                          commentId={comment.id}
                          postId={post.id}
                        />
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyComments} role="status">
              Todavía no hay comentarios en esta publicación.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
