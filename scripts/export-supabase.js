const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kfmjhoiropvyevykvqey.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWpob2lyb3B2eWV2eWt2cWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcwNTA3MywiZXhwIjoyMDg3MjgxMDczfQ.yS9a0r4PUSASs50SOC3Q5H4Z-Q9HfYUHz2vLHwK21es'
);

function escape(str) {
  return (str || '').toString().replace(/'/g, "''");
}

async function main() {
  console.log('Fetching data from Supabase...\n');
  
  const { data: investors } = await supabase.from('investors').select('*');
  const { data: properties } = await supabase.from('properties').select('*');
  const { data: documents } = await supabase.from('documents').select('*');
  
  console.log('=== INVESTORS ===');
  for (const i of investors || []) {
    console.log(`INSERT INTO investors (id, full_name, company_name, email, phone, investor_type, kyc_status) VALUES ('${i.id}', '${escape(i.full_name || i.company_name)}', '${escape(i.company_name)}', '${escape(i.email)}', '${escape(i.phone)}', '${escape(i.investor_type)}', '${escape(i.kyc_status)}');`);
  }
  
  console.log('\n=== PROPERTIES ===');
  for (const p of properties || []) {
    console.log(`INSERT INTO properties (id, title, asset_type, address, price, is_off_market, owner_id) VALUES ('${p.id}', '${escape(p.title)}', '${escape(p.asset_type || 'residential')}', '${escape(p.address)}', ${p.price || 0}, ${p.is_off_market ?? true}, ${p.owner_id ? "'" + p.owner_id + "'" : 'NULL'});`);
  }
  
  console.log('\n=== DOCUMENTS ===');
  for (const d of documents || []) {
    console.log(`INSERT INTO documents (id, property_id, title, file_path, document_type) VALUES ('${d.id}', '${d.property_id}', '${escape(d.title)}', '${escape(d.file_path)}', '${escape(d.document_type)}');`);
  }
}

main().catch(console.error);