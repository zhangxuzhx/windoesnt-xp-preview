/* 桌面上的小软件清单（顺序 = 桌面默认摆放顺序）
   还没做的软件打开是“施工中”窗口；做好的软件单独一个文件（比如 bootcheck.js），
   在里面给它写上 open()，这里的清单不用动。 */
(function () {
  'use strict';
  const el = OS.el;

  const ETA = [
    '预计完工时间：取决于UP主收到几个三连。',
    '预计完工时间：下个版本。也可能是下下个。',
    '程序员他妈叫他回家吃饭了，从 2003 年到现在还没回来。',
    '此处本应有个软件，但它昨天自己辞职了。',
    '作者发誓下周做完。注：本周没有下周。',
    '正在用 56K 猫下载此功能，猫刚才把安装包吐出来了。'
  ];

  OS.apps.placeholder = function (app) {
    const ok = el('button', { class: 'xpbtn default', text: '行吧' });
    const content = el('div', { class: 'ph' }, [
      OS.iconEl(app.icon, 'ph-icon'),
      el('div', { class: 'ph-title', text: '「' + app.name + '」正在施工' }),
      el('div', { class: 'ph-sub', text: OS.pick(ETA) }),
      ok
    ]);
    const win = OS.wm.open({ title: app.name, icon: app.icon, width: 300, height: 196, appId: app.id, content });
    ok.addEventListener('click', () => { OS.sound.play('click'); win.close(); });
    return win;
  };

  // 桌面图标（顺序 = 默认摆放顺序，从左上往下排）
  [
    { id: 'mycomputer', name: '我的电脑', icon: 'computer' },
    { id: 'recycle', name: '回收站', icon: 'recycle', acceptsDrop: true },
    { id: 'bootcheck', name: '开机检测器 Pro', icon: 'detector', pinned: true },
    { id: 'lifespan', name: '阳寿余额查询', icon: 'hourglass', pinned: true },
    { id: 'rich', name: '2027暴富秘籍.rar', icon: 'rar', pinned: true },
    { id: 'pulse', name: '赛博把脉', icon: 'pulse', pinned: true },
    { id: 'debt', name: '塑料兄弟欠款单', icon: 'sheet', pinned: true },
    { id: 'swatter', name: '弹窗苍蝇拍', icon: 'swatter', pinned: true },
    { id: 'folder2', name: '新建文件夹(2)', icon: 'folder' },
    { id: 'calc', name: '计算器', icon: 'calc' },
    { id: 'paint', name: '画图 AI版', icon: 'paint' },
    { id: 'coil', name: '电子蚊香', icon: 'coil' },
    // 不在桌面上，从任务栏右键「任务管理器」打开
    { id: 'taskmgr', name: '任务管理器', icon: 'exe', desktop: false }
  ].forEach(a => OS.apps.register(a));

  // 开始菜单“所有程序”里那串灰色的（点了提示要升级专业版）
  OS.apps.proList = [
    '一键脱单', '自动写作业', '前任删除器', '体重转移器（转给同事）', '老板情绪预报',
    '后悔药 2.0', '熬夜回血包', '钱包扩容工具', '颈椎修复补丁', '反向闹钟',
    '自动已读不回', '防沉迷（学习版）', '一键变瘦', '隐身模式（老板专用）'
  ];

  // 回收站还没做：先让它摇一摇，冒个气泡
  OS.on('icon:drop', d => {
    if (d.target.id === 'recycle') {
      OS.ui.notify({ title: '回收站', text: '回收站尚未建成，请先把垃圾扔在心里。', icon: 'warn', replace: true, timeout: 3000 });
    }
  });
})();
