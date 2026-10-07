"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Button, FormField, LinkButton } from "@/presentation/ui";
import type { Kid } from "@/domain/kid";
import type { Room } from "@/domain/room";
import { MAX_POST_BODY_LENGTH } from "@/presentation/post/schemas";
import {
  PostImagePicker,
  type PostImageSelection,
} from "./post-image-picker";
import type { PostFormMode } from "@/presentation/post/schemas";
import type { PostType } from "@/domain/post";
import type { PostFormAction, PostFormActionState } from "@/presentation/post/contracts";
import {
  PostFormExistingMedia,
  type PostFormExistingMedia as PostFormExistingMediaValue,
} from "./post-form-existing-media";
import styles from "./post-form.module.css";

const POST_TYPE_OPTIONS: readonly { value: PostType; label: string }[] = [
  { value: "food", label: "Comida" },
  { value: "nap", label: "Siesta" },
  { value: "activity", label: "Actividad" },
  { value: "achievement", label: "Logro" },
  { value: "mood", label: "Ánimo" },
  { value: "announcement", label: "Anuncio" },
];

/** Initial values shared by new and edit post forms. */
export type PostFormInitialValues = {
  /** Initial description. */
  body: string;
  /** Persisted images available during editing. */
  existingMedia: readonly PostFormExistingMediaValue[];
  /** Initially selected kid identifiers. */
  kidIds: readonly string[];
  /** Form operation mode. */
  mode: PostFormMode;
  /** Identifier of the Post being edited. */
  postId?: string;
  /** Initially selected room identifier. */
  roomId: string | null;
  /** Initially selected Post category. */
  type: PostType;
};

/** Props accepted by the create and edit Post form. */
type PostFormProps = {
  /** Native or server action invoked on submit. */
  action: PostFormAction;
  /** Destination used by the cancel action. */
  cancelHref: string;
  /** Optional classes applied to the form card. */
  className?: string;
  /** Values used by create or edit mode. */
  initialValues: PostFormInitialValues;
  /** Kids authorized for the current staff member. */
  kids: readonly Kid[];
  /** Rooms authorized for the current staff member. */
  rooms: readonly Room[];
};

const INITIAL_ACTION_STATE: PostFormActionState = {
  errors: {},
  message: "",
};

/**
 * Returns the uppercase initial used by a kid target pill.
 *
 * @param name - Kid name displayed by the target pill.
 * @returns The uppercase first character.
 */
function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

/**
 * Renders the responsive create/edit post form.
 *
 * @param props - Post form configuration and authorized destinations.
 * @param props.action - Native form action or server action used on submit.
 * @param props.cancelHref - Destination used by the cancel action.
 * @param props.className - Optional classes applied to the form card.
 * @param props.initialValues - Values used by create or edit mode.
 * @param props.kids - Active children authorized for the current staff member.
 * @param props.rooms - Rooms authorized for the current staff member.
 * @returns A responsive post editor.
 */
export function PostForm({
  action,
  cancelHref,
  className = "",
  initialValues,
  kids,
  rooms,
}: PostFormProps) {
  const [actionState, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );
  const [body, setBody] = useState(initialValues.body);
  const [existingMedia, setExistingMedia] = useState(
    initialValues.existingMedia,
  );
  const [kidIds, setKidIds] = useState<string[]>([...initialValues.kidIds]);
  const [roomId, setRoomId] = useState(initialValues.roomId);
  const [type, setType] = useState<PostType>(initialValues.type);
  const [images, setImages] = useState<readonly PostImageSelection[]>([]);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const restrictionDialogRef = useRef<HTMLDialogElement>(null);
  const shouldResubmitRef = useRef(false);
  const serverError = actionState.message || Object.values(actionState.errors)[0] || "";

  useEffect(() => {
    if (actionState.redirectTo) {
      window.location.assign(actionState.redirectTo);
    }
  }, [actionState.redirectTo]);

  useEffect(() => {
    const dialog = restrictionDialogRef.current;

    if (actionState.restrictedKids?.length && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [actionState.restrictedKids]);

  useEffect(() => {
    if (!shouldResubmitRef.current) return;

    shouldResubmitRef.current = false;
    formRef.current?.requestSubmit();
  }, [kidIds]);

  /**
   * Toggles a kid destination and clears the room destination.
   *
   * @param nextKidId - Identifier of the toggled kid.
   * @returns Nothing after updating the destination state.
   */
  function toggleKid(nextKidId: string) {
    setKidIds((current) =>
      current.includes(nextKidId)
        ? current.filter((kidId) => kidId !== nextKidId)
        : [...current, nextKidId],
    );
    setRoomId(null);
    setError("");
  }

  /**
   * Toggles all authorized kids as the Post destination.
   *
   * @returns Nothing after updating the destination state.
   */
  function toggleAllKids() {
    setKidIds((current) =>
      current.length === kids.length ? [] : kids.map((kid) => kid.id),
    );
    setRoomId(null);
    setError("");
  }

  /**
   * Selects a room destination and clears media intended for a kid.
   *
   * @param nextRoomId - Identifier of the selected room.
   * @returns Nothing after updating the destination state.
   */
  function selectRoom(nextRoomId: string) {
    setRoomId(nextRoomId);
    setKidIds([]);
    setExistingMedia([]);
    setImages([]);
    setError("");
  }

  /**
   * Excludes restricted kids and submits the same form again without uploading
   * media until the server has revalidated the remaining destination.
   */
  function continueWithoutRestrictedKids() {
    const restrictedIds = new Set(
      actionState.restrictedKids?.map(({ id }) => id) ?? [],
    );

    setKidIds((current) =>
      current.filter((kidId) => !restrictedIds.has(kidId)),
    );
    restrictionDialogRef.current?.close();
    shouldResubmitRef.current = true;
  }

  /**
   * Performs client-side validation before submitting the form action.
   *
   * @param event - Form submit event.
   * @returns Nothing after allowing or preventing submission.
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    const normalizedBody = body.trim();

    if (normalizedBody.length > MAX_POST_BODY_LENGTH) {
      event.preventDefault();
      setError(`La descripción no puede superar los ${MAX_POST_BODY_LENGTH} caracteres.`);
      return;
    }

    if (!normalizedBody && images.length === 0 && existingMedia.length === 0) {
      event.preventDefault();
      setError("Agrega una descripción o al menos una imagen.");
      return;
    }

    setError("");
  }

  return (
    <form
      action={formAction}
      className={`${styles.form} ${className}`}
      noValidate
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <header className={styles.header}>
        <LinkButton className={styles.cancel} href={cancelHref} variant="ghost">
          Cancelar
        </LinkButton>
        <h1>{initialValues.mode === "edit" ? "Editar publicación" : "Nueva publicación"}</h1>
        <Button
          aria-busy={pending}
          className={styles.publish}
          disabled={pending}
          type="submit"
          variant="ghost"
        >
          {pending ? "Guardando..." : "Publicar"}
        </Button>
      </header>

      <div className={styles.content}>
        <input name="mode" type="hidden" value={initialValues.mode} />
        {initialValues.postId ? (
          <input name="postId" type="hidden" value={initialValues.postId} />
        ) : null}
        <input name="kidIds" type="hidden" value={JSON.stringify(kidIds)} />
        <input name="roomId" type="hidden" value={roomId ?? ""} />
        <input name="type" type="hidden" value={type} />
        <input
          name="imageAlts"
          type="hidden"
          value={JSON.stringify(images.map((image) => ({ id: image.id, alt: image.alt })))}
        />
        <input
          name="existingMedia"
          type="hidden"
          value={JSON.stringify(existingMedia.map(({ media }) => media.id))}
        />

          <fieldset className={styles.section}>
            <legend>Para</legend>
            <div className={styles.pills}>
              {kids.length > 0 ? (
                <Button
                  aria-pressed={kidIds.length === kids.length}
                  className={`${styles.roomPill} ${kidIds.length === kids.length ? styles.selected : ""}`}
                  onClick={toggleAllKids}
                  type="button"
                  variant="ghost"
                >
                  Todos
                </Button>
              ) : null}
              {kids.map((kid) => (
              <button
                aria-pressed={kidIds.includes(kid.id)}
                className={`${styles.targetPill} ${kidIds.includes(kid.id) ? styles.selected : ""}`}
                key={kid.id}
                onClick={() => toggleKid(kid.id)}
                type="button"
              >
                <span aria-hidden="true" className={styles.initial}>{getInitial(kid.name)}</span>
                {kid.name.split(" ")[0]}
              </button>
            ))}
            {rooms.map((room) => (
              <button
                aria-pressed={roomId === room.id}
                className={`${styles.roomPill} ${roomId === room.id ? styles.selected : ""}`}
                key={room.id}
                onClick={() => selectRoom(room.id)}
                type="button"
              >
                Sala {room.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend>Tipo</legend>
          <div className={styles.pills}>
            {POST_TYPE_OPTIONS.map((option) => (
              <button
                aria-pressed={type === option.value}
                className={`${styles.typePill} ${styles[option.value]} ${type === option.value ? styles.selected : ""}`}
                key={option.value}
                onClick={() => setType(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <FormField className={styles.field} label="Descripción">
          <textarea
            aria-describedby={error || serverError ? "post-form-error" : "post-body-count"}
            aria-invalid={Boolean(error || serverError)}
            maxLength={MAX_POST_BODY_LENGTH}
            name="body"
            onChange={(event) => setBody(event.target.value)}
            placeholder="Contá cómo le fue hoy…"
            rows={5}
            value={body}
          />
          <small id="post-body-count">{body.length}/{MAX_POST_BODY_LENGTH}</small>
        </FormField>

        {kidIds.length > 0 ? (
          <fieldset className={styles.section}>
            <legend>Fotos</legend>
            <PostFormExistingMedia
              images={existingMedia}
              onRemove={(id) =>
                setExistingMedia((current) =>
                  current.filter(({ media }) => media.id !== id),
                )
              }
            />
            <PostImagePicker
              maxImages={Math.max(0, 4 - existingMedia.length)}
              onChange={setImages}
            />
          </fieldset>
        ) : null}

        {error || serverError ? (
          <p className={styles.error} id="post-form-error" role="alert">
            {error || serverError}
          </p>
        ) : null}
      </div>

      <dialog
        aria-labelledby="post-restriction-title"
        className={styles.restrictionDialog}
        onCancel={() => restrictionDialogRef.current?.close()}
        ref={restrictionDialogRef}
      >
        <h2 id="post-restriction-title">Restricciones de fotos</h2>
        <p>{actionState.message}</p>
        <ul>
          {actionState.restrictedKids?.map(({ id, name }) => (
            <li key={id}>{name}</li>
          ))}
        </ul>
        <div className={styles.restrictionActions}>
          <Button
            onClick={() => restrictionDialogRef.current?.close()}
            type="button"
            variant="ghost"
          >
            Volver al formulario
          </Button>
          <Button onClick={continueWithoutRestrictedKids} type="button">
            Continuar sin ellos
          </Button>
        </div>
      </dialog>
    </form>
  );
}
