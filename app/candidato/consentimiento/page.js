'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import GuardiaRol from '../../../components/GuardiaRol';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';
import PantallaCarga from '../../../components/PantallaCarga';

function ConsentimientoContenido() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  // Quien se registró con Google todavía no declaró la edad en ningún paso
  // anterior (el registro con email sí la pide antes de llegar acá).
  const [yaDeclarada, setYaDeclarada] = useState(true);
  const [esMayor, setEsMayor] = useState(false);

  useEffect(() => {
    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) { setCargando(false); return; }
      const { data: cv } = await supabase.from('cvs').select('declara_mayor_edad').eq('id', uid).maybeSingle();
      setYaDeclarada(!!cv?.declara_mayor_edad);
      setCargando(false);
    }
    cargar();
  }, []);

  async function aceptar() {
    if (!yaDeclarada && !esMayor) {
      setError('Para usar Voral tenés que ser mayor de 18 años.');
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      setError('Tenés que iniciar sesión primero.');
      return;
    }
    const cambios = {
      consentimiento_at: new Date().toISOString(),
      acepto_tyc_at: new Date().toISOString(),
    };
    if (!yaDeclarada) {
      cambios.declara_mayor_edad = true;
      cambios.declaracion_edad_at = new Date().toISOString();
    }
    await supabase.from('cvs').update(cambios).eq('id', userId);
    router.push('/candidato/cv');
  }

  function rechazar() {
    router.push('/');
  }

  if (cargando) return <PantallaCarga texto="Cargando..." />;

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

        {!yaDeclarada && (
          <label className="casilla-legal">
            <input type="checkbox" checked={esMayor} onChange={(e) => setEsMayor(e.target.checked)} />
            <span>
              Declaro bajo mi responsabilidad que soy mayor de 18 años. Sé que una declaración falsa puede tener
              consecuencias legales y que Voral da de baja las cuentas de menores de edad apenas las detecta.
            </span>
          </label>
        )}

        {error && <p className="mensaje-error" role="alert">{error}</p>}
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
