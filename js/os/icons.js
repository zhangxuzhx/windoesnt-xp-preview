/* 图标：全部是 Codex 画的图（assets/icons、logo、paint、koukou、cd），不用微软/腾讯等任何人的图
   用法：OS.icon('名字') 得到 SVG 文本；OS.iconEl('名字', '额外class') 得到元素 */
(function () {
  'use strict';

  const RAW = {
    /* 系统标志：一扇被木板钉死的窗户 —— Windoesn't */
    logo: '<svg viewBox="0 0 48 48"><image href="assets/logo/logo.webp" x="0" y="0" width="48" height="48"/></svg>',

    // 标志拆开的三层（登录界面一直敲木板，木板一块块掉下来，露出后面的窗户 → 蓝屏）；三层叠起来就是上面那个 logo。Codex 画的（assets/logo/）
    'logo-window': '<svg viewBox="0 0 48 48"><image href="assets/logo/window.webp" x="0" y="0" width="48" height="48"/></svg>',
    'logo-board1': '<svg viewBox="0 0 48 48"><image href="assets/logo/board-1.webp" x="0" y="0" width="48" height="48"/></svg>',
    'logo-board2': '<svg viewBox="0 0 48 48"><image href="assets/logo/board-2.webp" x="0" y="0" width="48" height="48"/></svg>',

    paint: '<svg viewBox="0 0 48 48"><image href="assets/paint/icon.webp" x="0" y="0" width="48" height="48"/></svg>',

    /* 抠抠2003：铁公鸡（一毛不拔 = 抠门），Codex 画的图 */
    koukou: '<svg viewBox="0 0 48 48"><image href="assets/koukou/logo.webp" x="0" y="0" width="48" height="48"/></svg>',
    /* Offense 2003 办公三件套（offense.js）：Wordy（说个不停的本子）、PowerPointless（什么都没有的画板）、Offense（公文包），Codex 画的 */
    wordy: '<svg viewBox="0 0 48 48"><image href="assets/office/wordy.webp" x="0" y="0" width="48" height="48"/></svg>',
    ppt: '<svg viewBox="0 0 48 48"><image href="assets/office/ppt.webp" x="0" y="0" width="48" height="48"/></svg>',
    offense: '<svg viewBox="0 0 48 48"><image href="assets/office/offense.webp" x="0" y="0" width="48" height="48"/></svg>',
    /* 幻觉游戏 V3.0 里的 6 个游戏：Codex 画的 */
    'game-zhuma': '<svg viewBox="0 0 48 48"><image href="assets/cd/game-zhuma.webp" x="0" y="0" width="48" height="48"/></svg>',
    'game-miner': '<svg viewBox="0 0 48 48"><image href="assets/cd/game-miner.webp" x="0" y="0" width="48" height="48"/></svg>',
    'game-tank': '<svg viewBox="0 0 48 48"><image href="assets/cd/game-tank.webp" x="0" y="0" width="48" height="48"/></svg>',
    'game-tea': '<svg viewBox="0 0 48 48"><image href="assets/cd/game-tea.webp" x="0" y="0" width="48" height="48"/></svg>',
    'game-sticky': '<svg viewBox="0 0 48 48"><image href="assets/cd/game-sticky.webp" x="0" y="0" width="48" height="48"/></svg>',
    'game-stone': '<svg viewBox="0 0 48 48"><image href="assets/cd/game-stone.webp" x="0" y="0" width="48" height="48"/></svg>'
  };

  /* 像素小图：用字符画一格一格拼出来（小软件自己画像素小图用） */
  function pixelSvg(rows, colors) {
    const w = Math.max.apply(null, rows.map(r => r.length));
    let s = '<svg viewBox="0 0 ' + w + ' ' + rows.length + '" shape-rendering="crispEdges">';
    rows.forEach((row, y) => row.split('').forEach((c, x) => {
      if (colors[c]) s += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + colors[c] + '"/>';
    }));
    return s + '</svg>';
  }
  // 开机检测器要哭了：报错框的红叉变成 T_T 哭脸（Codex 画的）
  RAW.cry = '<svg viewBox="0 0 48 48"><image href="assets/icons/cry.webp" x="0" y="0" width="48" height="48"/></svg>';

  OS.pixelSvg = pixelSvg;

  /* ---------- 第一轮 Codex 图标（assets/icons/，横排拼图，没写的每格 96×96）：桌面 ／ 开始菜单 ／ 文件和磁盘 ／ 头像 ／ 注册机 ---------- */
  const cell = (file, i, n) => '<svg viewBox="0 0 48 48"><image href="assets/icons/' + file + '" x="' + (-i * 48) + '" y="0" width="' + (n * 48) + '" height="48" preserveAspectRatio="none"/></svg>';
  Object.assign(RAW, { mydocs: cell('desktop.webp', 0, 14), computer: cell('desktop.webp', 1, 14), network: cell('desktop.webp', 2, 14), recycle: cell('desktop.webp', 3, 14), recycleFull: cell('desktop.webp', 4, 14), detector: cell('desktop.webp', 5, 14), hourglass: cell('desktop.webp', 6, 14), rar: cell('desktop.webp', 7, 14), pulse: cell('desktop.webp', 8, 14), sheet: cell('desktop.webp', 9, 14), swatter: cell('desktop.webp', 10, 14), coil: cell('desktop.webp', 12, 14), music: cell('desktop.webp', 13, 14) });
  Object.assign(RAW, { calc: cell('start.webp', 0, 12), exe: cell('start.webp', 1, 12), ie: cell('start.webp', 2, 12), mail: cell('start.webp', 3, 12), sweep: cell('start.webp', 4, 12), cmd: cell('start.webp', 5, 12), diary: cell('start.webp', 6, 12), wordpad: cell('start.webp', 7, 12), control: cell('start.webp', 8, 12), abcsee: cell('start.webp', 9, 12), genie: cell('start.webp', 10, 12), key: cell('start.webp', 11, 12) });
  Object.assign(RAW, { folder: cell('files.webp', 0, 10), share: cell('files.webp', 1, 10), txt: cell('files.webp', 2, 10), doc: cell('files.webp', 3, 10), video: cell('files.webp', 4, 10), mp3file: cell('files.webp', 5, 10), abcpic: cell('files.webp', 6, 10), floppy: cell('files.webp', 7, 10), cd: cell('files.webp', 8, 10), hdd: cell('files.webp', 9, 10) });
  Object.assign(RAW, { duck: cell('avatars.webp', 0, 7), runner: cell('avatars.webp', 1, 7), lock: cell('avatars.webp', 2, 7), 'ava-cat': cell('avatars.webp', 3, 7), 'ava-dog': cell('avatars.webp', 4, 7), 'ava-fish': cell('avatars.webp', 5, 7), 'ava-sheep': cell('avatars.webp', 6, 7) });
  /* 排雷、接牌：Codex 画的（assets/cards/）；排雷原来用的是扫雪的扫把（start.webp 第 5 格，现在不用了） */
  RAW.solitaire = '<svg viewBox="0 0 48 48"><image href="assets/cards/jiepai.webp" x="0" y="0" width="48" height="48"/></svg>';
  RAW.keygen = '<svg viewBox="0 0 48 48"><image href="assets/icons/keygen.webp" x="0" y="0" width="48" height="48"/></svg>';
  // 空当算24：Codex 画的（assets/freecell/icon.webp：四张牌，上面一个空气泡），气泡里的"24"由这里写
  RAW.freecell = '<svg viewBox="0 0 48 48"><image href="assets/freecell/icon.webp" x="0" y="0" width="48" height="48"/>' +
    '<text x="24.5" y="19.6" text-anchor="middle" font-size="14" font-weight="bold" font-family="Tahoma,Verdana,sans-serif" fill="#d40000" stroke="#fff" stroke-width=".6" paint-order="stroke">24</text></svg>';
  // 蜘蛛合牌：Codex 画的（assets/cards/spider.webp：两张黑桃一碰冒出王冠金牌，底下一只小蜘蛛）
  RAW.spider = '<svg viewBox="0 0 48 48"><image href="assets/cards/spider.webp" x="0" y="0" width="48" height="48"/></svg>';
  // 黑心大战：Codex 画的（assets/cards/hearts.webp：黑桃 Q 后面探出一只戴小后冠的乌龟）
  RAW.hearts = '<svg viewBox="0 0 48 48"><image href="assets/cards/hearts.webp" x="0" y="0" width="48" height="48"/></svg>';
  // 二维弹球：Codex 画的（assets/pinball/icon.webp：弹球撞碎一块砖，底下一截挡板）
  RAW.pinball = '<svg viewBox="0 0 48 48"><image href="assets/pinball/icon.webp" x="0" y="0" width="48" height="48"/></svg>';
  RAW.sweep = '<svg viewBox="0 0 48 48"><image href="assets/cards/paile.webp" x="0" y="0" width="48" height="48"/></svg>';
  /* ---------- 第二轮 Codex 图标：滚动装饰（每格 128）／ 控制面板 ／ 系统小图标（对话框、托盘、开始菜单底部、关机框的整颗按钮） ---------- */
  Object.assign(RAW, { disc: cell('gadgets.webp', 0, 12), flipphone: cell('gadgets.webp', 1, 12), brickphone: cell('gadgets.webp', 2, 12), pager: cell('gadgets.webp', 3, 12), cassette: cell('gadgets.webp', 4, 12), mp3: cell('gadgets.webp', 5, 12), eggpet: cell('gadgets.webp', 6, 12), ballmouse: cell('gadgets.webp', 7, 12), modem: cell('gadgets.webp', 8, 12), gamepad: cell('gadgets.webp', 9, 12), sparkle: cell('gadgets.webp', 10, 12), smiley: cell('gadgets.webp', 11, 12) });
  Object.assign(RAW, { theme: cell('control.webp', 0, 8), gauge: cell('control.webp', 1, 8), printer: cell('control.webp', 2, 8), camera: cell('control.webp', 3, 8), clock: cell('control.webp', 4, 8), globe: cell('control.webp', 5, 8), shield: cell('control.webp', 6, 8), bug: cell('control.webp', 7, 8) });
  Object.assign(RAW, { info: cell('system.webp', 0, 13), warn: cell('system.webp', 1, 13), error: cell('system.webp', 2, 13), help: cell('system.webp', 3, 13), search: cell('system.webp', 4, 13), logout: cell('system.webp', 5, 13), power: cell('system.webp', 6, 13), standby: cell('system.webp', 7, 13), restart: cell('system.webp', 8, 13), volume: cell('system.webp', 9, 13), mute: cell('system.webp', 10, 13), shieldWarn: cell('system.webp', 11, 13), speaker: cell('system.webp', 12, 13) });

  let uid = 0;
  OS.icon = function (name) {
    const raw = RAW[name] || RAW.exe;
    const u = ++uid;
    return raw.replace(/_U/g, '_' + u); // 每次给渐变一个新编号，防止串色
  };
  OS.iconEl = function (name, cls) {
    const s = document.createElement('span');
    s.className = 'ico' + (cls ? ' ' + cls : '');
    s.innerHTML = OS.icon(name);
    return s;
  };
})();
