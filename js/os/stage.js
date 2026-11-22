/* 屏幕适配
   - 画面固定 4:3（480×360 点），像千禧年的大头显示器
   - 横着拿：左右多出来的地方放滚动装饰；竖着拿：上下放（见 filler.js）。不强制横屏
   - 避开 B站「··· ×」按钮和刘海：只有压进画面里的那一部分才需要躲
   - 控制面板 ▸ 显示 ▸ 屏幕方向：横屏 / 反向横屏 / 倒立 = 整个画面（连旁边的装饰）自己转过来画。
     手机锁了竖屏、或者 App 不让转的时候，玩家把手机横过来拿就是正的。网页自己已经横过来了就不再多转。
     转了以后：stage.vw / vh 是“转过来以后”的宽高；手指位置一律用 toLocal 换算，元素位置用 rectOf */
(function () {
  'use strict';
  const W = 480, H = 360;
  const TICKER_H = 20;
  const TASKBAR_H = 30;
  // B站胶囊按钮大约占的地方（真实像素，屏幕右上角），留宽一点
  const CAP_W = 112;
  const CAP_H = 50;
  // 屏幕方向 → 整个画面转多少度（横屏：手机顶上朝左拿；反向横屏：顶上朝右）
  const ROT = { portrait: 0, landscape: 90, landscape2: -90, flip: 180 };

  const stage = OS.stage = {
    W, H, scale: 1, portrait: false,
    vw: 0, vh: 0, ox: 0, oy: 0,
    rw: 0, rh: 0,                                  // 手机屏幕真正的宽高（没转之前）
    orient: OS.save.get('orient', 'portrait'),     // 控制面板里选的屏幕方向
    rot: 0,                                        // 现在实际转了多少度
    TICKER_H, TASKBAR_H,
    touch: false,
    insets: { l: 0, r: 0, t: 0, b: 0 },
    capsule: null,
    work: { x: 0, y: TICKER_H, w: W, h: H - TICKER_H - TASKBAR_H },
    tickerBox: { left: 0, right: 0 },
    iconOrigin: { x: 2, y: TICKER_H + 4 }
  };

  const frame = document.getElementById('frame');
  const st = document.getElementById('stage');
  stage.el = st;
  stage.frameEl = frame;
  st.style.width = W + 'px';
  st.style.height = H + 'px';

  stage.touch = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window);

  // 用一个看不见的元素读出刘海/圆角的安全距离
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);';
  document.body.appendChild(probe);

  function editableFocused() {
    const a = document.activeElement;
    return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable);
  }

  // 手机屏幕上的点 → 转过来以后的点
  function toVirtual(cx, cy) {
    const r = stage.rot;
    if (r === 90) return { x: cy, y: stage.rw - cx };
    if (r === -90) return { x: stage.rh - cy, y: cx };
    if (r === 180) return { x: stage.rw - cx, y: stage.rh - cy };
    return { x: cx, y: cy };
  }

  function layout(force) {
    const rw = window.innerWidth, rh = window.innerHeight;
    if (!rw || !rh) return;
    // 弹出键盘时只有高度变化，不要跟着缩放
    if (!force && editableFocused() && rw === stage.rw) return;

    let rot = ROT[stage.orient] || 0;
    if ((rot === 90 || rot === -90) && rw > rh && stage.touch) rot = 0;   // 手机网页自己已经横过来了，不再多转一次（电脑上照转，就当整蛊自己）
    const side = rot === 90 || rot === -90;
    const vw = side ? rh : rw, vh = side ? rw : rh;

    const s = Math.min(vw / W, vh / H);
    const ox = (vw - W * s) / 2;
    const oy = (vh - H * s) / 2;
    Object.assign(stage, { rw, rh, rot, vw, vh, scale: s, ox, oy, portrait: vh > vw });

    frame.style.width = vw + 'px';
    frame.style.height = vh + 'px';
    frame.style.transformOrigin = '0 0';
    frame.style.transform = rot === 90 ? 'translate(' + rw + 'px,0) rotate(90deg)'
      : rot === -90 ? 'translate(0,' + rh + 'px) rotate(-90deg)'
      : rot === 180 ? 'translate(' + rw + 'px,' + rh + 'px) rotate(180deg)' : '';
    st.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + s + ')';

    // 刘海：只算压进画面的那一截（大多数时候落在旁边的装饰上，不影响画面）；转过来了，四条边也跟着换
    const cs = getComputedStyle(probe);
    const it = parseFloat(cs.paddingTop) || 0, ir = parseFloat(cs.paddingRight) || 0;
    const ib = parseFloat(cs.paddingBottom) || 0, il = parseFloat(cs.paddingLeft) || 0;
    const e = rot === 90 ? { l: it, t: ir, r: ib, b: il } : rot === -90 ? { l: ib, t: il, r: it, b: ir }
      : rot === 180 ? { l: ir, t: ib, r: il, b: it } : { l: il, t: it, r: ir, b: ib };
    stage.insets = {
      l: Math.max(0, e.l - ox) / s, r: Math.max(0, e.r - ox) / s,
      t: Math.max(0, e.t - oy) / s, b: Math.max(0, e.b - oy) / s
    };

    // B站胶囊：手机屏幕右上角那块，换算到画面里；只有压进画面的那块才需要躲（通常压在装饰上）
    let cap = null;
    if (stage.touch) {
      const a = stage.toLocal(rw - CAP_W, 0), b = stage.toLocal(rw, CAP_H);
      const x1 = Math.max(0, Math.min(a.x, b.x)), y1 = Math.max(0, Math.min(a.y, b.y));
      const x2 = Math.min(W, Math.max(a.x, b.x)), y2 = Math.min(H, Math.max(a.y, b.y));
      if (x2 > x1 && y2 > y1) cap = { x: x1, y: y1, w: x2 - x1, h: y2 - y1, corner: ((y1 + y2) / 2 < H / 2 ? 't' : 'b') + ((x1 + x2) / 2 < W / 2 ? 'l' : 'r') };
    }
    stage.capsule = cap;

    const ins = stage.insets;
    // 顶部新闻条：铺满一整行。被B站按钮挡住一截没关系，字会滚出来
    stage.tickerBox = { left: ins.l, right: ins.r };
    // 窗口能活动的区域：新闻条下面到任务栏上面（标题栏碰到B站按钮时，按钮会自己让开，见 wm.js）
    stage.work = { x: ins.l, y: TICKER_H, w: W - ins.l - ins.r, h: H - TICKER_H - TASKBAR_H };
    stage.iconOrigin = { x: ins.l + 2, y: TICKER_H + 4 };

    OS.emit('stage:resize', stage);
  }
  stage.layout = layout;

  // 手指/鼠标位置 → 画面坐标
  stage.toLocal = function (cx, cy) {
    const v = toVirtual(cx, cy);
    return { x: (v.x - stage.ox) / stage.scale, y: (v.y - stage.oy) / stage.scale };
  };
  // 一个元素在画面里的位置（代替 getBoundingClientRect，转屏以后也对）
  stage.rectOf = function (node) {
    const r = node.getBoundingClientRect();
    const a = stage.toLocal(r.left, r.top), b = stage.toLocal(r.right, r.bottom);
    const left = Math.min(a.x, b.x), top = Math.min(a.y, b.y), right = Math.max(a.x, b.x), bottom = Math.max(a.y, b.y);
    return { left, top, right, bottom, x: left, y: top, width: right - left, height: bottom - top };
  };
  // 双击要多快（毫秒）：控制面板 ▸ 鼠标 ▸ 双击速度；全游戏的“双击”都用它
  OS.dblMs = () => OS.save.get('dblMs', 450);
  // 换屏幕方向（控制面板用）：save = true 才记住
  stage.setOrient = function (mode, save) {
    stage.orient = ROT[mode] != null ? mode : 'portrait';
    if (save) OS.save.set('orient', stage.orient);
    layout(true);
  };

  let timer = 0;
  function later() { clearTimeout(timer); timer = setTimeout(() => layout(), 80); }
  window.addEventListener('resize', later);
  window.addEventListener('orientationchange', () => { later(); setTimeout(() => layout(), 400); });
})();
