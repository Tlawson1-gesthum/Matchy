'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import BotonGoogle from '../../../components/BotonGoogle';
import CampoContrasena from '../../../components/CampoContrasena';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

export default function LoginCandidato() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [yaTieneSesion, setYaTieneSesion] = useState(false);

  // Si ya hay una sesión abierta no mostramos los accesos: evita que alguien
  // entre con otra cuenta por encima de la que ya está usando.
  useEffect(() => {
    async function revisar() {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      setYaTieneSesion(true);
      const { data: perfil } = await supabase
        .from('perfiles').select('role').eq('id', u.id).maybeSingle();
      router.replace(perfil?.role === 'empleador' ? '/empleador/vacantes' : '/candidato/panel');
    }
    revisar();
  }, [router]);

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

  if (yaTieneSesion) return <div className="container">Ya tenés una sesión abierta, te llevamos a tu panel...</div>;

  return (
    <div>
      <Encabezado links={[]} />
      <div className="panel-auth" style={{ paddingTop: 36 }}>
      <h1>Iniciar sesión</h1>
      <p>¿Ya sos usuario? Iniciá sesión con tu email y contraseña.</p>
      <div className="card" style={{ marginBottom: 16 }}>
        <BotonGoogle rol="candidato" texto="Entrar con Google" />
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-field">
          <label htmlFor="login-candidato-email">Email</label>
          <input id="login-candidato-email" inputMode="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <CampoContrasena
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <p className="ayuda-contraste" style={{ margin: '-6px 0 14px' }}>
          <a href="/recuperar">¿Olvidaste tu contraseña?</a>
        </p>
        {error && <p className="mensaje-error" role="alert">{error}</p>}
        <button className="btn ancho" type="submit" disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        Si no tenés una cuenta, <Link href="/candidato/registro">registrate acá</Link>.
      </p>
      </div>
      <Pie />
    </div>
  );
}
