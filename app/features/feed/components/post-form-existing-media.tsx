import type { FeedMedia } from "../types";
import styles from "./post-form.module.css";

/** Existing image data displayed by the edit form. */
export type PostFormExistingMedia = {
  media: FeedMedia;
  url: string;
};

type PostFormExistingMediaProps = {
  images: readonly PostFormExistingMedia[];
  onRemove: (id: string) => void;
};

/**
 * Renders persisted images that can be retained or removed during editing.
 *
 * @param props - Existing media and removal callback.
 * @param props.images - Persisted images with server-generated delivery URLs.
 * @param props.onRemove - Called with the persisted image identifier.
 * @returns A list of persisted image previews.
 */
export function PostFormExistingMedia({
  images,
  onRemove,
}: PostFormExistingMediaProps) {
  if (images.length === 0) return null;

  return (
    <ul className={styles.existingMediaList}>
      {images.map(({ media, url }) => (
        <li className={styles.existingMediaItem} key={media.id}>
          {/* Signed provider URLs are already available; native image keeps this preview unoptimized. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={media.alt ?? media.originalName} src={url} />
          <button onClick={() => onRemove(media.id)} type="button">
            Eliminar
          </button>
        </li>
      ))}
    </ul>
  );
}
