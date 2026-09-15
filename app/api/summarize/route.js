import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Recibe: { vacante: {...}, cv: {...}, puntaje, razonesPositivas, razonesNegativas }
// Devuelve: { resumen: "una frase corta explicando por qué conviene o no este candidato" }
export async function POST(req) {
  try {
    const { vacante, cv, puntaje, razonesPositivas, razonesNegativas } = await req.json();

    const prompt = `Sos un asistente que ayuda a un dueño de bar/restaurante en Posadas, Argentina, a decidir a qué candidato entrevistar primero.

Vacante: ${vacante.puesto}, turno ${vacante.turno || 'sin preferencia'}, urgencia ${vacante.urgencia}, experiencia mínima ${vacante.experiencia_minima_anios || 0} años.

Candidato: ${cv.nombre}, ${cv.anios_experiencia || 0} años de experiencia, disponibilidad ${cv.disponibilidad_horaria || 'no especificada'}.

Puntaje de compatibilidad calculado: ${puntaje}/100.
Puntos a favor: ${razonesPositivas.join('; ') || 'ninguno destacado'}.
Puntos en contra: ${razonesNegativas.join('; ') || 'ninguno'}.

Escribí UNA sola frase corta (máximo 25 palabras), en español rioplatense, directa y práctica, explicándole al dueño del local por qué le conviene o no priorizar a este candidato. No repitas el puntaje numérico en la frase. No uses comillas.`;

    const respuesta = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });

    const texto = respuesta.content.find((b) => b.type === 'text')?.text?.trim() || '';
    return Response.json({ resumen: texto });
  } catch (err) {
    return Response.json({ resumen: '', error: err.message }, { status: 500 });
  }
}
