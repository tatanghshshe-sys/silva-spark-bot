import { Bot, InlineKeyboard } from 'grammy';
import http from 'http';
import axios from 'axios';
import { Buffer } from 'buffer';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || '7643384612:AAGMm7T6Y3rIZy0rdSe4ic2pav7Yxs68jV4';
const PORT = process.env.PORT || 3000;
const KT = 'https://komiktap.eu.cc';

let status = 'starting', t0 = Date.now();
const bot = new Bot(BOT_TOKEN);

// Quiz state: chatId → { correct: 'A'|'B'|'C'|'D', question: string }
const quizState = new Map();

// Terabox cache: msgId → { files: [{filename, size, dlink}], expires: timestamp }
const tbCache = new Map();

// ═══ HELPERS ═══
async function dl(u, ep) {
  try {
    const { data } = await axios.get(`${KT}${ep}?url=${encodeURIComponent(u)}`, { timeout: 30000 });

    // ── Facebook / Instagram ──
    if (data?.download_quality_hd || data?.download_quality_sd) {
      let r = '';
      if (data.download_quality_hd) r += `📥 *HD:* [Klik Download](${data.download_quality_hd})\n`;
      if (data.download_quality_sd) r += `📥 *SD:* [Klik Download](${data.download_quality_sd})\n`;
      if (data.download_audio) r += `🎵 *Audio:* [Klik Download](${data.download_audio})\n`;
      if (data.thumbnail) r += `🖼️ [Thumbnail](${data.thumbnail})`;
      return r || '✅ Download siap!';
    }

    // ── TeraBox ──
    if ((data?.source === 'TeraCroot' || data?.status === 'success') && data?.files) {
      const count = data.total_files || data.files.length;
      let r = `📦 *TeraBox: ${count} file(s)*\n\n`;
      data.files.slice(0, 8).forEach((f, i) => {
        const mb = f.size ? (f.size/1024/1024).toFixed(1) : '?';
        r += `*${i+1}.* ${f.filename}\n📥 [Download](${f.dlink})\n📏 ${mb} MB\n\n`;
      });
      if (count > 8) r += `_...dan ${count-8} file lainnya_\n`;
      return r;
    }

    // ── TikTok ──
    if (data?.ok === true || data?.type?.includes('TIK')) {
      const desc = (data.video?.desc || data.title || '').substring(0, 150);
      const user = data.from_url?.username || '?';
      let r = `🎵 *TikTok*\n👤 @${user}`;
      if (desc) r += `\n📝 ${desc}`;
      if (data.video?.duration) r += `\n⏱ ${data.video.duration}s`;
      r += `\n🔗 ${data.resolved_url || u}`;
      if (data.thumbnail) r += `\n🖼️ [Thumbnail](${data.thumbnail})`;
      return r;
    }

    // ── Generic: return raw string if available ──
    if (data?.url) return `📥 [Download](${data.url})`;
    if (data?.download) return `📥 [Download](${data.download})`;
    if (typeof data === 'string') return data.substring(0, 3800);

    // Fallback
    return `✅ Berhasil!\n🔗 ${u}`;
  } catch (e) { return `❌ Gagal download.\n🔗 ${u}`; }
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

  // ── FACEBOOK (download buffer → kirim langsung) ──
  if (cmd === 'fb') {
    if (!args) return ctx.reply('📥 *fb [url facebook]*', { parse_mode: 'Markdown' });
    if (!args.startsWith('http')) return ctx.reply('📥 Masukkan URL Facebook yang valid!', { parse_mode: 'Markdown' });
    const msg = await ctx.reply('⏳ Downloading FB...');
    try {
      const { data } = await axios.get(`${KT}/api/facebook?url=${encodeURIComponent(args)}`, { timeout: 30000 });
      const vurl = data?.download_quality_hd || data?.download_quality_sd;
      if (vurl) {
        try {
          const res = await axios.get(vurl, { responseType: 'arraybuffer', timeout: 60000 });
          await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
          await ctx.replyWithVideo(Buffer.from(res.data), { caption: '📥 Facebook' });
          return;
        } catch {}
      }
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      let r = '';
      if (data?.download_quality_hd) r += `📥 *HD:* [Klik Download](${data.download_quality_hd})\n`;
      if (data?.download_quality_sd) r += `📥 *SD:* [Klik Download](${data.download_quality_sd})\n`;
      if (data?.download_audio) r += `🎵 *Audio:* [Klik Download](${data.download_audio})\n`;
      if (r) return ctx.reply(r, { parse_mode: 'Markdown' });
      return ctx.reply(`❌ ${data?.description || 'Gagal.'}\n🔗 ${args}`);
    } catch (e) {
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      return ctx.reply(`❌ Error.\n🔗 ${args}`);
    }
  }

  // ── INSTAGRAM (download buffer → kirim langsung) ──
  if (cmd === 'ig') {
    if (!args) return ctx.reply('📥 *ig [url instagram]*', { parse_mode: 'Markdown' });
    if (!args.startsWith('http')) return ctx.reply('📥 Masukkan URL Instagram yang valid!', { parse_mode: 'Markdown' });
    const msg = await ctx.reply('⏳ Downloading IG...');
    try {
      const { data } = await axios.get(`${KT}/api/instagram?url=${encodeURIComponent(args)}`, { timeout: 30000 });
      const vurl = data?.download_quality_hd || data?.download_quality_sd || data?.url || data?.download;
      if (vurl) {
        try {
          const res = await axios.get(vurl, { responseType: 'arraybuffer', timeout: 60000 });
          await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
          await ctx.replyWithVideo(Buffer.from(res.data), { caption: '📥 Instagram' });
          return;
        } catch {}
      }
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      let r = '';
      if (data?.download_quality_hd) r += `📥 *HD:* [Klik Download](${data.download_quality_hd})\n`;
      if (data?.download_quality_sd) r += `📥 *SD:* [Klik Download](${data.download_quality_sd})\n`;
      if (data?.url) r += `📥 [Download](${data.url})\n`;
      if (r) return ctx.reply(r, { parse_mode: 'Markdown' });
      return ctx.reply(`❌ ${data?.error || 'Gagal.'}\n🔗 ${args}`);
    } catch (e) {
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      return ctx.reply(`❌ Error.\n🔗 ${args}`);
    }
  }

  // ── YOUTUBE MP3 (kirim audio langsung) ──
  if (cmd === 'ytmp3') {
    if (!args) return ctx.reply('📥 *ytmp3 [url youtube]*', { parse_mode: 'Markdown' });
    if (!args.startsWith('http')) return ctx.reply('📥 Masukkan URL YouTube yang valid!', { parse_mode: 'Markdown' });
    const msg = await ctx.reply('⏳ Downloading YT MP3...');
    try {
      const { data } = await axios.get(`${KT}/api/download?url=${encodeURIComponent(args)}`, { timeout: 30000 });
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      // Try sending audio/video directly
      const durl = data?.download || data?.url || data?.download_quality_hd;
      if (durl) {
        try { await ctx.replyWithAudio(durl, { caption: '🎵 YouTube MP3' }); return; } catch {}
        try { await ctx.replyWithVideo(durl, { caption: '📥 YouTube' }); return; } catch {}
      }
      // Fallback: show link
      if (durl) return ctx.reply(`📥 [Download MP3](${durl})\n🔗 ${args}`, { parse_mode: 'Markdown' });
      if (data?.success === false) return ctx.reply(`❌ ${data.error || 'Gagal.'}\n\n📥 Download manual: https://ytmp3.cc/`);
      return ctx.reply(`❌ Gagal download.\n🔗 ${args}`);
    } catch (e) {
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      return ctx.reply(`❌ Error. Gunakan: https://ytmp3.cc/`);
    }
  }

  // ── GENERIC DOWNLOADER (none left, kept as placeholder) ──

  // ── TIKTOK (via tikwm.com - kirim video langsung) ──
  if (cmd === 'tt') {
    if (!args) return ctx.reply('📥 *tt [url tiktok]*', { parse_mode: 'Markdown' });
    if (!args.startsWith('http')) return ctx.reply('📥 Masukkan URL TikTok yang valid!', { parse_mode: 'Markdown' });
    const msg = await ctx.reply('⏳ Downloading TikTok...');
    try {
      const d = await j(`https://www.tikwm.com/api/?url=${encodeURIComponent(args)}`);
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      if (d?.code === 0 && d?.data?.play) {
        const v = d.data;
        try {
          await ctx.replyWithVideo(v.play, {
            caption: `🎵 *TikTok*\n👤 @${v.author?.nickname || '?'}\n${v.title || ''}`.substring(0, 1024),
            parse_mode: 'Markdown',
          });
          return;
        } catch {
          return ctx.reply(`🎵 *TikTok*\n👤 @${v.author?.nickname || '?'}\n${v.title || ''}\n\n📥 [Download Video](${v.play})`, { parse_mode: 'Markdown' });
        }
      }
      return ctx.reply(`❌ Gagal download TikTok.\n🔗 ${args}`);
    } catch (e) {
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      return ctx.reply(`❌ Error. Coba lagi nanti.\n🔗 ${args}`);
    }
  }

  // ── TERABOX (menu inline keyboard) ──
  if (cmd === 'tb') {
    if (!args) return ctx.reply('📦 *tb [url terabox]*', { parse_mode: 'Markdown' });
    if (!args.startsWith('http')) return ctx.reply('📦 Masukkan URL Terabox yang valid!', { parse_mode: 'Markdown' });
    const msg = await ctx.reply('⏳ Mengambil daftar file...');
    try {
      const { data } = await axios.get(`${KT}/terabox?url=${encodeURIComponent(args)}`, { timeout: 30000 });
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      if (!data?.files?.length) return ctx.reply('❌ File tidak ditemukan.\n🔗 ' + args);

      const files = data.files;
      const total = data.total_files || files.length;
      const pages = Math.ceil(files.length / 5);

      const sent = await ctx.reply(
        `📦 *TeraBox: ${total} file(s)*\n\n_Pilih file yang mau didownload:_\nHalaman 1/${pages}`,
        { parse_mode: 'Markdown', reply_markup: tbBuildKeyboard(files, 0) }
      );

      tbCache.set(sent.message_id, { files, expires: Date.now() + 300000 });
    } catch (e) {
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{});
      return ctx.reply(`❌ Gagal ambil daftar file.\n🔗 ${args}`);
    }
  }

  // ── SONG ──
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

// ═══ TERABOX CALLBACK ═══
function tbBuildKeyboard(files, page) {
  const pages = Math.ceil(files.length / 5);
  const kb = new InlineKeyboard();
  const start = page * 5;
  const chunk = files.slice(start, start + 5);
  chunk.forEach((f, i) => {
    const idx = start + i;
    const mb = f.size ? (f.size/1024/1024).toFixed(1) : '?';
    const ext = f.filename.split('.').pop().toLowerCase();
    const icon = ['mp4','mov','mkv','webm'].includes(ext) ? '🎬' : ['jpg','jpeg','png','webp'].includes(ext) ? '🖼️' : '📎';
    kb.text(`${icon} ${f.filename.substring(0, 25)} (${mb}MB)`, `tb_dl_${idx}`).row();
  });
  if (pages > 1) {
    const nav = [];
    if (page > 0) nav.push(InlineKeyboard.text('⬅️', `tb_pg_${page-1}`));
    nav.push(InlineKeyboard.text(`${page+1}/${pages}`, 'tb_noop'));
    if (page < pages - 1) nav.push(InlineKeyboard.text('➡️', `tb_pg_${page+1}`));
    kb.row(...nav);
  }
  return kb;
}

bot.on('callback_query:data', async (ctx) => {
  const d = ctx.callbackQuery.data;
  const msgId = ctx.callbackQuery.message?.message_id;
  await ctx.answerCallbackQuery().catch(()=>{});

  // ── Page Navigation ──
  if (d.startsWith('tb_pg_')) {
    const page = parseInt(d.split('_')[2]);
    const cached = tbCache.get(msgId);
    if (!cached || cached.expires < Date.now()) {
      tbCache.delete(msgId);
      return ctx.editMessageText('⏰ Sesi expired. Ketik *tb* lagi.', { parse_mode: 'Markdown' }).catch(()=>{});
    }
    const { files } = cached;
    const pages = Math.ceil(files.length / 5);
    return ctx.editMessageText(
      `📦 *TeraBox: ${files.length} file(s)*\n\n_Pilih file:_\nHalaman ${page+1}/${pages}`,
      { parse_mode: 'Markdown', reply_markup: tbBuildKeyboard(files, page) }
    ).catch(()=>{});
  }

  if (d === 'tb_noop') return;

  // ── Download File ──
  if (d.startsWith('tb_dl_')) {
    const idx = parseInt(d.split('_')[2]);
    const cached = tbCache.get(msgId);
    if (!cached || cached.expires < Date.now()) {
      tbCache.delete(msgId);
      return ctx.editMessageText('⏰ Sesi expired. Ketik *tb* lagi.', { parse_mode: 'Markdown' }).catch(()=>{});
    }
    const f = cached.files[idx];
    if (!f) return;
    await ctx.editMessageText(`⏳ Downloading: ${f.filename}...`).catch(()=>{});
    const ext = f.filename.split('.').pop().toLowerCase();
    try {
      const res = await axios.get(f.dlink, { responseType: 'arraybuffer', timeout: 60000 });
      const buf = Buffer.from(res.data);
      if (['mp4','mov','mkv','webm'].includes(ext)) {
        await ctx.replyWithVideo(buf, { caption: f.filename.substring(0, 200) });
      } else if (['jpg','jpeg','png','webp'].includes(ext)) {
        await ctx.replyWithPhoto(buf, { caption: f.filename.substring(0, 200) });
      } else {
        await ctx.replyWithDocument(buf, { caption: f.filename.substring(0, 200) });
      }
      const page = Math.floor(idx / 5);
      const pages = Math.ceil(cached.files.length / 5);
      await ctx.editMessageText(
        `📦 *TeraBox: ${cached.files.length} file(s)*\n✅ *${f.filename}* terkirim!\n\n_Pilih file lain:_`,
        { parse_mode: 'Markdown', reply_markup: tbBuildKeyboard(cached.files, page) }
      ).catch(()=>{});
    } catch (e) {
      await ctx.editMessageText(
        `❌ Gagal: *${f.filename}*\n\n📥 [Download Langsung](${f.dlink})`,
        { parse_mode: 'Markdown' }
      ).catch(()=>{});
    }
  }
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
