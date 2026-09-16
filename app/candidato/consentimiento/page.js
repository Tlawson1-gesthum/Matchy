'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

export default function Consentimiento() {
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
      .update({ consentimiento_at: new Date().toISOString() })
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
          Los datos que cargues (nombre, foto, experiencia, contacto, etc.) van a quedar
          <strong> visibles públicamente</strong> para que los locales gastronómicos de
          Posadas puedan encontrarte y contactarte.
        </p>
        <p>
          No te vamos a pedir DNI ni tu fecha de nacimiento completa. Vos decidís qué
          mostrar, y podés editar o eliminar tu perfil cuando quieras desde tu cuenta.
        </p>
        {error && <p style={{ color: '#B5432A' }}>{error}</p>}
        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button className="btn" onClick={aceptar}>Acepto y continúo</button>
          <button className="btn secundario" onClick={rechazar}>No acepto</button>
        </div>
      </div>
      </div>
      <Pie />
    </div>
  );
}
