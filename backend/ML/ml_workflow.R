# ==============================================================================
# FLUJO DE MACHINE LEARNING EN R (VERSIÓN DIDÁCTICA)
# ==============================================================================
# Este script ilustra cómo se implementa el flujo de trabajo de Machine Learning
# de SalesCast utilizando el lenguaje de programación R. 
# Es puramente educativo y NO interfiere con el backend actual en Python.
# 
# Equivalencias principales:
# Python (Pandas) -> R (dplyr, tidyr)
# Python (datetime) -> R (lubridate)
# Python (joblib) -> R (saveRDS / readRDS)
# ==============================================================================

# Cargar librerías necesarias
# Si no las tienes, instala con: install.packages(c("readr", "dplyr", "lubridate", "lightgbm", "tidyr"))
library(readr)     # Para leer archivos CSV rápidamente
library(dplyr)     # Para manipulación de datos (equivalente a Pandas)
library(lubridate) # Para el manejo de fechas
library(lightgbm)  # Para el modelo de Machine Learning
library(tidyr)     # Para limpieza de datos (ej. replace_na)

# ------------------------------------------------------------------------------
# 1. FUNCIÓN DE ENTRENAMIENTO
# Simula a `train_lightgbm_model` de ml_service.py
# ------------------------------------------------------------------------------
train_lightgbm_model_r <- function(dataset_path, model_path) {
  cat("Iniciando el entrenamiento del modelo en R...\n")
  
  # 1. Leer el conjunto de datos
  # Equivale a pd.read_csv() en Python
  df <- read_csv(dataset_path, show_col_types = FALSE)
  
  # 2. Limpieza de Datos
  df <- df %>%
    # Convertir la columna de fecha a tipo Date (pd.to_datetime)
    mutate(date = as.Date(date)) %>%
    # Eliminar filas donde la fecha o las ventas sean nulas (df.dropna)
    filter(!is.na(date), !is.na(sales)) %>%
    # Rellenar valores nulos (NAs) en otras columnas (fillna)
    mutate(
      store_nbr = tidyr::replace_na(store_nbr, -1),
      family = as.factor(tidyr::replace_na(as.character(family), "UNKNOWN")),
      onpromotion = tidyr::replace_na(onpromotion, 0)
    )
    
  # 3. Extracción de Características Temporales (Feature Engineering)
  # Esto ayuda al modelo a entender la estacionalidad (ej. df['date'].dt.day)
  df <- df %>%
    mutate(
      day = day(date),
      month = month(date),
      year = year(date),
      dayofweek = wday(date) # 1 = Domingo, 2 = Lunes, etc.
    ) %>%
    arrange(date) # Ordenar cronológicamente (df.sort_values)
    
  # Guardar la última fecha conocida para poder proyectar hacia el futuro
  last_date <- max(df$date)
  
  # Obtener las combinaciones únicas de tienda y producto (df.drop_duplicates)
  unique_combinations <- df %>% 
    select(store_nbr, family) %>% 
    distinct()
    
  # 4. Preparación para el entrenamiento
  target <- "sales"
  
  # LightGBM en R requiere que las variables categóricas sean convertidas a enteros
  # En Python, el Wrapper de Scikit-Learn lo maneja casi automático, aquí lo hacemos manual:
  df_train <- df %>% mutate(family_num = as.integer(family))
  features_lgb <- c("store_nbr", "family_num", "onpromotion", "day", "month", "year", "dayofweek")
  
  # Crear matrices requeridas por LightGBM
  X_train <- as.matrix(df_train[, features_lgb])
  y_train <- df_train[[target]]
  
  # Crear el Dataset nativo de LightGBM
  dtrain <- lgb.Dataset(data = X_train, label = y_train)
  
  # 5. Entrenar el modelo
  # Equivale a lgb.LGBMRegressor en Python
  params <- list(
    objective = "regression",
    metric = "rmse",
    seed = 42
  )
  
  cat("Entrenando el árbol LightGBM...\n")
  model <- lgb.train(
    params = params,
    data = dtrain,
    nrounds = 100, # Número de árboles (n_estimators=100 en Python)
    verbose = -1
  )
  
  # 6. Guardar el modelo y los metadatos
  # En R usamos saveRDS que es el equivalente funcional de joblib.dump de Python
  
  # Crear directorio si no existe
  dir.create(dirname(model_path), recursive = TRUE, showWarnings = FALSE)
  
  # Los modelos de LightGBM en R se guardan usando su propia función binaria
  model_file_path <- paste0(model_path, ".lgb")
  lgb.save(model, model_file_path)
  
  # Empaquetamos la metadata
  model_metadata <- list(
    model_file = model_file_path,
    unique_combinations = unique_combinations,
    last_date = last_date,
    features = features_lgb,
    levels_family = levels(df$family) # Necesario para decodificar factores luego
  )
  
  # Guardamos la metadata
  saveRDS(model_metadata, file = model_path)
  
  cat("Modelo y metadata guardados exitosamente en:", model_path, "\n")
  return(model_metadata)
}

# ------------------------------------------------------------------------------
# 2. FUNCIÓN DE PREDICCIÓN
# Simula a `generate_predictions` de ml_service.py
# ------------------------------------------------------------------------------
generate_predictions_r <- function(model_path, days_to_predict) {
  cat("Generando pronósticos para los próximos", days_to_predict, "días...\n")
  
  # 1. Cargar metadatos (equivale a joblib.load)
  if (!file.exists(model_path)) {
    stop("No se encontró el archivo del modelo.")
  }
  
  model_metadata <- readRDS(model_path)
  
  # Cargar el modelo de LightGBM desde su archivo específico
  model <- lgb.load(model_metadata$model_file)
  
  unique_combinations <- model_metadata$unique_combinations
  last_date <- as.Date(model_metadata$last_date)
  features_lgb <- model_metadata$features
  levels_family <- model_metadata$levels_family
  
  # 2. Generar fechas futuras (equivale a list comprehensions en Python)
  future_dates <- last_date + seq(1, days_to_predict)
  
  # Lista para almacenar los resultados
  predictions_list <- list()
  
  for (date in future_dates) {
    # Convertir el número a objeto de fecha
    date_obj <- as.Date(date, origin="1970-01-01")
    
    # Crear un dataframe para esta fecha con todas las combinaciones existentes
    pred_df <- unique_combinations %>%
      mutate(
        date = date_obj,
        onpromotion = 0, # Asumimos 0 promoción a futuro para simplificar
        day = day(date_obj),
        month = month(date_obj),
        year = year(date_obj),
        dayofweek = wday(date_obj),
        # Recrear la versión numérica de 'family' que espera el modelo
        family_num = as.integer(factor(family, levels = levels_family))
      )
      
    # Preparar matriz de características para predecir
    X_pred <- as.matrix(pred_df[, features_lgb])
    
    # 3. Realizar predicción
    preds <- predict(model, X_pred)
    
    # Asegurar que no haya ventas negativas (equivale a np.maximum(preds, 0))
    preds <- pmax(preds, 0)
    pred_df$predicted_sales <- preds
    
    # 4. Formatear el resultado como una lista de diccionarios/listas
    # En Python armábamos una lista de diccionarios, aquí simulamos lo mismo
    for (i in 1:nrow(pred_df)) {
      row <- pred_df[i, ]
      pred_item <- list(
        target_date = as.character(row$date),
        store_nbr = as.integer(row$store_nbr),
        family = as.character(row$family),
        predicted_value = as.numeric(row$predicted_sales)
      )
      predictions_list <- append(predictions_list, list(pred_item))
    }
  }
  
  cat("Predicciones completadas.\n")
  return(predictions_list)
}

# ==============================================================================
# EJEMPLO DE USO (Simulación de la API)
# ==============================================================================
# Si quisieras probar este script localmente, podrías descomentar estas líneas:
#
# cat("\n--- PRUEBA DEL FLUJO ---\n")
#
# # 1. Entrenar
# metadata <- train_lightgbm_model_r(
#    dataset_path = "ruta/a/tu/dataset.csv", 
#    model_path = "modelos/mi_modelo.rds"
# )
#
# # 2. Predecir
# resultados <- generate_predictions_r(
#    model_path = "modelos/mi_modelo.rds", 
#    days_to_predict = 7
# )
#
# # 3. Mostrar primeros resultados
# print(head(resultados))
