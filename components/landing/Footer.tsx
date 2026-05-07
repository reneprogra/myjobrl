"use client";

import { Briefcase, Globe } from "lucide-react";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const links = [
  { label: "Cómo funciona", id: "como-funciona" },
  { label: "Para Workers", id: "philosophy" },
  { label: "Para Clientes", id: "philosophy" },
  { label: "FAQ", id: "faq" },
];

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-0">
          {/* Left */}
          <div>
            <div className="flex items-center gap-2">
              <Briefcase size={28} className="text-white" />
              <span className="text-white font-semibold text-xl">MyJob</span>
            </div>
            <p className="text-white/40 text-sm mt-3">El mercado de trabajo local.</p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-6">
              {/* Instagram */}
              <a href="#" className="liquid-glass rounded-full p-3 text-white/60 hover:text-white hover:bg-white/5 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              {/* X / Twitter */}
              <a href="#" className="liquid-glass rounded-full p-3 text-white/60 hover:text-white hover:bg-white/5 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* Globe */}
              <a href="#" className="liquid-glass rounded-full p-3 text-white/60 hover:text-white hover:bg-white/5 transition-all">
                <Globe size={16} />
              </a>
            </div>
          </div>

          {/* Right */}
          <div className="md:flex md:justify-end md:items-start">
            <div className="flex flex-wrap gap-6">
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.id)}
                  className="text-white/40 hover:text-white text-sm transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-12 pt-8">
          <p className="text-white/20 text-xs text-center">
            © 2026 MyJob. Hecho con 🧡 en México.
          </p>
        </div>
      </div>
    </footer>
  );
}
