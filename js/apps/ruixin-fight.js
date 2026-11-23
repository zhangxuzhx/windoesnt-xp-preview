/* 瑞鑫 · 手动查杀：所有病毒共用的小游戏外框 ＋ 每个病毒自己的玩法（瑞鑫杀毒-创意.md 第六部分）
   - 外框：标题 ／ 病毒的卡通像、名字、危险等级、血条 ／ 倒计时 ／ 打的地方 ／ 一行规则
   - 打的时候整个屏幕暗下来、有点糊，只有这个框是清楚的；病毒在背景里照样发作——每一局都限时
   - 海葵（★）：挡消息（左右乒乓）——豹哥举盾牌把海葵吐的消息泡泡挡回去打它；漏掉的泡泡传染豹哥身后的好友
   - 注册机小绿虫（★★）：抢接管进度（连点拔河）——狂点往回拽；它假装松手时你还拽，豹哥摔屁股墩
   - "算"（logic）跟"画"分开：浏览器外面能直接跑 logic 调难度
   以后加病毒：GAMES 里加一个 { logic, draw, hint, input } */
(function () {
  'use strict';
  const el = typeof OS.el === 'function' ? OS.el : null;
  const ART = 'assets/ruixin/';
  const IMG = {};
  if (typeof Image !== 'undefined') {
    ['baoge', 'haikui', 'bug-big', 'bubble'].forEach(n => { const i = new Image(); i.onload = () => { IMG[n] = i; }; i.src = ART + n + '.webp'; });
    const av = new Image(); av.onload = () => { IMG.av = av; }; av.src = 'assets/koukou/avatars.webp';
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ================= 文案 ================= */
  const L = {
    title: '瑞鑫 · 手动查杀',
    stars: n => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n),
    hp: '病毒血量',
    timeIntercept: '病毒突破倒计时', timeInfected: '距离蓝屏', timeReplay: '限时',
    win: '查杀成功！病毒已清除。', took: t => '用时 ' + t, comment: '豹哥点评：',
    lose: '查杀失败：病毒跑了。', timeout: '来不及了：病毒冲出去了。',
    again: '再来一次', giveUp: '算了', ok: '确定',
    comments: ['秒杀。豹哥都没看清。', '杀掉了。下次别乱装东西。', '打了这么久，病毒都快跟你处出感情了。'],
    hkInfect: '被传染'
  };
  const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

  /* ================= 海葵：挡消息（左右乒乓） =================
     场地 280×150：左边 x 40 是盾牌的正面，身后一列 8 个好友；右边 x 246 是海葵（上下慢慢晃）
     血越少，同时飞过来的泡泡越多、越快 */
  const HK = {
    W: 280, H: 150, HP: 10,
    PAD_X: 44, PAD_HALF: 15, PAD_SPEED: 340, KEY_SPEED: 200,
    R: 5.5, AX: 246, AR: 24, FRIEND_X: 14,
    FRIENDS: ['deskmate', 'faxiao', 'roommate', 'boss', 'nextdoor', 'monitor', 'feiyang', 'taxue'],
    // [同时最多几个往左飞, 速度, 两个泡泡之间隔几秒]
    TIERS: [{ max: 1, speed: 82, gap: 1.2 }, { max: 2, speed: 94, gap: 1.1 }, { max: 3, speed: 104, gap: 0.95 }],
    create() { return { t: 0, hp: HK.HP, pad: 75, ay: 75, bubbles: [], infected: [], hurt: 0, next: 1.0, done: null, events: [] }; },
    tier: s => HK.TIERS[s.hp >= 7 ? 0 : s.hp >= 4 ? 1 : 2],
    slotY: i => (i + 0.5) * HK.H / HK.FRIENDS.length,
    // input：{ target: 手指 ／ 鼠标的高度, dir: 键盘 -1 ／ 0 ／ 1 }
    step(s, dt, input, rnd) {
      rnd = rnd || Math.random;
      s.t += dt;
      s.ay = 75 + Math.sin(s.t * 0.9) * 30;
      if (s.hurt > 0) s.hurt -= dt;
      if (input && input.target != null) { const d = input.target - s.pad; s.pad += Math.sign(d) * Math.min(Math.abs(d), HK.PAD_SPEED * dt); }
      if (input && input.dir) s.pad += input.dir * HK.KEY_SPEED * dt;
      s.pad = clamp(s.pad, HK.PAD_HALF, HK.H - HK.PAD_HALF);
      if (s.done) return;
      // 吐泡泡
      const T = HK.tier(s);
      s.next -= dt;
      if (s.next <= 0 && s.bubbles.filter(b => !b.ret).length < T.max) {
        const a = (rnd() - 0.5) * 1.0;
        s.bubbles.push({ x: HK.AX - 24, y: s.ay + (rnd() - 0.5) * 16, vx: -T.speed * Math.cos(a), vy: T.speed * Math.sin(a), ret: false });
        s.next = T.gap * (0.8 + rnd() * 0.4);
        s.events.push({ k: 'spit' });
      }
      const R = HK.R;
      s.bubbles.forEach(b => {
        if (b.ret) b.vy = clamp(b.vy + (s.ay - b.y) * 5 * dt, -130, 130);   // 挡回去的泡泡认得海葵（瑞鑫病毒库导航）
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy); }
        if (b.y > HK.H - R) { b.y = HK.H - R; b.vy = -Math.abs(b.vy); }
        if (!b.ret && b.x - R <= HK.PAD_X && b.x + R >= HK.PAD_X - 10 && Math.abs(b.y - s.pad) <= HK.PAD_HALF + R) {
          const sp = Math.hypot(b.vx, b.vy) * 1.45;
          b.ret = true; b.x = HK.PAD_X + R;
          b.vy = ((b.y - s.pad) / HK.PAD_HALF) * 70;
          b.vx = Math.sqrt(Math.max(1, sp * sp - b.vy * b.vy));
          s.events.push({ k: 'block' });
        } else if (!b.ret && b.x < HK.FRIEND_X + 6) {
          b.gone = true;
          const n = HK.FRIENDS.length;
          let i = clamp(Math.floor(b.y / HK.H * n), 0, n - 1);
          if (s.infected.indexOf(i) >= 0) {
            const free = HK.FRIENDS.map((_, k) => k).filter(k => s.infected.indexOf(k) < 0).sort((p, q) => Math.abs(p - i) - Math.abs(q - i));
            i = free[0];
          }
          if (i != null) { s.infected.push(i); s.events.push({ k: 'infect', i, id: HK.FRIENDS[i] }); }
          if (s.infected.length >= n) { s.done = 'lose'; s.events.push({ k: 'lose' }); }
        } else if (b.ret && Math.hypot(b.x - HK.AX, b.y - s.ay) < HK.AR + R) {
          b.gone = true;
          s.hp--; s.hurt = 0.45;
          s.events.push({ k: 'hit' });
          if (s.hp <= 0) { s.done = 'win'; s.events.push({ k: 'win' }); }
        } else if (b.ret && b.x > HK.W + 10) b.gone = true;
      });
      s.bubbles = s.bubbles.filter(b => !b.gone);
      if (s.done) s.bubbles = [];
    }
  };

  /* ================= 注册机小绿虫：抢接管进度（连点拔河） =================
     接管进度从 60% 开始：小虫子一直往 100% 拽（越拽越有劲）；你每点一下往回拽一点，拽到 0% 就赢
     它隔几秒"假装松手"：先晃一下、头上冒"！"，然后两手一摊——这时候你还拽，豹哥摔屁股墩，进度往回掉一截，还晕一会儿 */
  const KG = {
    START: 65, TAP: 2.0, PULL: 5.2, PULL_UP: 0.015, FALL: 7, STUN: 0.9, WARN: 0.5, HOLD: 1.1,
    create() { return { t: 0, p: KG.START, fake: null, nextFake: 3.2, stun: 0, done: null, events: [], tugT: 0 }; },
    faking: s => !!(s.fake && s.fake.warn <= 0),
    step(s, dt, taps, rnd) {
      rnd = rnd || Math.random;
      s.t += dt;
      if (s.tugT > 0) s.tugT -= dt;
      if (s.done) return;
      if (!s.fake) { s.nextFake -= dt; if (s.nextFake <= 0) { s.fake = { warn: KG.WARN, hold: KG.HOLD }; s.events.push({ k: 'warn' }); } }
      else if (s.fake.warn > 0) s.fake.warn -= dt;
      else { s.fake.hold -= dt; if (s.fake.hold <= 0) { s.fake = null; s.nextFake = 2.6 + rnd() * 2.6; } }
      if (!KG.faking(s)) s.p += (KG.PULL + s.t * KG.PULL_UP) * dt;
      if (s.stun > 0) { s.stun -= dt; taps = 0; }
      if (taps > 0) {
        if (KG.faking(s)) { s.p += KG.FALL; s.stun = KG.STUN; s.events.push({ k: 'fall' }); }
        else { s.p -= taps * KG.TAP; s.tugT = 0.18; s.events.push({ k: 'tug' }); }
      }
      s.p = clamp(s.p, 0, 100);
      if (s.p <= 0) { s.done = 'win'; s.events.push({ k: 'win' }); }
      else if (s.p >= 100) { s.done = 'lose'; s.events.push({ k: 'lose' }); }
    }
  };

  // 给浏览器外面调难度用
  OS.ruixinFight = { HK, KG };
  if (!el) return;

  /* ================= 画 ================= */
  // 豹哥的一格：baoge.webp 6×4 格，每格 112，脚底在格子里 y 104；flip = 朝右
  function leopard(c, frame, cx, footY, size, flip) {
    const im = IMG.baoge;
    if (!im) return;
    const col = frame % 6, row = Math.floor(frame / 6), k = size / 112;
    c.save();
    c.translate(cx, footY - 104 * k + size / 2);
    if (flip) c.scale(-1, 1);
    c.drawImage(im, col * 112, row * 112, 112, 112, -size / 2, -size / 2, size, size);
    c.restore();
  }
  function strip(c, name, frame, cx, cy, size, flip) {
    const im = IMG[name];
    if (!im) return false;
    c.save(); c.translate(cx, cy); if (flip) c.scale(-1, 1);
    c.drawImage(im, frame * 160, 0, 160, 160, -size / 2, -size / 2, size, size);
    c.restore();
    return true;
  }
  function field(c, w, h) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a3b33'); g.addColorStop(1, '#05211d');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(120,220,180,.08)'; c.lineWidth = 1;
    for (let x = 0; x < w; x += 14) { c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, h); c.stroke(); }
    for (let y = 0; y < h; y += 14) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(w, y + 0.5); c.stroke(); }
  }

  function drawHK(c, s) {
    field(c, HK.W, HK.H);
    c.setLineDash([4, 5]); c.strokeStyle = 'rgba(255,215,90,.25)'; c.beginPath(); c.moveTo(HK.W / 2, 0); c.lineTo(HK.W / 2, HK.H); c.stroke(); c.setLineDash([]);
    // 身后的好友
    HK.FRIENDS.forEach((id, i) => {
      const y = HK.slotY(i) - 7, idx = { deskmate: 1, faxiao: 2, roommate: 3, boss: 4, nextdoor: 5, monitor: 6, feiyang: 7, taxue: 9 }[id];
      if (IMG.av) c.drawImage(IMG.av, idx * 80, 0, 80, 80, 3, y, 14, 14);
      else { c.fillStyle = '#8aa'; c.fillRect(3, y, 14, 14); }
      if (s.infected.indexOf(i) >= 0) { c.fillStyle = 'rgba(40,220,80,.6)'; c.fillRect(3, y, 14, 14); c.strokeStyle = '#2f2'; c.lineWidth = 1; c.strokeRect(3.5, y + 0.5, 13, 13); }
    });
    // 海葵
    const dead = s.done === 'win';
    if (!strip(c, 'haikui', dead ? 2 : s.hurt > 0 ? 1 : 0, HK.AX, s.ay, 62)) { c.fillStyle = '#e05ab4'; c.beginPath(); c.arc(HK.AX, s.ay, HK.AR, 0, Math.PI * 2); c.fill(); }
    // 豹哥举盾牌（朝右）
    leopard(c, s.done === 'lose' ? 21 : 18, HK.PAD_X - 13, s.pad + 19, 40, true);
    if (!IMG.baoge) { c.fillStyle = '#e8b040'; c.fillRect(HK.PAD_X - 6, s.pad - HK.PAD_HALF, 6, HK.PAD_HALF * 2); }
    // 泡泡
    s.bubbles.forEach(b => {
      if (b.ret) { c.shadowColor = '#ffd84a'; c.shadowBlur = 8; }
      if (IMG.bubble) c.drawImage(IMG.bubble, b.x - HK.R - 1, b.y - HK.R - 1, HK.R * 2 + 2, HK.R * 2 + 2);
      else { c.fillStyle = b.ret ? '#ffd84a' : '#5ff0d0'; c.beginPath(); c.arc(b.x, b.y, HK.R, 0, Math.PI * 2); c.fill(); }
      c.shadowBlur = 0;
    });
  }

  function drawKG(c, s, W, H) {
    field(c, W, H);
    // 接管进度条
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(40, 8, W - 80, 12);
    c.fillStyle = s.p > 75 ? '#ff3a3a' : '#ff9a2e'; c.fillRect(40, 8, (W - 80) * s.p / 100, 12);
    c.strokeStyle = '#cfe'; c.lineWidth = 1; c.strokeRect(40.5, 8.5, W - 81, 11);
    c.font = 'bold 9px SimSun, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    c.fillText('接管进度 ' + Math.round(s.p) + '%', W / 2, 14.5);
    // 网线：中间一面小红旗跟着进度走（进度越高越往小虫子那边）
    const mid = W / 2 + (s.p - 50) * 0.9, ly = 104;
    const lx = mid - 70, bx = mid + 70;
    c.strokeStyle = '#9aa7b4'; c.lineWidth = 3; c.beginPath(); c.moveTo(lx + 14, ly); c.lineTo(bx - 14, ly); c.stroke();
    c.strokeStyle = '#d8e0e8'; c.lineWidth = 1; c.beginPath(); c.moveTo(lx + 14, ly - 1); c.lineTo(bx - 14, ly - 1); c.stroke();
    c.fillStyle = '#e02a2a'; c.beginPath(); c.moveTo(mid, ly); c.lineTo(mid, ly - 16); c.lineTo(mid + 10, ly - 12); c.lineTo(mid, ly - 8); c.fill();
    c.fillStyle = '#ddd'; c.fillRect(mid - 0.5, ly - 16, 1, 16);
    // 豹哥（朝右）和小绿虫（朝左）
    const fr = s.stun > 0 ? 21 : s.done === 'win' ? 13 : s.tugT > 0 ? 20 : 19;
    leopard(c, fr, lx, ly + 28, 58, true);
    const bf = s.done === 'win' ? 2 : KG.faking(s) ? 1 : 0;
    if (!strip(c, 'bug-big', bf, bx + 8, ly - 4, 64)) { c.fillStyle = '#5c5'; c.beginPath(); c.arc(bx + 8, ly - 4, 20, 0, Math.PI * 2); c.fill(); }
    if (s.fake && s.fake.warn > 0) { c.font = 'bold 20px Arial Black, sans-serif'; c.fillStyle = '#ffde3a'; c.fillText('!', bx + 8, ly - 44); }
    if (KG.faking(s)) { c.font = 'bold 9px SimSun, sans-serif'; c.fillStyle = '#ffde3a'; c.fillText('它松手了！别拽！', W / 2, 36); }
  }

  const GAMES = {
    haikui: {
      W: HK.W, H: HK.H, hint: '上下挪盾牌，把消息泡泡挡回去打海葵。漏掉的会传染你的好友。',
      create: HK.create, hp: s => s.hp / HK.HP,
      step: (s, dt, inp) => HK.step(s, dt, { target: inp.target, dir: inp.dir }),
      draw: drawHK, art: 'haikui'
    },
    keygen: {
      W: 280, H: 150, hint: '狂点（或狂按空格）往回拽。它一松手就停！',
      create: KG.create, hp: s => s.p / 100,
      step: (s, dt, inp) => KG.step(s, dt, inp.taps),
      draw: (c, s) => drawKG(c, s, 280, 150), art: 'bug-big', taps: true
    }
  };

  /* ================= 外框 =================
     OS.ruixinFight.run(病毒 id, { virus: { name, nick, stars }, deadline: 数字或函数（什么时候到时间，毫秒时间戳）, mode: 'intercept' ／ 'infected' ／ 'replay',
                                   onInfect(好友 id, 第几个) }) → Promise<{ won, ms, timeout }> */
  let active = null;
  function run(vid, o) {
    const G = GAMES[vid];
    if (!G || active) return Promise.resolve({ won: false });
    o = o || {};
    return new Promise(resolve => {
      const stage = OS.stage.el;
      const layer = document.getElementById('overlay') || stage;
      const deadlineOf = () => (typeof o.deadline === 'function' ? o.deadline() : o.deadline);
      const v = o.virus || {};
      // ---- 搭框 ----
      const x = el('span', { class: 'rxf-x', text: '×' });
      const pic = el('div', { class: 'rxf-pic rxf-pic-' + vid });
      const hpFill = el('div', { class: 'rxf-hpf' });
      const timeFill = el('div', { class: 'rxf-tf' });
      const timeTxt = el('span', { class: 'rxf-tt' });
      const cv = el('canvas', { class: 'rxf-cv' });
      const wrap = el('div', { class: 'rxf-play' }, [cv]);
      const endBox = el('div', { class: 'rxf-end' });
      const box = el('div', { class: 'rxf' }, [
        el('div', { class: 'rxf-title' }, [OS.iconEl('ruixin', 'rxf-tico'), el('span', { text: L.title }), x]),
        el('div', { class: 'rxf-head' }, [pic, el('div', { class: 'rxf-who' }, [
          el('div', { class: 'rxf-name', text: (v.name || '') + '　' + (v.nick || '') }),
          el('div', { class: 'rxf-stars', text: L.stars(v.stars || 1) }),
          el('div', { class: 'rxf-hp' }, [el('span', { text: L.hp }), el('div', { class: 'rxf-hpb' }, [hpFill])])
        ])]),
        el('div', { class: 'rxf-time' }, [el('span', { text: o.mode === 'infected' ? L.timeInfected : o.mode === 'replay' ? L.timeReplay : L.timeIntercept }), el('div', { class: 'rxf-tb' }, [timeFill]), timeTxt]),
        wrap,
        el('div', { class: 'rxf-hint', text: G.hint }),
        endBox
      ]);
      layer.appendChild(box);
      stage.classList.add('rx-focus');
      active = box;
      const k = Math.min(3, (window.devicePixelRatio || 1) * (OS.stage.scale || 1));
      cv.width = Math.round(G.W * k); cv.height = Math.round(G.H * k);
      const c = cv.getContext('2d');
      // ---- 一局 ----
      let s, t0, raf = 0, last = 0, acc = 0, over = false, deadline = 0, total0 = performance.now();
      const inp = { target: null, dir: 0, taps: 0 };
      const keys = {};
      OS.ruixinFight.cur = () => ({ s, cv, G });   // 测试用：看现在这一局
      function startRound() {
        s = G.create();
        t0 = performance.now(); last = t0; acc = 0; over = false;
        if (o.mode === 'replay' || !deadlineOf()) deadline = Date.now() + 90000;
        endBox.classList.remove('show');
        endBox.textContent = '';
        raf = requestAnimationFrame(loop);
      }
      function loop(now) {
        if (!box.isConnected) return;
        if (OS.boot.state !== 'desktop') { finish({ won: false }); return; }
        acc = Math.min(acc + (now - last) / 1000, 0.25); last = now;
        while (acc >= 1 / 60 && !over) {
          inp.dir = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
          G.step(s, 1 / 60, inp);
          inp.taps = 0;
          s.events.splice(0).forEach(fx);
          acc -= 1 / 60;
          if (s.done) { over = true; setTimeout(() => end(s.done), 700); }
        }
        const dl = o.mode === 'replay' ? deadline : (deadlineOf() || deadline);
        const left = dl - Date.now();
        timeTxt.textContent = mmss(left);
        const span = o.mode === 'replay' ? 90000 : Math.max(90000, left);
        timeFill.style.width = clamp(left / span * 100, 0, 100) + '%';
        timeFill.classList.toggle('low', left < 20000);
        if (left <= 0 && !over) { over = true; end('timeout'); }
        hpFill.style.width = (G.hp(s) * 100) + '%';
        c.setTransform(k, 0, 0, k, 0, 0);
        G.draw(c, s);
        if (!over || s.done) raf = requestAnimationFrame(loop);
      }
      // 打的过程里的动静
      function fx(e) {
        if (e.k === 'block') OS.sound.play('rxShield');
        if (e.k === 'hit') { OS.sound.play('rxHit'); pic.classList.remove('hurt'); void pic.offsetWidth; pic.classList.add('hurt'); }
        if (e.k === 'spit') OS.sound.play('bubble');
        if (e.k === 'tug') OS.sound.play('click');
        if (e.k === 'fall') OS.sound.play('thud');
        if (e.k === 'warn') OS.sound.play('ding');
        if (e.k === 'infect') {
          const line = o.infectLine ? o.infectLine(e.id) : '';
          if (line) {
            const b = el('div', { class: 'rxf-say', text: line });
            b.style.top = (HK.slotY(e.i) / HK.H * 100) + '%';
            wrap.appendChild(b);
            setTimeout(() => b.remove(), 2600);
          }
          OS.sound.play('kkMsg');
          if (o.onInfect) o.onInfect(e.id, line);
        }
      }
      function end(kind) {
        const ms = performance.now() - t0;
        endBox.textContent = '';
        const btns = el('div', { class: 'dlg-btns' });
        const btn = (t, fn, def) => { const b = el('button', { class: 'xpbtn' + (def ? ' default' : ''), text: t }); b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); fn(); }); btns.appendChild(b); };
        if (kind === 'win') {
          OS.sound.play('rxWin');
          const cm = L.comments[ms < 30000 ? 0 : ms < 60000 ? 1 : 2];
          endBox.append(el('div', { class: 'rxf-big win', text: L.win }), el('div', { class: 'rxf-sub', text: L.took(mmss(ms)) + '\n' + L.comment + cm }));
          btn(L.ok, () => finish({ won: true, ms }), true);
        } else {
          OS.sound.play('rxLose');
          const dl = o.mode === 'replay' ? Infinity : (deadlineOf() || deadline);
          const timeLeft = kind !== 'timeout' && (o.mode === 'replay' || dl - Date.now() > 3000);
          endBox.append(el('div', { class: 'rxf-big lose', text: kind === 'timeout' ? L.timeout : L.lose }));
          if (timeLeft) { btn(L.again, startRound, true); btn(L.giveUp, () => finish({ won: false })); }
          else btn(L.ok, () => finish({ won: false, timeout: kind === 'timeout' }), true);
        }
        endBox.appendChild(btns);
        endBox.classList.add('show');
      }
      function finish(r) {
        if (!box.isConnected) return;
        cancelAnimationFrame(raf);
        box.remove();
        stage.classList.remove('rx-focus');
        active = null;
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('keyup', onKeyUp, true);
        document.removeEventListener('pointermove', onMove, true);
        r.total = performance.now() - total0;
        resolve(r);
      }
      // ---- 操作 ----
      const toGame = e => { const p = OS.stage.toLocal(e.clientX, e.clientY), r = OS.stage.rectOf(cv); return { x: (p.x - r.left) * G.W / r.width, y: (p.y - r.top) * G.H / r.height }; };
      let dragging = false;
      function onMove(e) {
        if (G.taps || over) return;
        if (e.pointerType === 'mouse' || dragging) inp.target = clamp(toGame(e).y, 0, G.H);
      }
      wrap.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (over) return;
        if (G.taps) { inp.taps++; return; }
        dragging = true;
        inp.target = clamp(toGame(e).y, 0, G.H);
      });
      document.addEventListener('pointerup', () => { dragging = false; }, true);
      function onKey(e) {
        const kk = e.key;
        if (kk === 'ArrowUp' || kk === 'w' || kk === 'W') { keys.up = true; inp.target = null; }
        else if (kk === 'ArrowDown' || kk === 's' || kk === 'S') { keys.down = true; inp.target = null; }
        else if ((kk === ' ' || kk === 'Enter' || kk === 'z' || kk === 'Z') && G.taps) { if (!e.repeat && !over) inp.taps++; }
        else if (kk === 'Escape') { /* 不让 Esc 关掉 */ }
        else return;
        e.preventDefault(); e.stopPropagation();
      }
      function onKeyUp(e) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
      }
      document.addEventListener('keydown', onKey, true);
      document.addEventListener('keyup', onKeyUp, true);
      document.addEventListener('pointermove', onMove, true);
      x.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); if (!over) { over = true; end('lose'); } });
      OS.on('desktop:reset', () => finish({ won: false }));
      startRound();
    });
  }
  OS.ruixinFight.run = run;
  OS.ruixinFight.busy = () => !!active;
})();
