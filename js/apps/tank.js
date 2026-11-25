/* 怪怪水煮箱（幻觉游戏 V3.0 第一款）——第六版：箱庭（2026-11-25 作者定稿，创意稿「怪怪水煮箱-创意.md」第六版；这一步先做第一个展区"浅水湾"）
   海狗在景区超大型野生水族馆摆水煮鱼摊。画面跟着海狗卷轴：上面一条木头栈道（岸），下面一大片水。
   - 按住屏幕哪儿，海狗往哪儿走 ／ 游（电脑上方向键 ／ WASD）；点一下岸上的东西走过去用；捡到推进器以后，在水里快点一下往那边冲
   - 碰到比自己小的鱼就叼住（鱼篓装几条看升级）；憋气条用完自动漂上去；回到摊位前鱼倒进盆里，珍珠直接卖、破烂扔垃圾桶
   - 点锅开始做菜：游客闻着味围过来评价这批鱼 → 选配方 → 自动下汤底加水下鱼烧开 → 等最亮的绿点一下开锅（过了最佳一点点变差，到头糊了）→
     煮的时候不爱这口味的游客走掉 → 出锅后游客举价钱泡泡（大胃口一次要好几条），点泡泡卖，等等看可能加价也可能走；"全卖了"一口气收；
     游客都走了鱼还没卖完：锅保温着，过一阵新游客来；保温时间到了凉了，剩下的三折处理
   - 商人：岸上每天两位（海象、鹈鹕、水獭轮着来，只卖做饭、做买卖的东西）；章鱼小铺藏在深海的石洞里；帐篷睡一觉就是第二天
   - 水下（11-25 作者说深海太小、道具摆脸上不像银河城 → 改成洞穴地图，地形在 tank-bay.js）：过地形的东西全藏在海里自己找——
     沉船最里头的推进器（撞开裂石下深海）→ 深海窄洞里的大脚蹼（过急流）→ 礁石迷宫尽头的头灯（下最黑的深海）；
     还有暗道、往下冲的单向水流、气泡泉（回满气）、3 个氧气瓶、两堆珍珠、进水口阀门（拧开后管子直通岸上）；菜单里有地图
   - 敲锣叫大胃王（三位）：点菜限时，按单子抓鱼做菜；第三位大白鲨吃完追你下水，绕到背后咬尾巴；血没了"海狗被大白鲨吃了"［重新再来］［下次挑战］
   - 家里的水族箱（怪怪水族箱的味儿）：养备用鱼，不喂不会死，喂了长大到戴王冠；鱼会掉小钱；撒不出鱼食时点水里 = 敲玻璃 → 裂 → 蓝屏
   坐标：屏幕 320×240（画布 800×600，显示 376×282）；镜头推近 4/3 倍（作者要的），一屏看世界 240×180；世界（浅水湾）1280×1200。
   图：第六版的新图「codex任务包/怪怪水煮箱-第六版-浅水湾素材.md」放 assets/tank/v6/，来了一张就把名字加进 V6；没来之前先用以前的图和代码画的顶着 */
(function () {
  'use strict';
  const el = OS.el;
  const W = 320, H = 240, SC = 2.5;
  const FONT = '"Microsoft YaHei", SimHei, sans-serif';

  /* ================= 浅水湾的地形：在 tank-bay.js 里（改地形去那边） ================= */
  const BAY = OS.tankBay;
  const WW = BAY.WW, WH = BAY.WH, GY = BAY.GY, WY = BAY.WY;
  const Z = 4 / 3, VW = W / Z, VH = H / Z;                 // 镜头推近：一屏看世界 240×180
  const SPOT = { tent: 40, tank: 92, pot: 150, basin: 109, gong: 198, bin: 222, pipe: 252, mA: 300, mB: 384, gate: WW - 45 };   // basin：摊子左边那只装鱼的木盆
  const RAIL = 580;                                        // 再往右栈道有栏杆：跳不下水，也爬不上来
  const STALL_CX = 190;                                    // 做菜、大胃王的时候镜头对着摊子中间
  const SEAL_R = 7;                                        // 海狗撞墙按这么大的圈算
  const TREASURE = Object.keys(BAY.THINGS);                // 地图上"宝贝 几/几"
  const CH = 120;                                          // 石头按 120×120 一块一块画（算好的图存起来）

  /* ================= 图 ================= */
  const V6 = ['rock', 'sand', 'boat', 'boatin', 'crack', 'seal', 'fish6', 'crown', 'tent', 'stall', 'pot6', 'basin6', 'gong', 'tanks', 'merchants', 'tourists6', 'judges', 'shark', 'seabed6', 'icons6', 'tankview', 'title6',   // Codex 浅水湾新画风（11-25，照定样重画的）
    'far-shallow', 'far-mid', 'far-deep', 'backwall', 'ledges', 'front', 'decor', 'caustics', 'vent', 'inlet', 'valve', 'shore-far', 'shore-mid', 'deck', 'post', 'rail', 'gate', 'pipe-shore',   // 纵深那批
    'panel', 'btn', 'hud', 'airbar', 'bubble', 'say', 'order', 'fighticons', 'topbar6', 'slot6', 'bin',   // 界面那批（11-25 到的）
    'potside', 'potclose', 'tub'];   // 锅补图：侧面的锅、锅里特写、侧面的木盆
  const OLD = ['title', 'topbar', 'slots', 'fish-extra', 'cracks', 'contract', 'tourists', 'pot', 'helpers2', 'seabed', 'clam', 'kit'];   // 以前画的，新图没来之前先顶着
  const IMG = {};
  function art(n) {
    const dir = V6.indexOf(n) >= 0 ? 'assets/tank/v6/' : OLD.indexOf(n) >= 0 ? 'assets/tank/' : null;
    if (!dir) return null;
    if (n in IMG) return IMG[n];
    IMG[n] = null;
    const i = new Image();
    i.onload = () => { IMG[n] = i; };
    i.src = dir + n + '.webp';
    return null;
  }
  let artLoaded = false;
  const loadArt = () => { if (!artLoaded) { artLoaded = true; V6.concat(OLD).forEach(art); } };
  const BSOD = { id: 'tank', name: 'TANK_GLASS_CRACKED', text: '不奔腾刚刚以为进水了，吓得停止工作了' };

  /* ================= 文案 ================= */
  const L = {
    title: '怪怪水煮箱', sub: '加辣版', loading: '生火中',
    start: '开始', cont: '接着玩', helpBtn: '帮助', quit: '退出', back: '返回', yes: '好', no: '算了',
    restartAsk: '重新开始会把存档清掉，\n确定吗？',
    day: d => '第 ' + d + ' 天', zone: '浅水湾',
    basketFull: '鱼篓满了，先回岸上', airOut: '憋不住了！', current: '急流太冲，游不过去',
    rail: '这边有栏杆，跳不下去', tooDark: '太黑了，不敢再往下游', crackHit: '石头裂了缝', crackBroke: '轰！石头撞开了', secret: '暗道！', breath: '换了口气',
    airHome: '憋不住了！拼命游回了岸边',
    gear: { thruster: '捡到一个推进器！\n八成是景区潜水员掉的。\n能往前猛冲一下，撞开裂了缝的石头。', fins: '捡到一双大脚蹼！\n这下逆着急流也游得过去了。', lamp: '捡到一盏头灯！\n最黑的深海也敢下去了。', o2: '捡到一个氧气瓶！\n憋气多了 10 秒。' },
    stash: n => '石缝里藏着一堆珍珠！\n叼走 ' + n + ' 颗。', valve: '拧开了进水口的阀门！\n管子直通岸上锅旁边，\n以后一下就上去了。',
    pipeShut: '一根粗水管，通到水底下。\n那头堵着。', pipeGo: '钻进管子，\n直接下到海底进水口？', pipeYes: '钻',
    mapT: '浅水湾', mapN: (a, b) => '宝贝 ' + a + '/' + b, mapKey: ['摊子', '海狗', '气泡泉', '找到的宝贝'],
    dumped: n => '倒进盆里 ' + n + ' 条', basinFull: '盆里装不下了', pearlSold: (n, m) => '卖了 ' + n + ' 颗珍珠，' + m + ' 块', junkBin: m => '破烂扔进垃圾桶，景区给了 ' + m + ' 块',
    gotPearl: '叼到一颗珍珠', clank: '当！', gotJunk: { shoe: '一只破鞋', can: '一个易拉罐', tire: '一个烂轮胎' },
    bottle: { sour: '漂流瓶：里面是一张酸菜鱼的配方！', money: n => '漂流瓶：里面卷着 ' + n + ' 块钱！' },
    emptyBasin: '盆里没鱼，先下水抓', busy: '锅里还没卖完',
    judge: { S: ['就这么小一条？', '小了点吧', '塞牙缝的'], M: ['还行吧', '中规中矩', '凑合'], L: ['这鱼真肥！', '个头不错！', '闻着就香'], K: ['哇，鱼王！', '鱼王！今天赚到了', '这么大一条！'] },
    pickRecipe: '选配方', steps: ['下汤底', '加水', '下鱼', '烧开'], openPot: '点锅开锅',
    best: '火候正好！', good: '火候不错', raw: '还没熟……', over: '煮过头了', burnt: '糊了……',
    leave: ['不爱吃这个', '摇摇头走了', '……算了'], bid: (k, p) => k + ' 条 ' + p, sellAll: '全卖了',
    warm: '保温中', cold: (n, m) => '凉了，剩下 ' + n + ' 条三折处理，' + m + ' 块', sold: m => '+' + m,
    tent: '睡一觉？\n明天商人换一批，水里的鱼也补满。', sleep: '睡觉', morning: d => '第 ' + d + ' 天，早上好！',
    shop: n => n + '的摊子', owned: '已买', maxed: '满了', buy: p => p + ' 块', noMoney: '钱不够',
    gate: '珊瑚礁展区\n要摊位许可证才能过去。', gateSoon: '珊瑚礁展区还在装修，敬请期待。',
    gong: n => '敲锣叫第 ' + n + ' 位大胃王？\n他会点菜，限时做出来。', gongDone: '三位大胃王都服了。', gongBusy: '先把手上这锅卖完',
    alarm: '警告！大胃王驾到！',
    order: (who, i, n) => who + ' 点菜' + (n > 1 ? ' 第 ' + i + ' 道' : ''),
    needFish: f => '盆里的鱼不够：' + f, wrongRecipe: '我点的不是这个！', bossBad: '火候不行，重做！', bossGood: '嗯，就是这个味儿！',
    bossTimeout: '大胃王等不及，摇摇头走了。\n下次再敲锣，什么都不丢。', bossPass: (n, m) => n + '吃满意了！\n赏你 ' + m + ' 块。',
    sharkEye: '……你看起来更好吃。', sharkChase: '大白鲨追着海狗跳下水了！', bitTail: '咬到尾巴了！', gotBit: '被咬了一口！',
    eaten: '海狗被大白鲨吃了。', retry: '重新再来', later: '下次挑战',
    license: '大白鲨服了，签了字：\n珊瑚礁展区摊位许可证！\n另外赏你 1000 块。', fix: '装修中',
    tankNone: '还没有水族箱，\n去水獭那儿买一个。', tankBtns: ['撒鱼食 5', '放进来', '回岸上'], tankFull: '水族箱满了', tankPut: n => '放进来 ' + n + ' 条', tankTake: '捞出来放进盆里',
    menu: ['继续', '声音：开', '声音：关', '回标题画面', '地图'], air: '憋气',
    disc: '请插入"幻觉游戏 V3.0"光盘。',
    wonder: '北极熊和企鹅同时出现？我是产生幻觉了吗？',
    help: [
      '你是一只海狗，在景区的大水族馆里摆水煮鱼摊。',
      '· 按住屏幕哪儿，海狗就往哪儿走、往哪儿游，电脑上也能按方向键。点一下岸上的东西就走过去用。',
      '· 下水碰到小鱼就叼住，回到摊位前鱼倒进盆里。憋气条用完会拼命游回岸边。',
      '· 海里藏着好些东西，拿到了才过得去更深的地方。有了推进器，在水里快点一下就往那边冲。菜单里有地图。',
      '· 点锅做菜：选配方，等最亮的绿点一下开锅。游客出价，点价钱泡泡卖给他；等一等可能加价，也可能走。',
      '· 帐篷里睡一觉就是第二天，岸上的商人换一批。',
      '· 敲锣叫大胃王：按他点的菜抓鱼、做菜，限时。三位都服了，拿到下一个展区的许可证。',
      '· 家里的水族箱能养备用鱼，点水里撒鱼食，鱼越喂越大。'
    ]
  };
  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const dist = (a, b, x, y) => Math.hypot(a - x, b - y);

  /* ================= 数据 ================= */
  const SPECIES = {
    yellow: { n: '小黄鱼', len: [9, 11, 14, 17], val: [6, 9, 14, 24], col: '#f2c230', fin: '#d89a10', row: 0 },
    bass: { n: '鲈鱼', len: [13, 17, 22, 26], val: [12, 18, 28, 48], col: '#b8c4cc', fin: '#6a7a88', row: 1 },
    squid: { n: '墨鱼', len: [12, 15, 19, 23], val: [14, 20, 30, 50], col: '#ecc8d4', fin: '#c88aa0', row: 2, squid: true },
    croaker: { n: '大黄鱼', len: [18, 23, 28, 33], val: [24, 36, 55, 90], col: '#f0b020', fin: '#c87a00', row: 3 }
  };
  const SIZE_N = ['小', '中', '大', '鱼王'];
  const REGIONS = BAY.REGIONS;   // 野生鱼住在哪儿（在 tank-bay.js）
  const RECIPES = {
    clear: { n: '清汤水煮', fl: '清淡', mul: 1, col: '#e8f0d8' },
    spicy: { n: '麻辣水煮', fl: '辣', mul: 1.2, col: '#d8301a' },
    sour: { n: '酸菜鱼', fl: '酸', mul: 1.3, col: '#e8c840' }
  };
  const TOURISTS = {
    shark: { n: '鲨鱼', like: 'spicy', hate: 'clear', eat: 2, row: 0, e: '🦈' },
    bird: { n: '海鸟', like: 'clear', hate: 'spicy', eat: 1, row: 1, e: '🐦' },
    bear: { n: '北极熊', like: 'sour', hate: null, eat: 3, row: 2, e: '🐻‍❄️' },
    penguin: { n: '企鹅', like: 'sour', hate: 'spicy', eat: 1, row: 3, e: '🐧' }
  };
  const TOUR_POOL = ['shark', 'shark', 'bird', 'bird', 'penguin', 'penguin', 'bear'];
  const ITEMS = {
    recipeSpicy: { n: '麻辣水煮配方', d: '学会麻辣水煮：辣，鲨鱼爱吃，海鸟企鹅怕辣', cost: [150], ic: 1, e: '🌶' },
    pot: { n: '大锅', d: '一锅多煮几条', cost: [200, 500], ic: 10, e: '🍲' },
    warm: { n: '保温锅盖', d: '卖不完的鱼保温更久', cost: [150, 300], ic: 11, e: '🫕' },
    basket: { n: '鱼篓', d: '下一次水能多叼一条', cost: [100, 250, 500], ic: 3, e: '🧺' },
    tank: { n: '水族箱', d: '养备用鱼：不喂不会死，喂了长大', cost: [200, 500, 1200, 2500], names: ['小号水族箱', '中号水族箱', '大号水族箱', '特大号水族箱'], ic: 13, e: '🐠' },
    food: { n: '好鱼食', d: '水族箱里的鱼长得快一倍', cost: [120], ic: 12, e: '✨' },
    speed: { n: '游得快', d: '在水里游得更快', cost: [150, 350, 700], ic: 6, e: '💨' },
    hp: { n: '皮厚', d: '打架的时候多一滴血', cost: [300], ic: 9, e: '🛡' }
  };
  // 海里自己找的东西（不卖）
  const GEAR = { thruster: { n: '推进器', ic: 7, e: '🚀' }, fins: { n: '大脚蹼', ic: 4, e: '🦶' }, lamp: { n: '头灯', ic: 5, e: '🔦' }, o2: { n: '氧气瓶', ic: 8, e: '🫧' } };
  const MERCHANTS = {
    walrus: { n: '海象', items: ['recipeSpicy', 'pot', 'warm'], cell: 0, e: '🦭' },
    pelican: { n: '鹈鹕', items: ['basket'], cell: 1, e: '🦤' },
    otter: { n: '水獭', items: ['tank', 'food'], cell: 2, e: '🦦' },
    octopus: { n: '章鱼', items: ['speed', 'hp'], cell: 3, e: '🐙' }
  };
  const SHORE_ROT = [['walrus', 'pelican'], ['pelican', 'otter'], ['otter', 'walrus']];
  const BOSSES = [
    { n: '胖企鹅', who: 'penguin', reward: 300, t: 150, dishes: [{ r: 'clear', f: { bass: 2 } }] },
    { n: '北极熊', who: 'bear', reward: 600, t: 180, dishes: [{ r: 'spicy', f: { squid: 1, yellow: 2 } }, { r: 'clear', f: { croaker: 1 } }] },
    { n: '大白鲨', who: 'shark', reward: 1000, t: 200, dishes: [{ r: 'spicy', f: { croaker: 2 } }, { r: 'sour', f: { bass: 2 } }], fight: true }
  ];
  const fishText = f => Object.keys(f).map(k => SPECIES[k].n + ' ×' + f[k]).join(' + ');
  const orderText = d => RECIPES[d.r].n + '：' + fishText(d.f);
  const COOK_T = 8, BEST = 0.6, BEST_W = 0.06, G0 = 0.45, G1 = 0.75;

  /* ================= 存档 ================= */
  const SAVE_KEY = 'tank6', MUTE_KEY = 'tankMute';
  function newState() {
    return { v: 7, day: 1, money: 60, seal: { x: 118, y: GY, land: true }, basket: [], pearls: 0, basin: [], lv: {}, recipes: ['clear'], boss: 0, license: false, got: {}, seen: '',
      tank: { fish: [], coins: [] }, world: null };
  }
  const lvOf = (S, id) => S.lv[id] || 0;
  const has = (S, k) => !!(S.got && S.got[k]);   // 海里找到的东西、撞开的石头、发现的暗道
  const caps = S => ({
    basket: 1 + lvOf(S, 'basket'), pot: [3, 5, 8][lvOf(S, 'pot')], warm: [25, 40, 60][lvOf(S, 'warm')], speed: 55 + 12 * lvOf(S, 'speed'),
    air: 20 + 10 * ['o2a', 'o2b', 'o2c'].filter(k => has(S, k)).length, tank: [0, 3, 6, 10, 15][lvOf(S, 'tank')], hp: 3 + lvOf(S, 'hp'), basin: 10
  });
  // 每天早上：海贝长珍珠、海底的破烂补上、浅水里漂下来一个漂流瓶
  function freshWorld(S) {
    S.world = { clams: BAY.CLAMS.map(() => ({ pearl: true })), junk: [0, 1, 2].map(i => ({ k: ['shoe', 'can', 'tire'][i], x: [288, 404, 520][i] + rnd(-8, 8) })), bottle: { x: rnd(262, 580), money: 30 + Math.floor(rnd(0, 6)) * 10 } };
  }

  /* ================= 窗口 ================= */
  let G = null;
  let wonderBoot = -1;   // 北极熊和企鹅：一次开机只冒一次
  function open() {
    if (G && !G.win.isClosed) { if (G.win.minimized) OS.wm.restore(G.win); OS.wm.focus(G.win); return G.win; }
    loadArt();
    const cv = el('canvas', { class: 'tk-cv', width: String(W * SC), height: String(H * SC) });
    const root = el('div', { class: 'tk' }, [cv]);
    G = { cv, c: cv.getContext('2d'), screen: 'title', anim: 0, load: 0, btns: [], floats: [], S: null, panel: null, hold: false, ptr: null, keys: {}, mute: !!OS.save.get(MUTE_KEY, false),
      music: null, musicName: '', hover: null, raf: 0, last: 0, fish: [], tourists: [], session: null, boss: null, fight: null, pending: null, cam: { x: 0, y: 0 }, saveT: 0, dark: null, cracks: [], tankPellets: [] };
    G.c.imageSmoothingQuality = 'high';
    const g = G;
    const onKey = e => {
      if (OS.wm.active !== g.win || g.win.isClosed || g.screen !== 'play') return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const map = { ArrowLeft: 'l', a: 'l', ArrowRight: 'r', d: 'r', ArrowUp: 'u', w: 'u', ArrowDown: 'd', s: 'd' };
      if (map[k]) { g.keys[map[k]] = e.type === 'keydown'; e.preventDefault(); }
      else if (e.type === 'keydown' && (k === 'Shift' || k === ' ')) { e.preventDefault(); if (g.S && !g.panel) dash(g, null); }
      else if (e.type === 'keydown' && (k === 'Enter' || k === 'e')) { if (g.S && !g.panel) interactNearest(g); }
    };
    g.win = OS.wm.open({ title: L.title, icon: 'game-tank', width: 382, content: root, maximizable: false, center: true, className: 'tk-win',
      onClose: () => { cancelAnimationFrame(g.raf); save(g); setMusic(g, ''); document.removeEventListener('keydown', onKey, true); document.removeEventListener('keyup', onKey, true); if (G === g) G = null; } });
    const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } const [x, y] = at(e); g.hover = [x, y]; down(g, x, y); });
    cv.addEventListener('pointermove', e => { const [x, y] = at(e); g.hover = [x, y]; if (g.hold) g.ptr = [x, y]; });
    const up = e => { const [x, y] = at(e); release(g, x, y); };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { g.hover = null; });
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('keyup', onKey, true);
    const loop = now => {
      if (g.win.isClosed) return;
      g.raf = requestAnimationFrame(loop);
      const dt = g.last ? Math.min(0.05, (now - g.last) / 1000) : 0;
      g.last = now;
      for (let i = 0; i < (g.fast || 1); i++) { g.anim += dt; update(g, dt); }   // fast：测试时快进用，平时是 1
      g.c.setTransform(SC, 0, 0, SC, 0, 0);
      render(g);
    };
    g.raf = requestAnimationFrame(loop);
    return g.win;
  }
  const discIn = () => !(OS.cdTray && OS.cdTray.out());
  const sfx = (g, n) => { if (!g.mute) OS.sound.play(n); };
  function flt(g, x, y, text, col, life, screen) { g.floats.push({ x, y, text, col: col || '#fff', t: 0, life: life || 1.6, screen: !!screen }); }
  function save(g) {
    const S = g.S;
    if (!S || !g.seal) return;
    S.seal = { x: g.seal.x, y: g.seal.land ? GY : Math.max(WY + 6, g.seal.y), land: g.fight ? true : g.seal.land };
    if (g.seen) S.seen = Array.from(g.seen, v => (v ? '1' : '0')).join('');
    // 正在做的菜：锅里的鱼存成还在盆里（存档里不留做了一半的菜和大胃王）
    const keep = JSON.parse(JSON.stringify(S));
    if (g.session && g.session.fish) keep.basin = keep.basin.concat(g.session.fish.map(f => ({ sp: f.sp, size: f.size })));
    OS.save.set(SAVE_KEY, keep);
  }
  function loadSave() { const S = OS.save.get(SAVE_KEY, null); return S && S.v === 7 ? S : null; }
  function startGame(g, S) {
    if (!S.world) freshWorld(S);
    if (!S.got) S.got = {};
    g.S = S;
    buildMap(g);
    g.seal = { x: S.seal.x, y: S.seal.land ? GY : S.seal.y, land: S.seal.land, vx: 0, vy: 0, face: 1, air: caps(S).air, dashT: 0, dashCD: 0, bump: 0, hurt: 0 };
    if (!g.seal.land && fieldAt(g, g.seal.x, g.seal.y) > -SEAL_R) { g.seal.land = true; g.seal.y = GY; g.seal.x = SPOT.basin; }
    g.fish = []; g.tourists = []; g.session = null; g.boss = null; g.fight = null; g.panel = null; g.pending = null; g.floats = []; g.fade = null; g.coverFade = {}; g.inBoat = 0; g.shake = 0;
    g.camSnap = true; camStep(g, 0);
    REGIONS.forEach((R, i) => { for (let k = 0; k < R.n; k++) spawnFish(g, i, true); });
    g.screen = 'play';
    g.saveT = 0;
    flt(g, W / 2, 100, L.day(S.day) + '　' + L.zone, '#fff6c0', 2.2, true);
  }
  /* ================= 地形：离墙多远的表、撞墙、落地 ================= */
  function buildMap(g) {
    const S = g.S;
    const { F, cols, rows } = BAY.build(S.got);
    g.map = { F, cols, rows, chunks: {} };
    g.floorC = {};
    const fl = (x, y) => floorY(g, x, y);
    g.pos = {
      things: {}, vents: BAY.VENTS.map(([x, y]) => [x, fl(x, y - 12)]), clams: BAY.CLAMS.map(([x, y]) => [x, fl(x, y - 12) - 4]),
      octo: [BAY.OCTOPUS[0], fl(BAY.OCTOPUS[0], BAY.OCTOPUS[1] - 20) - 20]
    };
    TREASURE.forEach(k => { const T = BAY.THINGS[k], [x, y] = T.at; g.pos.things[k] = T.k === 'gear' || T.k === 'o2' ? [x, y] : [x, fl(x, y - 10) - 5]; });   // 装备漂着，别的落地
    g.map.GX = new Float32Array(F.length); g.map.GY = new Float32Array(F.length);
    gradGrid(g, null);
    g.rc = { rock: new Map(), back: new Map() }; g.tv = -1;
    findSpots(g);
    g.snow = null; g.bubs = [];
    g.seen = new Uint8Array(32 * 30);
    const sv = S.seen || '';
    for (let i = 0; i < g.seen.length; i++) g.seen[i] = sv.charCodeAt(i) === 49 ? 1 : 0;
  }
  // 坡度表（画石头的明暗用）
  function gradGrid(g, area) {
    const M = g.map, n = M.cols + 1, F = M.F, cs = BAY.CELL;
    const [i0, j0, i1, j1] = area ? [Math.max(0, Math.floor(area[0] / cs) - 1), Math.max(0, Math.floor(area[1] / cs) - 1), Math.min(M.cols, Math.ceil(area[2] / cs) + 1), Math.min(M.rows, Math.ceil(area[3] / cs) + 1)] : [0, 0, M.cols, M.rows];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = j * n + i;
      M.GX[k] = F[i < M.cols ? k + 1 : k] - F[i > 0 ? k - 1 : k];
      M.GY[k] = F[j < M.rows ? k + n : k] - F[j > 0 ? k - n : k];
    }
  }
  // 一次取出 离墙多远 + 坡度（双线性）
  function sample3(M, x, y, o) {
    const cs = BAY.CELL, n = M.cols + 1;
    let i = Math.floor(x / cs), j = Math.floor(y / cs);
    if (i < 0) i = 0; else if (i > M.cols - 1) i = M.cols - 1;
    if (j < 0) j = 0; else if (j > M.rows - 1) j = M.rows - 1;
    const tx = x / cs - i, ty = y / cs - j, k = j * n + i;
    const a = (1 - tx) * (1 - ty), b = tx * (1 - ty), c = (1 - tx) * ty, d = tx * ty;
    o[0] = M.F[k] * a + M.F[k + 1] * b + M.F[k + n] * c + M.F[k + n + 1] * d;
    o[1] = M.GX[k] * a + M.GX[k + 1] * b + M.GX[k + n] * c + M.GX[k + n + 1] * d;
    o[2] = M.GY[k] * a + M.GY[k + 1] * b + M.GY[k + n] * c + M.GY[k + n + 1] * d;
  }
  // 地面、洞顶上的点：撒海草珊瑚、贴石台、放前景剪影（每次都一样）
  function findSpots(g) {
    let sd = 4242;
    const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const floors = [], ceils = [], bb = BAY.BOAT.box;
    const hidden = (x, y) => BAY.COVERS.some(Q => inRect(x, y, [Q.r[0] - 6, Q.r[1] - 6, Q.r[2] + 6, Q.r[3] + 6]));
    for (let x = 10; x < WW - 10; x += 8 + R() * 16) {
      let prev = fieldAt(g, x, WY + 6);
      for (let y = WY + 9; y < WH - 3; y += 3) {
        const f = fieldAt(g, x, y);
        if (prev < -1.5 && f >= 0) { const sl = fieldAt(g, x + 3, y) - fieldAt(g, x - 3, y); if (Math.abs(sl) < 3 && !inRect(x, y, [bb[0] - 8, bb[1], bb[2] + 8, bb[3] + 8]) && !hidden(x, y)) floors.push([x, y - 1]); }
        else if (prev >= 0 && f < -1.5 && y > WY + 40) { const sl = fieldAt(g, x + 3, y) - fieldAt(g, x - 3, y); if (Math.abs(sl) < 3 && !hidden(x, y)) ceils.push([x, y]); }
        prev = f;
      }
    }
    const P = g.pos, busy = P.vents.map(v => [v[0], v[1], 34]).concat(P.clams.map(v => [v[0], v[1], 22]), Object.values(P.things).map(v => [v[0], v[1], 26]), [[P.octo[0], P.octo[1], 50], [BAY.INLET[0], BAY.INLET[1], 44]], BAY.CRACKS.map(K => [K.shape[1], K.shape[2], 50]));
    const free = (x, y) => busy.every(([bx, by, r]) => Math.hypot(bx - x, by - y) > r);
    const roomy = (x, y, dir) => fieldAt(g, x, y + dir * 46) < -10 && fieldAt(g, x - 20, y + dir * 30) < -4 && fieldAt(g, x + 20, y + dir * 30) < -4;
    const kindAt = (x, y) => (y < 430 && x < 610 ? [0, 1, 0, 4, 5, 1] : y < 470 ? [2, 3, 6, 1, 2] : y < BAY.DARK_Y ? [1, 6, 0, 3] : [7, 1, 7, 6]);
    g.decor = floors.filter(([x, y]) => R() < 0.42 && free(x, y)).map(([x, y]) => { const ks = kindAt(x, y); return { x, y, k: ks[Math.floor(R() * ks.length)], s: 0.8 + R() * 0.5, ph: R() * 6 }; });
    const spaced = (list, gap, prob) => { const out = []; list.forEach(([x, y]) => { if (R() < prob && out.every(q => Math.hypot(q[0] - x, q[1] - y) > gap)) out.push([x, y]); }); return out; };
    g.fronts = spaced(floors.filter(([, y]) => y > 380), 170, 0.5).map(([x, y]) => ({ x, y, k: Math.floor(R() * 5), ph: R() * 6 }));   // 第 6 样是垂下来的，地面上不用
    g.ledges = spaced(floors.filter(([x, y]) => y > 300 && free(x, y) && roomy(x, y, -1)), 80, 0.6).map(([x, y]) => ({ x, y, k: Math.floor(R() * 4), up: true }))
      .concat(spaced(ceils.filter(([x, y]) => free(x, y) && roomy(x, y, 1)), 100, 0.6).map(([x, y]) => ({ x, y, k: 4 + Math.floor(R() * 4), up: false })));
  }
  // 大于 0 在墙里，小于 0 在水里（数就是离墙多远）
  function fieldAt(g, x, y) {
    if (y < WY - 6) return -20;
    if (x < 0 || x >= WW || y >= WH) return 10;
    const M = g.map, cs = BAY.CELL, n = M.cols + 1, F = M.F;
    const fx = x / cs, fy = y / cs, i = Math.min(M.cols - 1, Math.floor(fx)), j = Math.min(M.rows - 1, Math.floor(fy)), tx = fx - i, ty = fy - j;
    const a = F[j * n + i], b = F[j * n + i + 1], c = F[(j + 1) * n + i], d = F[(j + 1) * n + i + 1];
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  }
  // 撞墙：从墙里推出来，往墙里的那点速度去掉；推了返回 true
  function pushOut(g, o, R) {
    let hit = false;
    for (let k = 0; k < 3; k++) {
      const d = fieldAt(g, o.x, o.y) + R;
      if (d <= 0) break;
      const gx = fieldAt(g, o.x + 1, o.y) - fieldAt(g, o.x - 1, o.y), gy = fieldAt(g, o.x, o.y + 1) - fieldAt(g, o.x, o.y - 1);
      const gl = Math.hypot(gx, gy);
      if (gl < 1e-4) break;
      const nx = gx / gl, ny = gy / gl;
      o.x -= nx * d; o.y -= ny * d; hit = true;
      const vn = o.vx * nx + o.vy * ny;
      if (vn > 0) { o.vx -= vn * nx; o.vy -= vn * ny; }
    }
    return hit;
  }
  // 从 (x, y) 往下找地面
  function floorY(g, x, y) {
    let yy = y, n = 0;
    while (fieldAt(g, x, yy) > 0 && n++ < 80) yy -= 2;
    n = 0;
    while (fieldAt(g, x, yy + 1) <= 0 && n++ < 700) yy += 1;
    return yy;
  }
  const floorAt = (g, x) => { const k = x | 0; return g.floorC[k] != null ? g.floorC[k] : (g.floorC[k] = floorY(g, k, WY + 20)); };
  const inPoly = (x, y, v) => { let o = false; for (let i = 0, j = v.length - 1; i < v.length; j = i++) if ((v[i][1] > y) !== (v[j][1] > y) && x < (v[j][0] - v[i][0]) * (y - v[i][1]) / (v[j][1] - v[i][1]) + v[i][0]) o = !o; return o; };
  const inRect = (x, y, r) => x > r[0] && x < r[2] && y > r[1] && y < r[3];
  // 去过的地方（地图上显示）：40×40 一格
  function markSeen(g) {
    const i0 = Math.max(0, Math.floor(g.cam.x / 40)), i1 = Math.min(31, Math.floor((g.cam.x + VW) / 40)), j0 = Math.max(0, Math.floor(g.cam.y / 40)), j1 = Math.min(29, Math.floor((g.cam.y + VH) / 40));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) g.seen[j * 32 + i] = 1;
  }


  /* ================= 鱼 ================= */
  // 在这片地方找一个水里的点（offView：别在眼前冒出来）
  function openAt(g, R, tries, offView) {
    for (let k = 0; k < tries; k++) {
      const x = rnd(R.x0, R.x1), y = rnd(R.y0, R.y1);
      if (fieldAt(g, x, y) > -10) continue;
      if (offView && x > g.cam.x - 20 && x < g.cam.x + VW + 20 && y > g.cam.y - 20 && y < g.cam.y + VH + 20) continue;
      return [x, y];
    }
    return null;
  }
  function spawnFish(g, ri, anywhere) {
    const R = REGIONS[ri];
    let s = Math.random(), sp = R.pick[0][0];
    for (const [k, w] of R.pick) { s -= w; if (s < 0) { sp = k; break; } }
    const size = R.king && Math.random() < R.king ? 3 : Math.random() < R.big ? 2 : Math.random() < 0.5 ? 0 : 1;
    const p = openAt(g, R, 20, !anywhere);
    if (!p) return;
    const mk = (x, y) => { const f = { sp, size, x, y, vx: 0, vy: 0, tx: x, ty: y, face: 1, ri, ph: Math.random() * 6, stuck: 0 }; g.fish.push(f); return f; };
    if (sp === 'yellow') { const lead = mk(p[0], p[1]); for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) { const f = mk(p[0] + rnd(-10, 10), p[1] + rnd(-6, 6)); f.size = lead.size; f.lead = lead; } }
    else mk(p[0], p[1]);
  }



  function fishStep(g, dt) {
    const s = g.seal;
    g.fish.forEach(f => {
      f.ph += dt;
      const R = REGIONS[f.ri];
      let tx = f.tx, ty = f.ty;
      if (f.lead && !f.lead.gone) { tx = f.lead.x + Math.sin(f.ph) * 10; ty = f.lead.y + Math.cos(f.ph * 1.3) * 6; }
      else if (dist(f.x, f.y, tx, ty) < 6 || Math.random() < dt * 0.12 || f.stuck > 0.6) { const q = openAt(g, R, 8, false); if (q) { f.tx = q[0]; f.ty = q[1]; } f.stuck = 0; tx = f.tx; ty = f.ty; }
      const sp = 14 + SPECIES[f.sp].len[f.size] * 0.3;
      const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1;
      f.vx += (dx / d * sp - f.vx) * Math.min(1, dt * 2);
      f.vy += (dy / d * sp * 0.6 - f.vy) * Math.min(1, dt * 2);
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (pushOut(g, f, 4)) f.stuck += dt;
      f.x = clamp(f.x, R.x0 - 30, R.x1 + 30); f.y = clamp(f.y, Math.max(WY + 8, R.y0 - 30), R.y1 + 30);
      if (Math.abs(f.vx) > 2) f.face = f.vx < 0 ? -1 : 1;
      // 海狗嘴碰到就叼住
      if (!s.land && !g.fight && !g.fade) {
        const mx = s.x + s.face * 11, my = s.y;
        if (dist(mx, my, f.x, f.y) < SPECIES[f.sp].len[f.size] * 0.5 + 6) {
          if (g.S.basket.length < caps(g.S).basket) { f.gone = true; g.S.basket.push({ sp: f.sp, size: f.size }); sfx(g, 'pop'); }
          else if (!s.fullSaid) { s.fullSaid = true; flt(g, s.x, s.y - 14, L.basketFull, '#fff2c0', 1.6); }
        }
      }
    });
    g.fish = g.fish.filter(f => !f.gone);
    // 少了就从边上补
    g.refillT = (g.refillT || 0) + dt;
    if (g.refillT > 6) {
      g.refillT = 0;
      REGIONS.forEach((R, i) => { if (g.fish.filter(f => f.ri === i && !f.lead).length < Math.ceil(R.n * (i === 0 ? 0.5 : 1))) spawnFish(g, i, false); });
    }
  }

  /* ================= 输入 ================= */
  function toWorld(g, x, y) { return [x / Z + g.cam.x, y / Z + g.cam.y]; }
  function down(g, x, y) {
    for (let i = g.btns.length - 1; i >= 0; i--) {
      const b = g.btns[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { if (!b.off) { sfx(g, 'click'); b.fn(); } return; }
    }
    if (g.screen === 'tank') { tankTap(g, x, y); return; }
    if (g.screen !== 'play' || g.panel || !discIn()) return;
    const [wx, wy] = toWorld(g, x, y);
    const s = g.seal;
    // 锅：煮着的时候点它开锅
    if (g.session && g.session.phase === 'heat' && Math.abs(wx - SPOT.pot) < 24 && wy > GY - 50 && wy < GY + 8) { openPot(g); return; }
    // 岸上的东西、水下的商人和机关：按下去先只是走 ／ 游，松手的时候是"点了一下"才去用（作者：拖着走过去就自己开了，太怪）
    g.downObj = s.land ? (wy > GY - 46 && wy < GY + 10 ? landObj(wx) : null) : waterObj(g, wx, wy);
    g.hold = true; g.ptr = [x, y]; g.downAt = g.anim; g.downXY = [x, y]; g.pending = null; g.pendingW = null;
  }
  function release(g, x, y) {
    const tap = g.hold && g.anim - g.downAt < 0.25 && dist(x, y, g.downXY[0], g.downXY[1]) < 8;
    const obj = g.downObj;
    g.hold = false; g.downObj = null;
    if (!tap || !g.seal) return;
    if (obj) { if (g.seal.land) g.pending = obj; else g.pendingW = obj; return; }   // 点了一下东西：走 ／ 游过去再用
    if (!g.seal.land) dash(g, toWorld(g, x, y));
  }
  // 水下能点的：章鱼小铺、进水口的阀门、拧开以后的管子口
  function waterObj(g, wx, wy) {
    const S = g.S, P = g.pos;
    if (!P || g.fight) return null;
    const list = [['octo', P.octo[0], P.octo[1], 22]];
    if (!has(S, 'valve')) list.push(['valve', P.things.valve[0], P.things.valve[1] - 4, 14]);
    else list.push(['inlet', BAY.INLET[0], BAY.INLET[1], 18]);
    for (const [k, x, y, r] of list) if (dist(wx, wy, x, y) < r) return { k, x, y };
    return null;
  }
  function useW(g, o) {
    if (o.k === 'octo') { g.S.got.octo = 1; openShop(g, 'octopus'); }
    else if (o.k === 'valve') getThing(g, 'valve');
    else if (o.k === 'inlet') pipeUp(g);
    g.hold = false;
  }

  function landObj(wx) {
    const list = [['tent', SPOT.tent, 22], ['tank', SPOT.tank, 20], ['pot', SPOT.pot, 20], ['gong', SPOT.gong, 12], ['pipe', SPOT.pipe, 12], ['mA', SPOT.mA, 26], ['mB', SPOT.mB, 26], ['gate', SPOT.gate, 26]];
    for (const [k, x, r] of list) if (Math.abs(wx - x) < r) return { k, x };
    return null;
  }
  function interactNearest(g) {
    const s = g.seal;
    if (!s.land) { const P = g.pos, near = [['octo', P.octo], ['valve', P.things.valve], ['inlet', BAY.INLET]].map(([k, p]) => waterObj(g, p[0], p[1] - (k === 'valve' ? 4 : 0))).find(o => o && dist(s.x, s.y, o.x, o.y) < 34); if (near) useW(g, near); return; }
    const obj = landObj(s.x);
    if (obj) use(g, obj);
  }
  function dash(g, to) {
    const s = g.seal;
    if (!s || s.land || !has(g.S, 'thruster') || s.dashCD > 0 || g.fade) return;
    let dx = s.face, dy = 0;
    if (to) { dx = to[0] - s.x; dy = to[1] - s.y; }
    const d = Math.hypot(dx, dy) || 1;
    s.vx = dx / d * 170; s.vy = dy / d * 170; s.dashT = 0.35; s.dashCD = 1.1;
    sfx(g, 'splash');
  }

  /* ================= 更新 ================= */
  function update(g, dt) {
    if (g.screen === 'title') g.load = Math.min(1, g.load + dt / 1.2);
    g.floats.forEach(f => { f.t += dt; f.y -= dt * 10; });
    g.floats = g.floats.filter(f => f.t < f.life);
    let want = 'title';
    if ((g.screen === 'play' || g.screen === 'tank') && g.S) {
      if (g.shatter) { g.shatter.t += dt; if (g.shatter.t > 1.3 && !g.shatter.done) { g.shatter.done = true; OS.ui.bsod(BSOD); } return; }
      const paused = g.panel || g.win.minimized || !discIn();
      if (g.screen === 'tank') { if (!paused) tankStep(g, dt); }
      else if (!paused) { if (g.fade) fadeStep(g, dt); step(g, dt); }
      want = g.fight || g.boss ? 'tense' : g.seal.land || g.screen === 'tank' ? 'day' : 'night';
      g.saveT += dt;
      if (g.saveT > 20) { g.saveT = 0; save(g); }
    }
    setMusic(g, g.mute ? '' : want);
  }
  function step(g, dt) {
    sealStep(g, dt);
    fishStep(g, dt);
    worldStep(g, dt);
    sessionStep(g, dt);
    bossStep(g, dt);
    if (g.fight) fightStep(g, dt);
    touristStep(g, dt);
    tankCoins(g, dt);
    camStep(g, dt);
    markSeen(g);
    fxStep(g, dt);
  }
  // 水里飘的小白点（海雪：远的小、慢）、海狗带的小气泡
  function fxStep(g, dt) {
    if (!g.snow) { g.snow = []; for (let i = 0; i < 64; i++) g.snow.push({ x: Math.random() * W, y: Math.random() * H, z: 0.25 + Math.random() * 0.75, ph: Math.random() * 6 }); g.pcam = { x: g.cam.x, y: g.cam.y }; }
    const dx = (g.cam.x - g.pcam.x) * Z, dy = (g.cam.y - g.pcam.y) * Z;
    g.pcam.x = g.cam.x; g.pcam.y = g.cam.y;
    g.snow.forEach(p => { p.x -= dx * p.z; p.y -= dy * p.z; p.y += 5 * p.z * dt; p.x += Math.sin(g.anim * 0.6 + p.ph) * 4 * p.z * dt; p.x = ((p.x % W) + W) % W; p.y = ((p.y % H) + H) % H; });
    const s = g.seal, sp = Math.hypot(s.vx, s.vy);
    if (!s.land && sp > 20 && Math.random() < dt * (1.5 + sp / 25)) g.bubs.push({ x: s.x - s.face * 9 + rnd(-2, 2), y: s.y - 2 + rnd(-2, 2), r: 0.7 + Math.random() * 1.1, t: 0, ph: Math.random() * 6 });
    g.bubs.forEach(b => { b.t += dt; b.y -= (16 + b.r * 8) * dt; b.x += Math.sin(b.t * 5 + b.ph) * 6 * dt; });
    g.bubs = g.bubs.filter(b => b.t < 2.6 && b.y > WY + 2 && fieldAt(g, b.x, b.y) < 0);
  }
  // 镜头：跟着海狗；做菜、大胃王的时候对着摊子；打架的时候不动
  function camStep(g, dt) {
    const s = g.seal;
    let tx, ty;
    if (g.fight) { tx = BAY.FIGHT.x0; ty = BAY.FIGHT.y0; }
    else if (s.land && (g.session || g.boss)) { tx = STALL_CX - VW / 2; ty = 0; }
    else { tx = s.x - VW / 2; ty = s.land ? 0 : s.y - VH / 2; }
    tx = clamp(tx, 0, WW - VW); ty = clamp(ty, 0, WH - VH);
    if (g.camSnap) g.bakeAll = true;
    const k = g.camSnap ? 1 : Math.min(1, dt * 7);
    g.cam.x += (tx - g.cam.x) * k; g.cam.y += (ty - g.cam.y) * k;
    g.camSnap = false;
  }
  // 一黑一亮（憋不住游回岸、钻管子）
  function fadeStep(g, dt) {
    const F = g.fade;
    F.t += dt;
    if (F.t >= 0.45 && !F.done) { F.done = true; F.fn(); }
    if (F.t >= 0.9) g.fade = null;
  }
  function locked(g) { const se = g.session; return !!g.fade || (se && ['gather', 'recipe', 'prep', 'heat'].indexOf(se.phase) >= 0) || (g.boss && g.boss.phase === 'eye'); }
  function sealStep(g, dt) {
    const s = g.seal, S = g.S, C = caps(S);
    if (s.dashCD > 0) s.dashCD -= dt;
    if (s.bump > 0) s.bump -= dt;
    if (s.hurt > 0) s.hurt -= dt;
    // 想去哪儿：按住的地方 ／ 方向键 ／ 点了岸上的东西
    let tx = null, ty = null;
    if (!locked(g)) {
      if (g.hold && g.ptr) { [tx, ty] = toWorld(g, g.ptr[0], g.ptr[1]); g.pending = null; }
      else if (g.keys.l || g.keys.r || g.keys.u || g.keys.d) { tx = s.x + ((g.keys.r ? 1 : 0) - (g.keys.l ? 1 : 0)) * 60; ty = s.y + ((g.keys.d ? 1 : 0) - (g.keys.u ? 1 : 0)) * 60; g.pending = null; }
      else if (g.pending && s.land) { tx = g.pending.x; ty = GY; if (Math.abs(s.x - g.pending.x) < 6) { const p = g.pending; g.pending = null; use(g, p); } }
      else if (g.pendingW && !s.land) { tx = g.pendingW.x; ty = g.pendingW.y; if (dist(s.x, s.y, tx, ty) < 24) { const p = g.pendingW; g.pendingW = null; tx = ty = null; useW(g, p); } }
    }
    s.moving = tx != null;
    if (s.land) {
      s.y = GY;
      s.air = Math.min(C.air, s.air + dt * C.air / 1.2);   // 岸上大口喘气，一秒多就回满（作者：上岸怎么不回气）
      if (tx != null) {
        if (ty > WY + 12 && !g.fight) {
          if (s.x <= RAIL) { s.land = false; s.y = WY + 6; s.vy = 50; s.vx = 0; sfx(g, 'splash'); s.fullSaid = false; return; }   // 跳下水
          if (!s.railSaid) { s.railSaid = true; flt(g, s.x, GY - 26, L.rail, '#ffffff', 1.4); }
        } else s.railSaid = false;
        const d = tx - s.x;
        if (Math.abs(d) > 2) { s.x += Math.sign(d) * Math.min(Math.abs(d), 62 * dt); s.face = Math.sign(d); }
        else s.moving = false;
      }
      s.x = clamp(s.x, 10, WW - 30);
      arriveStall(g);
      return;
    }
    // 水里
    const sp = C.speed;
    if (tx != null && s.dashT <= 0) {
      const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
      if (d > 4) { s.vx += (dx / d * sp - s.vx) * Math.min(1, dt * 4); s.vy += (dy / d * sp - s.vy) * Math.min(1, dt * 4); }
      else { s.vx *= 0.85; s.vy *= 0.85; }
      // 爬上岸：在水面上、往上按（栏杆那边上不去）
      if (ty < WY - 4 && s.y <= WY + 8 && !g.fight && s.x <= RAIL) { s.land = true; s.y = GY; s.vx = s.vy = 0; s.fullSaid = false; sfx(g, 'splash'); return; }
    } else if (s.dashT <= 0) { s.vx *= Math.pow(0.4, dt); s.vy *= Math.pow(0.4, dt); }
    if (s.dashT > 0) s.dashT -= dt;
    // 水流：往左冲的有大脚蹼游得过去；往下冲的谁也顶不住
    let inCur = false;
    BAY.CURRENTS.forEach(Q => {
      if (s.x < Q.x0 || s.x > Q.x1 || s.y < Q.y0 || s.y > Q.y1) return;
      if (Q.fins && has(S, 'fins')) return;
      inCur = true;
      if (Q.vx < 0) s.vx = Math.min(s.vx, Q.vx); else if (Q.vx > 0) s.vx = Math.max(s.vx, Q.vx);
      if (Q.vy > 0) s.vy = Math.max(s.vy, Q.vy); else if (Q.vy < 0) s.vy = Math.min(s.vy, Q.vy);
      if (Q.fins && !s.curSaid) { s.curSaid = true; flt(g, s.x, s.y - 14, L.current, '#e0f4ff', 1.6); }
    });
    if (!inCur) s.curSaid = false;
    // 走两小步，撞墙推回来
    const n = Math.hypot(s.vx, s.vy) * dt > 4 ? 2 : 1;
    for (let k = 0; k < n; k++) { s.x += s.vx * dt / n; s.y += s.vy * dt / n; pushOut(g, s, SEAL_R); }
    if (fieldAt(g, s.x, s.y) > 20) { s.land = true; s.y = GY; s.x = SPOT.basin; g.camSnap = true; return; }   // 万一卡进石头里：回岸上
    if (Math.abs(s.vx) > 3) s.face = s.vx < 0 ? -1 : 1;
    s.x = clamp(s.x, 8, WW - 8);
    if (s.y < WY + 4) { s.y = WY + 4; s.vy = Math.max(0, s.vy); }
    if (g.fight) { const A = BAY.FIGHT; s.x = clamp(s.x, A.x0 + 10, A.x1 - 10); s.y = clamp(s.y, A.y0 + 10, A.y1 - 8); }
    // 没头灯，最黑的深海不敢下去
    if (!has(S, 'lamp') && s.y > BAY.DARK_Y) { s.y = BAY.DARK_Y; s.vy = Math.min(s.vy, -20); if (!s.darkSaid) { s.darkSaid = true; flt(g, s.x, s.y - 16, L.tooDark, '#ffe0a0', 1.8); } }
    else if (s.y < BAY.DARK_Y - 30) s.darkSaid = false;
    // 裂了缝的石头：推进器冲过去撞开
    BAY.CRACKS.forEach(K => {
      if (has(S, K.id)) return;
      const d = BAY.sd(K.shape, s.x, s.y);
      if (d > SEAL_R + 4) { if (d > 30) s['crk_' + K.id] = false; return; }
      if (s.dashT > 0) breakCrack(g, K);
      else if (!s['crk_' + K.id]) { s['crk_' + K.id] = true; flt(g, s.x, s.y - 14, L.crackHit, '#ffffff', 1.4); sfx(g, 'thud'); }
    });
    // 憋气：水面上、气泡泉里回气，别处掉气；没气了拼命游回岸边
    if (s.y <= WY + 8) s.air = Math.min(C.air, s.air + dt * C.air / 2.5);
    else if (!g.fight) {
      const v = g.pos.vents.find(([x, y]) => dist(s.x, s.y, x, y - 12) < 18);
      if (v) {
        if (s.air < C.air - 1 && !s.ventSaid) { s.ventSaid = true; flt(g, s.x, s.y - 16, L.breath, '#c0f4ff', 1.2); sfx(g, 'pop'); }
        s.air = Math.min(C.air, s.air + dt * C.air / 1.5);
      } else {
        s.ventSaid = false;
        s.air -= dt;
        if (s.air <= 0) { s.air = 0; airOut(g); return; }
      }
    }
    underTouch(g);
  }
  function airOut(g) {
    if (g.fade) return;
    sfx(g, 'buzz');
    g.fade = { t: 0, fn: () => { const s = g.seal; s.land = true; s.y = GY; s.x = SPOT.basin; s.vx = s.vy = 0; s.dashT = 0; s.air = caps(g.S).air; g.camSnap = true; flt(g, W / 2, 90, L.airHome, '#ffd0d0', 2.2, true); arriveStall(g); } };
  }
  function breakCrack(g, K) {
    const S = g.S, s = g.seal;
    S.got[K.id] = 1;
    const [, cx, cy, rx, ry] = K.shape;
    BAY.build(S.got, g.map.F, [cx - rx - 20, cy - ry - 20, cx + rx + 20, cy + ry + 20]);
    gradGrid(g, [cx - rx - 20, cy - ry - 20, cx + rx + 20, cy + ry + 20]);
    clearChunks(g, [cx - rx - 20, cy - ry - 20, cx + rx + 20, cy + ry + 20]); g.floorC = {};
    flt(g, s.x, s.y - 16, L.crackBroke, '#fff6a0', 1.6);
    sfx(g, 'thud'); sfx(g, 'splash');
    g.shake = 0.35;
    save(g);
  }
  // 钻管子：海底进水口 ⇄ 岸上锅旁边
  function pipeUp(g) {
    sfx(g, 'splash');
    g.fade = { t: 0, fn: () => { const s = g.seal; s.land = true; s.y = GY; s.x = SPOT.pipe; s.vx = s.vy = 0; s.dashT = 0; s.air = caps(g.S).air; g.camSnap = true; } };
  }
  function pipeDown(g) {
    sfx(g, 'splash');
    g.fade = { t: 0, fn: () => { const s = g.seal, [ix, iy] = BAY.INLET; s.land = false; s.x = ix - 30; s.y = iy + 6; s.vx = s.vy = 0; s.dashT = 0; s.air = caps(g.S).air; g.pipeArm = false; g.camSnap = true; } };
  }

  // 回到摊位前：鱼倒进盆里、珍珠卖掉、破烂扔进垃圾桶
  function arriveStall(g) {
    const s = g.seal, S = g.S;
    if (Math.abs(s.x - SPOT.basin) > 40) return;
    if (S.basket.length) {
      const room = caps(S).basin - S.basin.length;
      const fish = S.basket.filter(f => f.sp), junk = S.basket.filter(f => f.junk);
      if (junk.length) { const m = junk.length * 5; S.money += m; flt(g, SPOT.bin, GY - 30, L.junkBin(m), '#ffffff', 1.8); }
      const n = Math.min(room, fish.length);
      S.basin = S.basin.concat(fish.slice(0, n));
      S.basket = fish.slice(n);
      if (n) { flt(g, SPOT.basin, GY - 26, L.dumped(n), '#fff6c0', 1.4); sfx(g, 'splash'); }
      if (S.basket.length && !s.basinSaid) { s.basinSaid = true; flt(g, SPOT.basin, GY - 38, L.basinFull, '#ffd0d0', 1.4); }
    } else s.basinSaid = false;
    if (S.pearls) { const m = S.pearls * 60; S.money += m; flt(g, SPOT.basin, GY - 44, L.pearlSold(S.pearls, m), '#ffe36a', 1.8); S.pearls = 0; sfx(g, 'chip'); }
  }
  function underTouch(g) {
    const s = g.seal, S = g.S, Wd = S.world, P = g.pos;
    // 海贝：张开的时候叼珍珠，合着"当"
    P.clams.forEach(([x, y], i) => {
      const c = Wd.clams[i];
      if (dist(s.x, s.y, x, y - 4) > 12) { c.near = false; return; }
      if (c.near) return;
      c.near = true;
      if (clamOpen(g, i) && c.pearl) { c.pearl = false; S.pearls++; flt(g, x, y - 14, L.gotPearl, '#fff6ff', 1.4); sfx(g, 'chime'); }
      else { flt(g, x, y - 12, L.clank, '#fff', 0.8); sfx(g, 'thud'); s.vy = -40; }
    });
    // 破烂：占鱼篓一格
    Wd.junk.forEach(j => {
      if (j.gone) return;
      const jy = floorAt(g, j.x) - 3;
      if (dist(s.x, s.y, j.x, jy) < 12 && S.basket.length < caps(S).basket) { j.gone = true; S.basket.push({ junk: j.k }); flt(g, j.x, jy - 11, L.gotJunk[j.k], '#ffffff', 1.4); sfx(g, 'thud'); }
    });
    // 每天漂下来的漂流瓶
    const b = Wd.bottle;
    if (b && dist(s.x, s.y, b.x, Math.min(b.y || WY, floorAt(g, b.x) - 4)) < 12) { S.money += b.money; flt(g, s.x, s.y - 16, L.bottle.money(b.money), '#fff6a0', 2); Wd.bottle = null; sfx(g, 'ding'); }
    // 藏在海里的东西
    TREASURE.forEach(k => { if (k !== 'valve' && !has(S, k) && dist(s.x, s.y, P.things[k][0], P.things[k][1]) < 15) getThing(g, k); });   // 捡东西还是碰到就捡
    // 暗道：游进去就露出来
    BAY.COVERS.forEach(Q => {
      if (has(S, Q.id) || !inRect(s.x, s.y, Q.r)) return;
      S.got[Q.id] = 1; clearChunks(g, Q.r);
      flt(g, s.x, s.y - 16, L.secret, '#ffe0ff', 1.4); sfx(g, 'chime');
    });
    // 章鱼小铺、阀门、管子口：要点一下才用（waterObj ／ useW），游过去碰到不算
  }
  function getThing(g, k) {
    const S = g.S, T = BAY.THINGS[k];
    S.got[k] = 1;
    let text;
    if (T.k === 'gear') text = L.gear[k];
    else if (T.k === 'o2') { text = L.gear.o2; g.seal.air = caps(S).air; }
    else if (T.k === 'recipe') { if (S.recipes.indexOf('sour') < 0) S.recipes.push('sour'); text = L.bottle.sour; }
    else if (T.k === 'pearls') { S.pearls += T.n; text = L.stash(T.n); }
    else text = L.valve;
    g.panel = { kind: 'note', text };
    g.hold = false;
    sfx(g, 'ysWin');
    save(g);
  }

  const clamOpen = (g, i) => Math.sin(g.anim * 0.7 + i * 2.1) > 0.35;
  function worldStep(g, dt) {
    const b = g.S.world.bottle;
    if (b) b.y = Math.min((b.y || WY) + 10 * dt, floorAt(g, b.x) - 4);
    if (g.shake > 0) g.shake -= dt;
    Object.keys(g.coverFade).forEach(k => { g.coverFade[k] -= dt * 1.5; if (g.coverFade[k] <= 0) delete g.coverFade[k]; });
    const s = g.seal, inside = !s.land && inPoly(s.x, s.y, BAY.BOAT.inside);
    g.inBoat = clamp(g.inBoat + (inside ? dt : -dt) * 4, 0, 1);
  }


  /* ================= 岸上的东西 ================= */
  function use(g, obj) {
    const S = g.S;
    if (obj.k === 'tent') { if (g.session || g.boss) { flt(g, obj.x, GY - 30, L.busy, '#ffd0d0', 1.4); return; } g.panel = { kind: 'ask', text: L.tent, yes: L.sleep, fn: () => sleep(g) }; }
    else if (obj.k === 'tank') openTank(g);
    else if (obj.k === 'pot') startSession(g);
    else if (obj.k === 'gong') gong(g);
    else if (obj.k === 'mA' || obj.k === 'mB') openShop(g, SHORE_ROT[(S.day - 1) % 3][obj.k === 'mA' ? 0 : 1]);
    else if (obj.k === 'gate') g.panel = { kind: 'note', text: S.license ? L.gateSoon : L.gate };
    else if (obj.k === 'pipe') { if (g.session || g.boss) flt(g, obj.x, GY - 30, L.busy, '#ffd0d0', 1.4); else if (!has(S, 'valve')) g.panel = { kind: 'note', text: L.pipeShut }; else g.panel = { kind: 'ask', text: L.pipeGo, yes: L.pipeYes, fn: () => pipeDown(g) }; }
  }
  function sleep(g) {
    const S = g.S;
    S.day++;
    freshWorld(S);
    g.fish = [];
    REGIONS.forEach((R, i) => { for (let k = 0; k < R.n; k++) spawnFish(g, i, true); });
    g.seal.air = caps(S).air;
    flt(g, W / 2, 100, L.morning(S.day), '#fff6c0', 2.2, true);
    sfx(g, 'chime');
    save(g);
  }
  function openShop(g, mk) { g.panel = { kind: 'shop', mk }; g.hold = false; sfx(g, 'pop'); }
  function buyItem(g, id) {
    const S = g.S, it = ITEMS[id];
    const lv = lvOf(S, id);
    if (lv >= it.cost.length) return;
    const p = it.cost[lv];
    if (S.money < p) { flt(g, W / 2, 200, L.noMoney, '#ffd0d0', 1.2, true); sfx(g, 'error'); return; }
    S.money -= p;
    S.lv[id] = lv + 1;
    if (id === 'recipeSpicy' && S.recipes.indexOf('spicy') < 0) S.recipes.push('spicy');
    sfx(g, 'chip');
    save(g);
  }

  /* ================= 做菜 ================= */
  // 点锅：盆里有鱼就开始。大胃王在等的时候，只拿他点的鱼
  function startSession(g) {
    const S = g.S;
    if (g.session) return;
    if (!S.basin.length) { flt(g, SPOT.pot, GY - 30, L.emptyBasin, '#ffd0d0', 1.6); return; }
    let fish;
    if (g.boss && g.boss.phase === 'order') {
      const dish = BOSSES[g.boss.i].dishes[g.boss.dish];
      const take = [];
      const pool = S.basin.slice().sort((a, b) => b.size - a.size);
      let ok = true;
      Object.keys(dish.f).forEach(sp => { for (let k = 0; k < dish.f[sp]; k++) { const i = pool.findIndex(f => f.sp === sp); if (i < 0) { ok = false; return; } take.push(pool.splice(i, 1)[0]); } });
      if (!ok) { flt(g, SPOT.pot, GY - 34, L.needFish(fishText(dish.f)), '#ffd0d0', 2.2); sfx(g, 'error'); return; }
      take.forEach(f => S.basin.splice(S.basin.indexOf(f), 1));
      fish = take;
    } else fish = S.basin.splice(0, caps(S).pot);
    g.session = { phase: g.boss ? 'recipe' : 'gather', t: 0, fish, recipe: null, p: 0, q: 0, warm: 0, boss: !!g.boss };
    g.seal.x = SPOT.pot - 11; g.seal.face = 1; g.pending = null; g.hold = false;
    if (!g.boss) callTourists(g, Math.min(6, fish.length + 1 + Math.floor(Math.random() * 2)), true);
    else g.panel = { kind: 'recipe' };
    sfx(g, 'splash');
  }
  const SLOTS = [208, 230, 252, 274, 296, 84];   // 游客站的位置：锅右边一排、左边（木盆外面）一个
  function callTourists(g, n, judge) {
    const used = g.tourists.filter(o => o.slot != null).map(o => o.slot);
    for (let i = 0; i < n; i++) {
      const slot = SLOTS.find(s => used.indexOf(s) < 0);
      if (slot == null) break;
      used.push(slot);
      const k = pick(TOUR_POOL);
      const fromLeft = slot < SPOT.pot;
      g.tourists.push({ k, x: fromLeft ? g.cam.x - 20 - i * 12 : g.cam.x + VW + 20 + i * 12, slot, ph: 'in', t: 0, say: judge && i < 3 ? judgeLine(g) : null, sayT: -1 - i * 0.4 });   // 先到的三位评价一句
    }
  }
  function judgeLine(g) {
    const se = g.session;
    const top = Math.max.apply(null, se.fish.map(f => f.size));
    const avg = se.fish.reduce((a, f) => a + f.size, 0) / se.fish.length;
    return pick(top >= 3 ? L.judge.K : avg >= 1.6 ? L.judge.L : avg >= 0.8 ? L.judge.M : L.judge.S);
  }
  function quality(p) {
    if (p >= 1) return 0.15;
    if (Math.abs(p - BEST) <= BEST_W) return 1;
    if (p < G0) return 0.3 + p * 0.6;
    if (p < BEST) return 0.85;
    return Math.max(0.2, 0.9 - (p - BEST - BEST_W) / (1 - BEST - BEST_W) * 0.7);
  }
  const zoneName = p => (p >= 1 ? 'burnt' : Math.abs(p - BEST) <= BEST_W ? 'best' : p < G0 ? 'raw' : p <= G1 ? 'good' : 'over');
  function pickRecipe(g, r) {
    const se = g.session;
    if (!se) return;
    se.recipe = r; se.phase = 'prep'; se.t = 0;
    g.panel = null;
    sfx(g, 'splash');
  }
  function openPot(g) {
    const se = g.session;
    if (!se || se.phase !== 'heat') return;
    se.q = quality(se.p);
    const z = zoneName(se.p);
    flt(g, SPOT.pot, GY - 44, { best: L.best, good: L.good, raw: L.raw, over: L.over, burnt: L.burnt }[z], z === 'best' ? '#fff27a' : '#ffffff', 1.6);
    sfx(g, z === 'best' ? 'ysWin' : z === 'burnt' ? 'buzz' : 'ding');
    if (se.boss) { bossServe(g); return; }
    se.phase = 'bid'; se.t = 0;
    g.tourists.forEach(o => { if (o.slot != null && o.ph === 'wait') makeBid(g, o); });
  }
  function fishValue(g) { const se = g.session; return se.fish.reduce((a, f) => a + SPECIES[f.sp].val[f.size], 0) / Math.max(1, se.fish.length) * RECIPES[se.recipe].mul; }
  function makeBid(g, o) {
    const se = g.session, T = TOURISTS[o.k];
    const k = Math.min(T.eat, se.fish.length);
    if (!k) return;
    const like = T.like === se.recipe ? 1.25 : 1;
    o.bid = { k, p: Math.max(1, Math.round(k * fishValue(g) * se.q * like * rnd(0.85, 1.1))), tick: 0, n: 0, like: T.like === se.recipe };
    o.ph = 'bid';
  }
  function sell(g, o) {
    const se = g.session, S = g.S;
    if (!se || !o.bid) return;
    const k = Math.min(o.bid.k, se.fish.length);
    if (!k) return;
    const p = k === o.bid.k ? o.bid.p : Math.round(o.bid.p * k / o.bid.k);
    se.fish.splice(0, k);
    S.money += p;
    flt(g, o.x, GY - 44, L.sold(p), '#ffe36a', 1.4);
    sfx(g, 'chip');
    o.bid = null; o.ph = 'eat'; o.t = 0;
    if (!se.fish.length) endSession(g);
  }
  function endSession(g) {
    g.tourists.forEach(o => { if (o.ph !== 'eat') { o.bid = null; o.ph = 'out'; o.slot = null; } });
    g.session = null;
    save(g);
  }
  function sessionStep(g, dt) {
    const se = g.session, S = g.S;
    if (!se) return;
    se.t += dt;
    if (se.phase === 'gather' && se.t > 2.4) { se.phase = 'recipe'; g.panel = { kind: 'recipe' }; }
    else if (se.phase === 'prep' && se.t > 3.2) { se.phase = 'heat'; se.t = 0; se.p = 0; }
    else if (se.phase === 'heat') {
      se.p = Math.min(1.05, se.p + dt / COOK_T);
      // 不爱这个口味的游客，煮着煮着走了
      g.tourists.forEach(o => {
        if (o.ph !== 'wait' || o.decided) return;
        if (se.p > 0.15 + (o.slot % 7) * 0.05) {
          o.decided = true;
          const T = TOURISTS[o.k];
          const goP = T.hate === se.recipe ? 0.8 : T.like === se.recipe ? 0 : 0.2;
          if (Math.random() < goP) { o.ph = 'out'; o.say = pick(L.leave); o.sayT = 0; o.slot = null; }
        }
      });
    } else if (se.phase === 'bid') {
      // 报价一会儿一变：可能加价，也可能走
      g.tourists.forEach(o => {
        if (!o.bid) return;
        o.bid.tick += dt;
        if (o.bid.tick < 1.6) return;
        o.bid.tick = 0; o.bid.n++;
        const up = 0.15 + 0.5 * se.q + (o.bid.like ? 0.15 : 0);
        const go = 0.4 * (1 - se.q) + (o.bid.like ? 0 : 0.08) + (o.bid.n > 3 ? 0.35 : 0);
        const r = Math.random();
        if (r < go) { o.bid = null; o.ph = 'out'; o.slot = null; o.say = pick(L.leave); o.sayT = 0; }
        else if (r < go + up) { o.bid.p = Math.round(o.bid.p * rnd(1.06, 1.14)); o.bump = 0.4; }
      });
      // 游客都走了、鱼还有：保温，过一阵来新游客；保温到头凉了三折处理
      const anyone = g.tourists.some(o => o.bid || (o.slot != null && (o.ph === 'in' || o.ph === 'wait')));
      if (!anyone) {
        se.warm += dt;
        se.newT = (se.newT || 0) + dt;
        if (se.newT > 5) { se.newT = 0; callTourists(g, 1 + Math.floor(Math.random() * 2), false); }
        if (se.warm >= caps(S).warm) {
          const m = Math.round(se.fish.length * fishValue(g) * 0.3);
          S.money += m;
          flt(g, SPOT.pot, GY - 44, L.cold(se.fish.length, m), '#e0e0e0', 2.2);
          se.fish = [];
          endSession(g);
        }
      }
    }
  }

  /* ================= 游客 ================= */
  function touristStep(g, dt) {
    const se = g.session;
    g.tourists.forEach(o => {
      o.t += dt; o.sayT += dt;
      if (o.bump > 0) o.bump -= dt;
      if (o.ph === 'in') {
        const d = o.slot - o.x;
        o.x += Math.sign(d) * Math.min(Math.abs(d), 40 * dt);
        if (Math.abs(d) < 0.5) { o.ph = 'wait'; o.t = 0; if (o.sayT < 0) o.sayT = 0; if (se && se.phase === 'bid') makeBid(g, o); }
      } else if (o.ph === 'eat') { if (o.t > 2.5) { o.ph = 'out'; o.slot = null; } }
      else if (o.ph === 'out') { const dir = o.x < SPOT.pot ? -1 : 1; o.x += dir * 44 * dt; if (o.x < g.cam.x - 40 || o.x > g.cam.x + VW + 40) o.done = true; }
    });
    g.tourists = g.tourists.filter(o => !o.done);
    // 北极熊和企鹅同时在岸上
    const on = k => g.tourists.some(o => o.k === k && o.ph !== 'out');
    if (on('bear') && on('penguin')) {
      const boot = OS.save.get('bootCount', 0);
      if (wonderBoot !== boot) { wonderBoot = boot; OS.ui.notify({ title: L.title, text: L.wonder, icon: 'info', timeout: 6000 }); }
    }
  }

  /* ================= 大胃王 ================= */
  function gong(g) {
    const S = g.S;
    if (S.boss >= 3) { g.panel = { kind: 'note', text: L.gongDone }; return; }
    if (g.session || g.boss) { flt(g, SPOT.gong, GY - 30, L.gongBusy, '#ffd0d0', 1.4); return; }
    g.panel = { kind: 'ask', text: L.gong(S.boss + 1), yes: '敲', fn: () => { g.boss = { i: S.boss, dish: 0, phase: 'alarm', t: 0, left: BOSSES[S.boss].t, say: 0 }; sfx(g, 'rxAlarm'); } };
  }
  function bossStep(g, dt) {
    const B = g.boss;
    if (!B) return;
    B.t += dt;
    if (B.say > 0) B.say -= dt;
    if (B.eat > 0) B.eat -= dt;
    if (B.mad > 0) B.mad -= dt;
    if (B.phase === 'alarm' && B.t > 2) { B.phase = 'order'; B.t = 0; B.left = BOSSES[B.i].t; g.tourists.forEach(o => { if (!o.bid && o.ph !== 'eat') { o.ph = 'out'; o.slot = null; } }); }
    else if (B.phase === 'order') {
      if (!g.session || g.session.phase !== 'recipe') B.left -= dt;
      if (B.left <= 0) { if (g.session) { g.S.basin = g.S.basin.concat(g.session.fish); g.session = null; } g.boss = null; g.panel = { kind: 'note', text: L.bossTimeout }; sfx(g, 'ysLose'); }
    } else if (B.phase === 'eye' && B.t > 2.4) startFight(g);
  }
  function bossServe(g) {
    const B = g.boss, se = g.session, S = g.S, D = BOSSES[B.i];
    const dish = D.dishes[B.dish];
    g.session = null;
    if (se.recipe !== dish.r) { B.line = L.wrongRecipe; B.say = 1.8; B.mad = 1.8; sfx(g, 'error'); return; }
    if (se.q < 0.6) { B.line = L.bossBad; B.say = 1.8; B.mad = 1.8; sfx(g, 'error'); return; }
    B.line = L.bossGood; B.say = 1.6; B.eat = 2;
    B.dish++;
    if (B.dish < D.dishes.length) { B.left = D.t; return; }
    if (D.fight) { B.phase = 'eye'; B.t = 0; B.line = L.sharkEye; B.say = 2.4; return; }
    S.money += D.reward; S.boss++;
    g.panel = { kind: 'note', text: L.bossPass(D.n, D.reward) };
    g.boss = null;
    sfx(g, 'ysWin');
    save(g);
  }
  // 第三位：大白鲨追下水，绕到背后咬尾巴
  function startFight(g) {
    const s = g.seal, S = g.S;
    g.boss.phase = 'fight';
    s.land = false; s.x = 470; s.y = 170; s.vx = 0; s.vy = 0; s.dashT = 0; s.air = caps(S).air; s.hurt = 0;
    g.camSnap = true;
    g.fight = { hp: caps(S).hp, shark: { x: 340, y: 236, a: 0, v: 46, hp: 3, st: 'tired', t: 2.2, hurt: 0, tiredT: 2.6 }, over: false };   // 开场它先喘口气，给你看清楚
    flt(g, W / 2, 60, L.sharkChase, '#ffd0d0', 2.2, true);
    sfx(g, 'splash');
  }
  function fightStep(g, dt) {
    const F = g.fight, s = g.seal, K = F.shark;
    if (F.over) return;
    if (K.hurt > 0) K.hurt -= dt;
    // 鲨鱼：追 → 张嘴瞄准 → 猛扑 → 扑完累得喘（转身慢，这时候绕到背后咬尾巴）→ 再追
    K.t -= dt;
    if (K.t <= 0) {
      if (K.st === 'chase') { K.st = 'tel'; K.t = 0.6; }
      else if (K.st === 'tel') { K.st = 'lunge'; K.t = 0.7; sfx(g, 'splash'); }
      else if (K.st === 'lunge') { K.st = 'tired'; K.t = K.tiredT; }
      else { K.st = 'chase'; K.t = rnd(2.2, 3.4); }
    }
    K.tel = K.st === 'tel' ? 1 : 0; K.lunge = K.st === 'lunge' ? 1 : 0;
    const want = Math.atan2(s.y - K.y, s.x - K.x);
    let da = want - K.a; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    const turn = { chase: 1.5, tel: 2.2, lunge: 0.3, tired: 0.2 }[K.st] * (K.hurt > 0 ? 0.5 : 1);
    K.a += clamp(da, -turn * dt, turn * dt);
    const v = K.hurt > 0 ? 14 : { chase: K.v, tel: 14, lunge: 120, tired: 10 }[K.st];
    const A = BAY.FIGHT;
    K.x = clamp(K.x + Math.cos(K.a) * v * dt, A.x0 + 26, A.x1 - 26);
    K.y = clamp(K.y + Math.sin(K.a) * v * dt, A.y0 + 18, A.y1 - 14);
    // 海狗在鲨鱼身上哪儿：头 ／ 尾巴
    const lx = (s.x - K.x) * Math.cos(-K.a) - (s.y - K.y) * Math.sin(-K.a);
    const ly = (s.x - K.x) * Math.sin(-K.a) + (s.y - K.y) * Math.cos(-K.a);
    const LEN = 56;
    // 喘气的时候嘴是闭着的，撞上脑袋只会被弹开；尾巴那块比身子宽一点（有尾鳍）
    if (Math.abs(ly) < (lx < 0 ? 18 : 13) && s.hurt <= 0) {
      if (lx > LEN * 0.15 && lx < LEN * 0.55 && K.st !== 'tired') {
        F.hp--; s.hurt = 1.4; s.vx = (s.x - K.x) * 3; s.vy = (s.y - K.y) * 3; flt(g, s.x, s.y - 16, L.gotBit, '#ffd0d0', 1.2); sfx(g, 'ysSlap');
        if (F.hp <= 0) { F.over = true; g.panel = { kind: 'eaten' }; sfx(g, 'ysLose'); }
      } else if (lx < -LEN * 0.15 && lx > -LEN * 0.7 && K.hurt <= 0) {
        K.hp--; K.hurt = 0.9; K.v += 6; K.tiredT = Math.max(1.8, K.tiredT - 0.35); K.st = 'chase'; K.t = 1.5; s.hurt = 0.6; s.vx = -Math.cos(K.a) * 80; s.vy = -Math.sin(K.a) * 80;
        flt(g, s.x, s.y - 16, L.bitTail, '#fff27a', 1.2); sfx(g, 'munch');
        if (K.hp <= 0) { F.over = true; winFight(g); }
      } else if (lx > -LEN * 0.15 && lx < LEN * 0.55) { s.vx += (s.x - K.x) * 2; s.vy += (s.y - K.y) * 2; }
    }
  }
  function winFight(g) {
    const S = g.S, D = BOSSES[2];
    S.money += D.reward; S.boss = 3; S.license = true;
    g.panel = { kind: 'note', text: L.license, after: () => { g.fight = null; g.boss = null; const s = g.seal; s.land = true; s.y = GY; s.x = SPOT.pot - 16; } };
    sfx(g, 'ysWin');
    save(g);
  }
  function fightRetry(g) { g.panel = null; startFight(g); }
  function fightLater(g) { g.panel = null; g.fight = null; g.boss = null; const s = g.seal; s.land = true; s.y = GY; s.x = SPOT.pot - 16; s.hurt = 0; }

  /* ================= 家里的水族箱（怪怪水族箱的样子） ================= */
  const TK = { top: 36, floor: 214 };
  function openTank(g) {
    const S = g.S;
    if (!caps(S).tank) { g.panel = { kind: 'note', text: L.tankNone }; return; }
    g.screen = 'tank'; g.hold = false; g.tankPellets = []; g.tap = null;
    S.tank.fish.forEach(f => { if (f.x == null) { f.x = rnd(40, 280); f.y = rnd(80, 200); } f.tx = f.x; f.ty = f.y; });
  }
  function tankStep(g, dt) {
    const S = g.S;
    g.tankPellets.forEach(p => { if (p.y < TK.floor - 2) p.y += 20 * dt; else p.floor = (p.floor || 0) + dt; });
    g.tankPellets = g.tankPellets.filter(p => !p.gone && (p.floor || 0) < 5);
    S.tank.fish.forEach(f => {
      f.ph = (f.ph || 0) + dt;
      let tx = f.tx, ty = f.ty;
      const p0 = g.tankPellets.filter(p => !p.gone).sort((a, b) => dist(f.x, f.y, a.x, a.y) - dist(f.x, f.y, b.x, b.y))[0];
      if (p0 && (f.full || 0) <= 0) { tx = p0.x; ty = p0.y; if (dist(f.x, f.y, p0.x, p0.y) < 6) { p0.gone = true; feedFish(g, f); } }
      else if (dist(f.x, f.y, tx, ty) < 5 || Math.random() < dt * 0.2) { f.tx = rnd(30, 290); f.ty = rnd(TK.top + 30, TK.floor - 14); }
      if (f.full > 0) f.full -= dt;
      const sp = 20, dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1;
      f.x += dx / d * sp * dt; f.y += dy / d * sp * 0.7 * dt;
      if (Math.abs(dx) > 1) f.face = dx < 0 ? -1 : 1;
    });
    tankCoins(g, dt);
    S.tank.coins.forEach(c => { if (c.y < TK.floor - 4) c.y += 16 * dt; });
  }
  function feedFish(g, f) {
    const S = g.S;
    f.meals = (f.meals || 0) + (lvOf(S, 'food') ? 2 : 1);
    f.full = 4;
    const need = [3, 5, 8][f.size];
    if (f.size < 3 && f.meals >= need) { f.meals = 0; f.size++; sfx(g, 'chime'); flt(g, f.x, f.y - 14, SIZE_N[f.size], '#fff6a0', 1.2, true); }
  }
  // 水族箱里的鱼隔一阵掉一个小钱（原版的味儿）
  function tankCoins(g, dt) {
    const S = g.S;
    if (!S.tank.fish.length) return;
    g.coinT = (g.coinT || 0) + dt;
    if (g.coinT < 18) return;
    g.coinT = 0;
    if (S.tank.coins.length >= 12) return;
    const f = pick(S.tank.fish);
    S.tank.coins.push({ x: f.x != null ? f.x : rnd(40, 280), y: f.y != null ? f.y : 120, v: [1, 2, 4, 8][f.size] });
  }
  function tankTap(g, x, y) {
    const S = g.S;
    if (g.panel || g.shatter || !discIn()) return;
    if (y < TK.top) return;
    const ci = S.tank.coins.findIndex(c => dist(x, y, c.x, c.y) < 9);
    if (ci >= 0) { const c = S.tank.coins.splice(ci, 1)[0]; S.money += c.v; flt(g, c.x, c.y - 8, '+' + c.v, '#ffe36a', 1, true); sfx(g, 'chip'); return; }
    // 点鱼：捞出来放进盆里
    const fi = S.tank.fish.findIndex(f => dist(x, y, f.x, f.y) < SPECIES[f.sp].len[f.size] * 0.9 + 4);
    if (fi >= 0) {
      if (S.basin.length >= caps(S).basin) { flt(g, x, y - 10, L.basinFull, '#ffd0d0', 1.2, true); return; }
      const f = S.tank.fish.splice(fi, 1)[0];
      S.basin.push({ sp: f.sp, size: f.size });
      flt(g, x, y - 10, L.tankTake, '#ffffff', 1.4, true); sfx(g, 'splash');
      return;
    }
    // 水里：撒鱼食，撒不出来就是敲玻璃
    if (y < TK.floor) {
      if (g.tankPellets.length < 3 && S.money >= 5) { S.money -= 5; g.tankPellets.push({ x, y }); g.tap = null; sfx(g, 'bubble'); }
      else tapGlass(g, x, y);
    }
  }
  function tankPutIn(g) {
    const S = g.S;
    const room = caps(S).tank - S.tank.fish.length;
    if (room <= 0) { flt(g, W / 2, 120, L.tankFull, '#ffd0d0', 1.4, true); return; }
    const n = Math.min(room, S.basin.length);
    for (let i = 0; i < n; i++) { const f = S.basin.shift(); S.tank.fish.push({ sp: f.sp, size: f.size, x: rnd(40, 280), y: TK.top + 20, tx: rnd(40, 280), ty: rnd(80, 190), meals: 0 }); }
    if (n) { flt(g, W / 2, 120, L.tankPut(n), '#fff6c0', 1.4, true); sfx(g, 'splash'); }
  }
  function tapGlass(g, x, y) {
    sfx(g, 'thud');
    g.S.tank.fish.forEach(f => { if (dist(f.x, f.y, x, y) < 40) { f.tx = clamp(f.x + (f.x - x) * 2, 30, 290); f.ty = clamp(f.y + (f.y - y), TK.top + 20, TK.floor - 10); } });
    const crack = g.cracks.find(k => dist(k.x, k.y, x, y) < 12);
    if (crack) {
      crack.hits++;
      if (crack.hits >= 6) { crack.hits = 0; crack.st++; sfx(g, 'ysCrack'); if (crack.st >= 3) shatter(g, crack.x, crack.y); }
      return;
    }
    const T = g.tap;
    if (T && dist(T.x, T.y, x, y) < 9 && g.anim - T.at < 1.5) T.n++; else g.tap = { x, y, n: 1 };
    g.tap.at = g.anim;
    if (g.tap.n >= 10) {
      g.cracks.push({ x: g.tap.x, y: g.tap.y, st: 1, hits: 0 });
      g.tap = null;
      sfx(g, 'ysCrack');
      if (g.cracks.length >= 3) shatter(g, x, y);
    }
  }
  function shatter(g, x, y) {
    if (g.shatter) return;
    g.shatter = { x, y, t: 0 };
    g.cracks = [];
    sfx(g, 'ysGlass');
    save(g);   // 重启以后缸补好了，接着玩（开机自检：正在给鱼缸贴透明胶）
  }

  /* ================= 画 ================= */
  function txt(c, x, y, t, size, col, align, bold, edge) {
    c.font = (bold === false ? '' : 'bold ') + size + 'px ' + FONT;
    c.textAlign = align || 'left'; c.textBaseline = 'middle';
    if (edge) { c.lineJoin = 'round'; c.lineWidth = Math.max(1.5, size / 4); c.strokeStyle = edge; c.strokeText(t, x, y); }
    c.fillStyle = col; c.fillText(t, x, y);
    c.textBaseline = 'alphabetic';
  }
  function wrap(c, t, x, y, maxW, lh, size, col, align, bold) {
    c.font = (bold ? 'bold ' : '') + size + 'px ' + FONT;
    const lines = [];
    String(t).split('\n').forEach(par => {
      let line = '';
      for (const ch of par) { if (c.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; } else line += ch; }
      lines.push(line);
    });
    lines.forEach((ln, i) => txt(c, x, y + i * lh, ln, size, col, align, !!bold));
    return lines.length;
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function emoji(c, e, x, y, size, flip) { c.save(); c.translate(x, y); if (flip) c.scale(-1, 1); c.font = size + 'px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000'; c.fillText(e, 0, 0); c.restore(); }
  // 九宫格：图四角 m 像素原样，画面上四角 mw 单位
  function nine(c, im, sx, sy, sw, sh, m, x, y, w, h, mw) {
    const xs = [x, x + mw, x + w - mw, x + w], ys = [y, y + mw, y + h - mw, y + h], us = [sx, sx + m, sx + sw - m, sx + sw], vs = [sy, sy + m, sy + sh - m, sy + sh];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) c.drawImage(im, us[i], vs[j], us[i + 1] - us[i], vs[j + 1] - vs[j], xs[i] - 0.1, ys[j] - 0.1, xs[i + 1] - xs[i] + 0.2, ys[j + 1] - ys[j] + 0.2);
  }
  // 三段：只左右拉，两头 m 像素原样
  function three(c, im, sx, sy, sw, sh, m, x, y, w, h) {
    const mw = Math.min(w / 2, m * h / sh), xs = [x, x + mw, x + w - mw, x + w], us = [sx, sx + m, sx + sw - m, sx + sw];
    for (let i = 0; i < 3; i++) c.drawImage(im, us[i], sy, us[i + 1] - us[i], sh, xs[i] - 0.1, y, xs[i + 1] - xs[i] + 0.2, h);
  }
  function button(g, x, y, w, h, label, fn, o) {
    o = o || {};
    const c = g.c;
    const hov = g.hover && g.hover[0] >= x && g.hover[0] <= x + w && g.hover[1] >= y && g.hover[1] <= y + h && !o.off;
    const bim = art('btn');
    if (bim) {
      three(c, bim, 0, (o.off ? 2 : o.red ? 1 : 0) * 64, 240, 64, 32, x, y, w, h);
      if (hov) { c.globalAlpha = 0.16; rrect(c, x + 2, y + 1, w - 4, h - 2, Math.min(h / 2, 6)); c.fillStyle = '#fff'; c.fill(); c.globalAlpha = 1; }
      txt(c, x + w / 2, y + h / 2 + 0.5, label, o.size || Math.min(11, h * 0.55), o.off ? '#e8e4dc' : '#fff8e6', 'center', true, o.off ? '#6a665e' : '#3a1600');
      g.btns.push({ x, y, w, h, fn, off: !!o.off });
      return;
    }
    const gr = c.createLinearGradient(0, y, 0, y + h);
    if (o.off) { gr.addColorStop(0, '#d8d4cc'); gr.addColorStop(1, '#a8a49c'); }
    else if (o.red) { gr.addColorStop(0, hov ? '#ff8a7a' : '#f26a5a'); gr.addColorStop(1, '#b02a1a'); }
    else { gr.addColorStop(0, hov ? '#fff2a0' : '#ffe27a'); gr.addColorStop(0.5, hov ? '#ffc23a' : '#ffb21a'); gr.addColorStop(1, '#e07a00'); }
    rrect(c, x, y, w, h, Math.min(h / 2, 8));
    c.fillStyle = gr; c.fill();
    c.lineWidth = 1.2; c.strokeStyle = o.off ? '#8a867e' : '#7a3a00'; c.stroke();
    txt(c, x + w / 2, y + h / 2 + 0.5, label, o.size || Math.min(11, h * 0.55), o.off ? '#6a665e' : o.red ? '#fff' : '#5a1f00', 'center', true);
    g.btns.push({ x, y, w, h, fn, off: !!o.off });
  }
  function icon(c, it, x, y, size) {
    const im = art('icons6');
    if (im && it.ic != null) { c.drawImage(im, (it.ic % 8) * 64, Math.floor(it.ic / 8) * 64, 64, 64, x - size / 2, y - size / 2, size, size); return; }
    emoji(c, it.e || '❔', x, y, size * 0.8);
  }

  function render(g) {
    const c = g.c;
    g.btns = [];
    c.clearRect(0, 0, W, H);
    if (g.screen === 'title') drawTitle(g);
    else if (g.screen === 'help') drawHelp(g);
    else if (g.screen === 'play' && g.S) drawPlay(g);
    else if (g.screen === 'tank' && g.S) drawTank(g);
    g.floats.forEach(f => {
      if (g.screen === 'tank' && !f.screen) return;   // 水族箱画面里不显示外面世界的字
      const a = clamp(1 - Math.max(0, f.t - f.life + 0.4) / 0.4, 0, 1);
      const x = f.screen ? f.x : (f.x - g.cam.x) * Z, y = f.screen ? f.y : (f.y - g.cam.y) * Z;
      c.globalAlpha = a; txt(c, x, y, f.text, 7.5, f.col, 'center', true, 'rgba(0,0,0,.75)'); c.globalAlpha = 1;
    });
    if (g.fade) { const t = g.fade.t; c.fillStyle = 'rgba(0,0,0,' + clamp(t < 0.45 ? t / 0.45 : 1 - (t - 0.45) / 0.45, 0, 1) + ')'; c.fillRect(0, 0, W, H); }
    if (g.panel) drawPanel(g);
    if ((g.screen === 'play' || g.screen === 'tank') && !discIn()) { c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(0, 0, W, H); txt(c, W / 2, H / 2, L.disc, 12, '#fff', 'center', true, '#000'); }
    if (g.shatter) {
      const s = g.shatter;
      c.fillStyle = 'rgba(140,200,255,' + Math.min(0.6, s.t * 0.6) + ')'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#fff'; c.lineWidth = 1.4;
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + 0.3, r = Math.min(400, s.t * 500); c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r); c.stroke(); }
    }
  }

  /* ---------- 世界 ---------- */
  /* ---------- 画面分层：远景 → 洞的后墙 → 石头（按地形算光）→ 东西和角色 → 海雪 → 前景剪影 → 暗 ---------- */
  const PX = SC * Z, CHP = Math.round(CH * PX), BCHP = Math.round(CHP / 2), EDGE = 2;   // EDGE：每块四边多画几像素，拼起来不露缝   // 一个世界单位几个像素；一块石头图多大（后墙用一半清楚度）
  const TEXD = {};
  function texData(name) {
    if (TEXD[name]) return TEXD[name];
    const im = art(name);
    if (!im) return null;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    return (TEXD[name] = { w: im.width, h: im.height, d: x.getImageData(0, 0, im.width, im.height).data });
  }
  function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) & 0xffff) / 32767.5 - 1; }
  // 能平铺的噪声（周期 w）
  function pnoise(x, y, w, p) {
    const n = Math.max(1, Math.round(w / p)), fx = x / w * n, fy = y / w * n, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const h = (a, b) => hash2(((a % n) + n) % n, ((b % n) + n) % n), sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
  // 没图的时候代码自己生成一张能平铺的纹理
  function procTex(key, base, amp, p) {
    if (TEXD[key]) return TEXD[key];
    const w = 256, d = new Uint8ClampedArray(w * w * 4);
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      const v = pnoise(x, y, w, p) * 0.7 + pnoise(x + 91, y + 37, w, p / 3) * 0.3, i = (y * w + x) * 4;
      d[i] = base[0] + v * amp; d[i + 1] = base[1] + v * amp; d[i + 2] = base[2] + v * amp * 0.8; d[i + 3] = 255;
    }
    return (TEXD[key] = { w, h: w, d });
  }
  const sdRR = (x, y, r, rad) => { const hx = (r[2] - r[0]) / 2 - rad, hy = (r[3] - r[1]) / 2 - rad, dx = Math.abs(x - (r[0] + r[2]) / 2) - hx, dy = Math.abs(y - (r[1] + r[3]) / 2) - hy; return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - rad; };
  const SANDBOX = (() => { const xs = BAY.SAND.map(p => p[0]), ys = BAY.SAND.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; })();
  // 石头：照地形算光（光从左上来）——朝上的边一道亮边、朝下的边和石缝压暗、外圈一道深色细边，越深越暗越蓝；暗道没发现之前也画成石头
  function bakeRock(g, ci, cj) {
    const M = g.map, S = g.S, cv = document.createElement('canvas'), N = CHP + 2 * EDGE;
    cv.width = cv.height = N;
    const cx = cv.getContext('2d'), im = cx.createImageData(N, N), D = im.data;
    const T = texData('rock') || procTex('_rock', [120, 110, 98], 30, 42), SD = texData('sand') || procTex('_sand', [224, 200, 146], 16, 20);
    const x0 = ci * CH, y0 = cj * CH, o = [0, 0, 0], bb = BAY.BOAT.box;
    const covers = BAY.COVERS.filter(Q => !has(S, Q.id) && Q.r[2] > x0 && Q.r[0] < x0 + CH && Q.r[3] > y0 && Q.r[1] < y0 + CH);
    const sandHere = SANDBOX[2] > x0 && SANDBOX[0] < x0 + CH && SANDBOX[3] > y0 && SANDBOX[1] < y0 + CH;
    for (let py = 0; py < N; py++) {
      const wy = y0 + (py - EDGE + 0.5) / PX;
      if (wy < WY - 1) continue;
      const t = clamp((wy - 200) / 1200, 0, 1), tr = 1 - 0.55 * t, tg = 1 - 0.4 * t, tb = 1 - 0.14 * t;
      const ty = Math.floor(wy * PX);
      const trow = ((ty % T.h) + T.h) % T.h * T.w, srow = ((ty % SD.h) + SD.h) % SD.h * SD.w;
      for (let px = 0; px < N; px++) {
        const wx = x0 + (px - EDGE + 0.5) / PX;
        sample3(M, wx, wy, o);
        let f = o[0], gx = o[1], gy = o[2];
        for (const Q of covers) { const v = -sdRR(wx, wy, Q.r, 9); if (v > f) { f = v; gx = sdRR(wx - 1, wy, Q.r, 9) - sdRR(wx + 1, wy, Q.r, 9); gy = sdRR(wx, wy - 1, Q.r, 9) - sdRR(wx, wy + 1, Q.r, 9); } }
        if (f < -0.45) continue;
        const gl = Math.hypot(gx, gy) || 1, nx = -gx / gl, ny = -gy / gl;
        const e = f < 18 ? Math.exp(-f / 6) : 0, l = -(nx * 0.45 + ny * 0.89);
        let sh = 0.9 + e * 0.42 * l - (1 - e) * 0.12;
        if (f < 2.6 && ny < -0.2) sh += (1 - f / 2.6) * 0.42 * -ny;
        if (f < 0.9) sh *= 0.42 + 0.58 * Math.max(0, f) / 0.9;
        let r, gg, b;
        const tx = Math.floor(wx * PX);
        if (wx > bb[0] && wx < bb[2] && wy > bb[1] && wy < bb[3] - 6) { r = 124; gg = 80; b = 42; }
        else if (sandHere && inPoly(wx, wy, BAY.SAND)) { const k = (srow + ((tx % SD.w) + SD.w) % SD.w) * 4; r = SD.d[k]; gg = SD.d[k + 1]; b = SD.d[k + 2]; }
        else { const k = (trow + ((tx % T.w) + T.w) % T.w) * 4; r = T.d[k]; gg = T.d[k + 1]; b = T.d[k + 2]; }
        const i = (py * N + px) * 4;
        D[i] = r * sh * tr; D[i + 1] = gg * sh * tg; D[i + 2] = b * sh * tb; D[i + 3] = 255 * Math.min(1, (f + 0.45) / 0.9);
      }
    }
    cx.putImageData(im, 0, 0);
    return cv;
  }
  // 洞的后墙：贴着石头的那圈水后面，一面更暗、更雾、偏紫蓝的石壁往里退
  function bakeBack(g, ci, cj) {
    const M = g.map, cv = document.createElement('canvas'), N = BCHP + 2 * EDGE;
    cv.width = cv.height = N;
    const cx = cv.getContext('2d'), im = cx.createImageData(N, N), D = im.data;
    const own = texData('backwall'), T = own || texData('rock') || procTex('_rock', [120, 110, 98], 30, 42), bp = PX / 2;
    const x0 = ci * CH, y0 = cj * CH, o = [0, 0, 0];
    for (let py = 0; py < N; py++) {
      const wy = y0 + (py - EDGE + 0.5) / bp;
      if (wy < WY + 2) continue;
      const t = clamp((wy - 120) / 950, 0, 1), fk = 0.84 - 0.52 * t, av = 0.5 + 0.5 * Math.min(1, t * 2.5), bb = BAY.BOAT.box;
      const fr = (t < 0.4 ? 104 - 150 * t : 44 - 50 * (t - 0.4)) * 0.8, fg = (t < 0.4 ? 190 - 230 * t : 98 - 120 * (t - 0.4)) * 0.8, fb = (t < 0.4 ? 222 - 150 * t : 162 - 190 * (t - 0.4)) * 0.8;
      const trow = ((Math.floor(wy * bp * 1.4) % T.h) + T.h) % T.h * T.w;
      for (let px = 0; px < N; px++) {
        const wx = x0 + (px - EDGE + 0.5) / bp;
        sample3(M, wx, wy, o);
        const f = o[0];
        if (f < -40 || (wx > bb[0] - 12 && wx < bb[2] + 12 && wy > bb[1] - 12 && wy < bb[3])) continue;
        const k = (trow + ((Math.floor(wx * bp * 1.4) % T.w) + T.w) % T.w) * 4;
        let r = T.d[k], gg = T.d[k + 1], b = T.d[k + 2];
        if (!own) { r *= 0.5; gg *= 0.52; b *= 0.68; }
        const near = f > -16 ? 0.7 + 0.3 * Math.min(1, -f / 16) : 1;
        const i = (py * N + px) * 4;
        D[i] = (r * (1 - fk) + fr * fk) * near; D[i + 1] = (gg * (1 - fk) + fg * fk) * near; D[i + 2] = (b * (1 - fk) + fb * fk) * near;
        D[i + 3] = 255 * av * (f > -14 ? 1 : (f + 40) / 26);
      }
    }
    cx.putImageData(im, 0, 0);
    return cv;
  }
  function clearChunks(g, r) {
    ['rock', 'back'].forEach(kind => [...g.rc[kind].keys()].forEach(key => {
      const [ci, cj] = key.split(',').map(Number);
      if (!r || (ci * CH < r[2] + 2 && (ci + 1) * CH > r[0] - 2 && cj * CH < r[3] + 2 && (cj + 1) * CH > r[1] - 2)) g.rc[kind].delete(key);
    }));
  }
  // 把一层石头块拼到一张跟画面一样大的图上（按整像素摆，块和块之间不会有缝）
  // 后墙那层：图里装的世界比画面大一圈（k = 0.93），贴到画面上的时候缩一点 → 镜头一动它比前面慢，看着往里退
  function paintChunks(g, kind, need) {
    const back = kind === 'back', k = back ? 0.93 : 1, sc = back ? PX / 2 : PX, size = back ? BCHP : CHP;
    const ww = VW / k, wh = VH / k, ox = g.cam.x + VW / 2 - ww / 2, oy = g.cam.y + VH / 2 - wh / 2;
    const key = back ? 'bl' : 'tl', cw = Math.ceil(ww * sc) + 1, chh = Math.ceil(wh * sc) + 1;
    if (!g[key] || g[key].width !== cw) { g[key] = document.createElement('canvas'); g[key].width = cw; g[key].height = chh; }
    const t = g[key].getContext('2d'), C = g.rc[kind];
    t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.globalAlpha = 1; t.clearRect(0, 0, cw, chh);
    const bx = Math.round(ox * sc), by = Math.round(oy * sc);
    for (let cj = Math.max(0, Math.floor(oy / CH)); cj * CH < Math.min(WH, oy + wh); cj++)
      for (let ci = Math.max(0, Math.floor(ox / CH)); ci * CH < Math.min(WW, ox + ww); ci++) {
        const e = C.get(ci + ',' + cj);
        if (e) { e.t = g.anim; t.drawImage(e.cv, EDGE, EDGE, size, size, ci * size - bx, cj * size - by, size, size); }
        else need.push([kind, ci, cj, Math.hypot((ci + 0.5) * CH - ox - ww / 2, (cj + 0.5) * CH - oy - wh / 2)]);
      }
    return { cv: g[key], sw: ww * sc, sh: wh * sc, dx: (bx - ox * sc) };
  }
  // 没画好的块：近的先画；一帧最多花几毫秒（镜头一下跳过去的时候一口气画完）
  function bakeSome(g, need) {
    const cx = g.cam.x + VW / 2, cy = g.cam.y + VH / 2;
    for (let cj = Math.floor((cy - VH) / CH); cj <= Math.floor((cy + VH) / CH); cj++)   // 外面一圈也先画好
      for (let ci = Math.floor((cx - VW) / CH); ci <= Math.floor((cx + VW) / CH); ci++) {
        if (ci < 0 || cj < 0 || ci * CH >= WW || cj * CH >= WH) continue;
        ['rock', 'back'].forEach(kind => { if (!g.rc[kind].has(ci + ',' + cj) && !need.some(q => q[0] === kind && q[1] === ci && q[2] === cj)) need.push([kind, ci, cj, 9999 + Math.hypot((ci + 0.5) * CH - cx, (cj + 0.5) * CH - cy)]); });
      }
    need.sort((a, b) => a[3] - b[3]);
    const t0 = performance.now(), budget = g.bakeAll ? 600 : 7;
    for (const [kind, ci, cj, d] of need) {
      if (performance.now() - t0 > budget || (d >= 9999 && g.bakeAll)) break;
      g.rc[kind].set(ci + ',' + cj, { cv: kind === 'rock' ? bakeRock(g, ci, cj) : bakeBack(g, ci, cj), t: g.anim });
    }
    g.bakeAll = false;
    ['rock', 'back'].forEach(kind => { const C = g.rc[kind]; if (C.size > 30) [...C.entries()].sort((a, b) => a[1].t - b[1].t).slice(0, C.size - 24).forEach(([key]) => C.delete(key)); });
  }
  // 远景三张（没图的时候代码画一张：渐变 + 几团很淡的远处影子）
  function makeFar(top, bot, blob, light) {
    const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 600;
    const x = cv.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 600);
    gr.addColorStop(0, top); gr.addColorStop(1, bot); x.fillStyle = gr; x.fillRect(0, 0, 1600, 600);
    if (light) { const r = x.createRadialGradient(800, -160, 40, 800, -160, 760); r.addColorStop(0, light); r.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, 1600, 600); }
    let sd = top.length * 977 + 13;
    const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 16; i++) {
      const bx = R() * 1600, by = 330 + R() * 300, rx = 110 + R() * 230, ry = 0.35 + R() * 0.4;
      for (const o of [-1600, 0, 1600]) { x.save(); x.translate(bx + o, by); x.scale(1, ry); const r = x.createRadialGradient(0, 0, 0, 0, 0, rx); r.addColorStop(0, blob); r.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = r; x.beginPath(); x.arc(0, 0, rx, 0, Math.PI * 2); x.fill(); x.restore(); }
    }
    return cv;
  }
  // 岸上的远景（没图的时候代码画）：天、远处的海和岛；中间一排景区房顶和椰子树
  function makeShoreFar() {
    const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 300;
    const x = cv.getContext('2d'), sky = x.createLinearGradient(0, 0, 0, 230);
    sky.addColorStop(0, '#86c8ee'); sky.addColorStop(1, '#e6f4fb'); x.fillStyle = sky; x.fillRect(0, 0, 1600, 300);
    let sd = 31; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    x.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 9; i++) { const bx = R() * 1600, by = 30 + R() * 110, w = 80 + R() * 120; for (const o of [-1600, 0, 1600]) for (let k = 0; k < 4; k++) { x.beginPath(); x.ellipse(bx + o + k * w * 0.22, by + Math.sin(k) * 6, w * 0.22, w * 0.11, 0, 0, Math.PI * 2); x.fill(); } }
    for (const [col, base, amp, n] of [['rgba(120,160,185,.55)', 228, 26, 3], ['rgba(95,140,160,.7)', 236, 18, 5]]) {
      x.fillStyle = col;
      for (let i = 0; i < n; i++) { const bx = R() * 1600, w = 160 + R() * 260, h = amp * (0.6 + R()); for (const o of [-1600, 0, 1600]) { x.beginPath(); x.moveTo(bx + o - w / 2, base); x.quadraticCurveTo(bx + o, base - h * 2, bx + o + w / 2, base); x.fill(); } }
    }
    const sea = x.createLinearGradient(0, 236, 0, 300); sea.addColorStop(0, '#6ab8d6'); sea.addColorStop(1, '#3f9cc4'); x.fillStyle = sea; x.fillRect(0, 236, 1600, 64);
    return cv;
  }
  function makeShoreMid() {
    const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 200;
    const x = cv.getContext('2d');
    let sd = 77; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    x.fillStyle = 'rgba(70,110,110,.55)'; x.strokeStyle = 'rgba(70,110,110,.55)';
    for (let i = 0; i < 7; i++) { const bx = R() * 1600, w = 70 + R() * 90, h = 40 + R() * 40; for (const o of [-1600, 0, 1600]) { x.fillRect(bx + o - w / 2, 200 - h, w, h); x.beginPath(); x.moveTo(bx + o - w / 2 - 14, 200 - h); x.quadraticCurveTo(bx + o, 200 - h - 34, bx + o + w / 2 + 14, 200 - h); x.fill(); } }
    for (let i = 0; i < 10; i++) {
      const bx = R() * 1600, h = 90 + R() * 70, lean = (R() - 0.5) * 40;
      for (const o of [-1600, 0, 1600]) {
        x.lineWidth = 6; x.beginPath(); x.moveTo(bx + o, 200); x.quadraticCurveTo(bx + o + lean * 0.3, 200 - h / 2, bx + o + lean, 200 - h); x.stroke();
        x.lineWidth = 9; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; x.beginPath(); x.moveTo(bx + o + lean, 200 - h); x.quadraticCurveTo(bx + o + lean + Math.cos(a) * 30, 200 - h - 14, bx + o + lean + Math.cos(a) * 52, 200 - h + 18 + Math.abs(Math.sin(a)) * 10); x.stroke(); }
      }
    }
    return cv;
  }
  // 波纹光（没图的时候代码算一张能平铺的）
  function causticTex() {
    const im = art('caustics');
    if (im) { if (!TEXD._cimg) { const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, im.width, im.height); for (let i = 0; i < d.data.length; i += 4) { d.data[i + 3] = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3; d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; } x.putImageData(d, 0, 0); TEXD._cimg = cv; } return TEXD._cimg; }
    if (TEXD._cproc) return TEXD._cproc;
    const w = 256, cv = document.createElement('canvas'); cv.width = cv.height = w;
    const x = cv.getContext('2d'), d = x.createImageData(w, w), T = Math.PI * 2 / w;
    for (let j = 0; j < w; j++) for (let i = 0; i < w; i++) {
      const u = i * T, v = j * T;
      const a = Math.sin(u * 3 + Math.sin(v * 2) * 1.7 + Math.sin(u + v * 2) * 0.9), b = Math.sin(v * 3 + Math.sin(u * 2) * 1.7 + Math.sin(v - u * 2) * 0.9);
      const k = (j * w + i) * 4; d.data[k] = d.data[k + 1] = d.data[k + 2] = 255; d.data[k + 3] = Math.pow(1 - Math.min(1, Math.abs(a + b) * 0.85), 5) * 255;
    }
    x.putImageData(d, 0, 0);
    return (TEXD._cproc = cv);
  }
  function layers(g) {
    if (g.lay) return g.lay;
    return (g.lay = { far: [makeFar('#8ad8ef', '#2b8bbf', 'rgba(18,70,110,.38)', 'rgba(255,255,235,.4)'), makeFar('#2a7db1', '#0f3967', 'rgba(4,24,54,.42)', null), makeFar('#0d2a4f', '#030a18', 'rgba(0,3,10,.55)', null)], shoreFar: makeShoreFar(), shoreMid: makeShoreMid() });
  }

  // 石头：照离墙多远的表描边（一块 240×240 算一次，记住）


  // 远景：按镜头深浅在三张之间慢慢过渡；只动一点点
  function drawFar(g) {
    const c = g.c, cy = g.cam.y, Ly = layers(g), top = Math.max(0, (WY - cy) * Z);
    if (top >= H) return;
    const d = cy + VH / 2, w1 = clamp((520 - d) / 180, 0, 1), w3 = clamp((d - 760) / 180, 0, 1), w2 = clamp(1 - w1 - w3, 0, 1);
    const names = ['far-shallow', 'far-mid', 'far-deep'], off = -(((g.cam.x * Z * 0.3) % 640) + 640) % 640;
    c.save(); c.beginPath(); c.rect(0, top, W, H - top); c.clip();
    [w1, w2, w3].forEach((wgt, i) => {
      if (wgt <= 0.01) return;
      const im = art(names[i]) || Ly.far[i];
      c.globalAlpha = i === [w1, w2, w3].indexOf(Math.max(w1, w2, w3)) ? 1 : wgt;
      for (let x = off; x < W; x += 640) c.drawImage(im, x, top, 640, 240);
    });
    c.globalAlpha = 1;
    c.restore();
  }
  // 岸上的天：远处的海和岛（最慢）→ 景区房顶椰子树 → 栈道
  function drawSky(g) {
    const c = g.c, cy = g.cam.y, Ly = layers(g);
    if (cy >= WY) return;
    const far = art('shore-far') || Ly.shoreFar, mid = art('shore-mid') || Ly.shoreMid;
    const y0 = (0 - cy) * Z, hFar = (WY - 0) * Z + 2;
    for (let x = -(((g.cam.x * Z * 0.12) % 640) + 640) % 640; x < W; x += 640) c.drawImage(far, x, y0, 640, hFar);
    const mb = (GY - cy) * Z + 2;
    for (let x = -(((g.cam.x * Z * 0.35) % 480) + 480) % 480; x < W; x += 480) c.drawImage(mid, x, mb - 60, 480, 60);
    c.fillStyle = 'rgba(215,236,248,.22)'; c.fillRect(0, mb - 62, W, 62);   // 一层薄雾，显得远
  }
  // 能游这层后面的光柱（慢慢晃）
  function drawShafts(g) {
    const c = g.c, x0 = g.cam.x - 60, x1 = g.cam.x + VW + 60, tm = g.anim;
    if (g.cam.y > 470) return;
    for (let i = Math.floor(x0 / 110) - 2; i <= Math.ceil(x1 / 110); i++) {
      const x = i * 110 + Math.sin(tm * 0.35 + i * 1.7) * 14, w = 22 + (i * 37 % 5) * 6, a = 0.1 + 0.05 * Math.sin(tm * 0.5 + i);
      const gr = c.createLinearGradient(0, WY, 0, 470); gr.addColorStop(0, 'rgba(255,252,225,' + a + ')'); gr.addColorStop(1, 'rgba(255,252,225,0)');
      c.fillStyle = gr; c.beginPath(); c.moveTo(x, WY); c.lineTo(x + w, WY); c.lineTo(x + w + 120, 470); c.lineTo(x + 80, 470); c.closePath(); c.fill();
    }
  }
  // 石头那层 + 浅处石头沙子顶上一晃一晃的波纹光
  function drawRockLayer(g, need) {
    const L2 = paintChunks(g, 'rock', need), t = L2.cv.getContext('2d');
    t.setTransform(SC, 0, 0, SC, 0, 0);
    const depth = g.cam.y + VH / 2, ca = clamp(1 - (depth - 160) / 380, 0, 1) * 0.4;
    if (ca > 0.01) {
      const ctex = causticTex(), cw = ctex.width, pat = t.createPattern(ctex, 'repeat'), tm = g.anim;
      t.save(); t.scale(Z, Z); t.translate(-g.cam.x, -g.cam.y); t.beginPath(); BAY.SAND.forEach(([x, y], i) => (i ? t.lineTo(x, y) : t.moveTo(x, y))); t.closePath(); t.clip(); t.setTransform(SC, 0, 0, SC, 0, 0);   // 只照在浅滩的沙子上（像定样那样）
      t.globalCompositeOperation = 'source-atop';
      [[tm * 7, tm * 4, 0.55], [-tm * 5, tm * 6, 0.42]].forEach(([ox, oy, sc], k) => {
        const ks = sc * 256 / cw;
        pat.setTransform(new DOMMatrix().translate((-g.cam.x * Z + ox) % (cw * ks), (-g.cam.y * Z + oy) % (cw * ks)).scale(ks));
        t.globalAlpha = ca * (k ? 0.7 : 1); t.fillStyle = pat; t.fillRect(0, 0, W, H);
      });
      t.globalAlpha = 1; t.globalCompositeOperation = 'source-over'; t.restore();
    }
    g.c.drawImage(L2.cv, 0, 0, L2.sw, L2.sh, 0, 0, W, H);
  }
  // 东西底下一团软影子（离地面越近越深）
  function shadowUnder(g, x, y, w) {
    let d = 0;
    while (d < 40 && fieldAt(g, x, y + d) < 0) d += 2;
    if (d >= 40 || d < 1) return;
    const c = g.c, k = 1 - d / 40;
    c.fillStyle = 'rgba(0,10,25,' + (0.3 * k) + ')'; c.beginPath(); c.ellipse(x, y + d - 1, w * (0.35 + 0.2 * k), 2 + k, 0, 0, Math.PI * 2); c.fill();
  }
  // 海底的小摆设：海草、珊瑚、海星、贝壳、海葵、深海发光的小植物（Codex 的 decor 到了换图）
  function drawDecor(g) {
    const c = g.c, tm = g.anim, im = art('decor'), x0 = g.cam.x - 30, x1 = g.cam.x + VW + 30, y0 = g.cam.y - 30, y1 = g.cam.y + VH + 40;
    g.decor.forEach(d => {
      if (d.x < x0 || d.x > x1 || d.y < y0 || d.y > y1) return;
      if (im) { const sz = 24 * d.s; c.save(); c.translate(d.x, d.y + 2); c.rotate(Math.sin(tm * 1.2 + d.ph) * (d.k < 2 ? 0.06 : 0)); c.drawImage(im, d.k * 128, 0, 128, 128, -sz / 2, -sz, sz, sz); c.restore(); return; }
      const s = d.s, sw = Math.sin(tm * 1.3 + d.ph);
      if (d.k === 0 || d.k === 1) { c.strokeStyle = d.k ? '#4a9a52' : '#3a8a48'; c.lineWidth = 1.8; c.lineCap = 'round'; for (let j = -1; j <= 1; j++) { const h = (d.k ? 9 : 20) * s * (1 - Math.abs(j) * 0.2); c.beginPath(); c.moveTo(d.x + j * 2.5, d.y); c.quadraticCurveTo(d.x + j * 3 + sw * 3, d.y - h * 0.6, d.x + j * 4 + sw * 5, d.y - h); c.stroke(); } }
      else if (d.k === 2) { c.strokeStyle = '#e88aa8'; c.lineWidth = 1.2; for (let j = -2; j <= 2; j++) { c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + j * 3.5 * s, d.y - 11 * s + Math.abs(j) * 2); c.stroke(); } }
      else if (d.k === 3) { c.strokeStyle = '#ef9a4a'; c.lineWidth = 1.8; c.lineCap = 'round'; [[0, -10, -4, -14], [0, -6, 5, -11], [0, -3, -6, -6]].forEach(([a, b, e, f]) => { c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + a, d.y + b * s); c.lineTo(d.x + e * s, d.y + f * s); c.stroke(); }); }
      else if (d.k === 4) { c.fillStyle = '#f0884a'; c.beginPath(); for (let j = 0; j < 10; j++) { const a = j / 10 * Math.PI * 2 - Math.PI / 2, r = j % 2 ? 1.6 : 4; c.lineTo(d.x + Math.cos(a) * r * s, d.y - 2 + Math.sin(a) * r * s * 0.6); } c.closePath(); c.fill(); }
      else if (d.k === 5) { c.fillStyle = '#f4ece0'; [[-3, 0], [1, -1], [4, 0]].forEach(([a, b]) => { c.beginPath(); c.ellipse(d.x + a * s, d.y - 1 + b, 2.2 * s, 1.5 * s, 0, 0, Math.PI * 2); c.fill(); }); }
      else if (d.k === 6) { c.strokeStyle = '#b070c8'; c.lineWidth = 1.3; c.lineCap = 'round'; for (let j = -3; j <= 3; j++) { c.beginPath(); c.moveTo(d.x + j * 0.8, d.y); c.quadraticCurveTo(d.x + j * 1.6, d.y - 5 * s, d.x + j * 2.4 + sw * 1.5, d.y - 8 * s); c.stroke(); } }
      else { c.strokeStyle = '#2a5a6a'; c.lineWidth = 1; c.beginPath(); c.moveTo(d.x, d.y); c.quadraticCurveTo(d.x + sw * 2, d.y - 6, d.x + sw * 3, d.y - 10 * s); c.stroke(); c.fillStyle = 'rgba(140,250,255,' + (0.6 + 0.3 * Math.sin(tm * 2 + d.ph)) + ')'; c.beginPath(); c.arc(d.x + sw * 3, d.y - 10 * s, 1.6, 0, Math.PI * 2); c.fill(); }
    });
  }
  // 石头边的大石片（Codex 的 ledges 到了才有）
  function drawLedges(g) {
    const c = g.c, im = art('ledges');
    if (!im) return;
    const x0 = g.cam.x - 50, x1 = g.cam.x + VW + 50, y0 = g.cam.y - 40, y1 = g.cam.y + VH + 40;
    g.ledges.forEach(L2 => { if (L2.x < x0 || L2.x > x1 || L2.y < y0 || L2.y > y1) return; const col = L2.k % 4, row = L2.up ? 0 : 1; c.drawImage(im, col * 320, row * 200, 320, 200, L2.x - 30, L2.up ? L2.y - 19 : L2.y - 19, 60, 38); });   // 嵌进石头里一半
  }
  // 最前面的剪影：比画面跑得快（以画面中间为准放大一点）
  function drawFronts(g) {
    const c = g.c, im = art('front'), k = 1.22, tm = g.anim;
    c.save(); c.translate(W / 2, H / 2); c.scale(k, k); c.translate(-W / 2, -H / 2); c.scale(Z, Z); c.translate(-g.cam.x, -g.cam.y);
    const mx = g.cam.x + VW / 2, my = g.cam.y + VH / 2;
    g.fronts.forEach(F => {
      if (Math.abs(F.x - mx) > VW / k / 2 + 60 || Math.abs(F.y - my) > VH / k / 2 + 80) return;
      const ex = Math.abs(F.x - mx) / (VW / 2), ey = (F.y - my) / (VH / 2), edge = clamp(Math.max(ex, ey) * 1.6 - 0.9, 0, 1);
      if (edge <= 0.02) return;
      c.globalAlpha = edge;
      if (im) { c.drawImage(im, (F.k % 3) * 400, Math.floor(F.k / 3) * 400, 400, 400, F.x - 30, F.y - 56, 60, 60); c.globalAlpha = 1; return; }
      c.fillStyle = 'rgba(2,10,20,.88)'; c.strokeStyle = 'rgba(2,10,20,.88)'; c.lineCap = 'round';
      if (F.k < 3) { c.lineWidth = 4; for (let j = -2; j <= 2; j++) { const h = 26 + (j * j * 4) + F.k * 6, sw = Math.sin(tm * 0.9 + F.ph + j) * 6; c.beginPath(); c.moveTo(F.x + j * 6, F.y + 4); c.bezierCurveTo(F.x + j * 7 + sw, F.y - h * 0.4, F.x + j * 9 - sw, F.y - h * 0.7, F.x + j * 10 + sw * 1.5, F.y - h); c.stroke(); } }
      else { c.beginPath(); c.ellipse(F.x, F.y + 4, 22 + F.k * 2, 12, 0, Math.PI, 0); c.fill(); c.beginPath(); c.ellipse(F.x + 13, F.y + 2, 11, 8, 0, Math.PI, 0); c.fill(); }
      c.globalAlpha = 1;
    });
    c.restore();
  }
  // 水里飘的小白点、海狗带的小气泡（画面坐标 ／ 世界坐标）
  function drawSnow(g) {
    const c = g.c, top = (WY - g.cam.y) * Z;
    if (!g.snow) return;
    g.snow.forEach(p => { if (p.y < top + 2) return; c.globalAlpha = 0.16 + 0.34 * p.z; c.fillStyle = '#e4f6ff'; c.beginPath(); c.arc(p.x, p.y, 0.45 + p.z * 1.05, 0, Math.PI * 2); c.fill(); });
    c.globalAlpha = 1;
  }
  function drawBubs(g) {
    const c = g.c;
    c.strokeStyle = 'rgba(235,250,255,.75)'; c.lineWidth = 0.5;
    g.bubs.forEach(b => { c.globalAlpha = clamp(2.6 - b.t, 0, 1); c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.stroke(); });
    c.globalAlpha = 1;
  }
  // 水下的机关、栈道这些（世界坐标里画）
  function drawWorld(g) {
    const c = g.c, cx = g.cam.x, cy = g.cam.y, tm = g.anim, S = g.S;
    const x0 = cx - 4, x1 = cx + VW + 4, y0 = cy - 4, y1 = cy + VH + 4;
    drawLedges(g);
    drawDecor(g);
    // 水流
    BAY.CURRENTS.forEach(Q => {
      if (Q.x1 < x0 || Q.x0 > x1 || Q.y1 < y0 || Q.y0 > y1) return;
      if (Q.fins && has(S, 'fins')) c.globalAlpha = 0.45;
      c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(Q.x0, Q.y0, Q.x1 - Q.x0, Q.y1 - Q.y0);
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 0.9; c.lineCap = 'round';
      if (Q.vx) { const w = Q.x1 - Q.x0; for (let y = Q.y0 + 8; y < Q.y1; y += 14) for (let k = 0; k < 2; k++) { const x = Q.x1 - (tm * 70 + y * 7 + k * w / 2) % w; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 10, y); c.stroke(); } }
      else { const h = Q.y1 - Q.y0; for (let x = Q.x0 + 6; x < Q.x1; x += 10) for (let k = 0; k < 3; k++) { const y = Q.y0 + (tm * 120 + x * 13 + k * h / 3) % h; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 12); c.stroke(); } }
      c.globalAlpha = 1;
    });
    // 裂了缝的石头
    BAY.CRACKS.forEach(K => {
      if (has(S, K.id)) return;
      const [, kx, ky, rx, ry] = K.shape, im = art('crack');
      if (im) { c.drawImage(im, kx - rx - 4, ky - ry - 6, (rx + 4) * 2, (ry + 6) * 2); return; }
      c.strokeStyle = 'rgba(40,20,0,.8)'; c.lineWidth = 1.2;
      [[-0.75, -0.2, -0.25, 0.25, 0.2, -0.15, 0.7, 0.1], [0.05, -0.65, -0.05, -0.1, 0.35, 0.55], [-0.35, 0.6, -0.15, 0.1]].forEach(q => { c.beginPath(); for (let i = 0; i < q.length; i += 2) { const x = kx + q[i] * rx, y = ky + q[i + 1] * ry; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); });
    });
    // 气泡泉
    const vim = art('vent');
    g.pos.vents.forEach(([x, y]) => {
      if (x < x0 - 20 || x > x1 + 20 || y < y0 - 60 || y > y1 + 20) return;
      const gl = c.createRadialGradient(x, y - 4, 0, x, y - 4, 16); gl.addColorStop(0, 'rgba(190,250,255,.35)'); gl.addColorStop(1, 'rgba(190,250,255,0)'); c.fillStyle = gl; c.beginPath(); c.arc(x, y - 4, 16, 0, Math.PI * 2); c.fill();
      if (vim) c.drawImage(vim, x - 16, y - 8, 32, 20); else { c.fillStyle = '#4a5a62'; c.beginPath(); c.ellipse(x, y, 8, 3.5, 0, Math.PI, 0); c.fill(); }
      c.strokeStyle = 'rgba(230,252,255,.8)'; c.lineWidth = 0.6;
      for (let i = 0; i < 8; i++) { const t = (tm * 0.8 + i / 8) % 1; c.beginPath(); c.arc(x + Math.sin(t * 9 + i * 2) * 3, y - 3 - t * 46, 0.7 + t * 1.8, 0, Math.PI * 2); c.stroke(); }
    });
    drawInlet(g);
    // 栈道、栏杆、去珊瑚礁的门、岸上的水管、水面
    if (y0 < WY + 24) {
      const sh = c.createLinearGradient(0, WY, 0, WY + 22); sh.addColorStop(0, 'rgba(0,20,40,.28)'); sh.addColorStop(1, 'rgba(0,20,40,0)'); c.fillStyle = sh; c.fillRect(x0, WY, x1 - x0, 22);   // 栈道底下的影子
      const post = art('post'), deck = art('deck'), rail = art('rail'), gate = art('gate'), pipe = art('pipe-shore');
      for (let x = Math.floor(x0 / 60) * 60 + 10; x < x1; x += 60) { if (post) c.drawImage(post, x - 4, GY + 2, 14.4, 42); else { c.fillStyle = '#6a4822'; c.fillRect(x, GY + 4, 5, WY - GY + 16); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + 3, GY + 4, 2, WY - GY + 16); } }
      if (deck) for (let x = Math.floor(x0 / 153.6) * 153.6; x < x1; x += 153.6) c.drawImage(deck, x, GY - 2, 154, 21.6);
      else {
        const wd = c.createLinearGradient(0, GY - 2, 0, GY + 8); wd.addColorStop(0, '#c89a5a'); wd.addColorStop(1, '#8a5a28');
        c.fillStyle = wd; c.fillRect(x0, GY, x1 - x0, 7);
        c.strokeStyle = 'rgba(60,30,10,.4)'; c.lineWidth = 0.6; for (let x = Math.floor(x0 / 14) * 14; x < x1; x += 14) { c.beginPath(); c.moveTo(x, GY); c.lineTo(x, GY + 7); c.stroke(); }
      }
      if (x1 > RAIL) {
        const xa = Math.max(RAIL, x0);
        if (rail) for (let x = Math.max(RAIL, Math.floor(x0 / 76.8) * 76.8); x < x1; x += 76.8) c.drawImage(rail, x, GY - 18, 77, 19.2);
        else { c.strokeStyle = '#ece4d4'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(xa, GY - 14); c.lineTo(x1, GY - 14); c.moveTo(xa, GY - 7); c.lineTo(x1, GY - 7); c.stroke(); c.fillStyle = '#d8d0c0'; for (let x = Math.ceil(xa / 24) * 24; x < x1; x += 24) c.fillRect(x - 1.2, GY - 16, 2.4, 16); }
      }
      if (SPOT.gate - 40 < x1) {
        if (gate) c.drawImage(gate, SPOT.gate - 36, GY - 70, 72, 72);
        else { c.fillStyle = '#c8402a'; c.fillRect(SPOT.gate - 18, GY - 44, 5, 44); c.fillRect(SPOT.gate + 13, GY - 44, 5, 44); c.fillRect(SPOT.gate - 22, GY - 48, 44, 7); c.fillStyle = '#f0d040'; c.fillRect(SPOT.gate - 14, GY - 18, 28, 3); }
      }
      if (SPOT.pipe > x0 - 10 && SPOT.pipe < x1 + 10) {
        if (pipe) c.drawImage(pipe, SPOT.pipe - 9, GY - 16, 18, 42);
        else { c.fillStyle = '#6a7078'; c.fillRect(SPOT.pipe - 4, GY - 12, 8, WY - GY + 24); c.fillStyle = '#8a9098'; rrect(c, SPOT.pipe - 6, GY - 15, 12, 5, 2); c.fill(); }
        c.fillStyle = has(S, 'valve') ? '#2a8ad0' : '#2a2a2a'; c.beginPath(); c.ellipse(SPOT.pipe, GY - 13, 3.5, 1.4, 0, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,.28)'; for (let x = Math.floor(x0 / 9) * 9; x < x1; x += 9) { const w = 3 + 3 * Math.abs(Math.sin(x * 0.37)); c.fillRect(x + Math.sin(tm * 1.6 + x * 0.21) * 3, WY - 0.4 + Math.sin(x * 0.13 + tm) * 0.5, w, 0.8); }
    }
  }

  // 沉船：外面一层船壳（海狗钻进去就变透明），里面是隔出来的船舱
  function drawBoatInside(g) {
    const c = g.c, im = art('boatin'), b = BAY.BOAT.box;
    c.globalAlpha = g.inBoat;
    if (im) c.drawImage(im, b[0], b[1], b[2] - b[0], b[3] - b[1]);
    else {
      c.save(); c.beginPath(); BAY.BOAT.inside.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
      c.fillStyle = '#3a2412'; c.fill(); c.clip();
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 0.7; for (let y = 222; y < 332; y += 7) { c.beginPath(); c.moveTo(40, y); c.lineTo(236, y); c.stroke(); }
      c.restore();
    }
    c.globalAlpha = 1;
  }
  function drawBoatFront(g) {
    const a = 1 - g.inBoat, b = BAY.BOAT.box;
    if (a <= 0.01 || b[2] < g.cam.x || b[0] > g.cam.x + VW || b[3] < g.cam.y || b[1] > g.cam.y + VH) return;
    const c = g.c, im = art('boat');
    c.globalAlpha = a;
    if (im) c.drawImage(im, b[0], b[1], b[2] - b[0], b[3] - b[1]);
    else {
      c.save();
      c.beginPath(); c.moveTo(34, 264); c.lineTo(242, 264); c.lineTo(214, 316); c.quadraticCurveTo(200, 336, 120, 338); c.quadraticCurveTo(60, 336, 46, 322); c.closePath();
      c.fillStyle = '#8a5428'; c.fill(); c.clip();
      c.strokeStyle = 'rgba(40,20,5,.5)'; c.lineWidth = 0.7; [278, 292, 306, 320].forEach(y => { c.beginPath(); c.moveTo(30, y); c.lineTo(244, y); c.stroke(); });
      c.restore();
      c.fillStyle = '#c8402a'; c.fillRect(34, 262, 208, 5);
      c.fillStyle = '#b07a44'; c.fillRect(146, 212, 64, 52);
      c.fillStyle = '#5a3a1a'; c.fillRect(143, 208, 70, 6);
      c.fillStyle = '#1a1008'; rrect(c, 151, 234, 13, 30, 2); c.fill();
      c.fillStyle = '#7ac0d0'; c.beginPath(); c.arc(186, 234, 6, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#5a3a1a'; c.lineWidth = 1.5; c.stroke();
      c.strokeStyle = '#6a4420'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(90, 264); c.lineTo(104, 212); c.stroke();
      c.strokeStyle = '#3a9a4a'; c.lineWidth = 2; c.beginPath(); c.moveTo(60, 266); c.quadraticCurveTo(64 + Math.sin(g.anim * 1.4) * 3, 252, 58, 240); c.stroke();
    }
    c.globalAlpha = 1;
  }
  // 暗道：没发现之前盖一块石头

  // 海狗游到跟前了：能点的东西外面一圈亮环一跳一跳
  function drawTapRings(g) {
    const c = g.c, s = g.seal, S = g.S, P = g.pos;
    if (s.land || g.fight) return;
    const list = [[P.octo[0], P.octo[1], 20]];
    list.push(has(S, 'valve') ? [BAY.INLET[0], BAY.INLET[1], 17] : [P.things.valve[0], P.things.valve[1] - 5, 11]);
    list.forEach(([x, y, r]) => {
      const d = dist(s.x, s.y, x, y);
      if (d > 70) return;
      const k = (g.anim * 1.2) % 1;
      c.strokeStyle = 'rgba(255,248,200,' + (0.8 * (1 - k) * clamp((70 - d) / 30, 0, 1)) + ')'; c.lineWidth = 1.4;
      c.beginPath(); c.arc(x, y, r + k * 8, 0, Math.PI * 2); c.stroke();
    });
  }
  const hiddenByCover = (S, x, y) => BAY.COVERS.some(Q => !has(S, Q.id) && inRect(x, y, Q.r));
  // 进水口：右边石壁上的粗水管口 + 阀门
  function drawInlet(g) {
    const c = g.c, [ix, iy] = BAY.INLET, tm = g.anim, open = has(g.S, 'valve');
    if (Math.abs(ix - g.cam.x - VW / 2) > VW || Math.abs(iy - g.cam.y - VH / 2) > VH) return;
    const pim = art('inlet'), vim = art('valve'), [vx, vy] = g.pos.things.valve;
    if (pim && vim) {
      if (open) { c.fillStyle = 'rgba(220,250,255,.7)'; for (let i = 0; i < 5; i++) { const t = (tm * 1.2 + i / 5) % 1; c.beginPath(); c.arc(ix - 30 + t * 28, iy + Math.sin(t * 8 + i) * 6, 1.2, 0, Math.PI * 2); c.fill(); } }
      c.drawImage(pim, open ? 200 : 0, 0, 200, 200, ix - 11, iy - 20, 40, 40);   // 管子口在图的左边，正对着 INLET
      if (!open) { c.globalAlpha = 0.35 + 0.25 * Math.sin(tm * 3); c.fillStyle = '#fff8c0'; c.beginPath(); c.arc(vx, vy - 7, 11, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
      c.drawImage(vim, open ? 96 : 0, 0, 96, 96, vx - 10, vy - 18, 20, 20);
      return;
    }
    c.fillStyle = '#5a6068'; rrect(c, ix - 8, iy - 18, 30, 36, 4); c.fill();
    c.fillStyle = '#7a8088'; rrect(c, ix - 10, iy - 20, 6, 40, 2); c.fill();
    c.fillStyle = '#05101a'; c.beginPath(); c.ellipse(ix - 2, iy, 7, 14, 0, 0, Math.PI * 2); c.fill();
    if (!open) { c.strokeStyle = '#9aa0a8'; c.lineWidth = 1.2; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(ix - 2 + k * 3.5, iy - 13); c.lineTo(ix - 2 + k * 3.5, iy + 13); c.stroke(); } }
    else { c.fillStyle = 'rgba(220,250,255,.7)'; for (let i = 0; i < 5; i++) { const t = (tm * 1.2 + i / 5) % 1; c.beginPath(); c.arc(ix - 30 + t * 28, iy + Math.sin(t * 8 + i) * 6, 1.2, 0, Math.PI * 2); c.fill(); } }
    c.strokeStyle = '#6a6a6a'; c.lineWidth = 2; c.beginPath(); c.moveTo(vx, vy + 5); c.lineTo(vx, vy - 4); c.stroke();
    c.save(); c.translate(vx, vy - 5); c.rotate(open ? 0.9 : 0);
    if (!open) { c.globalAlpha = 0.35 + 0.25 * Math.sin(tm * 3); c.fillStyle = '#fff8c0'; c.beginPath(); c.arc(0, 0, 10, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
    c.strokeStyle = '#d02a1a'; c.lineWidth = 1.8; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 1.4; for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(-6, 0); c.lineTo(6, 0); c.stroke(); c.rotate(Math.PI / 2); }
    c.restore();
  }
  // 藏在海里的东西（一闪一闪）
  function drawThing(g, k) {
    const c = g.c, T = BAY.THINGS[k], [x, y] = g.pos.things[k], tm = g.anim;
    if (T.k === 'valve') return;
    const bob = Math.sin(tm * 2 + x) * 1.5;
    c.globalAlpha = 0.3 + 0.25 * Math.sin(tm * 3 + x); c.fillStyle = '#fff8c0'; c.beginPath(); c.arc(x, y + bob, 9, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    if (T.k === 'gear') icon(c, GEAR[k], x, y + bob, 13);
    else if (T.k === 'o2') icon(c, GEAR.o2, x, y + bob, 12);
    else if (T.k === 'recipe') drawSeabed(c, 4, x, y + 2, 13);
    else if (T.k === 'pearls') for (let i = 0; i < 4; i++) { c.fillStyle = '#fff6ff'; c.beginPath(); c.arc(x - 5 + i * 3.4, y + 3 - (i % 2) * 2, 2.2, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(170,150,200,.8)'; c.lineWidth = 0.5; c.stroke(); }
  }

  function drawPlay(g) {
    const c = g.c, S = g.S, P = g.pos;
    const tv = (art('rock') ? 1 : 0) + (art('sand') ? 2 : 0) + (art('backwall') ? 4 : 0);
    if (tv !== g.tv) { g.tv = tv; g.rc.rock.clear(); g.rc.back.clear(); g.bakeAll = true; }
    const need = [];
    const sh = g.shake > 0 ? g.shake * 6 : 0;
    c.save(); c.translate(rnd(-sh, sh), rnd(-sh, sh));
    // 1 天 ／ 远景
    drawSky(g);
    drawFar(g);
    // 2 光柱、洞的后墙（往后退一点）
    c.save(); c.scale(Z, Z); c.translate(-g.cam.x, -g.cam.y); drawShafts(g); c.restore();
    { const L2 = paintChunks(g, 'back', need); c.drawImage(L2.cv, 0, 0, L2.sw, L2.sh, 0, 0, W, H); }
    // 3 沉船里面、石头
    c.save(); c.scale(Z, Z); c.translate(-g.cam.x, -g.cam.y); if (g.inBoat > 0 && !art('boatin')) drawBoatInside(g); c.restore();
    drawRockLayer(g, need);
    // 4 能游这层的东西
    c.save(); c.scale(Z, Z); c.translate(-g.cam.x, -g.cam.y);
    if (g.inBoat > 0 && art('boatin')) drawBoatInside(g);
    drawWorld(g);
    P.clams.forEach(([x, y], i) => drawClam(c, x, y, clamOpen(g, i), S.world.clams[i].pearl));
    S.world.junk.forEach(j => { if (!j.gone) drawSeabed(c, { shoe: 5, can: 6, tire: 7 }[j.k], j.x, floorAt(g, j.x) - 5, 14); });
    if (S.world.bottle) drawSeabed(c, 4, S.world.bottle.x, Math.min(S.world.bottle.y || WY, floorAt(g, S.world.bottle.x) - 4), 13);
    TREASURE.forEach(k => { if (!has(S, k) && !hiddenByCover(S, P.things[k][0], P.things[k][1])) drawThing(g, k); });
    drawMerchant(g, 'octopus', P.octo[0], P.octo[1], 26);
    drawTapRings(g);
    const vx0 = g.cam.x - 30, vx1 = g.cam.x + VW + 30, vy0 = g.cam.y - 30, vy1 = g.cam.y + VH + 30;
    if (!g.fight) g.fish.forEach(f => { if (f.x > vx0 && f.x < vx1 && f.y > vy0 && f.y < vy1 && !hiddenByCover(S, f.x, f.y)) { shadowUnder(g, f.x, f.y + 3, SPECIES[f.sp].len[f.size]); drawFish(g, f.sp, f.size, f.x, f.y, f.face, 1, f.ph); } });   // 大白鲨下水，鱼都吓跑了
    drawBoatFront(g);
    drawShore(g);
    if (g.fight) drawShark(g);
    if (!g.seal.land) shadowUnder(g, g.seal.x, g.seal.y + 6, 24);
    if (!cookingBehind(g)) drawSeal(g);   // 做饭的时候在 drawShore 里画（柜台后面）
    drawBubs(g);
    c.restore();
    // 5 海雪、前景剪影
    drawSnow(g);
    drawFronts(g);
    c.restore();
    bakeSome(g, need);
    drawDarkness(g);
    drawHUD(g);
  }


  // 越往深越暗；深坑没头灯一片黑，只有海狗身边一小圈
  // 越往深越暗；最黑的深海有头灯也只照亮身边一圈
  function drawDarkness(g) {
    const s = g.seal, S = g.S, cx = g.cam.x, cy = g.cam.y, lamp = has(S, 'lamp');
    const dk = y => (y < 280 ? 0 : y < BAY.DARK_Y ? (y - 280) / (BAY.DARK_Y - 280) * 0.5 : lamp ? 0.82 : 0.95);
    if (dk(cy + VH) <= 0.01) { drawVignette(g); return; }
    if (!g.dark) { g.dark = document.createElement('canvas'); g.dark.width = W * SC; g.dark.height = H * SC; }
    const d = g.dark.getContext('2d');
    d.setTransform(SC, 0, 0, SC, 0, 0);
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, W, H);
    const gr = d.createLinearGradient(0, 0, 0, H), stops = [];
    for (let y = 0; y <= H; y += 24) stops.push(y);
    const by = (BAY.DARK_Y - cy) * Z;
    if (by > 1 && by < H - 1) stops.push(by - 0.5, by + 0.5);
    stops.sort((a, b) => a - b).forEach(y => gr.addColorStop(clamp(y / H, 0, 1), 'rgba(2,6,24,' + dk(cy + y / Z) + ')'));
    d.fillStyle = gr;
    d.fillRect(0, Math.max(0, (WY - cy) * Z), W, H);
    d.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => { const q = d.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(0,0,0,1)'); q.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = q; d.beginPath(); d.arc(x, y, r, 0, Math.PI * 2); d.fill(); };
    const X = x => (x - cx) * Z, Y = y => (y - cy) * Z;
    if (!s.land) hole(X(s.x), Y(s.y), (lamp && s.y > 300 ? 80 : 36) * Z);
    g.pos.vents.forEach(([x, y]) => hole(X(x), Y(y - 14), 26 * Z));
    hole(X(g.pos.octo[0]), Y(g.pos.octo[1]), 34 * Z);
    g.decor.forEach(d => { if (d.k === 7 && Math.abs(d.x - cx - VW / 2) < VW && Math.abs(d.y - cy - VH / 2) < VH) hole(X(d.x), Y(d.y - 10), 12 * Z); });
    TREASURE.forEach(k => { if (has(S, k)) return; const [x, y] = g.pos.things[k]; if (!hiddenByCover(S, x, y)) hole(X(x), Y(y), 14 * Z); });
    g.c.drawImage(g.dark, 0, 0, W, H);
    drawVignette(g);
  }
  // 画面四个角稍微压暗（水下更明显）
  function drawVignette(g) {
    if (!g.vig) {
      const cv = document.createElement('canvas'); cv.width = W * SC; cv.height = H * SC;
      const x = cv.getContext('2d'), r = x.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.35, cv.width / 2, cv.height / 2, cv.height * 0.9);
      r.addColorStop(0, 'rgba(0,8,24,0)'); r.addColorStop(1, 'rgba(0,8,24,.55)'); x.fillStyle = r; x.fillRect(0, 0, cv.width, cv.height); g.vig = cv;
    }
    g.c.globalAlpha = g.seal.land ? 0.35 : 0.8; g.c.drawImage(g.vig, 0, 0, W, H); g.c.globalAlpha = 1;
  }

  // 鱼：新图 fish6（4 行 × 2 列，头冲右）；没来之前代码画
  function drawFish(g, sp, size, x, y, face, scale, ph) {
    const c = g.c, D = SPECIES[sp];
    const len = D.len[size] * (scale || 1);
    const im = art('fish6');
    c.save(); c.translate(x, y); if (face < 0) c.scale(-1, 1);
    if (im) { const fr = Math.floor((ph || 0) * 4) % 2; c.drawImage(im, fr * 144, D.row * 96, 144, 96, -len * 0.6, -len * 0.4, len * 1.2, len * 0.8); }
    else {
      const h = len * (D.squid ? 0.55 : 0.42), wig = Math.sin((ph || 0) * 9) * 0.3;
      c.fillStyle = D.col;
      if (D.squid) {
        c.beginPath(); c.ellipse(-len * 0.05, 0, len * 0.38, h * 0.5, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = D.fin; c.lineWidth = 1.2; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(len * 0.3, k * 1.6); c.quadraticCurveTo(len * 0.45, k * 2 + Math.sin((ph || 0) * 6 + k) * 2, len * 0.55, k * 2.4); c.stroke(); }
      } else {
        c.save(); c.translate(-len * 0.42, 0); c.rotate(wig); c.fillStyle = D.fin; c.beginPath(); c.moveTo(0, 0); c.lineTo(-len * 0.28, -h * 0.55); c.lineTo(-len * 0.22, 0); c.lineTo(-len * 0.28, h * 0.55); c.closePath(); c.fill(); c.restore();
        c.fillStyle = D.col; c.beginPath(); c.ellipse(0, 0, len * 0.5, h * 0.5, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(0, h * 0.15, len * 0.36, h * 0.2, 0, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = '#fff'; c.beginPath(); c.arc(len * 0.28, -h * 0.1, Math.max(1.3, len * 0.07), 0, Math.PI * 2); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(len * 0.3, -h * 0.1, Math.max(0.7, len * 0.04), 0, Math.PI * 2); c.fill();
    }
    if (size >= 3) { const cr = art('crown'); if (cr) c.drawImage(cr, -len * 0.1, -len * 0.55, len * 0.45, len * 0.34); else emoji(c, '👑', len * 0.1, -len * 0.4, len * 0.35); }
    c.restore();
  }
  function drawClam(c, x, y, open, pearl) {
    const im = art('seabed6') || art('clam');
    const cell = open ? (pearl ? 1 : 2) : 0;
    if (im) c.drawImage(im, cell * 80, 0, 80, 64, x - 12, y - 14, 24, 19);
  }
  function drawSeabed(c, i, x, y, size) {
    const im = art('seabed6');
    if (im) { c.drawImage(im, i * 80, 0, 80, 64, x - size / 2, y - size * 0.4, size, size * 0.8); return; }
    const old = art('seabed');
    const map = { 4: 3, 5: 0, 6: 1, 7: 2, 3: 4 };
    if (old && map[i] != null) c.drawImage(old, map[i] * 64, 0, 64, 64, x - size / 2, y - size / 2, size, size);
  }
  function drawMerchant(g, k, x, y, size) {
    const c = g.c, M = MERCHANTS[k];
    const im = art('merchants');
    if (im) { c.drawImage(im, M.cell * 200, 0, 200, 160, x - size, y - size * 0.8, size * 2, size * 1.6); return; }
    const old = art('helpers2');
    if (old) c.drawImage(old, M.cell * 96, 0, 96, 96, x - size / 2, y - size / 2, size, size); else emoji(c, M.e, x, y, size * 0.7);
  }
  // 岸上从后往前画：帐篷、水族箱 →（做饭的海狗）→ 灶和锅 → 摊子（柜台挡住灶、锅底和海狗下半身）→ 锣、商人 → 大胃王、游客 → 水盆、垃圾桶（最靠前）
  // 每张图里东西底下留的空白不一样，按量出来的实际底边对齐到栈道面（GY + 1.5），别飘起来
  const FOOT = GY + 1.5;
  function cookingBehind(g) { const s = g.seal, se = g.session; return !!(s && s.land && se && ['gather', 'recipe', 'prep', 'heat'].indexOf(se.phase) >= 0); }
  function drawShore(g) {
    const c = g.c, S = g.S, tm = g.anim;
    const C = caps(S);
    const tent = art('tent');
    if (tent) c.drawImage(tent, SPOT.tent - 22, FOOT - 104 * 33 / 120, 44, 33); else emoji(c, '⛺', SPOT.tent, GY - 12, 24);
    if (C.tank) {
      const tk = art('tanks'), sz = lvOf(S, 'tank') - 1, h = 22 + sz * 3, w = 32 + sz * 6, top = tk ? FOOT - [106, 111, 117, 101][sz] * h / 140 : GY - 18 - sz * 2;
      if (tk) c.drawImage(tk, sz * 200, 0, 200, 140, SPOT.tank - w / 2, top, w, h);
      else { c.fillStyle = 'rgba(160,220,255,.6)'; c.fillRect(SPOT.tank - 14 - sz * 2, GY - 18 - sz * 2, 28 + sz * 4, 18 + sz * 2); c.strokeStyle = '#5a3a1a'; c.lineWidth = 1.5; c.strokeRect(SPOT.tank - 14 - sz * 2, GY - 18 - sz * 2, 28 + sz * 4, 18 + sz * 2); }
      S.tank.fish.slice(0, 4).forEach((f, i) => drawFish(g, f.sp, Math.min(1, f.size), SPOT.tank - 8 + i * 5, top + h * 0.5 + Math.sin(tm * 2 + i) * 2, i % 2 ? 1 : -1, 0.45, tm + i));
    }
    if (cookingBehind(g)) drawSeal(g);
    drawPot(g);
    const st = art('stall');
    if (st) c.drawImage(st, SPOT.pot - 30, FOOT - 35, 60, 35);
    else { c.fillStyle = '#c8402a'; c.fillRect(SPOT.pot - 28, GY - 40, 64, 6); c.fillStyle = '#e8d8b0'; c.fillRect(SPOT.pot - 26, GY - 34, 2, 34); c.fillRect(SPOT.pot + 32, GY - 34, 2, 34); c.fillStyle = '#9a6a3a'; c.fillRect(SPOT.pot - 24, GY - 9, 50, 9); }
    drawWarm(g);
    drawTub(g);
    const gg = art('gong');
    if (gg) c.drawImage(gg, SPOT.gong - 8, FOOT - 17.6, 16, 20);
    else { c.strokeStyle = '#6a4a2a'; c.lineWidth = 1.5; c.strokeRect(SPOT.gong - 7, GY - 20, 14, 20); c.fillStyle = '#e0a020'; c.beginPath(); c.arc(SPOT.gong, GY - 12, 5.5, 0, Math.PI * 2); c.fill(); }
    const rot = SHORE_ROT[(S.day - 1) % 3];
    drawMerchant(g, rot[0], SPOT.mA, GY - 14, 22);
    drawMerchant(g, rot[1], SPOT.mB, GY - 14, 22);
    if (g.boss && !g.fight) drawJudge(g);
    g.tourists.forEach(o => drawTourist(g, o));
    if (art('bin')) c.drawImage(art('bin'), SPOT.bin - 6.5, FOOT - 16.25, 13, 16.25);
    else { const bx = SPOT.bin; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(bx, GY, 6, 1.4, 0, 0, Math.PI * 2); c.fill(); const bg = c.createLinearGradient(bx - 4, 0, bx + 4, 0); bg.addColorStop(0, '#5a8a5a'); bg.addColorStop(0.4, '#3f7044'); bg.addColorStop(1, '#2a4e30'); c.fillStyle = bg; c.beginPath(); c.moveTo(bx - 4, GY - 9); c.lineTo(bx + 4, GY - 9); c.lineTo(bx + 3.4, GY); c.lineTo(bx - 3.4, GY); c.closePath(); c.fill(); c.fillStyle = '#2e5634'; rrect(c, bx - 4.8, GY - 10.6, 9.6, 2.2, 1); c.fill(); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 0.4; for (let k = -2; k <= 2; k += 2) { c.beginPath(); c.moveTo(bx + k, GY - 8); c.lineTo(bx + k * 0.85, GY - 1); c.stroke(); } }
    if (S.license) txt(c, SPOT.gate, GY - 26, L.fix, 6, '#fff', 'center', true, '#5a1a00');
  }

  function potStage(g) { const se = g.session; return !se ? 0 : se.phase === 'prep' ? 1 + Math.min(3, Math.floor(se.t / 0.8)) : se.phase === 'heat' ? (se.p >= 1 ? 6 : zoneName(se.p) === 'best' ? 5 : 4) : se.phase === 'bid' ? 4 : 0; }
  // 岸上的锅：侧面，灶大半在柜台后面；热气、泡、最佳的金光、糊了的黑烟（Codex 的 potside 到了换图）
  function drawPot(g) {
    const c = g.c, se = g.session, tm = g.anim, x = SPOT.pot + 7, y = FOOT, st = potStage(g);   // 锅在柜台后面靠右，左边留给掌勺的海狗
    const side = art('potside'), burning = st > 0 || (se && se.phase === 'bid');
    if (side) { c.drawImage(side, [0, 1, 1, 1, 2, 3, 4][st] * 160, 0, 160, 140, x - 14, y - 25, 28, 25); return; }   // 图里自带热气、黑烟
    else {
      c.fillStyle = '#8a4430'; rrect(c, x - 8, y - 12, 16, 12, 1.5); c.fill();
      c.strokeStyle = 'rgba(40,10,0,.35)'; c.lineWidth = 0.5; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x - 8, y - 12 + k * 3); c.lineTo(x + 8, y - 12 + k * 3); c.stroke(); }
      if (burning) { c.fillStyle = 'rgba(255,150,40,' + (0.55 + 0.3 * Math.sin(tm * 12)) + ')'; c.beginPath(); c.ellipse(x, y - 4, 4, 2 + Math.sin(tm * 9) * 0.5, 0, 0, Math.PI * 2); c.fill(); }
      const gr = c.createLinearGradient(0, y - 16, 0, y - 8); gr.addColorStop(0, '#55504a'); gr.addColorStop(1, '#1c1816');
      c.fillStyle = gr; c.beginPath(); c.moveTo(x - 13, y - 16); c.quadraticCurveTo(x - 11.5, y - 8.5, x, y - 9); c.quadraticCurveTo(x + 11.5, y - 8.5, x + 13, y - 16); c.closePath(); c.fill();
      c.strokeStyle = '#78706a'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x - 13.5, y - 16); c.lineTo(x + 13.5, y - 16); c.stroke();
      c.strokeStyle = '#2a2420'; c.lineWidth = 1.2; c.beginPath(); c.arc(x - 15, y - 15, 1.8, Math.PI * 0.5, Math.PI * 1.5); c.stroke(); c.beginPath(); c.arc(x + 15, y - 15, 1.8, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - 10, y - 14.5); c.quadraticCurveTo(x - 8, y - 10.5, x - 3, y - 10); c.stroke();
    }
    if (st === 5) { const r = c.createRadialGradient(x, y - 18, 0, x, y - 18, 15); r.addColorStop(0, 'rgba(255,230,120,' + (0.45 + 0.2 * Math.sin(tm * 6)) + ')'); r.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = r; c.beginPath(); c.arc(x, y - 18, 15, 0, Math.PI * 2); c.fill(); }
    if (st >= 1 || (se && se.phase === 'bid')) {
      const n = st >= 4 || (se && se.phase === 'bid') ? 5 : 2;
      c.strokeStyle = st === 6 ? 'rgba(40,30,30,.6)' : 'rgba(255,255,255,.55)'; c.lineWidth = st === 6 ? 2.2 : 1.1; c.lineCap = 'round';
      for (let i = 0; i < n; i++) { const t = (tm * 0.6 + i / n) % 1, bx = x - 8 + i * 4; c.globalAlpha = (1 - t) * (st === 6 ? 0.9 : 0.7); c.beginPath(); c.moveTo(bx, y - 17 - t * 4); c.quadraticCurveTo(bx + Math.sin(tm * 2 + i) * 3, y - 21 - t * 10, bx + Math.sin(tm * 1.5 + i) * 2, y - 25 - t * 16); c.stroke(); }
      c.globalAlpha = 1;
    }
    if (st === 4 || st === 5) { c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 3; i++) { const t = (tm * 1.7 + i * 0.37) % 1; c.beginPath(); c.arc(x - 7 + i * 7, y - 16.5 - t * 3, 0.6 + t * 0.6, 0, Math.PI * 2); c.fill(); } }
  }
  // 摊子左边装鱼的木盆：侧面，几条鱼尾巴翘出来（Codex 的 tub 到了换图）
  function drawTub(g) {
    const c = g.c, S = g.S, tm = g.anim, x = SPOT.basin, y = FOOT, n = S.basin.length, im = art('tub');
    const h = 11, w0 = 9, w1 = 7.2;
    if (im) c.drawImage(im, (n === 0 ? 0 : n < 5 ? 1 : 2) * 120, 0, 120, 100, x - 10.8, y - 18, 21.6, 18);
    else {
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y, 10, 1.6, 0, 0, Math.PI * 2); c.fill();
      S.basin.slice(0, 5).forEach((f, i) => {   // 鱼尾巴先画，盆沿压在上面
        const fx = x - 6 + i * 3, sw = Math.sin(tm * 5 + i * 1.7) * 0.25, D = SPECIES[f.sp];
        c.save(); c.translate(fx, y - h + 1.5); c.rotate(-0.3 + i * 0.15 + sw);
        c.strokeStyle = 'rgba(40,20,5,.7)'; c.lineWidth = 0.5; c.lineJoin = 'round';
        c.fillStyle = D.col; c.beginPath(); c.moveTo(-1.6, 0); c.lineTo(-1.1, -5); c.lineTo(1.1, -5); c.lineTo(1.6, 0); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = D.fin; c.beginPath(); c.moveTo(0, -4.4); c.lineTo(-3.4, -9); c.lineTo(0, -7.2); c.lineTo(3.4, -9); c.closePath(); c.fill(); c.stroke();
        c.restore();
      });
      const gr = c.createLinearGradient(x - w0, 0, x + w0, 0); gr.addColorStop(0, '#b07a42'); gr.addColorStop(0.45, '#8c5c2e'); gr.addColorStop(1, '#5c381a');
      c.fillStyle = gr; c.beginPath(); c.moveTo(x - w0, y - h); c.lineTo(x + w0, y - h); c.lineTo(x + w1, y); c.lineTo(x - w1, y); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(50,25,8,.45)'; c.lineWidth = 0.5;
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * 3.4, y - h); c.lineTo(x + k * 2.75, y); c.stroke(); }
      c.strokeStyle = '#5c5a56'; c.lineWidth = 1;
      [[2.6, w0 - (w0 - w1) * 0.24], [h - 2.4, w0 - (w0 - w1) * 0.78]].forEach(([d, w]) => { c.beginPath(); c.moveTo(x - w, y - h + d); c.lineTo(x + w, y - h + d); c.stroke(); });
      c.fillStyle = '#c4905a'; c.beginPath(); c.ellipse(x, y - h, w0, 1.7, 0, 0, Math.PI * 2); c.fill();
      if (n) { c.fillStyle = 'rgba(120,200,230,.85)'; c.beginPath(); c.ellipse(x, y - h + 0.2, w0 - 1.3, 1.1, 0, 0, Math.PI * 2); c.fill(); }
    }
    if (n) txt(c, x, y - h - 10, String(n), 6.5, '#fff', 'center', true, '#3a1a00');
  }
  // 卖的时候锅保温：摊子顶上一根保温条
  function drawWarm(g) {
    const c = g.c, se = g.session, x = SPOT.pot, y = GY;
    if (!(se && se.phase === 'bid' && !g.tourists.some(o => o.bid))) return;
    const k = 1 - se.warm / caps(g.S).warm;
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x - 16, y - 41, 32, 3);
    c.fillStyle = '#ff9a3a'; c.fillRect(x - 16, y - 41, 32 * clamp(k, 0, 1), 3);
    txt(c, x, y - 47, L.warm, 6, '#fff', 'center', true, '#3a1a00');
  }
  // 锅里的样子：做菜的时候在画面中间（下面水那块）弹一个大特写，像放幻灯片一样一格一格换；火候条也在这儿，点它开锅
  const PCL = { x: 96, y: 124, w: 128, h: 108 };
  function drawPotClose(g) {
    const c = g.c, se = g.session;
    if (!se || (se.phase !== 'prep' && se.phase !== 'heat')) { g.pcl = null; return; }
    const st = potStage(g);
    if (!g.pcl) g.pcl = { st, prev: null, at: g.anim, open: g.anim };
    else if (g.pcl.st !== st) { g.pcl.prev = g.pcl.st; g.pcl.st = st; g.pcl.at = g.anim; }
    const k = clamp((g.anim - g.pcl.at) / 0.3, 0, 1), pop = clamp((g.anim - g.pcl.open) / 0.25, 0, 1), tm = g.anim;
    const { x, y, w, h } = PCL, cx = x + w / 2, cy = y + h / 2;
    c.save();
    c.globalAlpha = pop; c.translate(cx, cy); c.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop); c.translate(-cx, -cy);
    box(c, x, y, w, h);
    const iw = 104, ih = 70, ix = cx - iw / 2, iy = y + 16;
    const close = art('potclose'), p6 = art('pot6'), row = se.recipe ? Math.max(0, ['clear', 'spicy', 'sour'].indexOf(se.recipe)) : 0;
    const frame = (s2, a, z) => {
      if (a <= 0.01 || s2 == null) return;
      c.globalAlpha = pop * a;
      c.save(); c.translate(cx, iy + ih / 2); c.scale(z, z); c.translate(-cx, -(iy + ih / 2));
      if (close) c.drawImage(close, s2 * 400, (s2 === 0 ? 0 : row) * 300, 400, 300, cx - ih * 2 / 3, iy, ih * 4 / 3, ih);
      else if (p6) c.drawImage(p6, s2 * 160, 0, 160, 140, cx - ih * 0.57, iy, ih * 1.14, ih);
      c.restore();
    };
    c.save(); rrect(c, ix, iy, iw, ih, 8); c.clip();
    c.fillStyle = '#2a1a10'; c.fillRect(ix, iy, iw, ih);
    frame(g.pcl.prev, 1 - k, 1);
    frame(st, k, 1.06 - 0.06 * k);
    c.globalAlpha = pop;
    if (st >= 4) { c.strokeStyle = st === 6 ? 'rgba(40,30,30,.55)' : 'rgba(255,255,255,.4)'; c.lineWidth = 2.4; c.lineCap = 'round'; for (let i = 0; i < 5; i++) { const t = (tm * 0.5 + i / 5) % 1, bx = ix + 14 + i * 19; c.globalAlpha = pop * (1 - t) * 0.8; c.beginPath(); c.moveTo(bx, iy + ih - 10 - t * 20); c.quadraticCurveTo(bx + Math.sin(tm * 2 + i) * 6, iy + ih - 24 - t * 30, bx + Math.sin(tm + i) * 4, iy + ih - 34 - t * 40); c.stroke(); } }
    c.restore();
    c.globalAlpha = pop;
    c.strokeStyle = 'rgba(90,50,10,.6)'; c.lineWidth = 1.2; rrect(c, ix, iy, iw, ih, 8); c.stroke();
    if (se.phase === 'prep') txt(c, cx, y + 9, L.steps[Math.min(3, Math.floor(se.t / 0.8))], 7.5, '#4a2000', 'center', true);
    else {
      txt(c, cx, y + 9, st === 6 ? L.burnt : L.openPot, 7.5, st === 6 ? '#a01a0a' : '#4a2000', 'center', true);
      const bx = x + 12, by = y + h - 15, bw = w - 24;
      const gr = c.createLinearGradient(bx, 0, bx + bw, 0);
      gr.addColorStop(0, '#e03020'); gr.addColorStop(G0 - 0.05, '#e0a020'); gr.addColorStop(G0, '#40c040'); gr.addColorStop(BEST, '#b0ff60'); gr.addColorStop(G1, '#40c040'); gr.addColorStop(0.92, '#e0a020'); gr.addColorStop(1, '#3a2010');
      c.fillStyle = 'rgba(0,0,0,.45)'; rrect(c, bx - 1, by - 1, bw + 2, 8, 3); c.fill();
      c.fillStyle = gr; rrect(c, bx, by, bw, 6, 3); c.fill();
      c.strokeStyle = '#fff6a0'; c.lineWidth = 0.9; c.strokeRect(bx + bw * (BEST - BEST_W), by - 0.8, bw * BEST_W * 2, 7.6);
      const px = bx + bw * clamp(se.p, 0, 1);
      c.fillStyle = '#2a1000'; c.beginPath(); c.moveTo(px, by); c.lineTo(px - 3, by - 4.5); c.lineTo(px + 3, by - 4.5); c.closePath(); c.fill();
    }
    c.restore();
    g.btns.push({ x, y, w, h, fn: () => { if (g.session && g.session.phase === 'heat') openPot(g); } });
  }

  const TFOOT = [[90, 90, 83, 90, 90, 90], [90, 90, 78, 90, 90, 90], [90, 90, 78, 90, 90, 90], [90, 90, 79, 90, 90, 90]];   // tourists6 每格脚底在第几行（量出来的）
  function drawTourist(g, o) {
    const c = g.c, T = TOURISTS[o.k], tm = g.anim;
    const y = GY;
    const face = o.ph === 'out' ? (o.x < SPOT.pot ? -1 : 1) : o.ph === 'in' ? (o.slot > o.x ? 1 : -1) : (o.x < SPOT.pot ? 1 : -1);
    const im6 = art('tourists6');
    const col = o.ph === 'in' || o.ph === 'out' ? Math.floor(tm * 6) % 2 : o.ph === 'eat' ? 5 : o.bid ? 4 : 2;
    if (im6) { c.save(); c.translate(o.x, FOOT + 12 - TFOOT[T.row][col] * 0.25); if (face < 0) c.scale(-1, 1); c.drawImage(im6, col * 96, T.row * 96, 96, 96, -12, -12, 24, 24); c.restore(); }
    else {
      const old = art('tourists');
      const oc = o.ph === 'eat' ? 2 : (o.ph === 'in' || o.ph === 'out') ? Math.floor(tm * 6) % 2 : 0;
      c.save(); c.translate(o.x, y - 10 - (o.bump > 0 ? 2 : 0)); if (face < 0) c.scale(-1, 1);
      if (old) c.drawImage(old, oc * 80, T.row * 80, 80, 80, -11, -11, 22, 22); else emoji(c, T.e, 0, 0, 14);
      c.restore();
    }
    // 说的话
    // 说话的泡泡跟字一样宽，别挡旁边的价钱
    if (o.say && o.sayT >= 0 && o.sayT < 2.4) { c.globalAlpha = clamp(2.4 - o.sayT, 0, 1); const sim = art('say'); if (sim) { c.font = 'bold 5.5px ' + FONT; const sw = Math.max(26, c.measureText(o.say).width + 12); c.drawImage(sim, o.x - sw / 2, y - 42, sw, 13); txt(c, o.x, y - 36.4, o.say, 5.5, '#3a2008', 'center', true); } else { rrect(c, o.x - 24, y - 40, 48, 11, 3); c.fillStyle = 'rgba(255,255,255,.92)'; c.fill(); txt(c, o.x, y - 34.5, o.say, 5.5, '#3a2008', 'center', true); } c.globalAlpha = 1; }
    // 报价泡泡（点它卖）
    if (o.bid) {
      const w = 30, by = y - 44 - (SLOTS.indexOf(o.slot) % 2) * 14;   // 隔一个高一层，泡泡不叠
      const bbim = art('bubble');
      if (bbim) { const sz = o.bump > 0 ? 1.12 : 1; c.drawImage(bbim, o.bid.like ? 120 : 0, 0, 120, 48, o.x - w * sz / 2, by - (sz - 1) * 6, w * sz, 12 * sz); txt(c, o.x, by + 5, L.bid(o.bid.k, o.bid.p), 6, '#5a2a00', 'center', true); }
      else {
        rrect(c, o.x - w / 2, by, w, 12, 4);
        c.fillStyle = o.bid.like ? '#fff4b0' : '#ffffff'; c.fill(); c.strokeStyle = o.bump > 0 ? '#ff6a00' : '#c08000'; c.lineWidth = o.bump > 0 ? 1.6 : 1; c.stroke();
        txt(c, o.x, by + 6, L.bid(o.bid.k, o.bid.p), 6, '#7a3a00', 'center', true);
      }
      g.btns.push({ x: (o.x - w / 2 - g.cam.x) * Z, y: (by - g.cam.y) * Z, w: w * Z, h: 12 * Z, fn: () => sell(g, o) });
    }
  }
  function drawJudge(g) {
    const c = g.c, B = g.boss, D = BOSSES[B.i];
    const x = SPOT.pot + 40, y = GY;
    const im = D.who === 'shark' ? art('shark') : art('judges');
    if (im) {
      if (D.who === 'shark') { const f = B.phase === 'eye' ? 2 : B.eat > 0 ? 1 : 0; c.drawImage(im, f * 160, 0, 160, 160, x - 18, FOOT - [156, 153, 150][f] * 0.225, 36, 36); }
      else { const f = B.eat > 0 ? 2 : B.mad > 0 ? 3 : 0, r = D.who === 'bear' ? 1 : 0; c.drawImage(im, f * 160, r * 160, 160, 160, x - 18, FOOT - [[151, 145, 148, 148], [154, 158, 158, 158]][r][f] * 0.225, 36, 36); }
    } else emoji(c, TOURISTS[D.who].e, x, y - 14, 26, true);
    if (B.say > 0 && B.line) { const sim = art('say'); if (sim) { c.drawImage(sim, x - 38, y - 50, 76, 16); txt(c, x, y - 43.4, B.line, 6.5, '#7a1a0a', 'center', true); } else { rrect(c, x - 36, y - 48, 72, 13, 4); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill(); txt(c, x, y - 41.5, B.line, 6.5, '#7a1a0a', 'center', true); } }
  }
  const SEAL_FOOT = [64, 70, 67, 69, 88, 73, 75, 88, 87, 71];   // seal.webp 每格海狗最下面在第几行（量出来的）
  function drawSeal(g) {
    const c = g.c, s = g.seal, tm = g.anim, S = g.S;
    const im = art('seal');
    if (s.hurt > 0 && Math.floor(tm * 12) % 2) return;
    let fr;
    if (s.land) fr = g.session && ['prep', 'heat'].indexOf(g.session.phase) >= 0 ? 8 : s.moving ? 5 + Math.floor(tm * 6) % 2 : 7;
    else fr = s.bump > 0 || s.hurt > 0 ? 4 : s.dashT > 0 ? 2 : g.fight ? 9 : S.basket.length ? 3 : Math.floor(tm * 5) % 2;
    const y = s.land ? (im ? FOOT + 10.5 - SEAL_FOOT[fr] * 21 / 90 : GY - 8) : s.y;   // 每一格海狗脚底在图里的位置不一样，对齐到栈道面
    c.save(); c.translate(s.x, y); if (s.face < 0) c.scale(-1, 1);
    if (im) c.drawImage(im, fr * 120, 0, 120, 90, -14, -10.5, 28, 21);
    else { if (!s.land) c.rotate(clamp(s.vy / 140, -0.6, 0.6)); emoji(c, '🦭', 0, 0, 16, true); }
    c.restore();
    if (!s.land && S.basket.length) {
      const f = S.basket[0];
      if (f.sp) drawFish(g, f.sp, f.size, s.x + s.face * 11, s.y + 2, s.face, 0.55, tm);
      else drawSeabed(c, { shoe: 5, can: 6, tire: 7 }[f.junk], s.x + s.face * 11, s.y + 2, 8);
    }
  }
  function drawShark(g) {
    const c = g.c, K = g.fight.shark, tm = g.anim;
    const im = art('shark');
    if (K.st === 'tired') { c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(K.x + Math.cos(K.a) * 30 + Math.sin(tm * 3 + i) * 3, K.y - 8 - ((tm * 18 + i * 7) % 20), 1.6, 0, Math.PI * 2); c.fill(); } }
    c.save(); c.translate(K.x, K.y); c.rotate(K.a);
    if (Math.cos(K.a) < 0) c.scale(1, -1);
    c.scale(0.875, 0.875);   // 打架的地方就一屏大，鲨鱼小一号
    if (im) { const fr = K.hp <= 0 ? 4 : K.hurt > 0 ? 3 : K.tel > 0 || K.lunge > 0 ? 2 : Math.floor(tm * 4) % 2; c.drawImage(im, fr * 320, 160, 320, 160, -36, -18, 72, 36); }
    else {
      c.fillStyle = K.hurt > 0 ? '#ff9a9a' : '#7890a8';
      c.beginPath(); c.ellipse(0, 0, 32, 11, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(-28, 0); c.lineTo(-44, -12 + Math.sin(tm * 10) * 3); c.lineTo(-40, 0); c.lineTo(-44, 12 + Math.sin(tm * 10) * 3); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-4, -10); c.lineTo(4, -22); c.lineTo(10, -9); c.closePath(); c.fill();
      c.fillStyle = '#f0f4f8'; c.beginPath(); c.ellipse(4, 4, 22, 5, 0, 0, Math.PI); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(20, -3, 1.8, 0, Math.PI * 2); c.fill();
      if (K.tel > 0 || K.lunge > 0) { c.fillStyle = '#7a1010'; c.beginPath(); c.moveTo(32, 0); c.lineTo(22, -4); c.lineTo(22, 6); c.closePath(); c.fill(); }
      c.strokeStyle = 'rgba(255,240,120,' + (0.5 + 0.4 * Math.sin(tm * 8)) + ')'; c.lineWidth = 1.5; c.beginPath(); c.arc(-30, 0, 9, 0, Math.PI * 2); c.stroke();   // 尾巴上一个亮圈：咬这儿
    }
    c.restore();
  }
  function drawHUD(g) {
    const c = g.c, S = g.S, s = g.seal, C = caps(S);
    const him = art('hud');
    if (him) { c.drawImage(him, 2, 2, 96, 32); txt(c, 22, 12, fmt(S.money), 9, '#fff2c0', 'left', true, '#3a1600'); txt(c, 92, 12, L.day(S.day), 6.5, '#fff2d0', 'right', true, '#3a1600'); }
    else { rrect(c, 4, 4, 92, 30, 5); c.fillStyle = 'rgba(30,14,4,.72)'; c.fill(); txt(c, 9, 12, '¥ ' + fmt(S.money), 9, '#ffe24a', 'left', true); txt(c, 90, 12, L.day(S.day), 7, '#fff2d0', 'right', true); }
    for (let i = 0; i < C.basket; i++) {
      const x = 12 + i * 12, y = 26;
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 0.8; c.strokeRect(x - 5, y - 4, 10, 8);
      const f = S.basket[i];
      if (f && f.sp) drawFish(g, f.sp, f.size, x, y, 1, 0.42, 0);
      else if (f) drawSeabed(c, { shoe: 5, can: 6, tire: 7 }[f.junk], x, y, 8);
    }
    if (S.pearls) txt(c, 12 + C.basket * 12, 26, '⚪' + S.pearls, 6, '#fff', 'left', true);
    if ((!s.land || s.air < C.air - 0.05) && !g.fight) {   // 岸上回气的时候也看得见气条在涨
      const k = s.air / C.air;
      const aim = art('airbar'), kk = clamp(k, 0, 1);
      if (aim) {
        c.drawImage(aim, 0, 0, 260, 28, 108, 4, 104, 11.2);
        if (kk > 0) c.drawImage(aim, 0, 28, 260 * kk, 28, 108, 4, 104 * kk, 11.2);
        if (k < 0.25 && Math.floor(g.anim * 4) % 2 === 0) { c.globalAlpha = 0.45; rrect(c, 110, 6, 100, 7, 3); c.fillStyle = '#ff4020'; c.fill(); c.globalAlpha = 1; }
      } else {
        rrect(c, 110, 6, 100, 8, 4); c.fillStyle = 'rgba(0,0,0,.45)'; c.fill();
        rrect(c, 111, 7, Math.max(2, 98 * kk), 6, 3); c.fillStyle = k < 0.25 ? '#ff5030' : '#7ad8ff'; c.fill();
      }
      txt(c, 160, 10.5, L.air, 5.5, '#fff', 'center', true, '#002a40');
    }
    if (g.boss && g.boss.phase === 'order') {
      const B = g.boss, D = BOSSES[B.i], dish = D.dishes[B.dish];
      const oim = art('order');
      if (oim) c.drawImage(oim, 104, 18, 140, 26.4); else { rrect(c, 104, 18, 140, 26, 5); c.fillStyle = 'rgba(255,248,225,.95)'; c.fill(); c.strokeStyle = '#c0281a'; c.lineWidth = 1.2; c.stroke(); }
      txt(c, 110, 25, L.order(D.n, B.dish + 1, D.dishes.length), 6.5, '#a01a0a', 'left', true);
      const sec = Math.max(0, Math.ceil(B.left));
      txt(c, 238, 25, Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'), 7.5, sec < 30 ? '#e02010' : '#3a2008', 'right', true);
      txt(c, 110, 36, orderText(dish), 6.5, '#3a2008', 'left', true);
    }
    if (g.boss && g.boss.phase === 'alarm' && Math.floor(g.anim * 4) % 2 === 0) { c.fillStyle = 'rgba(120,0,0,.25)'; c.fillRect(0, 0, W, H); txt(c, W / 2, 110, L.alarm, 15, '#ff3a2a', 'center', true, '#fff'); }
    if (g.fight) {
      const F = g.fight;
      const fim = art('fighticons');
      for (let i = 0; i < C.hp; i++) { if (fim) c.drawImage(fim, i < F.hp ? 0 : 48, 0, 48, 48, 105 + i * 10, 5, 10, 10); else txt(c, 110 + i * 10, 10, '❤', 8, i < F.hp ? '#ff4060' : 'rgba(255,255,255,.3)', 'center', true); }
      for (let i = 0; i < 3; i++) { if (fim) c.drawImage(fim, i < F.shark.hp ? 96 : 144, 0, 48, 48, 263 - i * 11, 5, 10, 10); else { c.globalAlpha = i < F.shark.hp ? 1 : 0.3; emoji(c, '🦈', 268 - i * 11, 10, 8); c.globalAlpha = 1; } }
    }
    drawPotClose(g);
    const se = g.session;
    if (se && se.phase === 'bid' && g.tourists.some(o => o.bid)) {
      const px = (SPOT.pot - g.cam.x) * Z, py = (GY - g.cam.y) * Z + 8;
      button(g, px - 20, py, 40, 12, L.sellAll, () => { g.tourists.filter(o => o.bid).forEach(o => sell(g, o)); }, { size: 6.5 });
    }
    button(g, W - 40, 4, 36, 13, '菜单', () => { g.panel = { kind: 'menu' }; g.hold = false; }, { size: 7 });
  }

  /* ---------- 盖在上面的 ---------- */
  function box(c, x, y, w, h) { const pim = art('panel'); if (pim) { nine(c, pim, 0, 0, 192, 192, 48, x - 3, y - 3, w + 6, h + 6, 14); return; } rrect(c, x, y, w, h, 8); c.fillStyle = 'rgba(255,248,225,.97)'; c.fill(); c.strokeStyle = '#a8701a'; c.lineWidth = 1.5; c.stroke(); }
  function drawPanel(g) {
    const c = g.c, P = g.panel, S = g.S;
    g.btns = [];
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, H);
    if (P.kind === 'ask') {
      box(c, 60, 66, 200, 100);
      wrap(c, P.text, 160, 88, 180, 13, 9, '#4a2000', 'center', true);
      button(g, 76, 138, 80, 20, P.yes, () => { g.panel = null; P.fn(); }, { red: true });
      button(g, 164, 138, 80, 20, L.no, () => { g.panel = null; });
    } else if (P.kind === 'note') {
      box(c, 56, 60, 208, 112);
      wrap(c, P.text, 160, 84, 188, 13, 9, '#4a2000', 'center', true);
      button(g, 120, 144, 80, 20, L.yes, () => { g.panel = null; if (P.after) P.after(); });
    } else if (P.kind === 'recipe') {
      const list = Object.keys(RECIPES).filter(r => S.recipes.indexOf(r) >= 0);
      box(c, 50, 54, 220, 40 + list.length * 30);
      txt(c, 160, 70, L.pickRecipe, 11, '#8a1a14', 'center', true);
      list.forEach((r, i) => {
        const R = RECIPES[r], y = 84 + i * 30;
        const ic = { clear: 0, spicy: 1, sour: 2 }[r];
        icon(c, { ic, e: ['🥣', '🌶', '🥬'][ic] }, 76, y + 12, 22);
        txt(c, 92, y + 7, R.n, 9, '#3a2008', 'left', true);
        txt(c, 92, y + 18, '口味：' + R.fl, 7, '#7a5a3a', 'left', false);
        button(g, 200, y + 4, 56, 18, '就它', () => pickRecipe(g, r), { size: 8 });
      });
    } else if (P.kind === 'shop') {
      const M = MERCHANTS[P.mk];
      box(c, 26, 22, 268, 196);
      txt(c, 160, 36, L.shop(M.n), 11, '#8a1a14', 'center', true);
      txt(c, 286, 36, '¥ ' + fmt(S.money), 8, '#1a6a1a', 'right', true);
      M.items.forEach((id, i) => {
        const it = ITEMS[id], y = 50 + i * 34, lv = lvOf(S, id);
        const done = lv >= it.cost.length;
        icon(c, it, 48, y + 14, 22);
        const name = it.names ? it.names[Math.min(lv, it.names.length - 1)] : it.n + (it.cost.length > 1 ? ' ' + Math.min(lv + 1, it.cost.length) + '/' + it.cost.length : '');
        txt(c, 64, y + 8, name, 8.5, '#3a2008', 'left', true);
        wrap(c, it.d, 64, y + 20, 150, 9, 6.5, '#7a5a3a', 'left', false);
        if (done) txt(c, 250, y + 14, it.cost.length > 1 ? L.maxed : L.owned, 8, '#888', 'center', true);
        else { const p = it.cost[lv]; button(g, 222, y + 5, 58, 18, L.buy(p), () => buyItem(g, id), { size: 7.5, off: S.money < p }); }
      });
      button(g, 120, 194, 80, 18, L.back, () => { g.panel = null; });
    } else if (P.kind === 'menu') {
      box(c, 90, 46, 140, 140);
      txt(c, 160, 62, '菜单', 11, '#5a2a00', 'center', true);
      button(g, 110, 74, 100, 20, L.menu[0], () => { g.panel = null; });
      button(g, 110, 98, 100, 20, L.menu[4], () => { g.panel = { kind: 'map' }; g.mapImg = null; });
      button(g, 110, 122, 100, 20, g.mute ? L.menu[2] : L.menu[1], () => { g.mute = !g.mute; OS.save.set(MUTE_KEY, g.mute); });
      button(g, 110, 146, 100, 20, L.menu[3], () => { save(g); g.panel = null; g.screen = 'title'; g.savedAt = null; g.session = null; g.boss = null; g.fight = null; });
    } else if (P.kind === 'map') {
      drawMap(g);
    } else if (P.kind === 'eaten') {
      box(c, 60, 66, 200, 100);
      wrap(c, L.eaten, 160, 92, 180, 13, 11, '#a01a0a', 'center', true);
      button(g, 72, 136, 84, 20, L.retry, () => fightRetry(g), { red: true });
      button(g, 164, 136, 84, 20, L.later, () => fightLater(g));
    }
  }

  // 地图：去过的地方才显示；找到的宝贝打勾
  function makeMapImg(g) {
    const cv = document.createElement('canvas'), w = 256, h = 240;
    cv.width = w; cv.height = h;
    const d = cv.getContext('2d'), im = d.createImageData(w, h), D = im.data;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const x = px * WW / w, y = py * WH / h, i = (py * w + px) * 4;
      let col;
      if (!g.seen[Math.min(29, Math.floor(y / 40)) * 32 + Math.min(31, Math.floor(x / 40))]) col = [226, 212, 178];
      else if (y < GY) col = [200, 232, 250];
      else if (y < WY) col = [176, 132, 82];
      else if (fieldAt(g, x, y) > 0) col = [124, 104, 84];
      else { const t = Math.min(1, (y - WY) / 1100); col = [90 - 72 * t, 182 - 136 * t, 232 - 130 * t]; }
      D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255;
    }
    d.putImageData(im, 0, 0);
    return cv;
  }
  function drawMap(g) {
    const c = g.c, S = g.S, tm = g.anim;
    box(c, 10, 8, 300, 224);
    const k = 0.16, mx = 18, my = 26;
    txt(c, mx, 18, L.mapT, 10, '#5a2a00', 'left', true);
    const got = TREASURE.filter(t => has(S, t)).length;
    txt(c, mx + WW * k, 18, L.mapN(got, TREASURE.length), 8, '#1a6a1a', 'right', true);
    if (!g.mapImg) g.mapImg = makeMapImg(g);
    c.drawImage(g.mapImg, mx, my, WW * k, WH * k);
    c.strokeStyle = '#a8701a'; c.lineWidth = 1; c.strokeRect(mx, my, WW * k, WH * k);
    const M = (x, y) => [mx + x * k, my + y * k];
    const seen = (x, y) => g.seen[Math.min(29, Math.floor(y / 40)) * 32 + Math.min(31, Math.floor(x / 40))];
    if (has(S, 'valve')) { const [ax, ay] = M(SPOT.pipe, GY), [bx, by] = M(BAY.INLET[0], BAY.INLET[1]); c.strokeStyle = 'rgba(80,90,100,.8)'; c.lineWidth = 1.2; c.setLineDash([2, 2]); c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax, by); c.lineTo(bx, by); c.stroke(); c.setLineDash([]); }
    g.pos.vents.forEach(([x, y]) => { if (!seen(x, y)) return; const [a, b] = M(x, y - 6); c.strokeStyle = '#d8faff'; c.lineWidth = 1; c.beginPath(); c.arc(a, b, 2.2, 0, Math.PI * 2); c.stroke(); });
    if (has(S, 'octo')) { const [a, b] = M(g.pos.octo[0], g.pos.octo[1]); emoji(c, '🐙', a, b, 7); }
    TREASURE.forEach(t => { if (!has(S, t)) return; const [a, b] = M(g.pos.things[t][0], g.pos.things[t][1]); txt(c, a, b, '✓', 7, '#30c040', 'center', true, '#003a00'); });
    const [pa, pb] = M(SPOT.pot, GY - 4); emoji(c, '🍲', pa, pb, 7);
    const s = g.seal, [sa, sb] = M(s.x, s.land ? GY - 2 : s.y);
    if (Math.floor(tm * 3) % 2 === 0) { c.fillStyle = '#ff3a2a'; c.beginPath(); c.arc(sa, sb, 2.4, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 0.8; c.stroke(); }
    // 右边的说明
    const lx = 236;
    emoji(c, '🍲', lx + 4, 48, 7); txt(c, lx + 12, 48, L.mapKey[0], 7, '#5a3a1a', 'left', true);
    c.fillStyle = '#ff3a2a'; c.beginPath(); c.arc(lx + 4, 62, 2.4, 0, Math.PI * 2); c.fill(); txt(c, lx + 12, 62, L.mapKey[1], 7, '#5a3a1a', 'left', true);
    c.strokeStyle = '#4aa8c8'; c.lineWidth = 1; c.beginPath(); c.arc(lx + 4, 76, 2.2, 0, Math.PI * 2); c.stroke(); txt(c, lx + 12, 76, L.mapKey[2], 7, '#5a3a1a', 'left', true);
    txt(c, lx + 4, 90, '✓', 7, '#30c040', 'center', true, '#003a00'); txt(c, lx + 12, 90, L.mapKey[3], 7, '#5a3a1a', 'left', true);
    button(g, lx - 2, 204, 64, 18, L.back, () => { g.panel = null; });
  }

  /* ---------- 水族箱画面 ---------- */
  function drawTank(g) {
    const c = g.c, S = g.S, tm = g.anim;
    const bg = art('tankview');
    if (bg) c.drawImage(bg, 0, 0, W, H);
    else {
      const gr = c.createLinearGradient(0, TK.top, 0, H); gr.addColorStop(0, '#6ad0ea'); gr.addColorStop(1, '#2a8ab8');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = '#e6cf96'; c.fillRect(0, TK.floor, W, H - TK.floor);
      c.strokeStyle = '#3a9a4a'; c.lineWidth = 3; [30, 280].forEach((x, i) => { c.beginPath(); c.moveTo(x, TK.floor); for (let k = 1; k <= 4; k++) c.lineTo(x + Math.sin(tm * 1.5 + k + i) * 4, TK.floor - k * 12); c.stroke(); });
    }
    const fe = art('fish-extra');
    g.tankPellets.forEach(p => { if (fe) c.drawImage(fe, 0, 0, 64, 64, p.x - 3, p.y - 3, 6, 6); else { c.fillStyle = '#c8a050'; c.beginPath(); c.arc(p.x, p.y, 2, 0, Math.PI * 2); c.fill(); } });
    S.tank.coins.forEach(k => { c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(k.x, k.y, 4, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#a87000'; c.lineWidth = 1; c.stroke(); txt(c, k.x, k.y + 0.5, '¥', 5, '#7a4a00', 'center', true); });
    S.tank.fish.forEach((f, i) => drawFish(g, f.sp, f.size, f.x, f.y, f.face || 1, 1.6, tm + i));
    g.cracks.forEach(k => drawCrack(c, k, tm));
    // 顶上一排：照怪怪水族箱
    const bar = art('topbar6') || art('topbar');
    if (bar) c.drawImage(bar, 0, 0, W, TK.top); else { c.fillStyle = '#a81c10'; c.fillRect(0, 0, W, TK.top); }
    const slots = art('slot6') || art('slots');
    const C = caps(S);
    const items = [[L.tankBtns[0], '🍚', null], [L.tankBtns[1], '🪣', () => tankPutIn(g)], [L.tankBtns[2], '⬅', () => { g.screen = 'play'; save(g); }]];
    items.forEach(([t, e, fn], i) => {
      const x = 22 + i * 38, y = 15;
      if (slots) c.drawImage(slots, 0, 0, 70, 70, x - 14, y - 14, 28, 28); else { c.fillStyle = '#d89a2a'; c.beginPath(); c.arc(x, y, 13, 0, Math.PI * 2); c.fill(); }
      emoji(c, e, x, y, 12);
      txt(c, x, 32, t, 5.5, '#ffe98a', 'center', true, '#3a0400');
      if (fn) g.btns.push({ x: x - 14, y: y - 14, w: 28, h: 28, fn });
    });
    txt(c, 312, 11.5, '¥ ' + fmt(S.money), 9, '#ffe24a', 'right', true);
    txt(c, 312, 27, ITEMS.tank.names[lvOf(S, 'tank') - 1] + ' ' + S.tank.fish.length + '/' + C.tank + '　盆里 ' + S.basin.length, 6, '#fff2d0', 'right', true);
  }
  function drawCrack(c, k) {
    const cr = art('cracks');
    const sz = 16 + k.st * 10;
    if (cr) { c.drawImage(cr, (k.st - 1) * 120, 0, 120, 120, k.x - sz, k.y - sz, sz * 2, sz * 2); return; }
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 0.8;
    for (let i = 0; i < 4 + k.st * 3; i++) { const a = i * 0.9 + k.x; c.beginPath(); c.moveTo(k.x, k.y); c.lineTo(k.x + Math.cos(a) * sz, k.y + Math.sin(a) * sz); c.stroke(); }
  }

  /* ---------- 标题、帮助 ---------- */
  function savedGame(g) {
    if (g.savedAt == null || g.anim - g.savedAt > 0.5) { g.saved = loadSave(); g.savedAt = g.anim; }
    return g.saved;
  }
  function newGame(g) { OS.save.set(SAVE_KEY, null); const S = newState(); freshWorld(S); startGame(g, S); }
  function drawTitle(g) {
    const c = g.c;
    const t = art('title6') || art('title');
    if (t) c.drawImage(t, 0, 0, W, H); else { c.fillStyle = '#2a9ad0'; c.fillRect(0, 0, W, H); }
    L.title.split('').forEach((ch, i) => {
      c.save(); c.translate(70 + i * 45, 42 + Math.sin(g.anim * 2 + i) * 2); c.rotate(i % 2 ? 0.08 : -0.08);
      c.font = 'bold 38px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      c.lineWidth = 8; c.strokeStyle = '#3a0a00'; c.strokeText(ch, 0, 0);
      const gr = c.createLinearGradient(0, -18, 0, 18); gr.addColorStop(0, '#fff6a0'); gr.addColorStop(0.5, '#ffd21a'); gr.addColorStop(1, '#ff7a00');
      c.lineWidth = 3; c.strokeStyle = '#fff'; c.strokeText(ch, 0, 0); c.fillStyle = gr; c.fillText(ch, 0, 0);
      c.restore();
    });
    c.save(); c.translate(258, 72); c.rotate(-0.12); txt(c, 0, 0, L.sub, 15, '#ff2a1a', 'center', true, '#fff'); c.restore();
    if (g.load < 1) {
      rrect(c, 80, 214, 160, 14, 7); c.fillStyle = 'rgba(0,0,0,.5)'; c.fill();
      rrect(c, 82, 216, 156 * g.load, 10, 5); c.fillStyle = '#ff8a1a'; c.fill();
      txt(c, 160, 221, L.loading, 8, '#fff', 'center', true, '#3a1a00');
      return;
    }
    const saved = savedGame(g);
    const list = [];
    if (saved) list.push([L.cont, () => startGame(g, loadSave())]);
    list.push([L.start, () => { if (loadSave()) g.panel = { kind: 'ask', text: L.restartAsk, yes: L.start, fn: () => newGame(g) }; else newGame(g); }]);
    list.push([L.helpBtn, () => { g.screen = 'help'; }], [L.quit, () => g.win.close()]);
    let x = 160 - list.length * 37;
    list.forEach(([t, fn]) => { button(g, x, 206, 70, 20, t, fn); x += 74; });
  }
  function drawHelp(g) {
    const c = g.c;
    c.fillStyle = '#0a3a5a'; c.fillRect(0, 0, W, H);
    box(c, 10, 8, 300, 202);
    let y = 24;
    L.help.forEach((t, i) => { y += wrap(c, t, i ? 18 : 160, y, 284, 10.5, i ? 7.5 : 9, i ? '#3a2008' : '#8a1a14', i ? 'left' : 'center', !i) * 10.5 + 3; });
    button(g, 120, 214, 80, 18, L.back, () => { g.screen = 'title'; });
  }

  /* ================= 音乐（代码合成，OS.sound.loop） ================= */
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function tune(E, mel, inst, vol, bassRoots, opts) {
    opts = opts || {};
    const o = [];
    mel.forEach((m, i) => { if (!m) return; let k = 1; while (mel[i + k] === 0) k++; o.push([i * E, inst, hz(m), E * k * 0.9, vol]); });
    bassRoots.forEach((r, bar) => { for (let s = 0; s < 8; s += 2) o.push([(bar * 8 + s) * E, 'bass', hz(s % 4 ? r + 7 : r), E * 1.6, opts.bassVol || 0.08]); });
    if (opts.drums) for (let s = 0; s < mel.length; s++) {
      if (s % 4 === 0) o.push([s * E, 'drum', hz(36), 0.25, 0.12]);
      if (s % 4 === 2) o.push([s * E, opts.snare ? 'snare' : 'hat', 0, 0.1, opts.snare ? 0.05 : 0.02]);
      if (opts.hat && s % 2 === 1) o.push([s * E, 'hat', 0, 0.05, 0.015]);
    }
    if (opts.pad) bassRoots.forEach((r, bar) => o.push([bar * 8 * E, 'pad', hz(r + 12), 8 * E, 0.018], [bar * 8 * E, 'pad', hz(r + 16), 8 * E, 0.012]));
    return { notes: o, len: mel.length * E };
  }
  const MEL = [72, 0, 74, 76, 79, 0, 76, 0, 74, 72, 74, 0, 69, 0, 0, 0, 72, 0, 74, 76, 79, 0, 81, 0, 79, 76, 74, 76, 72, 0, 0, 0];
  const TUNES = {
    title: tune(0.2, MEL, 'pluck', 0.07, [48, 45, 41, 43], { drums: true, hat: true }),
    day: tune(0.2, MEL, 'pluck', 0.07, [48, 45, 41, 43], { drums: true, hat: true }),
    night: tune(0.3, MEL, 'flute', 0.05, [48, 45, 41, 43], { pad: true, bassVol: 0.05 }),   // 水下：慢一点的长笛
    tense: tune(0.15, [69, 0, 72, 69, 76, 0, 75, 0, 74, 72, 71, 72, 69, 0, 64, 0, 69, 0, 72, 69, 77, 0, 76, 0, 74, 71, 68, 71, 69, 0, 0, 0], 'lead', 0.035, [45, 45, 41, 40], { drums: true, snare: true, bassVol: 0.1 })
  };
  function setMusic(g, name) {
    if (g.musicName === name) return;
    if (g.music) { g.music.stop(); g.music = null; }
    g.musicName = name;
    if (name && TUNES[name] && OS.sound.loop) g.music = OS.sound.loop(TUNES[name].notes, TUNES[name].len);
  }

  OS.tank = { open, _G: () => G };   // _G：测试时看里面的状态
})();
