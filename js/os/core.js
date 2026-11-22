/* Windoesn't XP — 核心：小工具、事件、存档、软件注册表 */
(function () {
  'use strict';
  const OS = window.OS = { version: '0.1.0' };

  /* ---------- DOM 小工具 ---------- */
  OS.el = function (tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v);
      }
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null || c === false) return;
        e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return e;
  };
  OS.wait = ms => new Promise(r => setTimeout(r, ms));
  OS.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  OS.shuffle = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };
  OS.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  OS.pad2 = n => (n < 10 ? '0' : '') + n;

  /* ---------- 事件 ---------- */
  const handlers = {};
  OS.on = (name, fn) => { (handlers[name] = handlers[name] || []).push(fn); };
  OS.off = (name, fn) => {
    const l = handlers[name];
    if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); }
  };
  OS.emit = (name, data) => {
    (handlers[name] || []).slice().forEach(fn => {
      try { fn(data); } catch (e) { console.error(e); }
    });
  };

  /* ---------- 存档（现在存手机本地，以后换成B站云存档只改这里） ---------- */
  const PREFIX = 'windoesnt-xp:';
  OS.save = {
    get(k, def) {
      try { const v = localStorage.getItem(PREFIX + k); return v == null ? def : JSON.parse(v); }
      catch (e) { return def; }
    },
    set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) { /* 存不了就算了 */ } },
    remove(k) { try { localStorage.removeItem(PREFIX + k); } catch (e) { /* ignore */ } },
    clearAll() {
      try { Object.keys(localStorage).filter(k => k.indexOf(PREFIX) === 0).forEach(k => localStorage.removeItem(k)); }
      catch (e) { /* ignore */ }
    }
  };

  /* ---------- 软件注册表 ----------
     每个小软件调用 OS.apps.register({ id, name, icon, open(app) }) 把自己挂上桌面。
     没写 open 的软件会打开“施工中”窗口。 */
  // 游戏里的“今年”：时代模糊成 2003–2007 的某一年，显示日期时年份都写这个（月、日、钟点照用真的）
  OS.YEAR = '200X';

  OS.apps = { list: [], byId: {} };
  OS.apps.register = function (app) {
    app = Object.assign({ desktop: true, pinned: false, singleton: true }, app);
    if (OS.apps.byId[app.id]) return OS.apps.byId[app.id];
    OS.apps.list.push(app);
    OS.apps.byId[app.id] = app;
    return app;
  };
  // 打开过哪些软件（开始菜单里没打开过的会标成浅黄色，跟 XP 的“新安装的程序”一样）
  OS.apps.opened = id => OS.save.get('opened', []).indexOf(id) >= 0;
  OS.apps.open = function (id) {
    const app = OS.apps.byId[id];
    if (!app) return null;
    if (!OS.apps.opened(id)) OS.save.set('opened', OS.save.get('opened', []).concat(id));
    if (app.singleton) {
      const w = OS.wm.wins.find(x => x.appId === id);
      if (w) { OS.wm.focus(w); return w; }
    }
    return app.open ? app.open(app) : OS.apps.placeholder(app);
  };
})();
