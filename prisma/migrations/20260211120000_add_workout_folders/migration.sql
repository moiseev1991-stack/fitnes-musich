-- CreateTable: папки для базы тренировок (шаблоны)
CREATE TABLE IF NOT EXISTS "WorkoutFolder" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutFolder_pkey" PRIMARY KEY ("id")
);

-- Index for listing folders by user
CREATE INDEX IF NOT EXISTS "WorkoutFolder_user_id_idx" ON "WorkoutFolder"("user_id");

-- FK: папка принадлежит пользователю
ALTER TABLE "WorkoutFolder" ADD CONSTRAINT "WorkoutFolder_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add column folder_id to WorkoutSession (nullable: только у шаблонов)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WorkoutSession' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE "WorkoutSession" ADD COLUMN "folder_id" TEXT;
  END IF;
END $$;

-- Index for listing sessions by folder
CREATE INDEX IF NOT EXISTS "WorkoutSession_folder_id_idx" ON "WorkoutSession"("folder_id");

-- FK: сессия может быть в папке (шаблон)
ALTER TABLE "WorkoutSession" DROP CONSTRAINT IF EXISTS "WorkoutSession_folder_id_fkey";
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_folder_id_fkey"
  FOREIGN KEY ("folder_id") REFERENCES "WorkoutFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
