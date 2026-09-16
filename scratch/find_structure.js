const fs = require('fs');
const js = fs.readFileSync('scratch/index.js', 'utf8');

// Let's find string literals that look like page titles, navigation labels, or tabs
console.log('--- SEARCHING FOR ROUTER AND NAVIGATION ---');

// Search for route components or pages
const routesMatch = js.match(/(?:routes|pages|navItems|menuItems|navigation|sidebarItems)\s*[:=]\s*(\[[^\]]+\])/gi);
if (routesMatch) {
  console.log('Found route/nav structures:');
  routesMatch.forEach(r => console.log(r.slice(0, 300)));
}

// Search for specific icons or tab names (Lucide icons, etc.)
// Base44 usually defines pages or views. Let's find all text inside JSX or components.
// Look for patterns like { id: '...', label: '...', icon: ... } or { path: '...', component: ... }
const idLabelPattern = /\{\s*id:\s*['"]([^'"]+)['"],\s*label:\s*['"]([^'"]+)['"]/g;
let m;
console.log('\n--- ID & LABEL ITEMS ---');
while ((m = idLabelPattern.exec(js)) !== null) {
  console.log(`id: "${m[1]}", label: "${m[2]}"`);
}

// Let's also look for objects with title / name / icon
const titlePattern = /\{\s*name:\s*['"]([^'"]+)['"],\s*title:\s*['"]([^'"]+)['"]/g;
while ((m = titlePattern.exec(js)) !== null) {
  console.log(`name: "${m[1]}", title: "${m[2]}"`);
}

// Let's look for tab lists
const tabMatches = [...js.matchAll(/value:\s*['"]([^'"]+)['"],\s*label:\s*['"]([^'"]+)['"]/g)];
console.log('\n--- TAB VALUE & LABELS ---');
tabMatches.forEach(tm => console.log(`tab value: "${tm[1]}", label: "${tm[2]}"`));

// Let's search for mock data arrays or objects (alerts, incidents, mitre, agents, etc.)
console.log('\n--- SEARCHING FOR STATE / CONSTANTS / DEMO DATA ---');
const constMatches = [...js.matchAll(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(\[\s*\{[\s\S]*?\}\s*\])/g)];
console.log(`Found ${constMatches.length} object arrays.`);
constMatches.forEach((cm, i) => {
  const sample = cm[2].slice(0, 150).replace(/\n/g, ' ');
  console.log(`Array ${i + 1}: ${cm[1]} (${cm[2].length} chars) -> ${sample}...`);
});
