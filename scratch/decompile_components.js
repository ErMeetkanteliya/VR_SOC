const fs = require('fs');

const js = fs.readFileSync('scratch/index.js', 'utf8');

const components = {
  Login: 'koe',
  Register: 'Foe',
  ForgotPassword: 'zoe',
  ResetPassword: 'Uoe',
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
  SoarSettings: 'RDe',
  NotFound: 'aoe'
};

const results = {};

for (const [name, sym] of Object.entries(components)) {
  // Find function declaration: function sym( or const sym= or sym=function
  const regex = new RegExp(`(?:function\\s+${sym}\\s*\\(|const\\s+${sym}\\s*=\\s*|let\\s+${sym}\\s*=\\s*|var\\s+${sym}\\s*=\\s*|${sym}\\s*=\\s*\\()([\\s\\S]*?)(?=function\\s+[a-zA-Z0-9_$]+\\s*\\(|const\\s+[a-zA-Z0-9_$]+\\s*=|let\\s+[a-zA-Z0-9_$]+\\s*=|var\\s+[a-zA-Z0-9_$]+\\s*=|$)`);
  const match = js.match(regex);
  if (match) {
    const raw = match[0].slice(0, 15000); // take component body
    results[name] = {
      symbol: sym,
      length: match[0].length,
      snippet: raw
    };
  } else {
    results[name] = { symbol: sym, found: false };
  }
}

fs.writeFileSync('scratch/component_decompiled.json', JSON.stringify(results, null, 2));
console.log('Decompiled all components! Summary:');
for (const [name, data] of Object.entries(results)) {
  console.log(`${name} (${data.symbol}): length = ${data.length || 0}`);
}
