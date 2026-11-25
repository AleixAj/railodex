# Prompt para Claude Design: Railodex

Diseña la interfaz completa de **Railodex**, una aplicación para coleccionistas de modelismo ferroviario (trenes a escala) que tienen locomotoras, vagones y coches en casa. Sirve para catalogar toda su colección con todo detalle y tenerla controlada: qué tengo, dónde está, cuánto vale, en qué estado está y qué me falta. Habrá versión web (escritorio) y app móvil (iOS/Android), así que diseña **las dos**, con el mismo sistema visual.

Todo el texto de la interfaz en **español** (pensada para traducirse después a inglés, alemán, francés e italiano: deja espacio para textos más largos).

## Concepto y tono

"Catálogo de museo con la precisión de una herramienta profesional." El usuario es un aficionado serio, a menudo con cientos de piezas y mucho dinero invertido: quiere orden, datos exactos y ver sus modelos lucir. La app tiene que sentirse moderna y premium, pero sobria y fiable, nada infantil ni de juguete. Inspiración de producto: Discogs (catálogo de colección con datos técnicos), Letterboxd (las fotos como protagonistas), Linear y Notion (limpieza, densidad de información bien resuelta), y la cartelería ferroviaria europea (señalética, rotulación técnica, números de serie).

El nombre, **Railodex**, viene de "rail" (vía, ferrocarril) + "index": un índice o enciclopedia personal de tu colección. Juega con esa idea de catálogo completo y ordenado.

## En qué se diferencia de la competencia

Ya existen apps de inventario de trenes (Trainventory, Rail Roster, TrainStash, My-Trains, iMoVe, MVS), pero casi todas son estadounidenses y centradas en escala HO americana, o son programas de escritorio antiguos con aspecto de hoja de cálculo. Railodex debe destacar en:

- **Diseño**: la más bonita y cuidada del sector, igual de buena en web que en móvil.
- **Modelismo europeo**: escalas H0, N, TT, Z, 0, 1, G; épocas NEM; compañías europeas (RENFE, FEVE, DB, SNCF, FS, SBB, ÖBB, NS, SNCB, CP); fabricantes europeos incluidos los españoles (Ibertren, Electrotren, Mabar, Arnold, Roco, Märklin…); corriente alterna Märklin y continua.
- **Rapidez al añadir**: lo que más pereza da es meter datos. Escáner, reconocimiento por foto y "duplicar parecida" para que meter 300 piezas no sea un castigo.
- **Gratis de verdad para empezar**, y Pro para quien lo necesite.

## Estilo visual

- **Modo claro y oscuro**, los dos cuidados. El oscuro es el modo "vitrina": fondos grafito profundo (#0E1013 / #16191D), las fotos de los modelos resaltan.
- **Colores:**
  - Base: grafito / tinta (#16191D), blanco roto cálido (#F6F4EF), grises neutros con un toque cálido.
  - Acento principal: ámbar de señal ferroviaria (#E8A317) para acciones principales y estados activos.
  - Secundario: verde vía (#2F6B4F) para "en colección / correcto", rojo señal (#C8372D) solo para alertas y borrar.
  - Cada **escala** tiene un color propio y discreto en sus etiquetas (H0, N, Z, TT, 0, 1, G).
- **Tipografía:** sans moderna y legible para la interfaz (Geist o Inter); una **monoespaciada** (Geist Mono o JetBrains Mono) para referencias de catálogo, números de matrícula de la locomotora, direcciones digitales y datos técnicos ("Roco 73845", "UIC 91 71 0333 014-2", "DCC 3314"). Ese contraste sans + mono es parte de la identidad.
- **Formas:** esquinas suaves (8–12 px), bordes finos de 1 px en lugar de sombras pesadas, mucho aire. Iconos de línea fina (estilo Lucide), con algunos iconos propios: locomotora de vapor, diésel, eléctrica, automotor, vagón de mercancías, coche de viajeros.
- **Fotos** como protagonistas: tarjetas con la foto del modelo grande, sobre fondo neutro. Diseña un estado vacío elegante para piezas sin foto (silueta del tipo de vehículo).
- Detalle de identidad sutil: una línea fina tipo carril o una regla de medidas en cabeceras y separadores. Sin abusar.
- Accesible: buen contraste, textos de al menos 14 px en móvil, zonas táctiles de 44 px.

## Datos de cada pieza (ficha)

Agrupados en secciones:
- **Identificación:** foto(s), nombre/modelo, fabricante, referencia de catálogo, año de fabricación del modelo, código de barras/EAN, número de serie de la unidad, edición limitada (sí/no, número "123/500").
- **Ferroviario (el tren real):** tipo, escala y ancho de vía, época NEM (I a VI), compañía, serie y número de matrícula, librea/decoración, rodaje, constructor real, años de servicio, velocidad máxima y potencia del original.
- **Técnico (el modelo):** analógico o digital, decoder, sonido, corriente, luces, humo, número de ejes motores, aros de adherencia, tipo de enganche (NEM 362, Märklin, Kadee, cinemática de enganche corto), longitud entre topes en mm, peso, radio mínimo de curva.
- **Colección:** estado (nuevo, como nuevo, usado, para reparar, para piezas), estado de la caja, caja original e instrucciones sí/no, precio de compra, fecha y origen, valor estimado, ubicación exacta, etiquetas propias, notas, estado de propiedad (en mi colección, reservada/preventa, prestada, vendida).
- **Documentos:** factura, manual, hoja de despiece, certificado, fotos de la caja (imágenes o PDF).
- **Historial:** mantenimiento (limpieza de ruedas, engrase, cambio de escobillas, digitalización…) con fecha, coste y notas; reparaciones; cambios de propietario o de ubicación.

## Pantallas a diseñar (web y móvil)

1. **Bienvenida / login / registro** y un **onboarding** corto de 3 pasos (qué escalas colecciono, qué fabricantes y compañías me interesan, importar mi colección o empezar desde cero).
2. **Inicio (panel):** número total de piezas, valor estimado vs. invertido, reparto por escala, tipo, época y digital/analógico (gráficos limpios), últimas piezas añadidas, recordatorios de mantenimiento, preventas pendientes de llegar, accesos rápidos.
3. **Mi colección:** la pantalla principal. Tres vistas conmutables: **cuadrícula** (fotos grandes), **lista** y **tabla** densa tipo hoja de cálculo con columnas configurables. Búsqueda potente y filtros en chips o panel lateral (escala, fabricante, tipo, tracción, época, compañía, digital/analógico, estado, ubicación, etiquetas). Ordenar por fecha, valor, referencia, matrícula. Filtros guardados ("Mis locos RENFE digitales"). Selección múltiple con acciones en lote (mover de ubicación, etiquetar, exportar, borrar con opción de deshacer).
4. **Ficha de pieza:** galería de fotos arriba (deslizable, a pantalla completa, con zoom), referencia y matrícula en monoespaciada bien visibles, datos en secciones plegables, bloque técnico visual (dibujo del rodaje, tabla de funciones del decoder), historial de mantenimiento en línea de tiempo, documentos adjuntos, gráfico de valor. Acciones: editar, duplicar, añadir a composición, compartir, imprimir etiqueta QR. En web, panel lateral o página completa.
5. **Añadir pieza:** cuatro caminos claros:
   - **Buscar en el catálogo** (escribes "Roco 73845" y se rellenan los datos solos),
   - **Escanear** el código de barras de la caja,
   - **Foto con IA**: haces 1–4 fotos y la app propone fabricante, modelo, escala y compañía, mostrando **nivel de confianza** y pidiendo que el usuario revise y confirme antes de guardar,
   - **Manual**, con el asistente por pasos descrito abajo.
   - Además, un **modo ráfaga** para ferias y bolsas de intercambio: escanear o fotografiar muchas piezas seguidas con lo mínimo (foto + precio) y completar el resto después en casa, desde una bandeja de "pendientes de completar".
6. **Composiciones:** agrupar una locomotora y sus vagones en un tren completo ("Talgo III RENFE, 7 coches"), con vista horizontal de los vehículos en fila, como en un andén, y arrastrar para reordenar. Mostrar totales (longitud del tren, valor, número de piezas) y avisos útiles: enganches incompatibles, mezcla de épocas, piezas analógicas en un tren digital.
7. **Lista de deseos y preventas:** piezas que quiero, con precio objetivo, prioridad, tienda y enlace. Una pieza pasa de "deseada" a "reservada / preventa" (con señal pagada, fecha estimada de llegada) y a "en mi colección" con un botón, sin volver a escribir nada. Lista exportable para llevar a una feria.
8. **Mantenimiento:** calendario y lista de tareas por pieza, recordatorios (p. ej. "engrasar cada 20 horas o cada 6 meses"), coste total, piezas de repuesto.
9. **Ubicaciones:** dónde está cada cosa, en jerarquía (habitación > vitrina o armario > estante > caja). Vista de cada vitrina con sus piezas. Generar e imprimir **etiquetas QR** para cajas y estantes: escaneas la etiqueta con el móvil y ves qué hay dentro.
10. **Digital:** listado de todas las direcciones digitales con aviso de **direcciones duplicadas**, decoders instalados y sus funciones.
11. **Estadísticas:** evolución del valor de la colección, invertido vs. valor actual, gasto por año y por fabricante, progreso de series ("tienes 5 de 8 coches del Talgo III").
12. **Importar y exportar:** importar desde Excel/CSV (con vista previa, detección de duplicados y deshacer), y desde programas de control digital (JMRI). Exportar a CSV, Excel y **PDF para el seguro** (con fotos, estado y valores). Copia de seguridad completa.
13. **Perfil público y compartir:** enlace para enseñar tu colección (o solo una vitrina o composición) a otros, en modo solo lectura y con opción de ocultar precios.
14. **Perfil y ajustes:** idioma, moneda, unidades, modo claro/oscuro, notificaciones, privacidad, datos de la cuenta.
15. **Planes y pago:** pantalla de planes y los momentos en que aparece la invitación a pasar a Pro (al llegar al límite gratis, al tocar una función Pro), atractiva pero sin agobiar.
16. **Estados especiales:** colección vacía (primer uso), cargando, sin resultados de búsqueda, sin conexión en móvil (la app debe funcionar offline y sincronizar después), error, confirmación de borrado con deshacer.

## Formulario de alta: el corazón de la app

Al añadir una pieza hay que meter MUCHA información, así que el formulario es la pantalla más importante y la que más cuidado necesita. Debe ser un **asistente por pasos** con barra de progreso, donde **las opciones que eliges cambian los campos que aparecen después** (campos condicionales). Nunca mostrar campos que no aplican. Usar listas desplegables con buscador, chips seleccionables y autocompletado siempre que se pueda, para escribir lo mínimo. Solo son obligatorios tipo, fabricante y escala: todo lo demás se puede completar más tarde, y la ficha muestra un indicador de "ficha completa al 60 %". Guardar borrador automáticamente y permitir saltar pasos opcionales. En web, mostrar a la derecha una vista previa de la ficha que se va rellenando en tiempo real.

**Paso 1. Tipo de pieza.** Tarjetas grandes con icono: Locomotora, Automotor / unidad múltiple, Coche de viajeros, Vagón de mercancías, Accesorio (vías, edificios, señales, figuras…).

**Paso 2. Tracción** (solo locomotoras y automotores): Vapor, Diésel, Eléctrica, Híbrida/otra. Según lo elegido:
- **Vapor:** rodaje / disposición de ejes en desplegable (notación UIC y Whyte: 1'C, 1'D1', 2'C1', 2-8-2, 4-6-2, C, D, E…), con ténder sí/no y tipo de ténder, generador de humo sí/no.
- **Diésel:** rodaje en desplegable (B, C, Bo'Bo', B'B', Co'Co', C'C', 1'Co'Co'1'…), transmisión (eléctrica, hidráulica, mecánica).
- **Eléctrica:** rodaje en desplegable (Bo'Bo', Co'Co', B'B'B', 1'Do1'…), número de pantógrafos, pantógrafos funcionales sí/no, tensión del original, toma de corriente por catenaria sí/no.
- **Automotor:** número de unidades/coches, en qué coche va el motor.
- **Coches y vagones** (en lugar de tracción): subtipo (cerrado, tolva, plataforma, cisterna, frigorífico, portacontenedores, coche cama, restaurante, furgón…), ejes o bogies, iluminación interior, enganche corto, carga incluida.

**Paso 3. Sistema: Digital o Analógico.** Selector grande, porque cambia todo lo demás:
- **Digital:** protocolo (DCC, mfx, Motorola, Selectrix, multiprotocolo), decoder de fábrica o instalado después, marca y modelo del decoder (ESU LokSound, Zimo, Märklin, Doehler & Haass, Lenz, Uhlenbrock…), dirección digital (avisando si ya la usa otra pieza), sonido sí/no y altavoz, tabla de funciones (F0, F1, F2… con su descripción: luces, bocina, humo, enganche…), versión de firmware, RailCom sí/no, perfil de configuración (CVs) adjunto.
- **Analógico:** corriente continua (2 carriles) o alterna (3 carriles), preparado para digital sí/no y tipo de interfaz (NEM 651, NEM 652, PluX16, PluX22, Next18, 21MTC), luces direccionales sí/no.

**Paso 4. Identificación:** marca/fabricante (desplegable con buscador y logos), modelo, referencia de catálogo, escala y ancho de vía, época, compañía ferroviaria, serie y número de matrícula, librea, año de fabricación, código EAN, longitud, edición limitada.

**Paso 5. Compra y origen:** precio de compra, moneda, fecha de compra, origen (tienda física, tienda online, segunda mano, feria/bolsa de intercambio, regalo, herencia, subasta), nombre de la tienda o vendedor, estado al comprar, caja original y documentación sí/no, factura adjunta (foto o PDF), garantía hasta.

**Paso 6. Fotos, ubicación y notas:** subir varias fotos (la primera es la portada; recorte y fondo neutro automático opcional), ubicación en casa (desde la jerarquía de ubicaciones o escaneando la etiqueta QR del estante), etiquetas propias, notas libres.

**Paso 7. Revisión** y guardar, con opción "Guardar y añadir otra parecida" (duplica los datos comunes para meter series de vagones rápido).

Diseña al menos el flujo completo de una **locomotora diésel digital** y muestra cómo cambian los campos con una **de vapor analógica**, en web y en móvil. Diseña también cómo se ven en la ficha estos datos técnicos (rodaje, decoder, tabla de funciones) de forma clara y bonita, no como una lista interminable.

## Planes (propuesta, para la pantalla de precios)

- **Gratis:** hasta 100 piezas, fotos limitadas por pieza, colección, ficha completa, lista de deseos, búsqueda en catálogo, escáner de código de barras, exportar CSV.
- **Pro (coleccionista):** piezas y fotos ilimitadas, reconocimiento por foto con IA, valor de mercado y evolución, PDF para el seguro, mantenimiento con recordatorios, ubicaciones con etiquetas QR, composiciones avanzadas, estadísticas completas, copias de seguridad, perfil público. Pago mensual, anual o de por vida.
- **Profesional / Club:** para tiendas, restauradores, tasadores y asociaciones. Varias personas en una misma colección con permisos (ver, editar, administrar), inventario de stock y fichas de venta imprimibles, préstamos de material entre socios con fecha de devolución, marca propia en los informes.

## Navegación

- **Web:** barra lateral izquierda fija y plegable (Inicio, Colección, Composiciones, Deseos y preventas, Mantenimiento, Ubicaciones, Estadísticas; abajo Importar/exportar, Ajustes y perfil), buscador global con atajo ⌘K que busca piezas, referencias y matrículas, botón "Añadir pieza" siempre visible en ámbar.
- **Móvil:** barra inferior con 5 pestañas (Inicio, Colección, botón central "+" destacado para añadir y escanear, Deseos, Más). Gestos naturales (deslizar para acciones rápidas), listas cómodas con el pulgar, fichas a pantalla completa, acceso directo a la cámara.

## Entregables

- Sistema de diseño: colores (claro y oscuro), tipografía, botones, campos de formulario, desplegables con buscador, chips, etiquetas de escala y de época, tarjetas de pieza, filtros, tablas, gráficos, línea de tiempo, estados vacíos, de carga y de error.
- Todas las pantallas anteriores en escritorio (1440 px) y móvil (390 px). Si hay que priorizar: Colección, Ficha, Formulario de alta, Inicio y Composiciones.
- Rellena con datos realistas de ejemplo: una colección de unas 40 piezas mezclando H0 y N, de RENFE y DB, épocas III a VI, de fabricantes como Roco, Märklin, Electrotren, Fleischmann, Piko, Arnold y Mabar (referencias y precios verosímiles).
- Deja un hueco para el logo en la cabecera (de momento, solo el nombre "Railodex" en tipografía).
