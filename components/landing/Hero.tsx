"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, ArrowRight, Globe } from "lucide-react";

export default function Hero() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/signup?email=${encodeURIComponent(email)}`);
  }

  function scrollToAbout() {
    const el = document.getElementById("about");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="min-h-screen overflow-hidden relative flex flex-col">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-new2.jpg"
          alt="Hombre joven sonriendo en calle urbana al atardecer"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/85" />
      </div>

      {/* Navbar */}
      <div className="relative z-20 px-4 py-6 md:px-6">
        <div className="liquid-glass rounded-full max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center">
            <Briefcase size={22} className="text-white" />
            <span className="text-white font-semibold text-base ml-2">MyJob</span>
            <div className="hidden md:flex items-center gap-8 ml-8">
              <button
                onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
                className="text-white/80 hover:text-white text-sm font-medium transition-colors"
              >
                Cómo funciona
              </button>
              <button
                onClick={() => document.getElementById("philosophy")?.scrollIntoView({ behavior: "smooth" })}
                className="text-white/80 hover:text-white text-sm font-medium transition-colors"
              >
                Para Workers
              </button>
              <button
                onClick={() => document.getElementById("philosophy")?.scrollIntoView({ behavior: "smooth" })}
                className="text-white/80 hover:text-white text-sm font-medium transition-colors"
              >
                Para Clientes
              </button>
            </div>
          </div>

          {/* Right — desktop: login + register; mobile: register only */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:inline text-white text-sm font-medium hover:text-white/80 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="liquid-glass rounded-full px-5 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors"
            >
              Registrarme
            </Link>
          </div>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-12 text-center -translate-y-[5%] md:-translate-y-[10%]">
        {/* Heading */}
        <h1
          className="text-4xl md:text-6xl lg:text-9xl text-white tracking-tight mb-8 md:whitespace-nowrap"
          style={{ fontFamily: "var(--font-instrument-serif), serif" }}
        >
          El trabajo te <em className="italic">busca</em> a ti
        </h1>

        {/* Email input */}
        <form onSubmit={handleSubmit} className="max-w-xl w-full mb-6">
          <div className="liquid-glass rounded-full pl-5 pr-2 py-2 flex items-center gap-3 min-h-[52px]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo para entrar a MyJob"
              className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm outline-none min-w-0"
            />
            <button
              type="submit"
              className="bg-white rounded-full p-3 text-black hover:bg-white/90 transition-colors flex-shrink-0"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </form>

        {/* Subtitle */}
        <p className="text-white/80 text-sm leading-relaxed px-2 max-w-xl mb-8">
          Conectamos workers y clientes en minutos. Publica un turno o acepta uno cerca de ti — sin intermediarios, sin fricción.
        </p>

        {/* Manifesto button */}
        <button
          onClick={scrollToAbout}
          className="liquid-glass rounded-full px-8 py-3 min-h-[44px] flex items-center text-white text-sm font-medium hover:bg-white/5 transition-colors"
        >
          Conoce nuestro manifiesto
        </button>
      </div>

      {/* Social icons */}
      <div className="relative z-10 flex justify-center gap-5 pb-12">
        {/* Instagram */}
        <a href="#" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </a>
        {/* X / Twitter */}
        <a href="#" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a href="#" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all">
          <Globe size={20} />
        </a>
      </div>
    </section>
  );
}
