// Dates are stored as ISO text and shown in British order, as on
// Nigerian school documents.
const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const asDate = (value) => new Date(value.length === 10 ? `${value}T00:00:00` : value);

export const formatDay = (value) => (value ? dayFmt.format(asDate(value)) : '');
export const formatShort = (value) => (value ? shortFmt.format(asDate(value)) : '');
export const formatTime = (value) => (value ? timeFmt.format(asDate(value)) : '');

export function daysBetween(fromIso, toIso) {
  return Math.round((asDate(toIso) - asDate(fromIso)) / 86400000);
}

export function plural(count, one, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

export const SEMESTER_LABELS = { 1: 'First semester', 2: 'Second semester' };

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(fullName) {
  const parts = String(fullName).replace(/^(dr|mr|mrs|ms|prof|engr)\.?\s+/i, '').split(/\s+/);
  return parts[0];
}
