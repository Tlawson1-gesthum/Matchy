'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

function IconoCampana() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10.3 20a2 2 0 0 0 3.4 0" />
    </svg>
  );
}

function IconoMenu() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconoFlecha() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function Encabezado({ links = [], destacado = null, campanaHref = null }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [menuCuenta, setMenuCuenta] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [pendientes, setPendientes] = useState(0);
  const cuentaRef = useRef(null);

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      setUsuario(u);

      // Notificaciones reales: entrevistas esperando respuesta del candidato
      const { data: perfil } = await supabase
        .from('perfiles').select('role').eq('id', u.id).maybeSingle();
      setRol(perfil?.role || null);

      if (perfil?.role === 'candidato') {
        const { data: posts } = await supabase
          .from('postulaciones').select('id').eq('candidato_id', u.id);
        if (posts?.length) {
          const { count } = await supabase
            .from('entrevistas')
            .select('id', { count: 'exact', head: true })
            .in('postulacion_id', posts.map((p) => p.id))
            .eq('estado', 'pendiente');
          setPendientes(count || 0);
        }
      } else if (perfil?.role === 'empleador') {
        const { data: vacs } = await supabase
          .from('vacantes').select('id').eq('empleador_id', u.id).eq('estado', 'activa');
        if (vacs?.length) {
          const { count } = await supabase
            .from('postulaciones')
            .select('id', { count: 'exact', head: true })
            .in('vacante_id', vacs.map((v) => v.id))
            .eq('estado', 'postulado');
          setPendientes(count || 0);
        }
      }
    }
    cargar();
  }, []);

  useEffect(() => {
    function fuera(e) {
      if (cuentaRef.current && !cuentaRef.current.contains(e.target)) setMenuCuenta(false);
    }
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  async function salir(e) {
    if (e) e.preventDefault();
    setMenuCuenta(false);
    setAbierto(false);
    await supabase.auth.signOut();
    setUsuario(null);
    // Recarga completa: garantiza que ninguna pantalla quede mostrando datos de la sesión cerrada.
    window.location.href = '/';
  }

  const panelHref = rol === 'empleador' ? '/empleador/vacantes' : '/candidato/panel';


  const avatar = usuario?.user_metadata?.avatar_url || usuario?.user_metadata?.picture || null;
  const iniciales = (usuario?.user_metadata?.full_name || usuario?.email || '?')
    .trim().charAt(0).toUpperCase();

  // Si no nos pasan destino, lo deducimos del rol de la sesión.
  const destinoCampana =
    campanaHref ||
    links.find((l) => /entrevista|postulante|vacante/i.test(l.texto))?.href ||
    '/';

  return (
    <header className="cabecera">
      <a className="cabecera-marca" href="/">
        <img src="/logo.png" alt="" className="cabecera-logo" />
        <span>Voral</span>
      </a>

      <div className="cabecera-iconos">
        {destacado && (
          <a className="btn-destacado" href={destacado.href}>
            {destacado.texto}
            {destacado.cantidad > 0 && <span className="burbuja">{destacado.cantidad}</span>}
          </a>
        )}

        {links.length > 0 && (
          <nav className="cabecera-nav">
            {links.map((l) => (
              <a key={l.href} href={l.href}>{l.texto}</a>
            ))}
          </nav>
        )}

        {usuario && (
          <a className="icono-plano campana" href={destinoCampana} aria-label={`${pendientes} novedades`}>
            <IconoCampana />
            {pendientes > 0 && <span className="punto-rojo" />}
          </a>
        )}

        {usuario && (
          <div className="cuenta" ref={cuentaRef}>
            <button
              className="cuenta-boton"
              onClick={() => setMenuCuenta((v) => !v)}
              aria-label="Mi cuenta"
            >
              {avatar ? (
                <img src={avatar} alt="" className="avatar" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar avatar-letra">{iniciales}</span>
              )}
              <IconoFlecha />
            </button>

            {menuCuenta && (
              <nav className="menu-desplegado">
                <span className="menu-mail">{usuario.email}</span>
                <a href={panelHref}>Ir a mi panel</a>
                {links.filter((l) => l.href !== panelHref).map((l) => (
                  <a key={l.href} href={l.href}>{l.texto}</a>
                ))}
                <button type="button" className="menu-salir" onClick={salir}>Cerrar sesión</button>
                <a href="/cuenta/eliminar" className="menu-eliminar">Eliminar mi cuenta</a>
              </nav>
            )}
          </div>
        )}

        {links.length > 0 && (
          <button className="icono-plano solo-movil" onClick={() => setAbierto((v) => !v)} aria-label="Menú">
            <IconoMenu />
          </button>
        )}
      </div>

      {abierto && links.length > 0 && (
        <nav className="menu-desplegado menu-movil">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setAbierto(false)}>{l.texto}</a>
          ))}
          {usuario && <a href={panelHref}>Ir a mi panel</a>}
          {usuario && <button type="button" className="menu-salir" onClick={salir}>Cerrar sesión</button>}
          {usuario && <a href="/cuenta/eliminar" className="menu-eliminar">Eliminar mi cuenta</a>}
        </nav>
      )}
    </header>
  );
}
