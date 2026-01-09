#!/bin/bash

# =================================================
# Script per testare le credenziali WhatsApp
# =================================================

# INSERISCI LE TUE CREDENZIALI QUI:
PHONE_NUMBER_ID="your_phone_number_id_here"
ACCESS_TOKEN="your_access_token_here"

echo "=============================================="
echo "Test delle credenziali WhatsApp Business API"
echo "=============================================="
echo ""

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Verifica Phone Number ID
echo "📞 Test 1: Verifica Phone Number ID..."
echo "URL: https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  "https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ SUCCESS${NC} - Phone Number ID valido!"
  echo "Risposta:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
  echo -e "${RED}❌ ERRORE${NC} - HTTP Code: $HTTP_CODE"
  echo "Risposta:"
  echo "$BODY"
fi

echo ""
echo "=============================================="
echo ""

# Test 2: Verifica permessi di invio messaggi
echo "📤 Test 2: Verifica permessi API (senza inviare)..."
echo "URL: https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages"
echo ""

# Questo è un test dry-run per vedere se l'endpoint risponde
# Non invia realmente un messaggio perché manca il numero destinatario valido
TEST_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "test",
    "type": "text",
    "text": {"body": "test"}
  }')

TEST_HTTP_CODE=$(echo "$TEST_RESPONSE" | tail -n1)
TEST_BODY=$(echo "$TEST_RESPONSE" | head -n-1)

if [ "$TEST_HTTP_CODE" == "400" ]; then
  # 400 è OK perché significa che l'API è raggiungibile ma il numero è invalido
  echo -e "${GREEN}✅ SUCCESS${NC} - API raggiungibile (errore atteso per numero test)"
  echo "Risposta:"
  echo "$TEST_BODY" | python3 -m json.tool 2>/dev/null || echo "$TEST_BODY"
elif [ "$TEST_HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ SUCCESS${NC} - Permessi OK!"
  echo "Risposta:"
  echo "$TEST_BODY" | python3 -m json.tool 2>/dev/null || echo "$TEST_BODY"
else
  echo -e "${RED}❌ ERRORE${NC} - HTTP Code: $TEST_HTTP_CODE"
  echo "Risposta:"
  echo "$TEST_BODY"
fi

echo ""
echo "=============================================="
echo ""
echo "📋 Riepilogo:"
echo ""
echo "Se entrambi i test sono verdi (✅), le tue credenziali sono corrette!"
echo ""
echo "Dove trovare le credenziali:"
echo "  • WHATSAPP_PHONE_NUMBER_ID: Meta Developers → App → WhatsApp → API Setup"
echo "  • WHATSAPP_ACCESS_TOKEN: Meta Business Suite → System User → Token"
echo ""
echo "=============================================="
