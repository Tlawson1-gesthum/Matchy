import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

export const metadata = { title: 'Política de privacidad | Voral' };

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
          Este documento explica qué datos recolecta Voral, para qué los usa y cómo podés acceder a ellos,
          corregirlos o eliminarlos. Está redactado siguiendo la Ley 25.326 de Protección de Datos Personales.
        </div>

        <h2>1. Quién es responsable de tus datos</h2>
        <p>
          El responsable de la base de datos es Tomas Oliver Lawson, CUIL 20-34896158-7, con domicilio en
          Centenario 2595, Posadas, provincia de Misiones, Argentina. Para cualquier consulta sobre tus datos
          podés escribir a <a href="mailto:gozzasabores@gmail.com">gozzasabores@gmail.com</a>.
        </p>

        <h2>2. Qué datos recolectamos</h2>
        <p><strong>Si buscás empleo:</strong> tu email y contraseña para crear la cuenta, y los datos que cargues
        en tu CV: nombre, foto (opcional), edad (opcional), localidad, contacto, puestos que te interesan,
        presentación, experiencia laboral, formación, habilidades, herramientas, idiomas, disponibilidad,
        movilidad, pretensión salarial (opcional) y certificado de manipulación de alimentos (opcional).</p>
        <p><strong>Si ofrecés empleo:</strong> tu email y contraseña, nombre y apellido del responsable,
        nombre del local, razón social, CUIT, tipo de local, localidad, dirección, teléfono, enlace público del
        local, logo (opcional) y datos de contacto.</p>
        <p>Si entrás con Google, recibimos tu nombre, tu email y tu foto de perfil de Google. Si verificás tu
        teléfono, guardamos el número verificado.</p>
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
          <strong>Si buscás empleo:</strong> tu CV no aparece en ningún listado abierto. Lo ven los locales
          verificados a cuyas vacantes te postulás, y cualquier persona a la que le compartas el enlace de tu CV.
        </p>
        <p>
          Hay dos datos que ni siquiera esos locales ven de entrada. Los <strong>contactos de referencia</strong> y
          tu <strong>certificado de manipulación de alimentos</strong> solo se le muestran a un local cuando decide
          avanzar específicamente con tu postulación. El certificado se guarda como archivo privado.
        </p>
        <p>
          <strong>Si ofrecés empleo:</strong> los candidatos ven el nombre, el tipo, la dirección, el enlace público
          y el contacto del local. El CUIT, la razón social y el teléfono del responsable no se muestran a los
          candidatos: los usamos solo para verificar el alta.
        </p>

        <h2>5. Dónde se alojan tus datos y transferencias internacionales</h2>
        <p>
          Voral utiliza los servicios de Supabase para alojar la base de datos y los archivos, y de Vercel para
          el alojamiento del sitio. La infraestructura se encuentra ubicada fuera de la República Argentina.
          [PENDIENTE: indicar la región definitiva una vez completada la migración a San Pablo, Brasil, país que
          cuenta con legislación de protección de datos personales.]
        </p>
        <p>
          Para generar el resumen orientativo que ve el empleador, algunos datos de tu CV (nombre, años de
          experiencia, disponibilidad y compatibilidad con la vacante) se envían a la API de Anthropic, empresa
          con sede en Estados Unidos, que actúa como encargada de tratamiento.
        </p>
        <p>
          Cuando se activen los avisos por mail, el envío se hará a través de Resend, un proveedor de correo con
          sede en Estados Unidos que actúa como encargado de tratamiento y recibe solo lo necesario para enviar
          cada aviso: tu email, tu nombre y el detalle de la novedad.
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
        <p>
          Por eso no se trata de una decisión automatizada en el sentido de la Ley 25.326: el cálculo solo ordena
          una lista, no produce por sí mismo ningún efecto sobre vos, y quien decide a quién contactar es siempre
          una persona del lado del empleador.
        </p>

        <h2>7. Tus derechos</h2>
        <p>
          Tenés derecho a acceder a tus datos, rectificarlos, actualizarlos y solicitar su supresión, de forma
          gratuita. Podés ejercerlos directamente desde el sitio: editando tu CV o los datos de tu local, o
          eliminando tu cuenta desde la opción "Eliminar mi cuenta" de tu panel. También podés escribirnos.
        </p>
        <p>
          La Agencia de Acceso a la Información Pública, en su carácter de órgano de control de la Ley 25.326,
          tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en
          sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
        </p>

        <h2>8. Conservación y seguridad</h2>
        <p>
          Conservamos tus datos mientras mantengas tu cuenta activa. Si eliminás tu cuenta, borramos tu CV o los
          datos de tu local, tus archivos, tus postulaciones o vacantes y tus entrevistas.
        </p>
        <p>
          La única excepción son los reportes por posibles fraudes: se conservan aunque la cuenta denunciada o la
          que denunció se eliminen, sin los datos personales de quien reportó, porque sirven para proteger a otras
          personas y pueden ser requeridos por una autoridad.
        </p>
        <p>
          Aplicamos medidas técnicas de seguridad: control de acceso por usuario en la base de datos, archivos
          privados cuando corresponde, límites de tamaño y tipo en los archivos que se suben, y cifrado en
          tránsito.
        </p>

        <h2>9. Solo para mayores de 18 años</h2>
        <p>
          Voral está dirigido exclusivamente a personas mayores de 18 años. No recolectamos intencionalmente
          datos de menores de edad. Si detectamos una cuenta de una persona menor de 18 años, la eliminamos.
        </p>

        <h2>10. Cambios en esta política</h2>
        <p>
          Podemos actualizar esta política. Vamos a informar los cambios relevantes en el sitio, y la fecha de
          última actualización figura al comienzo.
        </p>

        <div className="disclaimer">
          Documento preliminar: debe ser revisado por un profesional del derecho antes del lanzamiento público, y
          actualizado con la región definitiva de alojamiento de los datos.
        </div>
      </main>
      <Pie />
    </div>
  );
}
