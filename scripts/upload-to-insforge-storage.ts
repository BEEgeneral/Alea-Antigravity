import { execSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

const FOLDER_PATH = '/Users/albertogala/Library/CloudStorage/Dropbox/Activos AleaSignature/Por inversor';
const INSFORGE_OSS_HOST = 'https://if8rkq6j.eu-central.insforge.app';

const PROPERTY_BY_FOLDER: Record<string, string> = {
  'ACTIVOS ALEX': 'f52a7b90-999a-4874-9328-ed29da8748fa',
  'ACTIVOS RAFA': '3ab56358-0905-41cb-b7d0-d4b77fdabbd0',
  'ACTIVOS CARLOS & DAVID': '527bbc28-11d2-48ea-a90e-a732ea967498',
  'ACTIVOS SILVIA': 'cf52a653-b224-43d8-8b99-f62523e4aefe',
  'ACTIVOS KUBIK': 'ecbdac21-c9bd-46bd-8627-1347f399ac1a',
};

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 80);
}

function uploadToInsForge(filePath: string, key: string): boolean {
  try {
    const result = execSync(
      `npx @insforge/cli storage upload "${filePath}" --bucket dossiers --key "${key}" 2>&1`,
      { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
    );
    return result.includes('Uploaded');
  } catch (e: any) {
    console.log(`   ⚠️ CLI error: ${e.message.substring(0, 100)}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Uploading all files to InsForge Storage\n');

  let totalUploaded = 0;
  let totalFailed = 0;

  for (const [folderName, propertyId] of Object.entries(PROPERTY_BY_FOLDER)) {
    const folderPath = join(FOLDER_PATH, folderName);
    if (!existsSync(folderPath)) {
      console.log(`⚠️ Folder not found: ${folderPath}`);
      continue;
    }

    const files = readdirSync(folderPath);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));
    const imageFiles = files.filter(f => f.match(/\.(jpg|jpeg|png)$/i));
    const allFiles = [...pdfFiles, ...imageFiles];

    console.log(`\n📂 ${folderName} → ${propertyId}`);
    console.log(`   📄 ${pdfFiles.length} PDFs, 🖼️ ${imageFiles.length} images`);

    let folderUploaded = 0;
    let folderFailed = 0;

    for (const file of allFiles) {
      const filePath = join(folderPath, file);
      const key = `${propertyId}/${sanitizeFileName(file)}`;
      const success = uploadToInsForge(filePath, key);

      if (success) {
        console.log(`   ✅ ${file.substring(0, 50)}`);
        folderUploaded++;
      } else {
        console.log(`   ❌ ${file.substring(0, 50)}`);
        folderFailed++;
      }
    }

    console.log(`   ➡️ Uploaded: ${folderUploaded}, Failed: ${folderFailed}`);
    totalUploaded += folderUploaded;
    totalFailed += folderFailed;
  }

  console.log(`\n\n✅ Total: Uploaded ${totalUploaded}, Failed ${totalFailed}`);
  console.log(`\n📁 InsForge Storage URL pattern: ${INSFORGE_OSS_HOST}/storage/v1/object/public/dossiers/{property_id}/{filename}`);
}

main().catch(console.error);