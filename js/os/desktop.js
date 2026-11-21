/* 桌面：壁纸、图标、右下角“未激活”水印
   操作跟XP一样：
   - 双击图标打开（手机上连点两下）
   - 按住图标拖动；选中多个时一起拖
   - 在空白处按住拖，拉出选框选中多个图标 */
(function () {
  'use strict';
  const el = OS.el;
  const D = OS.desktop = {};
  const CELL_W = 78, CELL_H = 68, ICON_W = 76;
  const DOUBLE_TAP_MS = 450;

  // 自己画的壁纸：蓝天、草坡、一块写着“此处无木牌”的木牌、一只羊
  const WALLPAPER =
    '<svg id="wallpaper" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
    '<linearGradient id="wpSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a63c9"/><stop offset=".5" stop-color="#5d9be8"/><stop offset=".78" stop-color="#a9d0fb"/><stop offset="1" stop-color="#d9ecff"/></linearGradient>' +
    '<linearGradient id="wpHillA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fc23f"/><stop offset="1" stop-color="#2d7a1c"/></linearGradient>' +
    '<linearGradient id="wpHillB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8bd94f"/><stop offset=".6" stop-color="#4ea02a"/><stop offset="1" stop-color="#2a6e17"/></linearGradient>' +
    '<radialGradient id="wpCloud"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".6" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '</defs>' +
    '<rect width="1600" height="900" fill="url(#wpSky)"/>' +
    '<g fill="url(#wpCloud)"><ellipse cx="300" cy="200" rx="230" ry="60"/><ellipse cx="430" cy="170" rx="140" ry="55"/>' +
    '<ellipse cx="1050" cy="140" rx="260" ry="55"/><ellipse cx="1190" cy="170" rx="160" ry="50"/>' +
    '<ellipse cx="760" cy="310" rx="180" ry="40"/><ellipse cx="1450" cy="340" rx="150" ry="35"/></g>' +
    '<path d="M0 600 C220 520 520 520 820 590 C1080 650 1320 560 1600 520 V900 H0Z" fill="url(#wpHillA)"/>' +
    '<g transform="translate(1110 548)"><rect x="-4" y="0" width="8" height="74" fill="#7a4f25"/>' +
    '<rect x="-74" y="-40" width="148" height="46" rx="4" fill="#c8924f" stroke="#7a4f25" stroke-width="4"/>' +
    '<text x="0" y="-9" font-size="23" text-anchor="middle" fill="#4a2c0f" font-weight="bold" font-family="sans-serif">此处无木牌</text></g>' +
    '<path d="M0 690 C300 590 700 560 1040 640 C1260 690 1450 690 1600 650 V900 H0Z" fill="url(#wpHillB)"/>' +
    '</svg>';

  // 草坡上的羊单独画（要能点、能晃、能炸）。位置按壁纸坐标 (1290, 668) 算
  const SHEEP_AT = { x: 1290, y: 668 }, SHEEP_BOX = { x: -26, y: -24, w: 78, h: 58 };
  const SHEEP_SVG =
    '<svg viewBox="-26 -24 78 58" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M4 18 V31 M28 18 V31" stroke="#333" stroke-width="4"/>' +
    '<g fill="#fff"><circle cx="0" cy="0" r="16"/><circle cx="16" cy="-5" r="15"/><circle cx="32" cy="0" r="16"/><circle cx="16" cy="8" r="16"/></g>' +
    '<ellipse cx="-13" cy="2" rx="9" ry="8" fill="#333"/></svg>';

  let root, iconLayer, watermark;
  const icons = {};
  let grid = { cols: 1, rows: 1, ox: 0, oy: 0 };

  D.init = function (parent) {
    root = el('div', { id: 'desktop', class: 'layer', html: WALLPAPER });
    iconLayer = el('div', { id: 'icons', class: 'layer' });
    watermark = el('div', { id: 'watermark', html: "Windoesn't XP 无聊版<br>本系统疑似盗版，建议报警抓你自己" });
    root.appendChild(iconLayer);
    root.appendChild(watermark);
    parent.appendChild(root);

    bindBand();
    OS.ui.onContext(iconLayer, () => OS.menus.desktop());
    initSheep();
    OS.apps.list.filter(a => a.desktop).forEach(addIcon);
    OS.on('stage:resize', relayout);
    relayout();
  };
  D.root = () => root;
  D.count = () => Object.keys(icons).length;

  /* ---------- 右键菜单用到的桌面功能 ---------- */
  // 排列图标：名称 / 大小（名字长短）/ 类型（系统的排前面）/ 修改时间（倒过来）/ 按心情（随机）
  D.arrange = function (mode) {
    const order = OS.apps.list.filter(a => icons[a.id]).map(a => icons[a.id]);
    if (mode === 'name') order.sort((a, b) => a.app.name.localeCompare(b.app.name, 'zh-Hans-CN'));
    else if (mode === 'size') order.sort((a, b) => a.app.name.length - b.app.name.length);
    else if (mode === 'type') order.sort((a, b) => (a.app.acceptsDrop || a.app.id === 'mycomputer' ? 0 : 1) - (b.app.acceptsDrop || b.app.id === 'mycomputer' ? 0 : 1));
    else if (mode === 'time') order.reverse();
    else OS.shuffle(order);
    order.forEach(ic => { ic.col = -1; ic.row = -1; });
    order.forEach(ic => { const f = firstFree(ic); ic.col = f[0]; ic.row = f[1]; settle(ic); });
    savePositions();
  };

  // 刷新：图标闪一下（XP 玩家的肌肉记忆）
  let refreshCount = 0;
  D.refresh = function () {
    iconLayer.classList.add('refreshing');
    setTimeout(() => iconLayer.classList.remove('refreshing'), 120);
    refreshCount++;
    const total = OS.save.get('refreshTotal', 0) + 1;
    OS.save.set('refreshTotal', total);
    const say = { 10: '刷新了 10 次，新……新了吗？', 30: '桌面已经快被你刷掉漆了。', 100: '恭喜解锁成就「刷新大师」。\n该成就没有任何用处。' }[refreshCount];
    if (say) OS.ui.notify({ title: '刷新', text: say, icon: 'info', replace: true, timeout: 4000 });
  };

  let iconsShown = true;
  D.iconsVisible = () => iconsShown;
  D.toggleIcons = function () {
    iconsShown = !iconsShown;
    iconLayer.classList.toggle('hide-icons', !iconsShown);
    if (!iconsShown) setSelection([]);
  };

  // 剪切：图标变半透明
  D.setCut = function (id) {
    Object.keys(icons).forEach(k => icons[k].el.classList.toggle('cut', k === id));
  };

  /* ---------- 壁纸上的羊：点一下晃一下，连点 9 下像气球一样炸掉 ---------- */
  const SHEEP_POP_TAPS = 9, SHEEP_GAP_MS = 1200;
  let sheep, sheepTaps = 0, sheepLast = 0, sheepTimer = 0, sheepScale = 0.4;

  function initSheep() {
    sheep = el('div', { class: 'sheep', html: SHEEP_SVG });
    iconLayer.appendChild(sheep);   // 放在图标前面，图标会盖在羊上面
    sheep.addEventListener('click', tapSheep);
  }
  function placeSheep() {
    const w = root.offsetWidth, h = root.offsetHeight;
    const s = sheepScale = Math.max(w / 1600, h / 900);
    const ox = (w - 1600 * s) / 2, oy = (h - 900 * s) / 2;
    sheep.style.left = (ox + (SHEEP_AT.x + SHEEP_BOX.x) * s) + 'px';
    sheep.style.top = (oy + (SHEEP_AT.y + SHEEP_BOX.y) * s) + 'px';
    sheep.style.width = SHEEP_BOX.w * s + 'px';
    sheep.style.height = SHEEP_BOX.h * s + 'px';
  }
  function tapSheep() {
    if (sheep.classList.contains('gone')) return;
    setSelection([]);
    lastTap = null;
    const now = Date.now();
    sheepTaps = now - sheepLast < SHEEP_GAP_MS ? sheepTaps + 1 : 1;
    sheepLast = now;
    clearTimeout(sheepTimer);
    if (sheepTaps >= SHEEP_POP_TAPS) { popSheep(); return; }
    OS.sound.play('baa', sheepTaps);
    // 每点一下就鼓一点点，像在吹气球
    sheep.style.setProperty('--s', 1 + sheepTaps * 0.045);
    sheep.classList.remove('wobble');
    void sheep.offsetWidth;
    sheep.classList.add('wobble');
    // 停手一会儿，羊慢慢瘪回去，要重新数
    sheepTimer = setTimeout(() => { sheepTaps = 0; sheep.style.setProperty('--s', 1); }, SHEEP_GAP_MS);
  }
  function popSheep() {
    sheepTaps = 0;
    OS.save.set('sheepPops', OS.save.get('sheepPops', 0) + 1);
    sheep.classList.remove('wobble');
    sheep.classList.add('inflate');
    sheep.style.setProperty('--s', 1.5);
    setTimeout(() => {
      const x = parseFloat(sheep.style.left), y = parseFloat(sheep.style.top);
      const cx = x + sheep.offsetWidth * 0.45, cy = y + sheep.offsetHeight * 0.4;
      sheep.classList.remove('inflate');
      sheep.classList.add('gone');
      sheep.style.setProperty('--s', 1);
      OS.sound.play('burst');
      burst(cx, cy, sheepScale / 0.4);
      setTimeout(() => OS.ui.notify({
        title: '温馨提示', icon: 'info', timeout: 6500,
        text: '你把羊点炸了。\n但这个彩蛋其实要 2011 年才被发明。'
      }), 700);
      setTimeout(() => D.iconSay('folder2', '老公，下面羊死了'), 2700);
    }, 130);
  }
  // 炸开：一圈白色冲击波 + 一团团羊毛和头、腿飞出去再落下
  function burst(cx, cy, k) {
    const box = el('div', { class: 'burst' });
    iconLayer.appendChild(box);
    const ring = el('div', { class: 'burst-ring' });
    ring.style.left = cx + 'px'; ring.style.top = cy + 'px';
    box.appendChild(ring);
    const bits = [];
    for (let i = 0; i < 18; i++) bits.push({ cls: 'wool', size: (4 + Math.random() * 6) * k });
    bits.push({ cls: 'dark head', w: 8 * k, h: 7 * k }, { cls: 'dark leg', w: 2 * k, h: 6 * k }, { cls: 'dark leg', w: 2 * k, h: 6 * k });
    bits.forEach(b => {
      const n = el('div', { class: 'bit ' + b.cls });
      n.style.width = (b.w || b.size) + 'px';
      n.style.height = (b.h || b.size) + 'px';
      n.style.left = (cx - (b.w || b.size) / 2) + 'px';
      n.style.top = (cy - (b.h || b.size) / 2) + 'px';
      box.appendChild(n);
      const a = Math.random() * Math.PI * 2, sp = (140 + Math.random() * 200) * k;
      const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp - 120 * k, g = 520 * k;
      const spin = (Math.random() - 0.5) * 900, dur = 0.9 + Math.random() * 0.5;
      const frames = [];
      for (let f = 0; f <= 10; f++) {
        const t = f / 10 * dur, d = (1 - Math.exp(-3 * t)) / 3;
        frames.push({
          transform: 'translate(' + (vx * d).toFixed(1) + 'px,' + (vy * d + 0.5 * g * t * t).toFixed(1) + 'px) rotate(' + (spin * t).toFixed(0) + 'deg)',
          opacity: f < 7 ? 1 : 1 - (f - 6) / 4
        });
      }
      n.animate(frames, { duration: dur * 1000, easing: 'linear', fill: 'forwards' });
    });
    setTimeout(() => box.remove(), 1600);
  }

  // 让桌面图标“说话”：在图标旁边冒个 XP 那种黄色小气泡
  D.iconSay = function (id, text, ms) {
    const ic = icons[id];
    if (!ic || !iconsShown) { OS.ui.notify({ title: ic ? ic.app.name : '', text, icon: 'info', timeout: 4500 }); return; }
    const st = OS.stage;
    const b = el('div', { class: 'say-bubble', text });
    document.getElementById('balloons').appendChild(b);
    const ix = parseFloat(ic.el.style.left) + ICON_W / 2, iy = parseFloat(ic.el.style.top);
    const below = iy - b.offsetHeight - 10 < st.TICKER_H;   // 上面放不下就放到图标下面
    const left = OS.clamp(ix - 22, st.insets.l + 4, st.W - st.insets.r - b.offsetWidth - 4);
    b.style.left = left + 'px';
    b.style.top = (below ? iy + ic.el.offsetHeight + 8 : iy - b.offsetHeight - 8) + 'px';
    b.style.setProperty('--tail', (ix - left) + 'px');
    b.classList.add(below ? 'below' : 'above');
    ic.el.classList.add('shake');
    setTimeout(() => ic.el.classList.remove('shake'), 450);
    OS.sound.play('pop');
    let gone = false;
    const kill = () => { if (gone) return; gone = true; b.classList.add('out'); setTimeout(() => b.remove(), 250); };
    b.addEventListener('click', kill);
    setTimeout(kill, ms || 4500);
  };

  // 重新开机/注销：羊回来，没说完的话收掉（小软件也可以听 desktop:reset 自己复位）
  D.reset = function () {
    if (sheep) { sheep.classList.remove('gone', 'wobble', 'inflate'); sheep.style.setProperty('--s', 1); }
    sheepTaps = 0;
    document.querySelectorAll('.say-bubble').forEach(n => n.remove());
    OS.emit('desktop:reset');
  };

  /* ---------- 给小软件用：图标在哪、把图标踢飞 ---------- */
  D.layer = () => iconLayer;
  D.iconBox = function (id) {
    const ic = icons[id];
    if (!ic || !iconsShown) return null;
    return { x: parseFloat(ic.el.style.left), y: parseFloat(ic.el.style.top), w: ICON_W, h: ic.el.offsetHeight };
  };
  // 把一个图标踢到随便一个空格子里（飞过去还转一圈）
  D.kick = function (id) {
    const ic = icons[id];
    if (!ic || !iconsShown) return false;
    const free = [];
    for (let c = 0; c < grid.cols; c++) for (let r = 0; r < grid.rows; r++) if (valid(c, r) && !occupant(c, r)) free.push([c, r]);
    if (!free.length) return false;
    const f = OS.pick(free);
    ic.col = f[0]; ic.row = f[1];
    ic.el.classList.remove('kicked');
    void ic.el.offsetWidth;
    ic.el.classList.add('kicked');
    position(ic);
    setTimeout(() => ic.el.classList.remove('kicked'), 650);
    savePositions();
    return true;
  };
  D.ids = () => Object.keys(icons);

  function addIcon(app) {
    const node = el('div', { class: 'dicon', 'data-app': app.id }, [
      OS.iconEl(app.icon, 'di-img'),
      el('div', { class: 'di-label', text: app.name })
    ]);
    const ic = { app, el: node, col: -1, row: -1 };
    icons[app.id] = ic;
    iconLayer.appendChild(node);
    bindIcon(ic);
    OS.ui.onContext(node, () => {
      if (!selected.has(ic)) setSelection([ic]);
      lastTap = null;
      return OS.menus.icon(app);
    });
  }

  /* ---------- 网格 ---------- */
  function computeGrid() {
    const st = OS.stage;
    const ox = st.iconOrigin.x, oy = st.iconOrigin.y;
    grid = {
      ox, oy,
      cols: Math.max(1, Math.floor((st.W - st.insets.r - ox) / CELL_W)),
      rows: Math.max(1, Math.floor((st.H - st.TASKBAR_H - oy - 2) / CELL_H))
    };
  }
  function cellRect(c, r) { return { x: grid.ox + c * CELL_W, y: grid.oy + r * CELL_H, w: CELL_W, h: CELL_H }; }
  // B站按钮正下方的格子不放图标（放了也点不到）
  function blocked(c, r) {
    const cap = OS.stage.capsule;
    if (!cap) return false;
    const a = cellRect(c, r);
    return !(a.x + a.w <= cap.x || a.x >= cap.x + cap.w || a.y + a.h <= cap.y || a.y >= cap.y + cap.h);
  }
  function valid(c, r) { return c >= 0 && r >= 0 && c < grid.cols && r < grid.rows && !blocked(c, r); }
  function occupant(c, r, except) {
    for (const id in icons) {
      const ic = icons[id];
      if (ic !== except && ic.col === c && ic.row === r) return ic;
    }
    return null;
  }
  function firstFree(except) {
    for (let c = 0; c < grid.cols; c++) for (let r = 0; r < grid.rows; r++) {
      if (valid(c, r) && !occupant(c, r, except)) return [c, r];
    }
    return [0, 0];
  }
  function nearestFree(tc, tr) {
    let best = null, bestD = Infinity;
    for (let c = 0; c < grid.cols; c++) for (let r = 0; r < grid.rows; r++) {
      if (!valid(c, r) || occupant(c, r)) continue;
      const dx = (c - tc) * CELL_W, dy = (r - tr) * CELL_H, d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = [c, r]; }
    }
    return best || [tc, tr];
  }

  function relayout() {
    computeGrid();
    const saved = OS.save.get('iconPos', {});
    Object.keys(icons).forEach(id => { icons[id].col = -1; icons[id].row = -1; });
    OS.apps.list.forEach(a => {
      const ic = icons[a.id], p = saved[a.id];
      if (ic && p && valid(p[0], p[1]) && !occupant(p[0], p[1], ic)) { ic.col = p[0]; ic.row = p[1]; }
    });
    OS.apps.list.forEach(a => {
      const ic = icons[a.id];
      if (!ic || ic.col >= 0) return;
      const f = firstFree(ic); ic.col = f[0]; ic.row = f[1];
    });
    Object.keys(icons).forEach(id => position(icons[id]));
    placeSheep();
    const st = OS.stage;
    watermark.style.right = (st.insets.r + 8) + 'px';
    watermark.style.bottom = (st.TASKBAR_H + 6) + 'px';
  }

  function position(ic) {
    const r = cellRect(ic.col, ic.row);
    ic.el.style.left = (r.x + (CELL_W - ICON_W) / 2) + 'px';
    ic.el.style.top = r.y + 'px';
  }
  function settle(ic) {
    ic.el.classList.add('settle');
    position(ic);
    setTimeout(() => ic.el.classList.remove('settle'), 220);
  }
  function savePositions() {
    const out = {};
    Object.keys(icons).forEach(id => { out[id] = [icons[id].col, icons[id].row]; });
    OS.save.set('iconPos', out);
  }

  /* ---------- 选中 ---------- */
  let selected = new Set();
  function setSelection(list) {
    selected.forEach(ic => ic.el.classList.remove('sel'));
    selected = new Set(list);
    selected.forEach(ic => ic.el.classList.add('sel'));
  }
  D.clearSelection = () => setSelection([]);

  // 在空白处按住拖：拉出选框
  function bindBand() {
    iconLayer.addEventListener('pointerdown', e => {
      if (e.target !== iconLayer) return;
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      setSelection([]);
      lastTap = null;
      OS.emit('desktop:tap');
      const start = OS.stage.toLocal(e.clientX, e.clientY);
      let box = null;
      try { iconLayer.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      const move = ev => {
        if (OS.ui.longPressed(ev.pointerId)) { if (box) { box.remove(); box = null; } return; }
        const p = OS.stage.toLocal(ev.clientX, ev.clientY);
        const x = Math.min(p.x, start.x), y = Math.min(p.y, start.y);
        const w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y);
        if (!box) {
          if (w * w + h * h < 25) return;
          box = el('div', { class: 'selbox' });
          iconLayer.appendChild(box);
        }
        box.style.left = x + 'px'; box.style.top = y + 'px';
        box.style.width = w + 'px'; box.style.height = h + 'px';
        const hit = [];
        for (const id in icons) {
          const ic = icons[id];
          const ix = parseFloat(ic.el.style.left), iy = parseFloat(ic.el.style.top);
          if (ix < x + w && ix + ic.el.offsetWidth > x && iy < y + h && iy + ic.el.offsetHeight > y) hit.push(ic);
        }
        setSelection(hit);
      };
      const up = () => {
        iconLayer.removeEventListener('pointermove', move);
        iconLayer.removeEventListener('pointerup', up);
        iconLayer.removeEventListener('pointercancel', up);
        if (box) box.remove();
      };
      iconLayer.addEventListener('pointermove', move);
      iconLayer.addEventListener('pointerup', up);
      iconLayer.addEventListener('pointercancel', up);
    });
  }

  // 双击（连点两下）才打开
  let lastTap = null;
  function handleTap(ic) {
    const now = Date.now();
    if (lastTap && lastTap.ic === ic && now - lastTap.t < DOUBLE_TAP_MS) {
      lastTap = null;
      OS.sound.play('click');
      OS.apps.open(ic.app.id);
    } else {
      lastTap = { ic, t: now };
    }
  }

  // 拖到哪个“收东西”的图标上（比如回收站）
  function dropTarget(x, y) {
    for (const id in icons) {
      const o = icons[id];
      if (selected.has(o) || !o.app.acceptsDrop) continue;
      const r = cellRect(o.col, o.row);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return o;
    }
    return null;
  }

  /* ---------- 按住图标：拖动（选中的一起拖） ---------- */
  function bindIcon(ic) {
    const n = ic.el;
    n.addEventListener('pointerdown', e => {
      if (e.button != null && e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      if (!selected.has(ic)) setSelection([ic]);
      const group = Array.from(selected);
      const orig = new Map(group.map(g => [g, { x: parseFloat(g.el.style.left), y: parseFloat(g.el.style.top) }]));
      const start = OS.stage.toLocal(e.clientX, e.clientY);
      let drag = false, hot = null, dx = 0, dy = 0;
      try { n.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }

      const move = ev => {
        if (OS.ui.longPressed(ev.pointerId) && !drag) return; // 长按出了菜单，就不拖了
        const p = OS.stage.toLocal(ev.clientX, ev.clientY);
        dx = p.x - start.x; dy = p.y - start.y;
        if (!drag && dx * dx + dy * dy > 64) {
          drag = true;
          lastTap = null;
          group.forEach(g => g.el.classList.add('dragging'));
        }
        if (!drag) return;
        group.forEach(g => {
          const o = orig.get(g);
          g.el.style.left = (o.x + dx) + 'px';
          g.el.style.top = (o.y + dy) + 'px';
        });
        const me = orig.get(ic);
        const t = dropTarget(me.x + dx + ICON_W / 2, me.y + dy + 20);
        if (t !== hot) {
          if (hot) hot.el.classList.remove('drop-hot');
          hot = t;
          if (hot) hot.el.classList.add('drop-hot');
        }
      };

      const up = ev => {
        n.removeEventListener('pointermove', move);
        n.removeEventListener('pointerup', up);
        n.removeEventListener('pointercancel', up);
        group.forEach(g => g.el.classList.remove('dragging'));
        if (hot) hot.el.classList.remove('drop-hot');

        if (!drag) {
          if (OS.ui.longPressed(ev.pointerId)) { lastTap = null; return; }
          if (ev.type === 'pointerup') {
            if (selected.size > 1) setSelection([ic]);
            handleTap(ic);
          }
          return;
        }

        // 扔到回收站上：先弹回原位，发个通知
        if (hot) {
          const target = hot;
          group.forEach(settle);
          target.el.classList.add('shake');
          setTimeout(() => target.el.classList.remove('shake'), 450);
          group.forEach(g => OS.emit('icon:drop', { app: g.app, target: target.app }));
          return;
        }

        // 放到格子上：整组平移，放不下的就近找空格
        const me = orig.get(ic);
        const c0 = OS.clamp(Math.floor((me.x + dx + ICON_W / 2 - grid.ox) / CELL_W), 0, grid.cols - 1);
        const r0 = OS.clamp(Math.floor((me.y + dy + 20 - grid.oy) / CELL_H), 0, grid.rows - 1);
        const dc = c0 - ic.col, dr = r0 - ic.row;
        const homes = new Map(group.map(g => [g, [g.col, g.row]]));
        group.forEach(g => { g.col = -1; g.row = -1; });
        [ic].concat(group.filter(g => g !== ic)).forEach(g => {
          const h = homes.get(g);
          let tc = OS.clamp(h[0] + dc, 0, grid.cols - 1);
          let tr = OS.clamp(h[1] + dr, 0, grid.rows - 1);
          if (!valid(tc, tr) || occupant(tc, tr)) { const f = nearestFree(tc, tr); tc = f[0]; tr = f[1]; }
          g.col = tc; g.row = tr;
        });
        group.forEach(settle);
        savePositions();
      };
      n.addEventListener('pointermove', move);
      n.addEventListener('pointerup', up);
      n.addEventListener('pointercancel', up);
    });
  }
})();
