const fs = require('fs');

const js = fs.readFileSync('scratch/index.js', 'utf8');
const css = fs.readFileSync('scratch/index.css', 'utf8');

console.log('--- CSS ANALYSIS ---');
// Extract root CSS variables or color themes
const rootVars = css.match(/--[\w-]+:[^;}]+/g) || [];
console.log('CSS Variables count:', rootVars.length);
console.log('Sample CSS Variables:\n', rootVars.slice(0, 30).join('\n'));

console.log('\n--- JS MODULES / STRINGS ANALYSIS ---');

// Find all page-like or route-like structures
const pages = [];
const pageRegex = /["'](\/[a-zA-Z0-9_\-\/:]*)["']/g;
let match;
const urlSet = new Set();
while ((match = pageRegex.exec(js)) !== null) {
  if (match[1].length > 1 && !match[1].startsWith('//') && !match[1].includes('.')) {
    urlSet.add(match[1]);
  }
}
console.log('Unique potential paths count:', urlSet.size);

// Look for navigation menu structure
// Often base44 uses pages configuration or sidebar items
fs.writeFileSync('scratch/all_urls.json', JSON.stringify([...urlSet].sort(), null, 2));

// Search for entity models or schema definitions
const entities = new Set();
const entityMatches = js.matchAll(/entities\/([A-Za-z0-9_]+)/g);
for (const m of entityMatches) {
  entities.add(m[1]);
}
console.log('\nEntities detected in API calls:', [...entities]);

// Search for navigation items / sidebar sections
// Let's search for keywords like Dashboard, SIEM, Alerts, etc.
const keywords = [
  'Dashboard', 'SIEM', 'EDR', 'XDR', 'Alerts', 'Incidents', 'Cases', 'Threat Hunting',
  'MITRE ATT&CK', 'Threat Intelligence', 'Compliance', 'Vulnerability', 'Malware',
  'File Integrity', 'Knowledge', 'Simulation', 'Labs', 'Analytics', 'Audit', 'Reports',
  'Notifications', 'API', 'Settings', 'AI Assistant'
];

keywords.forEach(kw => {
  const count = (js.match(new RegExp(kw, 'gi')) || []).length;
  console.log(`Keyword "${kw}": ${count} occurrences`);
});
