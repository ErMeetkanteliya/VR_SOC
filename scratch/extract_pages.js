const fs = require('fs');

const js = fs.readFileSync('scratch/index.js', 'utf8');

// Let's find the router configuration or page component mappings
// In React Router, paths are usually passed to useRoutes or <Routes>
// Let's search for the router definition in js

const routesDefinition = js.match(/routes\s*=\s*\[([\s\S]*?)\];/);
if (routesDefinition) {
  console.log('Routes Definition:', routesDefinition[1].slice(0, 1000));
}

// Let's write a script that looks for all component renders for each path
// E.g., searching for path:"/alerts", path:"/agents", path:"/mitre", etc.
const paths = [
  '/', '/agents', '/alerts', '/incidents', '/detections', '/mitre', '/logs', '/cases',
  '/analytics', '/ai-assistant', '/knowledge', '/settings',
  '/soar', '/soar/automation', '/soar/playbooks', '/soar/builder', '/soar/enrichment',
  '/soar/ai-engine', '/soar/actions', '/soar/approvals', '/soar/cases', '/soar/history',
  '/soar/live', '/soar/reports', '/soar/simulation', '/soar/settings',
  '/login', '/register', '/forgot-password', '/reset-password', '/soar/incident/:id'
];

console.log('--- SEARCHING FOR COMPONENT BODIES ---');

// Let's extract the router object mapping path -> component
const pathRegex = /\{path:"([^"]+)",(?:element|Component):([A-Za-z0-9_$()]+)/g;
let pm;
const pathMap = {};
while ((pm = pathRegex.exec(js)) !== null) {
  pathMap[pm[1]] = pm[2];
}
console.log('Path to component map:', pathMap);

// If no direct path:..., element:..., let's check how routes are mapped
// Search for createBrowserRouter or createHashRouter or useRoutes
const routerMatches = [...js.matchAll(/create(?:Browser|Hash)Router\(\[([\s\S]*?)\]\)/g)];
if (routerMatches.length) {
  console.log('Router match found!');
  fs.writeFileSync('scratch/router_definition.txt', routerMatches[0][1]);
} else {
  // Let's search for path: in general
  const generalPathMatches = [...js.matchAll(/path:"([^"]+)"[\s\S]{1,100}?(?:element|Component|lazy):([^,}]+)/g)];
  console.log(`Found ${generalPathMatches.length} general path matches`);
  generalPathMatches.forEach(m => console.log(`${m[1]} => ${m[2]}`));
}
