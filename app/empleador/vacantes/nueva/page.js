'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import ListaEditable from '../../../../components/ListaEditable';
import { horarioParaGuardar, aValorSelector, minimoSelector } from '../../../../lib/fechas';
import { PUESTOS, TURNOS, DIAS_TRABAJO, URGENCIAS, DISPONIBILIDAD } from '../../../../lib/opciones';
import { traducirError } from '../../../../lib/errores';
import GuardiaRol from '../../../../components/GuardiaRol';
import Encabezado from '../../../../components/Encabezado';
import Pie from '../../../../components/Pie';
import PantallaCarga from '../../../../components/PantallaCarga';

function NuevaVacanteContenido() {
  const router = useRouter();
  const [empleador, setEmpleador] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [form, setForm] = useState({
    puesto: PUESTOS[0],
    puesto_otro: '',
    turno: '',
    dias_trabajo: '',
    urgencia: 'esta_semana',
    cantidad_puestos: 1,
    cierra_at: '',
    experiencia_minima_anios: 0,
    disponibilidad_requerida: '',
    movilidad_requerida: false,
    certificado_requerido: false,
    herramientas_buscadas: [],
    sueldo: '',
    descripcion: '',
    contacto: '',
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [original, setOriginal] = useState(null);

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
        setError('Tu cuenta existe pero todavía no cargaste los datos de tu local. Completalos y lo verificamos.');
        setVerificando(false);
        return;
      }

      setEmpleador(emp);
      setForm((f) => ({ ...f, contacto: emp.contacto || '' }));

      // Modo edición: /empleador/vacantes/nueva?editar=<id>
      const idEditar = new URLSearchParams(window.location.search).get('editar');
      if (idEditar) {
        const { data: vac } = await supabase
          .from('vacantes').select('*').eq('id', idEditar).eq('empleador_id', uid).maybeSingle();
        if (!vac) {
          setError('No encontramos esa vacante entre las tuyas.');
        } else if (vac.estado !== 'activa') {
          setError('Solo se pueden editar vacantes activas.');
        } else {
          setEditandoId(vac.id);
          setOriginal(vac);
          setForm((f) => ({
            ...f,
            puesto: vac.puesto || f.puesto,
            puesto_otro: vac.puesto_otro || '',
            turno: vac.turno || '',
            dias_trabajo: vac.dias_trabajo || '',
            urgencia: vac.urgencia || f.urgencia,
            cantidad_puestos: vac.cantidad_puestos || 1,
            cierra_at: aValorSelector(vac.cierra_at),
            experiencia_minima_anios: vac.experiencia_minima_anios || 0,
            disponibilidad_requerida: vac.disponibilidad_requerida || '',
            movilidad_requerida: !!vac.movilidad_requerida,
            certificado_requerido: !!vac.certificado_requerido,
            herramientas_buscadas: vac.herramientas_buscadas || [],
            sueldo: vac.sueldo || '',
            descripcion: vac.descripcion || '',
            contacto: vac.contacto || f.contacto,
          }));
        }
      }
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

    const datos = {
      puesto: form.puesto,
      puesto_otro: form.puesto === 'Otro' ? form.puesto_otro : null,
      turno: form.turno || null,
      dias_trabajo: form.dias_trabajo || null,
      tipo_local: empleador.tipo_local || null,
      urgencia: form.urgencia,
      cantidad_puestos: Number(form.cantidad_puestos) || 1,
      cierra_at: horarioParaGuardar(form.cierra_at),
      experiencia_minima_anios: Number(form.experiencia_minima_anios) || 0,
      disponibilidad_requerida: form.disponibilidad_requerida,
      movilidad_requerida: form.movilidad_requerida,
      certificado_requerido: form.certificado_requerido,
      herramientas_buscadas: form.herramientas_buscadas,
      descripcion: form.descripcion,
      contacto: form.contacto,
    };
    // El sueldo es opcional: vacío se guarda como null y no aparece en el aviso.
    // Solo se manda si se cargó o si la vacante ya tenía uno (para poder borrarlo).
    const sueldo = form.sueldo.trim();
    if (sueldo || original?.sueldo) datos.sueldo = sueldo || null;

    let errGuardar = null;
    if (editandoId) {
      ({ error: errGuardar } = await supabase.from('vacantes').update(datos).eq('id', editandoId));

      // Si cambiaron los requisitos, los porcentajes guardados ya no corresponden:
      // se borran y se recalculan la próxima vez que abras la lista de postulantes.
      const requisitos = ['puesto', 'turno', 'experiencia_minima_anios', 'disponibilidad_requerida',
        'movilidad_requerida', 'certificado_requerido'];
      const cambioRequisitos =
        original && (requisitos.some((k) => (original[k] ?? null) !== (datos[k] ?? null)) ||
          JSON.stringify(original.herramientas_buscadas || []) !== JSON.stringify(datos.herramientas_buscadas || []));
      if (!errGuardar && cambioRequisitos) {
        await supabase.from('postulaciones')
          .update({ puntaje: null, resumen_ia: null, razones_positivas: [], razones_negativas: [] })
          .eq('vacante_id', editandoId);
      }
    } else {
      ({ error: errGuardar } = await supabase.from('vacantes').insert({ empleador_id: empleador.id, ...datos }));
    }

    setCargando(false);
    if (errGuardar) {
      setError((editandoId ? 'No se pudieron guardar los cambios: ' : 'No se pudo publicar la vacante: ') + traducirError(errGuardar.message));
      return;
    }
    router.push('/empleador/vacantes');
  }

  if (verificando) return <PantallaCarga texto="Preparando el formulario..." />;

  if (!empleador) {
    return (
      <div>
      <Encabezado links={[{ href: '/empleador/vacantes', texto: 'Mis vacantes' }, { href: '/empleador/vacantes/nueva', texto: 'Publicar vacante' }, { href: '/empleador/mi-local', texto: 'Mi local' }]} campanaHref="/empleador/vacantes" />
        <div className="container" style={{ maxWidth: 520 }}>
          <h1>Falta cargar tu local</h1>
          <div className="card">
            <p>{error}</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--texto-suave)' }}>
              No vas a tener que crear otra cuenta: entrás con el mismo email y solo completás los datos del local.
            </p>
            <a className="btn-oxido-solido" href="/empleador/registro">Completar los datos de mi local</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Encabezado links={[{ href: '/empleador/vacantes', texto: 'Mis vacantes' }, { href: '/empleador/vacantes/nueva', texto: 'Publicar vacante' }, { href: '/empleador/mi-local', texto: 'Mi local' }]} campanaHref="/empleador/vacantes" />
      <div className="container" style={{ maxWidth: 600 }}>
        <h1>{editandoId ? 'Editar vacante' : 'Publicar vacante'}</h1>
        {editandoId && (
          <p className="ayuda-contraste">
            Si cambiás los requisitos, recalculamos la compatibilidad de quienes ya se postularon con los datos nuevos.
          </p>
        )}
        <p>
          ¿Primera vez? <a href="/vacante-ejemplo" target="_blank">Mirá un ejemplo</a> de cómo se ve una vacante
          bien cargada y una mal cargada.
        </p>
        <p>
          Quien se postula acá eligió la gastronomía como trabajo. Un aviso claro, con turno, días y paga reales,
          atrae gente que se queda.
        </p>

        {empleador.estado === 'pendiente' && (
          <div className="tip">
            Tu local todavía está en revisión. Podés cargar la vacante igual: se va a publicar apenas aprobemos el alta.
          </div>
        )}

        <div className="aviso-legal">
          <strong>Antes de publicar.</strong> Publicá solo vacantes reales y vigentes, con condiciones que vayas a
          cumplir. Voral pone en contacto a las partes: la relación laboral que surja, su registración y todas las
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
            <label>¿Cuántas personas buscás para este puesto?</label>
            <input
              type="number"
              min="1"
              max="20"
              value={form.cantidad_puestos}
              onChange={(e) => set('cantidad_puestos', e.target.value)}
            />
            <p className="ayuda-campo">
              Se lo mostramos a los candidatos. Si buscás una sola persona, saber que el cupo es chico los motiva a
              postularse antes.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="vac-sueldo">Sueldo (opcional)</label>
            <input
              id="vac-sueldo"
              maxLength={120}
              placeholder="Ej.: $450.000 por mes + propinas"
              value={form.sueldo}
              onChange={(e) => set('sueldo', e.target.value)}
            />
            <p className="ayuda-campo">
              Es opcional, pero es lo que más les interesa a los candidatos: los avisos con sueldo reciben
              mejores postulaciones. Si lo dejás vacío, no aparece en el aviso.
            </p>
          </div>

          <div className="form-field">
            <label>¿Hasta cuándo recibís postulaciones? (opcional)</label>
            <input
              type="datetime-local"
              min={minimoSelector()}
              value={form.cierra_at}
              onChange={(e) => set('cierra_at', e.target.value)}
            />
            <p className="ayuda-campo">
              Al llegar esa fecha la vacante se cierra sola y deja de recibir postulaciones. Poner una fecha real
              acelera las postulaciones; dejalo vacío si no tenés apuro.
            </p>
          </div>

          <div className="form-field">
            <label>Experiencia mínima (años)</label>
            <input type="number" min="0" step="0.5" value={form.experiencia_minima_anios} onChange={(e) => set('experiencia_minima_anios', e.target.value)} />
          </div>

          <label className="casilla-legal">
            <input type="checkbox" checked={form.movilidad_requerida} onChange={(e) => set('movilidad_requerida', e.target.checked)} />
            <span>Requiere movilidad propia</span>
          </label>
          <label className="casilla-legal">
            <input type="checkbox" checked={form.certificado_requerido} onChange={(e) => set('certificado_requerido', e.target.checked)} />
            <span>Requiere certificado de manipulación de alimentos</span>
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
            <textarea rows={7} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
            <p className="ayuda-contraste">
              Separá los temas en párrafos dejando un renglón en blanco. Para armar una lista, empezá cada línea con
              un guion (-).
            </p>
            <p className="ayuda-campo">
              Evitá pedir "buena presencia", edad o fotos: no suman y alejan a buenos candidatos. Contá qué vas a
              pedir y qué ofrecés.
            </p>
          </div>

          <div className="form-field">
            <label>Contacto para candidatos preseleccionados</label>
            <input required value={form.contacto} onChange={(e) => set('contacto', e.target.value)} />
          </div>

          {error && <p style={{ color: '#B5432A' }}>{error}</p>}
          <button className="btn-oxido-solido ancho" type="submit" disabled={cargando}>
            {cargando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Publicar vacante'}
          </button>
        </form>
        <div style={{ height: 40 }} />
      </div>
      <Pie />
    </div>
  );
}

export default function NuevaVacante(props) {
  return (
    <GuardiaRol rol="empleador">
      <NuevaVacanteContenido {...props} />
    </GuardiaRol>
  );
}
