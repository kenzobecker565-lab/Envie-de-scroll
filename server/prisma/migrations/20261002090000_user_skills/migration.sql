-- Niveau déclaré dans les passions qui le demandent (Piano) : {"piano":"debutant"}.
ALTER TABLE "User" ADD COLUMN "skills" TEXT NOT NULL DEFAULT '{}';
