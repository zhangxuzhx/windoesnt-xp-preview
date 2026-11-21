/* 屏幕适配
   - 画面固定 4:3（480×360 点），像千禧年的大头显示器
   - 横着拿：左右多出来的地方放滚动装饰；竖着拿：上下放（见 filler.js）。不强制横屏
   - 避开 B站「··· ×」按钮和刘海：只有压进画面里的那一部分才需要躲 */
(function () {
  'use strict';
  const W = 480, H = 360;
  const TICKER_H = 20;
  const TASKBAR_H = 30;
  // B站胶囊按钮大约占的地方（真实像素，屏幕右上角），留宽一点
  const CAP_W = 112;
  const CAP_H = 50;

  const stage = OS.stage = {
    W, H, scale: 1, portrait: false,
    vw: 0, vh: 0, ox: 0, oy: 0,
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

  function layout(force) {
    const vw = window.innerWidth, vh = window.innerHeight;
    if (!vw || !vh) return;
    // 弹出键盘时只有高度变化，不要跟着缩放
    if (!force && editableFocused() && vw === stage.vw) return;

    const s = Math.min(vw / W, vh / H);
    const ox = (vw - W * s) / 2;
    const oy = (vh - H * s) / 2;
    Object.assign(stage, { vw, vh, scale: s, ox, oy, portrait: vh > vw });

    frame.style.width = vw + 'px';
    frame.style.height = vh + 'px';
    st.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + s + ')';

    // 刘海：只算压进画面的那一截（大多数时候落在旁边的装饰上，不影响画面）
    const cs = getComputedStyle(probe);
    const it = parseFloat(cs.paddingTop) || 0, ir = parseFloat(cs.paddingRight) || 0;
    const ib = parseFloat(cs.paddingBottom) || 0, il = parseFloat(cs.paddingLeft) || 0;
    stage.insets = {
      l: Math.max(0, il - ox) / s, r: Math.max(0, ir - ox) / s,
      t: Math.max(0, it - oy) / s, b: Math.max(0, ib - oy) / s
    };

    // B站胶囊：只有压进画面的那块才需要躲（竖屏、宽屏手机上通常压在装饰上）
    let cap = null;
    if (stage.touch) {
      const x1 = Math.max(0, (vw - CAP_W - ox) / s), y1 = Math.max(0, (0 - oy) / s);
      const x2 = Math.min(W, (vw - ox) / s), y2 = Math.min(H, (CAP_H - oy) / s);
      if (x2 > x1 && y2 > y1) cap = { x: x1, y: y1, w: x2 - x1, h: y2 - y1, corner: 'tr' };
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
    return { x: (cx - stage.ox) / stage.scale, y: (cy - stage.oy) / stage.scale };
  };

  let timer = 0;
  function later() { clearTimeout(timer); timer = setTimeout(() => layout(), 80); }
  window.addEventListener('resize', later);
  window.addEventListener('orientationchange', () => { later(); setTimeout(() => layout(), 400); });
})();
