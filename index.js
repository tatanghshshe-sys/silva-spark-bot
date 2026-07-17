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

// Quiz state: chatId → { correct: 'A'|'B'|'C'|'D', question: string }
const quizState = new Map();

// ═══ HELPERS ═══
async function dl(u, ep) {
  try {
    const { data } = await axios.get(`${KT}${ep}?url=${encodeURIComponent(u)}`, { timeout: 30000 });
    if (data?.download_quality_hd) return `📥 *HD:* ${data.download_quality_hd}\n${data.download_quality_sd ? '📥 *SD:* '+data.download_quality_sd : ''}\n${data.download_audio ? '🎵 *Audio:* '+data.download_audio : ''}`;
    if (data?.url) return data.url;
    if (data?.result?.url) return data.result.url;
    if (data?.download) return data.download;
    if (data?.status === 'error') return `❌ ${data.description || data.error || 'Gagal download.'}\n🔗 ${u}`;
    if (data?.success === false) return `❌ ${data.error || 'Gagal.'}\n🔗 ${u}`;
    if (typeof data === 'string') return data.substring(0, 3800);
    return JSON.stringify(data).substring(0, 3800);
  } catch (e) { return `❌ Gagal. Coba lagi.\n🔗 ${u}`; }
}
async function j(url) { try { return (await axios.get(url, { timeout: 12000 })).data; } catch { return null; } }

const EM = {
  '😀+😁':'😆','😀+😢':'😂','😀+😡':'🤬','😍+😘':'🥰','😎+😇':'😊',
  '🤔+😴':'😪','🐶+🐱':'🦊','🍕+🍔':'🍽️','☀️+🌧️':'🌈','❤️+🔥':'💖',
  '🎵+🎸':'🎶','⚽+🏀':'🏐','🍎+🍊':'🍑','🐼+🐨':'🐻','🌙+⭐':'🌟',
};

const MENU = `🤖 *SILVA SPARK MD v4.1*
🟢 Online | No Prefix!

📥 *DOWNLOADER*
  fb [url] | ig [url] | tt [url]
  ytmp3 [url] | tb [url] | song [judul]

🤖 *AI & SEARCH*
  ai [tanya] | wiki [keyword] | anime [judul]

🎨 *STICKER & MEDIA*
  sticker | toimg | attp [teks]
  emojimix 😀+😁 | smeme | hd

🎮 *FUN*
  joke | quote | fact | asahotak | tebak

📖 *LAINNYA*
  alkitab [ayat] | play [lagu] | pin [keyword]
  cuaca [kota] | gh [user] | tagall

📋 menu | ping | owner | info | donate`;

// ═══ MAIN HANDLER — No Prefix ═══
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();
  const parts = text.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  // ── DOWNLOADER ──
  if (['fb','ig','tt','ytmp3','tb'].includes(cmd)) {
    if (!args) return ctx.reply(`📥 *${cmd} [url]*`, { parse_mode: 'Markdown' });
    if (!args.startsWith('http')) return ctx.reply('📥 Masukkan URL yang valid!\nContoh: `' + cmd + ' https://...`', { parse_mode: 'Markdown' });
    const msg = await ctx.reply('⏳ Downloading...');
    const eps = { fb:'/api/facebook', ig:'/api/instagram', tt:'/api/tiktok', ytmp3:'/api/download', tb:'/terabox' };
    const r = await dl(args, eps[cmd]);
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
    return ctx.reply(r.substring(0, 3900));
  }
  if (cmd === 'song') {
    if (!args) return ctx.reply('🎵 *song [judul lagu]*\nContoh: `song hello adele`', { parse_mode: 'Markdown' });
    const msg = await ctx.reply('🎵 Mencari...');
    // Try komiktap first (needs YT URL)
    if (args.startsWith('http')) {
      const r = await dl(args, '/api/download');
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      if (!r.startsWith('❌')) return ctx.reply(r.substring(0, 3900));
    }
    // Fallback: YouTube search
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
    return ctx.reply(`🎵 *${args}*\n\n🔊 Cari & putar:\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(args)}\n\n📥 Download MP3:\nhttps://ytmp3.cc/search?q=${encodeURIComponent(args)}`, { parse_mode: 'Markdown' });
  }

  // ── AI / SEARCH ──
  if (cmd === 'ai') {
    if (!args) return ctx.reply('🤖 *ai [pertanyaan]*', { parse_mode: 'Markdown' });
    const msg = await ctx.reply('🤖 Berpikir...');
    try {
      const w = await j(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args.replace(/ /g,'_'))}?redirect=true`);
      if (w?.extract && w.type !== 'disambiguation') {
        await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
        return ctx.reply(`🤖 *${w.title}*\n\n${w.extract.substring(0, 2500)}...\n\n📚 Wikipedia`, { parse_mode: 'Markdown' });
      }
    } catch {}
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
    return ctx.reply(`🤖 Cari: https://google.com/search?q=${encodeURIComponent(args)}`);
  }
  if (cmd === 'wiki') {
    if (!args) return ctx.reply('📚 *wiki [keyword]*', { parse_mode: 'Markdown' });
    const w = await j(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args.replace(/ /g,'_'))}?redirect=true`);
    if (w?.extract) return ctx.reply(`📚 *${w.title}*\n\n${w.extract.substring(0, 2500)}...\n\n🔗 ${w.content_urls?.desktop?.page || ''}`, { parse_mode: 'Markdown' });
    return ctx.reply(`📚 https://id.wikipedia.org/wiki/${encodeURIComponent(args.replace(/ /g,'_'))}`);
  }
  if (cmd === 'anime') {
    if (!args) return ctx.reply('🎌 *anime [judul]*', { parse_mode: 'Markdown' });
    const msg = await ctx.reply('🎌 Mencari...');
    try {
      const d = await j(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(args)}&limit=5`);
      const items = d?.data || [];
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      if (!items.length) return ctx.reply(`🎌 https://myanimelist.net/search?q=${encodeURIComponent(args)}`);
      let t = '🎌 *Hasil:*\n\n';
      items.slice(0,5).forEach((a,i) => {
        t += `*${i+1}. ${a.title}*\n⭐ ${a.score||'?'} | 📺 ${a.episodes||'?'}eps | ${a.type||'?'}\n🔗 ${a.url}\n\n`;
      });
      return ctx.reply(t.substring(0, 3900), { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } });
    } catch {
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      return ctx.reply(`🎌 https://myanimelist.net/search?q=${encodeURIComponent(args)}`);
    }
  }

  // ── STICKER & MEDIA ──
  if (cmd === 'sticker') {
    const r = ctx.message?.reply_to_message;
    if (!r?.photo) return ctx.reply('⚠️ Balas foto dulu, baru ketik *sticker*', { parse_mode: 'Markdown' });
    try { return ctx.replyWithSticker(r.photo[r.photo.length-1].file_id); } catch { return ctx.reply('❌ Gagal.'); }
  }
  if (cmd === 'toimg') {
    const r = ctx.message?.reply_to_message;
    if (!r?.sticker) return ctx.reply('⚠️ Balas sticker dulu, baru ketik *toimg*', { parse_mode: 'Markdown' });
    try {
      const f = await ctx.api.getFile(r.sticker.file_id);
      return ctx.replyWithPhoto(`https://api.telegram.org/file/bot${BOT_TOKEN}/${f.file_path}`, { caption: '✅' });
    } catch { return ctx.reply('❌ Gagal.'); }
  }
  if (cmd === 'attp') {
    const t = args ? args.toUpperCase().substring(0,15) : 'SILVA';
    return ctx.reply('```\n╔═══════════════════╗\n║ ✨ ' + t + '\n╚═══════════════════╝\n```', { parse_mode: 'Markdown' });
  }
  if (cmd === 'emojimix') {
    if (EM[args]) return ctx.reply(`${args} → ${EM[args]}`);
    const keys = Object.keys(EM);
    const [x,y] = keys[Math.floor(Math.random()*keys.length)].split('+');
    return ctx.reply(`🔀 Contoh: \`emojimix ${x}+${y}\``, { parse_mode: 'Markdown' });
  }
  if (cmd === 'smeme') {
    const r = ctx.message?.reply_to_message;
    if (!r || (!r.photo && !r.sticker)) return ctx.reply('⚠️ Balas foto/sticker dulu, baru ketik *smeme*', { parse_mode: 'Markdown' });
    try {
      if (r.photo) return ctx.replyWithSticker(r.photo[r.photo.length-1].file_id);
      return ctx.replyWithSticker(r.sticker.file_id);
    } catch { return ctx.reply('❌ Gagal.'); }
  }
  if (cmd === 'hd') {
    const r = ctx.message?.reply_to_message;
    if (!r?.photo) return ctx.reply('⚠️ Balas foto dulu, baru ketik *hd*', { parse_mode: 'Markdown' });
    try { return ctx.replyWithPhoto(r.photo[r.photo.length-1].file_id, { caption: '🖼️ HD ✅' }); }
    catch { return ctx.reply('❌ Gagal.'); }
  }

  // ── FUN ──
  if (cmd === 'joke') {
    const d = await j('https://v2.jokeapi.dev/joke/Any?type=single&safe-mode&amount=1');
    if (d?.joke) return ctx.reply(`😂 ${d.joke}`);
    return ctx.reply('😂 Kenapa ayam nyebrang? Karena di seberang ada KFC.');
  }
  if (cmd === 'quote') {
    try {
      const d = await j('https://zenquotes.io/api/random');
      if (d?.[0]?.q) return ctx.reply(`💬 *"${d[0].q}"*\n— _${d[0].a}_`, { parse_mode: 'Markdown' });
    } catch {}
    return ctx.reply('💬 *"Hidup cuma sekali. Jangan banyak drama."*\n— Anonymous');
  }
  if (cmd === 'fact') {
    try {
      const d = await j('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
      if (d?.text) return ctx.reply(`💡 ${d.text}`);
    } catch {}
    return ctx.reply('💡 Ketik *menu* buat liat semua command!');
  }
  if (cmd === 'asahotak') {
    try {
      const d = await j('https://opentdb.com/api.php?amount=1&type=multiple');
      if (d?.results?.[0]) {
        const q = d.results[0];
        const ans = [...q.incorrect_answers, q.correct_answer].sort(()=>Math.random()-.5);
        const lbl = ['A','B','C','D'];
        const correctIdx = ans.findIndex(a => a === q.correct_answer);
        const correctLetter = lbl[correctIdx];
        // Store quiz state
        quizState.set(ctx.chat.id, { correct: correctLetter, question: q.question });
        let t = `🧠 *Asah Otak!*\n\n📝 ${q.question.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&')}\n\n`;
        ans.forEach((a,i)=> t += `${lbl[i]}. ${a}\n`);
        t += `\n_Jawab: A / B / C / D_`;
        return ctx.reply(t, { parse_mode: 'Markdown' });
      }
    } catch {}
    quizState.set(ctx.chat.id, { correct: 'A', question: 'Apa yang naik tapi ga bisa turun?' });
    return ctx.reply('🧠 *Asah Otak:*\nApa yang naik tapi ga bisa turun?\nA. Umur  B. Tangga  C. Lift  D. Balon\n\n_Jawab: A / B / C / D_', { parse_mode: 'Markdown' });
  }
  if (cmd === 'tebak' || (['a','b','c','d'].includes(cmd) && !args)) {
    const a = cmd === 'tebak' ? args.toLowerCase() : cmd;
    if (!['a','b','c','d'].includes(a)) return ctx.reply('🎮 Jawab: *A / B / C / D*', { parse_mode: 'Markdown' });
    const state = quizState.get(ctx.chat.id);
    if (state && a === state.correct.toLowerCase()) {
      quizState.delete(ctx.chat.id);
      return ctx.reply(`✅ *Bener!* 🎉\nJawaban: *${state.correct}*`, { parse_mode: 'Markdown' });
    }
    if (state) {
      quizState.delete(ctx.chat.id);
      return ctx.reply(`❌ Salah! Jawabannya *${state.correct}* 😅`, { parse_mode: 'Markdown' });
    }
    // No active quiz
    return ctx.reply('🎮 Ga ada quiz aktif. Ketik *asahotak* dulu!', { parse_mode: 'Markdown' });
  }

  // ── LAINNYA ──
  if (cmd === 'alkitab') {
    const q = args || 'Yohanes 3:16';
    return ctx.reply(`📖 https://alkitab.app/search/${encodeURIComponent(q)}`, { parse_mode: 'Markdown' });
  }
  if (cmd === 'play') {
    if (!args) return ctx.reply('🎵 *play [judul]*', { parse_mode: 'Markdown' });
    return ctx.reply(`🎵 https://www.youtube.com/results?search_query=${encodeURIComponent(args)}+audio`);
  }
  if (cmd === 'pin') {
    if (!args) return ctx.reply('📌 *pin [keyword]*', { parse_mode: 'Markdown' });
    return ctx.reply(`📌 https://id.pinterest.com/search/pins/?q=${encodeURIComponent(args)}`);
  }
  if (cmd === 'cuaca') {
    const q = args || 'Jakarta';
    return ctx.reply(`🌤️ https://wttr.in/${encodeURIComponent(q)}?format=3`, { parse_mode: 'Markdown' });
  }
  if (cmd === 'gh') {
    const user = args || 'tatanghshshe-sys';
    try {
      const d = await j(`https://api.github.com/users/${encodeURIComponent(user)}`);
      if (d?.login) return ctx.reply(
        `🐙 *${d.login}*\n👤 ${d.name||'-'} | 📍 ${d.location||'-'}\n👥 ${d.followers} followers | 📦 ${d.public_repos} repos\n🔗 ${d.html_url}\n📝 ${(d.bio||'-').substring(0,200)}`,
        { parse_mode: 'Markdown' }
      );
    } catch {}
    return ctx.reply(`🔍 https://github.com/${user}`);
  }
  if (cmd === 'tagall') {
    if (ctx.chat.type === 'private') return ctx.reply('⚠️ Grup only.');
    try {
      const admins = await ctx.getChatAdministrators();
      const sn = ctx.from?.first_name || 'Someone';
      const a = args || '📢 ATTENTION!';
      let t = `📢 *${a}*\nDipanggil: ${sn}\n\n`;
      for (const ad of admins) t += `• [${ad.user.first_name||'User'}](tg://user?id=${ad.user.id})\n`;
      return ctx.reply(t, { parse_mode: 'Markdown' });
    } catch { return ctx.reply('❌ Bot harus admin!'); }
  }

  // ── BASIC ──
  if (cmd === 'menu' || cmd === 'help') return ctx.reply(MENU, { parse_mode: 'Markdown' });
  if (cmd === 'ping') {
    const m = Math.floor((Date.now()-t0)/60);
    return ctx.reply(`🏓 Pong! v4.1 | ${m}m 🟢`);
  }
  if (cmd === 'owner') {
    return ctx.reply('👑 *LUPI CEBOL*\n📱 6287815993644\n🤖 Silva Spark MD v4.1\n📦 [GitHub](https://github.com/tatanghshshe-sys/silva-spark-bot)', { parse_mode: 'Markdown' });
  }
  if (cmd === 'info') {
    const m = Math.floor((Date.now()-t0)/60);
    return ctx.reply(`📊 v4.1 | ${m}m | ${ctx.chat.type}\nAPIs: komiktap+Jikan+Wiki+JokeAPI\n🟢 Online`);
  }
  if (cmd === 'donate') return ctx.reply('⭐ https://github.com/tatanghshshe-sys/silva-spark-bot');

  // ── START ──
  if (cmd === 'start' || cmd === '/start') {
    return ctx.reply(`Halo *${ctx.from?.first_name||'User'}*! 👋\n\n${MENU}`, { parse_mode: 'Markdown' });
  }

  // ── AUTO REPLIES (exact match) ──
  const AUTO = {
    'p':'Hadir bos! 🫡',
    'assalamualaikum':'Waalaikumsalam warahmatullah 🕌',
    'hai':'Halo! Ketik *menu*', 'halo':'Halo! Ketik *menu*',
    'bot':'Online bos! 🟢 Ketik *menu*', 'test':'Aktif! 🟢',
    'malam':'Malam! 🌙', 'pagi':'Pagi! ☀️',
  };
  if (AUTO[cmd]) return ctx.reply(AUTO[cmd], { parse_mode: 'Markdown' });
});

// ═══ HTTP ═══
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status, name:'Silva Spark MD', version:'4.1', uptime:Math.floor((Date.now()-t0)/60), platform:'Telegram', timestamp:new Date().toISOString() }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><title>Silva Spark MD</title><meta charset="utf-8"><style>body{font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{text-align:center;padding:40px;background:rgba(255,255,255,0.05);border-radius:20px}h1{font-size:2em}.badge{background:#0088cc;color:#fff;padding:6px 16px;border-radius:20px}.ok{background:#10b981;color:#fff;padding:8px 24px;border-radius:20px;display:inline-block;margin:12px 0}p{color:#94a3b8}</style></head><body><div class="card"><h1>🤖 Silva Spark MD</h1><span class="badge">v4.1</span><br><div class="ok">🟢 ONLINE</div><p>No Prefix | LUPI CEBOL</p></div></body></html>`);
  }
}).listen(PORT, ()=>console.log(`🌐 :${PORT}`));

console.log('\n╔══════════════════════════════════╗\n║  🤖 SILVA SPARK MD v4.1         ║\n║  No Prefix • Multi API          ║\n║  by LUPI CEBOL                  ║\n╚══════════════════════════════════╝\n');

try {
  await bot.start({ onStart:(i)=>{ status='connected'; console.log(`✅ @${i.username}`); } });
} catch(e) { console.error('❌',e.message); status='error'; }
