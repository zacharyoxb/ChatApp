const formatTimeScreenreader = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  const twelveHour = hours % 12 || 12;

  return `${twelveHour}.${minutes.toString().padStart(2, "0")} ${ampm}`;
};

/**
 * Formats a date string into a human-readable format with special handling for recent dates.
 *
 * @param dateString - ISO date string or any valid date string parsable by Date constructor
 * @param isScreenReadable - When true, outputs screen reader-optimized format with clear time notation.
 *                           When false, uses more compact time format suitable for visual interfaces.
 *
 * @returns Formatted date string based on recency and screen reader preference:
 * - Today's dates: Screen readable: "Today at [time]", Non-screen readable: "[time]" only
 * - Yesterday's dates: "Yesterday" (time is always omitted)
 * - Older dates: Full date string (e.g., "Thursday, December 19, 2024")
 */
export const datetime_format = (
  dateString: string,
  isScreenReadable: boolean
): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  let formatted_string = "";

  if (isToday) {
    formatted_string = isScreenReadable
      ? `Today at ${formatTimeScreenreader(date)}`
      : date.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "numeric",
        });
  } else if (isYesterday) {
    formatted_string = "Yesterday";
  } else {
    formatted_string = isScreenReadable
      ? date.toLocaleDateString(undefined, {
          dateStyle: "full",
        })
      : date.toLocaleDateString(undefined, { dateStyle: "short" });
  }
  return formatted_string;
};
