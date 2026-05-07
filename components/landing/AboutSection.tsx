"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="bg-black pt-24 md:pt-44 pb-10 md:pb-14 px-4 md:px-6 overflow-hidden">
      <div className="bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_70%)]">
        <div className="max-w-6xl mx-auto" ref={ref}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-white/40 text-sm tracking-widest uppercase mb-6"
          >
            Sobre MyJob
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-3xl md:text-6xl lg:text-7xl text-white leading-[1.15] tracking-tight"
          >
            <span
              className="italic text-white/60"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              Conectando talento
            </span>{" "}
            con quienes lo necesitan,
            <br className="hidden md:block" />
            <span
              className="italic text-white/60"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              al instante, sin barreras.
            </span>
          </motion.h2>
        </div>
      </div>
    </section>
  );
}
