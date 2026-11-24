/* 排雷（开始菜单左栏、所有程序 ▸ 游戏；原来叫扫雪）——XP 扫雷的样子，玩法换成单色数织
   - 雷已经被找出来了，你只管排：格子左边和上边的数字，是这一行（列）里一段段连着的雷，每段几颗，按顺序排好
   - 左键点开：空格没事，雷格照原版炸；右键（手机长按）：插旗 → 问号 → 恢复（游戏 ▸ 标记(?) 关掉就没有问号）
   - 空格全点开就赢，旗没插完也算；点左边 ／ 上边的数字：这一行的旗插够了，剩下的一次全点开（插错了照样炸）
   - 一行的空格都点开了，那一行的数字变灰
   - 初级 9×9 24 颗 ／ 中级 15×10 60 颗 ／ 高级 20×12 108 颗，各 100 题（paile-data.js，电脑先算好：唯一解、一行一列就能推出来），
     （2026-11-24 作者：中级、高级原来 16×16 ／ 30×16，放大了也难点 → 不照原版，主要往横里加：格子大、窗口也合屏幕）
     同一档里越往后越难；游戏 ▸ 选关…；雷数按数织最难、最有意思的比例定的（30% ／ 40% ／ 45%），不照搬原版
   - 自定义：现场出题，"正在埋雷……"
   - 表情脸：按下去张嘴、赢了戴墨镜、炸了晕；玩着点 ／ 炸了点 = 重开这一题，赢了点 = 下一题
   - 排雷英雄榜：三档各记一个最快的，破纪录留名
   - 蓝屏：10 秒内狂点表情脸 20 下 → 脸笑僵了 → SMILEY_FACE_STUCK
   - 放大（照 NDS、手机上的数织；游戏 ▸ 放大镜 打勾才有，手机默认开、电脑默认关）：雷区大、格子小得点不准时（中级、高级），看全图时点哪里就放大哪一块（这一下不点开格子）；
     放大后格子跟原版一样大，按住拖着看，左边、上边的数字贴着边跟着走；左上角放大镜：放大 ／ 缩小；
     电脑：滚轮、+ −；手机：两根手指捏开捏拢
   - 单键模式（2026-11-24 作者加；游戏 ▸ 单键模式，手机默认开）：雷区左边一竖条小工具栏：指针 ／ 旗子 ／ 问号，挑一个，点格子就是它
     （放左边不放表情脸下面：竖着本来就不够放，横着有富余）
   - 按住拖：一路拖过去的格子一起点开 ／ 插旗 ／ 打问号（单键模式按选的那个；电脑上左键拖点开、右键拖插旗）；锁在开头那一行或那一列上
     放大着的时候：从格子上拖是点格子，从左边、上边的数字上拖（或者两根手指）是挪着看 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.sweep;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const NAME = '排雷';
  const L = {
    menus: ['游戏(G)', '帮助(H)'],
    newGame: '开局　F2', levels: { easy: '初级', mid: '中级', hard: '高级', custom: '自定义…' }, pick: '选关…',
    marks: '标记(?)', color: '颜色', sound: '声音', zoom: '放大镜', oneKey: '单键模式', best: '排雷英雄榜…', quit: '退出',
    tools: [['open', '指针'], ['flag', '旗子'], ['q', '问号']],
    help: '目录', about: '关于排雷',
    helpText: '排雷\n\n雷已经替你找出来了，你只管排。\n\n左边的数字说的是这一行，上边的数字说的是这一列：里面一段段连着的雷，每段几颗，按顺序排好。比如"2 1"：先是两颗连着的雷，隔开至少一格，再一颗。\n\n左键点开空格，点到雷就炸。右键插旗。\n这一行的旗插够了，点它的数字，剩下的格子一次全点开。\n空格全点开就赢。\n\n单键模式（游戏 ▸ 单键模式）：雷区左边挑指针、旗子或问号，点格子就是它。\n按住拖过一排格子，可以一起点开或者一起插旗。',
    aboutText: '排雷\n版本 2003\n雷已经替你找出来了。\n(C) ' + OS.YEAR + ' 无聊科技',
    // 选关
    pickTitle: n => '选关 - ' + n, pickTip: '打勾的是排过的。',
    // 自定义
    customTitle: '自定义雷区', height: '高度(H)：', width: '宽度(W)：', mines: '雷数(M)：', ok: '确定', cancel: '取消',
    making: '正在埋雷……', makingTitle: '自定义雷区',
    // 英雄榜
    bestTitle: '排雷英雄榜', sec: ' 秒', anon: '匿名', reset: '重新计分',
    record: n => '已破' + n + '纪录。\n请留尊姓大名。'
  };
  const BSOD = { id: 'sweep', name: 'SMILEY_FACE_STUCK', text: '表情脸被点了太多下，笑僵了。' };
  const LV = ['easy', 'mid', 'hard'];
  // 题库：paile-data.js（没有就现场出）
  const DATA = OS.paileData || {};
  const FALLBACK = { easy: [9, 9, 24], mid: [15, 10, 60], hard: [20, 12, 108] };

  /* ================= 存档 ================= */
  const KEY = 'paile';
  const S = Object.assign({ level: 'easy', idx: { easy: 0, mid: 0, hard: 0 }, solved: { easy: [], mid: [], hard: [] }, marks: true, color: true, sound: true,
    best: {}, custom: { w: 12, h: 12, m: 58 }, tool: 'open' }, OS.save.get(KEY, {}));
  // 单键模式：手机上默认开，电脑上默认关
  const oneKey = () => S.oneKey == null ? !!OS.stage.touch : !!S.oneKey;
  const tool = () => (oneKey() ? (S.tool === 'q' && !S.marks ? 'open' : S.tool || 'open') : 'open');
  const persist = () => OS.save.set(KEY, S);
  // 题库换过（2026-11-24 中级、高级换了尺寸，题全是新的）：中级、高级的进度、做过的题、英雄榜清掉，初级留着
  const DATA_V = 2;
  if ((S.dataV || 1) < DATA_V) {
    ['mid', 'hard'].forEach(k => { S.idx[k] = 0; S.solved[k] = []; delete S.best[k]; });
    S.dataV = DATA_V;
    persist();
  }

  /* ================= 数织：线索、一行一行地推、出题 ================= */
  const decode = (hex, n) => { const g = []; for (const ch of hex) { const v = parseInt(ch, 16); g.push(v >> 3 & 1, v >> 2 & 1, v >> 1 & 1, v & 1); } return g.slice(0, n); };
  function clueOf(line) { const c = []; let n = 0; for (const v of line) { if (v) n++; else if (n) { c.push(n); n = 0; } } if (n) c.push(n); return c; }
  const rowOf = (g, W, r) => g.slice(r * W, r * W + W);
  const colOf = (g, W, H, c) => { const a = []; for (let r = 0; r < H; r++) a.push(g[r * W + c]); return a; };
  // 一行能不能这么排（known：1 雷 0 空 -1 不知道）
  function fits(clue, known) {
    const L_ = known.length, k = clue.length, memo = new Map();
    const go = (i, j) => {
      const key = i * 64 + j;
      if (memo.has(key)) return memo.get(key);
      let ok = false;
      if (j === k) { ok = true; for (let x = i; x < L_; x++) if (known[x] === 1) { ok = false; break; } }
      else {
        if (i < L_ && known[i] !== 1 && go(i + 1, j)) ok = true;
        const b = clue[j];
        if (!ok && i + b <= L_) {
          let fit = true;
          for (let x = i; x < i + b; x++) if (known[x] === 0) { fit = false; break; }
          if (fit && i + b < L_ && known[i + b] === 1) fit = false;
          if (fit) ok = i + b === L_ ? j + 1 === k : go(i + b + 1, j + 1);
        }
      }
      memo.set(key, ok);
      return ok;
    };
    return go(0, 0);
  }
  function solveLine(clue, known) {
    const out = known.slice();
    for (let x = 0; x < known.length; x++) {
      if (known[x] !== -1) continue;
      known[x] = 1; const a = fits(clue, known);
      known[x] = 0; const b = fits(clue, known);
      known[x] = -1;
      if (a && !b) out[x] = 1; else if (b && !a) out[x] = 0; else if (!a && !b) return null;
    }
    return out;
  }
  // 只靠一行一列推：推得完 = 唯一解
  function deduce(g, W, H) {
    const rows = [], cols = [];
    for (let r = 0; r < H; r++) rows.push(clueOf(rowOf(g, W, r)));
    for (let c = 0; c < W; c++) cols.push(clueOf(colOf(g, W, H, c)));
    const k = new Array(W * H).fill(-1);
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < H; r++) { const line = k.slice(r * W, r * W + W), n = solveLine(rows[r], line); for (let c = 0; c < W; c++) if (n[c] !== line[c]) { k[r * W + c] = n[c]; changed = true; } }
      for (let c = 0; c < W; c++) { const line = colOf(k, W, H, c), n = solveLine(cols[c], line); for (let r = 0; r < H; r++) if (n[r] !== line[r]) { k[r * W + c] = n[r]; changed = true; } }
    }
    return k;
  }
  // 现场出题（自定义）：先随便埋，哪里推不出来就把那里的雷挪一挪；一点一点算，不卡住画面
  function generate(W, H, mines, onDone, isCancelled) {
    const N = W * H;
    const fresh = () => { const g = new Array(N).fill(0), idx = [...g.keys()]; for (let i = N - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } for (let i = 0; i < mines; i++) g[idx[i]] = 1; return g; };
    let g = fresh(), k = deduce(g, W, H), score = k.filter(v => v !== -1).length, steps = 0;
    const tick = () => {
      if (isCancelled()) return;
      const t0 = Date.now();
      while (Date.now() - t0 < 30) {
        if (score === N) { onDone(g); return; }
        if (++steps > 6000) { g = fresh(); k = deduce(g, W, H); score = k.filter(v => v !== -1).length; steps = 0; }
        const unk = []; k.forEach((v, i) => { if (v === -1) unk.push(i); });
        const a = unk[Math.floor(Math.random() * unk.length)];
        const pool = []; g.forEach((v, i) => { if (v !== g[a]) pool.push(i); });
        const b = pool[Math.floor(Math.random() * pool.length)];
        const g2 = g.slice(); g2[a] = g[b]; g2[b] = g[a];
        const k2 = deduce(g2, W, H), s2 = k2.filter(v => v !== -1).length;
        if (s2 >= score) { g = g2; k = k2; score = s2; }
      }
      setTimeout(tick, 0);
    };
    tick();
  }

  /* ================= 小图：表情、雷、旗、数码管 ================= */
  const FACE = (() => {
    const head = '<circle cx="10" cy="10" r="8.3" fill="#ffff00" stroke="#000" stroke-width="1"/>';
    const eyes = '<rect x="6.3" y="6.6" width="1.6" height="1.8" fill="#000"/><rect x="12.1" y="6.6" width="1.6" height="1.8" fill="#000"/>';
    const svg = s => '<svg viewBox="0 0 20 20">' + head + s + '</svg>';
    return {
      smile: svg(eyes + '<path d="M6 12 Q10 16 14 12" fill="none" stroke="#000" stroke-width="1.2"/>'),
      oh: svg(eyes + '<circle cx="10" cy="13.2" r="2" fill="none" stroke="#000" stroke-width="1.2"/>'),
      cool: svg('<path d="M4.5 7.2 H15.5 V8.4 L13.6 10.2 H11.3 L10 8.6 L8.7 10.2 H6.4 L4.5 8.4 Z" fill="#000"/><path d="M6 12.4 Q10 16 14 12.4" fill="none" stroke="#000" stroke-width="1.2"/>'),
      dead: svg('<path d="M5.8 5.8 L8.4 8.4 M8.4 5.8 L5.8 8.4 M11.6 5.8 L14.2 8.4 M14.2 5.8 L11.6 8.4" stroke="#000" stroke-width="1.1"/><path d="M6.2 14.6 Q10 11.4 13.8 14.6" fill="none" stroke="#000" stroke-width="1.2"/>'),
      // 笑僵了：嘴角抽搐
      stiff: svg(eyes + '<path d="M5 12.4 L6.6 13.6 L8.2 12.6 L10 13.8 L11.8 12.6 L13.4 13.6 L15 12.4" fill="none" stroke="#000" stroke-width="1.1"/><path d="M14.6 4.6 Q15.6 6 14.6 7" fill="#7fc8ff"/>')
    };
  })();
  const MINE = '<svg viewBox="0 0 16 16"><path d="M8 1.5 V14.5 M1.5 8 H14.5 M3.4 3.4 L12.6 12.6 M12.6 3.4 L3.4 12.6" stroke="#000" stroke-width="1.3"/><circle cx="8" cy="8" r="4.6" fill="#000"/><rect x="5.6" y="5.6" width="2" height="2" fill="#fff"/></svg>';
  const FLAG = '<svg viewBox="0 0 16 16"><path d="M8.5 2.5 L3.5 5.2 L8.5 7.8 Z" fill="#ff0000"/><path d="M8.5 2.5 V11" stroke="#000" stroke-width="1.2"/><rect x="5.5" y="11" width="6" height="1.5" fill="#000"/><rect x="3.5" y="12.4" width="10" height="1.8" fill="#000"/></svg>';
  const WRONG = MINE.replace('</svg>', '<path d="M2.5 2.5 L13.5 13.5 M13.5 2.5 L2.5 13.5" stroke="#ff0000" stroke-width="1.6"/></svg>');
  const SEG = { a: [2, 1, 7, 1.7], b: [9, 2.3, 1.7, 7.4], c: [9, 11.3, 1.7, 7.4], d: [2, 18.3, 7, 1.7], e: [0.3, 11.3, 1.7, 7.4], f: [0.3, 2.3, 1.7, 7.4], g: [2, 9.65, 7, 1.7] };
  const DIGIT = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
  const digitSvg = ch => '<svg viewBox="0 0 11 21">' + Object.keys(SEG).map(s => { const [x, y, w, h] = SEG[s]; return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + ((DIGIT[ch] || '').includes(s) ? 'var(--led-on)' : 'var(--led-off)') + '"/>'; }).join('') + '</svg>';
  const ledText = n => { n = Math.max(-99, Math.min(999, n)); return n < 0 ? '-' + String(-n).padStart(2, '0') : String(n).padStart(3, '0'); };

  /* ================= 窗口 ================= */
  let win = null, ui = null, G = null;
  let faceHits = [];
  app.open = function () {
    if (win && !win.isClosed) { if (win.minimized) OS.wm.restore(win); OS.wm.focus(win); return win; }
    ui = { box: el('div', { class: 'pa-win' }) };
    ui.box.appendChild(OS.ui.menuBar(L.menus, menuFor, 'pa-mbar'));
    ui.body = el('div');
    ui.box.appendChild(ui.body);
    win = OS.wm.open({ title: NAME, icon: 'sweep', width: 200, content: ui.box, appId: app.id, maximizable: false, center: true,
      help: () => OS.ui.dialog({ title: L.help, icon: 'help', text: L.helpText }),   // 标题栏的 ？：跟 帮助 ▸ 目录 一样
      onClose: () => {
        stopTimer(); win = null; ui = null; G = null; press = null; pinch = null; touches.clear();
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('pointermove', onMove, true);
        document.removeEventListener('pointerup', onUp, true);
        document.removeEventListener('pointercancel', onUp, true);
      } });
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('pointercancel', onUp, true);
    startLevel(S.level);
    return win;
  };
  function onKey(e) {
    if (!win || win.isClosed || OS.wm.active !== win) return;
    if (e.key === 'F2') { e.preventDefault(); faceAction(); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomStep(1); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomStep(-1); }
  }

  /* ---------- 开一题 ---------- */
  function startLevel(level) {
    S.level = level; persist();
    if (level === 'custom') { makeCustom(S.custom); return; }
    const d = DATA[level];
    const i = S.idx[level] || 0;
    if (d && d.list && d.list[i]) newGame({ level, idx: i, W: d.w, H: d.h, grid: decode(d.list[i], d.w * d.h) });
    else { const [W, H, m] = FALLBACK[level]; generate(W, H, m, g => newGame({ level, idx: i, W, H, grid: g }), () => !win); }
  }
  function makeCustom(c) {
    let cancelled = false;
    const fill = el('div', { class: 'pa-busyfill' });
    const no = el('button', { class: 'xpbtn', text: L.cancel });
    const w = OS.wm.open({ title: L.makingTitle, icon: 'sweep', width: 220, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'pa-busy' }, [el('div', { text: L.making }), el('div', { class: 'pa-busybar' }, [fill]), el('div', { class: 'dlg-btns' }, [no])]),
      onClose: () => { cancelled = true; } });
    no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    generate(c.w, c.h, c.m, g => { if (!w.isClosed) w.close(); cancelled = true; if (win) newGame({ level: 'custom', idx: null, W: c.w, H: c.h, grid: g }); }, () => cancelled || !win);
  }
  function newGame(o) {
    stopTimer();
    const { W, H, grid } = o;
    // 换了一题就回到看全图；同一题重开，放大着的照样放大着
    if (!G || G.grid !== grid) { ui.zoom = 0; ui.lastRC = null; ui.view = null; }
    G = Object.assign(o, {
      mines: grid.reduce((s, v) => s + v, 0),
      rows: [], cols: [], st: new Array(W * H).fill(0),   // 0 没开 1 开了 2 旗 3 问号
      over: '', time: 0, started: false, timer: 0
    });
    for (let r = 0; r < H; r++) G.rows.push(clueOf(rowOf(grid, W, r)));
    for (let c = 0; c < W; c++) G.cols.push(clueOf(colOf(grid, W, H, c)));
    build();
  }

  /* ---------- 画：上面一条（剩几颗、表情、计时）＋ 下面雷区（左边、上边是数字） ---------- */
  // 雷区大、格子小得点不准（中级、高级）：能放大。看全图时点哪里就放大哪一块；放大后拖着看，左边、上边的数字贴着边跟着走
  // 左上角放大镜：放大 ／ 缩小；电脑：滚轮、+ −；手机：两根手指捏开捏拢
  const ZOOMS = [12, 16, 20], ZOOM_TAP = 16;
  const ZOOM_ICON = minus => '<svg viewBox="0 0 14 14"><circle cx="5.6" cy="5.6" r="4.2" fill="#dff0ff" stroke="#000" stroke-width="1.3"/>' +
    '<path d="M8.7 8.7l3.8 3.8" stroke="#000" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M3.5 5.6h4.2' + (minus ? '' : 'M5.6 3.5v4.2') + '" stroke="#000" stroke-width="1.3"/></svg>';
  // 游戏 ▸ 放大镜：手机上默认开，电脑上画面本来就大，默认关；关了就跟原来一样，点格子直接点开
  const zoomOn = () => S.zoom == null ? !!OS.stage.touch : !!S.zoom;
  const zoomable = () => !!(ui && ui.fitCs < 13 && zoomOn());
  // csMax：看全图时画出来窗口比屏幕高，就把格子缩小一号再画一遍
  function build(csMax) {
    const { W, H } = G;
    const Wk = OS.stage.work;
    const z = ui.zoom || 0;
    const prev = z && ui.view && ui.geom && ui.geom.z === z ? { l: ui.view.scrollLeft, t: ui.view.scrollTop } : null;
    const big = !!z || !csMax || csMax >= 12;
    const cf = big ? 9 : 8, numW = n => String(n).length * cf * 0.62 + 3.5;
    const leftW = Math.ceil(Math.max(...G.rows.map(c => (c.length ? c : [0]).reduce((s, n) => s + numW(n), 0))) + 6);
    const topH = Math.max(...G.cols.map(c => Math.max(1, c.length))) * (cf + 1) + 4;
    const chromeH = 22 + 18 + 10 + 34 + 8;
    const tbW = oneKey() ? 34 : 0;   // 单键模式的工具栏竖在雷区左边，占宽不占高
    const cs = z || Math.max(8, Math.min(csMax || 16, Math.floor((Math.min(470, Wk.w - 6) - 36 - leftW - tbW) / W), Math.floor((Wk.h - 4 - chromeH - topH) / H)));
    if (!z) ui.fitCs = cs;
    const compact = cs < 14 || !!z;   // 高级（格子 12–14）：上面那一条收紧，省下的高度给格子
    ui.cells = []; ui.rowClue = []; ui.colClue = [];
    const field = el('div', { class: 'pa-field' + (cs < 12 ? ' small' : ''), style: { gridTemplateColumns: leftW + 'px repeat(' + W + ', ' + cs + 'px)', gridTemplateRows: topH + 'px repeat(' + H + ', ' + cs + 'px)' } });
    field.style.setProperty('--cs', cs + 'px');
    const corner = el('div', { class: 'pa-corner' });
    if (zoomable()) corner.appendChild(el('div', { class: 'pa-zoom', html: ZOOM_ICON(!!z) }));
    field.appendChild(corner);
    const num = n => el('span', { class: 'pa-n n' + (((n - 1) % 8) + 1), text: String(n) });
    G.cols.forEach((c, i) => {
      const d = el('div', { class: 'pa-tc' }, (c.length ? c : [0]).map(num));
      d.dataset.c = i;
      ui.colClue.push(d);
      field.appendChild(d);
    });
    for (let r = 0; r < H; r++) {
      const d = el('div', { class: 'pa-lc' }, (G.rows[r].length ? G.rows[r] : [0]).map(num));
      d.dataset.r = r;
      ui.rowClue.push(d);
      field.appendChild(d);
      for (let c = 0; c < W; c++) {
        const i = r * W + c;
        const n = el('div', { class: 'pa-c' });
        n.dataset.i = i;
        ui.cells.push(n);
        field.appendChild(n);
      }
    }
    // 左键：按下去表情张嘴，抬起来点开（拖开了就不算）；长按 ／ 右键：插旗；看全图时这些都是"放大这一块"
    const view = el('div', { class: 'pa-view' + (z ? ' zoomed' : '') + (zoomable() ? ' zoomable' : '') }, [field]);
    view.addEventListener('pointerdown', onDown);
    view.addEventListener('wheel', onWheel, { passive: false });
    OS.ui.onContext(field, e => {
      if (!ui || !G) return null;
      if (pinch || Date.now() - pinchEnd < 600) return null; // 两根手指捏着，有一根不动也会算成长按，不理它
      if (Date.now() - (ui.skipCtx || 0) < 500) return null;   // 右键刚拖着插过一串旗
      if (overview()) { zoomAt(OS.stage.toLocal(e.clientX, e.clientY), ZOOM_TAP); return null; }
      const n = e.target.closest && e.target.closest('.pa-c');
      if (n) mark(+n.dataset.i);
      return null;
    });
    ui.face = el('div', { class: 'pa-face', html: FACE.smile });
    ui.face.addEventListener('click', () => { OS.sound.play('click'); faceAction(); });
    ui.left = el('div', { class: 'pa-led' });
    ui.clock = el('div', { class: 'pa-led' });
    const kids = [el('div', { class: 'pa-top' }, [ui.left, ui.face, ui.clock])];
    kids.push(oneKey() ? el('div', { class: 'pa-mid' }, [toolBar(), view]) : view);
    const panel = el('div', { class: 'pa' + (S.color ? '' : ' bw') + (compact ? ' compact' : '') }, kids);
    ui.panel = panel; ui.view = view;
    ui.geom = { z, cs, leftW, topH };
    ui.body.textContent = '';
    ui.body.appendChild(panel);
    const extra = compact ? 28 : 34;
    if (!z) {
      const ww = leftW + W * cs + extra + tbW;
      win.opts.width = ww;
      OS.wm.setWidth(win, ww);
      if (win.el.offsetHeight > Wk.h - 2 && cs > 8) { build(cs - 1); return; }
    } else {
      // 放大了：窗口能多大就多大，雷区在里面拖着看
      const fullW = leftW + W * cs, fullH = topH + H * cs;
      const vw = Math.min(fullW, Math.min(470, Wk.w - 6) - extra - tbW);
      view.style.width = vw + 'px';
      view.style.height = fullH + 'px';
      win.opts.width = vw + extra + tbW;
      OS.wm.setWidth(win, vw + extra + tbW);
      const over = win.el.offsetHeight - (Wk.h - 2);
      const vh = over > 0 ? Math.max(topH + 2 * cs, fullH - over) : fullH;
      view.style.height = vh + 'px';
      ui.geom.vw = vw; ui.geom.vh = vh;
      const a = ui.anchor;
      ui.anchor = null;
      if (a) {
        const ax = a.keep ? a.px : leftW + (vw - leftW) / 2, ay = a.keep ? a.py : topH + (vh - topH) / 2;
        view.scrollLeft = leftW + (a.c + 0.5) * cs - ax;
        view.scrollTop = topH + (a.r + 0.5) * cs - ay;
      } else if (prev) { view.scrollLeft = prev.l; view.scrollTop = prev.t; }
    }
    OS.wm.keepInside(win);
    paintAll();
    win.setTitle(NAME + (G.level === 'custom' ? '' : ' - ' + L.levels[G.level] + ' 第 ' + (G.idx + 1) + ' 题'));
  }

  // 单键模式的小工具栏（竖在雷区左边）：指针 ／ 旗子 ／ 问号（游戏 ▸ 标记(?) 关了就没有问号）
  const TOOL_ICON = { open: '<svg viewBox="0 0 16 16"><path d="M4 2 L4 13 L6.8 10.4 L8.8 14.6 L10.6 13.8 L8.6 9.7 L12.2 9.6 Z" fill="#fff" stroke="#000" stroke-width="1" stroke-linejoin="round"/></svg>', flag: FLAG, q: '<b class="pa-q">?</b>' };
  function toolBar() {
    const bar = el('div', { class: 'pa-tools' });
    L.tools.forEach(([k, label]) => {
      if (k === 'q' && !S.marks) return;
      const b = el('div', { class: 'pa-tool' + (tool() === k ? ' on' : ''), title: label }, [el('span', { class: 'pa-ti', html: TOOL_ICON[k] }), el('span', { text: label })]);
      b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); S.tool = k; persist(); bar.querySelectorAll('.pa-tool').forEach(x => x.classList.toggle('on', x === b)); });
      bar.appendChild(b);
    });
    return bar;
  }
  // 一格按工具点：open 点开 ／ flag 插旗（set：插还是拔，拖的时候整串一样）／ q 打问号
  function useTool(t, i, set) {
    if (!G || G.over || G.st[i] === 1) return;
    if (t === 'open') { if (G.st[i] !== 2) open(i); return; }
    const v = t === 'flag' ? 2 : 3;
    const want = set == null ? G.st[i] !== v : set;
    if (want && G.st[i] === v) return;
    if (!want && G.st[i] !== v) return;
    G.st[i] = want ? v : 0;
    paintCell(i);
    paintLed(ui.left, G.mines - G.st.filter(x => x === 2).length);
  }
  // 按住拖：从开头那格到现在这格，锁在同一行或同一列上，路过的格子一起点
  function dragTo(pr, p) {
    const g = ui.geom, v = ui.view, vp = viewPt(p);
    const gx = vp.x + (g.z ? v.scrollLeft : 0) - g.leftW, gy = vp.y + (g.z ? v.scrollTop : 0) - g.topH;
    const c = Math.floor(gx / g.cs), r = Math.floor(gy / g.cs);
    const r0 = Math.floor(pr.cell / G.W), c0 = pr.cell % G.W;
    if (!pr.axis && (r !== r0 || c !== c0)) pr.axis = Math.abs(c - c0) >= Math.abs(r - r0) ? 'row' : 'col';
    if (!pr.axis) return;
    const k = pr.axis === 'row' ? OS.clamp(c, 0, G.W - 1) : OS.clamp(r, 0, G.H - 1);
    const from = pr.axis === 'row' ? c0 : r0, step = k >= from ? 1 : -1;
    for (let x = from; x !== k + step; x += step) {
      const i = pr.axis === 'row' ? r0 * G.W + x : x * G.W + c0;
      if (pr.done.has(i)) continue;
      pr.done.add(i);
      useTool(pr.tool, i, pr.set);
      if (G.over) return;
    }
  }

  /* ---------- 放大 ／ 缩小、拖着看 ---------- */
  let press = null, pinch = null, pinchEnd = 0, wheelAt = 0;
  const touches = new Map();
  const overview = () => !ui.zoom && zoomable();
  const stagePt = e => OS.stage.toLocal(e.clientX, e.clientY);
  // 画面上的一点 → 在雷区框里的位置（去掉 3 点的边）
  function viewPt(p) { const r = OS.stage.rectOf(ui.view); return { x: p.x - r.left - 3, y: p.y - r.top - 3 }; }
  // 框里的位置 → 第几行第几列（落在数字上就算最近的那一格）
  function cellAt(vp) {
    const g = ui.geom, v = ui.view;
    const gx = vp.x + (g.z ? v.scrollLeft : 0) - g.leftW, gy = vp.y + (g.z ? v.scrollTop : 0) - g.topH;
    return { c: OS.clamp(Math.floor(gx / g.cs), 0, G.W - 1), r: OS.clamp(Math.floor(gy / g.cs), 0, G.H - 1) };
  }
  // 现在看着的正中间是哪一格
  function centerRC() {
    const g = ui.geom;
    if (!g.z) return ui.lastRC || { r: G.H >> 1, c: G.W >> 1 };
    return cellAt({ x: g.leftW + (g.vw - g.leftW) / 2, y: g.topH + (g.vh - g.topH) / 2 });
  }
  function setZoom(z) {
    if (!ui || !G || z === (ui.zoom || 0)) { if (ui) ui.anchor = null; return; }
    if (ui.zoom && !z) ui.lastRC = centerRC();
    ui.zoom = z;
    build();
  }
  // 放大到 z，手指 ／ 鼠标底下那一格：从全图放大就挪到正中间，放大着再放大就留在手指底下
  function zoomAt(p, z, keep) {
    if (!ui || !G || !zoomable()) return;
    const vp = viewPt(p), rc = cellAt(vp);
    ui.anchor = { r: rc.r, c: rc.c, px: vp.x, py: vp.y, keep: !!(keep && ui.zoom) };
    setZoom(z);
  }
  function zoomStep(d, p) {
    if (!ui || !G || !zoomable()) return;
    const ls = [0].concat(ZOOMS.filter(v => v > ui.fitCs));
    const k = Math.max(0, ls.indexOf(ui.zoom || 0));
    const z = ls[OS.clamp(k + d, 0, ls.length - 1)];
    if (z === (ui.zoom || 0)) return;
    if (p && z) { zoomAt(p, z, true); return; }
    if (z) { const rc = centerRC(); ui.anchor = { r: rc.r, c: rc.c }; }
    setZoom(z);
  }
  function toggleZoom() {
    if (!ui || !G) return;
    if (ui.zoom) { setZoom(0); return; }
    const rc = centerRC();
    ui.anchor = { r: rc.r, c: rc.c };
    setZoom(ZOOM_TAP);
  }
  function endPress() {
    if (!press) return;
    if (press.down) { press.node.classList.remove('down'); if (G && !G.over) setFace('smile'); }
    press = null;
  }
  function onDown(e) {
    if (!ui || !G) return;
    const p = stagePt(e);
    if (e.pointerType !== 'mouse') touches.set(e.pointerId, p);
    if (touches.size >= 2) {
      // 两根手指：捏开放大、捏拢缩小
      endPress();
      if (zoomable() && touches.size === 2) { const [a, b] = [...touches.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; }
      return;
    }
    const right = e.pointerType === 'mouse' && e.button === 2;
    if (e.pointerType === 'mouse' && e.button !== 0 && !right) return;
    const n = e.target.closest('.pa-c');
    press = { id: e.pointerId, p0: p, sl: ui.view.scrollLeft, st: ui.view.scrollTop, moved: false, target: e.target, node: n, cell: n ? +n.dataset.i : -1, down: false,
      tool: right ? 'flag' : tool(), right, batch: !!(n && !overview() && !G.over), done: new Set(), axis: null, set: null };
    if (press.batch && press.tool !== 'open') press.set = G.st[press.cell] !== (press.tool === 'flag' ? 2 : 3);   // 开头那格决定这一串是插还是拔
    if (right) return;
    if (n && !overview() && !G.over && press.tool === 'open' && G.st[press.cell] !== 1 && G.st[press.cell] !== 2) { n.classList.add('down'); setFace('oh'); press.down = true; }
  }
  function onMove(e) {
    if (!ui || !G) return;
    if (touches.has(e.pointerId)) touches.set(e.pointerId, stagePt(e));
    if (pinch) {
      if (touches.size < 2) return;
      const [a, b] = [...touches.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if (ui.zoom && pinch.mx != null) { ui.view.scrollLeft -= mx - pinch.mx; ui.view.scrollTop -= my - pinch.my; }   // 两根手指一起挪：挪着看
      pinch.mx = mx; pinch.my = my;
      if (d > pinch.d * 1.3 || d < pinch.d / 1.3) { const grow = d > pinch.d; pinch.d = d; pinch.mx = null; zoomStep(grow ? 1 : -1, { x: mx, y: my }); }
      return;
    }
    if (!press || e.pointerId !== press.id) return;
    const p = stagePt(e), dx = p.x - press.p0.x, dy = p.y - press.p0.y;
    if (!press.moved && dx * dx + dy * dy > 25) {
      press.moved = true;
      if (press.down) { press.node.classList.remove('down'); press.down = false; if (!G.over) setFace('smile'); }
    }
    if (press.moved && press.batch) { if (!press.done.size) { press.done.add(press.cell); useTool(press.tool, press.cell, press.set); } dragTo(press, p); if (press.right) ui.skipCtx = Date.now(); return; }
    if (press.moved && ui.zoom) { ui.view.scrollLeft = press.sl - dx; ui.view.scrollTop = press.st - dy; }
  }
  function onUp(e) {
    touches.delete(e.pointerId);
    if (pinch) { if (!touches.size) { pinch = null; pinchEnd = Date.now(); } endPress(); return; }
    if (!press || e.pointerId !== press.id) return;
    const pr = press;
    endPress();
    if (pr.right) { if (pr.moved) ui.skipCtx = Date.now(); return; }   // 右键：不拖照旧走右键菜单那条（插旗）；拖过了就别再插一次
    if (!ui || !G || e.type !== 'pointerup' || pr.moved || OS.ui.longPressed(e.pointerId)) return;
    const t = pr.target;
    if (t.closest('.pa-zoom')) { OS.sound.play('click'); toggleZoom(); return; }
    if (overview()) { zoomAt(stagePt(e), ZOOM_TAP); return; }
    if (pr.cell >= 0) { useTool(pr.tool, pr.cell); return; }
    const lc = t.closest('.pa-lc'), tc = t.closest('.pa-tc');
    if (lc) chord('r', +lc.dataset.r);
    else if (tc) chord('c', +tc.dataset.c);
  }
  function onWheel(e) {
    if (!zoomable()) return;
    e.preventDefault();
    const now = Date.now();
    if (now - wheelAt < 150) return;
    wheelAt = now;
    zoomStep(e.deltaY < 0 ? 1 : -1, stagePt(e));
  }
  function setFace(k) { if (ui) ui.face.innerHTML = FACE[k]; }
  function paintLed(node, n) { node.innerHTML = ledText(n).split('').map(digitSvg).join(''); }
  function paintCell(i) {
    const n = ui.cells[i], s = G.st[i];
    n.className = 'pa-c' + (s === 1 ? ' open' : '');
    n.innerHTML = s === 2 ? FLAG : s === 3 ? '<b class="pa-q">?</b>' : '';
  }
  function paintAll() {
    for (let i = 0; i < G.st.length; i++) paintCell(i);
    paintLed(ui.left, G.mines - G.st.filter(v => v === 2).length);
    paintLed(ui.clock, G.time);
    setFace(G.over === 'win' ? 'cool' : G.over === 'lose' ? 'dead' : 'smile');
    for (let r = 0; r < G.H; r++) lineDone('r', r);
    for (let c = 0; c < G.W; c++) lineDone('c', c);
    if (G.over === 'lose') paintLose();
  }
  // 炸了：雷全翻出来，插错的旗打叉，点的那颗红底
  function paintLose() {
    G.grid.forEach((v, k) => {
      const n = ui.cells[k];
      if (v === 1 && G.st[k] !== 2) { n.className = 'pa-c open'; n.innerHTML = MINE; }
      if (v === 0 && G.st[k] === 2) { n.className = 'pa-c open'; n.innerHTML = WRONG; }
    });
    ui.cells[G.boom].classList.add('boom');
  }
  // 一行的空格都点开了：数字变灰
  const lineIdx = (t, k) => { const a = []; if (t === 'r') for (let c = 0; c < G.W; c++) a.push(k * G.W + c); else for (let r = 0; r < G.H; r++) a.push(r * G.W + k); return a; };
  function lineDone(t, k) {
    const done = lineIdx(t, k).every(i => G.grid[i] === 1 || G.st[i] === 1);
    (t === 'r' ? ui.rowClue : ui.colClue)[k].classList.toggle('done', done);
  }

  /* ---------- 玩 ---------- */
  function startTimer() {
    if (G.started) return;
    G.started = true;
    G.timer = setInterval(() => {
      if (!G || G.over || !ui) return;
      G.time = Math.min(999, G.time + 1);
      paintLed(ui.clock, G.time);
      if (S.sound) OS.sound.play('click');
    }, 1000);
  }
  function stopTimer() { if (G && G.timer) { clearInterval(G.timer); G.timer = 0; } }
  function open(i) {
    if (G.over || G.st[i] === 1 || G.st[i] === 2) return;
    startTimer();
    if (G.grid[i] === 1) { lose(i); return; }
    G.st[i] = 1;
    paintCell(i);
    const r = Math.floor(i / G.W), c = i % G.W;
    lineDone('r', r); lineDone('c', c);
    checkWin();
  }
  function mark(i) {
    if (G.over || G.st[i] === 1) return;
    G.st[i] = G.st[i] === 0 ? 2 : G.st[i] === 2 ? (S.marks ? 3 : 0) : 0;
    paintCell(i);
    paintLed(ui.left, G.mines - G.st.filter(v => v === 2).length);
  }
  // 点数字：这一行的旗插够了，剩下的一次全点开（插错了照样炸）
  function chord(t, k) {
    if (!G || G.over) return;
    const idx = lineIdx(t, k);
    const need = (t === 'r' ? G.rows : G.cols)[k].reduce((s, n) => s + n, 0);
    const flags = idx.filter(i => G.st[i] === 2).length;
    if (flags !== need) return;
    startTimer();
    const boom = idx.find(i => (G.st[i] === 0 || G.st[i] === 3) && G.grid[i] === 1);
    if (boom != null) { lose(boom); return; }
    idx.forEach(i => { if (G.st[i] === 0 || G.st[i] === 3) { G.st[i] = 1; paintCell(i); } });
    for (let r = 0; r < G.H; r++) lineDone('r', r);
    for (let c = 0; c < G.W; c++) lineDone('c', c);
    checkWin();
  }
  function checkWin() {
    if (G.grid.some((v, i) => v === 0 && G.st[i] !== 1)) return;
    G.over = 'win';
    stopTimer();
    G.grid.forEach((v, i) => { if (v === 1) { G.st[i] = 2; paintCell(i); } });
    paintLed(ui.left, 0);
    setFace('cool');
    if (S.sound) OS.sound.play('notify');
    if (G.level === 'custom') return;
    const list = S.solved[G.level] || (S.solved[G.level] = []);
    if (list.indexOf(G.idx) < 0) list.push(G.idx);
    persist();
    // 破纪录：留名
    const best = S.best[G.level];
    if (!best || G.time < best.t) setTimeout(() => askName(G.level, G.time), 300);
  }
  function lose(i) {
    G.over = 'lose';
    G.boom = i;
    stopTimer();
    paintLose();
    setFace('dead');
    if (S.sound) OS.sound.play('burst');
  }
  // 表情脸：玩着点 ／ 炸了点 = 重开这一题；赢了点 = 下一题。10 秒内狂点 20 下：笑僵了
  function faceAction() {
    const now = Date.now();
    faceHits = faceHits.filter(t => now - t < 10000).concat(now);
    if (faceHits.length >= 20) { faceHits = []; setFace('stiff'); stopTimer(); setTimeout(() => { if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD); }, 700); return; }
    if (faceHits.length >= 14) { setFace('stiff'); return; }
    if (!G) return;
    if (G.over === 'win' && G.level !== 'custom') { S.idx[G.level] = (G.idx + 1) % 100; persist(); startLevel(G.level); return; }
    if (G.over === 'win' && G.level === 'custom') { startLevel('custom'); return; }
    newGame({ level: G.level, idx: G.idx, W: G.W, H: G.H, grid: G.grid });
  }

  /* ---------- 菜单 ---------- */
  function menuFor(m) {
    if (m === '游戏(G)') return [
      { label: L.newGame, action: faceAction },
      '-',
      ...LV.map(k => ({ label: L.levels[k], checked: S.level === k, action: () => startLevel(k) })),
      { label: L.levels.custom, checked: S.level === 'custom', action: customDialog },
      { label: L.pick, disabled: S.level === 'custom', action: pickDialog },
      '-',
      { label: L.marks, checked: S.marks, action: () => { S.marks = !S.marks; persist(); if (ui && G && oneKey()) build(); } },
      { label: L.color, checked: S.color, action: () => { S.color = !S.color; persist(); if (ui) ui.panel.classList.toggle('bw', !S.color); } },
      { label: L.sound, checked: S.sound, action: () => { S.sound = !S.sound; persist(); } },
      { label: L.zoom, checked: zoomOn(), action: () => { S.zoom = !zoomOn(); persist(); if (ui && G) { if (!S.zoom) ui.zoom = 0; build(); } } },
      { label: L.oneKey, checked: oneKey(), action: () => { S.oneKey = !oneKey(); persist(); if (ui && G) build(); } },
      '-',
      { label: L.best, action: bestDialog },
      '-',
      { label: L.quit, action: () => win && win.close() }
    ];
    return [{ label: L.help, action: say(L.help, 'help', L.helpText) }, '-', { label: L.about, action: say(L.about, 'info', L.aboutText) }];
  }
  // 选关：1 到 100，排过的打勾
  function pickDialog() {
    const lv = S.level, done = S.solved[lv] || [];
    const grid = el('div', { class: 'pa-pick' });
    const w = OS.wm.open({ title: L.pickTitle(L.levels[lv]), icon: 'sweep', width: 284, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'pa-pickw' }, [el('div', { class: 'pa-picktip', text: L.pickTip }), grid]) });
    for (let i = 0; i < 100; i++) {
      const b = el('div', { class: 'pa-pi' + (done.indexOf(i) >= 0 ? ' done' : '') + (G && G.level === lv && G.idx === i ? ' cur' : ''), text: String(i + 1) });
      b.addEventListener('click', () => { OS.sound.play('click'); w.close(); S.idx[lv] = i; persist(); startLevel(lv); });
      grid.appendChild(b);
    }
  }
  // 自定义：高度 5–16、宽度 5–30，雷数按数织最好玩的范围卡住（太少太多都没意思）
  function customDialog() {
    const c = S.custom;
    const field = (label, v) => { const i = el('input', { class: 'xl-input pa-num', type: 'text', inputmode: 'numeric', maxlength: '3' }); i.value = String(v); return [i, el('div', { class: 'pa-crow' }, [el('span', { text: label }), i])]; };
    const [h, hr] = field(L.height, c.h), [wi, wr] = field(L.width, c.w), [m, mr] = field(L.mines, c.m);
    const ok = el('button', { class: 'xpbtn default', text: L.ok }), no = el('button', { class: 'xpbtn', text: L.cancel });
    const w = OS.wm.open({ title: L.customTitle, icon: 'sweep', width: 220, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'pa-custom' }, [el('div', { class: 'pa-cfields' }, [hr, wr, mr]), el('div', { class: 'pa-cbtns' }, [ok, no])]) });
    no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    ok.addEventListener('click', () => {
      OS.sound.play('click');
      const n = (i, d) => { const v = parseInt(i.value, 10); return isFinite(v) ? v : d; };
      const H = Math.max(5, Math.min(16, n(h, c.h))), W = Math.max(5, Math.min(30, n(wi, c.w)));
      const M = Math.max(Math.round(W * H * 0.25), Math.min(Math.round(W * H * 0.7), n(m, c.m)));
      S.custom = { w: W, h: H, m: M };
      S.level = 'custom';
      persist();
      w.close();
      makeCustom(S.custom);
    });
  }
  // 英雄榜：三档各一个最快的
  function bestDialog() {
    const line = k => L.levels[k] + '：　' + (S.best[k] ? S.best[k].t + L.sec + '　' + S.best[k].name : '999' + L.sec + '　' + L.anon);
    OS.ui.dialog({ title: L.bestTitle, icon: 'sweep', text: LV.map(line).join('\n'), buttons: [L.reset, L.ok] }).then(v => {
      if (v === L.reset) { S.best = {}; persist(); bestDialog(); }
    });
  }
  function askName(lv, t) {
    const input = el('input', { class: 'xl-input', type: 'text', maxlength: '12' });
    input.value = (S.best[lv] && S.best[lv].name) || L.anon;
    const ok = el('button', { class: 'xpbtn default', text: L.ok });
    let done = false;
    const finish = () => { if (done) return; done = true; S.best[lv] = { t, name: input.value.trim() || L.anon }; persist(); w.close(); bestDialog(); };
    const w = OS.wm.open({ title: NAME, icon: 'sweep', width: 220, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'xl-ask' }, [el('div', { class: 'pa-rec', text: L.record(L.levels[lv]) }), input, el('div', { class: 'xl-ask-btns' }, [ok])]),
      onClose: () => { if (!done) { done = true; S.best[lv] = { t, name: L.anon }; persist(); } } });
    ok.addEventListener('click', () => { OS.sound.play('click'); finish(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(); });
    setTimeout(() => { try { input.focus(); input.select(); } catch (_) { /* ignore */ } }, 50);
  }

  OS.paile = { generate, deduce };
})();
