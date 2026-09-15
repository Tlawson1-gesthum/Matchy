'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

export default function LoginCandidato() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    const { error: errAuth } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (errAuth) {
      setError('Email o contraseña incorrectos.');
      return;
    }
    router.push('/candidato/cv');
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit} className="card">
        <div className="form-field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p style={{ color: '#B5432A' }}>{error}</p>}
        <button className="btn" type="submit" disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        ¿No tenés cuenta? <Link href="/candidato/registro">Creála acá</Link>
      </p>
    </div>
  );
}
