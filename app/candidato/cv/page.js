'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

const PUESTOS = [
  'Mozo/a', 'Cocinero/a', 'Ayudante de cocina', 'Bartender',
  'Cadete/delivery', 'Encargado/a', 'Cajero/a', 'Otro',
];
const TURNOS = [
  { value: '', label: 'Sin preferencia' },
  { value: 'manana', label: 'Mañana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
  { value: 'rotativo', label: 'Rotativo' },
];
const DISPONIBILIDAD = [
  { value: 'tiempo_completo', label: 'Tiempo completo' },
  { value: 'medio_tiempo', label: 'Medio tiempo' },
  { value: 'fines_de_semana', label: 'Fines de semana' },
  { value: 'flexible', label: 'Flexible' },
];
const DISPONIBLE_DESDE = [
  { value: 'inmediata', label: 'Inmediata' },
  { value: '15_dias', label: 'En 15 días' },
  { value: '30_dias', label: 'En 30 días' },
  { value: 'a_definir', label: 'A definir' },
];

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
    cv.nombre, cv.foto_url, cv.ciudad, cv.contacto,
    cv.puestos?.length, cv.presentacion,
    cv.experiencia?.length, cv.formacion?.length,
    cv.habilidades?.length, cv.herramientas?.length,
    cv.disponibilidad_horaria, cv.disponible_desde,
  ];
  const llenos = campos.filter(Boolean).length;
  return Math.round((llenos / campos.length) * 100);
}

const CV_VACIO = {
  nombre: '', foto_url: '', edad: '', ciudad: '', contacto: '',
  puestos: [], presentacion: '',
  experiencia: [], formacion: [],
  habilidades: [], herramientas: [], idiomas: [],
  disponibilidad_horaria: '', turno: '', movilidad_propia: false,
  disponible_desde: '', pretension_salarial: '', certificado_manipulacion: false,
};

export default function CvForm() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [cv, setCv] = useState(CV_VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [mensaje, setMensaje] = useState('');

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
      if (data) setCv({ ...CV_VACIO, ...data });
      setCargando(false);
    }
    cargar();
  }, [router]);

  function set(campo, valor) {
    setCv((c) => ({ ...c, [campo]: valor }));
  }

  function togglePuesto(p) {
    setCv((c) => {
      const ya = c.puestos.includes(p);
      if (ya) return { ...c, puestos: c.puestos.filter((x) => x !== p) };
      if (c.puestos.length >= 3) return c;
      return { ...c, puestos: [...c.puestos, p] };
    });
  }

  function setTags(campo, texto) {
    const lista = texto.split(',').map((s) => s.trim()).filter(Boolean);
    set(campo, lista);
  }

  function agregarExperiencia() {
    set('experiencia', [
      ...cv.experiencia,
      { empresa: '', puesto: '', desde: '', hasta: '', actual: false, descripcion: '', contacto_referencia: '' },
    ]);
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
      set('foto_url', data.publicUrl);
    }
    setSubiendoFoto(false);
  }

  async function guardar() {
    setGuardando(true);
    setMensaje('');
    const anios_experiencia = calcularAniosExperiencia(cv.experiencia);
    const perfil_completo_pct = calcularCompletoPct(cv);
    const payload = { ...cv, anios_experiencia, perfil_completo_pct, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('cvs').update(payload).eq('id', userId);
    setGuardando(false);
    if (error) {
      setMensaje('Hubo un error al guardar: ' + error.message);
    } else {
      setCv(payload);
      setMensaje('Guardado ✓');
    }
  }

  if (cargando) return <div className="container">Cargando...</div>;

  const pct = calcularCompletoPct(cv);

  return (
    <div>
      <div className="navbar">
        <span className="logo">Matchy</span>
        <a className="nav-link" href="/candidato/mi-perfil">Ver mi perfil</a>
      </div>
      <div className="container" style={{ maxWidth: 700 }}>
        <h1>Tu CV</h1>
        <div className="card" style={{ marginBottom: 20 }}>
          <strong>Perfil completo: {pct}%</strong>
          <div style={{ background: '#eee', borderRadius: 6, height: 8, marginTop: 6 }}>
            <div style={{ width: `${pct}%`, background: '#2B4632', height: 8, borderRadius: 6 }} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Datos personales</h3>
          <div className="tip">Tip: una foto de buena calidad, con buena luz, mejora mucho tus chances.</div>
          <div className="form-field">
            <label>Nombre completo</label>
            <input value={cv.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Foto (opcional)</label>
            <input type="file" accept="image/*" onChange={subirFoto} />
            {subiendoFoto && <p>Subiendo...</p>}
            {cv.foto_url && (
              <img src={cv.foto_url} alt="foto de perfil" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginTop: 8 }} />
            )}
          </div>
          <div className="form-field">
            <label>Edad (opcional)</label>
            <input type="number" value={cv.edad || ''} onChange={(e) => set('edad', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Ciudad</label>
            <input value={cv.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Contacto (WhatsApp o email)</label>
            <input value={cv.contacto} onChange={(e) => set('contacto', e.target.value)} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Puestos a los que te postulás (hasta 3)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PUESTOS.map((p) => (
              <label key={p} style={{ border: '1px solid #ccc', borderRadius: 20, padding: '6px 14px', background: cv.puestos.includes(p) ? '#2B4632' : 'transparent', color: cv.puestos.includes(p) ? '#fff' : '#2B2620', cursor: 'pointer' }}>
                <input type="checkbox" checked={cv.puestos.includes(p)} onChange={() => togglePuesto(p)} style={{ display: 'none' }} />
                {p}
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Presentación</h3>
          <div className="tip">Tip: evitá frases genéricas como "responsable y proactivo". Contá algo concreto: cuántas mesas manejabas, qué turnos cubrías.</div>
          <div className="form-field">
            <textarea rows={4} value={cv.presentacion} onChange={(e) => set('presentacion', e.target.value)} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Experiencia laboral</h3>
          {cv.experiencia.map((exp, i) => (
            <div key={i} className="card" style={{ marginBottom: 12, background: '#FBF8EF' }}>
              <div className="form-field"><label>Empresa</label><input value={exp.empresa} onChange={(e) => editarExperiencia(i, 'empresa', e.target.value)} /></div>
              <div className="form-field"><label>Puesto</label><input value={exp.puesto} onChange={(e) => editarExperiencia(i, 'puesto', e.target.value)} /></div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-field" style={{ flex: 1 }}><label>Desde</label><input type="month" value={exp.desde} onChange={(e) => editarExperiencia(i, 'desde', e.target.value)} /></div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Hasta</label>
                  <input type="month" value={exp.hasta} disabled={exp.actual} onChange={(e) => editarExperiencia(i, 'hasta', e.target.value)} />
                </div>
              </div>
              <label style={{ fontSize: '0.85rem' }}>
                <input type="checkbox" checked={exp.actual} onChange={(e) => editarExperiencia(i, 'actual', e.target.checked)} /> Trabajo actual
              </label>
              <div className="form-field"><label>Descripción de tareas</label><textarea rows={2} value={exp.descripcion} onChange={(e) => editarExperiencia(i, 'descripcion', e.target.value)} /></div>
              <div className="form-field"><label>Contacto de referencia (opcional)</label><input value={exp.contacto_referencia} onChange={(e) => editarExperiencia(i, 'contacto_referencia', e.target.value)} /></div>
              <button type="button" className="btn secundario" onClick={() => borrarExperiencia(i)}>Quitar</button>
            </div>
          ))}
          <button type="button" className="btn secundario" onClick={agregarExperiencia}>+ Agregar experiencia</button>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Formación académica</h3>
          <div className="tip">Tip: cargá tu secundario aunque esté en curso, suma igual.</div>
          {cv.formacion.map((f, i) => (
            <div key={i} className="card" style={{ marginBottom: 12, background: '#FBF8EF' }}>
              <div className="form-field"><label>Institución</label><input value={f.institucion} onChange={(e) => editarFormacion(i, 'institucion', e.target.value)} /></div>
              <div className="form-field"><label>Título / curso</label><input value={f.titulo} onChange={(e) => editarFormacion(i, 'titulo', e.target.value)} /></div>
              <div className="form-field">
                <label>Estado</label>
                <select value={f.estado} onChange={(e) => editarFormacion(i, 'estado', e.target.value)}>
                  <option value="completo">Completo</option>
                  <option value="en_curso">En curso</option>
                </select>
              </div>
              <div className="form-field"><label>Año</label><input value={f.anio} onChange={(e) => editarFormacion(i, 'anio', e.target.value)} /></div>
              <button type="button" className="btn secundario" onClick={() => borrarFormacion(i)}>Quitar</button>
            </div>
          ))}
          <button type="button" className="btn secundario" onClick={agregarFormacion}>+ Agregar formación</button>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Habilidades, herramientas e idiomas</h3>
          <div className="form-field">
            <label>Habilidades (separadas por coma)</label>
            <input defaultValue={cv.habilidades.join(', ')} onBlur={(e) => setTags('habilidades', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Herramientas (ej. POS, caja registradora, parrilla)</label>
            <input defaultValue={cv.herramientas.join(', ')} onBlur={(e) => setTags('herramientas', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Idiomas</label>
            <input defaultValue={cv.idiomas.join(', ')} onBlur={(e) => setTags('idiomas', e.target.value)} />
          </div>
        </div>

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
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input type="checkbox" checked={cv.certificado_manipulacion} onChange={(e) => set('certificado_manipulacion', e.target.checked)} /> Tengo certificado de manipulación de alimentos vigente
          </label>
          <div className="form-field">
            <label>Pretensión salarial (opcional)</label>
            <input value={cv.pretension_salarial} onChange={(e) => set('pretension_salarial', e.target.value)} />
          </div>
        </div>

        {mensaje && <p>{mensaje}</p>}
        <button className="btn" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar CV'}
        </button>
      </div>
    </div>
  );
}
