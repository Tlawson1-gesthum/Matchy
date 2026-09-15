'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

export default function LoginEmpleador() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    const { data, error: errAuth } = await supabase.auth.signInWithPassword({ email, password });
    if (errAuth) {
      setCargando(false);
      const m = (errAuth.message || '').toLowerCase();
      if (m.includes('not confirmed')) {
        setError('Todavía no confirmaste tu email. Revisá tu casilla y el spam.');
      } else {
        setError('Email o contraseña incorrectos.');
      }
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const { data: perfil } = await supabase.from('perfiles').select('id').eq('id', userId).maybeSingle();
      if (!perfil) {
        await supabase.from('perfiles').insert({ id: userId, role: 'empleador', email });
        await supabase.from('empleadores').insert({ id: userId, ciudad: 'Posadas' });
      }
    }

    setCargando(false);
    router.push('/empleador/vacantes');
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h1>Iniciar sesión — locales</h1>
      <p>¿Ya sos usuario? Iniciá sesión con tu email y contraseña.</p>
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
        Si no tenés una cuenta, <Link href="/empleador/registro">registrá tu local acá</Link>.
      </p>
    </div>
  );
}
