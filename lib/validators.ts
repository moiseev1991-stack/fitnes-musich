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
  name: z.string().min(1, "Название обязательно"),
  muscleGroupIds: z.array(z.number()).optional(),
});

export const createSessionExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  plannedSets: z.number().int().min(1).max(30),
});

export const createSetSchema = z.object({
  weight: z.number().positive("Вес должен быть > 0"),
  reps: z.number().int().min(1).max(100, "Повторы: 1-100"),
  note: z.string().max(280).optional(),
});

export const updateSetSchema = createSetSchema;

export const plannedSetsRange = { min: 1, max: 30 } as const;
export const repsRange = { min: 1, max: 100 } as const;
export const noteMaxLength = 280;
