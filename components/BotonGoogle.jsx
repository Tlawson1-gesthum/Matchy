'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function BotonGoogle({ rol = 'candidato', texto = 'Continuar con Google' }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function entrar() {
    setCargando(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?rol=${rol}`,
        // Sin esto, si hay una sola cuenta abierta en el navegador Google la elige
        // sola y no pregunta. Mucha gente tiene la cuenta personal y la del trabajo.
        queryParams: { prompt: 'select_account' },
      },
    });
    if (err) {
      setError('No pudimos conectar con Google. Probá con email y contraseña.');
      setCargando(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn-google" onClick={entrar} disabled={cargando}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.9c-.5 2.8-2.1 5.1-4.4 6.7v5.5h7.1c4.2-3.8 6.5-9.5 6.5-16.4z"/>
          <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.6-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.1H4.3v5.7C8 41.3 15.4 46 24 46z"/>
          <path fill="#FBBC05" d="M11.6 28.2c-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2v-5.7H4.3C2.8 17 2 20.4 2 24s.8 7 2.3 9.9l7.3-5.7z"/>
          <path fill="#EA4335" d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.4 2 8 6.7 4.3 14.1l7.3 5.7c1.7-5.2 6.6-9.1 12.4-9.1z"/>
        </svg>
        {cargando ? 'Conectando...' : texto}
      </button>
      {error && <p style={{ color: '#B5432A', fontSize: '0.85rem' }}>{error}</p>}
    </div>
  );
}
