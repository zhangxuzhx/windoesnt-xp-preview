/* 画面外的装饰：千禧年小物件 + 老网页小徽章，无限滚动的卷轴
   横着拿：左右两边竖着滚；竖着拿：上下两边横着滚。相邻两条方向相反。 */
(function () {
  'use strict';
  const el = OS.el;
  const F = OS.filler = {};

  const ITEMS = ['floppy', 'disc', 'flipphone', 'brickphone', 'pager', 'cassette', 'mp3', 'eggpet',
    'ballmouse', 'modem', 'gamepad', 'computer', 'folder', 'smiley', 'recycle', 'logo-sm'];

  // 老网页上那种 88×31 的小徽章
  const BADGES = [
    { a: '最佳分辨率', b: '800×600', c: 'bd-gray' },
    { a: '您是第', b: '000007 位访客', c: 'bd-counter' },
    { a: '56K', b: '极速上网', c: 'bd-orange' },
    { a: '千年虫', b: '已修复', c: 'bd-green' },
    { a: '欢迎光临', b: '寒舍', c: 'bd-pink' },
    { a: '本站', b: '正在装修', c: 'bd-construct' },
    { a: '加入', b: '收藏夹', c: 'bd-blue' },
    { a: '设为', b: '首页', c: 'bd-blue' },
    { a: '留言板', b: '快来灌水', c: 'bd-purple' },
    { a: '当前网速', b: '2.3 KB/s', c: 'bd-dark' },
    { a: 'LOADING', b: '▮▮▮▯▯▯▯', c: 'bd-dark blink' },
    { a: 'Made in', b: '200X', c: 'bd-silver' }
  ];

  let root, rim, lastKey = '';

  F.init = function () {
    root = document.getElementById('filler');
    rim = el('div', { id: 'screen-rim' });
    root.parentNode.insertBefore(rim, document.getElementById('stage'));
    OS.on('stage:resize', build);
    build();
  };

  function build() {
    const st = OS.stage;
    const s = st.scale, k = Math.min(s, 1.5);
    const sw = st.W * s, sh = st.H * s;
    rim.style.left = st.ox + 'px'; rim.style.top = st.oy + 'px';
    rim.style.width = sw + 'px'; rim.style.height = sh + 'px';

    const key = st.vw + 'x' + st.vh;
    if (key === lastKey) return;
    lastKey = key;
    root.innerHTML = '';

    if (st.ox >= 1) {
      zone({ x: 0, y: 0, w: st.ox, h: st.vh }, true, k);
      zone({ x: st.ox + sw, y: 0, w: st.vw - st.ox - sw, h: st.vh }, true, k);
    }
    if (st.oy >= 1) {
      zone({ x: 0, y: 0, w: st.vw, h: st.oy }, false, k);
      zone({ x: 0, y: st.oy + sh, w: st.vw, h: st.vh - st.oy - sh }, false, k);
    }
  }

  // 一块空地，切成几条卷轴
  function zone(r, vertical, k) {
    const thick = vertical ? r.w : r.h;
    const long = vertical ? r.h : r.w;
    if (thick < 26) return;
    const target = (vertical ? 92 : 62) * k;
    const n = Math.max(1, Math.round(thick / target));
    const laneT = thick / n;
    for (let i = 0; i < n; i++) {
      const lane = el('div', { class: 'fl-lane' });
      if (vertical) Object.assign(lane.style, { left: (r.x + i * laneT) + 'px', top: r.y + 'px', width: laneT + 'px', height: r.h + 'px' });
      else Object.assign(lane.style, { left: r.x + 'px', top: (r.y + i * laneT) + 'px', width: r.w + 'px', height: laneT + 'px' });
      lane.appendChild(track(vertical, laneT, long, k, i % 2 === 1));
      root.appendChild(lane);
    }
  }

  function track(vertical, laneT, long, k, reverse) {
    const t = el('div', { class: 'fl-track ' + (vertical ? 'v' : 'h') });
    const gap = (vertical ? 20 : 24) * k;
    const icon = Math.min(laneT * 0.6, 40 * k);
    const bScale = vertical ? Math.min(k, (laneT - 10) / 88) : Math.min(k, (laneT - 10) / 31);
    const specs = [];
    let len = 0, prev = '';
    while ((len < long + 20 || specs.length < 4) && specs.length < 40) {
      const r = Math.random();
      let sp;
      if (r < 0.24 && bScale > 0.45) sp = { type: 'badge', b: OS.pick(BADGES), f: bScale };
      else if (r < 0.34) sp = { type: 'spark', size: icon * 0.55 };
      else {
        let name = OS.pick(ITEMS);
        if (name === prev) name = OS.pick(ITEMS);
        sp = { type: 'icon', name, size: icon, rot: Math.round(Math.random() * 20 - 10) };
        prev = name;
      }
      len += (sp.type === 'badge' ? (vertical ? 31 : 88) * sp.f : sp.size) + gap;
      specs.push(sp);
    }
    // 两份一模一样的接在一起，滚到一半再从头来，就看不出接缝
    for (let c = 0; c < 2; c++) specs.forEach(sp => t.appendChild(tile(sp, vertical, gap)));
    const speed = 16 * k * (0.8 + Math.random() * 0.45);
    const dur = len / speed;
    t.style.animationDuration = dur + 's';
    t.style.animationDelay = (-Math.random() * dur) + 's';
    if (reverse) t.style.animationDirection = 'reverse';
    return t;
  }

  function tile(sp, vertical, gap) {
    const d = el('div', { class: 'fl-tile' + (sp.type === 'spark' ? ' spark' : '') });
    d.style[vertical ? 'marginBottom' : 'marginRight'] = gap + 'px';
    if (sp.type === 'badge') {
      d.style.width = 88 * sp.f + 'px';
      d.style.height = 31 * sp.f + 'px';
      const b = el('div', { class: 'fl-badge ' + sp.b.c }, [el('small', { text: sp.b.a }), el('b', { text: sp.b.b })]);
      b.style.transform = 'scale(' + sp.f / 2 + ')';
      d.appendChild(b);
    } else {
      d.style.width = sp.size + 'px';
      d.style.height = sp.size + 'px';
      d.innerHTML = OS.icon(sp.type === 'spark' ? 'sparkle' : sp.name);
      if (sp.rot) d.style.transform = 'rotate(' + sp.rot + 'deg)';
    }
    return d;
  }
})();
