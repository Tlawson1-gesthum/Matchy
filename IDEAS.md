# Ideas para Voral

Ideas evaluadas que no se implementan por ahora. Cada una tiene la decisión tomada y lo que habría que resolver si se retoma.

## Próxima tanda de cambios (aprobado, todavía sin aplicar)

Decidido el 25/09/2026.

1. **Cambios de un local aprobado vuelven a revisión.** Si un local ya verificado cambia desde "Mi local" su logo o su dirección, el cambio pasa por revisión de un administrador antes de mostrarse a los candidatos (evita que alguien se haga pasar por otro local). A resolver al aplicarlo: si mientras tanto se sigue mostrando el dato anterior (recomendado, para no bajar sus vacantes) o si el local entero vuelve a "en revisión"; y qué campos cuentan (logo y dirección seguro; ver localidad, tipo de local y enlace). Necesita cambio en la base (guardar el cambio pendiente aparte) y una vista en el panel de administración.

## Tanda del 24/09/2026 (aplicada)

Decidido el 24/09/2026.

1. **Estado visible de cada postulación.** Aplicado el 25/09/2026: panel del candidato con una tarjeta por postulación. El "No me interesa" del local se muestra recién cuando la vacante se cierra.
2. **Aviso cuando la vacante se cierra.** Aplicado dentro de la web el 25/09/2026 ("Búsqueda cerrada" / "Aviso dado de baja"). Falta el aviso por mail, que depende de activar Resend.
3. **Comunicar dignidad del oficio y seguridad.** Aplicado el 25/09/2026: frase de privacidad bajo "Postularme", aviso "Trabajar no cuesta plata", textos para el local al publicar y cartel de local verificado. Se sumó el sueldo opcional en la vacante.

## Vacantes activas en la portada

**Estado:** en espera (decidido el 24/09/2026).

**Idea:** mostrar en la portada las últimas vacantes activas para llamar la atención de los candidatos.

**A favor:**

- Es lo que más le interesa al candidato y es prueba real de que Voral funciona.
- Muestra a los locales que su vacante se ve.

**En contra:**

- Con pocas o ninguna vacante, la portada se ve vacía.
- Hay que confirmar que la base permita leer vacantes sin iniciar sesión. Si no, hay que agregar una función de solo lectura con los datos públicos (cambio de base de datos).
- El local tiene que estar de acuerdo con aparecer en la portada.

**Si se retoma:** mostrar la sección solo cuando haya un mínimo de vacantes activas (cantidad a definir) y, mientras tanto, la vacante de ejemplo que ya existe (`/vacante-ejemplo`).

## Que el local pueda ofrecer trabajo a un candidato antes de que se postule

**Estado:** idea a desarrollar (propuesta el 24/09/2026). Choca con varias reglas actuales de Voral, así que no se implementa sin definir antes cómo resolver cada una.

**Idea:** si un local ve un CV que le gusta, puede proponerle trabajo a esa persona aunque todavía no se haya postulado a ninguna de sus vacantes.

**A favor:**

- Le da al local una razón más para usar Voral (buscar activamente, no solo esperar postulaciones).
- Ayuda al candidato con oficio que no está mirando vacantes todos los días.
- Es un servicio que los locales podrían pagar a futuro, sin cobrarle nunca al candidato.

**Reglas de Voral con las que choca:**

- **Privacidad del CV.** Hoy el local solo ve el CV de quien se postuló a su vacante. El esquema inicial tenía una columna `cvs.publico` pensada para "buscar candidatos", pero después el acceso se cerró y no existe ninguna pantalla de búsqueda.
- **Consentimiento (Ley 25.326).** El candidato aceptó que su CV lo vea el local al que se postula, no cualquier local. Mostrarlo a todos requiere un consentimiento nuevo y específico.
- **Datos sensibles.** Accesibilidad, referencias y certificado solo se muestran cuando el local avanzó con la persona. Eso tiene que seguir igual.
- **Mensaje de marca.** Varios textos prometen que el CV lo ve solo el local al que te postulás.
- **Riesgo de acoso o spam.** Un local podría escribirle a muchos candidatos sin que ellos lo pidan.

**Cómo podría funcionar sin romper esas reglas (a evaluar):**

1. **Opcional y apagado por defecto:** el candidato activa "Quiero recibir propuestas" con su propio consentimiento, y lo puede apagar cuando quiera.
2. **Perfil anónimo:** el local ve puestos, experiencia y disponibilidad, pero no el nombre, la foto ni los datos de contacto.
3. **Invitación, no contacto directo:** el local invita a postularse a una vacante suya que ya existe. El candidato ve qué local es, decide y, si acepta, se postula como siempre. Recién ahí el local ve el CV completo.
4. **Límites:** solo locales verificados, con una cantidad máxima de invitaciones por semana y la opción de reportar invitaciones abusivas.

**Antes de retomarla:** revisar con un abogado el consentimiento y actualizar los términos y la política de privacidad.

## Canal de WhatsApp con cada vacante nueva

**Estado:** idea (propuesta el 24/09/2026).

**Idea:** un Canal de WhatsApp de Voral donde se publica cada vacante nueva, para que el candidato se entere sin entrar a la web.

**A favor:**

- WhatsApp es donde ya se habla en el rubro; el aviso llega al celular.
- Compite con los grupos de Facebook y WhatsApp en rapidez, pero solo con locales verificados.
- Seguir un canal es anónimo: los seguidores no ven el número de los demás.
- Trae gente de vuelta a la web para postularse.

**En contra:**

- Al principio hay pocas vacantes: un canal casi vacío transmite que no pasa nada.
- Si se publica a mano, es trabajo diario para una sola persona. Automatizarlo no es simple (los canales no tienen una forma oficial de publicar desde la web).
- Mucho volumen cansa y la gente silencia el canal.
- Hay que publicar solo lo que el local autorizó a difundir.

**Si se aplica:** empezar publicando a mano solo vacantes urgentes y un resumen semanal; medir cuántos se postulan desde el canal (enlaces con UTM).

## Frase de privacidad para el candidato

**Estado:** idea (propuesta el 24/09/2026).

**Frase propuesta:** "Buscá tranqui. Tu CV lo ve solo el local al que te postulás."

**A favor:**

- Responde un miedo real: que el jefe actual se entere de que buscás trabajo.
- Es corta, suena a persona y encaja con el tono de la marca.

**En contra:**

- No es cierta al cien por cien: el candidato puede compartir el link público de su CV (`/cv/[id]`), y cualquiera con ese link lo ve. La frase tiene que dejar claro que eso depende de él.
- Si algún día se aplica la idea de que los locales busquen candidatos, la frase deja de ser verdad y hay que cambiarla.
- "Tranqui" es informal: sirve para el candidato, no para textos a locales.

**Versión segura:** "Buscá tranqui. Tu CV lo ve el local al que te postulás, y nadie más salvo que vos compartas tu link."

**Dónde podría ir:** debajo del botón "Postularme" en cada vacante, y en el paso final del armado del CV.

## Artículos o gráficos sobre el empleo en Posadas

**Estado:** descartado por ahora.

**Por qué:** no hay datos propios, los de terceros hay que citarlos y actualizarlos, un artículo viejo transmite abandono y distrae del botón principal. Cuando haya volumen, un dato propio chico ("vacantes nuevas esta semana") vale más que cualquier gráfico.

## Subasta de posiciones para cobrar a los locales

**Estado:** descartado.

**Por qué:** en Posadas no hay suficientes locales compitiendo por el mismo lugar para que una subasta funcione, no hay pagos integrados y cobrar en el lanzamiento frena la entrada de locales. Nunca debe tocar el orden de los candidatos (lo prometen los términos).

**Alternativa futura:** "vacante destacada" a precio fijo, que solo cambia el lugar de la vacante en la lista. Ya está prevista en la base (columna `plan` de `empleadores`, sin uso todavía).

## Publicidad de institutos con cursos (ISET, IGA u otros)

**Estado:** descartado de la portada por ahora.

**Por qué:** en una portada sin vacantes, un aviso se ve como relleno y distrae del botón principal.

**Alternativa futura:** alianza con institutos y una sección "Formate" dentro del panel del candidato y en redes. Publicidad paga más adelante.
