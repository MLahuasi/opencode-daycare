"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  MAX_MEDIA_BYTES,
  MAX_POST_MEDIA,
} from "../schemas";
import styles from "./post-image-picker.module.css";

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

/** A selected image and the preview data used by the picker. */
export type PostImageSelection = {
  id: string;
  file: File;
  previewUrl: string;
  alt: string;
};

type PostImagePickerProps = {
  className?: string;
  disabled?: boolean;
  inputName?: string;
  maxImages?: number;
  onChange?: (images: readonly PostImageSelection[]) => void;
};

function isSupportedImage(file: File): boolean {
  return ACCEPTED_MIME_TYPES.has(file.type) || ACCEPTED_EXTENSIONS.test(file.name);
}

function getFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Renders a reusable image selector with native file dialog and drag and drop.
 *
 * @param props - Image picker configuration.
 * @param props.className - Optional classes applied to the picker wrapper.
 * @param props.disabled - Whether selection and editing are disabled.
 * @param props.inputName - Name used by the native file input in form submission.
 * @param props.maxImages - Maximum number of new images accepted by the picker.
 * @param props.onChange - Called with the current valid image selections.
 * @returns An accessible image selection and preview control.
 */
export function PostImagePicker({
  className = "",
  disabled = false,
  inputName = "images",
  maxImages = MAX_POST_MEDIA,
  onChange,
}: PostImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());
  const [images, setImages] = useState<PostImageSelection[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const urls = objectUrls.current;

    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  function syncInputFiles(nextImages: readonly PostImageSelection[]) {
    if (!inputRef.current || typeof DataTransfer === "undefined") return;

    const transfer = new DataTransfer();
    for (const image of nextImages) transfer.items.add(image.file);
    inputRef.current.files = transfer.files;
  }

  function updateImages(nextImages: PostImageSelection[]) {
    setImages(nextImages);
    syncInputFiles(nextImages);
    onChange?.(nextImages);
  }

  function addFiles(fileList: FileList | readonly File[]) {
    if (disabled) return;

    const nextImages = [...images];
    const existingIds = new Set(nextImages.map((image) => image.id));
    let nextError = "";

    for (const file of fileList) {
      if (nextImages.length >= maxImages) {
        nextError = `Puedes adjuntar hasta ${maxImages} imágenes nuevas.`;
        break;
      }

      if (!isSupportedImage(file)) {
        nextError = "Solo se aceptan imágenes JPEG, PNG o WebP.";
        continue;
      }

      if (file.size > MAX_MEDIA_BYTES) {
        nextError = `Cada imagen debe pesar como máximo ${formatFileSize(MAX_MEDIA_BYTES)}.`;
        continue;
      }

      const id = getFileId(file);
      if (existingIds.has(id)) continue;

      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.add(previewUrl);
      nextImages.push({
        id,
        file,
        previewUrl,
        alt: file.name.replace(/\.[^.]+$/, ""),
      });
      existingIds.add(id);
    }

    setError(nextError);
    if (nextImages.length !== images.length) updateImages(nextImages);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.currentTarget.files
      ? Array.from(event.currentTarget.files)
      : [];
    event.currentTarget.value = "";
    addFiles(files);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function removeImage(id: string) {
    const image = images.find((candidate) => candidate.id === id);
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
      objectUrls.current.delete(image.previewUrl);
    }
    updateImages(images.filter((candidate) => candidate.id !== id));
  }

  function updateAlt(id: string, alt: string) {
    updateImages(
      images.map((image) => (image.id === id ? { ...image, alt } : image)),
    );
  }

  return (
    <div className={`${styles.root} ${className}`}>
      <div
        aria-describedby={error ? "post-image-picker-error" : undefined}
        aria-disabled={disabled}
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setIsDragging(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        role="group"
      >
        <input
          accept="image/jpeg,image/png,image/webp"
          className={styles.input}
          disabled={disabled}
          multiple
          name={inputName}
          onChange={handleInputChange}
          ref={inputRef}
          type="file"
        />
        <span aria-hidden="true" className={styles.icon}>
          +
        </span>
        <strong>Agrega imágenes</strong>
        <span>Arrástralas aquí o elige archivos desde tu dispositivo</span>
        <button
          className={styles.chooseButton}
          disabled={disabled || images.length >= maxImages}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          Elegir imágenes
        </button>
        <small>JPEG, PNG o WebP · máximo 10 MB por imagen · hasta {maxImages} nuevas</small>
      </div>

      {error ? (
        <p className={styles.error} id="post-image-picker-error" role="alert">
          {error}
        </p>
      ) : null}

      {images.length > 0 ? (
        <ul className={styles.previewList}>
          {images.map((image, index) => (
            <li className={styles.previewItem} key={image.id}>
              {/* Blob URLs are local previews and must use a native image element. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={image.alt || `Vista previa ${index + 1}`} src={image.previewUrl} />
              <div className={styles.previewDetails}>
                <label>
                  Texto alternativo
                  <input
                    disabled={disabled}
                    maxLength={500}
                    onChange={(event) => updateAlt(image.id, event.target.value)}
                    placeholder="Describe la imagen"
                    type="text"
                    value={image.alt}
                  />
                </label>
                <button
                  className={styles.removeButton}
                  disabled={disabled}
                  onClick={() => removeImage(image.id)}
                  type="button"
                >
                  Eliminar imagen
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
