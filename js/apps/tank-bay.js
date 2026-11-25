/* 怪怪水煮箱 · 浅水湾的地形（第六版改：作者说深海太小、道具摆脸上不像银河城 → 1280×1200 的洞穴地图）
   地形 = "挖出来的水"（CARVE）减去"水里的石头"（ROCK）。每一样都是简单形状：
     ['poly', [[x,y],...]] 多边形 ／ ['ell', cx, cy, rx, ry] 椭圆 ／ ['cap', x1, y1, x2, y2, r] 胶囊 ／ ['tun', [[x,y],...], r] 一串胶囊（弯弯绕的洞）／ ['rect', x0, y0, x1, y1]
   网页开的时候算一张"离墙多远"的表（每 8 个单位一个点），画石头、撞墙、鱼躲墙都用它。
   改了这里：node tools/tank-map.mjs 出一张总览图看看（codex产出/怪怪水煮箱/浅水湾地形总览.png）。
   东西的位置写个大概就行，网页会自己让它落到下面的地上（FLOOR 里的那些）。 */
(function (root) {
  'use strict';
  const WW = 1280, WH = 1200, GY = 84, WY = 100, CELL = 8;

  // ---------- 水（挖出来能游的地方） ----------
  const CARVE = [
    // 浅滩：从左边到急流，下面是沙子海底
    ['poly', [[-40, 30], [606, 30], [606, 262], [588, 300], [560, 328], [500, 340], [440, 336], [380, 330], [300, 326], [240, 320], [180, 326], [120, 334], [60, 336], [-40, 336]]],
    // 急流那道口子（往左冲，没大脚蹼过不去）
    ['rect', 590, 30, 672, 258],
    // 礁石区：水面一条 + 两个大厅
    ['rect', 640, 30, 1320, 150],
    ['ell', 805, 232, 150, 108],
    ['rect', 670, 168, 690, 200],    // 竖井和礁石大厅中间那块石头的尖儿太细（海狗会被看不见的尖卡住）→ 平着切掉
    ['rect', 965, 96, 1155, 172],    // 栈道底下那条水道和礁石大厅中间只隔着一层纸薄的石头（同样是空气墙）→ 挖通；往上一直挖到水面，跟水道重叠够厚（两块水只叠一薄条，中间也会算成快贴墙）
    ['ell', 1060, 250, 165, 100],
    // 礁石区右下：弯弯的窄洞 → 头灯的小石洞
    ['tun', [[1170, 320], [1222, 352], [1196, 392], [1238, 424]], 15],
    ['ell', 1240, 446, 26, 19],
    // 礁石区的暗道 → 氧气瓶 1
    ['tun', [[900, 312], [918, 362], [930, 388]], 15],
    ['ell', 934, 398, 26, 19],
    // 礁石区地上的洞：往下冲的水流（单向）→ 深海中间的大洞
    ['cap', 722, 318, 722, 560, 19],
    // 浅滩那块裂了缝的石头底下：竖井 → 深海左边的大厅
    ['cap', 452, 318, 452, 520, 18],
    ['ell', 452, 562, 112, 56],
    // 左大厅往左：弯弯绕的窄洞 → 大脚蹼
    ['tun', [[350, 578], [296, 560], [254, 600], [204, 578], [154, 618], [110, 596], [74, 636]], 15],
    ['ell', 58, 650, 26, 19],
    // 左大厅上面的暗道 → 氧气瓶 2
    ['tun', [[398, 522], [384, 484]], 15],
    ['ell', 380, 468, 23, 17],
    // 左大厅往右 → 深海中间的大洞
    ['tun', [[556, 582], [620, 612], [700, 604]], 22],
    ['ell', 822, 622, 172, 80],
    // 大洞下面的暗道 → 一堆珍珠
    ['tun', [[700, 684], [692, 728]], 15],
    ['ell', 690, 744, 24, 16],
    // 大洞往右 → 章鱼小铺的石洞
    ['tun', [[986, 610], [1058, 582], [1120, 602], [1164, 604]], 17],
    ['ell', 1182, 602, 52, 36],
    // 大洞右下：往下的洞 → 黑的深海
    ['tun', [[944, 676], [982, 740], [962, 800], [1002, 866]], 20],
    // 最黑的深海：上大洞、下大洞
    ['ell', 822, 962, 332, 112],
    ['ell', 702, 1120, 262, 62],
    ['ell', 690, 1068, 130, 34],   // 上下两个大洞连起来
    ['rect', 820, 1058, 915, 1096],   // 往右这一段原来两个洞只擦边，夹着一道 5 高的缝、一片薄石头：看着是水、海狗卡住（作者：好像有空气墙）→ 挖开；切在石头够厚的地方，别再留细边
    // 下大洞往左：窄洞 → 漂流瓶（酸菜鱼配方）
    ['tun', [[468, 1122], [380, 1102], [300, 1142], [200, 1120], [120, 1150]], 16],
    ['ell', 88, 1152, 25, 18],
    // 上大洞左上的暗道 → 氧气瓶 3
    ['tun', [[562, 904], [532, 862]], 15],
    ['ell', 520, 846, 23, 16],
    // 下大洞右边的暗道 → 一堆珍珠
    ['tun', [[950, 1128], [998, 1160], [1018, 1166]], 15],
    ['ell', 1022, 1166, 25, 16],
    // 上大洞右下 → 进水口
    ['tun', [[1136, 1000], [1196, 1076], [1226, 1138]], 18],
    ['ell', 1236, 1150, 32, 30]
  ];

  // ---------- 水里的石头（长在水里，挡路） ----------
  const ROCK = [
    // 浅滩：墨鱼躲着的一小堆
    ['ell', 330, 318, 20, 15], ['ell', 362, 322, 15, 12], ['ell', 302, 322, 12, 10],
    // 礁石区的柱子、拱
    ['ell', 760, 196, 22, 26], ['ell', 846, 268, 30, 24], ['ell', 700, 156, 14, 16], ['ell', 980, 214, 24, 30],
    ['ell', 1086, 302, 28, 22], ['ell', 1150, 196, 20, 24], ['ell', 905, 160, 12, 14],
    // 深海中间的大洞：几根石柱
    ['ell', 880, 600, 26, 34], ['ell', 760, 660, 18, 16],
    // 最黑的深海：石柱
    ['ell', 702, 962, 32, 36], ['ell', 902, 1002, 28, 30], ['ell', 1002, 922, 20, 24], ['ell', 610, 1010, 16, 18], ['ell', 780, 868, 13, 22], ['ell', 1066, 902, 11, 17]
  ];

  // ---------- 沉船（木头墙，不加起伏）：船尾在左、船头在右，甲板 y=268，上面一个驾驶舱 ----------
  // 路：驾驶舱左边的门 → 舱里地板上的破洞 → 前舱 → 隔板底下的缝 → 后舱最里头（推进器）
  const BOAT = {
    box: [30, 204, 246, 342],                 // 整条船占的地方（外壳图、船舱图都画满这一块：216×138，图 720×460）
    inside: [[44, 274], [58, 320], [120, 328], [198, 322], [228, 274], [204, 274], [204, 218], [152, 218], [152, 274]],   // 里面（海狗进来了外壳就变透明）
    walls: [
      ['tun', [[38, 270], [54, 324], [120, 334], [200, 328], [236, 270]], 6],   // 船底
      ['cap', 38, 268, 160, 268, 5], ['cap', 196, 268, 236, 268, 5],           // 甲板（驾驶舱地板上一个破洞）
      ['cap', 150, 214, 150, 232, 5], ['cap', 206, 214, 206, 268, 5], ['cap', 150, 214, 206, 214, 5],   // 驾驶舱：左墙（下面是门）、右墙、顶
      ['cap', 150, 272, 150, 300, 5]                                           // 前后舱中间的隔板（底下一道缝）
    ]
  };

  // ---------- 裂了缝的石头（推进器冲过去撞开） ----------
  const CRACKS = [{ id: 'crack1', shape: ['ell', 452, 338, 32, 17] }];

  // ---------- 暗道：看着是石头，游进去就露出来（x0, y0, x1, y1） ----------
  const COVERS = [
    { id: 'hideA', r: [886, 322, 964, 422] },
    { id: 'hideB', r: [352, 444, 412, 514] },
    { id: 'hideC', r: [664, 682, 718, 764] },
    { id: 'hideD', r: [492, 826, 576, 904] },
    { id: 'hideE', r: [944, 1126, 1052, 1186] }
  ];

  // ---------- 水流 ----------
  const CURRENTS = [
    { x0: 590, x1: 672, y0: 96, y1: 258, vx: -78, vy: 0, fins: true },   // 往左冲：有大脚蹼游得过去
    { x0: 702, x1: 742, y0: 352, y1: 560, vx: 0, vy: 150, fins: false }  // 往下冲：只能顺着下去
  ];
  const DARK_Y = 790;   // 再往下就是最黑的深海（没头灯不敢下去）

  // ---------- 东西（写大概位置；带 FLOOR 的落到地上） ----------
  const THINGS = {
    thruster: { at: [62, 312], k: 'gear' },
    fins: { at: [56, 656], k: 'gear' },
    lamp: { at: [1242, 452], k: 'gear' },
    o2a: { at: [934, 404], k: 'o2' },
    o2b: { at: [380, 474], k: 'o2' },
    o2c: { at: [520, 852], k: 'o2' },
    bottle: { at: [86, 1160], k: 'recipe' },
    stash1: { at: [690, 750], k: 'pearls', n: 4 },
    stash2: { at: [1022, 1172], k: 'pearls', n: 6 },
    valve: { at: [1226, 1172], k: 'valve' }
  };
  const VENTS = [[470, 620], [840, 702], [640, 1182], [1090, 1010]];
  const OCTOPUS = [1192, 630];
  const INLET = [1258, 1144];   // 粗水管口（在右边石壁上）
  const CLAMS = [[262, 330], [548, 340], [1010, 350], [822, 1076]];
  // 浅滩海底这一片画成沙子（礁石堆、裂石按形状自己留成石头）。右边是大石头埋在沙里的那半边：从沙脊往下鼓进沙子里；底下是一条起伏的线（11-25 作者：分界太硬，原来右边是一刀竖线）
  const SAND = [[-40, 300], [606, 250], [609, 262], [600, 292], [588, 328], [581, 366], [588, 402], [600, 428], [540, 438], [460, 424], [380, 440], [300, 428], [220, 442], [140, 426], [60, 440], [-40, 430]];
  const FIGHT = { x0: 300, x1: 540, y0: 104, y1: 284 };            // 跟大白鲨打架的那片水（正好一屏，镜头不动）

  // 野生鱼住在哪儿
  const REGIONS = [
    { x0: 20, x1: 590, y0: 112, y1: 300, n: 11, pick: [['yellow', 0.6], ['bass', 0.4]], big: 0.08 },
    { x0: 280, x1: 400, y0: 262, y1: 304, n: 2, pick: [['squid', 1]], big: 0.12 },
    { x0: 660, x1: 1220, y0: 120, y1: 340, n: 6, pick: [['squid', 0.5], ['bass', 0.5]], big: 0.15 },
    { x0: 360, x1: 1000, y0: 520, y1: 690, n: 6, pick: [['croaker', 0.7], ['bass', 0.3]], big: 0.35 },
    { x0: 500, x1: 1120, y0: 870, y1: 1170, n: 5, pick: [['croaker', 1]], big: 0.7, king: 0.25 }
  ];

  /* ---------- 算"离墙多远" ---------- */
  const len = Math.hypot;
  function sdCap(px, py, ax, ay, bx, by, r) {
    const pax = px - ax, pay = py - ay, bax = bx - ax, bay = by - ay;
    const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay || 1)));
    return len(pax - bax * h, pay - bay * h) - r;
  }
  function sdPoly(px, py, v) {
    let d = Infinity, s = 1;
    for (let i = 0, j = v.length - 1; i < v.length; j = i++) {
      const ex = v[j][0] - v[i][0], ey = v[j][1] - v[i][1], wx = px - v[i][0], wy = py - v[i][1];
      const h = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
      d = Math.min(d, len(wx - ex * h, wy - ey * h));
      const c1 = py >= v[i][1], c2 = py < v[j][1], c3 = ex * wy > ey * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * d;
  }
  function sd(sh, x, y) {
    switch (sh[0]) {
      case 'ell': { const px = x - sh[1], py = y - sh[2], k0 = len(px / sh[3], py / sh[4]), k1 = len(px / (sh[3] * sh[3]), py / (sh[4] * sh[4])); return k1 ? k0 * (k0 - 1) / k1 : -Math.min(sh[3], sh[4]); }
      case 'cap': return sdCap(x, y, sh[1], sh[2], sh[3], sh[4], sh[5]);
      case 'tun': { let d = Infinity; const p = sh[1]; for (let i = 1; i < p.length; i++) d = Math.min(d, sdCap(x, y, p[i - 1][0], p[i - 1][1], p[i][0], p[i][1], sh[2])); return d; }
      case 'rect': { const dx = Math.max(sh[1] - x, x - sh[3]), dy = Math.max(sh[2] - y, y - sh[4]); return dx > 0 || dy > 0 ? len(Math.max(dx, 0), Math.max(dy, 0)) : Math.max(dx, dy); }
      case 'poly': return sdPoly(x, y, sh[1]);
    }
    return Infinity;
  }
  const smin = (a, b, k) => { const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (b - a) / k)); return b + (a - b) * h - k * h * (1 - h); };
  const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const inBox = (x, y, b, m) => x >= b[0] - m && x <= b[2] + m && y >= b[1] - m && y <= b[3] + m;
  // 石头边上一点起伏（固定的，每次都一样）
  function hash(ix, iy) { let h = (ix * 374761393 + iy * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) & 0xffff) / 32767.5 - 1; }
  function vnoise(x, y, p) {
    const fx = x / p, fy = y / p, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
  // 每样形状占的框（算的时候远的直接跳过，快）
  function bbox(sh) {
    switch (sh[0]) {
      case 'ell': return [sh[1] - sh[3], sh[2] - sh[4], sh[1] + sh[3], sh[2] + sh[4]];
      case 'cap': return [Math.min(sh[1], sh[3]) - sh[5], Math.min(sh[2], sh[4]) - sh[5], Math.max(sh[1], sh[3]) + sh[5], Math.max(sh[2], sh[4]) + sh[5]];
      case 'tun': { const xs = sh[1].map(p => p[0]), ys = sh[1].map(p => p[1]); return [Math.min(...xs) - sh[2], Math.min(...ys) - sh[2], Math.max(...xs) + sh[2], Math.max(...ys) + sh[2]]; }
      case 'rect': return sh.slice(1, 5);
      case 'poly': { const xs = sh[1].map(p => p[0]), ys = sh[1].map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
    }
    return [-1e9, -1e9, 1e9, 1e9];
  }
  const boxD = (x, y, b) => len(Math.max(b[0] - x, 0, x - b[2]), Math.max(b[1] - y, 0, y - b[3]));
  const CB = CARVE.map(bbox), RB = ROCK.map(bbox);
  // 大于 0 是墙，小于 0 是水；broken：撞开了的裂石 id
  function solid(x, y, broken) {
    let w = 60;   // 离所有水都远的地方，算 60 就够了（反正是实心石头）
    for (let i = 0; i < CARVE.length; i++) { if (boxD(x, y, CB[i]) > w + 12) continue; w = smin(w, sd(CARVE[i], x, y), 10); }
    let f = w;
    if (!inBox(x, y, BOAT.box, 6)) f += (vnoise(x, y, 46) * 0.7 + vnoise(x + 300, y, 17) * 0.3) * 3.2;
    let r = Infinity;
    for (let i = 0; i < ROCK.length; i++) if (boxD(x, y, RB[i]) < 60) r = Math.min(r, sd(ROCK[i], x, y));
    if (r < 60) f = Math.max(f, -r + vnoise(x, y + 500, 13) * 1.5 * clamp01(1 - r / 40));   // 离石头远的地方也要连续（不然洞的后墙会一格一格的）
    for (const c of CRACKS) if (!(broken && broken[c.id])) f = Math.max(f, -sd(c.shape, x, y));
    if (inBox(x, y, BOAT.box, 8)) for (const sh of BOAT.walls) f = Math.max(f, -sd(sh, x, y));
    if (x < 2 || x > WW - 2 || y > WH - 2) f = Math.max(f, 4);
    if (y < WY - 6) f = Math.min(f, -20);
    return f;
  }
  // 整张表：(cols+1)×(rows+1) 个点
  function build(broken, out, area) {
    const cols = Math.ceil(WW / CELL), rows = Math.ceil(WH / CELL);
    const F = out || new Float32Array((cols + 1) * (rows + 1));
    const [i0, j0, i1, j1] = area ? [Math.max(0, Math.floor(area[0] / CELL)), Math.max(0, Math.floor(area[1] / CELL)), Math.min(cols, Math.ceil(area[2] / CELL)), Math.min(rows, Math.ceil(area[3] / CELL))] : [0, 0, cols, rows];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) F[j * (cols + 1) + i] = solid(i * CELL, j * CELL, broken);
    return { F, cols, rows };
  }

  root.tankBay = { WW, WH, GY, WY, CELL, CARVE, ROCK, BOAT, CRACKS, COVERS, CURRENTS, DARK_Y, THINGS, VENTS, OCTOPUS, INLET, CLAMS, SAND, FIGHT, REGIONS, solid, build, sd };
})(typeof OS !== 'undefined' ? OS : globalThis);
