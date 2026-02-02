import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MUSCLE_GROUPS = [
  "Грудь",
  "Спина",
  "Ноги",
  "Плечи",
  "Бицепс",
  "Трицепс",
  "Пресс",
  "Ягодицы",
];

const EXERCISES: { name: string; muscleGroupNames: string[] }[] = [
  { name: "Жим лёжа", muscleGroupNames: ["Грудь", "Трицепс", "Плечи"] },
  { name: "Приседания со штангой", muscleGroupNames: ["Ноги", "Ягодицы"] },
  { name: "Становая тяга", muscleGroupNames: ["Спина", "Ноги", "Ягодицы"] },
  { name: "Подтягивания", muscleGroupNames: ["Спина", "Бицепс"] },
  { name: "Жим стоя", muscleGroupNames: ["Плечи", "Трицепс"] },
  { name: "Сгибания на бицепс", muscleGroupNames: ["Бицепс"] },
  { name: "Французский жим", muscleGroupNames: ["Трицепс"] },
  { name: "Планка", muscleGroupNames: ["Пресс"] },
  { name: "Скручивания", muscleGroupNames: ["Пресс"] },
  { name: "Отжимания", muscleGroupNames: ["Грудь", "Трицепс"] },
  { name: "Выпады", muscleGroupNames: ["Ноги", "Ягодицы"] },
  { name: "Болгарские сплит-приседы", muscleGroupNames: ["Ноги", "Ягодицы"] },
  { name: "Жим ногами", muscleGroupNames: ["Ноги", "Ягодицы"] },
  { name: "Разгибания ног", muscleGroupNames: ["Ноги"] },
  { name: "Сгибания ног", muscleGroupNames: ["Ноги"] },
  { name: "Подъёмы на икры", muscleGroupNames: ["Ноги"] },
  { name: "Гиперэкстензия", muscleGroupNames: ["Спина", "Ягодицы"] },
  { name: "Ягодичный мост", muscleGroupNames: ["Ягодицы"] },
  { name: "Hip Thrust", muscleGroupNames: ["Ягодицы"] },
  { name: "Тяга верхнего блока", muscleGroupNames: ["Спина", "Бицепс"] },
  { name: "Тяга горизонтального блока", muscleGroupNames: ["Спина"] },
  { name: "Тяга гантели в наклоне", muscleGroupNames: ["Спина", "Бицепс"] },
  { name: "Тяга Т-грифа", muscleGroupNames: ["Спина"] },
  { name: "Шраги", muscleGroupNames: ["Плечи"] },
  { name: "Жим под наклоном", muscleGroupNames: ["Грудь", "Трицепс"] },
  { name: "Жим гантелей лёжа", muscleGroupNames: ["Грудь", "Трицепс"] },
  { name: "Сведения в кроссовере", muscleGroupNames: ["Грудь"] },
  { name: "Отжимания на брусьях", muscleGroupNames: ["Грудь", "Трицепс"] },
  { name: "Разведения в стороны", muscleGroupNames: ["Плечи"] },
  { name: "Разведения в наклоне", muscleGroupNames: ["Плечи"] },
  { name: "Тяга штанги к подбородку", muscleGroupNames: ["Плечи"] },
  { name: "Сгибания со штангой", muscleGroupNames: ["Бицепс"] },
  { name: "Сгибания с гантелями", muscleGroupNames: ["Бицепс"] },
  { name: "Молотки", muscleGroupNames: ["Бицепс"] },
  { name: "Разгибания на блоке", muscleGroupNames: ["Трицепс"] },
  { name: "Отжимания узким хватом", muscleGroupNames: ["Трицепс", "Грудь"] },
  { name: "Боковая планка", muscleGroupNames: ["Пресс"] },
  { name: "Подъём ног", muscleGroupNames: ["Пресс"] },
  { name: "Велосипед", muscleGroupNames: ["Пресс"] },
];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

async function main() {
  const email = process.env.TEST_USER_EMAIL ?? "test@fitness.app";
  const password = process.env.TEST_USER_PASSWORD ?? "test12345";
  const passwordHash = await bcrypt.hash(password, 12);

  const muscleGroups: Record<string, number> = {};
  for (const name of MUSCLE_GROUPS) {
    const mg = await prisma.muscleGroup.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    muscleGroups[name] = mg.id;
  }

  for (const ex of EXERCISES) {
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name, userId: null },
    });
    if (!existing) {
      await prisma.exercise.create({
        data: {
          name: ex.name,
          userId: null,
          exerciseMuscleGroups: {
            create: ex.muscleGroupNames.map((name) => ({
              muscleGroupId: muscleGroups[name],
            })),
          },
        },
      });
    }
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });

  const allExercises = await prisma.exercise.findMany({
    where: { userId: null },
    orderBy: { name: "asc" },
  });
  const exerciseByName = new Map(allExercises.map((e) => [e.name, e]));

  const workoutTemplates: string[][] = [
    ["Жим лёжа", "Приседания со штангой", "Становая тяга", "Планка"],
    ["Подтягивания", "Жим стоя", "Французский жим", "Сгибания на бицепс", "Скручивания"],
    ["Жим лёжа", "Отжимания", "Выпады", "Планка"],
    ["Становая тяга", "Подтягивания", "Жим стоя", "Планка"],
    ["Приседания со штангой", "Жим лёжа", "Сгибания на бицепс", "Скручивания"],
    ["Подтягивания", "Отжимания", "Французский жим", "Планка"],
    ["Становая тяга", "Жим стоя", "Выпады", "Сгибания на бицепс"],
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 0; day < 7; day++) {
    const date = addDays(today, day);

    const existing = await prisma.workoutSession.findFirst({
      where: { userId: user.id, date },
    });
    if (existing) continue;

    const template = workoutTemplates[day % workoutTemplates.length];
    const exercisesToAdd = template
      .map((name) => exerciseByName.get(name))
      .filter(Boolean);

    if (exercisesToAdd.length === 0) continue;

    await prisma.workoutSession.create({
      data: {
        userId: user.id,
        date,
        title: `Тренировка`,
        sessionExercises: {
          create: exercisesToAdd.map((ex, i) => ({
            exerciseId: ex!.id,
            plannedSets: [3, 3, 4, 3, 4][i % 5] ?? 3,
            orderIndex: i,
          })),
        },
      },
    });
  }

  console.log(
    "Seed completed: muscle groups, exercises, test user, 7-day workouts"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
