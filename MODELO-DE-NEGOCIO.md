# Matchy — notas de modelo de negocio

Documento de trabajo. Se va puliendo a medida que avanza el proyecto.

## Principio de diseño sobre la confianza

Ningún algoritmo va a resolver del todo el problema de la información falsa en un CV.
La defensa real contra la mentira es la entrevista, las referencias, y que mentir tenga
consecuencias. El sistema tiene que hacer que mentir sea **incómodo y rastreable**, no
imposible.

Esto tiene tres consecuencias concretas sobre el producto:

1. **El puntaje premia lo costoso de declarar.** Tildar un puesto en una lista es un click
   y pesa poco. Cargar experiencia con empresa, fechas y tareas es costoso de inventar de
   forma coherente y pesa mucho, además de quedar verificable contra las referencias.
2. **Lo declarado queda congelado.** El porcentaje se calcula al momento de postularse y no
   cambia después. Si alguien edita su CV más tarde, el empleador lo ve.
3. **La verificación se concentra donde el riesgo es mayor.** Un candidato falso le hace
   perder tiempo a un empleador. Un empleador falso puede citar a una persona a un lugar y
   hacerle daño. Por eso el esfuerzo y el costo de verificación van del lado del local.

## Asimetría del riesgo

| | Candidato falso | Empleador falso |
|---|---|---|
| Daño posible | Pérdida de tiempo del local | Daño físico, estafa, captación con otros fines |
| Verificación aplicada | Teléfono, nombre fijo tras la primera postulación | Verificación manual del local, CUIT único, declaración jurada, teléfono, red social pública |

## Vías de ingreso previstas

El candidato nunca paga. Esa regla es la base de la propuesta de valor y de la legitimidad
del portal, y está escrita en los términos y condiciones.

| Estrategia | Descripción | Precio de referencia |
|---|---|---|
| Vacante destacada | El aviso gratuito queda en el tablón normal; pagando aparece arriba y resaltado unos días | USD 5 a 15 por publicación |
| Plan mensual para locales | Vacantes ilimitadas, filtros avanzados, candidatos guardados | USD 15 a 40 por mes |
| Publicidad de proveedores del rubro | Distribuidoras, indumentaria, cursos, seguros | USD 30 a 100 por mes por espacio |
| Alianza con cursos de manipulación de alimentos | Comisión por derivar candidatos sin certificado | A acordar con el proveedor |
| Sello de CV verificado | Verificación de identidad opcional, como servicio | A definir |

Sobre el sello de CV verificado: la verificación formal de identidad tiene un costo por
consulta. Ofrecerla como servicio opcional la convierte de costo en ingreso, y mantiene el
principio de que el acceso básico es gratis.

## Orden sugerido de activación

1. Fase de validación: todo gratis, incluso para locales. El objetivo es masa crítica de CVs
   y vacantes reales.
2. Con uso constante: vacante destacada como primer cobro, porque no bloquea lo gratuito.
3. Con base de usuarios demostrable: plan mensual y publicidad de proveedores, que necesitan
   métricas para venderse con argumentos.

## Competencia real

No son los portales nacionales. Es el hábito instalado: WhatsApp, el cartel en la vidriera y
los grupos de Facebook. Matchy gana si es más rápido que un cartel, no si es más completo que
un portal genérico.
