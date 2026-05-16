"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

export default function FeaturedSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-black pt-6 md:pt-10 pb-16 md:pb-32 px-4 md:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9 }}
        >
          {/* Mobile: image above, text below */}
          <div className="block md:hidden">
            <div className="rounded-3xl overflow-hidden aspect-[4/3] relative">
              <Image
                src="/images/app-mockup.png"
                alt="MyJob app mockup"
                fill
                loading="lazy"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60" />
            </div>
            <div className="mt-6 px-2 flex flex-col gap-4">
              <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
                <p className="text-white/50 text-xs tracking-widest uppercase mb-3">Nuestra misión</p>
                <p className="text-white text-sm leading-relaxed">
                  Creemos que el trabajo debe encontrar a las personas, no al revés. Cada turno publicado es una oportunidad real, cada worker un talento esperando ser descubierto.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium self-start"
              >
                Conoce más
              </motion.button>
            </div>
          </div>

          {/* Desktop: image with overlay */}
          <div className="hidden md:block rounded-3xl overflow-hidden aspect-video relative">
            <Image
              src="/images/app-mockup.png"
              alt="MyJob app mockup"
              fill
              loading="lazy"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-10 flex flex-row items-end justify-between gap-6">
              <div className="liquid-glass rounded-2xl p-8 max-w-md">
                <p className="text-white/50 text-xs tracking-widest uppercase mb-3">Nuestra misión</p>
                <p className="text-white text-base leading-relaxed">
                  Creemos que el trabajo debe encontrar a las personas, no al revés. Cada turno publicado es una oportunidad real, cada worker un talento esperando ser descubierto.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium flex-shrink-0"
              >
                Conoce más
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
