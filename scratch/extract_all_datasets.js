const fs = require('fs');

const js = fs.readFileSync('scratch/index.js', 'utf8');

// Let's extract all data constants and definitions
const constants = {};

// 1. Alert severity styles
const sevStyles = js.match(/const\s+([a-zA-Z0-9_$]+)\s*=\s*\{\s*critical:\s*"[^"]+",\s*high:\s*"[^"]+",\s*medium:\s*"[^"]+",\s*low:\s*"[^"]+"\s*\}/g);
console.log('Severity styles:', sevStyles);

// 2. Extract specific data structures:
// ZNe: Alerts
// hg: MITRE tactics
// $j: Knowledge Center articles
// uDe: Playbooks
// wDe: Cases
// NDe: Simulation Scenarios
// bF: AI Decision factors
// wF: SOAR Response Actions
// xDe: Approvals
// ADe: Automation History / Logs
// Uj: Report types
// pDe: Threat intel integrations
// jj: Agent Health
// mOe: Alert volume weekly
// gOe: Auth trends
// yOe: MITRE tactics count
// cNe: Realtime trend

function extractArray(name) {
  const r = new RegExp(`const\\s+${name}\\s*=\\s*(\\[[\\s\\S]*?\\]);`);
  const m = js.match(r);
  return m ? m[1] : null;
}

const names = {
  alerts: 'ZNe',
  mitre_tactics: 'hg',
  knowledge_articles: '$j',
  playbooks: 'uDe',
  cases: 'wDe',
  simulations: 'NDe',
  ai_decision_factors: 'bF',
  soar_actions: 'wF',
  approvals: 'xDe',
  automation_history: 'ADe',
  report_types: 'Uj',
  threat_intel: 'pDe',
  agent_health: 'jj',
  alert_volume_weekly: 'mOe',
  auth_trends: 'gOe',
  mitre_counts: 'yOe',
  realtime_trend: 'cNe'
};

const extracted = {};
for (const [k, sym] of Object.entries(names)) {
  const raw = extractArray(sym);
  if (raw) {
    try {
      // Evaluate in safe sandbox to get pure JSON
      const fn = new Function(`return ${raw}`);
      extracted[k] = fn();
    } catch (e) {
      extracted[k] = raw;
    }
  }
}

fs.writeFileSync('scratch/all_extracted_datasets.json', JSON.stringify(extracted, null, 2));
console.log('Extracted datasets summary:');
for (const [k, v] of Object.entries(extracted)) {
  console.log(`- ${k}: ${Array.isArray(v) ? v.length + ' items' : typeof v}`);
}
