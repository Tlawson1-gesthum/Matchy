// Textos del mail de bienvenida, según el rol de la cuenta.
export function mailBienvenida(rol, base) {
  if (rol === 'empleador') {
    return {
      asunto: 'Te damos la bienvenida a Voral',
      titulo: 'Gracias por sumar trabajo en Posadas',
      parrafos: [
        'Cada puesto que abrís es una oportunidad concreta para alguien del rubro. Gracias por elegir Voral para ofrecerlo.',
        'Ahora queremos ayudarte a recibir buenas postulaciones, ordenadas y con la información que necesitás antes de la entrevista.',
      ],
      pasos: [
        '<strong>Verificamos tu local.</strong> Revisamos los datos en hasta 48 horas hábiles y te avisamos por mail.',
        '<strong>Cargá tu primera vacante.</strong> Podés hacerlo ya: se publica apenas aprobemos el alta.',
        '<strong>Contá lo importante.</strong> Un aviso con turno, días y sueldo claros atrae gente que se queda.',
      ],
      boton: { texto: 'Publicar mi primera vacante', href: `${base}/empleador/vacantes/nueva` },
    };
  }
  return {
    asunto: 'Te damos la bienvenida a Voral',
    titulo: 'Diste el primer paso',
    parrafos: [
      'Buscar trabajo nuevo es una decisión, y vos ya la tomaste. Desde acá te acompañamos.',
      'Tu oficio vale. En Voral armás un CV pensado para la gastronomía y te postulás a locales verificados de Posadas, sin pagar nada.',
    ],
    pasos: [
      '<strong>Completá tu CV.</strong> Es lo que más pesa cuando un local mira tu perfil.',
      '<strong>Postulate.</strong> Mirá las vacantes abiertas y elegí las que te interesan.',
      '<strong>Atento al mail.</strong> Si un local te propone una entrevista, te avisamos acá y en tu panel.',
    ],
    cierre: 'Trabajar no cuesta plata: ningún local serio te va a pedir dinero ni tus datos bancarios.',
    boton: { texto: 'Completar mi CV', href: `${base}/candidato/cv` },
  };
}
