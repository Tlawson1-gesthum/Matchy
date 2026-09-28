'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { traducirError } from '../../../lib/errores';
import PantallaCarga from '../../../components/PantallaCarga';

function Callback() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    async function completar() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        router.push('/');
        return;
      }

      const rolPedido = params.get('rol') === 'empleador' ? 'empleador' : 'candidato';

      const { data: perfil } = await supabase
        .from('perfiles').select('id, role').eq('id', user.id).maybeSingle();

      // Cuenta nueva: creamos el perfil con el rol que eligió al entrar
      if (!perfil) {
        await supabase.from('perfiles').insert({ id: user.id, role: rolPedido, email: user.email });
        if (rolPedido === 'candidato') {
          // Quien se registró con email y contraseña ya declaró la edad y aceptó los
          // términos en el formulario: esos datos llegan guardados en la cuenta.
          const meta = user.user_metadata || {};
          await supabase.from('cvs').insert({
            id: user.id,
            nombre: meta.full_name || '',
            acepto_tyc_at: meta.acepto_tyc_at || new Date().toISOString(),
            ...(meta.declara_mayor_edad
              ? { declara_mayor_edad: true, declaracion_edad_at: meta.acepto_tyc_at || new Date().toISOString() }
              : {}),
          });
          router.push('/candidato/consentimiento');
        } else {
          router.push('/empleador/registro');
        }
        return;
      }

      // Cuenta existente: respetamos el rol con el que se registró
      if (perfil.role === 'empleador') {
        router.push('/empleador/vacantes');
      } else {
        const { data: cv } = await supabase
          .from('cvs').select('consentimiento_at').eq('id', user.id).maybeSingle();
        router.push(cv?.consentimiento_at ? '/candidato/panel' : '/candidato/consentimiento');
      }
    }

    completar().catch((e) => setError(traducirError(e.message)));
  }, [router, params]);

  return (
    error ? (
      <div className="container">
        <p className="mensaje-error" role="alert">Hubo un problema al entrar: {error}</p>
        <a href="/">Volver al inicio</a>
      </div>
    ) : (
      <PantallaCarga texto="Entrando a tu cuenta..." retraso={0} />
    )
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<PantallaCarga texto="Entrando a tu cuenta..." retraso={0} />}>
      <Callback />
    </Suspense>
  );
}
