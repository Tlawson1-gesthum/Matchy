'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

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
      const { data: perfil } = await supabase.from('perfiles').select('id, role').eq('id', userId).maybeSingle();
      if (perfil && perfil.role === 'empleador') {
        await supabase.auth.signOut();
        setCargando(false);
        setError('Esta cuenta está registrada como local. Para armar un CV registrate como candidato con otro email.');
        return;
      }
      if (!perfil) {
        await supabase.from('perfiles').insert({ id: userId, role: 'candidato', email });
        await supabase.from('cvs').insert({ id: userId });
        setCargando(false);
        router.push('/candidato/consentimiento');
        return;
      }
      const { data: cv } = await supabase.from('cvs').select('consentimiento_at').eq('id', userId).maybeSingle();
      if (!cv?.consentimiento_at) {
        setCargando(false);
        router.push('/candidato/consentimiento');
        return;
      }
    }

    setCargando(false);
    router.push('/candidato/panel');
  }

  return (
    <div>
      <Encabezado links={[]} />
      <div className="panel-auth" style={{ paddingTop: 36 }}>
      <h1>Iniciar sesión</h1>
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
        <button className="btn ancho" type="submit" disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        Si no tenés una cuenta, <Link href="/candidato/registro">registrate acá</Link>.
      </p>
      </div>
    </div>
  );
}
