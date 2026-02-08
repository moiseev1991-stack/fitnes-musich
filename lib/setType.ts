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

/** Format value for display: reps as number, time as 45с or 1:00 */
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

/** Две строки для ячейки: повторы/время отдельно, вес (кг) отдельно — сразу понятно */
export function getSetCellLines(set: {
  reps: number;
  weight: number | null;
  valueType?: string | null;
  note?: string | null;
}): { repsLine: string; weightLine: string | null } {
  const type = getValueType(set.valueType ?? undefined, set.note ?? null);
  const valStr = formatValueForDisplay(set.reps, type);
  const repsLine = type === "reps" ? `${valStr} повт` : valStr;
  const hasWeight = set.weight != null && set.weight > 0;
  const weightLine = hasWeight ? `${set.weight} кг` : null;
  return { repsLine, weightLine };
}

/** Разбивка для ячейки: строка1 число × вес, строка2 подписи (повт/с/мин | кг) */
export function getSetCellColumns(set: {
  reps: number;
  weight: number | null;
  valueType?: string | null;
  note?: string | null;
}): {
  mainNumber: string;
  mainLabel: string;
  weightNumber: number | null;
  showSeparator: boolean;
} {
  const type = getValueType(set.valueType ?? undefined, set.note ?? null);
  const hasWeight = set.weight != null && set.weight > 0;
  const weightNumber = hasWeight ? set.weight : null;
  const showSeparator = hasWeight;

  if (type === "reps") {
    return { mainNumber: String(set.reps), mainLabel: "повт", weightNumber, showSeparator };
  }
  if (set.reps < 60) {
    return { mainNumber: String(set.reps), mainLabel: "с", weightNumber, showSeparator };
  }
  const m = Math.floor(set.reps / 60);
  const s = set.reps % 60;
  const mainNumber = s === 0 ? `${m}:00` : `${m}:${s.toString().padStart(2, "0")}`;
  return { mainNumber, mainLabel: "мин", weightNumber, showSeparator };
}
