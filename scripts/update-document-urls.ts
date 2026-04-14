import { execSync } from 'child_process';

const INSFORGE_OSS_HOST = 'https://if8rkq6j.eu-central.insforge.app';

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function getInsForgeUrl(propertyId: string, fileName: string): string {
  return `${INSFORGE_OSS_HOST}/storage/v1/object/public/dossiers/${propertyId}/${fileName}`;
}

function updateDocumentUrl(documentId: string, newUrl: string): boolean {
  try {
    execSync(
      `npx @insforge/cli db query "UPDATE documents SET file_path = '${newUrl}' WHERE id = '${documentId}'" 2>&1`,
      { encoding: 'utf8' }
    );
    return true;
  } catch (e: any) {
    console.log(`   ⚠️ Error updating ${documentId}: ${e.message.substring(0, 100)}`);
    return false;
  }
}

const documents = [
  { id: '654426aa-e3cf-45b9-b1ad-7167a15da67c', propertyId: 'f52a7b90-999a-4874-9328-ed29da8748fa', fileName: 'Cafe__Chinitas-_2025__1_.pdf' },
  { id: 'e6dc4ae4-5383-4eeb-bf8e-a21310b2d350', propertyId: 'f52a7b90-999a-4874-9328-ed29da8748fa', fileName: 'Cafe__Chinitas-_2025.pdf' },
  { id: 'c23619fe-a502-492b-9102-ab29d480a48c', propertyId: 'f52a7b90-999a-4874-9328-ed29da8748fa', fileName: 'HOTELES_EN_VENTA_COSTA_DEL_SOL_Y_MADRID.pdf' },
  { id: 'e90caa41-9503-48fa-a690-ca564efbd8e1', propertyId: 'f52a7b90-999a-4874-9328-ed29da8748fa', fileName: 'PROYECTO_OLIVIA_PAGODA_FUENGIROLA.pdf' },
  { id: 'c6240786-0718-4bb7-bbde-619476b5d846', propertyId: 'f52a7b90-999a-4874-9328-ed29da8748fa', fileName: 'Seleccio_n_Hoteles_Praetorium_AleaSignature.pdf' },
  { id: '46368f31-6fc7-4e66-8266-3db7fe5cf9b1', propertyId: 'c56afa6b-e26e-438e-a4c7-83bd2eafe159', fileName: 'DOC-20260125-WA0053..pdf' },
  { id: 'bbeaf342-466b-4c9d-902b-6abbb684a90c', propertyId: 'c56afa6b-e26e-438e-a4c7-83bd2eafe159', fileName: 'Hotel_Puerta_Ame_rica__2_.pdf' },
  { id: '6d035fc3-421c-47a1-8b32-d0b93945856e', propertyId: 'c56afa6b-e26e-438e-a4c7-83bd2eafe159', fileName: 'Plan_Suelo_Mo_stoles_.pdf' },
  { id: 'd8c4360a-8ac1-423c-82c6-90010002b34d', propertyId: 'c56afa6b-e26e-438e-a4c7-83bd2eafe159', fileName: 'SUELO_URBANO_CALLE_JAE_N_5_MOSTOLES.pdf' },
  { id: '16898558-95ef-4365-862d-a0567de92175', propertyId: 'c56afa6b-e26e-438e-a4c7-83bd2eafe159', fileName: 'Sin_ti_tulo_10.pdf' },
  { id: '380f7757-7f23-4f00-9a77-2f81991d56b4', propertyId: 'c56afa6b-e26e-438e-a4c7-83bd2eafe159', fileName: 'Sin_ti_tulo_9.pdf' },
  { id: 'a9bf4da9-3606-4859-9656-b6e8c5870006', propertyId: 'c56afa6b-e26e-438e-a4c7-83bd2eafe159', fileName: 'UBICACION.pdf' },
  { id: '57c5a4aa-6f88-408d-a86f-5e74f5406a73', propertyId: 'ecbdac21-c9bd-46bd-8627-1347f399ac1a', fileName: 'TERRENO_TORREMOLINOS.pdf' },
  { id: '84e08508-4de0-46b0-9e54-b8ec583f8c22', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: '1T_50225.pdf' },
  { id: '17dc2e40-8b1d-4afa-960b-d3aec484c3ee', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'AC228_Teaser_vDEF1.pdf' },
  { id: 'fee951f8-b3d0-4933-8807-0ae5847efa71', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'ACUMULADO_50225.pdf' },
  { id: '7d2b98b8-77fb-4366-81d7-00b947d18b9d', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'BUSINESS_PLAN_CATALINA.pdf' },
  { id: '7aa46ff6-53ae-4cc9-ba70-c1a1ad500c54', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'Cuaderno_informativo_administracio_n_loterias_Maruja.pdf' },
  { id: 'abbe05f3-8cea-4761-8aeb-6ac08211101e', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'Dossier_Conde_de_la_Cimera_6___vr.pdf' },
  { id: '80097a32-5fae-4813-8ebb-ba784265828f', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'JA4_Teaser_vDEF1.pdf' },
  { id: '3c4939a4-007f-4453-8f30-cddd13288f90', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'NDA_EDIFICIO_BARAJAS__1_.pdf' },
  { id: '9f9b236f-dd60-4749-8add-b9ce100100ad', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'NOTA_NACHO_DEL_ARCO_ACANTO_2_MADRID_1.pdf' },
  { id: 'f2abe555-4c31-4423-a881-2f0587b62678', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'PLANO_PLANTA_ALTA.pdf' },
  { id: 'fce43b5a-52e1-4d3b-ba3d-afd8467c25e2', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'PLANO_PLANTA_BAJA.pdf' },
  { id: 'd608c52b-38ef-48ba-8515-91129161ead7', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'PROYECTO_MATISSE_RESIDENCIA_ESTUDIANTES_VALENCIA.pdf' },
  { id: '0c802056-9f9a-47ae-8a6b-0b6def00f32e', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'DATOS_CATASTRO.jpeg' },
  { id: '41634f0b-7bbe-4ca8-9194-b8b43f5c0325', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'FACHADA.jpg' },
  { id: 'a5fbc2d3-74a0-451b-b4c1-3eeed234fdb6', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'FACTURACION_CATALINA_SUAREZ_DIC-25.jpg' },
  { id: 'fc483721-3291-4b2f-9264-5d4b7d3bffa7', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'FACTURACION_CATALINA_SUAREZ_NOV-25.jpg' },
  { id: 'a1be507d-e076-4909-a54a-9bd71a0d37e8', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'FACTURACIONES_CATALINA_SUAREZ_DESDE_15-02_A_11-09-25.jpg' },
  { id: '1f09f9bd-48df-4339-a074-6a512c02d1be', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'FACTURACIONES_CATALINA_SUAREZ_SEP_Y_OCT-25.jpg' },
  { id: '8527bedd-2c47-4f0d-b5e0-c581d29c29b2', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'IBI_BARAJAS.jpeg' },
  { id: '91a76d3c-9e3a-45a6-9582-40a2867bd6ec', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'IMG_5520.jpg' },
  { id: '35ed1532-8b88-4259-ada5-a78ab9f07fd5', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'IMG_5521.jpg' },
  { id: '124a5ab1-3e77-48be-8430-89dd7351e668', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'IMG_5522.jpg' },
  { id: '5599ccfe-2bbb-4130-bf78-9bb57af2044b', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'IMG_5523.jpg' },
  { id: 'fc2d4d84-9785-47d3-8a7f-979a3acde791', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'IMG_5524.jpg' },
  { id: 'cb313e0a-c0f4-4123-b7df-88bfec1a96d5', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'IMG_5525.jpg' },
  { id: '3c0c3dc5-9c1b-4ee2-b5c7-05ea6631c8f6', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'IMG_5526.jpg' },
  { id: '1e31c41c-497c-4e77-a031-168a7b9be5e8', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'IMG_5527.jpg' },
  { id: '7cc918ee-d17f-45aa-abb1-6f2e245714b2', propertyId: 'cf52a653-b224-43d8-8b99-f62523e4aefe', fileName: '3_77_PLANOS_PISO_BARBARA_DE_BRAGANZA.pdf' },
  { id: 'a3009332-ef38-4af0-83b5-2d5c1a035587', propertyId: 'cf52a653-b224-43d8-8b99-f62523e4aefe', fileName: 'PLANO_GARAJE.pdf' },
  { id: '8317e0ad-3520-4bf7-8d06-ed84611ac9e5', propertyId: 'cf52a653-b224-43d8-8b99-f62523e4aefe', fileName: 'PLANO_PLANTA_ALTA.pdf' },
  { id: '5431c412-39ca-40cf-b6a4-75d59f591cc4', propertyId: 'cf52a653-b224-43d8-8b99-f62523e4aefe', fileName: 'PLANO_PLANTA_BAJA.pdf' },
  { id: '9f72abed-bed5-4684-96a2-3097d3f84e51', propertyId: 'cf52a653-b224-43d8-8b99-f62523e4aefe', fileName: 'Plaza_Santa_Ana_13_vf3.pdf' },
  { id: '211beeb1-8e9d-4ed5-af7e-f6b199e81c1a', propertyId: 'cf52a653-b224-43d8-8b99-f62523e4aefe', fileName: 'IBI_BARAJAS.jpeg' },
  { id: '2fd15b8e-fde3-40bf-b3a2-b1fa81baadf3', propertyId: 'cf52a653-b224-43d8-8b99-f62523e4aefe', fileName: 'IBI_OFICINAS_BARAJAS.jpg' },
  { id: '78245d32-7341-479a-9951-167bac1ae4d5', propertyId: 'f52a7b90-999a-4874-9328-ed29da8748fa', fileName: 'Dossier_Palacio_Trinidad_Grund-5_2_compressed.pdf' },
  { id: '768087d5-f437-433e-bd70-581337c19bb0', propertyId: 'c56afa6b-e26e-438e-a4c7-83bd2eafe159', fileName: 'HOTELES_IZAN_compressed.pdf' },
  { id: '73c7b96a-394c-4f05-a806-4b1f5969507c', propertyId: '3ab56358-0905-41cb-b7d0-d4b77fdabbd0', fileName: 'Plaza_Nueva_MB_1_compressed.pdf' },
  { id: '4b766b06-ca0f-41fa-976d-356bcfbd91c2', propertyId: 'c336e9cc-a939-47e3-b153-9a74e926ba9b', fileName: 'EDIFICIO_OFICINAS_VALENTIN_BEATO_CF_ultra_compressed.pdf' },
  { id: '88147a5e-f259-4582-bd38-35075dcd9178', propertyId: 'c56afa6b-e26e-438e-a4c7-83bd2eafe159', fileName: 'Presentacion_Modificada_Izan_Hoteles_compressed.pdf' },
];

async function main() {
  console.log('🚀 Updating document URLs to InsForge\n');

  let updated = 0;
  let failed = 0;

  for (const doc of documents) {
    const newUrl = getInsForgeUrl(doc.propertyId, doc.fileName);
    const success = updateDocumentUrl(doc.id, newUrl);

    if (success) {
      console.log(`   ✅ ${doc.id.substring(0, 8)}... → ${doc.fileName.substring(0, 40)}`);
      updated++;
    } else {
      console.log(`   ❌ ${doc.id.substring(0, 8)}...`);
      failed++;
    }
  }

  console.log(`\n\n✅ Updated: ${updated}, Failed: ${failed}`);
}

main().catch(console.error);