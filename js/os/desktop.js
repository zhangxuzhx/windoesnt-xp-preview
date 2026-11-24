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

  // 壁纸、云、木牌、羊都是 Codex 画的（assets/scene/）。坐标一律按 1600×900 的壁纸算；画面是 4:3，左右各裁掉 200
  const SCENE = 'assets/scene/';
  const SCENE_V = '?v=3';   // 换了图就改这个号，玩过的人浏览器里存的旧图才会换掉（2：壁纸和云换成写实风景照；3：木牌和羊也换成写实的）。os.css 里羊、木牌、碎片的链接也跟着改
  const WALLPAPER = '<img id="wallpaper" src="' + SCENE + 'wallpaper.webp' + SCENE_V + '" alt="" draggable="false">';
  const preload = src => { const im = new Image(); im.src = SCENE + src + SCENE_V; return im; };
  const IMG = { wall: preload('wallpaper.webp'), sign: preload('sign.webp'), sheep: preload('sheep.webp') };

  // 天上的云单独画（要能点、能抖）：左上角坐标 + 大小
  const CLOUDS = [
    { src: 'cloud-1.webp', x: 70, y: 115, w: 500, h: 150 },
    { src: 'cloud-2.webp', x: 790, y: 85, w: 560, h: 140 },
    { src: 'cloud-3.webp', x: 580, y: 270, w: 360, h: 90 },
    { src: 'cloud-4.webp', x: 1300, y: 305, w: 300, h: 80 }
  ];

  // 草坡上的“此处无木牌”单独画（要能点、能抖、能被砍断）：两根桩子落地的中点在 (1110, 626)
  // sign.webp 三格：完整的 ／ 劈开的左半块 ／ 右半块（三格叠起来对得上）
  const SIGN_AT = { x: 1110, y: 626 }, SIGN_BOX = { x: -78, y: -119, w: 156, h: 122 };

  // 草坡上的羊单独画（要能点、能晃、能炸、能走、能吃）：脚踩在 (1300, 700)
  // sheep.webp 一格 160×120，脚底在格子 (80, 116)；画得比 Codex 建议的稍大一点，跟原来的羊一样大
  const SHEEP_AT = { x: 1300, y: 700 }, SHEEP_BOX = { x: -46, y: -66.7, w: 92, h: 69 };
  // 写字板插的羊、画图补的羊：站着那一格
  const SHEEP_HTML = '<i class="sheep-pic"></i>';

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
    OS.ui.onContext(iconLayer, () => (shellOn ? OS.menus.desktop() : null));   // explorer.exe 被结束了：桌面右键没反应
    initClouds();
    initSign();
    initSheep();
    links.forEach(regLink);   // 玩家自己加的快捷方式先登记上（存档 deskLinks）
    // 2026-11-24 解放桌面：卸掉的程序快捷方式照样摆（图没了、只剩箭头）；彻底删除了的、藏起来的系统图标不摆
    OS.apps.list.filter(a => a.desktop && gone().indexOf(a.id) < 0 && hidden().indexOf(a.id) < 0).forEach(addIcon);
    OS.on('soft:change', paintAll);
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

  // 刷新（2026-11-23 改，刷新-创意.md）：不闪图标了——桌面脏了来环卫大爷收拾，干净了来刷墙师傅刷绿漆（workers.js）
  D.refresh = function () {
    if (OS.workers) OS.workers.refresh(); else cleanPoops();
    OS.emit('desktop:refresh');
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
  // 四朵云各说各的（顺序跟 CLOUDS 一样）；没写的就说上面那段
  const CLOUD_SAYS = [
    CLOUD_SAY,
    '世界上最遥远的距离，不是生与死，\n而是我就飘在你的桌面壁纸上，你却只顾着双击我的电脑。\n宠辱不惊，闲看庭前花开花落；\n去留无意，漫随天外云卷云舒。\n其实云是没有方向的，风往哪里吹，它就往哪里走，\n就像列表里有些人的头像，灰着灰着，就再也没亮起来过。',
    '鱼对水说：你看不到我的眼泪，因为我在水里。\n水说：我能感觉到你的眼泪，因为你在我心里。\n云对风说：你看不到我的悲伤，因为我在飘荡。\n风说：我能感觉到你的悲伤，因为你在我怀里。',
    '蓝蓝的天上白云飘，\n绿绿的草地上养着两头小猪，\n一头小猪正抬头看着天上的白云发呆，\n另一头小猪正瞪着大眼睛盯屏幕看这段话呢！'
  ];
  let clouds = [], cloudTaps = 0, cloudLast = 0, cloudLastNode = null;

  function initClouds() {
    clouds = CLOUDS.map(c => {
      const img = el('img', { src: SCENE + c.src + SCENE_V, alt: '', draggable: 'false' });
      const node = el('div', { class: 'wpcloud' }, [img]);
      node.box = c;
      node.img = img;
      // 记下每个点透不透明：点到云的实心部分才算点中
      const read = () => {
        try {
          const cv = el('canvas'); cv.width = c.w; cv.height = c.h;
          const g = cv.getContext('2d'); g.drawImage(img, 0, 0, c.w, c.h);
          node.alpha = g.getImageData(0, 0, c.w, c.h).data;
        } catch (_) { node.alpha = null; }
      };
      if (img.complete && img.naturalWidth) read(); else img.addEventListener('load', read);
      iconLayer.appendChild(node);
      return node;   // 云本身不接点击（不然天上拉不了选框），点空白处时再看点没点在云上，见 cloudAt
    });
  }
  function onCloud(n, wx, wy) {
    const b = n.box, lx = Math.floor(wx - b.x), ly = Math.floor(wy - b.y);
    if (lx < 0 || ly < 0 || lx >= b.w || ly >= b.h) return false;
    if (n.alpha) return n.alpha[(ly * b.w + lx) * 4 + 3] > 90;
    return ((lx - b.w / 2) / (b.w / 2)) ** 2 + ((ly - b.h / 2) / (b.h / 2)) ** 2 <= 0.6;   // 图还没读出来：按椭圆算
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
    const hit = clouds.find(n => onCloud(n, wx, wy));
    if (hit) tapCloud(hit);
  }
  function tapCloud(node) {
    setSelection([]);
    lastTap = null;
    node.classList.remove('wobble'); void node.offsetWidth; node.classList.add('wobble');
    OS.sound.play('pop');
    const now = Date.now();
    // 连着点同一朵云才算；换一朵重新数
    cloudTaps = now - cloudLast < CLOUD_GAP_MS && node === cloudLastNode ? cloudTaps + 1 : 1;
    cloudLast = now; cloudLastNode = node;
    if (cloudTaps >= CLOUD_TAPS) {
      cloudTaps = 0;
      const text = CLOUD_SAYS[clouds.indexOf(node)] || CLOUD_SAY;
      OS.ui.notify({ title: CLOUD_TITLE, text, icon: 'info', replace: true, timeout: Math.max(16000, text.length * 130), wide: true });
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
    const piece = cls => el('div', { class: 'ws-piece ' + cls });
    OS.save.remove('signCut');   // 旧版本存过“木牌断了”，现在开机就修好，不用了
    sign = el('div', { class: 'wpsign' }, [piece('ws-whole'), piece('ws-l'), piece('ws-r')]);
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
    sheep.classList.remove('wobble', 'inflate', 'puffed');
    sheep.classList.add('flee');
    OS.bootFix.add('sheep', SHEEP_FIX);
    OS.sound.play('baa', 9);
    setTimeout(() => { sheep.classList.remove('flee'); sheep.classList.add('gone'); }, 1500);
  }

  /* ---------- 壁纸上的羊：点一下晃一下，连点 9 下像气球一样炸掉 ---------- */
  const SHEEP_POP_TAPS = 9, SHEEP_PUFF_TAPS = 5, SHEEP_GAP_MS = 1200;
  // 只停一下的动作（有点鼓、愣住、吃饱了、蹲下拉粪），收尾时一起清掉
  const POSES = ['puffed', 'stunned', 'full', 'squat'];
  let sheep, sheepTaps = 0, sheepLast = 0, sheepTimer = 0, sheepScale = 0.4;

  function initSheep() {
    // 换动作 = 给 .sheep 加不同的 class，CSS 换 sheep.webp 里的格子（os.css「壁纸上的羊」）
    sheep = el('div', { class: 'sheep' }, [el('i', { class: 'sheep-img' })]);
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
    sheep.classList.toggle('puffed', sheepTaps >= SHEEP_PUFF_TAPS);   // 点到第 5 下：换成"有点鼓"那一格
    sheep.classList.remove('wobble');
    void sheep.offsetWidth;
    sheep.classList.add('wobble');
    // 停手一会儿，羊慢慢瘪回去，要重新数
    sheepTimer = setTimeout(() => { sheepTaps = 0; sheep.style.setProperty('--s', 1); sheep.classList.remove('puffed'); }, SHEEP_GAP_MS);
  }
  function popSheep() {
    sheepTaps = 0;
    OS.save.set('sheepPops', OS.save.get('sheepPops', 0) + 1);
    OS.bootFix.add('sheep', SHEEP_FIX);
    sheep.classList.remove('wobble', 'puffed');
    sheep.classList.add('inflate');   // "鼓成球"那一格，再胀一下就炸
    sheep.style.setProperty('--s', 1.5);
    setTimeout(() => {
      const x = parseFloat(sheep.style.left), y = parseFloat(sheep.style.top);
      const cx = x + sheep.offsetWidth * 0.52, cy = y + sheep.offsetHeight * 0.55;
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
    }, 280);
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
      // sheep-bits.webp：0–2 三种羊毛团、3 羊头、4 羊腿
      for (let i = 0; i < 18; i++) bits.push({ cls: 'sb', cell: i % 3, size: (7 + Math.random() * 7) * k });
      bits.push({ cls: 'sb', cell: 3, size: 13 * k }, { cls: 'sb', cell: 4, size: 10 * k }, { cls: 'sb', cell: 4, size: 10 * k });
    }
    bits.forEach(b => {
      const n = el('div', { class: 'bit ' + b.cls });
      if (b.cell != null) n.style.backgroundPosition = (b.cell * 100 / 7) + '% 0';
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
    if (sheep) { sheep.classList.remove('gone', 'wobble', 'inflate', 'flee', 'busy', 'walking', 'chewing', 'angry', ...POSES); sheep.style.setProperty('--s', 1); sheep.style.setProperty('--flip', 1); delete sheep.dataset.x; delete sheep.dataset.y; }
    if (sign) { sign.classList.remove('cut', 'wobble', 'taken'); signTaps = 0; signBusy = false; document.querySelectorAll('.censor-hero, .ws-slash').forEach(n => n.remove()); }
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
  // 环卫大爷：砍断的木牌还在不在、木牌脚底在哪（舞台坐标）、扛走（重启才回来，开机自检那行跟砍断时同一个）
  D.signCut = () => !!sign && sign.classList.contains('cut') && !sign.classList.contains('taken');
  D.signFoot = () => { const w = root.offsetWidth, h = root.offsetHeight, s = Math.max(w / 1600, h / 900); return { x: (w - 1600 * s) / 2 + SIGN_AT.x * s, y: (h - 900 * s) / 2 + SIGN_AT.y * s }; };
  D.takeSign = () => { if (sign) sign.classList.add('taken'); };
  D.sheepHere = () => !!sheep && !sheep.classList.contains('gone');
  // 瑞鑫的豹哥追羊：羊现在在哪（舞台坐标）、把它吓跑（跟木牌被劈那次一样，重启才回来）
  D.sheepRect = () => (D.sheepHere() ? { x: parseFloat(sheep.style.left), y: parseFloat(sheep.style.top), w: parseFloat(sheep.style.width), h: parseFloat(sheep.style.height) } : null);
  D.scareSheep = () => scareSheep();

  /* ---------- 给任务管理器用：sheep.exe ---------- */
  let sheepAte = 0, sheepSpeed = 1;   // 这次开机吃了几个文件；走路快慢（优先级：实时 2.5 ／ 标准 1 ／ 低 0.4）
  D.sheepInfo = () => ({ here: D.sheepHere(), busy: !!sheep && /\b(walking|chewing|busy)\b/.test(sheep.className), ate: sheepAte });
  // 结束 sheep.exe：羊原地消失（重启才有新羊）
  D.killSheep = function () {
    if (!D.sheepHere()) return;
    clearTimeout(sheepTimer);
    sheepTaps = 0;
    sheep.classList.remove('wobble', 'inflate', 'flee', ...POSES);
    sheep.classList.add('gone');
    OS.bootFix.add('sheep', SHEEP_FIX);
  };
  D.setSheepSpeed = function (k) {
    sheepSpeed = k || 1;
    if (sheep) { sheep.style.setProperty('--spd', sheepSpeed); sheep.classList.remove('wobble'); void sheep.offsetWidth; sheep.classList.add('wobble'); }
  };
  OS.on('desktop:reset', () => { sheepAte = 0; D.setSheepSpeed(1); D.setShell(true); });

  /* ---------- 给任务管理器用：explorer.exe 被结束 → 桌面图标、任务栏、开始菜单全没了 ---------- */
  let shellOn = true;
  D.shellOn = () => shellOn;
  D.setShell = function (on) {
    shellOn = !!on;
    if (iconLayer) iconLayer.classList.toggle('no-shell', !shellOn);
    const bar = document.getElementById('taskbar');
    if (bar) bar.style.display = shellOn ? '' : 'none';
    if (!shellOn) { OS.taskbar.toggleMenu(false); setSelection([]); }
  };

  D.sheepHtml = SHEEP_HTML;   // 写字板 ▸ 插入 ▸ 对象 ▸ 羊
  D.sheepPic = { img: IMG.sheep, w: 160, h: 120 };   // 画图 ▸ 智能补全：sheep.webp 第一格（站着）
  // 我的电脑 ▸ 草坡和羊.bmp：把现在的桌面画下来（羊、木牌在不在跟桌面一样）
  D.drawScene = function (g, w, h) {
    const kx = w / 1600, ky = h / 900;
    const put = (im, sx, sw, sh, x, y, bw, bh) => { if (im.complete && im.naturalWidth) g.drawImage(im, sx, 0, sw, sh, x * kx, y * ky, bw * kx, bh * ky); };
    if (IMG.wall.complete && IMG.wall.naturalWidth) g.drawImage(IMG.wall, 0, 0, w, h);
    else { g.fillStyle = '#5d9be8'; g.fillRect(0, 0, w, h); }
    clouds.forEach(n => put(n.img, 0, n.box.w, n.box.h, n.box.x, n.box.y, n.box.w, n.box.h));
    if (sign && !sign.classList.contains('cut')) put(IMG.sign, 0, 312, 244, SIGN_AT.x + SIGN_BOX.x, SIGN_AT.y + SIGN_BOX.y, SIGN_BOX.w, SIGN_BOX.h);
    if (D.sheepHere()) put(IMG.sheep, 0, 160, 120, SHEEP_AT.x + SHEEP_BOX.x, SHEEP_AT.y + SHEEP_BOX.y, SHEEP_BOX.w, SHEEP_BOX.h);
  };
  // o: { name, icon, open, menu(id), poop }
  D.addFile = function (o) {
    if (!hasRoom()) { D.overflow(); return null; }   // 桌面满了：挤爆
    const id = 'file-' + (++fileSeq);
    const app = OS.apps.register({ id, name: o.name, icon: o.icon || 'txt', desktop: true, singleton: false, temp: true, poop: o.poop || 0, sheepInside: !!o.sheepInside, open: o.open, menu: o.menu ? () => o.menu(id) : null });
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
    if (D.sheepHere() && !icons[id].app.spared && current !== id && !feedQueue.some(j => j.id === id)) { feedQueue.push({ id }); if (!feeding) nextMeal(); }
    syncLeft();
  }
  function syncLeft() {
    const left = Object.keys(icons).some(k => icons[k].app.temp && !icons[k].binned);
    const spared = Object.keys(icons).some(k => icons[k].app.spared && !icons[k].binned);
    if ((left && !D.sheepHere()) || spared) OS.bootFix.add('txtLeft', LEFT_FIX); else OS.bootFix.remove('txtLeft');
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
  // 磁盘清理（cleanup.js）：直接删掉一个桌面上的文本文档；羊正要去吃它的话记一笔（扑空）
  D.dropFile = function (id) {
    if (current === id) missed.add(id);
    D.removeFile(id);
  };
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
    let dur = Math.max(300 / sheepSpeed, dist * (fast ? 5 : 9) / sheepSpeed);
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
  const missed = new Set();   // 羊正要去吃、被磁盘清理删掉的：扑个空
  async function nextMeal() {
    const job = feedQueue.shift();
    if (!job) { feeding = false; current = null; sheep.classList.remove('angry'); return goHome(); }
    feeding = true;
    current = job.id;
    sheep.classList.add('busy');
    // 追：文件挪到哪追到哪；回收站里也翻出来吃（生气）
    for (let round = 0; round < 80; round++) {
      const w = whereIs(job.id);
      if (!w) {
        if (missed.delete(job.id)) {   // 扑空：愣一下，头顶一个问号
          sheep.classList.remove('wobble'); void sheep.offsetWidth; sheep.classList.add('wobble', 'stunned');
          OS.sound.play('baa', 1);
          await pause(1200);
          sheep.classList.remove('stunned');
          if (!D.sheepHere()) return stopMeals();
        }
        return nextMeal();
      }
      sheep.classList.toggle('angry', w.inBin);
      const s = spotFor(w);
      if (!arrived(s)) {
        await walkTo(s.x, s.y, w.inBin);
        if (!D.sheepHere()) return stopMeals();
        continue;
      }
      // 写字板的文章里插了羊：见到同类，愣一下，扭头走了（这个文件就留在桌面上）
      if (!w.inBin && icons[job.id] && icons[job.id].app.sheepInside) {
        icons[job.id].app.spared = true;
        sheep.classList.remove('wobble'); void sheep.offsetWidth; sheep.classList.add('wobble', 'stunned');   // 愣住，头顶一个问号
        OS.sound.play('baa', 1);
        await pause(1200);
        sheep.classList.remove('stunned');
        syncLeft();
        return nextMeal();
      }
      const moved = await chew(job.id, w, s);
      if (!D.sheepHere()) return stopMeals();
      if (moved) continue;
      const poop = icons[job.id] ? icons[job.id].app.poop : 0;
      D.removeFile(job.id);
      sheepAte++;
      // 消化一下；在回收站里翻着吃的，回收站骂一句
      if (w.inBin) setTimeout(() => D.iconSay('recycle', BIN_SAY, 2500), 300);
      sheep.classList.remove('angry');
      sheep.classList.add('full');   // 吃饱了，眯眼打个嗝
      await pause(500);
      sheep.classList.remove('wobble'); void sheep.offsetWidth; sheep.classList.add('wobble');
      OS.sound.play('baa', w.inBin ? 6 : 2);
      await pause(700);
      sheep.classList.remove('full');
      if (!D.sheepHere()) return stopMeals();
      if (poop) {
        // 蹲下，在屁股后面拉一小堆
        sheep.classList.add('squat');
        await pause(250);
        const flip = parseFloat(sheep.style.getPropertyValue('--flip')) || 1;
        const sw = sheep.offsetWidth, sh = sheep.offsetHeight;
        if (D.sheepHere()) dropPoop(flip > 0 ? s.x + sw * 0.95 : s.x + sw * 0.05, s.y + sh * 0.97, poop);
        await pause(550);
        sheep.classList.remove('squat');
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
    sheep.classList.remove('busy', 'chewing', 'angry', ...POSES);
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
    sheep.classList.remove('busy', 'chewing', 'walking', 'angry', ...POSES);
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
  // 羊粪：sheep-bits.webp 5–7 格，小 ／ 中 ／ 大一堆（大的冒臭气）。(x, y) = 这堆粪落地的中点
  const POOP_SIZE = [0, 13, 16, 20];
  function dropPoop(x, y, level) {
    level = Math.max(1, Math.min(3, level || 1));
    const node = el('div', { class: 'poop' });
    node.style.backgroundPosition = ((4 + level) * 100 / 7) + '% 0';
    const k = Math.max(0.6, (sheep.offsetWidth || 34) / 34);
    const size = POOP_SIZE[level] * k;
    node.style.left = (x - size / 2) + 'px'; node.style.top = (y - size * 62 / 64) + 'px';   // 粪在格子里靠下
    node.style.width = node.style.height = size + 'px';
    node.addEventListener('pointerdown', e => e.stopPropagation());
    node.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('squish'); node.classList.remove('squish'); void node.offsetWidth; node.classList.add('squish'); });
    iconLayer.appendChild(node);
    poops.push(node);
    OS.sound.play('poop');
    OS.bootFix.add('poop', POOP_FIX);
  }
  // 环卫大爷（workers.js）：羊粪在哪、扫走一堆
  D.poopList = () => poops.map(n => ({ node: n, x: parseFloat(n.style.left) + parseFloat(n.style.width) / 2, foot: parseFloat(n.style.top) + parseFloat(n.style.height) }));
  D.removePoop = function (node) {
    const i = poops.indexOf(node);
    if (i < 0) return;
    poops.splice(i, 1);
    node.classList.add('swept');
    setTimeout(() => node.remove(), 300);
    if (!poops.length) OS.bootFix.remove('poop');
  };
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
    if (!hasRoom(ic) && !o.noCrowd) { D.overflow(); return false; }   // 桌面满了：挤爆（回收站自己撑爆时不算）
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
  // 添加或删除程序（addremove.js）：卸了 = 快捷方式还在，图没了（2026-11-24 作者定 12B）；装回来 = 图回来
  //   老存档里卸载时被收走的图标：装回来时摆回原来的格子（存档 softPos）
  D.dropApp = function () { paintAll(); };
  D.bringApp = function (id) {
    const app = OS.apps.byId[id];
    if (app && app.desktop && !icons[id] && gone().indexOf(id) < 0 && hidden().indexOf(id) < 0) {
      addIcon(app);
      const ic = icons[id];
      const pos = OS.save.get('softPos', {}), p = pos[id];
      const cell = p && p[0] >= 0 && valid(p[0], p[1]) && !occupant(p[0], p[1], ic) ? p : firstFree(ic);
      ic.col = cell[0]; ic.row = cell[1];
      position(ic);
      delete pos[id];
      OS.save.set('softPos', pos);
      savePositions();
    }
    paintAll();
  };
  D.burstAt = (cx, cy, k, kind) => burst(cx, cy, k, kind);

  function addIcon(app) {
    const node = el('div', { class: 'dicon', 'data-app': app.id }, [
      OS.iconEl(app.icon, 'di-img'),
      el('i', { class: 'di-arrow' }),   // 快捷方式的小箭头
      el('div', { class: 'di-label', text: app.name })
    ]);
    const ic = { app, el: node, col: -1, row: -1, binned: binList().some(b => b.id === app.id) };
    if (ic.binned) node.classList.add('binned');
    icons[app.id] = ic;
    iconLayer.appendChild(node);
    paintIcon(ic);
    bindIcon(ic);
    OS.ui.onContext(node, () => {
      if (!selected.has(ic)) setSelection([ic]);
      lastTap = null;
      return OS.menus.icon(app);
    });
  }

  /* ---------- 快捷方式（2026-11-24 作者定：解放桌面；创意稿「桌面解放-创意.md」） ----------
     - 系统图标：我的文档、我的电脑、网上邻居、回收站、Internot Explorer——能丢回收站（倒出来、删不掉），
       除了回收站都能隐藏 ／ 显示（右键 ▸ 隐藏；显示属性 ▸ 桌面 ▸ 自定义桌面；开始菜单里右键 ▸ 在桌面上显示）
     - 新建文件夹(2)：照旧丢不进回收站、删不掉
     - 别的程序图标都是快捷方式（左下角小箭头）：默认那几个就是程序自己的图标；玩家另外加的存在 deskLinks
       加：开始菜单里 ／ 我的电脑里的 .exe 右键 ▸ 发送到 ▸ 桌面快捷方式；桌面上的快捷方式右键 ▸ 创建快捷方式（"快捷方式 到 X"）
       删：右键 ▸ 移入回收站（回收站照旧什么都删不掉）；右键 ▸ 彻底删除（真没了）
       指向的程序被卸了：图标的图没了（只剩箭头和名字），双击弹"快捷方式存在问题"
     - 桌面摆满了还往上挤（加快捷方式、还原、倒回来、新建文本文档、显示系统图标……）：切回桌面，图标挤着抖，炸开，蓝屏；
       重启以后桌面还是那么多，最后挤上来的那个没加上（作者定：不然卸了软件的默认图标、藏得深的程序不好找回来）
     - 以后主线：快捷方式是个真文件（桌面文件夹里的 .lnk），记着指向哪；有人要你发文件你发了快捷方式 → 对方教你找原文件、打压缩包 */
  const SYS_ICONS = ['mydocs', 'mycomputer', 'network', 'recycle', 'ie'];
  const HIDEABLE = ['mydocs', 'mycomputer', 'network', 'ie'];
  const L_LNK = {
    brokenTitle: '快捷方式存在问题',
    broken: name => '「' + name + '」指向的程序已经被你卸载了。\n快捷方式还在，人已经走了。',
    brokenBtns: ['删除它', '留着当纪念'],
    copyName: name => '快捷方式 到 ' + name,
    propsTitle: name => name + ' 属性',
    note: '它只是个快捷方式，真身在别处。',
    find: '查找目标(F)…', ok: '确定',
    rows: ['目标类型：', '目标位置：', '目标(T)：', '起始位置(S)：', '快捷键(K)：', '运行方式(R)：', '备注(O)：'],
    app: '应用程序', none: '无', normal: '常规窗口'
  };
  const BSOD_CROWD = { id: 'overcrowd', name: 'DESKTOP_OVERCROWDED', text: '额滴神啊！表酱紫再挤了！' };
  const isSys = id => SYS_ICONS.indexOf(id) >= 0;
  // 这个图标是不是快捷方式：默认的程序图标 + 玩家加的（文本文档、收在文件夹里的、系统图标、新建文件夹(2) 不是）
  const isLink = app => !!app && !isSys(app.id) && app.id !== 'folder2' && !app.temp && !app.inFolder;
  const targetOf = app => (app && app.lnkTo) || (app && app.id);
  const brokenApp = app => isLink(app) && !!OS.soft && !OS.soft.appOk(targetOf(app));
  D.isLink = id => isLink(OS.apps.byId[id]);
  D.isSys = isSys;
  D.canHide = id => HIDEABLE.indexOf(id) >= 0;
  D.targetOf = id => targetOf(OS.apps.byId[id]);
  // 能发到桌面的程序（开始菜单、我的电脑里的 .exe 右键用）
  D.canLink = id => { const a = OS.apps.byId[id]; return !!a && !isSys(id) && id !== 'folder2' && !a.temp && !a.inFolder && !a.lnkTo; };
  let links = OS.save.get('deskLinks', []);   // 玩家加的：[{ id, to, name }]
  const saveLinks = () => { OS.save.set('deskLinks', links); OS.emit('fs:change'); };
  D.linkCount = () => links.length;   // 算进全电脑 200 个的名额（fs.js）
  const gone = () => OS.save.get('deskGone', []);       // 彻底删除了的默认程序图标
  const hidden = () => OS.save.get('deskHidden', []);   // 藏起来的系统图标
  function regLink(l) {
    const t = OS.apps.byId[l.to];
    return OS.apps.register({ id: l.id, name: l.name, icon: t ? t.icon : 'exe', desktop: true, singleton: false, lnkTo: l.to, open: () => OS.apps.open(l.to) });
  }
  function paintIcon(ic) {
    ic.el.classList.toggle('lnk', isLink(ic.app));
    ic.el.classList.toggle('broken', brokenApp(ic.app));
  }
  const paintAll = () => Object.keys(icons).forEach(k => paintIcon(icons[k]));
  // 桌面上还有没有空格子
  function hasRoom(except) {
    for (let c = 0; c < grid.cols; c++) for (let r = 0; r < grid.rows; r++) if (valid(c, r) && !occupant(c, r, except)) return true;
    return false;
  }
  D.hasRoom = () => hasRoom();
  function dropIcon(ic) {
    if (ic.binned) saveBin(binList().filter(b => b.id !== ic.app.id));
    ic.el.remove();
    selected.delete(ic);
    delete icons[ic.app.id];
    savePositions();
  }
  // 双击：指向的程序被卸了就弹"快捷方式存在问题"
  D.openIcon = function (id) {
    const app = OS.apps.byId[id];
    if (!app) return;
    if (brokenApp(app)) {
      OS.ui.dialog({ title: L_LNK.brokenTitle, icon: 'warn', text: L_LNK.broken(app.name), buttons: L_LNK.brokenBtns })
        .then(v => { if (v === L_LNK.brokenBtns[0]) D.purge(id); });
      return;
    }
    OS.apps.open(id);
  };
  // 发送到 ▸ 桌面快捷方式（copy：桌面上的快捷方式 ▸ 创建快捷方式，名字叫"快捷方式 到 X"）
  D.addLink = function (to, o) {
    o = o || {};
    const t = OS.apps.byId[to];
    if (!t || !D.canLink(to)) return null;
    if (OS.fs && !OS.fs.room()) { OS.fs.capFail(); return null; }
    if (!hasRoom()) { D.overflow(); return null; }
    const names = new Set(Object.keys(icons).map(k => icons[k].app.name));
    const base = o.copy ? L_LNK.copyName(t.name) : t.name;
    let name = base;
    for (let n = 2; names.has(name); n++) name = base + ' (' + n + ')';
    const l = { id: 'lnk-' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), to, name };
    links.push(l);
    saveLinks();
    const app = regLink(l);
    addIcon(app);
    const ic = icons[app.id];
    const f = firstFree(ic);
    ic.col = f[0]; ic.row = f[1];
    position(ic);
    ic.el.classList.add('restored');
    setTimeout(() => ic.el.classList.remove('restored'), 400);
    savePositions();
    OS.sound.play('pop');
    return app.id;
  };
  // 右键 ▸ 彻底删除：不进回收站，真没了
  D.purge = function (id) {
    const ic = icons[id];
    if (!ic || !isLink(ic.app)) return false;
    dropIcon(ic);
    if (ic.app.lnkTo) {
      links = links.filter(l => l.id !== id);
      saveLinks();
      const i = OS.apps.list.indexOf(ic.app);
      if (i >= 0) OS.apps.list.splice(i, 1);
      delete OS.apps.byId[id];
    } else {
      const g = gone();
      if (g.indexOf(id) < 0) g.push(id);
      OS.save.set('deskGone', g);
      OS.emit('fs:change');
    }
    OS.sound.play('thud');
    return true;
  };
  // 系统图标：隐藏 ／ 显示（显示的时候桌面满了：挤爆）
  D.sysShown = id => hidden().indexOf(id) < 0;
  D.setSysShown = function (id, on) {
    if (!D.canHide(id)) return;
    if (!on) {
      if (!D.sysShown(id)) return;
      OS.save.set('deskHidden', hidden().concat(id));
      if (icons[id]) dropIcon(icons[id]);
      OS.emit('fs:change');
      return;
    }
    if (D.sysShown(id) && icons[id]) return;
    if (!hasRoom()) { D.overflow(); return; }
    OS.save.set('deskHidden', hidden().filter(x => x !== id));
    const app = OS.apps.byId[id];
    if (!app || icons[id]) return;
    addIcon(app);
    const ic = icons[id], f = firstFree(ic);
    ic.col = f[0]; ic.row = f[1];
    position(ic);
    ic.el.classList.add('restored');
    setTimeout(() => ic.el.classList.remove('restored'), 400);
    savePositions();
    OS.emit('fs:change');
  };
  // 快捷方式右键 ▸ 属性：照 XP（目标、起始位置……［查找目标］打开它所在的文件夹）
  D.linkProps = function (id) {
    const app = OS.apps.byId[id];
    if (!app) return;
    const to = targetOf(app), t = OS.apps.byId[to] || app;
    const path = (OS.fs && OS.fs.findApp && OS.fs.findApp(to)) || ('C:\\Program Files\\' + t.name + '\\' + t.name + '.exe');
    const dir = path.slice(0, path.lastIndexOf('\\'));
    const vals = [L_LNK.app, dir.slice(dir.lastIndexOf('\\') + 1), path, dir, L_LNK.none, L_LNK.normal, L_LNK.note];
    const find = el('button', { class: 'xpbtn', text: L_LNK.find }), ok = el('button', { class: 'xpbtn default', text: L_LNK.ok });
    const content = el('div', { class: 'lp' }, [
      el('div', { class: 'lp-head' + (brokenApp(app) ? ' broken' : '') }, [OS.iconEl(app.icon, 'lp-ico'), el('i', { class: 'di-arrow' }), el('span', { text: app.name })]),
      el('div', { class: 'lp-rows' }, L_LNK.rows.map((k, i) => el('div', { class: 'lp-row' }, [el('span', { class: 'lp-k', text: k }), el('span', { class: 'lp-v', text: vals[i] })]))),
      el('div', { class: 'lp-find' }, [find]),
      el('div', { class: 'dlg-btns' }, [ok])
    ]);
    const w = OS.wm.open({ title: L_LNK.propsTitle(app.name), icon: app.icon, width: 300, content, minimizable: false, maximizable: false, className: 'is-dialog' });
    find.addEventListener('click', () => { OS.sound.play('click'); w.close(); if (OS.explorer) OS.explorer.open(dir, { select: path }); });
    ok.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
  };
  // 挤爆：切回桌面 → 图标挤着抖 → 全炸开 → 蓝屏
  let crowding = false;
  D.overflow = function () {
    if (crowding || OS.boot.state !== 'desktop') return;
    crowding = true;
    OS.ui.closeMenus();
    OS.taskbar.toggleMenu(false);
    if (!OS.wm.desktopShown()) OS.wm.showDesktop();
    if (!iconsShown) D.toggleIcons();
    setSelection([]);
    const list = Object.keys(icons).map(k => icons[k]).filter(ic => !ic.binned);
    list.forEach((ic, i) => { ic.el.style.setProperty('--d', ((i * 37) % 9) * -0.013 + 's'); ic.el.classList.add('crowd'); });
    OS.sound.play('mbCharge');
    setTimeout(() => OS.sound.play('thud'), 500);
    setTimeout(() => OS.sound.play('thud'), 900);
    setTimeout(() => {
      list.forEach(ic => { burst(parseFloat(ic.el.style.left) + ICON_W / 2, parseFloat(ic.el.style.top) + 20, 0.55, 'paper'); ic.el.classList.add('blown'); });
      OS.sound.play('mbBoom');
    }, 1500);
    setTimeout(() => { crowding = false; OS.ui.bsod(BSOD_CROWD); }, 2500);
  };
  OS.on('desktop:reset', () => { crowding = false; Object.keys(icons).forEach(k => icons[k].el.classList.remove('crowd', 'blown')); });

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
    if (lastTap && lastTap.ic === ic && now - lastTap.t < OS.dblMs()) {
      lastTap = null;
      OS.sound.play('click');
      D.openIcon(ic.app.id);
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
