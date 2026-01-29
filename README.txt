ANP Puerto Lobos PWA (v0.8)
=========================

✅ Esta versión corrige los problemas típicos de GitHub Pages en celular:
- Nombres de archivos SIN tildes (index.html, app.js, data.json, etc.)
- Navegación por hash (#) para evitar 404 al refrescar
- Service Worker con scope relativo (./) para que funcione dentro de /appanppl/
- Manifest con start_url y scope relativos

IMPORTANTE (para que no te pase lo de ver el código JS en pantalla):
1) En tu repo, BORRÁ o renombrá estos archivos si existen:
   - índice.html / aplicación.js / datos.json / manifiesto.json / service-worker.js con tildes
2) Subí TODO el contenido de este ZIP a la raíz del repositorio.
3) GitHub Pages:
   Settings → Pages → Build and deployment:
   - Source: Deploy from a branch
   - Branch: main (o principal) / (root)
4) Esperá el deploy y abrí:
   https://<tu-usuario>.github.io/<tu-repo>/

LIMPIEZA DE CACHE (si seguís viendo cosas viejas):
- En el celular: Chrome → Ajustes → Privacidad → Borrar datos (sitio/caché)
- O abrí en modo incógnito.
