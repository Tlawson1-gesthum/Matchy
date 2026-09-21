'use client';

const TEXTO_ESTADO = {
  completo: 'Completo',
  pendiente: 'Falta completar',
  opcional: 'Opcional',
};

// Sección plegable del formulario del CV.
// Usa details/summary nativos: se abre con teclado (Enter o espacio) y los
// lectores de pantalla anuncian si está expandida o colapsada.
export default function SeccionAcordeon({ id, titulo, estado = 'pendiente', abierta, onToggle, children }) {
  return (
    <details
      className="seccion-acordeon"
      open={abierta}
      onToggle={(e) => onToggle && onToggle(id, e.currentTarget.open)}
    >
      <summary className="seccion-resumen">
        <h2 className="seccion-titulo">{titulo}</h2>
        <span className={`seccion-estado ${estado}`}>{TEXTO_ESTADO[estado]}</span>
        <svg className="seccion-chevron" viewBox="0 0 24 24" width="20" height="20" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="seccion-cuerpo">{children}</div>
    </details>
  );
}
