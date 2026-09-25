'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { TIPOS_LOCAL, LOCALIDADES, revisarCuit, revisarRedSocial } from '../../../lib/opciones';
import { traducirError } from '../../../lib/errores';
import GuardiaRol from '../../../components/GuardiaRol';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';
import PantallaCarga from '../../../components/PantallaCarga';
import CampoLogo from '../../../components/CampoLogo';

const EDITABLES = ['tipo_local', 'ciudad', 'direccion', 'red_social', 'contacto', 'logo_url'];

function MiLocalContenido() {
  const router = useRouter();
  const [local, setLocal] = useState(null);
  const [form, setForm] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) { router.push('/empleador/login'); return; }
      const { data, error: err } = await supabase.from('empleadores').select('*').eq('id', uid).maybeSingle();
      if (!data) { router.push(err ? '/empleador/vacantes' : '/empleador/registro'); return; }
      setLocal(data);
      setForm(Object.fromEntries(EDITABLES.map((c) => [c, data[c] || ''])));
      setCargando(false);
    }
    cargar();
  }, [router]);

  function set(campo, valor) {
    setMensaje('');
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  const chequeoRed = revisarRedSocial(form?.red_social || '');

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    if (!form.direccion.trim()) { setError('Falta la dirección del local.'); return; }
    if (!form.contacto.trim()) { setError('Falta el contacto que ven los candidatos.'); return; }
    if (!chequeoRed.valido) { setError('Revisá el enlace del local: ' + chequeoRed.mensaje); return; }

    setGuardando(true);
    const cambios = {
      ...form,
      red_social: chequeoRed.normalizada || form.red_social,
      logo_url: form.logo_url || null,
    };
    const { error: err } = await supabase.from('empleadores').update(cambios).eq('id', local.id);
    setGuardando(false);
    if (err) { setError('No pudimos guardar los cambios: ' + traducirError(err.message)); return; }
    setLocal((l) => ({ ...l, ...cambios }));
    setMensaje('Listo, guardamos los cambios. Ya se ven en tus vacantes.');
  }

  if (cargando) return <PantallaCarga texto="Cargando tu local..." />;

  const cuit = revisarCuit(local.cuit || '');

  return (
    <div>
      <Encabezado
        links={[{ href: '/empleador/vacantes', texto: 'Mis vacantes' }, { href: '/empleador/vacantes/nueva', texto: 'Publicar vacante' }, { href: '/empleador/mi-local', texto: 'Mi local' }]}
        campanaHref="/empleador/vacantes"
      />
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>Mi local</h1>
        <p>Lo que cargues acá es lo que ven los candidatos en cada una de tus vacantes.</p>

        <div className="ficha-local">
          <div className="ficha-local-cabecera">
            <div>
              <p className="ficha-local-nombre">{local.nombre_local}</p>
              <p className="ficha-local-rubro">Datos verificados</p>
            </div>
            {local.estado === 'aprobado' && <span className="pildora aprobado">Verificado</span>}
            {local.estado === 'pendiente' && <span className="pildora pendiente">En revisión</span>}
          </div>
          <div className="ficha-local-grid">
            <div className="dato"><span className="dato-rotulo">Razón social</span><span className="dato-valor">{local.razon_social || '—'}</span></div>
            <div className="dato"><span className="dato-rotulo">CUIT</span><span className="dato-valor mono">{cuit.formateado || local.cuit || '—'}</span></div>
            <div className="dato"><span className="dato-rotulo">Responsable</span><span className="dato-valor">{local.nombre_responsable || '—'}</span></div>
            <div className="dato"><span className="dato-rotulo">Teléfono de verificación</span><span className="dato-valor">{local.telefono || '—'}</span></div>
          </div>
          <div className="ficha-local-acciones">
            <span className="ficha-nota">
              Con estos datos verificamos tu local, por eso no se pueden cambiar desde acá. Si necesitás
              corregir alguno, escribinos a{' '}
              <a href="mailto:gozzasabores@gmail.com?subject=Cambiar%20datos%20de%20mi%20local">gozzasabores@gmail.com</a>.
            </span>
          </div>
        </div>

        <form className="card" onSubmit={guardar}>
          <h2 className="card-titulo">Datos que podés editar</h2>

          <CampoLogo
            logoUrl={form.logo_url}
            onCambio={(url) => set('logo_url', url)}
            local={{ ...local, ...form }}
            setError={setError}
          />

          <div className="form-field">
            <label htmlFor="ml-tipo">Tipo de local</label>
            <select id="ml-tipo" value={form.tipo_local} onChange={(e) => set('tipo_local', e.target.value)}>
              {TIPOS_LOCAL.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="ml-ciudad">Localidad</label>
            <select id="ml-ciudad" value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)}>
              {LOCALIDADES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="ml-direccion">Dirección exacta</label>
            <input id="ml-direccion" placeholder="Calle, número, barrio" value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="ml-red">Enlace público del local</label>
            <input id="ml-red" placeholder="https://instagram.com/tulocal" value={form.red_social} onChange={(e) => set('red_social', e.target.value)} />
            {form.red_social && (
              <p className={chequeoRed.valido ? 'chequeo-ok' : 'chequeo-mal'}>{chequeoRed.mensaje}</p>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="ml-contacto">Contacto que van a ver los candidatos</label>
            <input id="ml-contacto" value={form.contacto} onChange={(e) => set('contacto', e.target.value)} />
          </div>

          {error && <p className="mensaje-error" role="alert">{error}</p>}
          {mensaje && <p className="chequeo-ok" role="status">{mensaje}</p>}
          <button className="btn" type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
        <div style={{ height: 40 }} />
      </div>
      <Pie />
    </div>
  );
}

export default function MiLocal(props) {
  return (
    <GuardiaRol rol="empleador">
      <MiLocalContenido {...props} />
    </GuardiaRol>
  );
}
