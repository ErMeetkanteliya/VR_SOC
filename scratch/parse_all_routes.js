const fs = require('fs');

const js = fs.readFileSync('scratch/index.js', 'utf8');

// Find all React Router Route elements: <Route path="..." element={...} /> or createBrowserRouter / Routes
const routeTagRegex = /<Route[^>]*path=["']([^"']+)["'][^>]*>/g;
const routeTags = [];
let rm;
while ((rm = routeTagRegex.exec(js)) !== null) {
  routeTags.push(rm[0]);
}
console.log('Route tags found:', routeTags);

// Search for { path: "...", ... } across entire JS
const pathObjRegex = /path:\s*["']([^"']+)["']/g;
const paths = new Set();
while ((rm = pathObjRegex.exec(js)) !== null) {
  paths.add(rm[1]);
}
console.log('All paths found:', [...paths]);

// Let's find all function names / component names that render pages
// Look for keywords in component declarations
const pageMatches = js.match(/(?:function|const)\s+([A-Z][A-Za-z0-9_]+)\s*=\s*(?:\([^)]*\)|function|\(\s*\{)/g) || [];
console.log('React Component declarations count:', pageMatches.length);

// Let's search for the sidebar definition and see all items and their paths, icons, labels, categories
const sidebarMatch = js.match(/const\s+rde\s*=\s*(\[[\s\S]*?\]);/);
if (sidebarMatch) {
  console.log('rde (Sidebar config):', sidebarMatch[1]);
}

// Let's also check for top-level routes array or switch statements
const switchMatches = js.match(/switch\s*\([a-zA-Z0-9_$.]+\)\s*\{[\s\S]*?\}/g) || [];
console.log('Switch statements count:', switchMatches.length);
switchMatches.forEach((s, idx) => {
  if (s.includes('case') && (s.includes('alerts') || s.includes('soar') || s.includes('dashboard') || s.includes('mitre') || s.includes('agents'))) {
    console.log(`Switch ${idx}:`, s.slice(0, 400));
  }
});
