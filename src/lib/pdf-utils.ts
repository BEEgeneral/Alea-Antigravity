'use client';

import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractedPageImage {
  page: number;
  data: string;
  width: number;
  height: number;
}

export interface ExtractedPDFContent {
  text: string;
  images: ExtractedPageImage[];
  metadata: {
    title?: string;
    author?: string;
    pageCount: number;
  };
}

export async function extractTextFromPDF(base64Data: string): Promise<string> {
  const content = await extractPDFContent(base64Data);
  return content.text;
}

export async function extractPDFContent(base64Data: string): Promise<ExtractedPDFContent> {
  try {
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    
    let fullText = '';
    const images: ExtractedPageImage[] = [];
    
    const scale = 1.5;
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
      
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      
      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        images.push({
          page: i,
          data: imageData,
          width: viewport.width,
          height: viewport.height
        });
      }
    }
    
    let title: string | undefined;
    let author: string | undefined;
    try {
      const meta = await pdf.getMetadata();
      if (meta.info && typeof meta.info === 'object') {
        const info = meta.info as Record<string, unknown>;
        title = info.Title as string | undefined;
        author = info.Author as string | undefined;
      }
    } catch (e) {}
    
    return {
      text: fullText.trim(),
      images,
      metadata: {
        title,
        author,
        pageCount: pdf.numPages
      }
    };
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    return { text: '', images: [], metadata: { pageCount: 0 } };
  }
}

export function isPDFContentType(type: string): boolean {
  return type === 'application/pdf';
}

export function isImageContentType(type: string): boolean {
  return type.startsWith('image/');
}

export function dataURLToBlob(dataURL: string): Blob {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeType = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}