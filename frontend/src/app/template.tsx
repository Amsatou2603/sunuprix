"use client";

import { motion } from "framer-motion";

/**
 * Fichier spécial Next.js App Router : contrairement à `layout.tsx`, un
 * `template.tsx` est remonté à chaque navigation, ce qui permet une
 * animation d'entrée à chaque changement de page (Next ne propose pas
 * nativement d'animation de sortie sans bibliothèque tierce dédiée aux
 * routes — cette entrée douce suffit à l'effet recherché).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
