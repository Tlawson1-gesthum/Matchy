# Ideas para Voral

Ideas evaluadas que no se implementan por ahora. Cada una tiene la decisión tomada y lo que habría que resolver si se retoma.

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
