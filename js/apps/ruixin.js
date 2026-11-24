/* 瑞鑫杀毒软件 2003（瑞鑫杀毒-创意.md）——那几年的国产杀毒软件，桌面图标顶掉了赛博把脉那一格
   - 开机不自己启动：双击图标（或开始 ▸ 所有程序 ▸ 瑞鑫杀毒）才开；开了就有豹哥趴在任务栏上——它在，实时监控就开着
   - 豹哥（小金钱豹）：甩尾巴、舔爪子、打哈欠、伸懒腰，没人理就睡觉；能拖着走；点一下说一句，双击开主窗口，右键菜单
     查杀时叼放大镜巡逻 ／ 升级抱天线 ／ 发现病毒炸毛 ＋ 警报 ／ 杀掉叉腰 ／ 关了监控戴眼罩睡；第一次开时羊在，扑过去追羊
   - 主窗口：查杀病毒（扫的是"我的电脑"里真有的文件）／ 实时监控 ／ 升级（永远卡在 3%）／ 病毒百科（杀过的能重打）／ 设置
   - 病毒：瑞鑫只负责揪出来，杀要你自己打小游戏（ruixin-fight.js）；海葵（haikui.js）、注册机小绿虫（abcsee.js）
   - 拦截：开着监控时装海葵补丁、在注册机里点生成，先拦下来
   - 蓝屏：开着瑞鑫用弹窗杀手扫描，两边互相报毒，两个都点清除 → ANTIVIRUS_CIVIL_WAR
   OS.ruixin：running ／ guarding ／ intercept ／ met ／ open ／ quit ／ knockOut ／ plead ／ civilWar */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.ruixin;
  const NAME = '瑞鑫杀毒软件 2003';
  const ART = 'assets/ruixin/';

  /* ================= 文案 ================= */
  const L = {
    tabs: [['scan', '查杀病毒', 'search'], ['mon', '实时监控', 'shield'], ['up', '升级', 'globe'], ['dex', '病毒百科', 'bug'], ['set', '设置', 'control']],
    slogan: '有豹哥在，毒不敢来。',
    status: (mon, last) => '病毒库：2003.12.01　实时监控：' + (mon ? '已开启' : '已关闭') + '　上次查杀：' + last + '　试用版：剩余 30 天',
    never: '从未',
    // 查杀
    targets: [['mem', '内存'], ['boot', '引导区'], ['c', '本地磁盘 (C:)'], ['d', '光盘 (D:)'], ['docs', '我的文档']],
    scanBtn: '开始查杀', stopBtn: '停止',
    scanning: '正在扫描：', idle: '选好要扫的地方，点"开始查杀"。',
    count: (n, v, t) => '已扫描 ' + n + ' 个文件　发现病毒 ' + v + ' 个　用时 ' + t,
    clean: '查杀完毕，未发现病毒。\n豹哥有点失望。',
    stopped: '查杀已停止。',
    doneKilled: n => '查杀完毕：发现病毒 ' + n + ' 个，已清除 ' + n + ' 个。',
    doneLeft: '查杀完毕：病毒还在。\n它在你的电脑里，等着你。',
    sus: '可疑程序：',
    suspects: {
      sheep: 'sheep.exe：可疑行为：会吃掉你的文件。\n经鉴定：是壁纸上的羊。已忽略。',
      debt: '欠条打印专家.exe：疑似流氓软件：会把你欠的钱打印出来。\n这不叫流氓，这叫诚实。已忽略。',
      swatter: '弹窗杀手.exe：发现同行。已忽略。',
      toolbar: '海葵工具条：经鉴定：不是病毒，是合法软件。\n您安装时点了"同意"。已忽略。'
    },
    memItems: ['内存：explorer.exe', '内存：svchost.exe', '内存：csrss.exe', '内存：winlogon.exe', '内存：抠抠2003.exe', '内存：sheep.exe'],
    bootItems: ['引导区：硬盘主引导记录', '引导区：C: 分区引导记录'],
    // 发现病毒
    foundTitle: '瑞鑫实时监控', foundScan: '瑞鑫杀毒',
    found: (v, file, outbreak) => '发现病毒！\n病毒名：' + v.name + '\n' + (file ? '文件：' + file + '\n' : '') + '危险等级：' + stars(v.stars) + (outbreak ? '\n病毒正在发作！' : ''),
    kill: '手动查杀', letIn: '放它进来', later: '稍后再说',
    // 监控
    monOn: '实时监控 已开启', monOff: '实时监控 已关闭', monRows: ['文件监控', '网页监控', '抠抠监控'], ok: '正常', off: '已关闭',
    monTip: '打开时，豹哥替你盯着；关掉以后，它就戴上眼罩睡觉。', logCap: '拦截记录：', noLog: '还没有拦截过什么。',
    logLine: (time, v, src) => time + '　拦截：' + v + '　来源：' + src,
    // 升级
    upBtn: '立即升级', upSteps: ['正在拨号……', '正在连接升级服务器……', '正在下载病毒库 3%……'], upFail: '升级失败：升级服务器正在升级。',
    upCur: '当前病毒库：2003.12.01', upTip: '病毒库是 2003 年 12 月的，比你的作业新。',
    // 百科
    dexCap: '杀过的病毒都在这里。点一下看看。', unknown: '？？？', runaway: '在逃', dead: '已消灭', notMet: '未遇到',
    dexRows: v => ['病毒名：' + v.name, '俗名：' + v.nick, '危险等级：' + stars(v.stars), '从哪来：' + v.from],
    dexStat: d => ['状态：' + (d.beaten ? '已消灭' : d.met ? '在逃' : '未遇到')].concat(d.beaten ? ['第一次用时：' + mmss(d.first), '最快用时：' + mmss(d.best), '杀过：' + d.kills + ' 次'] : []),
    again: '再打一次', back: '返回',
    // 设置
    setRows: [['floppy', '开机检查软盘'], ['alarm', '发现病毒时响警报'], ['pet', '显示豹哥']],
    floppyDone: '检查完毕：A 盘里没有软盘。',
    soundCap: '警报声音：', sounds: [['didu', '嘀嘟嘀嘟'], ['roar', '嗷呜'], ['mute', '静音']],
    // 关于
    about: '瑞鑫杀毒软件 2003\n有豹哥在，毒不敢来。\n试用版，剩余 30 天。\n(C) ' + OS.YEAR + ' 无聊科技',
    // 豹哥
    pokes: ['今天也没有病毒，豹哥有点无聊。', '不要乱点陌生链接。你点了我也拦不住你。', '病毒库是 2003 年 12 月的，比你的作业新。', '那只羊，下次一定追到。', () => '你上次查杀是' + (lastScanText() === L.never ? '"从未"' : lastScanText()) + '。'],
    wake: '……嗯？有病毒？没有？那我接着睡了。',
    noChase: '没有追到。', glare: '……',
    menu: { open: '打开瑞鑫', quick: '快速查杀', mon: '实时监控', up: '升级', hide: '藏起豹哥', show: '叫豹哥出来', quit: '退出瑞鑫' },
    winSay: v => v.nick + '已清除。',
    // 卸载
    pleadTitle: '添加或删除程序', plead: '真的要卸载瑞鑫吗？\n卸了以后，就没有人替你挡病毒了。', pleadYes: '狠心卸载', pleadNo: '算了',
    // 两个杀毒软件打架
    warRx: '发现同行：弹窗杀手.exe\n要清除它吗？', warSw: '发现弹窗：豹哥\n要清除它吗？', clear: '清除', ignore: '忽略',
    warFail: '清除失败：对方也是杀毒软件。'
  };
  const BSOD_WAR = { id: 'ruixin', name: 'ANTIVIRUS_CIVIL_WAR', text: '两个杀毒软件为了谁才是老大打了起来。\n你的电脑是战场。' };
  // 病毒（以后加病毒：这里加一条，ruixin-fight.js 里加它的玩法）
  const VIRUS = {
    haikui: { name: 'Worm.Haikui.a', nick: '海葵', stars: 1, from: '网上邻居\\隔壁大学生\\电影', file: '海葵抠抠2003显IP版.exe', proc: 'haikui_update.exe',
      blurb: '躲在抠抠补丁里，靠给好友群发消息传播。', comment: '海里长的东西，跑到电脑里来干什么。' },
    keygen: { name: 'Trojan.Keygen.b', nick: '注册机小绿虫', stars: 2, from: '网上邻居\\隔壁大学生\\电影', file: 'ABCSee3.1注册机.exe', proc: 'keygen_helper.exe',
      blurb: '躲在注册机里，想把你的电脑整个接管了。', comment: '想白嫖软件，先被软件白嫖了。' }
  };
  const ORDER = ['haikui', 'keygen'];
  const DEX_SLOTS = 4;   // 百科里先摆 4 格，后两格是问号（以后的病毒）

  const stars = n => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  const mmss = ms => { const s = Math.max(0, Math.round((ms || 0) / 1000)); return OS.pad2(Math.floor(s / 60)) + ':' + OS.pad2(s % 60); };

  /* ================= 存档 ================= */
  const KEY = 'ruixin', DEX = 'rxDex';
  const S = Object.assign({ alarm: true, pet: true, floppy: true, sound: 'didu', lastScan: 0, log: [] }, OS.save.get(KEY, {}));
  const persist = () => OS.save.set(KEY, S);
  const dex = () => OS.save.get(DEX, {});
  const dexOf = vid => Object.assign({ met: false, beaten: false, first: 0, best: 0, kills: 0 }, dex()[vid]);
  function setDex(vid, o) { const d = dex(); d[vid] = Object.assign(dexOf(vid), o); OS.save.set(DEX, d); }
  const lastScanText = () => {
    if (!S.lastScan) return L.never;
    const d = new Date(S.lastScan);
    return (d.getMonth() + 1) + '-' + d.getDate() + ' ' + OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes());
  };
  // 老存档：赛博把脉在桌面上那一格让给瑞鑫
  (function () {
    const pos = OS.save.get('iconPos', {});
    if (pos.pulse && !pos.ruixin) { pos.ruixin = pos.pulse; delete pos.pulse; OS.save.set('iconPos', pos); }
  })();

  /* ================= 状态 ================= */
  const R = { running: false, monitor: true, hidden: false, win: null, chased: false, scan: null, fighting: false, tray: null, view: null };

  function start() {
    if (R.running) return;
    R.running = true; R.monitor = true; R.hidden = !S.pet;
    petCreate();
    OS.emit('ruixin:start');
  }
  function quit() {
    if (!R.running) return;
    stopScan();
    if (R.win && !R.win.isClosed) R.win.close();
    R.running = false;
    trayOff();
    petLeave();
    OS.emit('ruixin:stop');
  }
  // 开机：本来不自己启动；超级秃子 ▸ 魔法设置 ▸ 启动程序 里勾上了（rxBoot）才自己跑起来
  OS.on('desktop:ready', () => {
    setTimeout(() => {
      if (OS.boot.state !== 'desktop' || R.running || !OS.save.get('rxBoot', false)) return;
      if (OS.soft && !OS.soft.has('ruixin')) return;
      start();
    }, 2000);
  });
  // 重启：豹哥不在了（开机不自己启动）
  OS.on('desktop:reset', () => {
    stopScan();
    if (R.win && !R.win.isClosed) R.win.close();
    R.running = false; R.chased = false;
    trayOff();
    petRemove();
  });
  const guarding = () => R.running && R.monitor;
  function setMonitor(on) {
    R.monitor = on;
    petMood();
    refreshMain();
  }

  /* ================= 豹哥 ================= */
  // baoge.webp：6 列 × 4 行，每格 112；脚底在格子里 y 104；画面朝左，往右走就翻过来
  const F = { sit: [0, 1], lick: [2, 3], yawn: 4, stretch: 5, sleep: [6, 7], mask: 8, walk: [9, 10], antenna: 11, bristle: 12, hips: 13, dangle: [14, 15], run: [16, 17], shield: 18, fall: 21, hug: 22, wave: 23 };
  const SIZE = 58, FOOT = SIZE * 104 / 112;   // 2026-11-24 作者：太小了，放大
  // 每一格单独缩放（以脚底为中心），让豹哥各个姿势看着一样大（2026-11-24 作者：各个动作大小不统一）
  //   趴着睡（6–8）、炸毛（12）原图占满格子显得大 → 缩一点；跑（16/17）、被拎着（14/15）、抱大腿（22）显得小 → 放大一点
  const FK = [1, 1, 1, 1, 1, 1.02, .93, .93, .93, 1, 1, .97, .93, 1.05, 1.1, 1.1, 1.12, 1.12, 1, 1, 1.03, .98, 1.06, 1];
  const P = { el: null, img: null, x: 0, foot: 0, flip: false, state: 'idle', t: 0, act: null, actT: 0, nextAct: 4, poke: 0, timer: 0, goal: null, onArrive: null, down: null, clickT: 0, clickTimer: 0, bubble: null, zz: null };
  let layer = null;
  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    layer = el('div', { id: 'rx-layer', class: 'layer' });
    OS.stage.el.appendChild(layer);
    return layer;
  }
  const home = () => { const st = OS.stage; return { x: st.W - st.insets.r - 86, foot: st.H - st.TASKBAR_H + 1 }; };
  function petCreate() {
    ensureLayer();
    petRemove();
    P.img = el('i');
    P.zz = el('span', { class: 'rx-zz', text: 'Zzz' });
    P.el = el('div', { class: 'rx-pet jump' }, [P.img, P.zz, el('span', { class: 'rx-bang', text: '!' })]);
    layer.appendChild(P.el);
    const h = home();
    P.x = h.x; P.foot = h.foot; P.flip = false; P.poke = Date.now(); P.act = null; P.nextAct = 3;
    setState('idle');
    place();
    setTimeout(() => P.el && P.el.classList.remove('jump'), 600);
    P.el.addEventListener('pointerdown', petDown);
    OS.ui.onContext(P.el, () => petMenu());
    clearInterval(P.timer);
    P.timer = setInterval(petTick, 150);
    if (R.hidden) { P.el.style.display = 'none'; trayOn(); }
    // 羊在的话：扑过去追羊（一次开机只追一回）
    setTimeout(() => { if (R.running && !R.chased && !R.hidden && OS.desktop.sheepHere && OS.desktop.sheepHere()) chaseSheep(); }, 900);
  }
  function petRemove() {
    clearInterval(P.timer);
    if (P.el) P.el.remove();
    P.el = null;
    sayOff();
  }
  function petLeave() {
    if (!P.el) return;
    setState('wave');
    sayOff();
    const node = P.el;
    clearInterval(P.timer);
    setTimeout(() => node.classList.add('leave'), 700);
    setTimeout(() => { node.remove(); if (P.el === node) P.el = null; }, 1200);
  }
  function place() {
    if (!P.el) return;
    P.el.style.left = (P.x - SIZE / 2) + 'px';
    P.el.style.top = (P.foot - FOOT) + 'px';
  }
  function frame(i) {
    if (!P.img) return;
    P.img.style.backgroundPosition = ((i % 6) * 20) + '% ' + (Math.floor(i / 6) * 100 / 3) + '%';
    P.img.style.scale = String(FK[i] || 1);
    P.el.classList.toggle('flip', P.flip);
  }
  function setState(s) {
    P.state = s; P.t = 0; P.act = null;
    if (!P.el) return;
    P.el.classList.toggle('sleeping', s === 'sleep');
    P.el.classList.toggle('alarm', s === 'alarm');
    petTick(true);
  }
  // 平时的心情：监控关着就戴眼罩睡
  function petMood() { if (P.el && ['idle', 'sleep', 'off'].indexOf(P.state) >= 0) setState(R.monitor ? 'idle' : 'off'); }
  function petTick(now) {
    if (!P.el) return;
    if (now !== true) P.t += 0.15;
    const t = P.t, alt = (a, sp) => a[Math.floor(t / sp) % a.length];
    switch (P.state) {
      case 'idle': {
        if (Date.now() - P.poke > 90000) { setState('sleep'); return; }
        if (!P.act) {
          P.nextAct -= now === true ? 0 : 0.15;
          frame(alt(F.sit, 0.6));
          if (P.nextAct <= 0) { P.act = OS.pick(['lick', 'lick', 'yawn', 'stretch']); P.actT = 0; }
        } else {
          P.actT += now === true ? 0 : 0.15;
          if (P.act === 'lick') frame(F.lick[Math.floor(P.actT / 0.3) % 2]);
          else frame(F[P.act]);
          if (P.actT > (P.act === 'lick' ? 1.8 : 1.2)) { P.act = null; P.nextAct = 3 + Math.random() * 5; }
        }
        break;
      }
      case 'sleep': frame(alt(F.sleep, 0.8)); break;
      case 'off': frame(F.mask); break;
      case 'scan': {
        frame(alt(F.walk, 0.3));
        const h = home(), dir = P.flip ? 1 : -1;
        P.x += dir * 4;
        if (P.x < h.x - 70) P.flip = true;
        if (P.x > h.x) P.flip = false;
        place();
        break;
      }
      case 'upgrade': frame(F.antenna); break;
      case 'alarm': frame(F.bristle); break;
      case 'win': frame(F.hips); if (t > 3) setState(R.monitor ? 'idle' : 'off'); break;
      case 'drag': frame(alt(F.dangle, 0.15)); break;
      case 'fall': frame(F.fall); if (t > 1.1) { setState(R.monitor ? 'idle' : 'off'); say(L.glare); } break;
      case 'wave': frame(F.wave); break;
      case 'hug': frame(F.hug); break;
      case 'run': {
        frame(alt(F.run, 0.15));
        if (P.goal) {
          const dx = P.goal.x - P.x, dy = P.goal.foot - P.foot, d = Math.hypot(dx, dy), step = (P.goal.speed || 150) * 0.15;
          P.flip = dx > 0;
          if (d <= step) { P.x = P.goal.x; P.foot = P.goal.foot; P.goal = null; place(); const f = P.onArrive; P.onArrive = null; if (f) f(); }
          else { P.x += dx / d * step; P.foot += dy / d * step; place(); }
        }
        break;
      }
    }
  }
  function runTo(x, foot, speed, then) { setState('run'); P.goal = { x, foot, speed }; P.onArrive = then; }
  // 扑过去追羊：羊吓跑出桌面，豹哥跟着追出去，10 秒后自己溜达回来
  // 2026-11-24 作者：原来豹哥先冲出屏幕、羊才跑，莫名其妙。改成：看见羊 → 悄悄摸到羊左边 → 炸毛一吼、往前一扑 → 羊吓得往右跑 → 豹哥跟在羊屁股后面追出去
  //   羊逃跑的动画：先蹦一下、转身（大约 0.35 秒），再往右跑 260 像素（大约 1.15 秒）；豹哥比它稍慢一点，跟在后面
  function chaseSheep() {
    const r = OS.desktop.sheepRect && OS.desktop.sheepRect();
    if (!r || !P.el) return;
    R.chased = true;
    sayOff();
    const fx = r.x - SIZE * 0.28, ff = r.y + r.h * 0.95;
    runTo(fx, ff, 110, async () => {
      if (!P.el) return;
      P.flip = true;                       // 脸朝羊
      setState('alarm'); P.flip = true; frame(F.bristle);
      OS.sound.play('rxRoar');
      await new Promise(res => setTimeout(res, 550));
      if (!P.el) return;
      P.el.classList.add('pounce');        // 往前一扑
      setState('run'); P.flip = true;
      await new Promise(res => setTimeout(res, 180));
      if (OS.desktop.scareSheep) OS.desktop.scareSheep();
      await new Promise(res => setTimeout(res, 420));
      if (!P.el) return;
      P.el.classList.remove('pounce');
      runTo(OS.stage.W + SIZE, P.foot, 170, () => {
        if (!P.el) return;
        P.el.style.display = 'none';
        setTimeout(() => {
          if (!P.el || !R.running) return;
          if (!R.hidden) P.el.style.display = '';
          const h = home();
          P.x = OS.stage.W + 30; P.foot = h.foot; place();
          runTo(h.x, h.foot, 60, () => { setState(R.monitor ? 'idle' : 'off'); P.flip = false; frame(0); say(L.noChase); });
        }, 10000);
      });
    });
  }

  /* ---------- 豹哥说话：头上冒一个黄色小气泡 ---------- */
  function say(text, ms) {
    if (!P.el || R.hidden || P.el.style.display === 'none') return;
    sayOff();
    const st = OS.stage;
    const b = P.bubble = el('div', { class: 'say-bubble rx-say', text: typeof text === 'function' ? text() : text });
    document.getElementById('balloons').appendChild(b);
    b.style.left = OS.clamp(P.x - 130, st.insets.l + 4, st.W - st.insets.r - 154) + 'px';   // 先摆到大概的位置再量宽高
    const left = OS.clamp(P.x - b.offsetWidth + 24, st.insets.l + 4, st.W - st.insets.r - b.offsetWidth - 4);
    const below = P.foot - FOOT - b.offsetHeight - 10 < st.TICKER_H;
    b.style.left = left + 'px';
    b.style.top = (below ? P.foot + 6 : P.foot - FOOT - b.offsetHeight - 6) + 'px';
    b.style.setProperty('--tail', (P.x - left) + 'px');
    b.classList.add(below ? 'below' : 'above');
    b.addEventListener('click', sayOff);
    const node = b;
    setTimeout(() => { if (P.bubble === node) sayOff(); }, ms || 4200);
  }
  function sayOff() { if (P.bubble) { const b = P.bubble; P.bubble = null; b.classList.add('out'); setTimeout(() => b.remove(), 250); } }

  /* ---------- 拖、点、双击 ---------- */
  function petDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();
    const p = OS.stage.toLocal(e.clientX, e.clientY);
    P.down = { x: p.x, y: p.y, px: P.x, pf: P.foot, moved: false, id: e.pointerId };
  }
  document.addEventListener('pointermove', e => {
    if (!P.down || e.pointerId !== P.down.id || !P.el) return;
    const p = OS.stage.toLocal(e.clientX, e.clientY), dx = p.x - P.down.x, dy = p.y - P.down.y;
    if (!P.down.moved && Math.hypot(dx, dy) < 5) return;
    if (!P.down.moved) { P.down.moved = true; sayOff(); if (['run'].indexOf(P.state) < 0) setState('drag'); }
    if (P.state !== 'drag') return;
    const st = OS.stage;
    P.x = OS.clamp(P.down.px + dx, st.insets.l + SIZE / 2, st.W - st.insets.r - SIZE / 2);
    P.foot = OS.clamp(P.down.pf + dy, st.TICKER_H + FOOT, st.H - st.TASKBAR_H + 1);
    place();
  }, true);
  document.addEventListener('pointerup', e => {
    if (!P.down || e.pointerId !== P.down.id) return;
    const d = P.down;
    P.down = null;
    if (d.moved) { if (P.state === 'drag') setState(R.monitor ? 'idle' : 'off'); P.poke = Date.now(); return; }
    const now = Date.now();
    if (now - P.clickT < OS.dblMs()) { clearTimeout(P.clickTimer); P.clickT = 0; openMain(); return; }
    P.clickT = now;
    P.clickTimer = setTimeout(() => { P.clickT = 0; poke(); }, OS.dblMs());
  }, true);
  function poke() {
    P.poke = Date.now();
    OS.sound.play('click');
    if (P.state === 'sleep') { setState('idle'); P.act = 'stretch'; P.actT = 0; say(L.wake); return; }
    if (P.state === 'run') return;
    say(OS.pick(L.pokes));
  }
  function petMenu() {
    return [
      { label: L.menu.open, action: () => openMain() },
      { label: L.menu.quick, action: () => { openMain('scan'); setTimeout(() => startScan(['mem']), 200); } },
      { label: L.menu.mon, checked: R.monitor, action: () => setMonitor(!R.monitor) },
      { label: L.menu.up, action: () => { openMain('up'); setTimeout(upgrade, 200); } },
      '-',
      { label: R.hidden ? L.menu.show : L.menu.hide, action: () => setHidden(!R.hidden) },
      { label: L.menu.quit, action: quit }
    ];
  }
  function setHidden(h) {
    R.hidden = h;
    S.pet = !h; persist();
    if (P.el) P.el.style.display = h ? 'none' : '';
    if (h) { sayOff(); trayOn(); } else trayOff();
    refreshMain();
  }
  // 藏起来的时候：托盘里留一个小豹子头，监控照开
  function trayOn() {
    if (R.tray || !R.running) return;
    const t = R.tray = el('span', { class: 'tray-btn rx-trayico', title: NAME }, [el('i')]);
    t.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); openMain(); });
    OS.ui.onContext(t, () => petMenu());
    if (OS.taskbar.trayAdd) OS.taskbar.trayAdd(t);
  }
  function trayOff() { if (R.tray) { R.tray.remove(); R.tray = null; } }
  // 任务管理器里结束 BaoGe.exe：当场倒下，一秒后爬起来瞪你一眼
  function knockOut() { if (P.el && !R.hidden) { sayOff(); setState('fall'); OS.sound.play('thud'); } }

  /* ================= 警报 ================= */
  function alarm() {
    if (S.alarm && S.sound !== 'mute') OS.sound.play(S.sound === 'roar' ? 'rxRoar' : 'rxAlarm');
    if (P.el) { if (R.hidden && R.tray) R.tray.classList.add('alarm'); setState('alarm'); }
  }
  function calm(won, v) {
    if (R.tray) R.tray.classList.remove('alarm');
    if (!P.el) return;
    if (won) { setState('win'); say(L.winSay(v)); } else setState(R.monitor ? 'idle' : 'off');
  }

  /* ================= 病毒：现在有哪些、打 ================= */
  // 内存里现在有的病毒：[病毒 id, 正在发作吗]
  function active() {
    const out = [];
    if (OS.haikui && (OS.haikui.on() || OS.haikui.dormant())) out.push(['haikui', OS.haikui.on()]);
    if (OS.virus && OS.virus.on()) out.push(['keygen', true]);
    return out;
  }
  function met(vid) { if (!dexOf(vid).met) setDex(vid, { met: true }); }
  // 打一个病毒：瑞鑫 · 手动查杀（ruixin-fight.js）；mode：intercept 拦下来的 ／ infected 正在发作 ／ replay 百科里重打
  async function fight(vid, mode) {
    const v = VIRUS[vid];
    met(vid);
    R.fighting = true;
    const startAt = Date.now();
    const deadline = mode === 'infected' && vid === 'haikui' ? () => OS.haikui.deadline() : startAt + 90000;
    const r = await OS.ruixinFight.run(vid, {
      virus: v, mode, deadline,
      infectLine: id => (OS.haikui ? OS.haikui.replies[id] : ''),
      onInfect: (id, line) => { if (mode !== 'replay' && line && OS.koukou && OS.koukou.logLine) OS.koukou.logLine(id, line); }
    });
    R.fighting = false;
    if (r.won) {
      const d = dexOf(vid);
      setDex(vid, { beaten: true, first: d.first || r.ms, best: d.best ? Math.min(d.best, r.ms) : r.ms, kills: d.kills + 1 });
      if (mode !== 'replay') {
        if (OS.soft && OS.soft.beatVirus) OS.soft.beatVirus(vid);
        if (vid === 'haikui') { if (OS.haikui.on()) OS.haikui.cure(true); else if (OS.koukou && OS.koukou.setPatchClean) OS.koukou.setPatchClean(); }
        if (vid === 'keygen' && OS.virus && OS.virus.on()) OS.virus.cure();
      }
    }
    calm(r.won, v);
    refreshMain();
    return r;
  }
  // 发现病毒的框 → ［手动查杀］进小游戏
  async function found(vid, o) {
    o = o || {};
    const v = VIRUS[vid];
    met(vid);
    alarm();
    const outbreak = !!o.outbreak;
    const btns = o.intercept ? [L.kill, L.letIn] : [L.kill, L.later];
    const pick = await OS.ui.dialog({ title: o.intercept ? L.foundTitle : L.foundScan, icon: 'ruixin', text: L.found(v, o.file || v.proc, outbreak), buttons: btns, sound: 'error' });
    if (pick !== L.kill) { calm(false, v); return { won: false, letIn: o.intercept && pick === L.letIn }; }
    return fight(vid, outbreak ? 'infected' : 'intercept');
  }
  // 实时监控拦下来（koukou.js 装补丁、abcsee.js 注册机点生成）→ 打赢了返回 true
  async function intercept(vid, src) {
    if (!guarding()) return false;
    S.log.unshift({ at: Date.now(), vid, src: src || VIRUS[vid].from });
    S.log = S.log.slice(0, 20); persist();
    const r = await found(vid, { intercept: true, file: VIRUS[vid].file });
    return !!r.won;
  }

  /* ================= 主窗口 ================= */
  function openMain(tab) {
    if (!R.running) start();
    if (R.win && !R.win.isClosed) { if (R.win.minimized) OS.wm.restore(R.win); OS.wm.focus(R.win); if (tab) show(tab); return R.win; }
    const nav = el('div', { class: 'rx-nav' });
    const body = el('div', { class: 'rx-body' });
    const status = el('div', { class: 'rx-status' });
    const content = el('div', { class: 'rx' }, [
      el('div', { class: 'rx-banner' }, [el('div', { class: 'rx-bname', text: NAME }), el('div', { class: 'rx-bsub', text: L.slogan })]),
      el('div', { class: 'rx-main' }, [nav, body]),
      status
    ]);
    R.view = { nav, body, status, tab: null, navBtns: {} };
    L.tabs.forEach(([id, label, icon]) => {
      const b = el('div', { class: 'rx-navb' }, [OS.iconEl(icon, 'rx-navi'), el('span', { text: label })]);
      b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); show(id); });
      R.view.navBtns[id] = b;
      nav.appendChild(b);
    });
    R.win = OS.wm.open({ title: NAME, icon: 'ruixin', width: 352, content, appId: app.id, maximizable: false, center: true,
      help: () => OS.ui.dialog({ title: '关于瑞鑫', icon: 'ruixin', text: L.about }),
      onClose: () => { stopScan(); R.win = null; R.view = null; } });
    show(tab || 'scan');
    // 中着毒打开：马上自己扫内存，两秒就扫出来
    if (!tab && active().length) setTimeout(() => startScan(['mem'], true), 300);
    return R.win;
  }
  function refreshMain() {
    if (!R.view) return;
    R.view.status.textContent = L.status(R.monitor, lastScanText());
    if (R.view.tab && R.view.tab !== 'scan') show(R.view.tab);
  }
  function show(tab) {
    const V = R.view;
    if (!V) return;
    if (V.tab === 'scan' && tab !== 'scan' && R.scan) stopScan();
    V.tab = tab;
    Object.keys(V.navBtns).forEach(k => V.navBtns[k].classList.toggle('on', k === tab));
    V.body.textContent = '';
    V.status.textContent = L.status(R.monitor, lastScanText());
    ({ scan: scanTab, mon: monTab, up: upTab, dex: dexTab, set: setTab })[tab](V.body);
  }

  /* ---------- 查杀病毒 ---------- */
  let SC = null;   // 查杀页上的零件
  function scanTab(body) {
    const boxes = {};
    const grid = el('div', { class: 'rx-targets' }, L.targets.map(([id, label]) => {
      const c = el('input', { type: 'checkbox' });
      c.checked = id !== 'd';
      boxes[id] = c;
      return el('label', { class: 'rx-tg' }, [c, el('span', { text: label })]);
    }));
    const go = el('button', { class: 'xpbtn default', text: L.scanBtn }), stop = el('button', { class: 'xpbtn', text: L.stopBtn });
    stop.disabled = true;
    const path = el('div', { class: 'rx-path', text: L.idle });
    const fill = el('div', { class: 'rx-barf' });
    const count = el('div', { class: 'rx-count', text: L.count(0, 0, '00:00:00') });
    const res = el('div', { class: 'rx-res' });
    body.append(grid, el('div', { class: 'rx-btns' }, [go, stop]), path, el('div', { class: 'rx-bar' }, [fill]), count, res);
    SC = { boxes, go, stop, path, fill, count, res };
    go.addEventListener('click', () => { OS.sound.play('click'); startScan(L.targets.map(t => t[0]).filter(id => boxes[id].checked)); });
    stop.addEventListener('click', () => { OS.sound.play('click'); stopScan(true); });
  }
  // 要扫的文件：从"我的电脑"里真有的文件里一层层找
  function walk(root, max) {
    const out = [], FS = OS.fs;
    const go = (dir, depth) => {
      if (out.length >= max || depth > 6) return;
      let list = [];
      try { list = FS.list(dir, true); } catch (e) { list = []; }
      list.forEach(n => {
        if (out.length >= max || !n) return;
        if (n.folder) go(n.path, depth + 1);
        else out.push(n.path);
      });
    };
    if (FS && FS.get(root)) go(root, 0);
    return out;
  }
  function startScan(targets, auto) {
    if (!R.view) openMain('scan');
    if (R.view.tab !== 'scan') show('scan');
    if (R.scan || R.fighting || !targets.length) return;
    const FS = OS.fs;
    let files = [];
    targets.forEach(id => {
      if (id === 'mem') files = files.concat(L.memItems.map(x => ({ p: x, mem: true })));
      if (id === 'boot') files = files.concat(L.bootItems.map(p => ({ p })));
      if (id === 'c') files = files.concat(walk('C:', 260).map(p => ({ p })));
      if (id === 'd') files = files.concat(walk('D:', 80).map(p => ({ p })));
      if (id === 'docs' && FS) files = files.concat(walk(FS.MYDOCS, 120).map(p => ({ p })));
    });
    if (!files.length) files = [{ p: 'C:\\' }];
    const ms = auto ? 2000 : Math.min(12000, 1000 + targets.length * 1600);
    const viruses = targets.indexOf('mem') >= 0 ? active() : [];
    const sc = R.scan = { i: 0, n: 0, t0: Date.now(), ms, files, viruses, killed: 0, left: 0, timer: 0 };
    SC.go.disabled = true; SC.stop.disabled = false;
    SC.res.textContent = '';
    if (P.el && !R.hidden) setState('scan');
    const tickMs = 60;
    sc.timer = setInterval(() => {
      if (R.scan !== sc) return;
      const k = Math.min(1, (Date.now() - sc.t0) / sc.ms);
      sc.i = Math.min(files.length - 1, Math.floor(k * files.length));
      sc.n += 3 + Math.floor(Math.random() * 7);
      SC.path.textContent = L.scanning + files[sc.i].p;
      SC.fill.style.width = (k * 100) + '%';
      SC.count.textContent = L.count(sc.n, sc.killed + sc.left, OS.pad2(0) + ':' + OS.pad2(0) + ':' + OS.pad2(Math.floor((Date.now() - sc.t0) / 1000)));
      // 内存扫到一半：病毒揪出来了
      if (sc.viruses.length && k > (auto ? 0.6 : 0.15)) { const [vid, outbreak] = sc.viruses.shift(); pauseFor(sc, vid, outbreak); return; }
      if (k >= 1) finishScan(sc);
    }, tickMs);
  }
  async function pauseFor(sc, vid, outbreak) {
    clearInterval(sc.timer);
    const r = await found(vid, { outbreak, file: VIRUS[vid].proc });
    if (R.scan !== sc) return;
    if (r.won) sc.killed++; else sc.left++;
    if (!SC || !SC.path.isConnected) { R.scan = null; return; }
    // 接着扫
    const done = Date.now() - sc.t0;
    sc.t0 = Date.now() - Math.min(done, sc.ms * 0.6);
    startTimerAgain(sc);
  }
  function startTimerAgain(sc) {
    sc.timer = setInterval(() => {
      if (R.scan !== sc) return;
      const k = Math.min(1, (Date.now() - sc.t0) / sc.ms);
      sc.i = Math.min(sc.files.length - 1, Math.floor(k * sc.files.length));
      sc.n += 3 + Math.floor(Math.random() * 7);
      SC.path.textContent = L.scanning + sc.files[sc.i].p;
      SC.fill.style.width = (k * 100) + '%';
      SC.count.textContent = L.count(sc.n, sc.killed + sc.left, '00:00:' + OS.pad2(Math.floor((Date.now() - sc.t0) / 1000)));
      if (sc.viruses.length) { const [vid, outbreak] = sc.viruses.shift(); pauseFor(sc, vid, outbreak); return; }
      if (k >= 1) finishScan(sc);
    }, 60);
  }
  function finishScan(sc) {
    clearInterval(sc.timer);
    R.scan = null;
    S.lastScan = Date.now(); persist();
    if (!SC || !SC.path.isConnected) return;
    SC.go.disabled = false; SC.stop.disabled = true;
    SC.fill.style.width = '100%';
    SC.path.textContent = sc.left ? L.doneLeft : sc.killed ? L.doneKilled(sc.killed) : L.clean;
    // 可疑程序（那几年杀毒软件爱乱报的）：最多两条；装了海葵工具条的一定报
    const sus = [];
    if (OS.koukou && OS.koukou.toolbar && OS.koukou.toolbar()) sus.push('toolbar');
    const pool = [];
    if (OS.desktop.sheepHere && OS.desktop.sheepHere()) pool.push('sheep');
    if (!OS.soft || OS.soft.present('debt')) pool.push('debt');
    if (!OS.soft || OS.soft.appOk('swatter')) pool.push('swatter');
    while (sus.length < 2 && pool.length && Math.random() < 0.8) sus.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    SC.res.textContent = '';
    sus.forEach(k => SC.res.appendChild(el('div', { class: 'rx-sus' }, [OS.iconEl('warn', 'rx-susi'), el('span', { text: L.sus + L.suspects[k] })])));
    if (P.el && P.state === 'scan') { setState(R.monitor ? 'idle' : 'off'); P.flip = false; if (!sc.killed && !sc.left) say(L.clean.split('\n')[1]); }
    refreshMain();
    OS.sound.play('ding');
  }
  function stopScan(say2) {
    const sc = R.scan;
    if (!sc) return;
    clearInterval(sc.timer);
    R.scan = null;
    if (P.el && P.state === 'scan') { setState(R.monitor ? 'idle' : 'off'); P.flip = false; }
    if (SC && SC.path.isConnected) { SC.go.disabled = false; SC.stop.disabled = true; if (say2) SC.path.textContent = L.stopped; }
  }

  /* ---------- 实时监控 ---------- */
  function monTab(body) {
    const big = el('button', { class: 'rx-monbtn' + (R.monitor ? ' on' : ''), text: R.monitor ? L.monOn : L.monOff });
    big.addEventListener('click', () => { OS.sound.play('click'); setMonitor(!R.monitor); });
    const rows = el('div', { class: 'rx-monrows' }, L.monRows.map(r => el('div', { class: 'rx-monrow' }, [el('span', { text: r }), el('b', { class: R.monitor ? 'ok' : 'off', text: R.monitor ? L.ok : L.off })])));
    const log = el('div', { class: 'rx-log' }, S.log.length ? S.log.map(x => {
      const d = new Date(x.at);
      return el('div', { text: L.logLine((d.getMonth() + 1) + '-' + d.getDate() + ' ' + OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes()), VIRUS[x.vid] ? VIRUS[x.vid].name : x.vid, x.src) });
    }) : [el('div', { class: 'rx-dim', text: L.noLog })]);
    body.append(big, el('div', { class: 'rx-tip', text: L.monTip }), rows, el('div', { class: 'rx-cap', text: L.logCap }), log);
  }

  /* ---------- 升级 ---------- */
  let upBusy = false;
  function upTab(body) {
    const btn = el('button', { class: 'xpbtn default', text: L.upBtn });
    const line = el('div', { class: 'rx-path', text: L.upCur });
    const fill = el('div', { class: 'rx-barf' });
    body.append(el('div', { class: 'rx-tip', text: L.upTip }), el('div', { class: 'rx-btns' }, [btn]), line, el('div', { class: 'rx-bar' }, [fill]));
    R.view.up = { btn, line, fill };
    btn.disabled = upBusy;
    btn.addEventListener('click', () => { OS.sound.play('click'); upgrade(); });
  }
  function upgrade() {
    if (upBusy) return;
    if (!R.view || R.view.tab !== 'up') { openMain('up'); }
    upBusy = true;
    const U = () => (R.view && R.view.tab === 'up' ? R.view.up : null);
    if (U()) U().btn.disabled = true;
    if (P.el && !R.hidden) setState('upgrade');
    OS.sound.play('dialup');
    const steps = [[0, 0], [2600, 1], [4200, 2]];
    steps.forEach(([ms, i]) => setTimeout(() => { const u = U(); if (u) { u.line.textContent = L.upSteps[i]; u.fill.style.width = i === 2 ? '3%' : '0%'; } }, ms));
    setTimeout(() => {
      upBusy = false;
      const u = U();
      if (u) { u.btn.disabled = false; u.line.textContent = L.upCur; u.fill.style.width = '0%'; }
      if (P.el && P.state === 'upgrade') setState(R.monitor ? 'idle' : 'off');
      OS.ui.dialog({ title: NAME, icon: 'error', text: L.upFail });
    }, 7600);
  }

  /* ---------- 病毒百科 ---------- */
  function dexTab(body, pick) {
    if (pick) return dexCard(body, pick);
    const grid = el('div', { class: 'rx-dex' });
    for (let i = 0; i < DEX_SLOTS; i++) {
      const vid = ORDER[i], d = vid ? dexOf(vid) : null;
      const known = vid && d.met;
      const pic = el('div', { class: 'rx-dpic' + (vid ? ' rx-pic-' + vid : '') + (known && !d.beaten ? ' runaway' : '') + (!known ? ' unknown' : '') }, known ? [] : [el('b', { text: '?' })]);
      const card = el('div', { class: 'rx-dcard' }, [pic, el('div', { class: 'rx-dname', text: known ? VIRUS[vid].nick : L.unknown }), el('div', { class: 'rx-dstate', text: known ? (d.beaten ? L.dead + '　' + mmss(d.best) : L.runaway) : '' })]);
      if (known) card.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); body.textContent = ''; dexCard(body, vid); });
      grid.appendChild(card);
    }
    body.append(el('div', { class: 'rx-tip', text: L.dexCap }), grid);
  }
  function dexCard(body, vid) {
    const v = VIRUS[vid], d = dexOf(vid);
    const back = el('button', { class: 'xpbtn', text: L.back });
    back.addEventListener('click', () => { OS.sound.play('click'); show('dex'); });
    const btns = [back];
    if (d.beaten) {
      const again = el('button', { class: 'xpbtn default', text: L.again });
      again.addEventListener('click', async () => { OS.sound.play('click'); await fight(vid, 'replay'); if (R.view && R.view.tab === 'dex') { R.view.body.textContent = ''; dexCard(R.view.body, vid); } });
      btns.unshift(again);
    }
    body.append(el('div', { class: 'rx-dbig' }, [
      el('div', { class: 'rx-dpic big rx-pic-' + vid + (d.beaten ? '' : ' runaway') }),
      el('div', { class: 'rx-dtext' }, L.dexRows(v).concat(L.dexStat(d)).concat([v.blurb, '豹哥点评：' + v.comment]).map(t => el('div', { text: t })))
    ]), el('div', { class: 'rx-btns' }, btns));
  }

  /* ---------- 设置 ---------- */
  function setTab(body) {
    const rows = L.setRows.map(([k, label]) => {
      const c = el('input', { type: 'checkbox' });
      c.checked = k === 'pet' ? !R.hidden : !!S[k];
      c.addEventListener('change', () => {
        OS.sound.play('click');
        if (k === 'pet') { setHidden(!c.checked); return; }
        S[k] = c.checked; persist();
        if (k === 'floppy' && c.checked) OS.ui.dialog({ title: NAME, icon: 'info', text: L.floppyDone });
      });
      return el('label', { class: 'rx-tg' }, [c, el('span', { text: label })]);
    });
    const radios = L.sounds.map(([k, label]) => {
      const r = el('input', { type: 'radio', name: 'rx-snd' });
      r.checked = S.sound === k;
      r.addEventListener('change', () => { S.sound = k; persist(); if (k !== 'mute') OS.sound.play(k === 'roar' ? 'rxRoar' : 'rxAlarm'); });
      return el('label', { class: 'rx-tg' }, [r, el('span', { text: label })]);
    });
    body.append(el('div', { class: 'rx-set' }, rows), el('div', { class: 'rx-cap', text: L.soundCap }), el('div', { class: 'rx-set rx-row' }, radios));
  }

  /* ================= 卸载：豹哥抱住卸载的窗口不撒手 ================= */
  function plead() {
    return new Promise(resolve => {
      const yes = el('button', { class: 'xpbtn', text: L.pleadYes }), no = el('button', { class: 'xpbtn default', text: L.pleadNo });
      const w = OS.wm.open({ title: L.pleadTitle, icon: 'ruixin', width: 250, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
        content: el('div', { class: 'rx-plead' }, [OS.iconEl('ruixin', 'dlg-icon'), el('div', { class: 'dlg-text', text: L.plead }), el('div', { class: 'dlg-btns' }, [yes, no])]),
        onClose: () => { clearInterval(follow); hug.remove(); resolve(answer); } });
      let answer = false;
      ensureLayer();
      const hug = el('div', { class: 'rx-hug' }, [el('i')]);
      layer.appendChild(hug);
      const stick = () => { const r = OS.stage.rectOf(w.el); hug.style.left = (r.left - 22) + 'px'; hug.style.top = (r.top + r.height / 2 - 28) + 'px'; };
      stick();
      const follow = setInterval(stick, 80);
      OS.sound.play('sob');
      yes.addEventListener('click', () => { OS.sound.play('click'); answer = true; w.close(); });
      no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    });
  }

  /* ================= 两个杀毒软件打架（弹窗杀手扫描时，瑞鑫开着）================= */
  let warOn = false;
  async function civilWar() {
    if (!R.running || warOn) return;
    warOn = true;
    alarm();
    const a = await OS.ui.dialog({ title: L.foundTitle, icon: 'ruixin', text: L.warRx, buttons: [L.clear, L.ignore], sound: 'error' });
    const b = await OS.ui.dialog({ title: '弹窗杀手', icon: 'swatter', text: L.warSw, buttons: [L.clear, L.ignore], sound: 'error' });
    warOn = false;
    if (a === L.clear && b === L.clear) { setTimeout(() => { if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD_WAR); }, 500); return; }
    calm(false);
    if (a === L.clear || b === L.clear) OS.ui.dialog({ title: a === L.clear ? L.foundTitle : '弹窗杀手', icon: 'error', text: L.warFail });
  }

  /* ================= 打开 ================= */
  app.open = () => openMain();

  OS.ruixin = {
    running: () => R.running, guarding, petShown: () => R.running && !R.hidden && !!P.el,
    intercept, met, fight, found,
    open: openMain, quit, knockOut, plead, civilWar,
    viruses: VIRUS
  };
})();
