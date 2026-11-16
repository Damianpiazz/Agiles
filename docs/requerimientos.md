# Listado de Requerimientos Funcionales (RF)

*   **RF0001 - Búsqueda unificada por DNI:** El sistema debe permitir la búsqueda inmediata de los individuos ingresando únicamente su número de Documento Nacional de Identidad (DNI).

*   **RF0002 - Visualización de historiales categorizados:** El sistema debe desplegar automáticamente el historial correspondiente según el tipo de persona registrada: historial de transfusiones (pacientes), historial de donaciones (donantes) o antecedentes obstétricos y de recién nacidos (gestantes).

*   **RF0003 - Gestión de Unidad Transfusional:** El sistema debe permitir registrar las extracciones de muestras, los resultados de grupo y factor, las pruebas de compatibilidad y los detalles exactos de los hemocomponentes transfundidos a cada paciente.

*   **RF0004 - Gestión de Posta Fija (Donantes):** El sistema debe posibilitar el registro completo de cada donación, incluyendo la fecha, datos personales, historial de serología y cualquier reacción adversa ocurrida durante la extracción (ej. lipotimias).

*   **RF0005 - Gestión de Gestantes:** El sistema debe permitir cargar y consultar los estudios realizados a las embarazadas, como las pruebas de grupo y factor, compatibilidad conyugal y estudios posteriores en los recién nacidos.

*   **RF0006 - Sistema de alertas visuales (Semáforo):** Al ingresar el DNI de un donante, el sistema debe indicar su estado mediante un semáforo visual: verde (apto para donar), amarillo (dudas a rever) y rojo (excluido definitivamente por serología positiva previa).

*   **RF0007 - Validación biomédica de donantes:** El sistema debe verificar que el donante cumpla con las reglas físicas obligatorias para donar: edad mayor a 16 años (con autorización), peso superior a 50 kg, hemoglobina entre 12,5 y 17,5, y tensión arterial dentro de los límites de 100/110 y 170.

*   **RF0008 - Bloqueo temporal por serología dudosa:** El sistema debe inhabilitar temporalmente a los donantes que arrojen un resultado dudoso o reactivo, marcándolos en amarillo hasta que se evalúe una segunda muestra clínica.

*   **RF0009 - Emisión automática de constancias:** El sistema debe generar e imprimir automáticamente las constancias de donación y los certificados de grupo y factor completando los datos del donante sin necesidad de usar sellos manuales.

*   **RF0010 - Envío digital de certificados:** El sistema debe contar con la funcionalidad para enviar los certificados médicos generados directamente al dispositivo del paciente a través de WhatsApp o correo electrónico.

*   **RF0011 - Extracción de reportes estadísticos:** El sistema debe consolidar automáticamente los datos cargados para generar las estadísticas rigurosas requeridas por la Provincia de Buenos Aires (Planillas HEMO 1, 2, 3, 4 y 5) detallando donantes atendidos, hemocomponentes transfundidos, unidades descartadas, etc.

*   **RF0012 - Autenticación y trazabilidad de carga:** El sistema debe exigir el ingreso mediante nombre, apellido y contraseña personal para garantizar que quede registrado qué técnico cargó cada dato y poder rastrear errores de carga humanos.

*   **RF0013 - Control de completitud de datos:** El sistema debe validar y obligar a completar todos los campos exigidos por las normas técnicas administrativas provinciales antes de permitir guardar el registro (simulando la exigencia de los libros físicos oficiales).

*   **RF0014 - Acceso de solo lectura para áreas externas:** El sistema debe proporcionar vistas de solo lectura para servicios como Maternidad, permitiendo a sus profesionales visualizar en tiempo real si los estudios de sus pacientes ya fueron completados sin otorgarles permisos de edición.