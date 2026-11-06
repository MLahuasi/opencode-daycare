export type PostDateFormatters = {
  date: Intl.DateTimeFormat;
  dateTime: Intl.DateTimeFormat;
  time: Intl.DateTimeFormat;
};

/** Creates the shared date/time formatters used by post projections. */
export function createPostDateFormatters(
  locale: string,
  timeZone: string,
): PostDateFormatters {
  return {
    date: new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeZone,
    }),
    dateTime: new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeStyle: "short",
      timeZone,
    }),
    time: new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }),
  };
}
