/* 蜘蛛合牌（XP 蜘蛛纸牌 → 蜘蛛合牌；开始 ▸ 所有程序 ▸ 游戏）——样子照原版蜘蛛纸牌
   - 合牌：拖一列最上面那张到另一列最上面同花色、加起来正好 13 的牌上，两张合成一张 K 飞到左下角
   - 接牌照原版：放到大一点的牌上，不管花色；同花色连着的一溜能一起拖；扣着的牌露出来自动翻开
   - 发出来、翻出来的 K 只能挪到空列；一列就剩它一张时自己飞走（原版"凑齐 K 到 A 一溜飞走"不要了）
   - 右下角发牌，有空列不能发（桌上不到 10 张时可以）；104 张清光就赢，左下角一共 56 张 K
   - 难度：单色 ／ 双色 ／ 四色；每局都是电脑先解开过的（spider-data.js）
   - 计分：开局 500，每一步 −1，飞走一张 K +10；中间下面的框：分数、操作；框和［提示(M)］按钮都是"显示可行的操作"
   - 关窗口自动存，下次打开问接着玩吗；赢了放烟花
   - 蓝屏：10 秒内"显示可行的操作"20 下 → SPIDER_BRAIN_TANGLED */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.spider;
  const C = OS.cards;

  /* ================= 文案 ================= */
  const NAME = '蜘蛛合牌';
  const L = {
    menus: ['游戏(G)', '帮助(H)'],
    newGame: '新游戏　F2', restart: '重新开始这局', undo: '撤消　Ctrl+Z', deal: '发牌　D', hint: '显示可行的操作　M',
    level: '难度…', stats: '统计信息…', back: '牌背…', quit: '退出',
    help: '目录', about: '关于蜘蛛合牌',
    helpText: '蜘蛛合牌\n\n把一张牌拖到同花色的牌上，两张加起来正好 13，就合成一张 K 飞走。A 算 1，J、Q、K 算 11、12、13。\n牌也能接：放到大一点的牌上，不管花色；同花色连着的一溜能一起拖。\nK 是拦路的：只能挪到空列，一列就剩它一张时自己飞走。\n接不下去了点右下角发牌。牌全飞走就赢。',
    aboutText: '蜘蛛合牌\n版本 2003\n凑个 13，合个 K。\n(C) ' + OS.YEAR + ' 无聊科技',
    score: '分数: ', moves: '操作: ', hintBtn: '提示(M)',
    levelTitle: '难度', levelAsk: '选择难度：', levels: { 1: '初级：单色', 2: '中级：双色', 4: '高级：四色' }, ok: '确定', cancel: '取消',
    noDeal: '每一列都得有牌才能发牌。', noMove: '没有可行的操作了。',
    resume: '接着玩上次那局吗？', yes: '是', no: '否',
    win: s => '恭喜，你赢了！\n分数：' + s + '\n再玩一局吗？',
    statsTitle: '统计信息', clear: '清除',
    statsText: (lv, t) => '难度：' + L.levels[lv] + '\n最高分：' + t.best + '\n胜：' + t.won + ' 局　负：' + t.lost + ' 局　胜率：' +
      (t.won + t.lost ? Math.round(t.won / (t.won + t.lost) * 100) : 0) + '%\n连胜：最多 ' + t.bestW + ' 局，现在 ' + Math.max(0, t.cur) + ' 局'
  };
  const BSOD = { id: 'spider', name: 'SPIDER_BRAIN_TANGLED', text: '蜘蛛帮你想了太多步，脑子打了个结。' };

  /* ================= 存档 ================= */
  const KEY = 'spider', GAME_KEY = 'spiderGame';
  const S = Object.assign({ level: null }, OS.save.get(KEY, {}));
  S.stats = S.stats || {};
  const stat = lv => (S.stats[lv] = Object.assign({ best: 0, won: 0, lost: 0, bestW: 0, cur: 0 }, S.stats[lv] || {}));
  const persist = () => OS.save.set(KEY, S);

  /* ================= 一副牌：局号 → 牌（跟出题的 spider_sim.js 一模一样） ================= */
  function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function deal(suits, seed) {
    const rand = rng(seed), d = [];
    for (let k = 0; k < 8; k++) { const s = k % suits; for (let r = 1; r <= 13; r++) d.push({ r, s, id: d.length }); }
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = d[i]; d[i] = d[j]; d[j] = t; }
    const cols = [];
    let p = 0;
    for (let i = 0; i < 10; i++) { const n = i < 4 ? 6 : 5; cols.push({ cards: d.slice(p, p + n), down: n - 1 }); p += n; }
    return { cols, stock: d.slice(p) };
  }
  const pickSeed = suits => { const list = (OS.spiderData || {})[suits]; return list && list.length ? list[Math.floor(Math.random() * list.length)] : 1 + Math.floor(Math.random() * 100000); };

  /* ================= 窗口 ================= */
  let win = null, ui = null, G = null;
  const onBack = () => { if (G && !G.busy && !fw) render(); };
  app.open = function () {
    if (win && !win.isClosed) { if (win.minimized) OS.wm.restore(win); OS.wm.focus(win); return win; }
    ui = {};
    ui.table = el('div', { class: 'sp-table' });
    ui.box = el('div', { class: 'sp-win' }, [OS.ui.menuBar(L.menus, menuFor, 'sp-mbar'), ui.table]);
    win = OS.wm.open({ title: NAME, icon: 'spider', width: 462, content: ui.box, appId: app.id, maximizable: false, center: true,
      onClose: () => {
        autosave();
        stopFireworks();
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
    start();
    return win;
  };
  // 打开：上次没打完就问接着玩吗；第一次玩先选难度
  function start() {
    const saved = OS.save.get(GAME_KEY, null);
    if (saved) {
      OS.ui.dialog({ title: NAME, icon: 'help', text: L.resume, buttons: [L.yes, L.no] }).then(v => {
        if (!win) return;
        if (v === L.yes) { load(saved); return; }
        OS.save.remove(GAME_KEY);
        countLoss(saved.suits);
        newGame();
      });
      return;
    }
    if (S.level == null) { levelDialog(true); return; }
    newGame();
  }
  function onKey(e) {
    if (!win || win.isClosed || OS.wm.active !== win || fw) return;
    if (e.key === 'F2') { e.preventDefault(); newGame(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); }
    else if (!e.ctrlKey && !e.altKey && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); dealRow(); }
    else if (!e.ctrlKey && !e.altKey && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); hint(); }
  }

  /* ---------- 开局 ／ 存 ／ 读 ---------- */
  function newGame(seed) {
    abandon();
    const suits = S.level || 1;
    seed = seed || pickSeed(suits);
    const d = deal(suits, seed);
    G = { suits, seed, cols: d.cols, stock: d.stock, sp: 0, ks: [], score: 500, moves: 0, hist: [], over: '', moved: false, busy: false, hidden: null, hintI: 0 };
    OS.save.remove(GAME_KEY);
    render();
  }
  function abandon() { if (G && G.moved && !G.over) { countLoss(G.suits); OS.save.remove(GAME_KEY); } }
  const pack = c => [c.r, c.s, c.id];
  const unpack = a => ({ r: a[0], s: a[1], id: a[2] });
  function autosave() {
    if (!G) return;
    if (!G.moved || G.over) { OS.save.remove(GAME_KEY); return; }
    OS.save.set(GAME_KEY, { suits: G.suits, seed: G.seed, cols: G.cols.map(c => ({ cards: c.cards.map(pack), down: c.down })), stock: G.stock.map(pack), sp: G.sp, ks: G.ks.map(pack), score: G.score, moves: G.moves });
  }
  function load(s) {
    G = { suits: s.suits, seed: s.seed, cols: s.cols.map(c => ({ cards: c.cards.map(unpack), down: c.down })), stock: s.stock.map(unpack), sp: s.sp, ks: s.ks.map(unpack),
      score: s.score, moves: s.moves, hist: [], over: '', moved: true, busy: false, hidden: null, hintI: 0 };
    render();
  }

  /* ---------- 摆法 ---------- */
  const CW = 42, CH = 56, TOPY = 4;
  const TW = () => ui.table.clientWidth, TH = () => ui.table.clientHeight;
  const gap = () => (TW() - 10 * CW) / 11;
  const colX = c => Math.round(gap() + c * (CW + gap()));
  const BY = () => TH() - CH - 4;
  // 一列太长：扣着的、翻开的牌一起挤紧
  function fans(col) {
    const n = col.cards.length, up = n - col.down;
    let fd = 4, fu = 13;
    const avail = BY() - 6 - TOPY, need = col.down * fd + Math.max(0, up - 1) * fu + CH;
    if (need > avail) { const k = (avail - CH) / (col.down * fd + Math.max(0, up - 1) * fu); fd *= k; fu *= k; }
    return { fd, fu };
  }
  function cardY(c, i) { const col = G.cols[c], f = fans(col); return TOPY + Math.min(i, col.down) * f.fd + Math.max(0, i - col.down) * f.fu; }
  const kPos = i => { const n = Math.max(1, G.ks.length), o = n > 1 ? Math.min(3, (150 - CW) / (n - 1)) : 0; return { x: 4 + i * o, y: BY() }; };
  const stockLeft = () => Math.ceil((G.stock.length - G.sp) / 10);
  const stockPos = i => ({ x: TW() - 4 - CW - (stockLeft() - 1 - i) * 6, y: BY() });
  const place = (n, x, y) => { n.style.left = x + 'px'; n.style.top = y + 'px'; return n; };
  const face = card => { const n = C.face(card); if (G.hidden && G.hidden.has(card.id)) n.style.visibility = 'hidden'; return n; };

  function render() {
    if (!ui || !G) return;
    const t = ui.table;
    t.textContent = '';
    // 十列
    G.cols.forEach((col, c) => {
      const slot = place(el('div', { class: 'sp-slot' }), colX(c), TOPY);
      slot.dataset.col = c;
      t.appendChild(slot);
      col.cards.forEach((card, i) => {
        const n = place(i < col.down ? C.back() : face(card), colX(c), cardY(c, i));
        n.dataset.col = c; n.dataset.i = i;
        if (i >= col.down) n.classList.add('sp-up');
        t.appendChild(n);
      });
    });
    // 左下角：飞走的 K
    G.ks.forEach((card, i) => { const p = kPos(i); t.appendChild(place(face(card), p.x, p.y)); });
    // 右下角：没发的牌，一叠一叠
    for (let i = 0; i < stockLeft(); i++) { const p = stockPos(i), b = place(C.back(), p.x, p.y); b.classList.add('sp-stock'); t.appendChild(b); }
    // 中间下面：分数、操作；框和按钮都是"显示可行的操作"
    const box = el('div', { class: 'sp-score' }, [el('div', { text: L.score + G.score }), el('div', { text: L.moves + G.moves })]);
    const btn = el('button', { class: 'xpbtn sp-hintbtn', text: L.hintBtn });
    box.dataset.hint = 1; btn.dataset.hint = 1;
    t.appendChild(place(box, Math.round(TW() / 2 - 48), BY()));
    t.appendChild(place(btn, Math.round(TW() / 2 - 48), BY() + 36));
  }

  /* ---------- 规则 ---------- */
  function runStart(c) {
    const col = G.cols[c], a = col.cards;
    if (!a.length) return 0;
    let k = a.length - 1;
    while (k - 1 >= col.down && a[k - 1].s === a[k].s && a[k - 1].r === a[k].r + 1) k--;
    return k;
  }
  const tableCount = () => G.cols.reduce((s, c) => s + c.cards.length, 0);
  const canDeal = () => G.sp < G.stock.length && (G.cols.every(c => c.cards.length) || tableCount() < 10);
  const mergeOk = (a, b) => a && b && a.s === b.s && a.r + b.r === 13;
  const snap = () => { G.hist.push({ cols: G.cols.map(c => ({ cards: c.cards.slice(), down: c.down })), sp: G.sp, ks: G.ks.slice(), score: G.score }); G.moved = true; };
  const flip = c => { const col = G.cols[c]; if (!col.cards.length) col.down = 0; else if (col.down >= col.cards.length) col.down = col.cards.length - 1; };
  const step = () => { G.score = Math.max(0, G.score - 1); G.moves++; G.hintI = 0; };

  // 把 a 列第 i 张起的一溜放到 b 列（合牌、接牌、空列）；不行返回 false
  function tryMove(a, i, b) {
    if (a === b || G.busy || G.over) return false;
    const A = G.cols[a], B = G.cols[b], head = A.cards[i], top = B.cards[B.cards.length - 1];
    if (!head || i < runStart(a)) return false;
    const single = i === A.cards.length - 1;
    if (single && mergeOk(head, top)) { doMerge(a, b); return true; }
    if (!top || top.r === head.r + 1) { doMove(a, i, b); return true; }
    return false;
  }
  function doMove(a, i, b) {
    snap(); step();
    const run = G.cols[a].cards.splice(i);
    G.cols[b].cards.push(...run);
    flip(a);
    after([]);
  }
  // 合牌：两张一碰，变成一张 K 飞到左下角
  function doMerge(a, b) {
    snap(); step();
    const x = G.cols[a].cards.pop(), y = G.cols[b].cards.pop();
    const from = { x: colX(b), y: cardY(b, G.cols[b].cards.length) };
    flip(a); flip(b);
    const k = { r: 13, s: y.s, id: 1000 + x.id };   // 合出来的 K
    if (S.sound !== false) OS.sound.play('ding');
    after([{ card: k, from }]);
  }
  // 每一步之后：一列就剩一张 K 的飞走；记分；存；赢了没有
  function after(flights) {
    let again = true;
    while (again) {
      again = false;
      G.cols.forEach((col, c) => {
        if (col.cards.length === 1 && col.cards[0].r === 13) {
          flights.push({ card: col.cards[0], from: { x: colX(c), y: cardY(c, 0) } });
          col.cards.pop(); col.down = 0; again = true;
        }
      });
    }
    flights.forEach(f => { G.ks.push(f.card); G.score += 10; });
    autosave();
    if (!flights.length) { render(); checkWin(); return; }
    // K 一张张"唰"地飞到左下角
    G.busy = true;
    G.hidden = new Set(flights.map(f => f.card.id));
    render();
    flights.forEach((f, k) => setTimeout(() => {
      if (!ui) return;
      const n = place(C.face(f.card), f.from.x, f.from.y);
      n.classList.add('sp-fly');
      ui.table.appendChild(n);
      void n.offsetWidth;
      const to = kPos(G.ks.indexOf(f.card));
      place(n, to.x, to.y);
      OS.sound.play('chime');
    }, k * 160));
    setTimeout(() => { if (!G) return; G.busy = false; G.hidden = null; render(); checkWin(); }, (flights.length - 1) * 160 + 340);
  }
  // 发牌：每列一张
  function dealRow() {
    if (!G || G.busy || G.over || fw) return;
    if (G.sp >= G.stock.length) return;
    if (!canDeal()) { OS.ui.dialog({ title: NAME, icon: 'info', text: L.noDeal }); return; }
    snap(); step();
    const from = stockPos(stockLeft() - 1), list = [];
    for (let c = 0; c < 10 && G.sp < G.stock.length; c++) {
      const card = G.stock[G.sp++];
      G.cols[c].cards.push(card);
      flip(c);
      list.push({ card, c });
    }
    G.busy = true;
    G.hidden = new Set(list.map(f => f.card.id));
    render();
    list.forEach((f, k) => setTimeout(() => {
      if (!ui || !G) return;
      const n = place(C.face(f.card), from.x, from.y);
      n.classList.add('sp-fly', 'sp-deal');
      ui.table.appendChild(n);
      void n.offsetWidth;
      place(n, colX(f.c), cardY(f.c, G.cols[f.c].cards.indexOf(f.card)));
      OS.sound.play('click');
    }, k * 45));
    setTimeout(() => { if (!G) return; G.busy = false; G.hidden = null; after([]); }, (list.length - 1) * 45 + 200);
  }
  function undo() {
    if (!G || G.busy || G.over || fw || !G.hist.length) return;
    const h = G.hist.pop();
    Object.assign(G, { cols: h.cols, sp: h.sp, ks: h.ks, score: h.score });
    step();
    autosave();
    render();
  }
  function checkWin() {
    if (!G || G.over || G.sp < G.stock.length || G.cols.some(c => c.cards.length)) return;
    G.over = 'win';
    OS.save.remove(GAME_KEY);
    const t = stat(G.suits);
    t.won++; t.cur = t.cur > 0 ? t.cur + 1 : 1; t.bestW = Math.max(t.bestW, t.cur); t.best = Math.max(t.best, G.score);
    persist();
    fireworks();
  }
  function countLoss(suits) {
    const t = stat(suits);
    t.lost++; t.cur = t.cur < 0 ? t.cur - 1 : -1;
    persist();
  }

  /* ---------- 拖 ---------- */
  let drag = null;
  function onDown(e) {
    if (!G || G.busy || G.over || fw) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('[data-hint]')) { OS.sound.play('click'); hint(); return; }
    if (e.target.closest('.sp-stock')) { dealRow(); return; }
    const n = e.target.closest('.sp-up');
    if (!n) return;
    const c = +n.dataset.col, i = +n.dataset.i;
    if (i < runStart(c)) return;   // 不是同花色连着的一溜，拖不动
    const nodes = [...ui.table.querySelectorAll('.sp-up[data-col="' + c + '"]')].filter(m => +m.dataset.i >= i);
    drag = { id: e.pointerId, c, i, nodes, p0: OS.stage.toLocal(e.clientX, e.clientY), xy: nodes.map(m => [parseFloat(m.style.left), parseFloat(m.style.top)]), moved: false };
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const p = OS.stage.toLocal(e.clientX, e.clientY), dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
    if (!drag.moved && dx * dx + dy * dy < 16) return;
    drag.moved = true;
    drag.nodes.forEach((m, k) => { m.classList.add('sp-drag'); place(m, drag.xy[k][0] + dx, drag.xy[k][1] + dy); });
    drag.dx = dx;
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!G || !d.moved || e.type !== 'pointerup') { if (d.moved) render(); return; }
    // 落在哪一列：拖着的那张牌心在哪一列的范围里
    const cx = d.xy[0][0] + d.dx + CW / 2, g = gap();
    let b = -1;
    for (let c = 0; c < 10; c++) if (cx >= colX(c) - g / 2 && cx < colX(c) + CW + g / 2) b = c;
    if (b >= 0 && tryMove(d.c, d.i, b)) return;
    // 放不了：弹回去
    d.nodes.forEach((m, k) => { m.classList.remove('sp-drag'); m.classList.add('sp-back'); place(m, d.xy[k][0], d.xy[k][1]); });
    setTimeout(() => { if (G && !G.busy) render(); }, 130);
  }

  /* ---------- 显示可行的操作（M、点分数框、点［提示(M)］都行） ---------- */
  let hintTimes = [];
  function hints() {
    const out = [];
    const tops = G.cols.map(c => c.cards[c.cards.length - 1]);
    // 合牌最要紧
    G.cols.forEach((A, a) => G.cols.forEach((B, b) => { if (a !== b && mergeOk(tops[a], tops[b])) out.push({ a, i: A.cards.length - 1, b, p: 100 }); }));
    // 接牌：露出扣着的牌、腾出空列、凑同花色的先说；已经接好的不来回挪
    G.cols.forEach((A, a) => {
      const rs = runStart(a);
      for (let i = rs; i < A.cards.length; i++) {
        const head = A.cards[i], under = A.cards[i - 1], sits = i > A.down && under && under.r === head.r + 1;
        G.cols.forEach((B, b) => {
          if (a === b) return;
          const top = tops[b];
          if (i === A.cards.length - 1 && mergeOk(head, top)) return;
          let p = 0;
          if (!top) { if (i === 0 && head.r !== 13) return; p = head.r === 13 ? 40 : 5; }
          else if (top.r === head.r + 1) { if (sits && !(top.s === head.s && under.s !== head.s)) return; p = 10 + (top.s === head.s ? 15 : 0); }
          else return;
          if (i === A.down && A.down > 0) p += 30;
          if (i === 0) p += 20;
          out.push({ a, i, b, p });
        });
      }
    });
    return out.sort((x, y) => y.p - x.p);
  }
  function hint() {
    if (!G || G.busy || G.over || fw) return;
    const now = Date.now();
    hintTimes = hintTimes.filter(t => now - t < 10000).concat(now);
    if (hintTimes.length >= 20) { hintTimes = []; G.busy = true; setTimeout(() => { if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD); }, 500); return; }
    render();
    const list = hints();
    if (!list.length) {
      if (canDeal()) { ui.table.querySelectorAll('.sp-stock').forEach(n => n.classList.add('sp-hint')); return; }
      OS.ui.dialog({ title: NAME, icon: 'info', text: L.noMove });
      return;
    }
    const h = list[G.hintI % list.length];
    G.hintI++;
    const src = [...ui.table.querySelectorAll('.sp-up[data-col="' + h.a + '"]')].filter(m => +m.dataset.i >= h.i);
    const B = G.cols[h.b];
    const dst = B.cards.length ? ui.table.querySelector('.sp-up[data-col="' + h.b + '"][data-i="' + (B.cards.length - 1) + '"]') : ui.table.querySelector('.sp-slot[data-col="' + h.b + '"]');
    src.forEach(m => m.classList.add('sp-hint'));
    setTimeout(() => { if (dst) dst.classList.add('sp-hint'); }, 450);
  }

  /* ---------- 赢了：放烟花 ---------- */
  let fw = null;
  function fireworks() {
    if (!ui) return;
    const t = ui.table, w = t.clientWidth, h = t.clientHeight;
    const k = Math.min(3, (window.devicePixelRatio || 1) * (OS.stage.scale || 1));
    const cv = el('canvas', { class: 'sp-fw' });
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    t.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.scale(k, k);
    const COLORS = ['#ff4040', '#ffd700', '#40c0ff', '#ff80ff', '#80ff80', '#ffffff', '#ff9a30'];
    const parts = [];
    let frame = 0;
    fw = { cv, raf: 0 };
    OS.sound.play('clap');
    const burst = () => {
      const x = 40 + Math.random() * (w - 80), y = 30 + Math.random() * (h * 0.5), col = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < 46; i++) { const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3.2; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 60 + Math.random() * 30, col }); }
    };
    const step = () => {
      if (!fw) return;
      frame++;
      if (frame < 300 && frame % 22 === 1) burst();
      ctx.fillStyle = 'rgba(0, 128, 0, .18)';
      ctx.fillRect(0, 0, w, h);
      parts.forEach(p => { p.vy += 0.05; p.x += p.vx; p.y += p.vy; p.life--; ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, 2, 2); });
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
      if (frame > 300 && !parts.length) { endFireworks(); return; }
      fw.raf = requestAnimationFrame(step);
    };
    fw.raf = requestAnimationFrame(step);
    cv.addEventListener('pointerdown', () => endFireworks());
  }
  function stopFireworks() { if (!fw) return; cancelAnimationFrame(fw.raf); fw.cv.remove(); fw = null; }
  function endFireworks() {
    if (!fw) return;
    stopFireworks();
    const score = G ? G.score : 0;
    OS.ui.dialog({ title: NAME, icon: 'info', text: L.win(score), buttons: [L.yes, L.no] }).then(v => { if (v === L.yes && win) newGame(); });
  }

  /* ---------- 菜单 ---------- */
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });
  function menuFor(m) {
    if (m === '游戏(G)') return [
      { label: L.newGame, action: () => newGame() },
      { label: L.restart, disabled: !G, action: () => newGame(G.seed) },
      '-',
      { label: L.undo, disabled: !G || !G.hist.length || !!G.over, action: undo },
      { label: L.deal, disabled: !G || G.sp >= G.stock.length || !!G.over, action: dealRow },
      { label: L.hint, disabled: !G || !!G.over, action: hint },
      '-',
      { label: L.level, action: () => levelDialog(false) },
      { label: L.stats, action: statsDialog },
      { label: L.back, action: () => C.pickBack() },
      '-',
      { label: L.quit, action: () => win && win.close() }
    ];
    return [{ label: L.help, action: say(L.help, 'help', L.helpText) }, '-', { label: L.about, action: say(L.about, 'info', L.aboutText) }];
  }
  // 难度：第一次打开先弹；改了就开新的一局
  function levelDialog(first) {
    const nm = 'sp' + Date.now(), cur = S.level || 1;
    const radios = [1, 2, 4].map(lv => { const i = el('input', { type: 'radio', name: nm }); i.checked = lv === cur; i.value = lv; return i; });
    const ok = el('button', { class: 'xpbtn default', text: L.ok }), no = el('button', { class: 'xpbtn', text: L.cancel });
    let done = false;
    const w = OS.wm.open({ title: L.levelTitle, width: 220, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'jp-opts' }, [el('div', { text: L.levelAsk })].concat(radios.map((r, k) => el('label', { class: 'jp-opt' }, [r, el('span', { text: L.levels[[1, 2, 4][k]] })])), [el('div', { class: 'dlg-btns' }, [ok, no])])),
      onClose: () => { if (!done && first && win) { done = true; S.level = 1; persist(); newGame(); } } });
    no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    ok.addEventListener('click', () => {
      OS.sound.play('click');
      const lv = +radios.find(r => r.checked).value;
      done = true;
      const changed = lv !== S.level;
      S.level = lv; persist();
      w.close();
      if (first || changed) newGame();
    });
  }
  function statsDialog() {
    const lv = S.level || 1;
    OS.ui.dialog({ title: L.statsTitle, icon: 'info', text: L.statsText(lv, stat(lv)), buttons: [L.clear, L.ok] }).then(v => {
      if (v !== L.clear) return;
      S.stats[lv] = { best: 0, won: 0, lost: 0, bestW: 0, cur: 0 };
      persist();
    });
  }
})();
