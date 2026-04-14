#!/bin/bash
# Script para comprimir PDFs grandes de activos

FOLDER="/Users/albertogala/Library/CloudStorage/Dropbox/Activos AleaSignature/Por inversor"
OUTPUT="$FOLDER/compressed"

mkdir -p "$OUTPUT"

# Archivos a comprimir
FILES=(
  "ACTIVOS RAFA/Av. Monte 20 CSD FOTOGRAFÍAS 2024 sin infografía.pdf"
  "ACTIVOS RAFA/EDIFICIO OFICINAS VALENTIN BEATO (CF).pdf"
  "ACTIVOS RAFA/Plaza Nueva - MB (1).pdf"
  "ACTIVOS ALEX/Dossier Palacio Trinidad Grund-5 2.pdf"
  "ACTIVOS ALEX/HOTELES IZAN.pdf"
  "ACTIVOS ALEX/Presentacion Modificada Operacioěn Financiera Cadena Izan Hoteles con desglose del  Proyecto de Sale & Lease Back del Hotel Iza´n Cavanna Marzo 2019 v2 .pdf"
)

echo "🚀 Comprimiendo $((${#FILES[@]} / 2)) archivos PDF..."
echo ""

for file in "${FILES[@]}"; do
  input="$FOLDER/$file"
  filename=$(basename "$file")
  output="$OUTPUT/${filename%.pdf}_compressed.pdf"
  
  if [ -f "$input" ]; then
    original_size=$(du -h "$input" | cut -f1)
    echo "📄 Comprimiendo: $filename"
    echo "   Original: $original_size"
    
    gs -sDEVICE=pdfwrite \
       -dCompatibilityLevel=1.4 \
       -dPDFSETTINGS=/ebook \
       -dNOPAUSE \
       -dQUIET \
       -dBATCH \
       -sOutputFile="$output" \
       "$input" 2>/dev/null
    
    if [ -f "$output" ]; then
      compressed_size=$(du -h "$output" | cut -f1)
      ratio=$(echo "scale=1; $(stat -f%z "$output") * 100 / $(stat -f%z "$input")" | bc 2>/dev/null || echo "?")
      echo "   ✅ Comprimido: $compressed_size"
      echo "   📁 Guardado en: $output"
      echo ""
    else
      echo "   ❌ Error al comprimir"
      echo ""
    fi
  else
    echo "⚠️ No encontrado: $input"
  fi
done

echo "✅ Compresión completada!"
echo "📁 Archivos comprimidos en: $OUTPUT"