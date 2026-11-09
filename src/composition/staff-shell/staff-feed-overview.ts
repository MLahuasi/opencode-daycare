/** Dynamic Staff Home overview derived from current PostgreSQL-backed data. */
export type StaffFeedOverview = {
  roomLabel: string;
  greeting: string;
  attendance: string;
  date: string;
  composerPrompt: string;
  publishedTodayLabel: string;
};

/** Builds the Home overview without relying on persisted presentation rows. */
export function buildStaffFeedOverview(
  name: string,
  roomLabel: string,
  activeKidCount: number,
  locale: string,
  timeZone: string,
  now = new Date(),
): StaffFeedOverview {
  const firstName = name.trim().split(/\s+/)[0] || name;
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone,
    weekday: "long",
  }).format(now);

  return {
    roomLabel,
    greeting: `Hola, ${firstName}!`,
    attendance: `${activeKidCount} ${activeKidCount === 1 ? "niño" : "niños"}`,
    date,
    composerPrompt: "Comparte algo con tu equipo...",
    publishedTodayLabel: "PUBLICADO HOY",
  };
}
