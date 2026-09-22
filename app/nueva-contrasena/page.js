'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import CampoContrasena from '../../components/CampoContrasena';
import Encabezado from '../../components/Encabezado';
import Pie from '../../components/Pie';

// A esta pantalla se llega desde el enlace del mail de recuperación.
// Supabase lee el enlace y abre una sesión temporal que permite cambiar la contraseña.
export default function NuevaContrasena() {
  const [estado, setEstado] = useState('verificando'); // verificando | listo | invalido | guardado
  const [password, setPassword] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let resuelto = false;
    const { data: sub } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (evento === 'PASSWORD_RECOVERY' || (sesion && !resuelto)) {
        resuelto = true;
        setEstado('listo');
      }
    });
    // Si la sesión ya estaba lista antes de suscribirnos
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session && !resuelto) { resuelto = true; setEstado('listo'); }
    });
    // Si en unos segundos no apareció la sesión, el enlace no sirve
    const t = setTimeout(() => { if (!resuelto) setEstado('invalido'); }, 4000);
    return () => { clearTimeout(t); sub?.subscription?.unsubscribe(); };
  }, []);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('La contraseña tiene que tener al menos 6 caracteres.'); return; }
    if (password !== repetida) { setError('Las dos contraseñas no coinciden.'); return; }
    setCargando(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setCargando(false);
    if (err) {
      setError(/same|different/i.test(err.message || '')
        ? 'La contraseña nueva tiene que ser distinta de la anterior.'
        : 'No pudimos guardar la contraseña. Pedí un enlace nuevo y probá otra vez.');
      return;
    }
    // Cerramos la sesión temporal: que entre con la contraseña nueva
    await supabase.auth.signOut();
    setEstado('guardado');
  }

  return (
    <div>
      <Encabezado links={[]} />
      <main className="panel-auth" style={{ paddingTop: 36 }}>
        <h1>Crear una contraseña nueva</h1>

        {estado === 'verificando' && <p>Verificando el enlace...</p>}

        {estado === 'invalido' && (
          <div className="card">
            <p style={{ marginTop: 0 }}>Este enlace venció o ya se usó.</p>
            <a className="btn-verde-solido en-linea" href="/recuperar">Pedir un enlace nuevo</a>
          </div>
        )}

        {estado === 'guardado' && (
          <div className="card">
            <p style={{ marginTop: 0 }}>Listo, tu contraseña quedó cambiada.</p>
            <a className="btn-verde-solido en-linea" href="/candidato/login">Iniciar sesión</a>
            <p className="ayuda-contraste" style={{ marginTop: 12 }}>
              Si tu cuenta es de un local, <a href="/empleador/login">entrá desde acá</a>.
            </p>
          </div>
        )}

        {estado === 'listo' && (
          <form className="card" onSubmit={guardar}>
            <CampoContrasena
              etiqueta="Contraseña nueva"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              ayuda="Mínimo 6 caracteres."
            />
            <CampoContrasena
              etiqueta="Repetila"
              value={repetida}
              onChange={(e) => setRepetida(e.target.value)}
              autoComplete="new-password"
              minLength={6}
            />
            {error && <p className="mensaje-error" role="alert">{error}</p>}
            <button className="btn-verde-solido" type="submit" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </main>
      <Pie />
    </div>
  );
}
