import { prisma } from "./db";

export async function ensureSessionBelongsToUser(
  sessionId: string,
  userId: string
): Promise<void> {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) {
    throw new Error("NOT_FOUND");
  }
}

export async function ensureSetBelongsToUser(
  setId: string,
  userId: string
): Promise<void> {
  const set = await prisma.set.findFirst({
    where: {
      id: setId,
      sessionExercise: {
        session: { userId },
      },
    },
  });
  if (!set) {
    throw new Error("NOT_FOUND");
  }
}

export async function ensureExerciseAccessible(
  exerciseId: string,
  userId: string
): Promise<void> {
  const exercise = await prisma.exercise.findFirst({
    where: {
      id: exerciseId,
      OR: [{ userId: null }, { userId }],
    },
  });
  if (!exercise) {
    throw new Error("NOT_FOUND");
  }
}
