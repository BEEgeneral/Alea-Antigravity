import { createClient as createSupabase } from '@supabase/supabase-js';
import { Insforge } from '@insforge/sdk';

const supabase = createSupabase(
  'https://kfmjhoiropvyevykvqey.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWpob2lyb3B2eWV2eWt2cWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcwNTA3MywiZXhwIjoyMDg3MjgxMDczfQ.yS9a0r4PUSASs50SOC3Q5H4Z-Q9HfYUHz2vLHwK21es'
);

const insforge = new Insforge({
  url: 'https://if8rkq6j.eu-central.insforge.app',
  apiKey: 'ik_dbb952a6fd01508d4ae7f53b36e23eaf'
});

async function migrateInvestors() {
  console.log('📥 Migrating investors...');
  const { data: investors } = await supabase.from('investors').select('*');
  
  let migrated = 0;
  for (const inv of investors || []) {
    try {
      await insforge.database.createRecords('investors', [{
        id: inv.id,
        full_name: inv.full_name || inv.company_name || 'Unknown',
        company_name: inv.company_name,
        email: inv.email,
        phone: inv.phone,
        investor_type: inv.investor_type,
        kyc_status: inv.kyc_status || 'pending',
        budget_min: inv.budget_min,
        budget_max: inv.budget_max,
        labels: inv.labels || []
      }]);
      migrated++;
    } catch (e) {
      console.log(`  ⚠️ ${inv.full_name || inv.id}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${migrated}/${investors?.length} investors migrated`);
  return migrated;
}

async function migrateProperties() {
  console.log('📥 Migrating properties...');
  const { data: properties } = await supabase.from('properties').select('*');
  
  let migrated = 0;
  for (const prop of properties || []) {
    try {
      await insforge.database.createRecords('properties', [{
        id: prop.id,
        title: prop.title,
        description: prop.description,
        asset_type: prop.asset_type || 'residential',
        address: prop.address,
        price: prop.price,
        meters: prop.meters,
        rooms: prop.rooms,
        bathrooms: prop.bathrooms,
        is_off_market: prop.is_off_market ?? true,
        thumbnail_url: prop.thumbnail_url,
        owner_id: prop.owner_id
      }]);
      migrated++;
    } catch (e) {
      console.log(`  ⚠️ ${prop.title}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${migrated}/${properties?.length} properties migrated`);
  return migrated;
}

async function migrateDocuments() {
  console.log('📥 Migrating documents...');
  const { data: docs } = await supabase.from('documents').select('*');
  
  let migrated = 0;
  for (const doc of docs || []) {
    try {
      await insforge.database.createRecords('documents', [{
        id: doc.id,
        property_id: doc.property_id,
        title: doc.title,
        file_path: doc.file_path,
        document_type: doc.document_type
      }]);
      migrated++;
    } catch (e) {
      console.log(`  ⚠️ ${doc.title}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${migrated}/${docs?.length} documents migrated`);
  return migrated;
}

async function main() {
  console.log('🚀 Starting migration: Supabase → InsForge\n');
  
  const inv = await migrateInvestors();
  const props = await migrateProperties();
  const docs = await migrateDocuments();
  
  console.log('\n✅ Migration completed!');
  console.log(`   Investors: ${inv}`);
  console.log(`   Properties: ${props}`);
  console.log(`   Documents: ${docs}`);
}

main().catch(console.error);