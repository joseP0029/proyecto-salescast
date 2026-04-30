# 📈 SalesCast AI

SalesCast es una plataforma web inteligente de pronóstico de ventas diseñada para ayudar a las organizaciones a predecir la demanda de sus productos utilizando Machine Learning. 

La plataforma permite a las empresas subir su historial de ventas, entrenar modelos predictivos personalizados y visualizar proyecciones de ventas futuras mediante una interfaz gráfica interactiva y moderna.

---

## 🚀 Características Principales

*   🔐 **Autenticación y Multitenencia**: Sistema de usuarios por organizaciones asegurado mediante tokens JWT. Cada empresa tiene su propio espacio de trabajo aislado (datasets y modelos).
*   📂 **Gestión de Datos**: Sube tus datos históricos en formato `.csv` directamente desde el navegador con soporte para archivos grandes y almacenamiento seguro en el servidor.
*   🧠 **Motor de Machine Learning (LightGBM)**: Entrenamiento automatizado de modelos basados en LightGBM, optimizados para extraer patrones estacionales, tendencias no lineales y características cíclicas (día de la semana, mes, etc.).
*   📊 **Visualización Interactiva**: Genera pronósticos a 7, 15, 30 o 90 días. Visualiza y filtra los resultados dinámicamente por tienda utilizando gráficas interactivas construidas con `recharts`.

---

## 🛠 Stack Tecnológico

El proyecto está dividido en dos partes principales:

### Frontend (Next.js)
*   **Framework**: Next.js (App Router) + React
*   **Estilos**: Tailwind CSS para un diseño oscuro, moderno y responsivo
*   **Gráficas**: Recharts
*   **Iconos**: Lucide React

### Backend (FastAPI)
*   **Framework**: FastAPI (Python)
*   **Machine Learning**: LightGBM, Pandas, Scikit-learn, Numpy
*   **Base de Datos**: SQLAlchemy (ORM)
*   **Autenticación**: Passlib, python-jose (JWT)

---

## 📋 Estructura de Datos (CSV)

El sistema espera un archivo CSV de ventas históricas con al menos las siguientes columnas:

*   `id`: Identificador único de la fila.
*   `date`: Fecha de la venta (ej. `YYYY-MM-DD`).
*   `store_nbr`: Identificador numérico de la tienda o sucursal.
*   `family`: Categoría del producto vendido.
*   `sales`: Número de ventas o ingresos registrados.
*   `onpromotion`: (Opcional) Indicador numérico de promociones.

---

## ⚙️ Configuración y Despliegue Local

### 1. Configuración del Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Asegúrate de configurar tus variables de entorno si es necesario, y luego inicia el servidor:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Configuración del Frontend

Abre otra terminal y navega al directorio del frontend:

```bash
cd frontend
npm install
```

Crea un archivo `.env.local` en la raíz del frontend y define la URL del backend:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Inicia el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

