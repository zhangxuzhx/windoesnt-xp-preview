/* 电子蚊香：桌面宠物（不是窗口）
   - 打开：桌面右下角“划”一下点着一盘绿蚊香，冒白烟；右下角任务栏托盘里多一个蚊香图标。
   - 蚊香越烧越短，5 分钟烧完。烧完 = 关掉它。能拖着走。
   - 开着的时候，蚊子会嗡嗡地飞过来，被熏晕，打着转掉到任务栏上躺着；点一下捡起来，得个奇怪的东西。
   - 右键蚊香 / 右键托盘图标（手机长按）：剩余时间、扇一扇、换一盘新的、驱蚊模式、战利品、关于、关闭。
   - 点一下蚊香 = 拿手扇一扇：火星一亮、烟变大、烧得快一点，屏幕慢慢起雾；
     猛扇到头 → 蓝屏 SYSTEM_FAINTED。
   - 关掉 / 烧完：蚊香没了，躺着的蚊子醒过来飞走。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.coil;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  const NAME = '电子蚊香';
  const BURN_SEC = 300;                 // 一盘烧 5 分钟
  const FAN_BURN = 5;                   // 扇一下多烧 5 秒
  const FIRST_MOZ = 15, GAP_MOZ = [35, 60];   // 第一只蚊子几秒后来，之后隔多少秒来一只
  const MAX_LYING = 6;                  // 任务栏上最多躺几只
  const HAZE_STEP = 0.07, HAZE_FADE = 0.015, HAZE_FAINT = 0.85;   // 扇一下起多少雾、每秒散多少、多少雾就晕倒
  const DROPS = [
    '不知是谁的 O 型血',
    '室友的腿毛',
    '一滴风油精',
    '一股花露水的清香',
    '蚊子的遗书："明年夏天还来"',
    '蚊子包（在你腿上）'
  ];
  const GOT = item => '获得：' + item + ' ×1';
  const LEFT = s => '剩余：' + Math.floor(s / 60) + ' 分 ' + (s % 60) + ' 秒';
  const TRAY_TIP = s => NAME + '正在燃烧\n' + LEFT(s);
  const NEW_ONE = '已换上新的一盘。';
  const ULTRA = '已切换到超声波模式。\n蚊子能不能听见不知道，\n邻居家的狗在狂叫了。';
  const NO_LOOT = '还没有战利品。\n蚊子都还活蹦乱跳的。';
  const ABOUT = NAME + ' v1.0（共享软件）\n本软件可驱除电脑里的蚊子。\n电脑外面的，请自行解决。';
  const PROPS = '类型：蚊香（电子版）\n燃烧时间：5 分钟\n气味：红烧大闸蟹（可惜你闻不到）';
  const BSOD = { id: 'coil', name: 'SYSTEM_FAINTED', text: '电脑抽蚊香抽嗨了。' };

  /* ---------- 存档：战利品、今天熏晕了几只 ---------- */
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const stats = () => Object.assign({ items: {}, day: '', today: 0, total: 0, runs: 0 }, OS.save.get('coil', {}));
  const saveStats = s => OS.save.set('coil', s);
  OS.coilToday = () => { const s = stats(); return s.day === today() ? s.today : 0; };

  /* ---------- Codex 画的图（assets/coil，图片是显示大小的 2 倍） ----------
     蚊香：Codex 画了 10 个阶段，我在每两个阶段之间补了 5 步（烟灰沿着蚊香一点点往里推），共 55 帧；
     播的时候相邻两帧再淡入淡出，看起来是一直在慢慢烧。TIPS 是每帧火星的位置（图片像素，显示时除以 2），
     火星的光和烟也在相邻两帧的火星之间慢慢挪。
     蚊子 4 帧：飞（1–2）、晕（3）、四脚朝天躺着（4），头朝左 */
  const COIL_FRAMES = 55, COIL_W = 80;
  const TIPS = [
    [143, 34], [147.7, 42.8], [147.6, 51.6], [142.9, 59.8], [134.4, 66.9], [122.7, 72.4],
    [109, 76], [98.1, 78.2], [86.5, 79.2], [74.6, 79], [63.1, 77.5], [52.4, 74.8],
    [43, 71], [32.8, 64.7], [26.4, 57.1], [24.3, 48.8], [26.8, 40.4], [33.9, 32.6],
    [45, 26], [55.7, 23.2], [67, 21.5], [78.6, 21], [89.9, 21.6], [100.5, 23.3],
    [110, 26], [123.1, 33.2], [129.7, 41.9], [129.8, 50.6], [123.9, 58.3], [113.6, 63.9],
    [101, 67], [89.4, 69.5], [76.5, 69.8], [63.8, 67.9], [52.7, 63.9], [44.8, 58],
    [41, 51], [43.6, 44.3], [50.1, 38.4], [59.8, 33.9], [71.5, 31.3], [84, 30.6],
    [96, 32], [111.8, 39.3], [116.5, 49], [110.3, 57.6], [96.9, 62.5], [82.1, 62.7],
    [71, 59], [71.5, 57.2], [72.5, 55.5], [74, 54.1], [76, 52.8], [78.4, 51.8],
    [81, 51]
  ];
  const SMOKE_W = 20, SMOKE_H = 48;
  ['coil', 'smoke', 'mozzie', 'tray'].forEach(n => { const im = new Image(); im.src = 'assets/coil/' + n + '.webp'; });

  /* ---------- 状态 ---------- */
  let pet = null;      // 正在烧的那盘
  let layer = null, haze = null;

  function layers() {
    if (layer) return;
    layer = el('div', { id: 'pets', class: 'layer' });
    haze = el('div', { id: 'coil-haze', class: 'layer' });
    OS.stage.el.appendChild(haze);
    OS.stage.el.appendChild(layer);
    OS.on('bsod', () => close(true));
    OS.on('desktop:reset', () => close(true));
  }

  /* ---------- 打开：点着一盘 ---------- */
  app.open = function () {
    layers();
    if (pet) { nudge(); return null; }
    const s = stats(); s.runs++; saveStats(s);
    const node = el('div', { class: 'cl-pet' }, [el('div', { class: 'cl-coil' }), el('div', { class: 'cl-coil cl-next' }), el('div', { class: 'cl-glow' }), el('div', { class: 'cl-smoke' })]);
    layer.appendChild(node);
    const st = OS.stage, W = st.work;
    // 放在右下角草坡上，别挡住右下角那行“未激活”水印
    const x = W.x + W.w - node.offsetWidth - 40, y = W.y + W.h - node.offsetHeight - 40;
    node.style.left = x + 'px';
    node.style.top = y + 'px';
    const tray = OS.taskbar.trayAdd(el('span', { class: 'tray-btn cl-tray', title: NAME }, [el('i', { class: 'cl-tray-ico' })]));
    pet = {
      node, tray, burnt: 0, last: Date.now(), fan: 0, hazeV: 0, mode: 'smoke',
      timers: [], mozzies: new Set(),
      coil: node.querySelector('.cl-coil'), next: node.querySelector('.cl-next'), glow: node.querySelector('.cl-glow'), smoke: node.querySelector('.cl-smoke')
    };
    OS.sound.play('match');
    node.classList.add('cl-in');
    bindPet(pet);
    OS.ui.onContext(node, () => menu());
    OS.ui.onContext(tray, () => menu());
    tray.addEventListener('click', () => {
      OS.sound.play('click');
      OS.ui.notify({ title: NAME, text: TRAY_TIP(left()), icon: 'info', replace: true, timeout: 3500 });
    });
    draw();
    pet.tick = setInterval(tick, 250);
    pet.timers.push(setTimeout(spawnMozzie, FIRST_MOZ * 1000));
    return null;
  };

  const left = () => Math.max(0, Math.ceil(BURN_SEC - pet.burnt));

  // 每 0.25 秒：烧一点、雾散一点
  function tick() {
    if (!pet) return;
    const now = Date.now();
    pet.burnt += (now - pet.last) / 1000;
    pet.last = now;
    if (pet.hazeV > 0) setHaze(pet.hazeV - HAZE_FADE / 4);
    if (pet.burnt >= BURN_SEC) { close(); return; }
    draw();
  }

  // 按烧了多少换帧：当前帧打底，下一帧按进度慢慢淡入；火星的光和烟在两帧的火星之间慢慢挪
  function draw() {
    const pos = Math.min(COIL_FRAMES - 1, Math.max(0, pet.burnt / BURN_SEC * (COIL_FRAMES - 1)));
    const f = Math.floor(pos), g = Math.min(COIL_FRAMES - 1, f + 1), k = pos - f;
    pet.coil.style.backgroundPosition = (-f * COIL_W) + 'px 0';
    pet.next.style.backgroundPosition = (-g * COIL_W) + 'px 0';
    pet.next.style.opacity = k.toFixed(3);
    const tx = (TIPS[f][0] + (TIPS[g][0] - TIPS[f][0]) * k) / 2, ty = (TIPS[f][1] + (TIPS[g][1] - TIPS[f][1]) * k) / 2;
    pet.smoke.style.left = (tx - SMOKE_W / 2) + 'px';
    pet.smoke.style.top = (ty - SMOKE_H + 2) + 'px';
    pet.glow.style.left = (tx - 8) + 'px';
    pet.glow.style.top = (ty - 8) + 'px';
  }

  /* ---------- 拖着走 / 点一下 = 扇一扇 ---------- */
  function bindPet(p) {
    p.node.addEventListener('pointerdown', e => {
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const start = OS.stage.toLocal(e.clientX, e.clientY);
      const ox = parseFloat(p.node.style.left), oy = parseFloat(p.node.style.top);
      let drag = false;
      try { p.node.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      const move = ev => {
        if (OS.ui.longPressed(ev.pointerId) && !drag) return;
        const q = OS.stage.toLocal(ev.clientX, ev.clientY);
        const dx = q.x - start.x, dy = q.y - start.y;
        if (!drag && dx * dx + dy * dy > 36) drag = true;
        if (!drag) return;
        const W = OS.stage.work;
        p.node.style.left = OS.clamp(ox + dx, W.x - 10, W.x + W.w - p.node.offsetWidth + 10) + 'px';
        p.node.style.top = OS.clamp(oy + dy, W.y, W.y + W.h - p.node.offsetHeight + 4) + 'px';
      };
      const up = ev => {
        p.node.removeEventListener('pointermove', move);
        p.node.removeEventListener('pointerup', up);
        p.node.removeEventListener('pointercancel', up);
        if (!drag && ev.type === 'pointerup' && !OS.ui.longPressed(ev.pointerId)) fan();
      };
      p.node.addEventListener('pointermove', move);
      p.node.addEventListener('pointerup', up);
      p.node.addEventListener('pointercancel', up);
    });
  }

  function fan() {
    if (!pet) return;
    OS.sound.play('fan');
    pet.burnt += FAN_BURN;
    pet.node.classList.remove('cl-fanned'); void pet.node.offsetWidth; pet.node.classList.add('cl-fanned');
    setHaze(pet.hazeV + HAZE_STEP);
    if (pet.hazeV >= HAZE_FAINT) { faint(); return; }
    if (pet.burnt >= BURN_SEC) { close(); return; }
    draw();
  }
  // 屏幕起雾：越扇越浓，浓了开始晕乎乎地晃
  function setHaze(v) {
    pet.hazeV = Math.max(0, v);
    haze.style.opacity = Math.min(0.9, pet.hazeV).toFixed(3);
    OS.stage.el.classList.toggle('cl-woozy', pet.hazeV > 0.45);
  }
  function faint() {
    OS.stage.el.classList.add('cl-faint');
    setTimeout(() => { OS.stage.el.classList.remove('cl-faint'); OS.ui.bsod(BSOD); }, 900);
  }

  function nudge() {
    pet.node.classList.remove('cl-nudge'); void pet.node.offsetWidth; pet.node.classList.add('cl-nudge');
  }

  /* ---------- 蚊子 ---------- */
  function spawnMozzie() {
    if (!pet) return;
    const gap = GAP_MOZ[0] + Math.random() * (GAP_MOZ[1] - GAP_MOZ[0]);
    pet.timers.push(setTimeout(spawnMozzie, gap * 1000 * (pet.mode === 'ultra' ? 0.5 : 1)));
    const st = OS.stage, W = st.work;
    const fromLeft = Math.random() < 0.5;
    const m = { node: el('div', { class: 'mozzie fly' + (fromLeft ? ' flip' : '') }, [el('i', { class: 'mz' })]), state: 'fly' };
    layer.appendChild(m.node);
    pet.mozzies.add(m);
    // 飞向蚊香：歪歪扭扭，越飞越近
    const cx = parseFloat(pet.node.style.left) + pet.node.offsetWidth / 2;
    const cy = parseFloat(pet.node.style.top) + 4;
    const sx = fromLeft ? W.x - 30 : W.x + W.w + 4, sy = W.y + 20 + Math.random() * (W.h * 0.5);
    const lying = [...pet.mozzies].filter(z => z.state === 'lying').length;
    const willFall = lying < MAX_LYING;
    const ex = willFall ? cx + (Math.random() * 60 - 30) : (fromLeft ? W.x + W.w + 30 : W.x - 30);
    const ey = willFall ? cy - 10 - Math.random() * 20 : sy - 40;
    const dur = 3200 + Math.random() * 1200, t0 = performance.now(), wob = 8 + Math.random() * 10;
    OS.sound.play('buzz', 2.2);
    const step = now => {
      if (!pet || m.state !== 'fly') return;
      const k = Math.min(1, (now - t0) / dur);
      const x = sx + (ex - sx) * k + Math.sin(k * 19) * wob;
      const y = sy + (ey - sy) * k + Math.sin(k * 13 + 1) * wob * 1.4;
      m.node.style.left = x + 'px';
      m.node.style.top = y + 'px';
      if (k < 1) { requestAnimationFrame(step); return; }
      if (willFall) dizzy(m, x, y); else { m.node.remove(); pet.mozzies.delete(m); }
    };
    requestAnimationFrame(step);
  }

  // 熏晕：原地打转，掉到任务栏上躺着
  function dizzy(m, x, y) {
    m.state = 'dizzy';
    m.node.classList.remove('fly');
    m.node.classList.add('dizzy');
    OS.sound.play('dizzy');
    const s = stats();
    if (s.day !== today()) { s.day = today(); s.today = 0; }
    s.today++; s.total++;
    saveStats(s);
    const st = OS.stage;
    setTimeout(() => {
      if (!pet || m.state !== 'dizzy') return;
      m.node.classList.add('falling');
      m.node.style.left = OS.clamp(x + (Math.random() * 40 - 20), st.insets.l + 70, st.W - st.insets.r - 160) + 'px';   // 别挡住开始按钮和右下角托盘
      m.node.style.top = (st.H - st.TASKBAR_H + 4) + 'px';
      setTimeout(() => {
        if (!pet || m.state !== 'dizzy') return;
        m.state = 'lying';
        m.node.classList.remove('dizzy', 'falling');
        m.node.classList.add('lying');
        OS.sound.play('thud');
      }, 650);
    }, 900);
    m.node.addEventListener('pointerdown', e => {
      if (e.button != null && e.button !== 0) return;
      e.stopPropagation();
      if (m.state === 'lying') pickUp(m);
    });
  }

  // 捡起来：得个奇怪的东西
  function pickUp(m) {
    m.state = 'gone';
    pet.mozzies.delete(m);
    m.node.classList.add('picked');
    setTimeout(() => m.node.remove(), 300);
    const item = OS.pick(DROPS);
    const s = stats();
    s.items[item] = (s.items[item] || 0) + 1;
    saveStats(s);
    OS.sound.play('pop');
    OS.ui.notify({ title: NAME, text: GOT(item), icon: 'info', replace: true, timeout: 3500 });
  }

  /* ---------- 关掉 / 烧完：蚊香没了，躺着的蚊子醒过来飞走 ---------- */
  function close(quiet) {
    const p = pet;
    if (!p) return;
    pet = null;
    clearInterval(p.tick);
    p.timers.forEach(clearTimeout);
    p.tray.remove();
    haze.style.opacity = 0;
    OS.stage.el.classList.remove('cl-woozy', 'cl-faint');
    p.node.classList.add('cl-out');
    setTimeout(() => p.node.remove(), 500);
    p.mozzies.forEach(m => {
      if (quiet) { m.node.remove(); return; }
      m.state = 'gone';
      m.node.classList.remove('dizzy', 'falling', 'lying');
      m.node.classList.add('wake');
      setTimeout(() => m.node.remove(), 1400);
    });
    if (!quiet && p.mozzies.size) OS.sound.play('buzz', 1.4);
  }

  /* ---------- 右键：蚊香本身 / 托盘图标 ---------- */
  function menu() {
    if (!pet) return null;
    return [
      { label: LEFT(left()), disabled: true },
      '-',
      { label: '扇一扇', bold: true, action: fan },
      { label: '换一盘新的', action: () => { if (!pet) return; pet.burnt = 0; OS.sound.play('match'); draw(); OS.ui.notify({ title: NAME, text: NEW_ONE, icon: 'info', replace: true, timeout: 2500 }); } },
      {
        label: '驱蚊模式', sub: () => [
          { label: '熏蚊模式', checked: pet && pet.mode === 'smoke', action: () => { if (pet) pet.mode = 'smoke'; } },
          { label: '超声波模式', checked: pet && pet.mode === 'ultra', action: () => { if (!pet) return; pet.mode = 'ultra'; OS.sound.play('beep'); OS.ui.dialog({ title: NAME, icon: 'info', text: ULTRA }); } }
        ]
      },
      { label: '战利品…', action: loot },
      '-',
      { label: '关于' + NAME + '…', action: say('关于' + NAME, 'info', ABOUT) },
      { label: '关闭', action: () => close() }
    ];
  }
  function loot() {
    const items = stats().items, names = Object.keys(items);
    OS.ui.dialog({ title: '战利品', icon: 'info', text: names.length ? names.map(n => n + ' ×' + items[n]).join('\n') : NO_LOOT });
  }

  /* ---------- 桌面图标右键：跟普通软件一样，属性换成蚊香的 ---------- */
  app.menu = function () {
    const P = OS.menus.iconParts(app);
    return [P.open, '-', P.cut, P.copy, '-', P.shortcut, P.del, P.rename, '-', { label: '属性', action: say('「' + NAME + '」属性', 'info', PROPS) }];
  };
})();
