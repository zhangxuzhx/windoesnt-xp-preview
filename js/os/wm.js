/* 窗口管理：打开、关闭、最小化、最大化、拖动、前后顺序 */
(function () {
  'use strict';
  const el = OS.el;
  const wm = OS.wm = { wins: [], active: null, suffix: '' };
  let layer = null, z = 100, seq = 0, cascade = 0;

  const GLYPH = {
    min: '<svg viewBox="0 0 11 11"><rect x="2" y="7.5" width="6" height="2" fill="#fff"/></svg>',
    max: '<svg viewBox="0 0 11 11"><rect x="1.5" y="1.5" width="8" height="8" fill="none" stroke="#fff" stroke-width="1.4"/><rect x="1.5" y="1.5" width="8" height="2.4" fill="#fff"/></svg>',
    restore: '<svg viewBox="0 0 11 11"><rect x="3.6" y="0.9" width="6.4" height="5.8" fill="none" stroke="#fff" stroke-width="1.2"/><rect x="1" y="4.2" width="6.4" height="5.8" fill="#2a64d6" stroke="#fff" stroke-width="1.2"/></svg>',
    close: '<svg viewBox="0 0 11 11"><path d="M2 2 L9 9 M9 2 L2 9" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
    help: '<svg viewBox="0 0 11 11"><path d="M3.5 3.8 C3.5 1.3 7.5 1.3 7.5 3.8 C7.5 5.4 5.5 5.3 5.5 7" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="5.5" cy="9.2" r="1" fill="#fff"/></svg>'
  };

  wm.init = function (container) {
    layer = container;
    OS.on('stage:resize', fitAll);
  };

  /* 打开一个窗口
     o: { title, icon, width, height, content(节点/文字/函数(body, win)), appId,
          modal, center, minimizable, maximizable, closable, taskbar, className, onClose,
          topmost（总在普通窗口上面，比如系统关机倒计时）、noClose（× 是灰的，点了只“叮”一声），
          beforeClose（点 × / 菜单里的关闭时先调它，返回 false 就不关；重启这类强制关窗不问）
          help（给了就在 × 左边多一个“？”按钮，点了调它） } */
  wm.open = function (o) {
    o = Object.assign({
      title: '窗口', icon: null, width: 320, height: null,
      minimizable: true, maximizable: true, closable: true, taskbar: true, modal: false
    }, o);
    const W = OS.stage.work;
    const win = { id: 'w' + (++seq), opts: o, appId: o.appId || null, minimized: false, maximized: false };
    let resolveClosed;
    win.closed = new Promise(r => { resolveClosed = r; });
    win._resolve = resolveClosed;

    const btns = el('div', { class: 'win-btns' });
    if (o.minimizable) btns.appendChild(win.btnMin = el('button', { class: 'wb wb-min', html: GLYPH.min }));
    if (o.maximizable) btns.appendChild(win.btnMax = el('button', { class: 'wb wb-max', html: GLYPH.max }));
    if (o.help) btns.appendChild(win.btnHelp = el('button', { class: 'wb wb-help', html: GLYPH.help }));
    if (o.closable) btns.appendChild(win.btnClose = el('button', { class: 'wb wb-close', html: GLYPH.close }));

    win.rawTitle = o.title;
    win.titleText = el('span', { class: 'win-text', text: o.title + wm.suffix });
    win.titleEl = el('div', { class: 'win-title' }, [o.icon ? OS.iconEl(o.icon, 'win-ticon') : null, win.titleText, btns]);
    win.body = el('div', { class: 'win-body' });
    win.el = el('div', { class: 'win opening' + (o.className ? ' ' + o.className : '') }, [win.titleEl, win.body]);

    if (o.modal) {
      win.shade = el('div', { class: 'modal-shade' });
      win.shade.addEventListener('pointerdown', e => { e.stopPropagation(); wm.flash(win); });
      layer.appendChild(win.shade);
    }
    layer.appendChild(win.el);

    if (typeof o.content === 'function') o.content(win.body, win);
    else if (o.content instanceof Node) win.body.appendChild(o.content);
    else if (o.content != null) win.body.innerHTML = o.content;

    // 尺寸
    win.w = Math.min(o.width, W.w - 4);
    win.el.style.width = win.w + 'px';
    if (o.height) {
      win.h = Math.min(o.height, W.h - 2);
      win.hStyle = win.h + 'px';
    } else {
      const natural = win.el.offsetHeight;
      win.h = Math.min(natural, W.h - 2);
      win.hStyle = natural > win.h ? win.h + 'px' : 'auto';
    }
    win.el.style.height = win.hStyle;

    // 位置
    if (o.x != null) { win.x = o.x; win.y = o.y; }
    else if (o.modal || o.center) center(win);
    else {
      const off = (cascade++ % 5) * 14;
      win.x = W.x + (W.w - win.w) / 2 - 28 + off;
      win.y = W.y + Math.max(0, (W.h - win.h) / 2 - 16) + off;
    }
    clampPos(win);
    // 错开摆的窗口别让底部钻到任务栏下面：放不下就往上挪
    if (win.y + win.h > W.y + W.h) win.y = Math.max(W.y, W.y + W.h - win.h);
    place(win);
    setTimeout(() => win.el.classList.remove('opening'), 200);

    // 交互
    win.el.addEventListener('pointerdown', () => wm.focus(win), true);
    bindDrag(win);
    OS.ui.onContext(win.titleEl, () => OS.menus.window(win));
    OS.ui.onContext(win.body, () => null); // 窗口里面先不弹菜单（以后每个软件自己定）
    win.titleEl.addEventListener('dblclick', e => {
      if (o.maximizable && !e.target.closest('.wb')) wm.toggleMax(win);
    });
    if (win.btnMin) win.btnMin.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); wm.minimize(win); });
    if (win.btnMax) win.btnMax.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); wm.toggleMax(win); });
    if (win.btnClose && o.noClose) win.btnClose.classList.add('wb-off');
    if (win.btnClose) win.btnClose.addEventListener('click', e => { e.stopPropagation(); if (o.noClose) { OS.sound.play('ding'); return; } OS.sound.play('click'); wm.requestClose(win); });
    if (win.btnHelp) win.btnHelp.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); o.help(win); });

    win.close = v => wm.close(win, v);
    win.setTitle = t => { win.rawTitle = t; win.titleText.textContent = t + wm.suffix; OS.emit('win:title', win); };

    wm.wins.push(win);
    wm.focus(win);
    OS.emit('win:open', win);
    return win;
  };

  function center(win) {
    const W = OS.stage.work;
    win.x = W.x + (W.w - win.w) / 2;
    win.y = W.y + (W.h - win.h) / 2;
  }

  function clampPos(win) {
    const W = OS.stage.work;
    const keep = 60; // 至少露出这么宽，免得拖丢了
    win.x = OS.clamp(win.x, W.x - win.w + keep, W.x + W.w - keep);
    win.y = OS.clamp(win.y, W.y, W.y + W.h - 24);
  }

  function place(win) {
    const s = win.el.style;
    if (win.maximized) {
      const W = OS.stage.work;
      s.left = W.x + 'px'; s.top = W.y + 'px'; s.width = W.w + 'px'; s.height = W.h + 'px';
    } else {
      s.left = win.x + 'px'; s.top = win.y + 'px'; s.width = win.w + 'px'; s.height = win.hStyle;
    }
    avoidCapsule(win);
  }

  // 标题栏钻到B站「··· ×」按钮底下时，把最小化/关闭这些按钮挤出来，免得点不到
  function avoidCapsule(win) {
    const cap = OS.stage.capsule;
    let pl = '', pr = '';
    if (cap) {
      const r = win.maximized ? OS.stage.work : { x: win.x, y: win.y, w: win.w };
      const titleBottom = r.y + 25;
      if (r.y < cap.y + cap.h && titleBottom > cap.y) {
        const room = Math.max(0, r.w - 90);
        if (cap.corner === 'tr' && r.x + r.w > cap.x) pr = Math.min(r.x + r.w - cap.x + 4, room) + 'px';
        if (cap.corner === 'tl' && r.x < cap.x + cap.w) pl = Math.min(cap.x + cap.w - r.x + 6, room) + 'px';
      }
    }
    win.titleEl.style.paddingRight = pr;
    win.titleEl.style.paddingLeft = pl;
  }

  function bindDrag(win) {
    const t = win.titleEl;
    t.addEventListener('pointerdown', e => {
      if (e.target.closest('.wb') || win.maximized) return;
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      const start = OS.stage.toLocal(e.clientX, e.clientY);
      const ox = win.x, oy = win.y;
      try { t.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      const move = ev => {
        if (OS.ui.longPressed(ev.pointerId)) return; // 长按出了菜单，就不拖了
        const p = OS.stage.toLocal(ev.clientX, ev.clientY);
        win.x = ox + p.x - start.x;
        win.y = oy + p.y - start.y;
        clampPos(win);
        place(win);
      };
      const up = () => {
        t.removeEventListener('pointermove', move);
        t.removeEventListener('pointerup', up);
        t.removeEventListener('pointercancel', up);
      };
      t.addEventListener('pointermove', move);
      t.addEventListener('pointerup', up);
      t.addEventListener('pointercancel', up);
    });
  }

  function raise(win) {
    if (win.shade) win.shade.style.zIndex = ++z;
    win.el.style.zIndex = ++z;
  }

  function topVisible() {
    return wm.wins.filter(w => !w.minimized)
      .sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0))[0] || null;
  }

  function markActive() {
    wm.wins.forEach(w => w.el.classList.toggle('inactive', w !== wm.active));
    OS.emit('win:focus', wm.active);
  }

  // 所有窗口标题后面统一加一截（中毒时“ - 已破解”）；空字符串就是去掉
  wm.setSuffix = function (sfx) { wm.suffix = sfx || ''; wm.wins.forEach(w => w.setTitle(w.rawTitle)); };

  wm.focus = function (win) {
    if (!win) return;
    if (win.minimized) { wm.restore(win); return; }
    raise(win);
    // “总在最前”的窗口压在普通窗口上面
    wm.wins.forEach(w => { if (w.opts.topmost && w !== win) raise(w); });
    if (win.opts.topmost) raise(win);
    // 对话框永远压在最上面；好几个对话框叠着时，刚点的那个在最上面
    wm.wins.forEach(w => { if (w.opts.modal && w !== win) raise(w); });
    if (win.opts.modal) raise(win);
    let top = topVisible();
    if (top && top.opts.topmost && top !== win) top = win;   // 点了普通窗口，它照样算“正在用的窗口”，只是被压在下面
    if (wm.active !== top) { wm.active = top; markActive(); }
  };

  wm.minimize = function (win) {
    if (win.minimized) return;
    win.minimized = true;
    win.el.classList.add('minimizing');
    setTimeout(() => {
      if (win.minimized) { win.el.style.display = 'none'; win.el.classList.remove('minimizing'); }
    }, 170);
    if (wm.active === win) { wm.active = topVisible(); if (wm.active) raise(wm.active); markActive(); }
    OS.emit('win:minimize', win);
  };

  wm.restore = function (win) {
    win.minimized = false;
    win.el.style.display = '';
    win.el.classList.remove('minimizing');
    win.el.classList.add('opening');
    setTimeout(() => win.el.classList.remove('opening'), 200);
    wm.focus(win);
    OS.emit('win:restore', win);
  };

  wm.toggleMax = function (win) {
    win.maximized = !win.maximized;
    win.el.classList.toggle('max', win.maximized);
    if (win.btnMax) win.btnMax.innerHTML = win.maximized ? GLYPH.restore : GLYPH.max;
    place(win);
  };

  wm.close = function (win, value) {
    if (win.isClosed) return;
    if (win.opts.onBeforeClose && win.opts.onBeforeClose(win) === false) return;
    win.isClosed = true;
    win.el.remove();
    if (win.shade) win.shade.remove();
    wm.wins = wm.wins.filter(w => w !== win);
    if (wm.active === win) { wm.active = topVisible(); markActive(); }
    OS.emit('win:close', win);
    if (win.opts.onClose) { try { win.opts.onClose(value); } catch (e) { console.error(e); } }
    win._resolve(value);
  };

  // 玩家自己要关（×、菜单里的关闭）：软件可以先拦一下
  wm.requestClose = function (win) {
    if (win.opts.beforeClose && win.opts.beforeClose() === false) return;
    wm.close(win);
  };
  wm.closeAll = function () { wm.wins.slice().forEach(w => wm.close(w)); shownDesktop = null; };

  /* ---------- 任务栏右键：层叠、平铺、显示桌面 ---------- */
  function normalWins() { return wm.wins.filter(w => !w.minimized && !w.opts.modal); }
  function unmax(w) {
    if (w.maximized) { w.maximized = false; w.el.classList.remove('max'); if (w.btnMax) w.btnMax.innerHTML = GLYPH.max; }
  }
  function setRect(w, x, y, ww, hh) {
    unmax(w);
    w.x = x; w.y = y; w.w = ww; w.h = hh; w.hStyle = hh + 'px';
    place(w);
  }
  wm.cascade = function () {
    const W = OS.stage.work;
    normalWins().forEach((w, i) => {
      const ww = Math.min(w.opts.width, W.w - 40), hh = Math.min(w.h, W.h - 40);
      setRect(w, W.x + 6 + i * 18, W.y + 4 + i * 18, ww, hh);
      wm.focus(w);
    });
  };
  wm.tile = function (dir) {
    const W = OS.stage.work, list = normalWins(), n = list.length;
    list.forEach((w, i) => {
      if (dir === 'h') setRect(w, W.x, W.y + i * W.h / n, W.w, W.h / n);
      else setRect(w, W.x + i * W.w / n, W.y, W.w / n, W.h);
    });
  };
  let shownDesktop = null;
  wm.desktopShown = () => !!shownDesktop;
  wm.showDesktop = function () {
    if (shownDesktop) {
      shownDesktop.forEach(w => { if (wm.wins.indexOf(w) >= 0 && w.minimized) wm.restore(w); });
      shownDesktop = null;
    } else {
      shownDesktop = normalWins();
      shownDesktop.forEach(w => wm.minimize(w));
    }
  };

  wm.flash = function (win) {
    OS.sound.play('ding');
    win.el.classList.remove('flash');
    void win.el.offsetWidth;
    win.el.classList.add('flash');
  };

  // 窗口内容变高之后，往上挪一挪，别让底部跑到任务栏下面
  // 窗口换宽度（计算器 标准型 ↔ 科学型）：变宽了右边出界就往左挪，底下出界就往上挪
  wm.setWidth = function (win, w) {
    if (!win || win.isClosed) return;
    const W = OS.stage.work;
    win.w = Math.min(w, W.w - 4);
    if (win.x + win.w > W.x + W.w) win.x = Math.max(W.x, W.x + W.w - win.w);
    place(win);
    wm.keepInside(win);
  };
  wm.keepInside = function (win) {
    if (!win || win.maximized || win.isClosed || win.minimized) return;
    const W = OS.stage.work;
    const h = win.el.offsetHeight;
    if (win.y + h > W.y + W.h) { win.y = Math.max(W.y, W.y + W.h - h); place(win); }
  };

  function fitAll() {
    const W = OS.stage.work;
    wm.wins.forEach(w => {
      w.w = Math.min(w.opts.width, W.w - 4);
      w.el.style.width = w.w + 'px';
      if (w.opts.height) { w.h = Math.min(w.opts.height, W.h - 2); w.hStyle = w.h + 'px'; }
      else {
        w.el.style.height = 'auto';
        const natural = w.el.offsetHeight;
        w.h = Math.min(natural, W.h - 2);
        w.hStyle = natural > w.h ? w.h + 'px' : 'auto';
      }
      // 居中的对话框重新居中；自己指定了位置的（比如叠起来的报错框）原地不动，免得叠的全缩成一个
      if ((w.opts.modal || w.opts.center) && w.opts.x == null) center(w);
      clampPos(w);
      place(w);
    });
  }
})();
