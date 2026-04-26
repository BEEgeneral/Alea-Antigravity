import OpenAI from 'openai';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = 'https://api.minimax.io/v1';

export const minimax = new OpenAI({
    apiKey: MINIMAX_API_KEY,
    baseURL: MINIMAX_BASE_URL,
});

export async function generateText(
    prompt: string,
    options: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        responseFormat?: 'text' | 'json_object';
    } = {}
): Promise<string> {
    const {
        model = 'MiniMax-M2.7',
        temperature = 0.7,
        maxTokens = 1000,
        responseFormat
    } = options;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'user', content: prompt }
    ];

    const requestOptions: OpenAI.Chat.ChatCompletionCreateParams = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
    };

    if (responseFormat === 'json_object') {
        requestOptions.response_format = { type: 'json_object' };
    }

    const response = await minimax.chat.completions.create(requestOptions);

    return response.choices[0]?.message?.content || '';
}

export async function analyzeWithMinimax(
    prompt: string,
    systemPrompt?: string
): Promise<{
    analysis: any;
    rawResponse: string;
}> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await minimax.chat.completions.create({
        model: 'MiniMax-M2.7',
        messages,
        temperature: 0.1,
        max_tokens: 2000,
    });

    const rawResponse = response.choices[0]?.message?.content || '';

    let analysis = {};
    try {
        analysis = JSON.parse(rawResponse);
    } catch {
        analysis = { raw: rawResponse };
    }

    return { analysis, rawResponse };
}

export interface ImageContent {
    type: 'image_url';
    image_url: {
        url: string;
        detail?: 'low' | 'high' | 'auto';
    };
}

export interface TextContent {
    type: 'text';
    text: string;
}

export type MessageContent = ImageContent | TextContent;

export async function analyzeImage(
    imageBase64: string,
    prompt: string,
    options: {
        model?: string;
        detail?: 'low' | 'high' | 'auto';
    } = {}
): Promise<string> {
    const {
        model = 'MiniMax-VL01',
        detail = 'high'
    } = options;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
            role: 'user',
            content: [
                {
                    type: 'image_url',
                    image_url: {
                        url: `data:image/jpeg;base64,${imageBase64}`,
                        detail
                    }
                },
                {
                    type: 'text',
                    text: prompt
                }
            ]
        }
    ];

    const response = await minimax.chat.completions.create({
        model,
        messages,
        temperature: 0.1,
        max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || '';
}

export async function analyzeImagesAndText(
    images: Array<{ base64: string; page?: number }>,
    text: string,
    prompt: string,
    options: {
        model?: string;
        detail?: 'low' | 'high' | 'auto';
    } = {}
): Promise<{
    analysis: any;
    rawResponse: string;
}> {
    const {
        model = 'MiniMax-VL01',
        detail = 'high'
    } = options;

    const content: MessageContent[] = [];

    for (const img of images.slice(0, 5)) {
        content.push({
            type: 'image_url',
            image_url: {
                url: `data:image/jpeg;base64,${img.base64}`,
                detail
            }
        });
    }

    content.push({
        type: 'text',
        text: `${prompt}\n\nTexto del documento:\n${text.substring(0, 3000)}`
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
            role: 'user',
            content
        }
    ];

    const response = await minimax.chat.completions.create({
        model,
        messages,
        temperature: 0.1,
        max_tokens: 3000,
    });

    const rawResponse = response.choices[0]?.message?.content || '';

    let analysis = {};
    try {
        analysis = JSON.parse(rawResponse);
    } catch {
        analysis = { raw: rawResponse };
    }

    return { analysis, rawResponse };
}