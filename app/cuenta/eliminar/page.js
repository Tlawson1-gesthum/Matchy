'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';
import PantallaCarga from '../../../components/PantallaCarga';

const BUCKETS = ['fotos-perfil', 'certificados', 'logos-locales'];

export default function EliminarCuenta() {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [confirmacion, setConfirmacion] = useState('');
  const [estado, setEstado] = useState('cargando'); // cargando | sin_sesion | listo | borrando | borrada
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) { setEstado('sin_sesion'); return; }
      setUsuario(u);
      const { data: perfil } = await supabase.from('perfiles').select('role').eq('id', u.id).maybeSingle();
      setRol(perfil?.role || null);
      setEstado('listo');
    }
    cargar();
  }, []);

  async function borrar(e) {
    e.preventDefault();
    if (confirmacion.trim().toUpperCase() !== 'ELIMINAR') return;
    setError('');
    setEstado('borrando');

    // 1. Los archivos se borran primero: Supabase no permite borrarlos después desde la base
    for (const bucket of BUCKETS) {
      const { data: archivos } = await supabase.storage.from(bucket).list(usuario.id);
      const rutas = (archivos || []).map((a) => `${usuario.id}/${a.name}`);
      if (rutas.length) await supabase.storage.from(bucket).remove(rutas);
    }

    // 2. La cuenta y todo lo asociado
    const { error: err } = await supabase.rpc('borrar_mi_cuenta');
    if (err) {
      setError(err.message || 'No pudimos borrar la cuenta. Escribinos a gozzasabores@gmail.com y lo hacemos a mano.');
      setEstado('listo');
      return;
    }

    await supabase.auth.signOut();
    setEstado('borrada');
  }

  const esLocal = rol === 'empleador';
  const panel = esLocal ? '/empleador/vacantes' : '/candidato/panel';

  return (
    <div>
      <Encabezado links={[]} />
      <main className="panel-auth" style={{ paddingTop: 36, maxWidth: 560 }}>
        <h1>Eliminar mi cuenta</h1>

        {estado === 'cargando' && <PantallaCarga texto="Cargando..." />}

        {estado === 'sin_sesion' && (
          <div className="card">
            <p style={{ marginTop: 0 }}>Para eliminar tu cuenta primero tenés que iniciar sesión.</p>
            <a href="/candidato/login">Iniciar sesión</a>
          </div>
        )}

        {estado === 'borrada' && (
          <div className="card">
            <p style={{ marginTop: 0 }}><strong>Tu cuenta fue eliminada.</strong></p>
            <p>Borramos tus datos y tus archivos. Gracias por haber usado Voral.</p>
            <a className="btn-verde-solido en-linea" href="/">Ir al inicio</a>
          </div>
        )}

        {(estado === 'listo' || estado === 'borrando') && (
          <form className="card zona-peligro" onSubmit={borrar}>
            <p style={{ marginTop: 0 }}>
              Estás por eliminar la cuenta <strong>{usuario?.email}</strong>. Esto no se puede deshacer.
            </p>
            <p style={{ marginBottom: 6 }}>Se borran para siempre:</p>
            <ul className="lista-borrado">
              {esLocal ? (
                <>
                  <li>Los datos de tu local y su logo.</li>
                  <li>Todas tus vacantes, con sus postulaciones y entrevistas.</li>
                </>
              ) : (
                <>
                  <li>Tu CV, tu foto y tu certificado.</li>
                  <li>Todas tus postulaciones y entrevistas.</li>
                </>
              )}
              <li>Tu acceso a Voral.</li>
            </ul>
            <p className="ayuda-contraste">
              Los reportes por posibles fraudes se conservan sin tus datos personales, porque sirven para proteger a
              otras personas.
            </p>

            <div className="form-field" style={{ marginTop: 18 }}>
              <label htmlFor="confirmar-borrado">Para confirmar, escribí ELIMINAR</label>
              <input
                id="confirmar-borrado"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>

            {error && <p className="mensaje-error" role="alert">{error}</p>}

            <div className="botonera-entrevista">
              <button
                className="btn-peligro"
                type="submit"
                disabled={confirmacion.trim().toUpperCase() !== 'ELIMINAR' || estado === 'borrando'}
              >
                {estado === 'borrando' ? 'Eliminando...' : 'Eliminar mi cuenta para siempre'}
              </button>
              <a className="btn-accion" href={panel}>No, volver a mi panel</a>
            </div>
          </form>
        )}
      </main>
      <Pie />
    </div>
  );
}
