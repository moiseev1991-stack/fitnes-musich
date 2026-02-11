import { prisma } from "./db";

type SetInput = { reps: number; weight: number | null } | { seconds: number };

interface SeedExercise {
  name: string;
  sets: SetInput[];
}

interface SeedWorkout {
  title: string;
  exercises: SeedExercise[];
}

interface SeedFolder {
  name: string;
  sortOrder: number;
  workouts: SeedWorkout[];
}

const SEED_FOLDERS: SeedFolder[] = [
  {
    name: "Грудь-Руки",
    sortOrder: 10,
    workouts: [
      {
        title: "Грудь + Трицепс (A)",
        exercises: [
          { name: "Жим лёжа (штанга)", sets: [{ reps: 12, weight: 40 }, { reps: 10, weight: 45 }, { reps: 8, weight: 50 }, { reps: 8, weight: 50 }] },
          { name: "Жим гантелей на наклонной скамье", sets: [{ reps: 12, weight: 18 }, { reps: 10, weight: 20 }, { reps: 10, weight: 20 }, { reps: 8, weight: 22 }] },
          { name: "Разводка гантелей лёжа", sets: [{ reps: 15, weight: 12 }, { reps: 15, weight: 12 }, { reps: 12, weight: 14 }, { reps: 12, weight: 14 }] },
          { name: "Отжимания на брусьях", sets: [{ reps: 12, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 8, weight: 0 }] },
          { name: "Французский жим", sets: [{ reps: 12, weight: 20 }, { reps: 12, weight: 20 }, { reps: 10, weight: 22 }, { reps: 10, weight: 22 }] },
          { name: "Разгибания на блоке (трицепс)", sets: [{ reps: 15, weight: 20 }, { reps: 15, weight: 20 }, { reps: 12, weight: 25 }, { reps: 12, weight: 25 }] },
        ],
      },
      {
        title: "Грудь + Бицепс (B)",
        exercises: [
          { name: "Жим лёжа (пауза 1 сек)", sets: [{ reps: 10, weight: 40 }, { reps: 10, weight: 45 }, { reps: 8, weight: 47.5 }, { reps: 8, weight: 47.5 }] },
          { name: "Жим на наклонной (штанга)", sets: [{ reps: 10, weight: 35 }, { reps: 10, weight: 37.5 }, { reps: 8, weight: 40 }, { reps: 8, weight: 40 }] },
          { name: "Кроссовер (сведение рук)", sets: [{ reps: 15, weight: 15 }, { reps: 15, weight: 15 }, { reps: 12, weight: 20 }, { reps: 12, weight: 20 }] },
          { name: "Сгибания на бицепс (гантели стоя)", sets: [{ reps: 12, weight: 10 }, { reps: 12, weight: 10 }, { reps: 10, weight: 12 }, { reps: 10, weight: 12 }] },
          { name: "Сгибания молотки", sets: [{ reps: 12, weight: 10 }, { reps: 12, weight: 10 }, { reps: 10, weight: 12 }, { reps: 10, weight: 12 }] },
          { name: "Сгибания на скамье Скотта", sets: [{ reps: 12, weight: 12 }, { reps: 10, weight: 14 }, { reps: 10, weight: 14 }, { reps: 8, weight: 16 }] },
        ],
      },
      {
        title: "Памп: Грудь + Руки",
        exercises: [
          { name: "Отжимания (обычные)", sets: [{ reps: 15, weight: 0 }, { reps: 15, weight: 0 }, { reps: 12, weight: 0 }, { reps: 12, weight: 0 }] },
          { name: "Разводка на тренажёре (пек-дек)", sets: [{ reps: 15, weight: 20 }, { reps: 15, weight: 20 }, { reps: 12, weight: 25 }, { reps: 12, weight: 25 }] },
          { name: "Подъём на бицепс (штанга EZ)", sets: [{ reps: 12, weight: 20 }, { reps: 12, weight: 20 }, { reps: 10, weight: 22.5 }, { reps: 10, weight: 22.5 }] },
          { name: "Разгибания на блоке (канат)", sets: [{ reps: 15, weight: 20 }, { reps: 15, weight: 20 }, { reps: 12, weight: 25 }, { reps: 12, weight: 25 }] },
          { name: "Подъём гантелей на бицепс сидя", sets: [{ reps: 12, weight: 10 }, { reps: 12, weight: 10 }, { reps: 10, weight: 12 }, { reps: 10, weight: 12 }] },
        ],
      },
    ],
  },
  {
    name: "Плечи-Спина",
    sortOrder: 20,
    workouts: [
      {
        title: "Спина тяги + задняя дельта",
        exercises: [
          { name: "Тяга верхнего блока", sets: [{ reps: 12, weight: 35 }, { reps: 12, weight: 40 }, { reps: 10, weight: 45 }, { reps: 10, weight: 45 }] },
          { name: "Тяга штанги в наклоне", sets: [{ reps: 12, weight: 40 }, { reps: 10, weight: 45 }, { reps: 8, weight: 50 }, { reps: 8, weight: 50 }] },
          { name: "Тяга горизонтального блока", sets: [{ reps: 12, weight: 35 }, { reps: 12, weight: 35 }, { reps: 10, weight: 40 }, { reps: 10, weight: 40 }] },
          { name: "Тяга гантели к поясу", sets: [{ reps: 12, weight: 22 }, { reps: 12, weight: 22 }, { reps: 10, weight: 24 }, { reps: 10, weight: 24 }] },
          { name: "Разведение на заднюю дельту", sets: [{ reps: 15, weight: 10 }, { reps: 15, weight: 10 }, { reps: 12, weight: 12 }, { reps: 12, weight: 12 }] },
        ],
      },
      {
        title: "Плечи (жим) + Спина (тяга)",
        exercises: [
          { name: "Жим стоя (штанга)", sets: [{ reps: 10, weight: 30 }, { reps: 10, weight: 32.5 }, { reps: 8, weight: 35 }, { reps: 8, weight: 35 }] },
          { name: "Жим гантелей сидя", sets: [{ reps: 12, weight: 14 }, { reps: 10, weight: 16 }, { reps: 10, weight: 16 }, { reps: 8, weight: 18 }] },
          { name: "Подъём гантелей в стороны", sets: [{ reps: 15, weight: 8 }, { reps: 15, weight: 8 }, { reps: 12, weight: 10 }, { reps: 12, weight: 10 }] },
          { name: "Тяга верхнего блока широким хватом", sets: [{ reps: 12, weight: 35 }, { reps: 12, weight: 40 }, { reps: 10, weight: 45 }, { reps: 10, weight: 45 }] },
          { name: "Face Pull", sets: [{ reps: 15, weight: 15 }, { reps: 15, weight: 15 }, { reps: 12, weight: 20 }, { reps: 12, weight: 20 }] },
        ],
      },
      {
        title: "Тяговый день (широчайшие)",
        exercises: [
          { name: "Подтягивания (узкий хват)", sets: [{ reps: 8, weight: 0 }, { reps: 8, weight: 0 }, { reps: 6, weight: 0 }, { reps: 6, weight: 0 }] },
          { name: "Тяга верхнего блока обратным хватом", sets: [{ reps: 12, weight: 30 }, { reps: 12, weight: 35 }, { reps: 10, weight: 40 }, { reps: 10, weight: 40 }] },
          { name: "Тяга горизонтального блока узко", sets: [{ reps: 12, weight: 30 }, { reps: 12, weight: 35 }, { reps: 10, weight: 40 }, { reps: 10, weight: 40 }] },
          { name: "Шраги (гантели)", sets: [{ reps: 15, weight: 20 }, { reps: 15, weight: 20 }, { reps: 12, weight: 24 }, { reps: 12, weight: 24 }] },
          { name: "Подъём гантелей в стороны (памп)", sets: [{ reps: 15, weight: 6 }, { reps: 15, weight: 6 }, { reps: 15, weight: 6 }, { reps: 15, weight: 6 }] },
        ],
      },
    ],
  },
  {
    name: "Ноги",
    sortOrder: 30,
    workouts: [
      {
        title: "Квадрицепс + ягодицы",
        exercises: [
          { name: "Присед со штангой", sets: [{ reps: 10, weight: 50 }, { reps: 8, weight: 60 }, { reps: 8, weight: 60 }, { reps: 6, weight: 65 }] },
          { name: "Жим ногами", sets: [{ reps: 12, weight: 120 }, { reps: 12, weight: 120 }, { reps: 10, weight: 140 }, { reps: 10, weight: 140 }] },
          { name: "Выпады (гантели)", sets: [{ reps: 12, weight: 14 }, { reps: 12, weight: 14 }, { reps: 10, weight: 16 }, { reps: 10, weight: 16 }] },
          { name: "Разгибания ног", sets: [{ reps: 15, weight: 30 }, { reps: 15, weight: 30 }, { reps: 12, weight: 35 }, { reps: 12, weight: 35 }] },
          { name: "Ягодичный мост (штанга)", sets: [{ reps: 12, weight: 60 }, { reps: 10, weight: 70 }, { reps: 10, weight: 70 }, { reps: 8, weight: 80 }] },
        ],
      },
      {
        title: "Задняя поверхность + ягодицы",
        exercises: [
          { name: "Румынская тяга", sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 55 }, { reps: 8, weight: 60 }, { reps: 8, weight: 60 }] },
          { name: "Сгибания ног лёжа", sets: [{ reps: 15, weight: 25 }, { reps: 15, weight: 25 }, { reps: 12, weight: 30 }, { reps: 12, weight: 30 }] },
          { name: "Ягодичный мост (пауза)", sets: [{ reps: 12, weight: 50 }, { reps: 10, weight: 60 }, { reps: 10, weight: 60 }, { reps: 8, weight: 70 }] },
          { name: "Гиперэкстензии", sets: [{ reps: 15, weight: 0 }, { reps: 15, weight: 0 }, { reps: 12, weight: 0 }, { reps: 12, weight: 0 }] },
          { name: "Икроножные стоя", sets: [{ reps: 15, weight: 40 }, { reps: 15, weight: 40 }, { reps: 12, weight: 50 }, { reps: 12, weight: 50 }] },
        ],
      },
      {
        title: "Ноги (объём) + пресс",
        exercises: [
          { name: "Присед в смите", sets: [{ reps: 12, weight: 40 }, { reps: 10, weight: 45 }, { reps: 10, weight: 45 }, { reps: 8, weight: 50 }] },
          { name: "Жим ногами узко", sets: [{ reps: 15, weight: 100 }, { reps: 12, weight: 120 }, { reps: 12, weight: 120 }, { reps: 10, weight: 140 }] },
          { name: "Выпады назад (гантели)", sets: [{ reps: 12, weight: 12 }, { reps: 12, weight: 12 }, { reps: 10, weight: 14 }, { reps: 10, weight: 14 }] },
          { name: "Икроножные сидя", sets: [{ reps: 15, weight: 30 }, { reps: 15, weight: 30 }, { reps: 12, weight: 35 }, { reps: 12, weight: 35 }] },
          { name: "Планка", sets: [{ seconds: 40 }, { seconds: 40 }, { seconds: 30 }, { seconds: 30 }] },
        ],
      },
    ],
  },
];

async function findOrCreateExercise(userId: string, name: string): Promise<string> {
  const ex = await prisma.exercise.findFirst({
    where: { OR: [{ userId: null }, { userId }], name },
    select: { id: true },
  });
  if (ex) return ex.id;
  const created = await prisma.exercise.create({
    data: { name, userId },
  });
  return created.id;
}

/** Ленивый сидинг: создаёт 3 папки и 9 шаблонных тренировок, если у пользователя ещё нет папок. */
export async function seedUserLibraryIfEmpty(userId: string): Promise<void> {
  const folderCount = await prisma.workoutFolder.count({ where: { userId } });
  if (folderCount > 0) return;

  for (const folderData of SEED_FOLDERS) {
    const folder = await prisma.workoutFolder.create({
      data: {
        userId,
        name: folderData.name,
        sortOrder: folderData.sortOrder,
      },
    });

    for (const workoutData of folderData.workouts) {
      const session = await prisma.workoutSession.create({
        data: {
          userId,
          date: null,
          folderId: folder.id,
          title: workoutData.title,
        },
      });

      for (let orderIndex = 0; orderIndex < workoutData.exercises.length; orderIndex++) {
        const exData = workoutData.exercises[orderIndex];
        const exerciseId = await findOrCreateExercise(userId, exData.name);
        const plannedSets = exData.sets.length;

        const sessionEx = await prisma.sessionExercise.create({
          data: {
            sessionId: session.id,
            exerciseId,
            plannedSets,
            orderIndex,
          },
        });

        for (let i = 0; i < exData.sets.length; i++) {
          const s = exData.sets[i];
          const isTime = "seconds" in s;
          await prisma.set.create({
            data: {
              sessionExerciseId: sessionEx.id,
              reps: isTime ? s.seconds : s.reps,
              weight: isTime ? null : s.weight,
              valueType: isTime ? "time" : "reps",
            },
          });
        }
      }
    }
  }
}
