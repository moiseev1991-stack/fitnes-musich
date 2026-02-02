import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const createSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата"),
  title: z.string().optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().optional(),
  note: z.string().optional(),
});

export const createExerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Название от 2 символов")
    .max(100, "Название до 100 символов"),
  muscleGroupIds: z.array(z.number()).optional(),
});

export const createSessionExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  plannedSets: z.number().int().min(1).max(30),
});

export const createSetSchema = z.object({
  weight: z
    .union([z.number().positive("Вес должен быть > 0"), z.null()])
    .optional(),
  reps: z.number().int().min(1).max(7200, "Значение: 1–7200 (повторы или секунды)"),
  note: z.string().max(280).optional(),
  valueType: z.enum(["reps", "time"]).optional().default("reps"),
});

export const updateSetSchema = z.object({
  weight: z.union([z.number().positive(), z.null()]).optional(),
  reps: z.number().int().min(1).max(7200).optional(),
  note: z.string().max(280).optional(),
  valueType: z.enum(["reps", "time"]).optional(),
  status: z.enum(["done", "missed"]).nullable().optional(),
});

export const plannedSetsRange = { min: 1, max: 30 } as const;
export const repsRange = { min: 1, max: 7200 } as const;
export const noteMaxLength = 280;
