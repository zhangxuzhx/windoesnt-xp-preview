/* 接牌（XP 纸牌 → 接牌；开始 ▸ 所有程序 ▸ 游戏）——高尔夫的玩法，样子照原版纸牌
   - 七列各 5 张，全是明牌；左上剩 16 张，开局先翻一张飞到右上接牌堆当底牌
   - 七列最外面那张比底牌大一或小一（不管花色）就能接走，变成新底牌；双击，或者拖到接牌堆上
   - 接不下去点左上翻一张；左上翻完了是红叉；七列接光就赢
   - 选项：转圈（K 和 A 能接上，默认）／ 不转圈；计分：标准 ／ 拉斯维加斯 ／ 不计分；计时、状态栏、累计得分
     （原版"抽一张 ／ 抽三张"那一栏换成转圈：接牌里抽三张几乎没有能赢的局）
   - 每局发牌前电脑先试一遍，只发能赢的
   - 标准计分：接走一张 +5，一口气连着接每张多 5（5、10、15……）；赢了左上剩一张 +20；计时每 10 秒 −2，赢了按用时加奖励（照原版）
     拉斯维加斯：每局先扣 $52，接走一张 $5
   - 赢了：瀑布落牌；点台布多弹一张，按任意键停
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
    helpText: '接牌\n\n七列牌全摊开了，看准了再接。\n比右上那张大一或小一的牌，不管花色，双击或者拖过去就接上了。\n接不下去了，点左上那叠翻一张。\n七列接光就赢。',
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
  const fits = (a, b, wrap) => { const d = Math.abs(a - b); return d === 1 || (wrap && d === 12); };
  // 这副牌能不能接光（只看点数；算太久就当没解，换一副）
  function solvable(cols, stock, wrap) {
    const H = [5, 5, 5, 5, 5, 5, 5], seen = new Set();
    let n = 0;
    function go(base, sp, left) {
      if (!left) return true;
      if (++n > 120000) throw new Error('long');
      let key = 0;
      for (const h of H) key = key * 6 + h;
      key = (key * 18 + sp) * 14 + base;
      if (seen.has(key)) return false;
      seen.add(key);
      for (let c = 0; c < 7; c++) {
        const h = H[c];
        if (!h) continue;
        const a = cols[c][h - 1].r;
        if (!fits(a, base, wrap)) continue;
        H[c]--;
        const ok = go(a, sp, left - 1);
        H[c]++;
        if (ok) return true;
      }
      return sp < stock.length && go(stock[sp].r, sp + 1, left);
    }
    try { return go(stock[0].r, 1, 35); } catch (_) { return false; }
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
    for (let k = 0; k < 40 && !solvable(d.cols, d.stock, S.wrap); k++) d = shuffle();   // 只发能赢的
    G = { cols: d.cols, stock: d.stock, sp: 1, pile: [d.stock[0]], combo: 0, score: 0, time: 0, started: false, timer: 0, over: '', undo: null, busy: false };
    if (S.scoring === 'vegas') {
      if (S.cumulative) { S.bank -= 52; persist(); G.score = S.bank; } else G.score = -52;
    }
    render();
    // 开局：左上翻一张飞到接牌堆
    fly(G.pile[0], slotPos('stock'), slotPos('pile'));
  }

  /* ---------- 摆法：桌子宽度量出来，七列平均分 ---------- */
  const CW = C.W, CH = C.H, TOP = 8, FAN = 14;
  const gap = () => (ui.table.clientWidth - 7 * CW) / 8;
  const colX = i => Math.round(gap() + i * (CW + gap()));
  const colY = 8 + CH + 12;
  const slotPos = k => k === 'stock' ? { x: colX(0), y: TOP } : { x: colX(6), y: TOP };
  const cardPos = (c, i) => ({ x: colX(c), y: colY + i * FAN });

  function place(n, p) { n.style.left = p.x + 'px'; n.style.top = p.y + 'px'; return n; }
  // hide：接牌堆最上面那张先不画（有一张正在飞过去）
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
    // 右上：接牌堆
    t.appendChild(place(el('div', { class: 'jp-slot' }), slotPos('pile')));
    const showN = G.pile.length - (hide ? 1 : 0);
    if (showN > 0) t.appendChild(place(C.face(G.pile[showN - 1]), slotPos('pile')));
    // 七列
    G.cols.forEach((col, c) => col.forEach((card, i) => {
      const n = place(C.face(card), cardPos(c, i));
      if (i === col.length - 1 && !G.over) { n.classList.add('jp-top'); n.dataset.col = c; }
      t.appendChild(n);
    }));
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
  function fly(card, from, to, done) {
    G.busy = true;
    render(true);
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
  const snap = () => ({ cols: G.cols.map(c => c.slice()), sp: G.sp, pile: G.pile.slice(), combo: G.combo, score: G.score, bank: S.bank });
  function play(c, dropped) {
    if (!G || G.over || G.busy) return false;
    const col = G.cols[c], card = col[col.length - 1];
    if (!card || !fits(card.r, G.pile[G.pile.length - 1].r, S.wrap)) return false;
    startTimer();
    G.undo = snap();
    const from = cardPos(c, col.length - 1);
    col.pop();
    G.pile.push(card);
    G.combo++;
    if (S.scoring === 'std') G.score += 5 * G.combo;
    if (S.scoring === 'vegas') { G.score += 5; if (S.cumulative) { S.bank += 5; persist(); } }
    if (dropped) { render(); checkWin(); } else fly(card, from, slotPos('pile'), checkWin);
    return true;
  }
  function flip() {
    if (!G || G.over || G.busy || G.sp >= G.stock.length) return;
    startTimer();
    G.undo = snap();
    const card = G.stock[G.sp++];
    G.pile.push(card);
    G.combo = 0;
    fly(card, slotPos('stock'), slotPos('pile'));
  }
  function undo() {
    if (!G || G.over || G.busy || !G.undo) return;
    const u = G.undo;
    Object.assign(G, { cols: u.cols, sp: u.sp, pile: u.pile, combo: u.combo, score: u.score, undo: null });
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
    const n = e.target.closest('.jp-top, .jp-stock, .jp-deck, .jp-under');
    if (!n) return;
    const p = OS.stage.toLocal(e.clientX, e.clientY);
    drag = { id: e.pointerId, n, p0: p, x0: parseFloat(n.style.left), y0: parseFloat(n.style.top), moved: false, col: n.dataset.col != null ? +n.dataset.col : -1 };
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id || drag.col < 0) return;
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
      // 牌心落在接牌堆附近就算放上去了；接不上就弹回去
      const x = parseFloat(d.n.style.left) + CW / 2, y = parseFloat(d.n.style.top) + CH / 2, pp = slotPos('pile');
      const onPile = x > pp.x - 16 && x < pp.x + CW + 16 && y > pp.y - 16 && y < pp.y + CH + 16;
      if (onPile && play(d.col, true)) return;
      d.n.classList.remove('jp-drag');
      d.n.classList.add('jp-back');
      place(d.n, { x: d.x0, y: d.y0 });
      setTimeout(render, 130);
      return;
    }
    if (d.col < 0) { flip(); return; }
    // 双击送上去（双击速度照控制面板）
    const id = G.cols[d.col][G.cols[d.col].length - 1].id, now = Date.now();
    if (lastTap.id === id && now - lastTap.t < OS.dblMs()) { lastTap = { id: -1, t: 0 }; play(d.col); return; }
    lastTap = { id, t: now };
  }

  /* ---------- 赢了：瀑布落牌 ---------- */
  // 接牌堆的牌一张张弹出来，在台布上蹦，拖一串影子；点台布多弹一张，按任意键停
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
    const queue = G.pile.slice().reverse();
    queue.forEach(cardImg);
    const pp = slotPos('pile');
    fall = { cv, ctx, queue, live: [], frame: 0, extra: 0, raf: 0, w, h };
    const launch = card => {
      fall.live.push({ img: cardImg(card), x: pp.x, y: pp.y, vx: (Math.random() < 0.6 ? -1 : 1) * (2.5 + Math.random() * 4), vy: -Math.random() * 6 });
    };
    fall.launch = launch;
    const step = () => {
      if (!fall) return;
      fall.frame++;
      if (fall.queue.length && (fall.frame % 34 === 1 || !fall.live.length)) launch(fall.queue.shift());
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
