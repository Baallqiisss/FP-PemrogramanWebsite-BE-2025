-- CreateTable
CREATE TABLE "GameScores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "max_combo" INTEGER NOT NULL DEFAULT 0,
    "time_taken" INTEGER NOT NULL,
    "matched_pairs" INTEGER NOT NULL,
    "total_pairs" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameScores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameScores_game_id_score_idx" ON "GameScores"("game_id", "score");

-- CreateIndex
CREATE INDEX "GameScores_user_id_idx" ON "GameScores"("user_id");

-- AddForeignKey
ALTER TABLE "GameScores" ADD CONSTRAINT "GameScores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameScores" ADD CONSTRAINT "GameScores_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
