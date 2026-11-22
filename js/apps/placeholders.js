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
  // 最上面四个照 XP 的老顺序：我的文档、我的电脑、网上邻居、回收站
  [
    { id: 'mydocs', name: '我的文档', icon: 'mydocs' },
    { id: 'mycomputer', name: '我的电脑', icon: 'computer' },
    { id: 'network', name: '网上邻居', icon: 'network' },
    { id: 'recycle', name: '回收站', icon: 'recycle', acceptsDrop: true },
    { id: 'bootcheck', name: '开机检测器 Pro', icon: 'detector' },
    { id: 'lifespan', name: '阳寿余额查询', icon: 'hourglass' },
    // 暴富秘籍、欠条收在「新建文件夹(2)」最外面那层里（folder2.js），不在桌面上
    { id: 'rich', name: '2027暴富秘籍.rar', icon: 'rar', desktop: false, inFolder: 'folder2' },
    { id: 'pulse', name: '赛博把脉', icon: 'pulse' },
    { id: 'debt', name: '欠条打印专家 2003.xls', icon: 'sheet', desktop: false, inFolder: 'folder2' },
    { id: 'swatter', name: '弹窗杀手', icon: 'swatter' },
    { id: 'folder2', name: '新建文件夹(2)', icon: 'folder' },
    { id: 'coil', name: '电子蚊香', icon: 'coil' },
    // 抠抠2003（koukou.js）：桌面上一个，开始 ▸ 所有程序 ▸ 抠抠软件 里一个
    { id: 'koukou', name: '抠抠2003', icon: 'koukou' },
    // 千千不听（qianqian.js）：音乐播放器，也是全游戏的背景音乐；桌面一个，开始 ▸ 所有程序 ▸ 千千不听 里一个
    { id: 'qianqian', name: '千千不听', icon: 'music' },
    // 不在桌面上：计算器、画图在 开始 ▸ 所有程序 ▸ 附件 里；任务管理器从任务栏右键打开
    // 计算器（calc.js）：开始 ▸ 所有程序 ▸ 附件，开始菜单左栏也有
    { id: 'calc', name: '计算器', icon: 'calc', desktop: false },
    // 画图 AI版（paint.js）：开始 ▸ 所有程序 ▸ 附件，开始菜单左栏也有
    { id: 'paint', name: '画图 AI版', icon: 'paint', desktop: false },
    // 任务管理器（taskmgr.js）：任务栏空白处右键、命令提示符 taskmgr
    { id: 'taskmgr', name: '任务管理器', icon: 'gauge', desktop: false },
    // 开始菜单左边那几个（照 XP 的开始菜单），暂时都是施工中
    { id: 'ie', name: 'Internot Explorer', icon: 'ie', desktop: false },
    { id: 'mail', name: 'Outluck Excess', icon: 'mail', desktop: false },
    { id: 'sweep', name: '扫雪', icon: 'sweep', desktop: false },
    // 命令提示符（cmd.js）：开始 ▸ 所有程序 ▸ 附件，开始菜单左栏也有
    { id: 'cmd', name: '命令提示符', icon: 'cmd', desktop: false },
    // 控制面板（controlpanel.js）：开始菜单右栏；我的电脑左边也有链接。就是这个游戏的“设置”
    { id: 'control', name: '控制面板', icon: 'control', desktop: false },
    // ABCSee 大眼看图（abcsee.js）：开始 ▸ 所有程序 ▸ ABCSee 大眼看图；所有图片都用它开
    { id: 'abcsee', name: 'ABCSee 大眼看图 V3.1', icon: 'abcsee', desktop: false },
    // 记事本（notepad.js）：开始 ▸ 所有程序 ▸ 附件；游戏里所有 .txt 都用它打开
    { id: 'notepad', name: '记事本', icon: 'diary', desktop: false, singleton: false },
    // 写字板（wordpad.js）：开始 ▸ 所有程序 ▸ 附件；.doc、.rtf 都用它打开
    { id: 'wordpad', name: '写字板', icon: 'wordpad', desktop: false, singleton: false },
    // 开始 ▸ 所有程序 ▸ 实用小程序 里的激活器（activator.js）
    { id: 'activator', name: "Windoesn't 激活器", icon: 'key', desktop: false },
    // 开始 ▸ 所有程序 ▸ 启动 里、开始菜单右栏最下面：把存档全部清空（restore.js）
    { id: 'restore', name: '一键还原小精灵', icon: 'genie', desktop: false }
  ].forEach(a => OS.apps.register(a));

  // 开始菜单“所有程序”里那串灰色的（点了提示要升级专业版）
  OS.apps.proList = [
    '一键脱单', '自动写作业', '前任删除器', '体重转移器（转给同事）', '后悔药 2.0', '钱包扩容工具', '反向闹钟'
  ];

  // 回收站收东西的逻辑在 recycle.js
})();
