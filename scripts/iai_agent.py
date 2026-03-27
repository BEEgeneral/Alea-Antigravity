#!/usr/bin/env python3
"""
Agente IAI - Procesador de Emails con Adjuntos
Lee emails, descarga archivos, analiza con IA y guarda en Supabase

Uso: python scripts/iai_agent.py
"""

import os
import sys
import json
import imaplib
import email
import base64
import io
import re
from datetime import datetime
from pathlib import Path
import urllib.request
import urllib.error

IMAP_SERVER = os.environ.get("IMAP_SERVER", "mail.aleasignature.com")
IMAP_USER = os.environ.get("IMAP_USER", "aleaemailia@aleasignature.com")
IMAP_PASSWORD = os.environ.get("IMAP_PASSWORD", "Gala@1998")
NEXT_PUBLIC_SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://kfmjhoiropvyevykvqey.supabase.co")
NEXT_PUBLIC_SUPABASE_ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWpob2lyb3B2eWV2eWt2cWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDUwNzMsImV4cCI6MjA4NzI4MTA3M30.HDt4ZOaWY5OksFKq2SDprrkc_-Xemo5z9_Z8mZytS_o")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "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")

PROCESS_EMAIL_URL = f"{NEXT_PUBLIC_SUPABASE_URL}/api/process-email"
ATTACHMENTS_DIR = Path(__file__).parent / "attachments"


def send_to_api(email_data: dict) -> dict:
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
            return {"success": True, "data": result}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        return {"success": False, "error": f"HTTP {e.code}: {error_body}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def download_attachment(part, filename: str, email_id: str) -> str:
    """Descarga un adjunto y lo guarda localmente"""
    ATTACHMENTS_DIR.mkdir(exist_ok=True)
    
    file_path = ATTACHMENTS_DIR / f"{email_id}_{filename}"
    
    try:
        if part.get_content_disposition() == "attachment":
            file_data = part.get_payload(decode=True)
            with open(file_path, "wb") as f:
                f.write(file_data)
            print(f"    📎 Adjunto guardado: {filename} ({len(file_data)} bytes)")
            return str(file_path)
    except Exception as e:
        print(f"    ⚠️ Error descargando {filename}: {e}")
    
    return ""


def get_email_body_and_attachments(msg: email.message.Message, email_id: str) -> tuple:
    """Extrae el body y los adjuntos del email"""
    body = ""
    attachments = []
    
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))
            
            # Extraer body texto
            if content_type == "text/plain" and "attachment" not in content_disposition:
                try:
                    body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    break
                except:
                    pass
            elif content_type == "text/html" and not body:
                try:
                    body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    # Limpiar HTML
                    text = re.sub(r"<[^>]+>", "", body)
                    text = re.sub(r"\s+", " ", text)
                    body = text.strip()
                except:
                    pass
            
            # Descargar adjuntos
            if "attachment" in content_disposition:
                filename = part.get_filename()
                if filename:
                    filepath = download_attachment(part, filename, email_id)
                    if filepath:
                        attachments.append({
                            "filename": filename,
                            "path": filepath,
                            "content_type": content_type
                        })
    else:
        try:
            body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
        except:
            body = str(msg.get_payload())
    
    return body, attachments


def analyze_with_groq(text: str, attachments_info: list = None) -> dict:
    """Analiza el contenido con Groq AI"""
    try:
        prompt = f"""
Eres un asistente experto en real estate institucional.

Analiza este email sobre inversiones inmobiliarias y extrae la información en JSON:
{{
  "type": "property" | "investor" | "mandatario" | "collaborator",
  "summary": "Resumen de 1 línea",
  "has_dossier": true | false,
  "extracted_data": {{
    "title": "string",
    "type": "Hotel|Edificio|Suelo|Retail|Oficinas|Logístico|Otro",
    "price": number | null,
    "address": "string",
    "meters": number | null,
    "vendor_name": "string",
    "comision_tercero": number,
    "comision_interna": number,
    "extended_data": {{
      "economics": {{"gastos": "string", "ibi": "string", "tasas": "string", "estado_gestion": "string"}},
      "surfaces": {{"parcela": number, "construida": number, "distribucion": "string", "equipamiento": "string"}},
      "urbanistic": {{"uso_principal": "string", "edificabilidad": "string", "normativa": "string"}},
      "investment": {{"rentabilidad": "string", "capex": "string", "valoracion": "string"}}
    }}
  }}
}}

Email:
{text[:8000]}

{"Adjuntos: " + ", ".join([a["filename"] for a in attachments_info]) if attachments_info else ""}
"""
        
        req_data = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }
        
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=json.dumps(req_data).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {GROQ_API_KEY}"
            },
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
            content = result["choices"][0]["message"]["content"]
            return json.loads(content)
    
    except Exception as e:
        print(f"    ⚠️ Error en análisis Groq: {e}")
        return {"type": "property", "summary": "Error en análisis", "has_dossier": False, "extracted_data": {}}


def save_to_supabase(email_data: dict, extracted: dict) -> bool:
    """Guarda en Supabase directamente"""
    try:
        # Primero guarda en iai_inbox_suggestions
        insert_data = {
            "original_email_subject": email_data.get("subject", ""),
            "original_email_body": email_data.get("text", "")[:15000],
            "sender_email": email_data.get("from", ""),
            "suggestion_type": extracted.get("type", "property"),
            "extracted_data": {
                **extracted.get("extracted_data", {}),
                "_iai_has_dossier": extracted.get("has_dossier", False),
                "_iai_summary": extracted.get("summary", "")
            },
            "ai_interpretation": extracted.get("summary", ""),
            "status": "pending"
        }
        
        req = urllib.request.Request(
            f"{NEXT_PUBLIC_SUPABASE_URL}/rest/v1/iai_inbox_suggestions",
            data=json.dumps(insert_data).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {NEXT_PUBLIC_SUPABASE_ANON_KEY}",
                "apikey": NEXT_PUBLIC_SUPABASE_ANON_KEY,
                "Prefer": "return=minimal"
            },
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.status in [200, 201]
    
    except Exception as e:
        print(f"    ❌ Error guardando en Supabase: {e}")
        return False


def main():
    print(f"\n{'='*60}")
    print(f"🤖 Agente IAI - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")
    
    # Conectar IMAP
    try:
        print(f"📧 Conectando a {IMAP_SERVER}...")
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, 993, timeout=30)
        mail.login(IMAP_USER, IMAP_PASSWORD)
        mail.select("INBOX")
        print(f"  ✅ Conexión exitosa\n")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        print(f"\n⚠️ Necesitas whitelistar tu IP en Banahosting:")
        print(f"   Tu IP: 86.127.226.178")
        return
    
    # Buscar emails sin leer
    typ, msg_ids = mail.search(None, 'UNSEEN')
    email_ids = msg_ids[0].split() if msg_ids[0] else []
    print(f"📬 Emails sin leer: {len(email_ids)}\n")
    
    if not email_ids:
        print("✅ No hay emails nuevos\n")
        mail.logout()
        return
    
    processed = 0
    
    for num in email_ids:
        num = num.decode("utf-8")
        print(f"\n{'─'*50}")
        print(f"📧 Procesando email #{num}...")
        
        try:
            # Obtener email
            typ, msg_data = mail.fetch(num, "(RFC822)")
            msg = email.message_from_bytes(msg_data[0][1])
            
            subject = msg.get("Subject", "Sin asunto")
            from_addr = msg.get("From", "unknown")
            if "<" in from_addr:
                from_addr = from_addr.split("<")[1].replace(">", "")
            
            print(f"    De: {from_addr}")
            print(f"    Asunto: {subject[:60]}...")
            
            # Extraer body y adjuntos
            body, attachments = get_email_body_and_attachments(msg, num)
            
            if len(body) < 20:
                print(f"    ⚠️ Email vacío, saltando")
                continue
            
            print(f"    📝 Body: {len(body)} caracteres")
            print(f"    📎 Adjuntos: {len(attachments)}")
            
            # Analizar con Groq
            print(f"    🔄 Analizando con IA...")
            extracted = analyze_with_groq(body, attachments)
            print(f"    ✅ Tipo detectado: {extracted.get('type', 'unknown')}")
            print(f"    ✅ Resumen: {extracted.get('summary', '')[:80]}...")
            
            # Guardar en Supabase
            email_data = {"from": from_addr, "subject": subject, "text": body[:15000]}
            
            if save_to_supabase(email_data, extracted):
                # Marcar como leído
                mail.store(num, "+FLAGS", "\\Seen")
                processed += 1
                print(f"    ✅ Guardado en bandeja IAI")
            else:
                print(f"    ❌ Error al guardar")
                
        except Exception as e:
            print(f"    ❌ Error: {e}")
            continue
    
    print(f"\n{'='*60}")
    print(f"✅ Completado: {processed}/{len(email_ids)} emails procesados")
    print(f"{'='*60}\n")
    
    mail.logout()


if __name__ == "__main__":
    main()
