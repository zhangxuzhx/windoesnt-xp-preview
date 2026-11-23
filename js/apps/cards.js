/* 扑克牌（接牌、空当算 24、蜘蛛合牌、黑心大战共用）
   - 牌一张 { r: 1–13, s: 0 黑桃 1 红心 2 梅花 3 方块 }；王：{ joker: true, r: 0 }（黑心大战的王八牌，assets/cards/joker.webp）
   - 牌面：数字牌代码画（角上点数和花色，中间花色排好，照 XP 那种干净的画法）；
     J、Q、K 用 Codex 画的 12 张人头（assets/cards/，上下对称的双头像）；OS.cards.art = false 就退回框里一个大字母
   - 牌背：12 张，几张会动；拿现成的图拼（小鸭子、铁公鸡、蚊香、羊、葱油饼……），会动的用代码动
     选的那张记在存档 cardBack，几个牌类游戏都用这一张；换了发 cards:back
   - OS.cards.face(card) ／ OS.cards.back() → 元素；OS.cards.pickBack() → 选择牌背对话框 */
(function () {
  'use strict';
  const el = OS.el;
  const W = 54, H = 72;
  const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const red = s => s === 1 || s === 3;
  // 花色，画在 10×10 的格子里
  const SUIT = [
    'M5 0C6.5 2.2 10 4 10 6.2 10 7.6 8.9 8.6 7.6 8.6 6.9 8.6 6.2 8.3 5.8 7.8 6 8.9 6.5 9.6 7.2 10H2.8C3.5 9.6 4 8.9 4.2 7.8 3.8 8.3 3.1 8.6 2.4 8.6 1.1 8.6 0 7.6 0 6.2 0 4 3.5 2.2 5 0Z',
    'M5 9.6C1.2 6.6 0 4.7 0 3 0 1.3 1.3 0 2.8 0 3.8 0 4.6.6 5 1.4 5.4.6 6.2 0 7.2 0 8.7 0 10 1.3 10 3 10 4.7 8.8 6.6 5 9.6Z',
    'M5 0A2.4 2.4 0 1 1 5 4.8 2.4 2.4 0 1 1 5 0ZM2.5 3.6A2.4 2.4 0 1 1 2.5 8.4 2.4 2.4 0 1 1 2.5 3.6ZM7.5 3.6A2.4 2.4 0 1 1 7.5 8.4 2.4 2.4 0 1 1 7.5 3.6ZM4.4 5.6H5.6L6.6 10H3.4Z',
    'M5 0L9 5 5 10 1 5Z'
  ];
  const pip = (s, cx, cy, size, flip) => '<path d="' + SUIT[s] + '" transform="translate(' + (cx - size / 2) + ' ' + (cy - size / 2) + ') scale(' + (size / 10) + ')' + (flip ? ' rotate(180 5 5)' : '') + '"/>';
  // 中间花色的位置：[x, y, 倒过来]
  const L = 18, M = 27, R = 36;
  const PIPS = {
    2: [[M, 15], [M, 57, 1]],
    3: [[M, 15], [M, 36], [M, 57, 1]],
    4: [[L, 15], [R, 15], [L, 57, 1], [R, 57, 1]],
    5: [[L, 15], [R, 15], [M, 36], [L, 57, 1], [R, 57, 1]],
    6: [[L, 15], [R, 15], [L, 36], [R, 36], [L, 57, 1], [R, 57, 1]],
    7: [[L, 15], [R, 15], [M, 25.5], [L, 36], [R, 36], [L, 57, 1], [R, 57, 1]],
    8: [[L, 15], [R, 15], [M, 25.5], [L, 36], [R, 36], [M, 46.5, 1], [L, 57, 1], [R, 57, 1]],
    9: [[L, 15], [R, 15], [L, 29], [R, 29], [M, 36], [L, 43, 1], [R, 43, 1], [L, 57, 1], [R, 57, 1]],
    10: [[L, 15], [R, 15], [M, 22], [L, 29], [R, 29], [L, 43, 1], [R, 43, 1], [M, 50, 1], [L, 57, 1], [R, 57, 1]]
  };
  const FACE_FILE = { 11: 'j', 12: 'q', 13: 'k' };
  const SUIT_FILE = ['spade', 'heart', 'club', 'diamond'];
  const cards = OS.cards = { W, H, RANKS, red, art: true };   // J Q K 的人头图来了（2026-11-23）

  const cache = {};
  function faceSvg(c) {
    if (c.joker) return jokerSvg();
    const key = c.r + '-' + c.s;
    if (cache[key]) return cache[key];
    const col = red(c.s) ? '#d40000' : '#000';
    const corner = '<text x="5.6" y="10.4" text-anchor="middle" font-size="' + (c.r === 10 ? 8.6 : 10) + '" font-weight="bold" font-family="Tahoma,Verdana,sans-serif" letter-spacing="' + (c.r === 10 ? -0.8 : 0) + '">' + RANKS[c.r] + '</text>' + pip(c.s, 5.6, 16, 6.4);
    let mid = '';
    if (c.r === 1) mid = pip(c.s, M, 36, c.s === 0 ? 22 : 16);
    else if (c.r <= 10) mid = PIPS[c.r].map(p => pip(c.s, p[0], p[1], 9, p[2])).join('');
    else if (cards.art) mid = '<image href="assets/cards/' + FACE_FILE[c.r] + '-' + SUIT_FILE[c.s] + '.webp" x="11" y="8" width="32" height="56" preserveAspectRatio="xMidYMid slice"/><rect x="11" y="8" width="32" height="56" fill="none" stroke="' + col + '" stroke-width=".8"/>';
    else {
      // 人头图没来之前：一个框，中间大字母，四角小花色
      mid = '<rect x="11" y="8" width="32" height="56" rx="1.5" fill="' + (red(c.s) ? '#fff1d6' : '#e8eefc') + '" stroke="' + col + '" stroke-width=".8"/>' +
        '<text x="27" y="44" text-anchor="middle" font-size="26" font-weight="bold" font-family="Georgia,\'Times New Roman\',serif">' + RANKS[c.r] + '</text>' +
        pip(c.s, 15.5, 13, 5) + pip(c.s, 38.5, 59, 5, 1);
    }
    const svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" fill="' + col + '">' + mid + corner + '<g transform="rotate(180 27 36)">' + corner + '</g></svg>';
    cache[key] = svg;
    return svg;
  }
  // 王：红字，两个角竖着写 J O K E R，中间是小丑乌龟
  function jokerSvg() {
    if (cache.joker) return cache.joker;
    const letters = 'JOKER'.split('').map((ch, i) => '<text x="4.4" y="' + (8.4 + i * 6.3).toFixed(1) + '" text-anchor="middle" font-size="6.4" font-weight="bold" font-family="Tahoma,Verdana,sans-serif">' + ch + '</text>').join('');
    cache.joker = '<svg viewBox="0 0 ' + W + ' ' + H + '" fill="#d40000"><image href="assets/cards/joker.webp" x="8" y="7" width="38" height="58" preserveAspectRatio="xMidYMid slice"/><rect x="8" y="7" width="38" height="58" fill="none" stroke="#d40000" stroke-width=".8"/>' +
      letters + '<g transform="rotate(180 27 36)">' + letters + '</g></svg>';
    return cache.joker;
  }
  cards.faceSvg = faceSvg;
  cards.face = function (c) {
    const n = el('div', { class: 'cd' + (red(c.s) || c.joker ? ' red' : '') + (c.joker ? ' joker' : ''), html: faceSvg(c) });
    return n;
  };

  /* ---------- 牌背 ---------- */
  // ico：用现成的图标；img：用现成的图；anim：会动（CSS 里 .cb-xxx 写动法）
  const BACKS = [
    { id: 'logo', ico: 'logo' },
    { id: 'duck', ico: 'duck', anim: 1 },
    { id: 'rooster', ico: 'koukou', anim: 1 },
    { id: 'sheep', ico: 'ava-sheep' },
    { id: 'coil', ico: 'coil', anim: 1 },
    { id: 'pie', img: 'assets/office/pie.webp' },
    { id: 'stars', anim: 1 },
    { id: 'cassette', ico: 'cassette' },
    { id: 'drive', anim: 1 },
    { id: 'floppy', ico: 'floppy' },
    { id: 'plaid' },
    { id: 'dots' }
  ];
  cards.BACKS = BACKS;
  const backId = () => { const id = OS.save.get('cardBack', 'logo'); return BACKS.some(b => b.id === id) ? id : 'logo'; };
  cards.backId = backId;
  cards.back = function (id) {
    const b = BACKS.find(x => x.id === (id || backId())) || BACKS[0];
    const kids = [];
    if (b.ico) kids.push(OS.iconEl(b.ico, 'cb-ico'));
    if (b.img) kids.push(el('img', { class: 'cb-img', src: b.img, alt: '' }));
    if (b.id === 'coil') for (let i = 0; i < 3; i++) kids.push(el('i', { class: 'cb-smoke s' + i }));
    if (b.id === 'stars') for (let i = 0; i < 10; i++) kids.push(el('i', { class: 'cb-star', style: { '--a': (i * 36 + (i % 2) * 17) + 'deg', animationDelay: (-i * 0.23) + 's' } }));
    if (b.id === 'drive') kids.push(el('i', { class: 'cb-slot' }), el('i', { class: 'cb-led' }));
    return el('div', { class: 'cb cb-' + b.id }, [el('div', { class: 'cb-in' }, kids)]);
  };

  // 游戏 ▸ 牌背…：12 张一排排挑，双击直接选上
  cards.pickBack = function () {
    let cur = backId();
    const grid = el('div', { class: 'cbp' });
    let last = { id: '', t: 0 };
    const items = BACKS.map(b => {
      const n = el('div', { class: 'cbp-i' + (b.id === cur ? ' on' : '') }, [cards.back(b.id)]);
      n.addEventListener('click', () => {
        const now = Date.now();
        cur = b.id;
        items.forEach((m, i) => m.classList.toggle('on', BACKS[i].id === cur));
        if (last.id === b.id && now - last.t < OS.dblMs()) { done(true); return; }   // 双击直接选上（双击速度照控制面板）
        last = { id: b.id, t: now };
      });
      grid.appendChild(n);
      return n;
    });
    const ok = el('button', { class: 'xpbtn default', text: '确定' });
    const no = el('button', { class: 'xpbtn', text: '取消' });
    const win = OS.wm.open({ title: '选择牌背', width: 350, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'cbp-w' }, [grid, el('div', { class: 'dlg-btns' }, [ok, no])]) });
    function done(save) {
      if (save && cur !== backId()) { OS.save.set('cardBack', cur); OS.emit('cards:back', cur); }
      if (!win.isClosed) win.close();
    }
    ok.addEventListener('click', () => { OS.sound.play('click'); done(true); });
    no.addEventListener('click', () => { OS.sound.play('click'); done(false); });
    return win;
  };
})();
