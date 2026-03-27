#!/usr/bin/env python3
"""
Email fetcher con soporte para adjuntos
"""

import os
import imaplib
import email
import base64
import io

IMAP_SERVER = 'sh-europe2716.banahosting.com'
IMAP_USER = 'aleaemailia@aleasignature.com'
IMAP_PASSWORD = os.environ.get('IMAP_PASSWORD', 'Gala@1998')
WEBHOOK_URL = 'https://aleasignature.com/api/webhook/email'

def get_email_body(msg):
    """Extraer cuerpo del email"""
    body = ''
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == 'text/plain' and 'attachment' not in str(part.get('Content-Disposition', '')):
                try:
                    payload = part.get_payload(decode=True)
                    if payload:
                        body = payload.decode('utf-8', errors='ignore')
                        return body
                except:
                    pass
    else:
        try:
            payload = msg.get_payload(decode=True)
            if payload:
                body = payload.decode('utf-8', errors='ignore')
        except:
            pass
    return body[:15000]

def get_attachments(msg):
    """Extraer adjuntos"""
    attachments = []
    
    if msg.is_multipart():
        for part in msg.walk():
            filename = part.get_filename()
            if filename and 'attachment' in str(part.get('Content-Disposition', '')):
                data = part.get_payload(decode=True)
                if data:
                    content_type = part.get_content_type()
                    
                    # Si es PDF o texto, guardar contenido
                    if content_type == 'application/pdf':
                        # Convertir a base64
                        b64_data = base64.b64encode(data).decode('utf-8')
                        attachments.append({
                            'filename': filename,
                            'content_type': content_type,
                            'data': b64_data,
                            'is_pdf': True
                        })
                    elif content_type.startswith('text/'):
                        try:
                            text_data = data.decode('utf-8', errors='ignore')
                            attachments.append({
                                'filename': filename,
                                'content_type': content_type,
                                'text': text_data[:20000],
                                'is_text': True
                            })
                        except:
                            pass
    
    return attachments

def main():
    print("Conectando...")
    mail = imaplib.IMAP4_SSL(IMAP_SERVER, timeout=15)
    print("Login...")
    mail.login(IMAP_USER, IMAP_PASSWORD)
    print("Seleccionando INBOX...")
    mail.select('INBOX')
    
    print("Buscando emails...")
    status, messages = mail.search(None, 'UNSEEN')
    email_ids = messages[0].split()
    print(f"Emails nuevos: {len(email_ids)}")
    
    import requests
    
    for eid in email_ids[:5]:
        status, msg_data = mail.fetch(eid, '(RFC822)')
        msg = email.message_from_bytes(msg_data[0][1])
        
        from_addr = email.utils.parseaddr(msg['From'])
        subject = msg['Subject'] or 'Sin asunto'
        
        body = get_email_body(msg)
        attachments = get_attachments(msg)
        
        print(f"Email: {subject}")
        print(f"  From: {from_addr[1]}")
        print(f"  Adjuntos: {len(attachments)}")
        
        # Preparar payload
        payload = {
            'from': from_addr[1],
            'subject': subject,
            'text': body
        }
        
        # Añadir info de adjuntos
        if attachments:
            # Enviar contenido de adjuntos de texto para análisis IA
            text_attachments = [a for a in attachments if a.get('is_text')]
            if text_attachments:
                payload['attachment_text'] = '\n\n--- ADJUNTO ---\n'.join(
                    a['text'] for a in text_attachments
                )
            
            # Enviar PDFs codificados en base64 para guardar en Supabase
            pdf_attachments = [a for a in attachments if a.get('is_pdf')]
            if pdf_attachments:
                payload['attachment_data'] = [
                    {'filename': a['filename'], 'content_type': a['content_type'], 'data': a['data']}
                    for a in pdf_attachments[:2]
                ]
        
        try:
            r = requests.post(WEBHOOK_URL, json=payload, timeout=60)
            print(f"  Webhook: {r.status_code}")
            if r.status_code != 200:
                print(f"  Error: {r.text[:200]}")
        except Exception as e:
            print(f"  Error webhook: {e}")
    
    mail.logout()
    print("\nListo!")

if __name__ == '__main__':
    main()
