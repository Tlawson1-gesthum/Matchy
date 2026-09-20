// Íconos de trazo fino para las tarjetas de métricas del panel.
const base = {
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconoMaletin() {
  return (
    <svg {...base}>
      <rect x="2.5" y="7.5" width="19" height="12.5" rx="2.2" />
      <path d="M8.5 7.5V5.8a1.8 1.8 0 0 1 1.8-1.8h3.4a1.8 1.8 0 0 1 1.8 1.8v1.7" />
      <path d="M2.5 12.5h19" />
    </svg>
  );
}

export function IconoSobre() {
  return (
    <svg {...base}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
      <path d="M3 7l8.2 5.6a1.5 1.5 0 0 0 1.6 0L21 7" />
    </svg>
  );
}

export function IconoCalendario() {
  return (
    <svg {...base}>
      <rect x="3" y="5" width="18" height="16" rx="2.2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M9.5 15.2l1.8 1.8 3.4-3.6" />
    </svg>
  );
}

export function IconoMegafono() {
  return (
    <svg {...base}>
      <path d="M4 10v4a1.6 1.6 0 0 0 1.6 1.6H7l7.5 4.2V4.2L7 8.4H5.6A1.6 1.6 0 0 0 4 10Z" />
      <path d="M18 9.2a4 4 0 0 1 0 5.6" />
      <path d="M7 15.6V20" />
    </svg>
  );
}
