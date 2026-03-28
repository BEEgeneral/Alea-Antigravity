#!/usr/bin/env python3
"""
Email fetcher con soporte para adjuntos
- Evita duplicados (marca como leído)
- Reintenta webhooks fallidos
- Logging mejorado
- Resumen al final
"""

import os
import imaplib
import email
import base64
import json
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/email_fetch.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

IMAP_SERVER = 'sh-europe2716.banahosting.com'
IMAP_USER = 'aleaemailia@aleasignature.com'
IMAP_PASSWORD = os.environ.get('IMAP_PASSWORD', 'Gala@1998')
WEBHOOK_URL = 'https://aleasignature.com/api/webhook/email'
STATE_FILE = '/tmp/last_processed_email.txt'
MAX_RETRIES = 3
BATCH_SIZE = 10

# Dominios PRIORITARIOS (siempre procesar)
PRIORITY_DOMAINS = [
    'aleasignature.com',
    'alea.es',
    'gmail.com',
    'hotmail.com',
    'outlook.com',
    'yahoo.com',
]

# Keywords de SPAM/NO releVante (saltar estos)
SPAM_KEYWORDS = [
    'newsletter', 'unsubscribe', 'promocion', 'oferta', 
    'descuento', 'gratis', 'gratuito', 'ganador', 'premio',
    'click here', 'act now', 'limited time', 'oferta especial',
    'spam', 'no reply', 'noreply', 'no-reply',
]

# Patrones de newsletters (saltar estos)
NEWSLETTER_PATTERNS = [
    'newsletter', 'boletin', 'boletín', 'mailing', 
    'enviado por', 'email marketing', 'comunicacion',
]

def is_relevant_email(from_email, subject, body=''):
    """Determina si el email es relevante para Alea Signature"""
    
    # Extraer dominio del email
    if '@' in from_email:
        domain = from_email.split('@')[1].lower()
    else:
        domain = ''
    
    # SI es de dominio prioritario, siempre procesar
    for priority in PRIORITY_DOMAINS:
        if priority in domain:
            return True, 'priority_domain'
    
    # Verificar keywords de spam en asunto o cuerpo
    text_to_check = (subject + ' ' + body).lower()
    for keyword in SPAM_KEYWORDS:
        if keyword.lower() in text_to_check:
            return False, f'spam_keyword:{keyword}'
    
    # Verificar patrones de newsletter
    for pattern in NEWSLETTER_PATTERNS:
        if pattern.lower() in text_to_check:
            return False, f'newsletter:{pattern}'
    
    # Palabras clave REAL ESTATE que indican relevancia
    REAL_ESTATE_KEYWORDS = [
        'propiedad', 'inmueble', 'piso', 'apartamento', 'casa',
        'edificio', 'hotel', 'oficina', 'suelo', 'terreno',
        'inversion', 'inversor', 'invertidor',
        'alquiler', 'venta', 'precio', 'eur', '€',
        'm2', 'metros', 'habitacion', 'dormitorio',
        'mandato', 'mandatario', 'comercial',
        'real estate', 'property', 'investor', 'asset',
    ]
    
    relevance_count = 0
    for keyword in REAL_ESTATE_KEYWORDS:
        if keyword.lower() in text_to_check:
            relevance_count += 1
    
    # Si tiene 2+ keywords de real estate, es relevante
    if relevance_count >= 2:
        return True, f'relevant:{relevance_count} keywords'
    
    return False, f'not_relevant:{relevance_count} keywords'

def load_last_processed():
    """Cargar último email procesado"""
    try:
        with open(STATE_FILE, 'r') as f:
            return f.read().strip()
    except:
        return None

def save_last_processed(email_id):
    """Guardar último email procesado"""
    with open(STATE_FILE, 'w') as f:
        f.write(email_id)

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
                        return body[:15000]
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
                    
                    if content_type == 'application/pdf':
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

def send_to_webhook(payload, retries=MAX_RETRIES):
    """Enviar al webhook con reintentos"""
    import requests
    
    for attempt in range(retries):
        try:
            r = requests.post(WEBHOOK_URL, json=payload, timeout=60)
            if r.ok:
                return True, r.json()
            else:
                logger.warning(f"Webhook error {r.status_code}: {r.text[:200]}")
        except Exception as e:
            logger.error(f"Webhook attempt {attempt + 1} failed: {e}")
    
    return False, None

def main():
    logger.info("=" * 50)
    logger.info(f"Iniciando fetcher - {datetime.now().isoformat()}")
    
    last_processed = load_last_processed()
    logger.info(f"Último procesado: {last_processed or 'NINGUNO'}")
    
    try:
        import requests
        logger.info("Conectando a IMAP...")
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, timeout=15)
        mail.login(IMAP_USER, IMAP_PASSWORD)
        mail.select('INBOX')
        
        # Buscar TODOS los emails no leídos
        status, messages = mail.search(None, 'UNSEEN')
        email_ids = messages[0].split()
        logger.info(f"Emails nuevos encontrados: {len(email_ids)}")
        
        if not email_ids:
            logger.info("No hay emails nuevos")
            mail.logout()
            return
        
        stats = {'processed': 0, 'failed': 0, 'skipped': 0}
        found_last = last_processed is None
        
        for eid in email_ids[:BATCH_SIZE]:
            email_id = eid.decode()
            
            # Saltar hasta encontrar el último procesado
            if not found_last:
                if email_id == last_processed:
                    found_last = True
                else:
                    stats['skipped'] += 1
                    continue
            
            try:
                status, msg_data = mail.fetch(eid, '(RFC822)')
                msg = email.message_from_bytes(msg_data[0][1])
                
                from_addr = email.utils.parseaddr(msg['From'])
                subject = msg['Subject'] or 'Sin asunto'
                message_id = msg['Message-ID'] or email_id
                
                # FILTRAR emails no relevantes
                body_preview = ''
                is_relevant, reason = is_relevant_email(from_addr[1], subject, body_preview)
                
                if not is_relevant:
                    logger.info(f"⏭️ SALTADO (no relevante): {subject[:40]} - {reason}")
                    # Marcar como leído para no procesarlo de nuevo
                    mail.store(eid, '+FLAGS', '\\Seen')
                    stats['skipped'] += 1
                    continue
                
                logger.info(f"Procesando: {subject[:50]}... (razón: {reason})")
                
                body = get_email_body(msg)
                attachments = get_attachments(msg)
                
                # Preparar payload
                payload = {
                    'from': from_addr[1],
                    'subject': subject,
                    'text': body,
                    'message_id': message_id
                }
                
                if attachments:
                    text_attachments = [a for a in attachments if a.get('is_text')]
                    if text_attachments:
                        payload['attachment_text'] = '\n\n--- ADJUNTO ---\n'.join(
                            a['text'] for a in text_attachments
                        )
                    
                    pdf_attachments = [a for a in attachments if a.get('is_pdf')]
                    if pdf_attachments:
                        payload['attachment_data'] = [
                            {'filename': a['filename'], 'content_type': a['content_type'], 'data': a['data']}
                            for a in pdf_attachments[:2]
                        ]
                
                # Enviar al webhook
                success, response = send_to_webhook(payload)
                
                if success:
                    # Marcar como leído
                    mail.store(eid, '+FLAGS', '\\Seen')
                    save_last_processed(email_id)
                    stats['processed'] += 1
                    logger.info(f"✅ Procesado: {subject[:40]} -> {response}")
                else:
                    stats['failed'] += 1
                    logger.error(f"❌ Falló: {subject[:40]}")
                
            except Exception as e:
                stats['failed'] += 1
                logger.error(f"Error procesando email {email_id}: {e}")
        
        mail.logout()
        
        # Resumen
        logger.info("=" * 50)
        logger.info(f"RESUMEN: Procesados: {stats['processed']}, Fallidos: {stats['failed']}, Omitidos: {stats['skipped']}")
        logger.info(f"Último procesado: {last_processed or 'NINGUNO'}")
        
    except Exception as e:
        logger.error(f"Error general: {e}")
        raise

if __name__ == '__main__':
    main()
