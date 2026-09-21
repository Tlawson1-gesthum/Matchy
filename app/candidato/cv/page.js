'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import ListaEditable from '../../../components/ListaEditable';
import {
  PUESTOS, NIVELES_HERRAMIENTA, NIVELES_IDIOMA,
  TURNOS, DISPONIBILIDAD, DISPONIBLE_DESDE, LOCALIDADES,
} from '../../../lib/opciones';
import VerificarTelefono from '../../../components/VerificarTelefono';
import SeccionAcordeon from '../../../components/SeccionAcordeon';
import GuardiaRol from '../../../components/GuardiaRol';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

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

// Estado de cada sección del formulario, en el orden en que aparecen.
// "opcional" no cuenta para decidir qué sección se abre primero.
const ORDEN_SECCIONES = [
  'telefono', 'datos', 'puestos', 'presentacion', 'experiencia', 'formacion',
  'habilidades', 'herramientas', 'idiomas', 'disponibilidad', 'certificado',
];

function estadoSecciones(cv) {
  return {
    // La verificación por WhatsApp todavía no está activada: se muestra como opcional.
    telefono: cv.telefono_verificado_at ? 'completo' : 'opcional',
    datos: cv.nombre && cv.contacto && cv.ciudad ? 'completo' : 'pendiente',
    puestos: cv.puestos?.length ? 'completo' : 'pendiente',
    presentacion: cv.presentacion?.trim() ? 'completo' : 'pendiente',
    experiencia: cv.experiencia?.length ? 'completo' : 'pendiente',
    formacion: cv.formacion?.length ? 'completo' : 'pendiente',
    habilidades: cv.habilidades?.length ? 'completo' : 'pendiente',
    herramientas: cv.herramientas_nivel?.length ? 'completo' : 'pendiente',
    idiomas: cv.idiomas_nivel?.length ? 'completo' : 'opcional',
    disponibilidad: cv.disponibilidad_horaria && cv.disponible_desde ? 'completo' : 'pendiente',
    certificado: cv.certificado_url ? 'completo' : 'opcional',
  };
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

function CvFormContenido() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [cv, setCv] = useState(CV_VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [subiendoCert, setSubiendoCert] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [abiertas, setAbiertas] = useState(new Set());

  useEffect(() => {
    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) { router.push('/candidato/login'); return; }
      setUserId(uid);
      const { data } = await supabase.from('cvs').select('*').eq('id', uid).single();
      const completo = { ...CV_VACIO, ...(data || {}) };
      if (data) setCv(completo);
      const estados = estadoSecciones(completo);
      const primera = ORDEN_SECCIONES.find((id) => estados[id] === 'pendiente');
      setAbiertas(new Set(primera ? [primera] : []));
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
    if (cv.nombre_bloqueado) delete payload.nombre;
    const { error } = await supabase.from('cvs').update(payload).eq('id', userId);
    setGuardando(false);
    if (error) {
      setMensaje('Hubo un error al guardar: ' + error.message);
    } else {
      setCv((c) => ({ ...c, ...payload }));
      setMensaje('CV guardado. Las postulaciones que ya enviaste no cambian: su porcentaje quedó congelado.');
      setGuardadoOk(true);
    }
  }

  if (cargando) return <div className="container">Cargando...</div>;

  const pct = calcularCompletoPct(cv);
  const estados = estadoSecciones(cv);

  function alternarSeccion(id, abierta) {
    setAbiertas((prev) => {
      const nueva = new Set(prev);
      if (abierta) nueva.add(id); else nueva.delete(id);
      return nueva;
    });
  }

  function propsSeccion(id) {
    return { estado: estados[id], abierta: abiertas.has(id), onToggle: alternarSeccion };
  }

  return (
    <div>
      <Encabezado links={[{ href: '/candidato/panel', texto: 'Mi panel' }, { href: '/candidato/vacantes', texto: 'Vacantes' }, { href: '/candidato/mi-perfil', texto: 'Ver mi CV' }]} campanaHref="/candidato/entrevistas" />

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
          <p style={{ fontSize: '0.85rem', marginBottom: 0, marginTop: 8, color: 'var(--texto-suave)' }}>
            No hace falta que termines hoy. Apretá "Guardar CV" cuando quieras y seguí después desde donde lo
            dejaste: lo cargado no se pierde.
          </p>
        </div>

        <SeccionAcordeon id="telefono" titulo="Verificá tu teléfono" {...propsSeccion('telefono')}>
        <VerificarTelefono
          sinMarco
          telefonoInicial={cv.telefono || ''}
          verificadoAt={cv.telefono_verificado_at}
          onVerificado={async (numero) => {
            await supabase.from('cvs').update({
              telefono: numero,
              telefono_verificado_at: new Date().toISOString(),
            }).eq('id', userId);
            setCv((c) => ({ ...c, telefono: numero, telefono_verificado_at: new Date().toISOString() }));
          }}
        />
        </SeccionAcordeon>

        {/* DATOS PERSONALES */}
        <SeccionAcordeon id="datos" titulo="Datos personales" {...propsSeccion('datos')}>
          <div className="tip">
            Tip: usá una foto con buena luz, de frente y sin lentes de sol, donde se te vea de los hombros para arriba
            ocupando alrededor del 60% del recuadro. Una foto donde apenas se te distingue resta en vez de sumar.
          </div>
          <div className="form-field">
            <label>Nombre completo</label>
            <input
              value={cv.nombre}
              disabled={cv.nombre_bloqueado}
              onChange={(e) => set('nombre', e.target.value)}
            />
            {cv.nombre_bloqueado ? (
              <p className="ayuda-campo">
                Tu nombre quedó fijo después de tu primera postulación, para que los locales sepan con quién están
                hablando. Si está mal escrito, escribinos a{' '}
                <a href="mailto:gozzasabores@gmail.com?subject=Corregir%20mi%20nombre">gozzasabores@gmail.com</a>.
              </p>
            ) : (
              <p className="ayuda-campo">
                Poné tu nombre real, como figura en tu documento. Va a quedar fijo cuando te postules por primera
                vez.
              </p>
            )}
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
            <p style={{ fontSize: '0.8rem', color: 'var(--texto-suave)', margin: '6px 0 0' }}>
              La edad y la foto son opcionales y podés dejarlas vacías. Nadie puede rechazarte por tu edad ni por
              tu apariencia: la Ley 23.592 y la Ley de Contrato de Trabajo lo prohíben. Tampoco influyen en tu
              porcentaje de compatibilidad.
            </p>
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
        </SeccionAcordeon>

        {/* PUESTOS */}
        <SeccionAcordeon id="puestos" titulo="Puestos que te interesan (hasta 3)" {...propsSeccion('puestos')}>
          <div className="tip">
            Elegí solo los puestos que realmente podrías cubrir. Cuando te postules a una vacante concreta vas a poder
            aclarar el detalle si hace falta.
          </div>
          <div className="grupo-pildoras" role="group" aria-label="Puestos que te interesan">
            {PUESTOS.filter((p) => p !== 'Otro').map((p) => {
              const elegido = cv.puestos.includes(p);
              const lleno = !elegido && cv.puestos.length >= 3;
              return (
                <label key={p} className={`pildora-puesto${elegido ? ' elegida' : ''}${lleno ? ' bloqueada' : ''}`}>
                  <input
                    type="checkbox"
                    className="solo-lector"
                    checked={elegido}
                    disabled={lleno}
                    onChange={() => togglePuesto(p)}
                  />
                  {p}
                </label>
              );
            })}
          </div>
          <p className="ayuda-contraste" aria-live="polite">
            {cv.puestos.length} de 3 elegidos{cv.puestos.length >= 3 ? '. Para cambiar uno, primero destildá otro.' : '.'}
          </p>
        </SeccionAcordeon>

        {/* PRESENTACIÓN */}
        <SeccionAcordeon id="presentacion" titulo="Presentación" {...propsSeccion('presentacion')}>
          <div className="tip">
            <strong>Escribí al menos cuatro o cinco líneas.</strong> Una presentación de dos renglones deja el CV
            pobre y el empleador pasa al siguiente. Tres cosas que conviene incluir:
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 18 }}>
              <li>Quién sos más allá del puesto: si trabajás bien en equipo, si te manejás con presión, si sos de
              llegar antes. Eso no se lee en tu experiencia.</li>
              <li>Escribí como hablás, en primera persona. Evitá listas de adjetivos sueltos: "responsable",
              "presentable" o "creativo" no dicen nada porque los pone todo el mundo. Contá una situación en su
              lugar.</li>
              <li>Cerrá con lo que buscás en el próximo trabajo. Si querés hablar de sueldo, dejalo para el campo
              de pretensión salarial o para la entrevista, no acá.</li>
            </ul>
          </div>

          <div className="tip">
            <strong>Ejemplo de lo que no conviene:</strong> "Tengo experiencia comprobable. Se trabajar bajo
            presion y liderar un equipo."
            <br />
            <strong style={{ display: 'block', marginTop: 8 }}>Mejor así:</strong> "Llevo 4 años en gastronomía,
            los últimos dos como encargado de un local de 12 mesas. Coordinaba un equipo de 5 personas, armaba los
            turnos y hacía el cierre de caja. Me manejo bien cuando el salón se llena porque me anticipo a los
            pedidos en vez de correr atrás. Busco un lugar donde quedarme varios años y seguir creciendo."
          </div>
          <div className="form-field">
            <textarea rows={6} value={cv.presentacion} onChange={(e) => set('presentacion', e.target.value)} />
            {cv.presentacion && cv.presentacion.trim().length < 180 && (
              <p className="marca-editado">
                Tu presentación tiene {cv.presentacion.trim().length} caracteres. Con menos de 180 suele quedar
                pobre: contá un poco más de tu experiencia y de cómo trabajás.
              </p>
            )}
          </div>
        </SeccionAcordeon>

        {/* EXPERIENCIA */}
        <SeccionAcordeon id="experiencia" titulo="Experiencia laboral" {...propsSeccion('experiencia')}>
          <div className="tip">
            <strong>En la descripción, dos o tres renglones por trabajo.</strong> "Encargado de todo el local" no
            dice nada; contá qué hacías concretamente: cuántas mesas atendías por turno, de cuántas personas era el
            equipo, si manejabas caja, stock o proveedores, qué volumen tenían los fines de semana. Es la parte del
            CV que más mira el empleador y la que más pesa en tu compatibilidad.
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
                <textarea rows={4} value={exp.descripcion} onChange={(e) => editarExperiencia(i, 'descripcion', e.target.value)} />
                {exp.descripcion && exp.descripcion.trim().length < 80 && (
                  <p className="marca-editado">
                    Contá un poco más: cuántas mesas o personas manejabas, qué tareas tenías a cargo, qué días
                    eran los fuertes.
                  </p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #EEEBE4', paddingTop: 12, marginTop: 4 }}>
                <strong style={{ fontSize: '0.88rem' }}>Contacto de referencia (opcional)</strong>
                <div className="tip" style={{ marginTop: 8 }}>
                  Estos datos no se muestran en tu CV público. Solo se le entregan a un local cuando decide avanzar
                  con vos. Cargá a alguien únicamente si esa persona te autorizó a compartir su contacto.
                </div>
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

              <button type="button" className="btn-accion quitar" onClick={() => borrarExperiencia(i)}>Quitar experiencia</button>
            </div>
          ))}
          <button type="button" className="btn-accion" onClick={agregarExperiencia}>+ Agregar experiencia</button>
        </SeccionAcordeon>

        {/* FORMACIÓN */}
        <SeccionAcordeon id="formacion" titulo="Formación y cursos" {...propsSeccion('formacion')}>
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
              <button type="button" className="btn-accion quitar" onClick={() => borrarFormacion(i)}>Quitar formación</button>
            </div>
          ))}
          <button type="button" className="btn-accion" onClick={agregarFormacion}>+ Agregar formación</button>
        </SeccionAcordeon>

        {/* HABILIDADES */}
        <SeccionAcordeon id="habilidades" titulo="Habilidades" {...propsSeccion('habilidades')}>
          <div className="tip">
            Cargá habilidades del oficio, no cualidades personales. "Educado", "presentable" o "lindo" no son
            habilidades y restan seriedad al CV.
            <br />
            Ejemplos que sí valen: atención al cliente, manejo de bandeja, armado de mise en place, toma de pedidos
            con comandera, control de stock, cierre de caja, manejo de caja chica, limpieza de estación, armado de
            turnos, trato con proveedores.
          </div>
          <ListaEditable
            items={cv.habilidades}
            onChange={(v) => set('habilidades', v)}
            placeholder="Escribí una habilidad y apretá Agregar"
          />
        </SeccionAcordeon>

        {/* HERRAMIENTAS */}
        <SeccionAcordeon id="herramientas" titulo="Herramientas" {...propsSeccion('herramientas')}>
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
        </SeccionAcordeon>

        {/* IDIOMAS */}
        <SeccionAcordeon id="idiomas" titulo="Idiomas" {...propsSeccion('idiomas')}>
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
        </SeccionAcordeon>

        {/* DISPONIBILIDAD */}
        <SeccionAcordeon id="disponibilidad" titulo="Disponibilidad" {...propsSeccion('disponibilidad')}>
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
          <label className="casilla-legal">
            <input type="checkbox" checked={cv.movilidad_propia} onChange={(e) => set('movilidad_propia', e.target.checked)} />
            <span>Tengo movilidad propia</span>
          </label>
          <div className="form-field">
            <label>Pretensión salarial (opcional)</label>
            <input value={cv.pretension_salarial} onChange={(e) => set('pretension_salarial', e.target.value)} />
          </div>
        </SeccionAcordeon>

        {/* CERTIFICADO */}
        <SeccionAcordeon id="certificado" titulo="Certificado de manipulación de alimentos" {...propsSeccion('certificado')}>
          <div className="tip">
            Si ya lo tenés, subilo. Marcar la casilla sin el archivo suma la mitad de puntos en las vacantes que lo
            piden como requisito, porque el local no tiene cómo confirmarlo. Con el archivo cargado suma el total y
            le ahorrás un trámite a quien te contrate.
          </div>
          <label className="casilla-legal">
            <input type="checkbox" checked={cv.certificado_manipulacion} onChange={(e) => set('certificado_manipulacion', e.target.checked)} />
            <span>Tengo el certificado vigente</span>
          </label>
          {cv.certificado_manipulacion && !cv.certificado_url && (
            <p className="marca-editado">
              Marcaste que lo tenés pero todavía no subiste el archivo. Subilo para que sume el puntaje completo.
            </p>
          )}

          <div className="form-field">
            <label>Subir certificado (foto o PDF)</label>
            <input type="file" accept="image/*,application/pdf" onChange={subirCertificado} />
            {subiendoCert && <p>Subiendo...</p>}
            {cv.certificado_url && (
              <p style={{ marginTop: 8 }}>
                <a href={cv.certificado_url} target="_blank" rel="noreferrer">Ver certificado cargado</a>
              </p>
            )}
          </div>
        </SeccionAcordeon>

        {mensaje && <p style={{ color: guardadoOk ? '#2B4632' : '#B5432A' }}>{mensaje}</p>}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <button className="btn-verde-solido en-linea" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar CV'}
          </button>
          {guardadoOk && (
            <a className="btn blanco" href="/candidato/mi-perfil">Ver y descargar en PDF</a>
          )}
        </div>

        {guardadoOk && (
          <div className="card" style={{ marginBottom: 40, textAlign: 'center' }}>
            <h3 style={{ marginBottom: 6 }}>Tu CV está guardado</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--texto-suave)', margin: '0 0 16px' }}>
              Ahora lo que importa es usarlo. Mirá qué locales están buscando gente en Posadas.
            </p>
            <a className="cta-principal" href="/candidato/vacantes">Postulate a vacantes</a>
            <p style={{ fontSize: '0.82rem', color: 'var(--texto-suave)', margin: '12px 0 0' }}>
              Podés volver a editar tu CV cuando quieras desde tu panel.
            </p>
          </div>
        )}
      </div>
      <Pie />
    </div>
  );
}

export default function CvForm(props) {
  return (
    <GuardiaRol rol="candidato">
      <CvFormContenido {...props} />
    </GuardiaRol>
  );
}
