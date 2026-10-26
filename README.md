# BUILD TOGETHER
### by Build Pa'l Norte

> *"El talento existe. Solo falta conectarlo."*

**BUILD TOGETHER** es una plataforma web en tiempo real diseñada para demostraciones en vivo durante talleres universitarios y eventos tecnológicos (con su primera edición en el **Instituto Tecnológico de Matamoros, México**).

Permite que una audiencia de más de 150 estudiantes de ingeniería se una simultáneamente desde sus teléfonos móviles mediante un código QR proyectado en pantalla. A medida que cada estudiante se registra en menos de 30 segundos, su nodo aparece animado en una visualización de red viva en el proyector y en sus dispositivos. Automáticamente, el motor de compatibilidad calcula y dibuja conexiones de valor entre estudiantes con habilidades complementarias e intereses compartidos.

---

## 🌟 Características Principales

1. **Experiencia de Estudiante (`/`)**
   - Hero impactante con métricas en vivo de builders y conexiones.
   - Onboarding ultra rápido (~30 segundos) con chips táctiles adaptados a los estándares de **Apple Human Interface Guidelines (HIG)** (objetivos táctiles mínimos de 44×44 pt).
   - Sin contraseñas ni correos invasivos: solo nombre/apodo, carrera, habilidades, intereses y objetivo.
   - Vista personalizada post-registro:
     - Nodo propio destacado en la red interactiva.
     - Tarjetas de hasta 3 colaboradores compatibles con la explicación transparente del match (ej. *"Programación + Diseño UX/UI: habilidades complementarias para crear producto"*).
     - Actualizaciones en tiempo real conforme nuevos creadores se unen.

2. **Experiencia de Proyector en Escenario (`/stage`)**
   - Vista inmersiva a pantalla completa optimizada para proyectores de 1080p y 4K en aulas magnas.
   - Grafo de fuerzas de alto rendimiento renderizado en Canvas (`react-force-graph-2d`) con 60 FPS, colores semánticos por disciplina de ingeniería, iniciales legibles y halos luminosos.
   - Animación de pulsos de partículas viajando a través de las nuevas conexiones.
   - Código QR dinámico de alto contraste escaneable a distancia, con la URL del despliegue visible.
   - Feed de actividad en tiempo real con transiciones elegantes.
   - Controles de proyector: Pantalla completa (Fullscreen API), Recentrador de red, Ajuste de zoom y Alternador de Sonido.

3. **Diseño de Sonido Sintetizado (Web Audio API)**
   - Creado 100% en código mediante la API nativa de Web Audio — **cero archivos de audio externos**.
   - **Sonido de Creación de Nodo**: Pop digital futurista y suave con rampa ascendente de frecuencia (320 Hz → 640 Hz, envolvente exponencial de 160 ms).
   - **Sonido de Nueva Conexión**: Campanilla electrónica armoniosa de dos tonos complementarios (E5 659.25 Hz + B5 987.77 Hz con filtro pasabanda cálido).
   - Deduplicación estricta por IDs de base de datos: no repite sonidos en recargas iniciales ni reconexiones.
   - Protección contra ráfagas de audio (rate-limiting) para mantener la elegancia sonora si 50 personas entran al mismo segundo.
   - Silenciado por defecto con interruptor accesible y persistente en `localStorage`.

4. **Motor de Conexión Determinista y Seguro ante Concurrencia**
   - Sistema de puntuación transparente y reproducible:
     - **+4 puntos**: por cada interés compartido.
     - **+3 puntos**: por emparejamientos de habilidades complementarias (ej. Programación + Diseño UX/UI, Robótica + Diseño 3D, IA + Análisis de Datos, Electrónica + Programación, Ingeniería + Negocios).
     - **+2 puntos**: por objetivos de colaboración compatibles (ej. Construir una startup + Encontrar equipo).
     - **+1 punto**: por misma disciplina de ingeniería.
   - Almacenamiento canónico unidireccional `source_id < target_id` con restricción `UNIQUE(event_id, source_id, target_id)`.
   - Transacción coordinada con bloqueo consultivo en PostgreSQL (`pg_advisory_xact_lock`) para serializar el emparejamiento concurrente sin colisiones ni condiciones de carrera.

5. **Panel de Anfitrión (`/host`)**
   - Protegido por la contraseña de anfitrión del taller (`tec2026`).
   - Monitoreo de participantes, conexiones y estado de sincronización.
   - Herramienta de reinicio transaccional para limpiar el taller y comenzar una nueva sesión sin afectar otros eventos.

---

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 (App Router) con Turbopack
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4 con paleta de diseño espacial curada:
  - Fondo: `#090E19`
  - Superficies elevadas: `#121C2B`
  - Acento primario (Menta / Teal): `#2CE6C6`
  - Acento secundario (Lavanda / Índigo): `#8290FF`
  - Acento cálido (Ámbar / Oro): `#FFB76A`
  - Texto principal: `#F8FAFC`
  - Texto secundario: `#98A6B8`
- **Base de Datos**: Neon PostgreSQL (Serverless)
- **ORM & Migraciones**: Drizzle ORM
- **Sincronización en Tiempo Real**: Neon Realtime SDK oficial con respaldo de sondeo ultra-rápido (1 segundo) consciente de visibilidad de pestaña y reconexión automática.
- **Grafo**: Canvas Force-Directed Graph (`react-force-graph-2d`)
- **Iconografía**: Lucide React
- **Animaciones**: Framer Motion & Canvas Confetti
- **QR**: `qrcode.react` (vectorial SVG de alto contraste)

---

## ⚙️ Configuración del Entorno

Copia `.env.example` a `.env.local` y pon la cadena de conexión de Neon:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL="postgresql://neondb_owner:password@ep-name-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

Esa es la única variable. Las migraciones usan el mismo valor y quitan el sufijo `-pooler` del host para hablar con Neon de forma directa. El código QR del proyector usa el origen de la página, y la contraseña de anfitrión es `tec2026`.

---

## 🚀 Inicio Rápido

1. **Instalar dependencias con pnpm**:
   ```bash
   pnpm install
   ```

2. **Inicializar tablas y evento predeterminado en Neon**:
   ```bash
   pnpm db:init
   ```
   *Esto creará las tablas `events`, `participants`, `connections` y garantizará que el evento `tec-matamoros-2026` ("Build Together — Tec de Matamoros") esté listo.*

3. **Iniciar servidor de desarrollo**:
   ```bash
   pnpm dev
   ```

4. **Abrir en tu navegador**:
   - Experiencia de Estudiante: [http://localhost:3000](http://localhost:3000)
   - Pantalla de Proyector: [http://localhost:3000/stage](http://localhost:3000/stage)
   - Panel de Organizador: [http://localhost:3000/host](http://localhost:3000/host)

---

## 🧪 Pruebas de Estrés y Concurrencia

Para verificar la robustez del sistema simulando **50 registros de estudiantes simultáneos**:

```bash
pnpm test:concurrency
```

El script ejecuta 50 peticiones HTTP concurrentes con identidades UUID únicas, disciplinas y habilidades variadas, y reporta:
- Tasa de éxito (100%)
- Ausencia de duplicados
- Ausencia de bordes o conexiones redundantes
- Consistencia del grafo en Neon

---

## 🚢 Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. Importa el proyecto en [Vercel](https://vercel.com).
3. En la configuración de variables de entorno de Vercel, agrega `DATABASE_URL` (la cadena pooled de Neon).
4. Haz clic en **Deploy**. ¡Listo para la demostración en vivo!
