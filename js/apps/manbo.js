/* 慢播（照那几年的"快播"做的视频播放器；创意稿见「慢播-创意.md」）
   - 开始 ▸ 所有程序 ▸ 慢播；电脑里的 .rmvb .avi 双击都用它放（网上邻居 ▸ 隔壁大学生 ▸ 电影 三部、家 ▸ 监控 三个、共享文档里那部武侠片）
   - 永远在缓冲：每次开始放先缓冲（到 99% 停一下）；放到一半还要再缓冲一回；［加速］越点越慢（冒一句"慢播，Out！"）
   - 没有快进（进度条只能往回拖）；播放速度只有 正常 ／ 0.5 倍 ／ 0.25 倍 ／ 逐帧；字幕默认晚 2 秒，字幕菜单里自己调
   - 视频不是真视频：每部片子 8 张图（assets/manbo/，Codex 画），一张接一张放、镜头慢慢推拉；字幕、声音、枪版效果都是代码做的
     武侠大片（枪版）：观众后脑勺、有人站起来挡屏幕、手机响；最后一招要出手时花屏——最后 1% 没下完，永远看不到结局
     英语听力.rmvb：开头真是听力，然后变成外国灾难片，盗版碟离谱翻译的双语字幕
     高数网课.rmvb：黑板上的数学符号活了，打起来
     客厅.avi：黑白监控，电视在放天气预报，瓜子一颗颗变少；门口.avi：打开时先把这次开机你敲过的几下放一遍，
     开着的时候你去 新建文件夹(2) 敲门，监控里那个人当场跟着敲（2026-11-24 作者：我敲门的时候监控里的人没动）；你.avi：直播你的桌面
     家里的三个监控：你把门敲开进了家、门被反锁以后，网上邻居连不上家了——正在放的当场断开（满屏雪花），再打开报"\\家 无法访问"；重启门开了又能看
   - 放片子时千千不听先停，关了慢播接着放
   - 背景音乐也是代码现场合成的（作者：不去 Suno 出，省体积）：武侠片古筝 + 大鼓；灾难片低沉铺底 + 定音鼓，结尾长笛；高数功夫片方波主旋律 + 鼓，老师回头时唱片一刮全停；
     客厅电视里闷闷的天气预报音乐；门口、你.avi 是监控，没有音乐。缓冲、暂停、花屏音乐都停，慢放时跟着慢
   - 字幕每次打开慢播都是开着的（2026-11-24 作者：默认要显示字幕）
   - 字幕对不上：放到第一句字幕出来的那一下，系统右下角冒"温馨提示"气泡（打破第四面墙、冲着玩家说的那个）：怎么字幕对不上呀？调一下字幕时间试试？
     点一下气泡：在［字幕］按钮那儿弹出字幕菜单，按钮一闪一闪；每次打开慢播提醒一回，字幕已经调准了就不提醒
   - 蓝屏：［加速］一口气连点 10 下 → 缓冲冲到 101% → BUFFER_OVERFLOW
   - 卸了以后所有视频都报"格式不支持，请安装播放器"（作者定 23A）
   OS.manbo：play(视频 id, { local }) ／ open ／ close */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.manbo;
  if (!app) return;
  const NAME = '慢播';
  const ART = 'assets/manbo/';
  const W = 320, H = 240;   // 画面（Codex 的每张图也是 320×240）

  /* ================= 文案 ================= */
  const L = {
    menus: ['文件(F)', '播放(P)', '字幕(S)', '帮助(H)'],
    open: '打开…', recent: '最近播放', quit: '退出', none: '还没放过东西',
    playPause: '播放 ／ 暂停', stop: '停止', speed: '播放速度', ff: '快进',
    speeds: [[1, '正常'], [0.5, '0.5 倍'], [0.25, '0.25 倍'], ['step', '逐帧']],
    subEarly: '提前 0.5 秒', subLate: '延后 0.5 秒', subShow: '显示字幕',
    subInfo: d => (d > 0 ? '字幕现在晚 ' + d + ' 秒' : d < 0 ? '字幕现在早 ' + (-d) + ' 秒' : '字幕对上了'),
    about: '关于慢播', aboutText: '慢播 2003\n慢播，Out！',
    idle: '把视频拖进来，或者 文件 ▸ 打开。',
    ready: '准备就绪。',
    out: '慢播，Out！',
    noFF: '本播放器不支持快进。',
    buffering: (p, kb) => '缓冲中 ' + p + '%　下载速度 ' + kb + ' KB/s　已连接 3 个节点',
    bufBig: p => '缓冲中 ' + p + '%',
    time: (a, b) => a + ' / ' + b,
    net: '边下边播　来源：网上邻居',
    paused: '已暂停', stopped: '已停止。', ended: '播放完毕。', stepping: '逐帧',
    live: '直播',
    cut: '文件不完整：最后 1% 没有下载完。', more: '继续下载',
    cutPct: p => '下载进度 ' + p + '%', eta: '预计剩余时间：等全楼都睡了再说。',
    listTitle: '播放列表', listOpen: '打开', listEmpty: '还没放过东西。\n网上邻居里能找到片子。',
    noPlayer: '格式不支持，请安装播放器。',
    accel: '加速', subs: '字幕', list: '列表',
    cctvSay: { title: '家', text: '老公快看，那个人又在翻别人电脑了！' },
    walker: '借过借过', shh: '嘘——',
    tipTitle: '温馨提示', syncTip: '怎么字幕对不上呀？调一下字幕时间试试？',
    lost: '连接已断开。', lostWhy: '\\\\家 无法访问。\n门从里面反锁了。', lostStatus: '连接已断开'
  };
  const BSOD = { id: 'manbo', name: 'BUFFER_OVERFLOW', text: '瀑布汗！进度条被你撑爆了！' };
  const HOME = ['room', 'door', 'you'];   // 网上邻居 ▸ 家 ▸ 监控 里的；门反锁以后连不上
  const homeLocked = () => !!(OS.folder2 && OS.folder2.locked && OS.folder2.locked());

  /* ================= 片子 ================= */
  // 镜头：f = 第几张（0–7，大图 4 列 × 2 行），t 开始、d 多久（秒）；z 放大倍数、x y 往哪边移（-1 到 1），都是 [开头, 结尾]
  // 字幕：[几秒出来, 停几秒, 中文, 英文]；声音：[几秒, 声音名]
  const shot = (f, t, d, z, x, y) => ({ f, t, d, z: z || [1, 1.15], x: x || [0, 0], y: y || [0, 0] });
  const VIDS = {
    wuxia: {
      name: '武侠大片（枪版）.rmvb', kind: 'film', sheet: 'wuxia', len: 35, cam: true, cut: 33.4, rebuf: 11.5,
      shots: [shot(0, 0, 5, [1, 1.25], 0, [-0.2, 0.2]), shot(1, 5, 4, [1.1, 1.25], [-0.3, 0.3]), shot(2, 9, 4, [1.25, 1.1], [0.3, -0.2]), shot(3, 13, 3),
        shot(4, 16, 5, [1.1, 1.3], [-0.4, 0.4]), shot(5, 21, 4, [1.3, 1.05], 0, [0.4, -0.4]), shot(6, 25, 4, [1.05, 1.25], 0, [-0.3, 0.3]), shot(7, 29, 6, [1.1, 1.6])],
      subs: [[1, 3, '江湖传言，今夜有一场决斗。'], [5.5, 3, '白衣：今夜月色真好。'], [9.5, 3, '斗笠客：可惜，是你最后一次看了。'],
        [17, 3, '白衣：你的刀，慢了。'], [21.5, 3, '斗笠客：轻功？'], [25.5, 3, '斗笠客：接我一刀！'], [29.5, 3, '白衣：这一招，叫做——']],
      sfx: [[0.2, 'mbWind'], [13.1, 'mbClang'], [16.5, 'mbClang'], [17.6, 'mbClang'], [19, 'mbClang'], [19.25, 'mbClang'], [21.2, 'mbWhoosh'], [23, 'mbRing'], [24.6, 'mbShh'], [25.4, 'mbWhoosh'], [29.2, 'mbCharge']],
      walker: [17.5, 3.6], phone: [23, 1.6], shh: [24.6, 1.6],
      pops: [[13.1, '锵——！', 1.3], [16.5, '锵！'], [17.6, '锵！'], [19, '锵锵！'], [21.2, '嗖——'], [23, '铃铃铃——', 0.7, 238, 196], [25.4, '呼——'], [29.2, '嗡——', 1.2]],
      voices: { 白衣: 300, 斗笠客: 130, '': 170 }
    },
    film: {
      name: '英语听力.rmvb', kind: 'film', sheet: 'film', len: 41, rebuf: 20.5,
      shots: [{ draw: 'listenA', t: 0, d: 8 }, shot(0, 8, 4, [1, 1.2], 0, [0.2, -0.2]), shot(1, 12, 3, [1.15, 1.05]), shot(2, 15, 4, [1.05, 1.3]), shot(3, 19, 3, [1.2, 1]),
        shot(4, 22, 4, [1.1, 1.25], [0.3, -0.3]), shot(5, 26, 3, [1.2, 1.2], [-0.5, 0.5]), shot(6, 29, 3.5, [1, 1.2]), shot(7, 32.5, 4.5, [1.25, 1]), { draw: 'listenB', t: 37, d: 4 }],
      subs: [[8.4, 3, '看一看这个天空！', 'Look at the sky!'], [12.2, 2.5, '哦我的上帝！', 'Oh my god!'], [15.3, 3, '不不不不不！', 'Nooooo!'], [19.2, 2.5, '得到下面！', 'Get down!'],
        [22.3, 3, '握住上面！', 'Hold on!'], [26.2, 2.8, '来吧，上！让我们去吧！', "Come on! Let's go!"], [29.2, 3, '闭嘴并且跑！', 'Shut up and run!'],
        [32.8, 2, '我们制造了它。', 'We made it.'], [34.9, 2, '我爱你。', 'I love you.']],
      pops: [[8.3, '轰——！', 1.3], [19.1, '轰隆隆——！', 1.3], [29.1, '轰！！！', 1.5]],
      // 谁在说：0 路人 ／ 1 男主 ／ 2 女主（按每句字幕的顺序）
      speakers: [1, 0, 1, 1, 2, 1, 1, 1, 2], voices: [190, 145, 290],
      sfx: [[2, 'mbBeep'], [8, 'mbStatic'], [8.3, 'mbBoom'], [19.1, 'mbBoom'], [29.1, 'mbBoom'], [37, 'mbStatic'], [38, 'mbBeep']]
    },
    math: {
      name: '高数网课.rmvb', kind: 'film', sheet: 'math', len: 37, rebuf: 16.5,
      shots: [shot(0, 0, 6, [1, 1.15]), shot(1, 6, 4, [1.05, 1.15]), shot(2, 10, 4, [1.15, 1.3]), shot(3, 14, 4, [1.1, 1.25], [-0.3, 0.3]), shot(4, 18, 5, [1.05, 1.3]),
        shot(5, 23, 4, [1.3, 1.05]), shot(6, 27, 4, [1, 1.3]), shot(7, 31, 6, [1.2, 1])],
      subs: [[1, 2.6, '老师：这个极限，同学们记一下。'], [3.8, 2.4, '老师：x 趋于 0，sin x 比 x 等于 1。'], [6.5, 3, '老师：下面讲积分。'],
        [18.5, 3, '老师：这个积分……怎么在动？'], [27.4, 2.5, '老师：……'], [31.5, 3, '老师：下课。']],
      pops: [[10.2, '啊打——！', 1.3], [14.2, '嗖——'], [18.3, '乒！'], [19.4, '乓！'], [23.1, '无穷斩！', 1.6], [26.9, '嘶啦——', 1]],
      voices: { 老师: 210, '': 210 },
      sfx: [[10.2, 'mbPunch'], [10.4, 'mbWhoosh'], [14.2, 'mbWhoosh'], [18.3, 'mbClang'], [19.4, 'mbClang'], [23.1, 'mbWhoosh'], [23.4, 'mbBoom'], [26.9, 'mbScratch']],
      // 黑板上粉笔写的公式（第 1、2 张；图里的位置：第 1 张写在老师左上方的空黑板上，第 2 张避开左下角探头的小人）
      board: { 0: { x: 24, y: 18, w: 150, lines: ['lim  sin x / x = 1', 'x→0'] }, 1: { x: 80, y: 34, w: 220, lines: ['∫ x dx = x² / 2 + C', 'Σ 1 / n² = π² / 6'] } }
    },
    room: { name: '客厅.avi', kind: 'cctv', scene: 'room', cam: 'CAM 01' },
    door: { name: '门口.avi', kind: 'cctv', scene: 'door', cam: 'CAM 02' },
    you: { name: '你.avi', kind: 'live', cam: 'CAM 03' }
  };
  /* ================= 背景音乐（代码合成，OS.sound.note） ================= */
  // 每个音：[片子里第几秒, 乐器, 频率, 响多久, 音量]
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);   // MIDI 音高 → 频率（60 = 中央 C）
  const times = (n, a) => [].concat(...Array.from({ length: n }, () => a));
  // 一串音：从 t0 起每 step 秒一个，0 是空拍
  function seq(o, inst, t0, step, notes, dur, vol) { notes.forEach((m, i) => { if (m) o.push([t0 + i * step, inst, hz(m), dur || step * 0.9, vol]); }); }
  const MUSIC = {
    // 武侠：D 小调五声古筝，开打以后鼓一直敲，最后一招越来越紧，花屏一下全停
    wuxia: (() => {
      const o = [];
      o.push([0, 'pad', hz(38), 9, 0.03], [0, 'pad', hz(45), 9, 0.02]);
      seq(o, 'pluck', 0.5, 0.5, [62, 65, 67, 69, 72, 69, 67, 65, 62, 0, 74, 72, 69, 0, 67, 65, 62], 1.3, 0.09);
      o.push([9, 'pad', hz(45), 4.2, 0.035], [9, 'pad', hz(52), 4.2, 0.02]);
      seq(o, 'pluck', 9.2, 0.75, [57, 0, 60, 62, 0], 1.6, 0.08);
      o.push([13, 'drum', hz(31), 1.4, 0.35], [13, 'gong', 180, 2.6, 0.07]);
      seq(o, 'pluck', 16, 0.15, times(4, [74, 72, 69, 67, 69, 72, 74, 0, 79, 77, 74, 72, 69, 67]), 0.3, 0.07);
      seq(o, 'drum', 16, 0.25, times(9, [36, 0, 36, 36]), 0.5, 0.25);
      o.push([16, 'pad', hz(38), 9, 0.03]);
      let t = 25;
      for (let k = 0; k < 16; k++) { o.push([t, 'drum', hz(36), 0.4, 0.2 + k * 0.01]); t += Math.max(0.12, 0.45 - k * 0.025); }
      seq(o, 'pad', 29, 0.5, [50, 52, 53, 55, 57, 58, 60, 62], 0.6, 0.04);
      seq(o, 'drum', 29, 0.125, times(34, [36]), 0.2, 0.18);
      return o;
    })(),
    // 灾难片：听力那段安安静静；开演低沉铺底 + 定音鼓 + 铜管顿音，越逃越快；夕阳那段长笛
    film: (() => {
      const o = [];
      o.push([8.3, 'pad', hz(36), 5.5, 0.05], [8.3, 'pad', hz(43), 5.5, 0.04], [13.8, 'pad', hz(32), 5.3, 0.05], [13.8, 'pad', hz(39), 5.3, 0.04]);
      [8.3, 12, 15.3].forEach(t => o.push([t, 'drum', hz(33), 1.2, 0.3]));
      seq(o, 'brass', 12, 0.25, times(7, [48, 48, 48, 51]), 0.18, 0.05);
      o.push([19, 'pad', hz(32), 5, 0.05], [24, 'pad', hz(34), 5, 0.05]);
      seq(o, 'brass', 19, 0.2, times(6, [48, 48, 51, 48, 53, 48, 51, 48]), 0.14, 0.05);
      seq(o, 'drum', 19, 0.4, times(25, [33]), 0.5, 0.22);
      o.push([29.5, 'pad', hz(31), 3, 0.03]);
      o.push([32.5, 'pad', hz(51), 4.5, 0.025], [32.5, 'pad', hz(55), 4.5, 0.02], [32.5, 'pad', hz(58), 4.5, 0.02]);
      seq(o, 'flute', 32.8, 0.55, [70, 67, 68, 70, 72, 70, 67, 0], 0.6, 0.07);
      return o;
    })(),
    // 高数：讲课那段没音乐；符号打起来是 G 五声功夫曲 + 贝斯 + 鼓；无穷斩一声锣；老师回头唱片一刮全停；最后小人排排站叮叮几下
    math: (() => {
      const o = [];
      seq(o, 'lead', 10, 0.25, times(4, [67, 69, 71, 74, 76, 74, 71, 69, 67, 0, 67, 69, 71, 0, 74, 0]), 0.2, 0.045);
      seq(o, 'bass', 10, 0.5, times(4, [43, 0, 43, 50, 43, 0, 45, 50]), 0.4, 0.12);
      seq(o, 'drum', 10, 0.5, times(32, [36]), 0.4, 0.22);
      seq(o, 'snare', 10.5, 1, times(16, [1]), 0.15, 0.08);
      o.push([23.1, 'gong', 150, 3, 0.09]);
      seq(o, 'pluck', 31.5, 0.4, [84, 0, 86, 0, 88, 0, 0, 91], 0.5, 0.06);
      return o;
    })(),
    // 客厅：电视里闷闷的天气预报音乐，8 秒一圈
    room: (() => {
      const o = [];
      seq(o, 'tv', 0, 0.5, [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 83, 79, 76, 74], 0.4, 0.022);
      seq(o, 'tvbass', 0, 0.5, [48, 0, 55, 0, 50, 0, 57, 0, 48, 0, 55, 0, 55, 0, 50, 0], 0.4, 0.04);
      return o;
    })()
  };
  // 说话：每句字幕在它"本来"的时间嘀嘀几下（字幕晚 2 秒，声音是准的——字幕不同步听得出来）；音高看是谁在说
  Object.keys(VIDS).forEach(id => {
    const v = VIDS[id];
    if (!v.subs || !MUSIC[id]) return;
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    v.subs.forEach(([at, , zh], k) => {
      const who = zh.indexOf('：') > 0 ? zh.slice(0, zh.indexOf('：')) : '';
      const base = v.speakers ? v.voices[v.speakers[k] || 0] : (v.voices && (v.voices[who] || v.voices[''])) || 180;
      const n = Math.min(9, Math.max(2, Math.ceil(zh.replace(/^[^：]*：/, '').length / 1.6)));
      for (let i = 0; i < n; i++) MUSIC[id].push([at + i * 0.12, 'voice', base * (0.88 + rnd() * 0.3), 0.09, 0.07]);
    });
  });
  const LOOP = { room: 8 };
  const AHEAD = 0.15;   // 提前排多久的音
  function musicHush() { if (P.musicOn) { OS.sound.musicStop && OS.sound.musicStop(); P.musicOn = false; } P.mt = P.t; }
  // 放着的时候：把接下来一小段要响的音排上（慢放时音和音之间的距离跟着拉长）
  function musicRun() {
    const key = P.v && (P.v.scene || P.id), notes = MUSIC[key];
    if (!notes || !OS.sound.note || P.mute) { P.mt = P.t; return; }
    const rate = typeof P.rate === 'number' ? P.rate : 1;
    const from = P.mt, to = P.t + AHEAD * rate, loop = LOOP[key];
    if (to <= from) return;
    const play = (nt, n) => { if (nt > from && nt <= to) { OS.sound.note(n[1], n[2], (nt - P.t) / rate, n[3], n[4]); P.musicOn = true; } };
    if (loop) { for (let k = Math.floor(from / loop); k <= Math.floor(to / loop); k++) notes.forEach(n => play(k * loop + n[0], n)); }
    else notes.forEach(n => play(n[0], n));
    P.mt = to;
  }

  // 监控画面里的位置（对着 Codex 的图量的）：电视屏幕是斜着的四边形（o 左上角，u 沿上边，v 沿左边）；茶几上那个盘子；敲门人站在门口地垫上
  const ROOM = { tv: { o: [252, 79], u: [37, 10], v: [-2, 34] }, plate: [157, 155, 12, 6] };
  const DOOR = { x: 117, y: 66 };

  /* ================= 图 ================= */
  const IMG = {};
  function img(n) {
    if (n in IMG) return IMG[n];
    IMG[n] = null;
    const i = new Image();
    i.onload = () => { IMG[n] = i; };
    i.src = ART + n + '.webp';
    return null;
  }

  /* ================= 状态 ================= */
  let seeds = 18;   // 客厅那盘瓜子（这次开机里一直少下去）
  const P = { win: null, ui: null, id: null, v: null, local: false, state: 'idle', t: 0, buf: 0, hold99: 0, rebufDone: false, resumeTo: 'play',
    rate: 1, step: false, speed: 2.3, subDelay: 2, subOff: false, mute: false, raf: 0, last: 0, acc: 0, presses: [], cutPct: 99, cutMore: false, cutBlocks: null,
    heldQQ: false, seedT: 0, liveT: 0, clock: 0, boom: false, mt: 0, musicOn: false,
    door: { show: false, q: [], t: 0, live: false } };   // 门口那个人：q 还要敲的几下（true = 你刚敲的，声音 folder2 已经响过了），t 这一下敲到哪了
  const fmt = s => { s = Math.max(0, Math.floor(s)); return OS.pad2(Math.floor(s / 60)) + ':' + OS.pad2(s % 60); };
  const kb = v => (v >= 0.1 ? v.toFixed(1) : v.toFixed(2));
  const sfx = n => { if (!P.mute) OS.sound.play(n); };
  const recent = () => OS.save.get('manboRecent', []);
  function addRecent(id) { OS.save.set('manboRecent', [id].concat(recent().filter(x => x !== id)).slice(0, 8)); }
  OS.on('desktop:reset', () => { seeds = 18; P.speed = 2.3; P.subDelay = 2; });
  // 老存档：电子蚊香在桌面上那一格让给慢播
  (function () {
    const pos = OS.save.get('iconPos', {});
    if (pos.coil && !pos.manbo) { pos.manbo = pos.coil; delete pos.coil; OS.save.set('iconPos', pos); }
  })();

  /* ================= 窗口 ================= */
  function ensureWin() {
    if (P.win && !P.win.isClosed) {
      if (P.win.minimized) OS.wm.restore(P.win);
      OS.wm.focus(P.win);
      return;
    }
    const cv = el('canvas', { class: 'mb-cv', width: String(W), height: String(H) });
    const live = el('div', { class: 'mb-live' });
    const over = el('div', { class: 'mb-over' });
    const toast = el('div', { class: 'mb-toast' });
    const screen = el('div', { class: 'mb-screen' }, [live, cv, over, toast]);
    const dl = el('div', { class: 'mb-dl' }), pl = el('div', { class: 'mb-pl' });
    const prog = el('div', { class: 'mb-prog' }, [dl, pl]);
    const B = (cls, text, title, fn) => { const b = el('button', { class: 'mb-b ' + cls, text, title: title || '' }); b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); fn(b); }); return b; };
    const play = B('mb-play', '▶', '', () => togglePlay());
    const stopB = B('mb-stop', '■', L.stop, () => stop());
    const ff = B('mb-ff is-off', '▶▶', L.noFF, () => flash(L.noFF));
    const mute = B('mb-mute', '♪', '', b => { P.mute = !P.mute; b.classList.toggle('on', P.mute); if (P.mute) musicHush(); });
    const accel = B('mb-txt mb-accel', L.accel, '', () => accelerate());
    const subs = B('mb-txt mb-subs', L.subs, '', () => subMenu());
    const list = B('mb-txt', L.list, '', () => toggleList());
    const status = el('div', { class: 'mb-status' });
    const box = el('div', { class: 'mb' }, [OS.ui.menuBar(L.menus, menuFor, 'mb-mbar'), screen, prog,
      el('div', { class: 'mb-btns' }, [play, stopB, ff, mute, el('span', { class: 'mb-gap' }), accel, subs, list]), status]);
    P.ui = { cv, c: cv.getContext('2d'), live, over, toast, dl, pl, prog, play, subs, status, lastStatus: '' };
    prog.addEventListener('click', e => seekClick(e));
    screen.addEventListener('click', () => { if (P.state === 'idle' || P.state === 'stop') toggleList(true); });
    P.win = OS.wm.open({ title: NAME, icon: 'manbo', width: 280, content: box, appId: app.id, maximizable: false, center: true,
      help: () => OS.ui.dialog({ title: L.about, icon: 'manbo', text: L.aboutText }),
      onClose: () => {
        cancelAnimationFrame(P.raf);
        musicHush();
        P.win = null; P.ui = null; P.state = 'idle'; P.id = null; P.v = null;
        if (P.heldQQ && OS.qianqian && OS.qianqian.resume) OS.qianqian.resume();
        P.heldQQ = false;
      } });
    P.state = 'idle';
    P.subOff = false;   // 每次打开都显示字幕
    P.syncTip = false;  // 字幕对不上的气泡：每次打开提醒一回
    P.last = 0;
    P.raf = requestAnimationFrame(loop);
  }
  function close() { if (P.win && !P.win.isClosed) P.win.close(); }

  /* ================= 放 ================= */
  function play(id, o) {
    const v = VIDS[id];
    if (!v) return;
    if (OS.soft && !OS.soft.has('manbo')) { OS.ui.dialog({ title: v.name, icon: 'error', text: L.noPlayer, sound: 'error' }); return; }
    if (HOME.indexOf(id) >= 0 && homeLocked()) { OS.ui.dialog({ title: v.name, icon: 'error', text: L.lostWhy, sound: 'error' }); return; }
    ensureWin();
    start(id, o || {});
  }
  function start(id, o) {
    const v = VIDS[id];
    P.id = id; P.v = v; P.local = !!o.local;
    P.t = 0; P.buf = 0; P.hold99 = 0; P.rebufDone = false; P.resumeTo = 'play'; P.state = 'buffer';
    P.cutMore = false; P.cutPct = 99; P.cutBlocks = null; P.seedT = 0; P.liveT = 0; P.boom = false;
    if (id === 'door') {   // 打开门口.avi：这次开机敲过几下，先放一遍（开头空 1.5 秒）
      const n = OS.folder2 && OS.folder2.knocks ? OS.folder2.knocks() : 0;
      P.door = { show: n > 0, q: Array.from({ length: n }, () => false), t: -1.5, live: false };
    }
    musicHush();
    P.step = P.rate === 'step';
    if (v.sheet) img(v.sheet);
    if (v.scene) img('cctv-' + v.scene);
    if (v.scene === 'door') img('knock');
    P.ui.over.textContent = '';
    P.ui.live.textContent = '';
    P.ui.dl.style.width = '0%';
    P.win.setTitle(v.name + ' - ' + NAME);
    addRecent(id);
    if (!P.heldQQ && OS.qianqian && OS.qianqian.hold) P.heldQQ = OS.qianqian.hold();
  }
  function togglePlay() {
    if (!P.v || P.state === 'idle' || P.state === 'stop') { if (P.v) start(P.id, { local: P.local }); else toggleList(true); return; }
    if (P.state === 'end') { start(P.id, { local: P.local }); return; }
    if (P.state === 'lost') { play(P.id); return; }
    if (P.state === 'play') { if (P.step) { P.t = Math.min(P.v.len || 1e9, P.t + 0.125); return; } P.state = 'pause'; return; }
    if (P.state === 'pause') { if (P.step) { P.t = Math.min(P.v.len || 1e9, P.t + 0.125); return; } P.state = 'play'; }
  }
  function stop() {
    if (!P.v || P.state === 'idle') return;
    P.state = 'stop'; P.t = 0;
    P.ui.over.textContent = ''; P.ui.live.textContent = '';
  }
  // ［加速］：越点越慢；正在放就重新缓冲一下；一口气连点 10 下 → 缓冲冲到 101% → 蓝屏
  function accelerate() {
    P.speed = Math.max(0.01, P.speed / 2);
    flash(L.out);
    const now = Date.now();
    P.presses = P.presses.filter(x => now - x < 4000).concat([now]);
    if (P.presses.length >= 10 && P.v && !P.boom) { overflow(); return; }
    if (P.v && (P.state === 'play' || P.state === 'pause')) { P.resumeTo = P.state; P.state = 'buffer'; P.buf = Math.min(P.buf || 100, 60); P.hold99 = 0; }
  }
  function overflow() {
    P.boom = true;
    P.state = 'buffer'; P.buf = 101;
    sfx('mbBoom');
    const dl = P.ui.dl;
    dl.classList.add('mb-boom');
    dl.style.width = '101%';
    setTimeout(() => { if (P.ui) dl.style.width = '170%'; }, 250);
    setTimeout(() => { if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD); }, 1100);
  }
  function flash(text) {
    if (!P.ui) return;
    const t = P.ui.toast;
    t.textContent = text;
    t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
  }
  // 进度条：只能往回拖（没有快进）
  function seekClick(e) {
    if (!P.v || !P.v.len || P.state === 'buffer' || P.state === 'cut' || P.state === 'idle') return;
    const r = P.ui.prog.getBoundingClientRect();
    const to = (e.clientX - r.left) / r.width * P.v.len;
    if (to > P.t + 0.3) { flash(L.noFF); return; }
    P.t = Math.max(0, to);
    musicHush();
    if (P.state === 'end' || P.state === 'stop') P.state = 'pause';
  }

  /* ================= 菜单 ================= */
  function listItems(play) {
    const ids = recent();
    const shared = ids.indexOf('wuxia') < 0 ? ['wuxia'] : [];
    return ids.concat(shared).map(id => ({ label: VIDS[id].name, action: () => play(id) }));
  }
  function subMenu(hint) {
    if (!P.ui) return;
    const b = P.ui.subs, r = OS.stage.rectOf(b);
    if (hint) { b.classList.remove('mb-hint'); void b.offsetWidth; b.classList.add('mb-hint'); }
    OS.ui.contextMenu(subItems(), r.left, r.bottom);
  }
  function subItems() {
    return [
      { label: L.subEarly, action: () => { P.subDelay = Math.round((P.subDelay - 0.5) * 10) / 10; flash(L.subInfo(P.subDelay)); } },
      { label: L.subLate, action: () => { P.subDelay = Math.round((P.subDelay + 0.5) * 10) / 10; flash(L.subInfo(P.subDelay)); } },
      { label: L.subShow, checked: !P.subOff, action: () => { P.subOff = !P.subOff; } },
      '-',
      { label: L.subInfo(P.subDelay), disabled: true }
    ];
  }
  function menuFor(name) {
    switch (name) {
      case '文件(F)': {
        const rec = recent().map(id => ({ label: VIDS[id].name, action: () => play(id) }));
        return [{ label: L.open, action: () => toggleList(true) }, { label: L.recent, sub: rec.length ? rec : [{ label: L.none, disabled: true }] }, '-', { label: L.quit, action: close }];
      }
      case '播放(P)': return [
        { label: L.playPause, action: togglePlay }, { label: L.stop, action: stop }, '-',
        { label: L.speed, sub: L.speeds.map(([r, label]) => ({ label, checked: P.rate === r, action: () => setRate(r) })) },
        { label: L.ff, action: () => flash(L.noFF) }
      ];
      case '字幕(S)': return subItems();
      case '帮助(H)': return [{ label: L.about, action: () => OS.ui.dialog({ title: L.about, icon: 'manbo', text: L.aboutText }) }];
    }
    return null;
  }
  function setRate(r) {
    P.rate = r;
    P.step = r === 'step';
    if (P.step && P.state === 'play') P.state = 'pause';
  }
  // 播放列表（文件 ▸ 打开… 也是它）：盖在画面上
  function toggleList(force) {
    const o = P.ui.over;
    if (o.querySelector('.mb-list') && !force) { o.textContent = ''; return; }
    o.textContent = '';
    const items = listItems(id => { o.textContent = ''; play(id); });
    const box = el('div', { class: 'mb-list' }, [el('div', { class: 'mb-lt', text: L.listTitle })]);
    if (!items.length) box.appendChild(el('div', { class: 'mb-le', text: L.listEmpty }));
    items.forEach(it => {
      const row = el('div', { class: 'mb-li' }, [OS.iconEl('video', 'mb-lico'), el('span', { text: it.label })]);
      row.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); it.action(); });
      box.appendChild(row);
    });
    box.addEventListener('click', e => e.stopPropagation());
    o.appendChild(box);
  }

  /* ================= 每一帧 ================= */
  function loop(now) {
    if (!P.win || P.win.isClosed || !P.ui) return;
    P.raf = requestAnimationFrame(loop);
    const dt = P.last ? Math.min(0.1, (now - P.last) / 1000) : 0;
    P.last = now;
    P.acc += dt;
    if (P.acc < 1 / 20) return;   // 一秒 20 张，像那几年的片子
    const step = P.acc;
    P.acc = 0;
    P.clock += step;
    tick(step);
    draw();
    paintUi();
  }
  function tick(dt) {
    const v = P.v;
    if (!v) return;
    if (P.state === 'buffer' || P.boom) musicHush();
    if (P.state === 'buffer' && !P.boom) {
      if (P.hold99) { P.hold99 -= dt; if (P.hold99 <= 0) { P.buf = 100; } }
      else {
        P.buf += dt * (P.speed / 2.3) * (100 / 6) * (0.5 + Math.random());
        if (P.buf >= 99 && P.buf < 100 && !P.hold99) { P.buf = 99; P.hold99 = 1.2; }
      }
      if (P.buf >= 100) {
        P.buf = 100; P.hold99 = 0;
        P.state = P.step ? 'pause' : P.resumeTo;
        P.resumeTo = 'play';
        if (v.kind === 'live') { liveShot(); setTimeout(() => { if (P.v === v && P.state !== 'buffer') OS.ui.notify({ title: L.cctvSay.title, text: L.cctvSay.text, icon: 'warn', replace: true }); }, 900); }
      }
      return;
    }
    if (P.state !== 'play' || P.step) { musicHush(); return; }
    const prev = P.t;
    P.t += dt * (typeof P.rate === 'number' ? P.rate : 1);
    musicRun();
    if (v.kind === 'film') {
      (v.sfx || []).forEach(([at, n]) => { if (prev < at && P.t >= at) sfx(n); });
      // 字幕对不上：第一句字幕出来的那一下，系统右下角的"温馨提示"冲着玩家说一句（作者：是放到出第一句字幕的时候才有）
      if (!P.syncTip && !P.subOff && P.subDelay !== 0 && v.subs && v.subs.length && P.t >= Math.max(0, v.subs[0][0] + P.subDelay)) {
        P.syncTip = true;
        OS.ui.notify({ title: L.tipTitle, icon: 'info', text: L.syncTip, timeout: 8000, replace: true, onClick: () => subMenu(true) });
      }
      if (v.rebuf && !P.rebufDone && P.t >= v.rebuf) { P.rebufDone = true; P.state = 'buffer'; P.buf = 55 + Math.random() * 15; P.hold99 = 0; return; }
      if (v.cut && P.t >= v.cut) { P.t = v.cut; enterCut(); return; }
      if (P.t >= v.len) { P.t = v.len; P.state = 'end'; }
    } else if (v.kind === 'cctv') {
      if (v.scene === 'room') {
        P.seedT += dt;
        if (P.seedT > 6 && seeds > 0) { P.seedT = Math.random() * 2; seeds--; }
      } else if (v.scene === 'door') {
        const D = P.door, before = knockFrame();
        if (D.t < 0) D.t += dt;                                   // 开头空一会儿
        else if (D.on) { D.t += dt; if (D.t >= 0.7) { D.on = false; D.t = 0; } }
        if (!D.on && D.t >= 0 && D.q.length) { D.live = D.q.shift(); D.on = true; D.t = 0; }
        const after = knockFrame();
        if (after.hit && !before.hit && !D.live) sfx('thud');      // 你刚敲的那下 新建文件夹(2) 已经咚过了，这里不再响
      }
    } else if (v.kind === 'live') {
      P.liveT += dt;
      if (P.liveT > 1.5) { P.liveT = 0; liveShot(); }
    }
  }
  function enterCut() {
    P.state = 'cut';
    sfx('mbStatic');
    // 花屏：一堆乱色块（定下来不再变）
    const cols = ['#3c8', '#c3c', '#38f', '#8f3', '#f3a', '#0aa', '#aa0'];
    P.cutBlocks = Array.from({ length: 70 }, () => [Math.floor(Math.random() * 20) * 16, Math.floor(Math.random() * 15) * 16, 16 * (1 + Math.floor(Math.random() * 3)), 16, OS.pick(cols)]);
    const o = P.ui.over;
    o.textContent = '';
    const pct = el('div', { class: 'mb-cutp', text: L.cutPct('99.00') });
    const btn = el('button', { class: 'xpbtn', text: L.more });
    btn.addEventListener('click', e => {
      e.stopPropagation();
      OS.sound.play('click');
      if (P.cutMore) return;
      P.cutMore = true; P.cutAt = P.clock;
      btn.disabled = true;
      o.querySelector('.mb-cut').appendChild(el('div', { class: 'mb-cute', text: L.eta }));
    });
    o.appendChild(el('div', { class: 'mb-cut' }, [el('div', { text: L.cut }), pct, btn]));
  }
  // 门口那个人：这次开机你敲了几下门，他就敲几下，然后一直站着
  function knockFrame() {
    const D = P.door;
    if (!D.show) return { show: false, f: 0, hit: false };
    if (!D.on) return { show: true, f: 0, hit: false };
    const ph = D.t / 0.7;
    const f = ph < 0.25 ? 1 : ph < 0.5 ? 2 : ph < 0.75 ? 3 : 0;
    return { show: true, f, hit: f === 2 };
  }
  // 门反锁了：正在放家的监控就断开（满屏雪花 + 连接已断开）
  OS.on('folder2:locked', () => {
    if (!P.v || HOME.indexOf(P.id) < 0 || !P.ui || ['idle', 'stop'].indexOf(P.state) >= 0) return;
    P.state = 'lost';
    musicHush();
    sfx('mbStatic');
    P.ui.live.textContent = '';
    const o = P.ui.over;
    o.textContent = '';
    o.appendChild(el('div', { class: 'mb-cut mb-lost' }, [el('div', { class: 'mb-cutp', text: L.lost }), el('div', { text: L.lostWhy })]));
  });
  // 你在 新建文件夹(2) 敲门：门口.avi 开着的话，监控里那个人当场跟着敲（没人的话先出现）
  OS.on('folder2:knock', () => {
    if (!P.v || P.id !== 'door') return;
    P.door.show = true;
    P.door.q.push(true);
    if (P.door.t < 0) P.door.t = 0;
  });
  // 你.avi：把你的桌面照下来（一秒半照一次）
  function liveShot() {
    if (!P.ui) return;
    const src = OS.desktop.root();
    const shot = src.cloneNode(true);
    shot.removeAttribute('id');
    shot.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    shot.classList.add('mb-desk');
    P.ui.live.textContent = '';
    P.ui.live.appendChild(shot);
  }

  /* ================= 画 ================= */
  function draw() {
    const c = P.ui.c, v = P.v;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    const live = v && v.kind === 'live' && P.state !== 'buffer' && P.state !== 'stop';
    P.ui.live.style.display = live ? '' : 'none';
    if (live) c.clearRect(0, 0, W, H); else { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }
    if (!v || P.state === 'idle' || P.state === 'stop') { drawIdle(c); return; }
    if (P.state === 'lost') { snow(c); return; }
    const started = P.t > 0 || P.state !== 'buffer' || P.rebufDone || P.resumeTo === 'pause';
    if (started) {
      if (v.kind === 'film') drawFilm(c, v);
      else if (v.kind === 'cctv') drawCctv(c, v);
      else drawLiveOverlay(c, v);
    }
    if (P.state === 'buffer') drawBuffer(c, started);
    if (P.state === 'pause' && !P.step) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H); bigText(c, '❚❚', W / 2, H / 2 + 10, 30); }
    if (P.state === 'end') { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, W, H); bigText(c, L.ended, W / 2, H / 2 + 6, 16); }
  }
  function bigText(c, t, x, y, size) {
    c.font = 'bold ' + size + 'px "Microsoft YaHei", SimHei, sans-serif';
    c.textAlign = 'center';
    c.lineWidth = 3; c.strokeStyle = '#000'; c.strokeText(t, x, y);
    c.fillStyle = '#fff'; c.fillText(t, x, y);
  }
  function drawIdle(c) {
    const s = img('snail'), f = Math.floor(P.clock * 2) % 2;
    const x = 160 + Math.sin(P.clock * 0.3) * 40;
    if (s) c.drawImage(s, f * 160, 0, 160, 120, x - 80, 60, 160, 120);
    else drawSnail(c, x, 130, f);
    c.font = '12px "Microsoft YaHei", SimSun, sans-serif';
    c.textAlign = 'center'; c.fillStyle = '#aab';
    c.fillText(L.idle, W / 2, 205);
  }
  function drawSnail(c, x, y, f) {
    const st = f ? 6 : 0;
    c.fillStyle = '#f3d98a'; c.strokeStyle = '#7a5a2a'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(x + st / 2, y + 22, 52 + st, 12, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x + 40 + st, y + 14); c.lineTo(x + 50 + st, y - 10); c.moveTo(x + 48 + st, y + 14); c.lineTo(x + 62 + st, y - 6); c.stroke();
    c.fillStyle = '#ff9a1e'; c.beginPath(); c.arc(x - 6, y - 4, 30, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 16, y - 18); c.lineTo(x + 10, y - 4); c.lineTo(x - 16, y + 10); c.closePath(); c.fill();
  }
  function drawBuffer(c, started) {
    c.fillStyle = started ? 'rgba(0,0,0,.55)' : '#000';
    c.fillRect(0, 0, W, H);
    // 转圈的小点
    for (let i = 0; i < 8; i++) {
      const a = P.clock * 4 + i * Math.PI / 4;
      c.fillStyle = 'rgba(255,255,255,' + (0.15 + 0.1 * i) + ')';
      c.beginPath(); c.arc(W / 2 + Math.cos(a) * 18, H / 2 - 12 + Math.sin(a) * 18, 3, 0, Math.PI * 2); c.fill();
    }
    bigText(c, L.bufBig(Math.floor(P.buf)), W / 2, H / 2 + 34, 15);
  }

  /* ---------- 片子 ---------- */
  function shotAt(v, t) {
    let i = 0;
    for (let k = 0; k < v.shots.length; k++) if (t >= v.shots[k].t) i = k;
    return i;
  }
  function drawFilm(c, v) {
    const t = P.t, i = shotAt(v, t), s = v.shots[i];
    c.save();
    if (v.cam) camBegin(c);
    drawShot(c, v, s, t);
    const into = t - s.t;
    if (i > 0 && into < 0.35) { c.globalAlpha = 1 - into / 0.35; drawShot(c, v, v.shots[i - 1], t); c.globalAlpha = 1; }
    c.restore();
    if (v.cam) camEnd(c, v, t);
    drawPops(c, v, t);
    if (P.state === 'cut' && P.cutBlocks) P.cutBlocks.forEach(([x, y, w, h, col]) => { c.fillStyle = col; c.fillRect(x, y, w, h); });
    grain(c, 90);
    if (!P.subOff) drawSubs(c, v, t);
  }
  function drawShot(c, v, s, t) {
    if (s.draw) { drawCard(c, s.draw, t - s.t); return; }
    const p = Math.max(0, Math.min(1, (t - s.t) / s.d));
    const lerp = a => a[0] + (a[1] - a[0]) * p;
    const z = lerp(s.z), sw = W / z, sh = H / z;
    const sx = (W - sw) / 2 * (1 + lerp(s.x)), sy = (H - sh) / 2 * (1 + lerp(s.y));
    c.save();
    c.transform(z, 0, 0, z, -sx * z, -sy * z);
    const im = img(v.sheet);
    if (im) c.drawImage(im, (s.f % 4) * W, Math.floor(s.f / 4) * H, W, H, 0, 0, W, H);
    else placeholder(c, v.sheet, s.f);
    if (v.board && v.board[s.f]) chalk(c, v.board[s.f], t - s.t);
    c.restore();
  }
  // 黑板上的粉笔字：一个字一个字写出来
  function chalk(c, b, into) {
    c.font = '15px "Comic Sans MS", "Segoe Print", cursive';
    c.textAlign = 'left';
    c.fillStyle = 'rgba(245,245,235,.9)';
    let shown = Math.floor(into * 9);
    b.lines.forEach((ln, k) => {
      const n = Math.max(0, Math.min(ln.length, shown));
      shown -= ln.length;
      if (n) c.fillText(ln.slice(0, n), b.x + (k && ln.length < 6 ? 6 : 0), b.y + 18 + k * 26);
    });
  }
  // 英语听力：黑底白字
  function drawCard(c, which, into) {
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.textAlign = 'left'; c.fillStyle = '#fff';
    const lines = which === 'listenA'
      ? [[0.3, 'bold 15px Arial', 'Part I  Listening Comprehension', 30], [3, '11px Arial', 'Directions: You will hear a short conversation.', 62],
        [4.5, 'bold 12px Arial', '1. What does the man mean?', 98], [5.3, '12px Arial', 'A) He is tired.', 124], [5.8, '12px Arial', 'B) He is hungry.', 144],
        [6.3, '12px Arial', 'C) He is late.', 164], [6.8, '12px Arial', 'D) He is a movie.', 184]]
      : [[0.2, 'bold 13px Arial', 'Question 1: What is the movie about?', 70], [1, '12px Arial', 'A) A meteor', 104], [1.4, '12px Arial', 'B) A big wave', 124],
        [1.8, '12px Arial', 'C) Love', 144], [2.2, '12px Arial', 'D) All of the above', 164]];
    lines.forEach(([at, font, text, y]) => { if (into >= at) { c.font = font; c.fillText(text, 24, y); } });
  }
  // 象声词：在声音响的那一下从画面里蹦出来（黄字红边，弹一下、晃一下、再淡掉）；[几秒, 字, 大小倍数, x, y]
  function drawPops(c, v, t) {
    (v.pops || []).forEach(([at, text, size, px, py], k) => {
      const p = t - at;
      if (p < 0 || p > 1.1) return;
      const big = size || 1, s0 = p < 0.12 ? 0.4 + p / 0.12 * 0.85 : p < 0.22 ? 1.25 - (p - 0.12) / 0.1 * 0.25 : 1;
      const x = px || (k % 2 ? 196 : 124), y = py || (k % 3 === 0 ? 96 : k % 3 === 1 ? 118 : 84);
      c.save();
      c.globalAlpha = p > 0.85 ? 1 - (p - 0.85) / 0.25 : 1;
      c.translate(x + Math.sin(p * 40) * (p < 0.3 ? 2 : 0), y);
      c.rotate((k % 2 ? 0.12 : -0.12));
      c.scale(s0 * big, s0 * big);
      c.font = '900 30px "Microsoft YaHei", SimHei, sans-serif';
      c.textAlign = 'center'; c.lineJoin = 'round';
      c.lineWidth = 8; c.strokeStyle = '#1a0a00'; c.strokeText(text, 0, 0);
      c.lineWidth = 4; c.strokeStyle = '#e8261c'; c.strokeText(text, 0, 0);
      const g = c.createLinearGradient(0, -24, 0, 6);
      g.addColorStop(0, '#fff7b0'); g.addColorStop(1, '#ffc21a');
      c.fillStyle = g; c.fillText(text, 0, 0);
      c.restore();
    });
  }
  function drawSubs(c, v, t) {
    const d = P.subDelay;
    const cur = (v.subs || []).filter(([at, dur]) => t >= at + d && t < at + d + dur).pop();
    if (!cur) return;
    const [, , zh, en] = cur;
    c.textAlign = 'center';
    c.lineJoin = 'round';
    if (en) {
      c.font = 'bold 11px Arial';
      c.lineWidth = 3; c.strokeStyle = '#000'; c.strokeText(en, W / 2, H - 34);
      c.fillStyle = '#ffe14a'; c.fillText(en, W / 2, H - 34);
    }
    c.font = 'bold 15px "Microsoft YaHei", SimHei, sans-serif';
    c.lineWidth = 4; c.strokeStyle = '#000'; c.strokeText(zh, W / 2, H - 14);
    c.fillStyle = '#fff'; c.fillText(zh, W / 2, H - 14);
  }
  // 枪版：在电影院里拿摄像机对着银幕拍的——歪、抖、四周黑、底下一排后脑勺
  function camBegin(c) {
    const k = P.clock;
    c.translate(W / 2, H / 2);
    c.rotate(-0.03 + Math.sin(k * 1.3) * 0.004);
    c.scale(0.9, 0.9);
    c.translate(-W / 2 + Math.sin(k * 7) * 1.2, -H / 2 - 8 + Math.cos(k * 5) * 1);
  }
  function camEnd(c, v, t) {
    const g = c.createRadialGradient(W / 2, H / 2, 70, W / 2, H / 2, 210);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.85)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#060606';
    for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(20 + i * 48 + (i % 2) * 8, H + 6 - (i % 3) * 3, 19, 22, 0, 0, Math.PI * 2); c.fill(); }
    // 有人站起来，挡着屏幕走过去
    if (v.walker && t >= v.walker[0] && t < v.walker[0] + v.walker[1]) {
      const p = (t - v.walker[0]) / v.walker[1], x = -70 + p * 460, rise = Math.min(1, p * 6, (1 - p) * 6);
      const y = H + 30 - rise * 70;
      c.fillStyle = '#040404';
      c.beginPath(); c.ellipse(x, y, 34, 40, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x, y + 70, 70, 40, 0, 0, Math.PI * 2); c.fill();
      if (rise > 0.8) bubble(c, x + 30, y - 46, L.walker);
    }
    if (v.phone && t >= v.phone[0] && t < v.phone[0] + v.phone[1] && Math.floor(t * 6) % 2) {
      c.fillStyle = '#9cf'; c.fillRect(250, 214, 12, 16);
      c.fillStyle = 'rgba(150,200,255,.25)'; c.beginPath(); c.arc(256, 222, 18, 0, Math.PI * 2); c.fill();
    }
    if (v.shh && t >= v.shh[0] && t < v.shh[0] + v.shh[1]) bubble(c, 70, 200, L.shh);
  }
  function bubble(c, x, y, text) {
    c.font = 'bold 11px "Microsoft YaHei", SimHei, sans-serif';
    const w = c.measureText(text).width + 12;
    c.fillStyle = 'rgba(255,255,255,.92)'; c.strokeStyle = '#000'; c.lineWidth = 1;
    c.beginPath(); c.rect(x - w / 2, y - 12, w, 18); c.fill(); c.stroke();
    c.fillStyle = '#000'; c.textAlign = 'center'; c.fillText(text, x, y + 1);
  }
  function snow(c) {
    for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) { const g = Math.random() * 200 | 0; c.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')'; c.fillRect(x, y, 3, 3); }
  }
  function grain(c, n) {
    for (let i = 0; i < n; i++) {
      c.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.18)';
      c.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 1.5, 1);
    }
  }
  // Codex 的图还没来时先用的简单画面
  function placeholder(c, sheet, f) {
    const pal = { wuxia: ['#0b1a3a', '#2a3a66'], film: ['#f2913c', '#5a1f1f'], math: ['#3a2f24', '#1d1812'] }[sheet] || ['#222', '#444'];
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.08)';
    c.beginPath(); c.arc(60 + f * 28, 60 + (f % 3) * 30, 40, 0, Math.PI * 2); c.fill();
    if (sheet === 'wuxia') {
      c.fillStyle = '#f4f0c8'; c.beginPath(); c.arc(236, 62, 32, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#05070f'; c.fillRect(0, 170, W, 70);
      c.beginPath(); c.moveTo(70 + f * 6, 170); c.lineTo(78 + f * 6, 120); c.lineTo(86 + f * 6, 170); c.fill();
      c.beginPath(); c.moveTo(230 - f * 6, 170); c.lineTo(238 - f * 6, 118); c.lineTo(246 - f * 6, 170); c.fill();
    } else if (sheet === 'film') {
      c.fillStyle = '#ffdc6a'; c.beginPath(); c.arc(220 - f * 10, 50 + f * 6, 20, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,220,106,.6)'; c.lineWidth = 8; c.beginPath(); c.moveTo(220 - f * 10, 50 + f * 6); c.lineTo(300, 0); c.stroke();
      c.fillStyle = '#2a0f0f';
      for (let i = 0; i < 9; i++) c.fillRect(i * 36, 150 - (i * 37 % 60), 30, 100);
    } else if (sheet === 'math') {
      c.fillStyle = '#21402c'; c.fillRect(24, 22, 272, 150);
      c.strokeStyle = '#8a6a3a'; c.lineWidth = 6; c.strokeRect(24, 22, 272, 150);
      if (f >= 2 && f !== 6) {
        c.strokeStyle = 'rgba(240,240,230,.85)'; c.lineWidth = 2;
        c.beginPath(); c.arc(110, 80, 9, 0, Math.PI * 2); c.moveTo(110, 89); c.lineTo(110, 125); c.lineTo(98, 150); c.moveTo(110, 125); c.lineTo(122, 150); c.moveTo(94, 100); c.lineTo(128, 100); c.stroke();
        c.beginPath(); c.arc(210, 80, 9, 0, Math.PI * 2); c.moveTo(210, 89); c.lineTo(210, 125); c.lineTo(198, 150); c.moveTo(210, 125); c.lineTo(222, 150); c.moveTo(194, 100); c.lineTo(228, 100); c.stroke();
      }
    }
  }

  /* ---------- 监控 ---------- */
  function drawCctv(c, v) {
    const im = img('cctv-' + v.scene);
    if (im) c.drawImage(im, 0, 0, W, H);
    else {
      c.fillStyle = '#5c6a5c'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#4a564a';
      if (v.scene === 'room') { c.fillRect(20, 120, 110, 60); c.fillRect(196, 132, 96, 50); c.fillRect(212, 90, 66, 48); c.fillRect(110, 168, 100, 30); }
      else { c.fillRect(110, 40, 100, 170); c.fillStyle = '#6a786a'; c.fillRect(100, 205, 120, 20); }
    }
    if (v.scene === 'room') { drawTv(c); drawSeeds(c); }
    if (v.scene === 'door') drawKnocker(c);
    cctvOverlay(c, v.cam, true);
  }
  // 电视里的天气预报：地图一闪一闪，晴、多云来回换
  function drawTv(c) {
    const T = ROOM.tv, w = 58, h = 40, x = 0, y = 0, k = P.clock;
    c.save();
    c.transform(T.u[0] / w, T.u[1] / w, T.v[0] / h, T.v[1] / h, T.o[0], T.o[1]);
    c.fillStyle = '#2c342c'; c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(190,205,190,' + (0.55 + Math.sin(k * 9) * 0.1) + ')';
    c.beginPath(); c.moveTo(x + 8, y + 12); c.lineTo(x + 26, y + 6); c.lineTo(x + 44, y + 10); c.lineTo(x + 50, y + 24); c.lineTo(x + 34, y + 34); c.lineTo(x + 14, y + 30); c.closePath(); c.fill();
    const sunny = Math.floor(k / 2) % 2 === 0;
    c.fillStyle = '#f2f2e8';
    if (sunny) { c.beginPath(); c.arc(x + 30, y + 18, 5, 0, Math.PI * 2); c.fill(); }
    else { c.beginPath(); c.arc(x + 27, y + 19, 4, 0, Math.PI * 2); c.arc(x + 33, y + 17, 5, 0, Math.PI * 2); c.arc(x + 38, y + 20, 3.5, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  function drawSeeds(c) {
    const [cx, cy, rx, ry] = ROOM.plate;
    for (let i = 0; i < seeds; i++) {
      const a = i * 2.39996, r = Math.sqrt((i + 0.5) / 18);
      const x = cx + Math.cos(a) * r * (rx - 2.5), y = cy + Math.sin(a) * r * (ry - 1.5);
      c.fillStyle = '#1c221c'; c.beginPath(); c.ellipse(x, y, 1.9, 1.05, a, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(220,230,220,.6)'; c.fillRect(x - 0.5, y - 0.5, 1, 1);
    }
  }
  function drawKnocker(c) {
    const k = knockFrame();
    if (!k.show) return;
    const im = img('knock');
    if (im) c.drawImage(im, k.f * 96, 0, 96, 128, DOOR.x, DOOR.y, 96, 128);
    else {
      c.fillStyle = '#2a302a';
      c.beginPath(); c.ellipse(DOOR.x + 48, DOOR.y + 30, 16, 18, 0, 0, Math.PI * 2); c.fill();
      c.fillRect(DOOR.x + 26, DOOR.y + 48, 44, 70);
      if (k.f) c.fillRect(DOOR.x + 60, DOOR.y + (k.f === 2 ? 30 : 40), 14, 26);
    }
  }
  function drawLiveOverlay(c, v) { cctvOverlay(c, v.cam, false); bigLive(c); }
  function bigLive(c) {
    c.fillStyle = 'rgba(200,0,0,.85)'; c.fillRect(W - 54, 26, 40, 15);
    c.font = 'bold 10px "Microsoft YaHei", sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff';
    c.fillText(L.live, W - 34, 37);
  }
  // 监控的样子：横纹、雪花、REC 红点、摄像头编号、时间；时不时一道横的抖一下
  function cctvOverlay(c, cam, noisy) {
    if (noisy && Math.floor(P.clock * 10) % 47 === 0) {
      const y = Math.random() * (H - 20);
      c.drawImage(P.ui.cv, 0, y, W, 14, 6, y, W, 14);
    }
    c.fillStyle = 'rgba(0,0,0,.22)';
    for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
    if (noisy) grain(c, 160);
    c.font = 'bold 11px "Courier New", monospace'; c.textAlign = 'left';
    if (Math.floor(P.clock) % 2 === 0) { c.fillStyle = '#f22'; c.beginPath(); c.arc(16, 15, 4, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#fff'; c.fillText('REC', 24, 19);
    c.textAlign = 'right'; c.fillText(cam, W - 10, 19);
    const d = OS.clock.now();
    c.textAlign = 'left';
    c.fillText(OS.YEAR + '-' + OS.pad2(d.getMonth() + 1) + '-' + OS.pad2(d.getDate()) + ' ' + OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes()) + ':' + OS.pad2(d.getSeconds()), 10, H - 10);
  }

  /* ---------- 下面那一排 ---------- */
  function paintUi() {
    const u = P.ui, v = P.v;
    if (!u) return;
    u.play.textContent = P.state === 'play' && !P.step ? '❚❚' : '▶';
    let st = L.ready;
    if (v && !P.boom) {
      const len = v.len;
      const pct = len ? Math.min(100, P.t / len * 100) : 0;
      u.pl.style.width = (len ? pct : 0) + '%';
      const dlPct = v.cut ? 99 : (P.state === 'buffer' && !P.t ? P.buf : 100);
      u.dl.style.width = dlPct + '%';
      const tail = !P.local && v.kind !== 'live' ? '　' + L.net : '';
      if (P.state === 'buffer') st = L.buffering(Math.floor(P.buf), kb(P.speed));
      else if (P.state === 'cut') st = L.cutPct(P.cutMore ? (99 + Math.min(0.99, Math.floor((P.clock - P.cutAt) / 3) / 100)).toFixed(2) : '99.00') + (P.cutMore ? '　' + L.eta : '');
      else if (P.state === 'stop') st = L.stopped;
      else if (P.state === 'lost') st = L.lostStatus;
      else if (P.state === 'end') st = L.ended;
      else if (v.kind === 'live') st = L.live + '　' + v.cam;
      else if (v.kind === 'cctv') st = fmt(P.t) + '　' + v.cam + tail;
      else st = (P.step ? L.stepping + '　' : P.state === 'pause' ? L.paused + '　' : '') + L.time(fmt(P.t), fmt(len)) + tail;
      if (P.state === 'cut') { const p = u.over.querySelector('.mb-cutp'); if (p) p.textContent = st.split('　')[0]; }
    } else if (P.boom) st = L.bufBig(101);
    if (st !== u.lastStatus) { u.status.textContent = st; u.lastStatus = st; }
  }

  app.open = () => ensureWin();
  OS.manbo = { play, open: ensureWin, close };
})();
