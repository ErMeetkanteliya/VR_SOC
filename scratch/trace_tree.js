const fs = require('fs');

const js = fs.readFileSync('scratch/index.js', 'utf8');

// Let's create an exhaustive parser for all screens
// Let's find each screen's internal structure:
// E.g., for Dashboard (dNe), let's find what components dNe renders
// Let's search for dNe's definition

function getFunctionBody(name) {
  const idx = js.indexOf(`function ${name}(`) !== -1 ? js.indexOf(`function ${name}(`) : js.indexOf(`const ${name}=`);
  if (idx === -1) return '';
  return js.slice(idx, idx + 4000);
}

const componentNames = [
  'koe', 'Foe', 'zoe', 'Uoe', 'dNe', 'YNe', 'QNe', 'JNe', 'eOe', 'dOe', 'hOe', 'pOe',
  'vOe', 'FIe', 'zIe', 'YIe', 'sDe', 'cDe', 'dDe', 'hDe', 'mDe', 'yDe', 'vDe', 'bDe',
  '_De', 'kDe', 'CDe', 'PDe', 'EDe', 'TDe', 'RDe', 'aoe'
];

componentNames.forEach(c => {
  const body = getFunctionBody(c);
  console.log(`=== COMPONENT ${c} ===`);
  console.log(body.slice(0, 500));
});
