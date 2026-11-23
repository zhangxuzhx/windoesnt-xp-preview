/* 空当算24（XP 空当接龙 → 空当算24；开始 ▸ 所有程序 ▸ 游戏）——样子照原版空当接龙，玩法是算 24 点
   - 顶上一排：左边四个空当、右边四个回收，中间老人头（鼠标在哪边他看哪边）；下面八列明牌
   - 点一下列上的牌（变反色 = 选中），再点空当就放进去；双击直接进空当；列上的牌照原版接龙规则挪（大一点、颜色相反）
   - 四个空当放满：顶上那排下面滑出算式条。点一张牌 → 点符号 → 再点一张，两张合成一张；最后剩 24 就收进回收（一个回收堆一张）
     不是 24：变回原样重算。算不出来：空当里的牌双击原路退回
   - 老人头：四张放满那一下，能算出 24 就眨眼、算不出来就摇头；算对了笑、算错了皱眉；没有能凑的拿法了叹气；赢了大笑
   - 每局有编号 1–1000000，电脑先试过保证能清光；第 11982 局（原版那局没解）开局老人头摸胡子
   - 蓝屏：算式里除以 0 → DIVIDE_BY_ZERO_24；Ctrl+Shift+F10：原版的作弊框
   - 老人头是 Codex 画的 9 个表情（HEAD_ART = false 就退回代码画的那个） */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.freecell;
  const C = OS.cards;

  /* ================= 文案 ================= */
  const NAME = '空当算24';
  const L = {
    menus: ['游戏(G)', '帮助(H)'],
    newGame: '新游戏　F2', pick: '选择游戏…　F3', restart: '重新开始这局', stats: '统计信息　F4', options: '选项…　F5', undo: '撤消　F10', quit: '退出',
    help: '目录', about: '关于空当算24',
    title: n => NAME + ' 游戏 #' + n,
    left: n => '剩余牌数: ' + n,
    helpText: '空当算24\n\n四个空当放满，就用这四张牌算出 24。\n加减乘除都行，每张牌用一次，A 算 1，J、Q、K 算 11、12、13。\n点一下牌再点空当，把牌放进去；双击直接放进去。\n算出 24，这四张就收走了。52 张收完就赢。\n列上的牌也能挪：放到大一点、颜色相反的牌上。',
    aboutText: '空当算24\n版本 2003\n课间十分钟，算到 24 点。\n(C) ' + OS.YEAR + ' 无聊科技',
    redo: '重来',
    pickTitle: '选择游戏', pickLabel: '输入 1 到 1000000 之间的游戏号码：',
    badMove: '这样放不行。',
    emptyCol: '把一串都挪过去，还是只挪一张？', moveRun: '挪一串', moveOne: '挪一张',
    win: '恭喜，你赢了！\n再玩一局吗？', yes: '是', no: '否',
    lose: '很遗憾，你输了。\n再玩一局吗？', same: '同一局', fresh: '新的一局', nah: '算了',
    statsTitle: '统计信息', clear: '清除', ok: '确定', cancel: '取消',
    statsText: (s, t) => '本次：胜 ' + s.won + ' 局，输 ' + s.lost + ' 局\n总计：胜 ' + t.won + ' 局，输 ' + t.lost + ' 局，胜率 ' +
      (t.won + t.lost ? Math.round(t.won / (t.won + t.lost) * 100) : 0) + '%\n连胜：最多 ' + t.bestW + ' 局，现在 ' + Math.max(0, t.cur) + ' 局',
    optTitle: '选项', warn: '放错了给提示', quick: '快速游戏', dbl: '双击把牌放进空当',
    cheatTitle: '作弊', cheat: '选［中止］直接赢，［重试］直接输，［忽略］算了。', abort: '中止', retry: '重试', ignore: '忽略'
  };
  const BSOD = v => ({ id: 'freecell', name: 'DIVIDE_BY_ZERO_24', text: '老人头算 ' + v + ' ÷ 0，算到现在还没算完。' });

  /* ================= 存档 ================= */
  const KEY = 'freecell';
  const S = Object.assign({ warn: false, quick: false, dbl: true }, OS.save.get(KEY, {}));
  S.stats = Object.assign({ won: 0, lost: 0, bestW: 0, cur: 0 }, S.stats || {});
  const persist = () => OS.save.set(KEY, S);
  const session = { won: 0, lost: 0 };

  /* ================= 算 24 ================= */
  const memo24 = new Map();
  function can24(nums) {
    const key = nums.slice().sort((a, b) => a - b).join(',');
    if (memo24.has(key)) return memo24.get(key);
    const go = a => {
      if (a.length === 1) return Math.abs(a[0] - 24) < 1e-9;
      for (let i = 0; i < a.length; i++) for (let j = 0; j < a.length; j++) {
        if (i === j) continue;
        const rest = a.filter((_, k) => k !== i && k !== j), x = a[i], y = a[j];
        if (go(rest.concat(x + y)) || go(rest.concat(x - y)) || go(rest.concat(x * y)) || (y !== 0 && go(rest.concat(x / y)))) return true;
      }
      return false;
    };
    const r = go(nums);
    memo24.set(key, r);
    return r;
  }
  // 分数：{ n, d }
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  const Q = (n, d) => { d = d || 1; if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
  const qfmt = q => (q.n < 0 ? '−' : '') + Math.abs(q.n) + (q.d === 1 ? '' : '/' + q.d);
  const qop = (a, b, op) => op === '+' ? Q(a.n * b.d + b.n * a.d, a.d * b.d) : op === '-' ? Q(a.n * b.d - b.n * a.d, a.d * b.d)
    : op === '*' ? Q(a.n * b.n, a.d * b.d) : Q(a.n * b.d, a.d * b.n);
  const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  // 两个式子接起来，该加括号的加括号（数 3、乘除 2、加减 1）
  function join(sa, pa, op, sb, pb) {
    const w = s => '(' + s + ')';
    let l = sa, r = sb;
    if (op === '-' && pb === 1) r = w(r);
    if ((op === '*' || op === '/') && pa === 1) l = w(l);
    if (op === '*' && pb === 1) r = w(r);
    if (op === '/' && pb <= 2) r = w(r);
    return { s: l + SYM[op] + r, p: op === '+' || op === '-' ? 1 : 2 };
  }

  /* ================= 发牌：编号 → 一副牌；电脑先试，清不光就换 ================= */
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // 从各列顶上拿 4 张的所有拿法（同一列能连着拿）
  function picks(cols, H, need) {
    const out = [], k = new Array(8).fill(0);
    (function rec(c, left) {
      if (c === 8) { if (!left) out.push(k.slice()); return; }
      for (let t = 0; t <= Math.min(left, H[c]); t++) { k[c] = t; rec(c + 1, left - t); }
      k[c] = 0;
    })(0, need);
    return out;
  }
  const ranksOf = (cols, H, kk) => { const q = []; kk.forEach((t, c) => { for (let i = 0; i < t; i++) q.push(cols[c][H[c] - 1 - i].r); }); return q; };
  function clearable(cols) {
    const H = cols.map(c => c.length), seen = new Set();
    let n = 0;
    function go(left) {
      if (!left) return true;
      if (++n > 20000) return false;
      const key = H.join(',');
      if (seen.has(key)) return false;
      seen.add(key);
      for (const kk of picks(cols, H, 4)) {
        if (!can24(ranksOf(cols, H, kk))) continue;
        kk.forEach((t, c) => { H[c] -= t; });
        const r = go(left - 1);
        kk.forEach((t, c) => { H[c] += t; });
        if (r) return true;
      }
      return false;
    }
    return go(cols.reduce((s, c) => s + c.length, 0) / 4);
  }
  const hasQuad = cols => { const H = cols.map(c => c.length); return picks(cols, H, 4).some(kk => can24(ranksOf(cols, H, kk))); };
  function dealNo(no) {
    for (let k = 0; ; k++) {
      const r = rng(no * 977 + k * 7919 + 13);
      const d = [];
      for (let s = 0; s < 4; s++) for (let v = 1; v <= 13; v++) d.push({ r: v, s, id: s * 13 + v });
      for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = d[i]; d[i] = d[j]; d[j] = t; }
      const cols = [[], [], [], [], [], [], [], []];
      d.forEach((c, i) => cols[i % 8].push(c));
      if (k >= 20 || clearable(cols)) return cols;
    }
  }

  /* ================= 窗口 ================= */
  let win = null, ui = null, G = null;
  app.open = function () {
    if (win && !win.isClosed) { if (win.minimized) OS.wm.restore(win); OS.wm.focus(win); return win; }
    ui = { look: 'left', face: null };
    ui.table = el('div', { class: 'fc-table' });
    ui.left = el('span', { class: 'fc-left' });
    const bar = OS.ui.menuBar(L.menus, menuFor, 'fc-mbar');
    bar.appendChild(ui.left);
    ui.head = el('div', { class: 'fc-head' });
    ui.box = el('div', { class: 'fc-win' }, [bar, ui.table]);
    win = OS.wm.open({ title: NAME, icon: 'freecell', width: 462, content: ui.box, appId: app.id, maximizable: false, center: true,
      help: () => OS.ui.dialog({ title: L.help, icon: 'help', text: L.helpText }),   // 标题栏的 ？：跟 帮助 ▸ 目录 一样
      onClose: () => { document.removeEventListener('keydown', onKey, true); clearTimeout(ui && ui.faceT); win = null; ui = null; G = null; } });
    document.addEventListener('keydown', onKey, true);
    ui.table.addEventListener('click', onClick);
    ui.table.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') look(e); });
    newGame(1 + Math.floor(Math.random() * 1000000));
    return win;
  };
  function onKey(e) {
    if (!win || win.isClosed || OS.wm.active !== win) return;
    if (e.ctrlKey && e.shiftKey && e.key === 'F10') { e.preventDefault(); cheat(); return; }
    const k = { F2: () => newGame(1 + Math.floor(Math.random() * 1000000)), F3: pickGame, F4: statsDialog, F5: optionsDialog, F10: undo }[e.key];
    if (k) { e.preventDefault(); k(); }
  }

  /* ---------- 开一局 ---------- */
  function newGame(no) {
    abandon();
    G = { no, cols: dealNo(no), cells: [null, null, null, null], found: [[], [], [], []], sel: null, calc: null, hist: [], over: '', moved: false, busy: false };
    win.setTitle(L.title(no));
    ui.face = null;
    render();
    if (no === 11982) setFace('beard', 2200);   // 原版没解的那局：老人头摸摸胡子
  }
  // 玩了一半换局，算输一局（照原版）
  function abandon() {
    if (G && G.moved && !G.over) countLoss();
  }

  /* ---------- 摆法 ---------- */
  const CW = 50, CH = 67, TOP = 4, ROW2 = 78;
  const TW = () => ui.table.clientWidth, TH = () => ui.table.clientHeight;
  const cellX = i => 2 + i * CW;
  const foundX = i => TW() - 2 - (4 - i) * CW;
  const gap = () => (TW() - 8 * CW) / 9;
  const colX = c => Math.round(gap() + c * (CW + gap()));
  const fan = n => n > 1 ? Math.min(13, (TH() - ROW2 - CH - 3) / (n - 1)) : 13;
  const cardY = (c, i) => ROW2 + i * fan(G.cols[c].length);
  const place = (n, x, y) => { n.style.left = x + 'px'; n.style.top = y + 'px'; return n; };

  function render() {
    if (!ui || !G) return;
    const t = ui.table;
    t.textContent = '';
    const k = G.calc;
    // 空当
    for (let i = 0; i < 4; i++) {
      const slot = place(el('div', { class: 'fc-slot' }), cellX(i), TOP);
      slot.dataset.cell = i;
      t.appendChild(slot);
      const x = G.cells[i];
      if (!x) continue;
      if (k && k.vals[i] == null) continue;   // 合掉了，空出来
      let n;
      if (k && k.merged[i]) n = el('div', { class: 'fc-res', text: qfmt(k.vals[i]) });
      else n = face(x.card);
      if ((k && k.sel === i) || (!k && G.sel && G.sel.type === 'cell' && G.sel.i === i)) n.classList.add('fc-sel');
      n.dataset.cell = i;
      t.appendChild(place(n, cellX(i), TOP));
    }
    // 回收
    for (let i = 0; i < 4; i++) {
      t.appendChild(place(el('div', { class: 'fc-slot fc-found' }), foundX(i), TOP));
      const f = G.found[i];
      if (!f.length) continue;
      // 最上面那张正在飞过来：先露出下面那张
      const top = G.hidden && G.hidden.has(f[f.length - 1].id) ? f[f.length - 2] : f[f.length - 1];
      if (top) t.appendChild(place(C.face(top), foundX(i), TOP));
    }
    // 老人头
    t.appendChild(place(ui.head, Math.round(TW() / 2 - 22), TOP + 11));
    paintHead();
    // 八列
    G.cols.forEach((col, c) => {
      const hit = place(el('div', { class: 'fc-hit' }), colX(c), ROW2);
      hit.dataset.col = c;
      t.appendChild(hit);
      col.forEach((card, i) => {
        const n = place(face(card), colX(c), cardY(c, i));
        n.dataset.col = c;
        if (G.sel && G.sel.type === 'col' && G.sel.i === c && i >= col.length - G.sel.n) n.classList.add('fc-sel');
        t.appendChild(n);
      });
    });
    // 算式条
    if (k) {
      const ops = ['+', '-', '*', '/'].map(op => {
        const b = el('button', { class: 'xpbtn fc-op' + (k.op === op ? ' on' : ''), text: SYM[op] });
        b.dataset.op = op;
        return b;
      });
      const redo = el('button', { class: 'xpbtn fc-op', text: L.redo });
      redo.dataset.op = 'redo';
      t.appendChild(el('div', { class: 'fc-calc' }, [el('div', { class: 'fc-expr' + (k.done ? ' ' + k.done : ''), text: k.line || '' })].concat(ops, redo)));
    }
    ui.left.textContent = L.left(52 - G.found.reduce((s, f) => s + f.length, 0));
  }

  /* ---------- 一张牌飞过去 ---------- */
  // list：[{ card, from: {x, y}, to: {x, y} }]；step：一张接一张飞，隔多少毫秒
  // 飞的时候，落脚的那张先藏起来（G.hidden），飞到了再露出来
  function fly(list, done, step) {
    if (S.quick || !list.length) { render(); if (done) done(); return; }
    G.busy = true;
    G.hidden = new Set(list.map(f => f.card.id));
    render();
    list.forEach((f, k) => setTimeout(() => {
      if (!ui) return;
      const n = place(C.face(f.card), f.from.x, f.from.y);
      n.classList.add('fc-fly');
      ui.table.appendChild(n);
      void n.offsetWidth;
      place(n, f.to.x, f.to.y);
    }, k * (step || 0)));
    setTimeout(() => { if (!G) return; G.busy = false; G.hidden = null; render(); if (done) done(); }, (list.length - 1) * (step || 0) + 160);
  }
  const face = card => { const n = C.face(card); if (G.hidden && G.hidden.has(card.id)) n.style.visibility = 'hidden'; return n; };

  /* ---------- 点 ---------- */
  let lastTap = { key: '', t: 0 };
  function onClick(e) {
    if (!G || G.busy) return;
    look(e);
    const op = e.target.closest('[data-op]');
    if (op) { OS.sound.play('click'); opClick(op.dataset.op); return; }
    const n = e.target.closest('[data-cell], [data-col]');
    if (!n || G.over) return;
    const key = n.dataset.cell != null ? 'cell' + n.dataset.cell : 'col' + n.dataset.col;
    const now = Date.now(), dbl = lastTap.key === key && now - lastTap.t < OS.dblMs();
    lastTap = dbl ? { key: '', t: 0 } : { key, t: now };
    if (n.dataset.cell != null) {
      const i = +n.dataset.cell;
      if (dbl && G.cells[i]) { G.sel = null; backHome(i); return; }   // 双击空当里的牌：原路退回
      cellClick(i);
    } else {
      const c = +n.dataset.col;
      if (dbl && S.dbl && G.cols[c].length) {
        G.sel = null;
        const free = G.cells.indexOf(null);
        if (free >= 0) { toCell({ type: 'col', i: c }, free); return; }
        render();
        return;
      }
      colClick(c);
    }
  }
  const runLen = c => {
    const col = G.cols[c];
    let n = col.length ? 1 : 0;
    while (n < col.length) { const a = col[col.length - n - 1], b = col[col.length - n]; if (a.r === b.r + 1 && C.red(a.s) !== C.red(b.s)) n++; else break; }
    return n;
  };
  function select(s) { G.sel = s; render(); }
  function colClick(c) {
    const s = G.sel;
    if (!s) { if (G.cols[c].length) select({ type: 'col', i: c, n: 1 }); return; }
    G.sel = null;
    if (s.type === 'col' && s.i === c) { render(); return; }
    if (s.type === 'col') colToCol(s.i, c); else cellToCol(s.i, c);
  }
  function cellClick(i) {
    if (G.calc) { calcClick(i); return; }
    const s = G.sel;
    if (!s) { if (G.cells[i]) select({ type: 'cell', i }); return; }
    G.sel = null;
    if (s.type === 'cell' && s.i === i) { render(); return; }
    if (G.cells[i]) { select({ type: 'cell', i }); return; }
    toCell(s, i);
  }
  const bad = () => { render(); if (S.warn) OS.ui.dialog({ title: NAME, icon: 'info', text: L.badMove }); };
  const snap = () => { G.hist.push({ cols: G.cols.map(c => c.slice()), cells: G.cells.slice(), found: G.found.map(f => f.slice()) }); G.moved = true; };
  const fits = (card, onto) => onto.r === card.r + 1 && C.red(onto.s) !== C.red(card.s);
  // 拿进空当（列上最外面那张，或者别的空当里的）
  function toCell(s, i) {
    if (G.cells[i]) return bad();
    snap();
    let card, from, src;
    if (s.type === 'col') { card = G.cols[s.i].pop(); from = s.i; src = { x: colX(s.i), y: cardY(s.i, G.cols[s.i].length) }; }
    else { const x = G.cells[s.i]; G.cells[s.i] = null; card = x.card; from = x.from; src = { x: cellX(s.i), y: TOP }; }
    G.cells[i] = { card, from };
    fly([{ card, from: src, to: { x: cellX(i), y: TOP } }], after);
  }
  // 原版接龙：大一点、颜色相反，或者空列；空当、空列够的话一串一起挪
  function cap(toEmpty) {
    const freeCells = G.cells.filter(x => !x).length, emptyCols = G.cols.filter(c => !c.length).length - (toEmpty ? 1 : 0);
    return (freeCells + 1) * Math.pow(2, Math.max(0, emptyCols));
  }
  function colToCol(a, b) {
    const src = G.cols[a], dst = G.cols[b], run = runLen(a);
    if (!src.length) return render();
    if (!dst.length) {
      const n = Math.min(run, cap(true));
      if (n <= 1) { moveRun(a, b, 1); return; }
      OS.ui.dialog({ title: NAME, icon: 'help', text: L.emptyCol, buttons: [L.moveRun, L.moveOne] }).then(v => { if (G && v) moveRun(a, b, v === L.moveRun ? n : 1); else render(); });
      return;
    }
    const top = dst[dst.length - 1];
    for (let n = 1; n <= run; n++) {
      if (fits(src[src.length - n], top)) { if (n <= cap(false)) { moveRun(a, b, n); return; } break; }
    }
    bad();
  }
  function moveRun(a, b, n) {
    snap();
    const moving = G.cols[a].splice(G.cols[a].length - n);
    const list = moving.map((card, k) => ({ card, from: { x: colX(a), y: cardY(a, G.cols[a].length + k) }, to: null }));
    G.cols[b].push(...moving);
    list.forEach((f, k) => { f.to = { x: colX(b), y: cardY(b, G.cols[b].length - n + k) }; });
    fly(list, after);
  }
  function cellToCol(i, b) {
    const x = G.cells[i], dst = G.cols[b];
    if (!x) return render();
    if (dst.length && !fits(x.card, dst[dst.length - 1])) return bad();
    snap();
    G.cells[i] = null;
    dst.push(x.card);
    fly([{ card: x.card, from: { x: cellX(i), y: TOP }, to: { x: colX(b), y: cardY(b, dst.length - 1) } }], after);
  }
  // 双击空当里的牌：原路退回它原来那一列（不管接龙规则）
  function backHome(i) {
    const x = G.cells[i];
    if (!x) return render();
    snap();
    G.cells[i] = null;
    G.cols[x.from].push(x.card);
    fly([{ card: x.card, from: { x: cellX(i), y: TOP }, to: { x: colX(x.from), y: cardY(x.from, G.cols[x.from].length - 1) } }], after);
  }
  function undo() {
    if (!G || G.busy || G.over || !G.hist.length) return;
    const h = G.hist.pop();
    Object.assign(G, { cols: h.cols, cells: h.cells, found: h.found, sel: null, calc: null });
    ui.face = null;
    after();
  }
  // 每走一步之后：四个空当满了就算；赢了没有；卡住了没有
  function after() {
    if (!G) return;
    const full = G.cells.every(Boolean);
    if (full && !G.calc) {
      G.calc = newCalc();
      setFace(can24(G.cells.map(x => x.card.r)) ? 'wink' : 'shake', 1600);   // 老人头偷偷给个眼色
    }
    if (!full) G.calc = null;
    render();
    if (G.found.every(f => f.length === 13)) { winGame(); return; }
    checkStuck();
  }

  /* ---------- 算式条 ---------- */
  function newCalc() {
    return { vals: G.cells.map(x => Q(x.card.r)), ex: G.cells.map(x => String(x.card.r)), pr: [3, 3, 3, 3], merged: [false, false, false, false], sel: null, op: null, line: '', done: '' };
  }
  function opClick(op) {
    const k = G.calc;
    if (!k || k.done) return;
    if (op === 'redo') { G.calc = newCalc(); render(); return; }
    if (k.sel == null) return;
    k.op = k.op === op ? null : op;
    k.line = k.ex[k.sel] + ' ' + (k.op ? SYM[k.op] : '');
    render();
  }
  function calcClick(i) {
    const k = G.calc;
    if (k.done || k.vals[i] == null) return;
    if (k.sel == null || (!k.op && k.sel !== i)) { k.sel = i; k.op = null; k.line = k.ex[i]; }
    else if (k.sel === i) { k.sel = null; k.op = null; k.line = ''; }
    else { merge(k.sel, k.op, i); return; }
    render();
  }
  function merge(a, op, b) {
    const k = G.calc, x = k.vals[a], y = k.vals[b];
    if (op === '/' && y.n === 0) { divZero(x); return; }
    const v = qop(x, y, op), e = join(k.ex[a], k.pr[a], op, k.ex[b], k.pr[b]);
    k.vals[a] = v; k.ex[a] = e.s; k.pr[a] = e.p; k.merged[a] = true;
    k.vals[b] = null; k.ex[b] = null;
    k.sel = null; k.op = null;
    k.line = e.s + ' = ' + qfmt(v);
    render();
    if (k.vals.filter(Boolean).length === 1) {
      const ok = v.n === 24 && v.d === 1;
      k.done = ok ? 'ok' : 'bad';
      render();
      if (ok) { OS.sound.play('ding'); setFace('smile', 1400); setTimeout(collect, 650); }
      else { setFace('frown', 1400); setTimeout(() => { if (G && G.calc === k) { G.calc = newCalc(); render(); } }, 1200); }
    }
  }
  // 算对了：四张一张一张飞进回收，一个回收堆一张
  function collect() {
    if (!G || !G.calc) return;
    snap();
    const list = G.cells.map((x, i) => ({ card: x.card, from: { x: cellX(i), y: TOP }, to: { x: foundX(i), y: TOP } }));
    G.cells.forEach((x, i) => G.found[i].push(x.card));
    G.cells = [null, null, null, null];
    G.calc = null;
    fly(list, after, 90);
  }
  // 除以 0：老人头算到现在
  function divZero(x) {
    G.busy = true;
    setFace('frown');
    G.calc.line = qfmt(x) + ' ÷ 0 = ';
    render();
    setTimeout(() => { if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD(qfmt(x))); }, 900);
  }

  /* ---------- 卡住了 ／ 赢了 ---------- */
  function checkStuck() {
    if (!G || G.over || G.calc) return;
    // 空当里的牌双击就能退回去，算它们在原来那一列上
    const cols = G.cols.map(c => c.slice());
    G.cells.forEach(x => { if (x) cols[x.from].push(x.card); });
    if (!cols.some(c => c.length)) return;
    if (hasQuad(cols)) { if (ui.face === 'sigh') setFace(null); return; }
    setFace('sigh');
    // 列上的牌也挪不动了：输
    const tops = cols.map(c => c[c.length - 1]);
    const canMove = cols.some((c, a) => c.length && cols.some((d, b) => b !== a && (d.length ? fits(c[c.length - 1], tops[b]) : c.length > 1)));
    if (!canMove) loseGame();
  }
  function countLoss() {
    const t = S.stats;
    t.lost++; t.cur = t.cur < 0 ? t.cur - 1 : -1;
    session.lost++;
    persist();
  }
  function winGame() {
    G.over = 'win';
    const t = S.stats;
    t.won++; t.cur = t.cur > 0 ? t.cur + 1 : 1; t.bestW = Math.max(t.bestW, t.cur);
    session.won++;
    persist();
    setFace('laugh');
    setTimeout(() => {
      if (!win) return;
      OS.ui.dialog({ title: NAME, icon: 'info', text: L.win, buttons: [L.yes, L.no] }).then(v => { if (v === L.yes && win) newGame(1 + Math.floor(Math.random() * 1000000)); });
    }, 500);
  }
  function loseGame() {
    if (G.over) return;
    G.over = 'lose';
    countLoss();
    setFace('sigh');
    OS.ui.dialog({ title: NAME, icon: 'info', text: L.lose, buttons: [L.same, L.fresh, L.nah] }).then(v => {
      if (!win) return;
      if (v === L.same) newGame(G.no);
      if (v === L.fresh) newGame(1 + Math.floor(Math.random() * 1000000));
    });
  }

  /* ---------- 老人头 ---------- */
  // 鼠标在左半边看左边、右半边看右边；手机上看刚点的那一边
  function look(e) {
    if (!ui) return;
    const p = OS.stage.toLocal(e.clientX, e.clientY), r = OS.stage.rectOf(ui.table);
    const side = p.x < r.left + r.width / 2 ? 'left' : 'right';
    if (side !== ui.look) { ui.look = side; if (!ui.face) paintHead(); }
  }
  function setFace(f, ms) {
    if (!ui) return;
    clearTimeout(ui.faceT);
    ui.face = f;
    paintHead();
    if (f && ms) ui.faceT = setTimeout(() => { if (ui && ui.face === f) { ui.face = null; paintHead(); } }, ms);
  }
  const HEAD_ART = true;   // Codex 画的老人头（assets/freecell/king.webp，9 格横排）；false 就退回代码画的
  const FRAMES = ['left', 'right', 'smile', 'frown', 'wink', 'shake', 'laugh', 'sigh', 'beard'];
  function paintHead() {
    if (!ui) return;
    const f = ui.face || ui.look;
    ui.head.className = 'fc-head f-' + f + (HEAD_ART ? ' art' : '');
    if (HEAD_ART) { ui.head.innerHTML = ''; ui.head.style.backgroundPosition = (-FRAMES.indexOf(f) * 44) + 'px 0'; return; }
    ui.head.innerHTML = headSvg(f);
  }
  // 图没来之前：代码画一个戴王冠、老花镜、白胡子的老爷爷
  function headSvg(f) {
    const dx = f === 'left' ? -1.6 : f === 'right' ? 1.6 : 0;
    const shut = f === 'laugh' || f === 'sigh';
    const eye = (x, wink) => wink || shut ? '<path d="M' + (x - 2.2) + ' 21.5q2.2 1.6 4.4 0" stroke="#333" stroke-width="1.2" fill="none"/>' : '<circle cx="' + (x + dx) + '" cy="21.3" r="1.5" fill="#222"/>';
    const mouth = {
      smile: '<path d="M18 30q4 3.5 8 0" stroke="#7a2b1b" stroke-width="1.6" fill="none"/>',
      laugh: '<path d="M17 29h10q-1 6-5 6t-5-6z" fill="#7a2b1b"/>',
      frown: '<path d="M18 32q4-3 8 0" stroke="#7a2b1b" stroke-width="1.6" fill="none"/>',
      sigh: '<ellipse cx="22" cy="31" rx="1.6" ry="1.2" fill="#7a2b1b"/><path d="M30 31q3-1 4 1q1 2 3 1" stroke="#9cc" stroke-width="1" fill="none"/>',
      beard: '<path d="M18 30q4 2.5 8 0" stroke="#7a2b1b" stroke-width="1.6" fill="none"/><ellipse cx="29" cy="34" rx="3" ry="2.3" fill="#f3c9a0" stroke="#c98d5f" stroke-width=".6"/>'
    }[f] || '<path d="M18.5 30.5q3.5 1.6 7 0" stroke="#7a2b1b" stroke-width="1.5" fill="none"/>';
    return '<svg viewBox="0 0 44 44">' +
      '<path d="M9 13l4-8 4.5 5 4.5-7 4.5 7 4.5-5 4 8z" fill="#f5c518" stroke="#a07800" stroke-width=".8" transform="rotate(-6 22 10)"/>' +
      '<circle cx="15" cy="6.5" r="1.1" fill="#e0245e"/><circle cx="22" cy="3.6" r="1.2" fill="#3a8be0"/><circle cx="29" cy="6.5" r="1.1" fill="#2ca02c"/>' +
      '<circle cx="22" cy="23" r="11.5" fill="#ffd9b3" stroke="#d9a47a" stroke-width=".7"/>' +
      '<path d="M11 25q1 13 11 14q10-1 11-14q-3 4-6 3q-2 3-5 3t-5-3q-3 1-6-3z" fill="#fff" stroke="#ccc" stroke-width=".6"/>' +
      eye(18, false) + eye(26, f === 'wink') +
      '<circle cx="18" cy="21.3" r="3.2" fill="none" stroke="#6b4a1e" stroke-width=".9"/><circle cx="26" cy="21.3" r="3.2" fill="none" stroke="#6b4a1e" stroke-width=".9"/><path d="M21.2 21h1.6" stroke="#6b4a1e" stroke-width=".9"/>' +
      (f === 'frown' ? '<path d="M15 16.5l5 1.5M29 16.5l-5 1.5" stroke="#888" stroke-width="1.2"/>' : '<path d="M15 17q3-1.5 5 0M24 17q2-1.5 5 0" stroke="#bbb" stroke-width="1.1" fill="none"/>') +
      mouth +
      '<path d="M33 18l3.5-6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M33 18l3.5-6" stroke="#ddd" stroke-width=".6"/>' +
      '</svg>';
  }

  /* ---------- 菜单 ---------- */
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });
  function menuFor(m) {
    if (m === '游戏(G)') return [
      { label: L.newGame, action: () => newGame(1 + Math.floor(Math.random() * 1000000)) },
      { label: L.pick, action: pickGame },
      { label: L.restart, disabled: !G, action: () => newGame(G.no) },
      '-',
      { label: L.stats, action: statsDialog },
      { label: L.options, action: optionsDialog },
      '-',
      { label: L.undo, disabled: !G || !G.hist.length || !!G.over, action: undo },
      '-',
      { label: L.quit, action: () => win && win.close() }
    ];
    return [{ label: L.help, action: say(L.help, 'help', L.helpText) }, '-', { label: L.about, action: say(L.about, 'info', L.aboutText) }];
  }
  function pickGame() {
    OS.explorer.askText(L.pickTitle, L.pickLabel, String(1 + Math.floor(Math.random() * 1000000)), v => {
      const n = parseInt(String(v || '').replace(/\D/g, ''), 10);
      if (win && n >= 1 && n <= 1000000) newGame(n);
    });
  }
  function statsDialog() {
    OS.ui.dialog({ title: L.statsTitle, icon: 'info', text: L.statsText(session, S.stats), buttons: [L.clear, L.ok] }).then(v => {
      if (v !== L.clear) return;
      S.stats = { won: 0, lost: 0, bestW: 0, cur: 0 };
      session.won = 0; session.lost = 0;
      persist();
    });
  }
  function optionsDialog() {
    const check = (label, on) => { const i = el('input', { type: 'checkbox' }); i.checked = on; return [i, el('label', { class: 'jp-opt' }, [i, el('span', { text: label })])]; };
    const [a, al] = check(L.warn, S.warn), [b, bl] = check(L.quick, S.quick), [c, cl] = check(L.dbl, S.dbl);
    const ok = el('button', { class: 'xpbtn default', text: L.ok }), no = el('button', { class: 'xpbtn', text: L.cancel });
    const w = OS.wm.open({ title: L.optTitle, width: 220, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'jp-opts' }, [el('div', { class: 'jp-ochecks' }, [al, bl, cl]), el('div', { class: 'dlg-btns' }, [ok, no])]) });
    no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    ok.addEventListener('click', () => { OS.sound.play('click'); Object.assign(S, { warn: a.checked, quick: b.checked, dbl: c.checked }); persist(); w.close(); });
  }
  // 原版彩蛋：Ctrl+Shift+F10
  function cheat() {
    if (!G || G.over) return;
    OS.ui.dialog({ title: L.cheatTitle, icon: 'warn', text: L.cheat, buttons: [L.abort, L.retry, L.ignore] }).then(v => {
      if (!G || G.over) return;
      if (v === L.abort) {
        // 剩下的牌一张张轮着放进四个回收
        const rest = [].concat(...G.cols, G.cells.filter(Boolean).map(x => x.card));
        let i = G.found.reduce((s, f) => s + f.length, 0);
        rest.forEach(card => { G.found[i % 4].push(card); i++; });
        G.cols = [[], [], [], [], [], [], [], []]; G.cells = [null, null, null, null]; G.calc = null; G.moved = true;
        render(); winGame();
      }
      if (v === L.retry) { G.moved = true; loseGame(); }
    });
  }
})();
