#!/usr/bin/env python3
"""
Script de sincronización de bandeja IAI
Conecta al buzón de Banahosting y envía emails a Supabase para análisis IA

Uso: python scripts/sync_iai_emails.py
Cron: */5 * * * * /usr/bin/python3 /path/to/scripts/sync_iai_emails.py >> /var/log/iai_sync.log 2>&1
"""

import os
import sys
import json
import imaplib
import email
from datetime import datetime
import urllib.request
import urllib.error

# Configuración - Variables de entorno
IMAP_SERVER = os.environ.get("IMAP_SERVER", "mail.aleasignature.com")
IMAP_USER = os.environ.get("IMAP_USER", "aleaemailia@aleasignature.com")
IMAP_PASSWORD = os.environ.get("IMAP_PASSWORD", "Gala@1998")
NEXT_PUBLIC_SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://kfmjhoiropvyevykvqey.supabase.co")
NEXT_PUBLIC_SUPABASE_ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWpob2lyb3B2eWV2eWt2cWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDUwNzMsImV4cCI6MjA4NzI4MTA3M30.HDt4ZOaWY5OksFKq2SDprrkc_-Xemo5z9_Z8mZytS_o")

# URL de la API de Next.js
PROCESS_EMAIL_URL = f"{NEXT_PUBLIC_SUPABASE_URL}/api/process-email"

PROCESSED_FLAG = "IAI_PROCESSED"


def send_to_next_api(email_data: dict) -> bool:
    """Envía el email a la API de Next.js"""
    try:
        data = json.dumps(email_data).encode("utf-8")
        req = urllib.request.Request(
            PROCESS_EMAIL_URL,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {NEXT_PUBLIC_SUPABASE_ANON_KEY}"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=90) as response:
            result = json.loads(response.read().decode("utf-8"))
            print(f"  ✅ Email procesado por IA: {result.get('success', False)}")
            return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"  ❌ Error HTTP {e.code}: {error_body}")
        return False
    except Exception as e:
        print(f"  ❌ Error enviando a API: {e}")
        return False


def get_email_body(msg: email.message.Message) -> str:
    """Extrae el texto del email (plain text o html)"""
    body = ""
    
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                try:
                    body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    break
                except:
                    pass
            elif content_type == "text/html" and not body:
                try:
                    body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                except:
                    pass
    else:
        try:
            body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
        except:
            body = str(msg.get_payload())
    
    # Limpiar HTML básico si es necesario
    if "<html" in body.lower():
        import re
        # Extraer solo texto del HTML
        text = re.sub(r"<[^>]+>", "", body)
        text = re.sub(r"\s+", " ", text)
        body = text.strip()
    
    return body


def main():
    print(f"\n{'='*50}")
    print(f"🔄 Sincronización IAI - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}\n")
    
    mail = None
    
    # Intentar conexión con diferentes métodos
    for timeout in [15, 20, 30]:
        for port, use_ssl in [(993, True), (143, False)]:
            try:
                print(f"📧 Conectando a {IMAP_SERVER}:{port} (SSL={use_ssl})...")
                if use_ssl:
                    mail = imaplib.IMAP4_SSL(IMAP_SERVER, port, timeout=timeout)
                else:
                    mail = imaplib.IMAP4(IMAP_SERVER, port, timeout=timeout)
                mail.login(IMAP_USER, IMAP_PASSWORD)
                print(f"  ✅ Conexión exitosa en puerto {port}")
                break
            except Exception as e:
                print(f"  ⚠️ Error en {port}: {str(e)[:50]}")
                mail = None
                continue
        
        if mail:
            break
    
    if not mail:
        print("❌ No se pudo conectar a ningún servidor IMAP")
        return
    
    try:
        # Seleccionar bandeja INBOX
        mail.select("INBOX")
        
        # Buscar emails SIN leER (no marcados)
        typ, msg_ids = mail.search(None, 'UNSEEN')
        
        if typ != "OK":
            print("  ⚠️ Error buscando emails")
            mail.logout()
            return
        
        email_ids = msg_ids[0].split()
        print(f"  📬 Emails sin leer: {len(email_ids)}")
        
        if not email_ids:
            print("  ✅ No hay emails nuevos\n")
            mail.logout()
            return
        
        processed_count = 0
        
        for num in email_ids:
            num = num.decode("utf-8")
            print(f"\n  📧 Procesando email #{num}...")
            
            # Obtener el email
            typ, msg_data = mail.fetch(num, "(RFC822)")
            if typ != "OK":
                print(f"    ❌ Error fetching email")
                continue
            
            msg = email.message_from_bytes(msg_data[0][1])
            
            # Extraer headers
            subject = msg.get("Subject", "Sin asunto")
            from_addr = msg.get("From", "unknown")
            date = msg.get("Date", "")
            
            # Limpiar from
            if "<" in from_addr:
                from_addr = from_addr.split("<")[1].replace(">", "")
            
            # Obtener body
            body = get_email_body(msg)
            
            if len(body) < 20:
                print(f"    ⚠️ Email vacío o muy corto, saltando")
                continue
            
            # Preparar datos para Supabase
            email_data = {
                "from": from_addr,
                "subject": subject,
                "text": body[:15000]  # Limitar tamaño
            }
            
            print(f"    De: {from_addr}")
            print(f"    Asunto: {subject[:50]}...")
            
            # Enviar a API Next.js
            if send_to_next_api(email_data):
                # Marcar como leído
                mail.store(num, "+FLAGS", "\\Seen")
                processed_count += 1
                print(f"    ✅ Procesado correctamente")
            else:
                print(f"    ⚠️ Error, se mantiene como no leído para reintentar")
        
        print(f"\n{'='*50}")
        print(f"✅ Resumen: {processed_count}/{len(email_ids)} emails procesados")
        print(f"{'='*50}\n")
        
        # Cerrar conexión
        mail.close()
        mail.logout()
        
    except Exception as e:
        print(f"\n❌ Error fatal: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
