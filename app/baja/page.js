'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Encabezado from '../../components/Encabezado';
import Pie from '../../components/Pie';

// Página del enlace "Darte de baja" del pie de cada mail. No pide iniciar sesión:
// el código del enlace identifica la cuenta. La baja se confirma con un botón,
// porque los antivirus del mail abren los enlaces solos.
function BajaContenido() {
  const token = useSearchParams().get('t') || '';
  const valido = /^[0-9a-f-]{36}$/i.test(token);
  const [estado, setEstado] = useState('inicio'); // inicio | baja | alta | error
  const [cargando, setCargando] = useState(false);

  async function cambiar(recibir) {
    setCargando(true);
    const { data, error } = await supabase.rpc('preferencia_mails', { p_token: token, p_recibir: recibir });
    setCargando(false);
    setEstado(error || !data ? 'error' : recibir ? 'alta' : 'baja');
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      {!valido || estado === 'error' ? (
        <>
          <h1 className="card-titulo">No pudimos encontrar tu cuenta</h1>
          <p>
            El enlace está incompleto o ya no es válido. Si querés dejar de recibir mails de Voral, escribinos a{' '}
            <a href="mailto:hola@somosvoral.com.ar?subject=Baja%20de%20mails">hola@somosvoral.com.ar</a> y te damos de baja.
          </p>
        </>
      ) : estado === 'baja' ? (
        <>
          <h1 className="card-titulo">Listo, te dimos de baja</h1>
          <p>
            No te vamos a mandar más avisos por mail: bienvenida, entrevistas ni novedades de tu local. Las novedades
            siguen apareciendo en tu panel de Voral.
          </p>
          <p className="ayuda-campo">
            Los mails de seguridad, como confirmar tu cuenta o cambiar la contraseña, te van a seguir llegando.
          </p>
          <button type="button" className="btn blanco" onClick={() => cambiar(true)} disabled={cargando}>
            Me equivoqué, quiero seguir recibiéndolos
          </button>
        </>
      ) : estado === 'alta' ? (
        <>
          <h1 className="card-titulo">Vas a seguir recibiendo los avisos</h1>
          <p>Te vamos a avisar por mail cuando haya novedades, por ejemplo si un local te propone una entrevista.</p>
        </>
      ) : (
        <>
          <h1 className="card-titulo">¿Dejar de recibir los avisos por mail?</h1>
          <p>
            Si te das de baja, no te vamos a avisar por mail cuando haya novedades, por ejemplo si un local te
            propone una entrevista. Las vas a ver solo entrando a tu panel de Voral.
          </p>
          <button type="button" className="btn" onClick={() => cambiar(false)} disabled={cargando}>
            {cargando ? 'Procesando...' : 'Darme de baja'}
          </button>
        </>
      )}
    </div>
  );
}

export default function Baja() {
  return (
    <div>
      <Encabezado links={[]} />
      <div className="container" style={{ paddingTop: 36 }}>
        <Suspense fallback={null}>
          <BajaContenido />
        </Suspense>
      </div>
      <Pie />
    </div>
  );
}
