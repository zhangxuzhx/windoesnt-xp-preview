/* 任务栏 + 开始菜单 + 右下角托盘（音量、未激活、时钟） */
(function () {
  'use strict';
  const el = OS.el;
  const TB = OS.taskbar = {};
  let bar, startBtn, tasks, volIco, clock, menu, leftCol, allBtn, flyout = null, hoverT = 0;
  const btnFor = new Map();

  TB.init = function (parent) {
    startBtn = el('button', { id: 'start-btn' }, [OS.iconEl('logo-sm', 'sb-logo'), el('span', { class: 'sb-label', text: OS.save.get('startText', '') || '开始' })]);
    tasks = el('div', { id: 'tasks' });
    const shield = el('span', { class: 'tray-btn', title: '未激活' }, [OS.iconEl('shieldWarn', 'tray-ico')]);
    if (OS.save.get('activated', false)) shield.style.display = 'none';
    OS.on('system:activated', () => { shield.style.display = 'none'; });
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
    OS.on('sound:muted', renderVol);
    OS.on('tray:changed', renderVol);

    shield.addEventListener('click', () => {
      OS.ui.notify({ title: '系统未激活', text: '你的系统可能是盗版的受害者。\n好消息是，正版也是盗的。', icon: 'warn', replace: true, timeout: 4500 });
    });
    renderVol();
    volIco.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); TB.volumePopup(); });
    tick();
    setInterval(tick, 1000);
    OS.on('clock:changed', tick);
    clock.addEventListener('click', () => {
      const d = OS.clock.now();
      OS.ui.notify({
        title: (d.getFullYear() === 1999 ? '1999' : OS.YEAR) + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 星期' + '日一二三四五六'[d.getDay()],
        text: OS.pick(['离下一个假期：还差若干个今天。', '今天的日期：和昨天完全不同。', '每过 60 秒，你的生命就减少一分钟。', '你再怎么调整时间，他/她也不会再回来了，过去的就让它过去吧']),
        icon: 'info', replace: true, timeout: 4000
      });
    });

    OS.on('win:open', addTask);
    OS.on('win:close', w => { const b = btnFor.get(w); if (b) { b.remove(); btnFor.delete(w); } });
    OS.on('win:focus', refresh);
    OS.on('win:minimize', refresh);
    // 软件把主界面整个藏起来（比如千千不听的“隐藏主界面”）：任务栏按钮也不显示
    OS.on('win:hide', w => { const b = btnFor.get(w); if (b) b.style.display = 'none'; });
    OS.on('win:show', w => { const b = btnFor.get(w); if (b) b.style.display = ''; });
    OS.on('win:restore', refresh);
    OS.on('win:title', w => { const b = btnFor.get(w); if (b) b.querySelector('span:last-child').textContent = w.titleText.textContent; });
    OS.on('stage:resize', fit);
    fit();
  };

  // 小软件在右下角托盘里放个图标（放在最左边），返回值 .remove() 就拿掉
  TB.trayAdd = function (node) {
    const tray = document.getElementById('tray');
    tray.insertBefore(node, tray.firstChild);
    return node;
  };

  function fit() {
    const st = OS.stage;
    bar.style.paddingLeft = st.insets.l + 'px';
    bar.style.paddingRight = st.insets.r + 'px';
    if (menu.classList.contains('open')) positionMenu();
  }

  function renderVol() { volIco.innerHTML = OS.icon(OS.sound.muted ? 'mute' : 'volume'); volIco.style.display = OS.save.get('volIcon', true) ? '' : 'none'; }
  // 右下角时间：跟着控制面板 ▸ 日期和时间 调过的走（OS.clock）
  function tick() { const d = OS.clock.now(); clock.textContent = OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes()); }

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
  // 开始菜单左栏：[程序, 粗体那行, 下面灰色小字]；再下面是常用程序
  const START_TOP = [['ie', 'Internot', 'Internot Explorer'], ['mail', '电子邮件', 'Outluck Excess']];
  const START_OFTEN = ['sweep', 'cmd', 'paint', 'calc'];
  // 左栏里的程序被卸掉了就藏起来（addremove.js 发 soft:change）
  const leftApps = [];
  const syncLeft = () => leftApps.forEach(([n, id]) => { n.style.display = !OS.soft || OS.soft.appOk(id) ? '' : 'none'; });
  OS.on('soft:change', syncLeft);
  function pinItem(id, title, sub) {
    const a = OS.apps.byId[id], run = closeThen(() => OS.apps.open(id));
    const n = el('div', { class: 'sm-item sm-pin' }, [OS.iconEl(a.icon, 'smi-ico'), el('div', { class: 'sm-pin-txt' }, [el('b', { text: title }), el('span', { text: sub })])]);
    leftApps.push([n, id]);
    n.addEventListener('click', () => { OS.sound.play('click'); run(); });
    OS.ui.onContext(n, () => OS.menus.startItem(a, run));
    return n;
  }
  function closeThen(fn) { return () => { TB.toggleMenu(false); fn(); }; }
  function say(title, icon, text) { return closeThen(() => OS.ui.dialog({ title, icon, text })); }

  function buildMenu() {
    const m = el('div', { id: 'startmenu' });
    const head = el('div', { class: 'sm-head' }, [OS.iconEl(OS.save.get('avatar', 'duck'), 'sm-avatar'), el('span', { text: '你' })]);
    OS.on('avatar:changed', a => { const old = head.querySelector('.sm-avatar'); if (old) old.replaceWith(OS.iconEl(a, 'sm-avatar')); });

    // 左边：照 XP 的开始菜单。最上面两个固定的（上网、电子邮件，两行字），一条线，下面是常用程序
    leftCol = el('div', { class: 'sm-left' });
    START_TOP.forEach(([id, title, sub]) => leftCol.appendChild(pinItem(id, title, sub)));
    leftCol.appendChild(el('div', { class: 'sm-sep' }));
    START_OFTEN.forEach(id => { const a = OS.apps.byId[id], n = item(a.icon, a.name, closeThen(() => OS.apps.open(id)), '', appMenu(a)); leftApps.push([n, id]); leftCol.appendChild(n); });
    syncLeft();
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
      item('mydocs', '我的文档', closeThen(() => OS.apps.open('mydocs')), '', appMenu(OS.apps.byId.mydocs)),
      item('computer', '我的电脑', closeThen(() => OS.apps.open('mycomputer')), '', appMenu(OS.apps.byId.mycomputer)),
      el('div', { class: 'sm-sep' }),
      item('control', '控制面板', closeThen(() => OS.apps.open('control')), '', appMenu(OS.apps.byId.control)),
      item('help', '帮不了和不支持', say('帮助和支持中心', 'help', '如需帮助，请自行解决。'), '', place),
      item('search', '找不到', say('搜索结果', 'info', '搜索完毕，共找到 0 项。\n你要找的东西，大概在你上次放它的地方。'), '', place),
      item('genie', '一键还原精灵', closeThen(() => OS.apps.open('restore')), '', appMenu(OS.apps.byId.restore))
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
    const has = id => !OS.soft || OS.soft.has(id);
    const appItem = id => {
      if (OS.soft && !OS.soft.appOk(id)) return null;   // 卸掉了（addremove.js）
      const a = OS.apps.byId[id];
      const run = closeThen(() => OS.apps.open(id));
      return { label: a.name, icon: a.icon, fresh: !OS.apps.opened(id), action: run, context: () => OS.menus.startItem(a, run) };
    };
    const folder = (label, sub, icon) => {
      sub = sub.filter(Boolean);
      if (!sub.length) return null;   // 里面的都卸光了：文件夹也不显示
      const run = closeThen(() => OS.apps.placeholder({ name: label, icon: 'folder' }));
      return { label, icon: icon || 'folder', sub, fresh: sub.some(it => it && it.fresh), context: () => OS.menus.placeItem(run) };
    };
    const activated = !!OS.save.get('activated', false);   // 用激活器激活过：专业版的程序变彩色，能打开（暂时是施工中）
    const pro = (OS.apps.proList || []).map(name => {
      const run = activated
        ? closeThen(() => OS.apps.placeholder({ name, icon: 'exe' }))
        : say('需要升级', 'warn', '「' + name + '」需要升级到 Windoesn\'t XP 专业版。\n\n升级方式：闭上眼睛，想象自己已经升级了。');
      return { label: name, icon: 'exe', grey: !activated, action: run, context: () => OS.menus.proItem(run) };
    });
    // 其他程序以后再补
    return [
      // 附件 ▸ 系统工具 ▸ 磁盘清理（跟 XP 一样；cleanup.js）
      folder('附件', [folder('系统工具', [{ label: '磁盘清理', icon: 'recycle', action: closeThen(() => OS.cleanup && OS.cleanup.open()) }]), appItem('cmd'), appItem('notepad'), appItem('wordpad'), appItem('paint'), appItem('calc')]),
      folder('启动', [appItem('restore')]),
      // 游戏：系统自带的那几个
      folder('游戏', [appItem('hearts'), appItem('freecell'), appItem('pinball'), appItem('sweep'), appItem('spider'), appItem('solitaire')]),
      folder("Windoesn't XP 专业版", pro),
      // Offense 2003 三件套（offense.js）
      folder('Offense 2003', [appItem('wordy'), appItem('excuse'), appItem('ppt')], 'offense'),
      folder('实用小程序', [appItem('swatter'), appItem('coil'), appItem('bootcheck'), appItem('pulse'), appItem('lifespan'), appItem('activator')]),
      // 光盘装的幻觉游戏：跟别的装上的软件一样，自己一个文件夹（原来藏在 游戏 里面，作者找不到）；六个游戏 + 卸载
      OS.hj && OS.hj.installed() ? folder('幻觉游戏 V3.0', OS.hj.games.map(g => ({ label: g.name, icon: 'game-' + g.id, action: closeThen(() => OS.hj.run(g)) })).concat([{ label: '卸载 幻觉游戏 V3.0', icon: 'cd', action: closeThen(() => OS.soft.uninstall('hj')) }])) : null,
      // 照那几年装聊天软件的样子：一个文件夹，里面是软件本体 + 卸载（走 添加或删除程序 那一套，addremove.js）；卸掉了整个文件夹不显示
      // 超级秃子（baldy.js）：魔法设置 ／ 清理王 ／ 卸载
      has('baldy') ? folder('超级秃子', [{ label: '超级秃子魔法设置', icon: 'baldy', action: closeThen(() => OS.baldy && OS.baldy.open('magic')) }, { label: '超级秃子清理王', icon: 'baldy', action: closeThen(() => OS.baldy && OS.baldy.open('clean')) }, { label: '卸载超级秃子', icon: 'baldy', action: closeThen(() => OS.soft.uninstall('baldy')) }]) : null,
      has('yinshan') ? folder('银山打字通', [appItem('yinshan'), { label: '卸载银山打字通', icon: 'yinshan', action: closeThen(() => OS.soft.uninstall('yinshan')) }]) : null,
      has('manbo') ? folder('慢播', [appItem('manbo'), { label: '卸载慢播', icon: 'manbo', action: closeThen(() => OS.soft.uninstall('manbo')) }]) : null,
      has('ruixin') ? folder('瑞鑫杀毒', [appItem('ruixin'), { label: '瑞鑫升级程序', icon: 'ruixin', action: closeThen(() => OS.ruixin && OS.ruixin.open('up')) }, { label: '卸载瑞鑫', icon: 'ruixin', action: closeThen(() => OS.soft.uninstall('ruixin')) }]) : null,
      has('koukou') ? folder('抠抠软件', [appItem('koukou'), { label: '卸载 抠抠2003', icon: 'exe', action: closeThen(() => OS.soft.uninstall('koukou')) }]) : null,
      has('qianqian') ? folder('千千不听', [appItem('qianqian'), { label: '卸载 千千不听', icon: 'exe', action: closeThen(() => OS.soft.uninstall('qianqian')) }]) : null,
      has('abcsee') ? folder('ABCSee 大眼看图', [appItem('abcsee'), { label: 'ABCSee 帮助', icon: 'help', action: closeThen(() => OS.abcsee && OS.abcsee.help()) }, { label: '卸载 ABCSee', icon: 'exe', action: closeThen(() => OS.soft.uninstall('abcsee')) }]) : null
    ];
  }

  function openAll() {
    clearTimeout(hoverT);
    if (flyout || !menu.classList.contains('open')) return;
    const r = OS.stage.rectOf(allBtn), lc = OS.stage.rectOf(leftCol);
    const a = { x: lc.right, y: r.top }, b = { x: lc.right, y: r.bottom };
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

  /* ---------- 点右下角小喇叭：弹一个小音量框（XP 原样：一根竖着的滑块 + 静音），点别处收起 ---------- */
  let volPop = null;
  function closeVolPop() {
    if (!volPop) return;
    volPop.remove();
    volPop = null;
    document.removeEventListener('pointerdown', outside, true);
  }
  function outside(e) { if (volPop && !volPop.contains(e.target) && !volIco.contains(e.target)) closeVolPop(); }
  TB.volumePopup = function () {
    if (volPop) { closeVolPop(); return; }
    const knob = el('div', { class: 'vp-knob' });
    const track = el('div', { class: 'vp-track' }, [el('div', { class: 'vp-line' }), knob]);
    const place = () => { knob.style.top = ((1 - OS.sound.level) * 100) + '%'; };
    const setFrom = ev => {
      const r = OS.stage.rectOf(track), p = OS.stage.toLocal(ev.clientX, ev.clientY);
      OS.sound.setLevel(OS.clamp(1 - (p.y - r.top) / r.height, 0, 1));
      place();
    };
    track.addEventListener('pointerdown', e => {
      e.preventDefault();
      setFrom(e);
      try { track.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      const mv = ev => setFrom(ev);
      const up = () => { track.removeEventListener('pointermove', mv); track.removeEventListener('pointerup', up); track.removeEventListener('pointercancel', up); OS.sound.play('ding'); };
      track.addEventListener('pointermove', mv);
      track.addEventListener('pointerup', up);
      track.addEventListener('pointercancel', up);
    });
    const mute = el('input', { type: 'checkbox' });
    mute.checked = OS.sound.muted;
    mute.addEventListener('change', () => { OS.sound.setMuted(mute.checked); if (!mute.checked) OS.sound.play('ding'); });
    volPop = el('div', { class: 'vol-pop' }, [el('div', { class: 'vp-h', text: '音量' }), track, el('label', { class: 'vp-mute' }, [mute, el('span', { text: '静音' })])]);
    place();
    const st = OS.stage, r = st.rectOf(volIco);
    volPop.style.left = OS.clamp(r.left + r.width / 2 - 30, 2, st.W - 62) + 'px';
    volPop.style.bottom = (st.H - r.top + 4) + 'px';
    document.getElementById('overlay').appendChild(volPop);
    setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
  };
  OS.on('desktop:reset', closeVolPop);

  // 开始按钮的字（null = 变回“开始”）
  TB.setStartLabel = t => { const sp = startBtn && startBtn.querySelector('span:last-child'); if (sp) sp.textContent = t || '开始'; };

  // 超级秃子 ▸ 魔法设置 ▸ 开始按钮：换字（空 = 变回开始）
  TB.setStartText = function (t) {
    t = String(t || '').trim().slice(0, 4);
    if (t && t !== '开始') OS.save.set('startText', t); else OS.save.remove('startText');
    const sp = startBtn && startBtn.querySelector('.sb-label');
    if (sp) sp.textContent = t || '开始';
  };
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
