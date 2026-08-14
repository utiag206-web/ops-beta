const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8').split('\n');
env.forEach(line => {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    process.env[k.trim()] = v.join('=').trim();
  }
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/tareo_records?select=status';

fetch(url, { headers: { 'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY } })
  .then(r => r.json())
  .then(data => {
    const uniqueStatuses = [...new Set(data.map(d => d.status))];
    console.log("Unique statuses:", uniqueStatuses);
  })
  .catch(console.error);
