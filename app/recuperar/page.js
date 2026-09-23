'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Encabezado from '../../components/Encabezado';
import Pie from '../../components/Pie';

export default function Recuperar() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nueva-contrasena`,
    });
    setCargando(false);
    if (err && /rate limit/i.test(err.message || '')) {
      setError('Se pidieron demasiados mails en poco tiempo. Esperá unos minutos y probá de nuevo.');
      return;
    }
    // Por seguridad mostramos el mismo mensaje exista o no la cuenta:
    // así nadie puede usar esta pantalla para averiguar qué mails están registrados.
    setEnviado(true);
  }

  return (
    <div>
      <Encabezado links={[]} />
      <main className="panel-auth" style={{ paddingTop: 36 }}>
        <h1>Recuperar tu contraseña</h1>

        {enviado ? (
          <div className="card">
            <p style={{ marginTop: 0 }}>
              Si <strong>{email}</strong> tiene una cuenta en Voral, te enviamos un mail con un enlace para crear una
              contraseña nueva.
            </p>
            <p className="ayuda-contraste">
              Revisá también la carpeta de correo no deseado. El enlace vence en una hora. Si no te llega, esperá unos
              minutos y volvé a pedirlo.
            </p>
            <p style={{ marginBottom: 0 }}>
              <a href="/candidato/login">Volver a iniciar sesión</a>
            </p>
          </div>
        ) : (
          <form className="card" onSubmit={enviar}>
            <p style={{ marginTop: 0 }}>
              Escribí el mail con el que te registraste y te mandamos un enlace para crear una contraseña nueva.
            </p>
            <div className="form-field">
              <label htmlFor="recuperar-email">Email</label>
              <input
                id="recuperar-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="mensaje-error" role="alert">{error}</p>}
            <button className="btn-verde-solido" type="submit" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviarme el enlace'}
            </button>
            <p className="ayuda-contraste" style={{ marginTop: 14 }}>
              Si entraste con Google, no tenés contraseña en Voral: usá el botón "Continuar con Google".
            </p>
          </form>
        )}
      </main>
      <Pie />
    </div>
  );
}
