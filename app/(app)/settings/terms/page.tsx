import Link from 'next/link'

export default function TermsPage() {
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
          Términos y condiciones
        </h1>
      </div>

      <div className="flex flex-col gap-4 text-sm" style={{ color: '#1A1A1A', lineHeight: '1.7' }}>
        <div className="p-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
          <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Última actualización: Abril 2026</p>
          <p style={{ color: '#6B6860' }}>
            Bienvenido a MyJob. Al usar esta plataforma aceptas los siguientes términos y condiciones. Léelos con atención.
          </p>
        </div>

        {[
          {
            title: '1. Uso de la plataforma',
            body: 'MyJob es una plataforma que conecta clientes que necesitan servicios con workers independientes. No somos empleadores ni intermediarios laborales formales. Cada usuario es responsable de sus propias acciones y acuerdos.',
          },
          {
            title: '2. Registro y cuenta',
            body: 'Para usar MyJob debes registrarte con información veraz y mantener tu cuenta segura. Eres responsable de toda la actividad que ocurra bajo tu cuenta. Nos reservamos el derecho de suspender cuentas que violen estos términos.',
          },
          {
            title: '3. Publicación de turnos',
            body: 'Los clientes deben publicar turnos con información precisa sobre el trabajo, horario, ubicación y pago. Publicar información falsa o engañosa puede resultar en la suspensión de tu cuenta.',
          },
          {
            title: '4. Aplicaciones y contrataciones',
            body: 'Los workers pueden aplicar a los turnos disponibles. La aceptación de una aplicación no garantiza un contrato laboral formal. Las partes deben acordar los términos específicos del servicio directamente.',
          },
          {
            title: '5. Pagos',
            body: 'Los pagos se coordinan actualmente entre las partes. MyJob no procesa ni retiene pagos en este momento. Próximamente integraremos pagos seguros a través de Stripe. El incumplimiento de pagos puede reportarse a través de la función de reporte.',
          },
          {
            title: '6. Calificaciones y reseñas',
            body: 'Las calificaciones deben ser honestas y basadas en experiencias reales. Calificaciones malintencionadas o falsas pueden resultar en la eliminación de la reseña y posibles sanciones a la cuenta.',
          },
          {
            title: '7. Privacidad',
            body: 'Recopilamos información necesaria para operar la plataforma. No vendemos datos personales a terceros. Al usar MyJob, aceptas nuestra política de privacidad y el manejo de tus datos de acuerdo con las leyes aplicables.',
          },
          {
            title: '8. Cancelaciones',
            body: 'Las cancelaciones frecuentes de turnos aceptados pueden generar advertencias en tu perfil. Tres o más cancelaciones injustificadas pueden resultar en la suspensión temporal o permanente de tu cuenta.',
          },
          {
            title: '9. Modificaciones',
            body: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la app. El uso continuado de MyJob después de los cambios implica la aceptación de los nuevos términos.',
          },
          {
            title: '10. Contacto',
            body: 'Para preguntas sobre estos términos, contáctanos a través de la función "Reportar problema" en los ajustes.',
          },
        ].map((section, i) => (
          <div key={i} className="p-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
            <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
              {section.title}
            </h3>
            <p style={{ color: '#6B6860' }}>{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
