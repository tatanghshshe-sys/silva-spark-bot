import { Bot } from 'grammy';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || '7643384612:AAGMm7T6Y3rIZy0rdSe4ic2pav7Yxs68jV4';
const PORT = process.env.PORT || 3000;

let botStatus = 'starting';
let startTime = Date.now();

const bot = new Bot(BOT_TOKEN);

// ── Emoji Mix Database ──
const EMOJI_MIX = {
  '😀+😁': '😆', '😀+😢': '😂', '😀+😡': '🤬',
  '😍+😘': '🥰', '😎+😇': '😊', '🤔+😴': '😪',
  '🐶+🐱': '🦊', '🍕+🍔': '🍽️', '☀️+🌧️': '🌈',
  '❤️+🔥': '💖', '🎵+🎸': '🎶', '⚽+🏀': '🏐',
  '🍎+🍊': '🍑', '🐼+🐨': '🐻', '💻+📱': '⌨️',
};

// ── ATT P text to glowing sticker ──
function attp(text) {
  const chars = text.split('');
  const lines = [];
  for (let i = 0; i < 3; i++) {
    let line = '';
    for (const c of chars) {
      if (i === 0) line += `✨${c}✨ `;
      else if (i === 1) line += ` ${c}  `;
      else line += `💫${c}💫 `;
    }
    lines.push(line.trim());
  }
  return `╔══════════════════════╗\n║ ${lines[0].padEnd(20)}\n║ ${lines[1].padEnd(20)}\n║ ${lines[2].padEnd(20)}\n╚══════════════════════╝`;
}

// ── Commands ──
const MENU_TEXT = `🤖 *SILVA SPARK MD v2.0.1*
👤 by LUPI CEBOL

📋 *Semua Command:*

🏓 /ping — Cek status bot
📋 /menu — Tampilkan menu ini
👤 /owner — Info owner
📊 /info — Detail lengkap bot
🎨 /sticker — Balas gambar → sticker
🖼️ /toimg — Balas sticker → foto
✨ /attp — Text ke glowing sticker
🔀 /emojimix — Mix 2 emoji (contoh: 😀+😢)
😂 /smeme — Sticker meme (balas foto)
📢 /tagall — Tag semua member grup

⚡ *Commands Eksternal (coming soon):*
  /ai — Tanya AI
  /gpt — ChatGPT
  /hd — Enhance foto
  /play — Putar lagu (voice chat)
  /song — Download lagu
  /ytmp3 — YT ke MP3`;

// /start
bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name || 'User';
  await ctx.reply(`Halo *${name}*! 👋\n\nSilva Spark MD siap bantu!\n\n${MENU_TEXT}`, { parse_mode: 'Markdown' });
});

// /ping
bot.command('ping', async (ctx) => {
  const uptime = Math.floor((Date.now() - startTime) / 60);
  await ctx.reply(`🏓 *Pong!*\n\n🤖 Bot: Silva Spark MD v2.0.1\n⏱️ Uptime: ${uptime} menit\n🟢 Status: Online\n⚡ Platform: Telegram\n🌐 Host: Suga Cloud`, { parse_mode: 'Markdown' });
});

// /menu
bot.command('menu', async (ctx) => {
  await ctx.reply(MENU_TEXT, { parse_mode: 'Markdown' });
});

bot.command('help', async (ctx) => {
  await ctx.reply(MENU_TEXT, { parse_mode: 'Markdown' });
});

// /owner
bot.command('owner', async (ctx) => {
  await ctx.reply('👑 *Owner:* LUPI CEBOL\n🤖 *Bot:* Silva Spark MD v2.0.1\n📱 *WA:* 6287815993644\n📦 *Repo:* [GitHub](https://github.com/tatanghshshe-sys/silva-spark-bot)', { parse_mode: 'Markdown' });
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
    `• Tipe Chat: ${chat.type}\n` +
    `• Platform: Telegram Bot API\n` +
    `• Host: Suga Cloud (US)\n` +
    `• Status: 🟢 Online`,
    { parse_mode: 'Markdown' }
  );
});

// /donate
bot.command('donate', async (ctx) => {
  await ctx.reply('⭐ Support bot ini:\nhttps://github.com/tatanghshshe-sys/silva-spark-bot');
});

// /sticker — reply to photo
bot.command('sticker', async (ctx) => {
  const replied = ctx.message?.reply_to_message;
  if (!replied || (!replied.photo && !replied.sticker)) {
    await ctx.reply('⚠️ Balas gambar/sticker pake /sticker buat jadiin sticker.');
    return;
  }
  try {
    if (replied.photo) {
      const fileId = replied.photo[replied.photo.length - 1].file_id;
      await ctx.replyWithSticker(fileId);
    } else if (replied.sticker) {
      await ctx.reply('Udah sticker itu kak 😅');
    }
  } catch (e) {
    await ctx.reply('❌ Gagal bikin sticker.');
  }
});

// /toimg — sticker to image
bot.command('toimg', async (ctx) => {
  const replied = ctx.message?.reply_to_message;
  if (!replied || !replied.sticker) {
    await ctx.reply('⚠️ Balas sticker pake /toimg buat ubah ke foto.');
    return;
  }
  try {
    const fileId = replied.sticker.file_id;
    const file = await ctx.api.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    await ctx.replyWithPhoto(url, { caption: '✅ Sticker → Foto' });
  } catch (e) {
    await ctx.reply('❌ Gagal convert sticker.');
  }
});

// /attp — glowing text sticker effect
bot.command('attp', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!args || args.length > 30) {
    await ctx.reply('✨ Contoh: `/attp LUPI CEBOL`\nMaksimal 30 karakter.', { parse_mode: 'Markdown' });
    return;
  }
  const result = attp(args.toUpperCase());
  await ctx.reply('```\n' + result + '\n```', { parse_mode: 'Markdown' });
});

// /emojimix — mix 2 emojis
bot.command('emojimix', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1).join('');
  if (!args || args.length < 4) {
    await ctx.reply('🔀 Contoh: `/emojimix 😀+😁`\nMix 2 emoji pake tanda +', { parse_mode: 'Markdown' });
    return;
  }
  const result = EMOJI_MIX[args];
  if (result) {
    await ctx.reply(`${args} → ${result}`);
  } else {
    // Random result
    const keys = Object.keys(EMOJI_MIX);
    const random = keys[Math.floor(Math.random() * keys.length)];
    await ctx.reply(`🔀 Emoji ga dikenal. Coba random: ${random} → ${EMOJI_MIX[random]}`);
  }
});

// /smeme — sticker meme
bot.command('smeme', async (ctx) => {
  const replied = ctx.message?.reply_to_message;
  if (!replied || (!replied.photo && !replied.sticker)) {
    await ctx.reply('⚠️ Balas foto/sticker pake /smeme buat bikin meme sticker.\n\nContoh: balas foto lalu `/smeme atas:TEKS ATAS|bawah:TEKS BAWAH`');
    return;
  }
  const args = ctx.message?.text?.split(' ').slice(1).join(' ');
  try {
    if (replied.photo) {
      const fileId = replied.photo[replied.photo.length - 1].file_id;
      await ctx.replyWithSticker(fileId);
      if (args) await ctx.reply(`📝 Caption: ${args}`);
    } else if (replied.sticker) {
      const fileId = replied.sticker.file_id;
      await ctx.replyWithSticker(fileId);
      if (args) await ctx.reply(`📝 Caption: ${args}`);
    }
  } catch {
    await ctx.reply('❌ Gagal bikin meme.');
  }
});

// /tagall — tag all members
bot.command('tagall', async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    const chatType = ctx.chat.type;
    if (chatType === 'private') {
      await ctx.reply('⚠️ /tagall cuma bisa di grup.');
      return;
    }
    const admins = await ctx.api.getChatAdministrators(chatId);
    const senderName = ctx.from?.first_name || 'Someone';
    const args = ctx.message?.text?.split(' ').slice(1).join(' ') || '📢 Attention!';
    
    let mentionText = `📢 *${args}*\n\nDipanggil oleh: ${senderName}\n\n`;
    for (const admin of admins) {
      const user = admin.user;
      const name = user.first_name || 'User';
      mentionText += `• [${name}](tg://user?id=${user.id})\n`;
    }
    await ctx.reply(mentionText, { parse_mode: 'Markdown' });
  } catch (e) {
    await ctx.reply('❌ Ga bisa tag member. Pastikan bot admin di grup.');
  }
});

// Auto replies
const AUTO_REPLIES = {
  'p': 'Hadir bos! 🫡',
  'assalamualaikum': 'Waalaikumsalam warahmatullahi wabarakatuh 🕌',
  'hai': 'Halo! Ketik /menu buat liat semua command.',
  'halo': 'Halo! Ketik /menu buat liat semua command.',
  'bot': 'Ada yang bisa dibantu? Ketik /menu',
  'test': 'Bot aktif bos! 🟢',
};

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.toLowerCase().trim();
  if (text.startsWith('/')) return;
  const sender = ctx.from?.first_name || 'Unknown';
  console.log(`📩 [${sender}] ${text}`);
  if (AUTO_REPLIES[text]) {
    await ctx.reply(AUTO_REPLIES[text]);
  }
});

// ── HTTP Server ──
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const uptime = Math.floor((Date.now() - startTime) / 60);
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
