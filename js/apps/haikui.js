/* 海葵病毒（Worm.Haikui.a，★）：从网上邻居装海葵抠抠补丁，没开瑞鑫（或者拦下来没打赢）就发作——一分半钟就完（瑞鑫杀毒-创意.md 第四部分）
   第一拨（马上）：托盘小海葵 ／ 硬盘狂响 ／ 抠抠自己登录、给所有好友群发、好友一个个回 ／ 新闻条被抢
   第二拨（30 秒）：屏幕四边长出触手 ／ 桌面图标一个个变成海葵、名字后面多 .haikui ／ 鼠标拖一串泡泡 ／ 任务管理器里越生越多
   第三拨（60 秒）：补丁的安装向导自己越弹越多 ／ 海水从屏幕底下漫上来，30 秒漫到顶 → 蓝屏 REEF_OVERFLOW
   打赢瑞鑫的查杀小游戏：所有现象倒着退回去；重启：全好了（补丁没装上）
   打的时候病毒在背景里照样发作（限时）
   OS.haikui：on ／ wave ／ infect ／ cure ／ deadline ／ copies ／ dormant（老存档里装着补丁、病毒睡着的） */
(function () {
  'use strict';
  const el = OS.el;
  const T1 = 30, T2 = 60, T_END = 90;

  /* ================= 文案 ================= */
  const L = {
    proc: 'haikui_update.exe',
    trayTip: '进程：haikui_update.exe\n正在给你的好友发消息。',
    ticker: '海葵抠抠 ★ 显 IP ★ 看隐身 ★ 已有 10086 人在用',
    spam: '我在用海葵抠抠，能看见你的 IP 哦～下载：网上邻居\\隔壁大学生\\电影',
    // 好友收到群发以后回的（每人一句，照各自性格）
    replies: {
      deskmate: '你号被盗了吧？我不点。',
      faxiao: '你又乱装东西了？我告诉你妈去。',
      roommate: '点了，我电脑也开始咔啦咔啦响了。谢谢你啊。',
      boss: '小孩子别乱装东西，回头电脑坏了别来我这修。',
      nextdoor: '真能看 IP？发我一个！……卧槽我也中了。',
      monitor: '班长提醒：不要乱发陌生链接！已截图，明天交给老师。',
      feiyang: '……你也装海葵了？',
      taxue: '高手都用海葵，我早就装了。',
      yanhua: '寂寞的人，连病毒都发给我。'
    },
    wizTitle: '海葵抠抠补丁 安装向导',
    wizText: '欢迎使用海葵抠抠补丁！\n本补丁纯绿色、无毒、无插件。\n作者：海葵',
    wizBusy: '正在复制自己……',
    suffix: '.haikui',
    fix: '正在给硬盘排水，顺便把海葵送回海里'
  };
  const BSOD = { id: 'haikui', name: 'REEF_OVERFLOW', text: '海葵把你的内存当成了礁石，长满了。' };

  /* ================= 状态 ================= */
  const H = { on: false, t0: 0, wave: 0, clock: 0, hdd: 0, tray: null, layer: null, water: null, tents: [], icons: {}, iconOrder: [], wins: new Set(), lastIcon: 0, lastWin: 0, bsod: false, bubT: 0 };
  const elapsed = () => (H.on ? (Date.now() - H.t0) / 1000 : 0);

  function infect() {
    if (H.on) return;
    H.on = true; H.t0 = Date.now(); H.wave = 0; H.bsod = false;
    OS.bootFix.add('bsod-haikui', L.fix);   // 跟蓝屏那条同一个，重启时只显示一行
    if (OS.ruixin && OS.ruixin.met) OS.ruixin.met('haikui');
    wave1();
    H.clock = setInterval(tick, 250);
  }
  function tick() {
    if (!H.on) return;
    const t = elapsed();
    if (H.wave < 2 && t >= T1) wave2();
    if (H.wave < 3 && t >= T2) wave3();
    const now = Date.now();
    if (H.wave >= 2 && now - H.lastIcon > 2600) { H.lastIcon = now; eatIcon(); }
    if (H.wave >= 2) grow(Math.min(1, (t - T1) / (T_END - T1)));
    if (H.wave >= 3) {
      if (now - H.lastWin > 3200 && H.wins.size < 8) { H.lastWin = now; spamWin(); }
      if (H.water) H.water.style.height = (Math.min(1, (t - T2) / (T_END - T2)) * 100) + '%';
    }
    if (t >= T_END && !H.bsod && OS.boot.state === 'desktop') { H.bsod = true; OS.ui.bsod(BSOD); }
  }

  /* ---------- 第一拨 ---------- */
  function wave1() {
    H.wave = 1;
    const bug = H.tray = el('span', { class: 'tray-btn hk-trayico', title: L.proc }, [OS.iconEl('haikui', 'tray-ico')]);
    bug.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); OS.ui.notify({ title: L.proc, text: L.trayTip, icon: 'warn', replace: true }); });
    if (OS.taskbar.trayAdd) OS.taskbar.trayAdd(bug);
    if (OS.ticker.hijack) OS.ticker.hijack(L.ticker);
    H.hdd = setInterval(() => { if (H.on && Math.random() < 0.75) OS.sound.play('hdd'); }, 650);
    // 抠抠自己登录，给所有好友群发；好友一个个回
    if (OS.koukou && OS.koukou.massSend && !(OS.soft && !OS.soft.has('koukou'))) OS.koukou.massSend(L.spam, L.replies);
    ensureLayer();
  }
  /* ---------- 第二拨 ---------- */
  function wave2() {
    H.wave = 2;
    tentacles();
    OS.stage.el.addEventListener('pointermove', trail, true);
  }
  /* ---------- 第三拨 ---------- */
  function wave3() {
    H.wave = 3;
    H.water = el('div', { class: 'hk-water' }, [el('div', { class: 'hk-wtop' }), ...Array.from({ length: 8 }, (_, i) => el('i', { class: 'hk-wb', style: { left: (8 + i * 12) + '%', animationDelay: (i * 0.37) + 's' } }))]);
    H.layer.appendChild(H.water);
    spamWin();
  }

  function ensureLayer() {
    if (H.layer && H.layer.isConnected) return;
    H.layer = el('div', { id: 'hk-layer', class: 'layer' });
    OS.stage.el.appendChild(H.layer);
  }
  // 四条边一圈触手：根在边上，慢慢往里长、一摆一摆
  function tentacles() {
    ensureLayer();
    const st = OS.stage, W = st.W, Hh = st.H;
    const spots = [];
    for (let i = 0; i < 7; i++) spots.push([30 + i * (W - 60) / 6, Hh - st.TASKBAR_H, 0]);       // 底边（任务栏上面），往上长
    for (let i = 0; i < 5; i++) spots.push([50 + i * (W - 100) / 4, st.TICKER_H, 180]);          // 顶边，往下长
    for (let i = 0; i < 4; i++) spots.push([st.insets.l, 60 + i * (Hh - 140) / 3, 90]);          // 左边，往右长
    for (let i = 0; i < 4; i++) spots.push([W - st.insets.r, 70 + i * (Hh - 140) / 3, -90]);     // 右边，往左长
    spots.forEach(([x, y, r], i) => {
      const t = el('div', { class: 'hk-tent', style: { left: x + 'px', top: y + 'px', '--r': (r + (Math.random() - 0.5) * 24) + 'deg', '--g': 0, '--d': (i % 5) * 0.27 + 's' } }, [el('i')]);
      H.layer.appendChild(t);
      H.tents.push(t);
    });
  }
  function grow(k) { H.tents.forEach((t, i) => t.style.setProperty('--g', (0.25 + k * (0.85 + (i % 3) * 0.2)).toFixed(3))); }
  // 一个桌面图标变成海葵
  function eatIcon() {
    const D = OS.desktop;
    if (!D || !D.ids) return;
    const left = D.ids().filter(id => !H.icons[id]);
    if (!left.length) return;
    const id = OS.pick(left), node = D.iconNode(id), app = OS.apps.byId[id];
    if (!node || !app) return;
    const lab = node.querySelector('.di-label');
    H.icons[id] = { icon: app.icon, label: lab ? lab.textContent : app.name };
    H.iconOrder.push(id);
    D.setIcon(id, 'haikui');
    if (lab) lab.textContent = H.icons[id].label + L.suffix;
    node.classList.add('hk-inf');
    OS.sound.play('bubble');
  }
  function restoreIcon(id) {
    const o = H.icons[id], node = OS.desktop.iconNode(id);
    delete H.icons[id];
    if (!o || !node) return;
    OS.desktop.setIcon(id, o.icon);
    const lab = node.querySelector('.di-label');
    if (lab) lab.textContent = o.label;
    node.classList.remove('hk-inf');
  }
  // 鼠标后面拖一串泡泡
  function trail(e) {
    if (!H.on || H.wave < 2) return;
    const now = Date.now();
    if (now - H.bubT < 70) return;
    H.bubT = now;
    const p = OS.stage.toLocal(e.clientX, e.clientY);
    const b = el('i', { class: 'hk-bub', style: { left: p.x + 'px', top: p.y + 'px' } });
    H.layer.appendChild(b);
    setTimeout(() => b.remove(), 900);
  }
  // 补丁的安装向导自己弹出来（病毒在复制自己）
  function spamWin() {
    if (OS.boot.state !== 'desktop') return;
    const W = OS.stage.work, n = H.wins.size;
    const fill = el('div', { class: 'hk-spamf' });
    const w = OS.wm.open({ title: L.wizTitle, icon: 'exe', width: 190, maximizable: false,
      content: el('div', { class: 'hk-spam' }, [OS.iconEl('haikui', 'hk-spami'), el('div', { class: 'hk-spamt', text: L.wizText }), el('div', { class: 'hk-spamb' }, [fill]), el('div', { class: 'hk-spaml', text: L.wizBusy })]),
      x: W.x + 12 + n * 22 + Math.random() * 40, y: W.y + 8 + n * 16 });
    H.wins.add(w);
    w.closed.then(() => H.wins.delete(w));
    requestAnimationFrame(() => { fill.style.width = '100%'; });
    OS.sound.play('pop');
  }

  /* ---------- 好了 ---------- */
  // 打赢了：所有现象倒着退回去（animate）；重启：直接全拿掉
  function cure(animate) {
    if (!H.on) return;
    H.on = false;
    clearInterval(H.clock); clearInterval(H.hdd);
    OS.bootFix.remove('bsod-haikui');
    OS.stage.el.removeEventListener('pointermove', trail, true);
    if (H.tray) { H.tray.remove(); H.tray = null; }
    if (OS.ticker.hijack) OS.ticker.hijack(null);
    H.wins.forEach(w => { if (!w.isClosed) w.close(); });
    H.wins.clear();
    const ids = H.iconOrder.splice(0).reverse();
    const layer = H.layer;
    H.layer = null; H.water = null;
    const tents = H.tents.splice(0);
    if (!animate) {
      ids.forEach(restoreIcon);
      if (layer) layer.remove();
      return;
    }
    ids.forEach((id, i) => setTimeout(() => restoreIcon(id), 150 + i * 120));
    if (layer) {
      layer.classList.add('hk-ebb');
      const water = layer.querySelector('.hk-water');
      if (water) water.style.height = '0%';
      tents.forEach(t => t.style.setProperty('--g', 0));
      setTimeout(() => layer.remove(), 1800);
    }
  }
  OS.on('desktop:reset', () => cure(false));

  OS.haikui = {
    on: () => H.on, wave: () => H.wave, infect, cure,
    deadline: () => H.t0 + T_END * 1000,
    // 任务管理器：第一拨一个，第二拨起两秒翻一倍（最多 128 个）
    copies: () => (!H.on ? 0 : H.wave < 2 ? 1 : Math.min(128, Math.pow(2, Math.floor((elapsed() - T1) / 2) + 1))),
    // 老存档：照旧版装好了补丁，补丁带的病毒一直睡着（任务管理器里那个 haikui_update.exe）
    dormant: () => !H.on && !!(OS.koukou && OS.koukou.patched && OS.koukou.patched() && !OS.koukou.patchClean()),
    replies: L.replies,
    // 测试用：直接跳到第几秒
    skip: sec => { if (H.on) H.t0 = Date.now() - sec * 1000; }
  };
})();
