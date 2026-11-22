/* 桌面：壁纸、图标、右下角“未激活”水印
   操作跟XP一样：
   - 双击图标打开（手机上连点两下）
   - 按住图标拖动；选中多个时一起拖
   - 在空白处按住拖，拉出选框选中多个图标 */
(function () {
  'use strict';
  const el = OS.el;
  const D = OS.desktop = {};
  const CELL_W = 78, CELL_H = 68, ICON_W = 76;
  const DOUBLE_TAP_MS = 450;

  // 自己画的壁纸：蓝天、草坡、一块写着“此处无木牌”的木牌、一只羊
  const WALLPAPER =
    '<svg id="wallpaper" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
    '<linearGradient id="wpSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a63c9"/><stop offset=".5" stop-color="#5d9be8"/><stop offset=".78" stop-color="#a9d0fb"/><stop offset="1" stop-color="#d9ecff"/></linearGradient>' +
    '<linearGradient id="wpHillA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fc23f"/><stop offset="1" stop-color="#2d7a1c"/></linearGradient>' +
    '<linearGradient id="wpHillB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8bd94f"/><stop offset=".6" stop-color="#4ea02a"/><stop offset="1" stop-color="#2a6e17"/></linearGradient>' +
    '<radialGradient id="wpCloud"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".6" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '</defs>' +
    '<rect width="1600" height="900" fill="url(#wpSky)"/>' +
    '<path d="M0 600 C220 520 520 520 820 590 C1080 650 1320 560 1600 520 V900 H0Z" fill="url(#wpHillA)"/>' +
    '<path d="M0 690 C300 590 700 560 1040 640 C1260 690 1450 690 1600 650 V900 H0Z" fill="url(#wpHillB)"/>' +
    '</svg>';

  // 天上的云单独画（要能点、能抖）。每朵由几个椭圆拼成，坐标按壁纸算：[cx, cy, rx, ry]
  const CLOUDS = [
    [[300, 200, 230, 60], [430, 170, 140, 55]],
    [[1050, 140, 260, 55], [1190, 170, 160, 50]],
    [[760, 310, 180, 40]],
    [[1450, 340, 150, 35]]
  ];

  // 草坡上的“此处无木牌”单独画（要能点、能抖、能被砍断）。位置按壁纸坐标 (1110, 548) 算
  const SIGN_AT = { x: 1110, y: 548 }, SIGN_BOX = { x: -78, y: -44, w: 156, h: 122 };
  const SIGN_SVG =
    '<svg viewBox="-78 -44 156 122" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="-4" y="0" width="8" height="74" fill="#7a4f25"/>' +
    '<rect x="-74" y="-40" width="148" height="46" rx="4" fill="#c8924f" stroke="#7a4f25" stroke-width="4"/>' +
    '<text x="0" y="-9" font-size="23" text-anchor="middle" fill="#4a2c0f" font-weight="bold" font-family="sans-serif">此处无木牌</text></svg>';

  // 草坡上的羊单独画（要能点、能晃、能炸）。位置按壁纸坐标 (1290, 668) 算
  const SHEEP_AT = { x: 1290, y: 668 }, SHEEP_BOX = { x: -26, y: -24, w: 78, h: 58 };
  const SHEEP_SVG =
    '<svg viewBox="-26 -24 78 58" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M4 18 V31 M28 18 V31" stroke="#333" stroke-width="4"/>' +
    '<g fill="#fff"><circle cx="0" cy="0" r="16"/><circle cx="16" cy="-5" r="15"/><circle cx="32" cy="0" r="16"/><circle cx="16" cy="8" r="16"/></g>' +
    '<ellipse cx="-13" cy="2" rx="9" ry="8" fill="#333"/></svg>';

  let root, iconLayer, watermark;
  const icons = {};
  let grid = { cols: 1, rows: 1, ox: 0, oy: 0 };

  D.init = function (parent) {
    root = el('div', { id: 'desktop', class: 'layer', html: WALLPAPER });
    iconLayer = el('div', { id: 'icons', class: 'layer' });
    watermark = el('div', { id: 'watermark' });
    const mark = () => { watermark.innerHTML = OS.save.get('activated', false) ? "Windoesn't XP 专业版<br>已激活（大概）" : "Windoesn't XP 无聊版<br>本系统疑似盗版，建议报警抓你自己"; };
    mark();
    OS.on('system:activated', mark);
    root.appendChild(iconLayer);
    root.appendChild(watermark);
    parent.appendChild(root);

    bindBand();
    OS.ui.onContext(iconLayer, () => OS.menus.desktop());
    initClouds();
    initSign();
    initSheep();
    OS.apps.list.filter(a => a.desktop).forEach(addIcon);
    OS.on('stage:resize', relayout);
    relayout();
  };
  D.root = () => root;
  D.count = () => Object.keys(icons).filter(id => !icons[id].binned).length;

  /* ---------- 右键菜单用到的桌面功能 ---------- */
  const SYSTEM_IDS = ['mydocs', 'mycomputer', 'network'];   // 按类型排列时，这几个系统图标和回收站排最前面
  // 排列图标：名称 / 大小（名字长短）/ 类型（系统的排前面）/ 修改时间（倒过来）/ 按心情（随机）
  D.arrange = function (mode) {
    const order = OS.apps.list.filter(a => icons[a.id] && !icons[a.id].binned).map(a => icons[a.id]);
    if (mode === 'name') order.sort((a, b) => a.app.name.localeCompare(b.app.name, 'zh-Hans-CN'));
    else if (mode === 'size') order.sort((a, b) => a.app.name.length - b.app.name.length);
    else if (mode === 'type') {
      const sys = ic => (ic.app.acceptsDrop || SYSTEM_IDS.indexOf(ic.app.id) >= 0 ? 0 : 1);
      order.sort((a, b) => sys(a) - sys(b));
    }
    else if (mode === 'time') order.reverse();
    else OS.shuffle(order);
    order.forEach(ic => { ic.col = -1; ic.row = -1; });
    order.forEach(ic => { const f = firstFree(ic); ic.col = f[0]; ic.row = f[1]; settle(ic); });
    savePositions();
  };

  // 刷新：图标闪一下（XP 玩家的肌肉记忆）
  let refreshCount = 0;
  D.refresh = function () {
    iconLayer.classList.add('refreshing');
    setTimeout(() => iconLayer.classList.remove('refreshing'), 120);
    refreshCount++;
    const total = OS.save.get('refreshTotal', 0) + 1;
    OS.save.set('refreshTotal', total);
    const say = { 10: '刷新了 10 次，新……新了吗？', 30: '桌面已经快被你刷掉漆了。', 100: '恭喜解锁成就「刷新大师」。\n该成就没有任何用处。' }[refreshCount];
    if (say) OS.ui.notify({ title: '刷新', text: say, icon: 'info', replace: true, timeout: 4000 });
    cleanPoops();   // 羊粪扫干净
    OS.emit('desktop:refresh');   // 小软件可以听这个（比如弹窗杀手擦掉屏幕上的拍痕）
  };

  let iconsShown = true;
  D.iconsVisible = () => iconsShown;
  D.toggleIcons = function () {
    iconsShown = !iconsShown;
    iconLayer.classList.toggle('hide-icons', !iconsShown);
    if (!iconsShown) setSelection([]);
  };

  // 剪切：图标变半透明
  D.setCut = function (id) {
    Object.keys(icons).forEach(k => icons[k].el.classList.toggle('cut', k === id));
  };

  /* ---------- 天上的云：点一下抖一下；连着多点几下，右下角来一段人生感悟 ---------- */
  const CLOUD_TAPS = 6, CLOUD_GAP_MS = 1500;
  const CLOUD_TITLE = '温馨提示';
  const CLOUD_SAY = '你有很多事放不下？做人，要潇洒一点，\n爱一个人未必一定要跟她一辈子，\n我喜欢一朵花，未必一定要把它摘下来，\n我喜欢风，难道叫风停下来你让我闻一闻，\n我喜欢云难道叫云飘下来，来罩着我，\n有时候太照顾别人的感受，会失去自我的，\n轻轻的我走了，正如我轻轻的来，\n挥一挥衣袖，不带走一片云彩。';
  let clouds = [], cloudTaps = 0, cloudLast = 0;

  function initClouds() {
    clouds = CLOUDS.map(parts => {
      const x0 = Math.min(...parts.map(e => e[0] - e[2])), x1 = Math.max(...parts.map(e => e[0] + e[2]));
      const y0 = Math.min(...parts.map(e => e[1] - e[3])), y1 = Math.max(...parts.map(e => e[1] + e[3]));
      const svg = '<svg viewBox="0 0 ' + (x1 - x0) + ' ' + (y1 - y0) + '" xmlns="http://www.w3.org/2000/svg">' +
        '<defs><radialGradient id="wpc_' + x0 + '"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".6" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
        '<g fill="url(#wpc_' + x0 + ')">' + parts.map(e => '<ellipse cx="' + (e[0] - x0) + '" cy="' + (e[1] - y0) + '" rx="' + e[2] + '" ry="' + e[3] + '"/>').join('') + '</g></svg>';
      const node = el('div', { class: 'wpcloud', html: svg });
      node.box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      node.parts = parts;
      iconLayer.appendChild(node);
      return node;   // 云本身不接点击（不然天上拉不了选框），点空白处时再看点没点在云上，见 cloudAt
    });
  }
  function placeClouds() {
    const w = root.offsetWidth, h = root.offsetHeight;
    const s = Math.max(w / 1600, h / 900);
    const ox = (w - 1600 * s) / 2, oy = (h - 900 * s) / 2;
    clouds.forEach(n => {
      n.style.left = (ox + n.box.x * s) + 'px';
      n.style.top = (oy + n.box.y * s) + 'px';
      n.style.width = n.box.w * s + 'px';
      n.style.height = n.box.h * s + 'px';
    });
  }
  // 在桌面空白处点了一下（没拉选框）：点的位置在不在哪朵云的椭圆里（只算中间看得见的部分）
  function cloudAt(p) {
    const w = root.offsetWidth, h = root.offsetHeight;
    const s = Math.max(w / 1600, h / 900);
    const wx = (p.x - (w - 1600 * s) / 2) / s, wy = (p.y - (h - 900 * s) / 2) / s;
    const hit = clouds.find(n => n.parts.some(e => ((wx - e[0]) / e[2]) ** 2 + ((wy - e[1]) / e[3]) ** 2 <= 0.7));
    if (hit) tapCloud(hit);
  }
  function tapCloud(node) {
    setSelection([]);
    lastTap = null;
    node.classList.remove('wobble'); void node.offsetWidth; node.classList.add('wobble');
    OS.sound.play('pop');
    const now = Date.now();
    cloudTaps = now - cloudLast < CLOUD_GAP_MS ? cloudTaps + 1 : 1;
    cloudLast = now;
    if (cloudTaps >= CLOUD_TAPS) {
      cloudTaps = 0;
      OS.ui.notify({ title: CLOUD_TITLE, text: CLOUD_SAY, icon: 'info', replace: true, timeout: 16000, wide: true });
    }
  }

  /* ---------- 壁纸上的“此处无木牌”：点一下抖一下；连点 9 下，一个打了码的剑士从右边冲进来一剑砍断，
     羊（还在的话）被吓跑，右下角弹警告。砍断之后一直是断的（存档记着），再点只会抖 ---------- */
  const SIGN_TAPS = 9, SIGN_GAP_MS = 1200;
  const SIGN_WARN_TITLE = '系统警告';
  const SIGN_WARN = '停下！你不怕东半球最强法务部的制裁吗？';
  const CENSOR_TAG = '为防法务部，已打码';
  const SIGN_FIX = '正在更换木牌';            // 下次开机自检时修
  const SHEEP_FIX = '正在驱赶新的绵羊进入桌面';
  // 剑士：整个人打了厚码，只剩几大块颜色，看得出左手边竖着一把剑，朝左站
  const HERO_GRID = ['.hh.', 'wsgs', 'wggg', '.bgb', '.ll.', '.bb.'];
  const HERO_COLORS = { h: [128, 150, 92], s: [206, 168, 120], g: [86, 150, 80], b: [112, 82, 44], l: [196, 186, 158], w: [192, 202, 214] };
  const HERO_CELL = 7;
  let sign, signTaps = 0, signLast = 0, signBusy = false;

  function initSign() {
    const half = side => el('div', { class: 'ws-half ws-' + side, html: SIGN_SVG });
    OS.save.remove('signCut');   // 旧版本存过“木牌断了”，现在开机就修好，不用了
    sign = el('div', { class: 'wpsign' }, [half('l'), half('r')]);
    iconLayer.appendChild(sign);
    sign.addEventListener('click', tapSign);
  }
  function placeSign() {
    const w = root.offsetWidth, h = root.offsetHeight;
    const s = Math.max(w / 1600, h / 900);
    const ox = (w - 1600 * s) / 2, oy = (h - 900 * s) / 2;
    sign.style.left = (ox + (SIGN_AT.x + SIGN_BOX.x) * s) + 'px';
    sign.style.top = (oy + (SIGN_AT.y + SIGN_BOX.y) * s) + 'px';
    sign.style.width = SIGN_BOX.w * s + 'px';
    sign.style.height = SIGN_BOX.h * s + 'px';
  }
  function tapSign() {
    setSelection([]);
    lastTap = null;
    sign.classList.remove('wobble'); void sign.offsetWidth; sign.classList.add('wobble');
    OS.sound.play('thud');
    if (signBusy || sign.classList.contains('cut')) return;
    const now = Date.now();
    signTaps = now - signLast < SIGN_GAP_MS ? signTaps + 1 : 1;
    signLast = now;
    if (signTaps >= SIGN_TAPS) { signTaps = 0; cutSign(); }
  }

  function heroBody() {
    const cols = HERO_GRID[0].length, rows = HERO_GRID.length, c = HERO_CELL;
    let rects = '';
    HERO_GRID.forEach((row, y) => row.split('').forEach((k, x) => {
      if (HERO_COLORS[k]) rects += '<rect data-k="' + k + '" x="' + x * c + '" y="' + y * c + '" width="' + c + '" height="' + c + '"/>';
    }));
    const body = el('div', { class: 'ch-body', html: '<svg viewBox="0 0 ' + cols * c + ' ' + rows * c + '" shape-rendering="crispEdges">' + rects + '</svg>' });
    // 马赛克一闪一闪（每格颜色随机深一点浅一点），像电视里打的码
    const jitter = () => body.querySelectorAll('rect').forEach(r => {
      const base = HERO_COLORS[r.getAttribute('data-k')], f = 0.8 + Math.random() * 0.4;
      r.setAttribute('fill', 'rgb(' + base.map(v => Math.min(255, Math.round(v * f))).join(',') + ')');
    });
    jitter();
    body.jitter = setInterval(jitter, 130);
    return body;
  }

  function cutSign() {
    signBusy = true;
    const st = OS.stage;
    const L = parseFloat(sign.style.left), T = parseFloat(sign.style.top), W = sign.offsetWidth, H = sign.offsetHeight;
    const body = heroBody();
    const hero = el('div', { class: 'censor-hero' }, [el('div', { class: 'ch-tag', text: CENSOR_TAG }), body]);
    iconLayer.appendChild(hero);
    const feet = T + H * 0.97;
    hero.style.top = (feet - hero.offsetHeight) + 'px';
    hero.style.left = (st.W + 12) + 'px';
    void hero.offsetWidth;
    // 1. 从右边跑进来，站到木牌中间偏右
    hero.classList.add('run');
    hero.style.left = (L + W / 2 + 2) + 'px';
    setTimeout(() => {
      // 2. 一剑劈下去，木牌从中间断成两半倒下
      hero.classList.remove('run');
      hero.classList.add('strike');
      OS.sound.play('slash');
      const fx = el('div', { class: 'ws-slash' });
      Object.assign(fx.style, { left: (L + W / 2 - 1) + 'px', top: (T - 6) + 'px', height: (H + 10) + 'px' });
      iconLayer.appendChild(fx);
      setTimeout(() => fx.remove(), 380);
      setTimeout(() => {
        sign.classList.add('cut');
        OS.bootFix.add('sign', SIGN_FIX);
        OS.sound.play('thud');
        scareSheep();
      }, 130);
      // 3. 转身从右边跑掉，右下角弹警告
      setTimeout(() => {
        hero.classList.remove('strike');
        hero.classList.add('run', 'back');
        hero.style.left = (st.W + 20) + 'px';
        setTimeout(() => {
          clearInterval(body.jitter);
          hero.remove();
          signBusy = false;
          OS.ui.notify({ title: SIGN_WARN_TITLE, text: SIGN_WARN, icon: 'warn', replace: true, timeout: 6500 });
        }, 950);
      }, 1100);
    }, 950);
  }

  // 羊还在的话：吓一跳，掉头往右跑出屏幕（重新开机才回来）
  function scareSheep() {
    if (!sheep || sheep.classList.contains('gone')) return;
    clearTimeout(sheepTimer);
    sheepTaps = 0;
    sheep.classList.remove('wobble', 'inflate');
    sheep.classList.add('flee');
    OS.bootFix.add('sheep', SHEEP_FIX);
    OS.sound.play('baa', 9);
    setTimeout(() => { sheep.classList.remove('flee'); sheep.classList.add('gone'); }, 1500);
  }

  /* ---------- 壁纸上的羊：点一下晃一下，连点 9 下像气球一样炸掉 ---------- */
  const SHEEP_POP_TAPS = 9, SHEEP_GAP_MS = 1200;
  let sheep, sheepTaps = 0, sheepLast = 0, sheepTimer = 0, sheepScale = 0.4;

  function initSheep() {
    sheep = el('div', { class: 'sheep', html: SHEEP_SVG });
    iconLayer.appendChild(sheep);   // 放在图标前面，图标会盖在羊上面
    sheep.addEventListener('click', tapSheep);
  }
  function placeSheep() {
    const w = root.offsetWidth, h = root.offsetHeight;
    const s = sheepScale = Math.max(w / 1600, h / 900);
    const ox = (w - 1600 * s) / 2, oy = (h - 900 * s) / 2;
    sheep.style.left = (ox + (SHEEP_AT.x + SHEEP_BOX.x) * s) + 'px';
    sheep.style.top = (oy + (SHEEP_AT.y + SHEEP_BOX.y) * s) + 'px';
    sheep.style.width = SHEEP_BOX.w * s + 'px';
    sheep.style.height = SHEEP_BOX.h * s + 'px';
  }
  function tapSheep() {
    if (sheep.classList.contains('gone') || feeding) return;
    setSelection([]);
    lastTap = null;
    const now = Date.now();
    sheepTaps = now - sheepLast < SHEEP_GAP_MS ? sheepTaps + 1 : 1;
    sheepLast = now;
    clearTimeout(sheepTimer);
    if (sheepTaps >= SHEEP_POP_TAPS) { popSheep(); return; }
    OS.sound.play('baa', sheepTaps);
    // 每点一下就鼓一点点，像在吹气球
    sheep.style.setProperty('--s', 1 + sheepTaps * 0.045);
    sheep.classList.remove('wobble');
    void sheep.offsetWidth;
    sheep.classList.add('wobble');
    // 停手一会儿，羊慢慢瘪回去，要重新数
    sheepTimer = setTimeout(() => { sheepTaps = 0; sheep.style.setProperty('--s', 1); }, SHEEP_GAP_MS);
  }
  function popSheep() {
    sheepTaps = 0;
    OS.save.set('sheepPops', OS.save.get('sheepPops', 0) + 1);
    OS.bootFix.add('sheep', SHEEP_FIX);
    sheep.classList.remove('wobble');
    sheep.classList.add('inflate');
    sheep.style.setProperty('--s', 1.5);
    setTimeout(() => {
      const x = parseFloat(sheep.style.left), y = parseFloat(sheep.style.top);
      const cx = x + sheep.offsetWidth * 0.45, cy = y + sheep.offsetHeight * 0.4;
      sheep.classList.remove('inflate');
      sheep.classList.add('gone');
      sheep.style.setProperty('--s', 1);
      OS.sound.play('burst');
      burst(cx, cy, sheepScale / 0.4);
      setTimeout(() => OS.ui.notify({
        title: '温馨提示', icon: 'info', timeout: 6500,
        text: '你把羊点炸了。\n但这个彩蛋其实要 2011 年才被发明。'
      }), 700);
      setTimeout(() => D.iconSay('folder2', '老公，下面羊死了'), 2700);
    }, 130);
  }
  // 炸开：一圈白色冲击波 + 一团团羊毛和头、腿飞出去再落下
  function burst(cx, cy, k, kind) {
    const box = el('div', { class: 'burst' });
    iconLayer.appendChild(box);
    const ring = el('div', { class: 'burst-ring' });
    ring.style.left = cx + 'px'; ring.style.top = cy + 'px';
    box.appendChild(ring);
    const bits = [];
    if (kind === 'paper') {   // 回收站：碎纸片 + 桶的碎片
      for (let i = 0; i < 18; i++) bits.push({ cls: 'paperbit', w: (4 + Math.random() * 5) * k, h: (3 + Math.random() * 4) * k });
      for (let i = 0; i < 5; i++) bits.push({ cls: 'binbit', w: (4 + Math.random() * 4) * k, h: (3 + Math.random() * 3) * k });
    } else {
      for (let i = 0; i < 18; i++) bits.push({ cls: 'wool', size: (4 + Math.random() * 6) * k });
      bits.push({ cls: 'dark head', w: 8 * k, h: 7 * k }, { cls: 'dark leg', w: 2 * k, h: 6 * k }, { cls: 'dark leg', w: 2 * k, h: 6 * k });
    }
    bits.forEach(b => {
      const n = el('div', { class: 'bit ' + b.cls });
      n.style.width = (b.w || b.size) + 'px';
      n.style.height = (b.h || b.size) + 'px';
      n.style.left = (cx - (b.w || b.size) / 2) + 'px';
      n.style.top = (cy - (b.h || b.size) / 2) + 'px';
      box.appendChild(n);
      const a = Math.random() * Math.PI * 2, sp = (140 + Math.random() * 200) * k;
      const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp - 120 * k, g = 520 * k;
      const spin = (Math.random() - 0.5) * 900, dur = 0.9 + Math.random() * 0.5;
      const frames = [];
      for (let f = 0; f <= 10; f++) {
        const t = f / 10 * dur, d = (1 - Math.exp(-3 * t)) / 3;
        frames.push({
          transform: 'translate(' + (vx * d).toFixed(1) + 'px,' + (vy * d + 0.5 * g * t * t).toFixed(1) + 'px) rotate(' + (spin * t).toFixed(0) + 'deg)',
          opacity: f < 7 ? 1 : 1 - (f - 6) / 4
        });
      }
      n.animate(frames, { duration: dur * 1000, easing: 'linear', fill: 'forwards' });
    });
    setTimeout(() => box.remove(), 1600);
  }

  // 让桌面图标“说话”：在图标旁边冒个 XP 那种黄色小气泡
  D.iconSay = function (id, text, ms) {
    const ic = icons[id];
    if (!ic || !iconsShown || ic.binned) { OS.ui.notify({ title: ic ? ic.app.name : '', text, icon: 'info', timeout: 4500 }); return; }
    const st = OS.stage;
    const b = el('div', { class: 'say-bubble', text });
    document.getElementById('balloons').appendChild(b);
    const ix = parseFloat(ic.el.style.left) + ICON_W / 2, iy = parseFloat(ic.el.style.top);
    const below = iy - b.offsetHeight - 10 < st.TICKER_H;   // 上面放不下就放到图标下面
    const left = OS.clamp(ix - 22, st.insets.l + 4, st.W - st.insets.r - b.offsetWidth - 4);
    b.style.left = left + 'px';
    b.style.top = (below ? iy + ic.el.offsetHeight + 8 : iy - b.offsetHeight - 8) + 'px';
    b.style.setProperty('--tail', (ix - left) + 'px');
    b.classList.add(below ? 'below' : 'above');
    ic.el.classList.add('shake');
    setTimeout(() => ic.el.classList.remove('shake'), 450);
    OS.sound.play('pop');
    let gone = false;
    const kill = () => { if (gone) return; gone = true; b.classList.add('out'); setTimeout(() => b.remove(), 250); };
    b.addEventListener('click', kill);
    setTimeout(kill, ms || 4500);
  };

  // 重新开机/注销：羊回来，没说完的话收掉（小软件也可以听 desktop:reset 自己复位）
  D.reset = function () {
    feeding = false; feedQueue.length = 0; current = null; leg = null;
    if (meal) { meal.cancel(); meal = null; }
    Object.keys(icons).filter(k => icons[k].app.temp).forEach(k => D.removeFile(k, true));
    poops.splice(0).forEach(n => n.remove());
    if (sheep) { sheep.classList.remove('gone', 'wobble', 'inflate', 'flee', 'busy', 'walking', 'chewing', 'angry'); sheep.style.setProperty('--s', 1); sheep.style.setProperty('--flip', 1); delete sheep.dataset.x; delete sheep.dataset.y; }
    if (sign) { sign.classList.remove('cut', 'wobble'); signTaps = 0; signBusy = false; document.querySelectorAll('.censor-hero, .ws-slash').forEach(n => n.remove()); }
    sheepTaps = 0;
    document.querySelectorAll('.say-bubble').forEach(n => n.remove());
    OS.emit('desktop:reset');
  };


  /* ---------- 桌面上的临时文件 + 羊爱吃纸 ----------
     记事本存到桌面的 txt、右键新建的文本文档：图标冒出来，壁纸上的羊走过去嚼嚼嚼吃掉，原地消化；
     吃的够大（poop 1–3）消化完拉一小堆羊粪，桌面右键「刷新」扫干净。
     羊不在（点炸了 / 被吓跑了）：文件留在桌面能打开，重启后新来的羊吃掉。
     羊去吃的路上 / 嚼到一半，文件被拖走、扔进回收站、又还原或倒出来：羊追着吃；在回收站里就气呼呼地钻进去翻出来吃。 */
  const POOP_FIX = '正在清扫桌面上的羊粪';
  const LEFT_FIX = '新来的羊正在吃掉桌面上的文本文档';
  const BIN_SAY = '翻什么翻！';   // 羊钻进回收站把扔进去的文本文档翻出来吃掉，回收站骂一句
  let fileSeq = 0, feeding = false, meal = null;
  const feedQueue = [], poops = [];
  D.sheepHere = () => !!sheep && !sheep.classList.contains('gone');
  // o: { name, icon, open, menu(id), poop }
  D.addFile = function (o) {
    const id = 'file-' + (++fileSeq);
    const app = OS.apps.register({ id, name: o.name, icon: o.icon || 'txt', desktop: true, singleton: false, temp: true, poop: o.poop || 0, open: o.open, menu: o.menu ? () => o.menu(id) : null });
    addIcon(app);
    const ic = icons[id];
    const f = firstFree(ic);
    ic.col = f[0]; ic.row = f[1];
    position(ic);
    ic.el.classList.add('restored');
    setTimeout(() => ic.el.classList.remove('restored'), 400);
    savePositions();
    feed(id);
    return id;
  };
  // 桌面上（不算回收站里的）有 txt：羊在就排队去吃；羊不在就记一笔，下次开机新来的羊吃
  function feed(id) {
    if (D.sheepHere() && current !== id && !feedQueue.some(j => j.id === id)) { feedQueue.push({ id }); if (!feeding) nextMeal(); }
    syncLeft();
  }
  function syncLeft() {
    const left = Object.keys(icons).some(k => icons[k].app.temp && !icons[k].binned);
    if (left && !D.sheepHere()) OS.bootFix.add('txtLeft', LEFT_FIX); else OS.bootFix.remove('txtLeft');
  }
  // keepFix：重启时清桌面用，别把开机自检要说的那行（新来的羊吃文档）顺手删了
  D.removeFile = function (id, keepFix) {
    const ic = icons[id];
    if (!ic || !ic.app.temp) return;
    const wasBinned = ic.binned;
    const rest = wasBinned ? binList().filter(b => b.id !== id) : null;
    ic.el.remove();
    selected.delete(ic);
    delete icons[id];
    const i = OS.apps.list.indexOf(OS.apps.byId[id]);
    if (i >= 0) OS.apps.list.splice(i, 1);
    delete OS.apps.byId[id];
    savePositions();
    if (wasBinned) saveBin(rest);   // 回收站里的被吃了：回收站跟着变空、窗口里也没了
    if (!keepFix) syncLeft();
  };
  D.hasFile = id => !!icons[id];
  // 桌面上的；inBin = true 只要回收站里的
  D.tempFiles = inBin => Object.keys(icons).filter(k => icons[k].app.temp && !!icons[k].binned === !!inBin).map(k => ({ id: k, name: icons[k].app.name }));

  // 羊往 (x, y)（羊左上角的位置）走：一次最多走 STEP_MS，走完一段再看看文件挪没挪地方（被拖走、扔回收站、又倒出来）
  // 用计时器等走完，不等动画本身（页面切到后台时动画会停，计时器不会卡死）
  const STEP_MS = 600;
  let walkId = 0, leg = null;
  // 羊现在站哪：按这一段走了多久算出来（不看画面，画面卡住时也不会原地打转）
  function posNow() {
    if (leg) {
      const t = Math.min(1, Math.max(0, (Date.now() - leg.start) / leg.dur));
      return { x: leg.fx + (leg.x - leg.fx) * t, y: leg.fy + (leg.y - leg.fy) * t };
    }
    return { x: parseFloat(sheep.style.left), y: parseFloat(sheep.style.top) };
  }
  function walkTo(x, y, fast) {
    const p0 = posNow();   // 从羊现在站的地方出发（走到一半改道也不会瞬移）
    const fx = p0.x, fy = p0.y;
    sheep.style.setProperty('--flip', x > fx ? -1 : 1);   // 羊头朝左画的，往右走就翻过来
    const dist = Math.hypot(x - fx, y - fy);
    let dur = Math.max(300, dist * (fast ? 5 : 9));
    if (dur > STEP_MS) { const k = STEP_MS / dur; x = fx + (x - fx) * k; y = fy + (y - fy) * k; dur = STEP_MS; }
    if (meal) meal.cancel();
    meal = sheep.animate([{ left: fx + 'px', top: fy + 'px' }, { left: x + 'px', top: y + 'px' }],
      { duration: dur, easing: 'steps(' + Math.max(3, Math.round(dur / 120)) + ')', fill: 'forwards' });
    sheep.dataset.x = x; sheep.dataset.y = y;
    leg = { fx, fy, x, y, start: Date.now(), dur };
    sheep.classList.add('walking');
    const my = ++walkId;
    return pause(dur).then(() => { if (my === walkId) sheep.classList.remove('walking'); });
  }
  const pause = ms => new Promise(r => setTimeout(r, ms));
  // 文件现在在哪：桌面上（它自己的图标）／ 回收站里（回收站图标）／ 没了
  function whereIs(id) {
    const ic = icons[id];
    if (!ic) return null;
    if (!ic.binned) return { inBin: false, el: ic.el };
    const bin = icons.recycle;
    return bin && !bin.binned ? { inBin: true, el: bin.el } : null;
  }
  // 羊该站哪：图标在羊左边就站图标右边（羊头朝左），反过来站左边
  function spotFor(w) {
    const ix = parseFloat(w.el.style.left), iy = parseFloat(w.el.style.top);
    const sw = sheep.offsetWidth, sh = sheep.offsetHeight;
    const nowX = sheep.dataset.x != null ? parseFloat(sheep.dataset.x) : parseFloat(sheep.style.left);
    const right = ix + ICON_W / 2 < nowX + sw / 2;
    return { x: right ? ix + ICON_W / 2 + 4 : ix + ICON_W / 2 - sw - 4, y: iy + 22 - sh * 0.55, ix, iy };
  }
  const arrived = s => sheep.dataset.x != null && Math.abs(parseFloat(sheep.dataset.x) - s.x) < 3 && Math.abs(parseFloat(sheep.dataset.y) - s.y) < 3;
  let current = null;
  async function nextMeal() {
    const job = feedQueue.shift();
    if (!job) { feeding = false; current = null; sheep.classList.remove('angry'); return goHome(); }
    feeding = true;
    current = job.id;
    sheep.classList.add('busy');
    // 追：文件挪到哪追到哪；回收站里也翻出来吃（生气）
    for (let round = 0; round < 80; round++) {
      const w = whereIs(job.id);
      if (!w) return nextMeal();
      sheep.classList.toggle('angry', w.inBin);
      const s = spotFor(w);
      if (!arrived(s)) {
        await walkTo(s.x, s.y, w.inBin);
        if (!D.sheepHere()) return stopMeals();
        continue;
      }
      const moved = await chew(job.id, w, s);
      if (!D.sheepHere()) return stopMeals();
      if (moved) continue;
      const poop = icons[job.id] ? icons[job.id].app.poop : 0;
      D.removeFile(job.id);
      // 消化一下；在回收站里翻着吃的，回收站骂一句
      if (w.inBin) setTimeout(() => D.iconSay('recycle', BIN_SAY, 2500), 300);
      await pause(500);
      sheep.classList.remove('wobble'); void sheep.offsetWidth; sheep.classList.add('wobble');
      OS.sound.play('baa', w.inBin ? 6 : 2);
      await pause(700);
      if (!D.sheepHere()) return stopMeals();
      sheep.classList.remove('angry');
      if (poop) {
        // 在屁股后面拉一小堆
        const flip = parseFloat(sheep.style.getPropertyValue('--flip')) || 1;
        const sw = sheep.offsetWidth, sh = sheep.offsetHeight;
        dropPoop(flip > 0 ? s.x + sw * 0.82 : s.x - sw * 0.1, s.y + sh * 0.62, poop);
        await pause(500);
      }
      return nextMeal();
    }
    nextMeal();   // 追了半天也追不上：算了
  }
  // 嚼三口：桌面上的图标一口比一口小、掉纸屑；回收站里的就翻得回收站直晃。
  // 嚼着嚼着文件被挪走了（拖走、扔回收站、还原、倒出来）：返回 true，接着追
  async function chew(id, w, s) {
    const ic = icons[id];
    const img = w.inBin ? null : ic.el.querySelector('.di-img'), label = w.inBin ? null : ic.el.querySelector('.di-label');
    const undo = () => { if (img) img.style.transform = ''; if (label) label.style.opacity = ''; sheep.classList.remove('chewing'); };
    sheep.classList.add('chewing');
    for (let bite = 1; bite <= 3; bite++) {
      OS.sound.play('munch');
      if (w.inBin) { const bin = w.el; bin.classList.remove('shake'); void bin.offsetWidth; bin.classList.add('shake'); }
      else {
        const k = 1 - bite / 3;
        img.style.transform = 'scale(' + k.toFixed(2) + ')';
        if (label) label.style.opacity = k.toFixed(2);
      }
      crumbs(s.ix + ICON_W / 2, s.iy + 18);
      await pause(380);
      if (!D.sheepHere()) { undo(); return true; }
      const now = whereIs(id);
      if (!now || now.inBin !== w.inBin || parseFloat(now.el.style.left) !== s.ix || parseFloat(now.el.style.top) !== s.iy) { undo(); return true; }
    }
    sheep.classList.remove('chewing');
    return false;
  }
  function goHome() {
    sheep.classList.remove('busy', 'chewing', 'angry');
    if (sheep.dataset.x == null) return;
    const hx = parseFloat(sheep.style.left), hy = parseFloat(sheep.style.top);
    (async () => {
      // 回家也是一段一段走（中途来了新文件就去吃新的）
      for (let i = 0; i < 40 && !feeding && !arrived({ x: hx, y: hy }); i++) await walkTo(hx, hy);
      if (feeding) return;
      if (meal) { meal.cancel(); meal = null; }
      leg = null;
      delete sheep.dataset.x; delete sheep.dataset.y;
      sheep.style.setProperty('--flip', 1);
    })();
  }
  // 吃到一半羊没了（被剑士吓跑）：剩下的文件留在桌面
  function stopMeals() {
    feeding = false;
    current = null;
    feedQueue.length = 0;
    sheep.classList.remove('busy', 'chewing', 'walking', 'angry');
    Object.keys(icons).forEach(k => {
      const ic = icons[k];
      if (!ic.app.temp) return;
      const img = ic.el.querySelector('.di-img'), label = ic.el.querySelector('.di-label');
      img.style.transform = ''; if (label) label.style.opacity = '';
    });
    syncLeft();
  }
  function crumbs(cx, cy) {
    for (let i = 0; i < 3; i++) {
      const n = el('div', { class: 'bit paperbit' });
      const w = 2 + Math.random() * 3;
      n.style.width = w + 'px'; n.style.height = (w * 0.8) + 'px';
      n.style.left = (cx - 6 + Math.random() * 12) + 'px'; n.style.top = cy + 'px';
      iconLayer.appendChild(n);
      const dx = (Math.random() - 0.5) * 24, dy = 14 + Math.random() * 12;
      n.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(200deg)', opacity: 0 }],
        { duration: 600, easing: 'ease-in', fill: 'forwards' });
      setTimeout(() => n.remove(), 650);
    }
  }
  // 羊粪：一小堆棕色小球，越大一堆颗数越多
  const POOP_N = [0, 3, 5, 8];
  function dropPoop(x, y, level) {
    const n = POOP_N[Math.min(3, level)] || 3;
    let dots = '';
    for (let i = 0; i < n; i++) {
      const row = i < 4 ? 0 : i < 7 ? 1 : 2, inRow = i < 4 ? i : i < 7 ? i - 4 : 0;
      const cx = 6 + inRow * 7 + row * 3.5, cy = 16 - row * 5;
      dots += '<circle cx="' + cx + '" cy="' + cy + '" r="3.2" fill="#5a3a1a"/><circle cx="' + (cx - 1) + '" cy="' + (cy - 1.2) + '" r="1" fill="#8a6038"/>';
    }
    const node = el('div', { class: 'poop', html: '<svg viewBox="0 0 34 20" xmlns="http://www.w3.org/2000/svg">' + dots + '</svg>' });
    const k = Math.max(0.6, (sheep.offsetWidth || 26) / 26);
    node.style.left = x + 'px'; node.style.top = y + 'px';
    node.style.width = (17 * k) + 'px'; node.style.height = (10 * k) + 'px';
    node.addEventListener('pointerdown', e => e.stopPropagation());
    node.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('squish'); node.classList.remove('squish'); void node.offsetWidth; node.classList.add('squish'); });
    iconLayer.appendChild(node);
    poops.push(node);
    OS.sound.play('poop');
    OS.bootFix.add('poop', POOP_FIX);
  }
  function cleanPoops() {
    if (!poops.length) return;
    poops.splice(0).forEach(n => n.remove());
    OS.bootFix.remove('poop');
  }

  /* ---------- 给小软件用：图标在哪、把图标踢飞 ---------- */
  D.layer = () => iconLayer;
  D.iconBox = function (id) {
    const ic = icons[id];
    if (!ic || !iconsShown || ic.binned) return null;
    return { x: parseFloat(ic.el.style.left), y: parseFloat(ic.el.style.top), w: ICON_W, h: ic.el.offsetHeight };
  };
  // 把一个图标踢到随便一个空格子里（飞过去还转一圈）
  D.kick = function (id) {
    const ic = icons[id];
    if (!ic || !iconsShown || ic.binned) return false;
    const free = [];
    for (let c = 0; c < grid.cols; c++) for (let r = 0; r < grid.rows; r++) if (valid(c, r) && !occupant(c, r)) free.push([c, r]);
    if (!free.length) return false;
    const f = OS.pick(free);
    ic.col = f[0]; ic.row = f[1];
    ic.el.classList.remove('kicked');
    void ic.el.offsetWidth;
    ic.el.classList.add('kicked');
    position(ic);
    setTimeout(() => ic.el.classList.remove('kicked'), 650);
    savePositions();
    return true;
  };
  D.ids = () => Object.keys(icons).filter(id => !icons[id].binned);

  /* ---------- 回收站：图标塞进去（藏起来、空出格子），再从里面出来 ----------
     存档 recycleBin = [{ id, col, row, at }]，col/row 是塞进去之前的位置 */
  // 只算桌面上的程序（后来收进文件夹里的，比如暴富秘籍、欠条，就算旧存档里还在回收站，也不算数）
  const binList = () => OS.save.get('recycleBin', []).filter(b => OS.apps.byId[b.id] && OS.apps.byId[b.id].desktop);
  const saveBin = list => { OS.save.set('recycleBin', list); OS.emit('recycle:change', list); };
  D.binList = () => binList().slice();
  D.toBin = function (id) {
    const ic = icons[id];
    if (!ic || ic.binned) return false;
    const list = binList().filter(b => b.id !== id);
    list.push({ id, col: ic.col, row: ic.row, at: Date.now() });
    ic.binned = true;
    ic.col = -1; ic.row = -1;
    ic.el.classList.add('binned');
    ic.el.classList.remove('sel', 'cut');
    selected.delete(ic);
    savePositions();
    saveBin(list);
    if (ic.app.temp) syncLeft();
    return true;
  };
  // 从回收站出来：from = 从哪儿飞出来（画面坐标）；home = 回原位（被占了就找最近的空格），否则随便找个空格
  D.fromBin = function (id, o) {
    o = o || {};
    const ic = icons[id];
    if (!ic || !ic.binned) return false;
    const entry = binList().find(b => b.id === id) || {};
    let cell = null;
    if (o.home && entry.col != null && entry.col >= 0) {
      cell = valid(entry.col, entry.row) && !occupant(entry.col, entry.row) ? [entry.col, entry.row] : nearestFree(entry.col, entry.row);
    } else {
      const free = [];
      for (let c = 0; c < grid.cols; c++) for (let r = 0; r < grid.rows; r++) if (valid(c, r) && !occupant(c, r)) free.push([c, r]);
      cell = free.length ? OS.pick(free) : firstFree(ic);
    }
    ic.binned = false;
    ic.el.classList.remove('binned');
    ic.col = cell[0]; ic.row = cell[1];
    if (o.from) {
      ic.el.style.left = (o.from.x - ICON_W / 2) + 'px';
      ic.el.style.top = (o.from.y - 20) + 'px';
      void ic.el.offsetWidth;
    }
    const cls = o.spin ? 'kicked' : 'restored';
    ic.el.classList.add(cls);
    position(ic);
    setTimeout(() => ic.el.classList.remove(cls), 650);
    savePositions();
    saveBin(binList().filter(b => b.id !== id));
    if (ic.app.temp) setTimeout(() => { if (icons[id] && !icons[id].binned) feed(id); }, 450);   // txt 回到桌面：羊照吃
    return true;
  };
  // 给回收站自己的动画用：拿到图标、换图、放回自己的格子、原地炸开
  D.iconNode = id => (icons[id] ? icons[id].el : null);
  D.setIcon = function (id, name) {
    const img = icons[id] && icons[id].el.querySelector('.di-img');
    if (img) img.innerHTML = OS.icon(name);
  };
  D.placeIcon = id => { if (icons[id] && !icons[id].binned) position(icons[id]); };
  D.burstAt = (cx, cy, k, kind) => burst(cx, cy, k, kind);

  function addIcon(app) {
    const node = el('div', { class: 'dicon', 'data-app': app.id }, [
      OS.iconEl(app.icon, 'di-img'),
      el('div', { class: 'di-label', text: app.name })
    ]);
    const ic = { app, el: node, col: -1, row: -1, binned: binList().some(b => b.id === app.id) };
    if (ic.binned) node.classList.add('binned');
    icons[app.id] = ic;
    iconLayer.appendChild(node);
    bindIcon(ic);
    OS.ui.onContext(node, () => {
      if (!selected.has(ic)) setSelection([ic]);
      lastTap = null;
      return OS.menus.icon(app);
    });
  }

  /* ---------- 网格 ---------- */
  function computeGrid() {
    const st = OS.stage;
    const ox = st.iconOrigin.x, oy = st.iconOrigin.y;
    grid = {
      ox, oy,
      cols: Math.max(1, Math.floor((st.W - st.insets.r - ox) / CELL_W)),
      rows: Math.max(1, Math.floor((st.H - st.TASKBAR_H - oy - 2) / CELL_H))
    };
  }
  function cellRect(c, r) { return { x: grid.ox + c * CELL_W, y: grid.oy + r * CELL_H, w: CELL_W, h: CELL_H }; }
  // B站按钮正下方的格子不放图标（放了也点不到）
  function blocked(c, r) {
    const cap = OS.stage.capsule;
    if (!cap) return false;
    const a = cellRect(c, r);
    return !(a.x + a.w <= cap.x || a.x >= cap.x + cap.w || a.y + a.h <= cap.y || a.y >= cap.y + cap.h);
  }
  function valid(c, r) { return c >= 0 && r >= 0 && c < grid.cols && r < grid.rows && !blocked(c, r); }
  function occupant(c, r, except) {
    for (const id in icons) {
      const ic = icons[id];
      if (ic !== except && ic.col === c && ic.row === r) return ic;
    }
    return null;
  }
  function firstFree(except) {
    for (let c = 0; c < grid.cols; c++) for (let r = 0; r < grid.rows; r++) {
      if (valid(c, r) && !occupant(c, r, except)) return [c, r];
    }
    return [0, 0];
  }
  function nearestFree(tc, tr) {
    let best = null, bestD = Infinity;
    for (let c = 0; c < grid.cols; c++) for (let r = 0; r < grid.rows; r++) {
      if (!valid(c, r) || occupant(c, r)) continue;
      const dx = (c - tc) * CELL_W, dy = (r - tr) * CELL_H, d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = [c, r]; }
    }
    return best || [tc, tr];
  }

  function relayout() {
    computeGrid();
    const saved = OS.save.get('iconPos', {});
    Object.keys(icons).forEach(id => { icons[id].col = -1; icons[id].row = -1; });
    OS.apps.list.forEach(a => {
      const ic = icons[a.id], p = saved[a.id];
      if (ic && !ic.binned && p && valid(p[0], p[1]) && !occupant(p[0], p[1], ic)) { ic.col = p[0]; ic.row = p[1]; }
    });
    OS.apps.list.forEach(a => {
      const ic = icons[a.id];
      if (!ic || ic.binned || ic.col >= 0) return;
      const f = firstFree(ic); ic.col = f[0]; ic.row = f[1];
    });
    Object.keys(icons).forEach(id => { if (!icons[id].binned) position(icons[id]); });
    placeClouds();
    placeSign();
    placeSheep();
    const st = OS.stage;
    watermark.style.right = (st.insets.r + 8) + 'px';
    watermark.style.bottom = (st.TASKBAR_H + 6) + 'px';
  }

  function position(ic) {
    const r = cellRect(ic.col, ic.row);
    ic.el.style.left = (r.x + (CELL_W - ICON_W) / 2) + 'px';
    ic.el.style.top = r.y + 'px';
  }
  function settle(ic) {
    ic.el.classList.add('settle');
    position(ic);
    setTimeout(() => ic.el.classList.remove('settle'), 220);
  }
  function savePositions() {
    const out = {};
    Object.keys(icons).forEach(id => { out[id] = [icons[id].col, icons[id].row]; });
    OS.save.set('iconPos', out);
  }

  /* ---------- 选中 ---------- */
  let selected = new Set();
  function setSelection(list) {
    selected.forEach(ic => ic.el.classList.remove('sel'));
    selected = new Set(list);
    selected.forEach(ic => ic.el.classList.add('sel'));
  }
  D.clearSelection = () => setSelection([]);

  // 在空白处按住拖：拉出选框
  function bindBand() {
    iconLayer.addEventListener('pointerdown', e => {
      if (e.target !== iconLayer) return;
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      setSelection([]);
      lastTap = null;
      OS.emit('desktop:tap');
      const start = OS.stage.toLocal(e.clientX, e.clientY);
      let box = null;
      try { iconLayer.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      const move = ev => {
        if (OS.ui.longPressed(ev.pointerId)) { if (box) { box.remove(); box = null; } return; }
        const p = OS.stage.toLocal(ev.clientX, ev.clientY);
        const x = Math.min(p.x, start.x), y = Math.min(p.y, start.y);
        const w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y);
        if (!box) {
          if (w * w + h * h < 25) return;
          box = el('div', { class: 'selbox' });
          iconLayer.appendChild(box);
        }
        box.style.left = x + 'px'; box.style.top = y + 'px';
        box.style.width = w + 'px'; box.style.height = h + 'px';
        const hit = [];
        for (const id in icons) {
          const ic = icons[id];
          if (ic.binned) continue;
          const ix = parseFloat(ic.el.style.left), iy = parseFloat(ic.el.style.top);
          if (ix < x + w && ix + ic.el.offsetWidth > x && iy < y + h && iy + ic.el.offsetHeight > y) hit.push(ic);
        }
        setSelection(hit);
      };
      const up = () => {
        iconLayer.removeEventListener('pointermove', move);
        iconLayer.removeEventListener('pointerup', up);
        iconLayer.removeEventListener('pointercancel', up);
        if (box) box.remove();
        else cloudAt(start);   // 没拉选框 = 点了一下：点在云上就让云晃一晃
      };
      iconLayer.addEventListener('pointermove', move);
      iconLayer.addEventListener('pointerup', up);
      iconLayer.addEventListener('pointercancel', up);
    });
  }

  // 双击（连点两下）才打开
  let lastTap = null;
  function handleTap(ic) {
    const now = Date.now();
    if (lastTap && lastTap.ic === ic && now - lastTap.t < DOUBLE_TAP_MS) {
      lastTap = null;
      OS.sound.play('click');
      OS.apps.open(ic.app.id);
    } else {
      lastTap = { ic, t: now };
    }
  }

  // 拖到哪个“收东西”的图标上（比如回收站）
  function dropTarget(x, y) {
    for (const id in icons) {
      const o = icons[id];
      if (selected.has(o) || !o.app.acceptsDrop || o.binned) continue;
      const r = cellRect(o.col, o.row);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return o;
    }
    return null;
  }

  /* ---------- 按住图标：拖动（选中的一起拖） ---------- */
  function bindIcon(ic) {
    const n = ic.el;
    n.addEventListener('pointerdown', e => {
      if (e.button != null && e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      if (!selected.has(ic)) setSelection([ic]);
      const group = Array.from(selected);
      const orig = new Map(group.map(g => [g, { x: parseFloat(g.el.style.left), y: parseFloat(g.el.style.top) }]));
      const start = OS.stage.toLocal(e.clientX, e.clientY);
      let drag = false, hot = null, dx = 0, dy = 0;
      try { n.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }

      const move = ev => {
        if (OS.ui.longPressed(ev.pointerId) && !drag) return; // 长按出了菜单，就不拖了
        const p = OS.stage.toLocal(ev.clientX, ev.clientY);
        dx = p.x - start.x; dy = p.y - start.y;
        if (!drag && dx * dx + dy * dy > 64) {
          drag = true;
          lastTap = null;
          group.forEach(g => g.el.classList.add('dragging'));
        }
        if (!drag) return;
        group.forEach(g => {
          const o = orig.get(g);
          g.el.style.left = (o.x + dx) + 'px';
          g.el.style.top = (o.y + dy) + 'px';
        });
        const me = orig.get(ic);
        const t = dropTarget(me.x + dx + ICON_W / 2, me.y + dy + 20);
        if (t !== hot) {
          if (hot) hot.el.classList.remove('drop-hot');
          hot = t;
          if (hot) hot.el.classList.add('drop-hot');
        }
      };

      const up = ev => {
        n.removeEventListener('pointermove', move);
        n.removeEventListener('pointerup', up);
        n.removeEventListener('pointercancel', up);
        group.forEach(g => g.el.classList.remove('dragging'));
        if (hot) hot.el.classList.remove('drop-hot');

        if (!drag) {
          if (OS.ui.longPressed(ev.pointerId)) { lastTap = null; return; }
          if (ev.type === 'pointerup') {
            if (selected.size > 1) setSelection([ic]);
            handleTap(ic);
          }
          return;
        }

        // 扔到回收站上：先弹回原位，发个通知
        if (hot) {
          const target = hot;
          group.forEach(settle);
          target.el.classList.add('shake');
          setTimeout(() => target.el.classList.remove('shake'), 450);
          group.forEach(g => OS.emit('icon:drop', { app: g.app, target: target.app }));
          return;
        }

        // 放到格子上：整组平移，放不下的就近找空格
        const me = orig.get(ic);
        const c0 = OS.clamp(Math.floor((me.x + dx + ICON_W / 2 - grid.ox) / CELL_W), 0, grid.cols - 1);
        const r0 = OS.clamp(Math.floor((me.y + dy + 20 - grid.oy) / CELL_H), 0, grid.rows - 1);
        const dc = c0 - ic.col, dr = r0 - ic.row;
        const homes = new Map(group.map(g => [g, [g.col, g.row]]));
        group.forEach(g => { g.col = -1; g.row = -1; });
        [ic].concat(group.filter(g => g !== ic)).forEach(g => {
          const h = homes.get(g);
          let tc = OS.clamp(h[0] + dc, 0, grid.cols - 1);
          let tr = OS.clamp(h[1] + dr, 0, grid.rows - 1);
          if (!valid(tc, tr) || occupant(tc, tr)) { const f = nearestFree(tc, tr); tc = f[0]; tr = f[1]; }
          g.col = tc; g.row = tr;
        });
        group.forEach(settle);
        savePositions();
      };
      n.addEventListener('pointermove', move);
      n.addEventListener('pointerup', up);
      n.addEventListener('pointercancel', up);
    });
  }
})();
