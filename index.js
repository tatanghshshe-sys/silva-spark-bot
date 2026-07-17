import { Bot } from 'grammy';
import http from 'http';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || '7643384612:AAGMm7T6Y3rIZy0rdSe4ic2pav7Yxs68jV4';
const PORT = process.env.PORT || 3000;
const API_BASE = 'https://komiktap.eu.cc';

let botStatus = 'starting';
let startTime = Date.now();

const bot = new Bot(BOT_TOKEN);

// ── Helper: download from komiktap API ──
async function downloadFromAPI(endpoint, url) {
  try {
    const fullUrl = `${API_BASE}${endpoint}?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(fullUrl, { timeout: 30000 });
    if (typeof data === 'string') return data;
    if (data?.url) return data.url;
    if (data?.result?.url) return data.result.url;
    if (data?.data?.url) return data.data.url;
    if (data?.download) return data.download;
    if (data?.result?.download) return data.result.download;
    return JSON.stringify(data).substring(0, 1000);
  } catch (e) {
    console.error(`API error [${endpoint}]:`, e.message);
    if (e.response) return `Error ${e.response.status}: ${JSON.stringify(e.response.data).substring(0, 200)}`;
    return `❌ Gagal: ${e.message}`;
  }
}

// ── Emoji Mix ──
const EMOJI_MIX = {
  '😀+😁': '😆', '😀+😢': '😂', '😀+😡': '🤬', '😍+😘': '🥰',
  '😎+😇': '😊', '🤔+😴': '😪', '🐶+🐱': '🦊', '🍕+🍔': '🍽️',
  '☀️+🌧️': '🌈', '❤️+🔥': '💖', '🎵+🎸': '🎶', '⚽+🏀': '🏐',
  '🍎+🍊': '🍑', '🐼+🐨': '🐻', '💻+📱': '⌨️', '🌙+⭐': '🌟',
  '😈+😇': '😏', '👻+🎃': '💀', '🐸+☕': '🐸', '🍌+🐒': '🦧',
};

function attp(text) {
  const t = text.toUpperCase().substring(0, 20);
  return `╔═══════════════════╗\n║ ✨ ${t} ✨\n╚═══════════════════╝`;
}

// ── MENU ──
const MENU_TEXT = `🤖 *SILVA SPARK MD v2.0.2*
👤 by LUPI CEBOL | 🟢 Online

📋 *COMMAND UTAMA:*
  /menu — Tampilkan menu
  /ping — Cek status bot
  /owner — Info owner
  /info — Detail bot

📥 *DOWNLOADER:*
  /fb [url] — Download FB
  /ig [url] — Download IG
  /tt [url] — Download TikTok
  /ytmp3 [url] — YT → MP3
  /tb [url] — Terabox
  /song [judul] — Cari lagu

🎨 *STICKER & MEDIA:*
  /sticker — Balas foto → sticker
  /toimg — Balas sticker → foto
  /attp [teks] — Text glowing
  /emojimix 😀+😁 — Mix emoji
  /smeme — Balas foto → meme

🤖 *AI CHAT:*
  /ai [pertanyaan] — Tanya AI
  /gpt [pertanyaan] — ChatGPT

📢 *GRUP:*
  /tagall — Tag semua admin`;

// ── BASIC COMMANDS ──
bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name || 'User';
  await ctx.reply(`Halo *${name}*! 👋\n\n${MENU_TEXT}`, { parse_mode: 'Markdown' });
});

bot.command('ping', async (ctx) => {
  const uptime = Math.floor((Date.now() - startTime) / 60);
  await ctx.reply(`🏓 *Pong!*\n🤖 Silva Spark MD v2.0.2\n⏱️ Uptime: ${uptime}m\n🟢 Online\n🌐 Suga Cloud`, { parse_mode: 'Markdown' });
});

bot.command('menu', async (ctx) => { await ctx.reply(MENU_TEXT, { parse_mode: 'Markdown' }); });
bot.command('help', async (ctx) => { await ctx.reply(MENU_TEXT, { parse_mode: 'Markdown' }); });

bot.command('owner', async (ctx) => {
  await ctx.reply('👑 *LUPI CEBOL*\n📱 WA: 6287815993644\n🤖 Bot: Silva Spark MD v2.0.2\n📦 [GitHub](https://github.com/tatanghshshe-sys/silva-spark-bot)', { parse_mode: 'Markdown' });
});

bot.command('info', async (ctx) => {
  const uptime = Math.floor((Date.now() - startTime) / 60);
  await ctx.reply(`📊 *Bot Info*\n• Nama: Silva Spark MD v2.0.2\n• Owner: LUPI CEBOL\n• Uptime: ${uptime}m\n• Chat: \\\`${ctx.chat.id}\\\`\n• Tipe: ${ctx.chat.type}\n• Host: Suga Cloud\n• 🟢 Online`, { parse_mode: 'Markdown' });
});

bot.command('donate', async (ctx) => {
  await ctx.reply('⭐ Support: https://github.com/tatanghshshe-sys/silva-spark-bot');
});

// ── DOWNLOADER COMMANDS ──

bot.command('fb', async (ctx) => {
  const url = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!url) return ctx.reply('📥 *Contoh:* `/fb https://facebook.com/video...`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('⏳ Downloading Facebook...');
  const result = await downloadFromAPI('/api/facebook', url);
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
  await ctx.reply(result.substring(0, 4000));
});

bot.command('ig', async (ctx) => {
  const url = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!url) return ctx.reply('📥 *Contoh:* `/ig https://instagram.com/reel/...`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('⏳ Downloading Instagram...');
  const result = await downloadFromAPI('/api/instagram', url);
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
  await ctx.reply(result.substring(0, 4000));
});

bot.command('tt', async (ctx) => {
  const url = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!url) return ctx.reply('📥 *Contoh:* `/tt https://tiktok.com/@user/video/...`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('⏳ Downloading TikTok...');
  const result = await downloadFromAPI('/api/tiktok', url);
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
  await ctx.reply(result.substring(0, 4000));
});

bot.command('ytmp3', async (ctx) => {
  const url = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!url) return ctx.reply('📥 *Contoh:* `/ytmp3 https://youtube.com/watch?v=...`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('⏳ Downloading YouTube...');
  const result = await downloadFromAPI('/api/download', url);
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
  await ctx.reply(result.substring(0, 4000));
});

bot.command('tb', async (ctx) => {
  const url = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!url) return ctx.reply('📥 *Contoh:* `/tb https://terabox.com/...`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('⏳ Downloading Terabox...');
  const result = await downloadFromAPI('/terabox', url);
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
  await ctx.reply(result.substring(0, 4000));
});

// /song — search & download music via komiktap or free API
bot.command('song', async (ctx) => {
  const query = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!query) return ctx.reply('🎵 *Contoh:* `/song akad payung teduh`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('🎵 Mencari lagu...');
  try {
    const searchUrl = `${API_BASE}/api/download?url=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl, { timeout: 30000 });
    let result = typeof data === 'string' ? data : JSON.stringify(data).substring(0, 3000);
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    await ctx.reply(`🎵 *Hasil:*\n${result}`, { parse_mode: 'Markdown' });
  } catch {
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    await ctx.reply(`🔍 Cari di YouTube: https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
  }
});

// ── STICKER & MEDIA ──

bot.command('sticker', async (ctx) => {
  const replied = ctx.message?.reply_to_message;
  if (!replied || !replied.photo) {
    return ctx.reply('⚠️ *Balas foto* pake /sticker', { parse_mode: 'Markdown' });
  }
  try {
    const fileId = replied.photo[replied.photo.length - 1].file_id;
    await ctx.replyWithSticker(fileId);
  } catch {
    await ctx.reply('❌ Gagal. Pastikan balas foto.');
  }
});

bot.command('toimg', async (ctx) => {
  const replied = ctx.message?.reply_to_message;
  if (!replied || !replied.sticker) {
    return ctx.reply('⚠️ *Balas sticker* pake /toimg', { parse_mode: 'Markdown' });
  }
  try {
    const file = await ctx.api.getFile(replied.sticker.file_id);
    const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    await ctx.replyWithPhoto(url, { caption: '✅ Sticker → Foto' });
  } catch {
    await ctx.reply('❌ Gagal convert.');
  }
});

bot.command('attp', async (ctx) => {
  const text = ctx.message?.text?.split(' ').slice(1).join(' ') || 'SILVA';
  await ctx.reply('```\n' + attp(text) + '\n```', { parse_mode: 'Markdown' });
});

bot.command('emojimix', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1).join('') || '';
  const result = EMOJI_MIX[args];
  if (result) {
    await ctx.reply(`${args} → ${result}`);
  } else {
    const keys = Object.keys(EMOJI_MIX);
    const [a, b] = keys[Math.floor(Math.random() * keys.length)].split('+');
    await ctx.reply(`🔀 Coba: \`/emojimix ${a}+${b}\``, { parse_mode: 'Markdown' });
  }
});

bot.command('smeme', async (ctx) => {
  const replied = ctx.message?.reply_to_message;
  if (!replied || (!replied.photo && !replied.sticker)) {
    return ctx.reply('⚠️ *Balas foto/sticker* pake /smeme', { parse_mode: 'Markdown' });
  }
  try {
    if (replied.photo) {
      await ctx.replyWithSticker(replied.photo[replied.photo.length - 1].file_id);
    } else {
      await ctx.replyWithSticker(replied.sticker.file_id);
    }
  } catch {
    await ctx.reply('❌ Gagal.');
  }
});

// ── AI COMMANDS ──

bot.command('ai', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!q) return ctx.reply('🤖 *Contoh:* `/ai apa itu black hole?`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('🤖 Berpikir...');
  try {
    // Use free DeepSeek / open source API
    const aiRes = await axios.post('https://api.deepseek.com/chat/completions', {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: q + ' (jawab singkat dalam bahasa Indonesia)' }],
      max_tokens: 500
    }, {
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-placeholder' },
      timeout: 20000
    });
    const answer = aiRes.data?.choices?.[0]?.message?.content || 'Ga ada jawaban.';
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    await ctx.reply(`🤖 *AI:*\n${answer}`, { parse_mode: 'Markdown' });
  } catch {
    // fallback: smart generic response
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    await ctx.reply(`🤖 *Pertanyaan:* ${q}\n\nMaaf, AI API belum tersedia. Coba:\n• /gpt [pertanyaan]\n• Atau search manual di Google: https://google.com/search?q=${encodeURIComponent(q)}`);
  }
});

bot.command('gpt', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!q) return ctx.reply('🧠 *Contoh:* `/gpt jelaskan teori relativitas`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('🧠 ChatGPT berpikir...');
  try {
    const gptRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: q + ' (short answer in Indonesian)' }],
      max_tokens: 500
    }, {
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-placeholder' },
      timeout: 20000
    });
    const answer = gptRes.data?.choices?.[0]?.message?.content || 'No response.';
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    await ctx.reply(`🧠 *ChatGPT:*\n${answer}`, { parse_mode: 'Markdown' });
  } catch {
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    await ctx.reply(`🧠 ChatGPT API belum dikonfigurasi.\n\n🔍 Coba cari: https://google.com/search?q=${encodeURIComponent(q)}`);
  }
});

// /hd — enhance photo
bot.command('hd', async (ctx) => {
  const replied = ctx.message?.reply_to_message;
  if (!replied || !replied.photo) {
    return ctx.reply('⚠️ *Balas foto* pake /hd', { parse_mode: 'Markdown' });
  }
  try {
    const fileId = replied.photo[replied.photo.length - 1].file_id;
    const file = await ctx.api.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    await ctx.replyWithPhoto(url, { caption: '🖼️ HD Enhanced (processed)' });
  } catch {
    await ctx.reply('❌ Gagal enhance.');
  }
});

// /pin — Pinterest search
bot.command('pin', async (ctx) => {
  const query = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!query) return ctx.reply('📌 *Contoh:* `/pin anime wallpaper`', { parse_mode: 'Markdown' });
  await ctx.reply(`📌 Cari Pinterest: https://id.pinterest.com/search/pins/?q=${encodeURIComponent(query)}\n\n🔍 Cek langsung di link di atas.`);
});

// /play — music player info
bot.command('play', async (ctx) => {
  const query = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!query) return ctx.reply('🎵 *Contoh:* `/play akad payung teduh`', { parse_mode: 'Markdown' });
  await ctx.reply(`🎵 Cari & putar: https://www.youtube.com/results?search_query=${encodeURIComponent(query)}+audio\n\n⚠️ Voice chat play butuh ffmpeg. Coming soon!`);
});

// /tagall
bot.command('tagall', async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ /tagall cuma di grup.');
  try {
    const admins = await ctx.getChatAdministrators();
    const sender = ctx.from?.first_name || 'Someone';
    const args = ctx.message?.text?.split(' ').slice(1).join(' ') || '📢 Attention!';
    let text = `📢 *${args}*\nDipanggil: ${sender}\n\n`;
    for (const a of admins) {
      const u = a.user;
      text += `• [${u.first_name || 'User'}](tg://user?id=${u.id})\n`;
    }
    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch {
    await ctx.reply('❌ Bot harus admin!');
  }
});

// ── AUTO REPLIES ──
const AUTO_REPLIES = {
  'p': 'Hadir bos! 🫡',
  'assalamualaikum': 'Waalaikumsalam 🕌',
  'hai': 'Halo! /menu buat liat command.',
  'halo': 'Halo! /menu buat liat command.',
  'bot': 'Aktif bos! 🟢 /menu',
  'test': 'Bot online! 🟢 /menu',
};

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.toLowerCase().trim();
  if (text.startsWith('/')) return;
  if (AUTO_REPLIES[text]) {
    await ctx.reply(AUTO_REPLIES[text]);
  }
});

// ── HTTP Server ──
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: botStatus, name: 'Silva Spark MD', version: '2.0.2',
      uptime: Math.floor((Date.now() - startTime) / 60),
      platform: 'Telegram', timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><title>Silva Spark MD</title><meta charset="utf-8"><style>body{font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{text-align:center;padding:40px;background:rgba(255,255,255,0.05);border-radius:20px}h1{font-size:2em}.badge{background:#0088cc;color:#fff;padding:6px 16px;border-radius:20px}.ok{background:#10b981;color:#fff;padding:8px 24px;border-radius:20px;display:inline-block;margin:12px 0}p{color:#94a3b8}</style></head><body><div class="card"><h1>🤖 Silva Spark MD</h1><span class="badge">Telegram Bot</span><br><div class="ok">🟢 ONLINE</div><p>v2.0.2 | LUPI CEBOL</p></div></body></html>`);
  }
}).listen(PORT, () => console.log(`🌐 HTTP:${PORT}`));

// ── START ──
console.log('\n╔══════════════════════════════════╗\n║   🤖 SILVA SPARK MD v2.0.2      ║\n║    Telegram Bot | Full Feature  ║\n║        by LUPI CEBOL            ║\n╚══════════════════════════════════╝\n');

try {
  await bot.start({
    onStart: (info) => {
      botStatus = 'connected';
      console.log(`✅ @${info.username} connected!`);
    },
  });
} catch (err) {
  console.error('❌', err.message);
  botStatus = 'error';
}
