import { Bot } from 'grammy';
import http from 'http';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || '7643384612:AAGMm7T6Y3rIZy0rdSe4ic2pav7Yxs68jV4';
const PORT = process.env.PORT || 3000;

// Primary API
const API = 'https://komiktap.eu.cc';
// Secondary API (371 endpoints!)
const ANABOT = 'https://anabot.my.id';

let botStatus = 'starting';
let startTime = Date.now();
const bot = new Bot(BOT_TOKEN);

// ── Download helper (komiktap primary, anabot fallback) ──
async function download(url, endpoint) {
  const apis = [
    { base: API, path: endpoint },
    { base: ANABOT, path: '/api/download/aio' },
  ];
  for (const api of apis) {
    try {
      const { data } = await axios.get(`${api.base}${api.path}?url=${encodeURIComponent(url)}`, { timeout: 30000 });
      if (data?.url) return data.url;
      if (data?.result?.url) return data.result.url;
      if (data?.data?.url) return data.data.url;
      if (data?.download) return data.download;
      if (typeof data === 'string') return data;
      return JSON.stringify(data).substring(0, 2000);
    } catch (e) {
      continue;
    }
  }
  return '❌ Semua API down. Coba lagi nanti.';
}

// ── AI helper (anabot) ──
async function aiChat(endpoint, q) {
  try {
    const { data } = await axios.get(`${ANABOT}${endpoint}?q=${encodeURIComponent(q)}`, { timeout: 25000 });
    if (data?.result) return data.result;
    if (data?.response) return data.response;
    if (data?.answer) return data.answer;
    if (data?.message) return data.message;
    if (typeof data === 'string') return data;
    return JSON.stringify(data).substring(0, 2000);
  } catch {
    return null;
  }
}

// ── Emoji Mix ──
const EMOJI_MIX = {
  '😀+😁':'😆','😀+😢':'😂','😀+😡':'🤬','😍+😘':'🥰','😎+😇':'😊',
  '🤔+😴':'😪','🐶+🐱':'🦊','🍕+🍔':'🍽️','☀️+🌧️':'🌈','❤️+🔥':'💖',
  '🎵+🎸':'🎶','⚽+🏀':'🏐','🍎+🍊':'🍑','🐼+🐨':'🐻','🌙+⭐':'🌟',
};

// ── ATTP via anabot ──
async function makeAttp(text) {
  try {
    const { data } = await axios.get(`${ANABOT}/api/maker/attp?text=${encodeURIComponent(text)}`, { timeout: 15000 });
    if (data?.url) return data.url;
    if (data?.result) return data.result;
    return null;
  } catch { return null; }
}

// ── MENU ──
const MENU = `🤖 *SILVA SPARK MD v3.0*
🟢 Online | komiktap + AnaBot

📥 *DOWNLOADER:*
  /fb /ig /tt /ytmp3 /tb /song

🤖 *AI CHAT:*
  /ai — AI pintar
  /gpt — ChatGPT
  /opera — Opera ARIA AI
  /andi — Andi Search AI

🎨 *STICKER & MEDIA:*
  /sticker /toimg /attp /emojimix /smeme /hd

🔍 *SEARCH:*
  /anime — Cari anime
  /pin — Pinterest
  /alkitab — Ayat Alkitab
  /news — Berita

🎮 *FUN:*
  /asahotak — Game asah otak
  /affirmation — Kata motivasi

📢 *GRUP:*
  /tagall — Tag semua admin`;

// ── BASIC ──
bot.command('start', async (ctx) => {
  await ctx.reply(`Halo *${ctx.from?.first_name || 'User'}*! 👋\n\n${MENU}`, { parse_mode: 'Markdown' });
});
bot.command('menu', async (ctx) => { await ctx.reply(MENU, { parse_mode: 'Markdown' }); });
bot.command('help', async (ctx) => { await ctx.reply(MENU, { parse_mode: 'Markdown' }); });

bot.command('ping', async (ctx) => {
  const m = Math.floor((Date.now() - startTime) / 60);
  await ctx.reply(`🏓 *Pong!*\n🤖 v3.0 | ⏱️ ${m}m 🟢`, { parse_mode: 'Markdown' });
});

bot.command('owner', async (ctx) => {
  await ctx.reply('👑 *LUPI CEBOL*\n📱 6287815993644\n🤖 v3.0\n📦 [GitHub](https://github.com/tatanghshshe-sys/silva-spark-bot)', { parse_mode: 'Markdown' });
});

bot.command('info', async (ctx) => {
  const m = Math.floor((Date.now() - startTime) / 60);
  await ctx.reply(`📊 *v3.0*\n• Uptime: ${m}m\n• Chat: \\\`${ctx.chat.id}\\\`\n• Tipe: ${ctx.chat.type}\n• API: komiktap + AnaBot\n• 🟢 Online`, { parse_mode: 'Markdown' });
});

// ── DOWNLOADER ──
bot.command('fb', async (ctx) => {
  const u = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!u) return ctx.reply('📥 `/fb [url]`', { parse_mode: 'Markdown' });
  const m = await ctx.reply('⏳ Downloading FB...');
  const r = await download(u, '/api/facebook');
  await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
  await ctx.reply(r.substring(0, 4000));
});

bot.command('ig', async (ctx) => {
  const u = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!u) return ctx.reply('📥 `/ig [url]`', { parse_mode: 'Markdown' });
  const m = await ctx.reply('⏳ Downloading IG...');
  const r = await download(u, '/api/instagram');
  await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
  await ctx.reply(r.substring(0, 4000));
});

bot.command('tt', async (ctx) => {
  const u = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!u) return ctx.reply('📥 `/tt [url]`', { parse_mode: 'Markdown' });
  const m = await ctx.reply('⏳ Downloading TikTok...');
  const r = await download(u, '/api/tiktok');
  await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
  await ctx.reply(r.substring(0, 4000));
});

bot.command('ytmp3', async (ctx) => {
  const u = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!u) return ctx.reply('📥 `/ytmp3 [url]`', { parse_mode: 'Markdown' });
  const m = await ctx.reply('⏳ Downloading YT...');
  const r = await download(u, '/api/download');
  await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
  await ctx.reply(r.substring(0, 4000));
});

bot.command('tb', async (ctx) => {
  const u = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!u) return ctx.reply('📥 `/tb [url]`', { parse_mode: 'Markdown' });
  const m = await ctx.reply('⏳ Downloading Terabox...');
  const r = await download(u, '/terabox');
  await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
  await ctx.reply(r.substring(0, 4000));
});

bot.command('song', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!q) return ctx.reply('🎵 `/song [judul]`', { parse_mode: 'Markdown' });
  const m = await ctx.reply('🎵 Mencari...');
  const r = await download(q, '/api/download');
  await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
  await ctx.reply(r.substring(0, 4000));
});

// ── AI ──
bot.command('ai', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!q) return ctx.reply('🤖 `/ai [pertanyaan]`', { parse_mode: 'Markdown' });
  const m = await ctx.reply('🤖 Berpikir...');
  // Try anabot AI endpoints
  let r = await aiChat('/api/ai/apertusAI', q);
  if (!r) r = await aiChat('/api/ai/auraTalk', q);
  if (!r) r = await aiChat('/api/ai/baoyueai', q);
  if (!r) r = await aiChat('/api/ai/ayesoul', q);
  if (!r) r = '❌ AI sedang sibuk. Coba lagi.';
  await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
  await ctx.reply(`🤖 *AI:* ${r.substring(0, 3000)}`, { parse_mode: 'Markdown' });
});

bot.command('gpt', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!q) return ctx.reply('🧠 `/gpt [pertanyaan]`', { parse_mode: 'Markdown' });
  const m = await ctx.reply('🧠 ChatGPT...');
  let r = await aiChat('/api/ai/apertusAI', q);
  if (!r) r = await aiChat('/api/ai/opera', q);
  if (!r) r = '❌ ChatGPT down.';
  await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
  await ctx.reply(`🧠 *GPT:* ${r.substring(0, 3000)}`, { parse_mode: 'Markdown' });
});

bot.command('opera', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!q) return ctx.reply('🎭 `/opera [pertanyaan]`', { parse_mode: 'Markdown' });
  const m = await ctx.reply('🎭 Opera AI...');
  const r = await aiChat('/api/ai/opera', q);
  await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
  await ctx.reply(`🎭 *Opera:* ${(r || '❌ Down').substring(0, 3000)}`, { parse_mode: 'Markdown' });
});

bot.command('andi', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!q) return ctx.reply('🔍 `/andi [query]`', { parse_mode: 'Markdown' });
  const m = await ctx.reply('🔍 Andi Search...');
  const r = await aiChat('/api/ai/andisearch', q);
  await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
  await ctx.reply(`🔍 *Andi:* ${(r || '❌ Down').substring(0, 3000)}`, { parse_mode: 'Markdown' });
});

bot.command('affirmation', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ') || 'success';
  const r = await aiChat('/api/ai/affirmation', q);
  await ctx.reply(`✨ *Affirmation:* ${(r || 'Kamu hebat! 💪').substring(0, 1000)}`, { parse_mode: 'Markdown' });
});

// ── STICKER & MEDIA ──
bot.command('sticker', async (ctx) => {
  const r = ctx.message?.reply_to_message;
  if (!r?.photo) return ctx.reply('⚠️ Balas foto pake /sticker');
  try {
    await ctx.replyWithSticker(r.photo[r.photo.length - 1].file_id);
  } catch { await ctx.reply('❌ Gagal.'); }
});

bot.command('toimg', async (ctx) => {
  const r = ctx.message?.reply_to_message;
  if (!r?.sticker) return ctx.reply('⚠️ Balas sticker pake /toimg');
  try {
    const f = await ctx.api.getFile(r.sticker.file_id);
    await ctx.replyWithPhoto(`https://api.telegram.org/file/bot${BOT_TOKEN}/${f.file_path}`, { caption: '✅' });
  } catch { await ctx.reply('❌ Gagal.'); }
});

bot.command('attp', async (ctx) => {
  const t = ctx.message?.text?.split(' ').slice(1).join(' ') || 'SILVA';
  const apiUrl = await makeAttp(t);
  if (apiUrl) {
    await ctx.replyWithPhoto(apiUrl, { caption: `✨ ${t}` });
  } else {
    await ctx.reply('```\n╔═══════════════════╗\n║ ✨ ' + t.toUpperCase().substring(0, 15) + '\n╚═══════════════════╝\n```', { parse_mode: 'Markdown' });
  }
});

bot.command('emojimix', async (ctx) => {
  const a = ctx.message?.text?.split(' ').slice(1).join('') || '';
  if (EMOJI_MIX[a]) return ctx.reply(`${a} → ${EMOJI_MIX[a]}`);
  const keys = Object.keys(EMOJI_MIX);
  const [x,y] = keys[Math.floor(Math.random() * keys.length)].split('+');
  await ctx.reply(`🔀 Coba: \`/emojimix ${x}+${y}\``, { parse_mode: 'Markdown' });
});

bot.command('smeme', async (ctx) => {
  const r = ctx.message?.reply_to_message;
  if (!r || (!r.photo && !r.sticker)) return ctx.reply('⚠️ Balas foto/sticker pake /smeme');
  try {
    if (r.photo) await ctx.replyWithSticker(r.photo[r.photo.length - 1].file_id);
    else await ctx.replyWithSticker(r.sticker.file_id);
  } catch { await ctx.reply('❌ Gagal.'); }
});

bot.command('hd', async (ctx) => {
  const r = ctx.message?.reply_to_message;
  if (!r?.photo) return ctx.reply('⚠️ Balas foto pake /hd');
  try {
    await ctx.replyWithPhoto(r.photo[r.photo.length - 1].file_id, { caption: '🖼️ HD' });
  } catch { await ctx.reply('❌ Gagal.'); }
});

// ── SEARCH ──
bot.command('anime', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!q) return ctx.reply('🔍 `/anime [judul]`', { parse_mode: 'Markdown' });
  const m = await ctx.reply('🔍 Cari anime...');
  try {
    const { data } = await axios.get(`${ANABOT}/api/search/anime/animelovers/search?q=${encodeURIComponent(q)}`, { timeout: 20000 });
    if (data?.result) {
      const r = Array.isArray(data.result) ? data.result.slice(0, 5) : [data.result];
      const txt = r.map((x, i) => `${i+1}. *${x.title || x.judul || '??'}*`).join('\n');
      await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
      await ctx.reply(`🎌 *Anime:*\n${txt || 'Ga ketemu.'}`, { parse_mode: 'Markdown' });
    } else {
      await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
      await ctx.reply('🔍 Ga ketemu. Coba: https://myanimelist.net/search?q=' + encodeURIComponent(q));
    }
  } catch {
    await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
    await ctx.reply('🔍 https://myanimelist.net/search?q=' + encodeURIComponent(q));
  }
});

bot.command('pin', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!q) return ctx.reply('📌 `/pin [keyword]`', { parse_mode: 'Markdown' });
  await ctx.reply(`📌 https://id.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`);
});

bot.command('alkitab', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ') || 'Yohanes 3:16';
  const m = await ctx.reply('📖 Mencari...');
  try {
    const { data } = await axios.get(`${ANABOT}/api/search/alkitab?q=${encodeURIComponent(q)}`, { timeout: 15000 });
    await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
    const txt = data?.result || data?.ayat || JSON.stringify(data).substring(0, 1500);
    await ctx.reply(`📖 *Alkitab:*\n${txt}`, { parse_mode: 'Markdown' });
  } catch {
    await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
    await ctx.reply('📖 Cek: https://alkitab.app/search/' + encodeURIComponent(q));
  }
});

bot.command('news', async (ctx) => {
  const m = await ctx.reply('📰 Fetching...');
  try {
    const { data } = await axios.get(`${ANABOT}/api/search/news/beritaKita`, { timeout: 15000 });
    await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
    const r = data?.result || data?.data;
    if (Array.isArray(r)) {
      await ctx.reply(`📰 *Berita:*\n${r.slice(0, 5).map((x,i) => `${i+1}. ${x.title || x.judul || '??'}`).join('\n')}`, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply(`📰 ${JSON.stringify(data).substring(0, 1500)}`);
    }
  } catch {
    await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
    await ctx.reply('📰 https://news.google.com');
  }
});

// ── FUN ──
bot.command('asahotak', async (ctx) => {
  const m = await ctx.reply('🧠 Ambil soal...');
  try {
    const { data } = await axios.get(`${ANABOT}/api/games/fun/asahotak`, { timeout: 15000 });
    await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
    const soal = data?.soal || data?.question || data?.result || 'Coba lagi nanti!';
    await ctx.reply(`🧠 *Asah Otak:*\n${soal}`, { parse_mode: 'Markdown' });
  } catch {
    await ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{});
    await ctx.reply('🧠 Game sedang maintenance.');
  }
});

// /play
bot.command('play', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!q) return ctx.reply('🎵 `/play [judul lagu]`', { parse_mode: 'Markdown' });
  await ctx.reply(`🎵 Cari & putar: https://www.youtube.com/results?search_query=${encodeURIComponent(q)}+audio`);
});

// /tagall
bot.command('tagall', async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Grup only.');
  try {
    const admins = await ctx.getChatAdministrators();
    const sender = ctx.from?.first_name || 'Someone';
    const args = ctx.message?.text?.split(' ').slice(1).join(' ') || '📢 Attention!';
    let t = `📢 *${args}*\nDipanggil: ${sender}\n\n`;
    for (const a of admins) t += `• [${a.user.first_name || 'User'}](tg://user?id=${a.user.id})\n`;
    await ctx.reply(t, { parse_mode: 'Markdown' });
  } catch { await ctx.reply('❌ Bot harus admin!'); }
});

// /donate
bot.command('donate', async (ctx) => {
  await ctx.reply('⭐ https://github.com/tatanghshshe-sys/silva-spark-bot');
});

// ── AUTO REPLIES ──
const AUTO = {
  'p': 'Hadir! 🫡', 'assalamualaikum': 'Waalaikumsalam 🕌',
  'hai': 'Halo! /menu', 'halo': 'Halo! /menu',
  'bot': 'Online! 🟢 /menu', 'test': 'Aktif! /menu',
};

bot.on('message:text', async (ctx) => {
  const t = ctx.message.text.toLowerCase().trim();
  if (t.startsWith('/')) return;
  if (AUTO[t]) await ctx.reply(AUTO[t]);
});

// ── HTTP ──
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: botStatus, name: 'Silva Spark MD', version: '3.0',
      uptime: Math.floor((Date.now() - startTime) / 60),
      platform: 'Telegram', timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><title>Silva Spark MD</title><meta charset="utf-8"><style>body{font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{text-align:center;padding:40px;background:rgba(255,255,255,0.05);border-radius:20px}h1{font-size:2em}.badge{background:#0088cc;color:#fff;padding:6px 16px;border-radius:20px}.ok{background:#10b981;color:#fff;padding:8px 24px;border-radius:20px;display:inline-block;margin:12px 0}p{color:#94a3b8}</style></head><body><div class="card"><h1>🤖 Silva Spark MD</h1><span class="badge">v3.0</span><br><div class="ok">🟢 ONLINE</div><p>komiktap + AnaBot | LUPI CEBOL</p></div></body></html>`);
  }
}).listen(PORT, () => console.log(`🌐 HTTP:${PORT}`));

console.log('\n╔══════════════════════════════════╗\n║  🤖 SILVA SPARK MD v3.0         ║\n║  komiktap + AnaBot (371 API)    ║\n║  by LUPI CEBOL                  ║\n╚══════════════════════════════════╝\n');

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
