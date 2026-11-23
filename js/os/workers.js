/* 桌面右键 ▸ 刷新（刷新-创意.md）：桌面脏了来环卫大爷收拾，干净了来刷墙师傅往草地上刷一道绿漆
   - 环卫大爷：羊粪（扫）／ 弹窗杀手留在屏幕上的手印（哈口气擦）／ 砍断的木牌（扛走，重启才回来）／ 光驱托盘上那杯可乐（拿走喝了）
     路过中毒的图标说一句"这个我扫不掉，得找杀毒的。"
   - 刷墙师傅：专挑还没刷过的草地刷一道绿漆（大约刷新 30 次刷满）；只刷草地（按壁纸的颜色认）；过一半、过八成右下角提醒
     草地刷满九成 → 蓝屏 FORMALDEHYDE_POISONING
   - 干活的时候又点刷新：扭头说"催什么催，干着呢。"，这次不算
   - 重启：绿漆全没了（大改变重启复原）
   图：assets/scene/cleaner.webp、painter.webp（6×2 格，每格 128，脚底离格子底 6，侧面朝右）、paint-strokes.webp（三道，每道 320×72）
       图没来之前：人用一个小人图标顶着，绿漆用代码画 */
(function () {
  'use strict';
  const el = OS.el;

  /* ================= 文案 ================= */
  const L = {
    hurry: '催什么催，干着呢。',
    poop: '这谁家的羊，也不拴着。',
    smudge: '屏幕上拍这么多手印，打蚊子呢？',
    sign: '此处无木牌。',
    cola: '谁的可乐？没人要我喝了啊。',
    virus: '这个我扫不掉，得找杀毒的。',
    bye: '扫干净了，别再弄脏啊。',
    paint: ['绿色环保，放心刷。', '这块草有点黄，给你补补。', '刷完记得开窗通风。', '一平米三块，刷完再结账。', '老板，这个颜色你看行不行？'],
    half: '室内甲醛超标，建议开窗通风。',
    most: '甲醛严重超标！请立即离开桌面。',
    warnTitle: '温馨提示'
  };
  const BSOD = { id: 'greenpaint', name: 'FORMALDEHYDE_POISONING', text: '系统甲醛中毒了。' };   // id 别用 paint：那是画图的蓝屏
  const FIX = '正在开窗通风，把绿漆从草地上铲下来';

  /* ================= 图 ================= */
  const ART = 'assets/scene/';
  const IMG = {};
  ['cleaner', 'painter', 'paint-strokes'].forEach(n => { const i = new Image(); i.onload = () => { IMG[n] = i; }; i.src = ART + n + '.webp'; });
  const WALL = new Image();
  WALL.onload = () => { mask = null; };
  WALL.src = ART + 'wallpaper.webp?v=3';
  // 动作在图里第几格（6 列 × 2 行）
  const CF = { walk: [0, 1], sweep: [2, 3], breathe: [4], wipe: [5], carry: [6, 7], drink: [8], talk: [9], no: [10], bye: [11] };
  const PF = { walk: [0, 1], roll: [2, 3], sweat: [4], thumb: [5], walkDrip: [6, 7], annoyed: [8], smell: [9], dip: [10], bye: [11] };
  const SIZE = 48, FOOT = SIZE * 122 / 128;

  /* ================= 草地 ／ 绿漆 =================
     坐标一律按 1600×900 的壁纸算（跟 desktop.js 一样）；漆画在一张 800×450 的画布上（壁纸的一半大），再按壁纸的缩放贴到桌面 */
  const PW = 800, PH = 450, K = PW / 1600;
  let mask = null;          // 草地：半大的画布，草的地方不透明
  let paint = null;         // 已经刷上去的漆
  let view = null;          // 桌面上那张看得见的画布
  let strokes = 0, warned = 0;
  function ensureMask() {
    if (mask || !WALL.complete || !WALL.naturalWidth) return mask;
    mask = el('canvas'); mask.width = PW; mask.height = PH;
    const g = mask.getContext('2d');
    g.drawImage(WALL, 0, 0, PW, PH);
    const im = g.getImageData(0, 0, PW, PH), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], gg = d[i + 1], b = d[i + 2];
      const grass = gg > b + 6 && gg >= r - 12;   // 绿的是草（近处草坡、远处的山都算）；天是蓝的
      d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = grass ? 255 : 0;
    }
    g.putImageData(im, 0, 0);
    return mask;
  }
  function ensurePaint() {
    if (!paint) { paint = el('canvas'); paint.width = PW; paint.height = PH; }
    const D = OS.desktop, root = D.root && D.root();
    if (root && (!view || !view.isConnected)) {
      view = el('canvas', { class: 'paintcv' });
      root.insertBefore(view, D.layer());
    }
    return paint;
  }
  // 桌面上怎么摆壁纸（照 desktop.js：铺满、居中裁）
  function xf() {
    const root = OS.desktop.root(), w = root.offsetWidth, h = root.offsetHeight, s = Math.max(w / 1600, h / 900);
    return { w, h, s, ox: (w - 1600 * s) / 2, oy: (h - 900 * s) / 2 };
  }
  // 看得见的草地范围（去掉被新闻条、任务栏挡住的）：壁纸坐标
  function visibleBox() {
    const t = xf(), st = OS.stage;
    return { x0: Math.max(0, -t.ox / t.s), x1: Math.min(1600, (t.w - t.ox) / t.s), y0: Math.max(0, (st.TICKER_H - t.oy) / t.s), y1: Math.min(900, (t.h - st.TASKBAR_H - t.oy) / t.s) };
  }
  // extra：正在刷的那一道（还没刷完，只露出前面一截）
  function drawView(extra) {
    if (!view) return;
    const t = xf(), k = Math.min(3, (window.devicePixelRatio || 1) * (OS.stage.scale || 1));
    if (view.width !== Math.round(t.w * k) || view.height !== Math.round(t.h * k)) { view.width = Math.round(t.w * k); view.height = Math.round(t.h * k); }
    const g = view.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, view.width, view.height);
    g.setTransform(k, 0, 0, k, 0, 0);
    if (paint && strokes) g.drawImage(paint, t.ox, t.oy, 1600 * t.s, 900 * t.s);
    if (extra) g.drawImage(extra, t.ox, t.oy, 1600 * t.s, 900 * t.s);
  }
  OS.on('stage:resize', () => drawView());
  // 一道漆：先画在一张半大的画布上，再只留草地的部分
  function strokeCanvas(st, upto) {
    const c = el('canvas'); c.width = PW; c.height = PH;
    const g = c.getContext('2d');
    g.save();
    g.translate((st.x + st.w / 2) * K, st.y * K);
    g.rotate(st.rot * Math.PI / 180);
    const w = st.w * K, h = st.h * K;
    if (upto < 1) { g.beginPath(); g.rect(-w / 2, -h, w * upto, h * 2); g.clip(); }
    const im = IMG['paint-strokes'];
    if (im) g.drawImage(im, 0, st.v * 72, 320, 72, -w / 2, -h / 2, w, h);
    else drawStrokeByCode(g, w, h, st.v);
    g.restore();
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(ensureMask(), 0, 0);
    return c;
  }
  // 图没来之前：代码画一道滚筒刷出来的绿漆
  function drawStrokeByCode(g, w, h, v) {
    const grd = g.createLinearGradient(0, -h / 2, 0, h / 2);
    grd.addColorStop(0, '#5cf25a'); grd.addColorStop(0.5, '#22d42e'); grd.addColorStop(1, '#14a623');
    g.fillStyle = grd;
    g.beginPath(); g.moveTo(-w / 2, 0); g.quadraticCurveTo(-w / 2 + 6, -h / 2, -w / 2 + 14, -h / 2); g.lineTo(w / 2 - 10, -h / 2 + 2); g.quadraticCurveTo(w / 2, -h / 4, w / 2 - 4, h / 2 - 2); g.lineTo(-w / 2 + 10, h / 2); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 0.8;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-w / 2 + 10, -h / 2 + i * h / 4); g.lineTo(w / 2 - 8, -h / 2 + i * h / 4 + 1); g.stroke(); }
    g.fillStyle = '#18b828';
    [0.2 + v * 0.1, 0.55, 0.8 - v * 0.08].forEach((p, i) => { const x = -w / 2 + w * p, len = 4 + i * 2; g.fillRect(x, h / 2 - 2, 2, len); g.beginPath(); g.arc(x + 1, h / 2 + len, 1.6, 0, Math.PI * 2); g.fill(); });
  }
  // 草地刷了多少（只算看得见的草）：每 10 个壁纸像素取一个点
  function coverage() {
    const m = ensureMask();
    if (!m) return 0;
    const box = visibleBox();
    const md = m.getContext('2d').getImageData(0, 0, PW, PH).data, pd = paint ? paint.getContext('2d').getImageData(0, 0, PW, PH).data : null;
    let grass = 0, done = 0;
    for (let y = box.y0 + 5; y < box.y1; y += 10) for (let x = box.x0 + 5; x < box.x1; x += 10) {
      const i = (Math.floor(y * K) * PW + Math.floor(x * K)) * 4 + 3;
      if (md[i] < 128) continue;
      grass++;
      if (pd && pd[i] > 100) done++;
    }
    return grass ? done / grass : 0;
  }
  // 下一道刷在哪：专挑还没刷过的草（作者定 12A）
  function pickStroke() {
    const m = ensureMask();
    if (!m) return null;
    const box = visibleBox();
    const md = m.getContext('2d').getImageData(0, 0, PW, PH).data, pd = paint ? paint.getContext('2d').getImageData(0, 0, PW, PH).data : null;
    const free = [];
    for (let y = box.y0 + 5; y < box.y1; y += 10) for (let x = box.x0 + 5; x < box.x1; x += 10) {
      const i = (Math.floor(y * K) * PW + Math.floor(x * K)) * 4 + 3;
      if (md[i] >= 128 && !(pd && pd[i] > 100)) free.push([x, y]);
    }
    if (!free.length) return null;
    const [cx, cy] = free[Math.floor(Math.random() * free.length)];
    const w = 270 + Math.random() * 100, h = 48 + Math.random() * 16;
    return { x: Math.max(box.x0 - 20, Math.min(box.x1 - w + 20, cx - w / 2)), y: cy, w, h, rot: (Math.random() - 0.5) * 14, v: Math.floor(Math.random() * 3) };
  }

  /* ================= 干活的人 ================= */
  let busy = null;
  const st = () => OS.stage;
  const base = () => st().H - st().TASKBAR_H - 3;   // 平时走路踩的那条线（任务栏上面）
  const wpToStage = (x, y) => { const t = xf(); return { x: t.ox + x * t.s, y: t.oy + y * t.s }; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  function spawn(kind, x, foot) {
    const img = el('i');
    const n = el('div', { class: 'worker ' + kind }, [img]);
    const w = { kind, el: n, img, x, foot, flip: false, sheet: kind === 'cleaner' ? 'cleaner' : 'painter', bubble: null };
    if (!IMG[w.sheet]) n.appendChild(OS.iconEl('runner', 'worker-ph'));   // 图没来之前先拿个小人顶着
    OS.desktop.layer().appendChild(n);
    place(w); frame(w, 0);
    return w;
  }
  function place(w) { w.el.style.left = (w.x - SIZE / 2) + 'px'; w.el.style.top = (w.foot - FOOT) + 'px'; w.el.style.zIndex = Math.round(w.foot); if (w.bubble) posBubble(w); }
  // 说话的泡泡跟着人走
  function posBubble(w) {
    const b = w.bubble, S = st();
    const left = OS.clamp(w.x - b.offsetWidth / 2, S.insets.l + 4, S.W - S.insets.r - b.offsetWidth - 4);
    b.style.left = left + 'px';
    b.style.top = Math.max(S.TICKER_H + 2, w.foot - FOOT - b.offsetHeight - 6) + 'px';
    b.style.setProperty('--tail', (w.x - left) + 'px');
  }
  function frame(w, i) {
    if (IMG[w.sheet]) w.img.style.backgroundPosition = ((i % 6) * 20) + '% ' + (i >= 6 ? 100 : 0) + '%';
    w.el.classList.toggle('flip', w.flip);
  }
  // 走过去：一路换两格走路的样子
  function walkTo(w, x, foot, frames, speed) {
    frames = frames || (w.kind === 'cleaner' ? CF.walk : PF.walk);
    return new Promise(res => {
      let t = 0;
      const tick = setInterval(() => {
        if (!w.el.isConnected) { clearInterval(tick); res(); return; }
        const dx = x - w.x, dy = foot - w.foot, d = Math.hypot(dx, dy), step = (speed || 70) * 0.05;
        t++;
        if (Math.abs(dx) > 0.5) w.flip = dx < 0;
        frame(w, frames[Math.floor(t / 4) % frames.length]);
        if (d <= step) { w.x = x; w.foot = foot; place(w); clearInterval(tick); res(); return; }
        w.x += dx / d * step; w.foot += dy / d * step; place(w);
      }, 50);
    });
  }
  // 原地干一会儿（几格轮着换）
  async function act(w, frames, ms) {
    const n = Math.max(1, Math.round(ms / 260));
    for (let i = 0; i < n && w.el.isConnected; i++) { frame(w, frames[i % frames.length]); await wait(260); }
  }
  function say(w, text, ms) {
    sayOff(w);
    const b = w.bubble = el('div', { class: 'say-bubble worker-say', text });
    document.getElementById('balloons').appendChild(b);
    const S = st();
    // 先摆到大概的位置再量：没摆之前量出来的宽高不准（字会被挤成好几行）
    b.style.left = OS.clamp(w.x - 60, S.insets.l + 4, S.W - S.insets.r - 124) + 'px';
    b.style.top = '0px';
    posBubble(w);
    b.classList.add('above');
    OS.sound.play('pop');
    const node = b;
    setTimeout(() => { if (w.bubble === node) sayOff(w); }, ms || 2600);
  }
  function sayOff(w) { if (w.bubble) { const b = w.bubble; w.bubble = null; b.classList.add('out'); setTimeout(() => b.remove(), 250); } }
  function bye(w) { sayOff(w); w.el.remove(); if (busy === w) busy = null; }

  /* ---------- 环卫大爷 ---------- */
  // 桌面上有什么垃圾：[{ k, x, foot, node }]（舞台坐标，脚踩的地方）
  function garbage() {
    const D = OS.desktop, out = [];
    (D.poopList ? D.poopList() : []).forEach(p => out.push({ k: 'poop', x: p.x - 12, foot: p.foot, node: p.node }));
    const sm = OS.smudges ? OS.smudges.list() : [];
    if (sm.length) out.push({ k: 'smudge', x: OS.clamp(sm.reduce((a, m) => a + m.x, 0) / sm.length, 40, st().W - 40), foot: base() });
    if (D.signCut && D.signCut()) { const f = D.signFoot(); out.push({ k: 'sign', x: f.x - 10, foot: f.y }); }
    if (OS.cdTray && OS.cdTray.hasCup && OS.cdTray.hasCup()) out.push({ k: 'cup', x: st().W - st().insets.r - 70, foot: base() });
    return out;
  }
  async function cleaner(items) {
    const w = busy = spawn('cleaner', -30, base());
    items.sort((a, b) => a.x - b.x);
    let carrying = false, saidPoop = false;
    for (const it of items) {
      if (!w.el.isConnected) return;
      await walkTo(w, it.x, it.foot, carrying ? CF.carry : CF.walk);
      if (it.k === 'poop') {
        await act(w, CF.sweep, 1000);
        if (OS.desktop.removePoop) OS.desktop.removePoop(it.node);
        if (!saidPoop) { saidPoop = true; say(w, L.poop); }
        OS.sound.play('squish');
      } else if (it.k === 'smudge') {
        await act(w, CF.breathe, 700);
        await act(w, CF.wipe, 1100);
        if (OS.smudges) OS.smudges.wipe();
        say(w, L.smudge);
      } else if (it.k === 'sign') {
        await act(w, CF.talk, 500);
        if (OS.desktop.takeSign) OS.desktop.takeSign();
        carrying = true;
        say(w, L.sign);
        OS.sound.play('thud');
      } else if (it.k === 'cup') {
        if (OS.cdTray && OS.cdTray.takeCup) OS.cdTray.takeCup();
        await act(w, CF.drink, 1400);
        say(w, L.cola);
      }
      await wait(300);
    }
    // 路过中毒的图标：瞅一眼
    const sick = OS.desktop.layer().querySelector('.dicon.hk-inf, .dicon.bitten');
    if (sick && w.el.isConnected) {
      const x = parseFloat(sick.style.left) + 38, foot = Math.min(base(), parseFloat(sick.style.top) + 62);
      await walkTo(w, x, foot, carrying ? CF.carry : CF.walk);
      await act(w, CF.no, 900);
      say(w, L.virus);
      await wait(1200);
    }
    if (!w.el.isConnected) return;
    if (!carrying) { await act(w, CF.talk, 400); say(w, L.bye); await wait(1300); }
    else say(w, L.bye);
    await walkTo(w, st().W + 40, base(), carrying ? CF.carry : CF.walk, 80);
    bye(w);
  }

  /* ---------- 刷墙师傅 ---------- */
  async function painter() {
    if (!ensureMask()) return;
    ensurePaint();
    const s0 = pickStroke();
    if (!s0) return;
    const left = Math.random() < 0.5;
    const a = wpToStage(s0.x, s0.y), b = wpToStage(s0.x + s0.w, s0.y);
    const foot = Math.min(base(), a.y + 8);
    const w = busy = spawn('painter', left ? -30 : st().W + 30, base());
    await walkTo(w, a.x - 6, foot, PF.walk);
    if (!w.el.isConnected) return;
    w.flip = false;
    await act(w, PF.dip, 600);
    // 一边推滚筒一边往右走，漆一截截露出来
    const N = 16;
    for (let i = 1; i <= N && w.el.isConnected; i++) {
      w.x = a.x - 6 + (b.x - a.x) * i / N; place(w);
      frame(w, PF.roll[i % 2]);
      if (i % 4 === 1) OS.sound.play('squish');
      drawView(strokeCanvas(s0, i / N));
      await wait(85);
    }
    if (!w.el.isConnected) return;
    paint.getContext('2d').drawImage(strokeCanvas(s0, 1), 0, 0);
    strokes++;
    OS.bootFix.add('bsod-greenpaint', FIX);   // 跟蓝屏那条同一个，重启时只显示一行
    drawView();
    say(w, OS.pick(L.paint));
    await act(w, Math.random() < 0.5 ? PF.thumb : PF.sweat, 900);
    const c = coverage();
    if (c >= 0.9) {
      await act(w, PF.smell, 900);
      bye(w);
      setTimeout(() => { if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD); }, 600);
      return;
    }
    if (c >= 0.8 && warned < 2) { warned = 2; OS.ui.notify({ title: L.warnTitle, text: L.most, icon: 'warn', replace: true }); }
    else if (c >= 0.5 && warned < 1) { warned = 1; OS.ui.notify({ title: L.warnTitle, text: L.half, icon: 'warn', replace: true }); }
    await walkTo(w, left ? st().W + 40 : -40, base(), PF.walkDrip, 80);
    bye(w);
  }

  /* ================= 刷新 ================= */
  function refresh() {
    if (OS.boot.state !== 'desktop') return;
    if (busy && busy.el.isConnected) {   // 正在干活又点：扭头说一句，这次不算
      const w = busy;
      frame(w, w.kind === 'cleaner' ? CF.talk[0] : PF.annoyed[0]);
      say(w, L.hurry, 1800);
      return;
    }
    const items = garbage();
    if (items.length) cleaner(items); else painter();
  }
  // 重启：干活的人走了，绿漆全没了
  OS.on('desktop:reset', () => {
    if (busy) { sayOff(busy); busy.el.remove(); busy = null; }
    document.querySelectorAll('.worker, .worker-say').forEach(n => n.remove());
    if (paint) paint.getContext('2d').clearRect(0, 0, PW, PH);
    strokes = 0; warned = 0;
    drawView();
  });

  OS.workers = {
    refresh, busy: () => !!(busy && busy.el.isConnected),
    // 测试用：不走路，直接刷一道 ／ 现在刷了多少
    paintNow: () => { if (!ensureMask()) return -1; ensurePaint(); const s0 = pickStroke(); if (!s0) return coverage(); paint.getContext('2d').drawImage(strokeCanvas(s0, 1), 0, 0); strokes++; drawView(); return coverage(); },
    coverage
  };
})();
