'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import CvVista from '../../../components/CvVista';

export default function MiPerfil() {
  const router = useRouter();
  const [cv, setCv] = useState(null);
  const [userId, setUserId] = useState(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  useEffect(() => {
    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        router.push('/candidato/login');
        return;
      }
      setUserId(uid);
      const { data } = await supabase.from('cvs').select('*').eq('id', uid).single();
      setCv(data);
    }
    cargar();
  }, [router]);

  function copiarLink() {
    const url = `${window.location.origin}/cv/${userId}`;
    navigator.clipboard.writeText(url);
    setLinkCopiado(true);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (!cv) return <div className="container">Cargando...</div>;

  return (
    <div>
      <div className="navbar no-imprimir">
        <span className="logo">Matchy</span>
        <div>
          <a className="nav-link" href="/candidato/cv">Editar CV</a>
          <a className="nav-link" href="/candidato/vacantes">Ver vacantes</a>
          <a className="nav-link" href="/candidato/entrevistas">Mis entrevistas</a>
          <a className="nav-link" href="#" onClick={cerrarSesion}>Cerrar sesión</a>
        </div>
      </div>
      <div className="container no-imprimir" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button className="btn" onClick={() => window.print()}>Descargar / imprimir PDF</button>
        <button className="btn secundario" onClick={copiarLink}>
          {linkCopiado ? 'Link copiado ✓' : 'Copiar link para compartir'}
        </button>
      </div>
      <CvVista cv={cv} />
    </div>
  );
}
