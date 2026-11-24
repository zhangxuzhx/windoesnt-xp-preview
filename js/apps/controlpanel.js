/* 控制面板（开始菜单右栏；我的电脑左边也有链接）：就是这个游戏的“设置”，穿着 XP 控制面板的衣服
   - 分类视图（默认）：10 个类别，单击就进（XP 的分类视图本来就像网页链接）；左边能切到经典视图：一堆小图标，要双击
   - 真能改的：屏幕方向（显示 ▸ 设置，点应用后 15 秒不点“是”自己转回去）、音量（声音和音频设备）、
     双击速度（鼠标）、头像（用户帐户）、清空存档（一键还原小精灵）。这几个重启、一键还原都不动
   - 其余都是笑点和联动
   - 日期和时间真能调（右下角时间跟着走，记住）；区域和语言选火星文，整个屏幕的字都变火星文（重启变回来）
   - 蓝屏：电脑里的时间从 1999 年走进 2000 年（调到 1999 年 12 月 31 日点应用最快）→ 19100 年 → 千年虫 Y2K_BUG
   创意稿见「控制面板-创意.md」 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.control;
  const NAME = '控制面板';
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const L = {
    pick: '选择一个类别',
    task: '选择一个任务…',
    orIcon: '或选择一个控制面板图标',
    toClassic: '切换到经典视图', toCat: '切换到分类视图',
    seeAlso: '请参阅', update: "Windoesn't Update", help: '帮不了和不支持',
    helpTitle: '帮助和支持中心', helpText: '如需帮助，请自行解决。',
    updChecking: '正在检查更新……', updFound: '发现 1 个重要更新：请购买专业版。',
    fav: '已添加到收藏夹。\n收藏夹里又多了一个你再也不会点开的东西。',
    wallpaper: '你可以试试ABCSee',
    saverDone: '这就是保护。',
    marsFix: '正在把火星文翻译回地球话',
    net: '状态：已连接上\n连的是隔壁的网。\n已发送：1,024 个数据包　已接收：0 个',
    gamepad: '没有检测到游戏控制器。\n你手里拿着的就是。',
    scanner: '没有找到扫描仪。\n请把照片举到屏幕前面。',
    password: '你没有密码。\n谁都能开你的电脑。',
    admin: '管理员已跑路。\n最后一次登录：在他跑路之前。',
    guest: '访客账户已停用，\n因为没有人来看你。',
    mars: '伱の電腦巳經變荿吙暒文鍄',
    magnifier: '想大一点就凑近点看。',
    swap: '你用的是手指。\n手指没有左右键。',
    dblHint: '双击文件夹以测试设置。如果文件夹没有打开或关闭，请使用较慢的设置。',
    keep: '您的桌面已重新配置。是否要保留这些设置？',
    keepLeft: n => n + ' 秒后自动还原。',
    avatarHint: '为你的帐户挑一个新图片。开机和开始菜单上都会换成它。',
    y2kNote: '现在是 19100 年 1 月 1 日。',
    count: n => n + ' 个对象'
  };
  const ORIENTS = [['portrait', '竖屏'], ['landscape', '横屏'], ['landscape2', '反向横屏'], ['flip', '倒立']];
  const AVATARS = ['duck', 'ava-cat', 'ava-dog', 'ava-fish', 'ava-sheep'];
  const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const BSOD = { id: 'control', name: 'Y2K_BUG', text: '千年虫从 1999 年爬过来了。' };
  const avatar = () => OS.save.get('avatar', 'duck');

  /* ================= 每个“控制面板图标” ================= */
  const A = {
    display: { label: '显示', icon: 'theme', run: () => displayProps('设置') },
    folder: { label: '文件夹选项', icon: 'folder', run: () => OS.explorer.folderOptions() },
    network: { label: '网络连接', icon: 'network', run: netStatus },
    addRemove: { label: '添加或删除程序', icon: 'cd', run: () => OS.addRemove && OS.addRemove() },
    sound: { label: '声音和音频设备', icon: 'volume', run: soundProps },
    system: { label: '系统', icon: 'computer', run: () => OS.menus.systemProps() },
    restore: { label: '一键还原', icon: 'genie', run: () => OS.apps.open('restore') },
    cleanup: { label: '磁盘清理', icon: 'recycle', run: cleanup },
    printer: { label: '打印机和传真', icon: 'printer', run: () => OS.ui.dialog({ title: OS.PRINT_TITLE, icon: 'error', text: OS.printErr() }) },
    mouse: { label: '鼠标', icon: 'ballmouse', run: mouseProps },
    gamepad: { label: '游戏控制器', icon: 'gamepad', run: say('游戏控制器', 'info', L.gamepad) },
    scanner: { label: '扫描仪和照相机', icon: 'camera', run: say('扫描仪和照相机', 'info', L.scanner) },
    users: { label: '用户帐户', icon: avatar, run: usersWin },
    datetime: { label: '日期和时间', icon: 'clock', run: dateProps },
    region: { label: '区域和语言选项', icon: 'globe', run: regionProps },
    access: { label: '辅助功能选项', icon: 'search', run: say('放大镜', 'info', L.magnifier) },
    security: { label: '安全中心', icon: 'shield', run: securityWin }
  };
  const icoOf = a => (typeof a.icon === 'function' ? a.icon() : a.icon);

  /* ================= 分类 ================= */
  const CATS = [
    { label: '外观和主题', icon: 'theme', tasks: [['更改屏幕方向', () => displayProps('设置')], ['更改桌面背景', () => displayProps('桌面')], ['选择一个屏幕保护程序', () => displayProps('屏幕保护程序')]], icons: ['display', 'folder'] },
    { label: '网络和 Internot 连接', icon: 'network', tasks: [['查看网络连接状态', netStatus], ['Internet 选项', () => OS.ie && OS.ie.options()]], icons: ['network'] },
    { label: '添加/删除程序', icon: 'cd', direct: 'addRemove' },
    { label: '声音、语音和音频设备', icon: 'volume', tasks: [['调整系统音量', soundProps]], icons: ['sound'] },
    { label: '性能和维护', icon: 'gauge', tasks: [['查看你的电脑的基本信息', () => OS.menus.systemProps()], ['释放磁盘空间', cleanup], ['一键还原，从头开始', () => OS.apps.open('restore')]], icons: ['system', 'restore', 'cleanup'] },
    { label: '打印机和其它硬件', icon: 'printer', tasks: [['调整双击速度', mouseProps], ['查看打印机', A.printer.run]], icons: ['printer', 'mouse', 'gamepad', 'scanner'] },
    { label: '用户帐户', icon: avatar, tasks: [['更改我的图片', pickAvatar], ['更改我的密码', say('用户帐户', 'info', L.password)]], icons: ['users'] },
    { label: '日期、时间、语言和区域设置', icon: 'clock', tasks: [['更改日期和时间', dateProps], ['更改语言', regionProps]], icons: ['datetime', 'region'] },
    { label: '辅助功能选项', icon: 'search', tasks: [['打开放大镜', A.access.run]], icons: ['access'] },
    { label: '安全中心', icon: 'shield', direct: 'security' }
  ];

  /* ================= 主窗口 ================= */
  app.open = function () {
    let page = 'home', hist = [], sel = null, lastTap = null, lastT = 0;
    const classic = () => !!OS.save.get('cpClassic', false);

    const backBtn = el('button', { class: 'ex-btn' }, [el('span', { class: 'ex-arrow left' }), el('span', { text: '后退' })]);
    backBtn.addEventListener('click', () => { OS.sound.play('click'); if (hist.length) { page = hist.pop(); render(); } });
    const searchBtn = el('button', { class: 'ex-btn' }, [OS.iconEl('search', 'ex-bico'), el('span', { text: '搜索' })]);
    searchBtn.addEventListener('click', () => { OS.sound.play('click'); OS.ui.dialog({ title: '搜索', icon: 'info', text: '搜索完毕，没找到。\n你要找的东西可能在你自己心里。' }); });
    const addrText = el('span', { class: 'ex-addr-text' });
    const pane = el('div', { class: 'ex-pane fx-pane' });
    const view = el('div', { class: 'ex-view cp-view' });
    const status = el('div', { class: 'ex-status' });
    const content = el('div', { class: 'ex' }, [
      OS.ui.menuBar(OS.ui.EX_MENUS, barMenu, 'ex-menu'),
      el('div', { class: 'ex-tools' }, [backBtn, el('span', { class: 'ex-sep' }), searchBtn]),
      el('div', { class: 'ex-addr' }, [el('span', { text: '地址(D)' }), el('div', { class: 'ex-addr-box' }, [el('span', { class: 'ex-aico-wrap' }, [OS.iconEl('control', 'ex-aico')]), addrText])]),
      el('div', { class: 'ex-main' }, [pane, view]),
      status
    ]);
    const win = OS.wm.open({ title: NAME, icon: 'control', width: 456, height: 270, appId: app.id, content, center: true });
    view.addEventListener('click', () => { view.querySelectorAll('.ex-item.sel').forEach(n => n.classList.remove('sel')); sel = null; });

    function go(p) { hist.push(page); page = p; render(); }
    function setClassic(v) { OS.save.set('cpClassic', !!v); hist = []; page = 'home'; render(); }
    function barMenu(name) {
      const M = OS.ui.EX_MENUS;
      if (name === M[0]) return [{ label: '关闭', action: () => win.close() }];
      if (name === M[1]) return [{ label: '撤销', disabled: true }];
      if (name === M[2]) return [{ label: '分类视图', checked: !classic(), action: () => setClassic(false) }, { label: '经典视图', checked: classic(), action: () => setClassic(true) }];
      if (name === M[3]) return [{ label: '添加到收藏夹…', action: say('添加到收藏夹', 'info', L.fav) }];
      if (name === M[4]) return [{ label: '文件夹选项…', action: () => OS.explorer.folderOptions() }];
      return [{ label: '帮助和支持', action: say(L.helpTitle, 'help', L.helpText) }, '-', { label: "关于 Windoesn't", action: OS.ui.about }];
    }

    function render() {
      backBtn.disabled = !hist.length;
      view.textContent = '';
      sel = null; lastTap = null;
      const cat = typeof page === 'number' ? CATS[page] : null;
      addrText.textContent = cat ? cat.label : NAME;
      win.setTitle(cat ? cat.label : NAME);
      status.textContent = '';
      drawPane();
      if (classic() && !cat) { drawClassic(); return; }
      if (cat) { drawCat(cat); return; }
      view.className = 'ex-view cp-view cp-home';
      view.appendChild(el('div', { class: 'cp-h', text: L.pick }));
      const grid = el('div', { class: 'cp-cats' });
      CATS.forEach((c, i) => {
        const b = el('div', { class: 'cp-cat' }, [OS.iconEl(icoOf(c), 'cp-cico'), el('span', { text: c.label })]);
        b.addEventListener('click', () => { OS.sound.play('click'); if (c.direct) A[c.direct].run(); else go(i); });
        grid.appendChild(b);
      });
      view.appendChild(grid);
    }
    function drawCat(cat) {
      view.className = 'ex-view cp-view cp-catpage';
      view.appendChild(el('div', { class: 'cp-cathead' }, [OS.iconEl(icoOf(cat), 'cp-chico'), el('span', { text: cat.label })]));
      view.appendChild(el('div', { class: 'cp-h2', text: L.task }));
      cat.tasks.forEach(([t, fn]) => {
        const a = el('div', { class: 'cp-task' }, [el('span', { class: 'cp-bullet' }), el('span', { text: t })]);
        a.addEventListener('click', () => { OS.sound.play('click'); fn(); });
        view.appendChild(a);
      });
      view.appendChild(el('div', { class: 'cp-h2', text: L.orIcon }));
      const box = el('div', { class: 'cp-icons' });
      cat.icons.forEach(k => {
        const a = A[k];
        const b = el('div', { class: 'cp-ilink' }, [OS.iconEl(icoOf(a), 'cp-iico'), el('span', { text: a.label })]);
        b.addEventListener('click', () => { OS.sound.play('click'); a.run(); });
        box.appendChild(b);
      });
      view.appendChild(box);
    }
    // 经典视图：所有图标排在一起，要双击才开
    function drawClassic() {
      view.className = 'ex-view cp-view fx-icons cp-classic';
      const keys = Object.keys(A);
      keys.forEach(k => {
        const a = A[k];
        const node = el('div', { class: 'ex-item' }, [OS.iconEl(icoOf(a), 'ex-iico'), el('div', { class: 'ex-ilabel', text: a.label })]);
        node.addEventListener('click', e => {
          e.stopPropagation();
          view.querySelectorAll('.ex-item.sel').forEach(n => n.classList.remove('sel'));
          node.classList.add('sel');
          sel = k;
          const now = Date.now();
          if (lastTap === k && now - lastT < OS.dblMs()) { lastTap = null; OS.sound.play('click'); a.run(); } else { lastTap = k; lastT = now; }
        });
        view.appendChild(node);
      });
      status.textContent = L.count(keys.length);
    }
    function drawPane() {
      pane.textContent = '';
      const link = (text, fn) => { const a = el('div', { class: 'ex-link', text }); a.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return a; };
      const sec = (title, links) => el('div', { class: 'ex-sec' }, [el('div', { class: 'ex-sec-h', text: title }), el('div', { class: 'ex-sec-b' }, links)]);
      const first = typeof page === 'number'
        ? [link(NAME, () => { hist = []; page = 'home'; render(); })]
        : [classic() ? link(L.toCat, () => setClassic(false)) : link(L.toClassic, () => setClassic(true))];
      pane.appendChild(sec(NAME, first));
      pane.appendChild(sec(L.seeAlso, [link(L.update, checkUpdate), link(L.help, say(L.helpTitle, 'help', L.helpText))]));
    }
    // 换了头像：类别和图标跟着换
    const onAvatar = () => { if (!win.isClosed) render(); };
    OS.on('avatar:changed', onAvatar);
    win.closed.then(() => OS.off('avatar:changed', onAvatar));
    render();
    return win;
  };

  OS.controlPanel = { dateProps: () => dateProps(), soundProps: () => soundProps(), displayProps: start => displayProps(start || '桌面') };

  /* ================= 小工具 ================= */
  const btn = (text, cls) => el('button', { class: 'xpbtn' + (cls ? ' ' + cls : ''), text });
  const chk = (label, on, fn) => {
    const b = el('input', { type: 'checkbox' });
    b.checked = !!on;
    b.addEventListener('change', () => fn(b.checked, b));
    return el('label', { class: 'cp-chk' }, [b, el('span', { text: label })]);
  };
  const select = (opts, value, fn) => {
    const s = el('select', { class: 'cp-sel' }, opts.map(([v, t]) => { const o = el('option', { text: t }); o.value = v; return o; }));
    s.value = value;
    s.addEventListener('change', () => fn && fn(s.value));
    return s;
  };
  const range = (min, max, value, fn) => {
    const r = el('input', { type: 'range', class: 'cp-range' });
    r.min = min; r.max = max; r.step = 1; r.value = value;
    r.addEventListener('input', () => fn(+r.value));
    return r;
  };
  const group = (title, kids) => el('fieldset', { class: 'cp-group' }, [el('legend', { text: title })].concat(kids));
  // 小显示器：属性框里画的那台
  const monitor = inner => el('div', { class: 'cp-mon' }, [el('div', { class: 'cp-mon-scr' }, inner ? [inner] : []), el('div', { class: 'cp-mon-neck' }), el('div', { class: 'cp-mon-base' })]);

  // XP 的属性框：上面一排标签，下面［确定］［取消］［应用］
  function propSheet(o) {
    const tabBar = el('div', { class: 'cp-tabs' });
    const body = el('div', { class: 'cp-body' });
    const built = {};
    let cur = null;
    const show = name => {
      cur = name;
      tabBar.querySelectorAll('.cp-tab').forEach(t => t.classList.toggle('on', t.dataset.name === name));
      body.textContent = '';
      if (!built[name]) built[name] = o.tabs.find(t => t[0] === name)[1]();
      body.appendChild(built[name]);
    };
    o.tabs.forEach(([name]) => {
      const t = el('div', { class: 'cp-tab', text: name });
      t.dataset.name = name;
      t.addEventListener('click', () => { OS.sound.play('click'); show(name); });
      tabBar.appendChild(t);
    });
    const ok = btn('确定', 'default'), cancel = btn('取消'), apply = btn('应用');
    let applied = false;
    const win = OS.wm.open({ title: o.title, icon: o.icon, width: o.width || 300, content: el('div', { class: 'cp-sheet' }, [tabBar, body, el('div', { class: 'dlg-btns cp-btns' }, [ok, cancel, apply])]),
      maximizable: false, minimizable: false, center: true, onClose: () => { if (!applied && o.cancel) o.cancel(); } });
    const doApply = () => Promise.resolve(o.apply ? o.apply() : null);
    ok.addEventListener('click', () => { OS.sound.play('click'); doApply().then(() => { applied = true; win.close(); }); });
    cancel.addEventListener('click', () => { OS.sound.play('click'); win.close(); });
    apply.addEventListener('click', () => { OS.sound.play('click'); doApply().then(() => { applied = true; }); });
    show(o.start && o.tabs.some(t => t[0] === o.start) ? o.start : o.tabs[0][0]);
    return win;
  }
  // 等一会儿的小框（磁盘清理、检查更新）
  function busy(title, icon, text, ms) {
    return new Promise(resolve => {
      const fill = el('div', { class: 'cp-pfill' });
      const w = OS.wm.open({ title, icon, width: 240, modal: true, taskbar: false, minimizable: false, maximizable: false, closable: false, className: 'is-dialog',
        content: el('div', { class: 'cp-busy' }, [el('div', { text }), el('div', { class: 'cp-pbar' }, [fill])]) });
      requestAnimationFrame(() => { fill.style.transition = 'width ' + ms + 'ms linear'; fill.style.width = '100%'; });
      setTimeout(() => { w.close(); resolve(); }, ms + 150);
    });
  }

  /* ================= 显示 属性 ================= */
  function displayProps(start) {
    let picked = OS.stage.orient;
    let scr = null;
    const drawScr = () => { if (scr) scr.style.transform = { landscape: 'rotate(90deg) scale(.75)', landscape2: 'rotate(-90deg) scale(.75)', flip: 'rotate(180deg)' }[picked] || ''; };
    let sel = null;
    return propSheet({
      title: '显示 属性', icon: 'theme', start,
      tabs: [
        ['桌面', () => {
          const browse = btn('浏览…');
          browse.addEventListener('click', () => { OS.sound.play('click'); OS.ui.dialog({ title: '显示 属性', icon: 'info', text: L.wallpaper }); });
          const custom = btn('自定义桌面…');
          custom.addEventListener('click', () => { OS.sound.play('click'); deskItems(); });
          return el('div', { class: 'cp-pane' }, [monitor(el('div', { class: 'cp-wall' })),
            el('div', { class: 'cp-row' }, [el('span', { text: '背景：' })]), el('div', { class: 'cp-list' }, [el('div', { class: 'cp-li on', text: '羊和草地' })]),
            el('div', { class: 'cp-row two' }, [custom, browse])]);
        }],
        ['屏幕保护程序', () => {
          const pv = btn('预览');
          pv.addEventListener('click', () => { OS.sound.play('click'); saverPreview(); });
          return el('div', { class: 'cp-pane' }, [monitor(el('div', { class: 'cp-black' })),
            group('屏幕保护程序', [el('div', { class: 'cp-row' }, [select([['none', '无']], 'none'), pv]), el('div', { class: 'cp-row' }, [el('span', { text: '等待：10 分钟' })])])]);
        }],
        ['设置', () => {
          scr = el('div', { class: 'cp-wall cp-mini' });
          drawScr();
          sel = select(ORIENTS, picked, v => { picked = v; drawScr(); });
          return el('div', { class: 'cp-pane' }, [monitor(scr),
            el('div', { class: 'cp-row' }, [el('span', { text: '屏幕方向：' }), sel]),
            el('div', { class: 'cp-row two' }, [group('屏幕分辨率', [el('div', { text: '480 × 360 像素' })]), group('颜色质量', [el('div', { text: '32 位' })])])]);
        }]
      ],
      apply: () => {
        if (picked === OS.stage.orient) return null;
        const prev = OS.stage.orient;
        OS.stage.setOrient(picked);
        return keepDialog().then(keep => {
          OS.stage.setOrient(keep ? picked : prev, true);
          if (!keep) { picked = prev; if (sel) sel.value = prev; drawScr(); }
        });
      }
    });
  }
  // 显示属性 ▸ 桌面 ▸［自定义桌面…］：照 XP 的"桌面项目"，勾哪几个系统图标显示在桌面上（2026-11-24 解放桌面）
  function deskItems() {
    const D = OS.desktop, IDS = [['mydocs', '我的文档'], ['mycomputer', '我的电脑'], ['network', '网上邻居'], ['ie', 'Internot Explorer']];
    const want = {};
    IDS.forEach(([id]) => { want[id] = D.sysShown(id); });
    const ok = btn('确定', 'default'), no = btn('取消');
    const w = OS.wm.open({ title: '桌面项目', icon: 'theme', width: 250, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'cp-pane' }, [
        group('桌面图标', [el('div', { class: 'cp-deskitems' }, IDS.map(([id, label]) => chk(label, want[id], v => { want[id] = v; })))]),
        el('div', { class: 'dlg-btns' }, [ok, no])
      ]) });
    ok.addEventListener('click', () => {
      OS.sound.play('click');
      w.close();
      // 先藏再显示：藏掉的腾出格子；显示的时候桌面满了就挤爆
      IDS.forEach(([id]) => { if (!want[id]) D.setSysShown(id, false); });
      IDS.forEach(([id]) => { if (want[id]) D.setSysShown(id, true); });
    });
    no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
  }
  // 改完屏幕必弹的那个框：15 秒不点“是”就自己还原
  function keepDialog() {
    return new Promise(resolve => {
      let left = 15, done = false, t = 0;
      const cnt = el('div', { class: 'cp-keep-n', text: L.keepLeft(left) });
      const yes = btn('是', 'default'), no = btn('否');
      const finish = v => { if (done) return; done = true; clearInterval(t); resolve(v); };
      const w = OS.wm.open({ title: '显示 设置', width: 270, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
        content: el('div', { class: 'dlg' }, [el('div', { class: 'dlg-main' }, [OS.iconEl('info', 'dlg-icon'), el('div', { class: 'dlg-text' }, [el('div', { text: L.keep }), cnt])]), el('div', { class: 'dlg-btns' }, [yes, no])]),
        onClose: () => finish(false) });
      t = setInterval(() => { left--; cnt.textContent = L.keepLeft(left); if (left <= 0) { finish(false); w.close(); } }, 1000);
      yes.addEventListener('click', () => { OS.sound.play('click'); finish(true); w.close(); });
      no.addEventListener('click', () => { OS.sound.play('click'); finish(false); w.close(); });
      OS.sound.play('ding');
    });
  }
  function saverPreview() {
    const black = el('div', { class: 'cp-saver' });
    document.getElementById('overlay').appendChild(black);
    setTimeout(() => { black.remove(); OS.ui.dialog({ title: '屏幕保护程序', icon: 'info', text: L.saverDone }); }, 2000);
  }

  /* ================= 声音和音频设备 属性 ================= */
  function soundProps() {
    const was = { level: OS.sound.level, muted: OS.sound.muted, vol: OS.save.get('volIcon', true), auto: !!OS.save.get('qqAuto', false) };
    return propSheet({
      title: '声音和音频设备 属性', icon: 'volume',
      tabs: [['音量', () => el('div', { class: 'cp-pane' }, [
        el('div', { class: 'cp-row' }, [OS.iconEl('speaker', 'cp-big'), el('b', { text: '设备音量' })]),
        el('div', { class: 'cp-row' }, [el('span', { text: '低' }), range(0, 100, Math.round(OS.sound.level * 100), v => OS.sound.setLevel(v / 100)), el('span', { text: '高' })]),
        chk('静音', OS.sound.muted, v => OS.sound.setMuted(v)),
        chk('将音量图标放入任务栏', was.vol, v => { OS.save.set('volIcon', v); OS.emit('tray:changed'); }),
        chk('开机自动播放千千不听', was.auto, v => OS.save.set('qqAuto', v))
      ])]],
      cancel: () => {
        OS.sound.setLevel(was.level);
        if (OS.sound.muted !== was.muted) OS.sound.setMuted(was.muted);
        OS.save.set('volIcon', was.vol); OS.emit('tray:changed');
        OS.save.set('qqAuto', was.auto);
      }
    });
  }

  /* ================= 鼠标 属性：双击速度 ================= */
  const msOf = v => 900 - v * 70;                         // 滑块 0（慢）~ 10（快）→ 900 ~ 200 毫秒
  const posOf = ms => Math.round((900 - ms) / 70);
  function mouseProps() {
    let pos = posOf(OS.dblMs()), moved = false, open = false, lastT = 0;
    return propSheet({
      title: '鼠标 属性', icon: 'ballmouse', width: 300,
      tabs: [['鼠标键', () => {
        const folder = el('div', { class: 'cp-testf' }, [OS.iconEl('folder', 'cp-big')]);
        folder.addEventListener('click', () => {
          const t = Date.now();
          if (t - lastT < msOf(pos)) {
            lastT = 0; open = !open;
            folder.textContent = ''; folder.appendChild(OS.iconEl(open ? 'mydocs' : 'folder', 'cp-big'));
            OS.sound.play('click');
          } else lastT = t;
        });
        return el('div', { class: 'cp-pane' }, [
          group('鼠标键配置', [chk('切换主要和次要按钮', false, (v, b) => { if (!v) return; b.checked = false; OS.ui.dialog({ title: '鼠标 属性', icon: 'info', text: L.swap }); })]),
          group('双击速度', [el('div', { class: 'cp-row top' }, [el('div', { class: 'cp-small', text: L.dblHint }), folder]),
            el('div', { class: 'cp-row' }, [el('span', { text: '速度：慢' }), range(0, 10, pos, v => { pos = v; moved = true; }), el('span', { text: '快' })])])
        ]);
      }]],
      apply: () => { if (moved) OS.save.set('dblMs', msOf(pos)); }
    });
  }

  /* ================= 用户帐户 ================= */
  function usersWin() {
    const box = el('div', { class: 'cp-users' });
    const w = OS.wm.open({ title: '用户帐户', icon: avatar(), width: 300, content: box, maximizable: false, center: true });
    const draw = () => {
      box.textContent = '';
      box.appendChild(el('div', { class: 'cp-h2', text: L.task }));
      [['更改我的图片', pickAvatar], ['更改我的密码', say('用户帐户', 'info', L.password)]].forEach(([t, fn]) => {
        const a = el('div', { class: 'cp-task' }, [el('span', { class: 'cp-bullet' }), el('span', { text: t })]);
        a.addEventListener('click', () => { OS.sound.play('click'); fn(); });
        box.appendChild(a);
      });
      box.appendChild(el('div', { class: 'cp-h2', text: '或挑一个帐户做更改' }));
      const row = el('div', { class: 'cp-accts' });
      [[avatar(), '你', '计算机管理员', pickAvatar], ['runner', '管理员', '已跑路', say('用户帐户', 'error', L.admin)], ['lock', 'Guest', '已停用', say('用户帐户', 'error', L.guest)]].forEach(([ic, n, st, fn]) => {
        const a = el('div', { class: 'cp-acct' }, [OS.iconEl(ic, 'cp-aava'), el('div', {}, [el('div', { class: 'cp-aname', text: n }), el('div', { class: 'cp-small', text: st })])]);
        a.addEventListener('click', () => { OS.sound.play('click'); fn(); });
        row.appendChild(a);
      });
      box.appendChild(row);
    };
    const onAvatar = () => { if (!w.isClosed) draw(); };
    OS.on('avatar:changed', onAvatar);
    w.closed.then(() => OS.off('avatar:changed', onAvatar));
    draw();
    return w;
  }
  function pickAvatar() {
    let pick = avatar();
    const grid = el('div', { class: 'cp-avas' });
    const draw = () => {
      grid.textContent = '';
      AVATARS.forEach(a => {
        const b = el('div', { class: 'cp-ava' + (a === pick ? ' on' : '') }, [OS.iconEl(a, 'cp-avaimg')]);
        b.addEventListener('click', () => { OS.sound.play('click'); pick = a; draw(); });
        grid.appendChild(b);
      });
    };
    draw();
    const ok = btn('更改图片', 'default'), no = btn('取消');
    const w = OS.wm.open({ title: '更改我的图片', icon: 'duck', width: 280, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'cp-pane' }, [el('div', { class: 'cp-small', text: L.avatarHint }), grid, el('div', { class: 'dlg-btns' }, [ok, no])]) });
    ok.addEventListener('click', () => { OS.sound.play('click'); OS.save.set('avatar', pick); OS.emit('avatar:changed', pick); w.close(); });
    no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
  }

  /* ================= 日期和时间 属性：真能调，右下角时间跟着走；千年虫蓝屏在这 ================= */
  // 电脑里的时间从 1999 年走进 2000 年那一刻（不管是调成 12 月 31 日最后几秒，还是等它自己走到）：年份显示成 19100 → 蓝屏
  let lastYear = OS.clock.now().getFullYear(), bugged = false;
  setInterval(() => {
    const y = OS.clock.now().getFullYear();
    if (lastYear === 1999 && y >= 2000 && !bugged && OS.boot.state === 'desktop') {
      bugged = true;
      OS.emit('control:y2k');
      OS.ui.notify({ title: '日期和时间', text: L.y2kNote, icon: 'warn', replace: true });
      setTimeout(() => { OS.clock.set(0); lastYear = OS.clock.now().getFullYear(); OS.ui.bsod(BSOD); }, 2200);   // 蓝屏的同时把时间修回现在（中途关网页也不会卡在 19100 年）
    }
    lastYear = y;
  }, 250);
  OS.on('desktop:reset', () => { bugged = false; });

  function dateProps() {
    const now = OS.clock.now();
    const st = { year: now.getFullYear() === 1999 ? '1999' : '200X', month: now.getMonth(), day: now.getDate(), bug: false, touched: false };
    const realYear = () => (st.year === '1999' ? 1999 : new Date().getFullYear());
    let cal = null, yearSel = null, monSel = null, hands = null, tSel = null, timer = 0;
    const drawCal = () => {
      if (!cal) return;
      cal.textContent = '';
      '日一二三四五六'.split('').forEach(d => cal.appendChild(el('div', { class: 'cp-cal-h', text: d })));
      if (st.bug) { cal.appendChild(el('div', { class: 'cp-cal-d on', text: '1' })); return; }
      const first = new Date(realYear(), st.month, 1).getDay(), days = new Date(realYear(), st.month + 1, 0).getDate();
      if (st.day > days) st.day = days;
      for (let i = 0; i < first; i++) cal.appendChild(el('div'));
      for (let d = 1; d <= days; d++) {
        const c = el('div', { class: 'cp-cal-d' + (d === st.day ? ' on' : ''), text: String(d) });
        c.addEventListener('click', () => { st.day = d; drawCal(); });
        cal.appendChild(c);
      }
    };
    // 时、分、秒三个下拉：没碰过就跟着走；一碰就停住，等你点应用（XP 也是这样）
    const shownTime = () => (st.touched ? { h: +tSel[0].value, m: +tSel[1].value, s: +tSel[2].value } : (d => ({ h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() }))(OS.clock.now()));
    const drawClock = () => {
      if (!hands) return;
      const t = shownTime();
      hands.h.setAttribute('transform', 'rotate(' + ((t.h % 12) * 30 + t.m / 2) + ' 30 30)');
      hands.m.setAttribute('transform', 'rotate(' + (t.m * 6) + ' 30 30)');
      hands.s.setAttribute('transform', 'rotate(' + (t.s * 6) + ' 30 30)');
      if (!st.touched) { tSel[0].value = String(t.h); tSel[1].value = String(t.m); tSel[2].value = String(t.s); }
    };
    // 千年虫：到 0 点那一刻，这个框里的年份也变成 19100
    const onBug = () => {
      st.bug = true; st.month = 0; st.day = 1; st.touched = false;
      if (yearSel) { yearSel.appendChild(Object.assign(el('option', { text: '19100' }), { value: '19100' })); yearSel.value = '19100'; }
      if (monSel) monSel.value = '0';
      drawCal();
    };
    const nums = n => Array.from({ length: n }, (_, i) => [String(i), OS.pad2(i)]);
    const w = propSheet({
      title: '日期和时间 属性', icon: 'clock', width: 320,
      tabs: [['时间和日期', () => {
        yearSel = select([['1999', '1999'], ['200X', '200X']], st.year, v => { st.year = v; drawCal(); });
        monSel = select(MONTHS.map((m, i) => [String(i), m]), String(st.month), v => { st.month = +v; drawCal(); });
        cal = el('div', { class: 'cp-cal' });
        drawCal();
        const svg = '<svg viewBox="0 0 60 60" class="cp-clock"><circle cx="30" cy="30" r="27" fill="#fff" stroke="#7f9db9" stroke-width="2"/>' +
          Array.from({ length: 12 }, (_, i) => '<rect x="29" y="5" width="2" height="' + (i % 3 ? 3 : 5) + '" fill="#2f5fb3" transform="rotate(' + (i * 30) + ' 30 30)"/>').join('') +
          '<line class="h" x1="30" y1="30" x2="30" y2="16" stroke="#333" stroke-width="3" stroke-linecap="round"/><line class="m" x1="30" y1="30" x2="30" y2="10" stroke="#333" stroke-width="2" stroke-linecap="round"/>' +
          '<line class="s" x1="30" y1="33" x2="30" y2="8" stroke="#d22" stroke-width="1"/><circle cx="30" cy="30" r="2" fill="#333"/></svg>';
        const face = el('div', { class: 'cp-clockbox', html: svg });
        hands = { h: face.querySelector('.h'), m: face.querySelector('.m'), s: face.querySelector('.s') };
        tSel = [select(nums(24), '0'), select(nums(60), '0'), select(nums(60), '0')];
        const touch = () => { st.touched = true; };
        tSel.forEach(s => { s.classList.add('cp-tsel'); ['pointerdown', 'focus', 'change'].forEach(ev => s.addEventListener(ev, touch)); s.addEventListener('change', drawClock); });
        drawClock();
        timer = setInterval(drawClock, 250);
        return el('div', { class: 'cp-pane' }, [
          el('div', { class: 'cp-row two top' }, [
            group('日期', [el('div', { class: 'cp-row' }, [monSel, yearSel]), cal]),
            group('时间', [face, el('div', { class: 'cp-digi' }, [tSel[0], el('span', { text: ':' }), tSel[1], el('span', { text: ':' }), tSel[2]])])
          ]),
          el('div', { class: 'cp-small', text: '当前时区：中国标准时间' })
        ]);
      }]],
      apply: () => {
        if (st.bug) return null;
        let { h, m, s } = shownTime();
        // 调到 1999 年 12 月 31 日、时间没动过：直接给你调到最后几秒，等着看千年虫
        if (st.year === '1999' && st.month === 11 && st.day === 31 && !st.touched) { h = 23; m = 59; s = 55; }
        const diff = new Date(realYear(), st.month, st.day, h, m, s).getTime() - Date.now();
        OS.clock.set(Math.abs(diff) < 1500 ? 0 : diff);   // 跟真实时间差不到一秒半，就当没改
        lastYear = OS.clock.now().getFullYear();
        st.touched = false;
        drawClock();
      }
    });
    w.closed.then(() => clearInterval(timer));
    OS.on('control:y2k', onBug);
    w.closed.then(() => OS.off('control:y2k', onBug));
    return w;
  }

  /* ================= 区域和语言选项：选火星文，整个屏幕的字都变火星文；重启变回来 ================= */
  const mars = { on: false, orig: new WeakMap(), obs: null };
  const MARS_SKIP = 'textarea, input, select, [contenteditable]';
  const toMars = t => OS.notepad.toMars(t);
  function marsNode(n) {
    const p = n.parentElement;
    if (!p || p.closest(MARS_SKIP)) return;
    const cur = n.nodeValue, known = mars.orig.get(n);
    if (known != null && cur === toMars(known)) return;   // 已经是改过的
    const conv = toMars(cur);
    if (conv === cur) return;
    mars.orig.set(n, cur);
    n.nodeValue = conv;
  }
  function marsTree(root) {
    if (root.nodeType === 3) { marsNode(root); return; }
    if (root.nodeType !== 1) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) marsNode(n);
  }
  function setMars(on, keepFix) {
    if (on === mars.on) return;
    mars.on = on;
    const root = OS.stage.el;
    if (on) {
      marsTree(root);
      mars.obs = new MutationObserver(list => list.forEach(m => { if (m.type === 'characterData') marsNode(m.target); else m.addedNodes.forEach(marsTree); }));
      mars.obs.observe(root, { childList: true, subtree: true, characterData: true });
      OS.bootFix.add('mars', L.marsFix);
    } else {
      if (mars.obs) mars.obs.disconnect();
      mars.obs = null;
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = tw.nextNode())) { const v = mars.orig.get(n); if (v != null && n.nodeValue === toMars(v)) n.nodeValue = v; }
      mars.orig = new WeakMap();
      if (!keepFix) OS.bootFix.remove('mars');   // 重启时那条“正在……”要留给开机自检显示
    }
  }
  OS.on('desktop:reset', () => setMars(false, true));
  function regionProps() {
    let lang = mars.on ? 'mars' : 'zh';
    return propSheet({
      title: '区域和语言选项', icon: 'globe',
      tabs: [['语言', () => el('div', { class: 'cp-pane' }, [group('语言', [el('div', { class: 'cp-small', text: '选择一种语言：' }), select([['zh', '简体中文'], ['mars', '火星文']], lang, v => { lang = v; })])])]],
      apply: () => {
        const was = mars.on;
        setMars(lang === 'mars');
        if (!was && mars.on) OS.ui.notify({ title: '区域和语言选项', text: L.mars, icon: 'info', replace: true });
      }
    });
  }

  /* ================= 网络、安全中心、磁盘清理、更新 ================= */
  function netStatus() {
    OS.ui.dialog({ title: '本地连接 状态', icon: 'network', text: L.net, buttons: ['关闭', '网上邻居'] }).then(v => { if (v === '网上邻居') OS.apps.open('network'); });
  }
  function securityWin() {
    const row = (name, state, ok) => el('div', { class: 'cp-secrow' }, [el('span', { class: 'cp-dot ' + (ok ? 'ok' : 'bad') }), el('b', { text: name }), el('span', { class: 'cp-secst ' + (ok ? 'ok' : 'bad'), text: state })]);
    const close = btn('关闭', 'default');
    const w = OS.wm.open({ title: "Windoesn't 安全中心", icon: 'shield', width: 280, maximizable: false, center: true,
      content: el('div', { class: 'cp-pane cp-sec' }, [el('div', { class: 'cp-sechead' }, [OS.iconEl('shield', 'cp-big'), el('b', { text: '安全要点' })]),
        row('防火墙', '已启用', true), row('自动更新', '从来没更新过', false), row('病毒防护', '没有安装', false),
        el('div', { class: 'cp-small cp-bad', text: '冲击波已经来过了。' }), el('div', { class: 'dlg-btns' }, [close])]) });
    close.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    OS.sound.play('error');
  }
  function cleanup() { if (OS.cleanup) OS.cleanup.open(); }   // 磁盘清理：cleanup.js
  function checkUpdate() { busy(L.update, 'logo', L.updChecking, 1600).then(() => OS.ui.dialog({ title: L.update, icon: 'warn', text: L.updFound })); }
})();
