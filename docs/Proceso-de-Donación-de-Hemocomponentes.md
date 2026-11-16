# Diagrama de Actividades: Proceso de Donación de Hemocomponentes

## 1. Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    %% Carriles / Actores
    subgraph Donante ["Donante <<External>>"]
        Inicio((Inicio)) --> Solicitar[Solicitar Donar Hemocomponente]
        Solicitar --> DNI[Dni]
    end

    subgraph Hemoterapia ["Área Hemoterapia - Técnico"]
        DNI --> Verificar[Verificación de identidad y antecedentes]
        
        %% Interacción sistema 1
        Verificar -.-> SysPersona1["[Persona] Ingresa el DNI, puede ver el historial y si puede donar o no y los datos de la persona"]

        Verificar --> Dec1{¿Presenta serología o indicador?}
        
        Dec1 -- "Presenta Serología o indicador Positiva o Dudosa" --> InfExcl[Informar Exclusión]
        InfExcl -.- NotaExcl["Nota: Puede ser Permanente o Temporal si se confirma que el dudoso fue falsa alarma"]
        InfExcl --> Fin1(((Fin)))

        Dec1 -- "No Presenta nada" --> Entrevista[Entrevista confidencial]
        
        Entrevista --> Dec2{¿Pasa la entrevista?}
        Dec2 -- "No pasa la entrevista (Excluido)" --> Fin2(((Fin)))
        Dec2 -- "Pasa La Entrevista" --> Dec3{¿Se conoce grupo y factor?}

        Dec3 -- "No se Conoce el grupo y Factor" --> ObtenerGF[Obtener Grupo y Factor]
        ObtenerGF -.-> SysPersona2["[Persona] Actualiza el grupo y factor"]
        ObtenerGF --> Merge1(( ))

        Dec3 -- "Se Conoce grupo y factor" --> Merge1
        
        Merge1 --> EvalParam[Evaluación de hemoglobina y otros parámetros]
        
        EvalParam --> Dec4{¿Cumple los parámetros?}
        Dec4 -- "No cumple los parámetros" --> InformarNo[Informar]
        InformarNo --> Fin3(((Fin)))

        Dec4 -- "Se cumple" --> AnotarParam[Anotar Parámetros en Excel]
        AnotarParam -.- NotaParam["Nota: Peso, Tensión Arterial, Hemoglobina"]
        AnotarParam -.-> SysDonacion1["[Donación] Registro de parámetros"]

        AnotarParam --> IniciarProc[Iniciar Proceso de Obtención de Hemocomponente]
        
        IniciarProc --> Rotulado[Identificación y rotulado de muestras y bolsas]
        Rotulado -.- NotaRot["Nota: NyA, Lugar, Fecha Nacimiento, Dirección, Teléfono, Fecha Donación"]
        Rotulado -.-> SysDonacion2["[Donación] Registro de identificación y rotulado"]

        Rotulado --> AnotarObs[Anotar Observaciones del paciente durante la Donación]
        AnotarObs -.-> SysDonacion3["[Donación] Registro de observaciones"]

        AnotarObs --> Despedir[Despedir Paciente]
        Despedir --> Fin4(((Fin)))
    end