import type { FeedPost } from "@/app/features/feed/types/feed";

export const feedOverview = {
  roomLabel: "Guardería · Sala Soles",
  greeting: "Buenas, Caro",
  attendance: "12 niños",
  date: "martes 17 jun",
  composerPrompt: "Comparte un momento…",
  publishedTodayLabel: "Publicado hoy",
} as const;

export const feedPosts: readonly FeedPost[] = [
  {
    id: "mateo-first-potty",
    type: "achievement",
    subject: "Mateo",
    initial: "M",
    time: "14:20",
    dateTime: "2026-06-17T14:20:00-05:00",
    authorLabel: "publicado por ti",
    recipient: "familia de Mateo",
    body: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    reactions: 3,
    comments: 1,
  },
  {
    id: "mateo-tempera-painting",
    type: "activity",
    subject: "Mateo",
    initial: "M",
    time: "09:40",
    dateTime: "2026-06-17T09:40:00-05:00",
    authorLabel: "publicado por ti",
    recipient: "familia de Mateo",
    body: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    reactions: 5,
    comments: 2,
    hasMedia: true,
  },
  {
    id: "friday-park-announcement",
    type: "announcement",
    subject: "Anuncio general",
    time: "07:50",
    dateTime: "2026-06-17T07:50:00-05:00",
    authorLabel: "publicado por ti",
    recipient: "toda la sala",
    body: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    reactions: 8,
    comments: 0,
  },
];
