/* 银山打字通的五个打字小游戏（yinshan.js 里 打字游戏 那页打开；创意稿「银山打字通-创意.md」第四、六部分）
   2026-11-24 作者：五个游戏风格都不对，要照那几年打字游戏的路数（创意稿「银山打字通-游戏换风格-创意.md」，作者定 1A 3B 7A 8A 11A 13A 15C 16A 18A 19A 27B）：
   - 整个窗口就是一张画面（400×300），没有灰条、没有系统按钮；分数、时间、命都画在画面里
   - 每个游戏一块自己的按钮板：打瞌睡 小黑板 + 圆磁铁 ／ 接鸡蛋 木牌 + 木头圆钮 ／ 保卫地球 金属仪表盘 ／ 小鸭过河 大叶子 + 水珠 ／ 抓逃课 蓝色路牌；
     按钮 开始 ／ 暂停 ／ 结束 ／ 设置 + 退出，三种样子：平时 ／ 鼠标移上去 ／ 按下去（Codex 的按钮图来了就换上，见 codex 任务包）
   - 功能设置小窗：左边一条主题色带星星、斜着的大字，右边滑块；难度也在这里（不再选 初级 ／ 中级 ／ 高级）
   - 分关：一关限时，时间到了没输就弹"恭喜，你通过了！"［继续］［下一关］［结束］，下一关更快；输了"再接再厉！"［再玩一次］［结束］；小窗里探出头的是那个游戏的主角
   - 游戏里的坐标还是 320×240（Codex 的图也是按这个比例画的），画布按 800×600 画、显示成 400×300，字清楚
   各游戏：
   - 打瞌睡：九个同学在上自习，有人点头打瞌睡、睡着了头上冒一张生字卡（角上红数字倒数）；按 ／ 点就"啪"拍醒；数到 0 班主任在门口咳嗽，收走一朵小红花，6 朵收完就输
   - 接鸡蛋：蛋上一个大字母，按 ／ 点就接进右下角的竹篮（越堆越满）；右上角小木牌记分；碎 10 个这一关就输
   - 保卫地球：有开场页（开始 ／ 选项 ／ 高分榜 ／ 退出）和高分榜（只有你自己）；顶上一排 得分 ／ 城市血条 ／ 时间；奖励模式：横着飞过的单词打完城市回血
   - 小鸭过河：岸边排一队 5 只小鸭，一只一只过，过去的挨着对岸鸭妈妈；掉水里被冲走；全过完过关，一只不剩或者天黑了就输；下面一条打字栏
   - 班主任抓逃课：开场页（单人游戏 ／ 双人游戏 ／ 退出）→ 双人游戏是一页找主机，永远找不到人；单人游戏先选人物、选课文、调对手速度；
     绕城一圈的环路，打得越快跑得越快（走路 → 自行车 → 汽车 → 火箭）；逃课生只看得见同一条直线上前面的班主任，看见就愣一下、掉头跑；
     镜头跟着你演的那个人，右上角小地图；下面一条打字栏；结局整屏一张大画（四种），回车再来、Esc 回主菜单
     课文.txt 改成一堆 A 按住不放 → 火箭在拐弯处冲出去，把窗口撞碎 → 蓝屏 WINDOW_SMASHED；第一次打开抠抠上同桌来教你 */
(function () {
  'use strict';
  const el = OS.el;
  const K = OS.yinshanKit;
  if (!K) return;
  const W = 320, H = 240;        // 游戏里的坐标
  const VW = 376;                // 画面在窗口里的宽（桌面能放的窗口最高 308，画面 376×282；上面盖的按钮、小窗按 400×300 排版再缩 0.94）
  const SC = 2.5;                // 320 坐标 → 画布像素（800×600）
  const L = {
    btn: { start: '开始', pause: '暂停', resume: '继续', end: '结束', setup: '设置' }, exit: '退出',
    setTitle: ['功能', '设置'], ok: '确定', cancel: '取消', def: '默认',
    pass: '恭喜，你通过了！', fail: '再接再厉！', goOn: '继续', nextLv: '下一关', endRun: '结束', again: '再玩一次',
    passLine: (lv, s) => '第 ' + lv + ' 关过了　得分 ' + s,
    over: '游戏结束', score: n => '得分 ' + n, best: n => '最高分 ' + n, newBest: '破纪录了！',
    lv: n => '第 ' + n + ' 关', extra: s => '加时 ' + s + ' 秒', paused: '暂停',
    rules: {
      nap: '九个同学在上自习，有人打瞌睡睡着了，头上冒出一张生字卡。\n电脑按卡上那个键，手机直接点他，"啪"一下拍醒！\n卡上的数字数到 0 还没拍醒，班主任在门口咳嗽，收走一朵小红花。',
      egg: '母鸡下蛋了，蛋上写着字母。\n电脑按那个键，手机直接点鸡蛋，接进篮子里！\n碎了 10 个，这一关就输了。',
      earth: '外星飞碟来了，飞碟上写着字母。\n电脑按那个键，手机直接点飞碟，激光打下来！\n飞碟落到城里，城市就掉一截血。',
      chase: '班主任追，逃课生跑，打得越快跑得越快。\n先选你当哪边、打哪篇课文。\n逃课生打完课文、或者撑到下课铃就赢；班主任追上就赢。',
      river: '小鸭要过河，木头上写着单词。\n电脑直接打出单词，手机先点木头再点字母。\n五只小鸭都送到鸭妈妈身边就过关。'
    },
    napLose: '小红花都被收走了……', cough: '咳！咳！',
    eggCaught: n => '接住 ' + n, eggBroke: n => '碎了 ' + n + ' / 10', eggLose: '碎了一地……',
    hudScore: '得分', hudLife: '城市', hudTime: '时间', earthLose: '城市被占领了……',
    eTitle: '保卫地球', eMenu: ['开始', '选项', '高分榜', '退出'], hiTitle: '高分榜', hiHead: ['名次', '玩家', '得分', '日期'], hiBack: '返回', you: '你',
    riverLoseAll: '小鸭都被冲走了……', riverLoseTime: '天黑了，鸭妈妈等不及了……', home: 'home',
    cTitle: '班主任抓逃课', cMenu: ['单人游戏', '双人游戏', '退出'],
    lobbyHead: ['主机名称', '连通时间', '状态'], lobbyBtns: ['创建', '加入', '刷新', '返回'], lobbySearching: '正在搜索局域网中的主机……', lobbyPick: '请先选一台主机。',
    lobbyWait: '正在等待其他玩家加入', lobbyWaited: s => '已经等了 ' + s + ' 秒', lobbyCancel: '取消',
    pickWho: '选择人物', teacherN: '班主任', studentN: '逃课生', pickText: '可选课文', aiSpeed: '对手速度', howTo: '游戏说明',
    howText: '打得越快跑得越快：走路、自行车、汽车、火箭。逃课生打完课文、或者撑到下课铃就赢；班主任追上就赢。',
    cGo: '开始', cCancel: '取消', endKeys: ['按回车键再来一局', '按 Esc 键回主菜单'],
    chaseInfo: (t, cpm) => '下课铃 ' + t + ' 秒　速度 ' + cpm + ' 字/分',
    caughtWin: '抓到了！回教室写检讨去！', caughtLose: '被班主任抓到了……', bellWin: '下课铃响了，没抓到！', bellTeacher: '下课铃响了，人跑了……',
    doneWin: '课文打完了，逃课成功！', doneLose: '逃课生把课文打完了，跑掉了……',
    see: '！', tiers: ['走路', '自行车', '汽车', '火箭'],
    deskmate: ['哎，班主任抓逃课能作弊你知道不？', '去 C 盘 Program Files 里找到 银山打字通 ▸ 游戏 ▸ 班主任抓逃课 ▸ 课文.txt，把里面的字全改成 A，保存。回来按住 A 不放，嗖嗖的。']
  };
  const LIST = [{ id: 'nap', name: '打瞌睡' }, { id: 'egg', name: '接鸡蛋' }, { id: 'earth', name: '保卫地球' }, { id: 'chase', name: '班主任抓逃课' }, { id: 'river', name: '小鸭过河' }];
  const NAMES = {};
  LIST.forEach(g => { NAMES[g.id] = g.name; g.rules = L.rules[g.id]; });
  // 每个游戏的按钮板：plate 是哪一种板子，pos 放在画面哪个角
  const THEME = {
    nap: { plate: 'board', pos: 'br', col: '#2f7a46' },
    egg: { plate: 'wood', pos: 'bl', col: '#d8761e' },
    earth: { plate: 'metal', pos: 'bl', col: '#5a3aa8' },
    river: { plate: 'leaf', pos: 'tr', col: '#2a8ad0' },
    chase: { plate: 'sign', pos: 'tl', col: '#d8a81e' }
  };
  // 功能设置：[键, 名字, 最小, 最大, 默认, 单位]；单位是 'check' 就是一个勾
  const SET = {
    nap: [['time', '游戏时间', 1, 5, 1, '分钟'], ['rate', '睡着的快慢', 1, 9, 3, ''], ['stay', '生字卡停留', 3, 9, 6, '秒']],
    egg: [['time', '游戏时间', 1, 5, 1, '分钟'], ['many', '同时掉几个', 1, 5, 2, '个'], ['speed', '掉落速度', 1, 9, 3, '']],
    earth: [['time', '游戏时间', 1, 5, 1, '分钟'], ['many', '同时来几架', 1, 6, 2, '架'], ['speed', '飞碟速度', 1, 9, 3, ''], ['bonus', '开启奖励模式', 0, 1, 1, 'check']],
    river: [['time', '游戏时间', 1, 5, 2, '分钟'], ['speed', '木头漂流速度', 1, 9, 3, ''], ['long', '木头上写两个词', 0, 1, 0, 'check']],
    chase: [['speed', '对手速度', 1, 9, 3, '']]
  };
  const SET_NOTE = { bonus: '开了以后，不定期有一个单词横着飞过，在它飞走前打完，城市回一截血。', long: '木头上不是一个单词，是两个词，中间的空格也要打。' };
  const BSOD = { id: 'yinshan', name: 'WINDOW_SMASHED', text: '糟糕，窗体被撞碎了，快叫修理工' };

  /* ================= 共用 ================= */
  const IMG = {};
  function img(n) {
    if (n in IMG) return IMG[n];
    IMG[n] = null;
    const i = new Image();
    i.onload = () => { i.k = BASE[n] ? i.width / BASE[n] : 1; IMG[n] = i; };
    i.src = K.ART + n + '.webp';
    return null;
  }
  // 小图表（精灵表）原来的宽：2026-11-24 作者嫌像素感重，这几张按 Codex 原稿两倍重建了，代码里的格子位置还按原来的写，画的时候乘上倍数
  const BASE = { nap: 480, 'nap-study': 480, 'nap-woke': 240, egg: 368, earth: 368, river: 320, 'chase-run': 384, 'chase-map': 640 };
  function dI(c, im, sx, sy, sw, sh, dx, dy, dw, dh) { const k = im.k || 1; c.drawImage(im, sx * k, sy * k, sw * k, sh * k, dx, dy, dw, dh); }
  ['nap', 'nap-study', 'nap-woke', 'egg', 'earth', 'river', 'chase-map', 'chase-run', 'smash', 'chase-heads', 'chase-end'].forEach(n => img(n));
  // 2026-11-24 换风格要 Codex 补的图（codex任务包/银山打字通-游戏换风格素材.md）：来了就自动换上，没来先用代码画的
  //   *-bg：四张背景按两倍重画（构图跟原来一模一样）；nap-items：空白生字卡 ／ 小红花 ／ 灰小红花；egg-basket：竹篮四种满法；river-mom：鸭妈妈
  //   panel-*（还有同名的 btns-* ／ exit-*，在 CSS 里）：五个游戏各自的按钮板
  ['nap-bg', 'egg-bg', 'earth-bg', 'river-bg', 'nap-items', 'egg-basket', 'river-mom', 'river-duck', 'panel-nap', 'panel-egg', 'panel-earth', 'panel-river', 'panel-chase'].forEach(n => img(n));
  const bestAll = () => OS.save.get('ysBest', {});
  const best = id => bestAll()[id] || 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ABC = 'abcdefghijklmnopqrstuvwxyz';
  const clock = s => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  function letter(c, x, y, t, size, col, line) {
    c.font = 'bold ' + (size || 14) + 'px Arial, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = line || Math.max(2.5, size / 5); c.strokeStyle = '#1a1a1a'; c.strokeText(t, x, y);
    c.fillStyle = col || '#fff'; c.fillText(t, x, y);
    c.textBaseline = 'alphabetic';
  }
  function text(c, x, y, t, size, col, align, font) {
    c.font = (font || 'bold ' + size + 'px "Microsoft YaHei", SimHei, sans-serif');
    c.textAlign = align || 'left'; c.textBaseline = 'middle';
    c.fillStyle = col; c.fillText(t, x, y);
    c.textBaseline = 'alphabetic';
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function spr(c, im, sx, sy, w, h, x, y, k) { k = k || 1; dI(c, im, sx, sy, w, h, x - w * k / 2, y - h * k / 2, w * k, h * k); }
  const freeLetter = used => { const pool = ABC.split('').filter(ch => used.indexOf(ch) < 0); return OS.pick(pool.length ? pool : ABC.split('')); };
  const setsAll = () => OS.save.get('ysSet', {});
  function loadSet(id) { const o = {}; SET[id].forEach(d => { o[d[0]] = d[4]; }); return Object.assign(o, setsAll()[id] || {}); }
  function saveSet(id, o) { const a = setsAll(); a[id] = o; OS.save.set('ysSet', a); }
  // 三种样子的按钮（平时 ／ 鼠标移上去 ／ 按下去，样子在 CSS 里）
  function btn3(t, cls, fn) {
    const b = el('div', { class: cls }, [el('span', { text: t })]);
    b.addEventListener('click', () => { if (b.classList.contains('off')) return; OS.sound.play('click'); fn(); });
    return b;
  }
  const EXIT_SVG = '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="8" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 8h8M12 5l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  // 时间那一格：正常倒数；按了［继续］以后是加时
  const timeStr = G => (G.extra >= 0 ? L.extra(Math.floor(G.extra)) : clock(G.timeLeft));
  // 描边的中文字（左上角那种信息）
  function outline(c, x, y, t, size, col, align) {
    c.font = 'bold ' + size + 'px "Microsoft YaHei", SimHei, sans-serif';
    c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = size / 4; c.strokeStyle = '#1a1a1a'; c.strokeText(t, x, y);
    c.fillStyle = col; c.fillText(t, x, y);
    c.textBaseline = 'alphabetic';
  }

  /* ================= 游戏窗口 ================= */
  const wins = new Map();
  function open(id) {
    if (wins.has(id)) { const w = wins.get(id).win; if (w.minimized) OS.wm.restore(w); OS.wm.focus(w); return w; }
    const T = THEME[id];
    const cv = el('canvas', { class: 'ysg-cv', width: String(W * SC), height: String(H * SC) });
    const ui = el('div', { class: 'ysg-ui' });
    const root = el('div', { class: 'ysg ysg-' + id + ' pl-' + T.plate + (img('panel-' + id) ? ' art' : '') }, [cv, ui]);
    const G = { id, T, cv, c: (() => { const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high'; return x; })(), ui, root, state: 'ready', score: 0, level: 1, timeLeft: (loadSet(id).time || 1) * 60, extra: -1, t: 0, raf: 0, last: 0, held: false, win: null,
      set: loadSet(id), modal: null, modalKind: null, hidePanel: false, newBest: false, levelScore: 0 };
    let onKey = null;
    G.win = OS.wm.open({ title: NAMES[id] + ' - 银山打字通', icon: 'yinshan', width: VW + 6, content: root, maximizable: false, center: true, className: 'ys-skin ys-gamewin',
      onClose: () => {
        cancelAnimationFrame(G.raf);
        K.unlistenKeys(G.win);
        document.removeEventListener('keydown', onKey, true);
        if (G.game && G.game.destroy) G.game.destroy();
        if (G.held && OS.qianqian && OS.qianqian.resume) OS.qianqian.resume();
        wins.delete(id);
      } });
    wins.set(id, G);
    G.lvf = () => 1 + (G.level - 1) * 0.15;   // 一关比一关快
    G.hold = () => { if (!G.held && OS.qianqian && OS.qianqian.hold) G.held = OS.qianqian.hold(); };
    G.keepBest = () => { const all = bestAll(); if (G.score > (all[id] || 0)) { all[id] = G.score; OS.save.set('ysBest', all); G.newBest = true; } };
    G.repaint = () => paintPanel(G);
    G.startLevel = () => {
      closeModal(G);
      G.set = loadSet(id);
      G.timeLeft = (G.set.time || 1) * 60; G.extra = -1; G.t = 0; G.levelScore = G.score;
      G.state = 'play';
      G.hold();
      G.game.reset();
      paintPanel(G);
    };
    G.startRun = () => { G.level = 1; G.score = 0; G.newBest = false; G.startLevel(); };
    G.pass = () => {
      if (G.state !== 'play') return;
      G.state = 'dlg'; K.sfx('ysWin'); G.keepBest();
      const btns = [[L.nextLv, () => { G.level++; G.startLevel(); }], [L.endRun, () => G.finish()]];
      if (!G.game.noGoOn) btns.unshift([L.goOn, () => { closeModal(G); G.extra = 0; G.state = 'play'; paintPanel(G); }]);
      dialog(G, { pass: true, title: L.pass, line: L.passLine(G.level, G.score), btns });
      paintPanel(G);
    };
    G.lose = reason => {
      if (G.state !== 'play') return;
      G.state = 'dlg'; K.sfx('ysLose'); G.keepBest();
      dialog(G, { pass: false, title: L.fail, line: reason + '\n' + L.score(G.score), btns: [[L.again, () => { G.score = G.levelScore; G.startLevel(); }], [L.endRun, () => G.finish()]] });
      paintPanel(G);
    };
    G.finish = () => { closeModal(G); G.keepBest(); G.state = 'over'; G.level = 1; G.extra = -1; G.timeLeft = (G.set.time || 1) * 60; if (G.game.ended) G.game.ended(); paintPanel(G); };
    G.pause = () => { if (G.state === 'play') G.state = 'pause'; else if (G.state === 'pause' && !G.modal) G.state = 'play'; paintPanel(G); };
    G.setup = () => {
      if (G.modal) return;
      const was = G.state;
      if (was === 'play') G.state = 'pause';
      settingsBox(G, () => { if (was === 'play' && G.state === 'pause') G.state = 'play'; paintPanel(G); });
      paintPanel(G);
    };
    G.game = GAMES[id](G);
    if (G.game.panel !== false) G.panel = makePanel(G);
    if (G.game.ready) G.game.ready();
    paintPanel(G);
    cv.addEventListener('pointerdown', e => {
      if (G.state !== 'play' || !G.game.tap) return;
      const r = cv.getBoundingClientRect();
      G.game.tap((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H);
    });
    K.listenKeys(G.win, (ch, e) => { if (G.state === 'play' && G.game.key) G.game.key(ch, e); });
    // 回车 ／ Esc（listenKeys 只管单个字符）
    onKey = e => {
      if (OS.wm.active !== G.win || G.win.isClosed) return;
      if (e.key !== 'Enter' && e.key !== 'Escape') return;
      if (G.game.special && G.game.special(e.key)) { e.preventDefault(); return; }
      if (e.key === 'Enter' && !G.modal && G.panel && !G.hidePanel && (G.state === 'ready' || G.state === 'over')) { e.preventDefault(); G.startRun(); }
    };
    document.addEventListener('keydown', onKey, true);
    const loop = now => {
      if (G.win.isClosed) return;
      G.raf = requestAnimationFrame(loop);
      const dt = G.last ? Math.min(0.05, (now - G.last) / 1000) : 0;
      G.last = now;
      if (G.state === 'play') {
        G.t += dt;
        if (G.game.timed !== false) {
          if (G.extra >= 0) G.extra += dt;
          else { G.timeLeft -= dt; if (G.timeLeft <= 0) { G.timeLeft = 0; if (G.game.timeUp) G.game.timeUp(); else G.pass(); } }
        }
        if (G.state === 'play') G.game.tick(dt);
      } else if (G.game.idle) G.game.idle(dt);
      G.c.setTransform(SC, 0, 0, SC, 0, 0);
      G.game.draw(G.c);
      cover(G);
    };
    G.raf = requestAnimationFrame(loop);
    return G.win;
  }
  // 暂停 ／ 结束后盖在画面上的
  function cover(G) {
    const c = G.c;
    if (G.state === 'pause' && !G.modal) {
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, H);
      outline(c, W / 2, H / 2, L.paused, 30, '#ffde3a', 'center');
    } else if (G.state === 'over' && G.panel && !G.hidePanel) {
      c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, 0, W, H);
      outline(c, W / 2, 84, L.over, 24, '#fff', 'center');
      letter(c, W / 2, 118, L.score(G.score), 22, '#ffde3a', 5);
      outline(c, W / 2, 146, G.newBest ? L.newBest : L.best(best(G.id)), 13, G.newBest ? '#ff8a5a' : '#fff', 'center');
    }
  }
  /* ---------- 按钮板 ---------- */
  const ACT = {
    start: G => { if (G.state === 'ready' || G.state === 'over') G.startRun(); },
    pause: G => G.pause(),
    end: G => { if (G.state === 'play' || G.state === 'pause') G.finish(); },
    setup: G => G.setup()
  };
  function makePanel(G) {
    const keys = G.game.buttons || ['start', 'pause', 'end', 'setup'];
    const B = {};
    const row = el('div', { class: 'ysg-pbs' }, keys.map(k => (B[k] = btn3(L.btn[k], 'ysg-pb pb-' + k, () => ACT[k](G)))));
    const exit = el('div', { class: 'ysg-exit' }, [el('i', { html: EXIT_SVG }), el('span', { text: L.exit })]);
    exit.addEventListener('click', () => { OS.sound.play('click'); if (G.game.exit) G.game.exit(); else G.win.close(); });
    const box = el('div', { class: 'ysg-panel at-' + G.T.pos }, [exit, row]);
    G.ui.appendChild(box);
    return { box, B };
  }
  function paintPanel(G) {
    if (!G.panel) return;
    const B = G.panel.B, s = G.state, idle = s === 'ready' || s === 'over', run = s === 'play' || s === 'pause';
    if (B.start) { B.start.classList.toggle('off', !idle); B.start.classList.toggle('glow', idle && !G.modal); }
    if (B.pause) { B.pause.classList.toggle('off', !run); B.pause.firstChild.textContent = s === 'pause' ? L.btn.resume : L.btn.pause; }
    if (B.end) B.end.classList.toggle('off', !run);
    if (B.setup) B.setup.classList.toggle('off', s === 'dlg');
    G.panel.box.style.display = G.hidePanel ? 'none' : '';
  }
  /* ---------- 盖在画面上的小窗：过关 ／ 输了 ／ 功能设置 ---------- */
  function showModal(G, box, kind) { const shade = el('div', { class: 'ysg-shade' }, [box]); G.ui.appendChild(shade); G.modal = shade; G.modalKind = kind; }
  function closeModal(G) { if (G.modal) { G.modal.remove(); G.modal = null; G.modalKind = null; } }
  function dialog(G, o) {
    closeModal(G);
    const face = el('canvas', { class: 'ysg-dface', width: '150', height: '150' });
    const fc = face.getContext('2d');
    fc.setTransform(2.5, 0, 0, 2.5, 0, 0);
    if (G.game.face) G.game.face(fc, 30, 34);
    const btns = o.btns.map(([t, fn]) => btn3(t, 'ysg-db', fn));
    const box = el('div', { class: 'ysg-dlg ' + (o.pass ? 'pass' : 'fail') }, [
      el('div', { class: 'ysg-dtop' }, [face, el('div', { class: 'ysg-dtxt' }, [el('div', { class: 'ysg-dtt', text: o.title }), el('div', { class: 'ysg-dln', text: o.line })])]),
      el('div', { class: 'ysg-dbot' }, btns)]);
    showModal(G, box, 'dlg');
  }
  function settingsBox(G, done) {
    const defs = SET[G.id];
    const cur = Object.assign({}, G.set);
    const rows = el('div', { class: 'ysg-srows' });
    function build() {
      rows.textContent = '';
      defs.forEach(([k, name, mn, mx, , unit]) => {
        if (unit === 'check') {
          const cb = el('input', { type: 'checkbox' });
          cb.checked = !!cur[k];
          cb.addEventListener('change', () => { cur[k] = cb.checked ? 1 : 0; });
          rows.appendChild(el('label', { class: 'ysg-scheck' }, [cb, el('span', { text: name })]));
          if (SET_NOTE[k]) rows.appendChild(el('div', { class: 'ysg-snote', text: SET_NOTE[k] }));
          return;
        }
        const val = el('span', { class: 'ysg-sval' });
        const r = el('input', { type: 'range', min: String(mn), max: String(mx), step: '1', class: 'ysg-range' });
        r.value = String(cur[k]);
        const paint = () => { val.textContent = cur[k] + (unit ? ' ' + unit : ''); };
        r.addEventListener('input', () => { cur[k] = +r.value; paint(); });
        paint();
        rows.appendChild(el('div', { class: 'ysg-srow' }, [el('span', { class: 'ysg-sname', text: name + '：' }), r, val]));
      });
    }
    build();
    const box = el('div', { class: 'ysg-set' }, [
      el('div', { class: 'ysg-sside' }, [el('div', { class: 'ysg-stitle' }, [el('span', { text: L.setTitle[0] }), el('span', { text: L.setTitle[1] })])]),
      el('div', { class: 'ysg-smain' }, [rows]),
      el('div', { class: 'ysg-sbtns' }, [
        btn3(L.ok, 'ysg-sb', () => { saveSet(G.id, cur); G.set = loadSet(G.id); if (G.state === 'ready' || G.state === 'over') G.timeLeft = (G.set.time || 1) * 60; closeModal(G); if (G.game.setChanged) G.game.setChanged(); done(); }),
        btn3(L.cancel, 'ysg-sb', () => { closeModal(G); done(); }),
        btn3(L.def, 'ysg-sb', () => { defs.forEach(d => { cur[d[0]] = d[4]; }); build(); })])
    ]);
    showModal(G, box, 'set');
  }
  // 下面一条打字栏（小鸭过河、抓逃课）：上面一行字，下面手机用的字母块
  function inputBar(G) {
    const line = el('div', { class: 'ysg-iline' });
    const tl = el('div', { class: 'ysg-itiles' });
    const box = el('div', { class: 'ysg-ibar' }, [line, tl]);
    G.ui.appendChild(box);
    let tiles = null;
    return {
      box, line,
      show(on) { box.style.display = on ? '' : 'none'; },
      // done：打过的；cur：下一个；rest：后面的；bad：刚打错
      set(done, cur, rest, bad) {
        line.textContent = '';
        line.append(el('span', { class: 'd', text: done }), el('span', { class: 'c' + (bad ? ' bad' : ''), text: cur === ' ' ? '␣' : cur }), el('span', { class: 'r', text: rest }));
      },
      tiles(o) { this.noTiles(); tiles = K.Tiles(o); tl.appendChild(tiles.el); tiles.render(); box.classList.add('has-tiles'); return tiles; },
      noTiles() { if (tiles) { tiles.destroy(); tiles = null; } tl.textContent = ''; box.classList.remove('has-tiles'); },
      get t() { return tiles; }
    };
  }

  /* ================= 五个游戏 ================= */
  const GAMES = {};

  /* ---------- 打瞌睡 ---------- */
  //   同学四种样子：自习（study）→ 打瞌睡点头（nod，一小会儿）→ 睡着（sleep，头上一张生字卡）→ 被拍醒 ／ 被咳嗽吓醒（woke，一小会儿）→ 接着自习
  //   Codex 的图：nap.webp（教室、睡着、拍醒、手掌、"啪"）＋ nap-study.webp（自习、点头）＋ nap-woke.webp（拍醒，跟自习同一个位置）
  GAMES.nap = G => {
    const DESK = [];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) DESK.push({ x: 64 + k * 96, y: 84 + r * 56 });
    const ART_DESK = [[52, 84], [160, 84], [272, 84], [44, 132], [160, 132], [280, 132], [40, 186], [164, 186], [284, 186]];
    const deskAt = i => (img('nap') ? { x: ART_DESK[i][0], y: ART_DESK[i][1] } : DESK[i]);
    const NOD = 0.8, FLOWERS = 6;
    let kids = [], spawn = 0, flowers = FLOWERS, cough = 0;
    const fresh = () => { kids = DESK.map((d, i) => ({ state: 'study', ch: '', t: 0, left: 0, kind: i % 3, ph: Math.random() * 6, slapped: false })); };
    fresh();
    const reset = () => { fresh(); spawn = 1.2; flowers = FLOWERS; cough = 0; };
    const stay = () => Math.max(2, G.set.stay - (G.level - 1) * 0.5);
    const slap = i => { const k = kids[i]; k.state = 'woke'; k.t = 0.7; k.slapped = true; G.score++; K.sfx('ysSlap'); };
    const COL = ['#4a78c8', '#e06a8a', '#4aa86a'];
    function drawKid(c, d, k, nod) {
      const x = d.x, y = d.y - 18;
      c.save();
      c.translate(x, y + 14);
      if (nod) c.rotate(Math.sin(G.t * 6) * 0.12 + 0.18);
      c.translate(-x, -(y + 14));
      c.fillStyle = COL[k.kind]; c.beginPath(); c.ellipse(x, y + 14, 15, 11, 0, Math.PI, Math.PI * 2); c.fill();
      c.fillRect(x - 15, y + 13, 30, 8);
      c.fillStyle = '#f3d2a8'; c.beginPath(); c.arc(x, y - 2, 10, 0, Math.PI * 2); c.fill();
      c.fillStyle = k.kind === 1 ? '#5a3420' : '#222';
      c.beginPath(); c.arc(x, y - 5, 10.5, Math.PI * 1.05, Math.PI * 1.95); c.fill();
      if (k.kind === 1) { c.beginPath(); c.ellipse(x + 11, y - 2, 3, 7, 0.3, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#222';
      if (nod) { c.fillRect(x - 6, y - 1, 4, 1.2); c.fillRect(x + 2, y - 1, 4, 1.2); }
      else { c.fillRect(x - 5, y, 2.4, 2.4); c.fillRect(x + 3, y, 2.4, 2.4); }
      if (k.kind === 2) { c.strokeStyle = '#222'; c.lineWidth = 1; c.beginPath(); c.arc(x - 4, y + 1, 3.2, 0, Math.PI * 2); c.arc(x + 4, y + 1, 3.2, 0, Math.PI * 2); c.stroke(); }
      c.restore();
      c.fillStyle = '#fff'; c.fillRect(x - 13, y + 16, 12, 9); c.fillRect(x + 1, y + 16, 12, 9);
      c.strokeStyle = '#9aa'; c.lineWidth = 0.8; c.strokeRect(x - 13, y + 16, 26, 9);
      if (!nod) { c.strokeStyle = '#335'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + 6, y + 20 + Math.sin(G.t * 10 + k.ph) * 1.5); c.lineTo(x + 11, y + 13); c.stroke(); }
    }
    function book(c, st, k, d) { if (st) spr(c, st, k.kind * 80 + 6, 69, 68, 9, d.x, d.y + 3.45, 0.7); }
    // 生字卡：田字格，大字母，角上红色小数字倒数
    function card(c, x, y, ch, left) {
      c.save(); c.translate(x, y); c.rotate(-0.06);
      const it = img('nap-items');
      if (it) { const k = it.height; c.drawImage(it, 0, 0, k, k, -16, -16, 32, 32); }
      else {
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-12, -13, 27, 30);
        c.fillStyle = '#fffdf2'; c.fillRect(-14, -15, 28, 30);
        c.strokeStyle = '#c0442a'; c.lineWidth = 1.6; c.strokeRect(-12.5, -13.5, 25, 27);
        c.strokeStyle = 'rgba(200,70,50,.4)'; c.lineWidth = 0.6; c.setLineDash([1.6, 1.6]);
        c.beginPath(); c.moveTo(-12, 0); c.lineTo(12, 0); c.moveTo(0, -13); c.lineTo(0, 13); c.stroke(); c.setLineDash([]);
      }
      c.font = 'bold 21px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1a1a1a'; c.fillText(ch.toUpperCase(), 0, 1);
      c.font = 'bold 8px Arial, sans-serif'; c.fillStyle = left < 2 ? '#ff1a0a' : '#d4261c'; c.fillText(String(Math.max(0, Math.ceil(left))), 9.5, 10);
      c.restore(); c.textBaseline = 'alphabetic';
    }
    // 小红花：命
    function flower(c, x, y, on) {
      const it = img('nap-items');
      if (it) { const k = it.height; c.drawImage(it, (on ? 1 : 2) * k, 0, k, k, x - 7, y - 7, 14, 14); return; }
      c.save(); c.translate(x, y);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; c.fillStyle = on ? '#f0303a' : 'rgba(120,120,120,.5)'; c.beginPath(); c.arc(Math.cos(a) * 3.6, Math.sin(a) * 3.6, 3, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = on ? '#ffd23a' : 'rgba(170,170,170,.6)'; c.beginPath(); c.arc(0, 0, 2.4, 0, Math.PI * 2); c.fill();
      if (on) { c.strokeStyle = '#2a8a3a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, 11); c.stroke(); }
      c.restore();
    }
    function chalk(c, x, y, t, size) { c.globalAlpha = 0.9; text(c, x, y, t, size, '#f4f8ee', 'center', 'bold ' + size + 'px KaiTi, STKaiti, "Microsoft YaHei", serif'); c.globalAlpha = 1; }
    return {
      reset,
      ready() { fresh(); },
      ended() { fresh(); },
      tick(dt) {
        spawn -= dt;
        if (spawn <= 0) {
          const studying = kids.map((k, i) => (k.state === 'study' ? i : -1)).filter(i => i >= 0);
          if (studying.length) { const k = kids[OS.pick(studying)]; k.state = 'nod'; k.t = NOD; }
          spawn = Math.max(0.35, (2.2 - G.set.rate * 0.17) / G.lvf() - G.t * 0.004);
        }
        kids.forEach(k => {
          if (k.state === 'nod') { k.t -= dt; if (k.t <= 0) { k.state = 'sleep'; k.left = stay(); k.ch = freeLetter(kids.filter(q => q.state === 'sleep').map(q => q.ch)); K.sfx('pop'); } }
          else if (k.state === 'sleep') {
            k.left -= dt;
            if (k.left <= 0) { k.state = 'woke'; k.t = 0.7; k.slapped = false; flowers--; cough = 1.3; K.sfx('ysCough'); if (flowers <= 0) G.lose(L.napLose); }
          } else if (k.state === 'woke') { k.t -= dt; if (k.t <= 0) k.state = 'study'; }
        });
        if (cough > 0) cough -= dt;
      },
      key(ch) { const i = kids.findIndex(k => k.state === 'sleep' && k.ch === ch); if (i >= 0) slap(i); else K.sfx('ysErr'); },
      tap(x, y) { let bi = -1, bd = 44; DESK.forEach((_, i) => { const d = deskAt(i), dd = Math.min(Math.hypot(d.x - x, d.y - 20 - y), Math.hypot(d.x - x, d.y - 58 - y)); if (kids[i].state === 'sleep' && dd < bd) { bd = dd; bi = i; } }); if (bi >= 0) slap(bi); },
      draw(c) {
        const im = img('nap'), st = img('nap-study'), bg = img('nap-bg');
        if (bg) c.drawImage(bg, 0, 0, W, H);
        else if (im) dI(c, im, 40, 0, 400, 300, 0, 0, W, H);
        else {
          c.fillStyle = '#c9a77a'; c.fillRect(0, 0, W, H);
          c.fillStyle = '#2f4d3a'; c.fillRect(30, 4, 260, 34); c.strokeStyle = '#7a5a30'; c.lineWidth = 4; c.strokeRect(30, 4, 260, 34);
          DESK.forEach(d => { c.fillStyle = '#8a5a2a'; c.fillRect(d.x - 30, d.y + 6, 60, 16); c.fillStyle = '#6a4420'; c.fillRect(d.x - 30, d.y + 22, 60, 4); });
        }
        // 黑板上用粉笔写：第几关、还剩多久、拍醒几个（躲开第一排同学头上的生字卡）
        chalk(c, 106, 21, L.lv(G.level) + '　' + timeStr(G), 10);
        chalk(c, 216, 21, '拍醒 ' + G.score, 10);
        kids.forEach((k, i) => {
          const d = deskAt(i);
          if (k.state === 'study' || k.state === 'nod') {
            const nod = k.state === 'nod';
            if (st) spr(c, st, (k.kind + (nod ? 3 : 0)) * 80, 0, 80, 80, d.x, d.y - 20 + (nod ? Math.sin(G.t * 9) : 0), 0.7);
            else drawKid(c, d, k, nod);
            if (nod) letter(c, d.x + 20, d.y - 42, '…', 12, '#fff');
          } else if (k.state === 'sleep') {
            book(c, st, k, d);
            if (im) spr(c, im, k.kind * 80, 300, 80, 80, d.x, d.y - 20, 0.7);
            else { c.fillStyle = COL[k.kind]; c.fillRect(d.x - 12, d.y - 4, 24, 12); c.fillStyle = '#f3d2a8'; c.beginPath(); c.ellipse(d.x, d.y + 2, 11, 8, 0, 0, Math.PI * 2); c.fill(); }
            letter(c, d.x + 21, d.y - 38 + Math.sin(G.t * 4 + i) * 2, 'z', 9, '#9cf');
            card(c, d.x, d.y - 56, k.ch, k.left);
          } else {
            const wk = img('nap-woke');
            if (wk) spr(c, wk, k.kind * 80, 0, 80, 80, d.x, d.y - 20, 0.7);
            else if (im) { spr(c, st || im, st ? k.kind * 80 + 6 : 0, st ? 69 : 0, st ? 68 : 1, st ? 9 : 1, d.x, d.y - 1, 0.7); spr(c, im, (k.kind + 3) * 80, 318, 80, 62, d.x, d.y - 25.3, 0.74); }
            else drawKid(c, d, k, false);
            if (k.slapped && k.t > 0.45) {
              if (im) { spr(c, im, 0, 380, 80, 80, d.x + 14, d.y - 56, 0.55); spr(c, im, 80, 380, 80, 80, d.x - 6, d.y - 40, 0.5); }
              else letter(c, d.x + 20, d.y - 30, '啪', 13, '#ffd94a');
            }
          }
        });
        // 门口班主任咳嗽
        if (cough > 0) {
          c.globalAlpha = Math.min(1, cough * 2);
          c.fillStyle = '#fff'; c.strokeStyle = '#333'; c.lineWidth = 1.2;
          rrect(c, 4, 52, 62, 22, 8); c.fill(); c.stroke();
          c.beginPath(); c.moveTo(4, 60); c.lineTo(-2, 66); c.lineTo(8, 66); c.fill();
          text(c, 35, 63.5, L.cough, 11, '#c0302a', 'center');
          c.globalAlpha = 1;
        }
        for (let k = 0; k < FLOWERS; k++) flower(c, 11 + k * 15, 226, k < flowers);
      },
      face(c, x, y) {
        const wk = img('nap-woke'), st = img('nap-study');
        if (wk) spr(c, wk, 0, 0, 80, 80, x, y + 4, 0.85);
        else if (st) spr(c, st, 0, 0, 80, 80, x, y + 4, 0.85);
        else drawKid(c, { x, y: y + 20 }, { kind: 0, ph: 0 }, false);
      }
    };
  };

  /* ---------- 接鸡蛋 ---------- */
  GAMES.egg = G => {
    const HENS = [55, 128, 203, 277];   // 跟 Codex 图里四只母鸡对上
    const BASKET = { x: 282, y: 216 };
    let eggs = [], spawn = 0, broke = 0, caught = 0;
    const reset = () => { eggs = []; spawn = 0.6; broke = 0; caught = 0; };
    const falling = () => eggs.filter(e => e.state === 'fall');
    const catchEgg = e => { e.state = 'fly'; e.t = 0; e.x0 = e.x; e.y0 = e.y; G.score++; K.sfx('ysDing'); };
    function basket(c) {
      const { x, y } = BASKET;
      const art = img('egg-basket');
      if (art) { const cw = art.width / 4, n = caught <= 0 ? 0 : caught < 4 ? 1 : caught < 9 ? 2 : 3; c.drawImage(art, n * cw, 0, cw, art.height, x - 30, y - 34, 60, 50); return; }
      c.strokeStyle = '#8a5a22'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y - 8, 22, 22, 0, Math.PI, Math.PI * 2); c.stroke();
      c.fillStyle = '#6a4418'; c.beginPath(); c.ellipse(x, y - 6, 24, 6, 0, 0, Math.PI * 2); c.fill();
      // 篮子里的蛋，越接越满
      const n = Math.min(9, caught);
      for (let k = 0; k < n; k++) { const row = k < 5 ? 0 : 1, col = row ? k - 5 : k; c.fillStyle = '#fff8e6'; c.strokeStyle = '#c8b088'; c.lineWidth = 0.6; c.beginPath(); c.ellipse(x - 16 + col * 8 + row * 4, y - 8 - row * 5, 4.2, 5.2, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
      const g = c.createLinearGradient(0, y - 6, 0, y + 14); g.addColorStop(0, '#d8a24a'); g.addColorStop(1, '#9a6624');
      c.fillStyle = g; c.beginPath(); c.moveTo(x - 25, y - 6); c.lineTo(x + 25, y - 6); c.lineTo(x + 19, y + 14); c.lineTo(x - 19, y + 14); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(90,50,10,.55)'; c.lineWidth = 0.8;
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x - 24 + k * 0.8, y - 1 + k * 4); c.lineTo(x + 24 - k * 0.8, y - 1 + k * 4); c.stroke(); }
      for (let k = -4; k <= 4; k++) { c.beginPath(); c.moveTo(x + k * 5.6, y - 6); c.lineTo(x + k * 4.4, y + 14); c.stroke(); }
    }
    // 记分小木牌：放在横杆下面右边（作者：别挡着第四只母鸡），画在鸡蛋后面
    function sign(c) {
      const x = 222, y = 80, w = 94, h = 30;
      const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#d89a50'); g.addColorStop(1, '#a8682a');
      c.fillStyle = g; rrect(c, x, y, w, h, 4); c.fill();
      c.strokeStyle = '#6a3e12'; c.lineWidth = 1.4; c.stroke();
      c.fillStyle = '#5a3410'; c.beginPath(); c.arc(x + 5, y + 5, 1.3, 0, 7); c.arc(x + w - 5, y + 5, 1.3, 0, 7); c.fill();
      text(c, x + w / 2, y + 9.5, L.lv(G.level) + '　' + timeStr(G), 9, '#fff6dc', 'center');
      text(c, x + w / 2, y + 21.5, L.eggCaught(G.score) + '　' + L.eggBroke(broke), 8, '#fff6dc', 'center');
    }
    return {
      reset,
      ready() { eggs = []; },
      ended() { eggs = []; },
      tick(dt) {
        spawn -= dt;
        if (spawn <= 0) {
          if (falling().length < G.set.many) {
            const free = HENS.filter(hx => !falling().some(e => Math.abs(e.x - hx) < 12 && e.y < 130));
            if (free.length) eggs.push({ x: OS.pick(free) + rnd(-4, 4), y: img('egg') ? 74 : 34, vy: (14 + G.set.speed * 5) * G.lvf() * rnd(0.9, 1.1) + G.t * 0.15, ch: freeLetter(falling().map(e => e.ch)), state: 'fall', t: 0 });
            spawn = rnd(0.45, 1.1) / G.lvf();
          } else spawn = 0.15;
        }
        eggs.forEach(e => {
          if (e.state === 'fall') { e.y += e.vy * dt; if (e.y >= (img('egg') ? 212 : 220)) { e.state = 'broken'; e.t = 1.2; broke++; K.sfx('ysCrack'); } }
          else if (e.state === 'fly') { e.t += dt * 2.8; if (e.t >= 1) { e.state = 'in'; caught++; } }
          else e.t -= dt;
        });
        eggs = eggs.filter(e => e.state === 'fall' || e.state === 'fly' || (e.state === 'broken' && e.t > 0));
        if (broke >= 10) G.lose(L.eggLose);
      },
      key(ch) { const e = falling().filter(x => x.ch === ch).sort((a, b) => b.y - a.y)[0]; if (e) catchEgg(e); else K.sfx('ysErr'); },
      tap(x, y) { const e = falling().filter(q => Math.hypot(q.x - x, q.y - y) < 26).sort((a, b) => b.y - a.y)[0]; if (e) catchEgg(e); },
      draw(c) {
        const im = img('egg'), bg = img('egg-bg');
        if (bg) c.drawImage(bg, 0, 0, W, H);
        else if (im) dI(c, im, 0, 0, 320, 240, 0, 0, W, H);
        else {
          const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9fd3ff'); g.addColorStop(1, '#e9f6ff');
          c.fillStyle = g; c.fillRect(0, 0, W, H);
          c.fillStyle = '#8a5a2a'; c.fillRect(20, 26, 280, 6);
          HENS.forEach(x => { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, 16, 12, 10, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#e33'; c.beginPath(); c.arc(x + 6, 6, 3, 0, Math.PI * 2); c.fill(); });
          c.fillStyle = '#9a7a4a'; c.fillRect(0, 222, W, 18);
        }
        basket(c);
        sign(c);
        eggs.forEach(e => {
          if (e.state === 'fall') {
            if (im) spr(c, im, 320, 0, 48, 48, e.x, e.y, 0.82);
            else { c.fillStyle = '#fffaf0'; c.strokeStyle = '#b8a888'; c.lineWidth = 1; c.beginPath(); c.ellipse(e.x, e.y, 14, 18, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
            letter(c, e.x, e.y + 3, e.ch.toUpperCase(), 20, '#e0281c', 4);
          } else if (e.state === 'fly') {
            const k = e.t, x = e.x0 + (BASKET.x - e.x0) * k, y = e.y0 + (BASKET.y - 14 - e.y0) * k - Math.sin(k * Math.PI) * 30;
            if (im) spr(c, im, 320, 0, 48, 48, x, y, 0.82 - k * 0.45); else { c.fillStyle = '#fffaf0'; c.beginPath(); c.ellipse(x, y, 10 - k * 5, 13 - k * 6, 0, 0, Math.PI * 2); c.fill(); }
          } else if (e.state === 'broken') {
            if (im) spr(c, im, 320, 96, 48, 48, e.x, 214, 0.75);
            else { c.fillStyle = '#ffd23a'; c.beginPath(); c.ellipse(e.x, 226, 12, 4, 0, 0, Math.PI * 2); c.fill(); }
          }
        });
      },
      face(c, x, y) {
        const im = img('egg');
        // 2026-11-24 作者：小窗里的母鸡像素感重——原来是从旧背景上剪的一块方图（还带着蓝天），换成小图表里那只扑腾的母鸡（透明底、两倍清楚）
        if (im) spr(c, im, 320, 144, 48, 48, x, y, 1.2);
        else { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, 20, 16, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#e33'; c.beginPath(); c.arc(x + 10, y - 14, 5, 0, Math.PI * 2); c.fill(); }
      }
    };
  };

  /* ---------- 保卫地球 ---------- */
  GAMES.earth = G => {
    const WORDS = ['ok', 'go', 'up', 'hi', 'net', 'cpu', 'bug', 'fan', 'web', 'ram', 'top', 'zip', 'exe', 'win', 'key', 'pc'];
    const BONUS = ['repair', 'shield', 'power', 'energy', 'rescue', 'rocket', 'planet', 'helper'];
    let ufos = [], fx = [], spawn = 0, hp = 100, lock = null, kills = 0, bonus = null, bonusT = 0, page = null, deco = 0;
    const reset = () => { ufos = []; fx = []; spawn = 0.8; hp = 100; lock = null; kills = 0; bonus = null; bonusT = rnd(9, 15); };
    const targets = () => ufos.filter(u => !u.dead).concat(bonus ? [bonus] : []);
    function hit(u) {
      u.done++;
      fx.push({ k: 'laser', x: u.x, y: u.y, t: 0.12 });
      K.sfx('ysLaser');
      if (u.done < u.word.length) { lock = u; return; }
      if (lock === u) lock = null;
      if (u.bonus) { hp = Math.min(100, hp + 25); fx.push({ k: 'heal', x: u.x, y: u.y, t: 0.8 }); K.sfx('ysWin'); bonus = null; G.score += 3; return; }
      u.dead = true; fx.push({ k: 'boom', x: u.x, y: u.y, t: 0.45 }); K.sfx('mbBoom'); G.score++; kills++;
    }
    // 开场页、高分榜
    const hiList = () => OS.save.get('ysEarthHi', []);
    function clearPage() { if (page) { page.remove(); page = null; } }
    function titlePage() {
      clearPage();
      G.state = 'title'; G.hidePanel = true; G.repaint();
      const acts = [() => { clearPage(); G.hidePanel = false; G.startRun(); }, () => G.setup(), () => hiPage(-1), () => G.win.close()];
      page = el('div', { class: 'ysg-page ysg-etitle' }, [
        el('div', { class: 'ysg-ebig', text: L.eTitle }),
        el('div', { class: 'ysg-emenu' }, L.eMenu.map((t, i) => btn3(t, 'ysg-emb', acts[i]))),
        el('div', { class: 'ysg-elogo' }, [el('span', { class: 'a', text: '银山打字' }), el('span', { class: 'b', text: '2003' })])
      ]);
      G.ui.appendChild(page);
    }
    function hiPage(mine) {
      clearPage();
      G.state = 'title'; G.hidePanel = true; G.repaint();
      const list = hiList();
      const rows = [];
      for (let k = 0; k < 10; k++) {
        const h = list[k];
        const d = h ? new Date(h.at) : null;
        rows.push(el('div', { class: 'ysg-hrow' + (k === mine ? ' me' : '') }, [String(k + 1), h ? L.you : '——', h ? String(h.s) : '——', d ? (d.getMonth() + 1) + '-' + d.getDate() : '——'].map(t => el('span', { text: t }))));
      }
      page = el('div', { class: 'ysg-page ysg-ehi' }, [
        el('div', { class: 'ysg-hboard' }, [el('div', { class: 'ysg-htitle', text: L.hiTitle }), el('div', { class: 'ysg-hrow head' }, L.hiHead.map(t => el('span', { text: t })))].concat(rows)),
        el('div', { class: 'ysg-emenu one' }, [btn3(L.hiBack, 'ysg-emb', () => titlePage())])
      ]);
      G.ui.appendChild(page);
    }
    function background(c) {
      const im = img('earth'), bg = img('earth-bg');
      if (bg) { c.drawImage(bg, 0, 0, W, H); return im; }
      if (im) { dI(c, im, 0, 0, 320, 240, 0, 0, W, H); return im; }
      c.fillStyle = '#0b1230'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#fff';
      for (let k = 0; k < 40; k++) c.fillRect((k * 73) % W, (k * 37) % 180, 1, 1);
      c.fillStyle = '#1c2448';
      for (let k = 0; k < 10; k++) c.fillRect(k * 32, 190 - (k * 23 % 30), 28, 60);
      return null;
    }
    function ufo(c, im, x, y, kind) {
      if (im) spr(c, im, 320, kind * 48, 48, 48, x, y, 0.85);
      else { c.fillStyle = ['#5ad06a', '#a86ad8', '#e0503a'][kind]; c.beginPath(); c.ellipse(x, y, 20, 8, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(200,240,255,.85)'; c.beginPath(); c.ellipse(x, y - 6, 9, 7, 0, Math.PI, Math.PI * 2); c.fill(); }
    }
    function hud(c) {
      c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, 17);
      c.strokeStyle = 'rgba(160,140,255,.6)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 17); c.lineTo(W, 17); c.stroke();
      text(c, 6, 9, L.hudScore + '：', 9, '#ffa63a');
      text(c, 33, 9, String(G.score), 10, '#5af07a');
      text(c, 98, 9, L.hudLife + '：', 9, '#ffa63a');
      c.fillStyle = '#333'; rrect(c, 125, 4, 82, 10, 3); c.fill();
      const g = c.createLinearGradient(125, 0, 207, 0); g.addColorStop(0, '#ff6a1a'); g.addColorStop(1, '#ffd23a');
      c.fillStyle = g; rrect(c, 126, 5, Math.max(0, 80 * hp / 100), 8, 2.5); c.fill();
      c.strokeStyle = '#ccc'; c.lineWidth = 0.6; rrect(c, 125, 4, 82, 10, 3); c.stroke();
      text(c, 222, 9, L.hudTime + '：', 9, '#ffa63a');
      text(c, 249, 9, timeStr(G), 10, '#5af07a');
      text(c, 314, 9, L.lv(G.level), 8, '#cfc8ff', 'right');
    }
    return {
      reset,
      buttons: ['pause', 'end', 'setup'],
      exit() { titlePage(); },
      ready() { titlePage(); },
      ended() {
        // 记进高分榜（只有你自己），进了前 10 名就翻到高分榜那页，把这一行亮出来
        const list = hiList(), me = { s: G.score, at: Date.now() };
        const all = list.concat([me]).sort((a, b) => b.s - a.s).slice(0, 10);
        OS.save.set('ysEarthHi', all);
        const at = G.score > 0 ? all.indexOf(me) : -1;
        ufos = []; bonus = null;
        if (at >= 0) hiPage(at); else titlePage();
      },
      idle(dt) { deco += dt; },
      tick(dt) {
        spawn -= dt;
        if (spawn <= 0) {
          if (ufos.filter(u => !u.dead).length < G.set.many) {
            const word = kills >= 15 && Math.random() < 0.5 ? OS.pick(WORDS) : freeLetter(targets().map(u => u.word[u.done]));
            ufos.push({ x: rnd(26, W - 26), y: 6, vy: (6 + G.set.speed * 2.2) * G.lvf() + G.t * 0.08, word, done: 0, kind: Math.floor(Math.random() * 3), dead: false });
            spawn = rnd(0.7, 1.6) / G.lvf();
          } else spawn = 0.2;
        }
        ufos.forEach(u => {
          if (u.dead) return;
          u.y += u.vy * dt;
          if (u.y >= 196) { u.dead = true; hp -= 20; fx.push({ k: 'boom', x: u.x, y: 210, t: 0.6 }); K.sfx('ysErr'); if (lock === u) lock = null; }
        });
        ufos = ufos.filter(u => !u.dead);
        // 奖励模式：一个单词横着飞过
        if (G.set.bonus) {
          if (bonus) { bonus.x += bonus.vx * dt; if (bonus.x < -50 || bonus.x > W + 50) { if (lock === bonus) lock = null; bonus = null; bonusT = rnd(12, 20); } }
          else { bonusT -= dt; if (bonusT <= 0) { const dir = Math.random() < 0.5 ? 1 : -1; bonus = { bonus: true, word: OS.pick(BONUS), done: 0, x: dir > 0 ? -40 : W + 40, y: 44, vx: dir * 34 }; } }
        }
        fx.forEach(f => { f.t -= dt; });
        fx = fx.filter(f => f.t > 0);
        if (hp <= 0) { hp = 0; G.lose(L.earthLose); }
      },
      key(ch) {
        if (lock && (!lock.dead) && lock.word[lock.done] === ch && (lock === bonus || ufos.indexOf(lock) >= 0)) { hit(lock); return; }
        const u = targets().filter(q => q.word[q.done] === ch).sort((a, b) => b.y - a.y)[0];
        if (u) hit(u); else K.sfx('ysErr');
      },
      tap(x, y) { const u = targets().filter(q => Math.hypot(q.x - x, q.y - y) < (q.bonus ? 34 : 26)).sort((a, b) => b.y - a.y)[0]; if (u) hit(u); },
      draw(c) {
        const im = background(c);
        if (G.state === 'title') {
          // 开场页：两架飞碟在天上晃
          ufo(c, im, 70 + Math.sin(deco * 0.7) * 30, 150 + Math.sin(deco * 1.3) * 8, 0);
          ufo(c, im, 262 + Math.cos(deco * 0.6) * 24, 110 + Math.sin(deco * 1.1) * 8, 1);
          c.fillStyle = 'rgba(10,0,40,.35)'; c.fillRect(0, 0, W, H);
          return;
        }
        if (im) spr(c, im, 320, 144, 48, 48, 160, 216, 0.8);
        else { c.fillStyle = '#7a8aa0'; c.fillRect(150, 222, 20, 14); c.fillRect(157, 212, 6, 12); }
        fx.forEach(f => {
          if (f.k === 'laser') { c.strokeStyle = 'rgba(120,255,160,' + f.t * 8 + ')'; c.lineWidth = 3; c.beginPath(); c.moveTo(160, 200); c.lineTo(f.x, f.y); c.stroke(); }
          else if (f.k === 'heal') { c.globalAlpha = Math.min(1, f.t * 1.5); letter(c, f.x, f.y - (0.8 - f.t) * 30, '+', 22, '#5f5'); c.globalAlpha = 1; }
          else if (im) { c.globalAlpha = Math.min(1, f.t * 2); spr(c, im, 320, 192, 48, 48, f.x, f.y, 1); c.globalAlpha = 1; }
          else { c.fillStyle = 'rgba(255,150,40,' + f.t * 1.8 + ')'; c.beginPath(); c.arc(f.x, f.y, 18 * (1 - f.t), 0, Math.PI * 2); c.fill(); }
        });
        ufos.forEach(u => {
          ufo(c, im, u.x, u.y, u.kind);
          const w = u.word.toUpperCase(), sz = w.length > 1 ? 15 : 20, gapx = sz * 0.68;
          for (let k = 0; k < w.length; k++) letter(c, u.x + (k - (w.length - 1) / 2) * gapx, u.y + 22, w[k], sz, k < u.done ? '#5f5' : lock === u ? '#ffd94a' : '#fff');
        });
        if (bonus) {
          const w = bonus.word.toUpperCase(), bw = w.length * 11 + 16;
          c.fillStyle = 'rgba(40,200,120,.28)'; rrect(c, bonus.x - bw / 2, bonus.y - 11, bw, 22, 11); c.fill();
          c.strokeStyle = 'rgba(140,255,190,.9)'; c.lineWidth = 1.2; c.stroke();
          for (let k = 0; k < w.length; k++) letter(c, bonus.x + (k - (w.length - 1) / 2) * 11, bonus.y + 1, w[k], 15, k < bonus.done ? '#5f5' : lock === bonus ? '#ffd94a' : '#bfffd8');
        }
        hud(c);
      },
      face(c, x, y) { ufo(c, img('earth'), x, y + 4, 0); }
    };
  };

  /* ---------- 小鸭过河 ---------- */
  GAMES.river = G => {
    const WORDS = ['duck', 'swim', 'jump', 'wood', 'boat', 'fish', 'frog', 'rain', 'wave', 'blue', 'cool', 'fast', 'slow', 'park', 'tree', 'sun', 'sky', 'map', 'key', 'cat'];
    const PHRASES = ['go home', 'big fish', 'blue sky', 'swim fast', 'hot day', 'red boat', 'tall tree', 'good luck', 'see you', 'by bus', 'my duck', 'fly kite', 'cold rain', 'sit down', 'wake up', 'come on'];
    const LANES = [170, 126, 82];
    // 对岸的草地只有上面 38 高（再往下是泥边和水）：牌子、鸭妈妈、过来的小鸭都站在草上；右上角是按钮板；第几关那一行挪到这边岸上右边
    const DUCKS = 5, QX = 16, QY = 204, START = { x: 140, y: 200 }, MOM = { x: 76, y: 22 };
    let logs = [], duck = null, queue = DUCKS, home = 0, gone = [], buf = '', sel = null, bar = null, bad = 0;
    const words = () => (G.set.long ? PHRASES : WORDS);
    function makeLogs() {
      logs = [];
      const used = [];
      LANES.forEach((y, li) => {
        const dir = li % 2 ? -1 : 1, sp = (8 + G.set.speed * 3) * G.lvf() * dir;
        for (let k = 0; k < 2; k++) {
          const word = OS.pick(words().filter(w => used.indexOf(w) < 0)); used.push(word);
          const w = Math.max(84, word.length * 9.5 + 30);
          logs.push({ lane: li, x: k * 170 + rnd(0, 50), y, w, vx: sp, word });
        }
      });
    }
    function nextDuck() {
      buf = ''; clearSel();
      if (queue <= 0) {
        duck = null;
        if (home > 0) G.pass(); else G.lose(L.riverLoseAll);
        return;
      }
      queue--;
      duck = { lane: -1, x: START.x, y: START.y, log: null, off: 0, jump: 0 };
    }
    function reset() { queue = DUCKS; home = 0; gone = []; makeLogs(); nextDuck(); paintBar(); }
    function clearSel() { sel = null; if (bar) bar.noTiles(); }
    const targets = () => (!duck ? [] : duck.lane >= 2 ? [{ bank: true, word: L.home }] : logs.filter(l => l.lane === duck.lane + 1));
    function land(t) {
      K.sfx('ysDing');
      clearSel(); buf = '';
      if (t.bank) { home++; G.score += 5; K.sfx('ysWin'); nextDuck(); paintBar(); return; }
      G.score++;
      duck.lane = t.lane; duck.log = t; duck.off = Math.max(-30, Math.min(30, duck.x - (t.x + t.w / 2))); duck.jump = 0.3;
      paintBar();
    }
    function typed(ch) {
      const next = buf + ch;
      const ts = targets().filter(t => t.word.indexOf(next) === 0);
      if (!ts.length) { buf = ''; bad = 0.3; K.sfx('ysErr'); paintBar(); return false; }
      buf = next; K.sfx('ysKey');
      const full = ts.find(t => t.word === buf);
      if (full) land(full); else paintBar();
      return true;
    }
    function selectTarget(t) {
      clearSel();
      sel = t; buf = '';
      bar.tiles({ next: () => (sel ? sel.word[buf.length] : null), hit: ch => { if (!sel || ch !== sel.word[buf.length]) { K.sfx('ysErr'); bad = 0.3; paintBar(); return false; } buf += ch; K.sfx('ysKey'); if (buf === sel.word) land(sel); else paintBar(); return true; }, pool: () => (G.set.long ? 'abcdefghijklmnopqrstuvwxyz ' : 'abcdefghijklmnopqrstuvwxyz') });
      paintBar();
    }
    // 下面打字栏：点了哪根木头就显示那个词，打过的变色；没点就显示你正在打的
    function paintBar() {
      if (!bar) return;
      const t = sel || targets().find(q => buf && q.word.indexOf(buf) === 0);
      if (t) bar.set(buf, t.word[buf.length] || '', t.word.slice(buf.length + 1), bad > 0);
      else bar.set(buf, '', '', bad > 0);
    }
    function fall() { gone.push({ x: duck.x, y: duck.y, t: 0, dir: duck.log ? Math.sign(duck.log.vx) : 1 }); K.sfx('ysSplash'); nextDuck(); paintBar(); }
    // 小鸭：river-duck.webp（Codex 原稿里那只大的小鸭）——第 1 格从上往下看、头朝对岸（过河、排队、被冲走都用它），第 2 格开心蹦起来（到了鸭妈妈身边）
    //   2026-11-24 作者：原来 32 像素的小鸭太像素感、脸朝着我们看不出是往上走
    function duckSpr(c, im, x, y, k, jump, happy, spin) {
      const dk = img('river-duck');
      if (dk) {
        const cs = dk.height, sz = 32 * k * (jump ? 1.18 : 1);
        c.save(); c.translate(x, y); if (spin) c.rotate(spin);
        c.drawImage(dk, happy ? cs : 0, 0, cs, cs, -sz / 2, -sz / 2, sz, sz);
        c.restore();
        return;
      }
      if (im) spr(c, im, jump ? 160 : 128, 240, 32, 32, x, y, k);
      else {
        c.save(); c.translate(x, y); c.scale(k, k);
        c.fillStyle = '#ffd23a'; c.beginPath(); c.ellipse(0, 4, 10, 8, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(6, -3, 6, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#f08a1a'; c.beginPath(); c.moveTo(11, -4); c.lineTo(17, -2); c.lineTo(11, 0); c.fill();
        c.fillStyle = '#222'; c.beginPath(); c.arc(8, -5, 1.3, 0, Math.PI * 2); c.fill();
        c.restore();
      }
    }
    return {
      reset,
      noGoOn: true,
      timeUp: () => G.lose(L.riverLoseTime),
      ready() { bar = inputBar(G); makeLogs(); queue = DUCKS; home = 0; gone = []; duck = { lane: -1, x: START.x, y: START.y, log: null, off: 0, jump: 0 }; queue--; paintBar(); },
      destroy: () => clearSel(),
      ended: () => { clearSel(); buf = ''; paintBar(); },
      tick(dt) {
        logs.forEach(l => { l.x += l.vx * dt; if (l.vx > 0 && l.x > W + 10) l.x = -l.w - 10; if (l.vx < 0 && l.x < -l.w - 10) l.x = W + 10; });
        if (duck && duck.log) {
          duck.x = duck.log.x + duck.log.w / 2 + duck.off; duck.y = duck.log.y;
          if (duck.x < 6 || duck.x > W - 6) fall();
        }
        if (duck && duck.jump > 0) duck.jump -= dt;
        gone.forEach(g => { g.t += dt; });
        gone = gone.filter(g => g.t < 2);
        if (bad > 0) { bad -= dt; if (bad <= 0) paintBar(); }
      },
      key(ch) { if ((ch >= 'a' && ch <= 'z') || (ch === ' ' && G.set.long)) typed(ch); },
      tap(x, y) {
        const t = targets().find(q => (q.bank ? y < 50 && x < 165 : Math.abs(q.y - y) < 16 && x > q.x - 6 && x < q.x + q.w + 6));
        if (t) selectTarget(t);
      },
      draw(c) {
        const im = img('river'), bg = img('river-bg');
        if (bg) c.drawImage(bg, 0, 0, W, H);
        else if (im) dI(c, im, 0, 0, 320, 240, 0, 0, W, H);
        else {
          c.fillStyle = '#3d9a4a'; c.fillRect(0, 0, W, 52); c.fillRect(0, 196, W, 44);
          c.fillStyle = '#2b78c8'; c.fillRect(0, 52, W, 144);
        }
        // 对岸：鸭妈妈 + 牌子，过来的小鸭挨着她站
        const atTop = duck && duck.lane >= 2;
        // （2026-11-24 作者：鸭妈妈在水里、拼贴感太重——站到草地上，脚下加影子，牌子做成木牌插在地上）
        const shadow = (x, y, rx) => { c.fillStyle = 'rgba(20,50,0,.35)'; c.beginPath(); c.ellipse(x, y, rx, rx * 0.25, 0, 0, Math.PI * 2); c.fill(); };
        shadow(31, 37, 5);
        c.fillStyle = '#6a3e12'; c.fillRect(29.5, 22, 3, 15);
        const sg = c.createLinearGradient(0, 9, 0, 23); sg.addColorStop(0, '#ecc884'); sg.addColorStop(1, '#c08a44');
        c.fillStyle = sg; rrect(c, 8, 9, 46, 14, 2.5); c.fill(); c.strokeStyle = '#6a3e12'; c.lineWidth = 1.2; c.stroke();
        c.fillStyle = '#5a3410'; c.beginPath(); c.arc(11.5, 12.5, 0.9, 0, 7); c.arc(50.5, 12.5, 0.9, 0, 7); c.fill();
        letter(c, 31, 16.5, L.home, 11, atTop ? (sel && sel.bank ? '#ffd94a' : '#ff5a3a') : '#fff3d0', 2.5);
        shadow(MOM.x, 37.5, 11);
        const mom = img('river-mom');
        if (mom) c.drawImage(mom, MOM.x - 16, MOM.y - 16, 32, 32); else duckSpr(c, im, MOM.x, MOM.y, 1, false);
        for (let k = 0; k < home; k++) { shadow(98 + k * 14, 37.5, 6.5); duckSpr(c, im, 98 + k * 14, 28, 0.62, false, true); }
        logs.forEach(l => {
          if (im) dI(c, im, 0, 240, 128, 32, l.x, l.y - 14, l.w, 28);
          else { c.fillStyle = '#8a5a2a'; rrect(c, l.x, l.y - 11, l.w, 22, 10); c.fill(); }
          const next = duck && l.lane === duck.lane + 1, mine = sel === l || (buf && next && l.word.indexOf(buf) === 0);
          const tw = l.word.length * 8.6 + 10;
          c.fillStyle = next ? '#fff' : 'rgba(255,255,255,.55)'; c.fillRect(l.x + l.w / 2 - tw / 2, l.y - 8, tw, 16);
          c.strokeStyle = '#333'; c.lineWidth = 0.8; c.strokeRect(l.x + l.w / 2 - tw / 2, l.y - 8, tw, 16);
          c.font = 'bold 14px Arial, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
          let x0 = l.x + l.w / 2 - c.measureText(l.word).width / 2;
          const doneN = mine ? buf.length : 0;
          c.fillStyle = '#1aa83a'; c.fillText(l.word.slice(0, doneN), x0, l.y + 0.5);
          x0 += c.measureText(l.word.slice(0, doneN)).width;
          c.fillStyle = next ? (mine ? '#d4261c' : '#111') : '#888'; c.fillText(l.word.slice(doneN), x0, l.y + 0.5);
          c.textBaseline = 'alphabetic';
        });
        // 被冲走的小鸭
        gone.forEach(g => { c.globalAlpha = Math.max(0, 1 - g.t / 2); duckSpr(c, im, g.x + g.dir * g.t * 40, g.y + Math.sin(g.t * 8) * 2, 0.9, false, false, g.t * g.dir * 4); c.globalAlpha = 1; });
        // 岸边排队的
        for (let k = 0; k < queue; k++) { shadow(QX + k * 17, QY + 14, 6.5); duckSpr(c, im, QX + k * 17, QY + 4, 0.7, false); }
        if (duck) { const jy = duck.jump > 0 ? -Math.sin(duck.jump / 0.3 * Math.PI) * 10 : 0; duckSpr(c, im, duck.x, duck.y - 8 + jy, 1, duck.jump > 0); }
        outline(c, 314, 206, L.lv(G.level) + '　' + timeStr(G) + '　' + home + ' / ' + DUCKS, 10, '#fff', 'right');
      },
      face(c, x, y) { duckSpr(c, img('river'), x, y + 2, 1.6, false, true); }
    };
  };
  /* ---------- 班主任抓逃课 ---------- */
  // 环路（地图 640×480 上的拐点，首尾相接；Codex 的地图来了用它给的 chase-route.txt）
  let ROUTE = [[60, 60], [300, 60], [300, 130], [420, 130], [420, 60], [580, 60], [580, 240], [500, 240], [500, 420], [300, 420], [300, 330], [180, 330], [180, 420], [60, 420], [60, 240], [120, 240], [120, 150], [60, 150]];
  fetch(K.ART + 'chase-route.txt').then(r => (r.ok ? r.text() : '')).then(t => {
    const pts = t.split(/\r?\n/).map(l => l.split(',').map(Number)).filter(p => p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]));
    if (pts.length > 8) ROUTE = pts;
  }).catch(() => {});
  function buildRoute() {
    const segs = [];
    let s = 0, line = 0, lineAng = null;
    ROUTE.forEach((p, i) => {
      const q = ROUTE[(i + 1) % ROUTE.length], len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (len < 0.01) return;
      const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      if (lineAng === null || Math.abs(Math.atan2(Math.sin(ang - lineAng), Math.cos(ang - lineAng))) > 0.12) { line++; lineAng = ang; }
      segs.push({ a: p, b: q, s0: s, len, ang, line });
      s += len;
    });
    return { segs, len: s };
  }
  // 选择页的课文：第一篇就是游戏文件夹里的课文.txt（能拿记事本改）；后面几篇是新写的
  const ARTS = [
    ['课文.txt', null],
    ['My Computer', 'My computer is old and slow. It makes a loud noise when it starts. My father says it is a good computer. I say it is a good heater. Every night it plays music for me, but only one song.'],
    ['The Rainy Day', 'It rains all day. Nobody can play outside. We sit by the window and count the cars. A red car, a blue car, a bus. Then the bell rings and the rain stops. Of course it does.'],
    ['The Small Shop', 'There is a small shop near our school. It sells pens, candy and cold drinks. The old man in the shop knows every student. He also knows who is not in class right now.'],
    ['Sports Day', 'On sports day the whole school is on the field. I run the long race. I am not the fastest, but I do not stop. My friends shout my name. The teacher shouts my name too. I think I forgot my homework.']
  ];
  GAMES.chase = G => {
    let R = buildRoute(), LEN = R.len;
    const STEP = 11, CATCH = 12, SIGHT = 260, BELL = 180, ZOOM = 0.85;
    const aiV = () => 10 + G.set.speed * 2.5;
    const wrap = s => ((s % LEN) + LEN) % LEN;
    const fwd = (a, b) => wrap(b - a);
    const gap = (a, b) => Math.min(fwd(a, b), fwd(b, a));
    function at(s) {
      s = wrap(s);
      const sg = R.segs.find(x => s >= x.s0 && s < x.s0 + x.len) || R.segs[0];
      const k = (s - sg.s0) / sg.len;
      return { x: sg.a[0] + (sg.b[0] - sg.a[0]) * k, y: sg.a[1] + (sg.b[1] - sg.a[1]) * k, seg: R.segs.indexOf(sg), line: sg.line, ang: sg.ang };
    }
    let role = 'teacher', art = 0, S = null, letters = '', page = null, bar = null, endInfo = null, lobbyT = 0, waitIv = 0, deco = 0, badT = 0;
    const tierOf = cpm => (cpm >= 260 ? 3 : cpm >= 160 ? 2 : cpm >= 80 ? 1 : 0);
    const lettersOf = i => (i === 0 ? K.lessonLetters() : ARTS[i][1].toLowerCase().replace(/[^a-z]/g, ''));
    function clearPage() { clearTimeout(lobbyT); clearInterval(waitIv); if (page) { page.remove(); page = null; } }
    function reset() {
      R = buildRoute(); LEN = R.len;
      letters = lettersOf(art);
      S = { T: BELL, sT: 0, sS: LEN * 0.085, dT: 1, dS: 1, startle: 0, cool: 0, idx: 0, aiTyped: 0, presses: [], pend: 0, crash: null, seen: 0 };
      endInfo = null;
      bar.show(true);
      bar.tiles({ next: () => (S && S.idx < letters.length ? letters[S.idx] : null), hit: ch => press(ch), repeat: true, pool: () => 'abcdefghijklmnopqrstuvwxyz' });
      paintBar();
    }
    function paintBar() { if (S) bar.set(letters.slice(Math.max(0, S.idx - 14), S.idx), letters[S.idx] || '', letters.slice(S.idx + 1, S.idx + 40), badT > 0); }
    const cpmNow = () => { const now = Date.now(); S.presses = S.presses.filter(t => now - t < 2000); return S.presses.length * 30; };
    function press(ch) {
      if (G.state !== 'play' || !S || S.crash) return false;
      if (ch !== letters[S.idx]) { K.sfx('ysErr'); badT = 0.3; paintBar(); return false; }
      S.idx++; S.pend += STEP; S.presses.push(Date.now());
      if (S.presses.length % 3 === 0) K.sfx('ysKey');
      paintBar();
      if (role === 'student' && S.idx >= letters.length) { G.score = Math.round(S.idx / 10) + Math.ceil(S.T); endGame(true, L.doneWin); }
      return true;
    }
    /* ----- 开场页 ----- */
    function titlePage() {
      clearPage();
      if (bar) { bar.noTiles(); bar.show(false); }
      S = null; endInfo = null;
      G.state = 'title'; G.hidePanel = true; G.repaint();
      const acts = [() => selectPage(), () => lobbyPage(), () => G.win.close()];
      page = el('div', { class: 'ysg-page ysg-ctitle' }, [
        el('div', { class: 'ysg-cbig', text: L.cTitle }),
        el('div', { class: 'ysg-cmenu' }, L.cMenu.map((t, i) => btn3(t, 'ysg-cmb', acts[i])))
      ]);
      G.ui.appendChild(page);
    }
    /* ----- 双人游戏：找主机，永远找不到人 ----- */
    function lobbyPage() {
      clearPage();
      G.state = 'lobby';
      const list = el('div', { class: 'ysg-llist' });
      const msg = el('div', { class: 'ysg-lmsg' });
      const refresh = () => { msg.textContent = L.lobbySearching; list.classList.add('busy'); clearTimeout(lobbyT); lobbyT = setTimeout(() => { msg.textContent = ''; list.classList.remove('busy'); }, 1700); };
      const join = () => { clearTimeout(lobbyT); list.classList.remove('busy'); msg.textContent = L.lobbyPick; K.sfx('ysErr'); };
      const create = () => {
        clearTimeout(lobbyT); list.classList.remove('busy'); msg.textContent = '';
        const t0 = Date.now();
        const dots = el('span', { class: 'ysg-ldots' }), waited = el('div', { class: 'ysg-lwaited', text: L.lobbyWaited(0) });
        const box = el('div', { class: 'ysg-lwait' }, [el('div', {}, [el('span', { text: L.lobbyWait }), dots]), waited, btn3(L.lobbyCancel, 'ysg-lb', () => { clearInterval(waitIv); box.remove(); })]);
        page.appendChild(box);
        clearInterval(waitIv);
        waitIv = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); dots.textContent = '.'.repeat(1 + (s * 2 + 1) % 6); waited.textContent = L.lobbyWaited(s); }, 500);
      };
      const acts = [create, join, refresh, () => titlePage()];
      page = el('div', { class: 'ysg-page ysg-lobby' }, [
        el('div', { class: 'ysg-lpanel' }, [el('div', { class: 'ysg-lhead' }, L.lobbyHead.map(t => el('span', { text: t }))), list, msg]),
        el('div', { class: 'ysg-lbtns' }, L.lobbyBtns.map((t, i) => btn3(t, 'ysg-lb', acts[i])))
      ]);
      G.ui.appendChild(page);
      refresh();
    }
    /* ----- 单人游戏：选人物、选课文、对手速度 ----- */
    function portrait(cv, who) {
      const c = cv.getContext('2d');
      c.clearRect(0, 0, cv.width, cv.height);
      const heads = img('chase-heads');
      if (heads) { const k = heads.height; c.drawImage(heads, who === 'teacher' ? 0 : k, 0, k, k, 0, 0, cv.width, cv.height); return; }
      const sheet = img('chase-run');
      const g = c.createRadialGradient(56, 56, 6, 56, 56, 56); g.addColorStop(0, who === 'teacher' ? '#ffd0c0' : '#c8dcff'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, 112, 112);
      if (sheet) dI(c, sheet, 0, who === 'teacher' ? 0 : 48, 48, 48, 8, 8, 96, 96);
    }
    function selectPage() {
      clearPage();
      G.state = 'select';
      const frames = ['teacher', 'student'].map(r => {
        const cv = el('canvas', { class: 'ysg-cwcv', width: '112', height: '112' });
        portrait(cv, r);
        const f = el('div', { class: 'ysg-cwho' + (role === r ? ' on' : '') }, [el('div', { class: 'ysg-chd', text: L.pickWho }), cv, el('div', { class: 'ysg-cwn', text: r === 'teacher' ? L.teacherN : L.studentN })]);
        f.addEventListener('click', () => { OS.sound.play('click'); role = r; frames.forEach(x => x.classList.toggle('on', x === f)); });
        return f;
      });
      const items = ARTS.map(([t], i) => {
        const it = el('div', { class: 'ysg-cli' + (i === art ? ' on' : ''), text: t });
        it.addEventListener('click', () => { OS.sound.play('click'); art = i; items.forEach(x => x.classList.toggle('on', x === it)); });
        return it;
      });
      const val = el('span', { class: 'ysg-sval', text: String(G.set.speed) });
      const r = el('input', { type: 'range', min: '1', max: '9', step: '1', class: 'ysg-range' });
      r.value = String(G.set.speed);
      r.addEventListener('input', () => { G.set.speed = +r.value; val.textContent = r.value; saveSet('chase', G.set); });
      page = el('div', { class: 'ysg-page ysg-csel' }, [
        el('div', { class: 'ysg-cleft' }, [
          el('div', { class: 'ysg-cwhos' }, frames),
          el('div', { class: 'ysg-cbox ysg-cspd' }, [el('div', { class: 'ysg-chd', text: L.aiSpeed }), el('div', { class: 'ysg-srow' }, [r, val])]),
          el('div', { class: 'ysg-cbox ysg-chow' }, [el('div', { class: 'ysg-chd', text: L.howTo }), el('div', { class: 'ysg-chowt', text: L.howText })])
        ]),
        el('div', { class: 'ysg-cbox ysg-cright' }, [el('div', { class: 'ysg-chd', text: L.pickText }), el('div', { class: 'ysg-clist' }, items)]),
        el('div', { class: 'ysg-cgo' }, [btn3(L.cGo, 'ysg-cgb', () => { clearPage(); G.hidePanel = false; G.startRun(); }), btn3(L.cCancel, 'ysg-cgb', () => titlePage())])
      ]);
      G.ui.appendChild(page);
    }
    /* ----- 结局：整屏一张大画 ----- */
    function endGame(won, msg) {
      if (!S || endInfo) return;
      G.keepBest();
      bar.noTiles(); bar.show(false);
      G.state = 'end'; G.hidePanel = true; G.repaint();
      K.sfx(won ? 'ysWin' : 'ysLose');
      endInfo = { won, msg, who: role, t: 0 };
      clearPage();
      const k1 = btn3(L.endKeys[0], 'ysg-ckey', () => restart()), k2 = btn3(L.endKeys[1], 'ysg-ckey', () => titlePage());
      page = el('div', { class: 'ysg-page ysg-cend' }, [el('div', { class: 'ysg-cendt', text: msg }), el('div', { class: 'ysg-cends', text: L.score(G.score) + '　' + (G.newBest ? L.newBest : L.best(best('chase'))) }), el('div', { class: 'ysg-ckeys' }, [k1, k2])]);
      G.ui.appendChild(page);
    }
    function restart() { clearPage(); G.hidePanel = false; G.startRun(); }
    // 同桌来教改课文（第一次打开；没登抠抠就等登上再发）
    let tellIv = 0;
    function tell() {
      if (OS.save.get('ysCheatTold', false) || !OS.koukou || !OS.koukou.receive) return;
      const tryIt = () => {
        if (OS.save.get('ysCheatTold', false)) { clearInterval(tellIv); return; }
        if (!OS.koukou.receive('deskmate', L.deskmate[0])) return;
        OS.save.set('ysCheatTold', true);
        clearInterval(tellIv);
        setTimeout(() => OS.koukou.receive('deskmate', L.deskmate[1]), 2500);
      };
      setTimeout(tryIt, 4000);
      tellIv = setInterval(tryIt, 15000);
    }
    OS.on('desktop:reset', () => clearInterval(tellIv));
    function crash(p) {
      S.crash = { x: p.x, y: p.y, ang: p.ang, t: 0, cam: { x: S.cam ? S.cam.x : p.x, y: S.cam ? S.cam.y : p.y } };
      G.state = 'crash';
      bar.noTiles();
      K.sfx('mbCharge');
    }
    function smash() {
      const w = G.win.el;
      w.classList.add('ysg-shake');
      K.sfx('ysGlass');
      const r = G.cv.getBoundingClientRect(), wr = w.getBoundingClientRect();
      const px = S.crash.sx / W * r.width + r.left - wr.left, py = S.crash.sy / H * r.height + r.top - wr.top;
      const glass = el('div', { class: 'ysg-smash' });
      if (img('smash')) { glass.style.backgroundImage = 'url(' + K.ART + 'smash.webp)'; glass.classList.add('art'); }
      else {
        const lines = Array.from({ length: 14 }, (_, k) => { const a = k / 14 * Math.PI * 2 + Math.random() * 0.3, len = 60 + Math.random() * 160; return '<path d="M' + px + ' ' + py + ' L' + (px + Math.cos(a) * len * 0.5 + Math.random() * 10) + ' ' + (py + Math.sin(a) * len * 0.5) + ' L' + (px + Math.cos(a) * len) + ' ' + (py + Math.sin(a) * len) + '" />'; }).join('');
        glass.innerHTML = '<svg width="100%" height="100%"><g stroke="#fff" stroke-width="1.6" fill="none" opacity=".9">' + lines + '<circle cx="' + px + '" cy="' + py + '" r="22" /><circle cx="' + px + '" cy="' + py + '" r="44" stroke-dasharray="6 5"/></g></svg>';
      }
      w.appendChild(glass);
      for (let k = 0; k < 8; k++) {
        const sh = el('i', { class: 'ysg-shard' });
        sh.style.left = px + 'px'; sh.style.top = py + 'px';
        sh.style.setProperty('--dx', (Math.random() * 260 - 130) + 'px'); sh.style.setProperty('--dy', (Math.random() * 200 - 40) + 'px'); sh.style.setProperty('--r', (Math.random() * 540 - 270) + 'deg');
        w.appendChild(sh);
      }
      setTimeout(() => { if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD); }, 1300);
    }
    function sees() {
      const ps = at(S.sS), pt = at(S.sT);
      if (ps.line !== pt.line) return false;
      const ahead = S.dS > 0 ? fwd(S.sS, S.sT) : fwd(S.sT, S.sS);
      return ahead > 0 && ahead < SIGHT;
    }
    function miniMap(c, im) {
      const mw = 72, mh = 54, x0 = W - mw - 4, y0 = 4, k = mw / 640;
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(x0 - 2, y0 - 2, mw + 4, mh + 4);
      if (im) c.drawImage(im, x0, y0, mw, mh); else { c.fillStyle = '#7cc46a'; c.fillRect(x0, y0, mw, mh); }
      c.strokeStyle = '#fff'; c.lineWidth = 1; c.strokeRect(x0 + 0.5, y0 + 0.5, mw - 1, mh - 1);
      [['teacher', S.sT, '#e8321e'], ['student', S.sS, '#2a7cf0']].forEach(([who, sv, col]) => {
        const p = at(sv);
        c.fillStyle = col; c.beginPath(); c.arc(x0 + p.x * k, y0 + p.y * k, 2.6, 0, Math.PI * 2); c.fill();
        if (who === role) { c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.beginPath(); c.arc(x0 + p.x * k, y0 + p.y * k, 4.5, 0, Math.PI * 2); c.stroke(); }
      });
    }
    function drawRunner(c, p, who, tier, dir, k) {
      const sheet = img('chase-run');
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.ang + (dir < 0 ? Math.PI : 0));
      if (k) c.scale(k, k);
      if (sheet) {
        const f = tier * 2 + (Math.floor(G.t * 6) % 2);
        dI(c, sheet, f * 48, who === 'teacher' ? 0 : 48, 48, 48, -24, -24, 48, 48);
      } else {
        const col = who === 'teacher' ? '#d83a2a' : '#2a6ad8';
        if (tier === 3) { c.fillStyle = '#ccc'; c.beginPath(); c.moveTo(22, 0); c.lineTo(-10, -9); c.lineTo(-10, 9); c.fill(); }
        else if (tier === 2) { c.fillStyle = col; c.fillRect(-14, -9, 28, 18); }
        else if (tier === 1) { c.strokeStyle = '#333'; c.lineWidth = 2; c.beginPath(); c.arc(-9, 0, 5, 0, Math.PI * 2); c.arc(9, 0, 5, 0, Math.PI * 2); c.stroke(); }
        c.fillStyle = col; c.beginPath(); c.arc(0, 0, 8, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 8, 0, Math.PI * 2); c.stroke();
      }
      c.restore();
    }
    function mapAll(c, tint) {
      const im = img('chase-map');
      c.save(); c.scale(0.5, 0.5);
      if (im) c.drawImage(im, 0, 0, 640, 480);
      else { c.fillStyle = '#7cc46a'; c.fillRect(0, 0, 640, 480); }
      c.restore();
      // 整张染成一个颜色（开场页金黄、选择页暗灰），像那几年的游戏菜单底图
      if (tint) { c.save(); c.globalCompositeOperation = 'color'; c.fillStyle = tint; c.fillRect(0, 0, W, H); c.restore(); }
    }
    // 结局四张：班主任赢 ／ 逃课生赢 ／ 班主任输 ／ 逃课生输（Codex 的 chase-end.webp 一排四张，还没来就先用代码画的）
    function endScene(c) {
      const e = endInfo;
      e.t += 1 / 60;
      const n = e.who === 'teacher' ? (e.won ? 0 : 2) : (e.won ? 1 : 3);
      const art = img('chase-end');
      if (art) { const cw = art.width / 4; c.drawImage(art, n * cw, 0, cw, art.height, 0, 0, W, H); return; }
      if (e.won) {
        c.fillStyle = '#f7a21a'; c.fillRect(0, 0, W, H);
        c.save(); c.translate(W / 2, H / 2 + 10); c.rotate(e.t * 0.3);
        for (let k = 0; k < 16; k++) { c.rotate(Math.PI / 8); c.fillStyle = k % 2 ? 'rgba(255,240,160,.55)' : 'rgba(255,200,60,.35)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(260, -26); c.lineTo(260, 26); c.fill(); }
        c.restore();
      } else {
        c.fillStyle = '#0b0f26'; c.fillRect(0, 0, W, H);
        for (let k = 0; k < 60; k++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + (k % 5) / 8) + ')'; c.fillRect((k * 97) % W, (k * 53) % H, 1.2, 1.2); }
      }
      const p = { x: W / 2, y: H / 2 + 6, ang: -Math.PI / 2 };
      drawRunner(c, p, e.who, e.won ? 0 : 0, 1, 2.6);
    }
    return {
      panel: true,
      buttons: ['pause'],
      timed: false,
      exit() { titlePage(); },
      ready() { bar = inputBar(G); bar.show(false); tell(); titlePage(); },
      reset,
      destroy() { if (bar) bar.noTiles(); clearInterval(tellIv); clearPage(); },
      ended() { titlePage(); },
      special(key) {
        if (G.state === 'end') { if (key === 'Enter') restart(); else titlePage(); return true; }
        if (key === 'Escape' && (G.state === 'play' || G.state === 'pause' || G.state === 'select' || G.state === 'lobby')) { titlePage(); return true; }
        return false;
      },
      idle(dt) { deco += dt; if (badT > 0) badT -= dt; },
      key(ch) { const ok = press(ch); const t = bar && bar.t; if (t) { if (ok) t.ok(); else t.miss(); t.render(); } },
      tick(dt) {
        if (S.crash) return;
        if (badT > 0) { badT -= dt; if (badT <= 0) paintBar(); }
        S.T -= dt;
        const cpm = cpmNow();
        const before = role === 'teacher' ? S.sT : S.sS;
        const mv = Math.min(S.pend, S.pend * Math.min(1, dt * 14) + 1);
        S.pend -= mv;
        if (role === 'teacher') S.sT = wrap(S.sT + S.dT * mv); else if (S.startle <= 0) S.sS = wrap(S.sS + S.dS * mv);
        if (role === 'teacher') { if (S.startle <= 0) S.sS = wrap(S.sS + S.dS * aiV() * dt); S.aiTyped += aiV() / STEP * dt; }
        else S.sT = wrap(S.sT + S.dT * aiV() * dt);
        const f = fwd(S.sT, S.sS), b = fwd(S.sS, S.sT);
        if (S.dT > 0 && b < f - LEN * 0.08) S.dT = -1; else if (S.dT < 0 && f < b - LEN * 0.08) S.dT = 1;
        if (S.startle > 0) { S.startle -= dt; if (S.startle <= 0) { S.dS = -S.dS; S.cool = 1.2; } }
        else if (S.cool > 0) S.cool -= dt;
        else if (sees()) { S.startle = 0.5; S.seen = 0.9; K.sfx('pop'); }
        if (S.seen > 0) S.seen -= dt;
        if (gap(S.sS, S.sT) < CATCH) {
          G.score = role === 'teacher' ? Math.ceil(S.T) + Math.round(S.idx / 10) : Math.round(S.idx / 10);
          endGame(role === 'teacher', role === 'teacher' ? L.caughtWin : L.caughtLose); return;
        }
        if (S.T <= 0) { K.sfx('ysBell'); G.score = Math.round(S.idx / 10); endGame(role === 'student', role === 'student' ? L.bellWin : L.bellTeacher); return; }
        if (role === 'teacher' && S.aiTyped >= letters.length) { G.score = Math.round(S.idx / 10); endGame(false, L.doneLose); return; }
        const me = role === 'teacher' ? S.sT : S.sS;
        if (cpm >= 900 && at(before).line !== at(me).line) crash(at(before + (role === 'teacher' ? S.dT : S.dS) * 0.01));
      },
      draw(c) {
        if (G.state === 'title') {
          mapAll(c, '#ffb81a');
          const heads = img('chase-heads');
          if (heads) { const k = heads.height; c.drawImage(heads, 0, 0, k, k, 6, 6 + Math.sin(deco * 2) * 2, 96, 96); c.drawImage(heads, k, 0, k, k, 214, 64 + Math.cos(deco * 2) * 2, 96, 96); }
          else { drawRunner(c, { x: 56, y: 56, ang: -Math.PI / 2 }, 'teacher', 0, 1, 2.2); drawRunner(c, { x: 262, y: 112, ang: -Math.PI / 2 }, 'student', 0, 1, 2.2); }
          return;
        }
        if (G.state === 'lobby' || G.state === 'select') { mapAll(c, '#3a4458'); c.fillStyle = 'rgba(10,14,24,.55)'; c.fillRect(0, 0, W, H); return; }
        if (G.state === 'end' && endInfo) { endScene(c); return; }
        const im = img('chase-map');
        const playing = !!S;
        const Z = playing ? ZOOM : 0.5;
        let cx = 320, cy = 240;
        if (playing) {
          const me = S.crash ? S.crash.cam : at(role === 'teacher' ? S.sT : S.sS);
          const hx = W / 2 / Z, hy = H / 2 / Z;
          const tx = Math.max(hx, Math.min(640 - hx, me.x));
          let ty = Math.max(hy, Math.min(480 - hy, me.y + 14));
          // 2026-11-24 作者：左上角的路牌挡住人了——到了地图边上镜头也再多走一点，人在画面里总在 64–172 这一段（躲开上面的路牌、小地图、下课铃那行和下面的打字栏）
          const sy = (me.y - ty) * Z + H / 2;
          if (sy < 64) ty = me.y - (64 - H / 2) / Z; else if (sy > 172) ty = me.y - (172 - H / 2) / Z;
          if (!S.cam) S.cam = { x: tx, y: ty };
          S.cam.x += (tx - S.cam.x) * 0.25; S.cam.y += (ty - S.cam.y) * 0.25;
          cx = S.cam.x; cy = S.cam.y;
        }
        c.fillStyle = '#5a9e1a'; c.fillRect(0, 0, W, H);   // 地图外面露出来的一小条：跟地图边上的草一个颜色
        c.save();
        c.translate(W / 2, H / 2); c.scale(Z, Z); c.translate(-cx, -cy);
        if (im) c.drawImage(im, 0, 0, 640, 480);
        else {
          c.fillStyle = '#7cc46a'; c.fillRect(0, 0, 640, 480);
          c.strokeStyle = '#b8bcc4'; c.lineWidth = 22; c.lineJoin = 'round'; c.beginPath();
          ROUTE.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke();
        }
        if (S) {
          const cpm = cpmNow();
          const tierMe = tierOf(cpm), tierAi = tierOf(aiV() / STEP * 60);
          const crashTeacher = S.crash && role === 'teacher', crashStudent = S.crash && role === 'student';
          if (!crashTeacher) drawRunner(c, at(S.sT), 'teacher', role === 'teacher' ? tierMe : tierAi, S.dT);
          if (!crashStudent) drawRunner(c, at(S.sS), 'student', role === 'student' ? tierMe : tierAi, S.dS);
          if (S.crash) {
            S.crash.t += 1 / 60;
            const d = S.crash.t * 520;
            const p = { x: S.crash.x + Math.cos(S.crash.ang) * d, y: S.crash.y + Math.sin(S.crash.ang) * d, ang: S.crash.ang };
            drawRunner(c, p, role, 3, 1);
            const sx = (p.x - cx) * Z + W / 2, sy = (p.y - cy) * Z + H / 2;
            if (!S.crash.boom && (sx < -6 || sx > W + 6 || sy < -6 || sy > H + 6)) { S.crash.boom = true; S.crash.sx = Math.max(0, Math.min(W, sx)); S.crash.sy = Math.max(0, Math.min(H, sy)); smash(); }
          }
          if (S.seen > 0 && !S.crash) { const p = at(S.sS); letter(c, p.x, p.y - 30, L.see, 26, '#ff3'); }
        }
        c.restore();
        if (S) {
          miniMap(c, im);
          const cpm = cpmNow();
          c.fillStyle = 'rgba(0,0,0,.5)'; rrect(c, 92, 4, 148, 16, 8); c.fill();
          text(c, 166, 12.5, L.chaseInfo(Math.max(0, Math.ceil(S.T)), cpm) + '　' + L.tiers[tierOf(cpm)], 8.5, '#fff', 'center');
        }
      }
    };
  };

  // 打字游戏那页左边的预览：那个游戏的画面
  function preview(id, c, w, h) {
    c.save();
    c.scale(w / W, h / H);
    const bg = img(id + '-bg');
    const im = img({ nap: 'nap', egg: 'egg', earth: 'earth', river: 'river', chase: 'chase-map' }[id]);
    if (bg) c.drawImage(bg, 0, 0, W, H);
    else if (!im) { c.fillStyle = THEME[id].col; c.fillRect(0, 0, W, H); }
    else if (id === 'nap') dI(c, im, 40, 0, 400, 300, 0, 0, W, H);
    else if (id === 'chase') dI(c, im, 0, 0, 640, 480, 0, 0, W, H);
    else dI(c, im, 0, 0, 320, 240, 0, 0, W, H);
    c.restore();
  }

  OS.yinshanGames = { list: LIST, theme: THEME, open, best, preview, closeAll: () => wins.forEach(G => { if (!G.win.isClosed) G.win.close(); }) };
})();
