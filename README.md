# Veneza Estética Car

Site estático (GitHub Pages). A abertura 3D fica em `src/intro3d.js` e é empacotada em `intro3d.min.js`:

```bash
npm i three@0.165.0 esbuild@0.21.5
npx esbuild src/intro3d.js --bundle --minify --format=esm --target=es2022 --outfile=intro3d.min.js
```

Para ver um momento específico da abertura: `?t=4` (segundos). A abertura só aparece uma vez por sessão.

Modelo 3D: Ferrari 458 Italia por vicent091036 (Sketchfab), via exemplos do three.js.
