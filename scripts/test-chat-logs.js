#!/usr/bin/env node

import chatLogService from '../src/services/chatLogService.js';

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 TEST CHAT LOGS SYSTEM');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  console.log('1️⃣  Creando log di test...\n');

  // Simula alcune conversazioni
  const testUsers = ['user1', 'user2', 'user3'];
  const testMessages = [
    { role: 'user', content: 'Ciao, come stai?', from: 'user1', to: 'bot' },
    { role: 'assistant', content: 'Ciao! Sto bene, grazie. Come posso aiutarti?', from: 'bot', to: 'user1' },
    { role: 'user', content: 'Vorrei informazioni sui tuoi servizi', from: 'user1', to: 'bot' },
    { role: 'assistant', content: 'Certamente! Ecco cosa posso fare per te...', from: 'bot', to: 'user1' },
    { role: 'user', content: 'Buongiorno', from: 'user2', to: 'bot' },
    { role: 'assistant', content: 'Buongiorno! Come posso esserti utile?', from: 'bot', to: 'user2' },
    { role: 'user', content: 'Hai prezzi scontati?', from: 'user2', to: 'bot' },
    { role: 'assistant', content: 'Al momento abbiamo diverse promozioni attive...', from: 'bot', to: 'user2' },
    { role: 'user', content: 'Perfetto, grazie!', from: 'user3', to: 'bot' },
    { role: 'assistant', content: 'Prego! Se hai altre domande sono qui.', from: 'bot', to: 'user3' }
  ];

  let logCount = 0;
  for (let i = 0; i < testMessages.length; i++) {
    const msg = testMessages[i];
    const userId = testUsers[i % testUsers.length];

    // Aggiungi un timestamp variabile per simulare messaggi nel tempo
    const timestamp = new Date(Date.now() - (testMessages.length - i) * 5 * 60 * 1000);

    chatLogService.logMessage(userId, {
      ...msg,
      id: `test_msg_${i}`,
      timestamp: timestamp
    });

    logCount++;
    console.log(`   ✓ Log ${logCount}: ${msg.role} da ${userId}`);
  }

  console.log(`\n✅ Creati ${logCount} log di test\n`);

  console.log('2️⃣  Verificando recupero log...\n');

  const recentLogs = chatLogService.getLogsLastHours(1);
  console.log(`   ✓ Trovati ${recentLogs.length} log nell'ultima ora\n`);

  console.log('3️⃣  Verificando statistiche...\n');

  const stats = chatLogService.getLogStats(24);
  console.log(`   ✓ Messaggi totali: ${stats.totalMessages}`);
  console.log(`   ✓ Utenti unici: ${stats.uniqueUsers}`);
  console.log(`   ✓ Periodo analizzato: ${stats.timeRange} ore\n`);

  if (stats.users.length > 0) {
    console.log('   👥 Dettaglio utenti:');
    stats.users.forEach(user => {
      console.log(`      - ${user.userId}: ${user.messageCount} messaggi`);
    });
    console.log('');
  }

  console.log('4️⃣  Verificando filtro per utente...\n');

  const user1Logs = chatLogService.getUserLogsLastHours('user1', 24);
  console.log(`   ✓ Trovati ${user1Logs.length} messaggi per user1\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ TUTTI I TEST COMPLETATI CON SUCCESSO!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('💡 Ora puoi visualizzare i log con:');
  console.log('   npm run logs');
  console.log('   npm run logs:stats\n');

} catch (error) {
  console.error('\n❌ ERRORE durante il test:', error.message);
  console.error(error);
  process.exit(1);
}
