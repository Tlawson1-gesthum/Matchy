import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <div className="navbar">
        <span className="logo">Matchy</span>
        <div>
          <Link className="nav-link" href="/candidato/login">Ya tengo cuenta (candidato)</Link>
          <Link className="nav-link" href="/empleador/login">Ya tengo cuenta (local)</Link>
        </div>
      </div>

      <div className="container">
        <h1 style={{ fontSize: '2.2rem', marginTop: 32 }}>
          El lugar donde el rubro gastronómico de Posadas consigue y encuentra trabajo.
        </h1>
        <p style={{ fontSize: '1.05rem', maxWidth: 620 }}>
          Armá tu CV una sola vez y usalo en todos los locales de Posadas, o encontrá
          candidatos por puesto, turno y disponibilidad, sin depender de WhatsApp ni de
          grupos de Facebook.
        </p>

        <div className="landing-cards">
          <Link href="/candidato/registro" className="landing-card empleo-busco">
            <h2>Busco empleo</h2>
            <p>
              Armá tu CV gastronómico con ayuda de sugerencias, postulate a vacantes
              reales y descargalo en PDF cuando quieras.
            </p>
            <span className="btn" style={{ marginTop: 16 }}>Empezar mi CV</span>
          </Link>

          <Link href="/empleador/registro" className="landing-card">
            <h2>Ofrezco empleo</h2>
            <p>
              Publicá tu vacante con los requisitos reales del puesto y recibí un
              ranking automático de los candidatos que más encajan.
            </p>
            <span className="btn secundario" style={{ marginTop: 16 }}>Publicar vacante</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
