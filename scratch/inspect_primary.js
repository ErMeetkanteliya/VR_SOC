const fs = require('fs');
const js = fs.readFileSync('scratch/index.js', 'utf8');

const dump = JSON.parse(fs.readFileSync('scratch/primary_components_dump.json', 'utf8'));

for (const [k, code] of Object.entries(dump)) {
  console.log(`\n=================== ${k} ===================`);
  console.log(code.slice(0, 1000));
}
