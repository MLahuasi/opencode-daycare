"use client";

import { useActionState, useState } from "react";
import type { SubmitEvent } from "react";
import { Button, FormField, LinkButton } from "@/app/components/ui";
import type { Kid } from "@/app/features/kids";
import type { Room } from "@/app/features/rooms";
import {
  MAX_POST_BODY_LENGTH,
  PostImagePicker,
  type PostImageSelection,
} from "../index";
import type { PostFormMode } from "../schemas";
import type { PostType } from "../types";
import type { PostFormAction, PostFormActionState } from "../actions/types";
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
  body: string;
  existingMedia: readonly PostFormExistingMediaValue[];
  kidId: string | null;
  mode: PostFormMode;
  postId?: string;
  roomId: string | null;
  type: PostType;
};

type PostFormProps = {
  action: PostFormAction;
  cancelHref: string;
  className?: string;
  initialValues: PostFormInitialValues;
  kids: readonly Kid[];
  rooms: readonly Room[];
};

const INITIAL_ACTION_STATE: PostFormActionState = {
  errors: {},
  message: "",
};

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
  const [kidId, setKidId] = useState(initialValues.kidId);
  const [roomId, setRoomId] = useState(initialValues.roomId);
  const [type, setType] = useState<PostType>(initialValues.type);
  const [images, setImages] = useState<readonly PostImageSelection[]>([]);
  const [error, setError] = useState("");
  const serverError = actionState.message || Object.values(actionState.errors)[0] || "";

  function selectKid(nextKidId: string) {
    setKidId(nextKidId);
    setRoomId(null);
    setError("");
  }

  function selectRoom(nextRoomId: string) {
    setRoomId(nextRoomId);
    setKidId(null);
    setExistingMedia([]);
    setImages([]);
    setError("");
  }

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
        <input name="kidId" type="hidden" value={kidId ?? ""} />
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
            {kids.map((kid) => (
              <button
                aria-pressed={kidId === kid.id}
                className={`${styles.targetPill} ${kidId === kid.id ? styles.selected : ""}`}
                key={kid.id}
                onClick={() => selectKid(kid.id)}
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

        {kidId ? (
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
    </form>
  );
}
