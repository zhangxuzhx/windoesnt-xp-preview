/* 二维弹球（XP 三维弹球 → 二维弹球；开始 ▸ 所有程序 ▸ 游戏）——打砖块 + 弹球，质感照那个年代的电脑弹球
   - 窗口里整片黑底；左边台子（深藏青、裂纹、酒红外墙、镀铬栏杆、满台小灯），右边灰色金属框面板（标题 + 吉祥物、球、玩家、分数、信息、任务）
   - 台子上：顶上三盏翻灯 ／ 砖墙（九个军衔九关） ／ 左边紫色坡道 ＋ 旋转片 ／ 两个蘑菇弹框 ／ 正中任务圈 ＋ 超空间洞 ／ 右边三块落靶
            ／ 两块三角弹板 ／ 内外侧通道四盏翻灯 ／ 左外侧通道回球器 ／ 两个挡板 ／ 星芒（护底） ／ 充能灯条 ／ 两块铭牌
   - 任务一个接一个：碰弹框 ／ 上坡道 ／ 落靶 ／ 金砖 ／ 翻灯 ／ 连着碎砖；做完了任务圈中间开洞，球进洞拿大分、从顶上掉到砖墙背后
   - 操作：按住空格拉弹簧、松手发球；Z ／ / 打挡板（← → 也行）；X ／ 句号撞台子，撞多了 TILT；F2 新游戏，F3 暂停
     手机：按住左半边 ／ 右半边打挡板；球在弹簧上时按住就是拉弹簧；摇手机撞台子
   - 强化胶囊：武器（充能打弹药球）、火球、倍数、护底、全体火球、弹簧上膛；丢球全清零
   - 1 到 4 个玩家轮流；高分榜；原版作弊码 hidden test ／ 1max ／ rmax（用了不上榜）
   - 蓝屏：hidden test 拖着球往外使劲一甩 → BALL_OUT_OF_BOUNDS
   - Codex 的图（assets/pinball/）：台面底图、弹框、闪电贴片、挡板、吉祥物；哪张没加载出来就用代码画 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.pinball;

  /* ================= 文案 ================= */
  const NAME = '二维弹球';
  const L = {
    menus: ['游戏(G)', '选项(O)', '帮助(H)'],
    newGame: '新游戏　F2', pause: '暂停 ／ 继续　F3', high: '高分榜…', quit: '退出', players: '选择玩家数', sound: '声音',
    help: '目录', about: '关于二维弹球',
    helpText: '二维弹球\n\n按住空格拉弹簧，松手发球。\nZ 打左挡板，/ 打右挡板。X 撞台子，撞太多会 TILT。\n手机：按住左半边、右半边打挡板；球在发射道里，按住往下拉、松手发球。\n打碎一关的砖块就升一级军衔，一共九级。\n做完任务，正中的任务圈会开一个洞，把球打进去。',
    aboutText: '二维弹球\n版本 2003\n少了一维，多了一堵墙。\n(C) ' + OS.YEAR + ' 无聊科技',
    sub: '拆砖学员', big: '二维弹球', ballWord: '球',
    player: n => '玩家 ' + n, wait: '等待出击', rank: r => '军衔：' + r,
    ranks: ['学员', '少尉', '中尉', '上尉', '少校', '中校', '上校', '将军', '舰队司令'],
    up: r => '升级！' + r, top: '你已经是舰队司令了。',
    mission: {
      bumper: n => '任务：碰 ' + n + ' 下弹框', ramp: n => '任务：上 ' + n + ' 次坡道', targets: n => '任务：落靶全倒 ' + n + ' 回',
      gold: n => '任务：打碎 ' + n + ' 块金砖', lanes: () => '任务：顶上三盏灯凑满', combo: n => '任务：球不碰挡板，连着打碎 ' + n + ' 块'
    },
    done: { bumper: '任务完成！球保险', ramp: '任务完成！倍数加一级', targets: '任务完成！回球器点亮', gold: '任务完成！额外的球', lanes: '任务完成！拿 2000 分', combo: '任务完成！分数翻倍 15 秒' },
    holeOpen: '超空间洞开了！', hole: '进洞！', extra: '额外的球！', multi: '再来一个球！', saver: '球保险！', saved: '球保住了！',
    lanesFull: '翻灯凑满！倍数加一级', inlanes: '四盏翻灯全亮！球保险', rampShot: '坡道！', rampCombo: '坡道连击！', targetsDown: '落靶全倒！回球器点亮', kick: '回球器！',
    charge: '充能好了',
    got: (n, t) => '强化：' + n + (t ? ' ' + ['', '一阶', '二阶', '三阶', '四阶', '五阶'][t] : ''),
    capNames: { weapon: '武器', fire: '火球', mult: '倍数', guard: '护底', allfire: '全体火球', mag: '弹簧上膛' },
    weapon: '武器', fire: '火球', mult: '倍数',
    tilt: 'TILT', paused: '暂停', lost: '球没了', over: '游戏结束',
    highTitle: '高分榜', highText: list => list.length ? list.map((h, i) => (i + 1) + '. ' + h.name + '　' + h.score).join('\n') : '还没有人上榜。',
    newHigh: n => '恭喜，你上了高分榜！' + (n ? '（玩家 ' + n + '）' : '') + '\n请输入你的名字：',
    cheat: { hidden: '作弊：hidden test', one: '额外的球！', r: '军衔：舰队司令' },
    plates: ['无聊科技', "Windoesn't"],
    ok: '确定', clear: '清除'
  };
  const BSOD = { id: 'pinball', name: 'BALL_OUT_OF_BOUNDS', text: '球被你甩出了显示器。' };

  /* ================= 存档 ================= */
  const KEY = 'pinball';
  const S = Object.assign({ players: 1, sound: true, high: [] }, OS.save.get(KEY, {}));
  const persist = () => OS.save.set(KEY, S);
  const snd = n => { if (S.sound) OS.sound.play(n); };

  /* ================= 台子（坐标：290×258） ================= */
  const W = 290, H = 258, R = 4.5;
  const LANE_WALL = 265, LANE_X = 274.5, PLUNGE_Y = 243;
  const FL = { len: 46, rest: 0.52, up: -0.5 };
  const PIV = [{ x: 88, y: 226 }, { x: 202, y: 226 }];
  // 外侧通道口上面的斜挡板：顺着外墙掉下来的球拨回内侧（不然一半的球都从外侧通道漏掉）
  const ROOF = [[7, 150, 18, 162], [LANE_WALL, 150, 254, 162]];
  ROOF.forEach(r => { r.roof = true; });   // 只挡往下掉的：回球器往上踢的球能穿过去
  // 发射道口的单向门：发出去的球能出来，台子上的球进不去
  const GATE = [LANE_WALL, 9, LANE_WALL, 30];
  // 墙：外圈、发射道、坡道那条道的右栏杆、外侧通道隔板、内侧导板（尾巴搭在挡板根上）、外侧通道口的斜挡板
  const WALLS = [
    [7, 24, 7, 262], [283, 7, 283, 262], [24, 7, 262, 7], [7, 24, 24, 7], [262, 7, 283, 22],
    [LANE_WALL, 30, LANE_WALL, 262], [34, 30, 34, 116],
    [20, 176, 20, 212], [20, 212, 88, 222], [252, 176, 252, 212], [252, 212, 202, 222],
    ROOF[0], ROOF[1]
  ];
  const CHROME = WALLS.slice(3);   // 画成镀铬的（外墙在底图上）
  // 三角弹板：[顶, 底, 尖]；顶到尖那条斜边会把球弹开
  const SLINGS = [[[31, 176], [31, 196], [62, 204]], [[241, 176], [241, 196], [210, 204]]];
  const BUMPERS = [{ x: 92, y: 138, r: 9 }, { x: 198, y: 138, r: 9 }];
  const RING = { x: 145, y: 160, r: 15 };
  const TARGETS = [{ x: 238, y: 120 }, { x: 238, y: 135 }, { x: 238, y: 150 }];   // 5×11
  const TOP_LAMPS = [{ x: 115, y: 18 }, { x: 145, y: 18 }, { x: 175, y: 18 }];
  const LANE_LAMPS = [{ x: 13.5, y: 186 }, { x: 25.5, y: 186 }, { x: 246.5, y: 186 }, { x: 258.5, y: 186 }];
  const CHASE = Array.from({ length: 11 }, (_, i) => ({ x: 46 + i * 19, y: 111 }));
  const RAMP_LAMPS = [104, 88, 72, 56, 40].map(y => ({ x: 20.5, y }));
  const CHARGE_LAMPS = [32, 42, 52, 62, 72].map(x => ({ x, y: 231 }));
  const ARROWS = { ramp: { x: 44, y: 126, a: -2.4 }, targets: { x: 226, y: 141, a: 0 }, ring: { x: 145, y: 186, a: -Math.PI / 2 }, bumper: { x: 145, y: 126, a: -Math.PI / 2 } };
  const BW = 15, BH = 7, BGX = 1.5, BGY = 1.3, BX0 = 37, BY0 = 31;
  // 九关的砖：. 空；r o y l c b p w k 普通（颜色）；H N 硬；s 钢；g 金；E 额外的球；M 再来一个球；V 球保险
  const LEVELS = [
    ['rrrrrrrrrrrrr', 'ooooooooooooo', 'yyyygyEygyyyy', 'llllllgllllll', 'ccccccMcccccc'],
    ['....yyyyy....', '..yyyyyyyyy..', '.yykkyyykkyy.', '.yykkygykkyy.', '.yyyyyEyyyyy.', '.yykyyyyykyy.', '..yykkkkkyy..', '...yyyMyyy...', '....yyVyy....'],
    ['....yyyy.....', '...yyyyyy....', '...yykyyyoo..', '...yyyyyyooo.', '....yyyyy....', '.yyyygyyyyy..', 'yyyyyyEyyyyy.', '.yyyyyyyyyy..', '..oo..M.oo...'],
    ['...r.r.r.....', '...rrrrr.....', '..swwwwws....', '.swwkwwwws...', 'oowwgwwwwws..', '..swwgwwwwwss', '..swgwwEwwgs.', '...swwwMwws..', '....yy..yy...'],
    ['bbbbbbbbbbbbb', 'bNNcccbcccccb', 'bccNNcbcccNNb', 'bccccNNccNNcb', 'bbbbbbNNbbbbb', 'bcccNNbNNcccb', 'bcNNccbccNNcb', 'bNNcccgccccNN', 'bbbbbbEbbbbbb'],
    ['.lllllllllll.', '.l.........l.', '.l.lllllll.l.', '.l.l.....l.l.', '.l.l.lHl.l.l.', '.l.l.gEl.l.l.', '.l.l.lll.l.l.', '.l.l..M..l.l.', '.l.lllllll.l.'],
    ['....ooooo....', '..ooygyyyoo..', '.oyylyyyylyo.', '.oyyyyglyyyo.', 'oyylyyEyyylyo', '.oyygyyylyyo.', '.oylyyMyyyyo.', '..ooyyyylyo..', '....ooooo....'],
    ['...wwwwwww...', '.wwwwwwwwwww.', 'wwwwwwwwwwkkk', 'wwwwgwwwwkwkk', 'wwwwwwEwwkkkk', '.wwwwwwwwwkk.', '..wwwwMwwww..', '..k.k...k.k..', '..k.k...k.k..'],
    ['bbbbbbbbbbbbb', 'bwwwwbwwwwwwb', 'bbbbbbbbbbbbb', 'bwwwbwwwwbwwb', 'bwwwwwwbwwwwb', 'bbbbbbgbbbbbb', 'bwwbwwMwwwbwb', 'bbbbbbEbbbbbb', 'sssbbbbbbbsss']
  ];
  const COLOR = { r: '#ff4d4d', o: '#ff9a2e', y: '#ffd93b', l: '#59d96b', c: '#4fd6ff', b: '#3d6bff', p: '#c45cff', w: '#f2f2f2', k: '#8a90a0',
    H: '#c8b8a8', N: '#c0803a', s: '#b8c2cc', g: '#ffcf33', E: '#ff5fa2', M: '#7cf0ff', V: '#8cff8c' };
  const CAPS = { weapon: { c: '#ff4040', t: '弹', roam: 1, w: 25 }, fire: { c: '#ff9a2e', t: '火', roam: 1, w: 25 }, mult: { c: '#ffd700', t: '×', w: 20 },
    guard: { c: '#40a0ff', t: '护', w: 10 }, allfire: { c: '#b050ff', t: '焰', roam: 1, w: 10 }, mag: { c: '#40d060', t: '膛', w: 10 } };
  const MULT = [1, 2, 3, 5, 10];
  const MISSIONS = ['bumper', 'ramp', 'targets', 'gold', 'lanes', 'combo'];
  const NEED = { bumper: 10, ramp: 3, targets: 2, gold: 3, lanes: 1, combo: 8 };

  function buildBricks(level, loop) {
    const out = [];
    LEVELS[level].forEach((row, r) => row.split('').forEach((ch, c) => {
      if (ch === '.') return;
      let hp = 1, kind = 'n';
      if (ch === 'H' || ch === 'N') hp = 2;
      if (ch === 's') kind = 's';
      if (ch === 'g') kind = 'g';
      if (ch === 'E' || ch === 'M' || ch === 'V') kind = ch;
      if (kind === 'n' && hp === 1 && Math.random() < 0.03 * (level + loop * 3)) hp = 2;   // 越往后硬砖越多
      out.push({ x: BX0 + c * (BW + BGX), y: BY0 + r * (BH + BGY), c, r, ch, hp, max: hp, kind });
    }));
    return out;
  }

  /* ================= 图（Codex 画的；没有就代码画） ================= */
  const NEW_TABLE = true;   // Codex 重画的台面底图（2026-11-23 到了）
  const IMG_V = 2;          // 换了图就加一，玩过的人才会拿到新图
  const IMG = {};
  function loadImages() {
    ['bumper', 'bumper-lit', 'sling', 'sling-lit', 'flipper-l', 'flipper-r', 'mascot'].concat(NEW_TABLE ? ['table'] : []).forEach(n => {
      const i = new Image();
      i.onload = () => { IMG[n] = i; if (n === 'table') tableCache = null; if (n === 'mascot' && ui) paintMascot(); };
      i.src = 'assets/pinball/' + n + '.webp?v=' + IMG_V;
    });
  }
  // 代码画的台面：深藏青、裂纹、酒红外墙、任务圈和星芒的印花、两块空铭牌
  let tableCache = null;
  function tableArt(k) {
    if (tableCache && tableCache.k === k) return tableCache.c;
    const c = document.createElement('canvas');
    c.width = Math.round(W * k); c.height = Math.round(H * k);
    const x = c.getContext('2d');
    x.scale(k, k);
    if (IMG.table) x.drawImage(IMG.table, 0, 0, W, H);
    else {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0f1f5c'); g.addColorStop(1, '#070f33');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // 裂纹 ／ 闪电纹
      let s = 7;
      const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      for (let i = 0; i < 34; i++) {
        let px = rnd() * W, py = rnd() * H;
        x.strokeStyle = rnd() < 0.5 ? 'rgba(80,130,255,.22)' : 'rgba(10,20,60,.55)';
        x.lineWidth = 0.6 + rnd() * 0.8;
        x.beginPath(); x.moveTo(px, py);
        for (let j = 0; j < 5; j++) { px += (rnd() - 0.5) * 40; py += (rnd() - 0.5) * 40; x.lineTo(px, py); }
        x.stroke();
      }
      // 任务圈的印花
      [26, 22, 19].forEach((r, i) => { x.strokeStyle = ['rgba(120,160,255,.35)', 'rgba(180,200,255,.25)', 'rgba(90,120,220,.4)'][i]; x.lineWidth = 1.2; x.beginPath(); x.arc(RING.x, RING.y, r, 0, Math.PI * 2); x.stroke(); });
      x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.arc(RING.x, RING.y, 11, 0, Math.PI * 2); x.fill();
      // 星芒
      x.fillStyle = 'rgba(170,80,255,.55)'; x.beginPath();
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 6 : 17; x.lineTo(145 + Math.cos(a) * r, 240 + Math.sin(a) * r); }
      x.closePath(); x.fill();
      // 酒红外墙
      const wall = (x1, y1, w, h, dir) => { const gg = dir ? x.createLinearGradient(x1, 0, x1 + w, 0) : x.createLinearGradient(0, y1, 0, y1 + h); gg.addColorStop(0, '#3a0610'); gg.addColorStop(0.5, '#a0243a'); gg.addColorStop(1, '#4a0816'); x.fillStyle = gg; x.fillRect(x1, y1, w, h); };
      wall(0, 0, 7, H, 1); wall(283, 0, 7, H, 1); wall(0, 0, W, 7, 0);
      // 两块铭牌（空的，字另外写）
      [[27, 242], [203.5, 242]].forEach(([px, py]) => {
        const gg = x.createLinearGradient(0, py, 0, py + 10); gg.addColorStop(0, '#d8d8d8'); gg.addColorStop(1, '#8a8a8a');
        x.fillStyle = gg; x.fillRect(px, py, 45, 10); x.fillStyle = '#555';
        [[1.5, 1.5], [42, 1.5], [1.5, 7.5], [42, 7.5]].forEach(([a, b]) => { x.beginPath(); x.arc(px + a, py + b, 0.8, 0, Math.PI * 2); x.fill(); });
      });
    }
    // 左上、右上两个斜角也是墙（底图上是直角）
    const corner = pts => {
      const gg = x.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]);
      gg.addColorStop(0, '#4a0c1c'); gg.addColorStop(0.5, IMG.table ? '#7a2438' : '#a0243a'); gg.addColorStop(1, '#3a0a16');
      x.fillStyle = gg; x.beginPath(); pts.forEach(([a, b]) => x.lineTo(a, b)); x.closePath(); x.fill();
    };
    corner([[0, 0], [24, 0], [24, 7], [7, 24], [0, 24]]);
    corner([[262, 0], [290, 0], [290, 24], [283, 22], [262, 7]]);
    // 铭牌上的字
    x.font = 'bold 6px Tahoma, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const plate = (dx, dy, col) => { x.fillStyle = col; x.fillText(L.plates[0], 49.5 + dx, 247.3 + dy); x.fillText(L.plates[1], 226 + dx, 247.3 + dy); };
    if (IMG.table) { plate(0.4, 0.4, '#1e1a18'); plate(0, 0, '#ece4d4'); }   // 新底图的牌子是深灰的：浅色压字
    else plate(0, 0, '#5a1020');
    tableCache = { k, c };
    return c;
  }

  /* ================= 窗口 ================= */
  let win = null, ui = null, G = null;
  app.open = function () {
    if (win && !win.isClosed) { if (win.minimized) OS.wm.restore(win); OS.wm.focus(win); return win; }
    ui = {};
    ui.cv = el('canvas', { class: 'pb-cv' });
    ui.panel = el('div', { class: 'pb-panel' });
    ui.fit = el('div', { class: 'pb-fit' }, [ui.cv, ui.panel]);
    ui.body = el('div', { class: 'pb-body' }, [ui.fit]);
    ui.mbar = OS.ui.menuBar(L.menus, menuFor, 'pb-mbar');
    ui.box = el('div', { class: 'pb-win' }, [ui.mbar, ui.body]);
    win = OS.wm.open({ title: NAME, icon: 'pinball', width: 462, content: ui.box, appId: app.id, center: true,
      help: () => OS.ui.dialog({ title: L.help, icon: 'help', text: L.helpText }),   // 标题栏的 ？：跟 帮助 ▸ 目录 一样
      onClose: () => {
        cancelAnimationFrame(ui.raf);
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('keyup', onKeyUp, true);
        document.removeEventListener('pointermove', onMove, true);
        document.removeEventListener('pointerup', onUp, true);
        document.removeEventListener('pointercancel', onUp, true);
        window.removeEventListener('devicemotion', onShake);
        win = null; ui = null; G = null;
      } });
    buildPanel();
    loadImages();
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('pointercancel', onUp, true);
    window.addEventListener('devicemotion', onShake);
    ui.box.addEventListener('pointerdown', onDown);
    newGame();
    ui.fit.style.width = ui.fit.offsetWidth + 'px';   // 记下原来的大小，最大化时照这个比例放大
    if (OS.stage.touch) OS.wm.toggleMax(win);
    let last = performance.now(), acc = 0;
    const loop = now => {
      if (!ui) return;
      fit();
      acc = Math.min(acc + (now - last), 100);
      last = now;
      const run = G && !G.paused && OS.wm.active === win && !win.minimized && !G.dead;
      while (acc >= 1000 / 60) { if (run) step(); acc -= 1000 / 60; }
      draw();
      ui.raf = requestAnimationFrame(loop);
    };
    ui.raf = requestAnimationFrame(loop);
    return win;
  };

  /* ---------- 新游戏 ／ 玩家 ---------- */
  function newGame() {
    const n = S.players || 1;
    G = { players: [], cur: 0, balls: [], ammo: [], caps: [], fx: [], keys: { l: 0, r: 0 }, pull: 0, pulling: false, tilt: 0, tilted: false,
      paused: false, info: L.player(1), cheat: '', cheated: false, hidden: false, mag: [], magT: 0, frame: 0, dead: false, fl: [mkFl(0), mkFl(1)],
      spin: 0, spinA: 0, spinT: 0, flash: {} };
    for (let i = 0; i < n; i++) G.players.push(newPlayer());
    resetPower();
    serveBall(true);
    G.started = false;
    paintPanel();
  }
  function newPlayer() {
    return { score: 0, balls: 3, total: 3, level: 0, loop: 0, bricks: buildBricks(0, 0), mi: 0, m: null, hole: false,
      top: [0, 0, 0], lanes: [0, 0, 0, 0], targets: [1, 1, 1], targetsUp: 0, kick: false, ramps: 0, lastRamp: -999 };
  }
  const P = () => G.players[G.cur];
  function mkFl(side) { return { side, ang: side ? Math.PI - FL.rest : FL.rest, omega: 0 }; }
  // 当前任务（没有金砖可打就跳过金砖任务）
  function mission() {
    const p = P();
    if (p.m) return p.m;
    for (let k = 0; k < MISSIONS.length; k++) {
      const type = MISSIONS[(p.mi + k) % MISSIONS.length];
      let need = NEED[type];
      if (type === 'gold') { const g = p.bricks.filter(b => b.kind === 'g').length; if (!g) continue; need = Math.min(need, g); }
      p.mi = (p.mi + k) % MISSIONS.length;
      p.m = { type, need, n: 0, done: false };
      return p.m;
    }
    p.m = { type: 'bumper', need: NEED.bumper, n: 0, done: false };
    return p.m;
  }
  const missionText = () => { const m = mission(); return L.mission[m.type](m.need); };
  function resetPower() {
    Object.assign(G, { weapon: 0, fire: 0, mult: 0, charge: 0, guard: 0, allfire: 0, saver: 0, double: 0, combo: 0 });
    G.ammo = []; G.mag = [];
  }
  function serveBall(withSaver) {
    G.balls = [{ x: LANE_X, y: PLUNGE_Y, vx: 0, vy: 0, held: true, r: R }];
    G.pull = 0; G.pulling = false; G.tilted = false; G.tilt = 0;
    G.serveSaver = withSaver;
  }
  function say(t) { if (!G) return; G.info = t; paintPanel(); }

  /* ---------- 最大化：台子和面板一起按比例放大，居中，四周黑边 ---------- */
  function fit() {
    const key = win.maximized ? win.el.clientWidth + 'x' + win.el.clientHeight : 'n';
    if (ui.fitKey === key) return;
    ui.fitKey = key;
    if (!win.maximized) { ui.body.style.height = ''; ui.fit.style.transform = ''; ui.fitScale = 1; return; }
    const nw = ui.fit.offsetWidth, nh = ui.fit.offsetHeight;
    const w = ui.body.clientWidth, h = Math.max(60, win.el.clientHeight - win.titleEl.offsetHeight - ui.mbar.offsetHeight);
    const s = Math.min(w / nw, h / nh);
    ui.body.style.height = h + 'px';
    ui.fit.style.transform = 'translate(' + ((w - nw * s) / 2) + 'px,' + ((h - nh * s) / 2) + 'px) scale(' + s + ')';
    ui.fitScale = s;
  }

  /* ---------- 物理 ---------- */
  const SUB = 4;
  function step() {
    G.frame++;
    const sec = 1 / 60, p = P();
    ['guard', 'allfire', 'saver', 'double'].forEach(k => { if (G[k] > 0) G[k] = Math.max(0, G[k] - sec); });
    Object.keys(G.flash).forEach(k => { if ((G.flash[k] -= sec) <= 0) delete G.flash[k]; });
    if (G.tilt > 0) G.tilt = Math.max(0, G.tilt - sec * 0.5);
    if (G.weapon > 0 && G.charge < 1) { G.charge = Math.min(1, G.charge + sec / 6); if (G.charge >= 1) say(L.charge); }
    if (G.mag.length) { G.magT -= sec; if (G.magT <= 0) { G.mag.shift(); G.magT = 0.35; G.ammo.push(mkAmmo(LANE_X, PLUNGE_Y, 0, -11.5, false)); snd('pbLaunch'); } }
    if (G.pulling) G.pull = Math.min(1, G.pull + sec / 1.2);
    // 旋转片：转着给分
    if (G.spin > 0) { G.spinA += G.spin * 0.25; G.spinT -= sec; if (G.spinT <= 0) { G.spinT = 0.06; G.spin = Math.max(0, G.spin - 1); addScore(25); snd('pbSpin'); } }
    // 落靶全倒以后过一会儿重新立起来
    if (p.targetsUp > 0 && (p.targetsUp -= sec) <= 0) p.targets = [1, 1, 1];
    // 进洞的球：过一会儿从顶上掉下来
    G.balls.forEach(b => { if (b.inHole > 0 && (b.inHole -= sec) <= 0) { b.inHole = 0; b.x = 145; b.y = 22; b.vx = (Math.random() - 0.5) * 2; b.vy = 1; } });
    G.fl.forEach(f => {
      const on = (f.side ? G.keys.r : G.keys.l) && !G.tilted;
      const target = f.side ? (on ? Math.PI - FL.up : Math.PI - FL.rest) : (on ? FL.up : FL.rest);
      const speed = on ? 0.32 : 0.16, d = target - f.ang;
      f.omega = Math.abs(d) < speed ? d : Math.sign(d) * speed;
    });
    const speedCap = 8.5 * (G.fire >= 3 ? 1.15 : 1) * (1 + 0.03 * (p.level + p.loop * 2));
    const grav = 0.12 * (1 + 0.03 * (p.level + p.loop * 2));
    for (let s = 0; s < SUB; s++) {
      G.fl.forEach(f => { f.ang += f.omega / SUB; });
      G.balls.forEach(b => moveBall(b, grav, speedCap, false));
      G.ammo.forEach(b => moveBall(b, grav * 0.6, 9, true));
    }
    // 停着不动 3 秒：轻轻推一下
    G.balls.forEach(b => {
      if (b.held || b.drag || b.fling || b.inHole) { b.still = 0; return; }
      b.still = Math.hypot(b.vx, b.vy) < 0.08 ? (b.still || 0) + 1 : 0;
      if (b.still > 180) { b.still = 0; b.vy -= 2.2; b.vx += (Math.random() - 0.5) * 2; }
    });
    // 胶囊
    G.caps.forEach(c => {
      c.t -= sec;
      if (c.roam) {
        c.x += c.vx; c.y += c.vy;
        if (c.x < 44 || c.x > 230) c.vx = -c.vx;
        if (c.y < 116 || c.y > 175) c.vy = -c.vy;
      } else c.bob = Math.sin(G.frame / 12) * 1.5;
      [...G.balls, ...G.ammo].forEach(b => { if (!c.gone && !b.inHole && Math.hypot(b.x - c.x, b.y - c.y) < b.r + 7) { c.gone = true; grab(c.type); } });
    });
    G.caps = G.caps.filter(c => !c.gone && c.t > 0);
    G.ammo = G.ammo.filter(a => !a.gone && a.y < H + 10 && a.life > 0);
    G.ammo.forEach(a => { a.life -= sec; });
    G.fx = G.fx.filter(f => (f.t -= sec) > 0);
    const before = G.balls.length;
    let saved = 0;
    G.balls = G.balls.filter(b => {
      if (b.fling || b.inHole || b.y < H + 10) return true;
      if (G.saver > 0 || G.serveSaverUntil > G.frame) saved++;
      return false;
    });
    for (let i = 0; i < saved; i++) addBall();
    if (saved) say(L.saved);
    if (before && !G.balls.length && !G.dead) ballLost();
    if (!P().bricks.some(b => b.kind !== 's') && !G.dead) levelUp();
    if (G.frame % 10 === 0) paintPanel();
  }
  function moveBall(b, grav, cap, ammo) {
    if (b.held) { b.x = LANE_X; b.y = PLUNGE_Y + G.pull * 8; return; }
    if (b.drag || b.inHole) return;
    if (b.fling) {
      b.x += b.vx / SUB; b.y += b.vy / SUB;
      if ((b.x < -12 || b.x > W + 12 || b.y < -12 || b.y > H + 12) && !b.out) { b.out = true; G.dead = true; setTimeout(() => { if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD); }, 300); }
      return;
    }
    b.vy += grav / SUB;
    const inLane = b.x > LANE_WALL && b.y > 30;
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > cap && !inLane) { b.vx *= cap / sp; b.vy *= cap / sp; }   // 发射道里不限速：弹簧拉得越满越猛
    if (!ammo && inLane && b.y >= PLUNGE_Y && b.vy > 0) { b.held = true; b.vx = 0; b.vy = 0; b.y = PLUNGE_Y; return; }   // 劲不够没出去：落回弹簧上
    const py = b.y;
    b.x += b.vx / SUB; b.y += b.vy / SUB;
    WALLS.forEach(w => { if (!w.roof || b.vy > 0) segHit(b, w[0], w[1], w[2], w[3], b.r, 0.55, ammo); });
    if (b.vx > 0 && b.x < LANE_WALL) segHit(b, GATE[0], GATE[1], GATE[2], GATE[3], b.r, 0.55, ammo);   // 单向门：只挡往右进发射道的
    // 三角弹板：斜边把球弹开
    SLINGS.forEach((t, i) => {
      if (segHit(b, t[0][0], t[0][1], t[2][0], t[2][1], b.r, 0.5, ammo, 3.6)) { G.flash['sling' + i] = 0.12; addScore(10); snd('pbKick'); }
      segHit(b, t[0][0], t[0][1], t[1][0], t[1][1], b.r, 0.5, ammo);
      segHit(b, t[1][0], t[1][1], t[2][0], t[2][1], b.r, 0.5, ammo);
    });
    if (G.guard > 0) circleHit(b, 145, 250, 8, 0.7, 0);
    BUMPERS.forEach((bp, i) => { if (circleHit(b, bp.x, bp.y, bp.r, 1, 4.6)) { bumped(i); if (ammo) bounce(b); } });
    targetsHit(b, ammo);
    G.fl.forEach(f => flipHit(b, f, ammo));
    bricksHit(b, ammo);
    if (!ammo) sensors(b, py);
  }
  // 翻灯、旋转片、坡道、超空间洞、回球器
  // 翻灯只在球滚上去的那一下算（球停在灯上不会一直点）
  function rollover(b, id, l) {
    const inside = Math.hypot(b.x - l.x, b.y - l.y) < 6, was = b.ro === id;
    if (inside) b.ro = id; else if (was) b.ro = null;
    return inside && !was;
  }
  function sensors(b, py) {
    const p = P();
    TOP_LAMPS.forEach((l, i) => {
      if (!rollover(b, 't' + i, l) || p.top[i]) return;
      p.top[i] = 1; addScore(100); snd('pbRoll');
      if (p.top.every(Boolean)) { p.top = [0, 0, 0]; G.mult = Math.min(4, G.mult + 1); say(L.lanesFull); chase(); progress('lanes', 1); }
    });
    LANE_LAMPS.forEach((l, i) => {
      if (!rollover(b, 'l' + i, l) || p.lanes[i]) return;
      p.lanes[i] = 1; addScore(100); snd('pbRoll');
      if (p.lanes.every(Boolean)) { p.lanes = [0, 0, 0, 0]; G.saver = 15; say(L.inlanes); }
    });
    // 旋转片：球往上冲过坡道口那一条线
    if (b.x < 34 && py > 116 && b.y <= 116 && b.vy < 0) { G.spin = Math.min(14, G.spin + Math.abs(b.vy) * 1.6); b.rampArmed = true; }
    if (b.y > 118) b.rampArmed = false;
    // 坡道：冲到顶
    if (b.rampArmed && b.x < 34 && b.y < 30) {
      b.rampArmed = false;
      const combo = G.frame - p.lastRamp < 600;
      p.lastRamp = G.frame;
      p.ramps = combo ? p.ramps + 1 : 1;
      addScore(500 * (combo ? Math.pow(2, Math.min(4, p.ramps - 1)) : 1));
      say(combo ? L.rampCombo : L.rampShot);
      snd('pbRamp');
      G.flash.ramp = 0.8;
      progress('ramp', 1);
    }
    // 超空间洞
    if (p.hole && Math.hypot(b.x - RING.x, b.y - RING.y) < 7) {
      p.hole = false;
      b.inHole = 1.3; b.vx = 0; b.vy = 0;
      addScore(5000);
      say(L.hole);
      snd('pbHole');
      G.flash.ring = 1.3;
      p.m = null; p.mi = (p.mi + 1) % MISSIONS.length;
      setTimeout(() => { if (G) say(missionText()); }, 1400);
    }
    // 回球器：左外侧通道底下
    if (p.kick && b.x < 20 && b.y > 228 && b.vy > 0) { p.kick = false; b.vy = -10.5; b.vx = 0.4; say(L.kick); snd('pbKick'); G.flash.kick = 0.4; }
  }
  function bounce(a) { a.hits = (a.hits || 0) + 1; if (a.hits >= 7) a.gone = true; if (a.split) splitAmmo(a); }
  // 线段墙；kick：碰到时再往外推一把（三角弹板），推了才返回 true
  function segHit(b, x1, y1, x2, y2, r, e, ammo, kick) {
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((b.x - x1) * dx + (b.y - y1) * dy) / l2));
    const cx = x1 + dx * t, cy = y1 + dy * t;
    let nx = b.x - cx, ny = b.y - cy;
    const d = Math.hypot(nx, ny);
    if (d >= r || d === 0) return false;
    nx /= d; ny /= d;
    b.x = cx + nx * r; b.y = cy + ny * r;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; b.vx *= 0.99; b.vy *= 0.99; if (ammo) bounce(b); }
    if (kick && vn < -0.3) { b.vx += kick * nx; b.vy += kick * ny; return true; }
    return !kick;
  }
  function circleHit(b, x, y, rr, e, kick) {
    let nx = b.x - x, ny = b.y - y;
    const d = Math.hypot(nx, ny), min = rr + b.r;
    if (d >= min || d === 0) return false;
    nx /= d; ny /= d;
    b.x = x + nx * min; b.y = y + ny * min;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; }
    if (kick) { const v2 = b.vx * nx + b.vy * ny; if (v2 < kick) { b.vx += (kick - v2) * nx; b.vy += (kick - v2) * ny; } }
    return true;
  }
  function flipHit(b, f, ammo) {
    const p = PIV[f.side], ex = p.x + Math.cos(f.ang) * FL.len, ey = p.y + Math.sin(f.ang) * FL.len;
    const dx = ex - p.x, dy = ey - p.y, l2 = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((b.x - p.x) * dx + (b.y - p.y) * dy) / l2));
    const cx = p.x + dx * t, cy = p.y + dy * t, thick = 4 - 1.6 * t;
    let nx = b.x - cx, ny = b.y - cy;
    const d = Math.hypot(nx, ny);
    if (d >= b.r + thick || d === 0) return;
    nx /= d; ny /= d;
    b.x = cx + nx * (b.r + thick); b.y = cy + ny * (b.r + thick);
    const rx = cx - p.x, ry = cy - p.y, sx = -f.omega * ry, sy = f.omega * rx;
    const rvx = b.vx - sx, rvy = b.vy - sy, vn = rvx * nx + rvy * ny;
    if (vn < 0) { b.vx -= 1.4 * vn * nx; b.vy -= 1.4 * vn * ny; }
    if (!ammo) G.combo = 0;
  }
  // 落靶：立着的时候是一块挡板，打中就倒
  function targetsHit(b, ammo) {
    const p = P();
    TARGETS.forEach((t, i) => {
      if (!p.targets[i]) return;
      const cx = Math.max(t.x, Math.min(b.x, t.x + 5)), cy = Math.max(t.y, Math.min(b.y, t.y + 11));
      let nx = b.x - cx, ny = b.y - cy;
      const d = Math.hypot(nx, ny);
      if (d >= b.r) return;
      if (d === 0) { nx = -1; ny = 0; } else { nx /= d; ny /= d; }
      b.x = cx + nx * b.r; b.y = cy + ny * b.r;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) { b.vx -= 1.6 * vn * nx; b.vy -= 1.6 * vn * ny; }
      if (ammo) bounce(b);
      p.targets[i] = 0;
      addScore(250);
      snd('pbTarget');
      if (!p.targets.some(Boolean)) { p.kick = true; p.targetsUp = 1.5; addScore(1000); say(L.targetsDown); chase(); progress('targets', 1); }
    });
  }
  function bricksHit(b, ammo) {
    const bricks = P().bricks;
    for (const br of bricks) {
      if (br.dead) continue;
      const cx = Math.max(br.x, Math.min(b.x, br.x + BW)), cy = Math.max(br.y, Math.min(b.y, br.y + BH));
      let nx = b.x - cx, ny = b.y - cy;
      const d = Math.hypot(nx, ny);
      if (d >= b.r) continue;
      if (!ammo && G.allfire > 0) { breakBrick(br, 99, b); continue; }   // 全体火球：撞碎路过的一切，不反弹
      if (d === 0) { nx = 0; ny = b.vy > 0 ? -1 : 1; } else { nx /= d; ny /= d; }
      b.x = cx + nx * b.r; b.y = cy + ny * b.r;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) { b.vx -= 1.9 * vn * nx; b.vy -= 1.9 * vn * ny; }
      if (ammo) { breakBrick(br, b.dmg, b); bounce(b); }
      else {
        const broke = breakBrick(br, [1, 2, 3, 3, 3, 3][G.fire], b);
        if (broke && G.fire >= 3) { const behind = neighbor(br, b); if (behind) breakBrick(behind, 1, b); }
        if (G.fire >= 5) { G.fx.push({ k: 'ring', x: b.x, y: b.y, t: 0.35 }); bricks.forEach(o => { if (!o.dead && o !== br && Math.hypot(o.x + BW / 2 - b.x, o.y + BH / 2 - b.y) < 24) breakBrick(o, 1, b); }); }
      }
      break;
    }
    P().bricks = bricks.filter(x => !x.dead);
  }
  function neighbor(br, b) {
    const dc = Math.abs(b.vx) > Math.abs(b.vy) ? -Math.sign(b.vx) : 0, dr = dc ? 0 : -Math.sign(b.vy);
    return P().bricks.find(o => !o.dead && o.c === br.c + dc && o.r === br.r + dr);
  }
  function breakBrick(br, dmg, b) {
    if (br.dead) return false;
    if (br.kind === 's' && dmg < 99) { snd('pbBrick'); return false; }
    br.hp -= dmg;
    br.flash = 0.15;
    if (br.hp > 0) { snd('pbBrick'); return false; }
    br.dead = true;
    snd('pbBrick');
    const p = P();
    addScore(br.kind === 'g' ? 500 : br.max > 1 ? 250 : 100);
    G.fx.push({ k: 'bits', x: br.x + BW / 2, y: br.y + BH / 2, c: COLOR[br.ch] || '#fff', t: 0.4 });
    G.flash.chase = Math.max(G.flash.chase || 0, 0.25);
    if (b && !b.dmg) { G.combo++; if (mission().type === 'combo') progress('combo', G.combo, true); }
    if (br.kind === 'g') progress('gold', 1);
    if (br.kind === 'E') { p.balls++; p.total++; say(L.extra); snd('chime'); }
    if (br.kind === 'M') { addBall(); say(L.multi); }
    if (br.kind === 'V') { G.saver = 15; say(L.saver); }
    if (br.kind === 'n' && Math.random() < 0.13 && G.caps.length < 2) dropCap(br.x + BW / 2, Math.max(br.y + BH / 2 + 10, 118));
    return true;
  }
  function addScore(pts) { if (!G) return; P().score += pts * MULT[G.mult] * (G.double > 0 ? 2 : 1); }
  function bumped(i) {
    addScore(50);
    snd('pbPop');
    G.flash['bump' + i] = 0.15;
    progress('bumper', 1);
  }
  // 任务进度：set = true 时是"到了几"，否则是"加几"
  function progress(type, n, set) {
    const p = P(), m = mission();
    if (m.type !== type || m.done) return;
    m.n = set ? Math.max(m.n, n) : m.n + n;
    if (m.n < m.need) return;
    m.done = true;
    p.hole = true;
    say(L.done[type]);
    snd('chime');
    if (type === 'gold') { p.balls++; p.total++; }
    if (type === 'combo') G.double = 15;
    if (type === 'bumper') G.saver = 15;
    if (type === 'ramp') G.mult = Math.min(4, G.mult + 1);
    if (type === 'targets') { p.kick = true; addScore(2000); }
    if (type === 'lanes') addScore(2000);
    setTimeout(() => { if (G) say(L.holeOpen); }, 1500);
  }
  function chase() { G.flash.chase = 0.9; snd('pbChase'); }
  function addBall() {
    if (!G) return;
    G.balls.push({ x: LANE_X, y: PLUNGE_Y, vx: 0, vy: -10.5 - Math.random(), r: ballR() });
  }
  const ballR = () => (G.fire >= 4 ? 6 : R);
  function mkAmmo(x, y, vx, vy, small) { return { x, y, vx, vy, r: small ? 2.2 : 3, dmg: G.weapon >= 3 ? 2 : 1, split: G.weapon >= 5 && !small, life: 8, hits: 0 }; }
  function splitAmmo(a) {
    a.gone = true;
    [-0.45, 0.45].forEach(t => { const c = Math.cos(t), s = Math.sin(t); G.ammo.push(mkAmmo(a.x, a.y, a.vx * c - a.vy * s, a.vx * s + a.vy * c, true)); });
  }
  function dropCap(x, y) {
    const list = Object.keys(CAPS), total = list.reduce((s, k) => s + CAPS[k].w, 0);
    let r = Math.random() * total, type = list[0];
    for (const k of list) { r -= CAPS[k].w; if (r <= 0) { type = k; break; } }
    const a = Math.random() * Math.PI * 2;
    G.caps.push({ type, x: Math.max(48, Math.min(226, x)), y, roam: !!CAPS[type].roam, vx: Math.cos(a) * 0.5, vy: Math.sin(a) * 0.5, t: 10, bob: 0 });
  }
  function grab(type) {
    snd('chime');
    if (type === 'weapon') { G.weapon = Math.min(5, G.weapon + 1); say(L.got(L.capNames.weapon, G.weapon)); }
    if (type === 'fire') { G.fire = Math.min(5, G.fire + 1); G.balls.forEach(b => { b.r = ballR(); }); say(L.got(L.capNames.fire, G.fire)); }
    if (type === 'mult') { G.mult = Math.min(4, G.mult + 1); say(L.got(L.capNames.mult + ' ×' + MULT[G.mult])); }
    if (type === 'guard') { G.guard = 60; say(L.got(L.capNames.guard)); }
    if (type === 'allfire') { G.allfire = 10; say(L.got(L.capNames.allfire)); }
    if (type === 'mag') { G.mag = [1, 2, 3, 4, 5]; G.magT = 0.2; say(L.got(L.capNames.mag)); }
  }
  // 打挡板：武器充满了打弹药球；顶上亮着的翻灯往旁边挪一格（原版的老玩法）
  function flip(side, on) {
    const k = side ? 'r' : 'l';
    if (on && !G.keys[k] && !G.tilted) {
      snd('pbFlip');
      const p = P();
      p.top = side ? [p.top[2], p.top[0], p.top[1]] : [p.top[1], p.top[2], p.top[0]];
      if (G.weapon > 0 && G.charge >= 1) {
        G.charge = 0;
        const n = [0, 1, 2, 2, 3, 3][G.weapon], f = G.fl[side], pv = PIV[side];
        const tx = pv.x + Math.cos(f.ang) * FL.len, ty = pv.y + Math.sin(f.ang) * FL.len;
        for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.22 + (side ? -0.15 : 0.15); G.ammo.push(mkAmmo(tx, ty - 6, Math.cos(a) * 7, Math.sin(a) * 7, false)); }
      }
    }
    G.keys[k] = on ? 1 : 0;
  }
  function launch() {
    const b = G.balls.find(x => x.held);
    if (!b) return;
    b.held = false;
    b.r = ballR();
    b.vy = -(4.5 + 7 * G.pull);
    b.vx = 0;
    G.pull = 0; G.pulling = false;
    if (G.serveSaver) { G.serveSaverUntil = G.frame + 5 * 60; G.serveSaver = false; }
    if (!G.started) { G.started = true; say(missionText()); }
    snd('pbLaunch');
  }
  function nudge() {
    if (!G || G.tilted || G.dead) return;
    G.tilt += 1;
    G.balls.forEach(b => { if (!b.held && !b.inHole) { b.vx += (Math.random() - 0.5) * 1.6; b.vy -= 0.8; } });
    G.shake = 6;
    if (G.tilt > 3.2) { G.tilted = true; say(L.tilt); snd('error'); }
  }
  function ballLost() {
    snd('pbDrain');
    const p = P();
    p.balls--;
    resetPower();
    G.caps = [];
    if (G.players.every(x => x.balls <= 0)) { gameOver(); return; }
    let k = G.cur;
    for (let i = 0; i < G.players.length; i++) { k = (k + 1) % G.players.length; if (G.players[k].balls > 0) break; }
    G.cur = k;
    serveBall(true);
    say(G.players.length > 1 ? L.player(k + 1) : L.lost);
  }
  function levelUp() {
    const p = P();
    snd('pbLevel');
    if (p.level >= 8) { p.loop++; p.level = 0; say(L.top); }
    else { p.level++; say(L.up(L.ranks[p.level])); }
    p.bricks = buildBricks(p.level, p.loop);
    if (p.m && p.m.type === 'gold' && !p.m.done) p.m = null;
    G.caps = []; G.ammo = [];
    chase();
    serveBall(false);
  }
  function gameOver() {
    G.dead = true;
    say(L.over);
    const list = G.players.map((p, i) => ({ i, score: p.score })).sort((a, b) => b.score - a.score);
    const ask = k => {
      if (k >= list.length || G.cheated) return;
      const e = list[k], hi = S.high || [];
      if (hi.length >= 5 && e.score <= hi[hi.length - 1].score) { ask(k + 1); return; }
      OS.explorer.askText(L.highTitle, L.newHigh(G.players.length > 1 ? e.i + 1 : 0), '', v => {
        hi.push({ name: (v || '').trim() || '匿名', score: e.score });
        hi.sort((a, b) => b.score - a.score);
        S.high = hi.slice(0, 5); persist();
        ask(k + 1);
      });
    };
    setTimeout(() => ask(0), 900);
  }

  /* ---------- 画 ---------- */
  function draw() {
    if (!ui || !G) return;
    const cv = ui.cv, k = Math.min(4, (window.devicePixelRatio || 1) * (OS.stage.scale || 1) * (ui.fitScale || 1));
    if (cv.width !== Math.round(W * k)) { cv.width = Math.round(W * k); cv.height = Math.round(H * k); }
    const c = cv.getContext('2d'), p = P(), f = G.frame;
    c.setTransform(k, 0, 0, k, 0, 0);
    let sx = 0;
    if (G.shake > 0) { sx = (Math.random() - 0.5) * G.shake; G.shake -= 0.5; }
    c.save();
    c.translate(sx, 0);
    c.drawImage(tableArt(k), 0, 0, W, H);
    drawRamp(c);
    // 镀铬栏杆
    c.lineCap = 'round';
    CHROME.forEach(w => {
      c.strokeStyle = '#5c6470'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(w[0], w[1]); c.lineTo(w[2], w[3]); c.stroke();
      c.strokeStyle = '#eef3f8'; c.lineWidth = 1; c.beginPath(); c.moveTo(w[0] - 0.4, w[1] - 0.4); c.lineTo(w[2] - 0.4, w[3] - 0.4); c.stroke();
    });
    c.strokeStyle = 'rgba(200,210,225,.5)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(34, 28); c.lineTo(252, 28); c.stroke();
    // 单向门：一片薄薄的小铁片
    c.strokeStyle = 'rgba(230,236,245,.75)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(GATE[0], GATE[1] + 2); c.lineTo(GATE[2] - 1.5, GATE[3]); c.stroke();
    c.fillStyle = '#8a929c'; c.beginPath(); c.arc(GATE[0], GATE[1] + 2, 1.3, 0, Math.PI * 2); c.fill();
    // 灯
    TOP_LAMPS.forEach((l, i) => lamp(c, l.x, l.y, 3, '#ffe14d', p.top[i] || (G.flash.chase > 0 && f % 8 < 4)));
    LANE_LAMPS.forEach((l, i) => lamp(c, l.x, l.y, 2.6, '#ffffff', p.lanes[i]));
    CHASE.forEach((l, i) => lamp(c, l.x, l.y, 2.2, ['#ff4040', '#ffe14d', '#40a0ff'][i % 3], G.flash.chase > 0 && (Math.floor(f / 3) + i) % 3 === 0));
    RAMP_LAMPS.forEach((l, i) => lamp(c, l.x, l.y, 2.4, '#7fd4ff', G.flash.ramp > 0 && Math.floor((0.8 - G.flash.ramp) * 10) % 5 === i));
    CHARGE_LAMPS.forEach((l, i) => lamp(c, l.x, l.y, 2.2, '#ff4040', G.weapon > 0 && G.charge * 5 > i + 0.01));
    lamp(c, 13.5, 222, 2.6, '#ff4040', p.kick && (G.flash.kick > 0 || f % 30 < 20));
    // 任务圈：10 盏灯 ＝ 进度；做完了中间开洞
    const m = mission(), lit = Math.floor(10 * Math.min(m.n, m.need) / m.need);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 - Math.PI / 2;
      lamp(c, RING.x + Math.cos(a) * RING.r, RING.y + Math.sin(a) * RING.r, 2.3, '#7fd4ff', G.flash.ring > 0 ? (Math.floor(f / 3) % 10 === i) : (i < lit || (p.hole && f % 20 < 12)));
    }
    if (p.hole) { const g = c.createRadialGradient(RING.x, RING.y, 1, RING.x, RING.y, 7); g.addColorStop(0, '#000'); g.addColorStop(0.7, '#050510'); g.addColorStop(1, f % 20 < 10 ? '#ff60ff' : '#7fd4ff'); c.fillStyle = g; c.beginPath(); c.arc(RING.x, RING.y, 7, 0, Math.PI * 2); c.fill(); }
    else lamp(c, RING.x, RING.y, 5, '#ffe14d', m.done);
    // 指着当前任务的黄色小三角
    const point = p.hole ? 'ring' : ({ bumper: 'bumper', ramp: 'ramp', targets: 'targets' }[m.type] || '');
    Object.keys(ARROWS).forEach(k2 => { const a = ARROWS[k2]; arrow(c, a.x, a.y, a.a, k2 === point && f % 24 < 14); });
    // 砖
    p.bricks.forEach(b => drawBrick(c, b));
    // 落靶
    TARGETS.forEach((t, i) => {
      if (p.targets[i]) { const g = c.createLinearGradient(t.x, 0, t.x + 5, 0); g.addColorStop(0, '#fff6a0'); g.addColorStop(1, '#d89a00'); c.fillStyle = g; c.fillRect(t.x, t.y, 5, 11); c.strokeStyle = '#6a4a00'; c.lineWidth = 0.6; c.strokeRect(t.x, t.y, 5, 11); }
      else { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(t.x + 1, t.y + 4, 3, 3); }
    });
    // 旋转片
    c.save(); c.translate(20.5, 116); c.scale(Math.cos(G.spinA), 1); c.fillStyle = '#d8dde6'; c.fillRect(-12, -1.2, 24, 2.4); c.restore();
    BUMPERS.forEach((bp, i) => drawBumper(c, bp, G.flash['bump' + i] > 0));
    SLINGS.forEach((t, i) => drawSling(c, t, G.flash['sling' + i] > 0));
    // 护底：星芒亮起来变成挡球
    if (G.guard > 0 && (G.guard > 5 || f % 20 < 12)) { c.fillStyle = '#c070ff'; c.shadowColor = '#c070ff'; c.shadowBlur = 10; c.beginPath(); c.arc(145, 250, 8, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0; }
    G.fl.forEach(fl => drawFlipper(c, fl));
    // 弹簧
    const py = PLUNGE_Y + R + 2 + G.pull * 8;
    c.fillStyle = '#c0c8d0'; c.fillRect(LANE_X - 6, py, 12, 3);
    c.strokeStyle = '#8890a0'; c.lineWidth = 1;
    c.beginPath(); for (let i = 0; i < 6; i++) { const y = py + 3 + i * ((H - py - 3) / 6); c.moveTo(LANE_X - 5, y); c.lineTo(LANE_X + 5, y + 2); } c.stroke();
    // 胶囊
    G.caps.forEach(cp => { if (cp.t >= 3 || f % 16 >= 8) drawCap(c, cp, f); });
    G.balls.forEach(b => { if (!b.inHole) drawBall(c, b, G.allfire > 0, G.fire); });
    G.ammo.forEach(a => { c.fillStyle = '#ff4040'; c.shadowColor = '#ff4040'; c.shadowBlur = 6; c.beginPath(); c.arc(a.x, a.y, a.r, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0; });
    G.fx.forEach(e => {
      if (e.k === 'bits') { c.fillStyle = e.c; for (let i = 0; i < 6; i++) { const a = i * 1.05 + e.t * 9, d = (0.4 - e.t) * 40; c.fillRect(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, 2, 2); } }
      if (e.k === 'ring') { c.strokeStyle = 'rgba(255,180,60,' + (e.t / 0.35) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, 24 * (1 - e.t / 0.35) + 4, 0, Math.PI * 2); c.stroke(); }
    });
    c.restore();
    const big = G.tilted ? L.tilt : G.paused ? L.paused : G.dead && !G.balls.some(b => b.fling) ? L.over : '';
    if (big) { c.font = 'bold 30px Impact, Arial Black, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ff4040'; c.shadowColor = '#ff0000'; c.shadowBlur = 12; c.fillText(big, W / 2 - 8, H / 2); c.shadowBlur = 0; }
  }
  // 强化：一枚圆片——外面一圈镀铬，里面彩色玻璃，玻璃里一个白色小图案；会游走的拖一条小尾巴
  function drawCap(c, cp, f) {
    const d = CAPS[cp.type], x = cp.x, y = cp.y + (cp.bob || 0), r = 7;
    if (cp.roam) {
      const sp = Math.hypot(cp.vx, cp.vy) || 1;
      for (let i = 1; i <= 3; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.18 / i) + ')'; c.beginPath(); c.arc(x - cp.vx / sp * i * 4, y - cp.vy / sp * i * 4, r - i * 1.4, 0, Math.PI * 2); c.fill(); }
    }
    c.shadowColor = d.c; c.shadowBlur = 7 + Math.sin(f / 6) * 3;
    const ring = c.createLinearGradient(x - r, y - r, x + r, y + r);
    ring.addColorStop(0, '#ffffff'); ring.addColorStop(0.45, '#b9c1ca'); ring.addColorStop(1, '#4c535c');
    c.fillStyle = ring; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
    const g = c.createRadialGradient(x - 1.8, y - 2.2, 0.4, x, y, r - 1.5);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, shade(d.c, 0.35)); g.addColorStop(0.75, d.c); g.addColorStop(1, shade(d.c, -0.5));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r - 1.5, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(x, y + 0.3);
    c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 0.7; c.lineJoin = 'round';
    capGlyph(c, cp.type);
    c.restore();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(x - 1.6, y - 3.4, 2.4, 1.1, -0.4, 0, Math.PI * 2); c.fill();
  }
  // 圆片里的小图案：武器（拖尾巴的弹药球）／ 火球、全体火球（火苗）／ 倍数（×）／ 护底（盾）／ 弹簧上膛（弹簧）
  function capGlyph(c, type) {
    const both = () => { c.stroke(); c.fill(); };
    if (type === 'weapon') {
      c.beginPath(); c.moveTo(-3.2, 2.6); c.lineTo(0.2, -0.4); c.lineTo(-0.6, 1.6); c.closePath(); both();
      c.beginPath(); c.arc(1.2, -1.2, 1.9, 0, Math.PI * 2); both();
    } else if (type === 'fire' || type === 'allfire') {
      c.beginPath(); c.moveTo(0, -3.6); c.bezierCurveTo(2.8, -0.8, 2.8, 2.9, 0, 2.9); c.bezierCurveTo(-2.8, 2.9, -2.8, -0.2, -0.9, -1.4); c.bezierCurveTo(-0.6, -0.2, 0.4, 0, 0, -3.6); both();
      if (type === 'allfire') { c.beginPath(); c.arc(2.6, -2.6, 0.9, 0, Math.PI * 2); c.arc(-2.7, -2.2, 0.7, 0, Math.PI * 2); c.fill(); }
    } else if (type === 'mult') {
      c.lineWidth = 2.6; c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-2.2, -2.2); c.lineTo(2.2, 2.2); c.moveTo(2.2, -2.2); c.lineTo(-2.2, 2.2); c.stroke();
      c.lineWidth = 1.4; c.strokeStyle = '#fff'; c.stroke();
    } else if (type === 'guard') {
      c.beginPath(); c.moveTo(0, -3.3); c.lineTo(2.9, -2.2); c.quadraticCurveTo(2.7, 1.8, 0, 3.4); c.quadraticCurveTo(-2.7, 1.8, -2.9, -2.2); c.closePath(); both();
    } else if (type === 'mag') {
      c.lineCap = 'round'; c.lineWidth = 2.2; c.strokeStyle = 'rgba(0,0,0,.55)';
      const zig = () => { c.beginPath(); c.moveTo(-2.4, -3); c.lineTo(2.4, -1.8); c.lineTo(-2.4, -0.4); c.lineTo(2.4, 1); c.lineTo(-2.4, 2.4); c.stroke(); };
      zig(); c.lineWidth = 1; c.strokeStyle = '#fff'; zig();
    }
  }
  function lamp(c, x, y, r, col, on) {
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.2, x, y, r);
    if (on) { g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, col); g.addColorStop(1, col); c.shadowColor = col; c.shadowBlur = 7; }
    else { g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(0.5, shade(col, -0.6)); g.addColorStop(1, shade(col, -0.8)); }
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
  }
  function arrow(c, x, y, a, on) {
    c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = on ? '#ffe14d' : 'rgba(150,120,20,.7)';
    if (on) { c.shadowColor = '#ffe14d'; c.shadowBlur = 8; }
    c.beginPath(); c.moveTo(5, 0); c.lineTo(-3, -4); c.lineTo(-3, 4); c.closePath(); c.fill();
    c.restore(); c.shadowBlur = 0;
  }
  // 坡道：一条半透明的紫色塑料道，上面一道道人字纹
  function drawRamp(c) {
    c.save();
    c.beginPath(); c.moveTo(9, 116); c.lineTo(9, 26); c.quadraticCurveTo(9, 9, 26, 9); c.lineTo(60, 9); c.lineTo(60, 24); c.lineTo(40, 24); c.quadraticCurveTo(32, 24, 32, 32); c.lineTo(32, 116); c.closePath();
    const g = c.createLinearGradient(9, 0, 32, 0); g.addColorStop(0, 'rgba(150,70,230,.45)'); g.addColorStop(0.5, 'rgba(200,130,255,.38)'); g.addColorStop(1, 'rgba(120,50,200,.45)');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(230,200,255,.7)'; c.lineWidth = 0.8; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.2;
    for (let y = 108; y > 34; y -= 10) { c.beginPath(); c.moveTo(12, y + 3); c.lineTo(20.5, y); c.lineTo(29, y + 3); c.stroke(); }
    c.restore();
  }
  function drawBumper(c, bp, lit) {
    const im = IMG[lit ? 'bumper-lit' : 'bumper'];
    if (im) { const d = bp.r * 2 * 48 / 40; c.drawImage(im, bp.x - d / 2, bp.y - d / 2, d, d); return; }   // 图 48×48，弹框本身占中间 40
    c.fillStyle = '#f2f2f2'; c.beginPath(); c.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#c81e2e'; c.beginPath(); c.arc(bp.x, bp.y, bp.r * 0.72, 0, Math.PI * 2); c.fill();
    const g = c.createRadialGradient(bp.x - 1.5, bp.y - 1.5, 0.5, bp.x, bp.y, bp.r * 0.45);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, lit ? '#bfefff' : '#3a7cff'); g.addColorStop(1, lit ? '#7fd4ff' : '#1a3fa0');
    c.fillStyle = g;
    if (lit) { c.shadowColor = '#7fd4ff'; c.shadowBlur = 14; }
    c.beginPath(); c.arc(bp.x, bp.y, bp.r * 0.45, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
  }
  function drawSling(c, t, lit) {
    c.save();
    c.beginPath(); c.moveTo(t[0][0], t[0][1]); c.lineTo(t[1][0], t[1][1]); c.lineTo(t[2][0], t[2][1]); c.closePath();
    c.clip();
    const im = IMG[lit ? 'sling-lit' : 'sling'];
    const xs = t.map(q => q[0]), ys = t.map(q => q[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
    if (im) c.drawImage(im, x0, y0, Math.max(w, h), Math.max(w, h));
    else {
      c.fillStyle = '#2a0a5a'; c.fillRect(x0, y0, w, h);
      c.strokeStyle = lit ? '#e0f4ff' : '#7f9cff'; c.lineWidth = lit ? 1.6 : 1; c.shadowColor = '#7fd4ff'; c.shadowBlur = lit ? 10 : 4;
      c.beginPath(); c.moveTo(x0 + w * 0.2, y0 + 2); c.lineTo(x0 + w * 0.55, y0 + h * 0.45); c.lineTo(x0 + w * 0.35, y0 + h * 0.55); c.lineTo(x0 + w * 0.8, y0 + h); c.stroke();
    }
    c.restore();
    c.strokeStyle = '#eef3f8'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(t[0][0], t[0][1]); c.lineTo(t[2][0], t[2][1]); c.stroke();
    c.strokeStyle = '#5c6470'; c.lineWidth = 1; c.beginPath(); c.moveTo(t[0][0], t[0][1]); c.lineTo(t[1][0], t[1][1]); c.lineTo(t[2][0], t[2][1]); c.stroke();
  }
  function drawFlipper(c, f) {
    const p = PIV[f.side], im = IMG[f.side ? 'flipper-r' : 'flipper-l'];
    c.save(); c.translate(p.x, p.y);
    if (G.tilted) c.globalAlpha = 0.55;
    c.save(); c.rotate(f.ang); c.fillStyle = 'rgba(0,0,0,.35)'; capsule(c, 1.5, 2, FL.len, 4.6, 2.8); c.restore();   // 影子
    if (im) {
      // 图 104×28：粗头圆心 (14,14)、细头圆心 (94,14)，右挡板左右翻过来。
      // 两个圆头照原样缩小（跟碰撞的粗细对上），中间那段拉长到挡板的长度
      const s = 0.33, a = 14 * s, hy = -a, hh = 28 * s, len = FL.len;
      if (!f.side) {
        c.rotate(f.ang);
        c.drawImage(im, 0, 0, 28, 28, -a, hy, 2 * a, hh);
        c.drawImage(im, 28, 0, 52, 28, a - 0.2, hy, len - 2 * a + 0.4, hh);
        c.drawImage(im, 80, 0, 24, 28, len - a, hy, 24 * s, hh);
      } else {
        c.rotate(f.ang - Math.PI);   // 转半圈再用翻过来的图，高光还在上面
        c.drawImage(im, 76, 0, 28, 28, -a, hy, 2 * a, hh);
        c.drawImage(im, 24, 0, 52, 28, -(len - a) - 0.2, hy, len - 2 * a + 0.4, hh);
        c.drawImage(im, 0, 0, 24, 28, -len - 10 * s, hy, 24 * s, hh);
      }
    } else {
      c.rotate(f.ang);
      const g = c.createLinearGradient(0, -4, 0, 4); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#d4d8de'); g.addColorStop(1, '#8a9099');
      c.fillStyle = g; capsule(c, 0, 0, FL.len, 4.2, 2.4);
      c.fillStyle = '#d01e2e'; c.beginPath(); c.arc(FL.len, 0, 2.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5c6470'; c.beginPath(); c.arc(0, 0, 1.6, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }
  // 一头粗一头细的圆头棍子（从 (x0,y0) 往右 len）
  function capsule(c, x0, y0, len, r0, r1) {
    c.beginPath(); c.arc(x0, y0, r0, Math.PI / 2, Math.PI * 1.5); c.lineTo(x0 + len, y0 - r1); c.arc(x0 + len, y0, r1, -Math.PI / 2, Math.PI / 2); c.closePath(); c.fill();
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  // 灯片砖：半透明彩色塑料，里面透着光
  function drawBrick(c, b) {
    const col = COLOR[b.ch] || '#ccc';
    if (b.kind === 's') {
      const g = c.createLinearGradient(0, b.y, 0, b.y + BH); g.addColorStop(0, '#f4f7fa'); g.addColorStop(0.5, '#9aa3ad'); g.addColorStop(1, '#5c6470');
      c.fillStyle = g; roundRect(c, b.x, b.y, BW, BH, 1); c.fill();
      c.fillStyle = '#3a4048'; [[2, 2], [BW - 2, 2], [2, BH - 2], [BW - 2, BH - 2]].forEach(([a, d]) => { c.beginPath(); c.arc(b.x + a, b.y + d, 0.6, 0, Math.PI * 2); c.fill(); });
      return;
    }
    const dim = b.hp < b.max ? 0.45 : 0, glow = b.flash > 0;
    if (b.flash > 0) b.flash -= 1 / 60;
    c.fillStyle = shade(col, -0.55 - dim * 0.3); roundRect(c, b.x, b.y, BW, BH, 1.5); c.fill();
    const g = c.createRadialGradient(b.x + BW / 2, b.y + BH / 2, 0.5, b.x + BW / 2, b.y + BH / 2, BW * 0.6);
    g.addColorStop(0, glow ? '#ffffff' : shade(col, 0.45 - dim)); g.addColorStop(0.6, shade(col, -dim)); g.addColorStop(1, 'rgba(0,0,0,0)');
    if (b.kind === 'g' || 'EMV'.includes(b.kind) || glow) { c.shadowColor = col; c.shadowBlur = glow ? 10 : 5; }
    c.fillStyle = g; roundRect(c, b.x + 0.5, b.y + 0.5, BW - 1, BH - 1, 1.2); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(b.x + 1.5, b.y + 1, BW - 3, 1.2);
    if (b.hp < b.max) { c.strokeStyle = 'rgba(0,0,0,.65)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(b.x + 4, b.y); c.lineTo(b.x + 7, b.y + 3.5); c.lineTo(b.x + 5, b.y + BH); c.moveTo(b.x + 7, b.y + 3.5); c.lineTo(b.x + 12, b.y + 2.5); c.stroke(); }
    if ('EMV'.includes(b.kind)) { c.fillStyle = '#fff'; c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.kind === 'E' ? '+' : b.kind === 'M' ? '●●' : '盾', b.x + BW / 2, b.y + BH / 2 + 0.5); }
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, t = f < 0 ? 0 : 255, p = Math.abs(f);
    return 'rgb(' + Math.round((t - r) * p + r) + ',' + Math.round((t - g) * p + g) + ',' + Math.round((t - b) * p + b) + ')';
  }
  function drawBall(c, b, burn, fire) {
    const r = b.r || R;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(b.x + 1.5, b.y + 2, r, 0, Math.PI * 2); c.fill();
    if (burn || fire >= 3) { c.fillStyle = burn ? 'rgba(180,80,255,.5)' : 'rgba(255,140,40,.45)'; c.beginPath(); c.arc(b.x, b.y, r + 3, 0, Math.PI * 2); c.fill(); }
    const g = c.createRadialGradient(b.x - r / 3, b.y - r / 3, 0.5, b.x, b.y, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, burn ? '#e0a0ff' : fire ? '#ffd0a0' : '#d8dde6'); g.addColorStop(1, burn ? '#7a20c0' : fire ? '#d05010' : '#5a6270');
    c.fillStyle = g; c.beginPath(); c.arc(b.x, b.y, r, 0, Math.PI * 2); c.fill();
  }

  /* ---------- 面板：灰色金属框，一格格黑色显示框，淡紫色老电脑字 ---------- */
  function buildPanel() {
    ui.mascot = el('div', { class: 'pb-mascot' });
    ui.ballNo = el('span', { class: 'pb-digit pb-ballno' });
    ui.title = el('div', { class: 'pb-box pb-titlebox' }, [
      ui.mascot,
      el('div', { class: 'pb-sub', text: L.sub }),
      el('div', { class: 'pb-big', text: L.big }),
      el('div', { class: 'pb-ball' }, [el('span', { class: 'pb-red', text: L.ballWord }), ui.ballNo])
    ]);
    ui.pl = el('div', { class: 'pb-box pb-pl pb-digit' });
    ui.score = el('div', { class: 'pb-box pb-sc pb-digit' });
    ui.info = el('div', { class: 'pb-box pb-info pb-txt' });
    ui.mis = el('div', { class: 'pb-box pb-mis pb-txt' });
    ui.panel.append(ui.title, el('div', { class: 'pb-row2' }, [ui.pl, ui.score]), ui.info, ui.mis);
    paintMascot();
  }
  function paintMascot() {
    if (!ui) return;
    ui.mascot.textContent = '';
    if (IMG.mascot) ui.mascot.appendChild(el('img', { src: IMG.mascot.src, alt: '' }));
    else ui.mascot.appendChild(OS.iconEl('duck', 'pb-duck'));   // 吉祥物的图没来之前：先放小鸭子
  }
  const bar = n => '■'.repeat(n) + '□'.repeat(5 - n);
  function paintPanel() {
    if (!ui || !G) return;
    const p = P();
    ui.ballNo.textContent = String(Math.max(1, p.total - p.balls + 1));
    ui.pl.textContent = String(G.cur + 1);
    ui.score.textContent = String(p.score);
    ui.info.textContent = G.info;
    const lines = [G.started ? missionText() : L.wait, L.rank(L.ranks[p.level])];
    if (G.weapon) lines.push(L.weapon + ' ' + bar(G.weapon));
    if (G.fire) lines.push(L.fire + ' ' + bar(G.fire));
    if (G.mult || G.double > 0) lines.push(L.mult + ' ×' + MULT[G.mult] * (G.double > 0 ? 2 : 1));
    ui.mis.textContent = lines.join('\n');
  }

  /* ---------- 操作 ---------- */
  function onKey(e) {
    if (!win || win.isClosed || OS.wm.active !== win || !G) return;
    const k = e.key;
    if (k === 'F2') { e.preventDefault(); newGame(); return; }
    if (k === 'F3') { e.preventDefault(); G.paused = !G.paused; return; }
    if (k.length === 1) {
      G.cheat = (G.cheat + k.toLowerCase()).slice(-12);
      if (G.cheat.endsWith('hidden test')) { G.hidden = true; G.cheated = true; say(L.cheat.hidden); }
      if (G.cheat.endsWith('1max')) { P().balls++; P().total++; G.cheated = true; say(L.cheat.one); }
      if (G.cheat.endsWith('rmax')) { const p = P(); p.level = 8; p.bricks = buildBricks(8, p.loop); G.cheated = true; say(L.cheat.r); }
    }
    if (G.dead) return;
    if (k === 'z' || k === 'Z' || k === 'ArrowLeft' || e.code === 'ShiftLeft') { e.preventDefault(); flip(0, true); }
    else if (k === '/' || k === '?' || k === 'ArrowRight' || e.code === 'ShiftRight') { e.preventDefault(); flip(1, true); }
    else if (k === ' ') { e.preventDefault(); if (G.balls.some(b => b.held)) G.pulling = true; }
    else if (!e.repeat && (k === 'x' || k === 'X' || k === '.' || k === 'ArrowUp')) { e.preventDefault(); nudge(); }
  }
  function onKeyUp(e) {
    if (!G) return;
    const k = e.key;
    if (k === 'z' || k === 'Z' || k === 'ArrowLeft' || e.code === 'ShiftLeft') flip(0, false);
    if (k === '/' || k === '?' || k === 'ArrowRight' || e.code === 'ShiftRight') flip(1, false);
    if (k === ' ' && G.pulling) launch();
  }
  const touches = new Map();
  function tablePt(e) { const p = OS.stage.toLocal(e.clientX, e.clientY), r = OS.stage.rectOf(ui.cv); return { x: (p.x - r.left) * W / r.width, y: (p.y - r.top) * H / r.height }; }
  function onDown(e) {
    if (!G || !ui || e.target.closest('.mbar')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    askMotion();
    if (G.dead) return;
    const tp = tablePt(e);
    if (G.hidden) {
      const b = G.balls.find(x => !x.held && !x.inHole && Math.hypot(x.x - tp.x, x.y - tp.y) < 16);
      if (b) { b.drag = true; touches.set(e.pointerId, { kind: 'drag', b, last: tp, t: performance.now(), vx: 0, vy: 0 }); return; }
    }
    const onlyHeld = G.balls.length && G.balls.every(b => b.held);
    if (onlyHeld && e.pointerType !== 'mouse') { G.pulling = true; touches.set(e.pointerId, { kind: 'pull' }); return; }
    if (e.pointerType === 'mouse') return;
    const r = OS.stage.rectOf(ui.box), p = OS.stage.toLocal(e.clientX, e.clientY);
    const side = p.x < r.left + r.width / 2 ? 0 : 1;
    flip(side, true);
    touches.set(e.pointerId, { kind: 'flip', side });
  }
  function onMove(e) {
    const t = touches.get(e.pointerId);
    if (!t || t.kind !== 'drag' || !G) return;
    const tp = tablePt(e), now = performance.now(), dt = Math.max(1, now - t.t) / (1000 / 60);
    t.vx = (tp.x - t.last.x) / dt; t.vy = (tp.y - t.last.y) / dt;
    t.last = tp; t.t = now;
    t.b.x = tp.x; t.b.y = tp.y;
  }
  function onUp(e) {
    const t = touches.get(e.pointerId);
    if (!t || !G) return;
    touches.delete(e.pointerId);
    if (t.kind === 'flip') { if (![...touches.values()].some(o => o.kind === 'flip' && o.side === t.side)) flip(t.side, false); }
    if (t.kind === 'pull') launch();
    if (t.kind === 'drag') {
      const b = t.b;
      b.drag = false; b.vx = t.vx; b.vy = t.vy;
      if (Math.hypot(t.vx, t.vy) > 14) { b.fling = true; b.vx *= 1.5; b.vy *= 1.5; }
    }
  }
  let lastShake = 0, motionAsked = false;
  function askMotion() {
    if (motionAsked) return;
    motionAsked = true;
    try { if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') DeviceMotionEvent.requestPermission().catch(() => {}); } catch (_) { /* ignore */ }
  }
  function onShake(e) {
    if (!G || !win || OS.wm.active !== win) return;
    const a = e.acceleration || {}, m = Math.hypot(a.x || 0, a.y || 0, a.z || 0), now = Date.now();
    if (m > 13 && now - lastShake > 450) { lastShake = now; nudge(); }
  }

  /* ---------- 菜单（照原版：游戏 ／ 选项 ／ 帮助） ---------- */
  const sayDlg = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });
  function menuFor(m) {
    if (m === '游戏(G)') return [
      { label: L.newGame, action: newGame },
      { label: L.pause, checked: !!(G && G.paused), action: () => { if (G) G.paused = !G.paused; } },
      '-',
      { label: L.high, action: highDialog },
      '-',
      { label: L.quit, action: () => win && win.close() }
    ];
    if (m === '选项(O)') return [
      { label: L.players, sub: [1, 2, 3, 4].map(n => ({ label: String(n), checked: S.players === n, action: () => { S.players = n; persist(); newGame(); } })) },
      { label: L.sound, checked: S.sound, action: () => { S.sound = !S.sound; persist(); } }
    ];
    return [{ label: L.help, action: sayDlg(L.help, 'help', L.helpText) }, '-', { label: L.about, action: sayDlg(L.about, 'info', L.aboutText) }];
  }
  function highDialog() {
    OS.ui.dialog({ title: L.highTitle, icon: 'info', text: L.highText(S.high || []), buttons: [L.clear, L.ok] }).then(v => { if (v === L.clear) { S.high = []; persist(); } });
  }

})();
