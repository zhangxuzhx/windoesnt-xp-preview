/* 通用零件：报错框/确认框、右下角气泡、蓝屏、手指拖动滚动 */
(function () {
  'use strict';
  const el = OS.el;
  const ui = OS.ui = {};

  /* ---------- 对话框 ----------
     OS.ui.dialog({ title, icon: 'info'|'warn'|'error'|'help', text, buttons: ['确定','取消'] })
     返回 Promise，结果是点的那个按钮（点右上角 × 得到 null） */
  ui.dialog = function (o) {
    o = Object.assign({ title: "Windoesn't XP", icon: 'info', text: '', buttons: ['确定'], width: 300 }, o);
    return new Promise(resolve => {
      let done = false, win = null;
      const finish = v => { if (!done) { done = true; resolve(v === undefined ? null : v); } };
      const row = el('div', { class: 'dlg-btns' });
      o.buttons.forEach((b, i) => {
        const label = typeof b === 'string' ? b : b.label;
        const value = typeof b === 'string' ? b : (b.value !== undefined ? b.value : b.label);
        const btn = el('button', { class: 'xpbtn' + (i === 0 ? ' default' : ''), text: label });
        btn.addEventListener('click', () => { OS.sound.play('click'); if (win) win.close(value); });
        row.appendChild(btn);
      });
      const content = el('div', { class: 'dlg' }, [
        el('div', { class: 'dlg-main' }, [
          o.icon ? OS.iconEl(o.icon, 'dlg-icon') : null,
          el('div', { class: 'dlg-text', text: o.text })
        ]),
        row
      ]);
      win = OS.wm.open({
        title: o.title, width: o.width, content, modal: true, taskbar: false,
        minimizable: false, maximizable: false, className: 'is-dialog', onClose: finish
      });
      OS.sound.play(o.sound || (o.icon === 'error' || o.icon === 'warn' ? 'error' : 'ding'));
    });
  };

  /* ---------- 右下角气泡 ----------
     OS.ui.notify({ title, text, icon, timeout, replace, onClick }) */
  const queue = [];
  let showing = null;
  ui.notify = function (o) {
    o = Object.assign({ title: '', text: '', icon: 'info', timeout: 6000 }, o);
    if (o.replace) { queue.length = 0; if (showing) showing.hideNow(); }
    queue.push(o);
    if (!showing) next();
  };
  function next() {
    const o = queue.shift();
    if (!o) { showing = null; return; }
    const st = OS.stage;
    const closeBtn = el('button', { class: 'bl-close', text: '×' });
    const b = el('div', { class: 'balloon' }, [
      el('div', { class: 'bl-title' }, [o.icon ? OS.iconEl(o.icon, 'bl-ico') : null, el('span', { text: o.title })]),
      el('div', { class: 'bl-text', text: o.text }),
      closeBtn
    ]);
    if (o.wide) b.classList.add('wide');   // 字多的提示可以宽一点
    b.style.right = (st.insets.r + 6) + 'px';
    b.style.bottom = (st.TASKBAR_H + 10) + 'px';
    document.getElementById('balloons').appendChild(b);
    OS.sound.play('notify');
    let timer = setTimeout(hide, o.timeout);
    function hide() {
      clearTimeout(timer);
      if (b.classList.contains('out')) return;
      b.classList.add('out');
      setTimeout(() => { b.remove(); if (showing === b) { showing = null; next(); } }, 280);
    }
    b.hideNow = () => { clearTimeout(timer); b.remove(); if (showing === b) showing = null; };
    closeBtn.addEventListener('click', e => { e.stopPropagation(); hide(); });
    b.addEventListener('click', () => { if (o.onClick) o.onClick(); hide(); });
    showing = b;
  }
  ui.clearNotify = function () {
    queue.length = 0;
    if (showing) showing.hideNow();
    showing = null;
  };

  /* ---------- 蓝屏 ----------
     OS.ui.bsod({ id, name, text }) —— 自动记进蓝屏图鉴，点一下重启 */
  OS.BSOD_TOTAL = 12;
  ui.bsod = function (o) {
    o = Object.assign({ id: 'generic', name: 'SOMETHING_WENT_WRONG', text: '' }, o);
    const seen = OS.save.get('bsods', []);
    const isNew = seen.indexOf(o.id) < 0;
    if (isNew) { seen.push(o.id); OS.save.set('bsods', seen); }
    const info = OS.save.get('bsodInfo', {});
    info[o.id] = { name: o.name, text: o.text, at: Date.now() };
    OS.wm.closeAll();
    ui.clearNotify();
    ui.closeMenus();
    OS.taskbar.toggleMenu(false);
    OS.ticker.stop();
    OS.emit('bsod', o);
    let h = 0;
    for (let i = 0; i < o.id.length; i++) h = (h * 31 + o.id.charCodeAt(i)) >>> 0;
    const code = ('00000000' + h.toString(16).toUpperCase()).slice(-8);
    info[o.id].code = code;
    OS.save.set('bsodInfo', info);
    const text =
      "检测到一个问题，Windoesn't XP 已停止运行，以防止对你的电脑造成更多损坏。\n\n" +
      o.name + '\n\n' +
      (o.text ? o.text + '\n\n' : '') +
      '如果这是你第一次看到蓝屏，恭喜你，\n说明你之前没看到过。\n\n' +
      '蓝屏图鉴：已收集 ' + seen.length + ' / ' + OS.BSOD_TOTAL + (isNew ? '　（新！）' : '') + '\n\n' +
      '技术信息：\n*** STOP: 0x' + code + ' (0x00000000, 0xDEADBEEF, 0x0000CAFE, 0x00000000)\n\n' +
      '点一下屏幕重新启动……';
    const node = el('div', { class: 'bsod' }, [el('div', { class: 'bs-title', text: "Windoesn't XP" }), el('div', { text })]);
    document.getElementById('overlay').appendChild(node);
    OS.sound.play('bsod');
    setTimeout(() => {
      node.addEventListener('pointerdown', () => { node.remove(); OS.boot.start({ fast: true }); }, { once: true });
    }, 800);
  };

  /* ---------- 右键菜单 ----------
     OS.ui.contextMenu(items, x, y)
     items: [{ label, action, bold, checked, disabled, sub: [...] }, '-', ...]  '-' 是分隔线
     开始菜单“所有程序”那种带图标的菜单还能用：icon（图标）、fresh（新程序，浅黄底）、
     grey（灰字但能点）、context（这一项自己的右键菜单） */
  let menuLayer = null;
  const openMenus = [];
  ui.initMenus = function (layer) {
    menuLayer = layer;
    // 点菜单外面就收起
    document.addEventListener('pointerdown', e => {
      if (openMenus.length && !(e.target.closest && e.target.closest('.ctx'))) ui.closeMenus();
    }, true);
    window.addEventListener('keydown', e => { if (e.key === 'Escape') ui.closeMenus(); });
  };
  function popMenu() {
    const m = openMenus.pop();
    m.remove();
    if (m._onClose) m._onClose();
  }
  ui.closeMenus = function () { while (openMenus.length) popMenu(); };
  // keep：不关掉已经开着的菜单，叠在上面（在“所有程序”里点右键时用）
  // opts.onClose：菜单收起来时调一下（选了某项也算收起，在那一项的 action 之前调）
  ui.contextMenu = function (items, x, y, keep, opts) {
    if (!keep) ui.closeMenus();
    showMenu(items, x, y, openMenus.length, null, opts || {});
  };
  // 贴着某个按钮的右边弹出、底边和按钮对齐（开始菜单的“所有程序”）
  // anchor: { x, y, w, h }；opts: { className, maxH, onClose }
  ui.cascadeMenu = function (items, anchor, opts) {
    ui.closeMenus();
    return showMenu(items, 0, 0, 0, anchor, Object.assign({ cascade: true }, opts));
  };
  ui.menuOpen = () => openMenus.length > 0;

  // 窗口顶上那排菜单栏（文件 编辑 查看……）：每个都能点开，在它正下方弹出菜单。
  // build(name) 返回这一栏的菜单项（返回空就不弹）；cls 是这个窗口自己的样式（字号、内边距）
  ui.EX_MENUS = ['文件(F)', '编辑(E)', '查看(V)', '收藏(A)', '工具(T)', '帮助(H)'];   // 文件夹窗口那一排
  ui.menuBar = function (names, build, cls) {
    return el('div', { class: 'mbar' + (cls ? ' ' + cls : '') }, names.map(name => {
      const mi = el('span', { class: 'mbar-i', text: name });
      mi.addEventListener('click', e => {
        e.stopPropagation();
        OS.sound.play('click');
        const items = build(name);
        if (!items || !items.length) return;
        const r = mi.getBoundingClientRect();
        const p = OS.stage.toLocal(r.left, r.bottom);
        ui.contextMenu(items, p.x, p.y);
      });
      return mi;
    }));
  };
  // 文件夹窗口“帮助”菜单里的“关于”
  ui.about = () => ui.dialog({ title: "关于 Windoesn't", icon: 'info', text: "Windoesn't XP\n版本 2003（盗版的盗版）\n(C) 2003 无聊科技\n本产品授权给：你" });

  // 菜单太长放不下：上下各加一个小箭头条，可以往上往下滚（XP 也有这种）
  // 鼠标停在箭头上会一直滚；手指点一下滚一行，按住不放一直滚；也能直接拖着滚
  function makeScroll(m, maxH, level) {
    const rows = Array.from(m.children);
    m.textContent = '';
    m.classList.add('scrolling');
    const up = el('div', { class: 'ctx-arrow up off' });
    const down = el('div', { class: 'ctx-arrow down' });
    const box = el('div', { class: 'ctx-scroll' }, rows);
    m.appendChild(up);
    m.appendChild(box);
    m.appendChild(down);
    const extra = m.offsetHeight - box.offsetHeight;
    box.style.maxHeight = Math.max(44, maxH - extra) + 'px';
    const firstRow = rows.find(r => r.classList.contains('ctx-item'));
    const rowH = firstRow ? firstRow.offsetHeight : 22;
    let timer = 0, hold = 0;
    const stop = () => { clearInterval(timer); clearTimeout(hold); timer = 0; };
    const run = dir => {
      stop();
      timer = setInterval(() => { if (!box.isConnected) stop(); else box.scrollTop += dir * 4; }, 16);
    };
    box.addEventListener('scroll', () => {
      up.classList.toggle('off', box.scrollTop <= 0);
      down.classList.toggle('off', box.scrollTop + box.clientHeight >= box.scrollHeight - 1);
      // 一滚动，就把它弹出来的下一层收起来
      if (openMenus.length > level + 1) {
        while (openMenus.length > level + 1) popMenu();
        m.querySelectorAll('.ctx-item.open').forEach(n => n.classList.remove('open'));
      }
    });
    [[up, -1], [down, 1]].forEach(([a, dir]) => {
      a.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') run(dir); });
      a.addEventListener('pointerleave', stop);
      a.addEventListener('pointercancel', stop);
      a.addEventListener('pointerdown', e => {
        e.preventDefault();
        stop();
        box.scrollTop += dir * rowH;
        hold = setTimeout(() => run(dir), 300);
      });
      a.addEventListener('pointerup', e => { stop(); if (e.pointerType === 'mouse') run(dir); });
    });
    ui.scrollable(box);
  }

  function showMenu(items, x, y, level, parent, opts) {
    while (openMenus.length > level) popMenu();
    // “所有程序”：第一层底边和按钮对齐；往右弹出的每一层，底边也不超过这条线
    if (opts.cascade && level === 0 && parent) opts.cascadeBottom = parent.y + parent.h;
    const withIcons = items.some(it => it && it.icon);
    const m = el('div', { class: 'ctx' + (withIcons ? ' icons' : '') + (opts.className ? ' ' + opts.className : '') });
    items.forEach(it => {
      if (!it) return;
      if (it === '-') { m.appendChild(el('div', { class: 'ctx-sep' })); return; }
      const lead = withIcons
        ? (it.icon ? OS.iconEl(it.icon, 'ctx-ico') : el('span', { class: 'ctx-ico' }))
        : el('span', { class: 'ctx-check', text: it.checked ? '✔' : '' });
      const row = el('div', {
        class: 'ctx-item' + (it.disabled ? ' disabled' : '') + (it.grey ? ' grey' : '') + (it.fresh ? ' fresh' : '') +
          (it.bold ? ' bold' : '') + (it.sub ? ' has-sub' : '')
      }, [lead, el('span', { class: 'ctx-label', text: it.label })]);
      if (it.context) ui.onContext(row, it.context, true);
      if (!it.disabled) {
        if (it.sub) {
          const openSub = () => {
            m.querySelectorAll('.ctx-item.open').forEach(n => n.classList.remove('open'));
            row.classList.add('open');
            const a = row.getBoundingClientRect();
            const p = OS.stage.toLocal(a.left, a.top), q = OS.stage.toLocal(a.right, a.bottom);
            const r = { x: p.x, y: p.y, w: q.x - p.x + 3 };
            showMenu(typeof it.sub === 'function' ? it.sub() : it.sub, 0, 0, level + 1, r,
              { className: opts.className, maxH: opts.cascadeBottom || opts.maxH, flyout: opts.flyout || opts.cascade, cascadeBottom: opts.cascadeBottom });
          };
          row.addEventListener('click', e => { e.stopPropagation(); openSub(); });
          row.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') openSub(); });
        } else {
          row.addEventListener('click', e => {
            e.stopPropagation();
            ui.closeMenus();
            OS.sound.play('click');
            try { if (it.action) it.action(); } catch (err) { console.error(err); }
          });
          row.addEventListener('pointerenter', e => {
            if (e.pointerType !== 'mouse') return;
            while (openMenus.length > level + 1) popMenu();
            m.querySelectorAll('.ctx-item.open').forEach(n => n.classList.remove('open'));
          });
        }
      }
      m.appendChild(row);
    });
    menuLayer.appendChild(m);
    const W = OS.stage.W, H = opts.maxH || OS.stage.H;
    const root = opts.cascade && level === 0;
    // “所有程序”：底边始终和按钮对齐，往上放不下就滚动
    const room = root ? parent.y + parent.h : H;
    if (m.offsetHeight > room) makeScroll(m, room, level);
    const mw = m.offsetWidth, mh = m.offsetHeight;
    let px, py;
    if (root) {
      px = parent.x + parent.w;
      py = parent.y + parent.h - mh;
    } else if (parent) {
      px = parent.x + parent.w - 3;
      // 右边放不下：右键菜单照 XP 翻到左边；“所有程序”那一串一律往右，贴着屏幕右边
      if (px + mw > W) px = opts.flyout ? W - mw : parent.x - mw + 3;
      py = parent.y - 3;
    } else {
      px = x; py = y;
      if (px + mw > W) px = x - mw;
      if (py + mh > H) py = y - mh;
    }
    px = OS.clamp(px, 0, Math.max(0, W - mw));
    // 别钻到 B站右上角那两个按钮底下（钻进去就点不到了）
    let top = 0;
    const cap = OS.stage.capsule;
    if (cap && px < cap.x + cap.w && px + mw > cap.x && cap.y + cap.h + mh <= H) top = cap.y + cap.h;
    m.style.left = px + 'px';
    m.style.top = OS.clamp(py, top, Math.max(top, H - mh)) + 'px';
    m._onClose = opts.onClose || null;
    openMenus.push(m);
    return m;
  }

  /* ---------- 长按 = 右键（手机） ----------
     给元素挂右键菜单：OS.ui.onContext(元素, (事件, 画面坐标) => 菜单项) */
  let lastPointerType = 'mouse';
  let lp = null;
  let suppressClickUntil = 0;
  const LONG_PRESS_MS = 500;

  ui.initLongPress = function () {
    const root = OS.stage.el;
    root.addEventListener('pointerdown', e => {
      lastPointerType = e.pointerType;
      if (lp) clearTimeout(lp.timer);
      lp = null;
      if (e.pointerType === 'mouse') return;
      const cur = { id: e.pointerId, x: e.clientX, y: e.clientY, target: e.target, fired: false, timer: 0 };
      cur.timer = setTimeout(() => {
        cur.fired = true;
        if (navigator.vibrate) { try { navigator.vibrate(12); } catch (_) { /* ignore */ } }
        const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: cur.x, clientY: cur.y });
        ev._longPress = true;
        cur.target.dispatchEvent(ev);
      }, LONG_PRESS_MS);
      lp = cur;
    }, true);
    root.addEventListener('pointermove', e => {
      if (!lp || lp.fired || e.pointerId !== lp.id) return;
      const dx = e.clientX - lp.x, dy = e.clientY - lp.y;
      if (dx * dx + dy * dy > 100) clearTimeout(lp.timer);
    }, true);
    const end = e => {
      if (!lp || e.pointerId !== lp.id) return;
      clearTimeout(lp.timer);
      if (lp.fired) suppressClickUntil = Date.now() + 450;
    };
    root.addEventListener('pointerup', end, true);
    root.addEventListener('pointercancel', end, true);
    // 长按松手后，不要再算作一次“点击”
    root.addEventListener('click', e => {
      if (Date.now() < suppressClickUntil) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  };

  // 这次按下是不是已经触发了长按（拖动、点击逻辑用来判断要不要停手）
  ui.longPressed = id => !!(lp && lp.fired && lp.id === id);

  ui.onContext = function (node, build, keep) {
    node.addEventListener('contextmenu', e => {
      e.preventDefault();
      // 手指长按时浏览器自己也可能发一次右键，忽略它，只认我们自己的长按
      if (!e._longPress && lastPointerType !== 'mouse') return;
      e.stopPropagation();
      const p = OS.stage.toLocal(e.clientX, e.clientY);
      const items = build(e, p);
      if (items && items.length) ui.contextMenu(items, p.x, p.y, keep);
    });
  };

  /* ---------- 手指拖动滚动 ---------- */
  ui.scrollable = function (box) {
    box.classList.add('scrollable');
    let id = null, startY = 0, startTop = 0, moved = false;
    box.addEventListener('pointerdown', e => {
      id = e.pointerId; moved = false;
      startY = OS.stage.toLocal(e.clientX, e.clientY).y;
      startTop = box.scrollTop;
    });
    box.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      const dy = OS.stage.toLocal(e.clientX, e.clientY).y - startY;
      if (!moved && Math.abs(dy) > 5) {
        moved = true;
        try { box.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      }
      if (moved) box.scrollTop = startTop - dy;
    });
    const end = e => { if (e.pointerId === id) id = null; };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    // 拖动过就不算点击
    box.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    box.addEventListener('wheel', e => { box.scrollTop += e.deltaY; e.preventDefault(); }, { passive: false });
  };
})();
