'use client';

import { useState } from 'react';
import Link from 'next/link';

const MENSAJES = {
  ninguno:
    'Armá tu CV una sola vez y usalo en todos los locales de Posadas, o encontrá candidatos por puesto, turno y disponibilidad, sin depender de WhatsApp ni de grupos de Facebook.',
  candidato:
    'Armá tu CV con guías hechas por profesionales para aumentar tus chances de que te contraten. Descargalo. Compartilo con quien quieras. En Matchy tenés muchas chances de encontrar trabajo.',
  empleador:
    'Publicá tus vacantes y encontrá gente que matchee con tus expectativas. Tranquilx, nosotros nos encargamos de que la información te llegue ordenada.',
};

export default function Home() {
  const [activa, setActiva] = useState('ninguno');

  return (
    <div>
      <div className="navbar">
        <span className="logo">Matchy</span>
        <div>
          <Link className="nav-link" href="/candidato/login">Soy candidato</Link>
          <Link className="nav-link" href="/empleador/login">Soy un local</Link>
        </div>
      </div>

      <div className="container">
        <h1 style={{ fontSize: '2.2rem', marginTop: 40 }}>
          El lugar donde el rubro gastronómico de Posadas consigue y encuentra trabajo.
        </h1>

        <p style={{ fontSize: '1.05rem', maxWidth: 640, minHeight: 78, lineHeight: 1.5 }}>
          {MENSAJES[activa]}
        </p>

        <div className="landing-cards">
          <Link
            href="/candidato/registro"
            className={`landing-card ${activa === 'candidato' ? 'activa' : ''}`}
            onMouseEnter={() => setActiva('candidato')}
            onMouseLeave={() => setActiva('ninguno')}
            onFocus={() => setActiva('candidato')}
          >
            <h2>Busco empleo</h2>
            <span className="btn" style={{ marginTop: 18 }}>Empezar mi CV</span>
          </Link>

          <Link
            href="/empleador/registro"
            className={`landing-card ${activa === 'empleador' ? 'activa' : ''}`}
            onMouseEnter={() => setActiva('empleador')}
            onMouseLeave={() => setActiva('ninguno')}
            onFocus={() => setActiva('empleador')}
          >
            <h2>Ofrezco empleo</h2>
            <span className="btn secundario" style={{ marginTop: 18 }}>Publicar vacante</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
