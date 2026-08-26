-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('ADMIN', 'CHERCHEUR', 'MINISTERE', 'VENDEUR', 'CONSOMMATEUR');

-- CreateEnum
CREATE TYPE "SourcePrix" AS ENUM ('SYSTEME', 'VENDEUR');

-- CreateEnum
CREATE TYPE "StatutPrix" AS ENUM ('VALIDE', 'EN_ATTENTE', 'REJETE');

-- CreateEnum
CREATE TYPE "SeveriteAlerte" AS ENUM ('INFO', 'ATTENTION', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "RoleMessage" AS ENUM ('UTILISATEUR', 'ASSISTANT');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "prixBaseFcfa" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "releves_de_prix" (
    "id" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "prixFcfa" DOUBLE PRECISION NOT NULL,
    "source" "SourcePrix" NOT NULL,
    "statut" "StatutPrix" NOT NULL DEFAULT 'VALIDE',
    "dateReleve" TIMESTAMP(3) NOT NULL,
    "vendeurId" TEXT,
    "moderateurId" TEXT,
    "modereLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "releves_de_prix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "dateCible" TIMESTAMP(3) NOT NULL,
    "prixPredit" DOUBLE PRECISION NOT NULL,
    "margeErreurFcfa" DOUBLE PRECISION,
    "methode" TEXT NOT NULL,
    "genereLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertes" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "produitId" TEXT,
    "regionId" TEXT,
    "seuilPourcent" DOUBLE PRECISION NOT NULL,
    "severite" "SeveriteAlerte" NOT NULL DEFAULT 'INFO',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonces" (
    "id" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "publieeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuration_seuils" (
    "id" TEXT NOT NULL,
    "seuilAttentionPourcent" DOUBLE PRECISION NOT NULL,
    "seuilCritiquePourcent" DOUBLE PRECISION NOT NULL,
    "misAJourLe" TIMESTAMP(3) NOT NULL,
    "misAJourParId" TEXT,

    CONSTRAINT "configuration_seuils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations_chatbot" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_chatbot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_role_idx" ON "utilisateurs"("role");

-- CreateIndex
CREATE UNIQUE INDEX "regions_nom_key" ON "regions"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "produits_nom_key" ON "produits"("nom");

-- CreateIndex
CREATE INDEX "releves_de_prix_produitId_regionId_dateReleve_idx" ON "releves_de_prix"("produitId", "regionId", "dateReleve");

-- CreateIndex
CREATE INDEX "releves_de_prix_statut_idx" ON "releves_de_prix"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "predictions_produitId_regionId_dateCible_key" ON "predictions"("produitId", "regionId", "dateCible");

-- CreateIndex
CREATE INDEX "alertes_utilisateurId_idx" ON "alertes"("utilisateurId");

-- CreateIndex
CREATE INDEX "notifications_utilisateurId_lue_idx" ON "notifications"("utilisateurId", "lue");

-- CreateIndex
CREATE INDEX "conversations_chatbot_utilisateurId_idx" ON "conversations_chatbot"("utilisateurId");

-- AddForeignKey
ALTER TABLE "releves_de_prix" ADD CONSTRAINT "releves_de_prix_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releves_de_prix" ADD CONSTRAINT "releves_de_prix_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releves_de_prix" ADD CONSTRAINT "releves_de_prix_vendeurId_fkey" FOREIGN KEY ("vendeurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releves_de_prix" ADD CONSTRAINT "releves_de_prix_moderateurId_fkey" FOREIGN KEY ("moderateurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes" ADD CONSTRAINT "alertes_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes" ADD CONSTRAINT "alertes_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes" ADD CONSTRAINT "alertes_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration_seuils" ADD CONSTRAINT "configuration_seuils_misAJourParId_fkey" FOREIGN KEY ("misAJourParId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations_chatbot" ADD CONSTRAINT "conversations_chatbot_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
