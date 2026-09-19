import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

export const metadata = { title: 'Política de privacidad | Matchy' };

export default function Privacidad() {
  return (
    <div>
      <Encabezado links={[{ href: '/legal/terminos', texto: 'Términos y condiciones' }]} />
      <main className="container" style={{ maxWidth: 760 }}>
        <h1>Política de privacidad</h1>
        <p className="mono" style={{ fontSize: '0.78rem' }}>
          Última actualización: septiembre de 2026
        </p>

        <div className="tip">
          Este documento explica qué datos recolecta Matchy, para qué los usa y cómo podés acceder a ellos,
          corregirlos o eliminarlos. Está redactado siguiendo la Ley 25.326 de Protección de Datos Personales.
        </div>

        <h2>1. Quién es responsable de tus datos</h2>
        <p>
          El responsable de la base de datos es [RAZÓN SOCIAL], CUIT [CUIT], con domicilio en [DOMICILIO],
          Posadas, provincia de Misiones, Argentina. Para cualquier consulta sobre tus datos podés escribir a
          <a href="mailto:gozzasabores@gmail.com"> gozzasabores@gmail.com</a>.
        </p>

        <h2>2. Qué datos recolectamos</h2>
        <p><strong>Si buscás empleo:</strong> tu email y contraseña para crear la cuenta, y los datos que cargues
        en tu CV: nombre, foto (opcional), edad (opcional), localidad, contacto, puestos que te interesan,
        presentación, experiencia laboral, formación, habilidades, herramientas, idiomas, disponibilidad,
        movilidad, pretensión salarial (opcional) y certificado de manipulación de alimentos (opcional).</p>
        <p><strong>Si ofrecés empleo:</strong> tu email y contraseña, nombre y apellido del responsable,
        nombre del local, razón social, CUIT, tipo de local, localidad, dirección, teléfono, red social
        y datos de contacto.</p>
        <p>No solicitamos DNI, ni fecha de nacimiento completa, ni datos sensibles en el sentido de la Ley 25.326
        (salud, origen racial o étnico, opiniones políticas, convicciones religiosas, afiliación sindical o
        vida sexual). Si los cargás igual en un campo de texto libre, pedimos que no lo hagas.</p>

        <h2>3. Para qué usamos tus datos</h2>
        <ul>
          <li>Publicar tu CV para que los locales gastronómicos habilitados puedan encontrarte.</li>
          <li>Permitirte postularte a vacantes y generar un orden de compatibilidad para el empleador.</li>
          <li>Gestionar las propuestas de entrevista entre vos y el local.</li>
          <li>Permitirte descargar tu CV en PDF y compartirlo por tu cuenta.</li>
          <li>Comunicarnos con vos por cuestiones operativas del servicio.</li>
        </ul>

        <h2>4. Quién puede ver tus datos</h2>
        <p>
          Tu CV es público para las personas que naveguen el sitio y para los locales verificados. También podés
          compartir su enlace con quien quieras.
        </p>
        <p>
          <strong>Los contactos de referencia que cargues son la excepción:</strong> no se muestran en tu CV
          público. Solo se le entregan a un local cuando ese local avanza específicamente con tu postulación.
        </p>

        <h2>5. Dónde se alojan tus datos y transferencias internacionales</h2>
        <p>
          Matchy utiliza los servicios de Supabase para alojar la base de datos y los archivos, con
          infraestructura ubicada en San Pablo, Brasil, y de Vercel para el alojamiento del sitio. Brasil cuenta
          con legislación de protección de datos personales (Lei Geral de Proteção de Dados).
        </p>
        <p>
          Para generar el resumen orientativo que ve el empleador, algunos datos de tu CV (nombre, años de
          experiencia, disponibilidad y compatibilidad con la vacante) se envían a la API de Anthropic, empresa
          con sede en Estados Unidos, que actúa como encargada de tratamiento.
        </p>
        <p>
          Al aceptar esta política prestás tu consentimiento expreso para estas transferencias internacionales,
          conforme al artículo 12 de la Ley 25.326.
        </p>

        <h2>6. Ordenamiento automatizado de candidatos</h2>
        <p>
          Cuando te postulás a una vacante, el sistema calcula un porcentaje de compatibilidad comparando los
          datos de tu CV con los requisitos que declaró el local: puesto, años de experiencia, turno,
          disponibilidad, movilidad, certificado y herramientas. Ese cálculo ordena la lista que ve el empleador
          y se acompaña de un resumen generado automáticamente.
        </p>
        <p>
          <strong>Ese porcentaje no decide nada.</strong> La decisión de convocar, entrevistar o contratar es
          exclusivamente del empleador. Podés ver tu porcentaje antes de postularte, conocer qué criterios lo
          componen, corregir tu CV en cualquier momento, y solicitar una revisión humana escribiendo a
          <a href="mailto:gozzasabores@gmail.com"> gozzasabores@gmail.com</a>.
        </p>

        <h2>7. Tus derechos</h2>
        <p>
          Tenés derecho a acceder a tus datos, rectificarlos, actualizarlos y solicitar su supresión, de forma
          gratuita. Podés ejercerlos directamente desde tu cuenta editando o eliminando tu CV, o escribiéndonos.
        </p>
        <p>
          La Agencia de Acceso a la Información Pública, en su carácter de órgano de control de la Ley 25.326,
          tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en
          sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
        </p>

        <h2>8. Conservación y seguridad</h2>
        <p>
          Conservamos tus datos mientras mantengas tu cuenta activa. Si solicitás la baja, eliminamos tu CV y tus
          datos personales, salvo aquello que debamos conservar por obligación legal. Aplicamos medidas técnicas
          de seguridad, incluyendo control de acceso por usuario y cifrado en tránsito, para evitar accesos no
          autorizados.
        </p>

        <h2>9. Solo para mayores de 18 años</h2>
        <p>
          Matchy está dirigido exclusivamente a personas mayores de 18 años. No recolectamos intencionalmente
          datos de menores de edad. Si detectamos una cuenta de una persona menor de 18 años, la eliminamos.
        </p>

        <h2>10. Cambios en esta política</h2>
        <p>
          Podemos actualizar esta política. Vamos a informar los cambios relevantes en el sitio, y la fecha de
          última actualización figura al comienzo.
        </p>

        <div className="disclaimer">
          Los campos entre corchetes deben completarse con los datos societarios definitivos antes del
          lanzamiento público, y este documento debe ser revisado por un profesional del derecho.
        </div>
      </main>
      <Pie />
    </div>
  );
}
