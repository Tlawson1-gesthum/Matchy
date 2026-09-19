'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import BotonGoogle from '../../../components/BotonGoogle';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

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
      const { data: perfil } = await supabase.from('perfiles').select('id, role').eq('id', userId).maybeSingle();
      if (perfil && perfil.role === 'candidato') {
        await supabase.auth.signOut();
        setCargando(false);
        setError('Esta cuenta está registrada como candidato. Para publicar vacantes registrá tu local con otro email.');
        return;
      }
      if (!perfil) {
        await supabase.auth.signOut();
        setCargando(false);
        setError('No encontramos un local asociado a esta cuenta. Registrá tu local para empezar.');
        return;
      }
    }

    setCargando(false);
    router.push('/empleador/vacantes');
  }

  return (
    <div>
      <Encabezado links={[]} />
      <div className="panel-auth" style={{ paddingTop: 36 }}>
      <h1>Iniciar sesión — locales</h1>
      <p>¿Ya sos usuario? Iniciá sesión con tu email y contraseña.</p>
      <div className="card" style={{ marginBottom: 16 }}>
        <BotonGoogle rol="empleador" texto="Entrar con Google" />
      </div>

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
        Si no tenés una cuenta, <Link href="/empleador/registro">registrá tu local acá</Link>.
      </p>
      </div>
      <Pie />
    </div>
  );
}
