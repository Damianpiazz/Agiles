# Minuta de Relevamiento de Requerimientos

**Tema:** Análisis de requerimientos para el Sistema de Gestión del Servicio de Hemoterapia.  
**Documento base:** Entrevista (audio transcrito).

---

### Información General
*   **Organización:** Hospital de Las Flores  
*   **Área / Departamento:** Servicio de Hemoterapia (incluye Unidad Transfusional y Posta Fija)  
*   **Entrevistado (Nombre y Rol):** Facundo, Mariela y Paula (Técnicos y Licenciados en hemoterapia). El equipo se completa con Aldana y Valeria  
*   **Fecha:** 7/4/2026
*   **Entrevistador:** Damian Piazza
*   **Proyecto / Sistema objetivo:** Desarrollo de un sistema informático centralizado para la gestión y trazabilidad del servicio de hemoterapia  

---

### Objetivo de la Entrevista
*   **¿Qué se busca entender con esta entrevista?:** Relevar la modalidad de trabajo actual, los puntos de dolor provocados por la falta de un sistema, y establecer las necesidades funcionales para reemplazar los procesos manuales  
*   **¿Qué decisiones se quieren tomar con esta información?:** Documentar los requerimientos para presupuestar el desarrollo, presentar el proyecto para la aprobación por parte de la dirección del hospital, y pautar los métodos de colaboración entre los usuarios y el desarrollador  

---

### Contexto del Negocio
*   **¿Cuál es el objetivo del área?:** Gestionar transfusiones a pacientes (Unidad Transfusional), atender y estudiar a gestantes y recién nacidos, y recolectar sangre de donantes para el Centro Regional de La Plata  
*   **¿Qué problemas existen actualmente?:** El área carece completamente de un sistema informático. Toda la gestión se basa en registros manuales en múltiples libros y apoyos recientes y precarios en planillas de Excel compartidas  
*   **¿Qué impacto tienen esos problemas?:** Se generan pérdidas de tiempo de hasta 20 minutos por paciente, gasto innecesario de insumos, pérdida de calidad en el servicio y un alto riesgo humano como la posible confusión de historiales entre pacientes homónimos  
*   **¿Qué métricas utilizan?:** Generan estadísticas requeridas por el Ministerio de la Provincia (Planillas HEMO 1 al 5) sobre cantidad de donantes, hemocomponentes transfundidos o descartados, y embarazadas estudiadas  

---

### Procesos Actuales (AS-IS)
*   **Describa el proceso actual paso a paso:** Un paciente o donante ingresa, se le extrae sangre, se determina grupo y factor, se efectúan pruebas de compatibilidad, y los resultados se registran a mano en libros físicos obligatorios. Desde diciembre, intentan cargar algunos datos de forma manual en Excel  
*   **¿Quiénes participan?:** El personal técnico y licenciados del servicio de hemoterapia  
*   **¿Qué herramientas o sistemas utilizan?:** Libros físicos, archivos de Microsoft Excel, Google Drive, sellos de goma y plantillas de Word básicas  
*   **¿Dónde ocurren errores o demoras?:** Al buscar a mano en los registros físicos y durante el cruce de datos en cambios de guardia donde puede haber confusión de identidades de pacientes  
*   **¿Qué tareas son manuales?:** Prácticamente la totalidad: la búsqueda de antecedentes históricos, la elaboración de certificados y constancias de donación mediante sellos, y la consolidación de datos estadísticos mensuales  

---

### Procesos Deseados (TO-BE)
*   **¿Cómo debería funcionar el proceso ideal?:** El sistema debe permitir que ingresando únicamente el DNI de la persona, se despliegue en pantalla todo su historial clínico-transfusional e información de aptitud actualizada  
*   **¿Qué debería automatizarse?:** La consolidación de datos para extraer los reportes estadísticos, la emisión directa de certificados de donación y grupo/factor, y el envío de estos últimos vía WhatsApp o correo electrónico  
*   **¿Qué resultados esperan?:** Agilizar la atención ahorrando tiempo, evitar la repetición innecesaria de pruebas diagnósticas reduciendo el consumo de insumos, y contar con una trazabilidad infalible sobre cada paciente o donante  

---

### Casos de Uso
*   **¿Qué acciones principales debe permitir el sistema?:** Búsqueda inmediata de historiales mediante DNI, registro de nuevas donaciones y transfusiones, identificación de donantes excluidos (serología positiva o reacciones adversas) e impresión/exportación de certificados y constancias  
*   **¿Quién realiza cada acción?:** Exclusivamente el personal del servicio de hemoterapia  
*   **¿Cuál es el resultado esperado?:** Acceso rápido, unificado y trazable a la información requerida bajo estrictas normas de confidencialidad  

---

### Requerimientos Funcionales
*   **¿Qué debería hacer el sistema?:** Centralizar módulos de gestión para la Unidad Transfusional, Gestantes y la Posta Fija. Se solicita la incorporación de un sistema de alertas visuales ("semáforo": verde para apto, amarillo para dudoso, rojo para serología positiva)  
*   **¿Qué entradas recibe?:** Número de DNI, nombre, apellido, fecha de extracción, grupo, factor, resultados de pruebas de serología y parámetros biológicos  
*   **¿Qué salidas genera?:** Historiales clínicos, constancias de donación impresas, certificados de grupo y factor digitales (PDF para WhatsApp/Mail), e informes estadísticos consolidados (HEMO 1 al 5)  

---

### Requerimientos No Funcionales
*   **¿Qué tiempo de respuesta esperan?:** Debe ser inmediato  
*   **¿Qué nivel de seguridad necesitan?:** Seguridad de nivel estricto por leyes de confidencialidad médica. Se descarta la creación de portales de autogestión para pacientes  
*   **¿Qué disponibilidad requiere el sistema?:** Disponibilidad 24/7  
*   **¿Se necesita auditoría?:** Sí. Cada usuario debe ingresar con credenciales para trazabilidad y corrección de errores  

---

### Reglas de Negocio
*   **¿Qué condiciones deben cumplirse siempre?:** Es obligatorio completar todos los datos estipulados  
*   **¿Qué validaciones existen?:** Edad mínima 16 años (con autorización), peso superior a 50 kg, hemoglobina entre 12,5 y 17,5, y presión arterial en rango establecido  
*   **¿Qué excepciones hay?:** Serología reactiva o dudosa implica exclusión temporal  

---

### Integraciones
*   **¿Con qué sistemas debe integrarse?:** Solo lectura del sistema de laboratorio del hospital  
*   **¿Existen APIs o servicios externos?:** Envío de certificados por WhatsApp o correo electrónico en PDF  

---

### Priorización
*   **¿Qué funcionalidades son imprescindibles?:** Gestión por DNI, aptitud del donante y estadísticas HEMO  
*   **¿Qué puede esperar?:** Control de inventario de insumos  

---

### Riesgos
*   **¿Qué riesgos técnicos existen?:** Dependencia de proveedores y posible abandono del sistema  
*   **¿Qué riesgos de adopción hay?:** Bajo riesgo, el personal está altamente capacitado digitalmente  

---

### Cierre
*   **¿Algo más que consideres importante?:** Alta voluntad de colaboración del equipo  
*   **¿Podemos validar esta información posteriormente?:** Sí, mediante revisiones y reuniones futuras  