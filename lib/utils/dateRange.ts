// Returns YYYY-MM-DD strings for date ranges used by billing APIs

export function getMTDRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: toDateString(start),
    end: toDateString(now),
  };
}

export function getPreviousMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0); // last day of prev month
  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
