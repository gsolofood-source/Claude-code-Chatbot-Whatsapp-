#!/usr/bin/env node

import chatLogService from '../src/services/chatLogService.js';

const args = process.argv.slice(2);
const hoursArg = args.find(arg => arg.startsWith('--hours='));
const userArg = args.find(arg => arg.startsWith('--user='));
const statsFlag = args.includes('--stats');

const hours = hoursArg ? parseInt(hoursArg.split('=')[1]) : 15;
const userId = userArg ? userArg.split('=')[1] : null;

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 CHAT LOGS VIEWER');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  if (statsFlag) {
    // Mostra statistiche
    console.log(`📈 Statistiche chat logs (ultime ${hours} ore):\n`);
    const stats = chatLogService.getLogStats(hours);

    console.log(`Messaggi totali: ${stats.totalMessages}`);
    console.log(`Utenti unici: ${stats.uniqueUsers}`);
    console.log(`Periodo: ${stats.timeRange} ore\n`);

    if (stats.users.length > 0) {
      console.log('👥 Dettaglio utenti:\n');
      stats.users.forEach((user, index) => {
        console.log(`${index + 1}. User ID: ${user.userId}`);
        console.log(`   Messaggi: ${user.messageCount}`);
        console.log(`   Primo messaggio: ${new Date(user.firstMessage).toLocaleString('it-IT')}`);
        console.log(`   Ultimo messaggio: ${new Date(user.lastMessage).toLocaleString('it-IT')}`);
        console.log('');
      });
    }
  } else {
    // Mostra i log
    let logs;
    if (userId) {
      console.log(`💬 Log chat per utente: ${userId} (ultime ${hours} ore)\n`);
      logs = chatLogService.getUserLogsLastHours(userId, hours);
    } else {
      console.log(`💬 Tutti i log chat (ultime ${hours} ore)\n`);
      logs = chatLogService.getLogsLastHours(hours);
    }

    if (logs.length === 0) {
      console.log('❌ Nessun log trovato per il periodo specificato.\n');
    } else {
      console.log(`Trovati ${logs.length} messaggi:\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      logs.forEach((log, index) => {
        const timestamp = new Date(log.timestamp).toLocaleString('it-IT');
        const role = log.role.toUpperCase();
        const emoji = log.role === 'user' ? '👤' : '🤖';

        console.log(`${index + 1}. ${emoji} [${timestamp}] ${role}`);
        console.log(`   User ID: ${log.userId}`);
        console.log(`   Tipo: ${log.messageType}`);

        // Tronca il contenuto se troppo lungo
        let content = log.content || '(nessun contenuto)';
        if (content.length > 200) {
          content = content.substring(0, 200) + '...';
        }
        console.log(`   Contenuto: ${content}`);

        if (log.metadata && Object.keys(log.metadata).length > 0) {
          const metadataKeys = Object.keys(log.metadata).filter(k => log.metadata[k]);
          if (metadataKeys.length > 0) {
            console.log(`   Metadata: ${metadataKeys.join(', ')}`);
          }
        }

        console.log('');
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }

  console.log('\n✅ Operazione completata\n');
} catch (error) {
  console.error('\n❌ Errore durante il recupero dei log:', error.message);
  console.error(error);
  process.exit(1);
}

// Aiuto
if (args.includes('--help') || args.includes('-h')) {
  console.log('\nUSO:');
  console.log('  node scripts/view-chat-logs.js [opzioni]\n');
  console.log('OPZIONI:');
  console.log('  --hours=N      Numero di ore da visualizzare (default: 15, max: 168)');
  console.log('  --user=ID      Filtra per un utente specifico');
  console.log('  --stats        Mostra statistiche invece dei log dettagliati');
  console.log('  --help, -h     Mostra questo messaggio di aiuto\n');
  console.log('ESEMPI:');
  console.log('  node scripts/view-chat-logs.js');
  console.log('  node scripts/view-chat-logs.js --hours=24');
  console.log('  node scripts/view-chat-logs.js --user=1234567890 --hours=48');
  console.log('  node scripts/view-chat-logs.js --stats --hours=24\n');
}
