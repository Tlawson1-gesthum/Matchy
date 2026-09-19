'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import ListaEditable from '../../../../components/ListaEditable';
import { PUESTOS, TURNOS, DIAS_TRABAJO, URGENCIAS, DISPONIBILIDAD } from '../../../../lib/opciones';
import Encabezado from '../../../../components/Encabezado';
import Pie from '../../../../components/Pie';

export default function NuevaVacante() {
  const router = useRouter();
  const [empleador, setEmpleador] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [form, setForm] = useState({
    puesto: PUESTOS[0],
    puesto_otro: '',
    turno: '',
    dias_trabajo: '',
    urgencia: 'esta_semana',
    experiencia_minima_anios: 0,
    disponibilidad_requerida: '',
    movilidad_requerida: false,
    certificado_requerido: false,
    herramientas_buscadas: [],
    descripcion: '',
    contacto: '',
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    async function verificar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) { router.push('/empleador/login'); return; }

      const { data: emp } = await supabase
        .from('empleadores')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (!emp) {
        setError('Esta cuenta no tiene un local asociado. Si te registraste como candidato, necesitás una cuenta aparte para publicar vacantes.');
        setVerificando(false);
        return;
      }

      setEmpleador(emp);
      setForm((f) => ({ ...f, contacto: emp.contacto || '' }));
      setVerificando(false);
    }
    verificar();
  }, [router]);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setCargando(true);
    setError('');

    const { error: errIns } = await supabase.from('vacantes').insert({
      empleador_id: empleador.id,
      puesto: form.puesto,
      puesto_otro: form.puesto === 'Otro' ? form.puesto_otro : null,
      turno: form.turno || null,
      dias_trabajo: form.dias_trabajo || null,
      tipo_local: empleador.tipo_local || null,
      urgencia: form.urgencia,
      experiencia_minima_anios: Number(form.experiencia_minima_anios) || 0,
      disponibilidad_requerida: form.disponibilidad_requerida,
      movilidad_requerida: form.movilidad_requerida,
      certificado_requerido: form.certificado_requerido,
      herramientas_buscadas: form.herramientas_buscadas,
      descripcion: form.descripcion,
      contacto: form.contacto,
    });

    setCargando(false);
    if (errIns) {
      setError('No se pudo publicar la vacante: ' + errIns.message);
      return;
    }
    router.push('/empleador/vacantes');
  }

  if (verificando) return <div className="container">Cargando...</div>;

  if (!empleador) {
    return (
      <div>
      <Encabezado links={[{ href: '/empleador/vacantes', texto: 'Mis vacantes' }]} />
        <div className="container" style={{ maxWidth: 520 }}>
          <h1>No podemos publicar todavía</h1>
          <div className="card">
            <p>{error}</p>
            <a className="btn" href="/empleador/registro">Registrar mi local</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Encabezado links={[{ href: '/empleador/vacantes', texto: 'Mis vacantes' }]} />
      <div className="container" style={{ maxWidth: 600 }}>
        <h1>Publicar vacante</h1>

        {empleador.estado === 'pendiente' && (
          <div className="tip">
            Tu local todavía está en revisión. Podés cargar la vacante igual: se va a publicar apenas aprobemos el alta.
          </div>
        )}

        <div className="aviso-legal">
          <strong>Antes de publicar.</strong> Publicá solo vacantes reales y vigentes, con condiciones que vayas a
          cumplir. Matchy pone en contacto a las partes: la relación laboral que surja, su registración y todas las
          obligaciones que de ella deriven son exclusivamente tuyas como empleador.
        </div>

        <form onSubmit={handleSubmit} className="card">
          <div className="form-field">
            <label>Puesto</label>
            <select value={form.puesto} onChange={(e) => set('puesto', e.target.value)}>
              {PUESTOS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {form.puesto === 'Otro' && (
            <div className="form-field">
              <label>¿Qué puesto es?</label>
              <input required value={form.puesto_otro} onChange={(e) => set('puesto_otro', e.target.value)} />
            </div>
          )}

          <div className="form-field">
            <label>Turno</label>
            <select value={form.turno} onChange={(e) => set('turno', e.target.value)}>
              {TURNOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label>Días de trabajo</label>
            <select value={form.dias_trabajo} onChange={(e) => set('dias_trabajo', e.target.value)}>
              {DIAS_TRABAJO.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label>Tipo de jornada</label>
            <select value={form.disponibilidad_requerida} onChange={(e) => set('disponibilidad_requerida', e.target.value)}>
              <option value="">A definir</option>
              {DISPONIBILIDAD.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label>Urgencia de contratación</label>
            <select value={form.urgencia} onChange={(e) => set('urgencia', e.target.value)}>
              {URGENCIAS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label>Experiencia mínima (años)</label>
            <input type="number" min="0" step="0.5" value={form.experiencia_minima_anios} onChange={(e) => set('experiencia_minima_anios', e.target.value)} />
          </div>

          <label style={{ display: 'block', marginBottom: 12 }}>
            <input type="checkbox" checked={form.movilidad_requerida} onChange={(e) => set('movilidad_requerida', e.target.checked)} /> Requiere movilidad propia
          </label>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <input type="checkbox" checked={form.certificado_requerido} onChange={(e) => set('certificado_requerido', e.target.checked)} /> Requiere certificado de manipulación de alimentos
          </label>

          <div className="form-field">
            <label>Herramientas o habilidades que buscás</label>
            <div className="tip">
              Cuanto más específico, mejor ordena el ranking. Ejemplos: parrilla, cafetera express, posnet, FUDO, manejo de bandeja.
            </div>
            <ListaEditable
              items={form.herramientas_buscadas}
              onChange={(v) => set('herramientas_buscadas', v)}
              placeholder="Escribí una herramienta"
            />
          </div>

          <div className="form-field" style={{ marginTop: 16 }}>
            <label>Descripción de la vacante</label>
            <div className="tip">
              <strong>Qué conviene incluir:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 18 }}>
                <li>Cómo es el local y el ritmo real del turno: cuántas mesas, cuánta gente en el equipo, qué días son los fuertes.</li>
                <li>Qué va a hacer concretamente la persona, y qué se espera de ella en la primera semana.</li>
                <li>Qué ofrecés más allá del sueldo: comida del personal, propinas, posibilidad de crecer, horarios fijos. Eso es lo que decide entre dos avisos parecidos.</li>
              </ul>
            </div>
            <textarea rows={5} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
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
        <div style={{ height: 40 }} />
      </div>
      <Pie />
    </div>
  );
}
