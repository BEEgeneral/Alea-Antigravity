import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kfmjhoiropvyevykvqey.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWpob2lyb3B2eWV2eWt2cWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcwNTA3MywiZXhwIjoyMDg3MjgxMDczfQ.yS9a0r4PUSASs50SOC3Q5H4Z-Q9HfYUHz2vLHwK21es'
);

async function getInvestors() {
  const { data } = await supabase.from('investors').select('*');
  return data || [];
}

async function getProperties() {
  const { data } = await supabase.from('properties').select('*');
  return data || [];
}

async function getDocuments() {
  const { data } = await supabase.from('documents').select('*');
  return data || [];
}

async function main() {
  console.log('Fetching data from Supabase...\n');
  
  const [investors, properties, documents] = await Promise.all([
    getInvestors(),
    getProperties(),
    getDocuments()
  ]);
  
  console.log(`Investors: ${investors.length}`);
  console.log(`Properties: ${properties.length}`);
  console.log(`Documents: ${documents.length}`);
  
  // Output as JSON for next step
  console.log('\n--- INVESTORS JSON ---');
  console.log(JSON.stringify(investors, null, 2));
}

main().catch(console.error);