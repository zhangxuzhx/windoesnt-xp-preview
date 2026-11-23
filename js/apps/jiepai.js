/* 接牌（XP 纸牌 → 接牌；开始 ▸ 所有程序 ▸ 游戏）——高尔夫的玩法，样子照原版纸牌
   2026-11-23 改版（接牌-创意.md 第八部分）：右上三个格子
   - 七列各 5 张，全是明牌；左上一叠 17 张；右上三个格子，一开始全空
   - 空格子什么牌都能放；有牌的格子，比它最上面那张大一或小一（不管花色）才能接上去
   - 七列最外面那张、左上翻出来那叠最上面那张，规矩一样：拖到哪个格子就接哪个；双击：只有一个格子能接就自动过去，
     好几个格子能接，那几个格子闪一下，点一个
   - 下面接不动了，点左上翻一张，翻到它右边那格摞着；翻出来的也得接上去，接走了下面那张露出来；翻完不能重来
   - 七列接光就赢
   - 选项：转圈（K 和 A 能接上，默认）／ 不转圈；计分：标准 ／ 拉斯维加斯 ／ 不计分；计时、状态栏、累计得分
   - 每局发牌前电脑先试一遍，只发能赢的
   - 标准计分：七列接走一张 +5，一口气连着接每张多 5（5、10、15……），翻牌就断；赢了左上剩一张 +20；计时每 10 秒 −2，赢了按用时加奖励（照原版）
     拉斯维加斯：每局先扣 $52，七列接走一张 $5
   - 赢了：瀑布落牌，三个格子轮流往外弹；点台布多弹一张，按任意键停
   - 蓝屏：瀑布落牌时狂点台布，牌把台布铺满 → CARD_WATERFALL_OVERFLOW
   - 牌面、牌背在 cards.js（几个牌类游戏共用） */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.solitaire;
  const C = OS.cards;

  /* ================= 文案 ================= */
  const NAME = '接牌';
  const L = {
    menus: ['游戏(G)', '帮助(H)'],
    deal: '发牌　F2', undo: '撤消', back: '牌背…', options: '选项…', quit: '退出',
    help: '目录', about: '关于接牌',
    helpText: '接牌\n\n七列牌全摊开了，看准了再接。\n右上有三个格子：空格子什么牌都能放；有牌的格子，比它最上面那张大一或小一，不管花色，就能接上去。\n下面接不动了，点左上翻一张，翻出来的也得接上去。\n七列接光就赢。',
    aboutText: '接牌\n版本 2003\n一张接一张。\n(C) ' + OS.YEAR + ' 无聊科技',
    optTitle: '选项', wrapLegend: '转圈', wrapOn: 'K 和 A 能接上', wrapOff: 'K 和 A 接不上',
    scoreLegend: '计分', std: '标准', vegas: '拉斯维加斯', none: '不计分',
    timed: '计时游戏', status: '显示状态栏', cumulative: '累计得分', ok: '确定', cancel: '取消',
    score: '得分: ', time: '时间: ',
    again: '再发一局吗？', yes: '是', no: '否'
  };
  const BSOD = { id: 'solitaire', name: 'CARD_WATERFALL_OVERFLOW', text: '瀑布落牌落进了内存，堵死了。' };
  const BSOD_CLICKS = 40;   // 瀑布落牌时多弹这么多张就铺满了

  /* ================= 存档 ================= */
  const KEY = 'jiepai';
  const S = Object.assign({ wrap: true, scoring: 'std', timed: true, status: true, cumulative: false, bank: 0 }, OS.save.get(KEY, {}));
  const persist = () => OS.save.set(KEY, S);

  /* ================= 规则 ================= */
  const PILES = 3;
  const fits = (a, b, wrap) => { const d = Math.abs(a - b); return d === 1 || (wrap && d === 12); };
  // 这副牌能不能接光（只看点数；算太久就当不知道，换一副）：1 能 ／ 0 不能 ／ -1 算不完
  function solvable(cols, stock, wrap) {
    const H = [5, 5, 5, 5, 5, 5, 5], P = [0, 0, 0], W = [], seen = new Set();
    let n = 0, sp = 0;
    const ok = (a, t) => !t || fits(a, t, wrap);
    function go(left) {
      if (!left) return true;
      if (++n > 60000) throw new Error('long');
      const k = H.join('') + P.slice().sort((a, b) => a - b).join(',') + '|' + sp + '|' + W.join(',');
      if (seen.has(k)) return false;
      seen.add(k);
      for (let c = 0; c < 7; c++) {
        if (!H[c]) continue;
        const a = cols[c][H[c] - 1].r, tried = new Set();
        for (let p = 0; p < PILES; p++) {
          if (tried.has(P[p]) || !ok(a, P[p])) continue;
          tried.add(P[p]);
          const o = P[p]; P[p] = a; H[c]--;
          const r = go(left - 1);
          H[c]++; P[p] = o;
          if (r) return true;
        }
      }
      if (W.length) {
        const a = W[W.length - 1], tried = new Set();
        for (let p = 0; p < PILES; p++) {
          if (tried.has(P[p]) || !ok(a, P[p])) continue;
          tried.add(P[p]);
          const o = P[p]; P[p] = a; W.pop();
          const r = go(left);
          W.push(a); P[p] = o;
          if (r) return true;
        }
      }
      if (sp < stock.length) { W.push(stock[sp++].r); const r = go(left); sp--; W.pop(); if (r) return true; }
      return false;
    }
    try { return go(35) ? 1 : 0; } catch (_) { return -1; }
  }
  function shuffle() {
    const d = [];
    for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ r, s, id: s * 13 + r });
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = d[i]; d[i] = d[j]; d[j] = t; }
    const cols = [];
    for (let c = 0; c < 7; c++) cols.push(d.slice(c * 5, c * 5 + 5));
    return { cols, stock: d.slice(35) };
  }

  /* ================= 窗口 ================= */
  let win = null, ui = null, G = null;
  const onBack = () => { if (G && !G.busy && !fall) render(); };   // 换了牌背，左上那叠跟着换
  app.open = function () {
    if (win && !win.isClosed) { if (win.minimized) OS.wm.restore(win); OS.wm.focus(win); return win; }
    ui = {};
    ui.table = el('div', { class: 'jp-table' });
    ui.status = el('div', { class: 'jp-status' });
    ui.box = el('div', { class: 'jp-win' }, [OS.ui.menuBar(L.menus, menuFor, 'jp-mbar'), ui.table, ui.status]);
    win = OS.wm.open({ title: NAME, icon: 'solitaire', width: 462, content: ui.box, appId: app.id, maximizable: false, center: true,
      help: () => OS.ui.dialog({ title: L.help, icon: 'help', text: L.helpText }),   // 标题栏的 ？：跟 帮助 ▸ 目录 一样
      onClose: () => {
        stopTimer(); stopFall(true);
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('pointermove', onMove, true);
        document.removeEventListener('pointerup', onUp, true);
        document.removeEventListener('pointercancel', onUp, true);
        OS.off('cards:back', onBack);
        win = null; ui = null; G = null; drag = null;
      } });
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('pointercancel', onUp, true);
    OS.on('cards:back', onBack);
    ui.table.addEventListener('pointerdown', onDown);
    deal();
    return win;
  };
  function onKey(e) {
    if (!win || win.isClosed || OS.wm.active !== win) return;
    if (fall) { e.preventDefault(); stopFall(); return; }   // 瀑布落牌：按任意键停
    if (e.key === 'F2') { e.preventDefault(); deal(); }
  }

  /* ---------- 发牌 ---------- */
  function deal() {
    stopTimer(); stopFall(true);
    let d = shuffle();
    for (let k = 0; k < 40 && solvable(d.cols, d.stock, S.wrap) !== 1; k++) d = shuffle();   // 只发能赢的
    G = { cols: d.cols, stock: d.stock, sp: 0, waste: [], piles: [[], [], []], cand: null, combo: 0, score: 0, time: 0, started: false, timer: 0, over: '', undo: null, busy: false };
    if (S.scoring === 'vegas') {
      if (S.cumulative) { S.bank -= 52; persist(); G.score = S.bank; } else G.score = -52;
    }
    render();
  }

  /* ---------- 摆法：桌子宽度量出来，七列平均分；上面一排：左上那叠、翻出来的、（空两格）、三个格子 ---------- */
  const CW = C.W, CH = C.H, TOP = 8, FAN = 14;
  const gap = () => (ui.table.clientWidth - 7 * CW) / 8;
  const colX = i => Math.round(gap() + i * (CW + gap()));
  const colY = 8 + CH + 12;
  const slotPos = k => (k === 'stock' ? { x: colX(0), y: TOP } : k === 'waste' ? { x: colX(1), y: TOP } : { x: colX(4 + k), y: TOP });   // k = 0、1、2：三个格子
  const cardPos = (c, i) => ({ x: colX(c), y: colY + i * FAN });

  function place(n, p) { n.style.left = p.x + 'px'; n.style.top = p.y + 'px'; return n; }
  // hide：哪一格最上面那张先不画（有一张正在飞过去）：'waste' 或格子号
  function render(hide) {
    if (!ui || !G) return;
    const t = ui.table;
    t.textContent = '';
    // 左上：剩下的牌；翻完了是红叉
    const left = G.stock.length - G.sp;
    const st = place(el('div', { class: 'jp-slot jp-stock' + (left ? '' : ' x') }), slotPos('stock'));
    t.appendChild(st);
    if (left) {
      if (left > 8) t.appendChild(place(C.back(), { x: slotPos('stock').x + 2, y: TOP + 2 })).classList.add('jp-under');
      const b = place(C.back(), slotPos('stock'));
      b.classList.add('jp-deck');
      t.appendChild(b);
    }
    // 翻出来的：摞着，最上面那张能拖、能双击
    t.appendChild(place(el('div', { class: 'jp-slot jp-wslot' }), slotPos('waste')));
    const wN = G.waste.length - (hide === 'waste' ? 1 : 0);
    if (wN > 1) t.appendChild(place(C.face(G.waste[wN - 2]), slotPos('waste')));
    if (wN > 0) {
      const n = place(C.face(G.waste[wN - 1]), slotPos('waste'));
      if (!G.over && hide !== 'waste') { n.classList.add('jp-top'); n.dataset.waste = '1'; }
      t.appendChild(n);
    }
    // 右上：三个格子（好几个格子能接时，那几个闪着等你点）
    G.piles.forEach((pile, k) => {
      const cand = !!(G.cand && G.cand.piles.indexOf(k) >= 0);
      const slot = place(el('div', { class: 'jp-slot jp-pile' + (cand ? ' cand' : '') }), slotPos(k));
      slot.dataset.pile = k;
      t.appendChild(slot);
      const n = pile.length - (hide === k ? 1 : 0);
      if (n > 0) { const c = place(C.face(pile[n - 1]), slotPos(k)); c.dataset.pile = k; if (cand) c.classList.add('jp-cand'); t.appendChild(c); }
    });
    // 七列
    G.cols.forEach((col, c) => col.forEach((card, i) => {
      const n = place(C.face(card), cardPos(c, i));
      if (i === col.length - 1 && !G.over) { n.classList.add('jp-top'); n.dataset.col = c; if (G.cand && G.cand.src.col === c) n.classList.add('jp-pick'); }
      t.appendChild(n);
    }));
    if (G.cand && G.cand.src.waste) { const w = t.querySelector('[data-waste]'); if (w) w.classList.add('jp-pick'); }
    paintStatus();
  }
  function paintStatus() {
    if (!ui) return;
    ui.status.style.display = S.status ? '' : 'none';
    const money = v => (v < 0 ? '-$' : '$') + Math.abs(v);
    const parts = [];
    if (S.scoring === 'std') parts.push(L.score + G.score);
    if (S.scoring === 'vegas') parts.push(L.score + money(G.score));
    if (S.timed) parts.push(L.time + G.time);
    ui.status.textContent = parts.join('　　');
    if (win) OS.wm.keepInside(win);
  }

  /* ---------- 一张牌飞过去（接走、翻牌） ---------- */
  function fly(card, from, to, hide, done) {
    G.busy = true;
    render(hide);
    const n = place(C.face(card), from);
    n.classList.add('jp-fly');
    ui.table.appendChild(n);
    void n.offsetWidth;
    place(n, to);
    setTimeout(() => {
      if (!G) return;
      G.busy = false;
      render();
      if (done) done();
    }, 160);
  }

  /* ---------- 玩 ---------- */
  function startTimer() {
    if (G.started) return;
    G.started = true;
    G.timer = setInterval(() => {
      if (!G || G.over) return;
      G.time++;
      if (S.timed && S.scoring === 'std' && G.time % 10 === 0) G.score = Math.max(0, G.score - 2);
      paintStatus();
    }, 1000);
  }
  function stopTimer() { if (G && G.timer) { clearInterval(G.timer); G.timer = 0; } }
  const snap = () => ({ cols: G.cols.map(c => c.slice()), sp: G.sp, waste: G.waste.slice(), piles: G.piles.map(p => p.slice()), combo: G.combo, score: G.score, bank: S.bank });
  // src：{ col: 第几列 } 或 { waste: true }（左上翻出来那叠最上面那张）
  const topOf = src => (src.waste ? G.waste[G.waste.length - 1] : G.cols[src.col][G.cols[src.col].length - 1]);
  const fitsPile = (card, k) => { const p = G.piles[k]; return !p.length || fits(card.r, p[p.length - 1].r, S.wrap); };
  const targets = card => [0, 1, 2].filter(k => fitsPile(card, k));
  function play(src, k, dropped) {
    if (!G || G.over || G.busy) return false;
    const card = topOf(src);
    if (!card || !fitsPile(card, k)) return false;
    startTimer();
    G.undo = snap();
    G.cand = null;
    const from = src.waste ? slotPos('waste') : cardPos(src.col, G.cols[src.col].length - 1);
    if (src.waste) G.waste.pop(); else G.cols[src.col].pop();
    G.piles[k].push(card);
    if (!src.waste) {   // 七列接走的才算分、才算连着；翻出来的接上去不算分，也不打断
      G.combo++;
      if (S.scoring === 'std') G.score += 5 * G.combo;
      if (S.scoring === 'vegas') { G.score += 5; if (S.cumulative) { S.bank += 5; persist(); } }
    }
    if (dropped) { render(); checkWin(); } else fly(card, from, slotPos(k), k, checkWin);
    return true;
  }
  // 双击：只有一个格子能接就过去；好几个能接，那几个格子闪着等你点
  function auto(src) {
    const card = topOf(src);
    if (!card) return;
    const ks = targets(card);
    if (!ks.length) { OS.sound.play('ding'); return; }
    if (ks.length === 1) { play(src, ks[0]); return; }
    G.cand = { src, piles: ks };
    render();
  }
  function flip() {
    if (!G || G.over || G.busy || G.sp >= G.stock.length) return;
    startTimer();
    G.undo = snap();
    G.cand = null;
    const card = G.stock[G.sp++];
    G.waste.push(card);
    G.combo = 0;
    fly(card, slotPos('stock'), slotPos('waste'), 'waste');
  }
  function undo() {
    if (!G || G.over || G.busy || !G.undo) return;
    const u = G.undo;
    Object.assign(G, { cols: u.cols, sp: u.sp, waste: u.waste, piles: u.piles, combo: u.combo, score: u.score, undo: null, cand: null });
    if (S.scoring === 'vegas' && S.cumulative) { S.bank = u.bank; persist(); }
    render();
  }
  function checkWin() {
    if (!G || G.over || G.cols.some(c => c.length)) return;
    G.over = 'win';
    stopTimer();
    if (S.scoring === 'std') {
      G.score += 20 * (G.stock.length - G.sp);
      if (S.timed && G.time >= 30) G.score += Math.floor(700000 / G.time);
    }
    render();
    setTimeout(waterfall, 250);
  }

  /* ---------- 拖、点、双击 ---------- */
  let drag = null, lastTap = { id: -1, t: 0 };
  function onDown(e) {
    if (!G || G.busy || fall) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // 正等着你挑格子：点闪着的那个就接上去；点别处就算了
    if (G.cand) {
      const pn = e.target.closest('[data-pile]'), k = pn ? +pn.dataset.pile : -1, c = G.cand;
      G.cand = null;
      if (c.piles.indexOf(k) >= 0) { play(c.src, k); return; }
      render();
    }
    const n = e.target.closest('.jp-top, .jp-stock, .jp-deck, .jp-under');
    if (!n) return;
    const p = OS.stage.toLocal(e.clientX, e.clientY);
    const src = n.dataset.col != null ? { col: +n.dataset.col } : n.dataset.waste ? { waste: true } : null;
    drag = { id: e.pointerId, n, p0: p, x0: parseFloat(n.style.left), y0: parseFloat(n.style.top), moved: false, src };
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id || !drag.src) return;
    const p = OS.stage.toLocal(e.clientX, e.clientY), dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
    if (!drag.moved && dx * dx + dy * dy < 16) return;
    drag.moved = true;
    drag.n.classList.add('jp-drag');
    place(drag.n, { x: drag.x0 + dx, y: drag.y0 + dy });
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!G || e.type !== 'pointerup') { if (d.moved) render(); return; }
    if (d.moved) {
      // 牌心落在哪个格子附近就接到哪个；接不上就弹回去
      const x = parseFloat(d.n.style.left) + CW / 2, y = parseFloat(d.n.style.top) + CH / 2;
      const k = [0, 1, 2].find(i => { const pp = slotPos(i); return x > pp.x - 14 && x < pp.x + CW + 14 && y > pp.y - 16 && y < pp.y + CH + 16; });
      if (k != null && play(d.src, k, true)) return;
      d.n.classList.remove('jp-drag');
      d.n.classList.add('jp-back');
      place(d.n, { x: d.x0, y: d.y0 });
      setTimeout(render, 130);
      return;
    }
    if (!d.src) { flip(); return; }
    // 双击（双击速度照控制面板）
    const card = topOf(d.src), now = Date.now();
    if (!card) return;
    if (lastTap.id === card.id && now - lastTap.t < OS.dblMs()) { lastTap = { id: -1, t: 0 }; auto(d.src); return; }
    lastTap = { id: card.id, t: now };
  }

  /* ---------- 赢了：瀑布落牌 ---------- */
  // 三个格子的牌轮流一张张弹出来，在台布上蹦，拖一串影子；点台布多弹一张，按任意键停
  let fall = null;
  const imgCache = {};
  function cardImg(card) {
    const k = card.r + '-' + card.s;
    if (imgCache[k]) return imgCache[k];
    const svg = C.faceSvg(card).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="' + CW + '" height="' + CH + '" ')
      .replace(/(<svg[^>]*>)/, '$1<rect x=".5" y=".5" width="' + (CW - 1) + '" height="' + (CH - 1) + '" rx="3.5" fill="#fff" stroke="#000"/>');
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    imgCache[k] = img;
    return img;
  }
  function waterfall() {
    if (!ui || !G || G.over !== 'win') return;
    const t = ui.table, w = t.clientWidth, h = t.clientHeight;
    const k = Math.min(3, (window.devicePixelRatio || 1) * (OS.stage.scale || 1));
    const cv = el('canvas', { class: 'jp-fall' });
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    t.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.scale(k, k);
    const queue = [], piles = G.piles.map(p => p.slice());
    while (piles.some(p => p.length)) piles.forEach((p, k) => { if (p.length) queue.push({ card: p.pop(), k }); });
    queue.forEach(q => cardImg(q.card));
    fall = { cv, ctx, queue, live: [], frame: 0, extra: 0, raf: 0, w, h };
    const launch = (card, k) => {
      const pp = slotPos(k == null ? 1 : k);
      fall.live.push({ img: cardImg(card), x: pp.x, y: pp.y, vx: (Math.random() < 0.6 ? -1 : 1) * (2.5 + Math.random() * 4), vy: -Math.random() * 6 });
    };
    fall.launch = launch;
    const step = () => {
      if (!fall) return;
      fall.frame++;
      if (fall.queue.length && (fall.frame % 34 === 1 || !fall.live.length)) { const q = fall.queue.shift(); launch(q.card, q.k); }
      fall.live.forEach(c => {
        c.vy += 0.45; c.x += c.vx; c.y += c.vy;
        if (c.y > h - CH) { c.y = h - CH; c.vy = -c.vy * 0.78; if (Math.abs(c.vy) < 2) c.vy = -5 - Math.random() * 3; }
        if (c.img.complete) ctx.drawImage(c.img, c.x, c.y, CW, CH);
      });
      fall.live = fall.live.filter(c => c.x > -CW && c.x < w);
      if (!fall.queue.length && !fall.live.length) { stopFall(); return; }
      fall.raf = requestAnimationFrame(step);
    };
    fall.raf = requestAnimationFrame(step);
    // 点台布：多弹一张；铺满了就蓝屏
    cv.addEventListener('pointerdown', () => {
      if (!fall) return;
      fall.extra++;
      launch({ r: 1 + Math.floor(Math.random() * 13), s: Math.floor(Math.random() * 4) });
      if (fall.extra === BSOD_CLICKS) {
        fall.dead = true;
        setTimeout(() => { if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD); }, 600);
      }
    });
  }
  // quiet：不问"再发一局吗"（发新牌、关窗口时）
  function stopFall(quiet) {
    if (!fall) return;
    const f = fall;
    fall = null;
    cancelAnimationFrame(f.raf);
    if (quiet || f.dead) { f.cv.remove(); return; }
    OS.ui.dialog({ title: NAME, icon: 'help', text: L.again, buttons: [L.yes, L.no] }).then(v => {
      f.cv.remove();
      if (v === L.yes && win) deal();
    });
  }

  /* ---------- 菜单 ---------- */
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });
  function menuFor(m) {
    if (m === '游戏(G)') return [
      { label: L.deal, action: deal },
      '-',
      { label: L.undo, disabled: !G || !G.undo || !!G.over, action: undo },
      '-',
      { label: L.back, action: () => C.pickBack() },
      { label: L.options, action: optionsDialog },
      '-',
      { label: L.quit, action: () => win && win.close() }
    ];
    return [{ label: L.help, action: say(L.help, 'help', L.helpText) }, '-', { label: L.about, action: say(L.about, 'info', L.aboutText) }];
  }
  // 游戏 ▸ 选项…：照原版的样子；转圈、计分改了就重新发牌
  function optionsDialog() {
    const radio = (name, label, on) => { const i = el('input', { type: 'radio', name }); i.checked = on; return [i, el('label', { class: 'jp-opt' }, [i, el('span', { text: label })])]; };
    const check = (label, on) => { const i = el('input', { type: 'checkbox' }); i.checked = on; return [i, el('label', { class: 'jp-opt' }, [i, el('span', { text: label })])]; };
    const nm = 'jp' + Date.now();
    const [w1, w1l] = radio(nm + 'w', L.wrapOn, S.wrap), [, w2l] = radio(nm + 'w', L.wrapOff, !S.wrap);
    const [s1, s1l] = radio(nm + 's', L.std, S.scoring === 'std'), [s2, s2l] = radio(nm + 's', L.vegas, S.scoring === 'vegas'), [, s3l] = radio(nm + 's', L.none, S.scoring === 'none');
    const [tm, tml] = check(L.timed, S.timed), [sb, sbl] = check(L.status, S.status), [cu, cul] = check(L.cumulative, S.cumulative);
    const ok = el('button', { class: 'xpbtn default', text: L.ok }), no = el('button', { class: 'xpbtn', text: L.cancel });
    const w = OS.wm.open({ title: L.optTitle, width: 270, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'jp-opts' }, [
        el('div', { class: 'jp-orow' }, [
          el('fieldset', { class: 'cp-group' }, [el('legend', { text: L.wrapLegend }), w1l, w2l]),
          el('fieldset', { class: 'cp-group' }, [el('legend', { text: L.scoreLegend }), s1l, s2l, s3l])
        ]),
        el('div', { class: 'jp-ochecks' }, [tml, sbl, cul]),
        el('div', { class: 'dlg-btns' }, [ok, no])
      ]) });
    no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    ok.addEventListener('click', () => {
      OS.sound.play('click');
      const wrap = w1.checked, scoring = s1.checked ? 'std' : s2.checked ? 'vegas' : 'none';
      const redeal = wrap !== S.wrap || scoring !== S.scoring || (cu.checked !== S.cumulative && scoring === 'vegas');
      if (cu.checked && !S.cumulative && scoring === 'vegas' && G && S.scoring === 'vegas') S.bank = G.score;   // 刚勾上累计：从这局的钱接着算
      Object.assign(S, { wrap, scoring, timed: tm.checked, status: sb.checked, cumulative: cu.checked });
      persist();
      w.close();
      if (redeal) deal(); else paintStatus();
    });
  }
})();
