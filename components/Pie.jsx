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
        empleadores ni parte de la relación laboral que pueda surgir entre las partes. Verificamos cada local antes
        de habilitarlo, pero no intervenimos en las entrevistas, en la negociación ni en la contratación, y no
        respondemos por la conducta de candidatos ni de empleadores, ni por lo que ocurra entre ellos dentro o
        fuera de la plataforma. Cada parte es responsable por la veracidad de lo que publica y por cómo actúa.
      </p>

      <p className="pie-legal" aria-label="Canales de Voral">
        {REDES.map((red, i) => (
          <span key={red.nombre}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            <a href={red.href}>{red.nombre}</a>
          </span>
        ))}
      </p>

      <p className="pie-legal">
        <a href="/legal/terminos">Términos y condiciones</a>
        <span aria-hidden="true"> · </span>
        <a href="/legal/privacidad">Política de privacidad</a>
      </p>
      <p className="pie-legal">Gratuito para quien busca trabajo. Solo para mayores de 18 años.</p>
      <p className="pie-marca" aria-hidden="true">🤝</p>
    </footer>
  );
}
