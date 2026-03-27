#!/usr/bin/env python3
"""
Simple email fetcher - sin dependencias externas de IMAP complejas
"""

import os
import imaplib
import email
import base64

IMAP_SERVER = 'sh-europe2716.banahosting.com'
IMAP_USER = 'aleaemailia@aleasignature.com'
IMAP_PASSWORD = os.environ.get('IMAP_PASSWORD', 'Gala@1998')
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWpob2lyb3B2eWV2eWt2cWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDUwNzMsImV4cCI6MjA4NzI4MTA3M30.HDt4ZOaWY5OksFKq2SDprrkc_-Xemo5z9_Z8mZytS_o'
WEBHOOK_URL = 'https://aleasignature.com/api/webhook/email'

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
    
    for eid in email_ids[:3]:
        status, msg_data = mail.fetch(eid, '(RFC822)')
        msg = email.message_from_bytes(msg_data[0][1])
        
        from_addr = email.utils.parseaddr(msg['From'])
        subject = msg['Subject'] or 'Sin asunto'
        
        body = ''
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == 'text/plain':
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')[:10000]
                    break
        else:
            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')[:10000]
        
        print(f"Email: {subject} - From: {from_addr[1]}")
        
        # Enviar al webhook
        import requests
        try:
            r = requests.post(WEBHOOK_URL, json={
                'from': from_addr[1],
                'subject': subject,
                'text': body
            }, timeout=30)
            print(f"Webhook: {r.status_code}")
        except Exception as e:
            print(f"Error webhook: {e}")
    
    mail.logout()
    print("Listo!")

if __name__ == '__main__':
    main()
