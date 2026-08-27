import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import type { EntreeDiagnostic } from "./analyse.schema";

/**
 * Diagnostic IA d'une comparaison de prix (page Chercheur : plusieurs régions
 * pour un même produit, ou plusieurs produits pour une même région).
 *
 * Même philosophie que le chatbot (`chatbot.service.ts`) : on calcule d'abord
 * des faits chiffrés à partir des données réellement reçues (jamais de
 * connaissances générales du modèle), on les résume en texte, puis Gemini se
 * contente de les reformuler en quelques phrases claires. Si Gemini est
 * indisponible, un mode de repli local produit un texte équivalent à partir
 * des mêmes faits — le diagnostic fonctionne donc toujours.
 */

type EntiteEntree = EntreeDiagnostic["entites"][number];

interface FaitEntite {
  label: string;
  premierPrix: number | null;
  dernierPrix: number | null;
  variationPourcent: number | null;
  prediction: { prixPredit: number; margeErreurFcfa: number | null } | null;
}

function calculerFaits(entite: EntiteEntree): FaitEntite {
  const points = [...entite.historique].sort((a, b) => a.date.localeCompare(b.date));
  const premierPrix = points[0]?.prixFcfa ?? null;
  const dernierPrix = points.length > 0 ? points[points.length - 1].prixFcfa : null;
  const variationPourcent =
    premierPrix !== null && dernierPrix !== null && premierPrix !== 0
      ? ((dernierPrix - premierPrix) / premierPrix) * 100
      : null;

  return {
    label: entite.label,
    premierPrix,
    dernierPrix,
    variationPourcent,
    prediction: entite.prediction,
  };
}

function formaterVariation(variation: number | null): string {
  if (variation === null) return "variation inconnue";
  const signe = variation >= 0 ? "+" : "";
  return `${signe}${variation.toFixed(1)}%`;
}

function construireResume(mode: EntreeDiagnostic["mode"], axeFixeLabel: string, faits: FaitEntite[]): string {
  const intitule = mode === "REGIONS" ? `régions comparées pour ${axeFixeLabel}` : `produits comparés pour ${axeFixeLabel}`;

  const lignes = faits.map((fait) => {
    const evolution =
      fait.premierPrix !== null && fait.dernierPrix !== null
        ? `${fait.premierPrix.toLocaleString("fr-FR")} → ${fait.dernierPrix.toLocaleString("fr-FR")} FCFA (${formaterVariation(fait.variationPourcent)})`
        : "historique insuffisant sur la période";
    const prediction = fait.prediction
      ? `, prédiction du mois suivant : ${fait.prediction.prixPredit.toLocaleString("fr-FR")} FCFA${
          fait.prediction.margeErreurFcfa != null ? ` (± ${Math.round(fait.prediction.margeErreurFcfa)} FCFA)` : ""
        }`
      : "";
    return `- ${fait.label} : ${evolution}${prediction}`;
  });

  return [`Comparaison des ${intitule} :`, ...lignes].join("\n");
}

function construirePrompt(resume: string): string {
  return [
    "Tu es l'assistant d'analyse de SunuPrix, une plateforme pédagogique de suivi des prix au Sénégal.",
    "Interprète la comparaison ci-dessous en 2 à 4 phrases claires, précises et utiles pour un chercheur.",
    "Base-toi UNIQUEMENT sur les chiffres fournis : ne cite aucun chiffre absent de ces données et n'invente aucune cause.",
    "Mets en avant l'écart ou la tendance la plus notable, en termes simples.",
    "Termine par une courte phrase rappelant que ces données sont fictives, à but pédagogique.",
    "",
    resume,
  ].join("\n");
}

async function essayerGemini(resume: string): Promise<string> {
  if (!env.geminiApiKey) {
    throw new Error("GEMINI_API_KEY absente : bascule sur le mode de repli local.");
  }

  const client = new GoogleGenerativeAI(env.geminiApiKey);
  const modele = client.getGenerativeModel({ model: env.geminiModel });

  const resultat = await modele.generateContent(construirePrompt(resume));
  const texte = resultat.response.text()?.trim();

  if (!texte) {
    throw new Error("Réponse Gemini vide.");
  }
  return texte;
}

function genererDiagnosticRepli(faits: FaitEntite[]): string {
  const avecVariation = faits.filter((f) => f.variationPourcent !== null);
  const plusNotable =
    avecVariation.length > 0
      ? avecVariation.reduce((max, f) =>
          Math.abs(f.variationPourcent as number) > Math.abs(max.variationPourcent as number) ? f : max,
        )
      : null;

  const phrasesEcarts = faits
    .map((fait) => {
      if (fait.variationPourcent === null) return `${fait.label} : historique insuffisant pour dégager une tendance.`;
      const direction = fait.variationPourcent >= 0 ? "en hausse" : "en baisse";
      return `${fait.label} est ${direction} de ${Math.abs(fait.variationPourcent).toFixed(1)}% sur la période.`;
    })
    .join(" ");

  const phraseNotable = plusNotable
    ? ` La variation la plus marquée concerne ${plusNotable.label} (${formaterVariation(plusNotable.variationPourcent)}).`
    : "";

  return `🌾 (mode hors-ligne — diagnostic généré localement) ${phrasesEcarts}${phraseNotable} Ces données sont fictives et générées à des fins pédagogiques.`;
}

export async function genererDiagnostic(
  donnees: EntreeDiagnostic,
): Promise<{ texte: string; source: "GEMINI" | "REPLI_LOCAL" }> {
  const faits = donnees.entites.map(calculerFaits);
  const resume = construireResume(donnees.mode, donnees.axeFixeLabel, faits);

  try {
    const texte = await essayerGemini(resume);
    return { texte, source: "GEMINI" };
  } catch (erreur) {
    // eslint-disable-next-line no-console
    console.warn(
      "[SunuPrix][analyse] Appel Gemini indisponible, bascule sur le mode de repli local :",
      erreur instanceof Error ? erreur.message : erreur,
    );
    return { texte: genererDiagnosticRepli(faits), source: "REPLI_LOCAL" };
  }
}
