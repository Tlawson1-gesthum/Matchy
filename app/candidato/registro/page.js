'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

export default function RegistroCandidato() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { data, error: errAuth } = await supabase.auth.signUp({ email, password });
    if (errAuth) {
      setError(errAuth.message);
      setCargando(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      await supabase.from('perfiles').insert({ id: userId, role: 'candidato', email });
      await supabase.from('cvs').insert({ id: userId });
    }

    setCargando(false);
    router.push('/candidato/consentimiento');
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h1>Creá tu cuenta</h1>
      <p>Es gratis y siempre lo va a ser para quien busca trabajo.</p>
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p style={{ color: '#B5432A' }}>{error}</p>}
        <button className="btn" type="submit" disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        ¿Ya tenés cuenta? <Link href="/candidato/login">Iniciá sesión</Link>
      </p>
    </div>
  );
}
