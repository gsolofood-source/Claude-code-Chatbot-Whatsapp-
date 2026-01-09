#!/bin/bash

# ============================================
# Script per generare un Long-Lived Token
# ============================================

echo "=============================================="
echo "Generazione Long-Lived Access Token"
echo "=============================================="
echo ""

# INSERISCI LE TUE CREDENZIALI QUI:
APP_ID="your_app_id_here"           # Meta App ID
APP_SECRET="13cee1804a73e158e2a1b35cd4914351"  # App Secret
SHORT_TOKEN="your_temporary_token_here"       # Token temporaneo (24h) dalla console

echo "🔄 Conversione del token temporaneo in long-lived token..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE: %{http_code}\n" \
  "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d' ' -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

echo "Risposta:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ SUCCESS! Copia il nuovo access_token nel file .env"
  echo ""
  # Estrai il token dalla risposta JSON
  NEW_TOKEN=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)
  if [ ! -z "$NEW_TOKEN" ]; then
    echo "Nuovo token:"
    echo "$NEW_TOKEN"
  fi
else
  echo "❌ ERRORE HTTP: $HTTP_CODE"
fi

echo ""
echo "=============================================="
