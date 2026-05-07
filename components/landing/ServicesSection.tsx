"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const cards = [
  {
    image: "/images/screenshots/worker-applications.png",
    tag: "WORKER",
    title: "Acepta turnos cerca de ti",
    description:
      "Recibe alertas de turnos disponibles según tu ubicación. Si la oferta te conviene, la aceptas. Llegas, trabajas, cobras.",
  },
  {
    image: "/images/screenshots/client-publish.png",
    tag: "CLIENTE",
    title: "Publica y olvídate",
    description:
      "Sube el turno del servicio que necesitas. Un worker calificado lo aceptará en minutos y llegará a tu ubicación. Le pagas al terminar.",
  },
];

export default function ServicesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="como-funciona" className="bg-black py-28 md:py-40 px-6 overflow-hidden">
      <div className="bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_60%)]">
        <div className="max-w-6xl mx-auto" ref={ref}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="flex items-center justify-between mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-5xl text-white tracking-tight">Así funciona</h2>
            <span className="hidden md:block text-white/40 text-sm">En dos pasos</span>
          </motion.div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {cards.map((card, i) => (
              <motion.div
                key={card.tag}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                className="liquid-glass rounded-3xl overflow-hidden group"
              >
                {/* Image area */}
                <div className="aspect-video relative overflow-hidden bg-black/40 flex items-center justify-center">
                  <Image
                    src={card.image}
                    alt={card.title}
                    width={300}
                    height={600}
                    loading="lazy"
                    className="w-auto h-[90%] object-contain transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest text-white/40 text-xs">{card.tag}</span>
                    <div className="liquid-glass rounded-full p-2 text-white/60">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                  <h3 className="text-white text-xl md:text-2xl tracking-tight">{card.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
