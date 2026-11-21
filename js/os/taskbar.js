/* 任务栏 + 开始菜单 + 右下角托盘（音量、未激活、时钟） */
(function () {
  'use strict';
  const el = OS.el;
  const TB = OS.taskbar = {};
  let bar, startBtn, tasks, volIco, clock, menu, leftCol, allBtn, flyout = null, hoverT = 0;
  const btnFor = new Map();

  TB.init = function (parent) {
    startBtn = el('button', { id: 'start-btn' }, [OS.iconEl('logo', 'sb-logo'), el('span', { text: '开始' })]);
    tasks = el('div', { id: 'tasks' });
    const shield = el('span', { class: 'tray-btn', title: '未激活' }, [OS.iconEl('shieldWarn', 'tray-ico')]);
    volIco = el('span', { class: 'tray-btn' });
    clock = el('span', { id: 'clock', class: 'tray-btn' });
    bar = el('div', { id: 'taskbar' }, [startBtn, tasks, el('div', { id: 'tray' }, [shield, volIco, clock])]);
    parent.appendChild(bar);

    menu = buildMenu();
    parent.appendChild(menu);

    startBtn.addEventListener('click', () => TB.toggleMenu());
    // 点菜单外面就收起
    document.addEventListener('pointerdown', e => {
      if (!menu.classList.contains('open')) return;
      if (menu.contains(e.target) || startBtn.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.ctx')) return;   // 点的是“所有程序”弹出来的菜单
      TB.toggleMenu(false);
    }, true);

    // 右键菜单
    OS.ui.onContext(bar, () => OS.menus.taskbar());
    OS.ui.onContext(startBtn, () => OS.menus.startButton());
    OS.ui.onContext(clock, () => OS.menus.clock());
    OS.ui.onContext(volIco, () => OS.menus.volume());
    OS.ui.onContext(shield, () => OS.menus.shield());
    OS.on('sound:changed', renderVol);

    shield.addEventListener('click', () => {
      OS.ui.notify({ title: '系统未激活', text: '你的系统可能是盗版的受害者。\n好消息是，正版也是盗的。', icon: 'warn', replace: true, timeout: 4500 });
    });
    renderVol();
    volIco.addEventListener('click', () => {
      OS.sound.setMuted(!OS.sound.muted);
      renderVol();
      if (!OS.sound.muted) OS.sound.play('ding');
    });
    tick();
    setInterval(tick, 5000);
    clock.addEventListener('click', () => {
      const d = new Date();
      OS.ui.notify({
        title: d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 星期' + '日一二三四五六'[d.getDay()],
        text: OS.pick(['离下一个假期：还差若干个今天。', '今天的日期：和昨天完全不同。', '每过 60 秒，你的生命就减少一分钟。']),
        icon: 'info', replace: true, timeout: 4000
      });
    });

    OS.on('win:open', addTask);
    OS.on('win:close', w => { const b = btnFor.get(w); if (b) { b.remove(); btnFor.delete(w); } });
    OS.on('win:focus', refresh);
    OS.on('win:minimize', refresh);
    OS.on('win:restore', refresh);
    OS.on('win:title', w => { const b = btnFor.get(w); if (b) b.querySelector('span:last-child').textContent = w.titleText.textContent; });
    OS.on('stage:resize', fit);
    fit();
  };

  function fit() {
    const st = OS.stage;
    bar.style.paddingLeft = st.insets.l + 'px';
    bar.style.paddingRight = st.insets.r + 'px';
    if (menu.classList.contains('open')) positionMenu();
  }

  function renderVol() { volIco.innerHTML = OS.icon(OS.sound.muted ? 'mute' : 'volume'); }
  function tick() { const d = new Date(); clock.textContent = OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes()); }

  function addTask(w) {
    if (!w.opts.taskbar) return;
    const b = el('button', { class: 'task-btn' }, [w.opts.icon ? OS.iconEl(w.opts.icon, 'tb-ico') : null, el('span', { text: w.opts.title })]);
    b.addEventListener('click', () => {
      OS.sound.play('click');
      if (OS.wm.active === w && !w.minimized) OS.wm.minimize(w);
      else OS.wm.focus(w);
    });
    OS.ui.onContext(b, () => OS.menus.window(w));
    btnFor.set(w, b);
    tasks.appendChild(b);
    refresh();
  }
  function refresh() {
    btnFor.forEach((b, w) => b.classList.toggle('active', OS.wm.active === w && !w.minimized));
  }

  /* ---------- 开始菜单 ---------- */
  function item(icon, name, fn, extra, menu) {
    const n = el('div', { class: 'sm-item' + (extra ? ' ' + extra : '') }, [OS.iconEl(icon, 'smi-ico'), el('span', { text: name })]);
    n.addEventListener('click', () => { OS.sound.play('click'); fn(); });
    if (menu) OS.ui.onContext(n, () => menu(fn));
    return n;
  }
  const appMenu = app => run => OS.menus.startItem(app, run);
  function closeThen(fn) { return () => { TB.toggleMenu(false); fn(); }; }
  function say(title, icon, text) { return closeThen(() => OS.ui.dialog({ title, icon, text })); }

  function buildMenu() {
    const m = el('div', { id: 'startmenu' });
    const head = el('div', { class: 'sm-head' }, [OS.iconEl('duck', 'sm-avatar'), el('span', { text: '你' })]);

    // 左边：常用软件
    leftCol = el('div', { class: 'sm-left' });
    OS.apps.list.filter(a => a.pinned).forEach(a => leftCol.appendChild(item(a.icon, a.name, closeThen(() => OS.apps.open(a.id)), '', appMenu(a))));
    leftCol.appendChild(el('div', { class: 'sm-sep' }));

    // 所有程序：点一下（鼠标停一会儿也行）往右弹出一层层的菜单
    allBtn = el('div', { class: 'sm-item sm-all' }, [el('span', { text: '所有程序' }), el('span', { class: 'sm-arrow' })]);
    allBtn.addEventListener('click', () => { OS.sound.play('click'); openAll(); });
    allBtn.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(hoverT);
      hoverT = setTimeout(openAll, 350);
    });
    allBtn.addEventListener('pointerleave', () => clearTimeout(hoverT));
    OS.ui.onContext(allBtn, () => [
      { label: '打开', bold: true, action: openAll },
      { label: '资源管理器', action: closeThen(() => OS.apps.open('mycomputer')) }
    ]);
    leftCol.appendChild(allBtn);
    // 鼠标挪到开始菜单别的项上，过一会儿把“所有程序”收起来
    m.addEventListener('pointerover', e => {
      if (e.pointerType !== 'mouse' || !flyout || allBtn.contains(e.target) || !e.target.closest('.sm-item')) return;
      clearTimeout(hoverT);
      hoverT = setTimeout(() => { if (flyout) OS.ui.closeMenus(); }, 400);
    });

    // 右边：系统位置
    const place = run => OS.menus.placeItem(run);
    const right = el('div', { class: 'sm-right' }, [
      item('diary', '我的黑历史', say('我的黑历史', 'warn', '该文件夹已加密。\n密码提示：你初中时用的网名（带火星文的那个）。'), '', place),
      item('computer', '我的电脑', closeThen(() => OS.apps.open('mycomputer')), '', appMenu(OS.apps.byId.mycomputer)),
      el('div', { class: 'sm-sep' }),
      item('control', '控制不了面板', say('控制不了面板', 'info', '无法打开。\n你连自己都控制不了，还想控制面板。'), '', place),
      item('help', '帮不了和不支持', say('帮助和支持中心', 'help', '如需帮助，请自行解决。'), '', place),
      item('search', '找不到', say('搜索结果', 'info', '搜索完毕，共找到 0 项。\n你要找的东西，大概在你上次放它的地方。'), '', place),
      item('run', '跑路…', say('运行', 'error', '运行失败：管理员已经跑路了。'), '', place)
    ]);

    const fbtn = (icon, label, fn) => {
      const b = el('button', { class: 'sm-fbtn' }, [OS.iconEl(icon, 'smi-ico'), el('span', { text: label })]);
      b.addEventListener('click', () => { OS.sound.play('click'); TB.toggleMenu(false); fn(); });
      return b;
    };
    const foot = el('div', { class: 'sm-foot' }, [
      fbtn('logout', '注销', () => {
        OS.ui.dialog({ title: '注销', icon: 'help', text: '确定要注销吗？\n注销之后，你将变成未登录的你。', buttons: ['注销', '取消'] })
          .then(v => { if (v === '注销') OS.boot.logoff(); });
      }),
      fbtn('power', '关闭计算机', () => OS.boot.offDialog())
    ]);

    m.appendChild(head);
    m.appendChild(el('div', { class: 'sm-cols' }, [leftCol, right]));
    m.appendChild(foot);
    return m;
  }

  /* ---------- 所有程序（照 XP：先文件夹，再软件） ---------- */
  function allPrograms() {
    const appItem = id => {
      const a = OS.apps.byId[id];
      const run = closeThen(() => OS.apps.open(id));
      return { label: a.name, icon: a.icon, fresh: !OS.apps.opened(id), action: run, context: () => OS.menus.startItem(a, run) };
    };
    const folder = (label, sub) => {
      const run = closeThen(() => OS.apps.placeholder({ name: label, icon: 'folder' }));
      return { label, icon: 'folder', sub, fresh: sub.some(it => it && it.fresh), context: () => OS.menus.placeItem(run) };
    };
    const pro = (OS.apps.proList || []).map(name => {
      const run = say('需要升级', 'warn', '「' + name + '」需要升级到 Windoesn\'t XP 专业版。\n\n升级方式：闭上眼睛，想象自己已经升级了。');
      return { label: name, icon: 'exe', grey: true, action: run, context: () => OS.menus.proItem(run) };
    });
    return [
      folder('附件', [appItem('paint'), appItem('calc')]),
      folder('启动', [{ label: '(空)', disabled: true }]),
      folder('游戏', [{ label: '(空)', disabled: true }]),   // 以后放 4 个仿 XP 的小游戏
      folder("Windoesn't XP 专业版", pro),
      appItem('swatter'),
      appItem('coil'),
      appItem('bootcheck'),
      appItem('pulse'),
      appItem('debt'),
      appItem('lifespan')
    ];
  }

  function openAll() {
    clearTimeout(hoverT);
    if (flyout || !menu.classList.contains('open')) return;
    const r = allBtn.getBoundingClientRect(), lc = leftCol.getBoundingClientRect();
    const a = OS.stage.toLocal(lc.right, r.top), b = OS.stage.toLocal(lc.right, r.bottom);
    allBtn.classList.add('open');
    flyout = OS.ui.cascadeMenu(allPrograms(), { x: a.x - 1, y: a.y, w: 0, h: b.y - a.y }, {
      className: 'flyout',
      maxH: OS.stage.H - OS.stage.TASKBAR_H,
      onClose: () => { flyout = null; allBtn.classList.remove('open'); }
    });
    flyout.addEventListener('pointerenter', () => clearTimeout(hoverT));
  }

  function positionMenu() {
    const st = OS.stage;
    menu.style.maxHeight = (st.H - st.TASKBAR_H - 2) + 'px';
    let left = st.insets.l;
    const cap = st.capsule;
    // 自己转屏时 B站按钮在左上角，菜单太高就往右让一让
    if (cap && cap.corner === 'tl' && st.H - st.TASKBAR_H - menu.offsetHeight < cap.h) left = Math.max(left, cap.w);
    menu.style.left = left + 'px';
  }

  TB.toggleMenu = function (open) {
    if (!menu) return;
    const willOpen = open == null ? !menu.classList.contains('open') : !!open;
    if (willOpen === menu.classList.contains('open')) return;
    menu.classList.toggle('open', willOpen);
    startBtn.classList.toggle('pressed', willOpen);
    if (willOpen) {
      positionMenu();
      OS.sound.play('click');
    } else if (flyout) {
      OS.ui.closeMenus();
    }
  };
})();
