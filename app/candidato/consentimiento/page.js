'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import GuardiaRol from '../../../components/GuardiaRol';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

function ConsentimientoContenido() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function aceptar() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      setError('Tenés que iniciar sesión primero.');
      return;
    }
    await supabase
      .from('cvs')
      .update({
        consentimiento_at: new Date().toISOString(),
        acepto_tyc_at: new Date().toISOString(),
      })
      .eq('id', userId);
    router.push('/candidato/cv');
  }

  function rechazar() {
    router.push('/');
  }

  return (
    <div>
      <Encabezado links={[]} />
      <div className="container container-angosto">
      <h1>Antes de armar tu CV</h1>
      <div className="card">
        <p>
          Los datos que cargues (nombre, foto, experiencia, contacto) los van a ver{' '}
          <strong>los locales verificados a cuyas vacantes te postules</strong>, y cualquier persona a la que le
          compartas el enlace de tu CV. Tu CV no aparece en ningún listado abierto.
        </p>
        <p>
          No te vamos a pedir DNI ni tu fecha de nacimiento completa. La foto y la edad son opcionales. Vos decidís
          qué mostrar, y podés editar o eliminar tu perfil cuando quieras desde tu cuenta.
        </p>
        <p>
          Los contactos de referencia y el certificado de manipulación que cargues son la excepción: solo se le
          muestran a un local cuando decide avanzar con tu postulación.
        </p>
        <p>
          Tus datos se alojan en servidores ubicados fuera de Argentina, y parte de la información se procesa en
          Estados Unidos para generar el resumen orientativo que ve el empleador. El detalle está en la{' '}
          <a href="/legal/privacidad" target="_blank">política de privacidad</a>.
        </p>
        <p style={{ fontSize: '0.88rem', borderTop: '1px solid var(--borde)', paddingTop: 14, marginTop: 18 }}>
          Al apretar "Acepto y continúo" estás de acuerdo con los{' '}
          <a href="/legal/terminos" target="_blank">términos y condiciones</a> y con la{' '}
          <a href="/legal/privacidad" target="_blank">política de privacidad</a> de Voral.
        </p>

        {error && <p style={{ color: '#B5432A' }}>{error}</p>}
        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn" onClick={aceptar}>Acepto y continúo</button>
          <button className="btn secundario" onClick={rechazar}>No acepto</button>
        </div>
      </div>
      </div>
      <Pie />
    </div>
  );
}

export default function Consentimiento(props) {
  return (
    <GuardiaRol rol="candidato">
      <ConsentimientoContenido {...props} />
    </GuardiaRol>
  );
}
