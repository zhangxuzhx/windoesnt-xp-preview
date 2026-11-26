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

  /* ================= 地形：浅水湾在 tank-bay.js、珊瑚礁在 tank-reef.js（改地形去那边） =================
     两个展区分开两张图（作者 2B：过门画面黑一下切过去）。BAY 是"现在这个展区"的地形（名字沿用浅水湾那时候的），换展区的时候 setArea 换掉 */
  const AREAS = { bay: OS.tankBay, reef: OS.tankReef, kelp: OS.tankKelp };
  const AREA_ORDER = ['bay', 'reef', 'kelp'];   // 岸上的门一个接一个：浅水湾 → 珊瑚礁 → 海草林 →（深海沟还没做）
  AREAS.bay.id = 'bay';
  AREAS.bay.SHOP = AREAS.bay.SHOP || { at: AREAS.bay.OCTOPUS, mk: 'octopus', flag: 'octo' };   // 浅水湾水下的商人是章鱼
  AREAS.bay.DEPTH = AREAS.bay.DEPTH || { y: AREAS.bay.DARK_Y, need: 'lamp', msg: 'tooDark' };   // 没头灯不敢往最黑的深海下
  AREAS.bay.LOOK = AREAS.bay.LOOK || { light0: 280, far: [520, 760], zone: '浅水湾' };
  let AREA = 'bay', BAY = AREAS.bay;
  let WW = BAY.WW, WH = BAY.WH;
  const GY = BAY.GY, WY = BAY.WY;
  const Z = 4 / 3, VW = W / Z, VH = H / Z;                 // 镜头推近：一屏看世界 240×180
  // 岸上从左到右：帐篷、水族箱、锣、木盆、摊子 →（大胃王座位、一排游客）→ 垃圾桶、水管、商人；游客那段空出来，别被东西挡住
  // 珊瑚礁：最左头回浅水湾的门，挨着是水族箱（家里那缸架在推车上跟过来）；摊子、锣跟浅水湾一个位置（推车摊停在一样的地方）；帐篷在右边（没有水管）
  const SPOTS = {
    bay: { tent: 32, tank: 80, gong: 114, basin: 136, pot: 174, bin: 372, pipe: 400, mA: 436, mB: 492, mC: 548, gate: AREAS.bay.WW - 45 },
    reef: { gateL: 22, tank: 76, gong: 114, basin: 136, pot: 174, bin: 362, tent: 402, mA: 448, mB: 504, mC: 560, gate: AREAS.reef.WW - 45 },   // 水族箱跟着推车过来，跟浅水湾一样挨着锣和摊子（11-26 作者：放远了大胃王点菜的时候来回取鱼太远）；帐篷挪到右边垃圾桶后面
    kelp: { gateL: 22, tank: 76, gong: 114, basin: 136, pot: 174, bin: 362, tent: 402, mA: 448, mB: 504, mC: 560, gate: AREAS.kelp.WW - 45 }   // 跟珊瑚礁一样的摆法（推车摊）
  };
  // 每个展区自己的：pack 图包（assets/tank/<pack>/，名字前面加 pack/）；cart 推车摊（比浅水湾的柜台高）；lic 打服第三位拿到的那张许可证（开右边的门）；
  // tentFoot、gongFoot 帐篷和锣在图里的脚底；music 音乐名后缀；page 菜谱 ／ 图鉴默认翻到第几页；sway 海底摆设哪几格会晃；shopIc 大地图上水下小铺的标记
  const LOOKS = {
    bay: { pack: null, lic: 'license', tentFoot: 104, gongFoot: 17.6, music: '', page: 0, sway: [0, 1], shopIc: null, pay: 1, crowd: 0 },
    reef: { pack: 'reef', cart: true, lic: 'license2', tentFoot: 113, gongFoot: 17, music: 'R', page: 1, sway: [3], shopIc: { ic7: 7, e: '🐚' }, pay: 1, crowd: 0 },
    kelp: { pack: 'kelp', cart: true, lic: 'license3', tentFoot: 110, gongFoot: 19.8, music: 'K', page: 2, sway: [0, 3], shopIc: { ic8: 6, e: '🐴' }, pay: 1.25, crowd: -1 }   // 海草林（作者零）：游客少一点，懂吃，给钱大方
  };
  let LOOK = LOOKS.bay;
  let SPOT = SPOTS.bay;
  const RAIL = 580;                                        // 再往右栈道有栏杆：跳不下水，也爬不上来
  const STALL_CX = 243;                                    // 做菜、大胃王的时候镜头对着摊子中间
  const SEAL_R = 7;                                        // 海狗撞墙按这么大的圈算
  let TREASURE = Object.keys(BAY.THINGS);                  // 地图上"宝贝 几/几"（这个展区的）
  const CH = 120;                                          // 石头按 120×120 一块一块画（算好的图存起来）

  /* ================= 图 ================= */
  const V6 = ['rock', 'sand', 'boat', 'boatin', 'crack', 'seal', 'fish6', 'crown', 'tent', 'stall', 'pot6', 'basin6', 'gong', 'tanks', 'merchants', 'tourists6', 'judges', 'shark', 'seabed6', 'icons6', 'tankview', 'title6',   // Codex 浅水湾新画风（11-25，照定样重画的）
    'far-shallow', 'far-mid', 'far-deep', 'backwall', 'ledges', 'front', 'decor', 'caustics', 'vent', 'inlet', 'valve', 'shore-far', 'shore-mid', 'deck', 'post', 'rail', 'gate', 'pipe-shore',   // 纵深那批
    'panel', 'btn', 'hud', 'airbar', 'bubble', 'say', 'order', 'fighticons', 'topbar6', 'slot6', 'bin',   // 界面那批（11-25 到的）
    'potside', 'potclose', 'tub',   // 锅补图：侧面的锅、锅里特写、侧面的木盆
    'tourists6b',   // 游客补图：站着等、闻香味（不带道具）
    'tourists6c', 'poster', 'seal2', 'pad',
    'icons6b',
    'shark2', 'gate-open'];   // 大白鲨统一形象（11-25）：上排岸上 0 等菜 1 吃 2 盯上你 3 空桌子 4 扑下水；下排水里 0 1 游 2 张嘴扑 3 尾巴被咬 4 服了 5 被惹急了   // 小图标补图（11-25）：0 撒鱼食 1 放进来 2 管理 3 回岸上 4 金币 5 鱼食颗粒 6 珍珠 7 摊子标记 8 章鱼小铺标记 9 小地图按钮   // 操作和爽吃补图（11-25）：游客爽吃 7 格、鱼谱挂图、海狗叼／攻击／被夹、手机摇杆和按键
  const OLD = ['title', 'topbar', 'slots', 'fish-extra', 'cracks', 'contract', 'tourists', 'pot', 'helpers2', 'seabed', 'clam', 'kit'];   // 以前画的，新图没来之前先顶着
  // 珊瑚礁那包（11-26，「codex任务包/怪怪水煮箱-珊瑚礁全套素材.md」）放 assets/tank/reef/，名字前面加 reef/
  const REEF_ART = ['rock', 'sand', 'coral', 'far-shallow', 'far-mid', 'far-deep', 'backwall', 'ledges', 'front', 'decor', 'vent', 'shore-far', 'shore-mid', 'deck', 'post', 'rail', 'gate', 'gate-open', 'tent', 'stall', 'gong',
    'fish6', 'merchants', 'judges', 'leopard', 'tourists7', 'tourists7b', 'tourists7c', 'sub', 'subin', 'urchin', 'boulder', 'tunnel', 'icons7', 'potclose2', 'platter'];
  // 跟浅水湾同名同格式的：在珊瑚礁的时候换成 reef/ 那张
  // 海草林那包（11-26，「codex任务包/怪怪水煮箱-海草林全套素材.md」）放 assets/tank/kelp/
  const KELP_ART = ['rock', 'sand', 'far-shallow', 'far-mid', 'far-deep', 'backwall', 'ledges', 'front', 'decor', 'vent', 'shore-far', 'shore-mid', 'deck', 'post', 'rail', 'gate', 'gate-open', 'tent', 'stall', 'gong',
    'fish6', 'merchants', 'judges', 'octo', 'octorock', 'tentacle', 'tourists8', 'tourists8b', 'tourists8c', 'station', 'stationin', 'kelp', 'kelpwall', 'eel', 'icons8', 'potclose3'];
  const PACKS = { reef: REEF_ART, kelp: KELP_ART };
  const AREA_ART = ['rock', 'sand', 'far-shallow', 'far-mid', 'far-deep', 'backwall', 'ledges', 'front', 'decor', 'vent', 'shore-far', 'shore-mid', 'deck', 'post', 'rail', 'gate', 'gate-open', 'tent', 'stall', 'gong', 'merchants', 'judges'];
  const an = n => (LOOK.pack && AREA_ART.indexOf(n) >= 0 ? LOOK.pack + '/' + n : n);
  const IMG = {};
  function art(n) {
    const sl = n.indexOf('/'), pk = sl > 0 ? PACKS[n.slice(0, sl)] : null;
    const dir = sl > 0 ? (pk && pk.indexOf(n.slice(sl + 1)) >= 0 ? 'assets/tank/' : null) : V6.indexOf(n) >= 0 ? 'assets/tank/v6/' : OLD.indexOf(n) >= 0 ? 'assets/tank/' : null;
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
  const aart = n => art(an(n));
  const packLoaded = {};
  const loadPack = id => { if (id && PACKS[id] && !packLoaded[id]) { packLoaded[id] = true; PACKS[id].forEach(n => art(id + '/' + n)); } };   // 有了去那个展区的许可证再下那一包
  const loadReef = () => loadPack('reef');
  const BSOD = { id: 'tank', name: 'TANK_GLASS_CRACKED', text: '不奔腾刚刚以为进水了，吓得停止工作了' };

  /* ================= 文案 ================= */
  const L = {
    title: '怪怪水煮箱', sub: '加辣版', loading: '生火中',
    start: '开始', cont: '接着玩', helpBtn: '帮助', quit: '退出', back: '返回', yes: '好', no: '算了',
    restartAsk: '重新开始会把存档清掉，\n确定吗？',
    day: d => '第 ' + d + ' 天',
    basketFull: '鱼篓满了，先回岸上', airOut: '憋不住了！', current: '急流太冲，游不过去',
    rail: '这边有栏杆，跳不下去', tooDark: '太黑了，不敢再往下游', tooDeep: '水压太大，没潜水头盔下不去', crackHit: '石头裂了缝', crackBroke: '轰！石头撞开了', secret: '暗道！', breath: '换了口气',
    airHome: '憋不住了！拼命游回了岸边',
    gear: { thruster: '捡到一个推进器！\n八成是景区潜水员掉的。\n能往前猛冲一下，撞开裂了缝的石头。', fins: '捡到一双大脚蹼！\n这下逆着急流也游得过去了。', lamp: '捡到一盏头灯！\n最黑的深海也敢下去了。', o2: '捡到一个氧气瓶！\n憋气多了 10 秒。',
      k_knife: '观察站隧道尽头躺着一把海带刀！\n密不透风的海带墙，\n这下割得开了。', k_suit: '海带墙后面挂着一件绝缘潜水服！\n穿上它电鳗电不着你，\n还能一头把它顶开。', k_flick: '窄道尽头，学会了"甩尾"！\n在水里冲刺完马上再按一下冲刺，\n能接着再冲一次，还能换方向。',
      r_gloves: '座位底下压着一双厚皮手套！\n戴上就不怕扎了：\n海胆推得开，狮子鱼也叼得住。', r_echo: '迷宫最里头供着一只大海螺！\n按住"攻击"不放，发一圈声波，\n附近的暗道和躲着的鱼都会亮一下。', r_helmet: '暗道尽头躺着一顶潜水头盔！\n戴上它，海沟再深也下得去。' },
    stash: n => '石缝里藏着一堆珍珠！\n叼走 ' + n + ' 颗。', valve: '拧开了进水口的阀门！\n管子直通岸上锅旁边，\n以后一下就上去了。',
    pipeShut: '一根粗水管，通到水底下。\n那头堵着。', pipeGo: '钻进管子，\n直接下到海底进水口？', pipeYes: '钻',
    mapN: (a, b) => '宝贝 ' + a + '/' + b, mapKey: ['摊子', '海狗', '气泡泉', '找到的宝贝'],
    dumped: n => '倒进盆里 ' + n + ' 条', basinFull: '盆里装不下了', pearlSold: (n, m) => '卖了 ' + n + ' 颗珍珠，' + m + ' 块', junkBin: m => '破烂扔进垃圾桶，景区给了 ' + m + ' 块',
    mapKey2: '小铺', gotPearl: '叼到一颗珍珠', clank: '当！', gotJunk: { shoe: '一只破鞋', can: '一个易拉罐', tire: '一个烂轮胎' },
    bottle: { sour: '漂流瓶：里面是一张酸菜鱼的配方！', coco: '漂流瓶：里面是一张椰汁鱼的配方！\n清清甜甜，鹦鹉最爱。', haidai: '漂流瓶：里面是一张海带鱼汤的配方！\n鲜得很，大海星最爱。', money: n => '漂流瓶：里面卷着 ' + n + ' 块钱！' },
    emptyBasin: '盆里没鱼，先下水抓', busy: '锅里还没卖完',
    judge: { S: ['就这么小一条？', '小了点吧', '塞牙缝的'], M: ['还行吧', '中规中矩', '凑合'], L: ['这鱼真肥！', '个头不错！', '闻着就香'], K: ['哇，鱼王！', '鱼王！今天赚到了', '这么大一条！'] },
    pickRecipe: '选配方', steps: ['下汤底', '加水', '下鱼', '烧开'], openPot: '点锅开锅',
    best: '火候正好！', good: '火候不错', raw: '还没熟……', over: '煮过头了', burnt: '糊了……',
    leave: ['不爱吃这个', '摇摇头走了', '……算了'], bid: (k, p) => k + ' 条 ' + p, sellAll: '全卖了',
    warm: '保温中', cold: (n, m) => '凉了，剩下 ' + n + ' 条三折处理，' + m + ' 块', sold: m => '+' + m,
    tent: '睡一觉？\n醒来水里的鱼和珍珠都补回来了。', sleep: '睡觉', morning: '天亮了，又是新的一天！', zzz: '呼……噜……',
    shop: n => n + '的摊子', owned: '已买', maxed: '满了', buy: p => p + ' 块', noMoney: '钱不够', nextArea: '下个展区才有', otherArea: '别处才有',
    refund: m => '商人们对了一遍账：\n有几样东西卖到了后面展区才有的档次，\n换回浅水湾能买的，多收的 ' + m + ' 块退给你。',
    gate: n => n + '展区\n要摊位许可证才能过去。', gateGo: (n, t) => '推着推车去' + n + '？\n' + (t ? '锅、木盆、水族箱都跟着走。' : '锅和木盆跟着走。'), gateBack: n => '推着推车回' + n + '？', gateYes: '走',
    gateSoon: '下一个展区还在装修，敬请期待。', tunnel: '一条去下一个展区的水下通道，\n铁栅栏锁着。', tunnelGo: n => '钻进水下通道，\n游去' + n + '？',
    gongT: (n, who) => '第 ' + n + ' 位大胃王：' + who, gongLimit: s => '限时 ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'), gongDish: i => '第 ' + i + ' 道', gongNoRecipe: '还没学会', gongYes: '敲锣', gongDone: '三位大胃王都服了。', gongBusy: '先把手上这锅卖完',
    giveUp: '放弃', giveUpAsk: '放弃这次挑战？\n大胃王会走，下次再敲锣，什么都不丢。', gaveUp: n => n + '摇摇头走了。\n下次再敲锣，什么都不丢。',
    recipeClose: '先不做', bossWants: n => '大胃王点的是：' + n,
    alarm: '警告！大胃王驾到！',
    order: (who, i, n) => who + ' 点菜' + (n > 1 ? ' 第 ' + i + ' 道' : ''),
    needFish: f => '盆里的鱼不够：' + f, wrongRecipe: '我点的不是这个！', bossBad: '火候不行，重做！', bossGood: '嗯，就是这个味儿！',
    bossTimeout: '大胃王等不及，摇摇头走了。\n下次再敲锣，什么都不丢。', bossPass: (n, m) => n + '吃满意了！\n赏你 ' + m + ' 块。',
    sharkEye: '……你看起来更好吃。', sharkChase: '大白鲨追着海狗跳下水了！', bitTail: '咬到尾巴了！', gotBit: '被咬了一口！',
    sharkSay1: '嗯，两锅都不错……', scared: '！', sharkHurt: ['嗷！你给我等着！', '这回真生气了！'],
    replayWin: '又把大白鲨咬服了一次。\n后门重打，不改进度，也不给钱。',
    backdoorT: n => '后门：重打第三位大胃王' + n + '\n不改存档进度，打赢了也不给钱。', backdoorBtns: ['从点菜开始', '从吃完跳下水开始', '直接开打'],
    eaten: n => '海狗被' + n + '吃了。', retry: '重新再来', later: '下次挑战',
    license: '大白鲨服了，签了字：\n珊瑚礁展区摊位许可证！\n另外赏你 1000 块。', fix: '装修中',
    tankNone: '还没有水族箱，\n去水獭那儿买一个。', tankBtns: ['撒鱼食 5', '放进来', '回岸上', '管理'], tankMgT: '水族箱里的鱼', tankMgEmpty: '水族箱里没鱼', tankOut: '捞出来放进盆', tankGrow: n => '再喂 ' + n + ' 回长一号', tankKing: '鱼王，长到头了', tankFed: '刚吃饱', tankCoin: v => '掉钱 ' + v, tankFull: '水族箱满了', tankPut: n => '放进来 ' + n + ' 条', tankTake: '捞出来放进盆里',
    menu: ['继续', '声音：开', '声音：关', '回标题画面', '地图', '鱼类图鉴', '按键设置', '海狗状态', '菜谱'], air: '憋气',
    recipeT: '菜谱', recipeN: (a, b) => '学会 ' + a + '/' + b, recipeMul: m => '卖价 ×' + m, recipeLike: '爱吃：', recipeHate: '怕这口：', recipeHowT: '学会：', openRecipes: '看菜谱',
    recipeHow: { clear: '一开始就会', spicy: '海象的摊子，150 块', sour: '海底沉着的漂流瓶', suanla: '珊瑚礁海象分店，400 块', coco: '珊瑚礁海里的漂流瓶', sashimi: '豹海豹服了以后送的', tangcu: '海草林海象分店，700 块', haidai: '海草林海里的漂流瓶', duojiao: '大章鱼服了以后送的' },
    statT: '海狗状态', statLeft: '本事', statGear: '海里找到的', statRecipe: '菜谱', statNone: '没有', statGood: '好鱼食', statPlain: '普通',
    stat: { air: '憋气', speed: '游速', basket: '鱼篓', hp: '血', pot: '锅', warm: '保温', tank: '水族箱', food: '鱼食', basin: '木盆' },
    statSec: n => n + ' 秒', statGe: n => n + ' 格', statDi: n => n + ' 滴', statTiao: n => n + ' 条', statFl: f => '口味：' + f, statBoss: n => '大胃王 ' + n + '/3',
    goShore: '回岸上',
    // 11-25 作者：操作改成左摇杆右按键、按"叼"才抓、木盆能看、鱼谱、海贝夹人、游客爽吃演出（创意稿「怪怪水煮箱-操作和鱼-创意.md」）
    clamped: '被海贝夹住了！', unclamped: '挣脱了！', newFish: n => '头一回抓到' + n + '！',
    pad: { dash: '冲刺', bite: '叼', hit: '攻击', use: '用' },
    acts: { u: '上', d: '下', l: '左', r: '右', dash: '冲刺', bite: '叼', act: '攻击／用', map: '小地图' },
    keysT: '按键设置', keyWait: '按新键…', keyReset: '恢复默认',
    basinT: '木盆', basinEmpty: '盆里没鱼', toss: '扔回海里', toTank: '放进水族箱', tossAll: '全扔回海里', tossAllAsk: '盆里的鱼全扔回海里？', tossYes: '扔', tossed: '扑通',
    dexT: '常见海鱼图谱', dexN: (a, b) => '认识 ' + a + '/' + b, dexUnknown: '？？？', dexNot: '还没抓到过', dexHome: '住在：', dexBoss: '大胃王点过：', dexPrice: '卖价：',
    dexGot: (n, s) => '抓到过 ' + n + ' 条，最大的' + s, poster: '鱼谱',
    inBasin: (a, b) => '盆里 ' + a + ' · 水族箱 ' + b, inBasinOnly: a => '盆里 ' + a,
    eatBig: { clear: '鲜掉眉毛！', spicy: '辣得过瘾！', sour: '酸爽！', suanla: '酸辣够劲！', coco: '甜到心里了！', sashimi: '入口就化了！', tangcu: '酸酸甜甜，香！', haidai: '鲜得掉牙！', duojiao: '辣得冒烟了！' }, eatOk: ['嗯，好吃', '不错不错', '挺香'], eatBad: ['唉……', '凑合咽了', '这也叫火候？'],
    disc: '请插入"幻觉游戏 V3.0"光盘。',
    // 11-26 珊瑚礁（创意稿「怪怪水煮箱-珊瑚礁-创意.md」）
    domeHit: '玻璃罩裂了好几道缝', domeBroke: '哗啦！玻璃罩撞碎了',
    urchinOuch: '好扎！空手推不动海胆', urchinPush: '戴着手套，把海胆推开了', lionOuch: '扎手！', groupHide: '缩在洞里不出来', groupOut: '顶出来了！',
    echoGot: '声波照出一条暗道！', echoFish: '有鱼躲着！',
    stepsRaw: ['铺冰', '垫叶子', '放鱼', '下刀'], openRaw: '点盘子出菜', bestRaw: '刀工正好！', goodRaw: '切得不错', rawRaw: '还没切好……', overRaw: '切得太碎', burntRaw: '切坏了……',
    license2: '豹海豹服了，签了字：\n下一个展区的摊位许可证！\n还送了一张刺身拼盘的配方，\n另外赏你 1600 块。', replayWin2: '又把豹海豹撞服了一次。\n后门重打，不改进度，也不给钱。',
    leoChase: '豹海豹追着海狗跳下水了！', leoHit: '撞上了！', leoRock: '咚！一头撞上礁石', leoFront: '正面撞不过它！', leoGot: '被它撞了一下！',
    leoHurt: ['嗷！有两下子嘛！', '嘶……还挺疼！', '还来？！', '这回真生气了！'], leoStrong: '挺厉害呀，我要开始认真了', leoSmash: '轰！礁石砸碎了', leoDizzy: '……头、头有点晕',  leoLeap: '它跳出水面了……', leoDive: '从上面扎下来了！', leoBounce: '咚——反弹回来了！', leoSay1: '嗯，酸辣、清甜，都对味……', leoEye: '……不过我最爱吃的，是海狗。',
    wonder: '北极熊和企鹅同时出现？我是产生幻觉了吗？',
    // 11-26 海草林（创意稿「怪怪水煮箱-海草林-创意.md」，作者 1～12 全 A）
    doorHit: '舱门锈死了', doorBroke: '哐！舱门撞开了',
    kelpWall: '海带缠得密不透风', kelpCut: '唰唰几刀，海带墙割开了',
    eelZap: '被电鳗电了一下！', eelPush: '穿着绝缘服，一头把电鳗顶开了', fishFled: '叼着的鱼吓跑了一条',
    sheepButt: '羊头鱼回头撞了你一下！', wolfBite: '狼鳗探头咬了一口！',
    license3: '大章鱼服了，签了字：\n下一个展区的摊位许可证！\n还送了一张剁椒鱼头的配方，\n另外赏你 2400 块。', replayWin3: '又把大章鱼咬服了一次。\n后门重打，不改进度，也不给钱。',
    octoSay1: '嗯，鲜的、酸甜的，都对味……', octoEye: '……不过我八条腿都闻到了，海狗更香。', octoChase: '大章鱼的触手跟着卷下来了！',
    octoGrab: '被触手缠住了！', octoFree: '挣开了！', octoChomp: '被拖到嘴边咬了一口！', octoCut: '咬断了一条触手！', octoSweep: '被触手扫中了！',
    octoInk: '它喷墨了！', octoOut: '它从礁石后面扑出来了！', octoPounce: '被它扑中了！', octoHead: '咬中脑袋了！',
    octoHurt: ['嘶——我的腿！', '还敢咬？！', '我生气了！'],
    help: [
      '你是一只海狗，在景区的大水族馆里摆水煮鱼摊。',
      '· 手机上：左半边屏幕按住拖就是摇杆，右下角是冲刺、叼、攻击。电脑上：WASD 或方向键走，J K L 或 Z X C 是冲刺、叼、攻击，菜单里能改键。走到东西跟前，攻击键就变成"用"；点一下岸上的东西也会走过去用。',
      '· 下水按"叼"咬住鱼、破烂、海贝里的珍珠，回到摊位前鱼倒进盆里。憋气条用完会拼命游回岸边。',
      '· 点木盆能看盆里的鱼，扔回海里或放进水族箱。摊子柱子上钉着鱼谱，抓到过的鱼都记在上面。',
      '· 海里藏着好些东西，拿到了才过得去更深的地方。有了推进器就能在水里往前猛冲。右下角的地图按钮（电脑按 M）开小地图，没去过的地方是迷雾。',
      '· 点锅做菜：选配方，等最亮的绿点一下开锅。游客出价，点价钱泡泡卖给他；等一等可能加价，也可能走。',
      '· 帐篷里睡一觉，水里的鱼和珍珠都补回来了。',
      '· 敲锣叫大胃王：按他点的菜抓鱼、做菜，限时。三位都服了，拿到下一个展区的许可证。',
      '· 家里的水族箱能养备用鱼，点水里撒鱼食，鱼越喂越大。顶上"管理"里能看每条鱼、挑一条捞出来。'
    ]
  };
  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const dist = (a, b, x, y) => Math.hypot(a - x, b - y);

  /* ================= 数据 ================= */
  const SPECIES = {
    yellow: { n: '小黄鱼', len: [9, 11, 14, 17], val: [6, 9, 14, 24], col: '#f2c230', fin: '#d89a10', row: 0, h: '栈道底下的浅水，一群一群的' },
    bass: { n: '鲈鱼', len: [13, 17, 22, 26], val: [12, 18, 28, 48], col: '#b8c4cc', fin: '#6a7a88', row: 1, h: '浅水、右边礁石、深一点的水里都有' },
    squid: { n: '墨鱼', len: [12, 15, 19, 23], val: [14, 20, 30, 50], col: '#ecc8d4', fin: '#c88aa0', row: 2, squid: true, h: '沉船旁边的沙地、右边礁石' },
    croaker: { n: '大黄鱼', len: [18, 23, 28, 33], val: [24, 36, 55, 90], col: '#f0b020', fin: '#c87a00', row: 3, h: '深海，最黑的地方有鱼王' },
    // 珊瑚礁的鱼（作者 5A：各带一种脾气）：reef/fish6 每行三格，第 3 格是受惊 ／ 被顶出洞 ／ 刺炸起来
    clown: { n: '小丑鱼', len: [8, 10, 12, 14], val: [10, 15, 22, 36], col: '#f07a20', fin: '#ffffff', row: 0, sheet: 'reef/fish6', school: true, h: '浅水礁湖、珊瑚迷宫，一群一群的，一口能叼好几条' },
    butterfly: { n: '蝴蝶鱼', len: [10, 12, 15, 18], val: [16, 24, 36, 58], col: '#f4d020', fin: '#202020', row: 1, sheet: 'reef/fish6', shy: true, h: '浅水礁湖、珊瑚迷宫，见人就跑，得冲刺追' },
    grouper: { n: '石斑鱼', len: [18, 23, 29, 35], val: [30, 45, 70, 110], col: '#8a6040', fin: '#5a3a20', row: 2, sheet: 'reef/fish6', h: '珊瑚洞、海沟，躲在小洞里探头，先顶出来再叼' },
    lion: { n: '狮子鱼', len: [13, 16, 20, 24], val: [36, 54, 80, 130], col: '#e86050', fin: '#fff0e0', row: 3, sheet: 'reef/fish6', spiky: true, h: '珊瑚洞、海沟，浑身是刺，戴厚皮手套才叼得住' }
    // 海草林的鱼（作者 5A）：kelp/fish6 第 3 格：受惊散开 ／ 回头撞人 ／ 露馅 ／ 探头咬人
    , sardine: { n: '沙丁鱼', len: [7, 9, 11, 13], val: [12, 18, 26, 42], col: '#a8c0d8', fin: '#4a6a8a', row: 0, sheet: 'kelp/fish6', school: true, scatter: true, h: '海带林，一大群一大群的，一冲就散，慢慢靠近一口叼几条' },
    sheephead: { n: '羊头鱼', len: [16, 20, 25, 30], val: [36, 54, 80, 130], col: '#e87a8a', fin: '#202020', row: 1, sheet: 'kelp/fish6', butt: true, h: '海带林、中间的洞、电鳗窝，会撞人，先顶晕再叼' },
    seadragon: { n: '叶海龙', len: [10, 12, 14, 16], val: [80, 120, 180, 300], col: '#c8d860', fin: '#90a830', row: 2, sheet: 'kelp/fish6', camo: true, h: '海带林、中间的洞，像片海草，游到跟前才露馅' },
    wolfeel: { n: '狼鳗', len: [20, 26, 32, 38], val: [44, 66, 100, 160], col: '#8a7a6a', fin: '#5a4a3a', row: 3, sheet: 'kelp/fish6', lunge: true, h: '石缝里，经过就探头咬人，趁它缩回去前叼住' }
  };
  const DEX_PAGES = [{ n: '浅水湾', list: ['yellow', 'bass', 'squid', 'croaker'] }, { n: '珊瑚礁', list: ['clown', 'butterfly', 'grouper', 'lion'] }, { n: '海草林', list: ['sardine', 'sheephead', 'seadragon', 'wolfeel'] }];
  const fishTag = (sp, size) => SPECIES[sp].n + '·' + SIZE_N[size];
  const SIZE_N = ['小', '中', '大', '鱼王'];
  let REGIONS = BAY.REGIONS;   // 野生鱼住在哪儿（在地形那个文件里）
  // 菜谱：星级管卖价（星越高游客给的钱越多），口味管谁爱吃谁怕。浅水湾这三道都是一星，只是口味不一样（11-25 作者；以后还有复合口味）
  // tags：口味。复合口味两样都算（作者 8A：酸辣鱼爱吃酸的、爱吃辣的都多给钱，怕辣的照样怕）
  const RECIPES = {
    clear: { n: '清汤水煮', fl: '清淡', tags: ['clear'], star: 1, ic: 0, col: '#e8f0d8' },
    spicy: { n: '麻辣水煮', fl: '辣', tags: ['spicy'], star: 1, ic: 1, col: '#d8301a' },
    sour: { n: '酸菜鱼', fl: '酸', tags: ['sour'], star: 1, ic: 2, col: '#e8c840' },
    suanla: { n: '酸辣鱼', fl: '酸辣', tags: ['sour', 'spicy'], star: 2, ic7: 0, close: 0, col: '#e87a20' },
    coco: { n: '椰汁鱼', fl: '清甜', tags: ['sweet'], star: 2, ic7: 1, close: 1, col: '#f4f0e4' },
    sashimi: { n: '刺身拼盘', fl: '鲜', tags: ['fresh'], star: 3, ic7: 2, close: 2, raw: true, col: '#f4c8c0' },   // 生鱼片不进锅：冰盘上切、摆
    // 海草林（作者 6A）：锅里特写是 kelp/potclose3 第几行
    tangcu: { n: '糖醋鱼', fl: '酸甜', tags: ['sour', 'sweet'], star: 2, ic8: 0, close: 0, closeSheet: 'kelp/potclose3', col: '#d8402a' },
    haidai: { n: '海带鱼汤', fl: '鲜', tags: ['fresh'], star: 2, ic8: 1, close: 1, closeSheet: 'kelp/potclose3', col: '#e8f0e0' },
    duojiao: { n: '剁椒鱼头', fl: '辣', tags: ['spicy'], star: 3, ic8: 2, close: 2, closeSheet: 'kelp/potclose3', col: '#e02a1a' }
  };
  const hates = (T, r) => !!(r && T.hate && RECIPES[r].tags.some(t => T.hate.indexOf(t) >= 0));
  const likes = (T, r) => !!(r && RECIPES[r].tags.some(t => T.like.indexOf(t) >= 0)) && !hates(T, r);   // 又爱又怕（企鹅爱酸怕辣，碰上酸辣鱼）：算怕
  const STAR_MAX = 5, STAR_MUL = [1, 1, 1.35, 1.8, 2.4, 3.2];   // 几星卖价乘几（一星 ×1）
  const RECIPE_PAGES = [{ n: '浅水湾', list: ['clear', 'spicy', 'sour'] }, { n: '珊瑚礁', list: ['suanla', 'coco', 'sashimi'] }, { n: '海草林', list: ['tangcu', 'haidai', 'duojiao'] }];   // 菜谱按展区一页一页
  const TOURISTS = {
    shark: { n: '鲨鱼', like: ['spicy'], hate: ['clear'], eat: 2, row: 0, e: '🦈' },
    bird: { n: '海鸟', like: ['clear'], hate: ['spicy'], eat: 1, row: 1, e: '🐦' },
    bear: { n: '北极熊', like: ['sour'], hate: null, eat: 3, row: 2, e: '🐻‍❄️' },
    penguin: { n: '企鹅', like: ['sour'], hate: ['spicy'], eat: 1, row: 3, e: '🐧' },
    // 珊瑚礁新来的（作者 16A）：reef/tourists7、7b、7c 第 1、2 行
    crab: { n: '大螃蟹', like: ['sour', 'spicy'], hate: ['clear'], eat: 2, row: 0, set: 'reef', e: '🦀' },
    parrot: { n: '鹦鹉', like: ['sweet'], hate: ['spicy'], eat: 1, pay: 1.6, row: 1, set: 'reef', e: '🦜' },
    // 海草林新来的（作者 10A）：kelp/tourists8、8b、8c 第 1、2 行。河豚吃到怕的气得鼓成刺球、滚着走
    puffer: { n: '河豚', like: ['spicy'], hate: ['sweet'], eat: 1, row: 0, set: 'kelp', puff: true, e: '🐡' },
    star: { n: '大海星', like: ['fresh'], hate: null, eat: 3, row: 1, set: 'kelp', e: '⭐' }
  };
  const TSHEET = { reef: 'reef/tourists7', kelp: 'kelp/tourists8' };
  const tsheet = (T, suf) => (T.set ? TSHEET[T.set] : 'tourists6') + suf;   // 游客那三张图：走路 ／ 站着 ／ 吃（suf：''、'b'、'c'）
  const POOLS = { bay: ['shark', 'shark', 'bird', 'bird', 'penguin', 'penguin', 'bear'], reef: ['shark', 'bird', 'penguin', 'bear', 'crab', 'crab', 'crab', 'parrot', 'parrot'],
    kelp: ['shark', 'bird', 'penguin', 'bear', 'crab', 'parrot', 'puffer', 'puffer', 'puffer', 'star', 'star', 'star'] };
  let TOUR_POOL = POOLS.bay;
  const ITEMS = {
    recipeSpicy: { n: '麻辣水煮配方', d: '学会麻辣水煮：辣，鲨鱼爱吃，海鸟企鹅怕辣', cost: [150], area: [0], ic: 1, e: '🌶' },
    pot: { n: '大锅', d: '一锅多煮几条', cost: [200, 500, 1000], area: [0, 1, 2], ic: 10, e: '🍲' },
    warm: { n: '保温锅盖', d: '卖不完的鱼保温更久', cost: [150, 300, 600], area: [0, 1, 2], ic: 11, e: '🫕' },
    basket: { n: '鱼篓', d: '下一次水能多叼一条', cost: [100, 250, 500, 900], area: [0, 0, 1, 2], ic: 3, e: '🧺' },
    tank: { n: '水族箱', d: '养备用鱼：不喂不会死，喂了长大', cost: [200, 500, 1200, 2500], area: [0, 0, 1, 2], names: ['小号水族箱', '中号水族箱', '大号水族箱', '特大号水族箱'], ic: 13, e: '🐠' },
    food: { n: '好鱼食', d: '水族箱里的鱼长得快一倍', cost: [120], area: [0], ic: 12, e: '✨' },
    speed: { n: '游得快', d: '在水里游得更快', cost: [150, 350, 700], area: [0, 1, 2], ic: 6, e: '💨' },
    hp: { n: '皮厚', d: '打架的时候多一滴血', cost: [300, 700, 1200], area: [0, 1, 2], ic: 9, e: '🛡' },
    recipeSuanla: { n: '酸辣鱼配方', d: '学会酸辣鱼：又酸又辣，爱吃酸的、爱吃辣的都爱，怕辣的还是怕', cost: [400], area: [1], ic7: 0, e: '🍋', recipe: 'suanla' },
    breath: { n: '憋气更久', d: '在水里多憋 10 秒气', cost: [600, 1200], area: [1, 2], ic7: 6, e: '🫧' },
    recipeTangcu: { n: '糖醋鱼配方', d: '学会糖醋鱼：又酸又甜，爱吃酸的、爱吃甜的都爱，怕的还是怕', cost: [700], area: [2], ic8: 0, e: '🍬', recipe: 'tangcu' }
  };
  // 海里自己找的东西（不卖）
  const GEAR = { thruster: { n: '推进器', ic: 7, e: '🚀' }, fins: { n: '大脚蹼', ic: 4, e: '🦶' }, lamp: { n: '头灯', ic: 5, e: '🔦' }, o2: { n: '氧气瓶', ic: 8, e: '🫧' },
    r_gloves: { n: '厚皮手套', ic7: 4, e: '🧤' }, r_echo: { n: '回声', ic7: 5, e: '🐚' }, r_helmet: { n: '潜水头盔', ic7: 3, e: '⛑' },
    k_knife: { n: '海带刀', ic8: 3, e: '🔪' }, k_suit: { n: '绝缘潜水服', ic8: 4, e: '⚡' }, k_flick: { n: '甩尾', ic8: 5, e: '💨' } };
  const O2S = ['o2a', 'o2b', 'o2c', 'r_o2a', 'r_o2b', 'r_o2c', 'k_o2a', 'k_o2b', 'k_o2c'];
  const MERCHANTS = {
    walrus: { n: '海象', items: ['recipeSpicy', 'pot', 'warm'], reefItems: ['recipeSuanla', 'recipeSpicy', 'pot', 'warm'], kelpItems: ['recipeTangcu', 'recipeSuanla', 'pot', 'warm'], cell: 0, e: '🦭' },
    pelican: { n: '鹈鹕', items: ['basket'], cell: 1, e: '🦤' },
    otter: { n: '水獭', items: ['tank', 'food'], cell: 2, e: '🦦' },
    octopus: { n: '章鱼', items: ['speed', 'hp'], cell: 3, e: '🐙', local: 0 },   // 只在浅水湾水下，只卖浅水湾这一档；后面展区的水下商人卖更高的
    hermit: { n: '寄居蟹', items: ['speed', 'hp', 'breath'], cell: 3, e: '🐚', local: 1 },   // 珊瑚礁迷宫半路（作者 11A）
    seahorse: { n: '海马', items: ['speed', 'hp', 'breath'], cell: 3, e: '🐴', local: 2 }   // 海草林中间那个洞（作者 9A）
  };
  const itemsOf = mk => (AREA === 'kelp' && MERCHANTS[mk].kelpItems) || (AREA !== 'bay' && MERCHANTS[mk].reefItems) || MERCHANTS[mk].items;
  const SHORE = { mA: 'walrus', mB: 'pelican', mC: 'otter' };
  // 升级按展区一档档开放（11-25 作者：1A 2A 3 按推荐 4B）：每档的 area 是要几张摊位许可证。海象、鹈鹕、水獭是景区里的连锁摊，
  // 许可证越多进的货越高档；章鱼这种水下商人只在自己的展区（local），只卖那个展区的档
  const licenses = S => (S.license ? 1 : 0) + (S.license2 ? 1 : 0) + (S.license3 ? 1 : 0);
  // 能卖到第几档：给了商人就按这家算（连锁摊看许可证，水下那种只卖自己展区那档）；没给就是哪家都算上最高能到几档
  function itemCap(S, id, mk) {
    const lim = k => { const M = MERCHANTS[k]; return M.local != null ? Math.min(M.local, licenses(S)) : licenses(S); };
    const ks = mk ? [mk] : Object.keys(MERCHANTS).filter(k => MERCHANTS[k].items.concat(MERCHANTS[k].reefItems || [], MERCHANTS[k].kelpItems || []).indexOf(id) >= 0);
    const top = Math.max.apply(null, ks.map(lim).concat([-1]));
    return ITEMS[id].area.filter(a => a <= top).length;
  }
  // 老存档（以前浅水湾什么都能升满）：超过的档次降回来，多花的钱退回去（作者 4B）；水族箱放不下的鱼先挪到盆里
  function fitShelves(g) {
    const S = g.S;
    let refund = 0;
    Object.keys(ITEMS).forEach(id => {
      const cap = itemCap(S, id), lv = lvOf(S, id);
      if (lv <= cap) return;
      for (let k = cap; k < lv; k++) refund += ITEMS[id].cost[k];
      S.lv[id] = cap;
    });
    if (!refund) return;
    S.money += refund;
    const C = caps(S);
    while (S.tank.fish.length > C.tank && S.basin.length < C.basin) { const f = S.tank.fish.pop(); S.basin.push({ sp: f.sp, size: f.size }); }
    g.panel = { kind: 'note', text: L.refund(refund) };
    save(g);
  }   // 岸上三位商人天天都在，能卖的一直都卖（作者：按天换商人对玩家不友好）
  // row、foot：judges.webp 第几行、每格脚底在第几行（量出来的）；珊瑚礁那两位在 reef/judges
  const BOSS_SETS = {
    bay: [
      { n: '胖企鹅', who: 'penguin', row: 0, foot: [151, 145, 148, 148], reward: 300, t: 150, dishes: [{ r: 'clear', f: { bass: 2 } }] },
      { n: '北极熊', who: 'bear', row: 1, foot: [154, 158, 158, 158], reward: 600, t: 180, dishes: [{ r: 'spicy', f: { squid: 1, yellow: 2 } }, { r: 'clear', f: { croaker: 1 } }] },
      { n: '大白鲨', who: 'shark', reward: 1000, t: 200, dishes: [{ r: 'spicy', f: { croaker: 2 } }, { r: 'sour', f: { bass: 2 } }], fight: 'shark' }
    ],
    // 珊瑚礁（作者 9A 10A）：大海龟慢吞吞点一道清淡的；海豚嘴刁点两道，一道复合口味；豹海豹吃完两道追下水互撞
    reef: [
      { n: '大海龟', who: 'turtle', e: '🐢', row: 0, foot: [154, 154, 154, 154], reward: 600, t: 200, dishes: [{ r: 'clear', f: { grouper: 1, butterfly: 1 } }] },
      { n: '海豚', who: 'dolphin', e: '🐬', row: 1, foot: [154, 154, 154, 154], reward: 1000, t: 200, dishes: [{ r: 'suanla', f: { clown: 3 } }, { r: 'coco', f: { butterfly: 2 } }] },
      { n: '豹海豹', who: 'leopard', e: '🦭', reward: 1600, t: 220, dishes: [{ r: 'suanla', f: { lion: 1, clown: 2 } }, { r: 'coco', f: { grouper: 2 } }], fight: 'leopard' }
    ],
    // 海草林（作者 7A 8A）：海狮嗓门大吃得快，点一道清淡的；大龙虾挑三拣四点两道，一道复合口味、一道要叶海龙；大章鱼吃完两道追下水，咬触手
    kelp: [
      { n: '海狮', who: 'sealion', e: '🦭', row: 0, foot: [154, 154, 154, 154], reward: 900, t: 200, dishes: [{ r: 'clear', f: { sheephead: 1, sardine: 1 } }] },
      { n: '大龙虾', who: 'lobster', e: '🦞', row: 1, foot: [154, 154, 154, 154], reward: 1400, t: 220, dishes: [{ r: 'tangcu', f: { sheephead: 1, sardine: 2 } }, { r: 'haidai', f: { seadragon: 1 } }] },
      { n: '大章鱼', who: 'octo', e: '🐙', reward: 2400, t: 240, dishes: [{ r: 'haidai', f: { wolfeel: 1, sardine: 2 } }, { r: 'tangcu', f: { seadragon: 1, sheephead: 1 } }], fight: 'octo' }
    ]
  };
  let BOSSES = BOSS_SETS.bay;
  const fishText = f => Object.keys(f).map(k => SPECIES[k].n + ' ×' + f[k]).join(' + ');
  const orderText = d => RECIPES[d.r].n + '：' + fishText(d.f);
  const COOK_T = 8, BEST = 0.6, BEST_W = 0.06, G0 = 0.45, G1 = 0.75;

  /* ================= 存档 ================= */
  const SAVE_KEY = 'tank6', MUTE_KEY = 'tankMute';
  // 键盘：每个动作两个键，菜单 ▸ 按键设置 里能改（存在 tankKeys，不跟存档走）；用 e.code，输入法开着也认
  const ACTS = ['u', 'd', 'l', 'r', 'dash', 'bite', 'act', 'map'];
  const KEY_DEF = { u: ['KeyW', 'ArrowUp'], d: ['KeyS', 'ArrowDown'], l: ['KeyA', 'ArrowLeft'], r: ['KeyD', 'ArrowRight'], dash: ['KeyJ', 'KeyZ'], bite: ['KeyK', 'KeyX'], act: ['KeyL', 'KeyC'], map: ['KeyM', null] };
  const KEY_OLD = { Space: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash', KeyE: 'act', Enter: 'act', NumpadEnter: 'act' };   // 以前的空格冲刺、E 用东西照样能用（没被改键占掉的时候）
  const KEYS_SAVE = 'tankKeys', MINI_KEY = 'tankMini';
  function keyMap() {
    const m = OS.save.get(KEYS_SAVE, null), out = {};
    ACTS.forEach(a => { const v = m && Array.isArray(m[a]) ? m[a].slice(0, 2) : KEY_DEF[a].slice(); while (v.length < 2) v.push(null); out[a] = v; });
    return out;
  }
  function keyName(k) {
    if (!k) return '—';
    if (/^Key[A-Z]$/.test(k)) return k.slice(3);
    if (/^Digit\d$/.test(k)) return k.slice(5);
    if (/^Numpad\d$/.test(k)) return '小键盘' + k.slice(6);
    return { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Space: '空格', ShiftLeft: '左Shift', ShiftRight: '右Shift', ControlLeft: '左Ctrl', ControlRight: '右Ctrl', AltLeft: '左Alt', AltRight: '右Alt',
      Enter: '回车', NumpadEnter: '小键盘回车', Tab: 'Tab', Backspace: '退格', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=', Backquote: '`' }[k] || k;
  }
  function newState() {
    return { v: 7, day: 1, money: 60, seal: { x: 118, y: GY, land: true }, basket: [], pearls: 0, basin: [], lv: {}, recipes: ['clear'], boss: 0, license: false, got: {}, seen: '', dex: {},
      tank: { fish: [], coins: [] }, world: null, area: 'bay', away: {} };
  }
  const lvOf = (S, id) => S.lv[id] || 0;
  const has = (S, k) => !!(S.got && S.got[k]);   // 海里找到的东西、撞开的石头、发现的暗道
  const caps = S => ({
    basket: 1 + lvOf(S, 'basket'), pot: [3, 5, 8, 12][lvOf(S, 'pot')], warm: [25, 40, 60, 90][lvOf(S, 'warm')], speed: 55 + 12 * lvOf(S, 'speed'),
    air: 20 + 10 * O2S.filter(k => has(S, k)).length + 10 * lvOf(S, 'breath'), tank: [0, 3, 6, 10, 15][lvOf(S, 'tank')], hp: 3 + lvOf(S, 'hp'), basin: 10
  });
  // 每天早上：海贝长珍珠、海底的破烂补上、浅水里漂下来一个漂流瓶
  function freshWorld(S) {
    const jx = BAY.JUNK || [288, 404, 520], dr = BAY.DRIFT || [262, 580];
    S.world = { day: S.day, clams: BAY.CLAMS.map(() => ({ pearl: true })), junk: [0, 1, 2].map(i => ({ k: ['shoe', 'can', 'tire'][i], x: jx[i] + rnd(-8, 8) })), bottle: { x: rnd(dr[0], dr[1]), money: 30 + Math.floor(rnd(0, 6)) * 10 } };
  }
  // 换展区：地形、岸上的摆法、鱼、大胃王、游客全换成那边的；没换走的（大胃王打到第几位、海里今天的样子、去过哪儿）存在 S.away 里
  const SANDBOX_OF = B => { const xs = B.SAND.map(p => p[0]), ys = B.SAND.map(p => p[1]); return [Math.min(...xs) - 20, Math.min(...ys) - 20, Math.max(...xs) + 20, Math.max(...ys) + 20]; };
  const SANDSEG_OF = B => B.SAND.map((a, i) => { const b = B.SAND[(i + 1) % B.SAND.length]; return [a[0], a[1], b[0], b[1], Math.min(a[0], b[0]) - 18, Math.min(a[1], b[1]) - 18, Math.max(a[0], b[0]) + 18, Math.max(a[1], b[1]) + 18]; });
  function setArea(id) {
    AREA = AREAS[id] ? id : 'bay'; BAY = AREAS[AREA]; LOOK = LOOKS[AREA];
    WW = BAY.WW; WH = BAY.WH; SPOT = SPOTS[AREA];
    TREASURE = Object.keys(BAY.THINGS); REGIONS = BAY.REGIONS; BOSSES = BOSS_SETS[AREA]; TOUR_POOL = POOLS[AREA];
    SANDBOX = SANDBOX_OF(BAY); SAND_SEG = SANDSEG_OF(BAY);
    POSTER.x = LOOK.cart ? 147 : 157;   // 珊瑚礁起是推车：鱼谱挂在推车最左头，别挡住掌勺的海狗
    currentBand.c = null;
  }
  const SEEN_W = () => Math.ceil(WW / 40), SEEN_H = () => Math.ceil(WH / 40);

  /* ================= 窗口 ================= */
  let G = null;
  let wonderBoot = -1;   // 北极熊和企鹅：一次开机只冒一次
  function open() {
    if (G && !G.win.isClosed) { if (G.win.minimized) OS.wm.restore(G.win); OS.wm.focus(G.win); return G.win; }
    loadArt();
    const cv = el('canvas', { class: 'tk-cv', width: String(W * SC), height: String(H * SC) });
    const root = el('div', { class: 'tk' }, [cv]);
    G = { cv, c: cv.getContext('2d'), screen: 'title', anim: 0, load: 0, btns: [], floats: [], S: null, panel: null, hold: false, ptr: null, keys: {}, mute: !!OS.save.get(MUTE_KEY, false), mini: !!OS.save.get(MINI_KEY, false),
      music: null, musicName: '', hover: null, raf: 0, last: 0, fish: [], tourists: [], session: null, boss: null, fight: null, pending: null, cam: { x: 0, y: 0 }, saveT: 0, dark: null, cracks: [], tankPellets: [] };
    G.c.imageSmoothingQuality = 'high';
    const g = G;
    const onKey = e => {
      if (OS.wm.active !== g.win || g.win.isClosed || g.screen !== 'play') return;
      const code = e.code || e.key, isDown = e.type === 'keydown';
      if (g.panel && g.panel.kind === 'keys' && g.panel.wait) { if (isDown) { e.preventDefault(); e.stopPropagation(); setKey(g, code); } return; }   // 按键设置：等着按新键
      const km = g.km || (g.km = keyMap());
      let a = ACTS.find(k => km[k].indexOf(code) >= 0);
      if (!a && KEY_OLD[code]) a = KEY_OLD[code];
      if (!a) return;
      e.preventDefault();
      if (a.length === 1) { g.keys[a] = isDown; return; }
      if (a === 'map') { if (isDown && !e.repeat && g.S) toggleMini(g); return; }
      if (a === 'act') g.actHeld = isDown;   // 按住不放：回声（珊瑚礁的海螺）
      if (isDown && !e.repeat) doAct(g, a);
    };
    g.win = OS.wm.open({ title: L.title, icon: 'game-tank', width: 382, content: root, maximizable: false, center: true, className: 'tk-win',
      onClose: () => { cancelAnimationFrame(g.raf); save(g); setMusic(g, ''); document.removeEventListener('keydown', onKey, true); document.removeEventListener('keyup', onKey, true); if (G === g) G = null; } });
    const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    // 手指：左半边是摇杆（按哪儿出在哪儿），右下角几个键，别处点一下；几根手指同时按各管各的。鼠标照旧：按住往那边走 ／ 游
    cv.addEventListener('pointerdown', e => {
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      const [x, y] = at(e); g.hover = [x, y];
      if (e.pointerType === 'touch') g.touchUI = true; else if (e.pointerType === 'mouse') g.touchUI = false;
      if (g.touchUI && padDown(g, e.pointerId, x, y)) return;
      if (g.touchUI && g.tapC) return;   // 右边已经有一根手指在点了
      down(g, x, y);
      if (g.tapC) g.tapC.id = e.pointerId;
    });
    cv.addEventListener('pointermove', e => { const [x, y] = at(e); g.hover = [x, y]; if (g.stick && g.stick.id === e.pointerId) stickMove(g, x, y); else if (g.hold) g.ptr = [x, y]; });
    const up = e => { const [x, y] = at(e); if (padUp(g, e.pointerId, x, y)) return; if (g.tapC && g.tapC.id != null && g.tapC.id !== e.pointerId) return; release(g, x, y); };
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
    if (!S.area) S.area = 'bay';
    if (!S.away) S.away = {};
    setArea(S.area);
    loadPack(LOOK.pack); if (S.license) loadPack('reef'); if (S.license2) loadPack('kelp');
    if (!S.world || (S.world.clams || []).length !== BAY.CLAMS.length) freshWorld(S);
    if (!S.got) S.got = {};
    Object.keys(S.got).forEach(k => { if (/^r_boulder/.test(k)) delete S.got[k]; });   // 打豹海豹砸碎的礁石只在那一场里碎着
    if (!S.dex) { S.dex = {}; S.basin.concat(S.basket.filter(f => f.sp), S.tank.fish).forEach(f => dexAdd(S, f.sp, f.size)); }   // 老存档：盆里、鱼篓里、水族箱里有的鱼都算认识
    g.S = S;
    g.stick = null; g.padBtn = {}; g.tapC = null; g.clamWas = []; g.mapTerr = null; g.fogDirty = true;   // 换存档：地图重算
    buildMap(g);
    g.seal = { x: S.seal.x, y: S.seal.land ? GY : S.seal.y, land: S.seal.land, vx: 0, vy: 0, face: 1, air: caps(S).air, dashT: 0, dashCD: 0, bump: 0, hurt: 0, biteT: 0, biteCD: 0, atkT: 0, atkCD: 0, clamp: null, clampCD: 0 };
    if (!g.seal.land && fieldAt(g, g.seal.x, g.seal.y) > -SEAL_R) { g.seal.land = true; g.seal.y = GY; g.seal.x = SPOT.basin; }
    g.fish = []; g.tourists = []; g.session = null; g.boss = null; g.fight = null; g.panel = null; g.pending = null; g.floats = []; g.fade = null; g.coverFade = {}; g.inBoat = 0; g.shake = 0; g.echoes = []; g.pushing = [];
    g.camSnap = true; camStep(g, 0);
    spawnAll(g);
    g.screen = 'play';
    g.saveT = 0;
    flt(g, W / 2, 100, BAY.LOOK.zone, '#fff6c0', 2.2, true);
    fitShelves(g);
  }
  // 过门：画面黑一下，切到另一个展区（作者 2B）。推车（锅和木盆）跟着海狗走，盆里的鱼两边通用（作者 1A）
  function switchArea(g, id, x, viaTunnel) {
    const S = g.S, from = AREA;
    save(g);
    S.away[AREA] = { boss: S.boss, world: S.world, seen: S.seen };
    const A = S.away[id] || {};
    delete S.away[id];
    S.boss = A.boss || 0; S.world = A.world || null; S.seen = A.seen || ''; S.area = id;
    setArea(id); loadPack(LOOK.pack);
    if (!S.world || S.world.day !== S.day || (S.world.clams || []).length !== BAY.CLAMS.length) freshWorld(S);
    g.session = null; g.boss = null; g.fight = null; g.tourists = []; g.pending = null; g.pendingW = null; g.potSteam = []; g.closeSteam = []; g.drops = []; g.echoes = []; g.pushing = [];
    g.mapTerr = null; g.fogCv = null; g.fogDirty = true; g.clamWas = []; g.coverFade = {}; g.inBoat = 0;
    buildMap(g);
    const s = g.seal;
    s.land = true; s.y = GY; s.x = x; s.vx = s.vy = 0; s.face = AREA_ORDER.indexOf(id) > AREA_ORDER.indexOf(from) ? 1 : -1; s.dashT = 0; s.clamp = null; s.air = caps(S).air;
    if (viaTunnel) { const T = tunnelsOf().find(q => q.to === from); if (T) { s.land = false; s.x = T.at[0] + T.face * 34; s.y = T.at[1]; s.face = T.face; } }   // 钻水下通道过来的：落在这边通道口外面
    spawnAll(g);
    g.camSnap = true;
    flt(g, W / 2, 100, BAY.LOOK.zone, '#fff6c0', 2.2, true);
    sfx(g, 'chime');
    save(g);
  }
  function goArea(g, id, x, viaTunnel) {
    sfx(g, viaTunnel ? 'splash' : 'click');
    g.fade = { t: 0, fn: () => switchArea(g, id, x, viaTunnel) };
  }
  // 水下通道口：珊瑚礁海沟底那个（拿到海草林许可证铁栅栏就开了，作者 2A）⇄ 海草林观察站那间的左墙；海草林最深处那个去深海沟，还没做
  const tunnelsOf = () => BAY.TUNNELS || (BAY.TUNNEL ? [{ id: 'rt', at: BAY.TUNNEL, face: -1, to: 'kelp' }] : []);
  const tunnelOpen = (S, T) => (T.to === 'kelp' ? !!S.license2 : !!T.to);
  /* ================= 地形：离墙多远的表、撞墙、落地 ================= */
  function buildMap(g) {
    const S = g.S;
    const { F, cols, rows } = BAY.build(S.got);
    g.map = { F, cols, rows, chunks: {} };
    g.floorC = {}; g.seatC = {};
    const fl = (x, y) => floorY(g, x, y);
    g.pos = {
      things: {}, vents: BAY.VENTS.map(([x, y]) => [x, fl(x, y - 12)]), clams: BAY.CLAMS.map(([x, y]) => [x, fl(x, y - 12) - 4]),
      shop: [BAY.SHOP.at[0], fl(BAY.SHOP.at[0], BAY.SHOP.at[1] - 20) - 20]
    };
    TREASURE.forEach(k => { const T = BAY.THINGS[k], [x, y] = T.at; g.pos.things[k] = T.k === 'gear' || T.k === 'o2' ? [x, y] : [x, fl(x, y - 10) - 5]; });   // 装备漂着，别的落地
    g.urchinFly = []; g.kwCut = {};
    g.eels = (BAY.EELS || []).map(E => ({ E, t: 0, x: E.path[0][0], y: E.path[0][1], face: 1, ang: 0, tilt: 0, zap: 0, knock: 0, kx: 0, ky: 0, glowT: rnd(1, 4) }));
    g.map.GX = new Float32Array(F.length); g.map.GY = new Float32Array(F.length);
    // 洞后墙那层：船 ／ 潜水艇四周按"没有船"算离墙多远（原来是在船四周整块挖掉不画，露出一个方框，11-26 作者：潜水艇的边缘……）
    // 大礁石也一样（它们另外贴图，后墙别绕着它们糊一团；原来只有船那块不算礁石、旁边又算，接出一道竖缝，作者：这还有一条接缝）
    { const bb = BAY.BOAT.box.slice(), cs = BAY.CELL, m = 48;
      (BAY.BOULDERS || []).forEach(([x, y]) => { bb[0] = Math.min(bb[0], x - 30); bb[1] = Math.min(bb[1], y - 45); bb[2] = Math.max(bb[2], x + 30); bb[3] = Math.max(bb[3], y + 4); });
      const x0 = Math.floor((bb[0] - m) / cs) * cs, y0 = Math.floor((bb[1] - m) / cs) * cs, nx = Math.ceil((bb[2] + m - x0) / cs) + 1, ny = Math.ceil((bb[3] + m - y0) / cs) + 1, BF = new Float32Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) BF[j * nx + i] = BAY.solid(x0 + i * cs, y0 + j * cs, S.got, true, true);
      g.boatF = { x0, y0, nx, ny, F: BF }; }
    gradGrid(g, null);
    g.rc = { rock: new Map(), back: new Map() }; g.tv = -1;
    findSpots(g);
    g.snow = null; g.bubs = [];
    g.seen = new Uint8Array(SEEN_W() * SEEN_H());
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
  // 在 y0、y1 之间二分找石头面（离墙多远 = 0 的地方）
  function edgeY(g, x, y0, y1) {
    const s0 = fieldAt(g, x, y0) >= 0;
    for (let k = 0; k < 7; k++) { const m = (y0 + y1) / 2; if ((fieldAt(g, x, m) >= 0) === s0) y0 = m; else y1 = m; }
    return (y0 + y1) / 2;
  }
  // 地面、洞顶上的点：撒海草珊瑚、贴石台、放前景剪影（每次都一样）
  function findSpots(g) {
    let sd = 4242;
    const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const floors = [], ceils = [], bb = BAY.BOAT.box;
    const hidden = (x, y) => BAY.COVERS.some(Q => inRect(x, y, [Q.r[0] - 6, Q.r[1] - 6, Q.r[2] + 6, Q.r[3] + 6])) || (BAY.KWALLS || []).some(K => Math.abs(x - K.x) < K.w / 2 + 10 && Math.abs(y - K.y) < K.h / 2 + 10);
    for (let x = 10; x < WW - 10; x += 8 + R() * 16) {
      let prev = fieldAt(g, x, WY + 6);
      for (let y = WY + 9; y < WH - 3; y += 3) {
        const f = fieldAt(g, x, y);
        if (prev < -1.5 && f >= 0) { const sy = edgeY(g, x, y - 3, y), sl = fieldAt(g, x + 3, sy) - fieldAt(g, x - 3, sy); if (Math.abs(sl) < 3 && !inRect(x, sy, [bb[0] - 8, bb[1], bb[2] + 8, bb[3] + 8]) && !hidden(x, sy)) floors.push([x, sy, Math.abs(sl)]); }
        else if (prev >= 0 && f < -1.5 && y > WY + 40) { const sy = edgeY(g, x, y - 3, y), sl = fieldAt(g, x + 3, sy) - fieldAt(g, x - 3, sy); if (Math.abs(sl) < 3 && !hidden(x, sy) && !inRect(x, sy, [bb[0] - 8, bb[1] - 8, bb[2] + 8, bb[3] + 8])) ceils.push([x, sy]); }   // 沉船、潜水艇的顶棚不算洞顶（不然垂下来的石片挂到船舱里，11-26 看出来的）
        prev = f;
      }
    }
    const P = g.pos, busy = P.vents.map(v => [v[0], v[1], 34]).concat(P.clams.map(v => [v[0], v[1], 22]), Object.values(P.things).map(v => [v[0], v[1], 26]), [[P.shop[0], P.shop[1], 50]],
      BAY.INLET ? [[BAY.INLET[0], BAY.INLET[1], 44]] : [], tunnelsOf().map(T => [T.at[0], T.at[1], 50]), BAY.OCTO_ROCK ? [[BAY.OCTO_ROCK[0], BAY.OCTO_ROCK[1] - 20, 60]] : [], BAY.CRACKS.filter(K => K.shape[0] === 'ell').map(K => [K.shape[1], K.shape[2], 50]),
      (BAY.URCHINS || []).map(U => [U.x, U.y, 30]), (BAY.BOULDERS || []).map(([x, y]) => [x, y - 20, 40]), (BAY.HOLES || []).map(([x, y]) => [x, y, 22]));
    const free = (x, y) => busy.every(([bx, by, r]) => Math.hypot(bx - x, by - y) > r);
    const roomy = (x, y, dir) => fieldAt(g, x, y + dir * 46) < -10 && fieldAt(g, x - 20, y + dir * 30) < -4 && fieldAt(g, x + 20, y + dir * 30) < -4;
    const kindAt = BAY.decorKinds || ((x, y) => (y < 430 && x < 610 ? [0, 1, 0, 4, 5, 1] : y < 470 ? [2, 3, 6, 1, 2] : y < BAY.DARK_Y ? [1, 6, 0, 3] : [7, 1, 7, 6]));
    g.decor = floors.filter(([x, y, sl]) => R() < 0.42 && sl < 1.6 && free(x, y)).map(([x, y]) => { const ks = kindAt(x, y); return { x, y, k: ks[Math.floor(R() * ks.length)], s: 0.8 + R() * 0.5, ph: R() * 6 }; });
    const spaced = (list, gap, prob) => { const out = []; list.forEach(([x, y]) => { if (R() < prob && out.every(q => Math.hypot(q[0] - x, q[1] - y) > gap)) out.push([x, y]); }); return out; };
    g.fronts = spaced(floors.filter(([, y]) => y > 380), 170, 0.5).map(([x, y]) => ({ x, y, k: Math.floor(R() * 5), ph: R() * 6 }));   // 第 6 样是垂下来的，地面上不用
    g.ledges = spaced(floors.filter(([x, y]) => y > 300 && !inPoly(x, y + 2, BAY.SAND) && free(x, y) && roomy(x, y, -1)), 80, 0.6).map(([x, y]) => ({ x, y, k: Math.floor(R() * 4), up: true }))
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
    const SW = SEEN_W(), SH = SEEN_H();
    const i0 = Math.max(0, Math.floor(g.cam.x / 40)), i1 = Math.min(SW - 1, Math.floor((g.cam.x + VW) / 40)), j0 = Math.max(0, Math.floor(g.cam.y / 40)), j1 = Math.min(SH - 1, Math.floor((g.cam.y + VH) / 40));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const q = j * SW + i; if (!g.seen[q]) { g.seen[q] = 1; g.fogDirty = true; } }
  }
  const seenAt = (g, x, y) => g.seen[Math.min(SEEN_H() - 1, Math.max(0, Math.floor(y / 40))) * SEEN_W() + Math.min(SEEN_W() - 1, Math.max(0, Math.floor(x / 40)))];


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
    let size = R.king && Math.random() < R.king ? 3 : Math.random() < R.big ? 2 : Math.random() < 0.5 ? 0 : 1;
    if (SPECIES[sp].scatter && size > 2) size = 2;   // 一大群沙丁鱼个个戴王冠太怪
    const p = openAt(g, R, 20, !anywhere);
    if (!p) return;
    const mk = (x, y) => { const f = { sp, size, x, y, vx: 0, vy: 0, tx: x, ty: y, face: 1, ri, ph: Math.random() * 6, stuck: 0 }; g.fish.push(f); return f; };
    if (SPECIES[sp].school) { const lead = mk(p[0], p[1]), nn = SPECIES[sp].scatter ? 5 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 3); for (let i = 0; i < nn; i++) { const f = mk(p[0] + rnd(-10, 10), p[1] + rnd(-6, 6)); f.size = lead.size; f.lead = lead; } }
    else mk(p[0], p[1]);
  }
  // 狼鳗（作者 5A）：躲在石缝里，有东西经过就探头咬一口（掉气）；咬完露在外面一会儿再缩回去——趁这会儿叼住
  function lungeStep(g, f, dt) {
    const s = g.seal, [hx, hy, face] = BAY.HOLES[f.hole], len = SPECIES[f.sp].len[f.size];
    f.face = face;
    if (f.lcd > 0) f.lcd -= dt;
    if (!f.ls && !s.land && !g.fight && !(f.lcd > 0) && dist(s.x, s.y, hx + face * 16, hy) < 40) { f.ls = 'wind'; f.lt = 0.4; }
    else if (f.ls === 'wind' && (f.lt -= dt) <= 0) {
      f.ls = 'out'; f.lt = 1.2; sfx(g, 'tkChomp');
      if (!s.land && !(s.hurt > 0) && dist(s.x, s.y, hx + face * len, hy) < 15) {   // 正好在它嘴前面：咬一口
        s.air = Math.max(0, s.air - 4); s.vx = face * 110; s.vy = -30; s.dashT = 0; s.bump = 0.45;
        flt(g, s.x, s.y - 16, L.wolfBite, '#ffd0d0', 1.3); sfx(g, 'ysSlap'); g.shake = 0.15;
      }
    } else if (f.ls === 'out' && (f.lt -= dt) <= 0) { f.ls = null; f.lcd = 1.8; }
    const out = f.ls === 'out' ? clamp(Math.min((1.2 - f.lt) / 0.12, f.lt / 0.15), 0, 1) : 0;
    f.x = hx - face * 3 + face * len * 0.6 * out; f.y = hy + Math.sin(f.ph * 1.3) * 0.6;
  }
  // 石斑鱼躲在小洞里探头（作者 5A：先"攻击"顶一下赶出来）：每天早上大多数洞里有一条，越深越大
  function spawnHoles(g) {
    (BAY.HOLES || []).forEach(([x, y, face], i) => {
      if (Math.random() > 0.8) return;
      const deep = y > 800, size = deep && Math.random() < 0.25 ? 3 : Math.random() < (deep ? 0.6 : 0.2) ? 2 : Math.random() < 0.5 ? 1 : 0;
      g.fish.push({ sp: BAY.HOLE_SP || 'grouper', size, x: x - face * 3, y, vx: 0, vy: 0, tx: x, ty: y, face, ri: -1, hole: i, hide: true, ph: Math.random() * 6, stuck: 0 });
    });
  }
  function spawnAll(g) {
    g.fish = [];
    REGIONS.forEach((R, i) => { for (let k = 0; k < R.n; k++) spawnFish(g, i, true); });
    spawnHoles(g);
  }
  // 从洞里顶出来的石斑鱼：归到离它最近的那片
  const nearRegion = (x, y) => { let best = 0, bd = 1e9; REGIONS.forEach((R, i) => { const d = Math.hypot(Math.max(R.x0 - x, 0, x - R.x1), Math.max(R.y0 - y, 0, y - R.y1)); if (d < bd) { bd = d; best = i; } }); return best; };



  function fishStep(g, dt) {
    const s = g.seal;
    g.fish.forEach(f => {
      if (f.gone) return;   // 这一帧刚被叼走的
      f.ph += dt;
      if (f.glow > 0) f.glow -= dt;
      if (f.spike > 0) f.spike -= dt;
      if (f.esc > 0) { f.esc -= dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.esc <= 0) f.gone = true; return; }   // 吓跑的鱼：一溜烟没了
      if (f.ram > 0) f.ram -= dt;
      if (f.seen > 0) f.seen -= dt;
      if (f.flinch > 0) f.flinch -= dt;
      if (f.hide && SPECIES[f.sp].lunge) { lungeStep(g, f, dt); return; }
      if (f.hide) { f.x += (BAY.HOLES[f.hole][0] - f.face * 3 - f.x) * Math.min(1, dt * 3); f.y = BAY.HOLES[f.hole][1] + Math.sin(f.ph * 1.3) * 0.6; return; }   // 躲在洞里：一动不动，偶尔往外探一探
      const R = REGIONS[f.ri];
      // 被顶晕了：翻着肚皮慢慢漂，一会儿缓过来
      if (f.dizzy > 0) {
        f.dizzy -= dt;
        f.vx *= Math.pow(0.2, dt); f.vy = f.vy * Math.pow(0.2, dt) - 2 * dt;
        f.x += f.vx * dt; f.y += f.vy * dt;
        pushOut(g, f, 4);
        f.y = Math.max(WY + 8, f.y);
        return;
      }
      let tx = f.tx, ty = f.ty, boost = 1;
      const SP = SPECIES[f.sp];
      // 沙丁鱼：海狗冲过来，整群"哗"地散开，过一会儿再聚回来（作者 5A）
      if (SP.scatter && !s.land && s.dashT > 0 && !(f.flee > 0) && dist(f.x, f.y, s.x, s.y) < 56) { f.flee = 1.3; const a = Math.atan2(f.y - s.y, f.x - s.x) + rnd(-0.7, 0.7); f.fx = Math.cos(a); f.fy = Math.sin(a); }
      // 叶海龙：长得跟海草一样、几乎不动；游到跟前它一动才露馅（回声一照也亮）
      if (SP.camo) {
        if (!s.land && !(f.seen > 0) && dist(f.x, f.y, s.x, s.y) < 30) { f.seen = 3; f.flinch = 0.7; f.flee = 0.5; f.fx = f.x - s.x; f.fy = f.y - s.y; }
        if (!(f.seen > 0) && !(f.flee > 0)) boost = 0.3;
      }
      // 蝴蝶鱼胆小：海狗一靠近就往反方向跑（作者 5A：得冲刺追）
      if (SPECIES[f.sp].shy && !s.land && dist(f.x, f.y, s.x, s.y) < 46) { f.flee = 0.9; f.fx = f.x - s.x; f.fy = f.y - s.y; }
      if (f.flee > 0) { f.flee -= dt; const d0 = Math.hypot(f.fx, f.fy) || 1; tx = f.x + f.fx / d0 * 60; ty = f.y + f.fy / d0 * 40; boost = 2.6; }
      else if (f.lead && !f.lead.gone) { tx = f.lead.x + Math.sin(f.ph) * 10; ty = f.lead.y + Math.cos(f.ph * 1.3) * 6; }
      else if (dist(f.x, f.y, tx, ty) < 6 || Math.random() < dt * 0.12 || f.stuck > 0.6) { const q = openAt(g, R, 8, false); if (q) { f.tx = q[0]; f.ty = q[1]; } f.stuck = 0; tx = f.tx; ty = f.ty; }
      const sp = (14 + SPECIES[f.sp].len[f.size] * 0.3) * boost;
      const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1;
      f.vx += (dx / d * sp - f.vx) * Math.min(1, dt * 2);
      f.vy += (dy / d * sp * 0.6 - f.vy) * Math.min(1, dt * 2);
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (pushOut(g, f, 4)) f.stuck += dt;
      f.x = clamp(f.x, R.x0 - 30, R.x1 + 30); f.y = clamp(f.y, Math.max(WY + 8, R.y0 - 30), R.y1 + 30);
      if (Math.abs(f.vx) > 2) f.face = f.vx < 0 ? -1 : 1;
      // 碰到不再自动叼住，要按叼（bite）
    });
    g.fish = g.fish.filter(f => !f.gone);
    // 少了就从边上补
    g.refillT = (g.refillT || 0) + dt;
    if (g.refillT > 6) {
      g.refillT = 0;
      REGIONS.forEach((R, i) => { if (g.fish.filter(f => f.ri === i && !f.lead).length < Math.ceil(R.n * (i === 0 ? 0.5 : 1))) spawnFish(g, i, false); });   // 洞里的石斑鱼不补，第二天早上才回来
    }
  }

  /* ================= 输入 ================= */
  function toWorld(g, x, y) { return [x / Z + g.cam.x, y / Z + g.cam.y]; }
  function down(g, x, y) {
    if (g.music && g.music.paused) { const p = g.music.play(); if (p && p.catch) p.catch(() => {}); }   // 浏览器刚才不让放的，玩家一点就放
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
    g.downObj = s.land ? (wy > GY - 46 && wy < GY + 10 ? landObj(wx, wy) : null) : waterObj(g, wx, wy);
    g.tapC = { x, y, t: g.anim };
    g.hold = !g.touchUI; g.ptr = [x, y];   // 手指在右边按住不走（走用左边的摇杆）；鼠标按住照旧往那边走
    g.pending = null; g.pendingW = null;
  }
  function release(g, x, y) {
    const c = g.tapC, obj = g.downObj;
    g.hold = false; g.downObj = null; g.tapC = null;
    if (!c || !g.seal || g.screen !== 'play') return;
    if (g.anim - c.t > 0.3 || dist(x, y, c.x, c.y) > 8) return;
    if (obj) { if (g.seal.land) g.pending = obj; else g.pendingW = obj; return; }   // 点了一下东西：走 ／ 游过去再用
    if (!g.seal.land && !g.touchUI) { const [wx, wy] = toWorld(g, x, y); dash(g, [wx - g.seal.x, wy - g.seal.y]); }   // 鼠标在水里快点一下：往那边冲
  }

  /* ---------- 手机：左半边摇杆、右下角三个键 ---------- */
  const PAD = { R: 24, knob: 10, keys: { act: [W - 36, H - 42, 17], bite: [W - 76, H - 26, 13], dash: [W - 58, H - 78, 13] } };   // 最右下角留给地图按钮
  const padOn = g => !!(g.touchUI && g.screen === 'play' && g.S && !g.panel);
  function padKeyAt(g, x, y) {
    for (const k of ['act', 'bite', 'dash']) {
      if (k === 'dash' && !has(g.S, 'thruster')) continue;
      const [bx, by, r] = PAD.keys[k];
      if (dist(x, y, bx, by) < r + 4) return k;
    }
    return null;
  }
  function padDown(g, id, x, y) {
    if (!padOn(g) || !discIn()) return false;
    if (g.btns.some(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)) return false;   // 画面上的按钮（菜单、全卖了、价钱泡泡）先管
    const k = padKeyAt(g, x, y);
    if (k) { g.padBtn[id] = k; g.padHit = g.padHit || {}; g.padHit[k] = g.anim; if (k === 'act') g.actHeld = true; doAct(g, k); return true; }
    if (x < W / 2 && !g.stick) {
      const [wx, wy] = toWorld(g, x, y), s = g.seal;
      const obj = s.land ? (wy > GY - 46 && wy < GY + 10 ? landObj(wx, wy) : null) : waterObj(g, wx, wy);
      g.stick = { id, ox: x, oy: y, x, y, dx: 0, dy: 0, m: 0, t: g.anim, obj, moved: 0 };
      return true;
    }
    return false;
  }
  function stickMove(g, x, y) {
    const k = g.stick;
    k.moved = Math.max(k.moved, dist(x, y, k.x, k.y));
    let dx = x - k.ox, dy = y - k.oy;
    const d = Math.hypot(dx, dy);
    if (d > PAD.R) { k.ox += dx / d * (d - PAD.R); k.oy += dy / d * (d - PAD.R); dx = x - k.ox; dy = y - k.oy; }   // 拖出圈了，圈跟着手指走
    k.dx = dx / PAD.R; k.dy = dy / PAD.R; k.m = Math.min(1, d / PAD.R);
  }
  function padUp(g, id) {
    if (g.padBtn && g.padBtn[id]) { if (g.padBtn[id] === 'act') g.actHeld = false; delete g.padBtn[id]; return true; }
    const k = g.stick;
    if (!k || k.id !== id) return false;
    g.stick = null;
    // 在左边点了一下东西（帐篷、水族箱……）：走过去用
    if (k.obj && g.anim - k.t < 0.3 && k.moved < 8 && g.seal && g.screen === 'play' && !g.panel) { if (g.seal.land) g.pending = k.obj; else g.pendingW = k.obj; }
    return true;
  }
  // 现在往哪儿推（摇杆 ／ 方向键），没推就是 null
  function inputDir(g) {
    if (g.stick && g.stick.m > 0.18) return [g.stick.dx, g.stick.dy];
    const k = g.keys, dx = (k.r ? 1 : 0) - (k.l ? 1 : 0), dy = (k.d ? 1 : 0) - (k.u ? 1 : 0);
    return dx || dy ? [dx, dy] : null;
  }

  /* ---------- 三个动作：冲刺、叼、攻击 ／ 用 ---------- */
  function doAct(g, a) {
    if (g.screen !== 'play' || !g.S || g.panel || g.fade || g.shatter || !discIn()) return;
    if (a === 'dash') dash(g, inputDir(g));
    else if (a === 'bite') bite(g);
    else if (a === 'act') { const t = actTarget(g); if (t) { if (g.seal.land) use(g, t); else useW(g, t); } else attack(g); }
  }
  // 身边能用的东西：有就是"用"，没有就是"攻击"（作者定）
  function actTarget(g) {
    const s = g.seal;
    if (!s || g.fight || s.clamp || locked(g)) return null;
    if (!s.land) {
      const P = g.pos, cand = [['shop', P.shop]];
      if (BAY.INLET) cand.push(['valve', P.things.valve], ['inlet', BAY.INLET]);
      tunnelsOf().forEach(T => cand.push(['tunnel', [T.at[0] + T.face * 12, T.at[1]]]));
      return cand.map(([k, p]) => waterObj(g, p[0], p[1] - (k === 'valve' ? 4 : 0))).find(o => o && dist(s.x, s.y, o.x, o.y) < 34) || null;
    }
    return landObj(s.x);
  }
  // 水下能点的：章鱼小铺、进水口的阀门、拧开以后的管子口
  function waterObj(g, wx, wy) {
    const S = g.S, P = g.pos;
    if (!P || g.fight) return null;
    const list = [['shop', P.shop[0], P.shop[1], 22]];
    if (BAY.INLET) { if (!has(S, 'valve')) list.push(['valve', P.things.valve[0], P.things.valve[1] - 4, 14]); else list.push(['inlet', BAY.INLET[0], BAY.INLET[1], 18]); }
    tunnelsOf().forEach(T => list.push(['tunnel', T.at[0] + T.face * 12, T.at[1], 24, T]));
    for (const [k, x, y, r, T] of list) if (dist(wx, wy, x, y) < r) return { k, x, y, T };
    return null;
  }
  function useW(g, o) {
    if (o.k === 'shop') { g.S.got[BAY.SHOP.flag] = 1; openShop(g, BAY.SHOP.mk); }
    else if (o.k === 'tunnel') {
      const T = o.T;
      if (!tunnelOpen(g.S, T)) g.panel = { kind: 'note', text: L.tunnel };
      else if (g.session || g.boss) flt(g, g.seal.x, g.seal.y - 16, L.busy, '#ffd0d0', 1.4);   // 岸上还有一锅、大胃王在等：先别走
      else g.panel = { kind: 'ask', text: L.tunnelGo(AREAS[T.to].LOOK.zone), yes: L.pipeYes, fn: () => goArea(g, T.to, SPOTS[T.to].gateL + 24, true) };
    }
    else if (o.k === 'valve') getThing(g, 'valve');
    else if (o.k === 'inlet') pipeUp(g);
    g.hold = false;
  }
  // 岸上的东西：离得最近的那个；给了 wy（点的是屏幕）还能点到摊子柱子上的鱼谱
  const POSTER = { x: 157, y0: GY - 21, y1: GY - 11 };   // 钉在摊子左边那根柱子上（柱子在雨棚和柜台之间露出来的那段）
  function landObj(wx, wy) {
    if (wy != null && Math.abs(wx - POSTER.x) < 7 && wy > POSTER.y0 - 2 && wy < POSTER.y1 + 2) return { k: 'dex', x: POSTER.x };
    const list = [['tent', 22], ['tank', 20], ['gong', 12], ['basin', 10], ['pot', 20], ['pipe', 12], ['mA', 24], ['mB', 24], ['mC', 24], ['gate', 26], ['gateL', 22]].filter(([k]) => SPOT[k] != null).map(([k, r]) => [k, SPOT[k], r]);
    let best = null, bd = 1e9;
    for (const [k, x, r] of list) { const d = Math.abs(wx - x); if (d < r && d < bd) { bd = d; best = { k, x }; } }
    return best;
  }
  function dash(g, dir) {
    const s = g.seal;
    if (!s || s.land || s.clamp || !has(g.S, 'thruster') || g.fade || (g.fight && g.fight.grab)) return;
    let second = false;
    if (s.dashCD > 0) { if (!(s.flickOK && s.dashCD > 0.5 && has(g.S, 'k_flick'))) return; second = true; }   // 甩尾（海草林）：冲完 0.6 秒以内再按，接着再冲一下，能换方向
    let dx = s.face, dy = 0;
    if (dir) { dx = dir[0]; dy = dir[1]; }
    const d = Math.hypot(dx, dy) || 1;
    s.vx = dx / d * 170; s.vy = dy / d * 170; s.dashT = second ? 0.42 : 0.35; s.dashCD = second ? 1.2 : 1.1; s.flickOK = !second;
    if (Math.abs(dx) > 0.1) s.face = dx < 0 ? -1 : 1;
    if (second) { s.flickT = 0.45; sfx(g, 'mbWhoosh'); } else sfx(g, 'splash');
  }
  // 叼：往前咬一口，叼住嘴前面最近的那样——鱼、破烂、开着的海贝里的珍珠（作者：碰到就抓太烦，要按键）
  function bite(g) {
    const s = g.seal, S = g.S;
    if (!s || s.biteCD > 0 || locked(g)) return;
    s.biteT = 0.28; s.biteCD = g.fight && g.fight.grab ? 0.1 : 0.4;   // 被触手缠着：连按挣，按得多快挣得多快
    if (s.clamp) { struggle(g); return; }
    if (s.land) { sfx(g, 'tkChomp'); return; }
    if (g.fight) { hitShark(g); return; }   // 打大白鲨的时候，叼也是咬尾巴
    // 从身子到嘴前面这一段都算咬得到（鱼钻到肚子底下也能一扭头叼住）
    const seg = (px, py) => { const t = clamp((px - s.x) * s.face / 16, 0, 1); return dist(px, py, s.x + s.face * 16 * t, s.y); };
    let best = null, bd = 8;
    g.fish.forEach(f => { if (f.gone || f.esc > 0 || hiddenByCover(S, f.x, f.y)) return; const d = seg(f.x, f.y) - SPECIES[f.sp].len[f.size] * (f.hide && f.ls !== 'out' ? 0.2 : 0.45); if (d < bd) { bd = d; best = { k: 'fish', f }; } });
    S.world.junk.forEach(j => { if (j.gone) return; const d = seg(j.x, floorAt(g, j.x) - 3) - 5; if (d < bd) { bd = d; best = { k: 'junk', j }; } });
    g.pos.clams.forEach(([x, y], i) => { const d = seg(x, y - 4) - 4; if (d < bd) { bd = d; best = { k: 'clam', i, x, y }; } });
    if (!best) { sfx(g, 'tkChomp'); return; }
    if (best.k === 'clam') {
      const c = S.world.clams[best.i];
      if (clamOpen(g, best.i) && c.pearl) { c.pearl = false; S.pearls++; flt(g, best.x, best.y - 14, L.gotPearl, '#fff6ff', 1.4); sfx(g, 'chime'); }
      else { flt(g, best.x, best.y - 12, L.clank, '#fff', 0.8); sfx(g, 'thud'); s.vy = -30; }
      return;
    }
    if (S.basket.length >= caps(S).basket) { flt(g, s.x, s.y - 14, L.basketFull, '#fff2c0', 1.6); sfx(g, 'tkChomp'); return; }
    if (best.k === 'fish') {
      const f = best.f;
      if (f.hide && f.ls !== 'out') { flt(g, f.x, f.y - 12, L.groupHide, '#ffffff', 1.2); sfx(g, 'tkChomp'); return; }   // 石斑鱼缩在洞里：先顶出来
      if (f.hide) { f.hide = false; f.ls = null; f.ri = nearRegion(f.x, f.y); }   // 狼鳗探出来那会儿：叼住拽出来
      if (SPECIES[f.sp].butt && !(f.dizzy > 0)) { buttSeal(g, f); return; }   // 羊头鱼：先顶晕再叼
      if (SPECIES[f.sp].spiky && !has(S, 'r_gloves')) { prick(g, f); return; }   // 狮子鱼：没手套扎手
      const take = q => { q.gone = true; S.basket.push({ sp: q.sp, size: q.size }); if (dexAdd(S, q.sp, q.size)) { flt(g, s.x, s.y - 16, L.newFish(SPECIES[q.sp].n), '#fff6a0', 1.8); sfx(g, 'chime'); } };
      take(f); sfx(g, 'pop');
      if (SPECIES[f.sp].school && f.sp !== 'yellow') g.fish.forEach(q => { if (!q.gone && q.sp === f.sp && S.basket.length < caps(S).basket && dist(q.x, q.y, f.x, f.y) < 18) take(q); });   // 小丑鱼成群：冲进去一口叼好几条（作者 5A，鱼篓装得下的话）
      if (SPECIES[f.sp].scatter) g.fish.forEach(q => { if (!q.gone && q.sp === f.sp && dist(q.x, q.y, f.x, f.y) < 60) { q.flee = 1.3; const a = Math.atan2(q.y - s.y, q.x - s.x) + rnd(-0.6, 0.6); q.fx = Math.cos(a); q.fy = Math.sin(a); } });   // 沙丁鱼：叼完剩下的一哄而散
    } else { const j = best.j; j.gone = true; S.basket.push({ junk: j.k }); flt(g, j.x, floorAt(g, j.x) - 14, L.gotJunk[j.k], '#ffffff', 1.4); sfx(g, 'thud'); }
  }
  // 攻击：往前一顶。水里顶到鱼，鱼晕一会儿好叼；打大白鲨的时候咬尾巴；被海贝夹住的时候是挣扎
  function attack(g) {
    const s = g.seal;
    if (!s || s.atkCD > 0 || locked(g)) return;
    s.atkT = 0.3; s.atkCD = g.fight && g.fight.grab ? 0.1 : 0.45;
    if (s.clamp) { struggle(g); return; }
    if (s.land) { sfx(g, 'slap'); return; }
    if (g.fight) { hitShark(g); return; }
    s.vx += s.face * 40;
    const mx = s.x + s.face * 12, my = s.y;
    let hit = false;
    g.fish.forEach(f => {
      if (f.gone || dist(mx, my, f.x, f.y) - SPECIES[f.sp].len[f.size] * 0.5 >= (f.hide ? 14 : 10)) return;
      if (SPECIES[f.sp].spiky && !has(g.S, 'r_gloves')) { prick(g, f); return; }
      if (f.hide && SPECIES[f.sp].lunge && f.ls !== 'out') { flt(g, f.x, f.y - 12, L.groupHide, '#ffffff', 1.2); return; }   // 狼鳗缩在洞里顶不着
      if (f.hide) { f.hide = false; f.ls = null; f.ri = nearRegion(f.x, f.y); f.dizzy = 2.4; f.vx = f.face * 45; flt(g, f.x, f.y - 14, L.groupOut, '#fff6a0', 1.2); hit = true; return; }   // 从洞里顶出来，晕着往外漂
      f.dizzy = 2.2; f.lead = null; f.vx = s.face * 30; hit = true;
    });
    sfx(g, hit ? 'ysSlap' : 'slap');
  }
  // 扎了一下：海狗被弹开（狮子鱼、海胆；作者 5A 4A）
  function prick(g, f, text) {
    const s = g.seal;
    if (s.prickCD > 0) return;
    s.prickCD = 0.8;
    const d = dist(s.x, s.y, f.x, f.y) || 1;
    s.vx = (s.x - f.x) / d * 110; s.vy = (s.y - f.y) / d * 110; s.dashT = 0; s.bump = 0.45;
    if (f.sp) f.spike = 1;
    flt(g, s.x, s.y - 16, text || L.lionOuch, '#ffd0d0', 1.3); sfx(g, 'ysSlap'); g.shake = 0.12;
  }
  function struggle(g) {
    const s = g.seal;
    if (!s.clamp) return;
    s.clamp.t -= 0.3;
    s.clamp.kick = 0.15;
    sfx(g, 'squish');
  }
  // 图鉴：第一次抓到返回 true
  function dexAdd(S, sp, size) {
    if (!S.dex) S.dex = {};
    const first = !S.dex[sp];
    const d = S.dex[sp] || (S.dex[sp] = { n: 0, max: 0 });
    d.n++; d.max = Math.max(d.max, size);
    return first;
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
      want = g.fight ? 'fight' : g.boss ? 'tense' : (g.seal.land || g.screen === 'tank' ? 'day' : 'night') + LOOK.music;
      g.saveT += dt;
      if (g.saveT > 20) { g.saveT = 0; save(g); }
    }
    setMusic(g, g.mute || OS.boot.state !== 'desktop' ? '' : want);   // 蓝屏、关机的时候也停
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
  // 锅的热气（岸上一份、特写一份）
  const PUFFS = {};
  function puffImg(col) {
    if (PUFFS[col]) return PUFFS[col];
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const x = cv.getContext('2d'), r = x.createRadialGradient(32, 32, 0, 32, 32, 32), c3 = { w: '255,255,255', g: '255,226,150', k: '46,40,38' }[col];
    r.addColorStop(0, 'rgba(' + c3 + ',1)'); r.addColorStop(0.45, 'rgba(' + c3 + ',.5)'); r.addColorStop(1, 'rgba(' + c3 + ',0)');
    x.fillStyle = r; x.fillRect(0, 0, 64, 64);
    return (PUFFS[col] = cv);
  }
  function steamKind(g) {
    const se = g.session;
    if (!se) return null;
    const raw = se.recipe && RECIPES[se.recipe].raw;
    if (raw) return se.phase === 'bid' || potStage(g) === 5 ? { n: 1.2, col: 'w', a: 0.18 } : null;   // 刺身：只冒一点冷气
    if (se.phase === 'bid') return { n: 2.2, col: 'w', a: 0.32 };
    const st = potStage(g);
    if (st === 0) return null;
    if (st < 4) return { n: 1.6, col: 'w', a: 0.28 };
    if (st === 4) return { n: 6, col: 'w', a: 0.42 };
    if (st === 5) return { n: 8, col: 'g', a: 0.5 };
    return { n: 5, col: 'k', a: 0.6 };
  }
  function steamStep(g, dt) {
    if (!g.potSteam) { g.potSteam = []; g.closeSteam = []; }
    const K = steamKind(g);
    if (K) {
      if (Math.random() < dt * K.n) g.potSteam.push({ x: SPOT.pot + 7 + rnd(-9, 9), y: FOOT - 25, vx: rnd(-2, 2), vy: -rnd(8, 13), r: rnd(2, 3), gr: rnd(2.6, 4), t: 0, life: rnd(1.4, 2.2), col: K.col, a: K.a });
      if (g.pclBox && g.session && g.session.phase !== 'bid' && Math.random() < dt * K.n * 1.6) { const [bx, by, ih] = g.pclBox; g.closeSteam.push({ x: bx + rnd(-ih * 0.35, ih * 0.35), y: by + rnd(-ih * 0.2, ih * 0.25), vx: rnd(-3, 3), vy: -rnd(10, 18), r: rnd(5, 8), gr: rnd(8, 12), t: 0, life: rnd(1.1, 1.7), col: K.col, a: K.a * 0.9 }); }
    }
    [g.potSteam, g.closeSteam].forEach(L2 => L2.forEach(p => { p.t += dt; p.x += (p.vx + Math.sin(p.t * 3 + p.y) * 2) * dt; p.y += p.vy * dt; p.vy *= Math.pow(0.7, dt); p.r += p.gr * dt; }));
    g.potSteam = g.potSteam.filter(p => p.t < p.life);
    g.closeSteam = g.session && (g.session.phase === 'prep' || g.session.phase === 'heat') ? g.closeSteam.filter(p => p.t < p.life) : [];
  }
  function drawSteam(g, list, z) {
    if (!list || !list.length) return;
    const c = g.c;
    list.forEach(p => { const k = p.t / p.life, a = p.a * Math.min(1, p.t * 4) * (1 - k); if (a <= 0.01) return; c.globalAlpha *= 1; const ga = c.globalAlpha; c.globalAlpha = ga * a; c.drawImage(puffImg(p.col), p.x - p.r * z, p.y - p.r * z, p.r * 2 * z, p.r * 2 * z); c.globalAlpha = ga; });
  }
  // 水里飘的小白点（海雪：远的小、慢）、海狗带的小气泡
  function fxStep(g, dt) {
    steamStep(g, dt);
    dropsStep(g, dt);
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
    else if (g.boss && g.boss.phase === 'show') { tx = SHOW_CX - VW / 2; ty = 0; }   // 演戏：对着大白鲨座位和海狗中间
    else if (s.land && g.session) { tx = STALL_CX - VW / 2; ty = 0; }   // 做菜、卖鱼的时候对着摊子；大胃王来了镜头照样跟着海狗走，好去水族箱拿鱼（作者 7A）
    else { tx = s.x - VW / 2; ty = s.land ? 0 : s.y - VH / 2; }
    tx = clamp(tx, 0, WW - VW); ty = clamp(ty, 0, WH - VH);
    if (g.camSnap) g.bakeAll = true;
    const k = g.camSnap ? 1 : Math.min(1, dt * 7);
    g.cam.x += (tx - g.cam.x) * k; g.cam.y += (ty - g.cam.y) * k;
    g.camSnap = false;
  }
  // 一黑一亮（憋不住游回岸、钻管子）
  // inT 黑下去、hold 黑着、outT 亮起来（不写就是 0.45、0、0.45）
  const fadeT = F => [F.inT || 0.45, F.hold || 0, F.outT || 0.45];
  function fadeStep(g, dt) {
    const F = g.fade, [a, h, b] = fadeT(F);
    F.t += dt;
    if (F.t >= a && !F.done) { F.done = true; F.fn(); }
    if (F.sleep && F.t >= a + h && !F.woke) { F.woke = true; sfx(g, 'chime'); flt(g, W / 2, 100, L.morning, '#fff6c0', 3, true); }   // 亮起来的时候说"天亮了"
    if (F.t >= a + h + b) g.fade = null;
  }
  function locked(g) { const se = g.session; return !!g.fade || (se && ['gather', 'recipe', 'prep', 'heat'].indexOf(se.phase) >= 0) || (g.boss && g.boss.phase === 'show'); }
  function sealStep(g, dt) {
    const s = g.seal, S = g.S, C = caps(S);
    if (g.boss && g.boss.phase === 'show') { if (s.biteT > 0) s.biteT -= dt; if (s.dashT > 0) s.dashT -= dt; return; }   // 演戏的时候海狗归 showStep 管
    if (s.dashCD > 0) s.dashCD -= dt;
    if (s.bump > 0) s.bump -= dt;
    if (s.hurt > 0) s.hurt -= dt;
    ['biteT', 'biteCD', 'atkT', 'atkCD', 'clampCD', 'prickCD', 'echoCD', 'zapCD', 'flickT'].forEach(k => { if (s[k] > 0) s[k] -= dt; });
    if (g.fight && g.fight.grab) { s.vx = s.vy = 0; s.moving = false; return; }   // 被大章鱼的触手缠着：归 octoStep 管
    // 被海贝夹住：动不了，拼命挣（按叼 ／ 攻击挣得快），憋气掉得快三倍
    if (s.clamp) {
      const K = s.clamp;
      K.t -= dt; if (K.kick > 0) K.kick -= dt;
      s.x = K.x - s.face * 10; s.y = K.y - 5; s.vx = s.vy = 0; s.moving = false;
      s.air -= dt * 3;
      if (s.air <= 0) { s.air = 0; s.clamp = null; airOut(g); return; }
      if (K.t <= 0) { s.clamp = null; s.clampCD = 1.6; s.vy = -50; s.vx = -s.face * 50; flt(g, s.x, s.y - 16, L.unclamped, '#ffffff', 1.2); sfx(g, 'splash'); }
      return;
    }
    // 想去哪儿：鼠标按住的地方 ／ 摇杆 ／ 方向键 ／ 点了的东西
    let tx = null, ty = null, spd = 1;
    if (!locked(g)) {
      if (g.hold && g.ptr) { [tx, ty] = toWorld(g, g.ptr[0], g.ptr[1]); g.pending = null; }
      else if (g.stick && g.stick.m > 0.18) { tx = s.x + g.stick.dx * 60; ty = s.y + g.stick.dy * (s.land ? 40 : 60); spd = clamp(g.stick.m, 0.35, 1); g.pending = null; g.pendingW = null; }   // 摇杆推得越远越快；岸上往下推得够狠才跳水
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
        if (Math.abs(d) > 2) { s.x += Math.sign(d) * Math.min(Math.abs(d), 62 * spd * dt); s.face = Math.sign(d); }
        else s.moving = false;
      }
      s.x = clamp(s.x, 10, WW - 30);
      arriveStall(g);
      return;
    }
    // 水里
    const sp = C.speed * spd * (inKelp(g, s) ? 0.72 : 1);   // 钻海带林慢一点（作者 1A）
    if (tx != null && s.dashT <= 0) {
      const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
      if (d > 4) { s.vx += (dx / d * sp - s.vx) * Math.min(1, dt * 4); s.vy += (dy / d * sp - s.vy) * Math.min(1, dt * 4); }
      else { s.vx *= 0.85; s.vy *= 0.85; }
      // 爬上岸：在水面上、往上按（栏杆那边上不去）
      if (ty < WY - 4 && s.y <= WY + 8 && !g.fight && s.x <= RAIL) { s.land = true; s.y = GY; s.vx = s.vy = 0; s.fullSaid = false; sfx(g, 'splash'); return; }
    } else if (s.dashT <= 0) { s.vx *= Math.pow(0.4, dt); s.vy *= Math.pow(0.4, dt); }
    if (s.dashT > 0) s.dashT -= dt;
    // 水流：往左冲的有大脚蹼游得过去；往下冲的谁也顶不住
    BAY.CURRENTS.forEach(Q => {
      if (s.x < Q.x0 || s.x > Q.x1 || s.y < Q.y0 || s.y > Q.y1) return;
      if (Q.fins && has(S, 'fins')) return;
      if (Q.flick && s.dashT > 0 && has(S, 'k_flick')) return;   // 海草林电鳗窝那道：甩尾连冲两下，冲着的时候推不动
      if (Q.vx < 0) s.vx = Math.min(s.vx, Q.vx); else if (Q.vx > 0) s.vx = Math.max(s.vx, Q.vx);
      if (Q.vy > 0) s.vy = Math.max(s.vy, Q.vy); else if (Q.vy < 0) s.vy = Math.min(s.vy, Q.vy);
      if ((Q.fins || Q.flick) && !(s.curSaid > 0) && tx != null && (tx - s.x) * Q.vx < 0) { s.curSaid = 2.6; flt(g, s.x, s.y - 14, L.current, '#e0f4ff', 1.6); sfx(g, 'splash'); }   // 顶着水流游：隔一会儿说一次
    });
    if (s.curSaid > 0) s.curSaid -= dt;   // 在水流边上进进出出也不会一直冒字
    // 走两小步，撞墙推回来
    const n = Math.hypot(s.vx, s.vy) * dt > 4 ? 2 : 1;
    for (let k = 0; k < n; k++) { s.x += s.vx * dt / n; s.y += s.vy * dt / n; pushOut(g, s, SEAL_R); }
    if (fieldAt(g, s.x, s.y) > 20) { s.land = true; s.y = GY; s.x = SPOT.basin; g.camSnap = true; return; }   // 万一卡进石头里：回岸上
    if (Math.abs(s.vx) > 3) s.face = s.vx < 0 ? -1 : 1;
    s.x = clamp(s.x, 8, WW - 8);
    if (s.y < WY + 4) { s.y = WY + 4; s.vy = Math.max(0, s.vy); }
    if (g.fight) { const A = BAY.FIGHT; s.x = clamp(s.x, A.x0 + 10, A.x1 - 10); s.y = clamp(s.y, A.y0 + 10, A.y1 - 8); }
    // 往下有一条线：浅水湾没头灯不敢下最黑的深海；珊瑚礁没潜水头盔下不了海沟（水压）
    const DG = BAY.DEPTH;
    if (!has(S, DG.need) && s.y > DG.y) { s.y = DG.y; s.vy = Math.min(s.vy, -20); if (!s.darkSaid) { s.darkSaid = true; flt(g, s.x, s.y - 16, L[DG.msg], '#ffe0a0', 1.8); } }
    else if (s.y < DG.y - 30) s.darkSaid = false;
    // 海胆：空手碰了扎一下弹回来；戴着手套顶上去一会儿就推开了（作者 4A）
    (BAY.URCHINS || []).forEach(U => {
      if (has(S, U.id)) return;
      const d = dist(s.x, s.y, U.x, U.y), key = 'ur_' + U.id;
      if (d > U.r + SEAL_R + 4) { s[key] = 0; return; }
      if (has(S, 'r_gloves')) { s[key] = (s[key] || 0) + dt; if (s[key] > 0.3) pushUrchin(g, U); }
      else prick(g, U, L.urchinOuch);
    });
    // 海带墙：有海带刀顶上去一会儿就割开了（作者 3A）
    (BAY.KWALLS || []).forEach(K => {
      if (has(S, K.id)) return;
      const d = Math.max(Math.abs(s.x - K.x) - K.w / 2, Math.abs(s.y - K.y) - K.h / 2), key = 'kw_' + K.id;
      if (d > SEAL_R + 4) { if (d > 30) s[key] = 0; return; }
      if (has(S, 'k_knife')) { s[key] = (s[key] || 0) + dt; if (s[key] > 0.25) cutKelp(g, K); }
      else if (!s[key]) { s[key] = 1; flt(g, s.x, s.y - 14, L.kelpWall, '#e0ffe0', 1.4); sfx(g, 'squish'); }
    });
    // 电鳗（作者 4A）：碰了被电一下（掉气、弹开、叼着的鱼吓跑一条）；穿着绝缘服就把它顶开
    if (!g.fight) (g.eels || []).forEach(e => {
      if (e.knock > 0) return;
      const ca = Math.cos(e.ang), sa = Math.sin(e.ang), d = segD(s.x, s.y, e.x - ca * 13, e.y - sa * 13, e.x + ca * 13, e.y + sa * 13);
      if (d > 5.5 + SEAL_R) return;
      if (has(S, 'k_suit')) {
        const dd = dist(e.x, e.y, s.x, s.y) || 1;
        e.knock = 1.4; e.kx = (e.x - s.x) / dd * 18; e.ky = (e.y - s.y) / dd * 18; s.vx *= 0.4; s.vy *= 0.4; sfx(g, 'thud');
        if (!s.suitSaid) { s.suitSaid = true; flt(g, s.x, s.y - 16, L.eelPush, '#e0f4ff', 1.6); }
      } else if (!(s.zapCD > 0)) zapSeal(g, e);
    });
    // 回声：按住"攻击"不放一会儿，发一圈声波（作者 4A）
    if (has(S, 'r_echo') && !g.fight) {
      if (g.actHeld && !actTarget(g)) { s.echoC = (s.echoC || 0) + dt; if (s.echoC >= 0.55 && !(s.echoCD > 0)) { emitEcho(g); s.echoC = -9; } }
      else s.echoC = 0;
    }
    // 裂了缝的石头：推进器冲过去撞开
    BAY.CRACKS.forEach(K => {
      if (has(S, K.id)) return;
      const d = BAY.sd(K.shape, s.x, s.y);
      if (d > SEAL_R + 4) { if (d > 30) s['crk_' + K.id] = false; return; }
      if (s.dashT > 0) breakCrack(g, K);
      else if (!s['crk_' + K.id]) { s['crk_' + K.id] = true; flt(g, s.x, s.y - 14, L[K.hit || (K.sub ? 'domeHit' : 'crackHit')], '#ffffff', 1.4); sfx(g, 'thud'); }
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
  // 地形改了一块（撞开石头、推开海胆、回声照出暗道）：重算这一块
  function rebuildAt(g, b) {
    const r = [b[0] - 20, b[1] - 20, b[2] + 20, b[3] + 20];
    BAY.build(g.S.got, g.map.F, r);
    gradGrid(g, r);
    clearChunks(g, r); g.floorC = {}; g.seatC = {}; g.mapTerr = null;
  }
  function shapeBB(sh) {
    if (sh[0] === 'ell') return [sh[1] - sh[3], sh[2] - sh[4], sh[1] + sh[3], sh[2] + sh[4]];
    if (sh[0] === 'tun') { const xs = sh[1].map(p => p[0]), ys = sh[1].map(p => p[1]); return [Math.min(...xs) - sh[2], Math.min(...ys) - sh[2], Math.max(...xs) + sh[2], Math.max(...ys) + sh[2]]; }
    if (sh[0] === 'rect') return sh.slice(1, 5);
    if (sh[0] === 'cap') return [Math.min(sh[1], sh[3]) - sh[5], Math.min(sh[2], sh[4]) - sh[5], Math.max(sh[1], sh[3]) + sh[5], Math.max(sh[2], sh[4]) + sh[5]];
    return [0, 0, WW, WH];
  }
  function breakCrack(g, K) {
    const S = g.S, s = g.seal;
    S.got[K.id] = 1;
    rebuildAt(g, shapeBB(K.shape));
    flt(g, s.x, s.y - 16, L[K.broke || (K.sub ? 'domeBroke' : 'crackBroke')], '#fff6a0', 1.6);
    sfx(g, 'thud'); sfx(g, 'splash');
    if (K.sub && !K.hit) sfx(g, 'ysGlass');   // 潜水艇的玻璃罩；观察站的铁舱门不是玻璃
    g.shake = 0.35;
    save(g);
  }
  function cutKelp(g, K) {
    const S = g.S, s = g.seal;
    S.got[K.id] = 1;
    rebuildAt(g, [K.x - K.w / 2, K.y - K.h / 2, K.x + K.w / 2, K.y + K.h / 2]);
    g.kwCut = g.kwCut || {}; g.kwCut[K.id] = 0.5;
    flt(g, s.x, s.y - 16, L.kelpCut, '#e0ffd0', 1.6); sfx(g, 'slap'); sfx(g, 'squish');
    save(g);
  }
  function zapSeal(g, e) {
    const s = g.seal, d = dist(s.x, s.y, e.x, e.y) || 1;
    s.zapCD = 1.2; e.zap = 0.6;
    s.vx = (s.x - e.x) / d * 120; s.vy = (s.y - e.y) / d * 120; s.dashT = 0; s.bump = 0.5;
    s.air = Math.max(0, s.air - 4);
    flt(g, s.x, s.y - 16, L.eelZap, '#d0f0ff', 1.3); sfx(g, 'buzz'); g.shake = 0.2;
    loseFish(g);
  }
  // 叼着的鱼吓跑一条（电鳗电的、羊头鱼撞的）：一溜烟游走、淡掉
  function loseFish(g) {
    const S = g.S, s = g.seal;
    let i = -1;
    for (let k = S.basket.length - 1; k >= 0; k--) if (S.basket[k].sp) { i = k; break; }
    if (i < 0) return false;
    const f = S.basket.splice(i, 1)[0];
    g.fish.push({ sp: f.sp, size: f.size, x: s.x + s.face * 10, y: s.y + 2, vx: -s.face * 50 + rnd(-10, 10), vy: rnd(-25, 5), tx: 0, ty: 0, face: -s.face, ri: -1, ph: Math.random() * 6, stuck: 0, esc: 1.4 });
    flt(g, s.x, s.y - 26, L.fishFled, '#ffe8c0', 1.4);
    return true;
  }
  // 羊头鱼（作者 5A：第一种会还手的鱼）：没顶晕就去叼，它回头撞你一下，叼着的鱼吓跑一条
  function buttSeal(g, f) {
    const s = g.seal;
    if (s.prickCD > 0) return;
    s.prickCD = 0.8; f.ram = 0.5; f.face = s.x > f.x ? 1 : -1; f.vx = f.face * 40;
    const d = dist(s.x, s.y, f.x, f.y) || 1;
    s.vx = (s.x - f.x) / d * 120; s.vy = (s.y - f.y) / d * 120 - 10; s.dashT = 0; s.bump = 0.45;
    flt(g, s.x, s.y - 16, L.sheepButt, '#ffd0c0', 1.3); sfx(g, 'mbPunch'); g.shake = 0.15;
    loseFish(g);
  }
  const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(px - ax - dx * t, py - ay - dy * t); };
  // 海带林：一根海带底下那块地面（地形算一次记住）；海狗在不在海带里（游得慢）
  const kelpFloor = (g, k) => (k.fyMap === g.map ? k.fy : (k.fyMap = g.map, k.fy = floorAt(g, k.x)));
  const inKelp = (g, s) => !!BAY.KELP && !g.fight && s.y < 470 && BAY.KELP.some(k => Math.abs(k.x - s.x) < 9 && s.y < kelpFloor(g, k));
  // 电鳗：沿着一条线来回游（被顶开的时候停一停、往旁边让开，过一会儿游回来）
  function eelPos(E, t) {
    const P = E.path, segs = [];
    let tot = 0;
    for (let i = 1; i < P.length; i++) { const l = dist(P[i - 1][0], P[i - 1][1], P[i][0], P[i][1]); segs.push(l); tot += l; }
    let u = ((t * E.sp + E.ph * 2 * tot) % (2 * tot) + 2 * tot) % (2 * tot);
    const back = u > tot;
    if (back) u = 2 * tot - u;
    for (let i = 0; i < segs.length; i++) {
      if (u <= segs[i] || i === segs.length - 1) { const k = clamp(u / segs[i], 0, 1), a = P[i], b = P[i + 1], dx = (b[0] - a[0]) * (back ? -1 : 1), dy = (b[1] - a[1]) * (back ? -1 : 1); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, dx, dy]; }
      u -= segs[i];
    }
    return [P[0][0], P[0][1], 1, 0];
  }
  function eelStep(g, dt) {
    (g.eels || []).forEach(e => {
      if (e.knock > 0) { e.knock -= dt; e.kx *= Math.pow(0.3, dt); e.ky *= Math.pow(0.3, dt); } else { e.t += dt; e.kx *= Math.pow(0.05, dt); e.ky *= Math.pow(0.05, dt); }
      const [x, y, dx, dy] = eelPos(e.E, e.t);
      e.x = x + e.kx; e.y = y + e.ky;
      if (Math.abs(dx) > 0.01) e.face = dx > 0 ? 1 : -1;
      e.ang = Math.atan2(dy, dx); e.tilt = clamp(Math.atan2(dy, Math.abs(dx)), -0.5, 0.5);
      if (e.zap > 0) e.zap -= dt;
      e.glowT -= dt; if (e.glowT <= 0) { e.zap = 0.35; e.glowT = rnd(2.5, 5); }   // 时不时自己噼啪闪一下
    });
  }
  function pushUrchin(g, U) {
    const S = g.S, s = g.seal;
    S.got[U.id] = 1;
    rebuildAt(g, [U.x - U.r, U.y - U.r, U.x + U.r, U.y + U.r]);
    g.urchinFly.push({ x: U.x, y: U.y, r: U.r, t: 0, dir: s.face });
    flt(g, s.x, s.y - 16, L.urchinPush, '#fff6a0', 1.6);
    sfx(g, 'squish'); sfx(g, 'pop');
    save(g);
  }
  // 回声：一圈声波，附近没发现的暗道露出来（只有回声找得到的那种就此打通），躲着的鱼亮一下
  function emitEcho(g) {
    const s = g.seal, S = g.S, RAD = 130;
    s.echoCD = 1.2;
    g.echoes.push({ x: s.x, y: s.y, t: 0 });
    sfx(g, 'mbRing');
    BAY.COVERS.forEach(Q => {
      if (has(S, Q.id)) return;
      const dx = Math.max(Q.r[0] - s.x, 0, s.x - Q.r[2]), dy = Math.max(Q.r[1] - s.y, 0, s.y - Q.r[3]);
      if (Math.hypot(dx, dy) < RAD) revealCover(g, Q, true);
    });
    let n = 0;
    g.fish.forEach(f => { if (!f.gone && (f.hide || hiddenByCover(S, f.x, f.y) || (SPECIES[f.sp].camo && !(f.seen > 0))) && dist(f.x, f.y, s.x, s.y) < RAD) { f.glow = 3; if (SPECIES[f.sp].camo) f.seen = 4; n++; } });
    if (n) flt(g, s.x, s.y - 26, L.echoFish, '#c0f0ff', 1.4);
  }
  function revealCover(g, Q, byEcho) {
    const S = g.S;
    S.got[Q.id] = 1;
    if (Q.echo) rebuildAt(g, Q.r); else { clearChunks(g, Q.r); g.mapTerr = null; }
    g.coverFade[Q.id] = 1;
    flt(g, (Q.r[0] + Q.r[2]) / 2, Q.r[1] - 6, byEcho ? L.echoGot : L.secret, '#ffe0ff', 1.6); sfx(g, 'chime');
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
    // 海贝、破烂要按"叼"才拿（bite）。海贝合上的那一下，海狗的嘴还在贝壳口：被夹住（作者：叼了珍珠不赶紧走就被夹）
    P.clams.forEach(([x, y], i) => {
      const open = clamOpen(g, i), was = g.clamWas[i];
      g.clamWas[i] = open;
      if (was && !open && !s.clamp && !(s.clampCD > 0) && !g.fight && dist(s.x + s.face * 11, s.y, x, y - 4) < 11) {
        s.clamp = { i, x, y, t: 2.4, kick: 0 }; s.vx = s.vy = 0; s.dashT = 0;
        flt(g, x, y - 18, L.clamped, '#ffd0d0', 1.6); sfx(g, 'tkClamp'); g.shake = 0.2;
      }
    });
    // 每天漂下来的漂流瓶
    const b = Wd.bottle;
    if (b && dist(s.x, s.y, b.x, Math.min(b.y || WY, floorAt(g, b.x) - 4)) < 12) { S.money += b.money; flt(g, s.x, s.y - 16, L.bottle.money(b.money), '#fff6a0', 2); Wd.bottle = null; sfx(g, 'ding'); }
    // 藏在海里的东西
    TREASURE.forEach(k => { if (k !== 'valve' && !has(S, k) && dist(s.x, s.y, P.things[k][0], P.things[k][1]) < 15) getThing(g, k); });   // 捡东西还是碰到就捡
    // 暗道：游进去就露出来（只有回声找得到的那种是实心的，游不进去）
    BAY.COVERS.forEach(Q => { if (!Q.echo && !has(S, Q.id) && inRect(s.x, s.y, Q.r)) revealCover(g, Q, false); });
    // 狮子鱼：空手碰一下就扎（作者 5A）
    if (!has(S, 'r_gloves')) g.fish.forEach(f => { if (!f.gone && SPECIES[f.sp].spiky && !(f.dizzy > 0) && dist(s.x, s.y, f.x, f.y) < SPECIES[f.sp].len[f.size] * 0.42 + 6) prick(g, f); });
    // 章鱼小铺、阀门、管子口：要点一下才用（waterObj ／ useW），游过去碰到不算
  }
  function getThing(g, k) {
    const S = g.S, T = BAY.THINGS[k];
    S.got[k] = 1;
    let text;
    if (T.k === 'gear') text = L.gear[k];
    else if (T.k === 'o2') { text = L.gear.o2; g.seal.air = caps(S).air; }
    else if (T.k === 'recipe') { const r = T.r || 'sour'; if (S.recipes.indexOf(r) < 0) S.recipes.push(r); text = L.bottle[r]; }
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
    g.echoes.forEach(e => { e.t += dt; }); g.echoes = g.echoes.filter(e => e.t < 1);
    g.urchinFly.forEach(u => { u.t += dt; }); g.urchinFly = g.urchinFly.filter(u => u.t < 0.9);
    if (g.kwCut) Object.keys(g.kwCut).forEach(k => { g.kwCut[k] -= dt; });
    eelStep(g, dt);
    if (g.rubble) { g.rubble.forEach(q => { q.t += dt; q.vy += 120 * dt; q.vx *= Math.pow(0.3, dt); q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt; if (fieldAt(g, q.x, q.y + q.r) > 0) { q.vy = 0; q.vr = 0; q.y -= 0.5; } }); g.rubble = g.rubble.filter(q => q.t < 1.6); }
  }


  /* ================= 岸上的东西 ================= */
  function use(g, obj) {
    const S = g.S;
    if (obj.k === 'tent') { if (g.session || g.boss) { flt(g, obj.x, GY - 30, L.busy, '#ffd0d0', 1.4); return; } g.panel = { kind: 'ask', text: L.tent, yes: L.sleep, fn: () => { sfx(g, 'click'); g.fade = { t: 0, inT: 0.8, hold: 1.6, outT: 0.9, sleep: true, fn: () => sleep(g) }; } }; }   // 睡觉的演出：慢慢黑下去，黑着打呼噜，再慢慢亮
    else if (obj.k === 'tank') openTank(g);
    else if (obj.k === 'basin') { g.panel = { kind: 'basin', sel: 0 }; g.hold = false; sfx(g, 'pop'); }
    else if (obj.k === 'dex') { g.panel = { kind: 'dex' }; g.hold = false; sfx(g, 'pop'); }
    else if (obj.k === 'pot') startSession(g);
    else if (obj.k === 'gong') gong(g);
    else if (SHORE[obj.k]) openShop(g, SHORE[obj.k]);
    else if (obj.k === 'gate' || obj.k === 'gateL') {
      if (g.session || g.boss) { flt(g, obj.x, GY - 30, L.busy, '#ffd0d0', 1.4); return; }
      const ai = AREA_ORDER.indexOf(AREA), prev = AREA_ORDER[ai - 1], next = AREA_ORDER[ai + 1];
      if (obj.k === 'gateL') g.panel = { kind: 'ask', text: L.gateBack(AREAS[prev].LOOK.zone), yes: L.gateYes, fn: () => goArea(g, prev, SPOTS[prev].gate - 24) };
      else if (!next) g.panel = { kind: 'note', text: S[LOOK.lic] ? L.gateSoon : L.gate('深海沟') };   // 再往后的展区还没做
      else g.panel = S[LOOK.lic] ? { kind: 'ask', text: L.gateGo(AREAS[next].LOOK.zone, caps(S).tank > 0), yes: L.gateYes, fn: () => goArea(g, next, SPOTS[next].gateL + 24) } : { kind: 'note', text: L.gate(AREAS[next].LOOK.zone) };
    }
    else if (obj.k === 'pipe') { if (g.session || g.boss) flt(g, obj.x, GY - 30, L.busy, '#ffd0d0', 1.4); else if (!has(S, 'valve')) g.panel = { kind: 'note', text: L.pipeShut }; else g.panel = { kind: 'ask', text: L.pipeGo, yes: L.pipeYes, fn: () => pipeDown(g) }; }
  }
  function sleep(g) {
    const S = g.S;
    S.day++;
    freshWorld(S);   // 过一天：水里的鱼、海贝的珍珠、海底的破烂、漂流瓶都补回来（作者定；商人不再按天换）；另一个展区回去的时候再补
    spawnAll(g);
    g.seal.air = caps(S).air;
    save(g);
  }
  function openShop(g, mk) { g.panel = { kind: 'shop', mk }; g.hold = false; sfx(g, 'pop'); }
  function buyItem(g, id, mk) {
    const S = g.S, it = ITEMS[id];
    const lv = lvOf(S, id);
    if (lv >= it.cost.length || lv >= itemCap(S, id, mk)) return;
    const p = it.cost[lv];
    if (S.money < p) { flt(g, W / 2, 200, L.noMoney, '#ffd0d0', 1.2, true); sfx(g, 'error'); return; }
    S.money -= p;
    S.lv[id] = lv + 1;
    if (id === 'recipeSpicy' && S.recipes.indexOf('spicy') < 0) S.recipes.push('spicy');
    if (it.recipe && S.recipes.indexOf(it.recipe) < 0) S.recipes.push(it.recipe);
    sfx(g, 'chip');
    save(g);
  }

  /* ================= 做菜 ================= */
  // 点锅：盆里有鱼就开始。大胃王在等的时候，只拿他点的鱼
  // 大胃王点的那几条鱼，盆里够不够（够的话返回要拿的那几条，先不拿）
  function bossFish(g) {
    const S = g.S, dish = BOSSES[g.boss.i].dishes[g.boss.dish], take = [], pool = S.basin.slice().sort((a, b) => b.size - a.size);
    let ok = true;
    Object.keys(dish.f).forEach(sp => { for (let k = 0; k < dish.f[sp]; k++) { const i = pool.findIndex(f => f.sp === sp); if (i < 0) { ok = false; return; } take.push(pool.splice(i, 1)[0]); } });
    if (!ok) { flt(g, SPOT.pot, GY - 34, L.needFish(fishText(dish.f)), '#ffd0d0', 2.2); sfx(g, 'error'); return null; }
    return take;
  }
  // 点锅：先弹选配方（能关掉，作者：挡住大胃王的菜单了），选定了才从盆里拿鱼
  function startSession(g) {
    const S = g.S;
    if (g.session || (g.boss && g.boss.phase !== 'order')) return;
    if (!S.basin.length) { flt(g, SPOT.pot, GY - 30, L.emptyBasin, '#ffd0d0', 1.6); return; }
    if (g.boss && !bossFish(g)) return;
    g.panel = { kind: 'recipe' }; g.pending = null; g.hold = false;
    sfx(g, 'pop');
  }
  const SLOTS = [238, 259, 280, 301, 322, 343];   // 游客站的位置：大胃王座位右边一排，前面什么都不摆
  function callTourists(g, n, judge) {
    const used = g.tourists.filter(o => o.slot != null).map(o => o.slot);
    for (let i = 0; i < n; i++) {
      const slot = SLOTS.find(s => used.indexOf(s) < 0);
      if (slot == null) break;
      used.push(slot);
      const k = pick(TOUR_POOL);
      const fromLeft = slot < SPOT.pot;
      g.tourists.push({ lane: SLOTS.indexOf(slot) % 2, k, x: fromLeft ? g.cam.x - 20 - i * 12 : g.cam.x + VW + 20 + i * 12, slot, ph: 'in', t: 0, say: judge && i < 3 ? judgeLine(g) : null, sayT: -1 - i * 0.4 });   // 先到的三位评价一句
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
    const S = g.S;
    g.panel = null;
    if (g.session) return;
    let fish;
    if (g.boss) { fish = g.boss.phase === 'order' && bossFish(g); if (!fish) return; fish.forEach(f => S.basin.splice(S.basin.indexOf(f), 1)); }
    else fish = S.basin.splice(0, caps(S).pot);
    if (!fish.length) return;
    // 平时：游客先闻着味围过来、评价这批鱼，再下锅；大胃王：直接下锅
    g.session = { phase: g.boss ? 'prep' : 'gather', t: 0, fish, recipe: r, p: 0, q: 0, warm: 0, boss: !!g.boss };
    g.seal.x = SPOT.pot - 13; g.seal.face = 1; g.pending = null; g.hold = false;
    if (!g.boss) callTourists(g, Math.max(1, Math.min(6, fish.length + 1 + Math.floor(Math.random() * 2) + LOOK.crowd)), true);
    sfx(g, 'splash');
  }
  function openPot(g) {
    const se = g.session;
    if (!se || se.phase !== 'heat') return;
    se.q = quality(se.p);
    const z = zoneName(se.p);
    const raw = RECIPES[se.recipe].raw;   // 刺身：说的是刀工
    flt(g, SPOT.pot, GY - 44, (raw ? { best: L.bestRaw, good: L.goodRaw, raw: L.rawRaw, over: L.overRaw, burnt: L.burntRaw } : { best: L.best, good: L.good, raw: L.raw, over: L.over, burnt: L.burnt })[z], z === 'best' ? '#fff27a' : '#ffffff', 1.6);
    sfx(g, z === 'best' ? 'ysWin' : z === 'burnt' ? 'buzz' : 'ding');
    if (se.boss) { bossServe(g); return; }
    se.phase = 'bid'; se.t = 0;
    g.tourists.forEach(o => { if (o.slot != null && o.ph === 'wait') makeBid(g, o); });
  }
  function fishValue(g) { const se = g.session; return se.fish.reduce((a, f) => a + SPECIES[f.sp].val[f.size], 0) / Math.max(1, se.fish.length) * STAR_MUL[RECIPES[se.recipe].star]; }
  function makeBid(g, o) {
    const se = g.session, T = TOURISTS[o.k];
    const k = Math.min(T.eat, se.fish.length);
    if (!k) return;
    const lk = likes(T, se.recipe), like = lk ? 1.25 : 1;
    o.bid = { k, p: Math.max(1, Math.round(k * fishValue(g) * se.q * like * (T.pay || 1) * LOOK.pay * rnd(0.85, 1.1))), tick: 0, n: 0, like: lk };
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
    // 吃完演一段：火候最好又是爱吃的口味 → 大演出（各有招牌）；还行 → 点头竖大拇指；火候差 → 皱眉硬咽（作者 1A 2A 3A，纯演出不加钱）
    const like = likes(TOURISTS[o.k], se.recipe);
    o.bid = null; o.ph = 'eat'; o.t = 0; o.show = { tier: se.q >= 1 && like ? 2 : se.q >= 0.6 ? 1 : 0, rec: se.recipe, cue: 0 };
    if (!se.fish.length) { endSession(g); return; }
    // 锅里剩的不够别人要的了：别的泡泡跟着改成剩几条、按条数折价（11-26 作者：只做了 4 条，3 条的和 2 条的都卖成了）
    g.tourists.forEach(q => { if (q.bid && q.bid.k > se.fish.length) { q.bid.p = Math.max(1, Math.round(q.bid.p * se.fish.length / q.bid.k)); q.bid.k = se.fish.length; q.bump = 0.4; } });
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
    if (se.phase === 'gather' && se.t > 2.4) { se.phase = 'prep'; se.t = 0; }
    else if (se.phase === 'prep' && se.t > 3.2) { se.phase = 'heat'; se.t = 0; se.p = 0; }
    else if (se.phase === 'heat') {
      se.p = Math.min(1.05, se.p + dt / COOK_T);
      // 不爱这个口味的游客，煮着煮着走了
      g.tourists.forEach(o => {
        if (o.ph !== 'wait' || o.decided) return;
        if (se.p > 0.15 + (o.slot % 7) * 0.05) {
          o.decided = true;
          const T = TOURISTS[o.k];
          const goP = hates(T, se.recipe) ? 0.8 : likes(T, se.recipe) ? 0 : 0.2;
          if (Math.random() < goP) { o.ph = 'out'; o.huff = 0.9; o.say = pick(L.leave); o.sayT = 0; o.slot = null; o.mad = hates(T, se.recipe); }
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
        if (r < go) { o.bid = null; o.ph = 'out'; o.huff = 0.9; o.slot = null; o.say = pick(L.leave); o.sayT = 0; }
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
  // 吃的演出（3 秒）：端碗夹一口 → 嚼 → 反应 → 拍肚子 → 走
  const EAT_T = 3;
  function eatStep(g, o) {
    const E = o.show || { tier: 1, cue: 0 }, t = o.t;
    if (E.cue === 0 && t > 0.45) { E.cue = 1; sfx(g, 'tkSlurp'); }
    if (E.cue === 1 && t > 0.9) { E.cue = 2; sfx(g, 'munch'); }
    if (E.cue === 2 && t > 1.3) { E.cue = 3; sfx(g, 'munch'); }
    if (E.cue === 3 && t > 1.6) {
      E.cue = 4;
      if (E.tier === 2) { o.say = L.eatBig[E.rec] || L.eatBig.clear; sfx(g, 'tkAh'); }
      else if (E.tier === 1) { o.say = pick(L.eatOk); sfx(g, 'tkAh'); }
      else { o.say = pick(L.eatBad); sfx(g, 'tkSigh'); }
      o.sayT = 0;
    }
    if (t > EAT_T) { o.ph = 'out'; o.slot = null; if (E.tier === 0) o.huff = 0.5; }
  }
  function touristStep(g, dt) {
    const se = g.session;
    g.tourists.forEach(o => {
      o.t += dt; o.sayT += dt;
      if (o.bump > 0) o.bump -= dt;
      if (o.ph === 'in') {
        const d = o.slot - o.x;
        o.x += Math.sign(d) * Math.min(Math.abs(d), 40 * dt);
        if (Math.abs(d) < 0.5) { o.ph = 'wait'; o.t = 0; if (o.sayT < 0) o.sayT = 0; if (se && se.phase === 'bid') makeBid(g, o); }
      } else if (o.ph === 'eat') eatStep(g, o);
      else if (o.ph === 'out') { if (o.huff > 0) { o.huff -= dt; return; } const dir = o.x < SPOT.pot ? -1 : 1; o.x += dir * 44 * dt; if (o.x < g.cam.x - 40 || o.x > g.cam.x + VW + 40) o.done = true; }
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
    if (S.boss >= 3) { g.panel = { kind: 'note', text: L.gongDone, secret: () => openBackdoor(g) }; return; }   // 这句话连点三下：后门
    if (g.boss && g.boss.phase === 'order') { askGiveUp(g); return; }   // 大胃王在等的时候再敲锣：问放不放弃
    if (g.session || g.boss) { flt(g, SPOT.gong, GY - 30, L.gongBusy, '#ffd0d0', 1.4); return; }
    g.panel = { kind: 'gong' }; g.hold = false; sfx(g, 'pop');   // 先看他要点什么菜（作者：敲锣前就能看到菜单）
  }
  function callBoss(g) {
    const S = g.S;
    g.panel = null;
    g.boss = { i: S.boss, dish: 0, phase: 'alarm', t: 0, left: BOSSES[S.boss].t, say: 0 };
    sfx(g, 'rxAlarm');
  }
  // 放弃挑战（作者：没学会那道菜的时候，只能干等着时间过去）：做到一半的鱼退回盆里，大胃王走人，什么都不丢
  function askGiveUp(g) { g.panel = { kind: 'ask', text: L.giveUpAsk, yes: L.giveUp, fn: () => giveUp(g) }; g.hold = false; }
  function giveUp(g) {
    const B = g.boss, S = g.S;
    if (!B || B.phase !== 'order') return;
    if (g.session) { S.basin = S.basin.concat(g.session.fish.map(f => ({ sp: f.sp, size: f.size }))); g.session = null; }
    g.boss = null;
    g.panel = { kind: 'note', text: L.gaveUp(BOSSES[B.i].n) };
    sfx(g, 'ysLose');
    save(g);
  }
  const DROP = { start: 1.0, land: 1.5, end: 2.7 };   // 大胃王进场：几秒开始掉、几秒落地、几秒开始点菜
  function bossStep(g, dt) {
    const B = g.boss;
    if (!B) return;
    B.t += dt;
    if (B.say > 0) B.say -= dt;
    if (B.eat > 0) B.eat -= dt;
    if (B.mad > 0) B.mad -= dt;
    // 进场：警报闪一秒 → 从天上掉下来 → 砸到栈道上，画面一震、起一圈灰（作者：要有进场效果）
    if (B.phase === 'alarm' && B.t >= DROP.land && !B.landed) { B.landed = true; g.shake = 0.55; sfx(g, 'mbBoom'); sfx(g, 'thud'); }
    if (B.phase === 'alarm' && B.t > DROP.end) { B.phase = 'order'; B.t = 0; B.left = BOSSES[B.i].t; g.tourists.forEach(o => { if (!o.bid && o.ph !== 'eat') { o.ph = 'out'; o.slot = null; } }); }
    else if (B.phase === 'order') {
      B.left -= dt;   // 选配方的时候面板开着，整个游戏是停的
      if (B.left <= 0) { if (g.session) { g.S.basin = g.S.basin.concat(g.session.fish); g.session = null; } g.boss = null; g.panel = { kind: 'note', text: L.bossTimeout }; sfx(g, 'ysLose'); }
    } else if (B.phase === 'show') showStep(g, dt);
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
    if (D.fight) { B.phase = 'show'; B.t = 0; B.step = 0; B.say = 0; g.pending = null; g.pendingW = null; g.hold = false; g.stick = null; g.keys = {}; return; }   // 进一段戏再打（showStep）
    S.money += D.reward; S.boss++;
    g.panel = { kind: 'note', text: L.bossPass(D.n, D.reward) };
    g.boss = null;
    sfx(g, 'ysWin');
    save(g);
  }
  // 第三位：大白鲨追下水，绕到背后咬尾巴（11-25 作者：照着尾巴连咬三下太简单）
  // 每咬中一口：它无敌、负痛游出场 → 躲一会儿 → 边上冒"！" → 从那边猛冲进来；血越少越凶：游得快、瞄得快、一口气连扑好几下、喘气的时间短
  const SHARK_PH = [
    { v: 46, tel: 0.6, lunge: 120, tired: 2.6, turn: 1.5, combo: 1 },
    { v: 56, tel: 0.48, lunge: 142, tired: 2.0, turn: 1.85, combo: 2 },
    { v: 66, tel: 0.4, lunge: 162, tired: 1.5, turn: 2.2, combo: 3 }
  ];
  const sharkAway = K => K.st === 'exit' || K.st === 'away' || K.st === 'warn' || K.st === 'enter';
  function startFight(g, keep) {
    const s = g.seal, S = g.S, A = BAY.FIGHT, kind = BOSSES[2].fight, leo = kind === 'leopard';
    g.boss.phase = 'fight';
    if (!keep) { s.land = false; s.x = A.x1 - 70; s.y = kind !== 'shark' ? (A.y0 + A.y1) / 2 - 10 : 170; g.camSnap = true; }   // 重新再来：直接摆好；从岸上跳下来的那次（keep）不挪海狗，镜头慢慢移到打架那片水
    s.vx = 0; s.vy = 0; s.dashT = 0; s.air = caps(S).air; s.hurt = 0; s.clamp = null;
    if (kind === 'octo') {
      const [rx, ry] = BAY.OCTO_ROCK, [kx, ky] = keep || [rx, ry - 40];
      g.fight = { kind: 'octo', hp: caps(S).hp, cuts: 0, arms: [], next: 2.4, ink: 0, inkIn: 0, grab: null, over: false, octo: { st: keep ? 'enter' : 'hide', t: 0, x: kx, y: ky, x0: kx, y0: ky, face: -1, hurt: 0 }, shark: { hp: OCTO_ARMS } };   // shark.hp：剩几条能咬的触手（右上角）
      flt(g, W / 2, 60, L.octoChase, '#ffd0d0', 2.2, true);
      sfx(g, 'splash');
      return;
    }
    if (leo) {
      restoreBoulders(g);   // 重新再来：礁石都在
      const [kx, ky] = keep || [A.x0 + 40, A.y0 + 60];
      g.fight = { kind: 'leopard', hp: caps(S).hp, shark: { x: kx, y: ky, a: keep ? Math.PI * 0.45 : 0, hp: LEO_HP, st: 'circle', t: 2.6, hurt: 0, combo: 0, dives: 0, orb: Math.PI }, rocks: (BAY.BOULDERS || []).map(() => 0), over: false };   // 开场先绕开一点，给海狗看清楚
      flt(g, W / 2, 60, L.leoChase, '#ffd0d0', 2.2, true);
      sfx(g, 'splash');
      return;
    }
    const [kx, ky] = keep || [340, 236];
    g.fight = { hp: caps(S).hp, shark: { x: kx, y: ky, a: keep ? Math.PI * 0.45 : 0, hp: 3, st: 'tired', t: keep ? 1.6 : 2.2, hurt: 0, combo: 0 }, over: false };   // 开场它先喘口气，给你看清楚
    flt(g, W / 2, 60, L.sharkChase, '#ffd0d0', 2.2, true);
    sfx(g, 'splash');
  }
  function fightStep(g, dt) {
    if (g.fight.kind === 'leopard') { leopardStep(g, dt); return; }
    if (g.fight.kind === 'octo') { octoStep(g, dt); return; }
    const F = g.fight, s = g.seal, K = F.shark, A = BAY.FIGHT, P = SHARK_PH[clamp(3 - K.hp, 0, 2)];
    if (F.over) return;
    if (K.hurt > 0) K.hurt -= dt;
    K.t -= dt;
    if (K.st === 'exit') {   // 负痛游出场（无敌）
      K.a = K.exitDir > 0 ? 0 : Math.PI;
      K.x += K.exitDir * 150 * dt; K.y += ((A.y0 + A.y1) / 2 - K.y) * dt;
      if (K.x < A.x0 - 70 || K.x > A.x1 + 70) { K.st = 'away'; K.t = rnd(1.0, 1.6); }
      return;
    }
    if (K.st === 'away') {   // 看不见，过一会儿在边上冒"！"
      if (K.t <= 0) { K.side = Math.random() < 0.5 ? -1 : 1; K.ey = clamp(s.y + rnd(-16, 16), A.y0 + 24, A.y1 - 52); K.st = 'warn'; K.t = 0.95 - (3 - K.hp) * 0.12; sfx(g, 'beep'); }   // 别从最底下那一条冲进来：手机上那里是按键，会挡住警告
      return;
    }
    if (K.st === 'warn') {
      if (K.t <= 0) { K.st = 'enter'; K.x = K.side < 0 ? A.x0 - 60 : A.x1 + 60; K.y = K.ey; K.a = K.side < 0 ? 0 : Math.PI; K.t = 2.4; sfx(g, 'mbWhoosh'); }
      return;
    }
    if (K.st === 'enter') {   // 从边上横着猛冲进来，冲过头了接着追
      K.x += Math.cos(K.a) * P.lunge * 1.15 * dt;
      if ((K.side < 0 && K.x > A.x1 - 50) || (K.side > 0 && K.x < A.x0 + 50) || K.t <= 0) { K.st = 'chase'; K.t = rnd(1.2, 2); K.x = clamp(K.x, A.x0 + 26, A.x1 - 26); }
    } else {
      // 追 → 张嘴瞄准 → 猛扑（越凶连扑越多下）→ 扑完累得喘（转身慢，这时候绕到背后咬尾巴）→ 再追
      if (K.t <= 0) {
        if (K.st === 'chase') { K.st = 'tel'; K.t = P.tel; K.combo = P.combo; }
        else if (K.st === 'tel') { K.st = 'lunge'; K.t = 0.7; sfx(g, 'splash'); }
        else if (K.st === 'lunge') { K.combo--; if (K.combo > 0) { K.st = 'tel'; K.t = P.tel * 0.6; } else { K.st = 'tired'; K.t = P.tired; } }
        else { K.st = 'chase'; K.t = rnd(1.6, 2.6); }
      }
      const want = Math.atan2(s.y - K.y, s.x - K.x);
      let da = want - K.a; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
      const turn = { chase: P.turn, tel: P.turn * 1.5, lunge: 0.3, tired: 0.2 }[K.st] * (K.hurt > 0 ? 0.5 : 1);
      K.a += clamp(da, -turn * dt, turn * dt);
      const v = { chase: P.v, tel: 14, lunge: P.lunge, tired: 10 }[K.st];
      K.x = clamp(K.x + Math.cos(K.a) * v * dt, A.x0 + 26, A.x1 - 26);
      K.y = clamp(K.y + Math.sin(K.a) * v * dt, A.y0 + 18, A.y1 - 14);
    }
    K.tel = K.st === 'tel' ? 1 : 0; K.lunge = K.st === 'lunge' || K.st === 'enter' ? 1 : 0;
    // 海狗在鲨鱼身上哪儿：头 ／ 尾巴。喘气的时候嘴是闭着的，撞上脑袋只会被弹开；尾巴要按"攻击"（或"叼"）才咬得到
    const [lx, ly] = sharkLocal(g);
    const LEN = 56;
    if (Math.abs(ly) < (lx < 0 ? 18 : 13) && s.hurt <= 0) {
      if (lx > LEN * 0.15 && lx < LEN * 0.55 && K.st !== 'tired') {
        F.hp--; s.hurt = 1.4; s.vx = (s.x - K.x) * 3; s.vy = (s.y - K.y) * 3; flt(g, s.x, s.y - 16, L.gotBit, '#ffd0d0', 1.2); sfx(g, 'ysSlap');
        if (F.hp <= 0) { F.over = true; g.panel = { kind: 'eaten' }; sfx(g, 'ysLose'); }
      } else if (lx > -LEN * 0.15 && lx < LEN * 0.55) { s.vx += (s.x - K.x) * 2; s.vy += (s.y - K.y) * 2; }
    }
  }
  function sharkLocal(g) {
    const s = g.seal, K = g.fight.shark;
    return [(s.x - K.x) * Math.cos(-K.a) - (s.y - K.y) * Math.sin(-K.a), (s.x - K.x) * Math.sin(-K.a) + (s.y - K.y) * Math.cos(-K.a)];
  }
  // 珊瑚礁第三位：豹海豹，互撞（作者 10A）——绕着海狗游 → 低头蓄力、身子一红 → 直线猛冲（正面挨上掉血）→ 冲过头刹车掉头（这时候用冲刺撞它）
  // 引它一头撞上礁石，晕一会儿，随便撞。
  // 11-26 作者：一通连撞就赢了、跟大白鲨差不多、血也不比鲨鱼多 → 改：
  //   5 滴血（大白鲨 3）；只有刹车掉头、撞礁石晕了这两个空当撞得进去，平时撞它身上弹回来；
  //   撞中一下它负痛无敌，一跃跳出水面不见了 → 水面上一圈红波纹跟着海狗走 → 定住 → 从上面一头扎下来（扎到礁石上也晕）→ 落地刹一下（空当）→ 接着打；
  //   每撞中一下更凶：冲得更快、蓄力更短、一口气连冲更多下、后面冲到场边会反弹接着冲、扎下来一次连扎好几下
  const LEO_HP = 5;
  const LEO_PH = [
    { v: 40, tel: 0.95, rush: 185, brake: 1.4, combo: 1, bounce: 0, dives: 1, mark: 1.3, rest: [1.6, 2.4] },
    { v: 44, tel: 0.85, rush: 200, brake: 1.25, combo: 1, bounce: 0, dives: 1, mark: 1.15, rest: [1.4, 2.1] },
    { v: 48, tel: 0.75, rush: 215, brake: 1.1, combo: 2, bounce: 1, dives: 2, mark: 1.0, rest: [1.2, 1.8] },
    { v: 52, tel: 0.66, rush: 232, brake: 1.0, combo: 2, bounce: 1, dives: 2, mark: 0.9, rest: [1.0, 1.6] },
    { v: 56, tel: 0.58, rush: 250, brake: 0.9, combo: 3, bounce: 2, dives: 3, mark: 0.8, rest: [0.9, 1.4] }
  ];
  const leoAway = K => ['hurt', 'leap', 'gone', 'mark'].indexOf(K.st) >= 0;   // 这几样的时候它不在场上（或者负痛无敌），碰不到
  const LEO_STRONG = 2;   // 还剩两滴血起（第四条血）变强
  const boulderGone = (g, i) => has(g.S, 'r_boulder' + i);
  // 往下扎砸碎礁石：这一场里那块礁石没了（地形重算），碎块往两边飞
  function shatterBoulder(g, i) {
    const [x, y] = BAY.BOULDERS[i];
    g.S.got['r_boulder' + i] = 1;
    rebuildAt(g, [x - 30, y - 50, x + 30, y + 4]);
    g.rubble = g.rubble || [];
    for (let k = 0; k < 12; k++) g.rubble.push({ x: x + rnd(-16, 16), y: y - rnd(8, 36), vx: rnd(-60, 60), vy: rnd(-70, -10), r: rnd(2, 4.5), rot: rnd(0, 6), vr: rnd(-8, 8), t: 0 });
    g.shake = 0.6; flt(g, x, y - 50, L.leoSmash, '#fff6a0', 1.4); sfx(g, 'mbBoom'); sfx(g, 'thud');
  }
  // 打完（赢了、输了、下次再来）：礁石都长回去
  function restoreBoulders(g) {
    if (!BAY.BOULDERS) return;
    BAY.BOULDERS.forEach(([x, y], i) => { if (boulderGone(g, i)) { delete g.S.got['r_boulder' + i]; rebuildAt(g, [x - 30, y - 50, x + 30, y + 4]); } });
    g.rubble = [];
  }
  function leopardStep(g, dt) {
    const F = g.fight, s = g.seal, K = F.shark, A = BAY.FIGHT, P = LEO_PH[clamp(LEO_HP - K.hp, 0, 4)];
    if (F.over) return;
    K.t -= dt; if (K.hurt > 0) K.hurt -= dt;
    const turnTo = (want, rate) => { let da = want - K.a; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; K.a += clamp(da, -rate * dt, rate * dt); };
    const toS = Math.atan2(s.y - K.y, s.x - K.x);
    const boulderAt = (hx, hy) => (BAY.BOULDERS || []).findIndex((b, i) => !boulderGone(g, i) && BAY.sd(BAY.BOULDER_SH(b), hx, hy) < 3);
    const strong = K.hp <= LEO_STRONG;
    const stunAt = bi => { K.st = 'stun'; K.t = 2.6; K.dives = 0; F.rocks[bi]++; g.shake = 0.45; flt(g, K.x, K.y - 22, L.leoRock, '#fff6a0', 1.4); sfx(g, 'mbBoom'); sfx(g, 'thud'); };
    let vx = 0, vy = 0, inside = true;   // inside：位置夹在场地里（跳出水面、扎下来的时候不夹）
    if (K.st === 'circle') {   // 绕着海狗转，离它七八十远
      K.orb = (K.orb || 0) + dt * 0.9;
      const tx = s.x + Math.cos(K.orb) * 80, ty = s.y + Math.sin(K.orb) * 46;
      turnTo(Math.atan2(ty - K.y, tx - K.x), 2.4);
      vx = Math.cos(K.a) * P.v; vy = Math.sin(K.a) * P.v;
      if (K.drunk) { K.swayT = (K.swayT == null ? 1.5 : K.swayT) - dt; if (K.swayT <= 0) { K.st = 'sway'; K.t = 1.9; K.swayT = rnd(2.2, 3.6); sfx(g, 'dizzy'); } }   // 礁石全碎了：时不时头晕、晃
      if (K.st === 'circle' && K.t <= 0 && dist(K.x, K.y, s.x, s.y) > 56) { K.st = 'aim'; K.t = P.tel; K.combo = P.combo; sfx(g, 'mbCharge'); }   // 离得太近不冲，先拉开
    } else if (K.st === 'aim') {   // 蓄力：对准海狗，身子发红；最后一小会儿方向定死了（一抖一抖的时候赶紧往旁边闪）
      K.lock = K.t < 0.32;
      if (!K.lock) turnTo(toS, 5);
      vx = Math.cos(K.a) * 6; vy = Math.sin(K.a) * 6;
      if (K.t <= 0) { K.st = 'rush'; K.t = 1.3; K.run = 0; K.bounces = P.bounce; sfx(g, 'mbWhoosh'); }
    } else if (K.st === 'rush') {   // 直线猛冲，方向不再变
      vx = Math.cos(K.a) * P.rush; vy = Math.sin(K.a) * P.rush; K.run += P.rush * dt;
      const hx = K.x + Math.cos(K.a) * 24, hy = K.y + Math.sin(K.a) * 10, bi = boulderAt(hx, hy);
      const wallX = hx < A.x0 + 8 || hx > A.x1 - 8, wallY = hy < A.y0 + 8 || hy > A.y1 - 6;
      if (bi >= 0) { stunAt(bi); vx = vy = 0; }   // 一头撞上礁石：晕
      else if ((wallX || wallY) && K.bounces > 0) { K.bounces--; if (wallX) K.a = Math.PI - K.a; if (wallY) K.a = -K.a; K.run = 0; K.t = 1.3; g.shake = 0.2; flt(g, K.x, K.y - 20, L.leoBounce, '#ffd0a0', 1); sfx(g, 'thud'); }   // 后面：冲到场边反弹回来接着冲
      else if (K.run > 230 || K.t <= 0 || wallX || wallY) { K.st = 'brake'; K.t = P.brake; K.slide = 1; sfx(g, 'splash'); }
    } else if (K.st === 'brake') {   // 冲过头刹车掉头：滑一段停下，慢慢掉头（空当）
      K.slide = Math.max(0, K.slide - dt * 3);
      vx = Math.cos(K.a) * P.rush * 0.35 * K.slide; vy = Math.sin(K.a) * P.rush * 0.35 * K.slide;
      if (K.slide <= 0) turnTo(toS, 1.3);
      if (K.t <= 0) {
        K.combo--;
        if (K.combo > 0) { K.st = 'aim'; K.t = P.tel * 0.7; sfx(g, 'mbCharge'); }
        else if (K.dives > 0) { K.st = 'leap'; K.t = 0; }   // 还要再扎：又跳出去
        else { K.st = 'circle'; K.t = rnd(P.rest[0], P.rest[1]); }
      }
    } else if (K.st === 'stun') {
      if (K.t <= 0) { K.st = 'circle'; K.t = rnd(P.rest[0], P.rest[1]); }
    } else if (K.st === 'hurt') {   // 被撞了一下：往旁边滑开（负痛无敌）
      vx = K.kx; vy = K.ky; K.kx *= Math.pow(0.08, dt); K.ky *= Math.pow(0.08, dt);
      if (K.t <= 0) { K.st = 'leap'; K.dives = P.dives; flt(g, K.x, K.y - 24, L.leoLeap, '#e0f0ff', 1.4); }
    } else if (K.st === 'leap') {   // 一跃跳出水面，不见了（无敌）
      inside = false; turnTo(-Math.PI / 2, 7);
      vx = Math.cos(K.a) * 40; vy = -230;
      if (K.y < A.y0 - 70) { K.st = 'gone'; K.t = rnd(0.7, 1.1); sfx(g, 'splash'); }
    } else if (K.st === 'gone') {
      inside = false;
      if (K.t <= 0) { K.st = 'mark'; K.t = P.mark; K.mx = clamp(s.x, A.x0 + 24, A.x1 - 24); sfx(g, 'beep'); }
    } else if (K.st === 'mark') {   // 水面上一圈红波纹跟着海狗走，最后一小会儿定住
      inside = false;
      if (K.t > 0.35) K.mx = clamp(K.mx + clamp(s.x - K.mx, -110 * dt, 110 * dt), A.x0 + 24, A.x1 - 24);
      if (K.t <= 0) { K.st = 'dive'; K.x = K.mx; K.y = A.y0 - 40; K.a = Math.PI / 2; sfx(g, 'mbWhoosh'); flt(g, K.mx, A.y0 + 20, L.leoDive, '#ffd0d0', 1); }
    } else if (K.st === 'dive') {   // 从上面一头扎下来；扎到礁石上也晕
      inside = false; vy = 300;
      const bi = boulderAt(K.x, K.y + 26);
      if (bi >= 0 && strong) {   // 第四条血起：扎下来力气太大，礁石直接砸碎，它接着往下扎
        shatterBoulder(g, bi);
        if (BAY.BOULDERS.every((b, i) => boulderGone(g, i)) && !K.drunk) { K.drunk = true; K.swayT = 2.5; flt(g, K.x, K.y - 30, L.leoDizzy, '#ffd0a0', 1.8); }
      } else if (bi >= 0) { stunAt(bi); vy = 0; }
      else if (K.y + 26 > A.y1 - 4 || fieldAt(g, K.x, K.y + 28) > 0) { K.st = 'land'; K.t = 0.45; K.dives--; g.shake = 0.3; sfx(g, 'thud'); }   // 扎到底：站稳（防着，撞不进去；只有扎到礁石上才晕）
    } else if (K.st === 'sway') {   // 像喝醉一样晃：慢慢往前飘、左右摇，这时候侧面撞得动
      turnTo((Math.cos(K.a) < 0 ? Math.PI : 0) + Math.sin(g.anim * 3) * 0.45, 3);   // 身子放平了晃，别头朝下
      vx = Math.cos(K.a) * 14 + Math.sin(g.anim * 5) * 18; vy = Math.sin(K.a) * 14 + Math.cos(g.anim * 4) * 8;
      if (K.t <= 0) { K.st = 'circle'; K.t = rnd(0.5, 1); }
    } else if (K.st === 'land') {
      turnTo(toS, 4);
      if (K.t <= 0) { if (K.dives > 0) { K.st = 'leap'; K.t = 0; } else { K.st = 'circle'; K.t = rnd(0.6, 1); } }
    }
    if (inside) {
      K.x = clamp(K.x + vx * dt, A.x0 + 22, A.x1 - 22); K.y = clamp(K.y + vy * dt, A.y0 + 14, A.y1 - 12);
      (BAY.BOULDERS || []).forEach((b, i) => { if (boulderGone(g, i)) return; const sh = BAY.BOULDER_SH(b), d = BAY.sd(sh, K.x, K.y) - 10; if (d < 0) { const nx = K.x - sh[1], ny = K.y - sh[2], nl = Math.hypot(nx, ny) || 1; K.x -= nx / nl * d; K.y -= ny / nl * d; } });   // 别钻进礁石里
    } else if (K.st !== 'gone' && K.st !== 'mark') { K.x = clamp(K.x + vx * dt, A.x0 + 22, A.x1 - 22); K.y += vy * dt; }
    K.tel = K.st === 'aim' ? 1 : 0; K.lunge = K.st === 'rush' || K.st === 'dive' ? 1 : 0;
    if (leoAway(K)) return;   // 不在场上、负痛无敌：碰不到
    // 碰上海狗了
    const [lx, ly] = sharkLocal(g);
    if (Math.abs(lx) > 28 || Math.abs(ly) > 9 + SEAL_R) return;
    if (s.dashT > 0 && ((K.st === 'brake' && !strong) || K.st === 'stun' || K.st === 'sway')) { ramLeopard(g); return; }   // 撞得进去的空当：刹车掉头（前三条血）、撞礁石晕了、头晕晃的时候
    if (K.st === 'rush' || K.st === 'dive') {   // 正面挨了它一冲 ／ 被扎下来砸中
      if (s.hurt > 0) return;
      F.hp--; s.hurt = 1.4; s.dashT = 0;
      if (K.st === 'rush') { K.st = 'brake'; K.t = P.brake; K.slide = 0.6; }   // 撞上了就刹住（扎下来的接着往下扎）
      const sd2 = ly < 0 ? -1 : 1;
      s.vx = Math.cos(K.a) * 90 - Math.sin(K.a) * 90 * sd2; s.vy = Math.sin(K.a) * 90 + Math.cos(K.a) * 90 * sd2;
      flt(g, s.x, s.y - 16, L.leoGot, '#ffd0d0', 1.2); sfx(g, 'mbPunch'); g.shake = 0.3;
      if (F.hp <= 0) { F.over = true; g.panel = { kind: 'eaten' }; sfx(g, 'ysLose'); }
      return;
    }
    if (s.dashT > 0) { s.dashT = 0; s.vx = -s.vx * 0.5; s.vy = -s.vy * 0.5; s.bump = 0.4; if (K.st === 'aim') flt(g, s.x, s.y - 16, L.leoFront, '#ffffff', 1.2); sfx(g, 'thud'); return; }   // 别的时候撞它：弹回来（不说话，作者）
    const d = dist(s.x, s.y, K.x, K.y) || 1; s.vx += (s.x - K.x) / d * 160 * dt; s.vy += (s.y - K.y) / d * 160 * dt;   // 挨着：挤开一点
  }
  function ramLeopard(g) {
    const F = g.fight, s = g.seal, K = F.shark;
    K.hp--; K.st = 'hurt'; K.t = 0.5; K.hurt = 0.8; K.kx = s.vx * 0.55; K.ky = s.vy * 0.55; K.combo = 0;
    s.dashT = 0; s.vx = -s.vx * 0.3; s.vy = -s.vy * 0.3; s.hurt = 0.6;
    flt(g, K.x, K.y - 20, L.leoHit, '#fff27a', 1.2); sfx(g, 'mbPunch'); g.shake = 0.35;
    if (K.hp <= 0) { F.over = true; K.a = Math.cos(K.a) < 0 ? Math.PI : 0; winFight(g); return; }   // 服了：躺平翻白肚皮
    flt(g, K.x, K.y - 32, K.hp === LEO_STRONG ? L.leoStrong : L.leoHurt[LEO_HP - 1 - K.hp] || L.leoHurt[0], '#ffb0a0', 1.8);   // 第四条血起变强：它自己放狠话
  }
  // 按"攻击"：嘴在尾巴那块就咬一口；咬中了它负痛游出场（离场、躲着、冲进来的时候都咬不到）
  function hitShark(g) {
    const F = g.fight, s = g.seal, K = F.shark, A = BAY.FIGHT;
    sfx(g, 'tkChomp');
    if (F.kind === 'octo') { hitOcto(g); return; }   // 大章鱼：咬触手尖、最后咬脑袋；被缠住的时候是挣
    if (F.kind === 'leopard') return;   // 豹海豹要用冲刺撞
    if (F.over || K.hurt > 0 || sharkAway(K)) return;
    const mx = s.x + s.face * 8, my = s.y;
    const lx = (mx - K.x) * Math.cos(-K.a) - (my - K.y) * Math.sin(-K.a), ly = (mx - K.x) * Math.sin(-K.a) + (my - K.y) * Math.cos(-K.a);
    const LEN = 56;
    if (!(lx < -LEN * 0.12 && lx > -LEN * 0.78 && Math.abs(ly) < 22)) return;
    K.hp--; K.hurt = 0.9; s.hurt = 0.6; s.vx = -Math.cos(K.a) * 80; s.vy = -Math.sin(K.a) * 80;
    flt(g, s.x, s.y - 16, L.bitTail, '#fff27a', 1.2); sfx(g, 'munch'); g.shake = 0.25;
    if (K.hp <= 0) { F.over = true; winFight(g); return; }
    K.st = 'exit'; K.exitDir = K.x < (A.x0 + A.x1) / 2 ? -1 : 1;
    flt(g, K.x, K.y - 20, L.sharkHurt[2 - K.hp] || L.sharkHurt[0], '#ffb0a0', 1.6);
  }
  function winFight(g) {
    const S = g.S, D = BOSSES[2], replay = g.boss && g.boss.replay;
    const WN = { bay: { lic: 'license', text: L.license, again: L.replayWin, pack: 'reef' }, reef: { lic: 'license2', recipe: 'sashimi', text: L.license2, again: L.replayWin2, pack: 'kelp' }, kelp: { lic: 'license3', recipe: 'duojiao', text: L.license3, again: L.replayWin3 } }[AREA];
    if (!replay) {   // 后门重打：不改进度、不给钱
      S.money += D.reward; S.boss = 3; S[WN.lic] = true;
      if (WN.recipe && S.recipes.indexOf(WN.recipe) < 0) S.recipes.push(WN.recipe);
      loadPack(WN.pack);
    }
    g.panel = { kind: 'note', text: replay ? WN.again : WN.text, after: () => { g.fight = null; g.boss = null; restoreBoulders(g); const s = g.seal; s.land = true; s.y = GY; s.x = SPOT.pot - 16; } };
    sfx(g, 'ysWin');
    save(g);
  }
  // 海草林第三位：大章鱼（作者 8A）——身子缩在场地中间那块大礁石后面，只露眼睛；触手从两边的密海带里伸出来抓海狗，伸之前那片海带先猛晃一下。
  // 抓住了往它嘴边拖，连按挣开，挣慢了被咬一口；抓空了停在那儿喘一下，这时候咬触手尖，咬断一条。一共 6 条，每断两条它更凶（一次伸两三条、伸得更快、还会横着扫），
  // 还喷一次墨：整屏一黑，只看得见它的两只眼睛和海狗身边一小圈，眼睛往哪边瞟触手就从哪边来。6 条都断了它从礁石后面整个扑出来满场追：躲开扑过来的那一下，绕到背后咬脑袋，它就服了
  const OCTO_ARMS = 6, ARM_SC = 0.42;   // tentacle.webp 一格 480×120 画成 202×50
  const OCTO_PH = [
    { tel: 0.95, reach: 520, rest: 1.5, max: 1, gap: [1.4, 2.0], sweep: 0, drag: 32 },
    { tel: 0.8, reach: 600, rest: 1.25, max: 2, gap: [1.1, 1.6], sweep: 0.3, drag: 38 },
    { tel: 0.66, reach: 680, rest: 1.05, max: 3, gap: [0.9, 1.3], sweep: 0.4, drag: 44 }
  ];
  const armRoot = a => { const A = BAY.FIGHT; return [a.side < 0 ? A.x0 + 14 : A.x1 - 14, a.y]; };
  const armTip = a => { const [x, y] = armRoot(a); return [x + Math.cos(a.a) * a.len, y + Math.sin(a.a) * a.len]; };
  const OCTO_HEAD_Y = () => BAY.OCTO_ROCK[1] - 95;   // 躲着露半个脑袋那格（octo 下排第 1 格）画在哪儿：切口（图里第 167 行）落在礁石顶上
  const octoMouth = () => [BAY.OCTO_ROCK[0], BAY.OCTO_ROCK[1] - 58];
  // 露半个脑袋那格：底下平着切掉的那道边淡出去，跟礁石顶接得上（礁石顶是圆的，平切口盖不严）
  function octoPeek(im) {
    if (octoPeek.im === im) return octoPeek.cv;
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 240;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 160, 320, 240, 0, 0, 320, 240);
    x.globalCompositeOperation = 'destination-in';
    const gr = x.createLinearGradient(0, 157, 0, 168); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 320, 240);
    octoPeek.im = im; octoPeek.cv = cv;
    return cv;
  }
  function octoHurtSeal(g, text, vx, vy) {
    const F = g.fight, s = g.seal;
    if (s.hurt > 0 || F.over) return;
    F.hp--; s.hurt = 1.4; s.dashT = 0; s.vx = vx; s.vy = vy;
    flt(g, s.x, s.y - 16, text, '#ffd0d0', 1.2); sfx(g, 'mbPunch'); g.shake = 0.3;
    if (F.hp <= 0) { F.over = true; F.grab = null; g.panel = { kind: 'eaten' }; sfx(g, 'ysLose'); }
  }
  function octoStep(g, dt) {
    const F = g.fight, s = g.seal, A = BAY.FIGHT, O = F.octo, [rx, ry] = BAY.OCTO_ROCK, P = OCTO_PH[clamp(Math.floor(F.cuts / 2), 0, 2)];
    O.t += dt;
    if (O.hurt > 0) O.hurt -= dt;
    if (F.over) return;
    if (F.ink > 0) { F.ink -= dt; F.inkIn += dt; }
    if (O.st === 'enter') {   // 从岸上扑下来，钻到礁石后面
      const k = clamp(O.t / 0.9, 0, 1);
      O.x = O.x0 + (rx - O.x0) * k; O.y = O.y0 + (ry - 30 - O.y0) * k;
      if (k >= 1) { O.st = 'hide'; O.t = 0; }
      return;
    }
    if (O.st === 'hide') {
      F.next -= dt;
      if (F.next <= 0 && !F.grab && F.arms.filter(a => a.st !== 'cut' && a.st !== 'back').length < P.max) {   // 从两边海带里伸一条出来（先晃）
        const side = Math.random() < 0.5 ? -1 : 1, sweep = Math.random() < P.sweep && !F.arms.some(a => a.kind === 'sweep');
        const y = clamp(s.y + rnd(-26, 26), A.y0 + 24, A.y1 - 22);
        F.arms.push({ side, y, st: 'warn', t: P.tel * (sweep ? 1.15 : 1), kind: sweep ? 'sweep' : 'grab', len: 0, a: side < 0 ? 0 : Math.PI });
        F.next = rnd(P.gap[0], P.gap[1]);
        sfx(g, 'squish');
      }
      F.arms.forEach(a => {
        a.t -= dt;
        const R = armRoot(a);
        if (a.st === 'warn') {
          if (a.t > 0) return;
          if (a.kind === 'sweep') { a.st = 'sweep'; a.len = 0; a.a = a.side < 0 ? 0 : Math.PI; sfx(g, 'mbWhoosh'); return; }
          let ang = Math.atan2(s.y - R[1], s.x - R[0]);   // 对准海狗这会儿在哪儿，伸出去就不变了
          if (a.side < 0) ang = clamp(ang, -0.75, 0.75); else { let d = ang - Math.PI; while (d < -Math.PI) d += Math.PI * 2; while (d > Math.PI) d -= Math.PI * 2; ang = Math.PI + clamp(d, -0.75, 0.75); }
          a.a = ang; a.L = Math.min(236, dist(R[0], R[1], s.x, s.y) + 26); a.st = 'reach'; a.len = 0; sfx(g, 'splash');
        } else if (a.st === 'reach') {
          a.len = Math.min(a.L, a.len + P.reach * dt);
          const [tx, ty] = armTip(a);
          if (!F.grab && !(s.hurt > 0) && dist(tx, ty, s.x, s.y) < 13) { a.st = 'grab'; F.grab = { a, t: 1.2, kick: 0 }; s.vx = s.vy = 0; s.dashT = 0; flt(g, s.x, s.y - 16, L.octoGrab, '#ffd0d0', 1.3); sfx(g, 'squish'); g.shake = 0.15; }
          else if (a.len >= a.L) { a.st = 'rest'; a.t = P.rest; }   // 抓空了：停在那儿喘一下
        } else if (a.st === 'rest') { if (a.t <= 0) a.st = 'back'; }
        else if (a.st === 'back') { a.len -= 420 * dt; if (a.len <= 0) a.gone = true; }
        else if (a.st === 'cut') { if (a.t <= 0) a.gone = true; }
        else if (a.st === 'sweep') {   // 横着扫一下：那一条横线上的都挨
          a.len = Math.min(240, a.len + 720 * dt);
          if (Math.abs(s.y - a.y) < 13 && (a.side < 0 ? s.x < R[0] + a.len : s.x > R[0] - a.len)) octoHurtSeal(g, L.octoSweep, 0, (s.y < a.y ? -1 : 1) * 110);
          if (a.len >= 240) { a.st = 'swept'; a.t = 0.3; }
        } else if (a.st === 'swept') { if (a.t <= 0) a.st = 'back'; }
      });
      F.arms = F.arms.filter(a => !a.gone);
      const G2 = F.grab;
      if (G2) {   // 缠住了：往嘴边拖
        const a = G2.a, R = armRoot(a), [mx, my] = octoMouth(), d = dist(s.x, s.y, mx, my) || 1;
        if (G2.kick > 0) G2.kick -= dt;
        s.x += (mx - s.x) / d * P.drag * dt; s.y += (my - s.y) / d * P.drag * dt; s.vx = s.vy = 0;
        a.a = Math.atan2(s.y - R[1], s.x - R[0]); a.len = dist(R[0], R[1], s.x, s.y);
        if (d < 16) { F.grab = null; a.st = 'back'; octoHurtSeal(g, L.octoChomp, (s.x < rx ? -1 : 1) * 70, -110); }
      }
      return;
    }
    // 6 条都咬断了：整个扑出来满场追
    const face = () => { O.face = s.x < O.x ? -1 : 1; };
    if (O.st === 'burst') {
      const k = clamp(O.t / 0.9, 0, 1);
      O.x = rx; O.y = ry - 30 - Math.sin(k * Math.PI * 0.5) * 90; face();
      if (k >= 1) { O.st = 'chase'; O.t = 0; O.dur = rnd(1.1, 1.6); }
    } else if (O.st === 'chase') {
      face();
      const d = dist(s.x, s.y, O.x, O.y) || 1;
      O.x += (s.x - O.x) / d * 30 * dt; O.y += (s.y - O.y) / d * 30 * dt;
      if (O.t > O.dur && d > 40) { O.st = 'tel'; O.t = 0; sfx(g, 'mbCharge'); }
    } else if (O.st === 'tel') {   // 缩一下蓄力，最后定住方向
      if (O.t < 0.45) face();
      if (O.t > 0.62) { O.st = 'pounce'; O.t = 0; O.aim = Math.atan2(s.y - O.y, s.x - O.x); O.face = Math.cos(O.aim) < 0 ? -1 : 1; sfx(g, 'mbWhoosh'); }
    } else if (O.st === 'pounce') {
      O.x += Math.cos(O.aim) * 260 * dt; O.y += Math.sin(O.aim) * 260 * dt;
      if (dist(s.x, s.y, O.x, O.y) < 24) octoHurtSeal(g, L.octoPounce, Math.cos(O.aim) * 120, Math.sin(O.aim) * 120);
      const wall = O.x < A.x0 + 32 || O.x > A.x1 - 32 || O.y < A.y0 + 26 || O.y > A.y1 - 22;
      if (O.t > 0.5 || wall) { O.st = 'stuck'; O.t = 0; g.shake = 0.25; sfx(g, 'thud'); }   // 扑过头了：背冲着你喘一会儿
    } else if (O.st === 'stuck') { if (O.t > 1.4) { O.st = 'chase'; O.t = 0; O.dur = rnd(0.9, 1.4); } }
    O.x = clamp(O.x, A.x0 + 32, A.x1 - 32); O.y = clamp(O.y, A.y0 + 26, A.y1 - 22);
    if (O.st !== 'pounce' && O.st !== 'burst') { const d = dist(s.x, s.y, O.x, O.y) || 1; if (d < 26) { s.vx += (s.x - O.x) / d * 200 * dt; s.vy += (s.y - O.y) / d * 200 * dt; } }   // 挨着：挤开
  }
  // 按"叼"／"攻击"：被缠着的时候是挣；平时咬停住的触手尖；最后那阵咬它后脑勺
  function hitOcto(g) {
    const F = g.fight, s = g.seal, O = F.octo;
    if (F.over) return;
    if (F.grab) {
      const G2 = F.grab;
      G2.t -= 0.3; G2.kick = 0.15; sfx(g, 'squish');
      if (G2.t <= 0) { const a = G2.a; F.grab = null; a.st = 'rest'; a.t = OCTO_PH[clamp(Math.floor(F.cuts / 2), 0, 2)].rest + 0.4; s.vx = Math.cos(a.a) * 70; s.vy = Math.sin(a.a) * 70 - 10; s.hurt = 0.5; flt(g, s.x, s.y - 16, L.octoFree, '#ffffff', 1.2); sfx(g, 'splash'); }
      return;
    }
    const mx = s.x + s.face * 9, my = s.y;
    if (O.st === 'hide') {
      const a = F.arms.find(q => q.kind === 'grab' && (q.st === 'rest' || q.st === 'back') && q.len > 12 && dist(mx, my, armTip(q)[0], armTip(q)[1]) < 17);
      if (!a) return;
      const [tx, ty] = armTip(a);
      a.st = 'cut'; a.t = 0.9; F.cuts++; F.shark.hp = OCTO_ARMS - F.cuts; O.hurt = 0.7;
      flt(g, tx, ty - 12, L.octoCut, '#fff27a', 1.3); sfx(g, 'munch'); g.shake = 0.25;
      g.inkPuffs = (g.inkPuffs || []).concat(Array.from({ length: 6 }, () => ({ x: tx, y: ty, vx: rnd(-30, 30), vy: rnd(-30, 20), r: rnd(3, 6), t: 0 })));   // 伤口冒墨
      if (F.cuts >= OCTO_ARMS) {   // 6 条都断了
        F.arms.forEach(q => { if (q !== a && q.st !== 'cut') q.st = 'back'; });
        F.ink = 0; O.st = 'burst'; O.t = 0;
        flt(g, BAY.OCTO_ROCK[0], BAY.OCTO_ROCK[1] - 80, L.octoOut, '#ffd0d0', 1.8); sfx(g, 'mbBoom'); g.shake = 0.5;
        return;
      }
      flt(g, BAY.OCTO_ROCK[0], BAY.OCTO_ROCK[1] - 70, L.octoHurt[(F.cuts - 1) % L.octoHurt.length], '#ffb0a0', 1.6);
      if (F.cuts % 2 === 0) { F.ink = 7.5; F.inkIn = 0; flt(g, W / 2, 70, L.octoInk, '#e0d0ff', 1.8, true); sfx(g, 'splash'); }   // 每断两条喷一次墨
      return;
    }
    if (O.st === 'stuck' && (s.x - O.x) * O.face < 0 && dist(mx, my, O.x - O.face * 16, O.y - 6) < 24) {   // 绕到背后咬脑袋：服了
      O.st = 'beat'; O.t = 0; O.hurt = 1; F.over = true; F.shark.hp = 0;
      flt(g, O.x, O.y - 30, L.octoHead, '#fff27a', 1.4); sfx(g, 'munch'); g.shake = 0.4;
      winFight(g);
      return;
    }
    if (dist(mx, my, O.x, O.y) < 30) { s.vx = (s.x - O.x) * 3; s.vy = (s.y - O.y) * 3; s.bump = 0.4; sfx(g, 'thud'); }   // 正面咬不着：弹回来
  }
  // 画大章鱼：躲着的时候礁石后面露半个脑袋（喷墨的时候只剩眼睛，在 drawInk 里画）；两边一圈密海带，触手从里面伸出来；最后那阵整个在场上
  function drawOcto(g) {
    const c = g.c, F = g.fight, O = F.octo, tm = g.anim, A = BAY.FIGHT, [rx, ry] = BAY.OCTO_ROCK, im = art('kelp/octo'), tim = art('kelp/tentacle'), rk = art('kelp/octorock'), kw = art('kelp/kelpwall'), s = g.seal;
    const body = (fr, x, y, face, sc2, rot) => { c.save(); c.translate(x, y); if (face < 0) c.scale(-1, 1); if (rot) c.rotate(rot); const z = 0.26 * (sc2 || 1); if (im) c.drawImage(im, fr * 320, 160, 320, 240, -160 * z, -120 * z, 320 * z, 240 * z); else emoji(c, '🐙', 0, 0, 40); c.restore(); };
    // 躲在礁石后面：露半个脑袋，眼睛跟着海狗转；被咬断一条的时候一缩
    if (O.st === 'hide' && !(F.ink > 0) && im) { const face = s.x < rx ? -1 : 1, dip = O.hurt > 0 ? 6 : 0; c.save(); c.translate(rx, OCTO_HEAD_Y() + Math.sin(tm * 1.5) * 1.2 + dip); if (face < 0) c.scale(-1, 1); c.drawImage(octoPeek(im), -43.2, 0, 86.4, 64.8); c.restore(); }
    if (O.st === 'enter') body(3, O.x, O.y, 1, 0.9, 0.5);
    if (rk) c.drawImage(rk, rx - 75.6, ry + 4 - 100.8, 151.2, 100.8);
    // 触手
    F.arms.forEach(a => {
      if (a.st === 'warn') return;
      const [x0, y0] = armRoot(a);
      c.save(); c.translate(x0, y0); c.rotate(a.a); if (Math.cos(a.a) < 0) c.scale(1, -1);   // 吸盘一直朝下
      if (!tim) { c.strokeStyle = '#a03050'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(a.st === 'cut' ? 20 : a.len, 0); c.stroke(); c.restore(); return; }
      if (a.st === 'cut') { c.drawImage(tim, 2 * 480, 0, 194, 120, -10, -60 * ARM_SC, 194 * ARM_SC, 120 * ARM_SC); c.restore(); return; }   // 断了：短短一截冒墨
      // 一格里"抓人的那一点"在第几列第几行：伸着 ／ 缠住（圈的中间）／ 横扫（尖）
      const [ax, ay, fr] = a.st === 'grab' ? [408, 60, 1] : a.kind === 'sweep' ? [470, 60, 3] : [452, 76, 0];
      const vis = a.len + (480 - ax) * ARM_SC, wob = a.st === 'rest' ? Math.sin(tm * 9) * 1.2 : 0;   // 喘的时候尖儿一抖一抖
      if (vis <= 480 * ARM_SC) { const sx = 480 - vis / ARM_SC; c.drawImage(tim, fr * 480 + sx, 0, 480 - sx, 120, 0, -ay * ARM_SC + wob, vis, 120 * ARM_SC); }   // 从海带后面滑出来
      else c.drawImage(tim, fr * 480, 0, 480, 120, 0, -ay * ARM_SC + wob, vis, 120 * ARM_SC);   // 伸得比图长：拉长一点
      c.restore();
    });
    // 伤口冒的墨
    (g.inkPuffs || []).forEach(p => { p.t += 1 / 60; p.x += p.vx / 60; p.y += p.vy / 60; c.globalAlpha = clamp(1.2 - p.t, 0, 1) * 0.8; c.fillStyle = '#2a1a3a'; c.beginPath(); c.arc(p.x, p.y, p.r * (1 + p.t), 0, Math.PI * 2); c.fill(); });
    c.globalAlpha = 1; g.inkPuffs = (g.inkPuffs || []).filter(p => p.t < 1.2);
    // 两边一圈密海带（触手根藏在里面）；要伸出来的那一截先猛晃
    if (kw) [-1, 1].forEach(side => {
      const x = side < 0 ? A.x0 - 6 : A.x1 - 26;
      for (let y = A.y0 - 20; y < A.y1 + 20; y += 34) {
        let sh = 0;
        F.arms.forEach(a => { if (a.st === 'warn' && a.side === side) sh += Math.sin(tm * 46 + y) * 3.2 * clamp(1 - Math.abs(y + 17 - a.y) / 40, 0, 1); });
        c.save(); c.translate(x + 16 + sh, y + 40); if (side > 0) c.scale(-1, 1); c.drawImage(kw, 0, 0, 200, 240, -16, -40, 32, 40); c.restore();
      }
      F.arms.forEach(a => { if (a.st !== 'warn' || a.side !== side) return; c.fillStyle = 'rgba(230,250,255,.75)'; for (let i = 0; i < 4; i++) { const q = (tm * 2 + i / 4) % 1; c.beginPath(); c.arc(x + 16 - side * (6 + q * 8), a.y - 6 + Math.sin(i * 2.4) * 8 - q * 10, 0.8 + q, 0, Math.PI * 2); c.fill(); } });   // 晃出来的小泡
    });
    // 最后那阵：整个在场上
    if (['burst', 'chase', 'tel', 'pounce', 'stuck', 'beat'].indexOf(O.st) >= 0) {
      const fr = O.st === 'beat' ? (O.t < 0.7 ? 4 : 5) : 3, shake = O.st === 'tel' ? Math.sin(tm * 60) * 1.2 : 0, squash = O.st === 'tel' ? 0.92 : 1;
      if (O.st === 'tel') { const r = c.createRadialGradient(O.x, O.y, 4, O.x, O.y, 40), q = 0.3 + 0.2 * Math.sin(tm * 18); r.addColorStop(0, 'rgba(255,60,90,' + q + ')'); r.addColorStop(1, 'rgba(255,60,90,0)'); c.fillStyle = r; c.beginPath(); c.arc(O.x, O.y, 40, 0, Math.PI * 2); c.fill(); }
      if (O.st === 'pounce') { c.strokeStyle = 'rgba(230,248,255,.6)'; c.lineWidth = 0.8; for (let i = 0; i < 4; i++) { const o = (i - 1.5) * 8, bx = O.x - Math.cos(O.aim) * 34, by = O.y - Math.sin(O.aim) * 34; c.beginPath(); c.moveTo(bx - Math.sin(O.aim) * o, by + Math.cos(O.aim) * o); c.lineTo(bx - Math.cos(O.aim) * 16 - Math.sin(O.aim) * o, by - Math.sin(O.aim) * 16 + Math.cos(O.aim) * o); c.stroke(); } }
      body(fr, O.x + shake, O.y, O.face, squash, O.st === 'pounce' ? Math.sin(O.aim) * O.face * 0.3 : 0);
      if (O.st === 'stuck') { c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 3; i++) c.beginPath(), c.arc(O.x + O.face * 26 + Math.sin(tm * 3 + i) * 3, O.y - 14 - ((tm * 18 + i * 7) % 20), 1.4, 0, Math.PI * 2), c.fill(); }   // 喘气冒泡
    }
  }
  // 喷墨：整屏一黑，只剩海狗身边一小圈，和礁石后面那两只发光的眼睛（眼珠往哪边瞟，下一条触手就从哪边来）
  function drawInk(g) {
    const F = g.fight;
    if (!F || F.kind !== 'octo' || !(F.ink > 0)) return;
    const s = g.seal, k = clamp(Math.min(F.inkIn / 0.5, F.ink / 0.8), 0, 1), [rx, ry] = BAY.OCTO_ROCK, im = art('kelp/octo');
    if (!g.inkCv) { g.inkCv = document.createElement('canvas'); g.inkCv.width = W * SC; g.inkCv.height = H * SC; }
    const d = g.inkCv.getContext('2d');
    d.setTransform(SC, 0, 0, SC, 0, 0); d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, W, H);
    d.fillStyle = 'rgba(8,4,16,' + 0.95 * k + ')'; d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = 'destination-out';
    const X = x => (x - g.cam.x) * Z, Y = y => (y - g.cam.y) * Z, q = d.createRadialGradient(X(s.x), Y(s.y), 0, X(s.x), Y(s.y), 30 * Z);
    q.addColorStop(0, 'rgba(0,0,0,1)'); q.addColorStop(0.6, 'rgba(0,0,0,.85)'); q.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = q; d.beginPath(); d.arc(X(s.x), Y(s.y), 30 * Z, 0, Math.PI * 2); d.fill();
    g.c.drawImage(g.inkCv, 0, 0, W, H);
    const warn = F.arms.find(a => a.st === 'warn'), side = warn ? warn.side : (s.x < rx ? -1 : 1), c = g.c, ex = X(rx), ey = Y(OCTO_HEAD_Y() + 40.5);
    c.globalAlpha = k;
    const gl = c.createRadialGradient(ex, ey, 2, ex, ey, 26); gl.addColorStop(0, 'rgba(255,220,80,.35)'); gl.addColorStop(1, 'rgba(255,220,80,0)'); c.fillStyle = gl; c.beginPath(); c.arc(ex, ey, 26, 0, Math.PI * 2); c.fill();
    if (im) c.drawImage(im, (side < 0 ? 1 : 2) * 320, 160, 320, 240, ex - 160 * 0.26 * Z, ey - 120 * 0.26 * Z, 320 * 0.26 * Z, 240 * 0.26 * Z);
    else { txt(c, ex, ey, side < 0 ? '◀ ◀' : '▶ ▶', 8, '#ffd040', 'center', true); }
    c.globalAlpha = 1;
  }
  function fightRetry(g) { g.panel = null; startFight(g); }
  function fightLater(g) { g.panel = null; g.fight = null; g.boss = null; restoreBoulders(g); const s = g.seal; s.land = true; s.y = GY; s.x = SPOT.pot - 16; s.hurt = 0; }

  // 第三位吃完两道菜：进一段戏（11-25 作者）——海狗走到栈道上固定一处 → 大白鲨说话 → 海狗吓得"！"跳下水 → 大白鲨也跳下来 → 开打
  const SAYS = { shark: [L.sharkSay1, L.sharkEye], leopard: [L.leoSay1, L.leoEye], octo: [L.octoSay1, L.octoEye] };   // 吃完两道菜说的两句
  const SHOW_SPOT = 330, SHOW_CX = 272;   // 海狗站的地方（正好在打架那片水上头）；镜头对着大白鲨座位和海狗中间
  function showStep(g, dt) {
    const B = g.boss, s = g.seal;
    s.vx = s.vy = 0;
    if (B.step === 0) {   // 走过去
      s.land = true; s.y = GY;
      const d = SHOW_SPOT - s.x;
      s.moving = Math.abs(d) > 1;
      if (s.moving) { s.x += Math.sign(d) * Math.min(Math.abs(d), 62 * dt); s.face = Math.sign(d); }
      if (!s.moving || B.t > 7) { s.moving = false; s.face = -1; B.step = 1; B.t = 0; B.line = SAYS[BOSSES[B.i].fight][0]; B.say = 1.8; }
    } else if (B.step === 1 && B.t > 1.8) { B.step = 2; B.t = 0; B.line = SAYS[BOSSES[B.i].fight][1]; B.say = 2; B.glare = 1; sfx(g, 'rxAlarm'); }
    else if (B.step === 2 && B.t > 2) { B.step = 3; B.t = 0; flt(g, s.x, GY - 30, L.scared, '#ff5a3a', 0.9); sfx(g, 'ysErr'); s.biteT = 0.28; }
    else if (B.step === 3 && B.t > 0.7) { B.step = 4; B.t = 0; B.jx = s.x; s.land = false; s.face = 1; s.dashT = 0.6; sfx(g, 'pop'); }   // 吓得跳下水
    else if (B.step === 4) {
      const k = Math.min(1, B.t / 0.55);
      s.x = B.jx + 16 * k; s.y = GY - 6 + (WY + 24 - (GY - 6)) * k - Math.sin(k * Math.PI) * 16; s.dashT = 0.3;
      if (k >= 1) { B.step = 5; B.t = 0; splash(g, s.x, WY, 1); sfx(g, 'splash'); }
    } else if (B.step === 5 && B.t > 0.5) { B.step = 6; B.t = 0; sfx(g, 'mbWhoosh'); }   // 大白鲨也跳
    else if (B.step === 6 && B.t >= 0.6) { splash(g, SHOW_SPOT - 10, WY, 2); g.shake = 0.5; sfx(g, 'splash'); sfx(g, 'mbBoom'); startFight(g, [SHOW_SPOT - 10, WY + 40]); }
  }
  // 扑通：溅起一圈水珠、水面一道圈
  function splash(g, x, y, big) {
    g.drops = g.drops || [];
    for (let i = 0; i < 10 + big * 8; i++) g.drops.push({ x: x + rnd(-6, 6) * big, y, vx: rnd(-34, 34) * big, vy: rnd(-90, -40) * (0.7 + big * 0.3), t: 0, r: rnd(0.8, 1.6) });
    g.drops.push({ ring: true, x, y, t: 0, big });
  }
  function dropsStep(g, dt) {
    if (!g.drops) return;
    g.drops.forEach(d => { d.t += dt; if (!d.ring) { d.vy += 220 * dt; d.x += d.vx * dt; d.y += d.vy * dt; } });
    g.drops = g.drops.filter(d => d.ring ? d.t < 0.8 : d.t < 1.5 && !(d.vy > 0 && d.y > WY + 2));
  }
  function drawDrops(g) {
    const c = g.c;
    (g.drops || []).forEach(d => {
      if (d.ring) { const k = d.t / 0.8; c.strokeStyle = 'rgba(235,250,255,' + (0.8 * (1 - k)) + ')'; c.lineWidth = 1; c.beginPath(); c.ellipse(d.x, d.y, 6 + k * 18 * d.big, 1.5 + k * 3, 0, 0, Math.PI * 2); c.stroke(); return; }
      c.fillStyle = 'rgba(220,245,255,.9)'; c.beginPath(); c.arc(d.x, d.y, d.r, 0, Math.PI * 2); c.fill();
    });
  }
  // 后门（作者要的，测试用）：三位大胃王都服了以后，敲锣弹出来的那句话连点三下 → 重打第三位
  function openBackdoor(g) { g.panel = { kind: 'backdoor' }; sfx(g, 'chime'); }
  function backdoor(g, how) {
    const s = g.seal;
    g.panel = null; g.session = null; g.tourists.forEach(o => { if (o.ph !== 'eat') { o.bid = null; o.ph = 'out'; o.slot = null; } });
    if (!s.land) { s.land = true; s.y = GY; s.x = SPOT.gong; g.camSnap = true; }
    if (how === 'order') { g.boss = { i: 2, dish: 0, phase: 'alarm', t: 0, left: BOSSES[2].t, say: 0, replay: true }; sfx(g, 'rxAlarm'); }
    else if (how === 'show') g.boss = { i: 2, dish: 2, phase: 'show', t: 0, step: 0, say: 0, replay: true, landed: true };
    else { g.boss = { i: 2, dish: 2, phase: 'fight', t: 0, say: 0, replay: true }; startFight(g); }
  }

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
    // 点鱼不再直接捞出来（作者：撒鱼食太容易把鱼捞走）——捞鱼去顶上"管理"里挑
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
  // icons6b 小图标（96×96 一格）：画上了返回 true，图还没到返回 false（用原来的表情符号顶着）
  function icon6b(c, i, x, y, size) {
    const im = art('icons6b');
    if (!im) return false;
    c.drawImage(im, i * 96, 0, 96, 96, x - size / 2, y - size / 2, size, size);
    return true;
  }
  function icon(c, it, x, y, size) {
    if (it.ic8 != null) { const im8 = art('kelp/icons8'); if (im8) { c.drawImage(im8, it.ic8 * 96, 0, 96, 96, x - size / 2, y - size / 2, size, size); return; } }   // 海草林那张小图标
    else if (it.ic7 != null) { const im7 = art('reef/icons7'); if (im7) { c.drawImage(im7, it.ic7 * 96, 0, 96, 96, x - size / 2, y - size / 2, size, size); return; } }   // 珊瑚礁那张小图标
    else { const im = art('icons6'); if (im && it.ic != null) { c.drawImage(im, (it.ic % 8) * 64, Math.floor(it.ic / 8) * 64, 64, 64, x - size / 2, y - size / 2, size, size); return; } }
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
    if (g.fade) {
      const F = g.fade, t = F.t, [a, h, b] = fadeT(F);
      c.fillStyle = 'rgba(0,0,0,' + clamp(t < a ? t / a : t < a + h ? 1 : 1 - (t - a - h) / b, 0, 1) + ')'; c.fillRect(0, 0, W, H);
      if (F.sleep && t > a * 0.6 && t < a + h + b * 0.3) {   // 黑着的时候：几个 Z 慢慢往上飘
        const k = clamp((t - a * 0.6) / 0.4, 0, 1) * clamp((a + h + b * 0.3 - t) / 0.4, 0, 1);
        c.globalAlpha = k;
        for (let i = 0; i < 3; i++) { const q = ((t * 0.5 + i / 3) % 1); txt(c, W / 2 + 14 + i * 9 + Math.sin(q * 6) * 3, H / 2 - 4 - q * 26, 'Z', 9 + i * 3, 'rgba(230,236,255,' + (1 - q) + ')', 'center', true); }
        txt(c, W / 2, H / 2 + 22, L.zzz, 9, '#c8d0e8', 'center', true);
        c.globalAlpha = 1;
      }
    }
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
  const shapeBox = sh => (sh[0] === 'ell' ? [sh[1] - sh[3], sh[2] - sh[4], sh[1] + sh[3], sh[2] + sh[4]] : sh[0] === 'rect' ? sh.slice(1, 5) : [-1e9, -1e9, 1e9, 1e9]);
  let SANDBOX = SANDBOX_OF(BAY);
  // 沙子和石头的分界：离沙子那圈边多远（每段线先看框，离得远的不算）；再加一点噪声让边弯弯扭扭
  let SAND_SEG = SANDSEG_OF(BAY);
  function sandEdge(x, y) {
    let d = 18;
    for (const q of SAND_SEG) {
      if (x < q[4] || x > q[6] || y < q[5] || y > q[7]) continue;
      const dx = q[2] - q[0], dy = q[3] - q[1], t = clamp(((x - q[0]) * dx + (y - q[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      d = Math.min(d, Math.hypot(x - q[0] - dx * t, y - q[1] - dy * t));
    }
    return d;
  }
  function vnoise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y), tx = x - ix, ty = y - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
  // 石头：照地形算光（光从左上来）——朝上的边一道亮边、朝下的边和石缝压暗、外圈一道深色细边，越深越暗越蓝；暗道没发现之前也画成石头
  function bakeRock(g, ci, cj) {
    const M = g.map, S = g.S, cv = document.createElement('canvas'), N = CHP + 2 * EDGE;
    cv.width = cv.height = N;
    const cx = cv.getContext('2d'), im = cx.createImageData(N, N), D = im.data;
    const T = texData(an('rock')) || procTex('_rock', [120, 110, 98], 30, 42), SD = texData(an('sand')) || procTex('_sand', [224, 200, 146], 16, 20);
    const x0 = ci * CH, y0 = cj * CH, o = [0, 0, 0], bb = BAY.BOAT.box;
    const covers = BAY.COVERS.filter(Q => !has(S, Q.id) && Q.r[2] > x0 && Q.r[0] < x0 + CH && Q.r[3] > y0 && Q.r[1] < y0 + CH);
    const sandHere = SANDBOX[2] > x0 && SANDBOX[0] < x0 + CH && SANDBOX[3] > y0 && SANDBOX[1] < y0 + CH;
    const near = (b, m) => b[2] > x0 - m && b[0] < x0 + CH + m && b[3] > y0 - m && b[1] < y0 + CH + m;
    const rocksHere = sandHere ? BAY.ROCK.filter(sh => near(shapeBox(sh), 4)).concat(BAY.CRACKS.filter(K => !has(S, K.id)).map(K => K.shape)) : [];
    const boatHere = near(bb, 4) && !BAY.BOAT.art;   // 沉船的墙涂成木头色；潜水艇的墙有图盖着
    const CT = BAY.CORAL ? texData('reef/coral') : null, coralHere = CT && BAY.CORAL.some(r => near(r, 12));   // 珊瑚迷宫：石头换成珊瑚墙
    const boul = (BAY.BOULDERS ? BAY.BOULDERS.map(BAY.BOULDER_SH) : []).concat((BAY.KWALLS || []).filter(K => !has(S, K.id)).map(K => ['rect', K.x - K.w / 2, K.y - K.h / 2, K.x + K.w / 2, K.y + K.h / 2])).filter(sh => near(shapeBox(sh), 6));   // 大礁石、海带墙：这层不画，另外贴图
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
        if (boul.length && boul.some(sh => BAY.sd(sh, wx, wy) < 1.5) && BAY.solid(wx, wy, S.got, true) < -0.45) continue;
        const gl = Math.hypot(gx, gy) || 1, nx = -gx / gl, ny = -gy / gl;
        const e = f < 18 ? Math.exp(-f / 6) : 0, l = -(nx * 0.45 + ny * 0.89);
        let sh = 0.9 + e * 0.42 * l - (1 - e) * 0.12;
        if (f < 2.6 && ny < -0.2) sh += (1 - f / 2.6) * 0.42 * -ny;
        if (f < 0.9) sh *= 0.42 + 0.58 * Math.max(0, f) / 0.9;
        let r, gg, b;
        const tx = Math.floor(wx * PX);
        if (boatHere && wx > bb[0] && wx < bb[2] && wy > bb[1] && wy < bb[3] && BAY.BOAT.walls.some(sh => BAY.sd(sh, wx, wy) < 0.8)) { r = 124; gg = 80; b = 42; }
        else {
          const k = (trow + ((tx % T.w) + T.w) % T.w) * 4; r = T.d[k]; gg = T.d[k + 1]; b = T.d[k + 2];
          if (coralHere) {
            let cw = 0;
            for (const q of BAY.CORAL) { const dd = Math.max(q[0] - wx, wx - q[2], q[1] - wy, wy - q[3]); cw = Math.max(cw, clamp((-dd + vnoise(wx / 9, wy / 9) * 7) / 8 + 0.5, 0, 1)); }
            if (cw > 0) {   // 珊瑚墙太花太亮会抢鱼：压暗一点、往灰里拉一点（背景灰淡、角色鲜亮）
              const k3 = (((ty % CT.h) + CT.h) % CT.h * CT.w + ((tx % CT.w) + CT.w) % CT.w) * 4, cr = CT.d[k3], cg = CT.d[k3 + 1], cb = CT.d[k3 + 2], lum = (cr + cg + cb) / 3;
              r += ((cr * 0.68 + lum * 0.32) * 0.82 - r) * cw; gg += ((cg * 0.68 + lum * 0.32) * 0.82 - gg) * cw; b += ((cb * 0.68 + lum * 0.32) * 0.86 - b) * cw;
            }
          }
          if (sandHere) {
            // 沙子这一片：边上弯弯扭扭、软一点过渡；靠边的石头上落一层沙灰，靠边的沙子压一点暗（像沙子堆在石头脚下）
            const e2 = sandEdge(wx, wy), sd2 = (inPoly(wx, wy, BAY.SAND) ? e2 : -e2) + (e2 < 16 ? vnoise(wx / 13, wy / 13) * 5 + vnoise(wx / 4.5 + 17, wy / 4.5) * 1.8 : 0);
            let sw = clamp(sd2 / 2.4 + 0.5, 0, 1);
            if (sw > 0 && rocksHere.some(sh => BAY.sd(sh, wx, wy) < 1)) sw = 0;
            const dust = sw < 1 ? 0.32 * Math.exp(Math.min(0, sd2) / 4) : 0, m = Math.max(sw, dust);
            if (m > 0) {
              const k2 = (srow + ((tx % SD.w) + SD.w) % SD.w) * 4, ao = sw > 0 ? 1 - 0.16 * Math.exp(-Math.max(0, sd2) / 4) : 1;
              r = (r + (SD.d[k2] * ao - r) * m); gg = (gg + (SD.d[k2 + 1] * ao - gg) * m); b = (b + (SD.d[k2 + 2] * ao - b) * m);
            }
          }
        }
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
    const own = texData(an('backwall')), T = own || texData(an('rock')) || procTex('_rock', [120, 110, 98], 30, 42), bp = PX / 2;
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
        let f = o[0];
        const BF = g.boatF, fx = BF && (wx - BF.x0) / BAY.CELL, fy = BF && (wy - BF.y0) / BAY.CELL;
        if (BF && fx >= 0 && fy >= 0 && fx < BF.nx - 1 && fy < BF.ny - 1) { const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j, k = j * BF.nx + i, a = BF.F[k], b = BF.F[k + 1], c2 = BF.F[k + BF.nx], d = BF.F[k + BF.nx + 1]; f = a + (b - a) * tx + (c2 - a) * ty + (a - b - c2 + d) * tx * ty; }
        if (f < -40) continue;
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
    const FA = BAY.LOOK.far, d = cy + VH / 2, w1 = clamp((FA[0] - d) / 180, 0, 1), w3 = clamp((d - FA[1]) / 180, 0, 1), w2 = clamp(1 - w1 - w3, 0, 1);
    const names = ['far-shallow', 'far-mid', 'far-deep'].map(an), off = -(((g.cam.x * Z * 0.3) % 640) + 640) % 640;
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
    const far = aart('shore-far') || Ly.shoreFar, mid = aart('shore-mid') || Ly.shoreMid;
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
    g.rockL = L2;   // 章鱼小铺沉进地里的那截要用（rockOver）
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
  const DECOR_FOOT = [123, 93, 116, 116, 117, 96, 114, 126];   // decor.webp 每格东西最下面在第几行（量出来的）
  function drawDecor(g) {
    const c = g.c, tm = g.anim, im = aart('decor'), FT = BAY.DECOR_FOOT || DECOR_FOOT, x0 = g.cam.x - 30, x1 = g.cam.x + VW + 30, y0 = g.cam.y - 30, y1 = g.cam.y + VH + 40;
    g.decor.forEach(d => {
      if (d.x < x0 || d.x > x1 || d.y < y0 || d.y > y1) return;
      if (im) { const sz = 24 * d.s, sway = LOOK.sway.indexOf(d.k) >= 0; onGround(g, d.x, d.y, sz * 0.32, 1.5, cc => { cc.translate(0, sz * (128 - FT[d.k]) / 128); cc.rotate(Math.sin(tm * 1.2 + d.ph) * (sway ? 0.06 : 0)); cc.drawImage(im, d.k * 128, 0, 128, 128, -sz / 2, -sz, sz, sz); }); return; }
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
  // 石台按深浅压暗偏蓝（跟按地形算光的石头同一个算法），分 6 档存起来
  const LEDGE_T = {};
  function ledgeTint(im, y) {
    const t = clamp((y - 200) / 1200, 0, 1), lv = an('ledges') + Math.round(t * 5);
    if (LEDGE_T[lv]) return LEDGE_T[lv];
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, cv.width, cv.height), tt = Math.round(t * 5) / 5, tr = (1 - 0.55 * tt) * 0.85, tg = (1 - 0.4 * tt) * 0.85, tb = (1 - 0.14 * tt) * 0.88;
    for (let i = 0; i < d.data.length; i += 4) { d.data[i] *= tr; d.data[i + 1] *= tg; d.data[i + 2] *= tb; }
    x.putImageData(d, 0, 0);
    return (LEDGE_T[lv] = cv);
  }
  function drawLedges(g) {
    const c = g.c, im = aart('ledges');
    if (!im) return;
    const x0 = g.cam.x - 50, x1 = g.cam.x + VW + 50, y0 = g.cam.y - 40, y1 = g.cam.y + VH + 40;
    g.ledges.forEach(L2 => { if (L2.x < x0 || L2.x > x1 || L2.y < y0 || L2.y > y1) return; const col = L2.k % 4, row = L2.up ? 0 : 1; c.drawImage(ledgeTint(im, L2.y), col * 320, row * 200, 320, 200, L2.x - 30, L2.y - 19, 60, 38); });   // 嵌进石头里一半
  }
  // 最前面的剪影：比画面跑得快（以画面中间为准放大一点）
  function drawFronts(g) {
    const c = g.c, im = aart('front'), k = 1.22, tm = g.anim, FF = BAY.FRONT_FOOT || [395, 274, 325, 258, 339, 379];
    c.save(); c.translate(W / 2, H / 2); c.scale(k, k); c.translate(-W / 2, -H / 2); c.scale(Z, Z); c.translate(-g.cam.x, -g.cam.y);
    const mx = g.cam.x + VW / 2, my = g.cam.y + VH / 2;
    g.fronts.forEach(F => {
      if (Math.abs(F.x - mx) > VW / k / 2 + 60 || Math.abs(F.y - my) > VH / k / 2 + 80) return;
      const ex = Math.abs(F.x - mx) / (VW / 2), ey = (F.y - my) / (VH / 2), edge = clamp(Math.max(ex, ey) * 1.6 - 0.9, 0, 1);
      if (edge <= 0.02) return;
      c.globalAlpha = edge;
      if (im) { c.drawImage(im, (F.k % 3) * 400, Math.floor(F.k / 3) * 400, 400, 400, F.x - 30, F.y + 2 - FF[F.k] * 60 / 400, 60, 60); c.globalAlpha = 1; return; }
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
    // 水流（11-25 作者：向下水流效果有点糙）：两边和两头都淡出去的一条软光带，里面一道道头亮尾淡、会晃的水线，带几个小气泡
    BAY.CURRENTS.forEach((Q, qi) => {
      if (Q.x1 < x0 || Q.x0 > x1 || Q.y1 < y0 || Q.y0 > y1) return;
      drawCurrent(g, Q, qi, Q.fins && has(S, 'fins') ? 0.45 : 1, !(Q.fins && has(S, 'fins')));   // 还顶得住你的急流画得明显（作者：这里根本过不去——原来看不出有水流）
    });
    // 裂了缝的石头
    BAY.CRACKS.forEach(K => {
      if (has(S, K.id) || K.sub) return;   // 潜水艇的玻璃罩画在潜水艇那张图里
      const [, kx, ky, rx, ry] = K.shape, im = art('crack');
      if (im) { c.drawImage(im, kx - rx - 4, ky - ry - 6, (rx + 4) * 2, (ry + 6) * 2); return; }
      c.strokeStyle = 'rgba(40,20,0,.8)'; c.lineWidth = 1.2;
      [[-0.75, -0.2, -0.25, 0.25, 0.2, -0.15, 0.7, 0.1], [0.05, -0.65, -0.05, -0.1, 0.35, 0.55], [-0.35, 0.6, -0.15, 0.1]].forEach(q => { c.beginPath(); for (let i = 0; i < q.length; i += 2) { const x = kx + q[i] * rx, y = ky + q[i + 1] * ry; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); });
    });
    // 气泡泉
    drawReefBits(g, x0, x1, y0, y1);
    const vim = aart('vent');
    g.pos.vents.forEach(([x, y]) => {
      if (x < x0 - 20 || x > x1 + 20 || y < y0 - 60 || y > y1 + 20) return;
      const gl = c.createRadialGradient(x, y - 4, 0, x, y - 4, 16); gl.addColorStop(0, 'rgba(190,250,255,.35)'); gl.addColorStop(1, 'rgba(190,250,255,0)'); c.fillStyle = gl; c.beginPath(); c.arc(x, y - 4, 16, 0, Math.PI * 2); c.fill();
      onGround(g, x, y, 13, 2, cc => { if (vim) cc.drawImage(vim, -16, -14, 32, 20); else { cc.fillStyle = '#4a5a62'; cc.beginPath(); cc.ellipse(0, 0, 8, 3.5, 0, Math.PI, 0); cc.fill(); } });
      c.strokeStyle = 'rgba(230,252,255,.8)'; c.lineWidth = 0.6;
      for (let i = 0; i < 8; i++) { const t = (tm * 0.8 + i / 8) % 1; c.beginPath(); c.arc(x + Math.sin(t * 9 + i * 2) * 3, y - 3 - t * 46, 0.7 + t * 1.8, 0, Math.PI * 2); c.stroke(); }
    });
    drawInlet(g);
    drawKelp(g, false);   // 海带林后面那层：在栈道、木桩后面
    // 栈道、栏杆、去珊瑚礁的门、岸上的水管、水面
    if (y0 < WY + 24) {
      const sh = c.createLinearGradient(0, WY, 0, WY + 22); sh.addColorStop(0, 'rgba(0,20,40,.28)'); sh.addColorStop(1, 'rgba(0,20,40,0)'); c.fillStyle = sh; c.fillRect(x0, WY, x1 - x0, 22);   // 栈道底下的影子
      const post = aart('post'), deck = aart('deck'), rail = aart('rail'), gate = aart(S[LOOK.lic] ? 'gate-open' : 'gate'), pipe = art('pipe-shore');
      for (let x = Math.floor(x0 / 60) * 60 + 10; x < x1; x += 60) { if (post) c.drawImage(post, x - 4, GY + 2, 14.4, 42); else { c.fillStyle = '#6a4822'; c.fillRect(x, GY + 4, 5, WY - GY + 16); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + 3, GY + 4, 2, WY - GY + 16); } }
      if (deck) for (let x = Math.floor(x0 / 153.6) * 153.6; x < x1; x += 153.6) c.drawImage(deck, x, GY - 2, 154, 21.6);
      else {
        const wd = c.createLinearGradient(0, GY - 2, 0, GY + 8); wd.addColorStop(0, '#c89a5a'); wd.addColorStop(1, '#8a5a28');
        c.fillStyle = wd; c.fillRect(x0, GY, x1 - x0, 7);
        c.strokeStyle = 'rgba(60,30,10,.4)'; c.lineWidth = 0.6; for (let x = Math.floor(x0 / 14) * 14; x < x1; x += 14) { c.beginPath(); c.moveTo(x, GY); c.lineTo(x, GY + 7); c.stroke(); }
      }
      if (x1 > RAIL) {
        const xa = Math.max(RAIL, x0);
        if (rail) for (let x = RAIL + Math.floor(Math.max(0, x0 - RAIL) / 76.8) * 76.8; x < x1; x += 76.8) c.drawImage(rail, x, GY - 18, 77, 19.2);   // 一节节从栏杆起头那儿往右排（原来镜头一过某个地方整排跳一下，作者：栏杆在瞬移）
        else { c.strokeStyle = '#ece4d4'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(xa, GY - 14); c.lineTo(x1, GY - 14); c.moveTo(xa, GY - 7); c.lineTo(x1, GY - 7); c.stroke(); c.fillStyle = '#d8d0c0'; for (let x = Math.ceil(xa / 24) * 24; x < x1; x += 24) c.fillRect(x - 1.2, GY - 16, 2.4, 16); }
      }
      if (SPOT.gate - 40 < x1) {
        if (gate) c.drawImage(gate, SPOT.gate - 36, GY + 1.5 - 209 * 0.3, 72, 72);   // gate.webp 门柱脚底在图里第 209 行，对到栈道面（原来悬空，作者）
        else { c.fillStyle = '#c8402a'; c.fillRect(SPOT.gate - 18, GY - 44, 5, 44); c.fillRect(SPOT.gate + 13, GY - 44, 5, 44); c.fillRect(SPOT.gate - 22, GY - 48, 44, 7); c.fillStyle = '#f0d040'; c.fillRect(SPOT.gate - 14, GY - 18, 28, 3); }
      }
      if (SPOT.gateL != null && SPOT.gateL - 40 < x1) { const go = aart('gate-open'); if (go) c.drawImage(go, SPOT.gateL - 36, GY + 1.5 - 209 * 0.3, 72, 72); }   // 珊瑚礁最左头：回浅水湾的门（一直开着）
      if (SPOT.pipe != null && SPOT.pipe > x0 - 10 && SPOT.pipe < x1 + 10) {
        drawShorePipe(g, pipe, has(S, 'valve'));
      }
      c.fillStyle = 'rgba(255,255,255,.28)'; for (let x = Math.floor(x0 / 9) * 9; x < x1; x += 9) { const w = 3 + 3 * Math.abs(Math.sin(x * 0.37)); c.fillRect(x + Math.sin(tm * 1.6 + x * 0.21) * 3, WY - 0.4 + Math.sin(x * 0.13 + tm) * 0.5, w, 0.8); }
    }
  }

  function currentBand(Q, qi) {
    const cache = currentBand.c || (currentBand.c = {});
    if (cache[qi]) return cache[qi];
    const w = Q.x1 - Q.x0, h = Q.y1 - Q.y0, vert = !Q.vx, cv = document.createElement('canvas');
    cv.width = Math.ceil(w * 2); cv.height = Math.ceil(h * 2);
    const x = cv.getContext('2d'), acr = vert ? x.createLinearGradient(0, 0, cv.width, 0) : x.createLinearGradient(0, 0, 0, cv.height);
    acr.addColorStop(0, 'rgba(210,240,255,0)'); acr.addColorStop(0.5, 'rgba(210,240,255,.11)'); acr.addColorStop(1, 'rgba(210,240,255,0)');
    x.fillStyle = acr; x.fillRect(0, 0, cv.width, cv.height);
    const L = vert ? cv.height : cv.width, fade = Math.min(0.3, 60 / L), alo = vert ? x.createLinearGradient(0, 0, 0, cv.height) : x.createLinearGradient(0, 0, cv.width, 0);
    alo.addColorStop(0, 'rgba(0,0,0,0)'); alo.addColorStop(fade, 'rgba(0,0,0,1)'); alo.addColorStop(1 - fade, 'rgba(0,0,0,1)'); alo.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = alo; x.fillRect(0, 0, cv.width, cv.height);
    return (cache[qi] = cv);
  }
  function drawCurrent(g, Q, qi, dim, strong) {
    const c = g.c, tm = g.anim, vert = !Q.vx, w = Q.x1 - Q.x0, h = Q.y1 - Q.y0;
    const L = vert ? h : w, A = vert ? w : h, dir = vert ? Math.sign(Q.vy) || 1 : Math.sign(Q.vx), speed = Math.abs(vert ? Q.vy : Q.vx) * 0.85;
    c.globalAlpha = dim;
    c.drawImage(currentBand(Q, qi), Q.x0, Q.y0, w, h);
    if (strong) c.drawImage(currentBand(Q, qi), Q.x0, Q.y0, w, h);
    // 每道水线：横着的位置、起点、快慢、长短都固定随机（按编号算，不闪）
    const n = Math.round(A * L / (strong ? 260 : 480)), P = (along, across) => (vert ? [Q.x0 + across, dir > 0 ? Q.y0 + along : Q.y1 - along] : [dir > 0 ? Q.x0 + along : Q.x1 - along, Q.y0 + across]);
    const ends = a => clamp(a / 26, 0, 1) * clamp((L - a) / 26, 0, 1);
    c.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const r1 = (hash2(i, qi * 7 + 1) + 1) / 2, r2 = (hash2(i, qi * 7 + 2) + 1) / 2, r3 = (hash2(i, qi * 7 + 3) + 1) / 2;
      const u = 0.12 + 0.76 * r1, sp = 0.75 + 0.5 * r2, len = 9 + 13 * r3, span = L + len;
      const head = ((r2 * 997 + tm * speed * sp) % span + span) % span, tail = head - len;
      const wob = Math.sin(tm * 2.2 + i * 1.7) * 1.2, acr = A * u + wob;
      const a0 = Math.max(0, tail), a1 = Math.min(L, head);
      if (a1 <= a0) continue;
      const al = (strong ? 0.85 : 0.5) * Math.sin(u * Math.PI) * ends((a0 + a1) / 2);
      if (al < 0.02) continue;
      const [hx, hy] = P(a1, acr), [tx, ty] = P(a0, acr - wob * 0.6);
      const gr = c.createLinearGradient(tx, ty, hx, hy);
      gr.addColorStop(0, 'rgba(235,250,255,0)'); gr.addColorStop(1, 'rgba(235,250,255,' + al + ')');
      c.strokeStyle = gr; c.lineWidth = (strong ? 0.9 : 0.6) + 0.5 * r3;
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(hx, hy); c.stroke();
    }
    // 小气泡顺着水流冲走
    c.fillStyle = 'rgba(230,250,255,.7)';
    for (let i = 0; i < Math.round(n / (strong ? 2 : 3)); i++) {
      const r1 = (hash2(i, qi * 7 + 5) + 1) / 2, r2 = (hash2(i, qi * 7 + 6) + 1) / 2;
      const along = ((r2 * 613 + tm * speed * 1.1) % L + L) % L, acr = A * (0.2 + 0.6 * r1) + Math.sin(tm * 3 + i * 2.3) * 2.5;
      const e = ends(along) * Math.sin((0.2 + 0.6 * r1) * Math.PI);
      if (e < 0.05) continue;
      const [bx, by] = P(along, acr);
      c.globalAlpha = dim * e; c.beginPath(); c.arc(bx, by, 0.6 + r2 * 0.6, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  }
  // 岸上的水管（11-25 作者：下去的口子就是画了个蓝椭圆？）：阀门没拧开，顶上的圆盖子扣着；拧开了，盖子被水顶掉、歪在栈道上，
  // 管子口是一圈锈铁边，里面黑洞洞的，往下一点是晃着的水面，偶尔冒个泡
  function drawShorePipe(g, pipe, open) {
    const c = g.c, x = SPOT.pipe, tm = g.anim, k = 0.3, top = GY - 16;   // pipe-shore.webp 60×140，画成 18×42（一个点 0.3）
    if (!pipe) { c.fillStyle = '#6a7078'; c.fillRect(x - 4, GY - 12, 8, WY - GY + 24); c.fillStyle = open ? '#10181e' : '#8a9098'; rrect(c, x - 6, GY - 15, 12, 5, 2); c.fill(); return; }
    if (!open) { c.drawImage(pipe, x - 9, top, 18, 42); return; }
    const cut = 17;   // 图里第 17 行往上是盖子
    c.drawImage(pipe, 0, cut, 60, 140 - cut, x - 9, top + cut * k, 18, (140 - cut) * k);
    const my = top + cut * k + 0.4, rx = 3.3, ry = 1.25;
    // 管子口：外圈锈铁边、里面黑、往下一点有水面在晃
    const rim = c.createLinearGradient(x - rx, 0, x + rx, 0); rim.addColorStop(0, '#6a4026'); rim.addColorStop(0.45, '#c8916a'); rim.addColorStop(1, '#5a3420');
    c.fillStyle = rim; c.beginPath(); c.ellipse(x, my, rx + 0.7, ry + 0.45, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#0c1418'; c.beginPath(); c.ellipse(x, my, rx - 0.2, ry - 0.15, 0, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.ellipse(x, my, rx - 0.2, ry - 0.15, 0, 0, Math.PI * 2); c.clip();
    const wy = my + 0.55 + Math.sin(tm * 2.6) * 0.18;
    const wg = c.createLinearGradient(0, wy - 0.6, 0, wy + 1.2); wg.addColorStop(0, '#3aa0c8'); wg.addColorStop(1, '#14506a');
    c.fillStyle = wg; c.beginPath(); c.ellipse(x, wy + 0.5, rx - 0.5, ry, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(220,250,255,.75)'; c.lineWidth = 0.35; c.beginPath(); c.ellipse(x + Math.sin(tm * 1.7) * 0.6, wy + 0.3, 1.2, 0.3, 0, 0, Math.PI * 2); c.stroke();
    c.restore();
    c.strokeStyle = 'rgba(255,220,180,.5)'; c.lineWidth = 0.35; c.beginPath(); c.ellipse(x, my - 0.15, rx + 0.4, ry + 0.25, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();   // 铁边上一道高光
    // 偶尔冒上来一个泡
    const q = (tm * 0.45) % 1;
    if (q < 0.35) { const b = q / 0.35; c.globalAlpha = 1 - b; c.strokeStyle = 'rgba(230,250,255,.9)'; c.lineWidth = 0.35; c.beginPath(); c.arc(x - 0.8 + Math.sin(tm * 5) * 0.5, my - b * 6, 0.5 + b * 0.5, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
    // 盖子：歪倒在管子右边的栈道上
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x + 8.4, GY + 0.6, 3.6, 0.8, 0, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(x + 8.4, GY - 0.8); c.rotate(1.15);
    c.drawImage(pipe, 14, 0, 32, cut + 1, -4.8, -2.7, 9.6, (cut + 1) * k);
    c.restore();
  }
  // 沉船：外面一层船壳（海狗钻进去就变透明），里面是隔出来的船舱
  function drawBoatInside(g) {
    const c = g.c, im = art(BAY.BOAT.art ? BAY.BOAT.art.in : 'boatin'), b = BAY.BOAT.box;
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
    const c = g.c, BA = BAY.BOAT.art, im = art(BA ? BA.out : 'boat');
    c.globalAlpha = a;
    if (im && BA && BA.cells) { const cw = im.width / BA.cells, cell = has(g.S, BA.broke) ? 1 : 0; c.drawImage(im, cell * cw, 0, cw, im.height, b[0], b[1], b[2] - b[0], b[3] - b[1]); }   // 潜水艇：玻璃罩裂着 ／ 碎了
    else if (im) c.drawImage(im, b[0], b[1], b[2] - b[0], b[3] - b[1]);
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
  // 珊瑚礁水下的东西：大礁石（打架时撞裂了换裂的那格）、海胆（推开的时候滚开几只）、石斑鱼的小洞（洞口压暗）、通道口、没头盔的时候那条深度线
  function drawReefBits(g, x0, x1, y0, y1) {
    const c = g.c, S = g.S, tm = g.anim, vis = (x, y, m) => x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m;
    (BAY.HOLES || []).forEach(([x, y, fc]) => {
      if (!vis(x, y, 20)) return;
      const r = c.createRadialGradient(x - fc * 3, y, 1, x - fc * 3, y, 13); r.addColorStop(0, 'rgba(8,6,10,.85)'); r.addColorStop(0.7, 'rgba(8,6,10,.5)'); r.addColorStop(1, 'rgba(8,6,10,0)');
      c.fillStyle = r; c.beginPath(); c.ellipse(x - fc * 3, y, 13, 10, 0, 0, Math.PI * 2); c.fill();
    });
    // 海带墙：密密的一堵 → 正在割 → 割开剩下短茬
    const kwim0 = art('kelp/kelpwall');
    (BAY.KWALLS || []).forEach(K => {
      const kwim = kwim0 && kwTint(kwim0, K.y);   // 照深浅压暗一点，别比四周亮一截
      if (!vis(K.x, K.y, 40)) return;
      const fr = !has(S, K.id) ? 0 : g.kwCut && g.kwCut[K.id] > 0 ? 1 : 2, dh = K.h + 14, dw = dh * 200 / 240;
      const wob = fr === 0 && g.seal && !g.seal.land && dist(g.seal.x, g.seal.y, K.x, K.y) < K.w / 2 + 14 ? Math.sin(tm * 24) * 0.6 : 0;   // 顶上去的时候晃
      if (kwim) c.drawImage(kwim, fr * 200, 0, 200, 240, K.x - dw / 2 + wob, K.y + K.h / 2 + 5 - dh, dw, dh);
      else if (fr === 0) { c.fillStyle = '#3a7a30'; c.fillRect(K.x - K.w / 2, K.y - K.h / 2, K.w, K.h); }
    });
    // 打大章鱼那片空地中间的大礁石（打的时候 drawOcto 自己画，它躲在后面）
    if (BAY.OCTO_ROCK && !(g.fight && g.fight.kind === 'octo')) { const [rx, ry] = BAY.OCTO_ROCK, rk = art('kelp/octorock'); if (rk && vis(rx, ry - 40, 80)) c.drawImage(rk, rx - 75.6, ry + 4 - 100.8, 151.2, 100.8); }
    const bim = art('reef/boulder');
    (BAY.BOULDERS || []).forEach(([x, y], i) => {
      if (!vis(x, y - 24, 40)) return;
      if (boulderGone(g, i)) { if (bim) c.drawImage(bim, 200, 0, 200, 160, x - 17, y - 11, 34, 12); return; }   // 砸碎了：剩一小堆碎石
      const cr = g.fight && g.fight.rocks && g.fight.rocks[i] > 0 ? 1 : 0;
      if (bim) c.drawImage(bim, cr * 200, 0, 200, 160, x - 30, y - 47, 60, 48);
      else { c.fillStyle = '#c8b898'; c.beginPath(); c.ellipse(x, y - 21, 23, 19, 0, 0, Math.PI * 2); c.fill(); }
    });
    (g.rubble || []).forEach(q => { c.save(); c.translate(q.x, q.y); c.rotate(q.rot); c.globalAlpha = clamp(1.6 - q.t, 0, 1); c.fillStyle = '#c9b48e'; c.strokeStyle = '#7a6448'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-q.r, -q.r * 0.4); c.lineTo(q.r * 0.2, -q.r); c.lineTo(q.r, q.r * 0.3); c.lineTo(-q.r * 0.3, q.r * 0.8); c.closePath(); c.fill(); c.stroke(); c.restore(); });   // 礁石碎块
    const uim = art('reef/urchin');
    (BAY.URCHINS || []).forEach(U => {
      if (has(S, U.id) || !vis(U.x, U.y, 30)) return;
      const z = U.r * 2.7, wob = g.seal && dist(g.seal.x, g.seal.y, U.x, U.y) < U.r + 14 ? Math.sin(tm * 30) * 0.06 : 0;
      c.save(); c.translate(U.x, U.y); c.rotate(wob);
      if (uim) c.drawImage(uim, 0, 0, 128, 128, -z / 2, -z / 2, z, z); else { c.fillStyle = '#3a1a4a'; c.beginPath(); c.arc(0, 0, U.r, 0, Math.PI * 2); c.fill(); }
      c.restore();
    });
    g.urchinFly.forEach(u => {   // 推开：三只海胆往两边滚开、淡掉
      const k = u.t / 0.9, z = u.r * 1.3;
      c.globalAlpha = 1 - k;
      [[-1, -0.6], [1, -0.3], [0.2, 1]].forEach(([dx, dy], i) => { c.save(); c.translate(u.x + dx * k * 26 + u.dir * k * 10, u.y + dy * k * 14); c.rotate(k * 3 * (i % 2 ? 1 : -1)); if (uim) c.drawImage(uim, 2 * 128, 0, 128, 128, -z / 2, -z / 2, z, z); c.restore(); });
      c.globalAlpha = 1;
    });
    tunnelsOf().forEach(T => {   // 水下通道口：铁栅栏锁着 ／ 开着（图里口子朝左，朝右的翻过来）
      const [tx, ty] = T.at, tim = art('reef/tunnel');
      if (!vis(tx, ty, 50)) return;
      c.save(); c.translate(tx, ty); if (T.face > 0) c.scale(-1, 1);
      if (tim) c.drawImage(tim, tunnelOpen(S, T) ? 240 : 0, 0, 240, 240, -32, -32, 64, 64); else { c.fillStyle = '#4a4a50'; c.beginPath(); c.arc(0, 0, 26, 0, Math.PI * 2); c.fill(); }
      c.restore();
    });
    const DG = BAY.DEPTH;
    if (DG.line && y1 > DG.y - 20 && y0 < DG.y + 20) {   // 水压线：一条晃动的淡蓝线，没头盔的时候亮
      const on = !has(S, DG.need);
      c.strokeStyle = on ? 'rgba(150,220,255,.55)' : 'rgba(150,220,255,.14)'; c.lineWidth = on ? 1.2 : 0.7; c.setLineDash([5, 4]);
      c.beginPath(); let pen = false; for (let x = Math.floor(x0 / 6) * 6; x < x1; x += 6) { const yy = DG.y + Math.sin(x * 0.08 + tm * 2) * 1.2; if (fieldAt(g, x, yy) > -1) { pen = false; continue; } if (pen) c.lineTo(x, yy); else c.moveTo(x, yy); pen = true; } c.stroke(); c.setLineDash([]);   // 只画在水里
      if (on) { c.fillStyle = 'rgba(200,240,255,.5)'; for (let i = 0; i < 6; i++) { const x = x0 + ((i * 53 + tm * 12) % (x1 - x0)); c.beginPath(); c.arc(x, DG.y - 2 - ((tm * 6 + i * 3) % 10), 0.7, 0, Math.PI * 2); c.fill(); } }
    }
  }
  // 海带墙按深浅压暗（跟石台一个算法），分 6 档存起来
  const KW_T = {};
  function kwTint(im, y) {
    const t = clamp((y - 200) / 1200, 0, 1), lv = Math.round(t * 5);
    if (KW_T[lv] && KW_T[lv].im === im) return KW_T[lv].cv;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, cv.width, cv.height), tt = lv / 5, tr = (1 - 0.55 * tt) * 0.72, tg = (1 - 0.4 * tt) * 0.7, tb = (1 - 0.14 * tt) * 0.76;
    for (let i = 0; i < d.data.length; i += 4) { d.data[i] *= tr; d.data[i + 1] *= tg; d.data[i + 2] *= tb; }
    x.putImageData(d, 0, 0);
    KW_T[lv] = { im, cv };
    return cv;
  }
  // 海带林（作者 1A）：一根根从海底长到水面——底下一节根、中间一节节往上摞、最上面一节浮在水面；
  // 后面那层在海狗后面，前面那层（更暗、大一点）盖在海狗前面；整根慢慢晃，越往上晃得越多
  const KELP_T = {};
  function kelpTinted(im, front) {
    const key = front ? 'f' : 'b';
    if (KELP_T[key] && KELP_T[key].im === im) return KELP_T[key].cv;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, cv.width, cv.height), m = front ? [0.3, 0.36, 0.32] : [0.84, 0.88, 0.84];
    for (let i = 0; i < d.data.length; i += 4) { d.data[i] *= m[0]; d.data[i + 1] *= m[1]; d.data[i + 2] *= m[2]; }
    x.putImageData(d, 0, 0);
    KELP_T[key] = { im, cv };
    return cv;
  }
  function drawKelp(g, front) {
    const K = BAY.KELP, im0 = K && art('kelp/kelp');
    if (!im0 || g.cam.y > 470) return;
    const c = g.c, tm = g.anim, im = kelpTinted(im0, front), sc = front ? 0.36 : 0.3, w = 160 * sc, h = 320 * sc;
    const x0 = g.cam.x - w, x1 = g.cam.x + VW + w;
    c.save(); c.beginPath(); c.rect(x0, GY + 20, x1 - x0, 500); c.clip();   // 只在水里（顶上那节浮在水面底下，别冒到栈道上）
    K.forEach((k, i) => {
      if (!!k.front !== front || k.x < x0 || k.x > x1) return;
      const fl = kelpFloor(g, k) + 4, top = WY - 9, depth = fl - top, ph = i * 1.7;
      const sway = yy => { const q = clamp((fl - yy) / depth, 0, 1); return Math.sin(tm * 0.7 + ph) * 6 * Math.pow(q, 1.4) + Math.sin(tm * 1.9 + ph * 2) * 1.2 * q; };
      const seg = (col, yb, hh) => {   // 一节：底边在 yb，高 hh；上下两头按晃的多少斜一点，接得上
        const ob = sway(yb), ot = sway(yb - hh);
        c.save(); c.translate(k.x + ob, yb); c.transform(1, 0, -(ot - ob) / hh, 1, 0, 0);
        c.drawImage(im, col * 160, k.v * 320, 160, 320, -w / 2, -hh, w, hh);
        c.restore();
      };
      if (front) { const sl = g.seal, near = sl && !sl.land ? clamp((Math.abs(sl.x - k.x) - 8) / 34, 0, 1) : 1; c.globalAlpha = 0.3 + 0.56 * near; }   // 前面那层：海狗钻到后面的时候淡下去，别把海狗整个挡住
      const rootTop = fl - h, topBot = top + h;
      for (let yb = rootTop; yb > topBot + 10; yb -= h) seg(1, yb, h);   // 中间一节节往上摞，最上面那节被顶上的叶子盖住
      seg(0, fl, h);
      seg(2, topBot, h);
      c.globalAlpha = 1;
    });
    c.restore();
  }
  // 电鳗：游的两格来回换；放电那格周围一团蓝光；被顶开那格
  function drawEels(g) {
    const c = g.c, im = art('kelp/eel'), tm = g.anim;
    (g.eels || []).forEach((e, i) => {
      if (Math.abs(e.x - g.cam.x - VW / 2) > VW || Math.abs(e.y - g.cam.y - VH / 2) > VH) return;
      const fr = e.knock > 0 ? 3 : e.zap > 0 ? 2 : Math.floor(tm * 5 + i) % 2, gl = e.zap > 0 ? 0.55 : 0.16 + 0.06 * Math.sin(tm * 3 + i);
      const r = c.createRadialGradient(e.x, e.y, 2, e.x, e.y, e.zap > 0 ? 26 : 16); r.addColorStop(0, 'rgba(150,220,255,' + gl + ')'); r.addColorStop(1, 'rgba(150,220,255,0)');
      c.fillStyle = r; c.beginPath(); c.arc(e.x, e.y, e.zap > 0 ? 26 : 16, 0, Math.PI * 2); c.fill();
      c.save(); c.translate(e.x, e.y); if (e.face < 0) c.scale(-1, 1); c.rotate(e.tilt + (e.knock > 0 ? Math.sin(tm * 9) * 0.3 : 0));
      if (im) c.drawImage(im, fr * 240, 0, 240, 96, -17, -6.8, 34, 13.6);
      else { c.fillStyle = '#4a4440'; c.beginPath(); c.ellipse(0, 0, 11, 2.6, 0, 0, Math.PI * 2); c.fill(); }
      c.restore();
    });
  }
  // 回声：一圈圈往外扩的声波；按住攻击蓄的时候海狗身边一圈越来越亮
  function drawEcho(g) {
    const c = g.c, s = g.seal;
    g.echoes.forEach(e => { const k = e.t, r = 8 + k * 140; c.strokeStyle = 'rgba(170,240,255,' + (0.8 * (1 - k)) + ')'; c.lineWidth = 1.6 * (1 - k) + 0.4; c.beginPath(); c.arc(e.x, e.y, r, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(e.x, e.y, r * 0.72, 0, Math.PI * 2); c.stroke(); });
    if (s && !s.land && s.echoC > 0.08) { const k = clamp(s.echoC / 0.55, 0, 1); c.strokeStyle = 'rgba(170,240,255,' + (0.3 + 0.5 * k) + ')'; c.lineWidth = 0.8; c.beginPath(); c.arc(s.x, s.y, 14 - k * 4, 0, Math.PI * 2); c.stroke(); }
  }
  // 暗道：没发现之前盖一块石头

  // 海狗游到跟前了：能点的东西外面一圈亮环一跳一跳
  // 海狗游到跟前、按"用"就能用的东西：头上一个小三角（跟岸上一样；原来是一圈大亮环，作者说铺子像贴上去的）
  function drawTapRings(g) {
    const c = g.c, s = g.seal;
    if (s.land || g.fight || g.panel) return;
    const t = actTarget(g);
    if (!t) return;
    const top = { shop: 20, valve: 13, inlet: 22, tunnel: 28 }[t.k] || 16, y = t.y - top - 3 - Math.abs(Math.sin(g.anim * 4)) * 2;
    c.fillStyle = '#fff6a0'; c.strokeStyle = 'rgba(60,30,0,.85)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(t.x - 3, y - 3); c.lineTo(t.x + 3, y - 3); c.lineTo(t.x, y + 1); c.closePath(); c.fill(); c.stroke();
  }
  // 章鱼小铺嵌在石洞里（11-25 作者：跟地形融合得不好）：灯把四周的石头照暖，铺子外圈压一点洞里的冷暗色，
  // 底座往地里沉 4，再把这块的石头盖回去一遍，看着是坐在洞底上；地上一团影子
  const OCTO_SINK = 4;
  function octoTinted(im) {
    if (!im) return null;
    if (octoTinted.im === im) return octoTinted.cv;
    octoTinted.im = im;
    const cv = document.createElement('canvas'); cv.width = 200; cv.height = 160;
    const x = cv.getContext('2d'); x.drawImage(im, 600, 0, 200, 160, 0, 0, 200, 160);
    x.globalCompositeOperation = 'source-atop';
    const r = x.createRadialGradient(104, 74, 24, 104, 80, 118); r.addColorStop(0, 'rgba(6,20,50,0)'); r.addColorStop(0.55, 'rgba(6,20,50,.12)'); r.addColorStop(1, 'rgba(6,20,50,.48)');
    x.fillStyle = r; x.fillRect(0, 0, 200, 160);
    return (octoTinted.cv = cv);
  }
  function drawOctoShop(g) {
    const c = g.c, [x, y] = g.pos.shop, size = 26, w = size * 2, h = size * 1.6;
    if (Math.abs(x - g.cam.x - VW / 2) > VW || Math.abs(y - g.cam.y - VH / 2) > VH) return;
    const top = y - size * 0.8 + OCTO_SINK, fl = 0.92 + 0.08 * Math.sin(g.anim * 7) * Math.sin(g.anim * 3.1);
    const cv = octoTinted(aart('merchants'));
    if (cv) c.drawImage(cv, x - size, top, w, h); else drawMerchant(g, BAY.SHOP.mk, x, y + OCTO_SINK, size);
    rockOver(g, x - size - 3, top + h - 14, w + 6, 16);   // 沉进地里的那截让石头盖住
    const sh = c.createRadialGradient(x, y + 21, 2, x, y + 21, 32); sh.addColorStop(0, 'rgba(0,0,0,.32)'); sh.addColorStop(1, 'rgba(0,0,0,0)');   // 铺子脚下压暗一圈
    c.fillStyle = sh; c.beginPath(); c.ellipse(x, y + 21, 32, 6, 0, 0, Math.PI * 2); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter';   // 灯光照到四周（最后画，铺子、石头一起照暖）
    const lx = x + 1, ly = y - 7, gl = c.createRadialGradient(lx, ly, 3, lx, ly, 64);
    gl.addColorStop(0, 'rgba(255,190,100,' + 0.2 * fl + ')'); gl.addColorStop(0.45, 'rgba(255,150,70,' + 0.1 * fl + ')'); gl.addColorStop(1, 'rgba(255,140,60,0)');
    c.fillStyle = gl; c.beginPath(); c.arc(lx, ly, 64, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  // 放在海底的东西（气泡泉、海草珊瑚石头、海贝、破烂）：按脚下左右两边的地面歪一点，往地里沉一点，
  // 再把这一截的石头盖回去——斜坡上不再一头悬空（11-25 作者：好多装饰跟地形融合不好）
  function seatAt(g, x, y, half) {
    const key = Math.round(x) + ',' + Math.round(y) + ',' + half, C = g.seatC || (g.seatC = {});
    if (C[key]) return C[key];
    const fy = xx => { const v = floorY(g, xx, y - half - 6); return Math.abs(v - y) > half * 1.2 + 6 ? y : v; };
    const yl = fy(x - half), yr = fy(x + half);
    return (C[key] = { ang: clamp(Math.atan2(yr - yl, half * 2), -0.45, 0.45), y: Math.max(y, (yl + yr) / 2) });
  }
  function onGround(g, x, y, half, sink, draw) {
    const c = g.c, P = seatAt(g, x, y, half);
    c.save(); c.translate(x, P.y + sink); c.rotate(P.ang); draw(c); c.restore();
    const lift = Math.abs(Math.sin(P.ang)) * half;
    rockOver(g, x - half - 4, P.y - lift - 3, half * 2 + 8, lift + sink + 12);
    return P;
  }
  // 把石头那一层的某一块（世界坐标）再画一遍，盖住沉到地里的东西
  function rockOver(g, wx, wy, ww, wh) {
    const L2 = g.rockL;
    if (!L2) return;
    const k = L2.sw / W;
    g.c.drawImage(L2.cv, (wx - g.cam.x) * Z * k, (wy - g.cam.y) * Z * k, ww * Z * k, wh * Z * k, wx, wy, ww, wh);
  }
  const hiddenByCover = (S, x, y) => BAY.COVERS.some(Q => !has(S, Q.id) && inRect(x, y, Q.r));
  // 进水口：右边石壁上的粗水管口 + 阀门
  function drawInlet(g) {
    if (!BAY.INLET) return;
    const c = g.c, [ix, iy] = BAY.INLET, tm = g.anim, open = has(g.S, 'valve');
    if (Math.abs(ix - g.cam.x - VW / 2) > VW || Math.abs(iy - g.cam.y - VH / 2) > VH) return;
    const pim = art('inlet'), vim = art('valve'), [vx, vy] = g.pos.things.valve;
    if (pim && vim) {
      if (open) { c.fillStyle = 'rgba(220,250,255,.7)'; for (let i = 0; i < 5; i++) { const t = (tm * 1.2 + i / 5) % 1; c.beginPath(); c.arc(ix - 30 + t * 28, iy + Math.sin(t * 8 + i) * 6, 1.2, 0, Math.PI * 2); c.fill(); } }
      c.drawImage(pim, open ? 200 : 0, 0, 200, 200, ix - 11, iy - 20, 40, 40);   // 管子口在图的左边，正对着 INLET
      if (!open) { c.globalAlpha = 0.35 + 0.25 * Math.sin(tm * 3); c.fillStyle = '#fff8c0'; c.beginPath(); c.arc(vx, vy - 7, 11, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
      c.drawImage(vim, open ? 96 : 0, 0, 96, 96, vx - 10, vy + 6 - (open ? 92 : 86) * 20 / 96, 20, 20);   // vy 是地面往上 5
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
    const tv = AREA + (aart('rock') ? 1 : 0) + (aart('sand') ? 2 : 0) + (aart('backwall') ? 4 : 0) + (BAY.CORAL && art('reef/coral') ? 8 : 0);
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
    drawSnow(g);   // 海雪在石头后面，只在水里飘
    // 3 沉船里面、石头
    const boatIn = () => art(BAY.BOAT.art ? BAY.BOAT.art.in : 'boatin');
    c.save(); c.scale(Z, Z); c.translate(-g.cam.x, -g.cam.y); if (g.inBoat > 0 && !boatIn()) drawBoatInside(g); c.restore();
    drawRockLayer(g, need);
    // 4 能游这层的东西
    c.save(); c.scale(Z, Z); c.translate(-g.cam.x, -g.cam.y);
    if (g.inBoat > 0 && boatIn()) drawBoatInside(g);
    drawWorld(g);
    P.clams.forEach(([x, y], i) => onGround(g, x, y + 4, 9, 1.5, cc => drawClam(cc, 0, -4, clamOpen(g, i), S.world.clams[i].pearl)));
    S.world.junk.forEach(j => { if (!j.gone) onGround(g, j.x, floorAt(g, j.x), 6, 1.2, cc => drawSeabed(cc, { shoe: 5, can: 6, tire: 7 }[j.k], 0, -5, 14)); });
    if (S.world.bottle) drawSeabed(c, 4, S.world.bottle.x, Math.min(S.world.bottle.y || WY, floorAt(g, S.world.bottle.x) - 4), 13);
    TREASURE.forEach(k => { if (!has(S, k) && !hiddenByCover(S, P.things[k][0], P.things[k][1])) drawThing(g, k); });
    drawOctoShop(g);
    drawTapRings(g);
    const vx0 = g.cam.x - 30, vx1 = g.cam.x + VW + 30, vy0 = g.cam.y - 30, vy1 = g.cam.y + VH + 30;
    if (!g.fight) g.fish.forEach(f => {
      if (!(f.x > vx0 && f.x < vx1 && f.y > vy0 && f.y < vy1 && !hiddenByCover(S, f.x, f.y))) return;
      const camo = SPECIES[f.sp].camo && !(f.seen > 0) && !(f.glow > 0);
      if (camo || f.esc > 0) c.globalAlpha = camo ? 0.42 : clamp(f.esc / 0.6, 0, 1);   // 叶海龙没露馅：跟一片海草似的；吓跑的鱼：淡掉
      if (!camo) shadowUnder(g, f.x, f.y + 3, SPECIES[f.sp].len[f.size]);
      if (f.glow > 0) { const len = SPECIES[f.sp].len[f.size], r = c.createRadialGradient(f.x, f.y, 2, f.x, f.y, len); r.addColorStop(0, 'rgba(170,240,255,' + 0.5 * Math.min(1, f.glow) + ')'); r.addColorStop(1, 'rgba(170,240,255,0)'); c.fillStyle = r; c.beginPath(); c.arc(f.x, f.y, len, 0, Math.PI * 2); c.fill(); }   // 回声照到：亮一下
      if (f.hide && f.ls === 'out') {   // 狼鳗探出洞来：尾巴那截还在洞里
        const [hx, hy] = BAY.HOLES[f.hole];
        c.save(); c.beginPath(); c.rect(f.face > 0 ? hx - 9 : hx - 200, hy - 40, 209, 80); c.clip();
        drawFish(g, f.sp, f.size, f.x, f.y, f.face, 1, f.ph, f.lt > 0.75);   // 刚扑出来那下是张大嘴那格
        c.restore();
      } else if (f.hide) {   // 躲在洞里：只露出半截脑袋
        const [hx, hy] = BAY.HOLES[f.hole], len = SPECIES[f.sp].len[f.size], wind = f.ls === 'wind' ? Math.sin(g.anim * 60) * 0.8 : 0;
        c.save(); c.beginPath(); c.ellipse(hx - f.face * 3, hy, 13, 10, 0, 0, Math.PI * 2); c.clip();
        drawFish(g, f.sp, f.size, hx - f.face * len * 0.32 + Math.sin(f.ph * 1.3) * f.face + wind, hy, f.face, 1, f.ph * 0.3);   // 身子在洞里，只露个脑袋（狼鳗要扑之前一抖）
        c.restore();
      } else if (f.dizzy > 0) { c.save(); c.translate(f.x, f.y); c.rotate(Math.PI + Math.sin(g.anim * 3) * 0.2); drawFish(g, f.sp, f.size, 0, 0, -f.face, 1, 0, true); c.restore(); dizzyStars(c, f.x, f.y - SPECIES[f.sp].len[f.size] * 0.4 - 3, g.anim); }   // 被顶晕：翻肚皮、冒星星
      else drawFish(g, f.sp, f.size, f.x, f.y, f.face, 1, f.ph, f.flee > 0 || f.spike > 0 || f.ram > 0 || f.flinch > 0);
      c.globalAlpha = 1;
    });   // 大白鲨下水，鱼都吓跑了
    drawEels(g);
    drawEcho(g);
    drawBoatFront(g);
    drawShore(g);
    drawActHint(g);
    if (g.fight) drawShark(g);
    if (!g.seal.land) shadowUnder(g, g.seal.x, g.seal.y + 6, 24);
    if (!cookingBehind(g)) drawSeal(g);   // 做饭的时候在 drawShore 里画（柜台后面）
    drawKelp(g, true);
    drawBubs(g);
    drawDrops(g);
    fishTags(g);   // 鱼的小牌子压在最上面，别被海狗挡住
    c.restore();
    // 5 前景剪影
    drawFronts(g);
    drawInk(g);
    c.restore();
    bakeSome(g, need);
    drawDarkness(g);
    drawHUD(g);
  }


  // 越往深越暗；深坑没头灯一片黑，只有海狗身边一小圈
  // 越往深越暗；最黑的深海有头灯也只照亮身边一圈
  function drawDarkness(g) {
    const s = g.seal, S = g.S, cx = g.cam.x, cy = g.cam.y, lamp = has(S, 'lamp');
    // 越往下越暗：到最黑的深海那一段不再是一刀切，而是像光照衰减一样慢慢黑下去（11-25 作者：明暗交界太明显）
    const L0 = BAY.LOOK.light0, D0 = BAY.DARK_Y - 70, D1 = BAY.DARK_Y + 110, deep = lamp ? 0.82 : 0.95, mid = (D0 - L0) / (BAY.DARK_Y - L0) * 0.5;
    const dk = y => { if (y < L0) return 0; if (y < D0) return (y - L0) / (BAY.DARK_Y - L0) * 0.5; if (y > D1) return deep; const t = (y - D0) / (D1 - D0); return mid + (deep - mid) * t * t * (3 - 2 * t); };
    if (dk(cy + VH) <= 0.01) { drawVignette(g); return; }
    if (!g.dark) { g.dark = document.createElement('canvas'); g.dark.width = W * SC; g.dark.height = H * SC; }
    const d = g.dark.getContext('2d');
    d.setTransform(SC, 0, 0, SC, 0, 0);
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, W, H);
    const gr = d.createLinearGradient(0, 0, 0, H), stops = [];
    for (let y = 0; y <= H; y += 8) stops.push(y);
    stops.forEach(y => gr.addColorStop(clamp(y / H, 0, 1), 'rgba(2,6,24,' + dk(cy + y / Z).toFixed(3) + ')'));
    d.fillStyle = gr;
    d.fillRect(0, Math.max(0, (WY - cy) * Z), W, H);
    d.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => { const q = d.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(0,0,0,1)'); q.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = q; d.beginPath(); d.arc(x, y, r, 0, Math.PI * 2); d.fill(); };
    const X = x => (x - cx) * Z, Y = y => (y - cy) * Z;
    if (!s.land) hole(X(s.x), Y(s.y), (lamp && s.y > 300 ? 80 : 36) * Z);
    g.pos.vents.forEach(([x, y]) => hole(X(x), Y(y - 14), 26 * Z));
    hole(X(g.pos.shop[0]), Y(g.pos.shop[1] - 4), 46 * Z);   // 铺子的灯照亮一大圈
    (g.eels || []).forEach(e => { if (Math.abs(e.x - cx - VW / 2) < VW && Math.abs(e.y - cy - VH / 2) < VH) hole(X(e.x), Y(e.y), (e.zap > 0 ? 34 : 16) * Z); });
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
  function drawFish(g, sp, size, x, y, face, scale, ph, alt) {
    const c = g.c, D = SPECIES[sp];
    const len = D.len[size] * (scale || 1);
    const im = art(D.sheet || 'fish6');
    c.save(); c.translate(x, y); if (face < 0) c.scale(-1, 1);
    if (im) { const fr = alt && D.sheet ? 2 : Math.floor((ph || 0) * 4) % 2; c.drawImage(im, fr * 144, D.row * 96, 144, 96, -len * 0.6, -len * 0.4, len * 1.2, len * 0.8); }   // 珊瑚礁的鱼第 3 格：受惊 ／ 顶出洞 ／ 刺炸起来
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
  function dizzyStars(c, x, y, tm) {
    c.fillStyle = '#fff27a';
    for (let i = 0; i < 3; i++) { const a = tm * 5 + i * 2.1; c.beginPath(); c.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 1.6, 1, 0, Math.PI * 2); c.fill(); }
  }
  // 海狗身边几条鱼头上的小牌子：抓到过的写名字和大小，没抓过的是"？"（作者 11B）
  function fishTags(g) {
    const c = g.c, s = g.seal, S = g.S;
    if (s.land || g.fight || s.clamp) return;
    const near = g.fish.filter(f => !f.gone && !(f.esc > 0) && (!f.lead || f.lead.gone || f.dizzy > 0) && !(f.hide && !(f.glow > 0) && f.ls !== 'out') && !(SPECIES[f.sp].camo && !(f.seen > 0) && !(f.glow > 0)) && !hiddenByCover(S, f.x, f.y) && dist(f.x, f.y, s.x, s.y) < 46)
      .sort((a, b) => dist(a.x, a.y, s.x, s.y) - dist(b.x, b.y, s.x, s.y)).slice(0, 3);
    c.font = 'bold 5px ' + FONT;
    near.forEach(f => {
      const t = S.dex && S.dex[f.sp] ? fishTag(f.sp, f.size) : '？', w = c.measureText(t).width + 5, y = f.y - SPECIES[f.sp].len[f.size] * 0.42 - 8;
      c.globalAlpha = clamp((46 - dist(f.x, f.y, s.x, s.y)) / 10, 0, 1) * 0.92;
      rrect(c, f.x - w / 2, y - 3.6, w, 7.2, 2.5); c.fillStyle = 'rgba(255,252,236,.9)'; c.fill();
      txt(c, f.x, y, t, 5, '#1a3a5a', 'center', true);
      c.globalAlpha = 1;
    });
  }
  // 岸上能"用"的东西头上一个小三角：攻击键这时候是"用"
  const TOPH = { tent: 34, tank: 30, gong: 21, basin: 23, pot: 40, pipe: 19, mA: 36, mB: 36, mC: 36, gate: 72, gateL: 72 };
  function drawActHint(g) {
    const s = g.seal, c = g.c;
    if (!s.land || g.panel || locked(g) || (g.boss && g.boss.phase === 'alarm') || g.screen !== 'play') return;
    const t = actTarget(g);
    if (!t || t.k === 'dex') return;
    const y = GY - (TOPH[t.k] || 30) - 3 - Math.abs(Math.sin(g.anim * 4)) * 2;
    c.fillStyle = '#fff6a0'; c.strokeStyle = 'rgba(60,30,0,.85)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(t.x - 3, y - 3); c.lineTo(t.x + 3, y - 3); c.lineTo(t.x, y + 1); c.closePath(); c.fill(); c.stroke();
  }
  // 摊子左边柱子上钉的鱼谱（点开是图鉴）；Codex 的图来了换
  function drawPoster(g) {
    const c = g.c, x = POSTER.x, y0 = POSTER.y0, y1 = POSTER.y1, w = 8.5, im = art('poster');
    if (im) { c.drawImage(im, x - w / 2 - 1, y0 - 1, w + 2, y1 - y0 + 2); txt(c, x + 0.2, y0 + 2.3, L.poster, 2.3, '#7a2a10', 'center', true); return; }   // 图上面留了一条空白写字
    c.save(); c.translate(x, y0); c.rotate(-0.06); c.translate(-x, -y0);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x - w / 2 + 0.6, y0 + 0.6, w, y1 - y0);
    c.fillStyle = '#f4e8c8'; c.fillRect(x - w / 2, y0, w, y1 - y0);
    c.strokeStyle = '#9a7040'; c.lineWidth = 0.4; c.strokeRect(x - w / 2, y0, w, y1 - y0);
    txt(c, x, y0 + 2.4, L.poster, 2.6, '#8a2010', 'center', true);
    drawFish(g, 'yellow', 1, x - 1.5, y0 + 6, 1, 0.32, 0);
    drawFish(g, 'bass', 1, x + 1, y0 + 10, 1, 0.3, 0);
    c.fillStyle = '#d02a1a'; c.beginPath(); c.arc(x, y0 + 0.6, 0.8, 0, Math.PI * 2); c.fill();
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
    const im = aart('merchants');
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
    const tent = aart('tent');
    if (tent) c.drawImage(tent, SPOT.tent - 22, FOOT - LOOK.tentFoot * 33 / 120, 44, 33); else emoji(c, '⛺', SPOT.tent, GY - 12, 24);
    if (C.tank && SPOT.tank != null) {
      // 家里的水族箱：每个大小在图里实际占的框（量出来的），按玻璃宽 16 ／ 24 ／ 32 ／ 40 摆，脚贴栈道；鱼只在玻璃里面游（作者：鱼怎么跑到缸外面了）
      const tk = art('tanks'), sz = lvOf(S, 'tank') - 1;
      const CB = [[71, 34, 128, 106], [36, 28, 164, 111], [18, 23, 182, 117], [2, 39, 198, 101]][sz], k = [16, 24, 32, 40][sz] / (CB[2] - CB[0]);
      const left = SPOT.tank - (CB[0] + CB[2]) / 2 * k, top = FOOT - CB[3] * k;
      const bx0 = left + CB[0] * k, bx1 = left + CB[2] * k, by0 = top + CB[1] * k, by1 = top + CB[3] * k, bw = bx1 - bx0, bh = by1 - by0;
      if (tk) c.drawImage(tk, sz * 200, 0, 200, 140, left, top, 200 * k, 140 * k);
      else { c.fillStyle = 'rgba(160,220,255,.6)'; c.fillRect(bx0, by0, bw, bh); c.strokeStyle = '#5a3a1a'; c.lineWidth = 1.5; c.strokeRect(bx0, by0, bw, bh); }
      c.save(); c.beginPath(); c.rect(bx0 + bw * 0.08, by0 + bh * 0.2, bw * 0.84, bh * 0.62); c.clip();
      S.tank.fish.slice(0, sz + 2).forEach((f, i) => {
        const fs = Math.min(1, f.size), len = SPECIES[f.sp].len[fs], sc = bw * 0.26 / len, ph = tm * 0.45 + i * 2.1;
        drawFish(g, f.sp, fs, bx0 + bw * (0.5 + Math.sin(ph) * 0.27), by0 + bh * (0.42 + (i % 3) * 0.12) + Math.sin(tm * 1.7 + i) * 0.5, Math.cos(ph) > 0 ? 1 : -1, sc, tm + i);
      });
      c.restore();
    }
    drawPot(g);
    if (cookingBehind(g)) drawSeal(g);
    const st = aart('stall');
    if (st) c.drawImage(st, SPOT.pot - 30, FOOT - 35, 60, 35);
    else { c.fillStyle = '#c8402a'; c.fillRect(SPOT.pot - 28, GY - 40, 64, 6); c.fillStyle = '#e8d8b0'; c.fillRect(SPOT.pot - 26, GY - 34, 2, 34); c.fillRect(SPOT.pot + 32, GY - 34, 2, 34); c.fillStyle = '#9a6a3a'; c.fillRect(SPOT.pot - 24, GY - 9, 50, 9); }
    drawPoster(g);
    drawSteam(g, g.potSteam, 1);
    drawWarm(g);
    drawTub(g);
    const gg = aart('gong');
    if (gg) c.drawImage(gg, SPOT.gong - 8, FOOT - LOOK.gongFoot, 16, 20);
    else { c.strokeStyle = '#6a4a2a'; c.lineWidth = 1.5; c.strokeRect(SPOT.gong - 7, GY - 20, 14, 20); c.fillStyle = '#e0a020'; c.beginPath(); c.arc(SPOT.gong, GY - 12, 5.5, 0, Math.PI * 2); c.fill(); }
    if (art('bin')) c.drawImage(art('bin'), SPOT.bin - 6.5, FOOT - 16.25, 13, 16.25);
    else { const bx = SPOT.bin; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(bx, GY, 6, 1.4, 0, 0, Math.PI * 2); c.fill(); const bg = c.createLinearGradient(bx - 4, 0, bx + 4, 0); bg.addColorStop(0, '#5a8a5a'); bg.addColorStop(0.4, '#3f7044'); bg.addColorStop(1, '#2a4e30'); c.fillStyle = bg; c.beginPath(); c.moveTo(bx - 4, GY - 9); c.lineTo(bx + 4, GY - 9); c.lineTo(bx + 3.4, GY); c.lineTo(bx - 3.4, GY); c.closePath(); c.fill(); c.fillStyle = '#2e5634'; rrect(c, bx - 4.8, GY - 10.6, 9.6, 2.2, 1); c.fill(); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 0.4; for (let k = -2; k <= 2; k += 2) { c.beginPath(); c.moveTo(bx + k, GY - 8); c.lineTo(bx + k * 0.85, GY - 1); c.stroke(); } }
    Object.keys(SHORE).forEach(k => drawMerchant(g, SHORE[k], SPOT[k], GY - 14, 22));
    if (g.boss && !g.fight) drawJudge(g);
    g.tourists.forEach(o => drawTourist(g, o));
    if (AREA === 'kelp' && S.license3) txt(c, SPOT.gate, GY - 26, L.fix, 6, '#fff', 'center', true, '#5a1a00');   // 下一个展区（深海沟）还没做
  }

  function potStage(g) { const se = g.session; return !se ? 0 : se.phase === 'prep' ? 1 + Math.min(3, Math.floor(se.t / 0.8)) : se.phase === 'heat' ? (se.p >= 1 ? 6 : zoneName(se.p) === 'best' ? 5 : 4) : se.phase === 'bid' ? 4 : 0; }
  // 岸上的锅：侧面，灶大半在柜台后面；热气、泡、最佳的金光、糊了的黑烟（Codex 的 potside 到了换图）
  function drawPot(g) {
    const c = g.c, se = g.session, tm = g.anim, x = SPOT.pot + 7, y = FOOT, st = potStage(g);   // 锅在柜台后面靠右，左边留给掌勺的海狗
    const raw = se && se.recipe && RECIPES[se.recipe].raw, plat = raw && art('reef/platter');
    if (plat) { c.drawImage(plat, (se.phase === 'bid' ? 1 : 0) * 160, 0, 160, 140, x - 17, y - 5 - 29.75, 34, 29.75); return; }   // 做刺身：锅换成冰盘（生鱼片不进锅）
    const side = art('potside'), burning = st > 0 || (se && se.phase === 'bid');
    if (side) { c.drawImage(side, [0, 1, 1, 1, 2, 3, 4][st] * 160, 50, 160, 90, x - 17, y - 5 - 19.1, 34, 19.1); return; }   // 只取锅和灶（第 50 行往下），垫高 5；热气在 drawSteam 里飘（作者：锅快看不见了、没有蒸汽动画）
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
    g.pclBox = [cx, iy + ih / 2, ih];   // 特写里锅的位置（热气从这儿冒）
    const R0 = se.recipe && RECIPES[se.recipe], two = R0 && R0.close != null, raw = R0 && R0.raw;
    const close = art(two ? (R0.closeSheet || 'reef/potclose2') : 'potclose'), p6 = art('pot6'), row = two ? R0.close : se.recipe ? Math.max(0, ['clear', 'spicy', 'sour'].indexOf(se.recipe)) : 0;
    const frame = (s2, a, z) => {
      if (a <= 0.01 || s2 == null) return;
      c.globalAlpha = pop * a;
      c.save(); c.translate(cx, iy + ih / 2); c.scale(z, z); c.translate(-cx, -(iy + ih / 2));
      if (close) c.drawImage(close, s2 * 400, (s2 === 0 && !two ? 0 : row) * 300, 400, 300, cx - iw / 2, iy + ih / 2 - iw * 3 / 8, iw, iw * 3 / 4);   // 铺满框的宽，上下多出来的被圆角框裁掉（作者：特写两边有黑边）
      else if (p6) c.drawImage(p6, s2 * 160, 0, 160, 140, cx - ih * 0.57, iy, ih * 1.14, ih);
      c.restore();
    };
    c.save(); rrect(c, ix, iy, iw, ih, 8); c.clip();
    c.fillStyle = '#2a1a10'; c.fillRect(ix, iy, iw, ih);
    frame(g.pcl.prev, 1 - k, 1);
    frame(st, k, 1.06 - 0.06 * k);
    c.globalAlpha = pop;
    drawSteam(g, g.closeSteam, 1);   // 特写里的热气：一团团的雾（原来那几道白线太 low）
    c.restore();
    c.globalAlpha = pop;
    c.strokeStyle = 'rgba(90,50,10,.6)'; c.lineWidth = 1.2; rrect(c, ix, iy, iw, ih, 8); c.stroke();
    if (se.phase === 'prep') txt(c, cx, y + 9, (raw ? L.stepsRaw : L.steps)[Math.min(3, Math.floor(se.t / 0.8))], 7.5, '#4a2000', 'center', true);
    else {
      txt(c, cx, y + 9, st === 6 ? (raw ? L.burntRaw : L.burnt) : raw ? L.openRaw : L.openPot, 7.5, st === 6 ? '#a01a0a' : '#4a2000', 'center', true);
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
  // 吃的样子（3 秒）：端碗 → 嚼 → 反应 → 拍肚子。Codex 的爽吃补图 tourists6c 来之前，用现有几格加动作顶着
  //   tourists6c 每行 7 格：0 夹一口、1 嚼、2 爽到、3 拍肚子、4 竖大拇指、5 皱眉硬咽、6 招牌爽法
  function eatPose(g, o) {
    const E = o.show || { tier: 1 }, t = o.t, tm = g.anim;
    const T0 = TOURISTS[o.k], im6b = art(tsheet(T0, 'b')), im6c = art(tsheet(T0, 'c'));
    const P = { sheet: null, col: 5, foot: null, dx: 0, dy: 0, rot: 0, fx: null, stage: t < 0.45 ? 'lift' : t < 1.6 ? 'chew' : t < 2.4 ? 'react' : 'pat' };
    if (P.stage === 'lift') P.dy = -Math.min(1, t / 0.45) * 1.2;
    else if (P.stage === 'chew') { P.dy = -Math.abs(Math.sin(t * 16)) * 1.2; P.fx = 'chew'; }
    else if (P.stage === 'react') {
      const k = (t - 1.6) / 0.8;
      if (E.tier === 2) {
        P.col = 4; P.fx = 'big';
        if (o.k === 'bird') { P.dy = -Math.sin(k * Math.PI) * 7; P.rot = Math.sin(tm * 24) * 0.06; }              // 海鸟：鲜得飘起来扑腾
        else if (o.k === 'shark') { P.rot = Math.sin(tm * 30) * 0.05; P.dy = -Math.abs(Math.sin(t * 10)); }      // 鲨鱼：辣得直颤、嘴里喷火
        else if (k < 0.45) { P.col = 3; P.dx = Math.sin(tm * 70) * 0.9; } else P.dy = Math.abs(Math.sin(t * 12)) * 1.4;   // 熊、企鹅：酸得眯眼哆嗦，再猛点头
      } else if (E.tier === 1) P.dy = Math.abs(Math.sin(t * 9)) * 1.1;                                          // 点点头
      else { P.col = 3; P.dx = Math.sin(tm * 25) * 0.4; P.fx = 'sigh'; }                                       // 皱眉硬咽
    } else if (E.tier >= 1 && im6b) { P.sheet = im6b; P.col = 0; P.foot = 91; P.dy = -Math.abs(Math.sin(t * 14)) * 0.8; }   // 拍拍肚子
    else P.col = E.tier >= 1 ? 5 : 3;
    if (im6c) {
      P.sheet = im6c; P.foot = 91; P.dx = 0; P.rot = 0; if (P.stage === 'react' && E.tier === 2 && o.k !== 'bird') P.dy = 0;   // 海鸟飘起来还是程序往上挪，别的动作图里自己有
      P.col = P.stage === 'lift' ? 0 : P.stage === 'chew' ? 1 : P.stage === 'react' ? (E.tier === 2 ? (t < 2 ? 2 : 6) : E.tier === 1 ? 4 : 5) : (E.tier >= 1 ? 3 : 5);
    }
    return P;
  }
  function sparkle(c, x, y, r) {
    c.beginPath(); c.moveTo(x, y - r * 2); c.lineTo(x + r * 0.5, y); c.lineTo(x, y + r * 2); c.lineTo(x - r * 0.5, y); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x - r * 2, y); c.lineTo(x, y + r * 0.5); c.lineTo(x + r * 2, y); c.lineTo(x, y - r * 0.5); c.closePath(); c.fill();
  }
  function eatFx(g, o, face, P) {
    const c = g.c, tm = g.anim, t = o.t, mx = o.x + face * (o.k === 'shark' ? 7 : 5) + P.dx, my = FOOT - 16 + P.dy;   // 嘴大概在这儿
    if (P.fx === 'chew') {   // 嚼：嘴边掉渣
      c.fillStyle = 'rgba(255,244,210,.95)';
      for (let i = 0; i < 2; i++) { const k = (t * 2.5 + i * 0.5) % 1; c.beginPath(); c.arc(mx + face * (1 + k * 2), my + k * 7, 0.6, 0, Math.PI * 2); c.fill(); }
    } else if (P.fx === 'big') {
      const k = (t - 1.6) / 0.8;
      c.fillStyle = '#fff27a'; c.globalAlpha = 1 - k * 0.5;
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + tm * 3; sparkle(c, o.x + P.dx + Math.cos(a) * 12, FOOT - 18 + P.dy + Math.sin(a) * 6, 0.9); }
      c.globalAlpha = 1;
      if (art(tsheet(TOURISTS[o.k], 'c'))) return;   // 补图里自己画了招牌（喷火、飘起来、打哆嗦），程序就不再画一遍
      if (o.k === 'shark') {   // 喷火
        for (let i = 0; i < 7; i++) { const q = (tm * 2.6 + i / 7) % 1; c.globalAlpha = 1 - q; c.fillStyle = q < 0.35 ? '#fff0a0' : q < 0.7 ? '#ffa020' : '#e8401a'; c.beginPath(); c.arc(mx + face * (1 + q * 11), my - 1 + Math.sin(i * 2.3 + tm * 9) * q * 2.5, 0.7 + q * 1.9, 0, Math.PI * 2); c.fill(); }
        c.globalAlpha = 1;
      } else if (o.k === 'bird') {   // 扑腾起来的小水珠
        c.fillStyle = 'rgba(200,244,255,.9)';
        for (let i = 0; i < 4; i++) { const q = (tm * 1.8 + i / 4) % 1; c.beginPath(); c.arc(o.x + (i - 1.5) * 4, FOOT - 3 + P.dy * 0.3 + q * 4, 0.7, 0, Math.PI * 2); c.fill(); }
      } else if (k < 0.45) {   // 酸得打哆嗦：头两边几道抖线
        c.strokeStyle = '#a8d040'; c.lineWidth = 0.6;
        [-1, 1].forEach(sd => { c.beginPath(); for (let j = 0; j < 4; j++) c.lineTo(o.x + sd * (9 + (j % 2) * 1.6), FOOT - 22 + j * 2.2); c.stroke(); });
      }
    } else if (P.fx === 'sigh') {   // 叹气：嘴边一团灰气
      const k = (t - 1.6) / 0.8;
      c.fillStyle = 'rgba(190,190,190,' + (0.7 * (1 - k)) + ')';
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(mx + face * (2 + k * 6 + i * 2), my - k * 3 - i, 1 + k * 1.5, 0, Math.PI * 2); c.fill(); }
    }
  }
  function drawTourist(g, o) {
    const c = g.c, T = TOURISTS[o.k], tm = g.anim;
    const y = GY;
    const face = o.ph === 'out' ? (o.x < SPOT.pot ? -1 : 1) : o.ph === 'in' ? (o.slot > o.x ? 1 : -1) : (o.x < SPOT.pot ? 1 : -1);
    const im6 = art(tsheet(T, '')), im6b = art(tsheet(T, 'b')), se = g.session;
    const smell = se && (se.phase === 'prep' || se.phase === 'heat') && (potStage(g) === 4 || potStage(g) === 5);   // 烧开、最佳的时候闻香味；糊了不闻
    let sheet = im6, col, foot, P = null;
    if (o.ph === 'out' && (o.huff > 0 || (T.puff && o.mad))) col = 3;            // 摇摇头，要走了（河豚：气鼓鼓的刺球，一路滚走）
    else if (o.ph === 'in' || o.ph === 'out') col = Math.floor(tm * 6) % 2;
    else if (o.ph === 'eat') { P = eatPose(g, o); col = P.col; if (P.sheet) sheet = P.sheet; foot = P.foot; }   // 吃的演出
    else if (o.bid) col = 4;
    else if (im6b) { sheet = im6b; col = smell ? 1 : 0; foot = 91; }              // 站着等 ／ 锅开了伸着脖子闻
    else col = 0;
    if (foot == null) foot = T.set ? 90 : TFOOT[T.row][col];
    const roll = T.puff && o.mad && o.ph === 'out' && !(o.huff > 0);
    if (im6) { c.save(); c.translate(o.x + (P ? P.dx : 0), FOOT + 12 - foot * 0.25 + (P ? P.dy : 0)); if (face < 0) c.scale(-1, 1); if (P && P.rot) c.rotate(P.rot); if (roll) c.rotate(face * o.x / 9); c.drawImage(sheet, col * 96, T.row * 96, 96, 96, -12, -12, 24, 24); c.restore(); }
    else {
      const old = art('tourists');
      const oc = o.ph === 'eat' ? 2 : (o.ph === 'in' || o.ph === 'out') ? Math.floor(tm * 6) % 2 : 0;
      c.save(); c.translate(o.x, y - 10 - (o.bump > 0 ? 2 : 0)); if (face < 0) c.scale(-1, 1);
      if (old) c.drawImage(old, oc * 80, T.row * 80, 80, 80, -11, -11, 22, 22); else emoji(c, T.e, 0, 0, 14);
      c.restore();
    }
    if (P && P.fx) eatFx(g, o, face, P);
    // 说的话
    // 说话的泡泡跟字一样宽，别挡旁边的价钱
    if (o.say && o.sayT >= 0 && o.sayT < 2.4) { c.globalAlpha = clamp(2.4 - o.sayT, 0, 1); const sim = art('say'); if (sim) { c.font = 'bold 5.5px ' + FONT; const sw = Math.max(26, c.measureText(o.say).width + 12); const ly = y - 42 - (o.lane || 0) * 14; c.drawImage(sim, o.x - sw / 2, ly, sw, 13); txt(c, o.x, ly + 5.6, o.say, 5.5, '#3a2008', 'center', true); } else { rrect(c, o.x - 24, y - 40, 48, 11, 3); c.fillStyle = 'rgba(255,255,255,.92)'; c.fill(); txt(c, o.x, y - 34.5, o.say, 5.5, '#3a2008', 'center', true); } c.globalAlpha = 1; }
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
    const sk2 = D.fight === 'shark' ? art('shark2') : D.fight === 'leopard' ? art('reef/leopard') : D.fight === 'octo' ? art('kelp/octo') : null, im = D.fight === 'shark' ? (sk2 || art('shark')) : D.fight ? sk2 : aart('judges');
    const bigFoot = D.fight === 'shark' ? 156 : 154;   // 上排桌腿底边在第几行
    // 第三位吃完：跳下水（往打架那片水扑过去，一道弧线、扎下去）
    if (B.phase === 'show' && B.step >= 6) {
      const k = clamp(B.t / 0.6, 0, 1), tx = SHOW_SPOT - 10, ty = WY + 30, sim = art('shark');
      if (sk2) c.drawImage(sk2, 3 * 160, 0, 160, 160, x - 18, FOOT - bigFoot * 0.225, 36, 36);   // 桌子和碗留在原地
      const lx = x + (tx - x) * k, ly = FOOT - 16 + (ty - FOOT + 16) * k - Math.sin(k * Math.PI) * 34;
      c.save(); c.translate(lx, ly);
      if (sk2) { c.rotate(-0.35 + k * 0.7); c.drawImage(sk2, 4 * 160, 0, 160, 160, -20, -20, 40, 40); }   // 系着餐巾扑下去的那格
      else { c.rotate(-0.5 + k * 1.6); if (sim) c.drawImage(sim, 2 * 320, 160, 320, 160, -32, -16, 64, 32); else emoji(c, '🦈', 0, 0, 20); }
      c.restore();
      return;
    }
    // 进场：从天上掉下来（先是地上一块影子越来越大），砸下来压扁一下、起一圈灰
    let drop = 0, squash = 0;
    if (B.phase === 'alarm') {
      if (B.t < DROP.start) return;
      const k = clamp((B.t - DROP.start) / (DROP.land - DROP.start), 0, 1);
      if (k < 1) { drop = -120 * (1 - k * k); c.fillStyle = 'rgba(0,0,0,' + (0.15 + 0.25 * k) + ')'; c.beginPath(); c.ellipse(x, FOOT, 6 + 12 * k, 1.4 + 1.8 * k, 0, 0, Math.PI * 2); c.fill(); }
      else { const a = B.t - DROP.land; squash = a < 0.28 ? Math.sin(a / 0.28 * Math.PI) * 0.22 : 0; }
    }
    c.save(); c.translate(x, FOOT + drop); c.scale(1 + squash, 1 - squash); c.translate(-x, -FOOT);
    if (im) {
      if (D.fight) { const f = B.glare ? 2 : B.eat > 0 ? 1 : 0; c.drawImage(im, f * 160, 0, 160, 160, x - 18, FOOT - (sk2 ? bigFoot : [156, 153, 150][f]) * 0.225, 36, 36); }
      else { const f = B.eat > 0 ? 2 : B.mad > 0 ? 3 : 0; c.drawImage(im, f * 160, D.row * 160, 160, 160, x - 18, FOOT - D.foot[f] * 0.225, 36, 36); }
    } else emoji(c, D.e || TOURISTS[D.who].e, x, y - 14, 26, true);
    c.restore();
    if (B.phase === 'alarm' && B.t >= DROP.land && B.t - DROP.land < 0.9) {   // 落地起的灰，往两边滚开（画在大胃王前面）
      const q = (B.t - DROP.land) / 0.9;
      c.fillStyle = 'rgba(236,224,200,' + (0.85 * (1 - q)) + ')';
      for (let i = 0; i < 10; i++) { const sd = i % 2 ? 1 : -1, j = Math.floor(i / 2); c.beginPath(); c.arc(x + sd * (10 + q * (16 + j * 5)), FOOT - 1.5 - q * (1.5 + j * 1.6), 2.4 + q * 3.6 - j * 0.2, 0, Math.PI * 2); c.fill(); }
    }
    if (B.say > 0 && B.line) { const sim = art('say'); c.font = 'bold 6.5px ' + FONT; const bw = Math.max(76, c.measureText(B.line).width + 16); if (sim) { c.drawImage(sim, x - bw / 2, y - 50, bw, 16); txt(c, x, y - 43.4, B.line, 6.5, '#7a1a0a', 'center', true); } else { rrect(c, x - 36, y - 48, 72, 13, 4); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill(); txt(c, x, y - 41.5, B.line, 6.5, '#7a1a0a', 'center', true); } }   // 泡泡跟字一样宽（作者：字出去了）
  }
  const SEAL_FOOT = [64, 70, 67, 69, 88, 73, 75, 88, 87, 71];   // seal.webp 每格海狗最下面在第几行（量出来的）
  function drawSeal(g) {
    const c = g.c, s = g.seal, tm = g.anim, S = g.S;
    const im = art('seal');
    if (s.hurt > 0 && Math.floor(tm * 12) % 2) return;
    let fr, f2 = -1, lx = 0, hop = 0, rot = 0;   // f2：seal2 里的格（0 张嘴扑、1 咬住、2 顶、3 被夹）
    const bk = s.biteT > 0 ? Math.sin((1 - s.biteT / 0.28) * Math.PI) : 0, ak = s.atkT > 0 ? Math.sin((1 - s.atkT / 0.3) * Math.PI) : 0;
    if (s.land) { fr = g.session && ['prep', 'heat'].indexOf(g.session.phase) >= 0 ? 8 : s.moving ? 5 + Math.floor(tm * 6) % 2 : 7; hop = Math.max(bk, ak) * 2; if (LOOK.cart && cookingBehind(g)) hop += 7; }   // 珊瑚礁起的推车比浅水湾的柜台高：做菜的时候站高一点，露出脑袋
    else if (s.clamp) { fr = 4; f2 = 3; rot = Math.sin(tm * 22) * (s.clamp.kick > 0 ? 0.3 : 0.12); }   // 被夹住：使劲扭
    else if (g.fight && g.fight.grab) { fr = 4; f2 = 3; rot = Math.sin(tm * 22) * (g.fight.grab.kick > 0 ? 0.3 : 0.12); }   // 被触手缠住：使劲扭
    else if (s.biteT > 0) { fr = s.biteT > 0.13 ? 3 : 0; f2 = s.biteT > 0.13 ? 0 : 1; lx = bk * 3; }   // 叼：张嘴往前一扑、咬住
    else if (s.atkT > 0) { fr = 2; f2 = 2; lx = ak * 5; }                                              // 攻击：低头往前一顶
    // seal2 第一次交的头小脖子细（作者：太奇怪了），Codex 照 seal.webp 的比例重画过了（11-25）
    else fr = s.bump > 0 || s.hurt > 0 ? 4 : s.dashT > 0 ? 2 : g.fight ? 9 : S.basket.length ? 3 : Math.floor(tm * 5) % 2;
    const y = (s.land ? (im ? FOOT + 10.5 - SEAL_FOOT[fr] * 21 / 90 : GY - 8) : s.y) - hop;   // 每一格海狗脚底在图里的位置不一样，对齐到栈道面
    c.save(); c.translate(s.x + s.face * lx, y); if (s.face < 0) c.scale(-1, 1); if (rot) c.rotate(rot);
    const im2 = art('seal2');
    if (im2 && f2 >= 0 && !s.land) c.drawImage(im2, f2 * 120, 0, 120, 90, -14, -10.5, 28, 21);
    else if (im) c.drawImage(im, fr * 120, 0, 120, 90, -14, -10.5, 28, 21);
    else { if (!s.land) c.rotate(clamp(s.vy / 140, -0.6, 0.6)); emoji(c, '🦭', 0, 0, 16, true); }
    c.restore();
    if (!s.land && s.zapCD > 0.75) {   // 被电鳗电了：身上几道蓝白电弧
      c.strokeStyle = 'rgba(210,245,255,.9)'; c.lineWidth = 0.7;
      for (let i = 0; i < 4; i++) { const a = tm * 13 + i * 1.6; c.beginPath(); let px = s.x + Math.cos(a) * 5, py = s.y + Math.sin(a) * 4; c.moveTo(px, py); for (let k = 0; k < 3; k++) { px += Math.cos(a + k) * 3.5 + Math.sin(tm * 40 + k) * 1.5; py += Math.sin(a + k) * 3 + Math.cos(tm * 37 + k) * 1.5; c.lineTo(px, py); } c.stroke(); }
    }
    if (!s.land && s.flickT > 0) {   // 甩尾：身后两道弯弯的速度线
      const k = s.flickT / 0.45, ang = Math.atan2(s.vy, s.vx), bx = s.x - Math.cos(ang) * 12, by = s.y - Math.sin(ang) * 12;
      c.strokeStyle = 'rgba(235,250,255,' + (0.85 * k) + ')'; c.lineWidth = 0.9; c.lineCap = 'round';
      [-1, 1].forEach(sd => { const px = -Math.sin(ang) * sd * 4, py = Math.cos(ang) * sd * 4; c.beginPath(); c.moveTo(bx + px, by + py); c.quadraticCurveTo(bx + px - Math.cos(ang) * 8 + px, by + py - Math.sin(ang) * 8 + py, bx - Math.cos(ang) * 16 + px * 0.5, by - Math.sin(ang) * 16 + py * 0.5); c.stroke(); });
    }
    if (s.clamp) { const P = seatAt(g, s.clamp.x, s.clamp.y + 4, 9); c.save(); c.translate(s.clamp.x, P.y + 1.5); c.rotate(P.ang); drawClam(c, 0, -4, false, false); c.restore(); }   // 合上的贝壳压在海狗脑袋上（跟地上那只一样歪）
    if (!s.land && S.basket.length && !(s.biteT > 0.13) && !s.clamp) {
      const f = S.basket[0];
      if (f.sp) drawFish(g, f.sp, f.size, s.x + s.face * 11, s.y + 2, s.face, 0.55, tm);
      else drawSeabed(c, { shoe: 5, can: 6, tire: 7 }[f.junk], s.x + s.face * 11, s.y + 2, 8);
    }
  }
  // 豹海豹（reef/leopard 下排 9 格：0 1 游、2 蓄力发红、3 猛冲、4 刹车掉头、5 被撞、6 撞晕了、7 服了、8 被惹急了）
  function drawLeopard(g) {
    const c = g.c, F = g.fight, K = F.shark, tm = g.anim, im = art('reef/leopard'), A = BAY.FIGHT;
    if (K.st === 'gone') return;
    if (K.st === 'mark') {   // 要从哪儿扎下来：顶上一圈圈红波纹 + 一条淡红的光柱，定住了更亮
      const lock = K.t <= 0.35, k = (tm * 3) % 1, x = K.mx, y = A.y0 + 8;
      const ca = lock ? 0.42 + 0.2 * Math.sin(tm * 30) : 0.3, col = c.createLinearGradient(0, A.y0, 0, A.y1);   // 定住了：一闪一闪
      col.addColorStop(0, 'rgba(255,50,30,' + ca + ')'); col.addColorStop(0.75, 'rgba(255,50,30,' + ca * 0.45 + ')'); col.addColorStop(1, 'rgba(255,50,30,0)');
      c.fillStyle = col; c.fillRect(x - 15, A.y0, 30, A.y1 - A.y0);
      c.strokeStyle = 'rgba(255,80,60,' + (lock ? 0.8 : 0.45) + ')'; c.lineWidth = 0.8; c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(x - 15, A.y0); c.lineTo(x - 15, A.y1); c.moveTo(x + 15, A.y0); c.lineTo(x + 15, A.y1); c.stroke(); c.setLineDash([]);
      c.strokeStyle = 'rgba(255,90,60,' + (0.8 * (1 - k)) + ')'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y, 6 + k * 16, 2 + k * 4, 0, 0, Math.PI * 2); c.stroke();
      txt(c, x, y + 12 - Math.abs(Math.sin(tm * 9)) * 2, '！', lock ? 14 : 11, '#ff3a2a', 'center', true, '#fff');
      return;
    }
    const fr = F.over && K.hp <= 0 ? 7 : K.st === 'hurt' || K.st === 'leap' ? 5 : K.st === 'stun' || K.st === 'sway' ? 6 : K.st === 'brake' ? 4 : K.st === 'rush' || K.st === 'dive' ? 3 : K.st === 'aim' ? 2 : K.hp <= 2 || K.st === 'land' ? 8 : Math.floor(tm * 4) % 2;
    if (K.st === 'rush' || K.st === 'dive') {   // 冲的时候后面一串水线
      c.strokeStyle = 'rgba(230,248,255,.6)'; c.lineWidth = 0.8;
      for (let i = 0; i < 4; i++) { const o = (i - 1.5) * 6, bx = K.x - Math.cos(K.a) * 30, by = K.y - Math.sin(K.a) * 30; c.beginPath(); c.moveTo(bx - Math.sin(K.a) * o, by + Math.cos(K.a) * o); c.lineTo(bx - Math.cos(K.a) * (14 + (i % 2) * 8) - Math.sin(K.a) * o, by - Math.sin(K.a) * (14 + (i % 2) * 8) + Math.cos(K.a) * o); c.stroke(); }
    }
    if (K.st === 'aim') {   // 蓄力：身后一团红光一闪一闪
      const r = c.createRadialGradient(K.x, K.y, 4, K.x, K.y, 34), a = 0.35 + 0.25 * Math.sin(tm * 18);
      r.addColorStop(0, 'rgba(255,60,30,' + a + ')'); r.addColorStop(1, 'rgba(255,60,30,0)'); c.fillStyle = r; c.beginPath(); c.arc(K.x, K.y, 34, 0, Math.PI * 2); c.fill();
    }
    c.save(); c.translate(K.x, K.y); c.rotate(K.a);
    if (Math.cos(K.a) < 0) c.scale(1, -1);
    c.scale(0.875, 0.875);
    if (K.st === 'aim') c.translate(Math.sin(tm * 70) * (K.lock ? 1.6 : 0.5), 0);   // 定死方向了：抖得更厉害
    if (K.hp <= 2 && K.st === 'circle') c.rotate(Math.sin(tm * 14) * 0.06);
    if (K.st === 'sway') c.rotate(Math.sin(tm * 6) * 0.28);   // 喝醉一样晃
    if (im) c.drawImage(im, fr * 320, 160, 320, 160, -36, -18, 72, 36);
    else { c.fillStyle = K.st === 'aim' ? '#d07070' : '#8a9098'; c.beginPath(); c.ellipse(0, 0, 32, 11, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.arc(22, -3, 1.8, 0, Math.PI * 2); c.fill(); }
    c.restore();
    if (K.st === 'stun' || K.st === 'sway') dizzyStars(c, K.x + Math.cos(K.a) * 20, K.y - 14, tm);
  }
  // 豹海豹的血（右上角三个小脑袋）：从水里游那格切个头
  function leoHead(c, full, x, y) {
    const im = art('reef/leopard');
    if (!im) { c.globalAlpha = full ? 1 : 0.3; emoji(c, '🦭', x + 5, y + 5, 8); c.globalAlpha = 1; return; }
    c.globalAlpha = full ? 1 : 0.3; c.drawImage(im, 196, 160 + 34, 100, 84, x - 1, y, 12, 10); c.globalAlpha = 1;
  }
  function drawShark(g) {
    if (g.fight.kind === 'leopard') { drawLeopard(g); return; }
    if (g.fight.kind === 'octo') { drawOcto(g); return; }
    const c = g.c, K = g.fight.shark, tm = g.anim, A = BAY.FIGHT;
    const sk2 = art('shark2'), im = sk2 || art('shark');
    if (K.st === 'away') return;
    if (K.st === 'warn') {   // 要从哪边冲进来：那边水里一个一跳一跳的红"！"、一圈圈波纹
      const wx = K.side < 0 ? A.x0 + 12 : A.x1 - 12, k = (tm * 3) % 1;
      c.strokeStyle = 'rgba(255,90,60,' + (0.7 * (1 - k)) + ')'; c.lineWidth = 1.2; c.beginPath(); c.arc(wx, K.ey, 6 + k * 14, 0, Math.PI * 2); c.stroke();
      txt(c, wx, K.ey - Math.abs(Math.sin(tm * 9)) * 2, '！', 13, '#ff3a2a', 'center', true, '#fff');
      return;
    }
    if (K.st === 'tired') { c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(K.x + Math.cos(K.a) * 30 + Math.sin(tm * 3 + i) * 3, K.y - 8 - ((tm * 18 + i * 7) % 20), 1.6, 0, Math.PI * 2); c.fill(); } }
    c.save(); c.translate(K.x, K.y); c.rotate(K.a);
    if (Math.cos(K.a) < 0) c.scale(1, -1);
    c.scale(0.875, 0.875);   // 打架的地方就一屏大，鲨鱼小一号
    if (im) {
      const mad = sk2 && K.hp <= 2 && K.st === 'chase';   // 血少了：追的时候是被惹急了那张脸，身子一扭一扭
      const fr = K.hp <= 0 ? 4 : K.hurt > 0 || K.st === 'exit' ? 3 : K.tel > 0 || K.lunge > 0 ? 2 : mad ? 5 : Math.floor(tm * 4) % 2;
      if (mad) c.rotate(Math.sin(tm * 14) * 0.06);
      c.drawImage(im, fr * 320, 160, 320, 160, -36, -18, 72, 36);
    }
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
    if (him) { c.drawImage(him, 2, 2, 96, 32); txt(c, 22, 15.4, fmt(S.money), 8.5, '#fff2c0', 'left', true, '#3a1600'); }   // 不写第几天了（作者：多余）   // 写在上面那块木板正中（板子从图里第 18 行到第 48 行，原来写高了压到边框上）
    else { rrect(c, 4, 4, 92, 30, 5); c.fillStyle = 'rgba(30,14,4,.72)'; c.fill(); txt(c, 9, 12, '¥ ' + fmt(S.money), 9, '#ffe24a', 'left', true); }
    for (let i = 0; i < C.basket; i++) {
      const x = 12 + i * 12, y = 26;
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 0.8; c.strokeRect(x - 5, y - 4, 10, 8);
      const f = S.basket[i];
      if (f && f.sp) drawFish(g, f.sp, f.size, x, y, 1, 0.42, 0);
      else if (f) drawSeabed(c, { shoe: 5, can: 6, tire: 7 }[f.junk], x, y, 8);
    }
    if (S.pearls) { const px = 12 + C.basket * 12; if (icon6b(c, 6, px + 3, 26, 7.5)) txt(c, px + 7.5, 26.3, '×' + S.pearls, 6, '#fff', 'left', true, '#3a1600'); else txt(c, px, 26, '⚪' + S.pearls, 6, '#fff', 'left', true); }
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
      // 点菜单：每样鱼前面画一条小鱼，后面写盆里、水族箱里各有几条，盆里够了打勾（作者 8A）
      const B = g.boss, D = BOSSES[B.i], dish = D.dishes[B.dish], fl = Object.keys(dish.f);
      const x0 = 100, cw = 164, ch = 27 + fl.length * 10, oim = art('order'), cooking = g.session && g.session.boss;
      if (oim) nine(c, oim, 0, 0, 360, 68, 14, x0, 18, cw, ch, 6); else { rrect(c, x0, 18, cw, ch, 5); c.fillStyle = 'rgba(255,248,225,.95)'; c.fill(); c.strokeStyle = '#c0281a'; c.lineWidth = 1.2; c.stroke(); }
      txt(c, x0 + 6, 25.5, L.order(D.n, B.dish + 1, D.dishes.length), 6.5, '#a01a0a', 'left', true);
      const sec = Math.max(0, Math.ceil(B.left));
      txt(c, x0 + cw - 6, 25.5, Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'), 7.5, sec < 30 ? '#e02010' : '#3a2008', 'right', true);
      txt(c, x0 + 6, 35.5, RECIPES[dish.r].n, 6.5, '#3a2008', 'left', true);
      button(g, x0 + cw - 30, 30, 26, 10, L.giveUp, () => askGiveUp(g), { size: 6 });   // 随时能放弃（作者），做到一半也行：鱼退回盆里
      fl.forEach((sp, i) => {
        const y = 45.5 + i * 10, need = dish.f[sp], inB = S.basin.filter(f => f.sp === sp).length, inT = S.tank.fish.filter(f => f.sp === sp).length, ok = inB >= need;
        drawFish(g, sp, 1, x0 + 13, y, 1, 11 / SPECIES[sp].len[1], g.anim);
        txt(c, x0 + 22, y, SPECIES[sp].n + ' ×' + need, 6.5, '#3a2008', 'left', true);
        if (cooking) return;
        txt(c, x0 + cw - 15, y, SPOT.tank != null ? L.inBasin(inB, inT) : L.inBasinOnly(inB), 5.5, ok ? '#1a7a1a' : '#7a5a3a', 'right', true);
        if (ok) txt(c, x0 + cw - 8, y, '✓', 7, '#1a9a1a', 'center', true);
      });
    }
    if (g.boss && g.boss.phase === 'alarm' && g.boss.t < DROP.start + 0.1 && Math.floor(g.anim * 4) % 2 === 0) { c.fillStyle = 'rgba(120,0,0,.25)'; c.fillRect(0, 0, W, H); txt(c, W / 2, 110, L.alarm, 15, '#ff3a2a', 'center', true, '#fff'); }   // 警报只闪一秒，接着看他从天上掉下来
    if (g.fight) {
      const F = g.fight;
      const fim = art('fighticons');
      for (let i = 0; i < C.hp; i++) { if (fim) c.drawImage(fim, i < F.hp ? 0 : 48, 0, 48, 48, 105 + i * 10, 5, 10, 10); else txt(c, 110 + i * 10, 10, '❤', 8, i < F.hp ? '#ff4060' : 'rgba(255,255,255,.3)', 'center', true); }
      if (F.kind === 'octo') { const tim = art('kelp/tentacle'); for (let i = 0; i < OCTO_ARMS; i++) { const on = i < OCTO_ARMS - F.cuts; c.globalAlpha = on ? 1 : 0.28; if (tim) c.drawImage(tim, 330, 12, 150, 96, 262 - i * 13, 5, 13, 8.3); else emoji(c, '🐙', 268 - i * 13, 9, 8); c.globalAlpha = 1; } }
      else for (let i = 0; i < (F.kind === 'leopard' ? LEO_HP : 3); i++) { if (F.kind === 'leopard') leoHead(c, i < F.shark.hp, 264 - i * 12, 5); else if (fim) c.drawImage(fim, i < F.shark.hp ? 96 : 144, 0, 48, 48, 263 - i * 11, 5, 10, 10); else { c.globalAlpha = i < F.shark.hp ? 1 : 0.3; emoji(c, '🦈', 268 - i * 11, 10, 8); c.globalAlpha = 1; } }
    }
    drawPotClose(g);
    const se = g.session;
    if (se && se.phase === 'bid' && g.tourists.some(o => o.bid)) {
      const px = (SPOT.pot - g.cam.x) * Z, py = (GY - g.cam.y) * Z + 8;
      button(g, px - 20, py, 40, 12, L.sellAll, () => { g.tourists.filter(o => o.bid).forEach(o => sell(g, o)); }, { size: 6.5 });
    }
    button(g, W - 40, 4, 36, 13, '菜单', () => { g.panel = { kind: 'menu' }; g.hold = false; }, { size: 7 });
    const acting = g.boss && g.boss.phase === 'show';   // 演戏的时候水下那几个按钮不出来
    if (!s.land && !g.fight && !s.clamp && !g.fade && !acting) button(g, W - 46, 20, 42, 13, L.goShore, () => goShore(g), { size: 6.5 });   // 水下一键回岸上
    drawMini(g);
    drawMapBtn(g);
    if (!g.fight) g.btns.push({ x: 2, y: 2, w: 96, h: 32, fn: () => { g.panel = { kind: 'status' }; g.hold = false; } });   // 点左上角的钱牌子：海狗状态
    drawPad(g);
  }

  // 手机上：左下摇杆（没按的时候淡淡一个在左下角，按哪儿出在哪儿）、右下三个圆键；电脑用鼠标键盘不显示（作者 14B 15A 18A）
  function drawPad(g) {
    if (!g.touchUI || g.screen !== 'play') return;
    const c = g.c, s = g.seal, k = g.stick;
    const ox = k ? k.ox : 44, oy = k ? k.oy : H - 46, pim = art('pad');
    const kx = ox + (k ? k.dx : 0) * PAD.R, ky = oy + (k ? k.dy : 0) * PAD.R;
    c.globalAlpha = k ? 1 : 0.5;
    if (pim) {   // pad.webp 每格 120×120：0 摇杆圈、1 摇杆头、2 按键、3 按下去、4 能用（亮）；按量出来的实际圆的大小放
      const B = PAD.R * 2 * 120 / 111, N = PAD.knob * 2 * 120 / 74;
      c.drawImage(pim, 0, 0, 120, 120, ox - B / 2, oy - B / 2, B, B);
      c.drawImage(pim, 120, 0, 120, 120, kx - N / 2, ky - N / 2, N, N);
    } else {
      c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.arc(ox, oy, PAD.R, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(kx, ky, PAD.knob, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.stroke();
    }
    c.globalAlpha = 1;
    const tgt = actTarget(g), lock = locked(g), held = Object.values(g.padBtn || {});
    [['act', tgt ? L.pad.use : L.pad.hit], ['bite', L.pad.bite], ['dash', L.pad.dash]].forEach(([key, label]) => {
      if (key === 'dash' && !has(g.S, 'thruster')) return;
      const [bx, by, r] = PAD.keys[key];
      const cd = key === 'dash' ? s.dashCD > 0 : key === 'bite' ? s.biteCD > 0 : s.atkCD > 0 && !tgt;
      const off = lock || (key === 'dash' && s.land);
      const down = held.indexOf(key) >= 0 || (g.padHit && g.anim - (g.padHit[key] || -9) < 0.12);
      c.globalAlpha = off ? 0.3 : cd ? 0.6 : 1;
      if (pim) { const cell = down ? 3 : key === 'act' && tgt ? 4 : 2, D = r * 2 * 120 / 104; c.drawImage(pim, cell * 120, 0, 120, 120, bx - D / 2, by - D / 2, D, D); }
      else {
        c.fillStyle = down ? 'rgba(255,236,170,.6)' : key === 'act' && tgt ? 'rgba(255,190,60,.5)' : 'rgba(10,30,50,.38)';
        c.beginPath(); c.arc(bx, by, r * (down ? 0.92 : 1), 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.2; c.stroke();
      }
      txt(c, bx, by + 0.5, label, key === 'act' ? 8 : 7, '#fff', 'center', true, 'rgba(0,0,0,.6)');
      c.globalAlpha = 1;
    });
  }

  // 海狗状态（菜单 ▸ 海狗状态，或者点左上角的钱牌子）：各项本事是多少、升了几级；海里找到了什么、学会了哪些配方（11-25 作者）
  function pips(c, x, y, n, max, gap) {
    for (let i = 0; i < max; i++) { c.beginPath(); c.arc(x + i * (gap || 5.2), y, 1.7, 0, Math.PI * 2); c.fillStyle = i < n ? '#e8a020' : 'rgba(120,90,50,.25)'; c.fill(); if (i < n) { c.strokeStyle = '#8a5010'; c.lineWidth = 0.5; c.stroke(); } }
  }
  function drawStatusPanel(g) {
    const c = g.c, S = g.S, C = caps(S);
    box(c, 12, 8, 296, 224);
    txt(c, 160, 20, L.statT, 11, '#8a1a14', 'center', true);
    // 左边：本事
    txt(c, 24, 36, L.statLeft, 8, '#5a2a00', 'left', true);
    const o2 = O2S.filter(k => has(S, k)).length + lvOf(S, 'breath');
    const rows = [
      [GEAR.o2, L.stat.air, L.statSec(C.air), o2, O2S.length + ITEMS.breath.cost.length],
      [ITEMS.speed, L.stat.speed, String(C.speed), lvOf(S, 'speed'), ITEMS.speed.cost.length],
      [ITEMS.basket, L.stat.basket, L.statGe(C.basket), lvOf(S, 'basket'), ITEMS.basket.cost.length],
      [ITEMS.hp, L.stat.hp, L.statDi(C.hp), lvOf(S, 'hp'), ITEMS.hp.cost.length],
      [ITEMS.pot, L.stat.pot, L.statTiao(C.pot), lvOf(S, 'pot'), ITEMS.pot.cost.length],
      [ITEMS.warm, L.stat.warm, L.statSec(C.warm), lvOf(S, 'warm'), ITEMS.warm.cost.length],
      [ITEMS.tank, L.stat.tank, C.tank ? L.statTiao(C.tank) : L.statNone, lvOf(S, 'tank'), 4],
      [ITEMS.food, L.stat.food, lvOf(S, 'food') ? L.statGood : L.statPlain, lvOf(S, 'food'), 1],
      [{ tub: true, e: '🪣' }, L.stat.basin, L.statTiao(C.basin), 0, 0]
    ];
    rows.forEach(([it, name, val, n, max], i) => {
      const y = 49 + i * 17;
      if (i % 2 === 0) { c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(20, y - 8, 140, 16); }
      if (it.tub) { const tb = art('tub'); if (tb) c.drawImage(tb, 240, 0, 120, 100, 23, y - 6, 14, 11.7); else emoji(c, it.e, 30, y, 9); } else icon(c, it, 30, y, 12);
      txt(c, 40, y, name, 7, '#5a3a1a', 'left', true);
      txt(c, 112, y, val, 7.5, '#3a2008', 'right', true);
      if (max) pips(c, 120, y, n, max, max > 8 ? 3.7 : max > 5 ? 4.6 : 5.2);
    });
    // 右边：海里找到的东西、配方
    txt(c, 172, 36, L.statGear, 8, '#5a2a00', 'left', true);
    // 一个展区一排三样（还没去过的那个展区先不露）
    const gearRows = [['thruster', 'fins', 'lamp']].concat(S.license ? [['r_gloves', 'r_echo', 'r_helmet']] : [], S.license2 ? [['k_knife', 'k_suit', 'k_flick']] : []);
    gearRows.forEach((row, ri) => row.forEach((k, i) => {
      const x = 192 + i * 40, y = 50 + ri * 25, got = has(S, k);
      c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fillStyle = got ? 'rgba(255,236,170,.6)' : 'rgba(60,50,40,.18)'; c.fill();
      if (got) icon(c, GEAR[k], x, y, 13); else txt(c, x, y + 0.5, '？', 8, 'rgba(90,70,50,.55)', 'center', true);
      txt(c, x, y + 12.5, got ? GEAR[k].n : L.dexUnknown, 5.5, got ? '#3a2008' : '#9a8a7a', 'center', true);
    }));
    txt(c, 172, 127, L.statRecipe, 8, '#5a2a00', 'left', true);   // 菜谱单独一页（五个箱庭的菜放这儿放不下，作者）
    { const all = RECIPE_PAGES.filter((p, i) => i <= licenses(S)).reduce((q, p) => q.concat(p.list), []), n = all.filter(r => S.recipes.indexOf(r) >= 0).length;
      S.recipes.slice(0, 8).forEach((r, i) => icon(c, RECIPES[r], 180 + i * 14, 139, 12));
      txt(c, 296, 127, L.recipeN(n, all.length), 7, '#1a6a1a', 'right', true);
      button(g, 220, 148, 76, 13, L.openRecipes, () => { g.panel = { kind: 'recipes', from: 'status' }; }, { size: 7 }); }
    // 底下一行：进度
    const known = Object.keys(SPECIES).filter(k => S.dex && S.dex[k]).length, tr = TREASURE.filter(t => has(S, t)).length;
    rrect(c, 168, 164, 132, 40, 5); c.fillStyle = 'rgba(255,255,255,.3)'; c.fill();
    txt(c, 176, 174, BAY.LOOK.zone + L.statBoss(S.boss), 7, '#3a2008', 'left', true);
    txt(c, 176, 186, L.mapN(tr, TREASURE.length) + '　' + L.dexN(known, Object.keys(SPECIES).length), 7, '#3a2008', 'left', true);
    txt(c, 176, 198, '¥ ' + fmt(S.money), 7, '#1a6a1a', 'left', true);
    button(g, 120, 210, 80, 16, L.back, () => { g.panel = null; }, { size: 7.5 });
  }
  // 水下按一下直接回岸上（作者：憋气用完也是直接回去、也没什么惩罚，不如给个按钮，别逼人原路游回去）
  function goShore(g) {
    const s = g.seal;
    if (!s || s.land || g.fight || s.clamp || g.fade) return;
    sfx(g, 'splash');
    g.pendingW = null;
    g.fade = { t: 0, fn: () => { s.land = true; s.y = GY; s.x = SPOT.basin; s.vx = s.vy = 0; s.dashT = 0; s.air = caps(g.S).air; g.camSnap = true; arriveStall(g); } };
  }

  // 星星：前 n 颗金色，后面淡的凑到 max 颗
  function stars(c, x, y, n, max, size) {
    const r = size || 3.2;
    for (let i = 0; i < max; i++) {
      const cx = x + r + i * r * 2.3;
      c.beginPath();
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; c.lineTo(cx + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      c.closePath();
      c.fillStyle = i < n ? '#f2b21a' : 'rgba(120,90,50,.2)'; c.fill();
      if (i < n) { c.strokeStyle = '#9a5a08'; c.lineWidth = 0.5; c.stroke(); }
    }
  }
  // 没学会的菜：图标压成黑影子
  function iconShadow(g, it, x, y, size) {
    const eight = it.ic8 != null, seven = !eight && it.ic7 != null, key = eight ? 'k' + it.ic8 : seven ? 'r' + it.ic7 : it.ic, im = art(eight ? 'kelp/icons8' : seven ? 'reef/icons7' : 'icons6');
    g.icSil = g.icSil || {};
    if (!g.icSil[key] && im) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const d = cv.getContext('2d');
      if (eight || seven) d.drawImage(im, (eight ? it.ic8 : it.ic7) * 96, 0, 96, 96, 0, 0, 64, 64); else d.drawImage(im, (it.ic % 8) * 64, Math.floor(it.ic / 8) * 64, 64, 64, 0, 0, 64, 64);
      d.globalCompositeOperation = 'source-in'; d.fillStyle = '#3a3a44'; d.fillRect(0, 0, 64, 64);
      g.icSil[key] = cv;
    }
    if (g.icSil[key]) g.c.drawImage(g.icSil[key], x - size / 2, y - size / 2, size, size);
    txt(g.c, x, y, '？', size * 0.32, 'rgba(255,255,255,.85)', 'center', true);
  }
  // 菜谱（菜单 ▸ 菜谱，或海狗状态里"看菜谱"）：按展区一页一页；学会的写星级、口味、卖价、谁爱吃谁怕、怎么学会的（11-25 作者）
  function drawRecipePanel(g) {
    const c = g.c, P = g.panel, S = g.S;
    const pages = RECIPE_PAGES.filter((p, i) => i <= licenses(S));
    if (P.page == null) P.page = Math.min(LOOK.page, pages.length - 1);
    const pg = pages[Math.min(P.page, pages.length - 1)];
    const all = pages.reduce((a, p) => a.concat(p.list), []), got = all.filter(r => S.recipes.indexOf(r) >= 0).length;
    box(c, 10, 8, 300, 224);
    txt(c, 160, 20, L.recipeT, 11, '#8a1a14', 'center', true);
    txt(c, 300, 20, L.recipeN(got, all.length), 7.5, '#1a6a1a', 'right', true);
    pages.forEach((p, i) => {   // 展区一页一个签
      const x = 18 + i * 56, on = i === (P.page || 0);
      rrect(c, x, 28, 52, 13, 4); c.fillStyle = on ? 'rgba(255,214,120,.75)' : 'rgba(255,255,255,.35)'; c.fill();
      c.strokeStyle = on ? '#c07a10' : 'rgba(140,100,50,.4)'; c.lineWidth = 0.8; c.stroke();
      txt(c, x + 26, 34.8, p.n, 7, on ? '#5a2a00' : '#8a6a4a', 'center', true);
      g.btns.push({ x, y: 28, w: 52, h: 13, fn: () => { P.page = i; } });
    });
    pg.list.forEach((r, i) => {
      const R = RECIPES[r], know = S.recipes.indexOf(r) >= 0, x = 18 + i * 96, y = 46, w = 92, h = 160, cx = x + w / 2;
      rrect(c, x, y, w, h, 6); c.fillStyle = 'rgba(255,255,255,.4)'; c.fill(); c.strokeStyle = 'rgba(140,100,50,.45)'; c.lineWidth = 0.8; c.stroke();
      if (know) icon(c, R, cx, y + 25, 40); else iconShadow(g, R, cx, y + 25, 40);
      txt(c, cx, y + 53, know ? R.n : L.dexUnknown, 9, know ? '#3a2008' : '#8a7a6a', 'center', true);
      if (!know) { txt(c, cx, y + 70, L.dexNot.replace('抓到', '学会'), 6.5, '#8a7a6a', 'center', false); return; }
      stars(c, cx - ((STAR_MAX - 1) * 3.6 * 2.3 + 7.2) / 2, y + 66, R.star, STAR_MAX, 3.6);
      const like = Object.keys(TOURISTS).filter(k => likes(TOURISTS[k], r)).map(k => TOURISTS[k].n), hate = Object.keys(TOURISTS).filter(k => hates(TOURISTS[k], r)).map(k => TOURISTS[k].n);
      const who = BOSSES.filter((B, bi) => (bi < S.boss || (g.boss && g.boss.i === bi)) && B.dishes.some(q => q.r === r)).map(B => B.n);
      let ly = y + 80;
      const line = t => { ly += wrap(c, t, x + 6, ly, w - 12, 8.4, 6.5, '#5a3a1a', 'left', false) * 8.4 + 0.8; };   // 海草林的菜爱吃的人多，行距收一点别出框
      line(L.statFl(R.fl));
      line(L.recipeMul(STAR_MUL[R.star]));
      if (like.length) line(L.recipeLike + like.join('、'));
      if (hate.length) line(L.recipeHate + hate.join('、'));
      line(L.recipeHowT + L.recipeHow[r]);
      if (who.length) line(L.dexBoss + who.join('、'));
    });
    button(g, 120, 212, 80, 16, L.back, () => { g.panel = P.from === 'status' ? { kind: 'status' } : null; }, { size: 7.5 });
  }

  // 水族箱管理（作者：撒鱼食太容易把鱼捞出来，改成在管理里挑；顺便能看鱼的状态）：每条鱼一格，写个头、还要喂几回、掉多少钱；选中一条捞进盆里
  function drawTankMgPanel(g) {
    const c = g.c, P = g.panel, S = g.S, C = caps(S), list = S.tank.fish;
    box(c, 14, 14, 292, 212);
    txt(c, 160, 27, L.tankMgT + '　' + list.length + '/' + C.tank, 11, '#8a1a14', 'center', true);
    if (P.sel >= list.length) P.sel = Math.max(0, list.length - 1);
    if (!list.length) txt(c, 160, 110, L.tankMgEmpty, 9, '#7a5a3a', 'center', true);
    list.forEach((f, i) => {
      const D = SPECIES[f.sp], x = 24 + (i % 5) * 55, y = 36 + Math.floor(i / 5) * 54, w = 52, h = 51, on = i === P.sel;
      rrect(c, x, y, w, h, 5); c.fillStyle = on ? 'rgba(255,214,120,.6)' : 'rgba(255,255,255,.38)'; c.fill();
      c.strokeStyle = on ? '#d07a00' : 'rgba(140,100,50,.4)'; c.lineWidth = on ? 1.6 : 0.8; c.stroke();
      const len = D.len[f.size], sc = Math.min(1.5, 36 / (len * 1.2));
      drawFish(g, f.sp, f.size, x + w / 2, y + 14, 1, sc, on ? g.anim : 0);
      txt(c, x + w / 2, y + 30, D.n + '·' + SIZE_N[f.size], 6.5, '#3a2008', 'center', true);
      const need = [3, 5, 8][f.size], left = f.size >= 3 ? 0 : Math.max(0, need - (f.meals || 0));
      txt(c, x + w / 2, y + 39, f.size >= 3 ? L.tankKing : L.tankGrow(left), 5.5, '#7a5a3a', 'center', false);
      txt(c, x + w / 2, y + 47, (f.full > 0 ? L.tankFed + '　' : '') + L.tankCoin([1, 2, 4, 8][f.size]), 5.5, f.full > 0 ? '#1a7a1a' : '#7a5a3a', 'center', false);
      g.btns.push({ x, y, w, h, fn: () => { P.sel = i; } });
    });
    const f = list[P.sel], room = S.basin.length < C.basin;
    button(g, 60, 200, 110, 18, f && !room ? L.basinFull : L.tankOut, () => tankTakeOut(g, P.sel), { size: 7.5, off: !f || !room });
    button(g, 180, 200, 80, 18, L.back, () => { g.panel = null; }, { size: 7.5 });
  }
  function tankTakeOut(g, i) {
    const S = g.S, f = S.tank.fish[i];
    if (!f || S.basin.length >= caps(S).basin) return;
    S.tank.fish.splice(i, 1);
    S.basin.push({ sp: f.sp, size: f.size });
    flt(g, W / 2, 120, L.tankTake, '#ffffff', 1.4, true); sfx(g, 'splash');
    save(g);
  }

  /* ---------- 木盆、鱼谱、按键设置 ---------- */
  // 扔回海里：浅水的鱼（小黄鱼、鲈鱼）扑通一声游走，别的就沉下去了
  function tossFish(g, i) {
    const S = g.S, f = S.basin[i];
    if (!f) return;
    S.basin.splice(i, 1);
    if (REGIONS[0].pick.some(p => p[0] === f.sp)) {
      const x = SPOT.basin + rnd(-8, 8), y = WY + 12, q = openAt(g, REGIONS[0], 10, false) || [x, y + 40];
      g.fish.push({ sp: f.sp, size: f.size, x, y, vx: 0, vy: 30, tx: q[0], ty: q[1], face: q[0] < x ? -1 : 1, ri: 0, ph: Math.random() * 6, stuck: 0 });
    }
    sfx(g, 'splash');
    save(g);
  }
  function tossAll(g) {
    const S = g.S;
    while (S.basin.length) tossFish(g, 0);
  }
  function basinToTank(g, i) {
    const S = g.S, f = S.basin[i], C = caps(S);
    if (!f || !C.tank || S.tank.fish.length >= C.tank) return;
    S.basin.splice(i, 1);
    S.tank.fish.push({ sp: f.sp, size: f.size, x: rnd(40, 280), y: TK.top + 20, tx: rnd(40, 280), ty: rnd(80, 190), meals: 0 });
    sfx(g, 'splash');
    save(g);
  }
  // 没抓到过的鱼：黑影子
  function drawSilhouette(g, sp, x, y, len) {
    const c = g.c, D = SPECIES[sp], im = art(D.sheet || 'fish6');
    g.sil = g.sil || {};
    if (!g.sil[sp] && im) {
      const cv = document.createElement('canvas'); cv.width = 144; cv.height = 96;
      const x2 = cv.getContext('2d'); x2.drawImage(im, 0, D.row * 96, 144, 96, 0, 0, 144, 96);
      x2.globalCompositeOperation = 'source-in'; x2.fillStyle = '#2c3a48'; x2.fillRect(0, 0, 144, 96);
      g.sil[sp] = cv;
    }
    if (g.sil[sp]) c.drawImage(g.sil[sp], x - len * 0.6, y - len * 0.4, len * 1.2, len * 0.8);
    else { c.fillStyle = '#2c3a48'; c.beginPath(); c.ellipse(x, y, len * 0.5, len * 0.2, 0, 0, Math.PI * 2); c.fill(); }
    txt(c, x, y, '？', 9, 'rgba(255,255,255,.85)', 'center', true);
  }
  function drawBasinPanel(g) {
    const c = g.c, P = g.panel, S = g.S, C = caps(S);
    box(c, 20, 18, 280, 204);
    txt(c, 160, 31, L.basinT + '　' + S.basin.length + '/' + C.basin, 11, '#8a1a14', 'center', true);
    if (P.sel >= S.basin.length) P.sel = Math.max(0, S.basin.length - 1);
    if (!S.basin.length) txt(c, 160, 110, L.basinEmpty, 9, '#7a5a3a', 'center', true);
    S.basin.forEach((f, i) => {
      const D = SPECIES[f.sp], x = 32 + (i % 5) * 52, y = 42 + Math.floor(i / 5) * 72, w = 48, h = 68, on = i === P.sel;
      rrect(c, x, y, w, h, 5); c.fillStyle = on ? 'rgba(255,214,120,.6)' : 'rgba(255,255,255,.38)'; c.fill();
      c.strokeStyle = on ? '#d07a00' : 'rgba(140,100,50,.4)'; c.lineWidth = on ? 1.6 : 0.8; c.stroke();
      const len = D.len[f.size], sc = Math.min(1.7, 40 / (len * 1.2));
      drawFish(g, f.sp, f.size, x + w / 2, y + 24, 1, sc, on ? g.anim : 0);
      txt(c, x + w / 2, y + 47, D.n, 7.5, '#3a2008', 'center', true);
      txt(c, x + w / 2, y + 58, SIZE_N[f.size] + ' · ' + D.val[f.size] + ' 块', 6, '#7a5a3a', 'center', false);
      g.btns.push({ x, y, w, h, fn: () => { P.sel = i; } });
    });
    const f = S.basin[P.sel], tankOk = C.tank > 0 && S.tank.fish.length < C.tank;
    button(g, 28, 196, 62, 18, L.toss, () => tossFish(g, P.sel), { size: 7, off: !f });
    button(g, 94, 196, 74, 18, L.toTank, () => basinToTank(g, P.sel), { size: 7, off: !f || !tankOk });
    button(g, 172, 196, 70, 18, L.tossAll, () => { g.panel = { kind: 'ask', text: L.tossAllAsk, yes: L.tossYes, fn: () => tossAll(g) }; }, { size: 7, off: !S.basin.length });
    button(g, 246, 196, 46, 18, L.back, () => { g.panel = null; }, { size: 7 });
  }
  function drawDexPanel(g) {
    const c = g.c, S = g.S, P = g.panel, all = Object.keys(SPECIES), known = all.filter(k => S.dex && S.dex[k]).length;
    const pages = DEX_PAGES.filter((p, i) => i <= licenses(S));   // 还没拿到那个展区的许可证，那页先不露
    if (P.page == null) P.page = Math.min(LOOK.page, pages.length - 1);
    const sps = DEX_PAGES[Math.min(P.page, pages.length - 1)].list;
    box(c, 10, 8, 300, 224);
    txt(c, pages.length > 2 ? 214 : 160, 20, L.dexT, 11, '#8a1a14', 'center', true);   // 三个展区的签：标题挪到右边，别压着签
    txt(c, 300, 20, L.dexN(known, all.length), 7.5, '#1a6a1a', 'right', true);
    if (pages.length > 1) pages.forEach((p, i) => {
      const x = 18 + i * 50, on = i === P.page;
      rrect(c, x, 14, 46, 12, 4); c.fillStyle = on ? 'rgba(255,214,120,.75)' : 'rgba(255,255,255,.35)'; c.fill();
      c.strokeStyle = on ? '#c07a10' : 'rgba(140,100,50,.4)'; c.lineWidth = 0.8; c.stroke();
      txt(c, x + 23, 20.3, p.n, 6.5, on ? '#5a2a00' : '#8a6a4a', 'center', true);
      g.btns.push({ x, y: 14, w: 46, h: 12, fn: () => { P.page = i; } });
    });
    sps.forEach((sp, i) => {
      const D = SPECIES[sp], d = S.dex && S.dex[sp], x = 16 + (i % 2) * 147, y = 30 + Math.floor(i / 2) * 91, w = 141, h = 86;
      rrect(c, x, y, w, h, 6); c.fillStyle = 'rgba(255,255,255,.4)'; c.fill(); c.strokeStyle = 'rgba(140,100,50,.45)'; c.lineWidth = 0.8; c.stroke();
      const len = 38 / 1.2;
      if (d) drawFish(g, sp, 2, x + 24, y + 24, 1, len / D.len[2], g.anim + i); else drawSilhouette(g, sp, x + 24, y + 24, len);
      txt(c, x + 50, y + 11, d ? D.n : L.dexUnknown, 9, d ? '#3a2008' : '#8a7a6a', 'left', true);
      if (!d) { txt(c, x + 50, y + 25, L.dexNot, 6.5, '#8a7a6a', 'left', false); return; }
      let ly = y + 23;
      ly += wrap(c, L.dexHome + D.h, x + 50, ly, 86, 8.5, 6, '#5a3a1a', 'left', false) * 8.5;
      const who = BOSSES.filter((B, bi) => (bi < S.boss || (g.boss && g.boss.i === bi)) && B.dishes.some(q => q.f[sp])).map(B => B.n);
      if (who.length) ly += wrap(c, L.dexBoss + who.join('、'), x + 50, ly, 86, 8.5, 6, '#5a3a1a', 'left', false) * 8.5;
      ly += wrap(c, L.dexPrice + D.val.map((v, k) => SIZE_N[k] + ' ' + v).join('　'), x + 6, Math.max(ly, y + 52), 130, 8.5, 6, '#5a3a1a', 'left', false) * 8.5;
      txt(c, x + 6, Math.max(ly, y + 61), L.dexGot(d.n, SIZE_N[d.max]), 6, '#1a6a1a', 'left', true);
    });
    button(g, 120, 214, 80, 16, L.back, () => { g.panel = null; }, { size: 7.5 });
  }
  function drawKeysPanel(g) {
    const c = g.c, P = g.panel, km = g.km || (g.km = keyMap());
    box(c, 50, 14, 220, 212);
    txt(c, 160, 28, L.keysT, 11, '#8a1a14', 'center', true);
    ACTS.forEach((a, i) => {
      const y = 38 + i * 20;
      txt(c, 66, y + 8, L.acts[a], 8, '#3a2008', 'left', true);
      [0, 1].forEach(j => {
        const waiting = P.wait && P.wait.a === a && P.wait.j === j;
        button(g, 134 + j * 64, y, 60, 16, waiting ? L.keyWait : keyName(km[a][j]), () => { P.wait = { a, j }; }, { size: 7, red: waiting });
      });
    });
    button(g, 70, 200, 84, 18, L.keyReset, () => { OS.save.set(KEYS_SAVE, null); g.km = keyMap(); P.wait = null; }, { size: 7.5 });
    button(g, 166, 200, 84, 18, L.back, () => { g.panel = { kind: 'menu' }; }, { size: 7.5 });
  }
  // 按键设置里按了新键：别的动作占着这个键就让出来；Esc 不改，退格 ／ Delete 清空
  function setKey(g, code) {
    const P = g.panel, km = g.km || (g.km = keyMap()), w = P.wait;
    P.wait = null;
    if (!w || code === 'Escape') return;
    if (code === 'Backspace' || code === 'Delete') km[w.a][w.j] = null;
    else { ACTS.forEach(a => [0, 1].forEach(j => { if (km[a][j] === code) km[a][j] = null; })); km[w.a][w.j] = code; }
    OS.save.set(KEYS_SAVE, km);
    g.keys = {};
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
      if (P.secret) g.btns.push({ x: 56, y: 60, w: 208, h: 76, fn: () => { P.taps = (P.taps || 0) + 1; if (P.taps >= 3) P.secret(); } });   // 看不见的后门
      button(g, 120, 144, 80, 20, L.yes, () => { g.panel = null; if (P.after) P.after(); });
    } else if (P.kind === 'gong') {   // 敲锣前：下一位大胃王要点什么（第三位想吃海狗那件事不写）
      const D = BOSSES[S.boss], bh = 70 + D.dishes.length * 34, by = (H - bh) / 2;
      box(c, 44, by, 232, bh);
      txt(c, 160, by + 14, L.gongT(S.boss + 1, D.n), 10, '#8a1a14', 'center', true);
      txt(c, 160, by + 28, L.gongLimit(D.t), 7, '#7a5a3a', 'center', true);
      D.dishes.forEach((d, i) => {
        const y = by + 38 + i * 34, R = RECIPES[d.r], know = S.recipes.indexOf(d.r) >= 0;
        rrect(c, 54, y, 212, 30, 5); c.fillStyle = 'rgba(255,255,255,.4)'; c.fill();
        txt(c, 60, y + 8, L.gongDish(i + 1), 6.5, '#7a5a3a', 'left', true);
        if (know) icon(c, R, 74, y + 19, 16); else iconShadow(g, R, 74, y + 19, 16);
        txt(c, 86, y + 19, R.n, 8, '#3a2008', 'left', true);
        if (!know) txt(c, 86 + c.measureText(R.n).width + 4, y + 19.5, L.gongNoRecipe, 6, '#c0281a', 'left', true);
        let fx = 262;
        Object.keys(d.f).reverse().forEach(sp => {
          c.font = 'bold 6.5px ' + FONT; const t = SPECIES[sp].n + '×' + d.f[sp], tw = c.measureText(t).width;
          txt(c, fx, y + 19, t, 6.5, '#3a2008', 'right', true); fx -= tw + 2;
          drawFish(g, sp, 1, fx - 6, y + 19, 1, 11 / SPECIES[sp].len[1], g.anim); fx -= 15;
        });
      });
      button(g, 76, by + bh - 24, 80, 18, L.gongYes, () => callBoss(g), { red: true, size: 8 });
      button(g, 164, by + bh - 24, 80, 18, L.no, () => { g.panel = null; }, { size: 8 });
    } else if (P.kind === 'backdoor') {
      box(c, 50, 40, 220, 160);
      wrap(c, L.backdoorT(BOSSES[2].n), 160, 60, 196, 12, 8.5, '#4a2000', 'center', true);
      button(g, 70, 100, 180, 20, L.backdoorBtns[0], () => backdoor(g, 'order'), { size: 8 });
      button(g, 70, 124, 180, 20, L.backdoorBtns[1], () => backdoor(g, 'show'), { size: 8 });
      button(g, 70, 148, 180, 20, L.backdoorBtns[2], () => backdoor(g, 'fight'), { size: 8, red: true });
      button(g, 120, 174, 80, 18, L.no, () => { g.panel = null; }, { size: 7.5 });
    } else if (P.kind === 'recipe') {
      const list = Object.keys(RECIPES).filter(r => S.recipes.indexOf(r) >= 0), want = g.boss && g.boss.phase === 'order' ? BOSSES[g.boss.i].dishes[g.boss.dish].r : null;
      const rh = list.length > 4 ? 24 : 28, top = want ? 40 : 30, bh = top + 26 + list.length * rh, by = Math.max(4, (H - bh) / 2);
      box(c, 50, by, 220, bh);
      txt(c, 160, by + 14, L.pickRecipe, 11, '#8a1a14', 'center', true);
      if (want) txt(c, 160, by + 28, L.bossWants(RECIPES[want].n), 7.5, '#a01a0a', 'center', true);   // 大胃王点的哪道，面板上也写着（作者：面板把点菜单挡住了）
      button(g, 120, by + bh - 22, 80, 16, L.recipeClose, () => { g.panel = null; }, { size: 7.5 });   // 关掉：鱼还在盆里
      list.forEach((r, i) => {
        const R = RECIPES[r], y = by + top + i * rh;
        if (r === want) { rrect(c, 58, y + 1, 204, rh - 2, 4); c.fillStyle = 'rgba(255,214,120,.55)'; c.fill(); }
        icon(c, R, 76, y + 12, rh > 26 ? 22 : 20);
        txt(c, 92, y + 7, R.n, 9, '#3a2008', 'left', true);
        stars(c, 92 + c.measureText(R.n).width + 4, y + 7, R.star, 5);
        txt(c, 92, y + 18, '口味：' + R.fl, 7, '#7a5a3a', 'left', false);
        button(g, 200, y + 4, 56, 18, '就它', () => pickRecipe(g, r), { size: 8 });
      });
    } else if (P.kind === 'shop') {
      const M = MERCHANTS[P.mk];
      box(c, 26, 22, 268, 196);
      txt(c, 160, 36, L.shop(M.n), 11, '#8a1a14', 'center', true);
      txt(c, 286, 36, '¥ ' + fmt(S.money), 8, '#1a6a1a', 'right', true);
      itemsOf(P.mk).forEach((id, i) => {
        const it = ITEMS[id], y = 48 + i * 35, lv = lvOf(S, id);
        const done = lv >= it.cost.length;
        icon(c, it, 48, y + 14, 22);
        const name = it.names ? it.names[Math.min(lv, it.names.length - 1)] : it.n + (it.cost.length > 1 ? ' ' + Math.min(lv + 1, it.cost.length) + '/' + it.cost.length : '');
        txt(c, 64, y + 8, name, 8.5, '#3a2008', 'left', true);
        wrap(c, it.d, 64, y + 20, 150, 9, 6.5, '#7a5a3a', 'left', false);
        if (done) txt(c, 250, y + 14, it.cost.length > 1 ? L.maxed : L.owned, 8, '#888', 'center', true);
        else if (lv >= itemCap(S, id, P.mk)) txt(c, 250, y + 14, M.local != null ? L.otherArea : L.nextArea, 7, '#9a8a7a', 'center', true);   // 这一档要后面的展区才进货
        else { const p = it.cost[lv]; button(g, 222, y + 5, 58, 18, L.buy(p), () => buyItem(g, id, P.mk), { size: 7.5, off: S.money < p }); }
      });
      button(g, 120, 194, 80, 18, L.back, () => { g.panel = null; });
    } else if (P.kind === 'menu') {
      const list = [[L.menu[0], () => { g.panel = null; }], [L.menu[7], () => { g.panel = { kind: 'status' }; }], [L.menu[4], () => { g.panel = { kind: 'map' }; }], [L.menu[5], () => { g.panel = { kind: 'dex' }; }], [L.menu[8], () => { g.panel = { kind: 'recipes' }; }]];
      if (!g.touchUI) list.push([L.menu[6], () => { g.panel = { kind: 'keys' }; }]);   // 手机上没键盘，不显示
      list.push([g.mute ? L.menu[2] : L.menu[1], () => { g.mute = !g.mute; OS.save.set(MUTE_KEY, g.mute); }], [L.menu[3], () => { save(g); g.panel = null; g.screen = 'title'; g.savedAt = null; g.session = null; g.boss = null; g.fight = null; }]);
      const sp = list.length > 6 ? 22 : 24, bh = 38 + list.length * sp, by = (H - bh) / 2;
      box(c, 90, by, 140, bh);
      txt(c, 160, by + 15, '菜单', 11, '#5a2a00', 'center', true);
      list.forEach(([t, fn], i) => button(g, 110, by + 28 + i * sp, 100, 20, t, fn));
    } else if (P.kind === 'basin') drawBasinPanel(g);
    else if (P.kind === 'status') drawStatusPanel(g);
    else if (P.kind === 'recipes') drawRecipePanel(g);
    else if (P.kind === 'tankmg') drawTankMgPanel(g);
    else if (P.kind === 'dex') drawDexPanel(g);
    else if (P.kind === 'keys') drawKeysPanel(g);
    else if (P.kind === 'map') {
      drawMap(g);
    } else if (P.kind === 'eaten') {
      box(c, 60, 66, 200, 100);
      wrap(c, L.eaten(BOSSES[2].n), 160, 92, 180, 13, 11, '#a01a0a', 'center', true);
      button(g, 72, 136, 84, 20, L.retry, () => fightRetry(g), { red: true });
      button(g, 164, 136, 84, 20, L.later, () => fightLater(g));
    }
  }

  // 地图分两层：地形（整张一次算好，撞开石头、找到暗道以后重算）＋ 迷雾（32×30 一格一格，放大的时候自己糊开，边是软的）
  // 去过的地方探开，没去过的是一片迷雾（11-25 作者：小地图，没去过的纯迷雾）。暗道没找到之前在地图上也是石头，不露馅
  const MAP_U = 2.5;   // 地形图一个点 = 2.5 个世界单位
  function mapTerr(g) {
    if (g.mapTerr) return g.mapTerr;
    const S = g.S, w = Math.ceil(WW / MAP_U), h = Math.ceil(WH / MAP_U), cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const d = cv.getContext('2d'), im = d.createImageData(w, h), D = im.data;
    const solid = (x, y) => fieldAt(g, x, y) > 0 || (y > WY && hiddenByCover(S, x, y));
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const x = (px + 0.5) * MAP_U, y = (py + 0.5) * MAP_U, i = (py * w + px) * 4;
      let col;
      if (y < GY) col = [200, 232, 250];
      else if (y < WY) col = [176, 132, 82];
      else if ((BAY.KWALLS || []).some(K => !has(S, K.id) && Math.abs(x - K.x) < K.w / 2 && Math.abs(y - K.y) < K.h / 2)) col = [70, 150, 70];   // 海带墙：地图上是绿的
      else if (solid(x, y)) col = solid(x, y - MAP_U * 1.5) ? [104, 90, 76] : [168, 146, 112];   // 石头；朝上的那层边亮一点，看得出地面
      else { const t = Math.min(1, (y - WY) / (WH - 100)); col = [96 - 76 * t, 186 - 138 * t, 232 - 128 * t]; }
      D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255;
    }
    d.putImageData(im, 0, 0);
    return (g.mapTerr = cv);
  }
  const FOG_K = 6;   // 迷雾图一格放大成 6×6 再糊一下，边是圆的、像一团团的雾
  function mapFog(g) {
    const SW = SEEN_W(), SH = SEEN_H();
    if (!g.fogCv) { g.fogCv = document.createElement('canvas'); g.fogCv.width = SW + 2; g.fogCv.height = SH + 2; g.fogBig = document.createElement('canvas'); g.fogBig.width = SW * FOG_K; g.fogBig.height = SH * FOG_K; g.fogDirty = true; }
    if (g.fogDirty) {
      // 小图四周多一圈（一直是雾），糊的时候地图边上不会糊出一道亮边
      const d = g.fogCv.getContext('2d'), im = d.createImageData(SW + 2, SH + 2), D = im.data;
      for (let j = 0; j < SH + 2; j++) for (let i = 0; i < SW + 2; i++) { const q = (j * (SW + 2) + i) * 4, in_ = i > 0 && i < SW + 1 && j > 0 && j < SH + 1; D[q] = 44; D[q + 1] = 50; D[q + 2] = 62; D[q + 3] = in_ && g.seen[(j - 1) * SW + i - 1] ? 0 : 255; }
      d.putImageData(im, 0, 0);
      const b = g.fogBig.getContext('2d');
      b.clearRect(0, 0, g.fogBig.width, g.fogBig.height);
      b.imageSmoothingEnabled = false; b.filter = 'blur(' + (FOG_K * 0.45) + 'px)';
      b.drawImage(g.fogCv, -FOG_K, -FOG_K, (SW + 2) * FOG_K, (SH + 2) * FOG_K);
      b.filter = 'none';
      g.fogDirty = false;
    }
    return g.fogBig;
  }
  // 把世界里 (wx, wy, ww, wh) 这一块画到屏幕 (x, y, w, h)
  function drawMapArea(g, wx, wy, ww, wh, x, y, w, h) {
    const c = g.c, T = mapTerr(g), F = mapFog(g);
    c.drawImage(T, wx / MAP_U, wy / MAP_U, ww / MAP_U, wh / MAP_U, x, y, w, h);
    c.imageSmoothingEnabled = true;
    c.drawImage(F, wx / 40 * FOG_K, wy / 40 * FOG_K, ww / 40 * FOG_K, wh / 40 * FOG_K, x, y, w, h);
  }
  // 左上角的小地图：电脑按 M、手机点右上角"地图"开关；点小地图看大地图
  const MINI = { x: 4, y: 37, w: 78, h: 58, ww: 390 };
  function drawMini(g) {
    if (!g.mini || g.fight || g.screen !== 'play' || g.seal.land || (g.boss && g.boss.phase === 'show')) return;   // 上了岸不显示（作者）
    const c = g.c, s = g.seal, S = g.S, tm = g.anim, { x, y, w, h } = MINI, ww = MINI.ww, wh = ww * h / w;
    const sy0 = s.land ? GY : s.y, wx = clamp(s.x - ww / 2, 0, WW - ww), wy = clamp(sy0 - wh / 2, 0, WH - wh), k = w / ww;
    c.save();
    rrect(c, x, y, w, h, 4); c.fillStyle = '#2c323e'; c.fill(); c.clip();
    drawMapArea(g, wx, wy, ww, wh, x, y, w, h);
    const M = (px, py) => [x + (px - wx) * k, y + (py - wy) * k];
    const seen = (px, py) => seenAt(g, px, py);
    g.pos.vents.forEach(([vx, vy]) => { if (!seen(vx, vy)) return; const [a, b] = M(vx, vy - 6); c.strokeStyle = '#d8faff'; c.lineWidth = 0.8; c.beginPath(); c.arc(a, b, 1.6, 0, Math.PI * 2); c.stroke(); });
    if (has(S, BAY.SHOP.flag)) { const [a, b] = M(g.pos.shop[0], g.pos.shop[1]); c.fillStyle = '#ff9ac0'; c.beginPath(); c.arc(a, b, 1.8, 0, Math.PI * 2); c.fill(); }
    { const [a, b] = M(SPOT.pot, GY - 3); c.fillStyle = '#ffb030'; c.beginPath(); c.arc(a, b, 1.8, 0, Math.PI * 2); c.fill(); }
    const [sa, sb] = M(s.x, s.land ? GY - 2 : s.y);
    c.fillStyle = Math.floor(tm * 3) % 2 ? '#ff3a2a' : '#ffd040'; c.beginPath(); c.arc(sa, sb, 2, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 0.7; c.stroke();
    c.restore();
    c.strokeStyle = '#7a4a1a'; c.lineWidth = 1.6; rrect(c, x, y, w, h, 4); c.stroke();
    c.strokeStyle = 'rgba(255,230,180,.45)'; c.lineWidth = 0.6; rrect(c, x + 1.2, y + 1.2, w - 2.4, h - 2.4, 3); c.stroke();
    g.btns.push({ x, y, w, h, fn: () => { g.panel = { kind: 'map' }; g.hold = false; } });   // 点小地图：看大地图
  }
  // 最右下角的小地图按钮（电脑、手机都有）：圆按钮里一张折起来的小地图；电脑上旁边一个键帽写着快捷键（作者）
  const MAPBTN = { x: W - 15, y: H - 15, r: 11 };
  function drawMapBtn(g) {
    if (g.fight || g.screen !== 'play' || g.seal.land || (g.boss && g.boss.phase === 'show')) return;   // 岸上小地图不显示，按钮也收起来
    const c = g.c, { x, y, r } = MAPBTN, pim = art('pad');
    if (pim) { const D = r * 2 * 120 / 104; c.drawImage(pim, (g.mini ? 4 : 2) * 120, 0, 120, 120, x - D / 2, y - D / 2, D, D); }
    else { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = g.mini ? 'rgba(255,190,60,.55)' : 'rgba(10,30,50,.45)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.2; c.stroke(); }
    if (!icon6b(c, 9, x, y, 15)) mapIcon(c, x, y + 0.3, g.mini);
    if (!g.touchUI) {   // 快捷键提示
      const km = g.km || (g.km = keyMap()), k = km.map[0] || km.map[1];
      if (k) {
        const t = keyName(k); c.font = 'bold 6px ' + FONT;
        const kw = Math.max(9, c.measureText(t).width + 5), kx = x - r - 3 - kw, ky = y - 4.5;
        rrect(c, kx, ky, kw, 9, 2); c.fillStyle = 'rgba(255,248,230,.88)'; c.fill(); c.strokeStyle = '#6a4a2a'; c.lineWidth = 0.8; c.stroke();
        c.fillStyle = 'rgba(106,74,42,.35)'; c.fillRect(kx + 1, ky + 7.4, kw - 2, 1);
        txt(c, kx + kw / 2, ky + 4.3, t, 6, '#4a2a0a', 'center', true);
      }
    }
    g.btns.push({ x: x - r - 2, y: y - r - 2, w: r * 2 + 4, h: r * 2 + 4, fn: () => toggleMini(g) });
  }
  // 小地图图标：一张折成三折的纸地图，上面一条水、一个红点
  function mapIcon(c, x, y, on) {
    const w = 13, h = 10, x0 = x - w / 2, y0 = y - h / 2, q = w / 3;
    const pts = [[x0, y0 + 1], [x0 + q, y0], [x0 + 2 * q, y0 + 1], [x0 + w, y0], [x0 + w, y0 + h - 1], [x0 + 2 * q, y0 + h], [x0 + q, y0 + h - 1], [x0, y0 + h]];
    c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.closePath();
    c.fillStyle = '#f4e4b4'; c.fill(); c.strokeStyle = '#6a4a1a'; c.lineWidth = 0.7; c.stroke();
    c.fillStyle = 'rgba(120,80,30,.18)'; c.beginPath(); c.moveTo(x0 + q, y0); c.lineTo(x0 + 2 * q, y0 + 1); c.lineTo(x0 + 2 * q, y0 + h); c.lineTo(x0 + q, y0 + h - 1); c.closePath(); c.fill();
    c.strokeStyle = '#4a9ad0'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0 + 1.5, y0 + 6); c.quadraticCurveTo(x0 + 5, y0 + 3.5, x0 + 7, y0 + 6.2); c.quadraticCurveTo(x0 + 9.5, y0 + 8.5, x0 + 11.5, y0 + 5.5); c.stroke();
    c.fillStyle = on ? '#ff3a2a' : '#d0402a'; c.beginPath(); c.arc(x0 + 9, y0 + 3.3, 1.2, 0, Math.PI * 2); c.fill();
  }
  function toggleMini(g) {
    if (g.panel && g.panel.kind === 'map') { g.panel = null; return; }   // 大地图开着：M 关掉
    if (g.panel) return;
    g.mini = !g.mini;
    OS.save.set(MINI_KEY, g.mini);
    sfx(g, 'click');
  }
  // 大地图：跟小地图一样两层（地形 + 迷雾）；找到的宝贝打勾
  function drawMap(g) {
    const c = g.c, S = g.S, tm = g.anim;
    box(c, 10, 8, 300, 224);
    const k = Math.min(0.16, 205 / WW, 196 / WH), mx = 18, my = 26;
    txt(c, mx, 18, BAY.LOOK.zone, 10, '#5a2a00', 'left', true);
    const got = TREASURE.filter(t => has(S, t)).length;
    txt(c, mx + WW * k, 18, L.mapN(got, TREASURE.length), 8, '#1a6a1a', 'right', true);
    c.save(); c.beginPath(); c.rect(mx, my, WW * k, WH * k); c.clip(); drawMapArea(g, 0, 0, WW, WH, mx, my, WW * k, WH * k); c.restore();
    c.strokeStyle = '#a8701a'; c.lineWidth = 1; c.strokeRect(mx, my, WW * k, WH * k);
    const M = (x, y) => [mx + x * k, my + y * k];
    const seen = (x, y) => seenAt(g, x, y);
    if (BAY.INLET && has(S, 'valve')) { const [ax, ay] = M(SPOT.pipe, GY), [bx, by] = M(BAY.INLET[0], BAY.INLET[1]); c.strokeStyle = 'rgba(80,90,100,.8)'; c.lineWidth = 1.2; c.setLineDash([2, 2]); c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax, by); c.lineTo(bx, by); c.stroke(); c.setLineDash([]); }
    g.pos.vents.forEach(([x, y]) => { if (!seen(x, y)) return; const [a, b] = M(x, y - 6); c.strokeStyle = '#d8faff'; c.lineWidth = 1; c.beginPath(); c.arc(a, b, 2.2, 0, Math.PI * 2); c.stroke(); });
    if (has(S, BAY.SHOP.flag)) { const [a, b] = M(g.pos.shop[0], g.pos.shop[1]); if (LOOK.shopIc) icon(c, LOOK.shopIc, a, b, 11); else if (!icon6b(c, 8, a, b, 10)) emoji(c, '🐙', a, b, 7); }
    tunnelsOf().forEach(T => { if (!seen(T.at[0], T.at[1])) return; const [a, b] = M(T.at[0] + T.face * 6, T.at[1]); if (art('kelp/icons8')) icon(c, { ic8: 7, e: '🕳' }, a, b, 10); });   // 水下通道口
    TREASURE.forEach(t => { if (!has(S, t)) return; const [a, b] = M(g.pos.things[t][0], g.pos.things[t][1]); txt(c, a, b, '✓', 7, '#30c040', 'center', true, '#003a00'); });
    const [pa, pb] = M(SPOT.pot, GY - 4); if (!icon6b(c, 7, pa, pb - 1, 10)) emoji(c, '🍲', pa, pb, 7);
    const s = g.seal, [sa, sb] = M(s.x, s.land ? GY - 2 : s.y);
    if (Math.floor(tm * 3) % 2 === 0) { c.fillStyle = '#ff3a2a'; c.beginPath(); c.arc(sa, sb, 2.4, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 0.8; c.stroke(); }
    // 右边的说明
    const lx = 236;
    if (!icon6b(c, 7, lx + 4, 47.5, 10)) emoji(c, '🍲', lx + 4, 48, 7); txt(c, lx + 12, 48, L.mapKey[0], 7, '#5a3a1a', 'left', true);
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
    g.tankPellets.forEach(p => { if (icon6b(c, 5, p.x, p.y, 4.6)) return; if (fe) c.drawImage(fe, 0, 0, 64, 64, p.x - 3, p.y - 3, 6, 6); else { c.fillStyle = '#c8a050'; c.beginPath(); c.arc(p.x, p.y, 2, 0, Math.PI * 2); c.fill(); } });
    S.tank.coins.forEach(k => { if (icon6b(c, 4, k.x, k.y, 10)) return; c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(k.x, k.y, 4, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#a87000'; c.lineWidth = 1; c.stroke(); txt(c, k.x, k.y + 0.5, '¥', 5, '#7a4a00', 'center', true); });
    S.tank.fish.forEach((f, i) => drawFish(g, f.sp, f.size, f.x, f.y, f.face || 1, 1.6, tm + i));
    g.cracks.forEach(k => drawCrack(c, k, tm));
    // 顶上一排：照怪怪水族箱
    const bar = art('topbar6') || art('topbar');
    if (bar) c.drawImage(bar, 0, 0, W, TK.top); else { c.fillStyle = '#a81c10'; c.fillRect(0, 0, W, TK.top); }
    const slots = art('slot6') || art('slots');
    const C = caps(S);
    const items = [[L.tankBtns[0], '🍚', null, 0], [L.tankBtns[1], '🪣', () => tankPutIn(g), 1], [L.tankBtns[3], '📋', () => { g.panel = { kind: 'tankmg', sel: 0 }; sfx(g, 'pop'); }, 2], [L.tankBtns[2], '⬅', () => { g.screen = 'play'; save(g); }, 3]];
    items.forEach(([t, e, fn, ic], i) => {
      const x = 22 + i * 38, y = 15;
      if (slots) c.drawImage(slots, 0, 0, 70, 70, x - 14, y - 14, 28, 28); else { c.fillStyle = '#d89a2a'; c.beginPath(); c.arc(x, y, 13, 0, Math.PI * 2); c.fill(); }
      if (!icon6b(c, ic, x, y - 0.5, 17)) emoji(c, e, x, y, 12);
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
    const t6 = art('title6'), t = t6 || art('title');
    // title6 是一张 4:3 的画硬塞进上面 800×478、底下留了 122 像素灰条（任务单让留空放按钮），画面看着是扁的（11-27 作者：没平铺、扁的）。
    // 只取上面那 478 行拉满整个画面：灰条没了，横竖比例也正好还原成 4:3
    if (t6) {
      c.drawImage(t6, 0, 0, 800, 478, 0, 0, W, H);
      const sh = c.createLinearGradient(0, H - 52, 0, H); sh.addColorStop(0, 'rgba(30,12,4,0)'); sh.addColorStop(1, 'rgba(30,12,4,.38)');   // 按钮压在锅上：底下淡淡压暗一点，按钮看得清
      c.fillStyle = sh; c.fillRect(0, H - 52, W, 52);
    } else if (t) c.drawImage(t, 0, 0, W, H); else { c.fillStyle = '#2a9ad0'; c.fillRect(0, 0, W, H); }
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

  /* ================= 音乐：Suno 做的 5 首（assets/tank/music/，提示词见「怪怪水煮箱-Suno提示词.md」） =================
     作者嫌代码合成的音乐太吵，不要了。有文件就放，文件还没做好就不出声。换曲子的时候淡出淡入。 */
  const MUSIC = { title: 'menu', day: 'shore', night: 'sea', tense: 'boss', fight: 'fight', dayR: 'reef-shore', nightR: 'reef-sea', dayK: 'kelp-shore', nightK: 'kelp-sea' };
  const MUSIC_VOL = 0.45;
  const musicVolume = () => (OS.sound.muted ? 0 : MUSIC_VOL * (OS.sound.level == null ? 1 : OS.sound.level));
  function fadeTo(a, v, sec, done) {
    const v0 = a.volume, t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / (sec * 1000)); a.volume = clamp(v0 + (v - v0) * k, 0, 1); if (k < 1) requestAnimationFrame(step); else if (done) done(); };
    requestAnimationFrame(step);
  }
  function setMusic(g, name) {
    if (g.musicName === name) return;
    g.musicName = name;
    if (g.music) { const old = g.music; g.music = null; fadeTo(old, 0, 0.6, () => old.pause()); }
    const file = MUSIC[name];
    if (!file || OS.boot.state !== 'desktop') return;
    const a = new Audio('assets/tank/music/' + file + '.mp3');
    a.loop = true; a.preload = 'auto'; a.volume = 0;
    a.addEventListener('error', () => { if (g.music === a) g.music = null; });   // 还没做好的那首不出声
    g.music = a;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});   // 浏览器不让自己出声的时候，等玩家下一次点画面再放（down 里）
    fadeTo(a, musicVolume(), 0.8);
  }
  const musicApplyVol = () => { if (G && G.music) G.music.volume = musicVolume(); };
  OS.on('sound:muted', musicApplyVol);   // 右下角喇叭静音、控制面板调总音量，跟着变
  OS.on('sound:level', musicApplyVol);

  OS.tank = { open, _G: () => G };   // _G：测试时看里面的状态
})();
