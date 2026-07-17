import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { toDataURL } from 'qrcode-terminal';
import pino from 'pino';
import dotenv from 'dotenv';

dotenv.config();

const logger = pino({ level: 'silent' });

// ── Session Store ──
const SESSION_DIR = process.env.SESSION_DIR || './sessions';

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

// ── Auto-Reply Messages ──
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
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['Silva Spark MD', 'Chrome', '2.0.1'],
  });

  // QR Code handler
  sock.ev.on('connection.update', ({ qr, connection, lastDisconnect }) => {
    if (qr) {
      console.log('\n📱 Scan QR Code below to connect WhatsApp:\n');
      toDataURL(qr, (err, url) => {
        if (err) {
          console.log('QR Error:', err);
        } else {
          console.log(url);
        }
      });
    }

    if (connection === 'open') {
      console.log('✅ Silva Spark MD terhubung ke WhatsApp!');
      console.log(`🤖 Bot Name: ${sock.user?.name || 'Unknown'}`);
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('⚠️ Koneksi terputus. Reconnect:', shouldReconnect);

      if (shouldReconnect) {
        console.log('🔄 Mencoba reconnect dalam 5 detik...');
        setTimeout(startBot, 5000);
      } else {
        console.log('❌ Logged out. Hapus folder sessions untuk pairing ulang.');
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

      // Log message
      const sender = msg.pushName || 'Unknown';
      console.log(`📩 [${sender}] ${text}`);

      // Command handler
      const cmd = text.toLowerCase().trim();

      if (cmd === '/ping' || cmd === 'ping') {
        await sock.sendMessage(chat, { text: 'Pong! 🏓 Silva Spark MD v2.0.1 aktif!' });
      } else if (cmd === '/menu' || cmd === 'menu' || cmd === 'help' || cmd === '/help') {
        await sock.sendMessage(chat, { text: MENU_TEXT });
      } else if (cmd === '/owner' || cmd === 'owner') {
        await sock.sendMessage(chat, { text: 'Owner: *LUPI CEBOL* 👑' });
      } else if (cmd === '/donate' || cmd === 'donate') {
        await sock.sendMessage(chat, { text: '⭐ Star repo: https://github.com/tatanghshshe-sys/silva-spark-bot' });
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
  console.error('❌ Bot error:', err);
  process.exit(1);
});
