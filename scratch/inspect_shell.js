const fs = require('fs');

const js = fs.readFileSync('scratch/index.js', 'utf8');

// Let's inspect AppShell / Layout components
// In the router, what wraps the routes?
const layoutMatch = js.match(/\{element:\s*d\.jsx\(([A-Za-z0-9_$]+)[^}]+\),\s*children:\s*\[([\s\S]*?)\]\}/);
if (layoutMatch) {
  console.log('AppShell wrapper component:', layoutMatch[1]);
  // Let's find the declaration of this wrapper component
  const shellSym = layoutMatch[1];
  const shellRegex = new RegExp(`(?:function\\s+${shellSym}|const\\s+${shellSym}\\s*=)([\\s\\S]*?)(?=function\\s+[A-Za-z0-9_$]+|const\\s+[A-Za-z0-9_$]+\\s*=)`);
  const shellMatch = js.match(shellRegex);
  if (shellMatch) {
    fs.writeFileSync('scratch/app_shell_source.txt', shellMatch[0].slice(0, 10000));
    console.log('Saved app shell source! Length:', shellMatch[0].length);
  }
}

// Let's write a script to search for specific screen details and sub-components
function inspectComponent(name, sym) {
  // Search for JSX or calls inside sym
  const regex = new RegExp(`(?:function\\s+${sym}\\s*\\([\\s\\S]*?\\{|const\\s+${sym}\\s*=\\s*\\([\\s\\S]*?=>\\s*\{?)([\\s\\S]*?)(?=(?:function\\s+[A-Z][A-Za-z0-9_$]+\\s*\\(|const\\s+[A-Z][A-Za-z0-9_$]+\\s*=))`);
  const match = js.match(regex);
  return match ? match[0] : null;
}

const report = {};
const allSyms = {
  Shell: 'poe', // or whatever wrapper was found
  Dashboard: 'dNe',
  Agents: 'YNe',
  Alerts: 'QNe',
  Incidents: 'JNe',
  ThreatDetection: 'eOe',
  MitreAttack: 'dOe',
  LogExplorer: 'hOe',
  Cases: 'pOe',
  Analytics: 'vOe',
  AiAssistant: 'FIe',
  KnowledgeCenter: 'zIe',
  Settings: 'YIe',
  SoarDashboard: 'sDe',
  SoarAutomation: 'cDe',
  SoarPlaybooks: 'dDe',
  SoarBuilder: 'hDe',
  SoarEnrichment: 'mDe',
  SoarAiEngine: 'yDe',
  SoarActions: 'vDe',
  SoarApprovals: 'bDe',
  SoarCases: '_De',
  SoarIncidentDetail: 'kDe',
  SoarHistory: 'CDe',
  SoarLive: 'PDe',
  SoarReports: 'EDe',
  SoarSimulation: 'TDe',
  SoarSettings: 'RDe'
};

for (const [k, v] of Object.entries(allSyms)) {
  const code = inspectComponent(k, v);
  report[k] = code ? code.slice(0, 8000) : 'Not found';
}

fs.writeFileSync('scratch/all_screens_expanded.json', JSON.stringify(report, null, 2));
console.log('Generated all_screens_expanded.json');
