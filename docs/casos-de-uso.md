# Actores del Sistema

- **Tecnico / Licenciado en Hemoterapia:** Usuario con permisos de edicion y carga de datos que realiza las operaciones diarias, pruebas de laboratorio y registros (conformado en el hospital por Facundo, Mariela, Paula, Aldana y Valeria).
- **Usuario de Consulta (Personal de Maternidad):** Usuario perteneciente a otro departamento del hospital que interactua con el sistema de forma pasiva (permisos de solo lectura, no como editor) para visualizar informacion.

---

# Casos de Uso (CU)

**CU-01: Consultar historial por identificador unico (DNI)**
- **Actor:** Tecnico / Licenciado en Hemoterapia.
- **Descripcion:** El usuario ingresa unicamente el DNI de la persona en el sistema. El sistema realiza una busqueda y despliega el historial clinico completo de la persona, mostrando de forma unificada las transfusiones recibidas (como paciente), las donaciones realizadas (como donante) y los antecedentes obstetricos (como gestante), si existieran. Una misma persona puede tener registros en multiples categorias sin estar acoplada a un solo tipo. Esto permite ahorrar los 20 minutos de entrevista previa al contar con toda la informacion historica al instante.

**CU-02: Registrar intervenciones de la Unidad Transfusional**
- **Actor:** Tecnico / Licenciado en Hemoterapia.
- **Descripcion:** El usuario registra los datos de un paciente que requiere una transfusion. Ingresa las determinaciones realizadas (grupo y factor, prueba de Coombs directa, compatibilidad) y registra el hemocomponente utilizado (globulos rojos, plasma, plaquetas o crioprecipitado).

**CU-03: Validar estado y aptitud del donante (Sistema de Semaforo)**
- **Actor:** Tecnico / Licenciado en Hemoterapia.
- **Descripcion:** Al ingresar el DNI de un donante, el sistema cruza la informacion y emite una alerta visual en forma de semaforo. Indica Verde si esta apto para donar, Rojo si esta excluido permanentemente por una serologia positiva (ej. Hepatitis B, VIH, Chagas) o Amarillo si hay dudas y se debe tomar una segunda muestra.

**CU-04: Gestionar Posta Fija (Donantes) y controles fisicos**
- **Actor:** Tecnico / Licenciado en Hemoterapia.
- **Descripcion:** El sistema permite el registro de los donantes voluntarios o de reposicion. El usuario carga los datos de la entrevista previa y los controles fisicos obligatorios como peso, tension arterial (TA) y hemoglobina. Tambien permite registrar si ocurrio alguna reaccion adversa durante la extraccion, como una lipotimia o desmayo.

**CU-05: Gestionar estudios de Gestantes y Recien Nacidos**
- **Actor:** Tecnico / Licenciado en Hemoterapia.
- **Descripcion:** El usuario carga en el sistema los antecedentes obstetricos de las mujeres embarazadas. Registra pruebas como grupo y factor, prueba de Coombs indirecta, compatibilidad conyugal (estudiando al padre) y, finalmente, los estudios realizados al recien nacido.

**CU-06: Emitir y distribuir constancias y certificados**
- **Actor:** Tecnico / Licenciado en Hemoterapia.
- **Descripcion:** El usuario solicita la generacion de constancias de donacion (para el ambito laboral) o certificados de grupo y factor, eliminando el uso de sellos fisicos y llenado a mano. El sistema genera un documento en PDF que puede ser enviado directamente al paciente a traves de WhatsApp o correo electronico.

**CU-07: Generar informes estadisticos (Planillas HEMO)**
- **Actor:** Tecnico / Licenciado en Hemoterapia.
- **Descripcion:** El sistema consolida automaticamente los datos para extraer los reportes estadisticos obligatorios requeridos por el Instituto de Hemoterapia de la Provincia (Planillas HEMO 1, 2, 3, 4 y 5). El reporte detalla donantes atendidos, descartes, hemocomponentes recibidos y transfundidos, reacciones adversas y gestantes estudiadas.

**CU-08: Consultar estudios de pacientes en tiempo real**
- **Actor:** Usuario de Consulta (Personal de Maternidad).
- **Descripcion:** El personal de Maternidad accede al sistema con permisos de solo lectura. Puede buscar a una paciente (gestante) para visualizar en tiempo real si el estudio de grupo y factor ya esta finalizado, evitando tener que llamar por telefono al servicio de Hemoterapia durante los fines de semana.
