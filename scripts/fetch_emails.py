#!/usr/bin/env python3
"""
Script para descargar emails de IMAP y guardarlos en Supabase
Luego dispara el análisis con IA
"""

import os
import json
import imaplib
import email
from email import policy
from email.parser import BytesParser
from datetime import datetime
import requests
from supabase import create_client, Client
import base64
import io
from pathlib import Path

# Configuración - Variables de entorno
IMAP_SERVER = os.environ.get('IMAP_SERVER', 'mail.aleasignature.com')
IMAP_USER = os.environ.get('IMAP_USER', 'aleaemailia@aleasignature.com')
IMAP_PASSWORD = os.environ.get('IMAP_PASSWORD', '')

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://kfmjhoiropvyevykvqey.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')

WEBHOOK_URL = os.environ.get('WEBHOOK_URL', 'https://aleasignature.com/api/webhook/email')

def connect_imap():
    """Conectar al servidor IMAP"""
    print(f"Conectando a {IMAP_SERVER}...")
    mail = imaplib.IMAP4_SSL(IMAP_SERVER)
    mail.login(IMAP_USER, IMAP_PASSWORD)
    print("✅ Conectado exitosamente")
    return mail

def get_emails(mail, limit=10):
    """Obtener emails no leídos"""
    mail.select('INBOX')
    
    # Buscar emails no leídos
    status, messages = mail.search(None, 'UNSEEN')
    if status != 'OK':
        print("❌ Error buscando emails")
        return []
    
    email_ids = messages[0].split()
    print(f"📧 {len(email_ids)} emails nuevos encontrados")
    
    emails_data = []
    for email_id in email_ids[:limit]:
        try:
            status, msg_data = mail.fetch(email_id, '(RFC822)')
            if status != 'OK':
                continue
                
            msg = email.message_from_bytes(msg_data[0][1], policy=policy.default)
            email_data = parse_email(msg)
            emails_data.append(email_data)
            
        except Exception as e:
            print(f"❌ Error procesando email {email_id}: {e}")
    
    return emails_data

def parse_email(msg):
    """Extraer datos del email"""
    # From
    from_addr = email.utils.parseaddr(msg['From'])
    sender_email = from_addr[1] if from_addr[1] else 'unknown'
    sender_name = from_addr[0] if from_addr[0] else ''
    
    # Subject
    subject = msg['Subject'] or 'Sin asunto'
    
    # Date
    date = msg['Date']
    
    # Body
    body_text = ''
    body_html = ''
    attachments = []
    
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get('Content-Disposition'))
            
            # Texto plano
            if content_type == 'text/plain' and 'attachment' not in content_disposition:
                try:
                    body_text = part.get_content()
                except:
                    body_text = str(part)
            
            # HTML
            elif content_type == 'text/html' and 'attachment' not in content_disposition:
                try:
                    body_html = part.get_content()
                except:
                    body_html = str(part)
            
            # Adjuntos
            elif 'attachment' in content_disposition:
                filename = part.get_filename()
                if filename:
                    try:
                        attachment_data = part.get_payload(decode=True)
                        attachments.append({
                            'filename': filename,
                            'content_type': content_type,
                            'data': base64.b64encode(attachment_data).decode('utf-8') if attachment_data else ''
                        })
                    except Exception as e:
                        print(f"  ⚠️ Error descargando adjunto {filename}: {e}")
    else:
        # Email no multipart
        try:
            body_text = msg.get_content()
        except:
            body_text = str(msg)
    
    return {
        'sender_email': sender_email,
        'sender_name': sender_name,
        'subject': subject,
        'date': date,
        'body_text': body_text[:50000] if body_text else '',  # Limitar tamaño
        'body_html': body_html[:50000] if body_html else '',
        'attachments': attachments
    }

def save_to_supabase(email_data):
    """Guardar email en Supabase"""
    if not SUPABASE_KEY:
        print("❌ SUPABASE_KEY no configurada")
        return None
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Guardar en tabla iai_inbox_suggestions
    record = {
        'original_email_subject': email_data['subject'],
        'original_email_body': email_data['body_text'],
        'sender_email': email_data['sender_email'],
        'suggestion_type': 'pending',
        'extracted_data': {
            '_source': 'imap_fetch',
            '_sender_name': email_data['sender_name'],
            '_attachments_count': len(email_data['attachments']),
            '_fetched_at': datetime.now().isoformat()
        },
        'status': 'pending'
    }
    
    result = supabase.table('iai_inbox_suggestions').insert(record).execute()
    
    if result.data:
        print(f"✅ Email guardado en Supabase (ID: {result.data[0]['id']})")
        return result.data[0]['id']
    else:
        print(f"❌ Error guardando: {result.error}")
        return None

def trigger_ai_analysis(email_data):
    """Disparar análisis con IA"""
    payload = {
        'from': email_data['sender_email'],
        'subject': email_data['subject'],
        'text': email_data['body_text'],
        'attachments': [{'filename': a['filename']} for a in email_data['attachments']]
    }
    
    # Si hay adjuntos de texto, incluir el contenido
    text_attachments = [a for a in email_data['attachments'] 
                       if a['filename'].lower().endswith(('.txt', '.pdf', '.doc', '.docx'))]
    if text_attachments:
        # Combinar contenido de adjuntos de texto
        combined_text = '\n\n--- ADJUNTO ---\n'.join([
            a['data'][:10000] for a in text_attachments[:3]  # Máximo 3 adjuntos
        ])
        payload['attachment_text'] = combined_text
    
    try:
        response = requests.post(WEBHOOK_URL, json=payload, timeout=60)
        if response.ok:
            print(f"✅ Análisis IA iniciado: {response.json()}")
            return True
        else:
            print(f"❌ Error en webhook: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error disparando análisis: {e}")
        return False

def mark_as_read(mail, email_id):
    """Marcar email como leído"""
    try:
        mail.store(email_id, '+FLAGS', '\\Seen')
    except:
        pass

def main():
    print("=" * 50)
    print("🔍 Alea Signature - Email Fetcher")
    print("=" * 50)
    
    if not IMAP_PASSWORD:
        print("❌ Error: IMAP_PASSWORD no configurada")
        print("   Configura la variable de entorno IMAP_PASSWORD")
        return
    
    try:
        # Conectar
        mail = connect_imap()
        
        # Obtener emails
        emails = get_emails(mail, limit=5)
        
        if not emails:
            print("📭 No hay emails nuevos")
            return
        
        # Procesar cada email
        for email_data in emails:
            print(f"\n📧 Procesando: {email_data['subject']}")
            
            # Guardar en Supabase
            record_id = save_to_supabase(email_data)
            
            if record_id:
                # Trigger AI analysis
                trigger_ai_analysis(email_data)
            
            # Marcar como leído (opcional)
            # mark_as_read(mail, email_id)
        
        print("\n✅ Proceso completado")
        
    except imaplib.IMAP4.error as e:
        print(f"❌ Error IMAP: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        try:
            mail.logout()
        except:
            pass

if __name__ == '__main__':
    main()
