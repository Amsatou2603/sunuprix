import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-gray-200/80 bg-white py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        {/* Logo left */}
        <div className="flex items-center gap-3">
          <Image src="/design/icon.svg" alt="SunuPrix Logo" width={32} height={32} />
          <span className="font-serif text-xl font-bold text-[#0B4736]">
            Sunu<span className="text-[#04281E]">Prix</span>
          </span>
        </div>

        {/* Center links */}
        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-gray-500">
          <Link href="/a-propos" className="hover:text-[#00B493] transition">
            Politique de Confidentialité
          </Link>
          <Link href="/a-propos" className="hover:text-[#00B493] transition">
            Conditions d&apos;Utilisation
          </Link>
          <Link href="/a-propos" className="hover:text-[#00B493] transition">
            Contact
          </Link>
          <Link href="/a-propos" className="hover:text-[#00B493] transition">
            Aide
          </Link>
        </div>

        {/* Right copyright text */}
        <div className="text-right text-xs text-gray-400">
          <p>© 2024 SunuPrix AI. Tous droits réservés.</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Expertise de données au Sénégal.</p>
        </div>
      </div>
    </footer>
  );
}

