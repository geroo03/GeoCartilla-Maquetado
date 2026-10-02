# GeoCartillas

Demo funcional de una plataforma para que un profesor de Geografía venda, cobre y
entregue cartillas escolares en varios colegios, y para que sus alumnos las pidan
desde el teléfono.

Tiene dos vistas sobre los mismos datos: el **panel docente** (escritorio) y el
**portal del alumno** (móvil). Lo que pasa en una se ve en la otra: si un alumno
pide una cartilla, al docente le baja el stock y le entra el pedido.

## Correrla

```bash
npm install
npm run dev     # http://localhost:3000
```

Entrás con cualquier correo válido. Las credenciales de ejemplo están escritas en
la propia pantalla de acceso.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Sirve el build |
| `npm run lint` | Chequeo de tipos (`tsc --noEmit`) |
| `npm test` | Tests del reducer y las métricas |

## El recorrido

La demo trae un botón de ayuda abajo a la derecha con el recorrido numerado, que
además navega solo. En resumen:

1. **El alumno pide.** En el portal, registrate, elegí una cartilla y pagá con
   Mercado Pago o en efectivo. Cada método deja el pedido en un estado distinto.
2. **Bajó el stock.** En el panel, pestaña Cartillas, el ejemplar ya no está. Por
   debajo de 10 unidades aparece el aviso de stock bajo.
3. **Cobrás lo pendiente.** En Pedidos, filtrá por "Pendiente de pago" y registrá
   el cobro: pasa a "Listo para retirar" y el alumno recibe el aviso.
4. **Entregás en lote.** Seleccioná varios pedidos y marcalos entregados, o imprimí
   la planilla de firmas para la jornada de retiro.
5. **Organizás la jornada.** Entregas cruza la ventana de retiro de cada colegio con
   los ejemplares que lo esperan y permite cerrar la remesa completa.
6. **Mirás el resultado.** El Resumen recalcula todo con cada cambio.

## Qué hay adentro

**Panel docente**

- **Resumen**: recaudación, pedidos por semana, recaudación por colegio, embudo de
  entrega y ranking de cartillas. Cada gráfico tiene su vista de tabla.
- **Pedidos**: buscador, cuatro filtros, paginación, selección múltiple, acciones en
  lote, exportación a CSV y detalle con historial, notas y cancelación.
- **Entregas**: agenda por colegio con cuenta regresiva y cierre de remesa.
- **Cartillas**: alta, edición, duplicado, reposición de stock y visibilidad en el
  portal. La tapa se genera sola según el motivo elegido.
- **Colegios**: coordinación, divisiones, ventana de retiro y detalle con los pedidos
  reales de cada institución.

**Portal del alumno**

Catálogo filtrado por colegio, checkout con dos medios de pago, comprobante
imprimible, seguimiento en cuatro pasos, cancelación con devolución de stock y
perfil editable.

## Cómo está hecha

React 19 + Vite + Tailwind v4, con los tokens Material 3 definidos en
[src/index.css](src/index.css). Los iconos son Material Symbols por fuente.

```
src/
  store/      demoReducer.ts (lógica pura) + demoStore.tsx (provider, toasts, undo)
  data/       mockData.ts (catálogo) + seed.ts (generador de pedidos)
  lib/        format, metrics, csv
  components/ vistas, ui/ (primitivas), charts/, student/ (una pestaña por archivo)
```

Todo el estado vive en un reducer y se guarda en `localStorage`. El botón "Reiniciar
la demo" vuelve a los datos originales.

**Los datos son deterministas.** `seed.ts` genera 62 pedidos con un PRNG de semilla
fija, así que la demo es idéntica en cada reinicio: los mismos alumnos, montos y
estados. Las fechas sí son relativas a hoy, para que el panel nunca se vea viejo.

**Los gráficos** se dibujan con SVG inline, sin librería. La paleta pasó un validador
de accesibilidad: separación para daltonismo, contraste mínimo contra la superficie y
luminosidad monótona en la rampa secuencial del embudo. Ninguna identidad depende sólo
del color: cada gráfico tiene leyenda o etiquetas, y una vista de tabla equivalente.

**La impresión** sale limpia. El contenido imprimible va en un contenedor `.print-root`
y el resto de la interfaz lleva `.no-print`, así que de la planilla y del comprobante
sale sólo el documento, sin el panel alrededor.

## Qué es simulado

Es una demo sin backend. No hay servidor, base de datos ni pasarela de pago: el pago
con Mercado Pago es una espera simulada, el login acepta cualquier credencial válida y
todo se guarda en el navegador. Los datos de alumnos y colegios son inventados.

## Tests

`npm test` corre con el runner nativo de Node, sin dependencias extra. Cubre las
invariantes del reducer (el stock baja al pedir y vuelve al cancelar, editar no
duplica, el historial queda ordenado, el undo restaura) y el cuadre de las métricas
(el embudo suma el total, la suma por colegio reconstruye el total, y un alumno nunca
ve pedidos ni notificaciones de otro).
