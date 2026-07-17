import { Bot } from 'grammy';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || '7643384612:AAGMm7T6Y3rIZy0rdSe4ic2pav7Yxs68jV4';
const PORT = process.env.PORT || 3000;

let botStatus = 'starting';
let startTime = Date.now();

// ── Telegram Bot ──
const bot = new Bot(BOT_TOKEN);

const MENU_TEXT = `🤖 *SILVA SPARK MD v2.0.1*
by LUPI CEBOL

📋 *Commands:*
  /ping — Cek status bot
  /menu — Tampilkan menu
  /owner — Info owner
  /info — Detail bot
  /sticker — Balas gambar buat jadi sticker
  /donate — Dukung bot

⚡ Telegram Bot | Aktif 24/7`;

// /start command
bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name || 'User';
  await ctx.reply(`Halo *${name}*! 👋\n\n${MENU_TEXT}`, { parse_mode: 'Markdown' });
});

// /ping
bot.command('ping', async (ctx) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  await ctx.reply(`🏓 *Pong!*\nBot: Silva Spark MD v2.0.1\nUptime: ${uptime}s\nStatus: Online`, { parse_mode: 'Markdown' });
});

// /menu
bot.command('menu', async (ctx) => {
  await ctx.reply(MENU_TEXT, { parse_mode: 'Markdown' });
});

// /help → same as menu
bot.command('help', async (ctx) => {
  await ctx.reply(MENU_TEXT, { parse_mode: 'Markdown' });
});

// /owner
bot.command('owner', async (ctx) => {
  await ctx.reply('👑 *Owner:* LUPI CEBOL\n🤖 *Bot:* Silva Spark MD v2.0.1\n📦 *GitHub:* [Repo](https://github.com/tatanghshshe-sys/silva-spark-bot)', { parse_mode: 'Markdown' });
});

// /info
bot.command('info', async (ctx) => {
  const chat = ctx.chat;
  const uptime = Math.floor((Date.now() - startTime) / 60);
  await ctx.reply(
    `📊 *Bot Info*\n\n` +
    `• Nama: Silva Spark MD v2.0.1\n` +
    `• Owner: LUPI CEBOL\n` +
    `• Uptime: ${uptime} menit\n` +
    `• Chat ID: \\\`${chat.id}\\\`\n` +
    `• Tipe: ${chat.type}\n` +
    `• Platform: Telegram Bot API\n` +
    `• Status: 🟢 Online`,
    { parse_mode: 'Markdown' }
  );
});

// /donate
bot.command('donate', async (ctx) => {
  await ctx.reply('⭐ Support bot ini:\nhttps://github.com/tatanghshshe-sys/silva-spark-bot');
});

// Sticker command — reply to photo
bot.command('sticker', async (ctx) => {
  const replied = ctx.message?.reply_to_message;
  if (!replied || !replied.photo) {
    await ctx.reply('⚠️ Balas gambar pake /sticker buat jadiin sticker.');
    return;
  }
  const fileId = replied.photo[replied.photo.length - 1].file_id;
  try {
    await ctx.replyWithSticker(fileId);
  } catch {
    await ctx.reply('❌ Gagal bikin sticker. Coba gambar lain.');
  }
});

// Auto-reply untuk keyword tertentu
const AUTO_REPLIES = {
  'p': 'Hadir bos! 🫡',
  'assalamualaikum': 'Waalaikumsalam warahmatullahi wabarakatuh 🕌',
  'hai': 'Halo! Ketik /menu buat liat command.',
  'halo': 'Halo! Ketik /menu buat liat command.',
  'bot': 'Ada yang bisa dibantu? Ketik /menu',
};

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.toLowerCase().trim();
  
  // Skip commands
  if (text.startsWith('/')) return;

  const sender = ctx.from?.first_name || 'Unknown';
  console.log(`📩 [Telegram] [${sender}] ${text}`);

  if (AUTO_REPLIES[text]) {
    await ctx.reply(AUTO_REPLIES[text]);
  }
});

// ── HTTP Server ──
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    res.end(JSON.stringify({ status: botStatus, name: 'Silva Spark MD', version: '2.0.1', uptime, platform: 'Telegram', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><title>Silva Spark MD</title><meta charset="utf-8"><style>body{font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0} .card{text-align:center;padding:40px;background:rgba(255,255,255,0.05);border-radius:20px;border:1px solid rgba(255,255,255,0.1)} h1{font-size:2em;margin:0 0 10px} .badge{background:#0088cc;color:white;padding:6px 16px;border-radius:20px;font-size:14px} .ok{background:#10b981;color:white;padding:8px 24px;border-radius:20px;display:inline-block;margin:12px 0} p{color:#94a3b8;margin:4px 0}</style></head><body><div class="card"><h1>🤖 Silva Spark MD</h1><span class="badge">Telegram Bot</span><br><div class="ok">🟢 ONLINE</div><p>v2.0.1 | LUPI CEBOL</p></div></body></html>`);
  }
});

server.listen(PORT, () => {
  console.log(`🌐 HTTP server: port ${PORT}`);
});

// ── Start ──
console.log(`
╔══════════════════════════════════╗
║   🤖 SILVA SPARK MD v2.0.1      ║
║      Telegram Bot Edition       ║
║        by LUPI CEBOL            ║
╚══════════════════════════════════╝
`);

try {
  await bot.start({
    onStart: (info) => {
      botStatus = 'connected';
      console.log(`✅ Telegram bot terhubung! @${info.username}`);
    },
  });
  console.log('🤖 Bot started!');
} catch (err) {
  console.error('❌ Bot error:', err.message);
  botStatus = 'error';
}
