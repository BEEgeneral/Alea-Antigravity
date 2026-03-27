import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWpob2lyb3B2eWV2eWt2cWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcwNTA3MywiZXhwIjoyMDg3MjgxMDczfQ.yS9a0r4PUSASs50SOC3Q5H4Z-Q9HfYUHz2vLHwK21es'
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'fetch_emails') {
            // Dynamic import for Node.js built-in modules
            const imap = await import('imap');
            const email = await import('emailjs');
            
            const IMAP_CONFIG = {
                user: process.env.IMAP_USER || 'aleaemailia@aleasignature.com',
                password: process.env.IMAP_PASSWORD || '',
                host: process.env.IMAP_HOST || 'mail.aleasignature.com',
                port: 993,
                tls: true
            };

            const simpleimap = new email.SimpleIMAPClient(IMAP_CONFIG.host, IMAP_CONFIG.port, IMAP_CONFIG.tls);
            
            try {
                await simpleimap.connect();
                await simpleimap.login(IMAP_CONFIG.user, IMAP_CONFIG.password);
                await simpleimap.select('INBOX');
                
                const UNSEEN = await simpleimap.search('UNSEEN');
                const results = [];
                
                for (const msgId of UNSEEN.slice(0, 5)) {
                    const message = await simpleimap.getMessage(msgId);
                    const from = message.from?.[0]?.address || 'unknown';
                    const subject = message.subject || 'Sin asunto';
                    const text = message.text || message.html || '';
                    
                    // Save to Supabase
                    const { data, error } = await supabaseAdmin
                        .from('iai_inbox_suggestions')
                        .insert({
                            original_email_subject: subject,
                            original_email_body: text.substring(0, 15000),
                            sender_email: from,
                            suggestion_type: 'pending',
                            extracted_data: { _source: 'imap_fetch', _fetched_at: new Date().toISOString() },
                            status: 'pending'
                        })
                        .select()
                        .single();
                    
                    results.push({ id: msgId, subject, from, saved: !!data, error });
                }
                
                await simpleimap.logout();
                
                return NextResponse.json({ 
                    success: true, 
                    emails_found: UNSEEN.length,
                    processed: results 
                });
                
            } catch (imapError: any) {
                return NextResponse.json({ 
                    error: 'IMAP Error', 
                    message: imapError.message 
                }, { status: 500 });
            }
        }
        
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

    } catch (error: any) {
        console.error('IMAP Webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ 
        status: 'IMAP Email Fetcher Webhook',
        endpoints: {
            POST: '/api/imap-fetcher?action=fetch_emails'
        }
    });
}
