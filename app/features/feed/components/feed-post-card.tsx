"use client";

import {
  Avatar,
  Badge,
  CommentIcon,
  HeartIcon,
  LinkButton,
  PhotoIcon,
  type BadgeVariant,
} from "@/src/components/ui";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { FeedPost, PostType } from "../types";
import styles from "./feed-post-card.module.css";

type FeedPostCardProps = {
  canEdit?: boolean;
  canReact?: boolean;
  commentHref?: string;
  post: FeedPost;
  className?: string;
  onToggleReaction?: (
    postId: string,
  ) => Promise<{ success: boolean; active?: boolean; message?: string }>;
};

const postTypeLabels: Record<PostType, string> = {
  food: "Alimentación",
  nap: "Descanso",
  achievement: "Logro",
  activity: "Actividad",
  mood: "Estado de ánimo",
  announcement: "Anuncio",
};

const postTypeBadgeVariants: Record<PostType, BadgeVariant> = {
  food: "yellow",
  nap: "purple",
  achievement: "green",
  activity: "blue",
  mood: "pink",
  announcement: "announcement",
};

/**
 * Renders the icon for a post's category badge.
 *
 * @param props - Category icon configuration.
 * @param props.type - Post category that determines the displayed icon.
 * @returns An inline SVG category icon.
 */
function PostTypeIcon({ type }: { type: PostType }) {
  return <span aria-hidden="true" className={styles.tagDot} data-post-type={type} />;
}

/**
 * Renders the decorative announcement avatar icon.
 *
 * @returns An inline SVG megaphone icon.
 */
function AnnouncementIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

/**
 * Renders the static illustration for a media placeholder.
 *
 * @returns An inline SVG photo icon.
 */
/**
 * Renders a static feed publication using its category-specific visual treatment.
 *
 * @param props - Feed card configuration.
 * @param props.canEdit - Whether to render the staff edit destination.
 * @param props.commentHref - Optional destination used to create a comment.
 * @param props.post - Static publication data to display.
 * @param props.className - Optional classes that customize the card container.
 * @returns A feed publication article.
 */
export function FeedPostCard({
  canEdit = true,
  canReact = false,
  commentHref,
  className = "",
  onToggleReaction,
  post,
}: FeedPostCardProps) {
  const [expandedMedia, setExpandedMedia] = useState<{
    alt: string;
    url: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [reactionError, setReactionError] = useState<string | null>(null);
  const [reactionState, setReactionState] = useState({
    active: post.engagement.viewerHasLoved,
    count: post.engagement.reactionCount,
  });
  const isAnnouncement = post.type === "announcement";
  const mediaPlaceholderLabel = post.mediaLabel
    ? `Foto · ${post.mediaLabel}`
    : "Imagen adjunta";

  function handleReactionClick() {
    if (!canReact || !onToggleReaction || isPending) return;

    setReactionError(null);
    startTransition(async () => {
      const result = await onToggleReaction(post.id);

      if (!result.success) {
        setReactionError(result.message ?? "No pudimos actualizar tu reacción.");
        return;
      }

      setReactionState((current) => ({
        active: result.active ?? false,
        count: current.count + (result.active ? 1 : -1),
      }));
    });
  }

  useEffect(() => {
    if (!expandedMedia) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpandedMedia(null);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [expandedMedia]);

  return (
    <article className={`${styles.card} ${styles[post.type]} ${className}`}>
      <LinkButton
        aria-label={`Abrir publicación de ${post.subject}`}
        className={styles.detailLink}
        href={`/post-detail?id=${post.id}`}
        variant="ghost"
      >
        <header className={styles.header}>
          {isAnnouncement ? (
            <div className={styles.avatar}>
              <AnnouncementIcon />
            </div>
          ) : (
            <Avatar className={styles.avatar} initial={post.initial ?? ""} tone="blue" />
          )}
          <div className={styles.author}>
            <h2>{post.subject}</h2>
            <p>
              <time dateTime={post.dateTime}>{post.time}</time>
              {post.authorLabel ? ` · ${post.authorLabel}` : ""}
            </p>
          </div>
          <Badge className={styles.tag} variant={postTypeBadgeVariants[post.type]}>
            <PostTypeIcon type={post.type} />
            {postTypeLabels[post.type]}
          </Badge>
        </header>
      </LinkButton>

      <p className={styles.recipient}>Para: {post.recipient}</p>
      <p className={styles.body}>{post.body}</p>

      {post.media.length > 0 ? (
        <div className={styles.mediaGallery}>
          {post.media.map((media) =>
            media.url ? (
              <figure key={media.id}>
                {/* Signed provider URLs are generated server-side for this server-rendered card. */}
                <button
                  aria-label={`Ampliar ${media.alt ?? media.originalName}`}
                  className={styles.mediaButton}
                  onClick={() =>
                    setExpandedMedia({
                      alt: media.alt ?? media.originalName,
                      url: media.url!,
                    })
                  }
                  type="button"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={media.alt ?? media.originalName} src={media.url} />
                </button>
              </figure>
            ) : (
              <div
                aria-label={mediaPlaceholderLabel}
                className={styles.mediaPlaceholder}
                key={media.id}
                role="img"
              >
                <PhotoIcon />
                <span>{mediaPlaceholderLabel}</span>
              </div>
            ),
          )}
        </div>
      ) : post.hasMedia ? (
        <div className={styles.mediaPlaceholder} aria-label={mediaPlaceholderLabel} role="img">
          <PhotoIcon />
          <span>{mediaPlaceholderLabel}</span>
        </div>
      ) : null}

      {expandedMedia ? (
        <div
          aria-label="Vista ampliada de la imagen"
          aria-modal="true"
          className={styles.lightbox}
          onClick={() => setExpandedMedia(null)}
          role="dialog"
        >
          <div className={styles.lightboxContent} onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Cerrar imagen ampliada"
              className={styles.lightboxClose}
              onClick={() => setExpandedMedia(null)}
              type="button"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={expandedMedia.alt} src={expandedMedia.url} />
          </div>
        </div>
      ) : null}

      <footer className={styles.footer}>
        {canReact ? (
          <button
            aria-label={reactionState.active ? "Quitar Me encanta" : "Dar Me encanta"}
            aria-pressed={reactionState.active}
            className={`${styles.reactionButton} ${reactionState.active ? styles.reactionActive : ""}`}
            disabled={isPending}
            onClick={handleReactionClick}
            type="button"
          >
            <HeartIcon />
            {reactionState.count}
          </button>
        ) : (
          <span className={styles.reaction}>
            <HeartIcon />
            {post.engagement.reactionCount}
          </span>
        )}
        {commentHref ? (
          <Link
            aria-label={`Comentar en ${post.subject}`}
            className={styles.comments}
            href={commentHref}
          >
            <CommentIcon />
            {post.engagement.commentCount}
          </Link>
        ) : (
          <span className={styles.comments}>
            <CommentIcon />
            {post.engagement.commentCount}
          </span>
        )}
        {reactionError ? (
          <span className={styles.engagementError} role="alert">
            {reactionError}
          </span>
        ) : null}
        {canEdit ? (
          <LinkButton
            className={styles.editLabel}
            href={`/post?id=${post.id}`}
            variant="ghost"
          >
            Editar
          </LinkButton>
        ) : null}
      </footer>
    </article>
  );
}
