/**
 * Script to create test user (alternative to seed).
 * Run: npx tsx scripts/create-test-user.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.TEST_USER_EMAIL ?? "test@fitness.app";
  const password = process.env.TEST_USER_PASSWORD ?? "test12345";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });

  console.log(`Test user created: ${email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
