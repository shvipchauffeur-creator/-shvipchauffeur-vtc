const fs = require('fs');
const key = process.env.GOOGLE_MAPS_API_KEY;
if (!key) { console.error('GOOGLE_MAPS_API_KEY manquante'); process.exit(1); }
const file = 'reservation.html';
const content = fs.readFileSync(file, 'utf8');
const result = content.replace(/GOOGLE_MAPS_KEY_PLACEHOLDER/g, key);
fs.writeFileSync(file, result);
console.log('Clé API injectée avec succès dans', file);
