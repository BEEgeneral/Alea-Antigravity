import { createClient } from '@insforge/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const INSFORGE_URL = 'https://if8rkq6j.eu-central.insforge.app';
const INSFORGE_KEY = 'ik_dbb952a6fd01508d4ae7f53b36e23eaf';

const client = createClient({
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_KEY,
});

async function uploadFile(filePath: string, key: string): Promise<string | null> {
  try {
    const buffer = readFileSync(filePath);
    const blob = new Blob([buffer]);
    const file = new File([blob], key, { type: 'application/pdf' });
    
    const { data, error } = await client.storage.from('activos').upload(key, file);
    
    if (error) {
      console.error(`Error uploading ${key}:`, error.message);
      return null;
    }
    
    console.log(`Uploaded ${key}:`, data);
    return `${INSFORGE_URL}/storage/v1/object/activos/${key}`;
  } catch (error: any) {
    console.error(`Error uploading ${key}:`, error.message);
    return null;
  }
}

// Upload a file
const filePath = process.argv[2];
const key = process.argv[3] || filePath.split('/').pop()?.replace(/\s+/g, '_') || 'file.pdf';

if (!filePath) {
  console.log('Usage: npx ts-node upload-to-insforge.ts <filePath> [key]');
  process.exit(1);
}

uploadFile(filePath, key).then(url => {
  if (url) {
    console.log('Success:', url);
  } else {
    console.log('Failed to upload');
    process.exit(1);
  }
});