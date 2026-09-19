import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

export const metadata = { title: 'Términos y condiciones | Matchy' };

export default function Terminos() {
  return (
    <div>
      <Encabezado links={[{ href: '/legal/privacidad', texto: 'Política de privacidad' }]} />
      <main className="container" style={{ maxWidth: 760 }}>
        <h1>Términos y condiciones de uso</h1>
        <p className="mono" style={{ fontSize: '0.78rem' }}>
          Última actualización: septiembre de 2026
        </p>

        <h2>1. Qué es Matchy</h2>
        <p>
          Matchy es una plataforma de intermediación que pone en contacto a personas que buscan empleo en el rubro
          gastronómico con locales de Posadas y alrededores que ofrecen vacantes. Matchy facilita el contacto: no
          es empleador, no es parte de la relación laboral que eventualmente surja entre las partes, y no participa
          de la negociación ni de la contratación.
        </p>

        <h2>2. Gratuidad para quien busca trabajo</h2>
        <p>
          El uso de Matchy es y será siempre gratuito para las personas que buscan empleo. Matchy nunca cobra a un
          candidato por registrarse, cargar su CV, descargarlo, postularse ni ser contactado. Si alguien te pide
          dinero a cambio de un puesto o de mejorar tu posición en el sitio, no es Matchy: reportalo a
          <a href="mailto:gozzasabores@gmail.com"> gozzasabores@gmail.com</a>.
        </p>

        <h2>3. Solo para mayores de 18 años</h2>
        <p>
          El registro está habilitado únicamente para personas mayores de 18 años. Al crear una cuenta declarás
          bajo tu responsabilidad que sos mayor de edad. Las cuentas de menores de 18 años se eliminan.
        </p>

        <h2>4. Veracidad de la información</h2>
        <p>
          Cada usuario es responsable por la veracidad de los datos que carga. Matchy realiza una verificación
          razonable de los locales antes de habilitarlos a publicar vacantes, pero no puede garantizar la
          veracidad, vigencia ni legalidad de cada aviso ni de cada CV.
        </p>
        <p>
          Matchy no verifica antecedentes laborales, títulos, certificados ni referencias. Tampoco garantiza que
          una postulación derive en una entrevista ni en una contratación.
        </p>

        <h2>5. Cómo funciona el orden de candidatos</h2>
        <p>
          Cuando una persona se postula, el sistema calcula un porcentaje de compatibilidad que compara los datos
          del CV con los requisitos declarados en la vacante, y genera un resumen orientativo. Ese porcentaje
          ordena la lista que ve el empleador.
        </p>
        <p>
          El porcentaje es orientativo y no constituye una evaluación de la persona, de su idoneidad ni de su
          personalidad. Toda decisión de convocar, entrevistar, contratar o descartar es exclusiva del empleador
          y debe ser tomada por una persona. Cualquier candidato puede solicitar la revisión humana de su
          posición escribiendo a <a href="mailto:gozzasabores@gmail.com">gozzasabores@gmail.com</a>.
        </p>

        <h2>6. Prohibición de discriminar</h2>
        <p>
          Está prohibido publicar vacantes o tomar decisiones de selección basadas en motivos discriminatorios.
          La Ley 23.592 obliga a dejar sin efecto los actos discriminatorios y a reparar el daño, y la Ley de
          Contrato de Trabajo prohíbe cualquier tipo de discriminación entre trabajadores. Matchy da de baja los
          avisos y las cuentas que incumplan esto.
        </p>

        <h2>7. Contactos de referencia</h2>
        <p>
          Si cargás contactos de referencia en tu CV, declarás que contás con la autorización de esas personas
          para compartir sus datos con potenciales empleadores. Esos datos no se muestran en tu CV público: solo
          se entregan a un local cuando avanza específicamente con tu postulación.
        </p>

        <h2>8. Obligaciones de los locales</h2>
        <p>Al registrarse, el local se obliga a:</p>
        <ul>
          <li>Ser un establecimiento real, con actividad comercial efectiva en la zona declarada.</li>
          <li>Publicar únicamente vacantes reales y vigentes.</li>
          <li>No solicitar ni ofrecer dinero a ningún candidato a cambio del puesto o de avanzar en el proceso
          de selección.</li>
          <li>No pedir claves bancarias, datos de tarjetas, documentación personal innecesaria, ni tareas no
          remuneradas a modo de prueba.</li>
          <li>No utilizar Matchy para cometer fraude, estafas, trata de personas, explotación laboral ni ningún
          otro delito, ni para captar personas con fines distintos a una oferta de empleo real.</li>
          <li>Usar los datos de los candidatos exclusivamente para el proceso de selección, y no cederlos a terceros.</li>
          <li>Cumplir la normativa laboral y previsional aplicable.</li>
        </ul>
        <p>
          El incumplimiento habilita a Matchy a dar de baja la cuenta y las vacantes, sin perjuicio de las
          acciones legales que correspondan.
        </p>

        <h2>9. Alojamiento de datos</h2>
        <p>
          Los datos se alojan en infraestructura de Supabase ubicada en San Pablo, Brasil, y el sitio se aloja en
          Vercel. Para el resumen orientativo de compatibilidad se utiliza la API de Anthropic, con sede en
          Estados Unidos. El detalle está en la <a href="/legal/privacidad">política de privacidad</a>, que forma
          parte de estos términos.
        </p>

        <h2>10. Servicios pagos para locales</h2>
        <p>
          Matchy puede ofrecer funcionalidades pagas dirigidas exclusivamente a locales, como destacar vacantes o
          planes mensuales. Esas funcionalidades se contratan de forma voluntaria, con precio informado antes de
          la contratación y factura correspondiente. La contratación de un servicio pago no altera el orden de
          compatibilidad de los candidatos ni condiciona en modo alguno el acceso gratuito de quienes buscan empleo.
        </p>

        <h2>11. Alcance de la responsabilidad de Matchy</h2>
        <p>
          Matchy presta un servicio de puesta en contacto. Su obligación se limita a mantener la plataforma en
          funcionamiento y a realizar una verificación razonable de los locales antes de habilitarlos a publicar.
          Todo lo que ocurre a partir del contacto entre las partes queda fuera de su intervención.
        </p>
        <p>En particular, Matchy no responde por:</p>
        <ul>
          <li>La veracidad, exactitud o vigencia de la información que publican los candidatos y los locales,
          incluyendo experiencia laboral, títulos, certificados, referencias, condiciones del puesto y
          remuneración ofrecida.</li>
          <li>La conducta de candidatos y empleadores, dentro o fuera de la plataforma, antes, durante o después
          de una entrevista.</li>
          <li>El resultado de los procesos de selección. Matchy no garantiza que una postulación derive en una
          entrevista, ni que una entrevista derive en una contratación, ni que una vacante siga vigente.</li>
          <li>La existencia, el cumplimiento, la registración, la modificación o la extinción de la relación
          laboral que las partes decidan celebrar, ni por las obligaciones laborales, previsionales,
          impositivas o de seguridad e higiene que de ella surjan, que corresponden exclusivamente al empleador.</li>
          <li>Los daños que las partes se causen entre sí, ni por los hechos de terceros ajenos a la plataforma.</li>
          <li>Las interrupciones del servicio, fallas técnicas o pérdidas de datos provocadas por causas ajenas a
          Matchy, incluyendo caídas de los proveedores de infraestructura, fuerza mayor o caso fortuito.</li>
        </ul>
        <p>
          El orden de compatibilidad y el resumen que acompaña a cada candidato son herramientas orientativas de
          lectura. Matchy no responde por las decisiones de selección que tome el empleador, que son suyas y deben
          ser adoptadas por una persona.
        </p>
        <p>
          En caso de conflicto entre un candidato y un local, las partes deben resolverlo entre sí o ante la
          autoridad administrativa o judicial competente. Matchy puede colaborar aportando la información de la
          plataforma cuando lo requiera una autoridad competente.
        </p>
        <p>
          Nada de lo dispuesto en esta cláusula limita los derechos que las normas de orden público reconocen a
          los usuarios, ni exime a Matchy de responder por los incumplimientos que le sean directamente
          imputables.
        </p>

        <h2>12. Baja de la cuenta</h2>
        <p>
          Podés eliminar tu cuenta y tus datos en cualquier momento desde el sitio o escribiéndonos. Matchy puede
          suspender cuentas que incumplan estos términos.
        </p>

        <h2>13. Ley aplicable y jurisdicción</h2>
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Ante cualquier controversia, las partes
          se someten a los tribunales ordinarios de la ciudad de Posadas, provincia de Misiones.
        </p>

        <div className="disclaimer">
          Documento preliminar. Debe ser revisado y completado por un profesional del derecho antes del
          lanzamiento público, en particular la razón social del responsable, el encuadre de la actividad y la
          cláusula de jurisdicción.
        </div>
      </main>
      <Pie />
    </div>
  );
}
