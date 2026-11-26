/* 怪怪水煮箱 · 第二个展区「珊瑚礁」的地形（2026-11-26，创意稿「怪怪水煮箱-珊瑚礁-创意.md」作者回 1A 2B 3A 4A 5A … 15A 16A）
   比浅水湾宽一屏、深一屏：1520×1380。写法跟 tank-bay.js 一样：地形 = 挖出来的水（CARVE）减去水里的石头（ROCK）。
   从上往下：
     浅水礁湖（白沙底，左边沉着观光潜水艇，中间是跟豹海豹打架的那片水，几块大礁石）
     → 右边上面一片珊瑚迷宫（窄缝被海胆堵着，戴厚皮手套推开；半路寄居蟹小铺，最里头是回声）
     → 礁湖右下角往下是珊瑚洞（石斑鱼躲在小洞里探头，狮子鱼），再往右是第二个洞（右边一条只有回声找得到的暗道 → 潜水头盔）
     → 第二个洞底下一口竖井 → 海沟（再往下水压大，没头盔下不去）→ 海沟最深处：去下一个展区的水下通道口、最后一个氧气瓶、一堆珍珠
   改了这里：node tools/tank-map.mjs reef 出一张总览图看看（codex产出/怪怪水煮箱/珊瑚礁地形总览.png）。 */
(function (root) {
  'use strict';
  const WW = 1520, WH = 1380, GY = 84, WY = 100, CELL = 8;

  // ---------- 水（挖出来能游的地方） ----------
  const CARVE = [
    // 浅水礁湖：白沙海底，中间那段平一点（打架的地方）
    ['poly', [[-40, 30], [640, 30], [640, 250], [634, 290], [620, 318], [560, 318], [500, 316], [440, 318], [380, 316], [320, 320], [290, 330], [220, 336], [140, 338], [60, 336], [-40, 338]]],
    // 栈道右半边底下：水面一条
    ['rect', 600, 30, 1560, 140],
    // ---- 珊瑚迷宫 ----
    ['tun', [[630, 214], [700, 198], [760, 226], [840, 202], [920, 232], [1000, 206], [1080, 236], [1160, 208], [1240, 236]], 16],   // 最上面那条弯弯的走廊（左头接礁湖）
    ['cap', 840, 202, 840, 132, 15], ['cap', 1160, 208, 1160, 132, 15],   // 两个口子通到上面的水面
    ['tun', [[760, 226], [744, 296], [782, 344]], 15], ['ell', 804, 362, 36, 22],   // 左边的死胡同：海葵小厅
    ['tun', [[822, 360], [878, 330], [904, 292]], 14],   // 海葵小厅绕回去
    ['tun', [[920, 232], [900, 296], [940, 346], [928, 408], [932, 440]], 15],   // 往下的窄缝（海胆 1 堵着）
    ['ell', 934, 452, 62, 38],   // 寄居蟹小铺那间
    ['tun', [[970, 448], [1050, 418], [1108, 446], [1166, 430], [1196, 438]], 15],   // 再往右的窄缝（海胆 2 堵着）
    ['ell', 1212, 440, 40, 28],   // 迷宫最里面：回声
    ['tun', [[1080, 236], [1062, 298], [1092, 340]], 15], ['ell', 1096, 352, 24, 17],   // 右边的死胡同（海贝）
    ['tun', [[1240, 236], [1282, 290], [1272, 338], [1269, 356]], 14], ['ell', 1268, 360, 27, 20],   // 右头往下（海胆 3 堵着）→ 氧气瓶 2
    // ---- 珊瑚洞 ----
    ['tun', [[600, 300], [628, 360], [614, 430], [600, 470]], 20],   // 礁湖右下角往下
    ['ell', 430, 522, 200, 78],   // 珊瑚洞大厅
    ['tun', [[262, 540], [180, 584], [120, 562], [70, 592]], 15], ['ell', 52, 602, 26, 20],   // 往左的窄洞 → 漂流瓶（椰汁鱼）
    ['tun', [[302, 566], [300, 592], [290, 640], [288, 654]], 14], ['ell', 288, 656, 22, 16],   // 大厅底下的暗道 → 珍珠
    ['tun', [[560, 548], [620, 566], [700, 602], [770, 624]], 18], ['ell', 606, 558, 34, 26],   // 往右 → 第二个洞（出大厅那个口子再挖大一点，别夹出空气墙）
    ['ell', 860, 640, 130, 64],   // 第二个洞
    ['tun', [[960, 620], [1040, 596], [1100, 612], [1160, 600]], 15], ['ell', 1182, 602, 28, 20],   // 右边那条暗道（只有回声找得到）→ 潜水头盔
    // ---- 海沟 ----
    ['cap', 846, 690, 850, 884, 22],   // 第二个洞底下的竖井
    ['ell', 900, 980, 270, 110],
    ['ell', 980, 1085, 215, 78],   // 上下两段连起来：一大块叠在两段中间（原来只用一根斜的胶囊连，两段在旁边只擦边，看着是水过不去——作者：这里过不去）
    ['ell', 1050, 1180, 320, 100],
    ['ell', 1240, 1258, 150, 50],   // 下段和最深处连起来（同样，原来擦边）
    ['ell', 1300, 1300, 170, 56],   // 最深处
    ['ell', 1458, 1300, 40, 32],   // 通道口前面
    ['tun', [[720, 1030], [640, 1100], [600, 1130], [586, 1140]], 15], ['ell', 580, 1142, 26, 18],   // 海沟左下的窄洞 → 氧气瓶 3
    // ---- 石斑鱼躲的小洞（往墙里挖进去一点） ----
    ['ell', 228, 508, 14, 10], ['ell', 979, 668, 13, 10], ['ell', 626, 982, 14, 10], ['ell', 1372, 1172, 14, 10], ['ell', 756, 1222, 13, 9]
  ];

  // ---------- 水里的石头 ----------
  const ROCK = [
    ['ell', 360, 548, 18, 26], ['ell', 522, 500, 16, 20],   // 珊瑚洞大厅的柱子
    ['ell', 884, 628, 16, 22],   // 第二个洞的柱子
    ['ell', 820, 990, 24, 40], ['ell', 1120, 1196, 22, 28], ['ell', 960, 930, 14, 18]   // 海沟里的石柱
  ];

  // ---------- 沉了的观光潜水艇（铁皮墙）：船尾在左、船头在右；坐标照「codex任务包/怪怪水煮箱-潜水艇底稿.png」（tools/reef-sub-draft.py）+ (6, 200) ----------
  // 路：船头玻璃罩（推进器撞碎）→ 前舱 → 隔板底下的缝 → 客舱（最左头座位底下：手套）→ 隔板上面的缝 → 机舱（氧气瓶）；指挥塔通客舱，塔顶舱门卡死
  const OX = 6, OY = 200;
  const T = pts => pts.map(([x, y]) => [x + OX, y + OY]);
  const C = (x1, y1, x2, y2, r) => ['cap', x1 + OX, y1 + OY, x2 + OX, y2 + OY, r];
  const ARC = []; for (let i = 0; i <= 16; i++) { const t = -Math.PI / 2 + i * Math.PI / 16; ARC.push([250 + 41 * Math.cos(t), 71 + 41 * Math.sin(t)]); }
  const IN_ARC = []; for (let i = 0; i <= 16; i++) { const t = Math.PI / 2 - i * Math.PI / 16; IN_ARC.push([250 + 35 * Math.cos(t), 71 + 35 * Math.sin(t)]); }
  const BOAT = {
    box: [OX, OY, OX + 300, OY + 126],   // 图 1000×420 画满这一块（300×126）
    inside: T([[22, 36], [16, 70], [26, 98], [46, 106], [250, 106]].concat(IN_ARC, [[250, 36], [165, 36], [165, 13], [133, 13], [133, 36], [46, 36]])),
    walls: [
      ['tun', T([[128, 30], [44, 30], [24, 44], [14, 70], [24, 96], [44, 112], [250, 112]]), 6],   // 艇壳（顶上留出指挥塔的口子）
      C(170, 30, 250, 30, 5),
      C(128, 30, 128, 8, 5), C(128, 8, 170, 8, 5), C(170, 8, 170, 30, 5),   // 指挥塔
      C(208, 30, 208, 74, 5),    // 前舱和客舱中间的隔板（底下一道缝）
      C(74, 112, 74, 68, 5)      // 客舱和机舱中间的隔板（上面一道缝）
    ],
    art: { out: 'reef/sub', cells: 2, broke: 'r_dome', in: 'reef/subin' }
  };

  // ---------- 撞得开的：潜水艇船头的玻璃罩（推进器冲过去撞碎；图是 sub.webp 的两格，不单独画） ----------
  const CRACKS = [{ id: 'r_dome', shape: ['tun', T(ARC), 5], sub: true }];

  // ---------- 暗道 ----------
  // 普通的：看着是石头，游进去就露出来；echo：没回声之前是实心的墙，回声一照才露出来、才过得去
  const COVERS = [
    { id: 'r_hide1', r: [266, 600, 312, 676] },
    { id: 'r_echo1', r: [992, 578, 1216, 632], echo: true }
  ];

  // ---------- 海胆：堵着窄缝，碰了扎一下弹回来；戴厚皮手套推开（推开了就记着） ----------
  const URCHINS = [
    { id: 'r_u1', x: 932, y: 376, r: 15 },
    { id: 'r_u2', x: 1137, y: 438, r: 15 },
    { id: 'r_u3', x: 1278, y: 312, r: 14 }
  ];

  // ---------- 打架那片水里的大礁石（豹海豹一头撞上就晕）：脚底的点（落在沙上）；撞墙按椭圆算 ----------
  const BOULDERS = [[364, 317], [452, 318], [536, 318]];
  const BOULDER_SH = ([x, y]) => ['ell', x, y - 21, 23, 19];

  const CURRENTS = [];
  const DARK_Y = 960;   // 海沟往下越来越黑（有头灯）
  const DEPTH = { y: 892, need: 'r_helmet', msg: 'tooDeep', line: true };   // 再往下水压大：没潜水头盔下不去（作者 4A：一条看得见的深度线）

  // ---------- 东西 ----------
  const THINGS = {
    r_gloves: { at: [98, 294], k: 'gear' },     // 潜水艇客舱最左头的座位底下
    r_o2a: { at: [50, 286], k: 'o2' },          // 潜水艇机舱
    r_echo: { at: [1214, 440], k: 'gear' },     // 迷宫最里面
    r_o2b: { at: [1268, 360], k: 'o2' },        // 海胆 3 后面
    r_helmet: { at: [1184, 602], k: 'gear' },   // 回声暗道尽头
    r_o2c: { at: [580, 1142], k: 'o2' },        // 海沟左下
    r_bottle: { at: [52, 604], k: 'recipe', r: 'coco' },   // 漂流瓶：椰汁鱼
    r_stash1: { at: [288, 658], k: 'pearls', n: 5 },
    r_stash2: { at: [1404, 1330], k: 'pearls', n: 8 }
  };
  const VENTS = [[420, 598], [898, 486], [1000, 1276]];
  const SHOP = { at: [962, 470], mk: 'hermit', flag: 'r_hermit' };   // 寄居蟹小铺（迷宫半路）
  const TUNNEL = [1482, 1300];   // 海沟最深处，去下一个展区的水下通道口（口冲左）
  const CLAMS = [[584, 318], [806, 384], [370, 598], [1152, 1276]];
  const JUNK = [408, 494, 582], DRIFT = [330, 590];   // 每天海底的破烂、漂流瓶落在哪段
  // 礁湖海底这一片是白沙
  const SAND = [[-40, 296], [596, 292], [612, 330], [592, 372], [540, 392], [460, 384], [380, 396], [300, 386], [220, 398], [140, 388], [60, 398], [-40, 392]];
  // 珊瑚迷宫：石头画成珊瑚墙（coral.webp）
  const CORAL = [[650, 142, 1336, 520]];
  const FIGHT = { x0: 320, x1: 560, y0: 140, y1: 320 };   // 跟豹海豹打架的那片水（正好一屏，镜头不动）
  // 石斑鱼躲的小洞：鱼待在洞里，头冲外（face）
  const HOLES = [[231, 508, 1], [975, 668, -1], [630, 982, 1], [1368, 1172, -1], [758, 1222, 1]];

  // 野生鱼住在哪儿（石斑鱼另外放在 HOLES 里）
  const REGIONS = [
    { x0: 320, x1: 620, y0: 112, y1: 300, n: 8, pick: [['clown', 0.55], ['butterfly', 0.45]], big: 0.08 },
    { x0: 20, x1: 300, y0: 112, y1: 186, n: 3, pick: [['clown', 0.6], ['butterfly', 0.4]], big: 0.08 },
    { x0: 680, x1: 1300, y0: 160, y1: 480, n: 8, pick: [['clown', 0.55], ['butterfly', 0.45]], big: 0.15 },
    { x0: 240, x1: 990, y0: 450, y1: 700, n: 5, pick: [['lion', 1]], big: 0.25 },
    { x0: 640, x1: 1460, y0: 900, y1: 1340, n: 6, pick: [['lion', 0.55], ['grouper', 0.45]], big: 0.6, king: 0.25 }
  ];
  // 海底小摆设（decor.webp：0 脑珊瑚 1 蓝鹿角 2 紫海绵 3 海葵 4 海星 5 黄扇珊瑚 6 砗磲 7 发光管虫）按深浅挑
  const decorKinds = (x, y) => (y < 420 && x < 640 ? [3, 4, 0, 5, 3, 6] : y < 560 && x > 640 ? [0, 1, 2, 3, 5, 3] : y < DARK_Y - 60 ? [0, 2, 5, 1, 6] : [7, 2, 7, 6]);
  const DECOR_FOOT = [112, 117, 124, 119, 119, 121, 113, 124];   // decor.webp 每格最下面在第几行（量出来的）
  const FRONT_FOOT = [373, 363, 337, 352, 392, 390];
  const LOOK = { light0: 380, far: [640, 1000], zone: '珊瑚礁' };

  /* ---------- 算"离墙多远"（跟 tank-bay.js 一样的算法） ---------- */
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
  function hash(ix, iy) { let h = (ix * 374761393 + iy * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) & 0xffff) / 32767.5 - 1; }
  function vnoise(x, y, p) {
    const fx = x / p, fy = y / p, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
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
  const CB = CARVE.map(bbox), RB = ROCK.map(bbox), BSH = BOULDERS.map(BOULDER_SH);
  // 大于 0 是墙，小于 0 是水；broken：撞开的、推开的、照出来的 id；noBoulder：不算大礁石（画石头那层用，大礁石另外贴图）
  function solid(x, y, broken, noBoulder, noBoat) {   // noBoat：不算潜水艇的墙和玻璃罩（画洞后墙那层用）
    let w = 60;
    for (let i = 0; i < CARVE.length; i++) { if (boxD(x, y, CB[i]) > w + 12) continue; w = smin(w, sd(CARVE[i], x, y), 10); }
    let f = w;
    if (!inBox(x, y, BOAT.box, 6)) f += (vnoise(x, y, 46) * 0.7 + vnoise(x + 300, y, 17) * 0.3) * 3.2;
    let r = Infinity;
    for (let i = 0; i < ROCK.length; i++) if (boxD(x, y, RB[i]) < 60) r = Math.min(r, sd(ROCK[i], x, y));
    if (r < 60) f = Math.max(f, -r + vnoise(x, y + 500, 13) * 1.5 * clamp01(1 - r / 40));
    for (const c of CRACKS) if (!(broken && broken[c.id]) && !(noBoat && c.sub)) f = Math.max(f, -sd(c.shape, x, y));
    if (!noBoat && inBox(x, y, BOAT.box, 8)) for (const sh of BOAT.walls) f = Math.max(f, -sd(sh, x, y));
    for (const U of URCHINS) if (!(broken && broken[U.id])) f = Math.max(f, U.r - len(x - U.x, y - U.y));
    for (const Q of COVERS) if (Q.echo && !(broken && broken[Q.id])) f = Math.max(f, -sd(['rect', Q.r[0], Q.r[1], Q.r[2], Q.r[3]], x, y));
    if (!noBoulder) for (let i = 0; i < BSH.length; i++) if (!(broken && broken['r_boulder' + i])) f = Math.max(f, -sd(BSH[i], x, y));   // 打豹海豹的时候砸碎的礁石不算
    if (y > WH - 2) f = Math.max(f, 4);   // 左右两头不再砌一道墙（画出来是水里一道竖线，作者）；出界由 fieldAt 和海狗的 x 限制挡着
    if (y < WY - 6) f = Math.min(f, -20);
    return f;
  }
  function build(broken, out, area) {
    const cols = Math.ceil(WW / CELL), rows = Math.ceil(WH / CELL);
    const F = out || new Float32Array((cols + 1) * (rows + 1));
    const [i0, j0, i1, j1] = area ? [Math.max(0, Math.floor(area[0] / CELL)), Math.max(0, Math.floor(area[1] / CELL)), Math.min(cols, Math.ceil(area[2] / CELL)), Math.min(rows, Math.ceil(area[3] / CELL))] : [0, 0, cols, rows];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) F[j * (cols + 1) + i] = solid(i * CELL, j * CELL, broken);
    return { F, cols, rows };
  }

  root.tankReef = { id: 'reef', WW, WH, GY, WY, CELL, CARVE, ROCK, BOAT, CRACKS, COVERS, URCHINS, BOULDERS, BOULDER_SH, CURRENTS, DARK_Y, DEPTH, THINGS, VENTS, SHOP, TUNNEL, INLET: null,
    CLAMS, JUNK, DRIFT, SAND, CORAL, FIGHT, HOLES, REGIONS, decorKinds, DECOR_FOOT, FRONT_FOOT, LOOK, solid, build, sd };
})(typeof OS !== 'undefined' ? OS : globalThis);
