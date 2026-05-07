import Link from 'next/link'

const faqs = [
  {
    q: '¿Cómo publico un turno?',
    a: 'Ve a la sección "Turnos" y presiona el botón "Publicar nuevo turno". Completa los datos del trabajo, fecha, horario y pago, y tu turno quedará publicado para que los workers puedan aplicar.',
  },
  {
    q: '¿Cómo aplico a un turno?',
    a: 'Busca turnos disponibles en tu zona desde el dashboard o la sección "Turnos". Presiona en el turno que te interesa y luego "Aplicar". Puedes agregar un mensaje y proponer un pago alternativo.',
  },
  {
    q: '¿Cómo se realizan los pagos?',
    a: 'Los pagos se coordinan directamente entre el cliente y el worker al finalizar el turno. Próximamente integraremos pagos seguros con Stripe dentro de la app.',
  },
  {
    q: '¿Qué son los grupos?',
    a: 'Los grupos permiten a los workers unirse en equipos por categoría y ciudad. Los clientes pueden contratar grupos completos para trabajos más grandes o eventos.',
  },
  {
    q: '¿Cómo califico a un worker o cliente?',
    a: 'Al finalizar un turno, ambas partes pueden dejar una calificación y reseña. Esto ayuda a mantener la calidad del servicio en la plataforma.',
  },
  {
    q: '¿Qué pasa si cancelo un turno?',
    a: 'Las cancelaciones frecuentes pueden generar advertencias en tu perfil. Te recomendamos solo aplicar o publicar turnos que puedas cumplir.',
  },
  {
    q: '¿Cómo verifico mi identidad?',
    a: 'La verificación de identidad estará disponible próximamente. Un perfil verificado genera más confianza en clientes y workers.',
  },
  {
    q: '¿Cómo contacto a soporte?',
    a: 'Usa la opción "Reportar problema" en los ajustes para enviarnos un mensaje. Nuestro equipo te responderá a la brevedad.',
  },
]

export default function HelpPage() {
  return (
    <div className="px-4 py-6" style={{ background: '#F8F6F1', minHeight: '100vh' }}>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="p-2 rounded-xl"
          style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
          Centro de ayuda
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {faqs.map((faq, i) => (
          <div key={i} className="p-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
            <p className="font-semibold text-sm mb-2" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
              {faq.q}
            </p>
            <p className="text-sm" style={{ color: '#6B6860', lineHeight: '1.6' }}>
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
        <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>¿No encontraste lo que buscabas?</p>
        <p className="text-sm mt-1" style={{ color: '#6B6860' }}>
          Usa{' '}
          <Link href="/settings/report" className="underline" style={{ color: '#1A1A1A' }}>
            Reportar problema
          </Link>{' '}
          para contactarnos.
        </p>
      </div>
    </div>
  )
}
