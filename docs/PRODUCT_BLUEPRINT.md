# Blueprint de producto — plataforma gastronómica

> Nombre de trabajo: **Come**. El nombre y la identidad final quedan pendientes.
>
> Estado: definición funcional inicial, 2 de septiembre de 2026.

## 1. Visión

Construir una plataforma gastronómica que permita descubrir la cocina de México, conocer a las personas y comunidades que la crean y convertir ese descubrimiento en una acción: visitar, guardar, recorrer, reservar o pedir.

El producto combina cuatro capacidades que deben sentirse como una sola experiencia:

1. **Directorio:** lugares, chefs, cocineras y cocineros, productores, mercados y proyectos gastronómicos.
2. **Editorial:** noticias, historias, guías, listas, videos, recetas y rutas.
3. **Reservaciones:** mesas, experiencias, eventos y actividades gastronómicas.
4. **Pedidos:** menús comprables para recolección y, posteriormente, entrega.

## 2. Principios del producto

- La comida puede descubrirse por lugar, platillo, chef, cocina, región, ocasión o cercanía.
- Cada ficha debe explicar por qué importa el lugar, no limitarse a mostrar datos comerciales.
- Reservar o pedir debe ser una continuación natural del descubrimiento.
- La información editorial y la información proporcionada por el negocio deben distinguirse visualmente.
- Las reseñas públicas solo pueden asociarse a una visita, reservación o pedido verificable.
- Los lugares informales, mercados y cocinas tradicionales deben poder participar aunque no operen como un restaurante convencional.
- No se promete entrega ni disponibilidad si no existe confirmación operativa real.
- El producto debe funcionar primero en web móvil y escritorio. Una app nativa se evalúa después de validar los flujos transaccionales.

## 3. Propuesta de valor por audiencia

### Comensales

- Descubrir lugares y platillos con contexto editorial confiable.
- Buscar por ubicación, disponibilidad, presupuesto, cocina, restricciones y ocasión.
- Guardar listas y crear recorridos.
- Reservar una mesa o experiencia.
- Pedir para recoger y, donde esté disponible, solicitar entrega.
- Consultar pedidos y reservaciones en un solo historial.

### Negocios

- Reclamar y administrar su perfil sin alterar el contenido editorial independiente.
- Publicar sucursales, horarios, servicios, menús y experiencias.
- Recibir y gestionar pedidos y reservaciones.
- Administrar disponibilidad, capacidad y cierres excepcionales.
- Consultar desempeño, demanda y recurrencia de clientes.

### Chefs y actores gastronómicos

- Contar con un perfil verificable conectado a lugares, platillos, historias y eventos.
- Publicar o participar en experiencias reservables.
- Mantener una trayectoria que no dependa de un único restaurante.

### Equipo editorial

- Crear artículos, guías y rutas enlazando entidades existentes.
- Diferenciar selección editorial, contenido patrocinado y datos del establecimiento.
- Mantener versiones, autoría, fechas de revisión y fuentes.

## 4. Modelo operativo de pedidos

### Pedido de un restaurante independiente

Cada pedido pertenece a una sola sucursal. Precios, tiempos, preparación, impuestos, propina, cancelación y entrega se calculan para esa sucursal.

### Pedido combinado

Solo se permite mezclar conceptos cuando comparten un mismo centro operativo, por ejemplo:

- mercado gastronómico;
- cocina compartida;
- festival o evento;
- hotel o complejo;
- centro de producción administrado por la plataforma.

Todos los conceptos combinables deben tener el mismo `fulfillmentHubId`. El servidor, no la interfaz, valida esta condición.

### Modalidades

- **Recolección:** primera modalidad transaccional recomendada.
- **Entrega del negocio:** disponible cuando el establecimiento maneja su propio reparto.
- **Proveedor logístico:** integración posterior con terceros.
- **Entrega propia:** fuera del MVP; requiere operación, cobertura, soporte y conciliación especializados.

## 5. Arquitectura de navegación

### Navegación principal para comensales

| Sección | Propósito |
| --- | --- |
| Inicio | Recomendaciones, cercanía, novedades, disponibilidad y contenido editorial |
| Explorar | Búsqueda universal de lugares, platillos, chefs, rutas y experiencias |
| Mapa | Descubrimiento geográfico con vista de lista sincronizada |
| Actividad | Pedidos, reservaciones, experiencias y acciones pendientes |
| Perfil | Favoritos, listas, preferencias, métodos de pago y cuenta |

En escritorio, estas áreas pueden presentarse en encabezado superior. En móvil, deben convertirse en navegación inferior persistente.

### Búsqueda universal

La búsqueda debe aceptar lenguaje natural y filtros estructurados:

- “desayuno cerca de mí”;
- “mesa para cuatro hoy a las 8”;
- “tacos abiertos ahora”;
- “ruta de panaderías en la Roma”;
- “comida oaxaqueña con opciones vegetarianas”.

Resultados agrupados por: lugares, platillos, chefs, experiencias, rutas y artículos.

## 6. Inventario de pantallas

### A. Públicas y de descubrimiento

| Pantalla | Objetivo | Estado actual |
| --- | --- | --- |
| Inicio | Entrada personalizada y editorial | Existe parcialmente |
| Explorar | Resultados universales y filtros | Falta |
| Mapa | Lugares, rutas y disponibilidad cercana | Existe parcialmente |
| Lista de lugares | Directorio filtrable | Existe parcialmente |
| Perfil de lugar | Información, editorial, menú, reserva y pedido | Existe parcialmente |
| Menú comprable | Categorías, opciones, disponibilidad y carrito | Solo menú informativo |
| Perfil de chef | Trayectoria, lugares, platillos y contenido | Existe parcialmente |
| Perfil de platillo | Dónde probarlo, historia y variantes | Falta |
| Guías | Colecciones editoriales | Existe |
| Ruta | Mapa, paradas, duración y guardado | Existe parcialmente |
| Experiencias | Eventos y actividades reservables | Falta |
| Artículo/noticia | Contenido editorial relacionado | Existe |
| Búsqueda | Autocompletado y resultados agrupados | Falta |

### B. Reservaciones

| Pantalla | Función |
| --- | --- |
| Selector de fecha y personas | Define intención de reserva |
| Horarios disponibles | Muestra disponibilidad real y políticas |
| Detalle de reserva | Zona, experiencia, notas, accesibilidad y ocasión |
| Garantía o prepago | Tarjeta, depósito o pago total cuando aplique |
| Confirmación | Código, calendario, dirección y políticas |
| Administrar reserva | Modificar, cancelar, avisar retraso o contactar |
| Historial | Próximas, pasadas y canceladas |

### C. Pedidos

| Pantalla | Función |
| --- | --- |
| Menú | Artículos, categorías y disponibilidad |
| Configuración de artículo | Variantes, modificadores, alergias y cantidad |
| Carrito | Resumen y validación por sucursal o centro operativo |
| Cumplimiento | Recolección o entrega, horario y dirección |
| Pago | Desglose completo, método, propina y factura |
| Confirmación | Número y tiempo estimado |
| Seguimiento | Estados verificables del pedido |
| Reordenar | Replica artículos disponibles y solicita confirmar cambios |

### D. Cuenta del comensal

- Datos personales y preferencias.
- Direcciones.
- Métodos de pago tokenizados por el proveedor; nunca guardar números de tarjeta.
- Restricciones alimentarias y alérgenos.
- Favoritos y listas.
- Pedidos y reservaciones.
- Reseñas pendientes y publicadas.
- Privacidad, sesiones y eliminación de cuenta.
- Membresía futura, solo cuando existan beneficios y economía comprobables.

### E. Portal del negocio

- Alta y reclamación de negocio.
- Verificación de identidad y autorización.
- Organización, sucursales y equipo.
- Perfil público y servicios.
- Horarios regulares y excepciones.
- Menús, categorías, artículos, variantes y modificadores.
- Disponibilidad y pausas de venta.
- Bandeja de pedidos y tiempos de preparación.
- Mesas, zonas, turnos, capacidad y reservaciones.
- Experiencias, precios, cupos y políticas.
- Clientes, notas operativas y consentimiento de marketing.
- Pagos, reembolsos, comisiones, liquidaciones y facturas.
- Reportes y bitácora de cambios.

### F. Administración editorial y plataforma

- Moderación y verificación de entidades.
- Gestión editorial con borrador, revisión y publicación.
- Contenido patrocinado etiquetado.
- Gestión de usuarios, organizaciones, roles y permisos.
- Disputas, reembolsos y soporte.
- Auditoría de cambios.
- Configuración de cobertura, categorías, comisiones e integraciones.

## 7. Flujos principales

### Descubrir y reservar

`Inicio/Explorar → lugar → fecha/personas → horario → datos y política → garantía/pago opcional → confirmación → recordatorio → asistencia → reseña verificada`

### Descubrir y pedir

`Inicio/Explorar → lugar o platillo → menú → configurar artículo → carrito → recolección/entrega → pago → aceptación del negocio → preparación → listo/en camino → completado`

### Recorrer una ruta

`Guía/ruta → revisar paradas → guardar → iniciar recorrido → navegar a una parada → marcar visita → reservar o pedir cuando esté disponible`

### Reclamar un negocio

`Perfil no reclamado → solicitar acceso → verificar identidad y relación → aprobación → crear organización/sucursal → invitar equipo → configurar servicios`

## 8. Estados operativos indispensables

### Pedido

`draft → awaiting_payment → placed → accepted → preparing → ready → picked_up/out_for_delivery → completed`

Estados alternos: `rejected`, `cancelled`, `refund_pending`, `partially_refunded`, `refunded`, `disputed`.

### Reservación

`held → pending_payment/pending_confirmation → confirmed → seated → completed`

Estados alternos: `cancelled_by_guest`, `cancelled_by_venue`, `no_show`, `refunded`.

Cada transición debe registrar actor, fecha, origen y motivo. El cliente no puede declarar por sí mismo un pago, reembolso, aceptación o finalización.

## 9. Entidades principales

El nombre técnico de una entidad no debe depender de la marca provisional.

| Entidad | Responsabilidad |
| --- | --- |
| `users` | Identidad y preferencias del usuario |
| `organizations` | Propietario comercial o grupo operador |
| `organizationMembers` | Roles y permisos por organización |
| `venues` | Lugar gastronómico público |
| `branches` | Ubicación operativa y horarios |
| `people` | Chefs, cocineras, productores y autores |
| `venuePeople` | Relación histórica entre persona y lugar |
| `cuisines` | Taxonomía de cocinas y tradiciones |
| `dishes` | Concepto editorial de un platillo |
| `menus` | Menú comercial versionado por sucursal |
| `menuItems` | Artículos vendibles |
| `modifierGroups` | Opciones, reglas y suplementos |
| `fulfillmentHubs` | Unidad que permite pedidos combinados |
| `orders` | Compra y totales calculados en servidor |
| `orderEvents` | Historial inmutable de estados |
| `availabilityRules` | Capacidad y reglas de reservación |
| `reservations` | Reserva de mesa o espacio |
| `experiences` | Evento o actividad reservable |
| `articles` | Contenido editorial |
| `guides` | Colecciones ordenadas de entidades |
| `routes` | Recorridos geográficos |
| `favorites` | Entidades guardadas por usuario |
| `reviews` | Opinión asociada a actividad verificable |
| `mediaAssets` | Fotos, video, autoría, licencia y uso |
| `auditEvents` | Cambios sensibles y acciones administrativas |

## 10. Permisos

Los permisos deben validarse en servidor y reglas de datos. Una pantalla oculta no constituye autorización.

Roles iniciales:

- `platformAdmin`
- `editor`
- `supportAgent`
- `organizationOwner`
- `organizationManager`
- `venueOperator`
- `host`
- `kitchenOperator`
- `customer`

El acceso se limita por organización y, cuando corresponda, por sucursal. Ningún usuario autenticado genérico puede editar el directorio completo.

## 11. Seguridad y reglas de negocio

- Calcular precios, descuentos, impuestos, disponibilidad y totales en servidor.
- Usar idempotencia en creación de pagos, pedidos, reembolsos y reservaciones.
- Mantener secretos e integraciones exclusivamente en servidor.
- Verificar firmas de webhooks y conservar sus eventos para conciliación.
- Reservar inventario o capacidad durante una ventana corta de pago.
- Evitar dobles reservas mediante transacciones.
- Tokenizar pagos mediante un proveedor compatible; no almacenar datos de tarjeta.
- Mantener bitácora de operaciones administrativas y financieras.
- Separar datos públicos, datos del negocio y datos personales.
- Aplicar límites y protección contra abuso en formularios públicos.
- Conservar procedencia, licencia y autorización de cada recurso multimedia.

## 12. Alcance recomendado del MVP

### Incluido

- CDMX como primera zona operativa.
- Directorio normalizado de lugares, sucursales, chefs y cocinas.
- Inicio, explorar, mapa, perfiles, guías y rutas.
- Favoritos y listas.
- Reclamación y verificación manual de negocios.
- Portal básico del negocio.
- Reservaciones con capacidad por intervalos y confirmaciones.
- Pedidos para recolección de un solo establecimiento.
- Pago, cancelación y reembolso administrado.
- Historial de pedidos y reservaciones.
- Reseñas verificadas.
- Administración segura y bitácora.

### Fuera del MVP

- Entrega propia.
- Carrito entre restaurantes independientes.
- Membresía pagada.
- Programa complejo de puntos.
- Reservaciones con plano gráfico de mesas.
- Expansión nacional simultánea.
- Recomendaciones generativas autónomas.

## 13. Fases de construcción

### Fase 0 — Saneamiento

1. Corregir permisos actuales de Firestore y Storage.
2. Sustituir la lista de administradores del navegador por roles verificables.
3. Corregir errores de calidad y tipar el dominio existente.
4. Inventariar, depurar y respaldar los datos actuales.
5. Separar datos demostrativos de datos publicados.
6. Definir taxonomía, procedencia y licencias de contenido.

**Criterio de salida:** un usuario común no puede modificar contenido administrativo y la base actual puede migrarse sin pérdida.

### Fase 1 — Directorio y descubrimiento

1. Introducir el modelo `venues` + `branches` sin romper URLs existentes.
2. Crear búsqueda universal y filtros.
3. Unificar perfil de lugar, chef, platillo y contenido relacionado.
4. Mejorar mapa, cercanía, favoritos y listas.
5. Adaptar navegación móvil a cinco áreas principales.

**Criterio de salida:** una persona puede encontrar un lugar adecuado y guardar su decisión con datos confiables.

### Fase 2 — Reservaciones

1. Portal del negocio, equipo y sucursales.
2. Horarios, cierres y capacidad.
3. Disponibilidad y bloqueo temporal.
4. Reserva, modificación, cancelación y notificaciones.
5. Depósitos y experiencias prepagadas cuando aplique.

**Criterio de salida:** una reserva no puede duplicar capacidad y ambas partes observan el mismo estado.

### Fase 3 — Pedidos para recolección

1. Menús versionados y modificadores.
2. Disponibilidad por artículo y horario.
3. Carrito de una sucursal.
4. Pago y conciliación.
5. Bandeja operativa y seguimiento.
6. Cancelaciones, reembolsos y soporte.

**Criterio de salida:** el precio se recalcula en servidor y un pedido puede completarse y conciliarse de punta a punta.

### Fase 4 — Entrega y centros compartidos

1. Zonas y tarifas de entrega.
2. Integración logística.
3. Seguimiento y comprobante de entrega.
4. `fulfillmentHubs` y carrito combinado validado en servidor.

### Fase 5 — Retención

1. Reordenar.
2. Recomendaciones personalizadas.
3. Membresía basada en beneficios sostenibles.
4. Fidelidad, créditos y promociones con conciliación contable.

## 14. Métricas iniciales

- Porcentaje de búsquedas que terminan en vista de perfil.
- Porcentaje de perfiles que terminan en guardado, reserva o pedido.
- Conversión y abandono de reservación.
- Conversión y abandono de carrito.
- Aceptación y cancelación por negocio.
- Tiempo real frente a tiempo prometido.
- No-show y cancelaciones tardías.
- Repetición de pedido y reservación.
- Porcentaje de contenido y fichas revisados recientemente.
- Incidencias y reembolsos por cada cien transacciones.

## 15. Decisiones pendientes

Estas decisiones deben resolverse antes de implementar pagos:

1. Ciudad y perímetro exactos del piloto.
2. Comisión por pedido y por reservación.
3. Proveedor de pagos y responsable contractual del cobro.
4. Quién factura al comensal y quién liquida al negocio.
5. Confirmación instantánea o manual de reservaciones.
6. Política de cancelaciones, depósitos y no-show.
7. Proveedor de mensajes transaccionales.
8. Modelo editorial y reglas para contenido patrocinado.
9. Proceso legal de reclamación y verificación de negocios.
10. Requisitos definitivos del nombre y territorio de marca.

## 16. Próximo incremento recomendado

El siguiente incremento debe ser la **Fase 0**. Antes de rediseñar o agregar botones de “Reservar” y “Pedir”, se debe cerrar el acceso administrativo actual, definir roles y producir un inventario migrable de los datos existentes.

En paralelo se puede preparar un prototipo navegable, sin pagos ni promesas operativas, con estas cinco pantallas:

1. Inicio.
2. Explorar.
3. Perfil de lugar.
4. Flujo de reservación.
5. Menú y carrito para recolección.

Ese prototipo será la base para validar el concepto con comensales y negocios antes de construir la infraestructura transaccional completa.
