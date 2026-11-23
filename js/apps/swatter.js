/* 弹窗杀手（原名弹窗苍蝇拍）
   号称专杀弹窗。打开先“扫描”，没扫到弹窗，就自己生一堆 2003 年前后真有的弹窗给你拍。
   电脑上鼠标变成苍蝇拍；手机上点哪儿拍哪儿。拍死的弹窗在显示器上留一滩印子，右键桌面“刷新”才擦得掉。
   10 种弹窗，各有当年的毛病：
     网页广告：私服页游（拍两下）、飘浮广告（满屏斜着飘、碰边反弹）、对联广告（两边都拍掉才算）、短信铃声
     浏览器弹的：装插件提示（拍一下=点了“是”，屏幕顶上多一条工具栏）、浏览器崩溃（拍一下开始发送错误报告）、
                 脚本错误（一出就是 3 个）、主页被改（拍掉还会回来两次）
     恶作剧网页：关不掉的对话框（你是猪吗？一个接一个）、按钮会跑（“不是”躲着你，躲 3 次才拍得到）
   拍够一轮，最后冒出杀手自己的插件“弹窗杀手 VIP 版”；拍下去 = 杀手把自己拍死，程序关闭，桌面图标被拍扁一阵子。
   蓝屏彩蛋：屏幕上同时堆到 30 个弹窗 → POPUP_OVERFLOW。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.swatter;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  const NAME = '弹窗杀手';
  const VERSION = NAME + ' v1.0';
  const DB = '病毒库：2003-04-01';
  const ST_SCAN = '正在扫描弹窗…… ';
  const ST_NONE = '未发现弹窗。\n为方便您体验本产品，已为您生成弹窗。';
  const ST_VIRUS = '发现病毒 1 个：keygen_helper.exe\n本软件只杀弹窗，不杀病毒。';   // 中了 ABCSee 注册机的毒
  const ST_FIGHT = '正在查杀……';
  const ST_LAST = '只剩最后一个了。';
  const ST_QUIT = '啊！你作弊！';
  const SELF_KILL = n => '查杀完毕：共拍死弹窗杀手在内的 ' + n + ' 个弹窗，\n是我杀了我？';   // n 已经算上杀手自己
  const SQUASHED = '弹窗杀手重新安装中，\n请稍后再试。';
  const PROPS = s => '类型：杀毒软件（自称）\n' + DB + '\n累计拍死弹窗：' + s.kills + ' 个';
  // 重启时开机自检要修的
  const FIX_SQUASH = '正在重新安装弹窗杀手';
  const FIX_SMUDGE = '保洁阿姨正在擦显示器';

  const BUDGET = 36;                               // 一轮一共冒多少个弹窗（连带冒出来的不算）
  const GAP_START = 1500, GAP_MIN = 550, GAP_STEP = 30;   // 冒弹窗的间隔：越来越快（毫秒）
  const OVERFLOW = 30;                             // 屏幕上同时堆到这么多就蓝屏
  const SQUASH_MS = 20000;                         // 图标被拍扁多久
  const BSOD = { id: 'swatter', name: 'POPUP_OVERFLOW', text: '你的不奔腾都要冒烟了，电脑烫得可以煎鸡蛋。' };

  /* ---------- 10 种弹窗的字 ---------- */
  // 1 私服页游广告：拍两下，挨一下战士举刀怒吼
  const SWORD = { title: '今日新开 - 网页浏览器', tag: '今日新开', big: '屠龙宝刀', line: '点击就送！', btn: '进入游戏', hurt: '是兄弟就来砍我！' };
  // 2 飘浮广告：没有标题栏，满屏斜着飘、碰边反弹
  const FLOAT = { big: 'ADSL 宽带', line: '包月每月只要 120 元！', btn: '立即申请', close: '关闭' };
  const FLOAT_SPEED = 48;
  // 3 对联广告：屏幕左右两边各竖一条，两边都拍掉才算一个
  const COUPLET = { left: '今日新区火爆开启', right: '万人同服等你来战', close: '关闭' };
  // 4 短信铃声
  const SMS = { title: '铃声图片下载 - 网页浏览器', head: '手机铃声图片下载', songs: ['老鼠爱大米', '两只蝴蝶', '冲动的惩罚'], send: '发送 1 到 9XXXX' };
  // 5 装插件提示：拍一下 = 点了“是”，屏幕顶上多一条工具栏
  const ACTIVEX_TITLE = '安全警告';
  const ACTIVEX_Q = p => '是否安装并运行由「' + p.pub + '」发布的「' + p.name + '」？';
  const ACTIVEX_PUB = p => '发布者：' + p.pub;
  const PLUGINS = [
    { pub: '赛博中医馆', name: '在线把脉助手' },
    { pub: '阳寿余额查询', name: '阳寿搜霸' },
    { pub: '2027暴富秘籍', name: '暴富工具条' },
    { pub: '开机检测器 Pro', name: '开机伴侣' },
    { pub: '电子蚊香', name: '驱蚊上网助手' }
  ];
  const MAX_BARS = 4, BAR_H = 16, BAR_GO = '搜索';
  // 6 浏览器崩溃：拍一下开始发送错误报告，进度条走完自己关（再拍一下也行）
  const CRASH = {
    title: '网页浏览器', head: '网页浏览器遇到问题需要关闭。我们对此引起的不便表示抱歉。',
    note: '如果您正处于进程当中，信息有可能丢失。', send: '发送错误报告', nosend: '不发送', sending: '正在发送错误报告……'
  };
  const CRASH_SEND_MS = 2200;
  // 7 脚本错误：一出就是 3 个叠在一起
  const SCRIPT = { title: '网页错误', head: '此页上有错误，可能会导致它无法正常运行。', detail: '行：1　字符：1　错误：缺少对象', q: '是否继续运行此页上的脚本？' };
  const SCRIPT_PACK = 3;
  // 8 主页被改：拍掉过一会儿又回来，回来两次
  const HOME = {
    title: '主页设置',
    lines: ['您的主页已被设为：', '您的主页已被改回：', '您的主页又被改回：'],
    urls: ['www.baofu2027.com', 'www.yangshou.net', 'www.zhongyi-bamai.cn']
  };
  const HOME_BACK_MS = 1500;
  // 9 关不掉的对话框：拍掉一个，原地冒下一个
  const PIG_TITLE = '来自网页的消息';
  const PIG = ['你是猪吗？', '承认了吧。', '再点也还是猪。', '好吧，你赢了。'];
  // 10 按钮会跑：要拍“不是”，它躲 3 次才拍得到
  const CRUSH = { title: '小调查 - 网页浏览器', q: '你是不是暗恋我？', yes: '是', no: '不是', smug: '我就知道！', tired: '跑不动了' };
  const CRUSH_FLEES = 3;
  // 结尾：杀手自己的插件
  const VIP = { pub: NAME, name: NAME + ' VIP 版' };

  const KINDS = [['sword', 12], ['float', 10], ['couplet', 6], ['sms', 12], ['activex', 12], ['crash', 10], ['script', 9], ['homepage', 10], ['pig', 9], ['crush', 10]];

  const stats = () => Object.assign({ runs: 0, kills: 0, wins: 0, overflows: 0 }, OS.save.get('swatter', {}));
  const saveStats = s => OS.save.set('swatter', s);

  /* ---------- Codex 画的素材（assets/popups，每张横排几帧）。SPR 是一半大小，乘 Z 是显示大小；图片本身是显示大小的 2 倍 ---------- */
  const DIR = 'assets/popups/';
  const SPR = {   // 名字: [每帧宽, 每帧高, 帧数]
    warrior: [28, 32, 3], flames: [64, 10, 3], dragon: [16, 48, 2], phone: [18, 26, 2],
    rocket: [24, 18, 2], heart: [12, 11, 2], swatter: [20, 20, 1], splat: [16, 16, 3]
  };
  const Z = 2;
  function preload() { Object.keys(SPR).forEach(n => { const im = new Image(); im.src = DIR + n + '.webp'; }); }
  function sprite(name, cls, k) {
    const [w, h, n] = SPR[name];
    const z = Z * (k || 1);
    const d = el('div', { class: 'pp-sp' + (cls ? ' ' + cls : '') });
    Object.assign(d.style, {
      width: w * z + 'px', height: h * z + 'px',
      backgroundImage: 'url(' + DIR + name + '.webp)', backgroundSize: (w * n * z) + 'px ' + (h * z) + 'px'
    });
    d.frame = i => { d.style.animation = 'none'; d.style.backgroundPosition = (-i * w * z) + 'px 0'; };
    d.loop = (from, count, fps) => {
      d.style.backgroundPosition = (-from * w * z) + 'px 0';
      d.style.setProperty('--from', (-from * w * z) + 'px');
      d.style.setProperty('--to', (-(from + count) * w * z) + 'px');
      d.style.animation = 'nfFrames ' + (count / fps).toFixed(2) + 's steps(' + count + ') infinite';
    };
    return d;
  }

  let game = null;             // 同一时间只有一局
  let popLayer = null, glass = null, swatEl = null, swatHide = 0;
  let squashedUntil = 0;

  function layers() {
    if (popLayer) return;
    const root = OS.stage.el;
    popLayer = el('div', { id: 'popups', class: 'layer' });
    glass = el('div', { id: 'smudges', class: 'layer' });   // 显示器玻璃上：拍痕和苍蝇拍都画在这一层
    root.appendChild(popLayer);
    root.appendChild(glass);
    OS.on('desktop:refresh', wipe);
    OS.on('bsod', () => endGame('bsod'));
    OS.on('desktop:reset', () => { endGame('reset'); wipe(); unsquash(); });   // 重启：拍痕擦掉、扁了的图标恢复
  }

  /* ---------- 打开：扫描 → 自己生弹窗 → 开拍 ---------- */
  app.open = function () {
    if (Date.now() < squashedUntil) { OS.ui.dialog({ title: NAME, icon: 'warn', text: SQUASHED }); return null; }
    layers();
    preload();
    const s = stats(); s.runs++; saveStats(s);
    const status = el('div', { class: 'sw-status', text: ST_SCAN + '0%' });
    const fill = el('div', { class: 'sw-fill' });
    const bar = el('div', { class: 'sw-bar' }, [fill]);
    const killsEl = el('span', { text: '已拍死：0' });
    const onEl = el('span', { text: '屏幕上：0' });
    const nums = el('div', { class: 'sw-nums hide' }, [killsEl, onEl]);
    const content = el('div', { class: 'sw' }, [
      el('div', { class: 'sw-head' }, [OS.iconEl(app.icon, 'sw-logo'), el('div', {}, [el('div', { class: 'sw-name', text: VERSION }), el('div', { class: 'sw-sub', text: DB })])]),
      status, bar, nums
    ]);
    const win = OS.wm.open({
      title: NAME, icon: app.icon, width: 230, appId: app.id, content, maximizable: false,
      onClose: () => endGame(game && game.won ? 'won' : 'closed')
    });

    const g = game = {
      win, status, killsEl, onEl, ads: new Set(), spawned: 0, kills: 0, gap: GAP_START,
      timers: [], pending: 0, bars: 0, raf: 0, over: false, won: false, vip: false, started: false
    };
    g.later = (fn, ms) => { const t = setTimeout(() => { if (game === g && !g.over) fn(); }, ms); g.timers.push(t); return t; };

    // 扫描进度条：一格一格走
    let pct = 0;
    const scan = () => {
      pct = Math.min(100, pct + 7 + Math.floor(Math.random() * 12));
      fill.style.width = pct + '%';
      status.textContent = ST_SCAN + pct + '%';
      if (pct < 100) { g.later(scan, 140); return; }
      g.later(() => {
        status.textContent = OS.virus && OS.virus.on() ? ST_VIRUS : ST_NONE;
        OS.sound.play('ding');
        g.later(() => {
          bar.classList.add('hide');
          nums.classList.remove('hide');
          status.textContent = ST_FIGHT;
          start(g);
        }, 1600);
      }, 300);
    };
    g.later(scan, 300);
    return win;
  };

  function start(g) {
    g.started = true;
    swatterOn();
    floatLoop(g);
    const tick = () => {
      if (g.spawned >= BUDGET) return;
      spawn(g.spawned === 0 ? 'sms' : g.spawned === 1 ? 'activex' : pickKind());   // 头两个是好拍的
      g.spawned++;
      g.gap = Math.max(GAP_MIN, g.gap - GAP_STEP);
      g.later(tick, g.gap * (0.7 + Math.random() * 0.6));
    };
    tick();
  }

  function pickKind() {
    const hasCouplet = [...game.ads].some(a => a.kind === 'couplet');
    const pool = KINDS.filter(k => k[0] !== 'couplet' || !hasCouplet);
    let r = Math.random() * pool.reduce((n, k) => n + k[1], 0);
    for (const k of pool) { r -= k[1]; if (r < 0) return k[0]; }
    return 'sms';
  }

  function refreshNums() {
    if (!game) return;
    game.killsEl.textContent = '已拍死：' + game.kills;
    game.onEl.textContent = '屏幕上：' + game.ads.size;
    game.onEl.classList.toggle('danger', game.ads.size >= OVERFLOW - 8);
  }

  /* ---------- 摆放 ---------- */
  // 能放弹窗的地方：去掉顶上装出来的工具栏
  function area() {
    const W = OS.stage.work, top = game ? game.bars * BAR_H : 0;
    return { x: W.x, y: W.y + top, w: W.w, h: W.h - top };
  }
  function underCapsule(x, y, w, h) {
    const c = OS.stage.capsule;
    return c && x < c.x + c.w && x + w > c.x && y < c.y + c.h && y + h > c.y;
  }
  function clampPos(x, y, w, h) {
    const A = area();
    return { x: OS.clamp(x, A.x + 1, A.x + A.w - w - 1), y: OS.clamp(y, A.y + 1, A.y + A.h - h - 1) };
  }
  function randomPos(w, h) {
    const A = area();
    let p;
    for (let i = 0; i < 8; i++) {
      p = { x: A.x + 2 + Math.random() * Math.max(0, A.w - w - 4), y: A.y + 2 + Math.random() * Math.max(0, A.h - h - 4) };
      if (!underCapsule(p.x, p.y, w, h)) break;
    }
    return p;
  }
  function centerPos(w, h) {
    const A = area();
    return { x: A.x + (A.w - w) / 2, y: A.y + (A.h - h) / 2 };
  }
  function moveTo(ad, x, y) {
    ad.x = x; ad.y = y;
    ad.el.style.left = x + 'px';
    ad.el.style.top = y + 'px';
  }

  /* ---------- 造弹窗 ---------- */
  // 带蓝色标题栏的小窗口
  function shell(title, cls, kids) {
    const body = el('div', { class: 'pop-body' }, kids);
    const node = el('div', { class: 'pop ' + cls }, [
      el('div', { class: 'pop-title' }, [el('span', { class: 'pop-tt', text: title }), el('span', { class: 'pop-x', text: '×' })]),
      body
    ]);
    return { node, body };
  }
  const dbtns = labels => el('div', { class: 'pd-btns' }, labels.map(t => el('span', { class: 'pop-dbtn', text: t })));

  const BUILD = {
    sword(ad) {
      ad.hp = 2;
      ad.warrior = sprite('warrior', 'pg-warrior');
      ad.warrior.loop(0, 2, 3);
      ad.lineEl = el('div', { class: 'pg-line', text: SWORD.line });
      ad.text = SWORD.big + '，' + SWORD.line;
      return shell(SWORD.title, 'k-sword', [
        el('div', { class: 'pg-row' }, [ad.warrior, el('div', { class: 'pg-txt' }, [
          el('div', { class: 'pg-tag', text: SWORD.tag }),
          el('div', { class: 'pg-big', text: SWORD.big }),
          ad.lineEl,
          el('span', { class: 'pg-btn', text: SWORD.btn })
        ])]),
        el('div', { class: 'pg-flames' })
      ]).node;
    },
    float(ad) {
      const r = sprite('rocket', 'pf-rocket');
      r.loop(0, 2, 6);
      ad.text = FLOAT.big + ' ' + FLOAT.line;
      return el('div', { class: 'pop k-float' }, [
        el('span', { class: 'pf-close', text: FLOAT.close }),
        el('div', { class: 'pf-row' }, [r, el('div', { class: 'pf-txt' }, [el('div', { class: 'pf-big', text: FLOAT.big }), el('div', { class: 'pf-line', text: FLOAT.line })])]),
        el('div', { class: 'pf-btn', text: FLOAT.btn })
      ]);
    },
    sms(ad) {
      const ph = sprite('phone', 'ps-phone');
      ph.loop(0, 2, 4);
      ad.text = SMS.head;
      return shell(SMS.title, 'k-sms', [
        el('div', { class: 'ps-head', text: SMS.head }),
        el('div', { class: 'ps-row' }, [ph, el('div', { class: 'ps-list' }, SMS.songs.map((s, i) => el('div', { text: (i + 1) + '. ' + s })))]),
        el('div', { class: 'ps-send', text: SMS.send })
      ]).node;
    },
    activex(ad) {
      ad.plug = ad.plug || OS.pick(PLUGINS);
      ad.text = ACTIVEX_Q(ad.plug);
      return shell(ACTIVEX_TITLE, 'k-dlg k-activex', [
        el('div', { class: 'pd-row' }, [OS.iconEl('shieldWarn', 'pd-ico'), el('div', { class: 'pd-text', text: ad.text })]),
        el('div', { class: 'pd-small', text: ACTIVEX_PUB(ad.plug) }),
        dbtns(['是', '否', '更多信息'])
      ]).node;
    },
    crash(ad) {
      ad.hp = 2;
      ad.text = CRASH.head;
      ad.low = el('div', { class: 'pr-low' }, [el('div', { text: CRASH.note }), dbtns([CRASH.send, CRASH.nosend])]);
      return shell(CRASH.title, 'k-dlg k-crash', [
        el('div', { class: 'pr-top' }, [OS.iconEl('error', 'pd-ico'), el('div', { class: 'pr-head', text: CRASH.head })]),
        ad.low
      ]).node;
    },
    script(ad) {
      ad.text = SCRIPT.head;
      return shell(SCRIPT.title, 'k-dlg k-script', [
        el('div', { class: 'pd-row' }, [OS.iconEl('warn', 'pd-ico'), el('div', { class: 'pd-text' }, [
          el('div', { text: SCRIPT.head }), el('div', { class: 'pd-small', text: SCRIPT.detail }), el('div', { text: SCRIPT.q })
        ])]),
        dbtns(['是', '否'])
      ]).node;
    },
    homepage(ad) {
      ad.url = ad.url || OS.pick(HOME.urls);
      ad.text = HOME.lines[ad.step] + ad.url;
      // 网址按下去就采集进 Internot Explorer 的地址栏（ie.js）；弹窗照样被拍
      const url = el('div', { class: 'ph-url', text: ad.url });
      url.addEventListener('pointerdown', e => { if ((e.button == null || e.button === 0) && OS.web) OS.web.collect(ad.url); });
      return shell(HOME.title, 'k-dlg k-home', [
        el('div', { class: 'pd-row' }, [OS.iconEl('info', 'pd-ico'), el('div', { class: 'pd-text' }, [el('div', { text: HOME.lines[ad.step] }), url])]),
        dbtns(['确定'])
      ]).node;
    },
    pig(ad) {
      ad.text = PIG[ad.step];
      return shell(PIG_TITLE, 'k-dlg k-pig', [
        el('div', { class: 'pd-row' }, [OS.iconEl('warn', 'pd-ico'), el('div', { class: 'pd-text pd-big', text: PIG[ad.step] })]),
        dbtns(['确定'])
      ]).node;
    },
    crush(ad) {
      const h = sprite('heart', 'pk-heart');
      h.loop(0, 2, 3);
      ad.text = CRUSH.q;
      ad.flees = 0;
      ad.qEl = el('div', { class: 'pk-q', text: CRUSH.q });
      ad.noBtn = el('span', { class: 'pop-dbtn pk-no', text: CRUSH.no });
      const s = shell(CRUSH.title, 'k-crush', [
        el('div', { class: 'pk-row' }, [h, ad.qEl]),
        el('span', { class: 'pop-dbtn pk-yes', text: CRUSH.yes }),
        ad.noBtn
      ]);
      ad.crushBody = s.body;
      // 要拍中“不是”才算；它会躲
      ad.noBtn.addEventListener('pointerdown', e => {
        if (e.button != null && e.button !== 0) return;
        e.stopPropagation();
        if (!game || game.over || ad.dead) return;
        if (ad.flees < CRUSH_FLEES) { flee(ad); OS.sound.play('thud'); return; }
        kill(ad);
      });
      // 电脑上：鼠标一靠近它就跑
      s.node.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse' || ad.dead || ad.flees >= CRUSH_FLEES) return;
        const r = ad.noBtn.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        if (d < r.width * 0.9) flee(ad);
      });
      return s.node;
    },
    vip(ad) {
      ad.plug = VIP;
      ad.text = ACTIVEX_Q(VIP);
      return shell(ACTIVEX_TITLE, 'k-dlg k-activex vip', [
        el('div', { class: 'pd-row' }, [OS.iconEl(app.icon, 'pd-ico pd-vip'), el('div', { class: 'pd-text', text: ad.text })]),
        el('div', { class: 'pd-small', text: ACTIVEX_PUB(VIP) }),
        dbtns(['是', '否', '更多信息'])
      ]).node;
    }
  };

  function spawn(kind, opt) {
    const g = game;
    if (!g || g.over) return null;
    opt = opt || {};
    // 脚本错误一出就是一串
    if (kind === 'script' && !opt.packed) {
      const base = randomPos(160, 100);
      for (let i = 0; i < SCRIPT_PACK; i++) spawn('script', { packed: true, at: { x: base.x + i * 10, y: base.y + i * 10 } });
      return null;
    }
    if (kind === 'couplet') return spawnCouplet();
    const ad = { kind, hp: 1, dead: false, step: opt.step || 0, url: opt.url };
    ad.el = BUILD[kind](ad);
    popLayer.appendChild(ad.el);
    ad.w = ad.el.offsetWidth; ad.h = ad.el.offsetHeight;
    const p = opt.at ? clampPos(opt.at.x, opt.at.y, ad.w, ad.h) : kind === 'vip' ? centerPos(ad.w, ad.h) : randomPos(ad.w, ad.h);
    moveTo(ad, p.x, p.y);
    if (kind === 'float') {
      ad.vx = FLOAT_SPEED * (Math.random() < 0.5 ? -1 : 1);
      ad.vy = FLOAT_SPEED * 0.7 * (Math.random() < 0.5 ? -1 : 1);
    }
    ad.el.addEventListener('pointerdown', e => {
      if (e.button != null && e.button !== 0) return;
      hit(ad);
    });
    OS.ui.onContext(ad.el, () => (ad.dead ? null : adMenu(ad)));
    return added(ad);
  }
  function added(ad) {
    const g = game;
    g.ads.add(ad);
    OS.sound.play('pop');
    refreshNums();
    if (g.ads.size >= OVERFLOW) overflow();
    return ad;
  }

  // 对联广告：屏幕左右两边各竖一条
  function spawnCouplet() {
    const A = area();
    const ad = { kind: 'couplet', dead: false, alive: 2, text: COUPLET.left + ' ／ ' + COUPLET.right };
    ad.halves = [COUPLET.left, COUPLET.right].map((text, i) => {
      const dragon = sprite('dragon', 'pc-dragon');
      dragon.loop(0, 2, 2);
      const node = el('div', { class: 'pop k-couplet' }, [
        el('div', { class: 'pc-close', text: COUPLET.close }),
        el('div', { class: 'pc-body' }, [dragon, el('div', { class: 'pc-text', text })])
      ]);
      popLayer.appendChild(node);
      const w = node.offsetWidth, h = node.offsetHeight;
      const half = { node, w, h, dead: false };
      half.x = i === 0 ? A.x + 2 : A.x + A.w - w - 2;
      half.y = A.y + Math.max(2, (A.h - h) / 2 - 10);
      if (i === 1 && underCapsule(half.x, half.y, w, h)) half.y = Math.max(half.y, OS.stage.capsule.y + OS.stage.capsule.h + 2);
      node.style.left = half.x + 'px';
      node.style.top = half.y + 'px';
      node.addEventListener('pointerdown', e => {
        if (e.button != null && e.button !== 0) return;
        hitHalf(ad, half);
      });
      OS.ui.onContext(node, () => (half.dead ? null : adMenu(ad)));
      return half;
    });
    ad.el = ad.halves[0].node;
    ad.x = ad.halves[0].x; ad.y = ad.halves[0].y; ad.w = ad.halves[0].w; ad.h = ad.halves[0].h;
    return added(ad);
  }

  /* ---------- 拍 ---------- */
  function hit(ad) {
    const g = game;
    if (!g || g.over || ad.dead) return;
    if (ad.kind === 'vip') { selfKill(ad); return; }
    if (ad.kind === 'crush') { smug(ad); return; }   // 拍窗口、拍“是”都没用
    if (ad.kind === 'sword' && ad.hp > 1) {
      ad.hp--;
      slapFx(ad);
      ad.warrior.frame(2);
      ad.lineEl.textContent = SWORD.hurt;
      return;
    }
    if (ad.kind === 'crash' && !ad.sending) { sendReport(ad); return; }
    kill(ad);
  }
  function slapFx(ad) {
    OS.sound.play('slap');
    ad.el.classList.remove('hit'); void ad.el.offsetWidth; ad.el.classList.add('hit');
  }

  // 浏览器崩溃：拍一下 = 发送错误报告，进度条走完自己关
  function sendReport(ad) {
    ad.sending = true;
    slapFx(ad);
    ad.low.textContent = '';
    ad.low.appendChild(el('div', { text: CRASH.sending }));
    ad.low.appendChild(el('div', { class: 'pr-bar' }, [el('div', { class: 'pr-fill' })]));
    game.pending++;
    game.later(() => { game.pending--; if (!ad.dead) kill(ad); }, CRASH_SEND_MS);
  }

  // 按钮会跑：“不是”跳到窗口里别的地方
  function flee(ad) {
    ad.flees++;
    const b = ad.crushBody, n = ad.noBtn;
    const maxX = b.clientWidth - n.offsetWidth - 4, maxY = b.clientHeight - n.offsetHeight - 4;
    const cx = n.offsetLeft, cy = n.offsetTop;
    let x, y;
    for (let i = 0; i < 8; i++) {
      x = 4 + Math.random() * Math.max(0, maxX - 4);
      y = 22 + Math.random() * Math.max(0, maxY - 22);
      if (Math.hypot(x - cx, y - cy) > 30) break;
    }
    n.style.left = x + 'px';
    n.style.top = y + 'px';
    if (ad.flees >= CRUSH_FLEES) { n.textContent = CRUSH.tired; n.classList.add('tired'); }
  }
  function smug(ad) {
    OS.sound.play('pop');
    ad.qEl.textContent = CRUSH.smug;
    clearTimeout(ad.smugT);
    ad.smugT = setTimeout(() => { if (!ad.dead) ad.qEl.textContent = CRUSH.q; }, 900);
  }

  function hitHalf(ad, half) {
    const g = game;
    if (!g || g.over || ad.dead || half.dead) return;
    half.dead = true;
    OS.sound.play('slap');
    smudge(half.x + half.w / 2, half.y + half.h / 2, 1);
    squashOut(half.node);
    if (--ad.alive <= 0) kill(ad, true);
  }

  function squashOut(node) {
    node.classList.add('dead');
    setTimeout(() => node.remove(), 320);
  }

  function kill(ad, quiet) {
    const g = game;
    ad.dead = true;
    g.ads.delete(ad);
    g.kills++;
    const s = stats(); s.kills++; saveStats(s);
    if (!quiet) {
      OS.sound.play('slap');
      smudge(ad.x + ad.w / 2, ad.y + ad.h / 2, 1);
      squashOut(ad.el);
    }
    // 拍完还有后续的
    if (ad.kind === 'activex') addToolbar(ad.plug);
    if (ad.kind === 'homepage' && ad.step < HOME.lines.length - 1) {
      g.pending++;
      g.later(() => { g.pending--; spawn('homepage', { step: ad.step + 1, url: ad.url }); }, HOME_BACK_MS);
    }
    if (ad.kind === 'pig' && ad.step < PIG.length - 1) {
      g.pending++;
      g.later(() => { g.pending--; spawn('pig', { step: ad.step + 1, at: { x: ad.x, y: ad.y } }); }, 220);
    }
    refreshNums();
    g.later(checkEnd, 300);
  }

  // 装插件：屏幕顶上多一条工具栏，越装越多，把屏幕挤小
  function addToolbar(plug) {
    const g = game;
    if (!g || g.bars >= MAX_BARS) return;
    const W = OS.stage.work;
    const bar = el('div', { class: 'pp-bar' }, [
      el('span', { class: 'pp-bar-grip' }), OS.iconEl('search', 'pp-bar-ico'),
      el('span', { class: 'pp-bar-name', text: plug.name }), el('span', { class: 'pp-bar-box' }), el('span', { class: 'pp-bar-go', text: BAR_GO })
    ]);
    Object.assign(bar.style, { left: W.x + 'px', top: (W.y + g.bars * BAR_H) + 'px', width: W.w + 'px', height: BAR_H + 'px' });
    popLayer.appendChild(bar);
    g.bars++;
    OS.sound.play('notify');
  }

  // 飘浮广告：斜着飘，碰边反弹
  function floatLoop(g) {
    let last = performance.now();
    const step = now => {
      if (game !== g || g.over) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const A = area();
      g.ads.forEach(ad => {
        if (ad.kind !== 'float' || ad.dead) return;
        let x = ad.x + ad.vx * dt, y = ad.y + ad.vy * dt;
        if (x < A.x) { x = A.x; ad.vx = Math.abs(ad.vx); } else if (x + ad.w > A.x + A.w) { x = A.x + A.w - ad.w; ad.vx = -Math.abs(ad.vx); }
        if (y < A.y) { y = A.y; ad.vy = Math.abs(ad.vy); } else if (y + ad.h > A.y + A.h) { y = A.y + A.h - ad.h; ad.vy = -Math.abs(ad.vy); }
        moveTo(ad, x, y);
      });
      g.raf = requestAnimationFrame(step);
    };
    g.raf = requestAnimationFrame(step);
  }

  // 一轮冒完、屏幕清空：杀手自己的插件登场
  function checkEnd() {
    const g = game;
    if (!g || g.vip || g.spawned < BUDGET || g.ads.size || g.pending) return;
    g.vip = true;
    g.status.textContent = ST_LAST;
    g.later(() => spawn('vip'), 900);
  }

  function selfKill(ad) {
    const g = game;
    ad.dead = true;
    g.ads.delete(ad);
    g.won = true;
    const s = stats(); s.wins++; saveStats(s);
    OS.sound.play('slap');
    smudge(ad.x + ad.w / 2, ad.y + ad.h / 2, 1.4);
    squashOut(ad.el);
    // 杀手的窗口也被拍扁，然后关掉
    g.win.el.classList.add('sw-flat');
    const n = g.kills + 1;   // 算上杀手自己
    setTimeout(() => {
      g.win.close();
      squashIcon();
      OS.ui.notify({ title: NAME, text: SELF_KILL(n), icon: 'info', replace: true, timeout: 6000 });
    }, 420);
  }

  // 桌面图标被拍扁一阵子
  let squashT = 0;
  function squashIcon() {
    squashedUntil = Date.now() + SQUASH_MS;
    OS.bootFix.add('swatter', FIX_SQUASH);
    const ic = document.querySelector('.dicon[data-app="swatter"]');
    if (!ic) return;
    ic.classList.add('squashed');
    clearTimeout(squashT);
    squashT = setTimeout(() => { unsquash(); OS.sound.play('pop'); }, SQUASH_MS);
  }
  function unsquash() {
    clearTimeout(squashT);
    squashedUntil = 0;
    OS.bootFix.remove('swatter');
    const ic = document.querySelector('.dicon[data-app="swatter"]');
    if (ic) ic.classList.remove('squashed');
  }

  function overflow() {
    const g = game;
    if (g.over) return;
    g.over = true;
    const s = stats(); s.overflows++; saveStats(s);
    setTimeout(() => OS.ui.bsod(BSOD), 400);
  }

  /* ---------- 结束一局：弹窗、工具栏全收走，拍痕留着 ---------- */
  function endGame(why) {
    const g = game;
    if (!g) return;
    game = null;
    g.over = true;
    g.timers.forEach(clearTimeout);
    cancelAnimationFrame(g.raf);
    const left = g.ads.size;
    if (popLayer) popLayer.textContent = '';
    swatterOff();
    if (why === 'closed' && g.started && (left || g.spawned < BUDGET)) {
      OS.ui.notify({ title: NAME, text: ST_QUIT, icon: 'info', replace: true, timeout: 4000 });
    }
  }

  /* ---------- 苍蝇拍：电脑上跟着鼠标走，手机上点哪儿出现在哪儿 ---------- */
  function swatterOn() {
    const root = OS.stage.el;
    root.classList.add('swatting');
    swatEl = sprite('swatter', 'swat');
    glass.appendChild(swatEl);
    root.addEventListener('pointermove', onMove, true);
    root.addEventListener('pointerdown', onDown, true);
    root.addEventListener('pointerleave', onLeave);
  }
  function swatterOff() {
    const root = OS.stage.el;
    root.classList.remove('swatting');
    root.removeEventListener('pointermove', onMove, true);
    root.removeEventListener('pointerdown', onDown, true);
    root.removeEventListener('pointerleave', onLeave);
    if (swatEl) { swatEl.remove(); swatEl = null; }
  }
  // 网兜中心（素材里大约 (7,7)，放大后 14,14）对准手指 / 鼠标
  function putSwat(e) {
    const p = OS.stage.toLocal(e.clientX, e.clientY);
    swatEl.style.left = (p.x - 14) + 'px';
    swatEl.style.top = (p.y - 14) + 'px';
    swatEl.classList.add('show');
  }
  function onMove(e) { if (e.pointerType === 'mouse' && swatEl) putSwat(e); }
  function onLeave() { if (swatEl) swatEl.classList.remove('show'); }
  function onDown(e) {
    if (!swatEl || (e.button != null && e.button !== 0)) return;
    putSwat(e);
    swatEl.classList.remove('swing'); void swatEl.offsetWidth; swatEl.classList.add('swing');
    const t = e.target;
    // 没拍到弹窗、拍在桌面上：拍到显示器玻璃
    if (t.closest && !t.closest('.pop') && t.closest('#desktop')) OS.sound.play('thud');
    clearTimeout(swatHide);
    if (e.pointerType !== 'mouse') swatHide = setTimeout(() => { if (swatEl) swatEl.classList.remove('show'); }, 450);
  }

  /* ---------- 拍痕：留在显示器上，刷新桌面才擦掉 ---------- */
  function smudge(x, y, k) {
    const m = sprite('splat', 'smudge', k * (0.85 + Math.random() * 0.3));
    m.frame(Math.floor(Math.random() * 3));
    m.style.left = (x - parseFloat(m.style.width) / 2) + 'px';
    m.style.top = (y - parseFloat(m.style.height) / 2) + 'px';
    m.style.transform = 'rotate(' + (Math.floor(Math.random() * 4) * 90) + 'deg)';
    glass.insertBefore(m, swatEl || null);
    OS.bootFix.add('smudge', FIX_SMUDGE);
  }
  function wipe() {
    OS.bootFix.remove('smudge');
    if (!glass) return;
    glass.querySelectorAll('.smudge').forEach(m => { m.classList.add('wipe'); setTimeout(() => m.remove(), 300); });
  }

  /* ---------- 弹窗上的右键菜单（照 IE 网页右键） ---------- */
  function adMenu(ad) {
    return [
      { label: '返回', disabled: true },
      { label: '前进', disabled: true },
      '-',
      { label: '刷新', action: () => { if (game && !ad.dead && ad.kind !== 'vip' && ad.kind !== 'couplet') spawn(ad.kind, { at: { x: ad.x + 12, y: ad.y + 12 }, step: ad.step, url: ad.url, packed: true }); } },
      { label: '添加到收藏夹…', action: say('添加到收藏夹', 'info', '已收藏。\n以后每次开机都给你弹一下。') },
      { label: '查看源文件', action: say('源文件', 'info', '<marquee>' + ad.text + '</marquee>\n\n就这一行，别看了。') },
      '-',
      { label: '属性', action: say('属性', 'info', '类型：弹窗\n大小：烦人\n来源：互联网的某个角落') }
    ];
  }

  // 调试用：开着一局时手动冒某种弹窗（?dev 面板 / 测试用）
  app.debugSpawn = kind => spawn(kind);

  /* ---------- 桌面图标右键：跟普通软件一样，属性换成杀手的 ---------- */
  app.menu = function () {
    const P = OS.menus.iconParts(app);
    return [
      P.open, '-', P.cut, P.copy, '-', P.shortcut, P.del, P.rename, '-',
      { label: '属性', action: () => OS.ui.dialog({ title: '「' + NAME + '」属性', icon: 'info', text: PROPS(stats()) }) }
    ];
  };
})();
