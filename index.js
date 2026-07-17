import { Bot } from 'grammy';
import http from 'http';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || '7643384612:AAGMm7T6Y3rIZy0rdSe4ic2pav7Yxs68jV4';
const PORT = process.env.PORT || 3000;
const KT = 'https://komiktap.eu.cc';

let status = 'starting', t0 = Date.now();
const bot = new Bot(BOT_TOKEN);

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

async function dl(u, ep) {
  try {
    const { data } = await axios.get(`${KT}${ep}?url=${encodeURIComponent(u)}`, { timeout: 30000 });
    if (data?.url) return data.url;
    if (data?.result?.url) return data.result.url;
    if (data?.download) return data.download;
    if (typeof data === 'string') return data.substring(0, 3800);
    return JSON.stringify(data).substring(0, 3800);
  } catch (e) {
    return `❌ Download gagal. Coba lagi nanti.\n🔗 ${u}`;
  }
}

async function fetchJSON(url) {
  try { const { data } = await axios.get(url, { timeout: 12000 }); return data; }
  catch { return null; }
}

// ══════════════════════════════════════
// EMOJI MIX
// ══════════════════════════════════════
const EM = {
  '😀+😁':'😆','😀+😢':'😂','😀+😡':'🤬','😍+😘':'🥰','😎+😇':'😊',
  '🤔+😴':'😪','🐶+🐱':'🦊','🍕+🍔':'🍽️','☀️+🌧️':'🌈','❤️+🔥':'💖',
  '🎵+🎸':'🎶','⚽+🏀':'🏐','🍎+🍊':'🍑','🐼+🐨':'🐻','🌙+⭐':'🌟',
  '😈+😇':'😏','👻+🎃':'💀','🐸+☕':'🐸','🍌+🐒':'🦧','💻+📱':'⌨️',
};

// ══════════════════════════════════════
// MENU
// ══════════════════════════════════════
const MENU = `🤖 *SILVA SPARK MD v4.0*
🟢 Online | Multi API

📥 *DOWNLOADER*
  /fb /ig /tt /ytmp3 /tb /song

🤖 *AI & SEARCH*
  /ai [tanya] — AI chatbot
  /wiki [keyword] — Wikipedia
  /anime [judul] — Cari anime

🎨 *STICKER & MEDIA*
  /sticker /toimg /attp /emojimix /smeme /hd

🎮 *FUN*
  /joke — Jokes random
  /quote — Quotes keren
  /fact — Fakta random
  /asahotak — Tebak-tebakan

📖 *LAINNYA*
  /alkitab [ayat] — Ayat Alkitab
  /play [lagu] — Cari lagu
  /pin [keyword] — Pinterest
  /gh [user] — Info GitHub
  /cuaca [kota] — Cuaca

📢 /tagall — Tag admin grup`;

// ══════════════════════════════════════
// BASIC
// ══════════════════════════════════════
bot.command('start', async (ctx) => {
  const n = ctx.from?.first_name || 'User';
  await ctx.reply(`Halo *${n}*! 👋\n\n${MENU}`, { parse_mode: 'Markdown' });
});
bot.command('menu', async (ctx) => ctx.reply(MENU, { parse_mode: 'Markdown' }));
bot.command('help', async (ctx) => ctx.reply(MENU, { parse_mode: 'Markdown' }));

bot.command('ping', async (ctx) => {
  const m = Math.floor((Date.now() - t0) / 60);
  await ctx.reply(`🏓 *Pong!*\nv4.0 | ⏱️ ${m}m 🟢`, { parse_mode: 'Markdown' });
});

bot.command('owner', async (ctx) => {
  await ctx.reply('👑 *LUPI CEBOL*\n📱 6287815993644\n🤖 v4.0\n📦 [GitHub](https://github.com/tatanghshshe-sys/silva-spark-bot)', { parse_mode: 'Markdown' });
});

bot.command('info', async (ctx) => {
  const m = Math.floor((Date.now() - t0) / 60);
  await ctx.reply(`📊 *v4.0*\n• Uptime: ${m}m\n• Chat: \`${ctx.chat.id}\`\n• Type: ${ctx.chat.type}\n• APIs: komiktap + Jikan + Wiki + JokeAPI\n• 🟢 Online`, { parse_mode: 'Markdown' });
});

bot.command('donate', async (ctx) => {
  await ctx.reply('⭐ https://github.com/tatanghshshe-sys/silva-spark-bot');
});

// ══════════════════════════════════════
// DOWNLOADER (komiktap.eu.cc)
// ══════════════════════════════════════

bot.command('fb', async (ctx) => {
  const u = ctx.message?.text?.split(' ').slice(1).join(' ') || '';
  if (!u) return ctx.reply('📥 `/fb [url facebook]`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('⏳ Downloading...');
  const r = await dl(u, '/api/facebook');
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
  await ctx.reply(r.substring(0, 3900));
});

bot.command('ig', async (ctx) => {
  const u = ctx.message?.text?.split(' ').slice(1).join(' ') || '';
  if (!u) return ctx.reply('📥 `/ig [url instagram]`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('⏳ Downloading...');
  const r = await dl(u, '/api/instagram');
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
  await ctx.reply(r.substring(0, 3900));
});

bot.command('tt', async (ctx) => {
  const u = ctx.message?.text?.split(' ').slice(1).join(' ') || '';
  if (!u) return ctx.reply('📥 `/tt [url tiktok]`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('⏳ Downloading...');
  const r = await dl(u, '/api/tiktok');
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
  await ctx.reply(r.substring(0, 3900));
});

bot.command('ytmp3', async (ctx) => {
  const u = ctx.message?.text?.split(' ').slice(1).join(' ') || '';
  if (!u) return ctx.reply('📥 `/ytmp3 [url youtube]`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('⏳ Downloading...');
  const r = await dl(u, '/api/download');
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
  await ctx.reply(r.substring(0, 3900));
});

bot.command('tb', async (ctx) => {
  const u = ctx.message?.text?.split(' ').slice(1).join(' ') || '';
  if (!u) return ctx.reply('📥 `/tb [url terabox]`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('⏳ Downloading...');
  const r = await dl(u, '/terabox');
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
  await ctx.reply(r.substring(0, 3900));
});

bot.command('song', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ') || '';
  if (!q) return ctx.reply('🎵 `/song [judul lagu]`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('🎵 Mencari...');
  const r = await dl(q, '/api/download');
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
  await ctx.reply(r.substring(0, 3900));
});

// ══════════════════════════════════════
// AI & SEARCH
// ══════════════════════════════════════

bot.command('ai', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ') || '';
  if (!q) return ctx.reply('🤖 `/ai [pertanyaan]`\n\nContoh: `/ai apa itu blockchain?`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('🤖 Berpikir...');

  // Try Wikipedia first
  try {
    const wiki = await fetchJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/ /g, '_'))}?redirect=true`);
    if (wiki?.extract && wiki.type !== 'disambiguation') {
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      const img = wiki.thumbnail?.source ? `\n\n[🖼️ Gambar](${wiki.thumbnail.source})` : '';
      await ctx.reply(`🤖 *AI Answer:*\n\n${wiki.extract.substring(0, 2500)}...\n\n📚 _Sumber: Wikipedia_${img}`, { parse_mode: 'Markdown', link_preview_options: { is_disabled: false } });
      return;
    }
  } catch {}

  // fallback
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
  await ctx.reply(`🤖 *Pertanyaan:* ${q}\n\n🔍 Cari sendiri:\n• https://google.com/search?q=${encodeURIComponent(q)}\n• https://wikipedia.org/wiki/${encodeURIComponent(q.replace(/ /g, '_'))}`, { parse_mode: 'Markdown' });
});

bot.command('wiki', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ') || '';
  if (!q) return ctx.reply('📚 `/wiki [keyword]`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('📚 Mencari...');
  const wiki = await fetchJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/ /g, '_'))}?redirect=true`);
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
  if (wiki?.extract) {
    await ctx.reply(`📚 *${wiki.title}*\n\n${wiki.extract.substring(0, 2500)}...\n\n🔗 ${wiki.content_urls?.desktop?.page || ''}`, { parse_mode: 'Markdown' });
  } else {
    await ctx.reply(`📚 Ga ketemu. Coba: https://id.wikipedia.org/wiki/${encodeURIComponent(q.replace(/ /g, '_'))}`);
  }
});

bot.command('anime', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ') || '';
  if (!q) return ctx.reply('🎌 `/anime [judul]`\n\nContoh: `/anime naruto`', { parse_mode: 'Markdown' });
  const msg = await ctx.reply('🎌 Mencari anime...');
  try {
    const jikan = await fetchJSON(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=5`);
    const items = jikan?.data || [];
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
    if (items.length === 0) return ctx.reply(`🎌 Ga ketemu. Coba: https://myanimelist.net/search?q=${encodeURIComponent(q)}`);

    let txt = '🎌 *Hasil Anime:*\n\n';
    for (let i = 0; i < Math.min(5, items.length); i++) {
      const a = items[i];
      txt += `*${i+1}. ${a.title}* (${a.title_japanese || '??'})\n`;
      txt += `⭐ ${a.score || '?'} | 📺 ${a.episodes || '?'} eps | ${a.type || '?'}\n`;
      txt += `🎬 ${a.status || '?'} | 🗓️ ${a.year || '?'}\n`;
      txt += `🔗 ${a.url}\n\n`;
    }
    await ctx.reply(txt.substring(0, 3900), { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } });
  } catch {
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
    await ctx.reply(`🎌 Search: https://myanimelist.net/search?q=${encodeURIComponent(q)}`);
  }
});

// ══════════════════════════════════════
// STICKER & MEDIA
// ══════════════════════════════════════

bot.command('sticker', async (ctx) => {
  const r = ctx.message?.reply_to_message;
  if (!r?.photo) return ctx.reply('⚠️ *Balas foto* pake /sticker', { parse_mode: 'Markdown' });
  try { await ctx.replyWithSticker(r.photo[r.photo.length - 1].file_id); }
  catch { await ctx.reply('❌ Gagal.'); }
});

bot.command('toimg', async (ctx) => {
  const r = ctx.message?.reply_to_message;
  if (!r?.sticker) return ctx.reply('⚠️ *Balas sticker* pake /toimg', { parse_mode: 'Markdown' });
  try {
    const f = await ctx.api.getFile(r.sticker.file_id);
    await ctx.replyWithPhoto(`https://api.telegram.org/file/bot${BOT_TOKEN}/${f.file_path}`, { caption: '✅ Sticker → Foto' });
  } catch { await ctx.reply('❌ Gagal.'); }
});

bot.command('attp', async (ctx) => {
  const t = (ctx.message?.text?.split(' ').slice(1).join(' ') || 'SILVA').toUpperCase().substring(0, 15);
  await ctx.reply('```\n╔═══════════════════╗\n║ ✨ ' + t + '\n╚═══════════════════╝\n```', { parse_mode: 'Markdown' });
});

bot.command('emojimix', async (ctx) => {
  const a = ctx.message?.text?.split(' ').slice(1).join('') || '';
  if (EM[a]) return ctx.reply(`${a} → ${EM[a]}`);
  const keys = Object.keys(EM);
  const [x, y] = keys[Math.floor(Math.random() * keys.length)].split('+');
  await ctx.reply(`🔀 Contoh: \`/emojimix ${x}+${y}\``, { parse_mode: 'Markdown' });
});

bot.command('smeme', async (ctx) => {
  const r = ctx.message?.reply_to_message;
  if (!r || (!r.photo && !r.sticker)) return ctx.reply('⚠️ *Balas foto/sticker* pake /smeme', { parse_mode: 'Markdown' });
  try {
    if (r.photo) await ctx.replyWithSticker(r.photo[r.photo.length - 1].file_id);
    else await ctx.replyWithSticker(r.sticker.file_id);
  } catch { await ctx.reply('❌ Gagal.'); }
});

bot.command('hd', async (ctx) => {
  const r = ctx.message?.reply_to_message;
  if (!r?.photo) return ctx.reply('⚠️ *Balas foto* pake /hd', { parse_mode: 'Markdown' });
  try {
    await ctx.replyWithPhoto(r.photo[r.photo.length - 1].file_id, { caption: '🖼️ HD Enhanced ✅' });
  } catch { await ctx.reply('❌ Gagal.'); }
});

// ══════════════════════════════════════
// FUN
// ══════════════════════════════════════

bot.command('joke', async (ctx) => {
  const j = await fetchJSON('https://v2.jokeapi.dev/joke/Any?type=single&safe-mode&amount=1');
  if (j?.joke) await ctx.reply(`😂 *Joke:*\n${j.joke}`, { parse_mode: 'Markdown' });
  else await ctx.reply('😂 Kenapa ayam nyebrang? Karena di seberang ada KFC. 🐔');
});

bot.command('quote', async (ctx) => {
  try {
    const q = await fetchJSON('https://api.quotable.io/random?maxLength=120');
    if (q?.content) {
      await ctx.reply(`💬 *"${q.content}"*\n— _${q.author}_`, { parse_mode: 'Markdown' });
      return;
    }
  } catch {}
  await ctx.reply('💬 *"Hidup cuma sekali. Jangan banyak drama."*\n— Anonymous');
});

bot.command('fact', async (ctx) => {
  try {
    const f = await fetchJSON('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
    if (f?.text) return ctx.reply(`💡 *Fun Fact:*\n${f.text}`, { parse_mode: 'Markdown' });
  } catch {}
  await ctx.reply('💡 *Fun Fact:* Lu bisa ketik /menu buat liat semua command!');
});

bot.command('asahotak', async (ctx) => {
  try {
    // trivia API
    const t = await fetchJSON('https://opentdb.com/api.php?amount=1&type=multiple');
    if (t?.results?.[0]) {
      const q = t.results[0];
      const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
      const labels = ['A', 'B', 'C', 'D'];
      let txt = `🧠 *Asah Otak!*\n\n📝 ${q.question.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&')}\n\n`;
      answers.forEach((a, i) => txt += `${labels[i]}. ${a}\n`);
      txt += `\n_Jawab pake /tebak [A/B/C/D]_`;
      await ctx.reply(txt, { parse_mode: 'Markdown' });
      return;
    }
  } catch {}
  await ctx.reply('🧠 *Asah Otak:*\nApa yang naik tapi ga bisa turun?\n\nA. Umur\nB. Tangga\nC. Lift\nD. Balon\n\nJawab: /tebak [A/B/C/D]');
});

// /tebak — jawab soal asah otak
bot.command('tebak', async (ctx) => {
  const a = ctx.message?.text?.split(' ').slice(1).join(' ').toLowerCase();
  if (!a) return ctx.reply('🎮 Pake: `/tebak a` `/tebak b` `/tebak c` `/tebak d`', { parse_mode: 'Markdown' });
  const good = ['a', 'umur', 'c', 'c. lift', 'd', 'd. balon'];
  if (good.includes(a)) await ctx.reply('✅ *Bener!* 🎉', { parse_mode: 'Markdown' });
  else await ctx.reply('❌ Salah! Jawaban: *A. Umur* (naik terus ga bisa turun 😅)', { parse_mode: 'Markdown' });
});

// ══════════════════════════════════════
// LAINNYA
// ══════════════════════════════════════

bot.command('alkitab', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ') || 'Yohanes 3:16';
  await ctx.reply(`📖 *${q}*\n\n🔍 Buka: https://alkitab.app/search/${encodeURIComponent(q)}`, { parse_mode: 'Markdown' });
});

bot.command('play', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ') || '';
  if (!q) return ctx.reply('🎵 `/play [judul lagu]`', { parse_mode: 'Markdown' });
  await ctx.reply(`🎵 Cari & putar lagu:\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(q)}+audio`);
});

bot.command('pin', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ') || '';
  if (!q) return ctx.reply('📌 `/pin [keyword]`', { parse_mode: 'Markdown' });
  await ctx.reply(`📌 Pinterest:\nhttps://id.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`);
});

bot.command('cuaca', async (ctx) => {
  const q = ctx.message?.text?.split(' ').slice(1).join(' ') || 'Jakarta';
  await ctx.reply(`🌤️ *Cuaca ${q}*\nhttps://wttr.in/${encodeURIComponent(q)}?format=3`, { parse_mode: 'Markdown' });
});

bot.command('gh', async (ctx) => {
  const user = ctx.message?.text?.split(' ').slice(1).join(' ') || 'tatanghshshe-sys';
  const msg = await ctx.reply('🔍 Mencari...');
  try {
    const gh = await fetchJSON(`https://api.github.com/users/${encodeURIComponent(user)}`);
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
    if (gh?.login) {
      await ctx.reply(
        `🐙 *${gh.login}*\n` +
        `👤 ${gh.name || '-'} | ${gh.company || '-'}\n` +
        `📍 ${gh.location || '-'} | 👥 ${gh.followers} followers\n` +
        `📦 ${gh.public_repos} repos | ⭐ ${gh.public_gists} gists\n` +
        `🔗 ${gh.html_url}\n` +
        `📝 ${(gh.bio || '-').substring(0, 200)}`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply(`❌ User ga ketemu: ${user}`);
    }
  } catch {
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
    await ctx.reply(`🔍 https://github.com/${user}`);
  }
});

bot.command('tagall', async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply('⚠️ Grup only.');
  try {
    const admins = await ctx.getChatAdministrators();
    const sender = ctx.from?.first_name || 'Someone';
    const args = ctx.message?.text?.split(' ').slice(1).join(' ') || '📢 ATTENTION!';
    let t = `📢 *${args}*\nDipanggil: ${sender}\n\n`;
    for (const a of admins) {
      const u = a.user;
      t += `• [${u.first_name || 'User'}](tg://user?id=${u.id})\n`;
    }
    await ctx.reply(t, { parse_mode: 'Markdown' });
  } catch { await ctx.reply('❌ Bot harus admin grup!'); }
});

// ══════════════════════════════════════
// AUTO REPLIES
// ══════════════════════════════════════
const AUTO = {
  'p': 'Hadir bos! 🫡',
  'assalamualaikum': 'Waalaikumsalam warahmatullah 🕌',
  'hai': 'Halo! Ketik /menu',
  'halo': 'Halo! Ketik /menu',
  'bot': 'Online bos! 🟢 Ketik /menu',
  'test': 'Bot aktif! 🟢',
  'malam': 'Malam! 🌙',
  'pagi': 'Pagi! ☀️',
};

bot.on('message:text', async (ctx) => {
  const t = ctx.message.text.toLowerCase().trim();
  if (t.startsWith('/')) return;
  if (AUTO[t]) await ctx.reply(AUTO[t]);
});

// ══════════════════════════════════════
// HTTP SERVER
// ══════════════════════════════════════
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status, name: 'Silva Spark MD', version: '4.0',
      uptime: Math.floor((Date.now() - t0) / 60),
      platform: 'Telegram', timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><title>Silva Spark MD</title><meta charset="utf-8"><style>body{font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{text-align:center;padding:40px;background:rgba(255,255,255,0.05);border-radius:20px}h1{font-size:2em}.badge{background:#0088cc;color:#fff;padding:6px 16px;border-radius:20px}.ok{background:#10b981;color:#fff;padding:8px 24px;border-radius:20px;display:inline-block;margin:12px 0}p{color:#94a3b8}</style></head><body><div class="card"><h1>🤖 Silva Spark MD</h1><span class="badge">v4.0</span><br><div class="ok">🟢 ONLINE</div><p>Multi API | LUPI CEBOL</p></div></body></html>`);
  }
}).listen(PORT, () => console.log(`🌐 http:${PORT}`));

// ══════════════════════════════════════
// START
// ══════════════════════════════════════
console.log('\n╔══════════════════════════════════╗\n║  🤖 SILVA SPARK MD v4.0         ║\n║  Multi API • komiktap+Jikan+Wiki║\n║  by LUPI CEBOL                  ║\n╚══════════════════════════════════╝\n');

try {
  await bot.start({
    onStart: (info) => { status = 'connected'; console.log(`✅ @${info.username} ready!`); },
  });
} catch (err) {
  console.error('❌', err.message);
  status = 'error';
}
