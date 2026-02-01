export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

export function parseDateStr(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getMonthRange(year: number, month: number): {
  from: string;
  to: string;
} {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return {
    from: formatDate(first),
    to: formatDate(last),
  };
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
