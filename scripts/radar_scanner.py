#!/usr/bin/env python3
"""
RADAR Alea Scanner — Detección de oportunidades desde fuentes públicas

Fuentes:
- BOE (Boletín Oficial del Estado) — Subastas, concursos, inmuebles
- Boletines autonómicos / provinciales

Uso: python radar_scanner.py [boe|concursos|all]
Cron ejemplo:
  0 8 * * * python3 /opt/data/Alea-Antigravity/scripts/radar_scanner.py boe >> /var/log/radar_boe.log 2>&1
  0 9 * * * python3 /opt/data/Alea-Antigravity/scripts/radar_scanner.py concursos >> /var/log/radar_concursos.log 2>&1
"""

import os
import sys
import json
import re
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timedelta
from typing import Optional

# ─── Configuración ────────────────────────────────────────────
INSFORGE_APP_URL = os.environ.get("INSFORGE_APP_URL", "https://if8rkq6j.eu-central.insforge.app")
INSFORGE_API_KEY = os.environ.get("INSFORGE_API_KEY", "")
NETWORK_WEBHOOK_SECRET = os.environ.get("NETWORK_WEBHOOK_SECRET", "aleasignature-network")

# ─── Scanners disponibles ─────────────────────────────────────
SCANNERS = {
    "boe": "BOE Scanner",
    "concursos": "Concursos Scanner",
}

# ─── Alea Score Calculator ─────────────────────────────────────
def calculate_alea_score(source: str, price: Optional[float], meters: Optional[float], 
                          asset_type: str, keywords: list) -> tuple[int, str]:
    """Calcula Alea Score (0-100) y clasificación"""
    score = 50  # Base
    
    # Fuente de alta calidad
    if source == "boe":
        score += 10
    
    # Precio atractivo (bajo = mejor para inversión)
    if price:
        if price < 500000:
            score += 15
        elif price < 1000000:
            score += 10
        elif price < 2000000:
            score += 5
        elif price > 10000000:
            score -= 10
    
    # Metros cuadrados (valor por m2)
    if meters:
        if meters > 1000:
            score += 10
        elif meters > 500:
            score += 5
    
    # Tipo de activo
    hotel_keywords = ["hotel", "hostal", "apartamento turístico", "turístico"]
    commercial_keywords = ["local", "comercial", "oficina", "nave industrial"]
    land_keywords = ["suelo", "terreno", "parcela", "finca rústica"]
    
    if any(k in keywords for k in hotel_keywords):
        score += 10
    if any(k in keywords for k in commercial_keywords):
        score += 5
    if any(k in keywords for k in land_keywords):
        score += 5
    
    # Keywords de urgencia/oportunidad
    urgency = ["subasta", "concuros", "liquidación", "urgente", "vivo", "reestructuración"]
    if any(k in keywords for k in urgency):
        score += 10
    
    # Exclusividad
    exclusivity = ["exclusiva", "único", "única"]
    if any(k in keywords for k in exclusivity):
        score += 5
    
    score = max(0, min(100, score))
    
    # Clasificación
    if score >= 80:
        classification = "exceptional"
    elif score >= 65:
        classification = "high"
    elif score >= 45:
        classification = "medium"
    else:
        classification = "low"
    
    return score, classification


def classify_asset_type(text: str) -> str:
    """Clasifica el tipo de activo basado en keywords"""
    text_lower = text.lower()
    
    if any(k in text_lower for k in ["hotel", "hostal", "apartamento turístico", "turístico", "resort"]):
        return "HOTEL"
    if any(k in text_lower for k in ["local", "comercial", "centro comercial", "retail"]):
        return "RETAIL"
    if any(k in text_lower for k in ["oficina", "despacho"]):
        return "OFFICE"
    if any(k in text_lower for k in ["nave", "industrial", "logística", "almacén"]):
        return "INDUSTRIAL"
    if any(k in text_lower for k in ["suelo", "terreno", "parcela", "finca", "land"]):
        return "LAND"
    if any(k in text_lower for k in ["edificio", "bloque", "residencial", "piso", "apartamento", "vivienda"]):
        return "RESIDENTIAL"
    if any(k in text_lower for k in ["mixto", "mixed", "plurifamiliar"]):
        return "MIXED_USE"
    return "RESIDENTIAL"


# ─── BOE Scanner ──────────────────────────────────────────────
def scan_boe(days_back: int = 3) -> list[dict]:
    """Scrapes BOE for property-related announcements"""
    signals = []
    
    try:
        # BOE API (versión pública)
        # https://www.boe.es/datosabiertos/api/
        base_url = "https://www.boe.es/datosabiertos/api/boe/sumario"
        
        # Obtener sumarios de los últimos días
        for day_offset in range(days_back):
            date = datetime.now() - timedelta(days=day_offset)
            date_str = date.strftime("%Y-%m-%d")
            
            try:
                url = f"https://www.boe.es/datosabiertos/api/boe/sumario/{date_str}"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                
                with urllib.request.urlopen(req, timeout=30) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    
                    for item in data.get('sumarios', []):
                        texto = item.get('texto', '').lower()
                        
                        # Filtrar solo Inmuebles/Propiedades
                        property_indicators = [
                            'inmueble', 'inmuebles', 'vivienda', 'piso', 'apartamento',
                            'local', 'oficina', 'nave', 'edificio', 'hotel', 'suelo',
                            'subasta', 'urbana', 'rustica', 'finca', 'terreno',
                            'prenda', 'hipoteca', 'acreedor', 'liquidación'
                        ]
                        
                        if any(ind in texto for ind in property_indicators):
                            title = item.get('titulo', '')[:200]
                            
                            # Extraer precio si aparece
                            price = None
                            price_match = re.search(r'[\d\.,]+\s*(?:euros|€|EUR)', texto)
                            if price_match:
                                try:
                                    price_str = re.sub(r'[^\d\.,]', '', price_match.group())
                                    price = float(price_str.replace('.', '').replace(',', '.'))
                                except:
                                    pass
                            
                            # Extraer metros si aparece
                            meters = None
                            meters_match = re.search(r'[\d\.,]+\s*(?:m²|m2|metros|mt)', texto)
                            if meters_match:
                                try:
                                    meters_str = re.sub(r'[^\d\.,]', '', meters_match.group())
                                    meters = float(meters_str.replace('.', '').replace(',', '.'))
                                except:
                                    pass
                            
                            keywords = [w for w in property_indicators if w in texto]
                            asset_type = classify_asset_type(texto)
                            alea_score, classification = calculate_alea_score("boe", price, meters, asset_type, keywords)
                            
                            signals.append({
                                'title': title,
                                'source': 'boe',
                                'source_url': f"https://www.boe.es/boe/dias/{date_str}/",
                                'source_reference': f"BOE-{date_str}-{item.get('seccion', '')}",
                                'asset_type': asset_type,
                                'price': price,
                                'description': item.get('texto', '')[:500],
                                'alea_score': alea_score,
                                'score_classification': classification,
                                'status': 'detected',
                                'detected_at': date.isoformat(),
                                'raw_data': {
                                    'boe_date': date_str,
                                    'seccion': item.get('seccion', ''),
                                    'departamento': item.get('departamento', ''),
                                }
                            })
                            
            except Exception as e:
                print(f"  ⚠ Error consultando BOE {date_str}: {e}")
                
    except Exception as e:
        print(f"❌ Error en scan_boe: {e}")
    
    return signals


# ─── Concursos Scanner ────────────────────────────────────────
def scan_concursos(days_back: int = 7) -> list[dict]:
    """Scrapes for bankruptcy auctions (concursos de acreedores)"""
    signals = []
    
    # Fuentes de concursos de acreedores
    concurso_sources = [
        # BOE Concurso de acreedores
        ("https://www.boe.es/datosabiertos/api/boe/sumario", "boe_concurso"),
    ]
    
    try:
        for day_offset in range(days_back):
            date = datetime.now() - timedelta(days=day_offset)
            date_str = date.strftime("%Y-%m-%d")
            
            try:
                # BOE API
                url = f"https://www.boe.es/datosabiertos/api/boe/sumario/{date_str}"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                
                with urllib.request.urlopen(req, timeout=30) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    
                    for item in data.get('sumarios', []):
                        texto = item.get('texto', '').lower()
                        
                        # Filtrar concursos de acreedores
                        concurso_keywords = [
                            'concurso de acreedores', 'convenio concursal', 
                            'liquidación concursal', 'administrador concursal',
                            'inmueble', 'vivienda', 'local', 'nave', 'suelo',
                            'subasta judicial', 'valoración', 'tipo de tasación'
                        ]
                        
                        if any(k in texto for k in ['concurso']) and any(k in texto for k in ['inmueble', 'vivienda', 'local', 'nave', 'suelo']):
                            title = item.get('titulo', '')[:200]
                            
                            # Extraer precio de tasación
                            price = None
                            price_match = re.search(r'tasación\s*[:\-]?\s*([\d\.,]+\s*(?:euros|€))', texto)
                            if price_match:
                                try:
                                    price_str = re.sub(r'[^\d\.,]', '', price_match.group(1))
                                    price = float(price_str.replace('.', '').replace(',', '.'))
                                except:
                                    pass
                            
                            # Extraer metros
                            meters = None
                            meters_match = re.search(r'([\d\.,]+)\s*(?:m²|m2|metros|mt\.?)', texto)
                            if meters_match:
                                try:
                                    meters_str = re.sub(r'[^\d\.,]', '', meters_match.group(1))
                                    meters = float(meters_str.replace('.', '').replace(',', '.'))
                                except:
                                    pass
                            
                            keywords = [w for w in texto.split() if w in ' '.join(concurso_keywords)]
                            asset_type = classify_asset_type(texto)
                            alea_score, classification = calculate_alea_score("concursos", price, meters, asset_type, keywords)
                            
                            # Los concursos son oportunidades excepcionales por la urgencia
                            alea_score = min(100, alea_score + 15)
                            if alea_score >= 80:
                                classification = "exceptional"
                            elif alea_score >= 65:
                                classification = "high"
                            
                            signals.append({
                                'title': f"[CONCURSO] {title}",
                                'source': 'concursos',
                                'source_url': f"https://www.boe.es/boe/dias/{date_str}/",
                                'source_reference': f"CONCURSO-BOE-{date_str}",
                                'asset_type': asset_type,
                                'price': price,
                                'description': item.get('texto', '')[:500],
                                'alea_score': alea_score,
                                'score_classification': classification,
                                'status': 'detected',
                                'detected_at': date.isoformat(),
                                'raw_data': {
                                    'type': 'concurso_acreedores',
                                    'boe_date': date_str,
                                }
                            })
                            
            except Exception as e:
                print(f"  ⚠ Error consultando concursos {date_str}: {e}")
                
    except Exception as e:
        print(f"❌ Error en scan_concursos: {e}")
    
    return signals


# ─── Insertar signals en InsForge ──────────────────────────────
def insert_signal(signal: dict) -> Optional[str]:
    """Inserta un signal en InsForge via REST API"""
    try:
        url = f"{INSFORGE_APP_URL}/api/database/records/signals"
        
        data = json.dumps(signal).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {INSFORGE_API_KEY}'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            if result.get('id'):
                return result['id']
            return None
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"  ⚠ HTTP Error {e.code}: {error_body[:200]}")
        return None
    except Exception as e:
        print(f"  ⚠ Error insertando signal: {e}")
        return None


# ─── Main ──────────────────────────────────────────────────────
def main():
    scanner_type = sys.argv[1] if len(sys.argv) > 1 else "all"
    
    print(f"\n{'='*60}")
    print(f"🔍 RADAR Alea Scanner — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Modo: {scanner_type.upper()}")
    print(f"{'='*60}\n")
    
    if not INSFORGE_API_KEY:
        print("❌ ERROR: INSFORGE_API_KEY no está configurada")
        sys.exit(1)
    
    total_inserted = 0
    
    if scanner_type in ["boe", "all"]:
        print("📰 Escaneando BOE...")
        signals = scan_boe(days_back=3)
        print(f"   {len(signals)} signals detectados")
        
        for sig in signals:
            sig_id = insert_signal(sig)
            if sig_id:
                total_inserted += 1
                print(f"   ✅ Insertado: {sig['title'][:60]}... (Score: {sig['alea_score']})")
            else:
                print(f"   ⚠ No insertado: {sig['title'][:60]}")
    
    if scanner_type in ["concursos", "all"]:
        print("\n⚠️ Escaneando Concursos de Acreedores...")
        signals = scan_concursos(days_back=7)
        print(f"   {len(signals)} signals detectados")
        
        for sig in signals:
            sig_id = insert_signal(sig)
            if sig_id:
                total_inserted += 1
                print(f"   ✅ Insertado: {sig['title'][:60]}... (Score: {sig['alea_score']})")
            else:
                print(f"   ⚠ No insertado: {sig['title'][:60]}")
    
    print(f"\n{'='*60}")
    print(f"✅ Scanner completado — {total_inserted} signals insertados")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
