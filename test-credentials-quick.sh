#!/bin/bash

# Carica le variabili dal file .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ File .env non trovato!"
  exit 1
fi

echo "=============================================="
echo "Test Rapido Credenziali WhatsApp"
echo "=============================================="
echo ""
echo "📱 Phone Number ID: $WHATSAPP_PHONE_NUMBER_ID"
echo "🔑 Token (primi 20 caratteri): ${WHATSAPP_ACCESS_TOKEN:0:20}..."
echo ""

# Test API WhatsApp
echo "🧪 Testing WhatsApp API..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  "https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}" \
  -H "Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ SUCCESS! Token valido!"
  echo ""
  echo "Dettagli Phone Number:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo "🎉 Tutto pronto! Puoi avviare il bot."
else
  echo "❌ ERRORE HTTP: $HTTP_CODE"
  echo "Risposta:"
  echo "$BODY"
  echo ""
  echo "💡 Segui le istruzioni per ottenere un nuovo token:"
  echo "   https://developers.facebook.com/apps → Tua App → WhatsApp → API Setup"
fi

echo ""
echo "=============================================="
