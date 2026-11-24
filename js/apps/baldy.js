/* 超级秃子魔法设置 2003（照那几年的"超级兔子"做的系统小工具；创意稿见「超级秃子-创意.md」）
   - 桌面上占了阳寿余额查询那一格；开始 ▸ 所有程序 ▸ 超级秃子：超级秃子魔法设置 ／ 超级秃子清理王 ／ 卸载超级秃子
   - 左边一竖排：清理王 ／ 魔法设置 ／ 上网修复 ／ 系统检测 ／ 内存整理
   - 清理王 ▸ 流氓插件：能清掉海葵工具条（清之前它求饶两回，作者定 8B）；以后别的软件捆绑的工具条也往 ROGUES 里加
   - 清理王 ▸ 注册表：怎么扫都是 12,834 个；勾上"深度清理"再修复 → 桌面图标一个个没了、任务栏没了 → 蓝屏 SYSTEM_TOO_CLEAN
   - 魔法设置：开机启动（抠抠 kkBoot ／ 千千不听 qqAuto ／ 瑞鑫 rxBoot）、开始按钮的字（startText）、浏览器标题（ieTitle）；改了重启还在
   - 上网修复：主页改回 huai123、锁定主页（ieHomeLock，流氓网站改不了；超级秃子卸了就不管用）
   - 系统检测：硬件清单 + 跑分；内存整理：越整理放出来的越多，第 5 下起比 640 KB 还多
   OS.baldy：open(页) ／ close ／ rogues */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.baldy;
  if (!app) return;
  const NAME = '超级秃子魔法设置 2003';

  /* ================= 文案 ================= */
  const L = {
    slogan: '让你的电脑像我的头一样干净。',
    tabs: [['clean', '清理王', 'tzClean'], ['magic', '魔法设置', 'tzMagic'], ['ie', '上网修复', 'tzNet'], ['sys', '系统检测', 'tzSys'], ['mem', '内存整理', 'tzMem']],
    // 清理王
    cleanTabs: [['rogue', '流氓插件'], ['trace', '上网痕迹'], ['reg', '注册表']],
    junk: '垃圾文件？那是磁盘清理的活儿。',
    rogueFound: n => '发现流氓插件 ' + n + ' 个：',
    rogueHead: ['名称', '类型', '来自'],
    clearBtn: '清除',
    noRogue: '没有发现流氓插件。\n你的浏览器很干净，跟我的头一样。',
    pleadYes: '删', pleadNo: '不删',
    clearing: n => '正在清除 ' + n + '……',
    cleared: n => n + ' 已清除。',
    traceHead: '要清理的上网痕迹：',
    traceItems: ['浏览器历史记录', 'Cookies', '上网临时文件'],
    traceBtn: '开始清理', traceIng: '正在清理上网痕迹……', traceNone: '一项都没勾。',
    traceDone: '上网痕迹已清除。\n放心，谁也查不到了。',
    regIdle: '点"扫描"，检查注册表里的错误。',
    regScan: '扫描', regFix: '全部修复',
    regIng: '正在扫描注册表……', regFound: n => '发现注册表错误 ' + n + ' 个',
    regFixing: '正在修复……', regFixed: '修复完成。',
    deep: '深度清理：系统文件里没用的也一起清', deepTip: '不建议勾选',
    deepIng: '正在深度清理……',
    // 魔法设置
    magicTabs: [['boot', '启动程序'], ['start', '开始按钮'], ['title', '浏览器标题']],
    bootHead: '开机时自己跑起来的程序：',
    bootRows: { koukou: ['抠抠2003', '开机启动'], qianqian: ['千千不听', '开机自动播放'], ruixin: ['瑞鑫杀毒', '开机启动'] },
    bootNone: '没有开机自己跑起来的程序。',
    bootTip: '打勾的，下次开机自己跑起来。',
    startHead: '把左下角"开始"两个字改成：', startTip: '最多 4 个字',
    titleHead: '浏览器窗口标题栏后面那段改成：', titleEg: t => '网址之家 - ' + t,
    apply: '应用', reset: '恢复默认',
    startDone: '改好了，看看左下角。', titleDone: '改好了，打开浏览器看看。',
    // 上网修复
    homeNow: h => '现在的主页：' + h,
    homeOk: '你的浏览器主页很正常。', homeBad: '主页被改过了。',
    fixBtn: '一键修复', fixed: h => '主页已改回 ' + h + '。',
    lock: '锁定主页', lockTip: '锁上以后，别的网页改不了你的主页。',
    // 系统检测
    sysRows: () => [['处理器', '不奔腾 III　0.5 GHz'], ['内存', '640 KB'], ['显卡', '能显示'], ['声卡', '能响'],
      ['光驱', OS.cdTray && OS.cdTray.out() ? (OS.cdTray.hasCup() ? '托盘开着，上面放着一杯可乐' : '托盘开着，里面没有光盘') : '里面有一张幻觉游戏 V3.0'], ['鼠标', '有球的那种']],
    bench: '跑分', benchIng: '正在跑分……',
    benchRes: '你的电脑得分：64 分。\n超过了全国 0.3% 的电脑。\n建议：换一台。',
    // 内存整理
    memTotal: '总内存：640 KB', memUsed: n => '已用：' + n + ' KB', memFree: n => '可用：' + n + ' KB',
    memBtn: '立即整理', memIng: '正在整理内存……',
    memFreed: n => '成功释放 ' + n + ' KB 内存。',
    memOver: '成功释放 2 MB 内存。\n你的电脑一共只有 640 KB。'
  };
  const BSOD = { id: 'baldy', name: 'SYSTEM_TOO_CLEAN', text: '清理得太干净了，系统也被清理掉了。' };
  const REG_ERRORS = '12,834';
  const REG_KEYS = ['HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', 'HKEY_CURRENT_USER\\Software\\Koukou\\2003',
    'HKEY_CLASSES_ROOT\\CLSID\\{HAIKUI-TOOLBAR}', 'HKEY_CURRENT_USER\\Software\\Internot Explorer\\Main', 'HKEY_USERS\\.DEFAULT\\Control Panel\\Desktop',
    'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services', 'HKEY_CLASSES_ROOT\\.huai123'];
  const DEEP_FILES = ['C:\\WINDOWS\\Fonts\\宋体.ttf', 'C:\\WINDOWS\\system32\\很重要.dll', 'C:\\WINDOWS\\explorer.exe', 'C:\\WINDOWS\\system32\\hal.dll', 'C:\\WINDOWS\\system32\\ntoskrnl.exe'];

  // 老存档：阳寿余额查询在桌面上那一格让给超级秃子
  (function () {
    const pos = OS.save.get('iconPos', {});
    if (pos.lifespan && !pos.baldy) { pos.baldy = pos.lifespan; delete pos.lifespan; OS.save.set('iconPos', pos); }
  })();

  /* ================= 流氓插件（以后别的软件捆绑的工具条也加在这里） ================= */
  const ROGUES = [
    { id: 'haikui', name: '海葵工具条', kind: '浏览器工具栏', from: '海葵补丁 捆绑安装', icon: 'haikui',
      on: () => !!(OS.koukou && OS.koukou.toolbar && OS.koukou.toolbar()),
      plead: ['别删我！我能显 IP！', '我还能搜索！虽然一直在维护。'],
      remove: () => { if (OS.koukou && OS.koukou.dropToolbar) OS.koukou.dropToolbar(); if (OS.ie && OS.ie.dropToolbar) OS.ie.dropToolbar(); } }
  ];

  /* ================= 小零件 ================= */
  let V = null;           // 开着的窗口：{ win, body, navBtns, tab, sub, my }
  let token = 0;
  const alive = my => !!(V && V.my === my && V.win && !V.win.isClosed);
  const btn = (text, cls) => el('button', { class: 'xpbtn' + (cls ? ' ' + cls : ''), text });
  const line = text => el('div', { class: 'tz-line', text: text || '' });
  function bar() {
    const fill = el('div', { class: 'tz-barf' });
    const node = el('div', { class: 'tz-bar' }, [fill]);
    return { node, set: p => { fill.style.width = Math.max(0, Math.min(100, p)) + '%'; } };
  }
  // 进度条走 ms 毫秒；每一步回调 0–100；窗口关了就停（返回 false）
  function run(ms, step, my) {
    return new Promise(res => {
      const t0 = performance.now();
      const tick = () => {
        if (my != null && !alive(my)) { res(false); return; }
        const p = Math.min(1, (performance.now() - t0) / ms);
        if (step) step(p * 100);
        if (p >= 1) res(true); else requestAnimationFrame(tick);
      };
      tick();
    });
  }
  function chk(label, on, fn, extra) {
    const c = el('input', { type: 'checkbox' });
    c.checked = !!on;
    if (fn) c.addEventListener('change', () => { OS.sound.play('click'); fn(c.checked); });
    return { box: c, node: el('label', { class: 'tz-chk' }, [c, el('span', { text: label })].concat(extra || [])) };
  }
  function subTabs(list, cur, pick) {
    return el('div', { class: 'cp-tabs tz-tabs' }, list.map(([k, label]) => {
      const t = el('div', { class: 'cp-tab' + (k === cur ? ' on' : ''), text: label });
      t.addEventListener('click', () => { if (k === cur || (V && V.busy)) return; OS.sound.play('click'); pick(k); });
      return t;
    }));
  }

  /* ================= 主窗口 ================= */
  function open(tab) {
    if (V && V.win && !V.win.isClosed) {
      if (V.win.minimized) OS.wm.restore(V.win);
      OS.wm.focus(V.win);
      if (tab && !V.busy) show(tab);
      return V.win;
    }
    const nav = el('div', { class: 'tz-nav' });
    const body = el('div', { class: 'tz-body' });
    const content = el('div', { class: 'tz' }, [
      el('div', { class: 'tz-banner' }, [el('img', { class: 'tz-mascot', src: 'assets/baldy/mascot.webp', alt: '', draggable: 'false' }), el('div', {}, [el('div', { class: 'tz-bname', text: NAME }), el('div', { class: 'tz-bsub', text: L.slogan })])]),
      el('div', { class: 'tz-main' }, [nav, body])
    ]);
    V = { win: null, body, navBtns: {}, tab: null, sub: { clean: 'rogue', magic: 'boot' }, my: ++token, busy: false };
    L.tabs.forEach(([id, label, icon]) => {
      const b = el('div', { class: 'tz-navb' }, [OS.iconEl(icon, 'tz-navi'), el('span', { text: label })]);
      b.addEventListener('click', e => { e.stopPropagation(); if (V.busy) return; OS.sound.play('click'); show(id); });
      V.navBtns[id] = b;
      nav.appendChild(b);
    });
    const my = V.my;
    V.win = OS.wm.open({ title: NAME, icon: 'baldy', width: 344, content, appId: app.id, maximizable: false, center: true,
      onClose: () => { if (V && V.my === my) V = null; } });
    show(tab || 'clean');
    return V.win;
  }
  function close() { if (V && V.win && !V.win.isClosed) V.win.close(); }
  function show(tab) {
    if (!V) return;
    V.tab = tab;
    Object.keys(V.navBtns).forEach(k => V.navBtns[k].classList.toggle('on', k === tab));
    V.body.textContent = '';
    ({ clean: cleanPage, magic: magicPage, ie: iePage, sys: sysPage, mem: memPage })[tab](V.body);
  }

  /* ---------- 清理王 ---------- */
  function cleanPage(body) {
    const sub = V.sub.clean;
    const pane = el('div', { class: 'tz-pane' });
    body.append(subTabs(L.cleanTabs, sub, k => { V.sub.clean = k; show('clean'); }), pane, el('div', { class: 'tz-foot', text: L.junk }));
    ({ rogue: roguePane, trace: tracePane, reg: regPane })[sub](pane);
  }
  function roguePane(p) {
    const list = ROGUES.filter(r => r.on());
    if (!list.length) { p.append(el('div', { class: 'tz-empty', text: L.noRogue })); return; }
    const rows = el('div', { class: 'tz-rlist' }, [el('div', { class: 'tz-rrow tz-rhead' }, L.rogueHead.map(t => el('span', { text: t })).concat([el('span')]))]);
    list.forEach(r => {
      const b = btn(L.clearBtn);
      b.addEventListener('click', () => { OS.sound.play('click'); clearRogue(r, p); });
      rows.append(el('div', { class: 'tz-rrow' }, [el('span', { class: 'tz-rname' }, [OS.iconEl(r.icon, 'tz-rico'), el('span', { text: r.name })]), el('span', { text: r.kind }), el('span', { text: r.from }), b]));
    });
    p.append(el('div', { class: 'tz-tip', text: L.rogueFound(list.length) }), rows);
  }
  // 作者定 8B：先求饶两回，两回都点"删"才删
  async function clearRogue(r, p) {
    if (!V || V.busy) return;
    const my = V.my;
    for (const t of r.plead) {
      const v = await OS.ui.dialog({ title: r.name, icon: r.icon, text: t, buttons: [L.pleadYes, L.pleadNo] });
      if (v !== L.pleadYes) return;
    }
    if (!alive(my)) { r.remove(); OS.sound.play('tzWhoosh'); return; }
    V.busy = true;
    const ln = line(L.clearing(r.name)), b = bar();
    p.textContent = '';
    p.append(ln, b.node);
    await run(900, b.set, my);
    r.remove();
    OS.sound.play('tzWhoosh');
    if (!alive(my)) return;
    V.busy = false;
    ln.textContent = L.cleared(r.name);
    setTimeout(() => { if (alive(my) && V.tab === 'clean' && V.sub.clean === 'rogue' && !V.busy) show('clean'); }, 1800);
  }
  function tracePane(p) {
    const items = L.traceItems.map(t => chk(t, true));
    const go = btn(L.traceBtn, 'default');
    const b = bar(), ln = line();
    p.append(el('div', { class: 'tz-tip', text: L.traceHead }), ...items.map(x => x.node), el('div', { class: 'tz-btns' }, [go]), b.node, ln);
    go.addEventListener('click', async () => {
      OS.sound.play('click');
      if (!items.some(x => x.box.checked)) { ln.textContent = L.traceNone; return; }
      const my = V.my;
      V.busy = true; go.disabled = true;
      ln.textContent = L.traceIng;
      if (!await run(1300, b.set, my)) return;
      if (items[0].box.checked && OS.ie && OS.ie.clearHistory) OS.ie.clearHistory();
      V.busy = false; go.disabled = false;
      ln.textContent = L.traceDone;
    });
  }
  function regPane(p) {
    const scan = btn(L.regScan, 'default'), fix = btn(L.regFix);
    fix.disabled = true;
    const deep = chk(L.deep, false, null, [el('span', { class: 'tz-warn', text: L.deepTip })]);
    const ln = line(L.regIdle), path = el('div', { class: 'tz-path' }), b = bar();
    p.append(ln, path, b.node, el('div', { class: 'tz-btns' }, [scan, fix]), deep.node);
    const lock = on => { V.busy = on; scan.disabled = on; deep.box.disabled = on; };
    scan.addEventListener('click', async () => {
      OS.sound.play('click');
      const my = V.my;
      lock(true); fix.disabled = true;
      ln.textContent = L.regIng;
      let k = 0;
      const ok = await run(1600, v => { b.set(v); if (v / 100 * 14 > k) { path.textContent = REG_KEYS[k % REG_KEYS.length]; k++; } }, my);
      if (!ok) return;
      path.textContent = '';
      lock(false); fix.disabled = false;
      ln.textContent = L.regFound(REG_ERRORS);   // 作者定 12A：修完再扫还是这么多
    });
    fix.addEventListener('click', async () => {
      OS.sound.play('click');
      const my = V.my;
      lock(true); fix.disabled = true;
      if (deep.box.checked) { tooClean(ln, path, b, my); return; }
      ln.textContent = L.regFixing;
      if (!await run(1200, b.set, my)) return;
      lock(false);
      ln.textContent = L.regFixed;
    });
  }
  // 深度清理：进度条走到一半，桌面图标一个个没了、任务栏也没了 → 蓝屏（重启全回来，开机多一行"正在把清掉的系统文件捡回来"）
  async function tooClean(ln, path, b, my) {
    ln.textContent = L.deepIng;
    let k = 0;
    await run(1400, v => { b.set(v / 2); if (v / 100 * DEEP_FILES.length > k) { path.textContent = DEEP_FILES[Math.min(k, DEEP_FILES.length - 1)]; k++; } });
    const icons = [...document.querySelectorAll('#icons .dicon')].filter(n => n.offsetParent);
    for (let i = icons.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [icons[i], icons[j]] = [icons[j], icons[i]]; }
    for (const n of icons) {
      if (OS.boot.state !== 'desktop') return;
      n.classList.add('tz-gone');
      OS.sound.play('tzPop');
      await OS.wait(110);
    }
    await OS.wait(300);
    const tb = document.getElementById('taskbar');
    if (tb) tb.classList.add('tz-gone');
    OS.sound.play('tzWhoosh');
    await OS.wait(900);
    if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD);
  }
  OS.on('desktop:reset', () => {
    document.querySelectorAll('.tz-gone').forEach(n => n.classList.remove('tz-gone'));
    MEM.used = MEM_BASE; MEM.n = 0;
  });

  /* ---------- 魔法设置 ---------- */
  function magicPage(body) {
    const sub = V.sub.magic;
    const pane = el('div', { class: 'tz-pane' });
    body.append(subTabs(L.magicTabs, sub, k => { V.sub.magic = k; show('magic'); }), pane);
    ({ boot: bootPane, start: startPane, title: titlePane })[sub](pane);
  }
  // 作者定 16A：这里改的重启还在（是你自己改的，不是故障）
  const BOOTS = [
    ['koukou', 'koukou', () => OS.save.get('kkBoot', true) !== false, v => OS.save.set('kkBoot', v)],
    ['qianqian', 'music', () => !!OS.save.get('qqAuto', false), v => OS.save.set('qqAuto', v)],
    ['ruixin', 'ruixin', () => !!OS.save.get('rxBoot', false), v => OS.save.set('rxBoot', v)]
  ];
  function bootPane(p) {
    const list = BOOTS.filter(x => !OS.soft || OS.soft.has(x[0]));
    if (!list.length) { p.append(el('div', { class: 'tz-empty', text: L.bootNone })); return; }
    p.append(el('div', { class: 'tz-tip', text: L.bootHead }));
    list.forEach(([id, icon, get, set]) => {
      const [name, what] = L.bootRows[id];
      const c = el('input', { type: 'checkbox' });
      c.checked = get();
      c.addEventListener('change', () => { OS.sound.play('click'); set(c.checked); });
      p.append(el('label', { class: 'tz-boot' }, [c, OS.iconEl(icon, 'tz-rico'), el('span', { class: 'tz-bootn', text: name }), el('span', { class: 'tz-bootw', text: what })]));
    });
    p.append(el('div', { class: 'tz-note', text: L.bootTip }));
  }
  function startPane(p) {
    const input = el('input', { type: 'text', class: 'tz-in', maxlength: '4', spellcheck: 'false', autocomplete: 'off' });
    input.value = OS.save.get('startText', '') || '开始';
    const ok = btn(L.apply, 'default'), rs = btn(L.reset), ln = line();
    p.append(el('div', { class: 'tz-tip', text: L.startHead }), el('div', { class: 'tz-inrow' }, [input, el('span', { class: 'tz-note', text: L.startTip })]), el('div', { class: 'tz-btns' }, [ok, rs]), ln);
    ok.addEventListener('click', () => { OS.sound.play('click'); OS.taskbar.setStartText(input.value); input.value = OS.save.get('startText', '') || '开始'; ln.textContent = L.startDone; });
    rs.addEventListener('click', () => { OS.sound.play('click'); OS.taskbar.setStartText(''); input.value = '开始'; ln.textContent = L.startDone; });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ok.click(); } });
  }
  const IE_NAME = 'Internot Explorer';
  function titlePane(p) {
    const input = el('input', { type: 'text', class: 'tz-in tz-inw', maxlength: '16', spellcheck: 'false', autocomplete: 'off' });
    input.value = OS.save.get('ieTitle', '') || IE_NAME;
    const eg = el('div', { class: 'tz-eg' });
    const sync = () => { eg.textContent = L.titleEg(input.value.trim() || IE_NAME); };
    sync();
    input.addEventListener('input', sync);
    const ok = btn(L.apply, 'default'), rs = btn(L.reset), ln = line();
    p.append(el('div', { class: 'tz-tip', text: L.titleHead }), input, eg, el('div', { class: 'tz-btns' }, [ok, rs]), ln);
    const set = v => {
      v = v.trim().slice(0, 16);
      if (v && v !== IE_NAME) OS.save.set('ieTitle', v); else OS.save.remove('ieTitle');
      input.value = v || IE_NAME; sync();
      if (OS.ie && OS.ie.retitle) OS.ie.retitle();
      ln.textContent = L.titleDone;
    };
    ok.addEventListener('click', () => { OS.sound.play('click'); set(input.value); });
    rs.addEventListener('click', () => { OS.sound.play('click'); set(''); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ok.click(); } });
  }

  /* ---------- 上网修复 ---------- */
  function iePage(body) {
    const home = OS.ie ? OS.ie.home() : 'www.huai123.com', HOME = OS.ie ? OS.ie.HOME : home;
    const bad = home !== HOME;
    const fix = btn(L.fixBtn, 'default'), ln = line();
    const lock = chk(L.lock, OS.save.get('ieHomeLock', false), v => OS.save.set('ieHomeLock', v));
    body.append(el('div', { class: 'tz-pane tz-solo' }, [
      el('div', { class: 'tz-tip', text: L.homeNow(home) }),
      el('div', { class: 'tz-state' + (bad ? ' bad' : ''), text: bad ? L.homeBad : L.homeOk }),
      el('div', { class: 'tz-btns' }, [fix]), ln,
      el('div', { class: 'tz-sep' }), lock.node, el('div', { class: 'tz-note', text: L.lockTip })
    ]));
    fix.addEventListener('click', () => {
      OS.sound.play('click');
      if (!(OS.ie && OS.ie.fixHome && OS.ie.fixHome())) { ln.textContent = L.homeOk; return; }
      OS.sound.play('tzWhoosh');
      show('ie');
      const n = V && V.body.querySelector('.tz-line');
      if (n) n.textContent = L.fixed(HOME);
    });
  }

  /* ---------- 系统检测 ---------- */
  function sysPage(body) {
    const go = btn(L.bench, 'default'), b = bar(), ln = line();
    body.append(el('div', { class: 'tz-pane tz-solo' }, [
      el('div', { class: 'tz-hw' }, [].concat(...L.sysRows().map(([k, v]) => [el('span', { class: 'tz-hwk', text: k + '：' }), el('span', { text: v })]))),
      el('div', { class: 'tz-btns' }, [go]), b.node, ln
    ]));
    go.addEventListener('click', async () => {
      OS.sound.play('click');
      const my = V.my;
      V.busy = true; go.disabled = true;
      ln.textContent = L.benchIng;
      if (!await run(2200, b.set, my)) return;
      V.busy = false; go.disabled = false;
      ln.textContent = L.benchRes;
    });
  }

  /* ---------- 内存整理 ---------- */
  const MEM_TOTAL = 640, MEM_BASE = 598;
  const MEM_STEPS = [96, 160, 320, 512];   // 第 5 下起：2 MB，比你有的还多
  const MEM = { used: MEM_BASE, n: 0, back: 0 };
  function memPage(body) {
    const fill = el('div', { class: 'tz-memf' });
    const used = el('div'), free = el('div'), ln = line();
    const go = btn(L.memBtn, 'default');
    const paint = () => {
      const u = Math.max(0, Math.round(MEM.used));
      fill.style.height = (u / MEM_TOTAL * 100) + '%';
      used.textContent = L.memUsed(u);
      free.textContent = L.memFree(MEM_TOTAL - u);
    };
    paint();
    body.append(el('div', { class: 'tz-pane tz-solo tz-mem' }, [
      el('div', { class: 'tz-memb' }, [fill]),
      el('div', { class: 'tz-memr' }, [el('div', { text: L.memTotal }), used, free, el('div', { class: 'tz-btns' }, [go]), ln])
    ]));
    go.addEventListener('click', async () => {
      OS.sound.play('click');
      const my = V.my;
      V.busy = true; go.disabled = true;
      clearInterval(MEM.back);
      ln.textContent = L.memIng;
      OS.sound.play('tzFlush');
      const from = MEM.used, over = MEM.n >= MEM_STEPS.length;
      const to = over ? 0 : Math.max(24, from - MEM_STEPS[MEM.n]);
      const ok = await run(900, v => { MEM.used = from + (to - from) * v / 100; paint(); }, my);
      MEM.used = to;
      const freed = over ? 0 : MEM_STEPS[MEM.n];
      MEM.n++;
      if (!ok) return;
      V.busy = false; go.disabled = false;
      paint();
      ln.textContent = over ? L.memOver : L.memFreed(freed);
      // 过一会儿又慢慢被占回去
      MEM.back = setInterval(() => {
        MEM.used = Math.min(MEM_BASE, MEM.used + 18);
        if (alive(my) && V.tab === 'mem') paint();
        if (MEM.used >= MEM_BASE) clearInterval(MEM.back);
      }, 400);
    });
  }

  app.open = () => open();
  OS.baldy = { open, close, rogues: ROGUES };
})();
