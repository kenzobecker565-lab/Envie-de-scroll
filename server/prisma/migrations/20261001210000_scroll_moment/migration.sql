-- Moment où l'utilisateur scrolle le plus (matin, midi, soir, nuit) : la relance du bot arrive juste avant.
ALTER TABLE "User" ADD COLUMN "scrollMoment" TEXT;
