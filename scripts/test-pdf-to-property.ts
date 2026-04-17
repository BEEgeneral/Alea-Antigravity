import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { analyzeWithMinimax } from '../src/lib/minimax';

const SUPABASE_URL = 'https://if8rkq6j.insforge.app';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJpbnNmb3JnZSIsInJvbGUiOiJzZXJ2aWNlIn0.placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadFile(bucket: string, filePath: string, fileName: string) {
    const fileBuffer = readFileSync(filePath);
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, fileBuffer, { contentType: 'application/pdf' });

    if (error) {
        console.error('Upload error:', error);
        return null;
    }

    return `${SUPABASE_URL}/api/storage/buckets/${bucket}/objects/${fileName}`;
}

async function extractTextFromPDF(pdfPath: string): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

    const data = new Uint8Array(readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({
        data,
        useSystemFonts: true,
        disableFontFace: true,
        verbosity: 0
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `\n--- Page ${i} ---\n${pageText}`;
    }

    return fullText;
}

async function parseWithMinimax(text: string) {
    const prompt = `
    Analiza este texto extraído de un documento PDF (posiblemente un dossier o presentación de oportunidad inmobiliaria/inversión).
    Es para un CRM Institucional.

    Extrae la información relevante al activo o negocio detectado.
    Devuelve estrictamente un objeto JSON con esta estructura (nada más):
    {
      "extracted_data": {
         "title": "string",
         "type": "Hotel, Edificio, Suelo, Retail, Oficinas, Logístico, Otro",
         "price": 0,
         "location": "string",
         "surface": 0,
         "vendor_name": "string o null",
         "comision_tercero": 0,
         "comision_interna": 0,
         "summary": "Resumen muy breve de 1 línea del activo",
         "extended_data": {
            "economics": { "gastos": "string", "ibi": "string", "tasas": "string", "estado_gestion": "string" },
            "surfaces": { "parcela": "number", "construida": "number", "distribucion": "string", "equipamiento": "string" },
            "urbanistic": { "uso_principal": "string", "edificabilidad": "string", "normativa": "string" },
            "investment": { "rentabilidad": "string", "capex": "string", "valoracion": "string" }
         }
      }
    }

    Texto del documento:
    ${text}
    `;

    const { analysis, rawResponse } = await analyzeWithMinimax(
        prompt,
        'Eres un analizador de documentos inmobiliarios. Responde en JSON estricto.'
    );

    try {
        return typeof analysis === 'object' && analysis !== null ? analysis : JSON.parse(rawResponse);
    } catch {
        return JSON.parse(rawResponse);
    }
}

async function createProperty(propertyData: any) {
    const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

    if (error) {
        console.error('Create property error:', error);
        return null;
    }

    return data;
}

async function searchProperty(title: string) {
    const { data, error } = await supabase
        .from('properties')
        .select('id, title, location, price_eur')
        .ilike('title', `%${title}%`)
        .limit(5);

    if (error) {
        console.error('Search error:', error);
        return [];
    }

    return data || [];
}

async function main() {
    const pdfPath = '/Users/albertogala/Downloads/Activos Alea Subir/Proyecto de Habitaciones _ Zona Chueca _VR..pdf';
    const fileName = `dossiers/test_${Date.now()}_Chueca.pdf`;

    console.log('=== TEST: PDF to Property Creation ===\n');

    // Step 1: Search if property exists
    console.log('1. Buscando propiedad existente en DB...');
    const existing = await searchProperty('Chueca');
    console.log(`   Encontradas: ${existing.length}`);
    if (existing.length > 0) {
        existing.forEach(p => console.log(`   - ${p.title} (${p.location})`));
        console.log('\n✅ Propiedad ya existe en base de datos');
        return;
    }
    console.log('   No encontrada, procediendo con extracción...\n');

    // Step 2: Extract text from PDF
    console.log('2. Extrayendo texto del PDF...');
    const text = await extractTextFromPDF(pdfPath);
    console.log(`   Texto extraído: ${text.length} caracteres\n`);
    console.log('   Preview:', text.substring(0, 300) + '...\n');

    // Step 3: Parse with MiniMax
    console.log('3. Analizando con MiniMax...');
    const parsed = await parseWithMinimax(text);
    console.log('   Resultado:', JSON.stringify(parsed, null, 2).substring(0, 500) + '...\n');

    // Step 4: Upload PDF to storage
    console.log('4. Subiendo PDF a storage...');
    const pdfUrl = await uploadFile('properties', pdfPath, fileName);
    console.log(`   URL: ${pdfUrl}\n`);

    // Step 5: Create property
    if (parsed?.extracted_data) {
        console.log('5. Creando propiedad en base de datos...');
        const typeMapping: any = {
            'Hotel': 'hotel',
            'Edificio': 'building',
            'Suelo': 'land',
            'Retail': 'retail',
            'Oficinas': 'office',
            'Logístico': 'industrial',
            'Otro': 'other'
        };

        const propertyData = {
            title: parsed.extracted_data.title || 'Proyecto Habitaciones Chueca',
            description: `Ubicación: ${parsed.extracted_data.location || 'Madrid'}\n` +
                        `Tipo: ${parsed.extracted_data.type || 'Otro'}\n` +
                        `Precio: ${parsed.extracted_data.price || 'Por confirmar'}\n` +
                        `Superficie: ${parsed.extracted_data.surface || 'N/A'} m²\n` +
                        `Vendedor: ${parsed.extracted_data.vendor_name || 'N/A'}`,
            price_eur: parsed.extracted_data.price || 0,
            location: parsed.extracted_data.location || 'Madrid',
            asset_type: typeMapping[parsed.extracted_data.type] || 'other',
            is_off_market: true,
            status: 'Origen Privado',
            m2_total: parsed.extracted_data.surface || 0,
            extended_data: {
                ...parsed.extracted_data.extended_data,
                dossier_url: pdfUrl,
                vendor_name: parsed.extracted_data.vendor_name,
                comision_tercero: parsed.extracted_data.comision_tercero || 0,
                comision_interna: parsed.extracted_data.comision_interna || 0,
                _source: 'pdf_test',
                _created_at: new Date().toISOString()
            }
        };

        const created = await createProperty(propertyData);
        if (created) {
            console.log(`\n✅ PROPIEDAD CREADA EXITOSAMENTE`);
            console.log(`   ID: ${created.id}`);
            console.log(`   Título: ${created.title}`);
            console.log(`   Location: ${created.location}`);
            console.log(`   URL PDF: ${pdfUrl}`);
        }
    } else {
        console.log('\n❌ No se pudo parsear el PDF - respuesta inválida');
    }
}

main().catch(console.error);