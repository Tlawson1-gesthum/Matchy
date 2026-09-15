'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

function traducirError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('rate limit')) return 'Se alcanzó el límite de intentos por hora. Esperá un rato y probá de nuevo.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ese email ya tiene una cuenta. Iniciá sesión.';
  if (m.includes('password')) return 'La contraseña tiene que tener al menos 6 caracteres.';
  if (m.includes('invalid') && m.includes('email')) return 'Ese email no parece válido.';
  return msg;
}

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
      setError(traducirError(errAuth.message));
      setCargando(false);
      return;
    }

    if (!data.session) {
      setCargando(false);
      setError('Tu cuenta se creó, pero falta confirmar el email. Revisá tu casilla y el spam, y después iniciá sesión.');
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
    <div>
      <div className="navbar">
        <a className="logo" href="/">Matchy</a>
        <Link className="nav-link" href="/cv-modelo">Ver un CV de ejemplo</Link>
      </div>

      <div className="panel-auth" style={{ paddingTop: 36 }}>
        <h1>Creá tu cuenta</h1>
        <p className="auth-intro">
          Gratis para siempre si buscás trabajo. En diez minutos tenés un CV listo para descargar y para postularte
          a los locales de Posadas.
        </p>

        <div className="card">
          <p style={{ marginTop: 0, fontSize: '0.9rem' }}>
            ¿Ya sos usuario? <Link href="/candidato/login">Iniciá sesión</Link>.
          </p>

          <div className="linea-o">o registrate acá</div>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p style={{ fontSize: '0.8rem', color: '#7A746A', margin: '6px 0 0' }}>Mínimo 6 caracteres.</p>
            </div>

            {error && <p style={{ color: '#B5432A' }}>{error}</p>}

            <button className="btn ancho" type="submit" disabled={cargando}>
              {cargando ? 'Creando tu cuenta...' : 'Crear cuenta y armar mi CV'}
            </button>
          </form>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#7A746A', marginTop: 16 }}>
          Antes de publicar nada te vamos a explicar exactamente qué datos quedan visibles, y solo seguís si estás
          de acuerdo.
        </p>
      </div>
    </div>
  );
}
