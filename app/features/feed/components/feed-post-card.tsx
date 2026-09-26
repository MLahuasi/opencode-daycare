"use client";

import {
  Avatar,
  Badge,
  LinkButton,
  PhotoIcon,
  type BadgeVariant,
} from "@/app/components/ui";
import { useEffect, useState } from "react";
import type { FeedPost, PostType } from "../types";
import styles from "./feed-post-card.module.css";

type FeedPostCardProps = {
  canEdit?: boolean;
  post: FeedPost;
  className?: string;
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
 * Renders the filled reaction icon from the visual reference.
 *
 * @returns An inline SVG heart icon.
 */
function HeartIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

/**
 * Renders the comment count icon.
 *
 * @returns An inline SVG comment icon.
 */
function CommentIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
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
 * @param props.post - Static publication data to display.
 * @param props.className - Optional classes that customize the card container.
 * @returns A feed publication article.
 */
export function FeedPostCard({ canEdit = true, className = "", post }: FeedPostCardProps) {
  const [expandedMedia, setExpandedMedia] = useState<{
    alt: string;
    url: string;
  } | null>(null);
  const isAnnouncement = post.type === "announcement";
  const mediaPlaceholderLabel = post.mediaLabel
    ? `Foto · ${post.mediaLabel}`
    : "Imagen adjunta";

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
        <span className={styles.reaction}>
          <HeartIcon />
          {post.reactions}
        </span>
        <span className={styles.comments}>
          <CommentIcon />
          {post.comments}
        </span>
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
