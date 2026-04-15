import { createClient } from '@insforge/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const INSFORGE_URL = 'https://if8rkq6j.eu-central.insforge.app';
const INSFORGE_KEY = 'ik_dbb952a6fd01508d4ae7f53b36e23eaf';
const BUCKET = 'activos';

const client = createClient({
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_KEY,
});

async function uploadFile(filePath, key) {
  try {
    const buffer = readFileSync(filePath);
    const arrayBuffer = new Uint8Array(buffer).buffer;
    
    const response = await fetch(
      `${INSFORGE_URL}/api/storage/buckets/${BUCKET}/files/${key}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${INSFORGE_KEY}`,
          'Content-Type': 'application/octet-stream',
          'x-upsert': 'true'
        },
        body: arrayBuffer
      }
    );

    if (response.ok) {
      return `${INSFORGE_URL}/api/storage/buckets/${BUCKET}/files/${key}`;
    } else {
      console.error(`Failed to upload ${key}: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error uploading ${key}:`, error.message);
    return null;
  }
}

// Extract property reference from filename
function extractReference(filename) {
  // Remove extension
  const name = filename.replace(/\.(pdf|jpg|jpeg|png)$/i, '');
  
  // Common patterns
  const patterns = [
    /^(.+?)\s*-\s*(.+)$/,
    /^(.+?)\s+(.+)$/,
    /^(.+)$/
  ];
  
  return name.substring(0, 50); // Truncate to 50 chars
}

// Map files to properties based on name patterns
const propertyMappings = {
  'EDIFICIO OFICINAS VALENTIN BEATO': { 
    id: 'c336e9cc-a939-47e3-b153-9a74e926ba9b', 
    type: 'dossier' 
  },
  'Plan Suelo Móstoles': { 
    id: 'd48ec73b-fc5f-4583-bc9b-b88991fccf13', 
    type: 'dossier' 
  },
  'SUELO URBANO CALLE JAÉN 5 MOSTOLES': { 
    id: '26b5e048-ae15-48b5-81e6-e23b9ecf290b', 
    type: 'dossier' 
  },
  'Palacio Trinidad Grund': { 
    id: 'f52a7b90-999a-4874-9328-ed29da8748fa', 
    type: 'dossier' 
  },
  'Hotel IZAN': { 
    id: 'c56afa6b-e26e-438e-a4c7-83bd2eafe159', 
    type: 'dossier' 
  },
  'Café Chinitas': { 
    id: '8eeddcf1-f65b-40c0-9e3f-20c6b0cf5d65', 
    type: 'dossier' 
  },
  'Olivia Pagoda': { 
    id: 'b660869e-9e29-43c1-93ba-b1479652637c', 
    type: 'dossier' 
  },
  'Conde de la Cimera': { 
    id: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', 
    type: 'dossier' 
  },
  'JA4': { 
    id: '4e2279b7-8377-4ecb-a11c-0d3dda0f5ddc', 
    type: 'dossier' 
  },
  'Chueca': { 
    id: '31d8d45a-5b09-4b07-ba96-cfe7180fcd3e', 
    type: 'dossier' 
  },
  'Salinas 10': { 
    id: '3c1365cc-9c57-4aba-87c8-3a002e42e704', 
    type: 'dossier' 
  },
  'Loterías Maruja': { 
    id: '36421243-c1ed-4f27-8554-8ee8c1460f94', 
    type: 'dossier' 
  },
  'Hotel Puerta América': { 
    id: '527bbc28-11d2-48ea-a90e-a732ea967498', 
    type: 'dossier' 
  },
  'TERRENO TORREMOLINOS': { 
    id: 'ecbdac21-c9bd-46bd-8627-1347f399ac1a', 
    type: 'dossier' 
  },
  'Plaza Santa Ana': { 
    id: 'cf52a653-b224-43d8-8b99-f62523e4aefe', 
    type: 'dossier' 
  },
  'Bárbara de Braganza': { 
    id: 'd2c7ed7c-5a0d-43cf-8ce0-e78f1d73fe07', 
    type: 'dossier' 
  },
};

export { uploadFile, extractReference, propertyMappings };
