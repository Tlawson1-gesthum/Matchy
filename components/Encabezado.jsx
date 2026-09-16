'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

function IconoPin() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function IconoPersona() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" />
    </svg>
  );
}

function IconoCuenta() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.4 18.6c1.2-2.2 3.2-3.3 5.6-3.3s4.4 1.1 5.6 3.3" />
    </svg>
  );
}

export default function Encabezado({ links = [] }) {
  const router = useRouter();
  const [sesion, setSesion] = useState(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSesion(data?.user || null));
  }, []);

  async function salir() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <header className="cabecera">
      <a className="cabecera-marca" href="/">Matchy</a>

      <div className="cabecera-iconos">
        <span className="icono-plano" title="Posadas y alrededores" aria-label="Posadas y alrededores">
          <IconoPin />
        </span>

        {links.length > 0 && (
          <button
            className="icono-plano solo-movil"
            onClick={() => setAbierto((v) => !v)}
            aria-label="Menú"
          >
            <IconoPersona />
          </button>
        )}

        <nav className="cabecera-nav">
          {links.map((l) => (
            <a key={l.href} href={l.href}>{l.texto}</a>
          ))}
          {sesion ? (
            <a href="#" onClick={salir}>Salir</a>
          ) : (
            <a href="/candidato/login">Entrar</a>
          )}
        </nav>

        <a className="icono-plano icono-cuenta" href={sesion ? '/candidato/panel' : '/candidato/login'} aria-label="Mi cuenta">
          <IconoCuenta />
          <span className="punto-cuenta" />
        </a>
      </div>

      {abierto && (
        <nav className="menu-desplegado">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setAbierto(false)}>{l.texto}</a>
          ))}
          {sesion && <a href="#" onClick={salir}>Salir</a>}
        </nav>
      )}
    </header>
  );
}
