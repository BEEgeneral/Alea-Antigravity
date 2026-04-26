import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';
import OpenAI from 'openai';

const minimax = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY || '',
  baseURL: 'https://api.minimax.io/v1',
});

async function searchGoogle(name: string, company?: string): Promise<string> {
  const query = encodeURIComponent(`${name} ${company || ''} LinkedIn OR Twitter OR website`.trim());
  
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    const html = await response.text();
    
    const urlRegex = /https?:\/\/[^\s<>"]+/g;
    const urls = html.match(urlRegex) || [];
    
    const relevantUrls = urls.filter(url => 
      url.includes('linkedin.com') ||
      url.includes('twitter.com') ||
      url.includes('instagram.com') ||
      url.includes(company?.toLowerCase().replace(/\s+/g, '') || '')
    ).slice(0, 10);
    
    return relevantUrls.join('\n');
  } catch (error: any) {
    console.error('Google search error:', error);
    return '';
  }
}

async function scrapeWebsite(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return '';
    }
    
    const html = await response.text();
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = html.match(emailRegex) || [];
    const uniqueEmails = [...new Set(emails)].filter(e => !e.includes('noreply'));
    
    return `Title: ${title}\nDescription: ${description}\nEmails: ${uniqueEmails.join(', ')}`;
  } catch (error: any) {
    console.error('Website scrape error:', error);
    return '';
  }
}

async function analyzeWithAI(name: string, company: string, scrapedData: string): Promise<{
  linkedin?: string;
  twitter?: string;
  website?: string;
  personality_summary?: string;
}> {
  const prompt = `
  Eres un asistente de OSINT. Analiza la siguiente información sobre "${name}" de "${company}".

  Datos encontrados:
  ${scrapedData}

  Extrae y devuelve SOLO un JSON con este formato, sin texto adicional:
  {
    "linkedin": "URL de LinkedIn si existe",
    "twitter": "URL de Twitter si existe",  
    "website": "URL del sitio web de la empresa si existe",
    "personality_summary": "Resumen breve del perfil público de la persona (máx 200 caracteres)"
  }

  Si no encuentras algo, usa null para ese campo.
  Devuelve null si no hay información suficiente.
  `;

  try {
    const result = await minimax.chat.completions.create({
      model: 'MiniMax-M2.7',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const text = result.choices[0]?.message?.content?.trim() || '';
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  } catch (error: any) {
    console.error('AI analysis error:', error);
    return {};
  }
}

export async function POST(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId, name, company } = await req.json();

    if (!profileId || !name) {
      return NextResponse.json({ error: 'Missing profileId or name' }, { status: 400 });
    }

    await client
      .database
      .from('centurion_profiles')
      .update({ scrape_status: 'in_progress' })
      .eq('id', profileId);

    const { data: job } = await client
      .database
      .from('centurion_scrape_jobs')
      .insert({
        profile_id: profileId,
        scrape_type: 'full_osint',
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    const googleResults = await searchGoogle(name, company);
    
    const aiAnalysis = await analyzeWithAI(name, company, googleResults);
    
    let additionalData = {};
    
    if (aiAnalysis.website) {
      const websiteData = await scrapeWebsite(aiAnalysis.website);
      additionalData = { websiteData };
    }

    const updateData: any = {
      scrape_status: 'completed',
      linkedin_url: aiAnalysis.linkedin,
      twitter_url: aiAnalysis.twitter,
      website_url: aiAnalysis.website,
      google_results: googleResults,
      needs_deep_scrape: !aiAnalysis.linkedin && !aiAnalysis.twitter
    };

    await client
      .database
      .from('centurion_profiles')
      .update(updateData)
      .eq('id', profileId);

    await client
      .database
      .from('centurion_scrape_jobs')
      .update({
        status: 'completed',
        results: { ...aiAnalysis, googleResults, additionalData },
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    return NextResponse.json({
      success: true,
      profileId,
      data: aiAnalysis,
      googleResults,
      needsDeepScrape: updateData.needs_deep_scrape
    });

  } catch (error: any) {
    console.error('OSINT scrape error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
    }

    const { data: profile } = await client
      .database
      .from('centurion_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    const { data: jobs } = await client
      .database
      .from('centurion_scrape_jobs')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ profile, jobs });
  } catch (error: any) {
    console.error('OSINT scrape error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
