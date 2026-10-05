"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  MAX_MEDIA_BYTES,
  MAX_POST_MEDIA,
} from "@/src/presentation/post/schemas";
import { isSupportedImageFile } from "@/src/presentation/post/utils";
import styles from "./post-image-picker.module.css";

/** A selected image and the preview data used by the picker. */
export type PostImageSelection = {
  /** Stable client-side image identifier. */
  id: string;
  /** Original image file selected by the user. */
  file: File;
  /** Object URL used for the local preview. */
  previewUrl: string;
  /** Editable alternative text for the image. */
  alt: string;
};

/** Props accepted by the reusable Post image picker. */
type PostImagePickerProps = {
  /** Optional classes applied to the picker wrapper. */
  className?: string;
  /** Whether selection and editing are disabled. */
  disabled?: boolean;
  /** Name used by the native file input in form submission. */
  inputName?: string;
  /** Maximum number of new images accepted by the picker. */
  maxImages?: number;
  /** Called with the current valid image selections. */
  onChange?: (images: readonly PostImageSelection[]) => void;
};

/**
 * Builds a stable client-side key for an uploaded file.
 *
 * @param file - File to identify.
 * @returns A key derived from the file metadata.
 */
function getFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * Formats a byte count for display in validation feedback.
 *
 * @param bytes - Number of bytes to format.
 * @returns A localized megabyte label.
 */
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

  /**
   * Synchronizes selected files with the native file input.
   *
   * @param nextImages - Images that should be represented by the input.
   * @returns Nothing when the input is synchronized.
   */
  function syncInputFiles(nextImages: readonly PostImageSelection[]) {
    if (!inputRef.current || typeof DataTransfer === "undefined") return;

    const transfer = new DataTransfer();
    for (const image of nextImages) transfer.items.add(image.file);
    inputRef.current.files = transfer.files;
  }

  /**
   * Stores selected images and notifies the controlled consumer.
   *
   * @param nextImages - New image selection.
   * @returns Nothing after state and input synchronization.
   */
  function updateImages(nextImages: PostImageSelection[]) {
    setImages(nextImages);
    syncInputFiles(nextImages);
    onChange?.(nextImages);
  }

  /**
   * Validates and adds files selected through the dialog or drop zone.
   *
   * @param fileList - Files selected by the user.
   * @returns A promise that resolves after validation and state updates.
   */
  async function addFiles(fileList: FileList | readonly File[]) {
    if (disabled) return;

    const nextImages = [...images];
    const existingIds = new Set(nextImages.map((image) => image.id));
    let nextError = "";

    for (const file of fileList) {
      if (nextImages.length >= maxImages) {
        nextError = `Puedes adjuntar hasta ${maxImages} imágenes nuevas.`;
        break;
      }

       if (!(await isSupportedImageFile(file))) {
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

  /**
   * Handles files selected through the native file input.
   *
   * @param event - Native file input change event.
   * @returns Nothing after scheduling file validation.
   */
  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.currentTarget.files
      ? Array.from(event.currentTarget.files)
      : [];
    event.currentTarget.value = "";
    void addFiles(files);
  }

  /**
   * Handles files dropped onto the picker.
   *
   * @param event - Drop event from the picker zone.
   * @returns Nothing after scheduling file validation.
   */
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void addFiles(event.dataTransfer.files);
  }

  /**
   * Removes an image and releases its local preview URL.
   *
   * @param id - Identifier of the image to remove.
   * @returns Nothing after updating the selection.
   */
  function removeImage(id: string) {
    const image = images.find((candidate) => candidate.id === id);
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
      objectUrls.current.delete(image.previewUrl);
    }
    updateImages(images.filter((candidate) => candidate.id !== id));
  }

  /**
   * Updates alternative text for a selected image.
   *
   * @param id - Identifier of the image to update.
   * @param alt - New alternative text.
   * @returns Nothing after updating the selection.
   */
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
