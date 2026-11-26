/* 怪怪水煮箱 · 第三个展区「海草林」的地形（2026-11-26，创意稿「怪怪水煮箱-海草林-创意.md」作者回 1～12 全 A）
   1520×1380，写法跟 tank-bay.js、tank-reef.js 一样：地形 = 挖出来的水（CARVE）减去水里的石头（ROCK）。
   从上往下：
     海带林（一大片浅水，一根根巨型海带从海底长到水面；中间一块空地是跟大章鱼打架的地方，空地中间一块大礁石）
     → 左边往下一口竖井 → 观察站那间（塌了的旧水下观察站坐在底上；左墙上一个水下通道口，通珊瑚礁海沟底）
     → 往右的窄道被海带墙堵着（海带刀割开）→ 中间的洞（海马小铺；右边又一堵海带墙后面是绝缘潜水服；左下回声暗道 → 氧气瓶）
     → 往下 → 电鳗窝（电鳗来回游，穿绝缘服才不怕）→ 右上电鳗守着的窄道尽头：甩尾
     → 电鳗窝右下一道急流（往回冲，有甩尾才冲得过去）→ 最深处：氧气瓶、珍珠、去下一个展区（深海沟）的通道口
   改了这里：node tools/tank-map.mjs kelp 出总览图；node tools/tank-reach.mjs kelp 一步步试拿东西的顺序；node tools/tank-seams.mjs kelp 扫空气墙。 */
(function (root) {
  'use strict';
  const WW = 1520, WH = 1380, GY = 84, WY = 100, CELL = 8;

  // ---------- 水 ----------
  const CARVE = [
    // 海带林：左边深、中间一块高一点的平地（打架的空地）、右边慢慢浅上去
    ['poly', [[-40, 30], [1100, 30], [1100, 300], [1076, 360], [1040, 400], [970, 424], [880, 436], [780, 430], [690, 440], [630, 432], [596, 380], [572, 340], [560, 334], [320, 334], [300, 350], [270, 410], [220, 440], [150, 446], [80, 440], [-40, 444]]],
    ['rect', 1060, 30, 1560, 140],   // 栈道右半边底下：水面一条
    ['tun', [[1050, 380], [1110, 420], [1150, 432]], 15], ['ell', 1176, 434, 26, 18],   // 海带林右下角：海带墙 3 后面一小窝珍珠
    ['tun', [[150, 420], [146, 480], [160, 570]], 24],   // 左边往下的竖井
    // ---- 观察站那间（站坐在底上，box 40,600 ~ 400,770）；左墙上一个水下通道口，往左通珊瑚礁海沟底（作者 2A）----
    ['poly', [[8, 548], [470, 548], [500, 580], [506, 700], [496, 772], [8, 776]]],
    ['tun', [[40, 590], [-30, 590]], 21],
    // ---- 往右：海带墙 1 → 中间的洞 ----
    ['tun', [[470, 640], [560, 624], [640, 640], [710, 628]], 17],
    ['ell', 820, 630, 150, 72],
    ['tun', [[950, 610], [1020, 590], [1080, 612], [1136, 600]], 16], ['ell', 1162, 600, 32, 22],   // 海带墙 2 后面：绝缘潜水服
    ['tun', [[722, 670], [708, 740]], 14], ['ell', 706, 756, 24, 16],   // 左下回声暗道 → 氧气瓶 2
    // ---- 电鳗窝 ----
    ['tun', [[880, 690], [920, 760], [975, 870]], 19],
    ['ell', 1000, 920, 170, 78],
    ['tun', [[1120, 880], [1220, 850], [1320, 870], [1386, 860]], 15], ['ell', 1412, 860, 32, 22],   // 电鳗守着的窄道 → 甩尾
    ['tun', [[1110, 950], [1190, 1010], [1330, 1010], [1362, 1080]], 18],   // 急流那条（中间一段是平的，急流在这段往回冲）
    ['ell', 1390, 1110, 100, 62],   // 最深处
    ['ell', 1462, 1110, 34, 30], ['tun', [[1470, 1110], [1550, 1110]], 22],   // 通道口
    // ---- 狼鳗躲的小洞 ----
    ['ell', 678, 600, 14, 10], ['ell', 960, 662, 14, 10], ['ell', 826, 930, 14, 10]
  ];
  const ROCK = [
    ['ell', 830, 640, 18, 24],   // 中间的洞里的柱子
    ['ell', 1000, 930, 22, 30], ['ell', 1110, 900, 14, 18]   // 电鳗窝里的石头
  ];

  // ---------- 塌了的水下观察站：坐标照「codex任务包/怪怪水煮箱-观察站底稿.png」（tools/kelp-station-draft.py）+ (40, 600) ----------
  // 路：控制室左墙舱门（推进器撞开）→ 隧道左段 → 检修口下去 → 地板底下的检修通道（氧气瓶）→ 绕过塌了的那堆 → 检修口上来 → 隧道尽头（海带刀）
  const OX = 40, OY = 600;
  const T = pts => pts.map(([x, y]) => [x + OX, y + OY]);
  const C = (x1, y1, x2, y2, r) => ['cap', x1 + OX, y1 + OY, x2 + OX, y2 + OY, r];
  const BOAT = {
    box: [OX, OY, OX + 360, OY + 170],   // 图 1200×567 画满这一块
    inside: T([[17, 45], [92, 45], [130, 35], [190, 29], [250, 29], [310, 35], [345, 52], [345, 153], [17, 153]]),
    walls: [
      ['tun', T([[12, 40], [92, 40], [130, 30], [190, 24], [250, 24], [310, 30], [350, 48]]), 5],   // 屋顶
      C(350, 48, 350, 158, 5), C(12, 40, 12, 55, 5), C(12, 105, 12, 158, 5),   // 右墙、左墙（中间那段是门）
      C(12, 110, 140, 110, 5), C(176, 110, 262, 110, 5), C(298, 110, 350, 110, 5),   // 地板，两个检修口
      ['cap', 12 + OX, 158 + OY, 350 + OX, 158 + OY, 6],   // 底板
      ['ell', 218 + OX, 68 + OY, 30, 44]   // 塌下来的那一堆
    ],
    art: { out: 'kelp/station', cells: 2, broke: 'k_door', in: 'kelp/stationin' }
  };
  const CRACKS = [{ id: 'k_door', shape: C(12, 55, 12, 105, 5), sub: true, hit: 'doorHit', broke: 'doorBroke' }];   // 卡死的舱门（图是 station 的两格，不单独画）

  // ---------- 暗道 ----------
  const COVERS = [
    { id: 'k_echo1', r: [684, 690, 734, 778], echo: true }
  ];
  // ---------- 海带墙：密不透风，拿了海带刀割开（割开就记着） ----------
  const KWALLS = [
    { id: 'k_w1', x: 592, y: 628, w: 30, h: 42 },
    { id: 'k_w2', x: 1032, y: 595, w: 28, h: 40 },
    { id: 'k_w3', x: 1104, y: 416, w: 28, h: 38 }
  ];
  // ---------- 电鳗：沿着一条线来回游 ----------
  const EELS = [
    { path: [[1150, 872], [1220, 852], [1320, 868]], sp: 34, ph: 0 },
    { path: [[1150, 872], [1220, 852], [1320, 868]], sp: 34, ph: 0.55 },
    { path: [[880, 926], [1120, 926]], sp: 30, ph: 0.2 },
    { path: [[900, 966], [1110, 962]], sp: 26, ph: 0.7 },
    { path: [[1160, 1010], [1210, 1010]], sp: 22, ph: 0.4 }   // 急流口子上还守着一条
  ];
  // 往回冲的急流：冲一下冲不过去；有了甩尾连冲两下（冲的时候水流推不动）才过得去
  const CURRENTS = [{ x0: 1226, x1: 1292, y0: 993, y1: 1027, vx: -130, vy: 0, flick: true }];
  const DARK_Y = 900;
  const DEPTH = { y: 1e9, need: 'lamp', msg: 'tooDark' };   // 这边没有深度线（头盔前面就拿了）

  // ---------- 海带：一根根从海底长到水面（x，网页自己找海底）；front：画在海狗前面那层 ----------
  const KELP = [];
  { let x = 22, i = 0; while (x < 1060) { const inArena = x > 300 && x < 580, inShaft = x > 118 && x < 182; if (!inArena && !inShaft) KELP.push({ x, v: i % 2, front: i % 3 === 1 }); x += 38 + ((i * 37) % 17); i++; }
    KELP.push({ x: 294, v: 0, front: false }, { x: 586, v: 1, front: false }); }   // 打架那片空地两边各一根（触手从海带里伸出来）

  // ---------- 东西 ----------
  const THINGS = {
    k_knife: { at: [362, 696], k: 'gear' },     // 观察站隧道尽头
    k_o2a: { at: [82, 736], k: 'o2' },          // 观察站地板底下的检修通道
    k_suit: { at: [1164, 600], k: 'gear' },     // 海带墙 2 后面
    k_o2b: { at: [706, 758], k: 'o2' },         // 回声暗道
    k_flick: { at: [1414, 860], k: 'gear' },    // 电鳗守着的窄道尽头
    k_o2c: { at: [1432, 1120], k: 'o2' },       // 最深处
    k_bottle: { at: [820, 428], k: 'recipe', r: 'haidai' },   // 漂流瓶：海带鱼汤
    k_stash1: { at: [1178, 436], k: 'pearls', n: 5 },
    k_stash2: { at: [1360, 1150], k: 'pearls', n: 9 }
  };
  const VENTS = [[240, 444], [900, 700], [1040, 996], [1440, 1170]];
  const SHOP = { at: [790, 690], mk: 'seahorse', flag: 'k_seahorse' };   // 海马小铺（中间的洞）
  const TUNNELS = [
    { id: 'kt_reef', at: [14, 590], face: 1, to: 'reef' },   // 通珊瑚礁海沟底（作者 2A）：口子朝右
    { id: 'kt_deep', at: [1492, 1110], face: -1, to: null }               // 去深海沟（还没做）：口子朝左
  ];
  const TUNNEL = null;
  const CLAMS = [[860, 436], [744, 700], [960, 996]];
  const JUNK = [200, 760, 940], DRIFT = [640, 1040];
  const SAND = [[-40, 420], [260, 410], [290, 340], [580, 326], [610, 370], [650, 420], [1060, 370], [1110, 330], [1110, 480], [-40, 490]];
  const FIGHT = { x0: 320, x1: 560, y0: 140, y1: 320 };   // 跟大章鱼打架的空地
  const OCTO_ROCK = [440, 335];   // 空地中间那块大礁石（脚底），大章鱼缩在后面
  const HOLES = [[681, 600, 1], [956, 662, -1], [829, 930, 1]];   // 狼鳗躲的洞
  const HOLE_SP = 'wolfeel';

  const REGIONS = [
    { x0: 20, x1: 1060, y0: 112, y1: 420, n: 10, pick: [['sardine', 0.55], ['sheephead', 0.25], ['seadragon', 0.2]], big: 0.1 },
    { x0: 20, x1: 470, y0: 560, y1: 592, n: 2, pick: [['sardine', 1]], big: 0.1 },
    { x0: 690, x1: 950, y0: 570, y1: 690, n: 5, pick: [['sheephead', 0.6], ['seadragon', 0.4]], big: 0.25 },
    { x0: 850, x1: 1150, y0: 860, y1: 990, n: 4, pick: [['sheephead', 0.6], ['sardine', 0.4]], big: 0.4, king: 0.2 },
    { x0: 1300, x1: 1480, y0: 1060, y1: 1160, n: 3, pick: [['seadragon', 0.5], ['sheephead', 0.5]], big: 0.6, king: 0.3 }
  ];
  // decor.webp：0 海带根 1 紫海胆 2 蝙蝠海星 3 绿海葵 4 鲍鱼壳 5 黑贻贝 6 红海参 7 发光小水母
  const decorKinds = (x, y) => (y < 470 ? [0, 3, 2, 5, 0, 4] : y < DARK_Y - 40 ? [1, 3, 5, 6, 2] : [7, 6, 7, 1]);
  const DECOR_FOOT = [123, 111, 109, 120, 110, 107, 100, 95];
  const FRONT_FOOT = [388, 388, 340, 314, 377, 371];
  const LOOK = { light0: 330, far: [560, 900], zone: '海草林' };

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
  const CB = CARVE.map(bbox), RB = ROCK.map(bbox);
  // 大于 0 是墙；broken：撞开的、割开的、照出来的 id；noBoulder：不算海带墙（海带墙另外贴图）；noBoat：不算观察站的墙（画洞后墙那层用）
  function solid(x, y, broken, noBoulder, noBoat) {
    let w = 60;
    for (let i = 0; i < CARVE.length; i++) { if (boxD(x, y, CB[i]) > w + 12) continue; w = smin(w, sd(CARVE[i], x, y), 10); }
    let f = w;
    if (!inBox(x, y, BOAT.box, 6)) f += (vnoise(x, y, 46) * 0.7 + vnoise(x + 300, y, 17) * 0.3) * 3.2;
    let r = Infinity;
    for (let i = 0; i < ROCK.length; i++) if (boxD(x, y, RB[i]) < 60) r = Math.min(r, sd(ROCK[i], x, y));
    if (r < 60) f = Math.max(f, -r + vnoise(x, y + 500, 13) * 1.5 * clamp01(1 - r / 40));
    for (const c of CRACKS) if (!(broken && broken[c.id]) && !(noBoat && c.sub)) f = Math.max(f, -sd(c.shape, x, y));
    if (!noBoat && inBox(x, y, BOAT.box, 8)) for (const sh of BOAT.walls) f = Math.max(f, -sd(sh, x, y));
    for (const Q of COVERS) if (Q.echo && !(broken && broken[Q.id])) f = Math.max(f, -sd(['rect', Q.r[0], Q.r[1], Q.r[2], Q.r[3]], x, y));
    if (!noBoulder) for (const K of KWALLS) if (!(broken && broken[K.id])) f = Math.max(f, -sd(['rect', K.x - K.w / 2, K.y - K.h / 2, K.x + K.w / 2, K.y + K.h / 2], x, y));
    if (y > WH - 2) f = Math.max(f, 4);
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

  root.tankKelp = { id: 'kelp', WW, WH, GY, WY, CELL, CARVE, ROCK, BOAT, CRACKS, COVERS, KWALLS, EELS, KELP, CURRENTS, DARK_Y, DEPTH, THINGS, VENTS, SHOP, TUNNELS, TUNNEL, INLET: null,
    CLAMS, JUNK, DRIFT, SAND, FIGHT, OCTO_ROCK, HOLES, HOLE_SP, REGIONS, decorKinds, DECOR_FOOT, FRONT_FOOT, LOOK, solid, build, sd };
})(typeof OS !== 'undefined' ? OS : globalThis);
