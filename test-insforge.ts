import { createClient } from '@insforge/sdk';

const client = createClient({
  baseUrl: 'https://if8rkq6j.eu-central.insforge.app',
  anonKey: 'ik_dbb952a6fd01508d4ae7f53b36e23eaf'
});

async function test() {
  try {
    const result = await client.database.from('properties').select('*').limit(3);
    console.log('Success:', JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.log('Error:', e.message);
  }
}

test();