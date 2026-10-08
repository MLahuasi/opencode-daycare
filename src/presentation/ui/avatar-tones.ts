export const AVATAR_TONES = [
  "coral",
  "blue",
  "pink",
  "green",
  "yellow",
  "purple",
] as const;

export type AvatarTone = (typeof AVATAR_TONES)[number];

export function getAvatarToneByPosition(index: number): AvatarTone {
  return AVATAR_TONES[index % AVATAR_TONES.length];
}
