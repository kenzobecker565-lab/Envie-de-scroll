-- Thème de l'app choisi par l'utilisateur (pop par défaut).
ALTER TABLE "User" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'pop';
