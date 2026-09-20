'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import CvHoja from '../../../components/CvHoja';
import GuardiaRol from '../../../components/GuardiaRol';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

function MiPerfilContenido() {
  const router = useRouter();
  const [cv, setCv] = useState(null);
  const [userId, setUserId] = useState(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  useEffect(() => {
    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) { router.push('/candidato/login'); return; }
      setUserId(uid);
      const { data } = await supabase.from('cvs').select('*').eq('id', uid).single();
      setCv(data);
    }
    cargar();
  }, [router]);

  function copiarLink() {
    navigator.clipboard.writeText(`${window.location.origin}/cv/${userId}`);
    setLinkCopiado(true);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (!cv) return <div className="container">Cargando...</div>;

  return (
    <div>
      <Encabezado links={[{ href: '/candidato/panel', texto: 'Mi panel' }, { href: '/candidato/cv', texto: 'Editar CV' }]} campanaHref="/candidato/entrevistas" />

      <div className="container no-imprimir" style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => window.print()}>Descargar en PDF</button>
        <button className="btn blanco" onClick={copiarLink}>
          {linkCopiado ? 'Link copiado' : 'Copiar link para compartir'}
        </button>
      </div>
      <p className="container no-imprimir" style={{ fontSize: '0.85rem', marginTop: 8 }}>
        Al apretar "Descargar en PDF" se abre el diálogo de impresión: elegí "Guardar como PDF" como destino.
      </p>

      <CvHoja cv={cv} />
      <div style={{ height: 40 }} />
      <Pie />
    </div>
  );
}

export default function MiPerfil(props) {
  return (
    <GuardiaRol rol="candidato">
      <MiPerfilContenido {...props} />
    </GuardiaRol>
  );
}
