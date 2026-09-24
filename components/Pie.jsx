import { REDES } from '../lib/redes';

export default function Pie() {
  return (
    <footer className="pie">
      <p className="pie-texto">
        ¿Dudas? Estamos para ayudarte.{' '}
        <a href="mailto:gozzasabores@gmail.com">
          <span className="pie-sobre" aria-hidden="true">✉</span> Contactanos
        </a>
      </p>

      <p className="pie-aviso">
        Voral conecta a quienes buscan trabajo con locales gastronómicos de Posadas y alrededores. No somos
        empleadores ni intervenimos en la contratación. Antes de usar la plataforma, leé los{' '}
        <a href="/legal/terminos">términos y condiciones</a> y la{' '}
        <a href="/legal/privacidad">política de privacidad</a>.
      </p>

      <p className="pie-legal" aria-label="Canales de Voral">
        {REDES.map((red, i) => (
          <span key={red.nombre}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            <a href={red.href}>{red.nombre}</a>
          </span>
        ))}
      </p>

      <p className="pie-legal">Gratuito para quien busca trabajo. Solo para mayores de 18 años.</p>
      <p className="pie-marca" aria-hidden="true">🤝</p>
    </footer>
  );
}
