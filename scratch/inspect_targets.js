const fs = require('fs');

const dump = JSON.parse(fs.readFileSync('scratch/primary_components_dump.json', 'utf8'));

const targets = ['Dashboard_dNe', 'Agents_YNe', 'Alerts_QNe', 'Incidents_JNe', 'LogExplorer_hOe', 'Cases_pOe'];
for (const t of targets) {
  console.log(`\n=================== ${t} ===================`);
  console.log(dump[t]);
}
