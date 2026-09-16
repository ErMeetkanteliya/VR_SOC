const fs = require('fs');

const js = fs.readFileSync('scratch/index.js', 'utf8');

// Let's write a script to inspect every screen's complete layout and UI components
const screens = [
  { id: 'dashboard', route: '/', comp: 'dNe', title: 'SOC Dashboard' },
  { id: 'agents', route: '/agents', comp: 'YNe', title: 'Agent Management' },
  { id: 'alerts', route: '/alerts', comp: 'QNe', title: 'Alert Management' },
  { id: 'incidents', route: '/incidents', comp: 'JNe', title: 'Incident Response' },
  { id: 'detections', route: '/detections', comp: 'eOe', title: 'Threat Detection' },
  { id: 'mitre', route: '/mitre', comp: 'dOe', title: 'MITRE ATT&CK Matrix' },
  { id: 'logs', route: '/logs', comp: 'hOe', title: 'Log Explorer' },
  { id: 'cases', route: '/cases', comp: 'pOe', title: 'Case Management' },
  { id: 'analytics', route: '/analytics', comp: 'vOe', title: 'SOC Analytics' },
  { id: 'ai-assistant', route: '/ai-assistant', comp: 'FIe', title: 'AI Security Assistant' },
  { id: 'knowledge', route: '/knowledge', comp: 'zIe', title: 'Knowledge Center' },
  { id: 'settings', route: '/settings', comp: 'YIe', title: 'Settings' },
  { id: 'soar-dashboard', route: '/soar', comp: 'sDe', title: 'SOAR Dashboard' },
  { id: 'soar-automation', route: '/soar/automation', comp: 'cDe', title: 'SOAR Automation Pipeline' },
  { id: 'soar-playbooks', route: '/soar/playbooks', comp: 'dDe', title: 'SOAR Playbooks' },
  { id: 'soar-builder', route: '/soar/builder', comp: 'hDe', title: 'SOAR Playbook Builder' },
  { id: 'soar-enrichment', route: '/soar/enrichment', comp: 'mDe', title: 'SOAR Threat Enrichment' },
  { id: 'soar-ai-engine', route: '/soar/ai-engine', comp: 'yDe', title: 'SOAR AI Decision Engine' },
  { id: 'soar-actions', route: '/soar/actions', comp: 'vDe', title: 'SOAR Response Actions' },
  { id: 'soar-approvals', route: '/soar/approvals', comp: 'bDe', title: 'SOAR Approvals' },
  { id: 'soar-cases', route: '/soar/cases', comp: '_De', title: 'SOAR Cases' },
  { id: 'soar-incident-detail', route: '/soar/incident/:id', comp: 'kDe', title: 'SOAR Incident Detail' },
  { id: 'soar-history', route: '/soar/history', comp: 'CDe', title: 'SOAR Execution History' },
  { id: 'soar-live', route: '/soar/live', comp: 'PDe', title: 'SOAR Live Execution' },
  { id: 'soar-reports', route: '/soar/reports', comp: 'EDe', title: 'SOAR Reports' },
  { id: 'soar-simulation', route: '/soar/simulation', comp: 'TDe', title: 'SOAR Simulation' },
  { id: 'soar-settings', route: '/soar/settings', comp: 'RDe', title: 'SOAR Settings' },
  { id: 'login', route: '/login', comp: 'koe', title: 'Login' },
  { id: 'register', route: '/register', comp: 'Foe', title: 'Register' },
  { id: 'forgot-password', route: '/forgot-password', comp: 'zoe', title: 'Forgot Password' },
  { id: 'reset-password', route: '/reset-password', comp: 'Uoe', title: 'Reset Password' },
  { id: 'not-found', route: '*', comp: 'aoe', title: 'Not Found' }
];

const parsedScreens = [];

screens.forEach(s => {
  const start = js.indexOf(`function ${s.comp}(`);
  let code = '';
  if (start !== -1) {
    code = js.slice(start, start + 6000);
  }
  parsedScreens.push({
    ...s,
    codeLength: code.length,
    codeSample: code.slice(0, 500)
  });
});

fs.writeFileSync('scratch/all_screen_metadata.json', JSON.stringify(parsedScreens, null, 2));
console.log('Processed all 32 screens metadata!');
