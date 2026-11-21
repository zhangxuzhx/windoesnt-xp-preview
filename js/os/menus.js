/* 右键菜单的内容（XP 里能右键的地方，这里都有）
   能真做的就真做；做不了的给一句话 */
(function () {
  'use strict';
  const M = OS.menus = {};
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  const NO_SHORTCUT = say('创建快捷方式', 'info', '人生没有快捷方式。');
  const NO_RENAME = say('重命名', 'warn', '重命名失败：它很满意现在的名字。');
  const NOT_FOUND = say('搜索结果', 'info', '搜索完毕，共找到 0 项。\n你要找的东西，大概在你上次放它的地方。');

  OS.clipboard = null; // { mode: 'cut' | 'copy', id }

  /* ---------- 桌面空白处 ---------- */
  M.desktop = function () {
    const D = OS.desktop, clip = OS.clipboard;
    return [
      {
        label: '排列图标', sub: () => [
          { label: '名称', action: () => D.arrange('name') },
          { label: '大小', action: () => D.arrange('size') },
          { label: '类型', action: () => D.arrange('type') },
          { label: '修改时间', action: () => D.arrange('time') },
          '-',
          { label: '按心情', action: () => D.arrange('mood') },
          '-',
          { label: '对齐到网格', checked: true, action: say('对齐到网格', 'info', '关不掉：本系统就喜欢整整齐齐。') },
          { label: '显示桌面图标', checked: D.iconsVisible(), action: () => D.toggleIcons() },
          '-',
          { label: '运行桌面清理向导…', action: say('桌面清理向导', 'info', '检测到桌面上有 ' + D.count() + ' 个没用的图标。\n建议：全部保留，反正它们没用。') }
        ]
      },
      { label: '刷新', action: () => D.refresh() },
      '-',
      { label: '粘贴', disabled: !clip, action: () => M.paste() },
      { label: '粘贴快捷方式', disabled: !clip, action: NO_SHORTCUT },
      '-',
      {
        label: '新建', sub: [
          { label: '文件夹', action: say('新建文件夹', 'warn', '新建失败：「新建文件夹(2)」表示，它不想要邻居。') },
          { label: '快捷方式', action: NO_SHORTCUT },
          '-',
          { label: '文本文档', action: say('新建文本文档', 'warn', '新建失败：你上次新建的文本文档，到现在已经写了多少字呢？') }
        ]
      },
      '-',
      { label: '属性', action: say('显示 属性', 'info', "主题：Windoesn't XP\n屏幕分辨率：480×360（高清到你能看到每个像素点）\n颜色质量：彩色吧（大概）\n屏幕保护程序：黑屏时屏幕里那张美丽的脸") }
    ];
  };

  M.paste = function () {
    const clip = OS.clipboard;
    if (!clip) return;
    if (clip.mode === 'cut') {
      OS.desktop.setCut(null);
      OS.clipboard = null;
      OS.ui.notify({ title: '移动完成', text: '已从「桌面」成功移动到「桌面」。', icon: 'info', replace: true, timeout: 3500 });
    } else {
      OS.ui.dialog({ title: '无法粘贴', icon: 'error', text: '世界上不需要两个一模一样的废物。' });
    }
  };

  /* ---------- 桌面图标 ---------- */
  function props(app) {
    return say('「' + app.name + '」属性', 'info',
      '类型：废物\n位置：桌面\n大小：0 字节\n创建时间：2003 年 2 月 30 日\n作用：暂无');
  }
  function askDelete(app) {
    return () => OS.ui.dialog({ title: '确认删除', icon: 'help', text: '确实要把「' + app.name + '」放入回收站吗？', buttons: ['是', '否'] })
      .then(v => { if (v === '是') OS.emit('icon:drop', { app, target: OS.apps.byId.recycle }); });
  }

  // 普通图标菜单里的那几项，给有自己专属菜单的软件拿去拼（比如压缩包）
  M.iconParts = function (app) {
    return {
      open: { label: '打开', bold: true, action: () => OS.apps.open(app.id) },
      cut: { label: '剪切', action: () => { OS.clipboard = { mode: 'cut', id: app.id }; OS.desktop.setCut(app.id); } },
      copy: { label: '复制', action: () => { OS.clipboard = { mode: 'copy', id: app.id }; OS.desktop.setCut(null); } },
      shortcut: { label: '创建快捷方式', action: NO_SHORTCUT },
      del: { label: '删除', action: askDelete(app) },
      rename: { label: '重命名', action: NO_RENAME },
      props: { label: '属性', action: props(app) }
    };
  };

  M.icon = function (app) {
    if (app.menu) return app.menu();   // 软件自己定了右键菜单
    const open = { label: '打开', bold: true, action: () => OS.apps.open(app.id) };
    if (app.id === 'mycomputer') {
      return [
        open,
        { label: '资源管理器', action: () => OS.apps.open(app.id) },
        { label: '搜索…', action: NOT_FOUND },
        '-',
        { label: '管理', action: say('计算机管理', 'info', '权限不足，请先成为自己人生的管理员。') },
        '-',
        { label: '映射网络驱动器…', action: say('映射网络驱动器', 'warn', '失败，建议可以给拨号猫喂食。') },
        { label: '断开网络驱动器…', action: say('断开网络驱动器', 'info', '已成功断开一条并不存在的网络驱动器。') },
        '-',
        { label: '创建快捷方式', action: NO_SHORTCUT },
        { label: '删除', action: say('删除', 'error', '删不掉：删了「我的电脑」，你就没有电脑了。') },
        { label: '重命名', action: NO_RENAME },
        '-',
        { label: '属性', action: M.systemProps }
      ];
    }
    if (app.id === 'recycle') {
      return [
        open,
        { label: '资源管理器', action: () => OS.apps.open(app.id) },
        { label: '清空回收站', action: say('清空回收站', 'info', '已成功清空空回收站。') },
        '-',
        { label: '创建快捷方式', action: NO_SHORTCUT },
        { label: '重命名', action: NO_RENAME },
        '-',
        { label: '属性', action: say('回收站 属性', 'info', '最大容量：无限\n当前存货：0\n挑食程度：严重') }
      ];
    }
    return [
      open,
      '-',
      { label: '剪切', action: () => { OS.clipboard = { mode: 'cut', id: app.id }; OS.desktop.setCut(app.id); } },
      { label: '复制', action: () => { OS.clipboard = { mode: 'copy', id: app.id }; OS.desktop.setCut(null); } },
      '-',
      { label: '创建快捷方式', action: NO_SHORTCUT },
      { label: '删除', action: askDelete(app) },
      { label: '重命名', action: NO_RENAME },
      '-',
      { label: '属性', action: props(app) }
    ];
  };

  M.systemProps = say('系统属性', 'info',
    "系统：Windoesn't XP 无聊版\n注册给：你\n处理器：不奔腾 III　0.5 GHz\n内存：640 KB（也许？）\n激活状态：未激活");

  /* ---------- 任务栏 ---------- */
  const TOOLBAR = say('工具栏', 'info', '添加失败。本系统不是工具，不需要工具栏。');
  const TASKBAR_PROPS = say('任务栏和「开始」菜单 属性', 'info', '任务栏位于屏幕底部。\n如果你把显示器倒过来，它就位于顶部。');
  let taskbarLocked = true;

  M.taskbar = function () {
    return [
      { label: '工具栏', sub: [{ label: '地址', action: TOOLBAR }, { label: '链接', action: TOOLBAR }, { label: '桌面', action: TOOLBAR }, { label: '快速启动', action: TOOLBAR }] },
      '-',
      { label: '层叠窗口', action: () => OS.wm.cascade() },
      { label: '横向平铺窗口', action: () => OS.wm.tile('h') },
      { label: '纵向平铺窗口', action: () => OS.wm.tile('v') },
      { label: OS.wm.desktopShown() ? '显示打开的窗口' : '显示桌面', action: () => OS.wm.showDesktop() },
      '-',
      { label: '任务管理器', action: () => OS.apps.open('taskmgr') },
      '-',
      {
        label: '锁定任务栏', checked: taskbarLocked, action: () => {
          taskbarLocked = !taskbarLocked;
          if (!taskbarLocked) OS.ui.notify({ title: '任务栏已解锁', text: '但它恐高，不敢离开底部。', icon: 'info', replace: true, timeout: 3500 });
        }
      },
      { label: '属性', action: TASKBAR_PROPS }
    ];
  };

  M.clock = function () {
    return [{ label: '调整日期/时间', bold: true, action: say('日期和时间', 'warn', '无法调整：别试了，他/她已经离开了，已经无法回到过去了。') }, '-'].concat(M.taskbar());
  };

  M.volume = function () {
    return [
      { label: '打开音量控制', bold: true, action: say('音量控制', 'info', '这已经是最适合你的音量了。') },
      { label: '静音', checked: OS.sound.muted, action: () => { OS.sound.setMuted(!OS.sound.muted); OS.emit('sound:changed'); } },
      '-',
      { label: '调整音频属性', action: say('音频属性', 'info', '音频属性：有声，或无声。') }
    ];
  };

  M.shield = function () {
    return [
      { label: '立即激活', bold: true, action: say('激活 Windoesn\'t', 'warn', '激活失败：请先集齐激活码碎片。\n位置：在你还没点开的地方。') },
      '-',
      { label: '属性', action: say('安全中心', 'info', '本系统毫无防护。\n黑客入侵后因过于无聊已自行退出。') }
    ];
  };

  M.startButton = function () {
    return [
      { label: '打开', bold: true, action: () => OS.taskbar.toggleMenu(true) },
      { label: '资源管理器', action: () => OS.apps.open('mycomputer') },
      { label: '搜索', action: NOT_FOUND },
      '-',
      { label: '属性', action: TASKBAR_PROPS }
    ];
  };

  // 开始菜单里的软件
  M.startItem = function (app, run) {
    return [
      { label: '打开', bold: true, action: run },
      '-',
      { label: '属性', action: () => { OS.taskbar.toggleMenu(false); props(app)(); } }
    ];
  };
  // 开始菜单里灰色的专业版软件
  M.proItem = function (run) {
    return [
      { label: '打开', bold: true, action: run },
      '-',
      { label: '删除', action: () => { OS.taskbar.toggleMenu(false); OS.ui.dialog({ title: '删除', icon: 'error', text: '删不掉：这里是专业版的广告位。' }); } }
    ];
  };
  // 开始菜单右边那一栏
  M.placeItem = function (run) {
    return [
      { label: '打开', bold: true, action: run },
      '-',
      { label: '属性', action: () => { OS.taskbar.toggleMenu(false); OS.ui.dialog({ title: '属性', icon: 'info', text: '没什么好看的。' }); } }
    ];
  };

  /* ---------- 窗口（标题栏、任务栏按钮） ---------- */
  M.window = function (w) {
    const o = w.opts;
    return [
      { label: '还原', disabled: !(w.minimized || w.maximized), action: () => { if (w.minimized) OS.wm.restore(w); else if (w.maximized) OS.wm.toggleMax(w); } },
      o.minimizable ? { label: '最小化', disabled: w.minimized, action: () => OS.wm.minimize(w) } : null,
      o.maximizable ? { label: '最大化', disabled: w.maximized, action: () => { if (w.minimized) OS.wm.restore(w); OS.wm.toggleMax(w); } } : null,
      '-',
      o.closable ? { label: '关闭', bold: true, action: () => OS.wm.close(w) } : null
    ];
  };
})();
