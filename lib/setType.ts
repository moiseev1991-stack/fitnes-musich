const TYPE_PREFIX = "@type=time;";

/** Parse note for legacy @type=time; prefix (backward compat) */
export function parseNote(note: string | null): {
  type: "reps" | "time";
  userNote: string;
} {
  const n = note ?? "";
  if (n.startsWith(TYPE_PREFIX)) {
    return { type: "time", userNote: n.slice(TYPE_PREFIX.length) };
  }
  return { type: "reps", userNote: n };
}

/** Build note with legacy prefix (for backward compat when valueType not in DB) */
export function buildNoteWithType(
  valueType: "reps" | "time",
  userNote: string
): string {
  if (valueType === "time") {
    return TYPE_PREFIX + userNote;
  }
  return userNote;
}

/** Get display type from set: prefer valueType from DB, fallback to note prefix */
export function getValueType(
  valueType: string | null | undefined,
  note: string | null
): "reps" | "time" {
  if (valueType === "time") return "time";
  if (valueType === "reps") return "reps";
  const { type } = parseNote(note);
  return type;
}

/** Format value for display: reps as number, time as 45с or 1:30 */
export function formatValueForDisplay(
  value: number,
  noteOrValueType: string | null | undefined
): string {
  const type =
    noteOrValueType === "time" || noteOrValueType === "reps"
      ? (noteOrValueType as "reps" | "time")
      : getValueType(undefined, noteOrValueType as string | null);
  if (type === "time") {
    if (value < 60) return `${value}с`;
    const m = Math.floor(value / 60);
    const s = value % 60;
    return s === 0 ? `${m}:00` : `${m}:${s.toString().padStart(2, "0")}`;
  }
  return String(value);
}
