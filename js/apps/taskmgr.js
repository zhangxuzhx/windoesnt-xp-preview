/* 任务管理器（任务栏空白处右键 ▸ 任务管理器；命令提示符 taskmgr）
   照 XP：应用程序 ／ 进程 ／ 性能 ／ 联网 ／ 用户 五页，菜单 文件 选项 查看 关机 帮助，底下状态栏，开着时托盘里一个绿色小 CPU 表。
   - 进程页能看到平时看不见的：sheep.exe（壁纸上的羊）、千千不听.exe、抠抠2003.exe、中毒后的 keygen_helper.exe、暴富秘籍下载器.exe
   - 结束 explorer.exe：桌面图标、任务栏、开始菜单全没了，文件夹窗口也跟着关掉；新任务里敲 explorer 救回来，
     任务管理器关了 / 最小化了救不回来，30 秒后自己回来；重启也回来
   - 结束 spoolsv.exe：所有“打印”改成“打印机服务已经被你结束了”，重启恢复
   - 优先级只有 sheep.exe（羊走路快慢）和 千千不听.exe（歌的快慢高低）有反应，其余设了没变化
   - 中毒第三拨起：任务管理器已被系统管理员停用
   - 蓝屏：结束 csrss.exe 或 winlogon.exe → YOU_ENDED_THE_SYSTEM */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.taskmgr;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const NAME = "Windoesn't 任务管理器";
  const L = {
    disabled: '任务管理器已被系统管理员停用。',
    menus: ['文件(F)', '选项(O)', '查看(V)', '关机(U)', '帮助(H)'],
    tabs: ['应用程序', '进程', '性能', '联网', '用户'],
    appCols: ['任务', '状态'], running: '正在运行', hung: '未响应',
    endTask: '结束任务', switchTo: '切换至', newTask: '新任务…',
    procCols: ['映像名称', '用户名', 'CPU', '内存使用'], allUsers: '显示所有用户的进程', endProc: '结束进程',
    warnTitle: '任务管理器警告',
    warn: '警告: 终止进程会导致不希望发生的结果，包括数据丢失和系统不稳定。在被终止前，进程将没有机会保存其状态和数据。确实想终止此进程吗?',
    prioWarn: '警告: 更改此进程的优先级类可能导致不希望发生的结果，包括系统不稳定。确实想更改优先级类吗?',
    cantTitle: '无法中止进程', denied: '无法完成操作。\n拒绝访问。', idle: '无法结束：它已经够闲了。',
    svchost: '剩下的 svchost.exe 表示不认识它。',
    ctfmon: '结束了。\n没人知道它是干嘛的，包括它自己。',
    shellBack: '桌面自己回来了。\n它怕黑。',
    richGone: '本台消息：暴富秘籍下载已取消，你与暴富擦肩而过。',
    hungTitle: n => '结束程序 - ' + n,
    hungText: '此程序没有响应。\n如果选择立即结束此程序，您会丢失所有未保存的信息。',
    hungBtns: ['立即结束', '取消'],
    prioMenu: '设置优先级', prios: ['实时', '高', '标准', '低'],
    goProc: '转到进程', minimize: '最小化', maximize: '最大化',
    ntTitle: '创建新任务',
    ntText: "请键入程序、文件夹、文档或 Internet 资源的名称，Windoesn't 将为你打开它。",
    ntLabel: '打开(O):', ok: '确定', cancel: '取消', browse: '浏览…',
    ntBrowse: '这台电脑没什么好浏览的。',
    ntHistory: ['explorer', 'notepad', '怎么删除浏览记录', '怎么让电脑变快'],
    ntSpecial: {
      '怎么删除浏览记录': '建议直接删除电脑。',
      '怎么让电脑变快': '建议跑起来，电脑就跟着变快了。'
    },
    notFound: n => "Windoesn't 找不到“" + n + '”。请确定文件名是否正确后，再试一次。',
    perf: { cpu: 'CPU 使用', cpuHis: 'CPU 使用记录', pf: 'PF 使用', pfHis: '页面文件使用记录' },
    perfNums: [
      ['总数', [['句柄', () => 4120 + procs().length * 37], ['线程', () => 280 + procs().length * 3], ['进程', () => procs().length]]],
      ['物理内存 (K)', [['总数', () => 640], ['可用', () => 0], ['系统缓存', () => 0]]],
      ['认可用量 (K)', [['总数', () => commit()], ['限制', () => 640], ['峰值', () => peak]]]
    ],
    netCols: ['适配器名称', '网络使用', '链接速度', '状态'],
    netRow: ['拨号连接', '0 %', '56 Kbps', '正在拨号……'],
    userCols: ['用户', '状态'],
    users: [['你', '活动'], ['管理员', '已跑路'], ['Guest', '已停用']],
    disconnect: '断开', logoff: '注销', sendMsg: '发送消息…',
    userSay: {
      '你': { disconnect: '断开不了：你断开了，谁来玩？', sendMsg: '给自己发消息？\n想说什么，直接想就行了。' },
      '管理员': { disconnect: '他早就断开了。', logoff: '他早就注销了。', sendMsg: '消息发送失败：对方已跑路。' },
      'Guest': { all: 'Guest 已停用。' }
    },
    fileMenu: { newTask: '新任务(运行)…', exit: '退出任务管理器' },
    front: '前端显示',
    refresh: '立即刷新', speed: '更新速度', speeds: [['高', 500], ['正常', 1000], ['低', 4000], ['暂停', 0]],
    shut: ['待机', '休眠', '关闭', '重新启动', '注销'],
    hibernate: '正在休眠……点一下唤醒', hibTitle: '休眠', hibWake: '刚才电脑睡着了。\n它说它梦见自己是正版。',
    helpTopics: '任务管理器帮助主题', helpText: '任务管理器可以帮你管理任务。\n你的作业不算任务。',
    about: '关于任务管理器', aboutText: "Windoesn't 任务管理器\n版本 5.1\n它知道你开了什么。",
    status: (n, c, a) => ['进程数: ' + n, 'CPU 使用: ' + c + '%', '提交更改: ' + fmtK(a) + ' / 640K']
  };
  const BSOD = { id: 'taskmgr', name: 'YOU_ENDED_THE_SYSTEM', text: '你在任务管理器里把系统自己结束了。系统很听话。' };
  const SHELL_FIX = '正在把桌面和任务栏找回来';
  const SPOOL_FIX = '正在重新雇用打印机服务';
  const SHELL_BACK_MS = 30000;

  /* ================= 进程 ================= */
  // 系统自带的（XP 里真有的文件名）；end：结束时怎么办
  const SYS = [
    { key: 'idle', name: 'System Idle Process', user: 'SYSTEM', mem: 16, end: 'idle' },
    { key: 'system', name: 'System', user: 'SYSTEM', mem: 236, end: 'deny' },
    { key: 'smss', name: 'smss.exe', user: 'SYSTEM', mem: 388, end: 'deny' },
    { key: 'csrss', name: 'csrss.exe', user: 'SYSTEM', mem: 4012, end: 'bsod' },
    { key: 'winlogon', name: 'winlogon.exe', user: 'SYSTEM', mem: 2316, end: 'bsod' },
    { key: 'services', name: 'services.exe', user: 'SYSTEM', mem: 3104, end: 'deny' },
    { key: 'lsass', name: 'lsass.exe', user: 'SYSTEM', mem: 1208, end: 'deny' },
    { key: 'svc1', name: 'svchost.exe', user: 'SYSTEM', mem: 4640, end: 'svchost' },
    { key: 'svc2', name: 'svchost.exe', user: 'NETWORK SERVICE', mem: 3912, end: 'svchost' },
    { key: 'svc3', name: 'svchost.exe', user: 'SYSTEM', mem: 17220, end: 'svchost' },
    { key: 'svc4', name: 'svchost.exe', user: 'NETWORK SERVICE', mem: 2860, end: 'svchost' },
    { key: 'svc5', name: 'svchost.exe', user: 'LOCAL SERVICE', mem: 3480, end: 'svchost' },
    { key: 'spoolsv', name: 'spoolsv.exe', user: 'SYSTEM', mem: 4400, end: 'spool' },
    { key: 'explorer', name: 'explorer.exe', user: '你', mem: 15220, end: 'shell' },
    { key: 'ctfmon', name: 'ctfmon.exe', user: '你', mem: 2980, end: 'ctfmon' },
    { key: 'dl', name: '暴富秘籍下载器.exe', user: '你', mem: 1, end: 'dl' }
  ];
  // 我们自己的软件：窗口开着就有进程
  const EXE = {
    bootcheck: '开机检测器.exe', lifespan: '阳寿查询.exe', rich: '解压专家.exe', pulse: '赛博把脉.exe', debt: 'EXCUSE.EXE',
    swatter: '弹窗杀手.exe', coil: '电子蚊香.exe', calc: 'calc.exe', paint: 'mspaint.exe', ie: 'Internot.exe', mail: 'outluck.exe',
    sweep: 'sweep.exe', cmd: 'cmd.exe', abcsee: 'ABCSee.exe', notepad: 'notepad.exe', wordpad: 'wordpad.exe',
    activator: '激活器.exe', restore: '一键还原.exe'
  };
  // 文件夹窗口都算 explorer.exe 的（结束 explorer.exe 它们也跟着关）
  const SHELL_APPS = new Set(['mydocs', 'mycomputer', 'network', 'recycle', 'folder2', 'control']);
  // 优先级：只有这两个真有反应
  const SHEEP_SPEED = { 实时: 2.5, 高: 1.6, 标准: 1, 低: 0.4 };
  const MUSIC_RATE = { 实时: 1.35, 高: 1.15, 标准: 1, 低: 0.75 };

  const gone = new Set();          // 这次开机结束掉的系统进程（svchost、ctfmon、spoolsv、下载器）
  const prio = {};                 // key → 优先级（没写就是标准）
  let virusN = 1, virusBack = 0;   // 病毒结束一次换个名字复活：keygen_helper(2).exe……
  const hiddenWins = new Set();    // 千千不听“隐藏主界面”：不算在应用程序里
  OS.on('win:hide', w => hiddenWins.add(w));
  OS.on('win:show', w => hiddenWins.delete(w));
  OS.on('win:close', w => hiddenWins.delete(w));
  OS.on('desktop:reset', () => {
    gone.clear();
    Object.keys(prio).forEach(k => delete prio[k]);
    virusN = 1; virusBack = 0;
    OS.spoolerOff = false;
    clearTimeout(shellTimer); shellTimer = 0;
  });

  const fmtK = n => Math.round(n).toLocaleString('en-US') + 'K';
  const fmtMem = n => Math.round(n).toLocaleString('en-US') + ' K';
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const isHung = w => /未响应/.test(w.rawTitle || '');
  const listedWins = () => OS.wm.wins.filter(w => !w.isClosed && !w.opts.modal && w.opts.taskbar !== false && w !== tmWin && !hiddenWins.has(w));
  const shellOwned = w => !w.opts.modal && w.opts.taskbar !== false && (SHELL_APPS.has(w.appId) || !w.appId);

  // 现在所有的进程：[{ key, name, user, mem, end, cpu }]（cpu 每次刷新时算）
  function procs() {
    const out = [];
    const shell = OS.desktop.shellOn();
    SYS.forEach(p => {
      if (gone.has(p.key)) return;
      if (p.key === 'explorer' && !shell) return;
      out.push(Object.assign({}, p));
    });
    const sheep = OS.desktop.sheepInfo();
    if (sheep.here) out.push({ key: 'sheep', name: 'sheep.exe', user: '你', mem: 3072 + sheep.ate * 1024, end: 'sheep' });
    if (OS.qianqian && OS.qianqian.running()) out.push({ key: 'qianqian', name: '千千不听.exe', user: '你', mem: 9216 + (OS.qianqian.playing() ? 6144 : 0), end: 'qianqian' });
    if (OS.koukou && OS.koukou.running()) out.push({ key: 'koukou', name: '抠抠2003.exe', user: '你', mem: 12844, end: 'koukou' });
    if (OS.virus && OS.virus.on() && Date.now() > virusBack) {
      out.push({ key: 'virus', name: 'keygen_helper' + (virusN > 1 ? '(' + virusN + ')' : '') + '.exe', user: '你', mem: 6666, end: 'virus' });
    }
    // 开着的软件：同一个软件开几个窗口也只算一个进程
    const seen = {};
    OS.wm.wins.forEach(w => {
      if (w.isClosed || !w.appId || w === tmWin || SHELL_APPS.has(w.appId) || w.appId === 'qianqian' || w.appId === 'koukou' || w.appId === 'taskmgr') return;
      if (seen[w.appId]) { seen[w.appId].mem += 1200; return; }
      const a = OS.apps.byId[w.appId];
      const name = EXE[w.appId] || ((a ? a.name : w.appId) + '.exe');
      seen[w.appId] = { key: 'app:' + w.appId, appId: w.appId, name, user: '你', mem: 1800 + hash(w.appId) % 9000, end: 'app' };
      out.push(seen[w.appId]);
    });
    if (tmWin && !tmWin.isClosed) out.push({ key: 'taskmgr', name: 'taskmgr.exe', user: '你', mem: 3412, end: 'tm' });
    return out;
  }
  const commit = () => procs().reduce((s, p) => s + p.mem, 0);
  let peak = 0;

  /* ---------- CPU：每次刷新现算（羊吃纸、放歌、中毒、卡死的窗口、狂点屏幕都会动） ---------- */
  let taps = 0;
  document.addEventListener('pointerdown', () => { taps++; }, true);
  let cpuNow = {}, cpuTotal = 0;
  function sample(list) {
    const c = {};
    const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    list.forEach(p => { c[p.key] = 0; });
    // 平时：偶尔有一两个进程冒一下
    for (let i = 0; i < 2; i++) { const p = OS.pick(list); if (p && p.key !== 'idle') c[p.key] += r(0, 2); }
    if ('explorer' in c) c.explorer += Math.min(18, taps * 3);
    taps = 0;
    if ('taskmgr' in c) c.taskmgr += r(1, 2);
    if ('sheep' in c) {
      const busy = OS.desktop.sheepInfo().busy, pr = prio.sheep || '标准';
      c.sheep += busy ? r(8, 20) : 0;
      if (pr === '实时') c.sheep += r(25, 35);
      else if (pr === '高') c.sheep += r(4, 8);
      else if (pr === '低' && busy) c.sheep = r(2, 5);
    }
    if ('qianqian' in c && OS.qianqian.playing()) {
      const pr = prio.qianqian || '标准';
      let v = Math.round(OS.qianqian.level() * 40) + r(3, 6);
      if (pr === '实时') v += r(12, 18); else if (pr === '低') v = Math.round(v / 2);
      c.qianqian += v;
    }
    if ('virus' in c) c.virus += r(47, 53);
    // 卡死的窗口：它的进程吃满
    listedWins().filter(isHung).forEach(w => { const k = 'app:' + w.appId; if (k in c) c[k] = 96; });
    let sum = 0;
    Object.keys(c).forEach(k => { if (k !== 'idle') sum += c[k]; });
    if (sum > 100) { const f = 100 / sum; Object.keys(c).forEach(k => { c[k] = Math.floor(c[k] * f); }); sum = 100; }
    if ('idle' in c) c.idle = Math.max(0, 100 - sum);
    cpuNow = c; cpuTotal = Math.min(100, sum);
  }

  /* ================= 窗口 ================= */
  let tmWin = null, tab = '应用程序', front = true, speedMs = 1000, timer = 0, trayEl = null;
  let selProc = null, selApp = null, selUser = null, allUsers = true;
  const cpuHis = [], pfHis = [];
  let ui = null;

  app.open = function () {
    if (OS.virus && OS.virus.wave && OS.virus.wave() >= 3) { OS.ui.dialog({ title: '任务管理器', icon: 'error', text: L.disabled }); return; }
    if (tmWin && !tmWin.isClosed) { if (tmWin.minimized) OS.wm.restore(tmWin); OS.wm.focus(tmWin); return tmWin; }
    ui = build();
    tmWin = OS.wm.open({
      title: NAME, icon: 'gauge', width: 300, height: 296, appId: app.id, content: ui.box, maximizable: false, topmost: front, center: true,
      onClose: () => {
        clearInterval(timer); timer = 0;
        if (trayEl) { trayEl.remove(); trayEl = null; }
        tmWin = null; ui = null;
        shellWatch();
      }
    });
    trayEl = OS.taskbar.trayAdd(el('span', { class: 'tray-btn tm-tray', title: NAME }, [el('i', { class: 'tm-tray-bar' })]));
    trayEl.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); if (tmWin) { if (tmWin.minimized) OS.wm.restore(tmWin); OS.wm.focus(tmWin); } });
    showTab(tab);
    tick();
    restartTimer();
    return tmWin;
  };
  OS.on('win:open', () => { if (ui) render(); });
  OS.on('win:close', () => { if (ui) render(); });
  OS.on('win:title', () => { if (ui && tab === '应用程序') render(); });

  function restartTimer() {
    clearInterval(timer); timer = 0;
    if (speedMs) timer = setInterval(tick, speedMs);
  }
  function tick() {
    if (!ui) return;
    const list = procs();
    sample(list);
    const pf = commit();
    peak = Math.max(peak, pf);
    cpuHis.push(cpuTotal); pfHis.push(pf);
    if (cpuHis.length > 120) { cpuHis.shift(); pfHis.shift(); }
    // 优先级：进程没了，优先级跟着没了
    Object.keys(prio).forEach(k => { if (!list.some(p => p.key === k)) delete prio[k]; });
    render();
    shellWatch();
  }

  function build() {
    const bar = OS.ui.menuBar(L.menus, menuFor, 'tm-mbar');
    const tabs = el('div', { class: 'cp-tabs tm-tabs' }, L.tabs.map(name => {
      const t = el('div', { class: 'cp-tab', text: name });
      t.dataset.name = name;
      t.addEventListener('click', () => { OS.sound.play('click'); showTab(name); });
      return t;
    }));
    const page = el('div', { class: 'tm-page' });
    const status = el('div', { class: 'tm-status' }, [el('span'), el('span'), el('span')]);
    const box = el('div', { class: 'tm' }, [bar, el('div', { class: 'tm-sheet' }, [tabs, page]), status]);
    return { box, tabs, page, status, parts: null };
  }

  function showTab(name) {
    tab = name;
    ui.tabs.querySelectorAll('.cp-tab').forEach(t => t.classList.toggle('on', t.dataset.name === name));
    ui.page.textContent = '';
    ui.parts = ({ 应用程序: pageApps, 进程: pageProcs, 性能: pagePerf, 联网: pageNet, 用户: pageUsers })[name]();
    ui.page.appendChild(ui.parts.node);
    render();
  }
  function render() {
    if (!ui || !ui.parts) return;
    ui.parts.update();
    const st = L.status(procs().length, cpuTotal, commit());
    [...ui.status.children].forEach((s, i) => { s.textContent = st[i]; });
    if (trayEl) trayEl.firstChild.style.height = Math.max(8, cpuTotal) + '%';
  }

  /* ---------- 一张表：表头 + 一行行（点一下选中，长按 / 右键出菜单） ---------- */
  function table(cols, cls) {
    const head = el('div', { class: 'tm-row tm-head' }, cols.map((c, i) => el('span', { class: 'tm-c tm-c' + i, text: c })));
    const rows = el('div', { class: 'tm-rows' });
    const list = el('div', { class: 'tm-list ' + (cls || '') }, [head, rows]);
    OS.ui.scrollable(list);
    return { list, rows };
  }
  function fill(t, items, o) {
    // items: [{ key, cells: [...] }]；o: { sel, pick(key), dbl(key), menu(key) }
    const top = t.list.scrollTop;
    t.rows.textContent = '';
    items.forEach(it => {
      const row = el('div', { class: 'tm-row' + (it.key === o.sel ? ' sel' : '') }, it.cells.map((c, i) => el('span', { class: 'tm-c tm-c' + i, text: c })));
      let last = 0;
      row.addEventListener('click', () => {
        const now = Date.now();
        o.pick(it.key);
        if (o.dbl && now - last < OS.dblMs()) { last = 0; o.dbl(it.key); } else last = now;
      });
      if (o.menu) OS.ui.onContext(row, () => { o.pick(it.key); return o.menu(it.key); });
      t.rows.appendChild(row);
    });
    t.list.scrollTop = top;
  }
  const btn = (label, fn) => { const b = el('button', { class: 'xpbtn tm-btn', text: label }); b.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return b; };

  /* ---------- 应用程序 ---------- */
  function pageApps() {
    const t = table(L.appCols, 'tm-apps');
    const node = el('div', { class: 'tm-pane' }, [t.list, el('div', { class: 'tm-btns' }, [btn(L.endTask, () => endTask(selApp)), btn(L.switchTo, () => switchTo(selApp)), btn(L.newTask, newTask)])]);
    return {
      node,
      update() {
        const wins = listedWins();
        if (selApp && !wins.includes(selApp)) selApp = null;
        fill(t, wins.map(w => ({ key: w, cells: [w.titleText.textContent, isHung(w) ? L.hung : L.running] })), {
          sel: selApp,
          pick: w => { selApp = w; render(); },
          dbl: w => switchTo(w),
          menu: w => [
            { label: L.switchTo, bold: true, action: () => switchTo(w) },
            { label: L.minimize, action: () => OS.wm.minimize(w) },
            { label: L.maximize, disabled: !w.opts.maximizable, action: () => { if (w.minimized) OS.wm.restore(w); if (!w.maximized) OS.wm.toggleMax(w); } },
            '-',
            { label: L.endTask, action: () => endTask(w) },
            { label: L.goProc, action: () => goProc(w) }
          ]
        });
      }
    };
  }
  function switchTo(w) {
    if (!w || w.isClosed) return;
    if (w.minimized) OS.wm.restore(w);
    OS.wm.focus(w);
  }
  function endTask(w) {
    if (!w || w.isClosed) return;
    if (isHung(w)) {
      OS.ui.dialog({ title: L.hungTitle(w.rawTitle.replace(/\s*\(未响应\)\s*/, '')), icon: 'warn', text: L.hungText, buttons: L.hungBtns })
        .then(v => { if (v === L.hungBtns[0] && !w.isClosed) OS.wm.close(w); });
      return;
    }
    OS.wm.requestClose(w);
  }
  function goProc(w) {
    selProc = shellOwned(w) ? 'explorer' : 'app:' + w.appId;
    showTab('进程');
  }

  /* ---------- 进程 ---------- */
  function pageProcs() {
    const t = table(L.procCols, 'tm-procs');
    const chk = el('input', { type: 'checkbox' });
    chk.checked = allUsers;
    chk.addEventListener('change', () => { allUsers = chk.checked; render(); });
    const node = el('div', { class: 'tm-pane' }, [t.list, el('div', { class: 'tm-btns spread' }, [
      el('label', { class: 'tm-chk' }, [chk, el('span', { text: L.allUsers })]),
      btn(L.endProc, () => { const p = procs().find(x => x.key === selProc); if (p) endProc(p); })
    ])]);
    return {
      node,
      update() {
        const list = procs().filter(p => allUsers || p.user === '你');
        if (selProc && !list.some(p => p.key === selProc)) selProc = null;
        fill(t, list.map(p => ({ key: p.key, cells: [p.name, p.user, OS.pad2(Math.min(99, cpuNow[p.key] || 0)), fmtMem(p.mem)] })), {
          sel: selProc,
          pick: k => { selProc = k; render(); },
          menu: k => {
            const p = procs().find(x => x.key === k);
            if (!p) return null;
            const cur = prio[k] || '标准';
            return [
              { label: L.endProc, action: () => endProc(p) },
              '-',
              { label: L.prioMenu, sub: L.prios.map(n => ({ label: n, checked: cur === n, action: () => setPrio(p, n) })) }
            ];
          }
        });
      }
    };
  }
  async function endProc(p) {
    const v = await OS.ui.dialog({ title: L.warnTitle, icon: 'warn', text: L.warn, buttons: ['是', '否'], width: 290 });
    if (v !== '是') return;
    const cant = text => OS.ui.dialog({ title: L.cantTitle, icon: 'error', text });
    switch (p.end) {
      case 'idle': cant(L.idle); return;
      case 'deny': cant(L.denied); return;
      case 'bsod': OS.ui.bsod(BSOD); return;
      case 'svchost': gone.add(p.key); OS.ui.notify({ title: 'svchost.exe', text: L.svchost, icon: 'info', replace: true }); break;
      case 'ctfmon': gone.add(p.key); OS.ui.notify({ title: 'ctfmon.exe', text: L.ctfmon, icon: 'info', replace: true }); break;
      case 'spool': gone.add(p.key); OS.spoolerOff = true; OS.bootFix.add('spooler', SPOOL_FIX); break;
      case 'dl': gone.add(p.key); OS.ticker.skip('暴富秘籍下载进度'); OS.ticker.interrupt(L.richGone); break;
      case 'shell': killShell(); break;
      case 'tm': if (tmWin) tmWin.close(); return;
      case 'sheep': OS.desktop.killSheep(); break;
      case 'qianqian': OS.qianqian.kill(); break;
      case 'koukou': OS.koukou.kill(); break;
      case 'virus': virusBack = Date.now() + 1000; virusN++; setTimeout(() => { if (ui) render(); }, 1100); break;
      case 'app': OS.wm.wins.filter(w => w.appId === p.appId && !w.isClosed).forEach(w => OS.wm.close(w)); break;
    }
    selProc = null;
    tick();
  }
  async function setPrio(p, n) {
    const v = await OS.ui.dialog({ title: L.warnTitle, icon: 'warn', text: L.prioWarn, buttons: ['是', '否'], width: 290 });
    if (v !== '是') return;
    prio[p.key] = n;
    if (p.key === 'sheep') OS.desktop.setSheepSpeed(SHEEP_SPEED[n]);
    if (p.key === 'qianqian') OS.qianqian.setRate(MUSIC_RATE[n]);
    tick();
  }

  /* ---------- explorer.exe ---------- */
  let shellTimer = 0;
  function killShell() {
    OS.desktop.setShell(false);
    OS.wm.wins.filter(w => !w.isClosed && shellOwned(w)).forEach(w => OS.wm.close(w));
    OS.bootFix.add('shell', SHELL_FIX);
  }
  function restoreShell(byItself) {
    clearTimeout(shellTimer); shellTimer = 0;
    if (OS.desktop.shellOn()) return;
    OS.desktop.setShell(true);
    OS.bootFix.remove('shell');
    OS.sound.play('ding');
    if (byItself) OS.ui.notify({ title: 'explorer.exe', text: L.shellBack, icon: 'info', replace: true });
    if (ui) tick();
  }
  // 桌面没了、任务管理器又关了 / 最小化了（没任务栏，叫不回来）：30 秒后桌面自己回来
  function shellWatch() {
    if (OS.desktop.shellOn() || shellTimer || OS.boot.state !== 'desktop') return;
    if (tmWin && !tmWin.isClosed && !tmWin.minimized) return;
    shellTimer = setTimeout(() => { shellTimer = 0; if (OS.boot.state === 'desktop') restoreShell(true); }, SHELL_BACK_MS);
  }
  OS.on('win:minimize', () => shellWatch());

  /* ---------- 性能 ---------- */
  function graph(cls) {
    const cv = el('canvas', { class: 'tm-graph ' + (cls || '') });
    cv.width = 360; cv.height = 120;
    return cv;
  }
  function drawGraph(cv, data, max, color) {
    const g = cv.getContext('2d'), w = cv.width, h = cv.height;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#008040'; g.lineWidth = 1;
    const step = 24, off = (data.length * 6) % step;
    for (let x = w - off; x > 0; x -= step) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke(); }
    for (let y = h; y > 0; y -= step) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke(); }
    g.strokeStyle = color; g.lineWidth = 2;
    g.beginPath();
    data.slice(-Math.ceil(w / 6) - 1).reverse().forEach((v, i) => {
      const x = w - i * 6, y = h - 2 - Math.min(1, v / max) * (h - 4);
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    });
    g.stroke();
  }
  function meter(label) {
    const fillEl = el('div', { class: 'tm-mfill' });
    const num = el('div', { class: 'tm-mnum' });
    const node = el('fieldset', { class: 'tm-box tm-meterbox' }, [el('legend', { text: label }), el('div', { class: 'tm-meter' }, [el('div', { class: 'tm-mbars' }, [fillEl]), num])]);
    return { node, set(p, text) { fillEl.style.height = Math.max(2, Math.min(100, p)) + '%'; num.textContent = text; } };
  }
  function pagePerf() {
    const m1 = meter(L.perf.cpu), m2 = meter(L.perf.pf);
    const g1 = graph(), g2 = graph();
    const nums = L.perfNums.map(([title, rows]) => {
      const vals = rows.map(([n, f]) => { const v = el('span', { class: 'tm-nv' }); return { row: el('div', { class: 'tm-nrow' }, [el('span', { text: n }), v]), v, f }; });
      return { node: el('fieldset', { class: 'tm-box tm-nums' }, [el('legend', { text: title })].concat(vals.map(x => x.row))), vals };
    });
    const node = el('div', { class: 'tm-pane tm-perf' }, [
      el('div', { class: 'tm-prow' }, [m1.node, el('fieldset', { class: 'tm-box tm-grow' }, [el('legend', { text: L.perf.cpuHis }), g1])]),
      el('div', { class: 'tm-prow' }, [m2.node, el('fieldset', { class: 'tm-box tm-grow' }, [el('legend', { text: L.perf.pfHis }), g2])]),
      el('div', { class: 'tm-prow nums' }, nums.map(x => x.node))
    ]);
    return {
      node,
      update() {
        const pf = commit();
        m1.set(cpuTotal, cpuTotal + ' %');
        m2.set(Math.min(100, pf / 1400), Math.round(pf / 1024) + ' MB');
        drawGraph(g1, cpuHis, 100, '#00ff00');
        drawGraph(g2, pfHis, Math.max(140000, peak * 1.2), '#ffff00');
        nums.forEach(x => x.vals.forEach(v => { v.v.textContent = Math.round(v.f()).toLocaleString('en-US'); }));
      }
    };
  }

  /* ---------- 联网 ---------- */
  function pageNet() {
    const g = graph('net');
    const t = table(L.netCols, 'tm-net');
    let dots = 0;
    const node = el('div', { class: 'tm-pane' }, [el('fieldset', { class: 'tm-box tm-netg' }, [el('legend', { text: L.netRow[0] }), g]), t.list]);
    return {
      node,
      update() {
        drawGraph(g, cpuHis.map(() => 0), 100, '#ffff00');
        dots = (dots + 1) % 3;   // 状态一直是“正在拨号……”，省略号一跳一跳
        const row = L.netRow.slice(0, 3).concat([L.netRow[3].replace(/……$/, '') + '……'.slice(0, dots + 1)]);
        fill(t, [{ key: 'net', cells: row }], { sel: null, pick: () => {} });
      }
    };
  }

  /* ---------- 用户 ---------- */
  function pageUsers() {
    const t = table(L.userCols, 'tm-users');
    const act = kind => {
      const u = selUser;
      if (!u) return;
      const lines = L.userSay[u] || {};
      if (u === '你' && kind === 'logoff') { if (tmWin) tmWin.close(); OS.boot.logoff(); return; }
      const text = lines[kind] || lines.all;
      if (text) OS.ui.dialog({ title: NAME, icon: u === '你' ? 'info' : 'warn', text });
    };
    const node = el('div', { class: 'tm-pane' }, [t.list, el('div', { class: 'tm-btns' }, [btn(L.disconnect, () => act('disconnect')), btn(L.logoff, () => act('logoff')), btn(L.sendMsg, () => act('sendMsg'))])]);
    return {
      node,
      update() {
        fill(t, L.users.map(([n, s]) => ({ key: n, cells: [n, s] })), { sel: selUser, pick: k => { selUser = k; render(); } });
      }
    };
  }

  /* ---------- 新任务（运行） ---------- */
  const RUN = { notepad: 'notepad', calc: 'calc', cmd: 'cmd', mspaint: 'paint', pbrush: 'paint', write: 'wordpad', wordpad: 'wordpad', control: 'control', taskmgr: 'taskmgr', iexplore: 'ie' };
  function newTask() {
    const input = el('input', { class: 'tm-ntin', type: 'text' });
    const drop = el('button', { class: 'tm-ntdrop', text: '▼' });
    const ok = el('button', { class: 'xpbtn default', text: L.ok }), cancel = el('button', { class: 'xpbtn', text: L.cancel }), browse = el('button', { class: 'xpbtn', text: L.browse });
    const content = el('div', { class: 'dlg tm-nt' }, [
      el('div', { class: 'dlg-main' }, [OS.iconEl('exe', 'dlg-icon'), el('div', { class: 'dlg-text', text: L.ntText })]),
      el('div', { class: 'tm-ntrow' }, [el('span', { text: L.ntLabel }), el('div', { class: 'tm-ntbox' }, [input, drop])]),
      el('div', { class: 'dlg-btns' }, [ok, cancel, browse])
    ]);
    const w = OS.wm.open({ title: L.ntTitle, width: 290, content, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
    drop.addEventListener('click', e => {
      e.stopPropagation(); OS.sound.play('click');
      const r = OS.stage.rectOf(input.parentNode);
      OS.ui.contextMenu(L.ntHistory.map(h => ({ label: h, action: () => { input.value = h; } })), r.left, r.bottom);
    });
    const go = () => {
      const raw = input.value.trim();
      if (!raw) { OS.sound.play('ding'); return; }
      w.close();
      run(raw);
    };
    ok.addEventListener('click', () => { OS.sound.play('click'); go(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    cancel.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    browse.addEventListener('click', () => { OS.sound.play('click'); OS.ui.dialog({ title: L.ntTitle, icon: 'info', text: L.ntBrowse }); });
    setTimeout(() => { try { input.focus(); } catch (_) { /* ignore */ } }, 50);
  }
  function run(raw) {
    const cmd = raw.toLowerCase().replace(/\.exe$/, '');
    if (L.ntSpecial[raw]) { OS.ui.dialog({ title: raw, icon: 'error', text: L.notFound(raw) + '\n' + L.ntSpecial[raw] }); return; }
    if (cmd === 'explorer') { if (!OS.desktop.shellOn()) restoreShell(false); else OS.apps.open('mydocs'); return; }
    if (RUN[cmd]) { OS.apps.open(RUN[cmd]); return; }
    OS.ui.dialog({ title: raw, icon: 'error', text: L.notFound(raw) });
  }

  /* ---------- 菜单 ---------- */
  function menuFor(name) {
    if (name === '文件(F)') return [
      { label: L.fileMenu.newTask, action: newTask },
      '-',
      { label: L.fileMenu.exit, action: () => tmWin && tmWin.close() }
    ];
    if (name === '选项(O)') return [{ label: L.front, checked: front, action: () => { front = !front; if (tmWin) { tmWin.opts.topmost = front; OS.wm.focus(tmWin); } } }];
    if (name === '查看(V)') return [
      { label: L.refresh, action: tick },
      { label: L.speed, sub: L.speeds.map(([n, ms]) => ({ label: n, checked: speedMs === ms, action: () => { speedMs = ms; restartTimer(); } })) }
    ];
    if (name === '关机(U)') return [
      { label: L.shut[0], action: () => OS.boot.standby() },
      { label: L.shut[1], action: () => OS.boot.standby({ text: L.hibernate, onWake: () => setTimeout(() => OS.ui.notify({ title: L.hibTitle, text: L.hibWake, icon: 'info' }), 600) }) },
      { label: L.shut[2], action: () => OS.boot.turnOff() },
      { label: L.shut[3], action: () => OS.boot.restart() },
      '-',
      { label: L.shut[4], action: () => OS.boot.logoff() }
    ];
    if (name === '帮助(H)') return [
      { label: L.helpTopics, action: say(NAME, 'help', L.helpText) },
      '-',
      { label: L.about, action: say(L.about, 'info', L.aboutText) }
    ];
    return null;
  }
})();
