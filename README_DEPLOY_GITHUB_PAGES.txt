ANP Puerto Lobos – Deploy rápido en GitHub Pages (sin vueltas)

1) Subí TODOS estos archivos a la RAÍZ del repo (no dentro de una carpeta).
   Debe quedar /index.html en la raíz.

2) En GitHub: Settings → Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /(root)

3) Esperá que termine el build y abrí tu URL:
   https://<usuario>.github.io/<repo>/

Si ves “código” (app.js) en vez de la app:
- Estás entrando a /app.js o el Pages está apuntando a una carpeta equivocada.
- Revisá que el folder sea /(root) y que index.html exista en la raíz.
- Si ya instalaste la PWA: desinstalala y borrá datos del sitio (cache) y recargá.
