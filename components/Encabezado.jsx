'use client';

import { useState } from 'react';

function IconoPin() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function IconoMenu() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export default function Encabezado({ links = [], destacado = null }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="cabecera">
      <a className="cabecera-marca" href="/">Matchy</a>

      <div className="cabecera-iconos">
        {destacado && (
          <a className="btn-destacado" href={destacado.href}>
            {destacado.texto}
            {destacado.cantidad > 0 && <span className="burbuja">{destacado.cantidad}</span>}
          </a>
        )}

        <span className="icono-plano" title="Posadas y Garupá" aria-label="Posadas y Garupá">
          <IconoPin />
        </span>

        {links.length > 0 && (
          <>
            <nav className="cabecera-nav">
              {links.map((l) => (
                <a key={l.href} href={l.href}>{l.texto}</a>
              ))}
            </nav>

            <button
              className="icono-plano solo-movil"
              onClick={() => setAbierto((v) => !v)}
              aria-label="Menú"
            >
              <IconoMenu />
            </button>
          </>
        )}
      </div>

      {abierto && links.length > 0 && (
        <nav className="menu-desplegado">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setAbierto(false)}>{l.texto}</a>
          ))}
        </nav>
      )}
    </header>
  );
}
