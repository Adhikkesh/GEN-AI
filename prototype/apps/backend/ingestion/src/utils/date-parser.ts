// Helper to parse SerpApi "1 day ago" to ISO timestamp
export function parsePostedAt(postedAt: string | undefined, now: Date = new Date()): string | null {
  if (!postedAt) return null;

  const match = (postedAt as string).match(/(\d+)\s*(day|days|hour|hours|minute|minutes)\s*ago/);
  if (!match) return null;

  const num = parseInt(match?.[1] || '0');
  const unit = (match?.[2] || '').toLowerCase();

  const past = new Date(now);
  switch (unit.startsWith('day')) {
    case true: past.setDate(past.getDate() - num); break;
    case false:
      if (unit.startsWith('hour')) past.setHours(past.getHours() - num);
      else if (unit.startsWith('minute')) past.setMinutes(past.getMinutes() - num);
      break;
  }

  return past.toISOString();
}