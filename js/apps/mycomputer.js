/* 我的电脑（桌面 + 开始菜单右栏）：真能一层层点进去
   - 三组：存储在这台计算机上的文件（共享文档、你的文档）／ 硬盘（本地磁盘 C:）／ 有可移动存储的设备（软盘 A:、光驱 D:）
   - A: 没有软盘，越重试越不耐烦；C: 里 Documents and Settings、Program Files、WINDOWS 都能进；
     WINDOWS\Minidump 里是你收集到的蓝屏；system32 里删“很重要.dll”问五次后蓝屏 IMPORTANT_DLL_DELETED
   - D: 是一张《幻觉游戏 V3.0》：自动运行菜单、安装向导、弹出后伸出光驱托盘（能放可乐）
   - 共享文档：邻居借地方放的东西（网上邻居里的“你”就是这里）
   - 以后主线：A 盘插软盘、D 盘换光盘、管理员文件夹要密码、Program Files 里装新工具，都只是往 fs 的清单上加一行 */
(function () {
  'use strict';
  const el = OS.el;
  const FS = OS.fs, EX = OS.explorer;
  const app = OS.apps.byId.mycomputer;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });
  const ME = FS.ME, C = 'C:', W = 'C:\\WINDOWS', PF = 'C:\\Program Files';

  /* ================= 文案 ================= */
  const L = {
    groups: ['存储在这台计算机上的文件', '硬盘', '有可移动存储的设备'],
    sysTasks: '系统任务', others: '其他位置',
    tasks: ['查看系统信息', '添加/删除程序', '更改一个设置'],
    places: ['网上邻居', '我的文档', '共享文档', '控制面板'],
    floppy: ['驱动器中没有软盘。\n请在驱动器 A: 中插入软盘。', '驱动器中没有软盘。\n请在驱动器 A: 中插入软盘。', '还是没有。\n软盘不会自己长出来。', '还是没有。\n软盘不会自己长出来。',
      '别咔了，软驱都快咔出火星了。', '别咔了，软驱都快咔出火星了。', '别咔了，软驱都快咔出火星了。', '软驱已罢工。\n它说它在 2003 年以后就没见过软盘了。'],
    floppyFormat: '没有软盘，格式化了个寂寞。',
    cPie: '已用空间里，2027暴富秘籍.rar 占了 2.7 GB。',
    noAdmin: '拒绝访问。\n管理员已经跑路了，钥匙也带走了。',
    noGuest: '访客账户已停用，\n因为没有人来看你。',
    winGate: '这些文件是隐藏的。\n此文件夹包含保持系统正常工作的文件，您不应该修改其内容。',
    winGateBtns: ['显示此文件夹的内容', '取消'],
    sysNoDelete: '删不掉：这个文件正在被很重要.dll 使用。',
    dllAsk: ['确实要删除"很重要.dll"吗？', '它真的很重要。', '真的真的很重要。', '你删了它，就再也没有重要的东西了。', '好吧。最后问一次：确定吗？'],
    tempClean: '清理完毕，共释放 0 字节。',
    noBsod: '这次蓝屏太久远，记录已经找不到了。',
    cdRo: '删不掉：光盘是只读的。\n想删可以拿指甲刮。',
    cdRoSave: '保存失败：光盘是只读的。',
    sysRoSave: '保存失败：这是系统文件，别改。',
    pfRoSave: '保存失败：说明书是厂家写的，你改不了。',
    noDisc: '请将光盘插入驱动器 D:。',
    needDisc: '请插入幻觉游戏 V3.0 光盘。',
    trayCup: '托盘承重测试通过。\n杯架功能已启用。',
    trayStuck: '关不上：托盘上放着一杯可乐。\n先把杯子拿走。',
    trayFix: '正在把光驱托盘推回去',
    hjTitle: '幻觉游戏 V3.0', hjSub: '六合一超值珍藏版',
    hjBtns: ['运行游戏', '安装游戏', '浏览光盘', '退出'],
    hjWizard: ['欢迎使用幻觉游戏 V3.0 安装向导。', '请选择安装位置：\nC:\\Program Files\\幻觉游戏'],
    hjCopying: '正在复制文件……',
    hjDone: '安装完成。\n请把光盘留在光驱里，拿出来就玩不了了。',
    hjAgain: '已经装过了。\n再装一遍也不会多出一个游戏。',
    shared: '共享文档',
    movie: '下载到 99% 卡住了……',
    stickyShared: '别动我东西！！'
  };
  // 光盘里的 6 个游戏（先占位：转 3 秒弹“施工中”；以后一个个做）
  const GAMES = [
    { id: 'zhuma', name: '蛛玛' }, { id: 'miner', name: '五金矿工' }, { id: 'tank', name: '怪怪水煮箱' },
    { id: 'tea', name: '大家来找茶' }, { id: 'sticky', name: '黏黏看' }, { id: 'stone', name: '结石迷阵' }
  ];
  /* ================= 光驱状态 ================= */
  const installed = () => !!OS.save.get('hjInstalled', false);
  let discOut = false, cup = false, tray = null;
  OS.on('desktop:reset', () => { discOut = false; cup = false; if (tray) { tray.remove(); tray = null; } floppyTries = 0; winOk = false; });

  /* ================= 我的电脑本身 ================= */
  app.open = () => EX.open(FS.ROOT, { appId: app.id });
  EX.setGroups(FS.ROOT, () => [
    { title: L.groups[0], nodes: [Object.assign({}, FS.get(FS.SHARED), { label: L.shared }), Object.assign({}, FS.get(FS.MYDOCS), { label: '你的文档' })] },
    { title: L.groups[1], nodes: [FS.get('C:')] },
    { title: L.groups[2], nodes: [FS.get('A:'), FS.get('D:')] }
  ]);
  EX.setTasks(FS.ROOT, ctx => [
    { title: L.sysTasks, links: [[L.tasks[0], OS.menus.systemProps], [L.tasks[1], () => OS.addRemove()], [L.tasks[2], () => OS.apps.open('control')]] },
    { title: L.others, links: [[L.places[0], () => OS.apps.open('network')], [L.places[1], () => ctx.go(FS.MYDOCS)], [L.places[2], () => ctx.go(FS.SHARED)], [L.places[3], () => OS.apps.open('control')]] }
  ]);

  /* ================= A: 软盘 ================= */
  let floppyTries = 0;
  FS.add('A:', {
    kind: 'drive', icon: 'floppy', label: '3.5 软盘 (A:)', typeName: '3.5 英寸软盘', detail: () => '3.5 英寸软盘\n里面是空的',
    open: () => floppy(),
    noDelete: '删不掉：软驱是焊在电脑上的。', noRename: '重命名失败：软驱不配有名字。', noCopy: '复制失败：软驱里没有东西可以复制。', noCut: L.noCut,
    menu: (n, ctx, base) => [base[0], '-', { label: '格式化…', action: say('格式化 3.5 软盘 (A:)', 'info', L.floppyFormat) }, '-', base[base.length - 1]],
    props: say('3.5 软盘 (A:) 属性', 'info', '类型：3.5 英寸软盘\n容量：1.44 MB\n状态：没有软盘')
  });
  function floppy() {
    OS.sound.play('floppy');
    setTimeout(() => {
      const text = L.floppy[Math.min(floppyTries, L.floppy.length - 1)];
      floppyTries++;
      OS.ui.dialog({ title: '3.5 软盘 (A:)', icon: 'warn', text, buttons: ['重试', '取消'] }).then(v => { if (v === '重试') floppy(); });
    }, 700);
  }

  /* ================= C: 本地磁盘 ================= */
  FS.add('C:', {
    kind: 'drive', icon: 'hdd', label: '本地磁盘 (C:)', typeName: '本地磁盘', detail: () => '本地磁盘\n可用空间：14.0 GB\n总大小：37.2 GB',
    status: () => '可用空间：14.0 GB　总大小：37.2 GB',
    noDelete: '删不掉：删了 C 盘，你就什么都没有了。', noRename: '重命名失败：C 盘就叫 C 盘。', noCut: '剪切失败：硬盘是拧在机箱里的。',
    menu: (n, ctx, base) => [base[0], '-', { label: '格式化…', action: say('格式化 本地磁盘 (C:)', 'error', '格式化失败：系统正坐在 C 盘上。\n想格式化，去命令提示符试试。') }, '-', base[base.length - 1]],
    props: () => cPie()
  });
  // C 盘属性：XP 那个蓝紫色大饼图
  function cPie() {
    const pie = '<svg viewBox="0 0 120 70"><ellipse cx="60" cy="40" rx="54" ry="22" fill="#5a3fa8"/><ellipse cx="60" cy="34" rx="54" ry="22" fill="#d742d1"/>' +
      '<path d="M60 34 L60 12 A54 22 0 1 1 9.5 41.5 Z" fill="#2f5fe0"/><path d="M60 34 L60 12 A54 22 0 1 1 9.5 41.5" fill="none" stroke="#1c3ea8" stroke-width=".6"/></svg>';
    const row = (sw, k, a, b) => el('div', { class: 'fx-pie-row' }, [el('i', { class: 'fx-sw', style: { background: sw } }), el('span', { class: 'fx-pie-k', text: k }), el('span', { text: a }), el('span', { class: 'fx-pie-g', text: b })]);
    const content = el('div', { class: 'fx-pie' }, [
      el('div', { class: 'fx-pie-top' }, [OS.iconEl('computer', 'fx-pie-ico'), el('div', {}, [el('b', { text: '本地磁盘 (C:)' }), el('div', { text: '文件系统：NTFS' })])]),
      row('#2f5fe0', '已用空间：', '24,910,877,184 字节', '23.2 GB'),
      row('#d742d1', '可用空间：', '15,032,385,536 字节', '14.0 GB'),
      row('', '容量：', '39,943,262,720 字节', '37.2 GB'),
      el('div', { class: 'fx-pie-svg', html: pie }),
      el('div', { class: 'fx-pie-note', text: L.cPie })
    ]);
    const ok = el('button', { class: 'xpbtn default', text: '确定' });
    const clean = el('button', { class: 'xpbtn', text: '磁盘清理' });   // 跟 XP 一样，饼图旁边能直接开磁盘清理（cleanup.js）
    content.appendChild(el('div', { class: 'dlg-btns' }, [clean, ok]));
    const w = OS.wm.open({ title: '本地磁盘 (C:) 属性', icon: 'hdd', width: 300, content, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
    ok.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    clean.addEventListener('click', () => { OS.sound.play('click'); w.close(); if (OS.cleanup) OS.cleanup.open(); });
  }
  ['Documents and Settings', 'Program Files', 'WINDOWS'].forEach(n => FS.add(C + '\\' + n, { kind: 'folder', noDelete: '删不掉：这是系统的文件夹。' }));
  FS.add(C + '\\boot.ini', { hidden: true, roMsg: L.sysRoSave, noDelete: '删不掉：删了就开不了机了。',
    text: '[boot loader]\ntimeout=30\ndefault=multi(0)disk(0)rdisk(0)partition(1)\\WINDOWS\n[operating systems]\nmulti(0)disk(0)rdisk(0)partition(1)\\WINDOWS="Windoesn\'t XP 无聊版"\n\n别改。改了就开不了机了。' });
  FS.add(C + '\\pagefile.sys', { hidden: true, size: '1,572,864 KB', noDelete: '删不掉：这是电脑的草稿纸，它正在用。', cantOpen: '打不开：这是电脑的草稿纸，你看不懂。' });

  /* ---------- Documents and Settings ---------- */
  const DS = C + '\\Documents and Settings';
  FS.add(ME, { kind: 'folder', noDelete: '删不掉：这是你自己。' });
  FS.add(DS + '\\管理员', { kind: 'folder', gate: () => OS.ui.dialog({ title: '管理员', icon: 'error', text: L.noAdmin }), noDelete: '删不掉：管理员跑路了，但他的东西还在。' });
  FS.add(DS + '\\Guest', { kind: 'folder', gate: () => OS.ui.dialog({ title: 'Guest', icon: 'info', text: L.noGuest }) });
  FS.add(DS + '\\All Users', { kind: 'folder' });
  FS.add(FS.SHARED, { kind: 'folder', label: L.shared, icon: 'share', writable: true, noDelete: '删不掉：这是全楼共用的。' });
  // 桌面：跟真桌面上的东西一样（桌面图标是快捷方式）
  FS.add(FS.DESKTOP, { kind: 'folder', label: '桌面', icon: 'computer', noDelete: '删不掉：删了桌面你放哪？' });
  FS.provide(FS.DESKTOP, () => {
    const out = [];
    const root = OS.desktop && OS.desktop.root();
    if (!root) return out;
    root.querySelectorAll('.dicon:not(.binned)').forEach(n => {
      const id = n.getAttribute('data-app'), a = OS.apps.byId[id];
      if (!a || ['mycomputer', 'network', 'recycle', 'mydocs', 'ie', 'folder2'].indexOf(id) >= 0) return;   // 系统图标不算；新建文件夹(2) 是真文件夹，folder2.js 自己登记
      const isFile = /^file-/.test(id);
      out.push({ path: FS.DESKTOP + '\\' + a.name + (isFile ? '' : '.lnk'), name: a.name + (isFile ? '' : '.lnk'), label: a.name, kind: isFile ? 'txt' : 'lnk', icon: a.icon, folder: false,
        open: () => OS.desktop.openIcon(id), app: isFile ? null : OS.desktop.targetOf(id), noDelete: '要删桌面上的东西，去桌面删。', noRename: '要改名，去桌面改。', noCopy: '复制失败：桌面上的东西舍不得离开桌面。' });
    });
    return out;
  });
  FS.add(ME + '\\收藏夹', { kind: 'folder' });
  // 双击 = Internot Explorer 打开这一页（ie.js）；自己在浏览器里"添加到收藏夹"的也放这儿
  [['拾度一下.url', 'www.shidu.com'], ['幸福小区业主论坛.url', 'bbs.xingfu3.zz']].forEach(([n, u]) =>
    FS.add(ME + '\\收藏夹\\' + n, { kind: 'url', url: u, text: '[InternetShortcut]\nURL=http://' + u + '/\n', open: () => (OS.ie ? OS.ie.open(u) : OS.apps.open('ie')), detail: () => 'Internet 快捷方式\nhttp://' + u + '/' }));
  FS.add(ME + '\\开始菜单', { kind: 'folder' });
  [['命令提示符.lnk', 'cmd'], ['记事本.lnk', 'notepad'], ['千千不听.lnk', 'qianqian'], ['网上邻居.lnk', 'network']].forEach(([n, id]) =>
    FS.add(ME + '\\开始菜单\\' + n, { kind: 'lnk', icon: OS.apps.byId[id] ? OS.apps.byId[id].icon : 'exe', app: id, when: () => !OS.soft || OS.soft.appOk(id) }));

  /* ---------- Program Files：每个软件一个文件夹，一个 .exe + 一个说明.txt ---------- */
  const prog = (folder, exes, readme, extra) => {
    FS.add(PF + '\\' + folder, { kind: 'folder', noDelete: '删不掉：要卸载软件，去 添加/删除程序。' });
    // 卸掉了（addremove.js）：exe、说明都不显示，文件夹空着留下（那几年卸载都删不干净）
    const ok = id => () => !OS.soft || OS.soft.present(id);
    const any = () => exes.some(([, id]) => ok(id)());
    exes.forEach(([n, id]) => FS.add(PF + '\\' + folder + '\\' + n, { kind: 'exe', icon: OS.apps.byId[id] ? OS.apps.byId[id].icon : 'exe', app: id, when: ok(id), noDelete: '删不掉：要卸载软件，去 添加/删除程序。' }));
    FS.add(PF + '\\' + folder + '\\说明.txt', { text: readme, roMsg: L.pfRoSave, when: any, noDelete: '删不掉：说明书是厂家的。' });
    (extra || []).forEach(([n, o]) => FS.add(PF + '\\' + folder + '\\' + n, o));
  };
  prog('抠抠软件', [['抠抠2003.exe', 'koukou']], '抠抠2003 使用说明\n\n1. 双击铁公鸡登录。\n2. 好友找你，你就回。\n3. 好友不找你，你也可以找好友，但他不一定回。\n\n抠抠很抠，不送抠币。',
    [['聊天记录备份.dat', { hidden: true, cantOpen: '为了防止您侵犯您的个人隐私权，\n这个备份也被清空了。' }]]);
  prog('千千不听', [['千千不听.exe', 'qianqian']], '千千不听 使用说明\n\n点播放就放，点暂停就停。\n名字叫不听，其实很听话。');
  prog('ABCSee', [['ABCSee.exe', 'abcsee']], 'ABCSee 大眼看图 V3.1 使用说明\n\n双击图片就能看。\n共享版，试用期 30 天，过了也能用。');
  prog('无聊科技', [['开机检测器 Pro.exe', 'bootcheck'], ['阳寿余额查询.exe', 'lifespan'], ['赛博把脉.exe', 'pulse'], ['弹窗杀手.exe', 'swatter'], ['电子蚊香.exe', 'coil'], ["Windoesn't 激活器.exe", 'activator'], ['一键还原小精灵.exe', 'restore']],
    "Windoesn't 自带小程序 说明\n\n这些小程序是系统送的。\n送的东西不要挑。\n\n无聊科技　出品");
  prog('Offense 2003', [['WORDY.EXE', 'wordy'], ['EXCUSE.EXE', 'excuse'], ['POWERPOINTLESS.EXE', 'ppt']], 'Offense 2003 使用说明\n\nWordy 写文章，Excuse 做表格，\nPowerPointless 做幻灯片。\n\nExcuse 专为要账设计。\n算出来的利息仅供吓唬，不具法律效力。');
  prog('解压专家 2003', [['解压专家.exe', 'rich']], '解压专家 2003 使用说明\n\n本软件为 40 天试用版。\n试用期已经过了 40 天。');
  prog('Internot Explorer', [['iexplore.exe', 'ie']], 'Internot Explorer 使用说明\n\n56K 上网，请耐心。\n家里有人打电话时请勿上网。');
  prog('Outluck Excess', [['outluck.exe', 'mail']], 'Outluck Excess 使用说明\n\n收件箱里有 0 封新邮件。\n以后也不一定有。');
  // 2026-11-24 解放桌面：快捷方式 ▸ 属性 ▸ 查找目标要找得到它们
  prog('慢播', [['慢播.exe', 'manbo']], '慢播 使用说明\n\n电脑里的 .rmvb .avi 都用它放。\n缓冲到 99% 是正常现象，请耐心。');
  prog('超级秃子', [['超级秃子.exe', 'baldy']], '超级秃子魔法设置 2003 使用说明\n\n魔法设置：让电脑更快、更稳。\n清理王：清理垃圾，顺便清理头发。');
  prog('瑞鑫杀毒', [['瑞鑫杀毒.exe', 'ruixin']], '瑞鑫杀毒软件 2003 使用说明\n\n豹哥守护你的电脑。\n病毒库每天升级，升不升得动看网速。');
  FS.add(PF + '\\幻觉游戏', { kind: 'folder', when: () => installed() || (OS.soft && OS.soft.got('hj')), noDelete: '删不掉：要卸载软件，去 添加/删除程序。' });
  GAMES.forEach(g => FS.add(PF + '\\幻觉游戏\\' + g.name + '.exe', { kind: 'exe', icon: 'game-' + g.id, when: installed, open: () => runGame(g) }));
  FS.add(PF + '\\幻觉游戏\\卸载.exe', { kind: 'exe', when: installed, open: () => OS.soft && OS.soft.uninstall('hj') });

  /* ---------- WINDOWS ---------- */
  let winOk = false;   // 这次开机点过“显示此文件夹的内容”就不再拦
  const winGate = (n, ctx, go) => {
    if (winOk) { go(); return; }
    OS.ui.dialog({ title: 'WINDOWS', icon: 'warn', text: L.winGate, buttons: L.winGateBtns, width: 320 }).then(v => { if (v === L.winGateBtns[0]) { winOk = true; go(); } });
  };
  FS.get(W).gate = winGate;
  FS.get(W).noDelete = '删不掉：删了 WINDOWS，就只剩 DOESN\'T 了。';
  ['system32', 'Minidump', 'Fonts', 'Temp', 'Web'].forEach(n => FS.add(W + '\\' + n, { kind: 'folder', noDelete: '删不掉：这是系统的文件夹。' }));
  FS.add(W + '\\Web\\Wallpaper', { kind: 'folder' });
  // system32：跟命令提示符 dir 出来的一样
  ((OS.cmd && OS.cmd.SYS32) || ['很重要.dll']).forEach((n, i) => {
    const vip = n === '很重要.dll';
    FS.add(W + '\\system32\\' + n, { size: (60 + i * 7) + ' KB', noRename: '重命名失败：改了名字系统就找不到它了。', noCut: L.sysNoDelete,
      cantOpen: '打不开：这个文件只有电脑看得懂。', del: vip ? delVip : null, noDelete: vip ? null : L.sysNoDelete });
  });
  // 系统自带的程序：快捷方式 ▸ 属性 ▸ 查找目标找得到它们（2026-11-24 解放桌面）
  [['记事本.exe', 'notepad'], ['写字板.exe', 'wordpad'], ['画图 AI版.exe', 'paint'], ['计算器.exe', 'calc'], ['命令提示符.exe', 'cmd'], ['控制面板.exe', 'control'], ['任务管理器.exe', 'taskmgr'],
    ['排雷.exe', 'sweep'], ['接牌.exe', 'solitaire'], ['空当算24.exe', 'freecell'], ['蜘蛛合牌.exe', 'spider'], ['黑心大战.exe', 'hearts'], ['二维弹球.exe', 'pinball']].forEach(([n, id]) => {
    if (!OS.apps.byId[id]) return;
    FS.add(W + '\\system32\\' + n, { kind: 'exe', icon: OS.apps.byId[id].icon, app: id, when: () => !OS.soft || OS.soft.present(id), noDelete: L.sysNoDelete, noRename: '重命名失败：改了名字系统就找不到它了。', noCut: L.sysNoDelete });
  });
  // 删很重要.dll：一路问五次，然后蓝屏
  function delVip() {
    let i = 0;
    const ask = () => {
      if (i >= L.dllAsk.length) { OS.ui.bsod({ id: 'mycomputer', name: 'IMPORTANT_DLL_DELETED', text: '你删了很重要.dll，现在什么都不重要了。' }); return; }
      OS.ui.dialog({ title: '确认删除文件', icon: 'warn', text: L.dllAsk[i], buttons: ['是', '否'] }).then(v => { if (v === '是') { i++; ask(); } });
    };
    ask();
  }
  // 以前的存档只记了蓝过哪几个，没记名字：照这张表补上（以后新加蓝屏，ui.js 会自己记）
  const KNOWN_BSOD = {
    control: ['Y2K_BUG', '千年虫从 1999 年爬过来了。'],
    abcsee: ['KEYGEN_DETECTED', '注册机里自带的病毒先把系统干掉了。'],
    abcvirus: ['SYSTEM_TAKEN_OVER', '病毒住得太舒服，把你的电脑当成自己家了。'],
    paint: ['PAINT_SPILLED', '油漆洒出来了，把显示器糊住了。'],
    logo: ['TRADEMARK_SELF_DEFENSE', '为了防止您侵权被告，系统已经蓝屏自保。'],
    activator: ['BUTTON_BLOCKED_YOU', '该按钮已将你拉黑，并顺手拔了你家网线。'],
    bootcheck: ['DETECTOR_EXISTENTIAL_CRISIS', '检测器发现自己错了，无法接受，已自行关机。'],
    cmd: ['FORMAT_C_WHILE_SITTING_ON_C', '你在 C 盘上格式化 C 盘，相当于坐在树枝上锯这根树枝。'],
    coil: ['SYSTEM_FAINTED', '电脑抽蚊香抽嗨了。'],
    debt: ['DEBT_OVERFLOW', '欠款金额超出了 Excuse 能表示的最大数字，建议直接绝交。'],
    folder2: ['NEIGHBOR_COMPLAINT', '邻居投诉你一直敲门，物业已把本系统拉闸。'],
    koukou: ['GROUP_SHAKE_COLLAPSE', '全班同时发送窗口抖动，系统被抖散架了。'],
    lifespan: ['OUT_OF_LIVES', '你在一次查询里逆天改命了 5 次，系统的命先用完了。'],
    mycomputer: ['IMPORTANT_DLL_DELETED', '你删了很重要.dll，现在什么都不重要了。'],
    mydocs: ['PATH_TOO_LONG', '路径太长了，系统迷路了。'],
    network: ['IP_ADDRESS_CONFLICT', '网上出现了另一个你，你们俩只能留一个。'],
    notepad: ['COPY_PASTE_OVERFLOW', '我倒，你居然用记事本把你家不奔腾搞冒烟了！弓虽！'],
    pulse: ['PRINTER_ON_FIRE', '打印机着火了。建议用刚打印的诊断单灭火。'],
    qianqian: ['SUBWOOFER_OVERLOAD', '低音炮太猛，把不奔腾从主板上震下来了。'],
    recycle: ['RECYCLE_BIN_EXPLODED', '回收站被撑爆了。清洁工正在打扫，请重启后再试。'],
    rich: ['MONITOR_WORK_INJURY', '检测到显像管被连续拍打 5 次。大屁股显示器已申请工伤。'],
    swatter: ['POPUP_OVERFLOW', '你的不奔腾都要冒烟了，电脑烫得可以煎鸡蛋。'],
    test: ['TEST_BLUE_SCREEN_OF_NOTHING', '这是测试蓝屏。'],
    wordpad: ['FONT_TOO_BIG', '一个字太大，把屏幕撑破了。']
  };
  // Minidump：收集到的蓝屏，一个一个 .dmp
  FS.provide(W + '\\Minidump', () => {
    const info = OS.save.get('bsodInfo', {});
    return OS.save.get('bsods', []).map(id => {
      const k = KNOWN_BSOD[id] || [];
      const b = Object.assign({ name: k[0], text: k[1] }, info[id] || {});
      const name = (b.name || id.toUpperCase()) + '.dmp';
      const text = '蓝屏名字：' + (b.name || id.toUpperCase()) + '\n' + (b.text ? '专属一句：' + b.text + '\n' : L.noBsod + '\n') + '发生时间：' + FS.dateText(b.at) + '\n\n*** STOP: 0x' + (b.code || '00000000');
      return { path: W + '\\Minidump\\' + name, name, kind: 'dmp', icon: 'txt', folder: false, text, date: b.at, roMsg: L.sysRoSave, noDelete: '删不掉：蓝屏是你的光荣历史。', noRename: L.sysNoDelete };
    });
  });
  // Fonts：记事本的三个字体
  const FONT_SAMPLE = { '宋体.ttf': ['你好，世界。我的世界，你不懂。', 'SimSun, "宋体", serif'], '黑体.ttf': ['你好，世界。我的世界，你不懂。', 'SimHei, "黑体", sans-serif'], '火星文.ttf': ['伱恏，迣堺。莪哋卋堺，伱鈈慬。', 'SimSun, "宋体", serif'] };
  Object.keys(FONT_SAMPLE).forEach(n => FS.add(W + '\\Fonts\\' + n, { kind: 'ttf', icon: 'doc', noDelete: '删不掉：删了字，记事本就只能画画了。',
    open: () => { const [s, f] = FONT_SAMPLE[n]; OS.ui.dialog({ title: n.replace('.ttf', '') + '（字体预览）', icon: null, text: s + '\n\n' + 'ABCDEFG 1234567', width: 280 }).then(() => {}); const w = OS.wm.wins[OS.wm.wins.length - 1]; if (w) { const t = w.el.querySelector('.dlg-text'); if (t) { t.style.fontFamily = f; t.style.fontSize = '15px'; } } } }));
  // Temp：一堆临时文件，删了也释放 0 字节
  for (let i = 1; i <= 8; i++) FS.add(W + '\\Temp\\~tmp000' + i + '.tmp', { kind: 'tmp', size: '0 KB', del: say('删除', 'info', L.tempClean), text: '' });
  // 壁纸：就是现在的桌面，羊在不在跟桌面一样
  FS.add(W + '\\Web\\Wallpaper\\草坡和羊.bmp', { kind: 'bmp', picSize: [240, 135], noDelete: '删不掉：桌面还在用它。', draw: drawWallpaper });
  // 就是把现在的桌面画下来（Codex 画的壁纸、云、木牌、羊；desktop.js）
  function drawWallpaper(g, w, h) { OS.desktop.drawScene(g, w, h); }

  /* ================= D: 幻觉游戏 V3.0 ================= */
  FS.add('D:', {
    kind: 'drive', icon: 'cd', typeName: 'CD 驱动器',
    detail: () => (discOut ? 'CD 驱动器\n里面没有光盘' : 'CD 驱动器\n光盘：幻觉游戏 V3.0\n可用空间：0 字节'),
    gate: (n, ctx, go) => { if (discOut) OS.ui.dialog({ title: 'CD 驱动器 (D:)', icon: 'warn', text: L.noDisc }); else go(); },
    open: (n, ctx) => { if (discOut) { OS.ui.dialog({ title: 'CD 驱动器 (D:)', icon: 'warn', text: L.noDisc }); return; } spin(2000, () => autorun(ctx)); },
    noDelete: L.cdRo, noRename: '重命名失败：光盘的名字是印上去的。', noCut: L.cdRo, noCopy: '复制失败：这张盘有防拷贝。\n说是有，其实是你的光驱太慢了。',
    menu: (n, ctx, base) => [
      { label: '自动播放', bold: true, action: () => n.open(n, ctx) },
      { label: '打开', action: () => { if (discOut) OS.ui.dialog({ title: 'CD 驱动器 (D:)', icon: 'warn', text: L.noDisc }); else ctx.go('D:'); } },
      '-',
      discOut ? { label: '关闭', action: closeTray } : { label: '弹出', action: eject },
      '-',
      base[base.length - 1]
    ],
    props: () => OS.ui.dialog({ title: 'CD 驱动器 (D:) 属性', icon: 'info', text: discOut ? '类型：CD 驱动器\n状态：托盘是开着的' : '类型：CD 驱动器\n光盘：幻觉游戏 V3.0\n容量：650 MB\n可用空间：0 字节' })
  });
  // 光盘拿出来以后名字跟着变（清单里存的是固定值，这里改成现算）
  Object.defineProperty(FS.get('D:'), 'label', { configurable: true, get: () => (discOut ? 'CD 驱动器 (D:)' : '幻觉游戏 V3.0 (D:)') });
  const cdFile = o => Object.assign({ noDelete: L.cdRo, noRename: L.cdRo, noCut: L.cdRo, roMsg: L.cdRoSave }, o);
  FS.add('D:\\AUTORUN.INF', cdFile({ kind: 'inf', text: '[autorun]\nopen=安装.exe\nicon=幻觉.ico\nlabel=幻觉游戏 V3.0' }));
  FS.add('D:\\安装.exe', cdFile({ kind: 'exe', icon: 'cd', open: () => install() }));
  FS.add('D:\\说明.txt', cdFile({ text: '幻觉游戏 V3.0 六合一超值珍藏版\n\n本光盘收录 6 款经典休闲游戏，老少皆宜，上班必备。\n\n如遇无法运行，请把光盘擦一擦再试。\n如还是无法运行，请再擦一擦。\n\n本店地址：电脑城二楼拐角，招牌被挡住的那家。' }));
  GAMES.forEach(g => {
    FS.add('D:\\' + g.name, cdFile({ kind: 'folder' }));
    FS.add('D:\\' + g.name + '\\' + g.name + '.exe', cdFile({ kind: 'exe', icon: 'game-' + g.id, open: () => runGame(g) }));
  });
  // 光驱转起来
  function spin(ms, then) { OS.sound.play('cdSpin'); setTimeout(then, ms); }
  // 玩游戏：先转 3 秒，再弹“施工中”（以后一个个做）
  function runGame(g) {
    if (discOut) { OS.ui.dialog({ title: g.name, icon: 'warn', text: L.needDisc }); return; }
    spin(3000, () => OS.apps.placeholder({ name: g.name, icon: 'game-' + g.id }));
  }
  // 光盘的“自动运行”菜单（背景是 Codex 画的 assets/cd/autorun.webp）
  function autorun() {
    const btns = L.hjBtns.map(t => el('button', { class: 'hj-btn', text: t }));
    const games = el('div', { class: 'hj-games' }, GAMES.map(g => {
      const b = el('div', { class: 'hj-game' }, [OS.iconEl('game-' + g.id, 'hj-gico'), el('div', { text: g.name })]);
      b.addEventListener('click', () => { OS.sound.play('click'); runGame(g); });
      return b;
    }));
    const content = el('div', { class: 'hj' }, [
      el('div', { class: 'hj-head' }, [el('div', { class: 'hj-title', text: L.hjTitle }), el('div', { class: 'hj-sub', text: L.hjSub })]),
      el('div', { class: 'hj-menu' }, btns),
      games
    ]);
    const w = OS.wm.open({ title: L.hjTitle, icon: 'cd', width: 320, content, maximizable: false, center: true, className: 'hj-win' });
    btns[0].addEventListener('click', () => { OS.sound.play('click'); content.classList.toggle('show-games'); });
    btns[1].addEventListener('click', () => { OS.sound.play('click'); install(); });
    btns[2].addEventListener('click', () => { OS.sound.play('click'); w.close(); EX.open('D:'); });
    btns[3].addEventListener('click', () => { OS.sound.play('click'); w.close(); });
  }
  // 安装向导：一路下一步，复制文件有进度条
  function install() {
    if (discOut) { OS.ui.dialog({ title: '安装', icon: 'warn', text: L.needDisc }); return; }
    if (installed()) { OS.ui.dialog({ title: '幻觉游戏 V3.0 安装向导', icon: 'info', text: L.hjAgain }); return; }
    let i = 0;
    const next = () => {
      if (i < L.hjWizard.length) {
        OS.ui.dialog({ title: '幻觉游戏 V3.0 安装向导', icon: 'cd', text: L.hjWizard[i], buttons: ['下一步 >', '取消'] }).then(v => { if (v === '下一步 >') { i++; next(); } });
        return;
      }
      const fill = el('div', { class: 'hj-pfill' });
      const pct = el('div', { class: 'hj-pct', text: '0%' });
      const w = OS.wm.open({ title: '幻觉游戏 V3.0 安装向导', icon: 'cd', width: 260, modal: true, taskbar: false, minimizable: false, maximizable: false, noClose: true, className: 'is-dialog',
        content: el('div', { class: 'hj-copy' }, [el('div', { text: L.hjCopying }), el('div', { class: 'hj-pbar' }, [fill]), pct]) });
      let p = 0;
      const t = setInterval(() => {
        p = Math.min(100, p + 4 + Math.random() * 9);
        fill.style.width = p + '%'; pct.textContent = Math.floor(p) + '%';
        if (p % 25 < 10) OS.sound.play('cdSpin');
        if (p >= 100) {
          clearInterval(t);
          w.close();
          OS.save.set('hjInstalled', true);
          OS.emit('fs:change');
          OS.ui.dialog({ title: '幻觉游戏 V3.0 安装向导', icon: 'info', text: L.hjDone, buttons: ['完成'] });
        }
      }, 260);
    };
    next();
  }

  /* ---------- 弹出：屏幕右下角伸出一截光驱托盘（能放可乐）---------- */
  function eject() {
    discOut = true;
    OS.sound.play('eject');
    OS.bootFix.add('cdTray', L.trayFix);
    if (!tray) {
      tray = el('div', { class: 'cd-tray' }, [el('div', { class: 'cd-tray-disc' }), el('div', { class: 'cd-tray-cup' })]);
      tray.addEventListener('click', e => {
        e.stopPropagation();
        if (e.target.closest('.cd-tray-cup') && cup) { cup = false; tray.classList.remove('has-cup'); OS.sound.play('click'); return; }
        if (!cup) { cup = true; tray.classList.add('has-cup'); OS.sound.play('thud'); OS.ui.notify({ title: 'CD 驱动器 (D:)', text: L.trayCup, icon: 'info', replace: true }); }
      });
      document.getElementById('balloons').appendChild(tray);
    }
    tray.classList.remove('in');
    void tray.offsetWidth;
    tray.classList.add('out');
    OS.emit('fs:change');
  }
  function closeTray() {
    if (cup) { OS.ui.dialog({ title: 'CD 驱动器 (D:)', icon: 'warn', text: L.trayStuck }); return; }
    OS.sound.play('eject');
    discOut = false;
    OS.bootFix.remove('cdTray');
    if (tray) { tray.classList.remove('out'); tray.classList.add('in'); const t = tray; tray = null; setTimeout(() => t.remove(), 400); }
    OS.emit('fs:change');
  }

  /* ================= 共享文档：邻居借地方放的东西 ================= */
  FS.add(FS.SHARED + '\\武侠大片（枪版）.rmvb', { kind: 'rmvb', icon: 'video', size: '701,234 KB', open: () => (OS.manbo ? OS.manbo.play('wuxia', { local: true }) : say('武侠大片（枪版）.rmvb', 'info', L.movie)()), noDelete: '删不掉：隔壁大学生说这是他的命。' });
  FS.add(FS.SHARED + '\\转发给10个人就能长寿.doc', { kind: 'doc', open: () => OS.netShared && OS.netShared.longevity(), noDelete: '删不掉：王阿姨说删了会折寿。' });
  FS.add(FS.SHARED + '\\便利贴.txt', { text: L.stickyShared, roMsg: '保存失败：这是楼上熊孩子的，人家只给你看。', noDelete: '删不掉：熊孩子说了，别动他东西。' });

  /* 添加/删除程序：addremove.js（OS.addRemove） */

  /* ================= 给别的地方用 ================= */
  // 添加或删除程序（addremove.js）：卸 = 记成没装（光盘还在光驱里，随时能再装）；装回 = 走光盘自己的安装向导
  OS.hj = { games: GAMES, run: runGame, installed, install: () => install(), uninstall: () => { OS.save.set('hjInstalled', false); OS.emit('fs:change'); } };
  OS.mycomputer = { shared: () => EX.open(FS.SHARED) };
  // 中毒时光驱自己弹出来又缩回去（abcsee.js）；托盘上放着可乐就不缩回去，也不弹框
  OS.cdTray = { out: () => discOut, eject: () => eject(), close: () => { if (discOut && !cup) closeTray(); },
    // 环卫大爷（workers.js）：托盘上那杯可乐拿走喝了
    hasCup: () => discOut && cup, takeCup: () => { if (cup) { cup = false; if (tray) tray.classList.remove('has-cup'); } } };
})();
