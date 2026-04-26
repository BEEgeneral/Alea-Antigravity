/**
 * MiniMax — Alea Signature AI wrapper
 * ==================================
 * Re-exports from unified alea-ai.ts for backward compatibility.
 * All new code should import directly from `./alea-ai`.
 */

export { getAleaAIClient, isAleaAIConfigured } from './alea-ai';
export { AleaAIClient } from './alea-ai';
export type { AleaAIOptions, AleaAIResponse, AleaAIStreamChunk } from './alea-ai';

// Backward-compatible re-exports
import { getAleaAIClient } from './alea-ai';

export async function generateText(
    prompt: string,
    options: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        responseFormat?: 'text' | 'json_object';
    } = {}
): Promise<string> {
    const client = getAleaAIClient();
    return client.generateText(prompt, options);
}

export async function analyzeWithMinimax(
    prompt: string,
    systemPrompt?: string
): Promise<{ analysis: any; rawResponse: string }> {
    const client = getAleaAIClient();
    return client.analyze(prompt, { systemPrompt });
}

export interface ImageContent {
    type: 'image_url';
    image_url: { url: string; detail?: 'low' | 'high' | 'auto' };
}

export interface TextContent {
    type: 'text';
    text: string;
}

export type MessageContent = ImageContent | TextContent;

export async function analyzeImage(
    imageBase64: string,
    prompt: string,
    options: { model?: string; detail?: 'low' | 'high' | 'auto' } = {}
): Promise<string> {
    const client = getAleaAIClient();
    const result = await client.analyzeImages([{ base64: imageBase64 }], '', prompt, options);
    return result.rawResponse;
}

export async function analyzeImagesAndText(
    images: Array<{ base64: string; page?: number }>,
    text: string,
    prompt: string,
    options: { model?: string; detail?: 'low' | 'high' | 'auto' } = {}
): Promise<{ analysis: any; rawResponse: string }> {
    const client = getAleaAIClient();
    return client.analyzeImages(images, text, prompt, options);
}
