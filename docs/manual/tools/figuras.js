/* Numeración de figuras: build.js escribe ../figuras.json ({slug: número}) según el orden de aparición en el
   manual; los generadores (capturar.js, diagramas.js) lo usan para nombrar los archivos fig-NN-slug.webp. */
const fs = require('fs');
const path = require('path');
const FILE = path.resolve(__dirname, '../figuras.json');
const map = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const quitarPrefijo = n => n.replace(/^(fig|diag|flow)-\d+-/, '');
module.exports = {
  FILE, map, quitarPrefijo,
  nombre(prefijo, name) {
    const slug = quitarPrefijo(name), n = map[slug];
    return `${prefijo}-${n ? String(n).padStart(2, '0') : '00'}-${slug}`;
  },
};
