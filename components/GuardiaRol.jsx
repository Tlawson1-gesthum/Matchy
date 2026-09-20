'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Encabezado from './Encabezado';
import Pie from './Pie';

// Envuelve una pantalla y solo la muestra si la sesión tiene el rol esperado.
// Una cuenta es de candidato o de local, nunca las dos cosas.
export default function GuardiaRol({ rol, children }) {
  const [estado, setEstado] = useState('verificando'); // verificando | ok | otro_rol | sin_sesion
  const [rolActual, setRolActual] = useState(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    async function revisar() {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) { setEstado('sin_sesion'); return; }
      setEmail(u.email || '');

      const { data: perfil } = await supabase
        .from('perfiles').select('role').eq('id', u.id).maybeSingle();

      if (!perfil) { setEstado('ok'); return; }

      if (perfil.role !== rol) {
        setRolActual(perfil.role);
        setEstado('otro_rol');
        return;
      }
      setEstado('ok');
    }
    revisar();
  }, [rol]);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    window.location.href = rol === 'empleador' ? '/empleador/login' : '/candidato/login';
  }

  if (estado === 'verificando') return <div className="container">Verificando tu cuenta...</div>;
  if (estado === 'ok' || estado === 'sin_sesion') return children;

  const esCandidato = rolActual === 'candidato';

  return (
    <div>
      <Encabezado links={[]} />
      <div className="container" style={{ maxWidth: 560 }}>
        <h1>Esta cuenta es de {esCandidato ? 'candidato' : 'local'}</h1>
        <div className="card">
          <p style={{ marginTop: 0 }}>
            Estás dentro con <strong>{email}</strong>, que es una cuenta de{' '}
            {esCandidato ? 'alguien que busca trabajo' : 'un local que ofrece trabajo'}. Esta sección es para{' '}
            {rol === 'empleador' ? 'locales' : 'candidatos'}.
          </p>
          <p>
            En Matchy cada cuenta tiene un solo rol. Si necesitás las dos cosas, registrate con otro email para el
            otro rol.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <a className="btn" href={esCandidato ? '/candidato/panel' : '/empleador/vacantes'}>
              Ir a mi panel
            </a>
            <button className="btn blanco" onClick={cerrarSesion}>
              Cerrar sesión y entrar con otra cuenta
            </button>
          </div>
        </div>
      </div>
      <Pie />
    </div>
  );
}
