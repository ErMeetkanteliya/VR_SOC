const fs = require('fs');

const js = fs.readFileSync('scratch/index.js', 'utf8');

const primaryComponents = {
  Dashboard_dNe: 'dNe',
  Agents_YNe: 'YNe',
  Alerts_QNe: 'QNe',
  Incidents_JNe: 'JNe',
  ThreatDetection_eOe: 'eOe',
  MitreAttack_dOe: 'dOe',
  LogExplorer_hOe: 'hOe',
  Cases_pOe: 'pOe',
  Analytics_vOe: 'vOe',
  AiAssistant_FIe: 'FIe',
  KnowledgeCenter_zIe: 'zIe',
  Settings_YIe: 'YIe',
  Login_koe: 'koe',
  Register_Foe: 'Foe',
  ForgotPassword_zoe: 'zoe',
  ResetPassword_Uoe: 'Uoe'
};

const fullOutput = {};

for (const [name, sym] of Object.entries(primaryComponents)) {
  const start = js.indexOf(`function ${sym}(`);
  if (start !== -1) {
    fullOutput[name] = js.slice(start, start + 8000);
  } else {
    fullOutput[name] = 'NOT_FOUND';
  }
}

fs.writeFileSync('scratch/primary_components_dump.json', JSON.stringify(fullOutput, null, 2));
console.log('Saved primary_components_dump.json');
