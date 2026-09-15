'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';

const PUESTOS = ['Mozo/a', 'Cocinero/a', 'Ayudante de cocina', 'Bartender', 'Cadete/delivery', 'Encargado/a', 'Cajero/a', 'Otro'];
const TURNOS = [{ value: '', label: 'Cualquiera' }, { value: 'manana', label: 'Mañana' }, { value: 'tarde', label: 'Tarde' }, { value: 'noche', label: 'Noche' }, { value: 'rotativo', label: 'Rotativo' }];
const URGENCIAS = [{ value: 'hoy', label: 'Para hoy / urgente' }, { value: 'esta_semana', label: 'Esta semana' }, { value: 'este_mes', label: 'Este mes' }, { value: 'sin_apuro', label: 'Sin apuro' }];

export default function NuevaVacante() {
  const router = useRouter();
  const [form, setForm] = useState({
    puesto: PUESTOS[0],
    turno: '',
    urgencia: 'esta_semana',
    horario_detalle: '',
    experiencia_minima_anios: 0,
    disponibilidad_requerida: '',
    movilidad_requerida: false,
    certificado_requerido: false,
    herramientas_buscadas: '',
    descripcion: '',
    contacto: '',
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setCargando(true);
    setError('');
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      router.push('/empleador/login');
      return;
    }
    const { data: empleador } = await supabase.from('empleadores').select('tipo_local').eq('id', uid).single();

    const { error: errIns } = await supabase.from('vacantes').insert({
      empleador_id: uid,
      puesto: form.puesto,
      turno: form.turno || null,
      tipo_local: empleador?.tipo_local || null,
      urgencia: form.urgencia,
      horario_detalle: form.horario_detalle,
      experiencia_minima_anios: Number(form.experiencia_minima_anios) || 0,
      disponibilidad_requerida: form.disponibilidad_requerida,
      movilidad_requerida: form.movilidad_requerida,
      certificado_requerido: form.certificado_requerido,
      herramientas_buscadas: form.herramientas_buscadas.split(',').map((s) => s.trim()).filter(Boolean),
      descripcion: form.descripcion,
      contacto: form.contacto,
    });

    setCargando(false);
    if (errIns) {
      setError(errIns.message);
      return;
    }
    router.push('/empleador/vacantes');
  }

  return (
    <div>
      <div className="navbar">
        <span className="logo">Matchy</span>
        <a className="nav-link" href="/empleador/vacantes">Mis vacantes</a>
      </div>
      <div className="container" style={{ maxWidth: 600 }}>
        <h1>Publicar vacante</h1>
        <p>Cuanto más específico seas, mejor va a ser el ranking automático de candidatos.</p>
        <form onSubmit={handleSubmit} className="card">
          <div className="form-field">
            <label>Puesto</label>
            <select value={form.puesto} onChange={(e) => set('puesto', e.target.value)}>
              {PUESTOS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Turno</label>
            <select value={form.turno} onChange={(e) => set('turno', e.target.value)}>
              {TURNOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Urgencia de contratación</label>
            <select value={form.urgencia} onChange={(e) => set('urgencia', e.target.value)}>
              {URGENCIAS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Detalle de horario (ej. "Martes a domingo, turno noche")</label>
            <input value={form.horario_detalle} onChange={(e) => set('horario_detalle', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Experiencia mínima (años)</label>
            <input type="number" min="0" step="0.5" value={form.experiencia_minima_anios} onChange={(e) => set('experiencia_minima_anios', e.target.value)} />
          </div>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input type="checkbox" checked={form.movilidad_requerida} onChange={(e) => set('movilidad_requerida', e.target.checked)} /> Requiere movilidad propia
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input type="checkbox" checked={form.certificado_requerido} onChange={(e) => set('certificado_requerido', e.target.checked)} /> Requiere certificado de manipulación de alimentos
          </label>
          <div className="form-field">
            <label>Herramientas / habilidades que buscás (separadas por coma)</label>
            <input value={form.herramientas_buscadas} onChange={(e) => set('herramientas_buscadas', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Descripción de la vacante</label>
            <textarea rows={4} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Contacto para candidatos preseleccionados</label>
            <input required value={form.contacto} onChange={(e) => set('contacto', e.target.value)} />
          </div>
          {error && <p style={{ color: '#B5432A' }}>{error}</p>}
          <button className="btn" type="submit" disabled={cargando}>
            {cargando ? 'Publicando...' : 'Publicar vacante'}
          </button>
        </form>
      </div>
    </div>
  );
}
