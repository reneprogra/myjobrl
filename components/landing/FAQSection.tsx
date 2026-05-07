"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    q: "¿Cuánto cuesta usar MyJob?",
    a: "Registrarte es gratis, tanto para clientes como para workers.",
  },
  {
    q: "¿Cómo se hace el pago?",
    a: "Mediante Stripe.",
  },
  {
    q: "¿Qué pasa si un worker no llega?",
    a: "Tienes 15 minutos para que un worker confirme el turno. Si no lo acepta, el turno vuelve a estar disponible para otros workers. Si ya lo aceptó pero no llega, será sancionado temporalmente.",
  },
  {
    q: "¿Cómo sé que el worker es confiable?",
    a: "Cada worker tiene perfil verificado, portafolio de fotos y calificaciones reales de clientes anteriores.",
  },
  {
    q: "¿Puedo ser cliente y worker al mismo tiempo?",
    a: "Sí, puedes manejar ambos roles desde la misma cuenta.",
  },
  {
    q: "¿En qué ciudades funciona MyJob?",
    a: "Estamos arrancando en México y expandiéndonos rápido. Si tu ciudad no aparece, regístrate y te avisamos cuando lleguemos.",
  },
  {
    q: "¿Necesito instalar algo?",
    a: "MyJob es una PWA: la instalas desde el navegador en segundos, sin pasar por el App Store.",
  },
];

export default function FAQSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  return (
    <section id="faq" className="bg-black py-28 md:py-40 px-6">
      <div className="max-w-4xl mx-auto" ref={ref}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-3xl md:text-5xl text-white tracking-tight mb-16"
        >
          Preguntas frecuentes
        </motion.h2>

        <div>
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="liquid-glass rounded-2xl mb-3 overflow-hidden"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-white font-medium text-sm md:text-base pr-4">{faq.q}</span>
                {openIndex === i ? (
                  <ChevronUp size={18} className="text-white/50 flex-shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-white/50 flex-shrink-0" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <p className="px-6 pb-5 text-white/60 text-sm leading-relaxed pt-0">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
