import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import dotenv from 'dotenv';
import crypto from 'crypto';
import http from 'http';

// Polyfill: ensure global crypto is available for Baileys
if (!globalThis.crypto) {
  globalThis.crypto = crypto;
}

dotenv.config();

const logger = pino({ level: 'silent' });
const SESSION_DIR = process.env.SESSION_DIR || './sessions';
const PORT = process.env.PORT || 3000;

let botStatus = 'starting';

// Simple HTTP server for health check
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: botStatus, name: 'Silva Spark MD', version: '2.0.1', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html><html><head><title>Silva Spark MD</title></head><body style="background:#0f0c29;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>🤖 Silva Spark MD</h1><p>Status: ${botStatus}</p><p>v2.0.1 | LUPI CEBOL</p></div></body></html>`);
  }
});

server.listen(PORT, () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});

// ── Bot Features ──
const MENU_TEXT = `🤖 *SILVA SPARK MD v2.0.1*

Halo! Aku Silva Spark, bot WhatsApp multi-device!

📋 *Commands:*
  • */ping* - Cek status bot
  • */menu* - Tampilkan menu ini
  • */sticker* - Buat sticker dari gambar
  • */owner* - Info owner bot
  • */donate* - Support bot development

⚡ Powered by Baileys MD | LUPI CEBOL`;

const AUTO_REPLIES = {
  'p': 'Hadir bos! 🫡',
  'ping': 'Pong! 🏓 Bot aktif nih...',
  'assalamualaikum': 'Waalaikumsalam warahmatullahi wabarakatuh 🕌',
  'menu': MENU_TEXT,
  'help': MENU_TEXT,
  'owner': 'Owner: *LUPI CEBOL*\nBot: Silva Spark MD v2.0.1',
  'donate': 'Support bot ini dengan star repo ya! ⭐\nhttps://github.com/tatanghshshe-sys/silva-spark-bot',
};

// ── Initialize ──
async function startBot() {
  console.log('[startBot] Reading auth state...');
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  console.log('[startBot] Auth state loaded. Creating socket...');

  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: true,
    browser: ['Silva Spark MD', 'Chrome', '2.0.1'],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
  });

  console.log('[startBot] Socket created. Waiting for connection.update events...');

  // Connection & QR handler
  sock.ev.on('connection.update', (update) => {
    const { qr, connection, lastDisconnect, isNewLogin } = update;
    console.log(`[conn.update] connection=${connection} qr=${!!qr} isNewLogin=${isNewLogin}`);

    if (qr) {
      console.log('\n📱 === SCAN QR CODE BELOW ===\n');
      // QR is auto-printed by printQRInTerminal
    }

    if (connection === 'open') {
      botStatus = 'connected';
      console.log('✅ Silva Spark MD terhubung ke WhatsApp!');
      console.log(`🤖 Bot Name: ${sock.user?.name || 'Unknown'}`);
    }

    if (connection === 'close') {
      botStatus = 'disconnected';
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reasonMsg = lastDisconnect?.error?.message || 'unknown';
      console.log(`[conn.close] StatusCode=${statusCode} Reason=${reasonMsg}`);
      
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`[conn.close] Should reconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        console.log('🔄 Reconnecting in 5s...');
        setTimeout(startBot, 5000);
      } else {
        console.log('❌ LOGGED OUT - Delete /app/sessions folder and redeploy');
      }
    }
  });

  // Message handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const chat = msg.key.remoteJid;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      if (!text) continue;

      const sender = msg.pushName || 'Unknown';
      console.log(`📩 [${sender}] ${text}`);

      const cmd = text.toLowerCase().trim();
      if (cmd === '/ping' || cmd === 'ping') {
        await sock.sendMessage(chat, { text: 'Pong! 🏓 Silva Spark MD v2.0.1 aktif!' });
      } else if (cmd === '/menu' || cmd === 'menu' || cmd === 'help' || cmd === '/help') {
        await sock.sendMessage(chat, { text: MENU_TEXT });
      } else if (cmd === '/owner' || cmd === 'owner') {
        await sock.sendMessage(chat, { text: 'Owner: *LUPI CEBOL* 👑' });
      } else if (AUTO_REPLIES[cmd]) {
        await sock.sendMessage(chat, { text: AUTO_REPLIES[cmd] });
      }
    }
  });

  // Save credentials
  sock.ev.on('creds.update', saveCreds);
}

// ── Start ──
console.log(`
╔══════════════════════════════════╗
║     🤖 SILVA SPARK MD v2.0.1    ║
║        by LUPI CEBOL            ║
╚══════════════════════════════════╝
`);

startBot().catch(err => {
  console.error('❌ Bot FATAL error:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});
