# Finance Tracker - Lista de Tareas

## Base de Datos y Backend
- [x] Diseñar esquema de base de datos para cuentas bancarias
- [x] Diseñar esquema de base de datos para tarjetas de crédito
- [x] Diseñar esquema de base de datos para transacciones
- [x] Diseñar esquema de base de datos para categorías de gastos
- [x] Implementar helpers de base de datos para CRUD de cuentas
- [x] Implementar helpers de base de datos para CRUD de tarjetas
- [x] Implementar helpers de base de datos para CRUD de transacciones
- [x] Implementar helpers de base de datos para CRUD de categorías

## Procesamiento de Archivos
- [x] Implementar extracción de texto de archivos PDF
- [x] Implementar OCR para capturas de pantalla
- [x] Implementar parser para estados de cuenta bancarios
- [x] Implementar parser para estados de cuenta de tarjetas de crédito
- [x] Implementar sistema de almacenamiento de archivos en S3

## Categorización con IA
- [x] Implementar categorización automática de transacciones usando LLM
- [x] Crear sistema de categorías predefinidas (ingresos/gastos)
- [x] Implementar detección automática de tipo de transacción (ingreso/gasto)

## Interfaz de Usuario
- [x] Configurar tema elegante con paleta de colores personalizada
- [x] Implementar DashboardLayout con navegación lateral
- [x] Crear página principal (Dashboard) con resumen financiero
- [x] Crear página de gestión de cuentas bancarias
- [x] Crear página de gestión de tarjetas de crédito
- [x] Crear página de transacciones con tabla y filtros
- [x] Crear página de carga de archivos (PDF y capturas)
- [x] Crear página de categorías

## Dashboard y Visualizaciones
- [x] Implementar gráfico de ingresos vs gastos mensual
- [x] Implementar gráfico de distribución de gastos por categoría
- [x] Implementar resumen de balance total de cuentas
- [x] Implementar resumen de deuda total de tarjetas
- [x] Implementar comparativa con períodos anteriores
- [x] Implementar tarjetas de resumen (total ingresos, gastos, balance)

## Gestión de Transacciones
- [x] Implementar filtrado por fecha (rango)
- [x] Implementar filtrado por categoría
- [x] Implementar filtrado por cuenta/tarjeta
- [x] Implementar filtrado por monto (rango)
- [x] Implementar búsqueda por descripción
- [x] Implementar edición manual de transacciones
- [x] Implementar eliminación de transacciones

## Testing
- [x] Escribir tests para procesamiento de PDFs
- [x] Escribir tests para OCR de capturas
- [x] Escribir tests para categorización con IA
- [x] Escribir tests para CRUD de cuentas
- [x] Escribir tests para CRUD de tarjetas
- [x] Escribir tests para CRUD de transacciones
- [x] Escribir tests para filtros y búsqueda


## Mejoras Solicitadas - Fase 2

### Soporte para Préstamos Bancarios
- [x] Agregar tabla de préstamos en base de datos
- [x] Crear CRUD para gestión de préstamos
- [ ] Implementar página de gestión de préstamos
- [ ] Agregar transacciones de préstamos (desembolsos y pagos)

### Modo Oscuro/Claro
- [x] Implementar tema switchable en ThemeProvider
- [x] Agregar selector de tema en interfaz
- [ ] Guardar preferencia de tema en base de datos
- [x] Actualizar paleta de colores para modo oscuro

### Recomendaciones Financieras
- [x] Crear sistema de análisis de gastos con IA
- [x] Generar recomendaciones personalizadas
- [x] Implementar página de recomendaciones
- [ ] Agregar alertas de gastos anormales

### Edición de Conceptos de Transacciones
- [ ] Permitir renombrar conceptos personalizados
- [ ] Guardar historial de cambios
- [ ] Aplicar cambios retroactivamente (opcional)

### Análisis y Reportes Avanzados
- [ ] Crear página de análisis con múltiples vistas
- [ ] Gráficos de tendencias mensuales/anuales
- [ ] Análisis de patrones de gastos
- [ ] Comparativas año a año
- [ ] Proyecciones de gastos futuros

### Exportación de Reportes y CSV
- [ ] Exportar transacciones a CSV
- [ ] Exportar reportes a PDF
- [ ] Exportar resumen mensual
- [ ] Exportar análisis de categorías
