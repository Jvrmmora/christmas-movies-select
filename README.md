<div align="center">

<img src="docs/logo.svg" alt="Navidad en casa" width="88" height="88" />

# Navidad en casa

**Sus películas de Navidad en un solo lugar: dónde verlas en Colombia, cuáles ya vieron y un calendario de adviento con una película por día. Cada casa tiene sus propios perfiles, con avatares navideños.**
Next.js 16 · MongoDB Atlas · datos automáticos de JustWatch, sin IA ni API keys de pago.

![Next.js](https://img.shields.io/badge/Next.js-16.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248)
![Tests](https://img.shields.io/badge/tests-64%20pasan-1e9e48)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue)

<img src="docs/perfiles.jpg" alt="Pantalla «¿Quién está viendo la peli?» con cuatro perfiles: Ana (Santi), Leo (Rudolfo), Sofi (Pino) y Mateo (Jengi)" width="760" />

</div>

> *Escriben «Home Alone 1990» y la app trae «Mi pobre angelito» con póster, sinopsis, IMDb 7,8, Rotten Tomatoes 66 % y el botón «Ver en Disney+». Y en el calendario queda el avatar de quien la sugirió.*

## Contenido

- [Qué hace](#qué-hace)
- [Casas, perfiles y límites](#casas-perfiles-y-límites)
- [Cómo funciona](#cómo-funciona)
- [Requisitos](#requisitos)
- [Variables de entorno](#variables-de-entorno)
- [Probarlo en local](#probarlo-en-local)
- [Configurar MongoDB Atlas](#configurar-mongodb-atlas)
- [Desplegar en Vercel](#desplegar-en-vercel)
- [Administrar las casas](#administrar-las-casas)
- [Decisiones técnicas](#decisiones-técnicas)
- [Modelo de datos](#modelo-de-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)
- [Hoja de ruta](#hoja-de-ruta)
- [Licencia y avisos](#licencia-y-avisos)

## Qué hace

- **Cuentas, casas y perfiles, como en Netflix o la Switch.** Cada persona entra con **su correo y su clave**. Cada familia tiene su **casa** (su propia lista y calendario) y se suman a ella con un **link de invitación**. Dentro de la casa cada cuenta tiene su **perfil**, y puede haber perfiles sin cuenta para los niños. El perfil se usa para saludar y para saber quién hace qué.
- **Clásicas para empezar.** Si la casa está vacía, después de crear el perfil se ofrecen 8 clásicas (Mi pobre angelito 1 y 2, El Grinch, Elf, El expreso polar, Realmente amor, Klaus y Santa Cláusula). Ninguna viene marcada y se puede saltar.
- **Avatares navideños con personalidad.** Doce personajes dibujados en SVG (Santi, Rudolfo, Nieves, Jengi, Duli, Pino, Pingu, Estrellita, Cascanueces, Noela, Ángel y Osi), cada uno con su carácter y su frase. Se personalizan con color de fondo y accesorio (gorro, bufanda, gafas, moño, estrella) y hay un botón «Sorpréndeme».
- **Quién agregó, quién sugirió.** Cada película guarda quién la agregó, quién la sugirió (pueden ser personas distintas) y quién la editó por última vez. Se ve en el detalle («Sugerida por Rudolfo · agregada por Ana»), en las tarjetas, en el filtro «Sugerida por» y como un avatar colgando bajo cada puerta del calendario. Con el modo sorpresa, las puertas cerradas no lo muestran para no dar pistas.
- **Agregar con nombre y año.** Busca en JustWatch Colombia y trae el título latinoamericano, el póster, la sinopsis, los géneros, la duración, IMDb, el Tomatómetro (con Certified Fresh) y las plataformas con enlace directo a la película. Todo se puede editar a mano, incluida la opción «Sin plataforma».
- **Sin duplicados.** Si buscan una película que ya tienen, el resultado sale bloqueado con el aviso «Ya lo tienes en tu biblioteca» y un enlace para verla. Se detecta por el id de JustWatch, el de IMDb o título y año, así que también atrapa las escritas a mano. Al importar una lista pasa lo mismo: esas filas quedan desmarcadas.
- **Sugeridas.** Una página con películas navideñas conocidas (clásicas y recientes) que todavía no están en su lista, con sus puntuaciones y plataformas en Colombia. Al tocar una película se abre su detalle (sinopsis, géneros, puntuaciones, todas las plataformas y el tráiler) antes de agregarla; también se agregan con un toque desde la tarjeta. Al final, «Cargar más sugeridas» trae otras películas navideñas (buscadas en JustWatch, sin repetir las que ya salieron ni las que ya tienen), y se puede filtrar por plataforma u ordenar por IMDb, Rotten Tomatoes o año.
- **Importar una lista completa.** Pegan «Título (año)» una por línea, revisan las coincidencias dudosas y guardan todas de una vez.
- **Galería.** El botón «Explorar en galería» (o el ícono de cada tarjeta) abre un carrusel casi a pantalla completa para recorrer sus películas: carátula, año, puntuaciones y plataformas de la que está al centro. Se navega con las flechas, con ← → del teclado o deslizando, y sigue el orden y los filtros de la lista.
- **Marcar como vista** con un check verde animado y un sonido de campana (Web Audio, sin archivos). También tienen favoritas, calificación propia de 1 a 5 estrellas y notas.
- **Calendario de adviento.** Se arma en dos pasos. **1. Rango:** eligen «Desde hoy», el 1 de noviembre, el 1 de diciembre o una fecha propia (termina el 24 de diciembre) y ven cuántos días quedan frente a sus películas pendientes. **2. Organizar:** una vista ancha con la cuadrícula del mes y las carátulas sin día; el rango queda como una etiqueta con «Cambiar». Las películas se arrastran a cada día. Tiene modo sorpresa (los días futuros quedan cerrados como regalos), «Repartir automáticamente» (asigna todas las pendientes aunque cambien el rango de fechas), «Mezclar» y «Vaciar» con opción de deshacer. Los contadores de arriba distinguen días libres de películas sin día, y las películas vistas que no tienen día aparecen en el panel lateral para que ninguna quede escondida. Al abrir una puerta se ve la película en grande: póster, sinopsis completa, puntuaciones y todas las plataformas con su enlace.
- **Inicio que saluda** a quien está viendo («Buenas noches, Ana») con su personaje y su frase, muestra una cuenta regresiva compacta hasta la medianoche de Navidad (hora de ustedes, con días, horas, minutos y segundos) y la película que toca hoy.
- **Diseño navideño:** logo de árbol de Navidad, modo **automático** (oscuro de 6 p. m. a 6 a. m. según la hora del dispositivo) con menú Automático / Claro / Oscuro y transición de círculo, nieve, guirnalda de luces, tipografía de Apple (SF Pro Display y Text, con Inter de respaldo), botón flotante «Agregar», un árbol de Navidad animado en las pantallas de entrar y crear casa, pie de página con créditos y vista móvil con barra de pestañas.

<div align="center">
<img src="docs/avatar-editor.jpg" alt="Editor de perfil: vista previa grande de Santi, doce personajes, ocho colores de fondo y accesorios; «Gorro» está desactivado porque Santi ya trae el suyo" width="760" />
</div>

<div align="center">
<img src="docs/inicio-escritorio.jpg" alt="Inicio: saludo con el avatar de Ana, cuenta regresiva a Navidad y progreso" width="760" />
</div>

<div align="center">
<img src="docs/inicio-movil.png" alt="Versión móvil del inicio" width="260" />
&nbsp;&nbsp;
<img src="docs/calendario.jpg" alt="Calendario de adviento: cada puerta lleva abajo el avatar de quien sugirió la película, el día de hoy resaltado y las vistas con check verde" width="480" />
</div>

<div align="center">
<img src="docs/peliculas.jpg" alt="Lista de películas con filtros por estado, plataforma, género y «Sugerida por»" width="760" />
</div>

## Casas, perfiles y límites

**Una cuenta** es una persona: correo y clave, en la colección `users`. **Una casa** es lo que comparte la familia: nombre, lista, calendario y un **código de invitación** (`NAVI-XXXX-XXXX`). **Un perfil** es cada persona dentro de la casa (hasta 8): el de cada cuenta queda ligado a ella y solo esa cuenta puede usarlo; los perfiles sin cuenta (los niños) los puede usar cualquiera de la casa.

**Registrarse tiene dos pasos.** En `/unirse` se pide solo **correo y clave**. Luego, en `/bienvenida`, se **crea una casa** (solo el nombre) o se **une a una** con su código. El link `/unirse/NAVI-XXXX-XXXX` lleva el código hasta el segundo paso y muestra «Te invitaron a …». Al entrar a una casa que ya tiene perfiles se pregunta «¿Cuál eres tú?» para tomar uno existente o crear el propio. Cada cuenta pertenece a una sola casa.

**Entrar** es con correo y clave; si la cuenta ya tiene perfil, se elige solo.

**Olvidé la clave.** En `/recuperar` escriben su correo y reciben (con [nodemailer](https://nodemailer.com)) un código de 6 números que vence en 15 minutos; con él eligen la clave nueva. La respuesta es la misma exista o no la cuenta. El código se guarda solo como hash, admite 5 intentos y se pide como máximo 3 veces por hora por correo.

**Ajustes** (menú del avatar → «Ajustes», `/ajustes`): el **nombre** de la casa y la tarjeta **Invitar** (copiar el link o el código, o **generar uno nuevo**, con lo que el anterior deja de funcionar al instante). En **Mi cuenta**: cambiar el **correo** o la **clave**, para lo cual piden la clave actual. El menú del avatar también tiene «Copiar link de invitación».


| Límite | Valor | Para qué |
|---|---|---|
| Casas en total (`HOME_CAP`) | 200 | Que el servicio no crezca sin que su dueño lo decida |
| Perfiles por casa | 8 | |
| Películas por casa | 150 | ~3 KB cada una: 200 casas llenas ≈ 90 MB, muy por debajo de los 512 MB del plan gratis de Atlas |
| Claves fallidas | 5 cada 15 min por IP y correo | Frenar la adivinanza de claves |
| Códigos de invitación fallidos | 5 cada 15 min por IP | Que nadie adivine cómo entrar a una casa |
| Códigos por correo pedidos | 5 cada 15 min por IP y 3 por hora por correo | Que nadie llene el buzón de otra persona |
| Cuentas nuevas y casas nuevas | 3 por día por IP, cada una | Como el registro es abierto, evita que una sola persona llene la base |
| Búsquedas en JustWatch/OMDb | 30 por hora por casa | Proteger la cuota gratis de OMDb |
| Casas sin actividad | se borran tras 12 meses (cron semanal) | Limpieza automática |

Otras defensas: las claves se guardan con `scrypt` y comparación en tiempo constante; el error de entrada es el mismo exista o no la cuenta; cada acción del servidor vuelve a leer la cuenta en la base (no se fía de la cookie), y comprueba que el perfil sea de esa casa y sea suelto o de esa misma cuenta. Si se borra una casa, sus cuentas vuelven al paso «crear o unirse».

## Cómo funciona

La idea clave: **la app no guarda una copia "oficial" de nada externo**. Cuando agregan una película, el servidor le pregunta a JustWatch por el título y el año y les muestra las coincidencias. Lo que eligen se guarda en MongoDB y queda editable. El botón «Actualizar datos» vuelve a consultar los ratings y la disponibilidad, que cambian con el tiempo, sin tocar el título ni las notas que ustedes pusieron.

La entrada tiene **tres pasos**: la cuenta (correo + clave), la casa (crear o unirse) y el perfil. La sesión y el perfil son dos cookies firmadas distintas.

```mermaid
flowchart LR
  U["Navegador<br/>(celular o compu)"] --> P["proxy.ts<br/>¿cuenta? ¿casa? ¿perfil?"]
  P --> RSC["Páginas Next.js<br/>shell estático + streaming"]
  U -->|"Server Actions"| SA["Acciones<br/>películas, calendario,<br/>perfiles, admin"]
  RSC --> DAL["Capa de datos<br/>verifica cuenta, casa y perfil"]
  SA --> DAL
  SA --> RL["Límites<br/>intentos, topes"]
  DAL <--> DB[("MongoDB Atlas")]
  RL <--> DB
  SA -->|"buscar título + año"| JW["JustWatch GraphQL<br/>Colombia, es-CO"]
  SA -.->|"opcional"| OM["OMDb<br/>ratings faltantes"]
  CR["Vercel Cron<br/>semanal"] -->|"borra casas inactivas"| DB
```

```mermaid
sequenceDiagram
  actor U as Ustedes
  participant F as Formulario
  participant A as Server Action
  participant J as JustWatch
  participant M as MongoDB
  U->>F: Home Alone 1990 y Buscar
  F->>A: searchMoviesAction
  A->>J: catálogo de Colombia, si no aparece el de EE. UU.
  J-->>A: títulos, ofertas y puntuaciones
  A-->>F: coincidencias ordenadas por parecido
  U->>F: eligen Mi pobre angelito, quién la sugirió y Guardar
  F->>A: createMovieAction
  A->>M: insertar película con addedBy y suggestedBy, y día del calendario
  A-->>U: refresh y página de la película
```

```mermaid
sequenceDiagram
  actor N as Familia nueva
  participant S as Servidor
  participant M as MongoDB
  N->>S: abre /unirse (o el link de invitación) con correo y clave
  S->>M: crear la cuenta con la clave en hash y el correo único
  S-->>N: cookie de sesión y paso 2 en /bienvenida
  N->>S: crea una casa (nombre) o escribe el código de invitación
  S->>M: casa nueva con su código, o unirse a la del código
  N->>S: «¿Cuál eres tú?»: toma un perfil o crea el suyo
  S->>M: ligar el perfil a la cuenta y fijarlo en este dispositivo
  S-->>N: si la casa está vacía, 8 clásicas para elegir; luego el inicio
```

## Requisitos

| Qué | Para qué | Costo |
|---|---|---|
| **Node.js 22+** y **pnpm 10** | Correr, probar y construir | Gratis |
| **MongoDB Atlas** (clúster M0) | Guardar casas, perfiles, películas y calendarios | Gratis |
| **Vercel** (plan Hobby) | Publicarla en internet y correr la limpieza semanal | Gratis |
| **Cuenta SMTP** *(para «olvidé la clave»)* | Enviar el código por correo, por ejemplo Gmail con una contraseña de aplicación | Gratis |
| JustWatch | Pósters, sinopsis, ratings y plataformas en Colombia | Gratis, sin clave |
| OMDb *(opcional)* | Completar IMDb o Rotten Tomatoes cuando JustWatch no los trae | Gratis hasta 1.000 consultas al día |

## Variables de entorno

Copien [`.env.example`](.env.example) a `.env.local`, que git ignora.

| Variable | Obligatoria | Descripción |
|---|:-:|---|
| `MONGODB_URI` | ✅ | Cadena de conexión de Atlas (`mongodb+srv://…`). Ver [Configurar MongoDB Atlas](#configurar-mongodb-atlas). |
| `MONGODB_DB` | | Nombre de la base. Por defecto `christmas-movies`. |
| `AUTH_SECRET` | ✅ | Firma las cookies de sesión (mínimo 32 caracteres): `openssl rand -base64 32`. |
| `ADMIN_PASSWORD` | ✅ | Clave del panel `/admin`, donde se ven y borran las casas. Si falta, se usa `APP_PASSWORD`. |
| `APP_PASSWORD` | | Respaldo de `ADMIN_PASSWORD`. Ya no se usa para entrar a ninguna casa. |
| `HOME_CAP` | | Máximo de casas. Por defecto 200; `0` cierra los registros. |
| `CRON_SECRET` | ✅ en Vercel | Protege la limpieza semanal: Vercel la envía como `Authorization: Bearer …`. `openssl rand -base64 32`. |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | ✅ en producción | Cuenta que envía el correo de «olvidé la clave». Con Gmail: `smtp.gmail.com`, el correo y una [contraseña de aplicación](https://myaccount.google.com/apppasswords). Sin ellas, en desarrollo el código se imprime en la terminal. |
| `SMTP_PORT` | | Por defecto 465 (TLS). |
| `SMTP_FROM` | | Remitente, por ejemplo `"Navidad en casa" <correo@gmail.com>`. Por defecto `SMTP_USER`. |
| `OMDB_API_KEY` | | Clave gratis de [omdbapi.com](https://www.omdbapi.com/apikey.aspx). |

> Los secretos viven solo en `.env.local` y en el panel de Vercel. **Nunca** se versionan.

## Probarlo en local

```bash
git clone https://github.com/jvrmmora/christmas-movies-select.git
cd christmas-movies-select
pnpm install
cp .env.example .env.local   # completen MONGODB_URI, AUTH_SECRET y ADMIN_PASSWORD
pnpm dev                     # http://localhost:3000
```

**Ver la app llena sin tocar sus datos.** Esto carga una casa con cuatro perfiles, 33 películas acreditadas a ellos, 5 vistas y un calendario armado, en una base aparte, `christmas-movies-demo`. El script se niega a escribir si el nombre de la base no contiene `demo`.

```bash
pnpm demo                                      # cargar datos de demo
MONGODB_DB=christmas-movies-demo pnpm dev      # abrir la app con esos datos
# entren con «ana@demo.com» y la clave «navidad»
pnpm demo --limpiar                            # borrarlos
```

**Empezar de cero en una base nueva.** No hay casas todavía:

1. Abran `http://localhost:3000/unirse`, creen su cuenta (correo y clave) y luego su casa.
2. Creen su perfil; si quieren, elijan algunas de las clásicas sugeridas, y ya pueden agregar o importar películas.
3. Inviten a la familia desde **Ajustes → Invitar a la casa**.

**Pasar de «la casa es la cuenta» a cuentas por persona.** Antes cada casa tenía un código (`casa-montano`), un correo y una clave compartidos. `migrate:accounts` convierte el correo y la clave de cada casa en su primera cuenta (la clave no cambia), le da a cada casa su código de invitación y quita los campos viejos y sus índices. Opcionalmente borra una casa, renombra otra y liga la cuenta a un perfil existente. Es idempotente.

```bash
pnpm migrate:accounts --delete-slug jvrmmora --rename-slug casa-montano --name "Casa Monama" --profile Javier
```

> Ensáyenlo primero en la base de demo con `MONGODB_DB=christmas-movies-demo`. En producción, córranlo justo después de desplegar: mientras tanto nadie puede entrar.

**Cargar la lista inicial de la casa original** (la lista personal del autor), si se clona de cero. Es idempotente: las películas que ya existen se saltan. Con `--email` se carga en la casa de esa cuenta.

```bash
pnpm seed                        # casa migrada (household)
pnpm seed --email tu@correo.com  # la casa de una cuenta
```

**Pruebas y chequeos:**

```bash
pnpm test        # 71 pruebas: calendario y reparto automático, duplicados, saludo, formato, JustWatch, claves, códigos de invitación, cuentas y códigos por correo, tema automático, límites, créditos de películas, avatares
pnpm lint
pnpm typecheck
pnpm build
```

## Configurar MongoDB Atlas

1. Creen una cuenta en [cloud.mongodb.com](https://cloud.mongodb.com) y un clúster **M0** (gratis).
2. En **Database Access**, creen un usuario con el rol `readWrite` solo sobre la base `christmas-movies`. No usen `root`.
3. En **Network Access**, agreguen `0.0.0.0/0`. Vercel no tiene IPs fijas, así que es necesario; la protección está en el usuario y la clave.
4. En **Connect → Drivers**, copien la cadena `mongodb+srv://…`, pongan la clave del usuario y péguenla en `MONGODB_URI`.

Los índices (casas por código, perfiles por casa, título + año únicos por casa, temporada del calendario, y la expiración automática de los contadores de intentos) se crean solos la primera vez que la app se conecta.

## Desplegar en Vercel

> ⚠️ **Si ya tienen datos de la versión con código de casa y clave compartida, corran `pnpm migrate:accounts` contra esa base justo después de desplegar.** Sin cuentas, nadie puede entrar. Hagan también una copia de la base en Atlas (**Backup** o `mongodump`).

**Desde GitHub (recomendado, cada push despliega solo):**

1. En [vercel.com/new](https://vercel.com/new), importen el repositorio `jvrmmora/christmas-movies-select`. Vercel detecta Next.js; no hay que cambiar nada del build.
2. En **Environment Variables**, agreguen `MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`, `ADMIN_PASSWORD`, `CRON_SECRET`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (opcional), `HOME_CAP` (opcional) y, si la usan, `OMDB_API_KEY`.
3. **Deploy.** Abran la URL `*.vercel.app`, entren con el código de su casa y su clave, y elijan perfil.

**Desde la terminal:**

```bash
npm i -g vercel
vercel login
vercel link
vercel env add MONGODB_URI production    # repetir con cada variable
vercel deploy --prod
```

El archivo [`vercel.json`](vercel.json) programa la limpieza semanal (lunes, 8:00 UTC) en `/api/cron/cleanup`, que borra las casas sin actividad en 12 meses (nunca la casa original).

> En Vercel las cookies son `Secure`: la de la casa dura 30 días y la del perfil un año. Para cerrar todas las sesiones de una vez, cambien `AUTH_SECRET` y vuelvan a desplegar.

## Administrar las casas

`/admin` (con `ADMIN_PASSWORD`) es el panel de quien opera el servicio:

<div align="center">
<img src="docs/admin.jpg" alt="Panel de administración: la lista de casas con perfiles y películas" width="640" />
</div>

- **Casas:** cuántas hay frente al tope, cuántos perfiles y películas tiene cada una y cuándo fue su última actividad. Se pueden borrar escribiendo su código para confirmar; se elimina todo lo suyo.

## Decisiones técnicas

| Decisión | Por qué |
|---|---|
| **JustWatch GraphQL con `language: "es-CO"`** en vez de IA o TMDB | Trae los títulos como se conocen en Colombia («Mi pobre angelito», no «Solo en casa»), las plataformas del país con enlace directo, IMDb y el Tomatómetro, sin clave ni costo. Es una API no oficial, así que todo queda editable y hay un botón para volver a consultar. |
| **Respaldo al catálogo de EE. UU.** | Algunos títulos («Aquella Navidad», de Netflix) no aparecen en el buscador de Colombia, aunque sí tienen datos y ofertas colombianas. |
| **Cache Components de Next 16**: shell estático + `<Suspense>` | Cada página carga al instante con esqueletos y los datos de Mongo llegan en streaming. Las mutaciones llaman `refresh()` y la UI responde al momento con `useOptimistic`. |
| **Casa (clave) → perfil (sin clave)**, ambos en cookies JWT firmadas con `jose` | Se parece a una cuenta de Netflix: la familia comparte una clave y cada persona elige su perfil. No hay cuentas por persona ni correos. `proxy.ts` hace el control rápido en dos pasos, y cada lectura y cada Server Action vuelve a verificar la sesión. |
| **`ownerId` pasó a ser el id de la casa** | Todos los documentos ya lo llevaban; así la casa original conserva su identificador (`household`) y migrar no reescribe ningún dato. |
| **Registro abierto con límites** | Pedir una invitación complicaba entrar. Ahora basta nombre y clave, y la base se protege con un tope de casas (`HOME_CAP`), 3 casas nuevas por día por IP y la limpieza de casas inactivas. |
| **Contadores de intentos en MongoDB con índice TTL** | Sin Redis ni servicios extra: cada ventana se borra sola al vencer. La lógica del límite es independiente del almacenamiento, por eso tiene pruebas con un almacén en memoria. |
| **Avatares en SVG dentro del código** | Sin subir imágenes no hay almacenamiento, costos ni contenido que moderar; cada avatar guarda solo `{personaje, color, accesorio}`, validado contra una lista cerrada. |
| **La hora se calcula solo en el navegador** | El saludo, «Hoy toca» y la cuenta regresiva usan la zona horaria de ustedes, no la del servidor (UTC). Así se evitan errores de hidratación. |
| **dnd-kit** con colisión por puntero | El arrastre funciona con mouse y con el dedo (mantener presionado). Gana el día que está debajo del puntero, no el que más se superpone. Tocar un día vacío abre la lista como alternativa accesible. |
| **Sonidos sintetizados con Web Audio** | La campana, el *tick* y el *jingle* pesan 0 KB, no hay archivos que descargar y se silencian desde la cabecera. |
| **Logos oficiales** de IMDb, Rotten Tomatoes y plataformas | IMDb y Rotten Tomatoes están en `public/logos/` (Wikimedia Commons). Los de las plataformas son los íconos que entrega JustWatch. |

## Modelo de datos

```text
users       { _id, email (único), passwordHash, homeId | null, reset?{codeHash, expiresAt, attempts}, createdAt, lastActiveAt }
homes       { _id, name, inviteCode (único), createdBy, createdAt, lastActiveAt }
profiles    { _id, homeId, name, avatar{character, bg, accessory}, userId? (único por casa), createdAt }
rate_limits { _id (clave del límite), count, expiresAt }   · TTL: se borra sola
movies      { ownerId (= id de la casa), title, originalTitle, year, posterUrl, backdropUrl, synopsis, genres[],
              runtimeMinutes, trailerUrl, ratings{imdb, rottenTomatoes, certifiedFresh},
              streaming[{provider, name, logoUrl, type: flatrate|free|ads|rent|buy, url}],
              externalIds{imdbId, tmdbId, justwatchId}, watched, watchedAt, favorite,
              myRating, notes, source: auto|manual, lastSyncedAt,
              addedBy, suggestedBy, updatedBy }   · ids de perfil; único: ownerId+title+year
calendars   { ownerId, season, preset, startDate, endDate (24 dic), assignments{ "YYYY-MM-DD": movieId }, surprise }
settings    { ownerId, displayName }   · solo lo lee la migración, para crear los primeros perfiles
```

## Estructura del proyecto

```
src/
├── proxy.ts                 # sin casa → /login · con casa y sin perfil → /perfiles
├── app/
│   ├── (app)/               # inicio, películas (lista, detalle, nueva, editar, importar), calendario, sugeridas
│   ├── (auth)/login unirse recuperar   # entrar · crear casa (nombre y clave) · recuperar acceso, con el árbol animado
│   ├── perfiles/            # «¿Quién está viendo?», editor de perfiles
│   ├── admin/               # casas
│   ├── api/cron/cleanup/    # limpieza semanal (Vercel Cron)
│   ├── salir/               # limpia la sesión de una casa que ya no existe
│   └── globals.css          # paleta navideña (tokens claro/oscuro) y animaciones
├── actions/                 # Server Actions: auth, home, profiles, admin, movies, calendar, suggestions
├── components/              # dashboard, movies, advent (calendario), avatars, profiles, auth, shell, ui
└── lib/
    ├── metadata/            # JustWatch (búsqueda y mapeo) y OMDb
    ├── dal.ts · db.ts       # acceso a datos con verificación de sesión · cliente de Mongo
    ├── jwt.ts · session.ts  # cookies de casa, perfil y admin
    ├── password.ts · recovery-code.ts   # scrypt · código de recuperación
    ├── limits.ts · rate-limit.ts # topes y límites de intentos
    ├── avatar.ts · credits.ts    # personajes, colores y accesorios · texto «sugerida por…»
    ├── calendar.ts          # rangos, celdas del mes, reparto automático
    ├── library-match.ts     # ¿ya está en la biblioteca? (JustWatch id, IMDb id, título + año)
    ├── suggestions.ts       # catálogo navideño y caché de sugeridas
    └── *.test.ts            # pruebas con Vitest
scripts/                     # seed-list (lista inicial), demo (datos de demostración) y migrate-homes
public/logos/                # IMDb y Rotten Tomatoes
docs/                        # logo y capturas del README
```

## Solución de problemas

| Síntoma | Causa probable y arreglo |
|---|---|
| `MongoServerSelectionError` o *timeout* al entrar (en Vercel) | Atlas bloquea la IP. Agreguen `0.0.0.0/0` en **Network Access**. |
| `user is not allowed to do action […]` | El usuario de Atlas no tiene permisos sobre esa base. Denle `readWrite` sobre `christmas-movies` (y sobre `christmas-movies-demo` si usan el modo demo). |
| «Ese código de casa o esa clave no coinciden» | El código o la clave están mal; el aviso es el mismo a propósito. Si olvidaron la clave, usen [Recuperar acceso](#casas-perfiles-y-límites). |
| «Demasiados intentos. Prueba de nuevo en 15 minutos» | Se pasaron de 5 intentos fallidos desde esa red para esa casa. Esperen o cambien de red. |
| Después de desplegar nadie puede entrar | Faltó crear las cuentas: corran `pnpm migrate:accounts` contra la base de producción (ver [Probarlo en local](#probarlo-en-local)). |
| «Demasiados intentos» al crear una casa | Esa conexión ya creó 3 casas hoy. Esperen o usen otra red. |
| «Por ahora no hay lugar para más casas» | Se alcanzó `HOME_CAP`. Súbanlo o borren casas inactivas en `/admin`. |
| El cron de limpieza responde 401 | Falta `CRON_SECRET` en Vercel (o no coincide). Agréguela y vuelvan a desplegar. |
| `AUTH_SECRET debe tener al menos 32 caracteres` | Generen uno con `openssl rand -base64 32`. |
| La búsqueda no encuentra una película | Prueben con el título original en inglés, o sin año. Si JustWatch no la tiene (por ejemplo, «In fraganti», 2009), elijan «Agregar sin datos» y completen a mano. |
| «Sugeridas» dice que no pudo cargar | JustWatch no respondió. Recarguen en un momento; el resultado bueno se guarda en caché unas horas. |
| Una película no muestra IMDb o Rotten Tomatoes | JustWatch no lo tiene. Configuren `OMDB_API_KEY` y usen «Actualizar datos», o escríbanlo en «Editar». |
| `vitest` falla con «Cannot find native binding» | `node_modules` se instaló con otra arquitectura (por ejemplo, Node x64 en un Mac M1). Corran `pnpm install --frozen-lockfile` con el Node que usan ahora. |
| No suena nada | El navegador solo permite audio después del primer toque. Revisen también que la campana de la cabecera no esté tachada (silencio). |

## Hoja de ruta

- [x] Lista con datos automáticos, importación y edición completa
- [x] Vistas, favoritas, calificación y notas
- [x] Calendario de adviento con arrastrar y soltar y modo sorpresa
- [x] Modo claro/oscuro, nieve, sonidos y vista móvil
- [x] Sugeridas y bloqueo de duplicados
- [x] Casas de registro abierto (nombre y clave), perfiles y avatares navideños, con quién agregó y sugirió cada película
- [x] Límites anti-abuso y limpieza de casas inactivas
- [ ] PIN opcional por perfil
- [ ] Calificación y favoritas por perfil (hoy son de la casa)
- [ ] Recordatorio diario de «Hoy toca» (Vercel Cron + correo o push)
- [ ] Actualización automática semanal de plataformas y ratings

## Licencia y avisos

Código bajo licencia [MIT](LICENSE).

Datos de disponibilidad de [JustWatch](https://www.justwatch.com/co). IMDb, Rotten Tomatoes, Netflix, Disney+, Prime Video, HBO Max, Movistar TV y demás nombres y logos son marcas de sus dueños; se usan solo para identificar el servicio. Este proyecto **no está afiliado** a ninguno de ellos. Los pósters y las sinopsis pertenecen a sus estudios. Los personajes de los avatares son dibujos originales de este proyecto.
