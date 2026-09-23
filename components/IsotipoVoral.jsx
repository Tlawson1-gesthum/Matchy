// Isotipo de Voral en SVG, reconstruido del logo original.
// Está separado en capas para poder animarlas: figura izquierda,
// figura derecha y la unión central (que tapa el hueco entre las dos).
// El "anillo" de la unión usa el color de fondo de la página para
// recortar visualmente las figuras, igual que en el logo.

export default function IsotipoVoral({ className = '', colorFondo = '#F2F0E6', animado = false }) {
  const c = animado ? 'carga-' : '';
  return (
    <svg
      className={className}
      viewBox="0 0 812 580"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <g className={`${c}figura-izq`}>
        <circle cx="215" cy="101" r="87" fill="#BC6534" />
        <path
          d="M80 210 H374 A22 22 0 0 1 396 232 V538 A22 22 0 0 1 374 560 H80 A64 64 0 0 1 16 496 V274 A64 64 0 0 1 80 210 Z"
          fill="#BC6534"
        />
      </g>

      <g className={`${c}figura-der`}>
        <circle cx="595" cy="101" r="87" fill="#CCAA84" />
        <path
          d="M440 210 H732 A64 64 0 0 1 796 274 V496 A64 64 0 0 1 732 560 H440 A22 22 0 0 1 418 538 V232 A22 22 0 0 1 440 210 Z"
          fill="#CCAA84"
        />
      </g>

      <g className={`${c}union-aparece`}>
        <g className={`${c}union-late`}>
          {/* anillo del color del fondo: recorta las figuras alrededor de la unión */}
          <circle cx="340" cy="392" r="80" fill={colorFondo} />
          <circle cx="474" cy="392" r="80" fill={colorFondo} />
          {/* la pieza de unión: dos círculos con una cintura curva tangente a ambos */}
          <path
            d="M395.7 360.4 A13 13 0 0 0 418.3 360.4 A64 64 0 1 1 418.3 423.6 A13 13 0 0 0 395.7 423.6 A64 64 0 1 1 395.7 360.4 Z"
            fill="#465746"
          />
        </g>
      </g>
    </svg>
  );
}
