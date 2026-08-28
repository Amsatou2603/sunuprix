-- Ajoute la connexion via Google (OAuth) et via téléphone (OTP SMS Twilio) :
-- email et mot de passe deviennent optionnels (un compte Google ou téléphone
-- n'a pas forcément l'un ou l'autre), et deux nouvelles colonnes uniques
-- accueillent le numéro de téléphone (E.164) et l'identifiant Google.

-- AlterTable
ALTER TABLE "utilisateurs" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "utilisateurs" ALTER COLUMN "motDePasseHash" DROP NOT NULL;
ALTER TABLE "utilisateurs" ADD COLUMN "telephone" TEXT;
ALTER TABLE "utilisateurs" ADD COLUMN "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_telephone_key" ON "utilisateurs"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_googleId_key" ON "utilisateurs"("googleId");
