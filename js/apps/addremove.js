/* 添加或删除程序（控制面板 ▸ 添加或删除程序；我的电脑左边"添加/删除程序"）——照 XP 原版，左边三个大按钮：
   - 更改或删除程序：装着的软件；点一行展开（使用频率、上次使用日期是真的）→［删除］；勾"显示更新"，补丁挂在本体下面
   - 添加新程序：［CD 或软盘］装光盘里的、［无聊科技］开官网；下面是拿到过、现在没装着的 →［重新装回］
   - 添加/删除 Windows 组件：带勾的列表，去掉勾 = 删，打上勾 = 装回；最下面 Windoesn't XP 去掉勾 → 蓝屏
   卸掉以后：桌面图标、开始菜单、Program Files 里的 exe 都没了（文件夹空着留下），开着的直接关掉，存档留着（装回来接着用）；
   重启也还是卸掉的，一键还原才全部回来。
   别处打开被卸掉的：一句"请先装回 xxx"；图片没了 ABCSee 改用图片和传真查看器。
   OS.soft：has(软件) ／ appOk(程序 id) ／ got(软件) ／ uninstall(软件) ／ virusBeaten、beatVirus(病毒)（以后杀毒软件用） */
(function () {
  'use strict';
  const el = OS.el;

  /* ================= 文案 ================= */
  const T = '添加或删除程序';
  const L = {
    tabs: [['更改或删除程序', 'control'], ['添加新程序', 'cd'], ['添加/删除 Windows 组件', 'logo']],
    // 更改或删除程序
    cur: '当前安装的程序：', showUpd: '显示更新', sortBy: '排序方式：', sorts: ['名称', '大小', '使用频率', '上次使用日期'],
    size: '大小', freq: '使用频率', last: '上次使用日期', freqs: ['很少', '偶尔', '经常'], never: '从未',
    del: '删除', change: '更改', noProg: '没有安装任何程序。',
    // 办公三件套的［更改］
    chgTitle: n => n + ' 安装', chgCap: '选择要安装的组件：', chgOk: '更新', updating: n => '正在更新 ' + n + '……',
    confirm: n => '确实要删除 ' + n + ' 吗？', yes: '是', no: '否',
    kidsAsk: (k, n) => k + ' 需要 ' + n + '，将一起删除。', ok: '确定', cancel: '取消',
    removing: n => '正在删除 ' + n + '……',
    // 添加新程序
    addCd: '从 CD-ROM 或软盘添加程序', cdBtn: 'CD 或软盘',
    addWeb: '从无聊科技添加程序', webBtn: '无聊科技',
    backCap: '可以装回的程序：', backSub: '已从本机删除，安装文件还在', back: '重新装回', noBack: '没有可以添加的程序。',
    needFirst: n => '请先安装 ' + n + '。',
    // Windows 组件
    compCap: "可以添加或删除 Windoesn't XP 的组件。", next: '下一步 >', configuring: '正在配置组件……', noChange: '组件没有变化。',
    sysName: "Windoesn't XP", sysSize: '1,048 MB',
    // 装回来
    wizTitle: n => n + ' 安装向导',
    welcome: n => '欢迎使用 ' + n + ' 安装向导',
    welcomeText: n => '这个向导将把 ' + n + ' 装回您的电脑。\n安装文件还在，不用上网。',
    licenseCap: '许可协议',
    license: '最终用户许可协议\n\n1. 本软件归作者所有。\n2. 您的电脑归本软件所有。\n3. 点"我接受"即表示您同意以上两条。',
    accept: '我接受',
    where: '安装到：',
    extras: '附加选项', extrasTip: '推荐安装：', bundle: ['同时安装海葵工具条', '将 huai123 设为主页'],
    copying: ['正在复制文件……', '正在创建快捷方式……', '正在写入注册表……'],
    done: n => n + ' 安装完成。', restored: '检测到上次的设置，已为您恢复。', finish: '完成',
    newProg: '新安装了程序',
    // 别处打开被卸掉的
    openTitle: '打开文件',
    missingFile: n => '找不到打开这个文件的程序。\n请先装回 ' + n + '。',
    missingApp: n => '找不到这个程序。\n请先装回 ' + n + '。',
    picTitle: n => n + ' - 图片和传真查看器', picBar: (n, w, h) => n + '　' + w + ' × ' + h + ' 像素'
  };
  const BSOD = { id: 'addremove', name: 'SYSTEM_UNINSTALLED_ITSELF', text: '系统都卸，你真BT啊！' };

  /* ================= 软件清单 =================
     apps：卸了以后藏起来的程序（桌面图标、开始菜单）；files：卸了以后打不开的"文件"（暴富秘籍.rar、欠条.xls 还在，只是打不开）
     plead：挽留（[说的话, 删除按钮, 不删按钮]）；不挽留的就问一句"确实要删除吗"
     on / remove / reinstall：自己管装没装的（补丁、光盘游戏） */
  const PROGS = [
    { id: 'koukou', name: '抠抠2003', icon: 'koukou', size: 23.6, apps: ['koukou'], dir: '抠抠软件',
      plead: ['抠抠会想你的。\n好友找不到你，会以为你隐身了。', '残忍删除', '再想想'],
      stop: () => OS.koukou && OS.koukou.kill() },
    { id: 'kkpatch', name: '海葵抠抠补丁', icon: 'exe', size: 1.2, parent: 'koukou',
      plead: ['删除以后，您就再也看不见谁把你拉黑了。\n真的要做一个快乐的人吗？', '做个快乐的人', '再想想'],
      after: '海葵抠抠补丁已删除。\n抠抠变回原来的样子了。',
      on: () => !!(OS.koukou && OS.koukou.patched()),
      remove: () => OS.koukou.removePatch(),
      // 用它自己那个安装向导；抠抠开着就先帮你关掉
      reinstall: () => { if (OS.koukou.running()) OS.koukou.kill(); OS.koukou.patchInstaller(); } },
    { id: 'qianqian', name: '千千不听', icon: 'music', size: 8.8, apps: ['qianqian'], dir: '千千不听',
      plead: ['真的不听了吗？', '不听了', '再听听'], after: '删除完成。\n世界安静了。',
      stop: () => OS.qianqian && OS.qianqian.kill() },
    { id: 'abcsee', name: 'ABCSee 大眼看图 V3.1', icon: 'abcsee', size: 4.2, apps: ['abcsee'], dir: 'ABCSee',
      plead: ['ABCSee 还没把您的图片看够。', '残忍删除', '再想想'] },
    // 办公三件套：一整行，［更改］勾要哪几个（offense.js）；三个各自算"组件"，存在 softRemoved 里
    { id: 'offense', name: 'Offense 2003', icon: 'offense', size: 345, dir: 'Offense 2003',
      comps: [['wordy', 'Wordy 2003', 112], ['excuse', 'Excuse 2003', 156], ['ppt', 'PowerPointless 2003', 77]] },
    { id: 'rich', name: '解压专家 2003', icon: 'rar', size: 2.3, files: ['rich'], dir: '解压专家 2003' },
    // 光盘里装的：装回要光盘在光驱里（走光盘自己的安装向导）
    { id: 'hj', name: '幻觉游戏 V3.0', icon: 'cd', size: 650,
      on: () => !!(OS.hj && OS.hj.installed()), remove: () => OS.hj.uninstall(), reinstall: () => OS.hj.install() }
  ];
  const PROG = {};
  PROGS.forEach(p => { PROG[p.id] = p; });
  // Windows 组件：[分组, [[程序 id, 大小 MB]]]
  const COMPS = [
    ['附件和工具', [['notepad', 0.1], ['wordpad', 0.9], ['paint', 1.3], ['calc', 0.1], ['cmd', 0.4]]],
    ['实用小程序', [['swatter', 0.6], ['coil', 0.2], ['bootcheck', 0.3], ['pulse', 0.8], ['lifespan', 0.5]]],
    ['游戏', [['hearts', 0.4], ['freecell', 0.3], ['pinball', 0.9], ['sweep', 0.2], ['spider', 0.4], ['solitaire', 0.3]]],   // 照中文 XP 开始菜单的顺序
    ['上网', [['ie', 11.9], ['mail', 4.3]]]
  ];
  const COMP_IDS = [].concat(...COMPS.map(g => g[1].map(x => x[0])));
  // 办公三件套的三个 ／ 靠它们打开的文件（欠条打印专家 2003.xls 靠 Excuse）
  const SUITE = PROGS.filter(p => p.comps);
  const SUITE_IDS = [].concat(...SUITE.map(p => p.comps.map(c => c[0])));
  const FILE_OWNER = { debt: 'excuse' };

  /* ================= 存档 ================= */
  const RM_KEY = 'softRemoved';   // 卸掉的：软件 id（抠抠、千千……）和组件的程序 id（notepad……）
  const GOT_KEY = 'softGot';      // 后来才拿到的（补丁、光盘游戏）装过一次就记下
  const VIR_KEY = 'virusBeaten';  // 打败过的病毒（以后杀毒软件写）
  const USE_KEY = 'appUse';       // 每个程序开过几次、最后一次什么时候
  const removed = () => OS.save.get(RM_KEY, []);
  if (removed().indexOf('debt') >= 0) OS.save.set(RM_KEY, removed().filter(x => x !== 'debt').concat('excuse'));   // 老存档：以前那一行叫 Excuse 2003
  function setRemoved(list) { OS.save.set(RM_KEY, list); OS.emit('soft:change'); OS.emit('fs:change'); }
  const progOn = p => (p.comps ? p.comps.some(c => removed().indexOf(c[0]) < 0) : p.on ? p.on() : removed().indexOf(p.id) < 0);
  const compOn = id => removed().indexOf(id) < 0;
  function syncGot() {
    const got = OS.save.get(GOT_KEY, []);
    let changed = false;
    PROGS.forEach(p => { if (p.on && p.on() && got.indexOf(p.id) < 0) { got.push(p.id); changed = true; } });
    if (changed) OS.save.set(GOT_KEY, got);
    return got;
  }
  const got = p => (p.on ? syncGot().indexOf(p.id) >= 0 : true);
  // 程序 id → 哪个软件 ／ 组件管它
  const progOfApp = id => PROGS.find(p => (p.apps || []).indexOf(id) >= 0);
  const progOfFile = id => PROGS.find(p => (p.files || []).indexOf(id) >= 0);
  function appOk(id) {
    const p = progOfApp(id);
    if (p) return progOn(p);
    if (COMP_IDS.indexOf(id) >= 0 || SUITE_IDS.indexOf(id) >= 0) return compOn(id);
    return true;
  }
  const nameOf = id => { const p = progOfApp(id) || progOfFile(id); return p ? p.name : (OS.apps.byId[id] ? OS.apps.byId[id].name : id); };
  const missingFile = id => OS.ui.dialog({ title: L.openTitle, icon: 'warn', text: L.missingFile(nameOf(id)) });
  const missingApp = id => OS.ui.dialog({ title: nameOf(id), icon: 'warn', text: L.missingApp(nameOf(id)) });
  // OS.apps.open 先问这个：被卸掉了就说一句，返回 true
  function blocked(id) {
    const f = progOfFile(id);
    if (f && !progOn(f)) { missingFile(id); return true; }
    if (FILE_OWNER[id] && !compOn(FILE_OWNER[id])) { missingFile(FILE_OWNER[id]); return true; }
    if (!appOk(id)) { missingApp(id); return true; }
    return false;
  }

  /* ---------- 使用频率、上次使用日期：按真开过几次算 ---------- */
  const TRACK = new Set(COMP_IDS.concat(SUITE_IDS, Object.keys(FILE_OWNER), ...PROGS.map(p => (p.apps || []).concat(p.files || []))));
  OS.on('win:open', w => {
    if (!w || !TRACK.has(w.appId)) return;
    const use = OS.save.get(USE_KEY, {});
    const u = use[w.appId] || { n: 0, at: 0 };
    use[w.appId] = { n: u.n + 1, at: OS.clock.now().getTime() };
    OS.save.set(USE_KEY, use);
  });
  function usage(ids) {
    const use = OS.save.get(USE_KEY, {});
    let n = 0, at = 0;
    ids.forEach(id => { if (use[id]) { n += use[id].n; at = Math.max(at, use[id].at); } });
    const d = at ? new Date(at) : null;
    return { n, at, freq: L.freqs[n < 3 ? 0 : n < 10 ? 1 : 2], last: d ? OS.YEAR + '-' + (d.getMonth() + 1) + '-' + d.getDate() : L.never };
  }
  const idsOf = p => (p.apps || []).concat(p.files || [], p.comps ? p.comps.map(c => c[0]).concat(Object.keys(FILE_OWNER).filter(k => p.comps.some(c => c[0] === FILE_OWNER[k]))) : []);
  const mb = s => (s < 10 ? s.toFixed(2) : s < 100 ? s.toFixed(1) : String(Math.round(s))) + ' MB';

  /* ================= 卸掉 ／ 装回去时各处跟着变 ================= */
  function closeApps(ids) {
    OS.wm.wins.filter(w => ids.indexOf(w.appId) >= 0).forEach(w => OS.wm.close(w));
  }
  const dropIcons = ids => ids.forEach(id => OS.desktop.dropApp && OS.desktop.dropApp(id));
  const bringIcons = ids => ids.forEach(id => OS.desktop.bringApp && OS.desktop.bringApp(id));
  // 装回来：开始菜单里重新标成浅黄色"新安装的程序"，右下角冒一句
  function freshen(ids) {
    OS.save.set('opened', OS.save.get('opened', []).filter(id => ids.indexOf(id) < 0));
  }
  const announce = names => OS.ui.notify({ title: L.newProg, text: names.join('、'), icon: 'info', timeout: 5000 });

  // 一个进度框：字 + 一根走满的条
  function progress(text, ms) {
    return new Promise(res => {
      const fill = el('div', { class: 'ml-srf', style: { transition: 'width ' + (ms / 1000) + 's linear' } });
      const w = OS.wm.open({ title: T, icon: 'cd', width: 250, content: el('div', { class: 'ml-sr' }, [el('div', { class: 'ml-srl', text }), el('div', { class: 'ml-srb' }, [fill])]),
        modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog', noClose: true });
      setTimeout(() => { fill.style.width = '100%'; }, 30);
      setTimeout(() => { if (!w.isClosed) w.close(); res(); }, ms + 200);
    });
  }

  /* ---------- 删除一个软件 ---------- */
  async function uninstall(id) {
    const p = PROG[id];
    if (!p || !progOn(p)) return false;
    const ok = p.plead
      ? await OS.ui.dialog({ title: T, icon: p.icon, text: p.plead[0], buttons: [p.plead[1], p.plead[2]] }) === p.plead[1]
      : await OS.ui.dialog({ title: T, icon: 'help', text: L.confirm(p.name), buttons: [L.yes, L.no] }) === L.yes;
    if (!ok) return false;
    // 补丁靠本体：本体删了补丁一起删
    const kids = PROGS.filter(k => k.parent === id && progOn(k));
    if (kids.length && await OS.ui.dialog({ title: T, icon: 'warn', text: L.kidsAsk(kids.map(k => k.name).join('、'), p.name), buttons: [L.ok, L.cancel] }) !== L.ok) return false;
    syncGot();
    [p].concat(kids).forEach(x => { if (x.stop) x.stop(); closeApps(idsOf(x)); });   // 开着的直接帮你关掉
    await progress(L.removing(p.name), 1600);
    kids.concat(p).forEach(x => {
      if (x.remove) x.remove();
      else if (x.comps) setRemoved(removed().concat(x.comps.map(c => c[0])));
      else setRemoved(removed().concat(x.id));
      dropIcons(x.apps || []);
    });
    OS.emit('soft:change');
    if (p.after) OS.ui.dialog({ title: T, icon: 'info', text: p.after });
    return true;
  }

  /* ---------- 办公三件套的［更改］：勾要哪几个 ---------- */
  function change(p) {
    const boxes = p.comps.map(([id, n, size]) => {
      const b = el('input', { type: 'checkbox' });
      b.checked = compOn(id);
      return [id, n, b, el('label', { class: 'arp-crow' }, [b, OS.iconEl(OS.apps.byId[id] ? OS.apps.byId[id].icon : 'exe', 'arp-cico'), el('span', { class: 'arp-cname', text: n }), el('span', { class: 'arp-csize', text: mb(size) })])];
    });
    const ok = el('button', { class: 'xpbtn default', text: L.chgOk });
    const no = el('button', { class: 'xpbtn', text: L.cancel });
    const w = OS.wm.open({ title: L.chgTitle(p.name), icon: p.icon, width: 260, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'arp-chg' }, [el('div', { class: 'arp-cap2', text: L.chgCap }), el('div', { class: 'arp-chgl' }, boxes.map(x => x[3])), el('div', { class: 'dlg-btns' }, [ok, no])]) });
    no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    ok.addEventListener('click', async () => {
      OS.sound.play('click');
      const drop = boxes.filter(x => !x[2].checked && compOn(x[0])).map(x => x[0]);
      const add = boxes.filter(x => x[2].checked && !compOn(x[0])).map(x => x[0]);
      w.close();
      if (!drop.length && !add.length) return;
      // 全不勾 = 整个删掉
      if (boxes.every(x => !x[2].checked)) { uninstall(p.id); return; }
      closeApps(drop.concat(Object.keys(FILE_OWNER).filter(k => drop.indexOf(FILE_OWNER[k]) >= 0)));
      await progress(L.updating(p.name), 1200 + 400 * (drop.length + add.length));
      setRemoved(removed().filter(x => add.indexOf(x) < 0).concat(drop));
      freshen(add);
      if (add.length) announce(add.map(nameOf));
    });
  }

  /* ---------- 装回一个软件 ---------- */
  function reinstall(id) {
    const p = PROG[id];
    if (!p || progOn(p)) return;
    if (p.parent && !progOn(PROG[p.parent])) { OS.ui.dialog({ title: T, icon: 'warn', text: L.needFirst(PROG[p.parent].name) }); return; }
    if (p.reinstall) { p.reinstall(); return; }
    wizard(p, opts => {
      const ids = p.comps ? p.comps.map(c => c[0]) : [p.id];
      setRemoved(removed().filter(x => ids.indexOf(x) < 0));
      bringIcons(p.apps || []);
      freshen((p.apps || []).concat(p.comps ? ids : []));
      // 安装向导里那两个默认打勾的：没取消就真装上
      if (opts.toolbar) OS.save.set('kkToolbar', true);
      if (opts.home && OS.ie && OS.ie.setHome) OS.ie.setHome('www.huai123.com');
      announce([p.name]);
    });
  }

  // 通用安装向导：欢迎 → 许可协议 → 安装到 → 附加选项（默认打勾的陷阱）→ 正在安装 → 完成
  function wizard(p, apply) {
    let pg = 0, applied = false;
    const opts = { toolbar: true, home: true };
    const body = el('div', { class: 'arw-body' });
    const btns = el('div', { class: 'arw-btns' });
    const content = el('div', { class: 'arw' }, [
      el('div', { class: 'arw-side' }, [OS.iconEl(p.icon, 'arw-logo'), el('div', { class: 'arw-brand', text: p.name })]),
      el('div', { class: 'arw-right' }, [body, btns])
    ]);
    const w = OS.wm.open({ title: L.wizTitle(p.name), icon: p.icon, width: 330, content, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
    const B = (t, fn) => { const b = el('button', { class: 'xpbtn', text: t }); b.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return b; };
    const nextB = t => B(t || L.next, () => { pg++; show(); });
    const cancelB = () => B(L.cancel, () => w.close());
    const check = (label, key) => {
      const c = el('input', { type: 'checkbox' });
      c.checked = opts[key];
      c.addEventListener('change', () => { opts[key] = c.checked; });
      return el('label', { class: 'arw-opt' }, [c, el('span', { text: label })]);
    };
    function show() {
      body.textContent = ''; btns.textContent = '';
      if (pg === 0) {
        body.append(el('div', { class: 'arw-h', text: L.welcome(p.name) }), el('div', { class: 'arw-t', text: L.welcomeText(p.name) }));
        btns.append(nextB(), cancelB());
      } else if (pg === 1) {
        body.append(el('div', { class: 'arw-h', text: L.licenseCap }), el('div', { class: 'arw-lic', text: L.license }));
        btns.append(nextB(L.accept), cancelB());
      } else if (pg === 2) {
        body.append(el('div', { class: 'arw-h', text: L.where }), el('div', { class: 'arw-path', text: 'C:\\Program Files\\' + p.dir }));
        btns.append(nextB(), cancelB());
      } else if (pg === 3) {
        body.append(el('div', { class: 'arw-h', text: L.extras }), el('div', { class: 'arw-t', text: L.extrasTip }), check(L.bundle[0], 'toolbar'), check(L.bundle[1], 'home'));
        btns.append(nextB(), cancelB());
      } else if (pg === 4) {
        const line = el('div', { class: 'arw-t', text: L.copying[0] });
        const fill = el('div', { class: 'ml-srf', style: { transition: 'width 2.4s linear' } });
        body.append(el('div', { class: 'arw-h', text: L.wizTitle(p.name).replace(' 安装向导', '') + '……' }), line, el('div', { class: 'ml-srb' }, [fill]));
        setTimeout(() => { fill.style.width = '100%'; }, 30);
        L.copying.forEach((t, i) => setTimeout(() => { line.textContent = t; }, i * 800));
        setTimeout(() => {
          if (!applied) { applied = true; apply(opts); }
          if (!w.isClosed) { pg++; show(); }
        }, 2600);
      } else {
        body.append(el('div', { class: 'arw-h', text: L.done(p.name) }), el('div', { class: 'arw-t', text: L.restored }));
        btns.append(B(L.finish, () => w.close()));
      }
    }
    show();
  }

  /* ================= 窗口 ================= */
  let win = null, ui = null, page = 0, sel = null, showUpd = false, sortBy = 0;
  function open(p) {
    if (win && !win.isClosed) { if (win.minimized) OS.wm.restore(win); OS.wm.focus(win); if (p != null) go(p); return win; }
    sel = null;
    const side = el('div', { class: 'arp-side' });
    const main = el('div', { class: 'arp-main' });
    ui = { side, main, btns: [], top: 0 };
    L.tabs.forEach(([t, ic], i) => {
      const b = el('div', { class: 'arp-tab' }, [OS.iconEl(ic, 'arp-tico'), el('span', { text: t })]);
      b.addEventListener('click', () => { if (page !== i) { OS.sound.play('click'); go(i); } });
      ui.btns.push(b);
      side.appendChild(b);
    });
    win = OS.wm.open({ title: T, icon: 'cd', width: 470, height: 292, content: el('div', { class: 'arp' }, [side, main]), maximizable: false, center: true,
      onClose: () => { win = null; ui = null; } });
    go(p || 0);
    return win;
  }
  function go(i) {
    page = i; sel = null;
    if (!ui) return;
    ui.top = 0;
    ui.btns.forEach((b, k) => b.classList.toggle('on', k === i));
    render();
  }
  function render() {
    if (!ui) return;
    const old = ui.main.querySelector('.arp-list');
    if (old) ui.top = old.scrollTop;
    ui.main.textContent = '';
    [pageList, pageAdd, pageComp][page]();
    const list = ui.main.querySelector('.arp-list');
    if (list) list.scrollTop = ui.top;
  }
  // 别处装上 ／ 卸掉了东西（比如网上邻居装了海葵补丁）：列表跟着变；组件那页正在打勾就不打断
  OS.on('soft:change', () => { if (ui && page !== 2) render(); });

  /* ---------- 第一页：更改或删除程序 ---------- */
  function sorted(list) {
    const by = [
      (a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'),
      (a, b) => b.size - a.size,
      (a, b) => usage(idsOf(b)).n - usage(idsOf(a)).n,
      (a, b) => usage(idsOf(b)).at - usage(idsOf(a)).at
    ][sortBy];
    return list.slice().sort(by);
  }
  function pageList() {
    const sortB = el('span', { class: 'arp-sort', text: L.sorts[sortBy] });
    sortB.addEventListener('click', e => {
      e.stopPropagation(); OS.sound.play('click');
      const r = OS.stage.rectOf(sortB);
      OS.ui.contextMenu(L.sorts.map((s, i) => ({ label: s, checked: i === sortBy, action: () => { sortBy = i; render(); } })), r.left, r.bottom);
    });
    const cb = el('input', { type: 'checkbox' });
    cb.checked = showUpd;
    cb.addEventListener('change', () => { showUpd = cb.checked; render(); });
    const head = el('div', { class: 'arp-head' }, [
      el('span', { class: 'arp-cap', text: L.cur }),
      el('label', { class: 'arp-upd' }, [cb, el('span', { text: L.showUpd })]),
      el('span', { class: 'arp-sortc', text: L.sortBy }), sortB
    ]);
    syncGot();
    const top = sorted(PROGS.filter(p => !p.parent && progOn(p)));
    const list = el('div', { class: 'arp-list' });
    top.forEach(p => {
      list.appendChild(row(p));
      // 勾了"显示更新"：补丁挂在本体下面
      if (showUpd) PROGS.filter(k => k.parent === p.id && progOn(k)).forEach(k => list.appendChild(row(k, true)));
    });
    if (!top.length) list.appendChild(el('div', { class: 'arp-none', text: L.noProg }));
    OS.ui.scrollable(list);
    ui.main.append(head, list);
  }
  function row(p, kid) {
    const on = sel === p.id;
    const u = usage(idsOf(p));
    const del = el('button', { class: 'xpbtn arp-btn', text: L.del });
    del.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); uninstall(p.id).then(r => { if (r) { sel = null; render(); } }); });
    const chg = p.comps ? el('button', { class: 'xpbtn arp-btn', text: L.change }) : null;
    if (chg) chg.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); change(p); });
    const line = (k, v) => el('div', { class: 'arp-kv' }, [el('span', { text: k }), el('b', { text: v })]);
    const r = el('div', { class: 'arp-row' + (on ? ' sel' : '') + (kid ? ' kid' : '') }, [
      OS.iconEl(p.icon, 'arp-ico'),
      el('div', { class: 'arp-name', text: p.name }),
      el('div', { class: 'arp-info' }, [
        line(L.size, mb(p.size)),
        on && !kid ? line(L.freq, u.freq) : null,
        on && !kid ? line(L.last, u.last) : null,
        on ? el('div', { class: 'arp-btns' }, [chg, del]) : null
      ])
    ]);
    r.addEventListener('click', () => { if (sel !== p.id) { OS.sound.play('click'); sel = p.id; render(); } });
    return r;
  }

  /* ---------- 第二页：添加新程序 ---------- */
  function pageAdd() {
    const opt = (icon, cap, btnText, fn) => {
      const b = el('button', { class: 'xpbtn arp-obtn', text: btnText });
      b.addEventListener('click', () => { OS.sound.play('click'); fn(); });
      return el('div', { class: 'arp-opt' }, [OS.iconEl(icon, 'arp-oico'), el('div', { class: 'arp-ocap', text: cap }), b]);
    };
    const back = PROGS.filter(p => got(p) && !progOn(p));
    const list = el('div', { class: 'arp-list' }, back.length ? back.map(p => {
      const b = el('button', { class: 'xpbtn arp-btn', text: L.back });
      b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); reinstall(p.id); });
      return el('div', { class: 'arp-row arp-brow' }, [OS.iconEl(p.icon, 'arp-ico'), el('div', { class: 'arp-name' }, [el('div', { text: p.name }), el('div', { class: 'arp-sub', text: L.backSub })]), b]);
    }) : [el('div', { class: 'arp-none', text: L.noBack })]);
    OS.ui.scrollable(list);
    ui.main.append(
      opt('cd', L.addCd, L.cdBtn, () => OS.hj && OS.hj.install()),
      opt('globe', L.addWeb, L.webBtn, () => { if (compOn('ie')) OS.ie.open('www.wuliaokeji.com.cn'); else missingApp('ie'); }),
      el('div', { class: 'arp-cap2', text: L.backCap }),
      list
    );
  }

  /* ---------- 第三页：添加/删除 Windows 组件 ---------- */
  function pageComp() {
    const boxes = [];
    const list = el('div', { class: 'arp-list arp-comps' });
    COMPS.forEach(([g, items]) => {
      const mine = [];
      const gb = el('input', { type: 'checkbox' });
      const syncG = () => { const n = mine.filter(b => b.checked).length; gb.checked = n === mine.length; gb.indeterminate = n > 0 && n < mine.length; };
      gb.addEventListener('change', () => { mine.forEach(b => { b.checked = gb.checked; }); syncG(); });
      list.appendChild(el('label', { class: 'arp-crow arp-grp' }, [gb, el('span', { class: 'arp-cname', text: g })]));
      items.forEach(([id, size]) => {
        const a = OS.apps.byId[id];
        if (!a) return;
        const b = el('input', { type: 'checkbox' });
        b.checked = compOn(id);
        b.dataset.id = id;
        b.addEventListener('change', syncG);
        mine.push(b);
        list.appendChild(el('label', { class: 'arp-crow' }, [b, OS.iconEl(a.icon, 'arp-cico'), el('span', { class: 'arp-cname', text: a.name }), el('span', { class: 'arp-csize', text: mb(size) })]));
      });
      syncG();
      boxes.push(...mine);
    });
    // 最下面：系统本身（去掉勾 → 蓝屏）
    const sys = el('input', { type: 'checkbox' });
    sys.checked = true;
    list.appendChild(el('label', { class: 'arp-crow arp-grp' }, [sys, OS.iconEl('logo', 'arp-cico'), el('span', { class: 'arp-cname', text: L.sysName }), el('span', { class: 'arp-csize', text: L.sysSize })]));
    OS.ui.scrollable(list);
    const next = el('button', { class: 'xpbtn', text: L.next });
    next.addEventListener('click', () => { OS.sound.play('click'); applyComps(boxes, sys); });
    ui.main.append(el('div', { class: 'arp-head' }, [el('span', { class: 'arp-cap', text: L.compCap })]), list, el('div', { class: 'arp-foot' }, [next]));
  }
  async function applyComps(boxes, sys) {
    if (!sys.checked) {
      await progress(L.removing(L.sysName), 2400);
      if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD);
      return;
    }
    const drop = boxes.filter(b => !b.checked && compOn(b.dataset.id)).map(b => b.dataset.id);
    const add = boxes.filter(b => b.checked && !compOn(b.dataset.id)).map(b => b.dataset.id);
    if (!drop.length && !add.length) { OS.ui.dialog({ title: T, icon: 'info', text: L.noChange }); return; }
    closeApps(drop);
    await progress(L.configuring, 1200 + 300 * (drop.length + add.length));
    setRemoved(removed().filter(x => add.indexOf(x) < 0).concat(drop));
    dropIcons(drop);
    bringIcons(add);
    freshen(add);
    if (add.length) announce(add.map(nameOf));
    render();
  }

  /* ================= 图片和传真查看器：ABCSee 卸了，图片用它打开 ================= */
  function picViewer(nd) {
    if (nd.slip && OS.showSlip) { OS.showSlip(nd.slip, nd.name); return null; }
    const W = 240, a = OS.abcsee && OS.abcsee.aspect ? OS.abcsee.aspect(nd) || 0.625 : 0.625;
    const H = Math.min(170, Math.round(W * a));
    const c = el('canvas', { class: 'arp-pic', width: W, height: H });
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    try { OS.abcsee.drawNode(nd, g, W, H); } catch (e) { console.error(e); }
    const content = el('div', { class: 'rv' }, [el('div', { class: 'rv-stage' }, [c]), el('div', { class: 'rv-bar', text: L.picBar(nd.name, W, H) })]);
    return OS.wm.open({ title: L.picTitle(nd.name), icon: 'paint', width: 300, content, maximizable: false });
  }

  /* ================= 别的软件的入口：被卸掉了就拦下 ================= */
  function guard(obj, key, ok, no) {
    if (!obj || typeof obj[key] !== 'function') return;
    const f = obj[key];
    obj[key] = function () { if (!ok()) { no(arguments[0]); return null; } return f.apply(this, arguments); };
  }
  const koukouOn = () => progOn(PROG.koukou);
  const needKoukou = () => OS.ui.dialog({ title: PROG.koukou.name, icon: 'warn', text: L.needFirst(PROG.koukou.name) });
  guard(OS.notepad, 'open', () => compOn('notepad'), () => missingFile('notepad'));
  guard(OS.wordpad, 'open', () => compOn('wordpad'), () => missingFile('wordpad'));
  guard(OS.paint, 'open', () => compOn('paint'), () => missingFile('paint'));
  guard(OS.ie, 'open', () => compOn('ie'), () => missingFile('ie'));
  guard(OS.ie, 'options', () => compOn('ie'), () => missingApp('ie'));
  guard(OS.mail, 'compose', () => compOn('mail'), () => missingApp('mail'));
  guard(OS.qianqian, 'play', () => progOn(PROG.qianqian), () => missingFile('qianqian'));
  guard(OS.koukou, 'postSlip', koukouOn, needKoukou);
  guard(OS.koukou, 'patchInstaller', koukouOn, needKoukou);
  guard(OS.abcsee, 'view', () => progOn(PROG.abcsee), nd => picViewer(nd));
  guard(OS.excuse, 'open', () => compOn('excuse'), () => missingFile('excuse'));
  guard(OS.excuse, 'view', () => compOn('excuse'), () => missingFile('excuse'));
  guard(OS.wordy, 'open', () => compOn('wordy'), () => missingFile('wordy'));
  guard(OS.pptless, 'open', () => compOn('ppt'), () => missingFile('ppt'));

  /* ================= 给别的地方用 ================= */
  OS.soft = {
    has: id => (PROG[id] ? progOn(PROG[id]) : compOn(id)),
    appOk, got: id => !!PROG[id] && got(PROG[id]), blocked,
    // 这个程序 id 的东西还在不在（Program Files 里的 exe 用）：管它的软件 ／ 组件被卸了就不在
    present: id => { const p = progOfApp(id) || progOfFile(id); return p ? progOn(p) : appOk(id); },
    uninstall, reinstall,
    virusBeaten: v => !!OS.save.get(VIR_KEY, {})[v],
    beatVirus: v => { const m = OS.save.get(VIR_KEY, {}); m[v] = true; OS.save.set(VIR_KEY, m); }
  };
  OS.addRemove = p => open(p);
})();
