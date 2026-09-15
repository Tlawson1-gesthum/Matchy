# Matchy — cómo publicar esto en internet (sin programar)

## 1. Base de datos (Supabase)
1. Entrá al proyecto que ya creaste en supabase.com.
2. Andá a **SQL Editor** → **New query**.
3. Abrí el archivo `supabase/schema.sql` de esta carpeta, copiá todo su contenido y pegalo ahí.
4. Apretá **Run**. Deberías ver "Success" y las tablas creadas (mirá en **Table Editor** para confirmarlo).

## 2. Subir el código a GitHub (sin usar la terminal)
1. Entrá a github.com y creá una cuenta gratis si no tenés.
2. Creá un repositorio nuevo, por ejemplo `matchy`.
3. En la página del repositorio, usá la opción **"uploading an existing file"** (subir archivos existentes) y arrastrá **todos los archivos de esta carpeta** (incluidas las subcarpetas `app`, `lib`, `components`, `supabase`, y los archivos `package.json`, `.gitignore`, `next.config.js`).
4. Confirmá el commit.

## 3. Conectar con Vercel
1. Entrá a vercel.com con la cuenta que ya creaste.
2. **Add New → Project** → elegí el repositorio `matchy` que acabás de subir.
3. Antes de apretar "Deploy", abrí **Environment Variables** y cargá estas tres:
   - `NEXT_PUBLIC_SUPABASE_URL` → la Project URL que copiaste de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → la anon public key de Supabase
   - `ANTHROPIC_API_KEY` → la clave que generaste en console.anthropic.com
4. Apretá **Deploy**. En 1-2 minutos Vercel te da un link (algo como `matchy.vercel.app`) — esa es tu web real, ya funcionando.

## 4. Probarlo
- Entrá al link, tocá "Busco empleo", creá una cuenta de prueba y armá un CV.
- En otra ventana (o modo incógnito), tocá "Ofrezco empleo", registrá un local de prueba y publicá una vacante.
- Postulate con la cuenta de candidato y volvé al panel del local para ver el ranking funcionando.

## 5. Dominio propio (opcional, más adelante)
Cuando quieras usar un dominio como `matchy.com.ar`, lo comprás en NIC Argentina y lo conectás desde Vercel → Project Settings → Domains. Te guío en ese momento si querés.

## Si algo falla
Pegame acá el mensaje de error exacto (de Vercel, de Supabase, o de la consola del navegador) y lo resolvemos juntos.
