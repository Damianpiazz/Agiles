# Diagrama Entidad-Relación (DER) - Sistema Florhema

## 1. Diagrama Visual (Mermaid)

```mermaid
erDiagram
    %% ==========================================
    %% MÓDULO DE PERSONAS Y UBICACIÓN
    %% ==========================================
    PROVINCIAS {
        int id PK
        string nombre
    }

    CIUDADES {
        int id PK
        string nombre
        string codigo_postal
        int id_provincia FK
    }

    DOMICILIOS {
        int id PK
        string calle
        string numero
        string piso
        string departamento
        int id_ciudad FK
    }

    GYF {
        int id PK
        string grupo
        string factor
    }

    PERSONAS {
        int id PK
        string dni
        string nombre
        string apellido
        date fecha_nacimiento
        string lugar_nacimiento
        int id_direccion FK
        int id_grupo_factor FK
    }

    PROVINCIAS ||--o{ CIUDADES : "contiene"
    CIUDADES ||--o{ DOMICILIOS : "ubica"
    DOMICILIOS ||--o{ PERSONAS : "reside en"
    GYF ||--o{ PERSONAS : "clasifica"

    %% ==========================================
    %% MÓDULO DE DONACIONES Y SEROLOGÍA
    %% ==========================================
    DONACIONES {
        int id PK
        float peso
        string tension_arterial
        float hemoglobina
        date fecha
        boolean voluntario
        boolean reposicion
        boolean autoexcluido
        string observaciones
        int id_persona FK
    }

    SEROLOGIAS {
        int id PK
        date fecha
        time hora
        string observaciones
    }

    SEROLOGIA_DONACIONES {
        int id PK
        int id_serologia FK
        int id_donacion FK
    }

    DETERMINACIONES_SEROLOGICAS {
        int id PK
        string nombre
    }

    SEROLOGIA_RESULTADOS {
        int id PK
        string resultado
        string valor
        string unidad
        string observacion
        int id_serologia FK
        int id_determinacion_serologica FK
    }

    PERSONAS ||--o{ DONACIONES : "realiza"
    DONACIONES ||--o{ SEROLOGIA_DONACIONES : "se analiza en"
    SEROLOGIAS ||--o{ SEROLOGIA_DONACIONES : "corresponde a"
    SEROLOGIAS ||--o{ SEROLOGIA_RESULTADOS : "detalla"
    DETERMINACIONES_SEROLOGICAS ||--o{ SEROLOGIA_RESULTADOS : "define"

    %% ==========================================
    %% MÓDULO DE INMUNOHEMATOLOGÍA (PCI / PCD)
    %% ==========================================
    PCI {
        int id PK
        date fecha
        time hora
        string observaciones
    }

    PCI_DONACIONES {
        int id PK
        int id_pci FK
        int id_donacion FK
    }

    ANTIGENO {
        int id PK
        string nombre
    }

    PCI_RESULTADO {
        int id PK
        string resultado
        string intensidad
        string observacion
        int id_pci FK
        int id_antigeno FK
    }

    PCD {
        int id PK
        date fecha
        time hora
        string observaciones
    }

    DETERMINACION_PCD {
        int id PK
        string nombre
    }

    PCD_RESULTADO {
        int id PK
        string resultado
        string valor
        string unidad
        string observacion
        int id_pcd FK
        int id_determinacion_pcd FK "Sugerida"
    }

    DONACIONES ||--o{ PCI_DONACIONES : "requiere"
    PCI ||--o{ PCI_DONACIONES : "evalúa"
    PCI ||--o{ PCI_RESULTADO : "arroja"
    ANTIGENO ||--o{ PCI_RESULTADO : "detecta"
    PCD ||--o{ PCD_RESULTADO : "arroja"
    DETERMINACION_PCD ||--o{ PCD_RESULTADO : "clasifica (implícita)"

    %% ==========================================
    %% MÓDULO GESTANTES Y RECIÉN NACIDOS
    %% ==========================================
    ESTUDIOS_INMUNOHEMATOLOGICOS_GESTANTES {
        int id PK
        string numero
        date fecha
        int id_persona FK
    }

    PCI_INMUNOHEMATOLOGICOS_GESTANTES {
        int id PK
        int id_pci FK
        int id_estudios_inmunohematologicos_gestantes FK
    }

    ESTUDIOS_INMUNOHEMATOLOGICOS_RN {
        int id PK
        string numero
        date fecha
        string rn
        string dni
        int id_madre FK
        int id_grupo_factor FK
        string IP_anti_D
        int id_pcd FK
        int id_pci FK
        string observaciones
    }

    PERSONAS ||--o{ ESTUDIOS_INMUNOHEMATOLOGICOS_GESTANTES : "gestante"
    ESTUDIOS_INMUNOHEMATOLOGICOS_GESTANTES ||--o{ PCI_INMUNOHEMATOLOGICOS_GESTANTES : "asocia"
    PCI ||--o{ PCI_INMUNOHEMATOLOGICOS_GESTANTES : "vincula"
    PERSONAS ||--o{ ESTUDIOS_INMUNOHEMATOLOGICOS_RN : "madre (id_madre)"
    GYF ||--o{ ESTUDIOS_INMUNOHEMATOLOGICOS_RN : "grupo/factor RN"
    PCD ||--o{ ESTUDIOS_INMUNOHEMATOLOGICOS_RN : "evalúa PCD"
    PCI ||--o{ ESTUDIOS_INMUNOHEMATOLOGICOS_RN : "evalúa PCI"

    %% ==========================================
    %% MÓDULO SANGRÍAS TERAPÉUTICAS Y TRANSFUSIONES
    %% ==========================================
    OBRA_SOCIAL {
        int id PK
        string nombre
    }

    MEDICOS {
        int id PK
        string nombre
    }

    SANGRIAS_TERAPEUTICAS {
        int id PK
        string diagnostico
        string extraccion
        string reposicion
        int id_persona FK
        int id_obra_social FK
        int id_medico FK
    }

    FENOTIPOS {
        int id PK
        string nombre
    }

    TIPO_TRANSFUSION {
        int id PK
        string nombre
    }

    TRANSFUSIONES {
        int id PK
        string numero_o_lote
        string RT
        string tolerancia
        string pci
        string pcd
        string anticuerpo
        int id_fenotipo_1 FK
        int id_grupo_factor FK
        int id_fenotipo_2 FK
        int id_tipo_transfusion FK
    }

    PERSONAS ||--o{ SANGRIAS_TERAPEUTICAS : "paciente"
    OBRA_SOCIAL ||--o{ SANGRIAS_TERAPEUTICAS : "cubre"
    MEDICOS ||--o{ SANGRIAS_TERAPEUTICAS : "indica"
    FENOTIPOS ||--o{ TRANSFUSIONES : "fenotipo 1"
    FENOTIPOS ||--o{ TRANSFUSIONES : "fenotipo 2"
    GYF ||--o{ TRANSFUSIONES : "grupo/factor"
    TIPO_TRANSFUSION ||--o{ TRANSFUSIONES : "categoriza"