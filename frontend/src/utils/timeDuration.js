const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_WEEK = 7 * 24 * SECONDS_PER_HOUR;

export const EMPTY_DURATION = { weeks: 0, hours: 0, minutes: 0 };

export const partsToSeconds = ({ weeks = 0, hours = 0, minutes = 0 }) => {
  return weeks * SECONDS_PER_WEEK + hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE;
};

export const secondsToParts = (seconds) => {
  if (!seconds || seconds <= 0) {
    return { ...EMPTY_DURATION };
  }

  let remainder = Math.round(seconds);
  const weeks = Math.floor(remainder / SECONDS_PER_WEEK);
  remainder %= SECONDS_PER_WEEK;
  const hours = Math.floor(remainder / SECONDS_PER_HOUR);
  remainder %= SECONDS_PER_HOUR;
  const minutes = Math.floor(remainder / SECONDS_PER_MINUTE);

  return { weeks, hours, minutes };
};

export const formatDurationParts = ({ weeks = 0, hours = 0, minutes = 0 }) => {
  const parts = [];

  if (weeks > 0) {
    parts.push(`${weeks} нед.`);
  }
  if (hours > 0) {
    parts.push(`${hours} ч`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} мин`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Не указано';
};

export const formatSeconds = (seconds) => {
  return formatDurationParts(secondsToParts(seconds));
};
