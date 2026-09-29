import { REDES } from '../lib/redes';

// Íconos de trazo redondeado, en el mismo estilo que los del resto del sitio
function IconoRed({ tipo }) {
  const base = { viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (tipo === 'instagram') {
    return (
      <svg {...base}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (tipo === 'whatsapp') {
    return (
      <svg {...base}>
        <path d="M4 20l1.3-4A8 8 0 1 1 8.2 18.8L4 20z" />
        <path d="M9 8.8c0 3 2.6 5.8 6 6.2l1-1.6-2-1-1 .8c-1-.5-1.8-1.3-2.3-2.3l.8-1-1-2-1.5.9z" />
      </svg>
    );
  }
  return (
    <svg {...base}>
      <path d="M4 10v4h3l6 4V6L7 10H4z" />
      <path d="M17 9.5a3.5 3.5 0 0 1 0 5" />
    </svg>
  );
}

export default function Pie() {
  return (
    <footer className="pie">
      <p className="pie-texto">
        ¿Dudas? Estamos para ayudarte.{' '}
        <a href="mailto:hola@somosvoral.com.ar">
          <span className="pie-sobre" aria-hidden="true">✉</span> Contactanos
        </a>
      </p>

      <p className="pie-aviso">
        Voral conecta a quienes buscan trabajo con locales gastronómicos de Posadas y alrededores. No somos
        empleadores ni intervenimos en la contratación. Antes de usar la plataforma, leé los{' '}
        <a href="/legal/terminos">términos y condiciones</a> y la{' '}
        <a href="/legal/privacidad">política de privacidad</a>.
      </p>

      {/* Solo se muestran los canales que ya existen (los que siguen en '#' quedan ocultos) */}
      <ul className="pie-redes" aria-label="Canales de Voral">
        {REDES.filter((red) => red.href && red.href !== '#').map((red) => (
          <li key={red.nombre}>
            <a href={red.href} target="_blank" rel="noreferrer" aria-label={`${red.nombre} de Voral: ${red.texto}`}>
              <IconoRed tipo={red.icono} />
              {red.texto}
            </a>
          </li>
        ))}
      </ul>

      <p className="pie-legal">Gratuito para quien busca trabajo. Solo para mayores de 18 años.</p>
      <p className="pie-marca" aria-hidden="true">🤝</p>
    </footer>
  );
}
