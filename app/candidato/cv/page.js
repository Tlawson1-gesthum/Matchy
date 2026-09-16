'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import ListaEditable from '../../../components/ListaEditable';
import {
  PUESTOS, NIVELES_HERRAMIENTA, NIVELES_IDIOMA,
  TURNOS, DISPONIBILIDAD, DISPONIBLE_DESDE, LOCALIDADES,
} from '../../../lib/opciones';

function calcularAniosExperiencia(experiencia) {
  let totalMeses = 0;
  for (const exp of experiencia) {
    if (!exp.desde) continue;
    const desde = new Date(exp.desde);
    const hasta = exp.actual || !exp.hasta ? new Date() : new Date(exp.hasta);
    const meses = (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth());
    if (meses > 0) totalMeses += meses;
  }
  return Math.round((totalMeses / 12) * 10) / 10;
}

function calcularCompletoPct(cv) {
  const campos = [
    cv.nombre, cv.ciudad, cv.contacto,
    cv.puestos?.length, cv.presentacion,
    cv.experiencia?.length, cv.formacion?.length,
    cv.habilidades?.length, cv.herramientas_nivel?.length,
    cv.disponibilidad_horaria, cv.disponible_desde,
  ];
  const llenos = campos.filter(Boolean).length;
  return Math.round((llenos / campos.length) * 100);
}

const CV_VACIO = {
  nombre: '', foto_url: '', edad: '', ciudad: 'Posadas', contacto: '',
  puestos: [], presentacion: '',
  experiencia: [], formacion: [],
  habilidades: [], herramientas_nivel: [], idiomas_nivel: [],
  herramientas: [], idiomas: [],
  disponibilidad_horaria: '', turno: '', movilidad_propia: false,
  disponible_desde: '', pretension_salarial: '',
  certificado_manipulacion: false, certificado_url: '',
};

export default function CvForm() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [cv, setCv] = useState(CV_VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [subiendoCert, setSubiendoCert] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [guardadoOk, setGuardadoOk] = useState(false);

  useEffect(() => {
    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) { router.push('/candidato/login'); return; }
      setUserId(uid);
      const { data } = await supabase.from('cvs').select('*').eq('id', uid).single();
      if (data) setCv({ ...CV_VACIO, ...data });
      setCargando(false);
    }
    cargar();
  }, [router]);

  function set(campo, valor) {
    setCv((c) => ({ ...c, [campo]: valor }));
    setGuardadoOk(false);
  }

  function togglePuesto(p) {
    setCv((c) => {
      const ya = c.puestos.includes(p);
      if (ya) return { ...c, puestos: c.puestos.filter((x) => x !== p) };
      if (c.puestos.length >= 3) return c;
      return { ...c, puestos: [...c.puestos, p] };
    });
    setGuardadoOk(false);
  }

  function agregarExperiencia() {
    set('experiencia', [...cv.experiencia, {
      empresa: '', puesto: PUESTOS[0], desde: '', hasta: '', actual: false, descripcion: '',
      ref_nombre: '', ref_email: '', ref_celular: '', ref_relacion: '',
    }]);
  }
  function editarExperiencia(i, campo, valor) {
    const nueva = [...cv.experiencia];
    nueva[i] = { ...nueva[i], [campo]: valor };
    set('experiencia', nueva);
  }
  function borrarExperiencia(i) {
    set('experiencia', cv.experiencia.filter((_, idx) => idx !== i));
  }

  function agregarFormacion() {
    set('formacion', [...cv.formacion, { institucion: '', titulo: '', estado: 'completo', anio: '' }]);
  }
  function editarFormacion(i, campo, valor) {
    const nueva = [...cv.formacion];
    nueva[i] = { ...nueva[i], [campo]: valor };
    set('formacion', nueva);
  }
  function borrarFormacion(i) {
    set('formacion', cv.formacion.filter((_, idx) => idx !== i));
  }

  async function subirFoto(e) {
    const file = e.target.files[0];
    if (!file || !userId) return;
    setSubiendoFoto(true);
    const path = `${userId}/foto.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('fotos-perfil').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('fotos-perfil').getPublicUrl(path);
      set('foto_url', `${data.publicUrl}?t=${Date.now()}`);
    }
    setSubiendoFoto(false);
  }

  async function subirCertificado(e) {
    const file = e.target.files[0];
    if (!file || !userId) return;
    setSubiendoCert(true);
    const path = `${userId}/certificado.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('certificados').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('certificados').getPublicUrl(path);
      setCv((c) => ({ ...c, certificado_url: data.publicUrl, certificado_manipulacion: true }));
    }
    setSubiendoCert(false);
  }

  async function guardar() {
    setGuardando(true);
    setMensaje('');
    const anios_experiencia = calcularAniosExperiencia(cv.experiencia);
    const perfil_completo_pct = calcularCompletoPct(cv);
    // Mantenemos las columnas viejas sincronizadas para que el match siga funcionando
    const herramientas = (cv.herramientas_nivel || []).map((h) => h.nombre);
    const idiomas = (cv.idiomas_nivel || []).map((i) => i.nombre);
    const payload = { ...cv, herramientas, idiomas, anios_experiencia, perfil_completo_pct, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('cvs').update(payload).eq('id', userId);
    setGuardando(false);
    if (error) {
      setMensaje('Hubo un error al guardar: ' + error.message);
    } else {
      setCv(payload);
      setMensaje('CV guardado');
      setGuardadoOk(true);
    }
  }

  if (cargando) return <div className="container">Cargando...</div>;

  const pct = calcularCompletoPct(cv);

  return (
    <div>
      <div className="navbar">
        <a className="logo" href="/">Matchy</a>
        <div>
          <a className="nav-link" href="/candidato/panel">Mi panel</a>
          <a className="nav-link" href="/candidato/vacantes">Vacantes</a>
          <a className="nav-link" href="/candidato/mi-perfil">Ver mi CV</a>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h1>Tu CV</h1>

        <div className="card" style={{ marginBottom: 20 }}>
          <strong>Perfil completo: {pct}%</strong>
          <div style={{ background: '#EFEDE8', borderRadius: 6, height: 8, marginTop: 6 }}>
            <div style={{ width: `${pct}%`, background: '#2B4632', height: 8, borderRadius: 6 }} />
          </div>
          <p style={{ fontSize: '0.85rem', marginBottom: 0, marginTop: 10 }}>
            ¿No sabés cómo va a quedar? <a href="/cv-modelo" target="_blank">Mirá un CV de ejemplo</a> antes de empezar.
          </p>
        </div>

        {/* DATOS PERSONALES */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Datos personales</h3>
          <div className="tip">
            Tip: usá una foto con buena luz, de frente y sin lentes de sol, donde se te vea de los hombros para arriba
            ocupando alrededor del 60% del recuadro. Una foto donde apenas se te distingue resta en vez de sumar.
          </div>
          <div className="form-field">
            <label>Nombre completo</label>
            <input value={cv.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Foto (opcional)</label>
            <input type="file" accept="image/*" onChange={subirFoto} />
            {subiendoFoto && <p>Subiendo...</p>}
            {cv.foto_url && (
              <img src={cv.foto_url} alt="" style={{ width: 88, height: 88, borderRadius: 6, objectFit: 'cover', marginTop: 10 }} />
            )}
          </div>
          <div className="form-field">
            <label>Edad (opcional)</label>
            <input type="number" value={cv.edad || ''} onChange={(e) => set('edad', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Dónde vivís</label>
            <select value={cv.ciudad} onChange={(e) => set('ciudad', e.target.value)}>
              {LOCALIDADES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Contacto (WhatsApp o email)</label>
            <input value={cv.contacto} onChange={(e) => set('contacto', e.target.value)} />
          </div>
        </div>

        {/* PUESTOS */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Puestos que te interesan (hasta 3)</h3>
          <div className="tip">
            Elegí solo los puestos que realmente podrías cubrir. Cuando te postules a una vacante concreta vas a poder
            aclarar el detalle si hace falta.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PUESTOS.filter((p) => p !== 'Otro').map((p) => (
              <label key={p} style={{
                border: '1px solid #DDD8CE', borderRadius: 20, padding: '6px 14px',
                background: cv.puestos.includes(p) ? '#2B4632' : 'transparent',
                color: cv.puestos.includes(p) ? '#fff' : '#2B2620', cursor: 'pointer', fontSize: '0.88rem',
              }}>
                <input type="checkbox" checked={cv.puestos.includes(p)} onChange={() => togglePuesto(p)} style={{ display: 'none' }} />
                {p}
              </label>
            ))}
          </div>
        </div>

        {/* PRESENTACIÓN */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Presentación</h3>
          <div className="tip">
            <strong>Tres cosas que conviene incluir:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 18 }}>
              <li>Contá quién sos más allá del puesto: si trabajás bien en equipo, si te manejás con presión, si sos de llegar antes. Eso no se lee en tu experiencia.</li>
              <li>Escribí como hablás, en primera persona y sin exagerar. Tres líneas honestas convencen más que un párrafo de adjetivos.</li>
              <li>Cerrá con lo que buscás en el próximo trabajo: aprender un oficio, estabilidad horaria, crecer a encargado. Al local le sirve saber si coincide con lo que ofrece.</li>
            </ul>
          </div>
          <div className="form-field">
            <textarea rows={5} value={cv.presentacion} onChange={(e) => set('presentacion', e.target.value)} />
          </div>
        </div>

        {/* EXPERIENCIA */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Experiencia laboral</h3>
          <div className="tip">
            Tip: en la descripción contá qué hacías concretamente. Cuántas mesas atendías por turno, de cuántas personas
            era el equipo, qué volumen manejaban los fines de semana.
          </div>
          {cv.experiencia.map((exp, i) => (
            <div key={i} className="card" style={{ marginBottom: 12, background: '#FAFAF8' }}>
              <div className="form-field">
                <label>Puesto</label>
                <select value={exp.puesto} onChange={(e) => editarExperiencia(i, 'puesto', e.target.value)}>
                  {PUESTOS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Empresa / local</label>
                <input value={exp.empresa} onChange={(e) => editarExperiencia(i, 'empresa', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Desde</label>
                  <input type="month" value={exp.desde} onChange={(e) => editarExperiencia(i, 'desde', e.target.value)} />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Hasta</label>
                  <input type="month" value={exp.hasta} disabled={exp.actual} onChange={(e) => editarExperiencia(i, 'hasta', e.target.value)} />
                </div>
              </div>
              <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: 12 }}>
                <input type="checkbox" checked={exp.actual} onChange={(e) => editarExperiencia(i, 'actual', e.target.checked)} /> Trabajo actual
              </label>
              <div className="form-field">
                <label>¿Qué hacías en ese puesto?</label>
                <textarea rows={3} value={exp.descripcion} onChange={(e) => editarExperiencia(i, 'descripcion', e.target.value)} />
              </div>

              <div style={{ borderTop: '1px solid #EEEBE4', paddingTop: 12, marginTop: 4 }}>
                <strong style={{ fontSize: '0.88rem' }}>Contacto de referencia (opcional)</strong>
                <div className="form-field" style={{ marginTop: 8 }}>
                  <label>Nombre</label>
                  <input value={exp.ref_nombre || ''} onChange={(e) => editarExperiencia(i, 'ref_nombre', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" value={exp.ref_email || ''} onChange={(e) => editarExperiencia(i, 'ref_email', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Celular (opcional)</label>
                  <input value={exp.ref_celular || ''} onChange={(e) => editarExperiencia(i, 'ref_celular', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Relación con el trabajo (ej. encargado directo, dueño)</label>
                  <input value={exp.ref_relacion || ''} onChange={(e) => editarExperiencia(i, 'ref_relacion', e.target.value)} />
                </div>
              </div>

              <button type="button" className="btn secundario" onClick={() => borrarExperiencia(i)}>Quitar experiencia</button>
            </div>
          ))}
          <button type="button" className="btn secundario" onClick={agregarExperiencia}>+ Agregar experiencia</button>
        </div>

        {/* FORMACIÓN */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Formación y cursos</h3>
          <div className="tip">
            <strong>Cómo cargar tus cursos:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 18 }}>
              <li>Escribí el nombre completo del curso y quién lo dictó, aunque haya durado un día o haya sido online. "Curso de barismo — Escuela X" vale más que "curso de café".</li>
              <li>Si lo estás cursando, cargalo igual y marcá "en curso" con el año en que calculás terminarlo. Estar estudiando suma; esconderlo no.</li>
              <li>Poné primero lo que tenga que ver con gastronomía — manipulación de alimentos, barismo, pastelería, atención al cliente — y después el resto de tu formación.</li>
            </ul>
          </div>
          {cv.formacion.map((f, i) => (
            <div key={i} className="card" style={{ marginBottom: 12, background: '#FAFAF8' }}>
              <div className="form-field">
                <label>Título / curso</label>
                <input value={f.titulo} onChange={(e) => editarFormacion(i, 'titulo', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Institución</label>
                <input value={f.institucion} onChange={(e) => editarFormacion(i, 'institucion', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Estado</label>
                  <select value={f.estado} onChange={(e) => editarFormacion(i, 'estado', e.target.value)}>
                    <option value="completo">Completo</option>
                    <option value="en_curso">En curso</option>
                  </select>
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Año</label>
                  <input value={f.anio} onChange={(e) => editarFormacion(i, 'anio', e.target.value)} />
                </div>
              </div>
              <button type="button" className="btn secundario" onClick={() => borrarFormacion(i)}>Quitar</button>
            </div>
          ))}
          <button type="button" className="btn secundario" onClick={agregarFormacion}>+ Agregar formación</button>
        </div>

        {/* HABILIDADES */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Habilidades</h3>
          <div className="tip">
            Ejemplos que valen en gastronomía: atención al cliente, trabajo bajo presión, manejo de bandeja, armado de mise en place,
            control de stock, cierre de caja, limpieza de estación, trabajo en equipo, puntualidad.
          </div>
          <ListaEditable
            items={cv.habilidades}
            onChange={(v) => set('habilidades', v)}
            placeholder="Escribí una habilidad y apretá Agregar"
          />
        </div>

        {/* HERRAMIENTAS */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Herramientas</h3>
          <div className="tip">
            Ejemplos: sistema de gestión (FUDO, Maxirest), caja registradora, posnet, parrilla, plancha, horno convector,
            cafetera express, molinillo, licuadora industrial, freidora.
          </div>
          <ListaEditable
            items={cv.herramientas_nivel}
            onChange={(v) => set('herramientas_nivel', v)}
            niveles={NIVELES_HERRAMIENTA}
            placeholder="Escribí una herramienta"
          />
        </div>

        {/* IDIOMAS */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Idiomas</h3>
          <div className="tip">
            En Posadas el portugués suma mucho por el turismo brasileño. Si lo entendés y te podés hacer entender,
            cargalo aunque no lo hables perfecto.
          </div>
          <ListaEditable
            items={cv.idiomas_nivel}
            onChange={(v) => set('idiomas_nivel', v)}
            niveles={NIVELES_IDIOMA}
            placeholder="Escribí un idioma"
          />
        </div>

        {/* DISPONIBILIDAD */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Disponibilidad</h3>
          <div className="form-field">
            <label>Disponibilidad horaria</label>
            <select value={cv.disponibilidad_horaria} onChange={(e) => set('disponibilidad_horaria', e.target.value)}>
              <option value="">Elegir...</option>
              {DISPONIBILIDAD.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Turno preferido</label>
            <select value={cv.turno} onChange={(e) => set('turno', e.target.value)}>
              {TURNOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Disponible desde</label>
            <select value={cv.disponible_desde} onChange={(e) => set('disponible_desde', e.target.value)}>
              <option value="">Elegir...</option>
              {DISPONIBLE_DESDE.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input type="checkbox" checked={cv.movilidad_propia} onChange={(e) => set('movilidad_propia', e.target.checked)} /> Tengo movilidad propia
          </label>
          <div className="form-field">
            <label>Pretensión salarial (opcional)</label>
            <input value={cv.pretension_salarial} onChange={(e) => set('pretension_salarial', e.target.value)} />
          </div>
        </div>

        {/* CERTIFICADO */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Certificado de manipulación de alimentos</h3>
          <div className="tip">
            Si ya lo tenés, subilo: poder verlo en el momento le ahorra un trámite al local y te pone varios escalones
            arriba de quien solo dice tenerlo.
          </div>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input type="checkbox" checked={cv.certificado_manipulacion} onChange={(e) => set('certificado_manipulacion', e.target.checked)} /> Tengo el certificado vigente
          </label>
          <div className="form-field">
            <label>Subir certificado (foto o PDF, opcional)</label>
            <input type="file" accept="image/*,application/pdf" onChange={subirCertificado} />
            {subiendoCert && <p>Subiendo...</p>}
            {cv.certificado_url && (
              <p style={{ marginTop: 8 }}>
                <a href={cv.certificado_url} target="_blank" rel="noreferrer">Ver certificado cargado</a>
              </p>
            )}
          </div>
        </div>

        {mensaje && <p style={{ color: guardadoOk ? '#2B4632' : '#B5432A' }}>{mensaje}</p>}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
          <button className="btn" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar CV'}
          </button>
          {guardadoOk && (
            <a className="btn secundario" href="/candidato/mi-perfil">Ver y descargar en PDF</a>
          )}
        </div>
      </div>
    </div>
  );
}
