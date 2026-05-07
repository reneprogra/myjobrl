"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

export default function PhilosophySection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="philosophy" className="bg-black py-20 md:py-40 px-4 md:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-7xl lg:text-8xl text-white tracking-tight mb-14 md:mb-24 text-center"
        >
          Workers{" "}
          <em
            className="italic text-white/40"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            x
          </em>{" "}
          Clientes
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Worker */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="liquid-glass rounded-3xl overflow-hidden relative p-6 md:p-8"
          >
            <Image
              src="/images/screenshots/worker-profile.png"
              alt="Vista de Worker en MyJob"
              width={400}
              height={800}
              loading="lazy"
              className="w-full h-auto rounded-2xl mx-auto max-w-[240px] block"
            />
            <p className="text-white/40 text-xs tracking-widest uppercase mb-3 mt-6">Para Workers</p>
            <p className="text-white/70 text-sm md:text-base leading-relaxed">
              Potencia tu trabajo y haz que los clientes te encuentren a ti. Tú eliges qué turnos aceptar, cuándo trabajar y construyes tu reputación con cada servicio entregado.
            </p>
          </motion.div>

          {/* Cliente */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="liquid-glass rounded-3xl overflow-hidden relative p-6 md:p-8"
          >
            <Image
              src="/images/screenshots/client-dashboard.png"
              alt="Vista de Cliente en MyJob"
              width={400}
              height={800}
              loading="lazy"
              className="w-full h-auto rounded-2xl mx-auto max-w-[240px] block"
            />
            <p className="text-white/40 text-xs tracking-widest uppercase mb-3 mt-6">Para Clientes</p>
            <p className="text-white/70 text-sm md:text-base leading-relaxed">
              ¿Necesitas quien limpie tu casa, meseros para tu evento o una niñera de confianza? Publica el turno, espera unos minutos, y un worker calificado llegará a tu ubicación.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
