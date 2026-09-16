const fs = require('fs');

const js = fs.readFileSync('scratch/index.js', 'utf8');

// Function to extract full objects/arrays matching patterns
const output = {};

// 1. Navigation items & Sidebar routes
const nav1 = js.match(/\[\{label:"Dashboard",icon:[^,]+,path:"\/"\}[\s\S]*?\]/);
if (nav1) {
  output.primary_navigation_raw = nav1[0];
}

// 2. SOAR navigation
const soarNav = js.match(/\[\{label:"Dashboard",path:"\/soar"[\s\S]*?\]/);
if (soarNav) {
  output.soar_navigation_raw = soarNav[0];
}

// 3. Alerts dataset
const alertsMatch = js.match(/\[\{id:1,title:"Brute Force Authentication Attack"[\s\S]*?\](?=;|\n|,|\))/);
if (alertsMatch) {
  output.alerts_sample = alertsMatch[0];
}

// 4. MITRE dataset
const mitreMatch = js.match(/\[\{id:"TA0001",name:"Initial Access"[\s\S]*?\](?=;|\n|,|\))/);
if (mitreMatch) {
  output.mitre_sample = mitreMatch[0];
}

// 5. Knowledge dataset
const knowledgeMatch = js.match(/\[\{category:"SOC",title:"Security Operations Center"[\s\S]*?\](?=;|\n|,|\))/);
if (knowledgeMatch) {
  output.knowledge_sample = knowledgeMatch[0];
}

// 6. Playbooks dataset
const playbooksMatch = js.match(/\[\{name:"Brute Force Response",category:"Brute Force"[\s\S]*?\](?=;|\n|,|\))/);
if (playbooksMatch) {
  output.playbooks_sample = playbooksMatch[0];
}

// 7. Cases dataset
const casesMatch = js.match(/\[\{id:1,case_number:"CASE-2026-0047"[\s\S]*?\](?=;|\n|,|\))/);
if (casesMatch) {
  output.cases_sample = casesMatch[0];
}

// 8. Simulation scenarios dataset
const simMatch = js.match(/\[\{id:"brute_force",name:"Brute Force Attack"[\s\S]*?\](?=;|\n|,|\))/);
if (simMatch) {
  output.simulations_sample = simMatch[0];
}

// 9. Approvals dataset
const approvalsMatch = js.match(/\[\{id:1,incident_title:"Brute Force on DC-01"[\s\S]*?\](?=;|\n|,|\))/);
if (approvalsMatch) {
  output.approvals_sample = approvalsMatch[0];
}

// 10. Threat intel integrations
const intelMatch = js.match(/\[\{name:"VirusTotal"[\s\S]*?\](?=;|\n|,|\))/);
if (intelMatch) {
  output.threat_intel_sample = intelMatch[0];
}

// 11. Reports
const reportsMatch = js.match(/\[\{id:"incident",name:"Incident Report"[\s\S]*?\](?=;|\n|,|\))/);
if (reportsMatch) {
  output.reports_sample = reportsMatch[0];
}

// 12. Execution history / logs
const execLogsMatch = js.match(/\[\{id:1,time:"Jul 16, 10:32 AM"[\s\S]*?\](?=;|\n|,|\))/);
if (execLogsMatch) {
  output.execution_logs_sample = execLogsMatch[0];
}

fs.writeFileSync('scratch/extracted_data.json', JSON.stringify(output, null, 2));
console.log('Saved extracted_data.json. Keys:', Object.keys(output));
