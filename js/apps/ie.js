/* Internot Explorer（开始菜单左栏"Internot"、收藏夹里的 .url、命令提示符 iexplore）
   照那几年系统自带的浏览器做：菜单 ／ 后退 前进 停止 刷新 主页 收藏夹 历史 ／ 地址栏 ／ 网页 ／ 状态栏
   - 每次开机第一次上网先拨号（56K；偶尔家里有人拿起电话 → 该页无法显示）；开一页先白一会儿，图一块一块出来
   - 能去的：huai123（主页）、shidu.com（拾度搜索）、4299.com（小游戏）、幸福小区业主论坛（收藏夹里本来就有），
     加上游戏里别处出现过的 5 个网址：在出现的地方点一下就"采集"进地址栏的下拉框（OS.web.collect）
   - 别的网址、导航里没做的链接：一律"该页无法显示"
   - 三个流氓网站（暴富2027、阳寿网、中医把脉网）一进去就把主页改成它，重启变回 huai123
   - 收藏 ▸ 添加到收藏夹：收藏夹文件夹里真多一个 .url（算进 200 个文件的上限）
   - 装海葵补丁时勾了工具条：地址栏下面多一条海葵工具条，关不掉
   - 蓝屏：在拾度搜"怎么让电脑蓝屏" → SEARCH_RESULT_APPLIED */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.ie;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案（浏览器本身） ================= */
  const NAME = 'Internot Explorer';
  // 标题栏后面那段：超级秃子 ▸ 魔法设置 ▸ 浏览器标题 能改（存在 ieTitle，重启还在）
  const brand = () => OS.save.get('ieTitle', '') || NAME;
  const HOME = 'www.huai123.com';
  const L = {
    menus: ['文件(F)', '编辑(E)', '查看(V)', '收藏(A)', '工具(T)', '帮助(H)'],
    tools: ['后退', '前进', '停止', '刷新', '主页', '收藏夹', '历史'],
    addr: '地址(D)', go: '转到',
    opening: u => '正在打开网页 ' + u + '...',
    done: '完毕', zone: 'Internet',
    // 拨号（跟 Outluck 收信一样的框）
    dialTitle: '正在连接 拨号连接', dialing: '正在拨号……', verifying: '正在验证用户名和密码……',
    register: '正在网络上注册您的计算机……', connected: '已连接，速度 56.0 Kbps。',
    dialFail: '拨号连接', phone: '连接失败：家里有人拿起了电话。',
    // 采集
    collected: u => '已添加到地址栏：' + u,
    already: u => '地址栏里已经有了：' + u,
    // 主页被改
    homeTitle: '主页设置', homeSet: u => '您的主页已被设为：\n' + u,
    lockTitle: '超级秃子', homeLocked: '有网页想改你的主页，被超级秃子拦下了。',
    homeFix: '正在把浏览器主页改回 huai123',
    // 菜单
    print: '打印…', props: '属性', close: '关闭',
    propsText: (t, u) => t + '\n\n地址：' + u + '\n类型：HTML 文档\n连接速度：56 Kbps',
    cut: '剪切', copy: '复制', paste: '粘贴', selAll: '全选', find: '查找(在当前页)…',
    findText: '找不到。\n你要找的东西不在这一页。',
    toolbars: '工具栏', stdBtns: '标准按钮', addrBar: '地址栏', statusBar: '状态栏',
    textSize: '文字大小', sizes: ['最大', '较大', '中', '较小', '最小'],
    source: '源文件', refresh: '刷新',
    srcName: 'index[1].htm', srcRo: '保存失败：这是人家网站的源文件。',
    srcNote: '<!-- 别看了，源文件里也没有答案 -->',
    favAdd: '添加到收藏夹…', favOrg: '整理收藏夹…',
    favAsk: t => 'Internot Explorer 将把该页添加到您的收藏夹。\n\n名称：' + t,
    favHave: '收藏夹里已经有这一页了。',
    mailNews: '邮件和新闻', readMail: '阅读邮件', options: 'Internet 选项…',
    about: '关于 Internot Explorer', aboutText: 'Internot Explorer\n版本 6.0\n上不去，但很努力。',
    today: '今天',
    // Internet 选项
    optTitle: 'Internet 选项',
    optHome: '主页', optHomeTip: '可以更改哪一页作为主页。', optAddr: '地址：',
    optCur: '使用当前页', optDef: '使用默认页', optBlank: '使用空白页',
    optTemp: 'Internet 临时文件', optCookies: '删除 Cookies…', optFiles: '删除文件…',
    cookiesDone: '已删除 0 块饼干。', filesDone: '删了，但你的记忆删不掉。',
    optHist: '历史记录', optClear: '清除历史记录', histDone: '历史记录已清除。\n拾度那边还记着。',
    ok: '确定',
    // 海葵工具条（装海葵补丁时勾了的才有）
    hkName: '海葵搜索', hkSearch: '搜索', hkIp: '显IP',
    hkDown: '海葵搜索正在维护。', hkIpText: '你的 IP：192.168.1.250\n幸福小区 3 号楼——你家',
    hkBar: '海葵工具条', hkNoClose: '关闭失败：海葵工具条是您电脑的一部分。',
    // 该页无法显示（照那几年那一页）／ 点了停止
    deadTitle: '该页无法显示',
    deadText: '您要访问的网页当前不可用。网站可能遇到支持问题，或者您需要调整浏览器设置。',
    tryThis: '请尝试以下操作：',
    dead1: ['单击', '刷新', '按钮，或以后再试。'],
    dead2: '如果您在地址栏中键入了该网页的地址，请确保其拼写正确。',
    dead3: '把猫的电源拔下来，再插上。',
    deadFoot: '找不到服务器或 DNS 错误\nInternot Explorer',
    stopTitle: '已取消网页导航', stopTry: '您可以尝试以下操作：', stop1: ['', '刷新', '该页。']
  };
  const BSOD = { id: 'ie', name: 'SEARCH_RESULT_APPLIED', text: '蓝屏？我教你呀！' };
  const ZOOMS = [1.25, 1.12, 1, 0.92, 0.84];

  /* ================= 网址 ================= */
  // 能采集的 5 个（顺序 = 地址栏下拉框里的顺序）；每个在别的软件里出现的地方点一下就采集
  const COLLECT = ['www.wuliaokeji.com.cn', 'www.dapian.zz', 'www.baofu2027.com', 'www.yangshou.net', 'www.zhongyi-bamai.cn'];
  // 地址栏下拉框一开始就有的
  const BASE = [HOME, 'www.shidu.com', 'www.4299.com', 'bbs.xingfu3.zz'];
  const FAV_DIR = OS.fs.ME + '\\收藏夹';
  const SITES = {};   // 网址 → { page(path) → { title, node, cls, after, dead } ；collect ；rogue }（下面各网站自己登记）
  const full = u => (/^about:/.test(u) ? u : 'http://' + u + (u.indexOf('/') < 0 ? '/' : ''));
  const hostOf = u => u.split('/')[0];
  const pathOf = u => { const i = u.indexOf('/'); return i < 0 ? '' : u.slice(i + 1); };
  function norm(raw) {
    let u = String(raw || '').trim().replace(/。/g, '.');
    if (!u) return '';
    if (/^about:/i.test(u)) return u.toLowerCase();
    u = u.replace(/^[a-z]+:\/\//i, '').replace(/\/+$/, '');
    const i = u.indexOf('/');
    let host = (i < 0 ? u : u.slice(0, i)).toLowerCase();
    if (!SITES[host] && SITES['www.' + host]) host = 'www.' + host;
    return host + (i < 0 ? '' : u.slice(i));
  }

  /* ================= 采集（给别的软件用） ================= */
  const COL_KEY = 'ieCollected';
  const collected = () => OS.save.get(COL_KEY, []).filter(u => COLLECT.indexOf(u) >= 0);
  function collect(raw, quiet) {
    const u = norm(raw);
    if (COLLECT.indexOf(u) < 0) return false;
    const list = collected();
    if (list.indexOf(u) >= 0) {
      if (!quiet) OS.ui.notify({ title: NAME, text: L.already(u), icon: 'ie', replace: true, timeout: 3000 });
      return false;
    }
    list.push(u);
    OS.save.set(COL_KEY, list);
    if (!quiet) OS.ui.notify({ title: NAME, text: L.collected(u), icon: 'ie', replace: true, timeout: 4000 });
    return true;
  }
  // 一个能点的网址（蓝色带下划线）：点了采集
  function link(url, cls) {
    const s = el('span', { class: 'web-link' + (cls ? ' ' + cls : ''), text: url });
    s.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); collect(url); });
    return s;
  }
  // 一段字里出现的能采集的网址全变成能点的：返回 [字, 网址, 字……]，直接塞给 OS.el 当 children
  // mk：怎么做那个能点的网址（默认 = 点了采集；浏览器自己的网页里 = 点了直接去）
  const COLLECT_RE = new RegExp(COLLECT.map(u => u.replace(/[.\-]/g, '\\$&')).join('|'), 'g');
  function linkify(text, mk) {
    const s = String(text), out = [];
    let last = 0, m;
    COLLECT_RE.lastIndex = 0;
    while ((m = COLLECT_RE.exec(s))) {
      if (m.index > last) out.push(s.slice(last, m.index));
      out.push((mk || link)(m[0]));
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push(s.slice(last));
    return out;
  }
  OS.web = { collect, collected, link, linkify: text => linkify(text) };

  /* ================= 浏览器窗口 ================= */
  let win = null, ui = null;
  let cur = '', curTitle = '';
  let back = [], fwd = [];
  let tok = 0, loading = false;
  let online = false;              // 这次开机拨过号了没有
  let dialing = null;
  let home = HOME;                 // 流氓网站改过就是它们；重启变回
  let zoom = 2;
  let hist = [];                   // 这次开机去过的：[{ u, title }]
  const seen = new Set();          // 这次开机开过的网页（第二次开快一点）
  OS.on('desktop:reset', () => { online = false; home = HOME; hist = []; seen.clear(); });

  app.open = () => openWin();
  function openWin(u) {
    if (win && !win.isClosed) {
      if (win.minimized) OS.wm.restore(win);
      OS.wm.focus(win);
      if (u) nav(u);
      return win;
    }
    ui = build();
    win = OS.wm.open({
      title: brand(), icon: 'ie', width: 476, height: 306, appId: app.id, content: ui.box, maximizable: false, center: true,
      onClose: () => { win = null; ui = null; tok++; loading = false; back = []; fwd = []; cur = ''; curTitle = ''; }
    });
    nav(u || home);
    return win;
  }
  const alive = my => my === tok && ui && win && !win.isClosed;

  function build() {
    const throb = el('span', { class: 'ie-throb' }, [OS.iconEl('ie', 'ie-throbi')]);
    const top = el('div', { class: 'ie-top' }, [OS.ui.menuBar(L.menus, menuFor, 'ie-mbar'), throb]);
    const tb = [];
    const tools = el('div', { class: 'ie-tools' }, L.tools.map((t, i) => {
      const b = el('button', { class: 'ie-tb', text: t });
      b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); toolAct(i, b); });
      tb.push(b);
      return b;
    }));
    const input = el('input', { class: 'ie-ain', type: 'text', spellcheck: 'false', autocomplete: 'off' });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); nav(input.value); } });
    const drop = el('span', { class: 'ie-adrop' });
    const abox = el('div', { class: 'ie-abox' }, [OS.iconEl('ie', 'ie-aico'), input, drop]);
    drop.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); addrMenu(abox); });
    const goB = el('button', { class: 'ie-tb ie-go', text: L.go });
    goB.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); nav(input.value); });
    const addr = el('div', { class: 'ie-addr' }, [el('span', { class: 'ie-acap', text: L.addr }), abox, goB]);
    const hk = OS.koukou && OS.koukou.toolbar && OS.koukou.toolbar() ? hkBar() : null;
    const page = el('div', { class: 'ie-page' });
    OS.ui.scrollable(page);
    const stText = el('span', { class: 'ie-stt' });
    const stFill = el('div', { class: 'ie-stf' });
    const stBar = el('div', { class: 'ie-stb' }, [stFill]);
    const status = el('div', { class: 'ie-status' }, [stText, stBar, el('span', { class: 'ie-zone' }, [OS.iconEl('globe', 'ie-stico'), L.zone])]);
    const box = el('div', { class: 'ie' }, [top, tools, addr, hk, page, status]);
    return { box, throb, tb, input, page, stText, stBar, stFill, hk };
  }
  function setStatus(text, p) {
    if (!ui) return;
    ui.stText.textContent = text;
    ui.stBar.classList.toggle('on', p != null);
    if (p != null) ui.stFill.style.width = p + '%';
  }
  function syncTools() {
    if (!ui) return;
    ui.tb[0].classList.toggle('off', !back.length);
    ui.tb[1].classList.toggle('off', !fwd.length);
    ui.tb[2].classList.toggle('off', !loading);
  }

  /* ---------- 去哪儿 ---------- */
  function nav(raw) {
    const u = norm(raw);
    if (!u || !ui) return;
    if (cur && cur !== u) { back.push(cur); if (back.length > 30) back.shift(); fwd = []; }
    cur = u;
    load(u);
  }
  function goBack() { if (!back.length) return; fwd.push(cur); cur = back.pop(); load(cur); }
  function goFwd() { if (!fwd.length) return; back.push(cur); cur = fwd.pop(); load(cur); }
  function reload() { if (cur && ui) load(cur); }
  function stop() {
    if (!loading) return;
    const my = ++tok;
    finish(my, cur, msgPage(L.stopTitle, L.stopTry, [L.stop1]));
  }

  async function load(u) {
    const my = ++tok;
    loading = true;
    syncTools();
    ui.input.value = full(u);
    ui.throb.classList.add('busy');
    ui.page.textContent = '';
    ui.page.scrollTop = 0;
    setStatus(L.opening(full(u)), 5);
    if (!online && u !== 'about:blank') {
      const ok = await dial();
      if (!alive(my)) return;
      if (!ok) { finish(my, u, deadPage()); return; }
    }
    const site = SITES[hostOf(u)];
    setStatus(L.opening(full(u)), 30);
    await OS.wait(site ? (seen.has(u) ? 300 : 800) + Math.random() * 500 : 1500);
    if (!alive(my)) return;
    let r = null;
    try { r = site ? site.page(pathOf(u)) : null; } catch (e) { console.error(e); }
    finish(my, u, r || deadPage());
  }
  function finish(my, u, r) {
    if (!alive(my)) return;
    loading = false;
    seen.add(u);
    ui.page.textContent = '';
    ui.page.scrollTop = 0;
    ui.page.appendChild(el('div', { class: 'ie-doc' + (r.cls ? ' ' + r.cls : ''), style: { zoom: ZOOMS[zoom] } }, [r.node]));
    curTitle = r.title;
    win.setTitle(r.title + ' - ' + brand());
    ui.throb.classList.remove('busy');
    setStatus(L.done);
    syncTools();
    if (!r.dead) {
      hist = [{ u, title: r.title }].concat(hist.filter(h => h.u !== u)).slice(0, 12);
      const site = SITES[hostOf(u)];
      if (site.collect) collect(hostOf(u), true);   // 自己敲网址进来的也算采集到了
      if (site.rogue) hijack(hostOf(u));
    }
    if (r.after) r.after(my);
  }

  /* ---------- 56K 拨号：每次开机第一次上网 ---------- */
  function dial() {
    if (dialing) return dialing;
    dialing = (async () => {
      const line = el('div', { class: 'ml-srl' }), fill = el('div', { class: 'ml-srf' });
      const w = OS.wm.open({ title: L.dialTitle, icon: 'network', width: 260, content: el('div', { class: 'ml-sr' }, [line, el('div', { class: 'ml-srb' }, [fill])]),
        modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog', noClose: true });
      const step = async (t, p, ms) => { line.textContent = t; fill.style.width = p + '%'; await OS.wait(ms); return !w.isClosed; };
      OS.sound.play('dialup');
      let ok = await step(L.dialing, 20, 1500);
      // 偶尔家里有人拿起电话（头一回不会）
      const n = OS.save.get('ieDials', 0);
      OS.save.set('ieDials', n + 1);
      if (ok && n && Math.random() < 0.15) {
        if (!w.isClosed) w.close();
        OS.ui.dialog({ title: L.dialFail, icon: 'error', text: L.phone });
        return false;
      }
      ok = ok && await step(L.verifying, 50, 800);
      ok = ok && await step(L.register, 80, 700);
      ok = ok && await step(L.connected, 100, 500);
      if (!w.isClosed) w.close();
      if (ok) online = true;
      return ok;
    })();
    dialing.then(() => { dialing = null; });
    return dialing;
  }

  /* ---------- 流氓网站改主页（重启变回） ---------- */
  function setHome(u) {
    home = u;
    if (u === HOME) OS.bootFix.remove('ie-home'); else OS.bootFix.add('ie-home', L.homeFix);
  }
  function hijack(u) {
    if (home === u) return;
    // 超级秃子 ▸ 上网修复 ▸ 锁定主页（超级秃子卸掉了就不管用了）
    if (OS.save.get('ieHomeLock', false) && (!OS.soft || OS.soft.has('baldy'))) {
      const my = tok;
      setTimeout(() => { if (alive(my)) OS.ui.dialog({ title: L.lockTitle, icon: 'baldy', text: L.homeLocked }); }, 700);
      return;
    }
    setHome(u);
    const my = tok;
    setTimeout(() => { if (alive(my)) OS.ui.dialog({ title: L.homeTitle, icon: 'info', text: L.homeSet(u) }); }, 700);
  }

  /* ---------- 工具栏按钮 ---------- */
  function toolAct(i, b) {
    if (i === 0) goBack();
    else if (i === 1) goFwd();
    else if (i === 2) stop();
    else if (i === 3) reload();
    else if (i === 4) nav(home);
    else if (i === 5) dropUnder(b, favMenu());
    else if (i === 6) dropUnder(b, histMenu());
  }
  function dropUnder(node, items) {
    const r = OS.stage.rectOf(node);
    OS.ui.contextMenu(items, r.left, r.bottom);
  }
  // 地址栏 ▼：一开始就有的 + 采集到的 + 自己加的收藏
  function addrMenu(abox) {
    const list = BASE.concat(collected());
    favs().forEach(f => { if (list.indexOf(f.url) < 0) list.push(f.url); });
    dropUnder(abox, list.map(u => ({ label: full(u), action: () => nav(u) })));
  }
  function histMenu() {
    return [{ label: L.today, disabled: true }].concat(hist.map(h => ({ label: h.title, action: () => nav(h.u) })));
  }

  /* ---------- 收藏夹：就是那个文件夹里的 .url ---------- */
  function favs() {
    return OS.fs.list(FAV_DIR).filter(n => n.kind === 'url' && n.url).map(n => ({ name: n.name.replace(/\.url$/i, ''), url: norm(n.url) }));
  }
  function favMenu() {
    return [
      { label: L.favAdd, action: addFav },
      { label: L.favOrg, action: () => OS.explorer.open(FAV_DIR) },
      '-'
    ].concat(favs().map(f => ({ label: f.name, icon: 'ie', action: () => nav(f.url) })));
  }
  async function addFav() {
    if (!cur) return;
    const u = cur, t = curTitle || hostOf(u);
    if (favs().some(f => f.url === u)) { OS.ui.dialog({ title: L.favAdd.replace('…', ''), icon: 'info', text: L.favHave }); return; }
    const v = await OS.ui.dialog({ title: L.favAdd.replace('…', ''), icon: 'ie', text: L.favAsk(t), buttons: [L.ok, '取消'] });
    if (v !== L.ok) return;
    const name = (t.replace(/[\\/:*?"<>|]/g, ' ').trim().slice(0, 40) || hostOf(u)) + '.url';
    OS.fs.createFile(FAV_DIR, name, 'url', { url: u, text: '[InternetShortcut]\nURL=' + full(u) + '\n' });
  }

  /* ---------- 菜单 ---------- */
  function menuFor(name) {
    switch (name) {
      case '文件(F)': return [
        { label: L.print, action: () => OS.ui.dialog({ title: OS.PRINT_TITLE, icon: 'error', text: OS.printErr() }) },
        '-',
        { label: L.props, action: () => OS.ui.dialog({ title: L.props, icon: 'ie', text: L.propsText(curTitle, full(cur)) }) },
        '-',
        { label: L.close, action: () => win && win.close() }
      ];
      case '编辑(E)': return [
        { label: L.cut, disabled: true }, { label: L.copy, disabled: true }, { label: L.paste, disabled: true },
        '-',
        { label: L.find, action: say(L.find.replace('…', ''), 'info', L.findText) }
      ];
      case '查看(V)': return [
        { label: L.toolbars, sub: [{ label: L.stdBtns, checked: true }, { label: L.addrBar, checked: true }]
          .concat(ui && ui.hk ? [{ label: L.hkBar, checked: !ui.hkOff, action: hkClose }] : []) },
        { label: L.statusBar, checked: true },
        '-',
        { label: L.textSize, sub: L.sizes.map((s, i) => ({ label: s, checked: zoom === i, action: () => setZoom(i) })) },
        { label: L.source, action: viewSource },
        '-',
        { label: L.refresh, action: reload }
      ];
      case '收藏(A)': return favMenu();
      case '工具(T)': return [
        { label: L.mailNews, sub: [{ label: L.readMail, action: () => OS.apps.open('mail') }] },
        '-',
        { label: L.options, action: options }
      ];
      case '帮助(H)': return [{ label: L.about, action: say(L.about, 'ie', L.aboutText) }];
    }
    return null;
  }
  function setZoom(i) {
    zoom = i;
    const d = ui && ui.page.querySelector('.ie-doc');
    if (d) d.style.zoom = ZOOMS[i];
  }
  // 查看 ▸ 源文件：记事本打开一份"网页源代码"
  function viewSource() {
    const d = ui && ui.page.querySelector('.ie-doc');
    const body = d ? d.innerText.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 14) : [];
    const src = ['<html>', '<head>', '<meta http-equiv="Content-Type" content="text/html; charset=gb2312">', '<title>' + curTitle + '</title>', '</head>',
      '<body bgcolor="#FFFFFF">', L.srcNote, '<table width="100%" border="0" cellspacing="0" cellpadding="0">']
      .concat(body.map(s => '<tr><td>' + s + '</td></tr>'))
      .concat(['</table>', '</body>', '</html>', '']).join('\n');
    OS.notepad.open({ name: L.srcName, text: src, where: { type: 'ro', msg: L.srcRo } });
  }

  /* ---------- 工具 ▸ Internet 选项（控制面板里也能开） ---------- */
  function options() {
    const addrEl = el('div', { class: 'ie-oaddr' });
    const showHome = () => { addrEl.textContent = full(home); };
    showHome();
    const B = (t, fn) => { const b = el('button', { class: 'xpbtn ie-ob', text: t }); b.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return b; };
    const ok = el('button', { class: 'xpbtn default', text: L.ok });
    const box = el('div', { class: 'ie-opt' }, [
      el('div', { class: 'ie-ogrp' }, [
        el('div', { class: 'ie-ocap', text: L.optHome }),
        el('div', { text: L.optHomeTip }),
        el('div', { class: 'ie-orow' }, [el('span', { text: L.optAddr }), addrEl]),
        el('div', { class: 'ie-obtns' }, [
          B(L.optCur, () => { if (cur && win && !win.isClosed) { setHome(cur); showHome(); } }),
          B(L.optDef, () => { setHome(HOME); showHome(); }),
          B(L.optBlank, () => { setHome('about:blank'); showHome(); })
        ])
      ]),
      el('div', { class: 'ie-ogrp' }, [
        el('div', { class: 'ie-ocap', text: L.optTemp }),
        el('div', { class: 'ie-obtns' }, [B(L.optCookies, say(L.optTemp, 'info', L.cookiesDone)), B(L.optFiles, say(L.optTemp, 'info', L.filesDone))])
      ]),
      el('div', { class: 'ie-ogrp' }, [
        el('div', { class: 'ie-ocap', text: L.optHist }),
        el('div', { class: 'ie-obtns' }, [B(L.optClear, () => { hist = []; OS.ui.dialog({ title: L.optHist, icon: 'info', text: L.histDone }); })])
      ]),
      el('div', { class: 'dlg-btns' }, [ok])
    ]);
    const w = OS.wm.open({ title: L.optTitle, icon: 'ie', width: 290, content: box, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
    ok.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
  }

  /* ---------- 海葵工具条 ---------- */
  // × ／ 查看 ▸ 工具栏 里那一项：这个窗口里关掉（再点一次又打开）；下次打开浏览器又出来了（2026-11-24 作者改：原来是关不掉）
  const hkClose = () => { if (!ui || !ui.hk) return; ui.hkOff = !ui.hkOff; ui.hk.style.display = ui.hkOff ? 'none' : ''; };
  function hkBar() {
    const q = el('input', { class: 'ie-hkin', type: 'text', spellcheck: 'false', autocomplete: 'off' });
    q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); q.blur(); OS.ui.dialog({ title: L.hkName, icon: 'info', text: L.hkDown }); } });
    const btn = (t, fn) => { const b = el('button', { class: 'ie-hkb', text: t }); b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); fn(); }); return b; };
    const x = el('span', { class: 'ie-hkx', text: '×' });
    x.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); hkClose(); });
    return el('div', { class: 'ie-hk' }, [
      el('span', { class: 'ie-hklogo', text: L.hkName }), q,
      btn(L.hkSearch, say(L.hkName, 'info', L.hkDown)), btn(L.hkIp, say(L.hkName, 'info', L.hkIpText)), x
    ]);
  }

  /* ================= 做网页用的小零件 ================= */
  // 鼠标停在链接上：状态栏显示要去的网址（那几年就这样）
  function hook(node, to) {
    node.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); if (typeof to === 'function') to(); else nav(to); });
    if (typeof to === 'string') {
      node.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !loading) setStatus(full(norm(to))); });
      node.addEventListener('pointerleave', () => { if (!loading) setStatus(L.done); });
    }
    return node;
  }
  const A = (text, to, cls) => hook(el('span', { class: 'ie-a' + (cls ? ' ' + cls : ''), text }), to);
  const Btn = (text, fn, cls) => {
    const b = el('button', { class: 'ie-wb' + (cls ? ' ' + cls : ''), text });
    b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); fn(b); });
    return b;
  };
  // 网页上的"图"：开网页时从上往下一块一块出来
  const Img = (cls, children) => el('div', { class: 'ie-img ' + cls }, children);
  const pageOf = (title, node, cls, more) => Object.assign({ title, node, cls }, more || {});

  // 该页无法显示 ／ 已取消网页导航
  function msgPage(title, tryCap, items, more, foot) {
    const li = it => el('li', {}, Array.isArray(it) ? [it[0], A(it[1], reload), it[2]] : [it]);
    return pageOf(title, el('div', { class: 'ie-err' }, [
      el('div', { class: 'ie-errh' }, [OS.iconEl('info', 'ie-erri'), el('span', { text: title })]),
      more ? el('div', { text: more }) : null,
      el('div', { class: 'ie-errhr' }),
      el('div', { text: tryCap }),
      el('ul', {}, items.map(li)),
      foot ? el('div', { class: 'ie-errf', text: foot }) : null
    ]), 'ie-errp', { dead: true });
  }
  const deadPage = () => msgPage(L.deadTitle, L.tryThis, [L.dead1, L.dead2, L.dead3], L.deadText, L.deadFoot);
  SITES['about:blank'] = { page: p => (p ? null : pageOf('about:blank', el('div'))) };

  /* ================= huai123（主页） ================= */
  const HU = {
    title: 'huai123 网址之家', name: '网址之家', slogan: '坏网址，一个就够了', setHome: '设为首页',
    isHome: '它本来就是你的首页。', backHome: '好了，它又是你的首页了。',
    week: '日一二三四五六',
    date: (d, w) => '今天是 ' + OS.YEAR + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日　星期' + w + '　天气：屏幕外面应该是晴天',
    big: [['拾度搜索', 'www.shidu.com'], ['4299小游戏', 'www.4299.com'], ['无聊科技', 'www.wuliaokeji.com.cn']],
    // 分类：除了上面那几个，全是"该页无法显示"
    cats: [
      ['新闻', [['天天新闻', 'news.tiantian.zz'], ['小道消息网', 'www.xiaodao.zz'], ['楼下快讯', 'www.louxia.zz']]],
      ['音乐', [['免费MP3', 'mp3.mianfei.zz'], ['彩铃大全', 'www.cailing.zz'], ['歌词吧', 'www.geci8.zz']]],
      ['影视', [['电影天天看', 'www.dianying.zz'], ['连续剧大全', 'www.lianxuju.zz'], ['动画片', 'www.donghua.zz']]],
      ['购物', [['淘不到网', 'www.taobudao.zz'], ['跳蚤市场', 'www.tiaozao.zz'], ['电视购物', 'www.dianshigouwu.zz']]],
      ['邮箱', [['抠抠邮箱', 'mail.koukou.com'], ['免费邮箱', 'www.mianfeiyouxiang.zz'], ['2 MB 大邮箱', 'www.2mb.zz']]],
      ['学习', [['作业答案', 'www.zuoye.zz'], ['作文大全', 'www.zuowen.zz'], ['英语四六级', 'www.siliuji.zz']]],
      ['体育', [['足球新闻', 'www.zuqiu.zz'], ['篮球公园', 'www.lanqiu.zz'], ['乒乓球吧', 'www.pingpang.zz']]],
      ['星座', [['今日运势', 'www.yunshi.zz'], ['星座配对', 'www.peidui.zz'], ['测测你的前世', 'www.qianshi.zz']]]
    ],
    recent: '你最近去过的',
    names: { 'www.wuliaokeji.com.cn': '无聊科技', 'www.dapian.zz': '免费看大片', 'www.baofu2027.com': '暴富2027', 'www.yangshou.net': '阳寿网', 'www.zhongyi-bamai.cn': '中医把脉网' },
    visitor: ['您是本站第 ', '000001', ' 位访客'],
    foot: '© ' + OS.YEAR + ' huai123.com'
  };
  SITES[HOME] = { page(p) {
    if (p) return null;
    const d = OS.clock.now();
    const rows = HU.cats.map(([c, links]) => el('div', { class: 'hu-row' }, [el('span', { class: 'hu-cat', text: c })].concat(links.map(([t, u]) => A(t, u)))));
    const rec = collected();
    if (rec.length) rows.push(el('div', { class: 'hu-row hu-rec' }, [el('span', { class: 'hu-cat', text: HU.recent })].concat(rec.map(u => A(HU.names[u] || u, u)))));
    const node = el('div', { class: 'hu' }, [
      el('div', { class: 'hu-top' }, [
        Img('hu-logo', [el('span', { text: 'huai' }), el('b', { text: '123' })]),
        el('div', { class: 'hu-name' }, [el('b', { text: HU.name }), el('span', { text: HU.slogan })]),
        searchBox('', 'hu-sbox'),
        A(HU.setHome, () => {
          if (home === HOME) { OS.ui.dialog({ title: HU.setHome, icon: 'info', text: HU.isHome }); return; }
          setHome(HOME);
          OS.ui.dialog({ title: HU.setHome, icon: 'info', text: HU.backHome });
        }, 'hu-set')
      ]),
      el('div', { class: 'hu-date', text: HU.date(d, HU.week[d.getDay()]) }),
      el('div', { class: 'hu-big' }, HU.big.map(([t, u]) => hook(Img('hu-bigb', [el('span', { text: t })]), u))),
      el('div', { class: 'hu-cats' }, rows),
      el('div', { class: 'hu-foot' }, [HU.visitor[0], el('span', { class: 'hu-count', text: HU.visitor[1] }), HU.visitor[2], el('br'), HU.foot])
    ]);
    return pageOf(HU.title, node);
  } };

  /* ================= shidu.com（拾度搜索） ================= */
  const SD = {
    title: '拾度一下，你就知道', resTitle: q => '拾度搜索_' + q,
    tabs: [['网页', null], ['MP3', 'mp3.shidu.com'], ['图片', 'image.shidu.com']],
    btn: '拾度一下', slogan: '拾度一下，你就知道', foot: '©' + OS.YEAR + ' Shidu',
    hot: '大家都在搜',
    hotList: ['怎么删除浏览记录', '怎么让电脑变快', '火星文转换器', '2027暴富秘籍', '1+1 等于几', '羊为什么吃纸', '怎么让电脑蓝屏'],
    count: '找到相关网页约 1,240,000 篇，用时 56 秒',
    count0: '找到相关网页约 0 篇，用时 56 秒',
    notFound: q => '抱歉，没有找到与“' + q + '”相关的网页。'
  };
  // 结果：[标题, 摘要, 绿色网址, 点了去哪（不写 = 绿色网址，没做的就是该页无法显示）]
  const SD_R = {
    '怎么删除浏览记录': { list: [
      ['怎么删除浏览记录？_拾度知道', '最佳答案：建议直接删除电脑。', 'zhidao.shidu.com/question/1.html'],
      ['删除浏览记录的两种方法', '方法一：工具 ▸ Internet 选项 ▸ 清除历史记录。方法二：搬家。', 'www.diannao-xiaozhishi.zz'],
      ['浏览记录被家长看见了怎么办', '找到相关网页约 1,240,000 篇。你不是一个人。', 'bbs.zhongxuesheng.zz']
    ] },
    '怎么让电脑变快': { list: [
      ['怎么让电脑变快？_拾度知道', '最佳答案：建议跑起来，电脑就跟着变快了。', 'zhidao.shidu.com/question/2.html'],
      ['一键加速 2003 免费下载', '下载速度 0.3 KB/s，预计还需 48 年。', 'www.jiasu2003.zz']
    ] },
    '火星文转换器': { list: [
      ['吙煋呅轉換噐 ☆ 免費蝂', '紦伱哋芓変荿吙煋呅，酷斃ㄋ。', 'www.huoxingwen.zz'],
      ['傷芯個性簽洺 1000 條', '誰還茬乎，伱還茬嗎。', 'qianming.huoxingwen.zz'],
      ['吙煋呅轉囬地浗呅', '暫時還莈冇。', 'www.diqiuwen.zz']
    ] },
    '2027暴富秘籍': { list: [
      ['2027暴富秘籍 官方下载 - 无聊科技', '官方正版，解压即可暴富。', 'www.wuliaokeji.com.cn'],
      ['2027暴富秘籍 破解版', '比官方版少一年，2026 年暴富。', 'www.pojie.zz'],
      ['2027暴富秘籍有用吗？_拾度知道', '最佳答案：楼主 ' + OS.YEAR + ' 年就下好了，现在还在等。', 'zhidao.shidu.com/question/3.html']
    ] },
    '1+1等于几': { none: '找到相关网页约 0 篇。\n这个问题属于个人隐私。' },
    '羊为什么吃纸': { list: [
      ['羊为什么吃纸？_拾度知道', '最佳答案：因为纸好吃。', 'zhidao.shidu.com/question/4.html'],
      ['桌面上的羊把我的文件吃了', '回复：多放点纸。', 'bbs.yang.zz']
    ] },
    '怎么让电脑蓝屏': { bsod: true, list: [
      ['怎么让电脑蓝屏？_拾度知道', '最佳答案：第一步，打开拾度。第二步，搜“怎么让电脑蓝屏”。', 'zhidao.shidu.com/question/404.html']
    ] }
  };
  const qKey = q => String(q).replace(/\s+/g, '').toLowerCase();
  const encQ = q => q.replace(/%/g, '%25').replace(/\+/g, '%2B').replace(/ /g, '+');
  const decQ = s => { try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (_) { return s; } };
  function search(q) { q = String(q || '').trim(); if (q) nav('www.shidu.com/s?wd=' + encQ(q)); }
  // 搜索框：点一下下面弹出"大家都在搜"，点一个就搜（不用打字）；电脑上也能自己打
  function searchBox(q, cls) {
    const input = el('input', { class: 'shd-in', type: 'text', spellcheck: 'false', autocomplete: 'off' });
    input.value = q || '';
    const wrap = el('div', { class: 'shd-box' + (cls ? ' ' + cls : '') });
    const sug = el('div', { class: 'shd-sug' }, [el('div', { class: 'shd-sugcap', text: SD.hot })].concat(SD.hotList.map(h => {
      const it = el('div', { class: 'shd-sugi', text: h });
      it.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); OS.sound.play('click'); wrap.classList.remove('open'); search(h); });
      return it;
    })));
    input.addEventListener('pointerdown', e => { e.stopPropagation(); wrap.classList.add('open'); });
    input.addEventListener('focus', () => wrap.classList.add('open'));
    input.addEventListener('blur', () => setTimeout(() => wrap.classList.remove('open'), 150));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); search(input.value); } });
    wrap.append(el('div', { class: 'shd-inw' }, [input, sug]), Btn(SD.btn, () => search(input.value)));
    return wrap;
  }
  const sdLogo = sm => Img('shd-logo' + (sm ? ' sm' : ''), [el('span', { class: 'shd-l1', text: '拾' }), el('span', { class: 'shd-l2', text: '度' }), sm ? null : el('i', { text: 'shidu' })]);
  SITES['www.shidu.com'] = { page(p) {
    if (!p) {
      return pageOf(SD.title, el('div', { class: 'shd shd-home' }, [
        el('div', { class: 'shd-tabs' }, SD.tabs.map(([t, u]) => (u ? A(t, u) : el('b', { text: t })))),
        sdLogo(),
        searchBox('', 'big'),
        el('div', { class: 'shd-slogan', text: SD.slogan }),
        el('div', { class: 'shd-foot', text: SD.foot })
      ]));
    }
    const m = /^s\?wd=(.*)$/.exec(p);
    if (!m) return null;
    const q = decQ(m[1]).trim();
    const R = SD_R[qKey(q)];
    const rows = !R ? [el('div', { class: 'shd-empty', text: SD.notFound(q) })]
      : R.none ? [el('div', { class: 'shd-empty', text: R.none })]
      : R.list.map(([t, s, u, to]) => el('div', { class: 'shd-r' }, [A(t, to || u, 'shd-rt'), el('div', { class: 'shd-rs', text: s }), el('div', { class: 'shd-ru', text: u + ' - ' + (3 + t.length % 9) + 'K' })]));
    const node = el('div', { class: 'shd' }, [
      el('div', { class: 'shd-rhead' }, [hook(sdLogo(true), 'www.shidu.com'), searchBox(q)]),
      el('div', { class: 'shd-count', text: R && !R.none ? SD.count : SD.count0 })
    ].concat(rows, [el('div', { class: 'shd-foot', text: SD.foot })]));
    // 搜"怎么让电脑蓝屏"：结果刚出来就蓝屏
    const after = R && R.bsod ? my => setTimeout(() => { if (alive(my) && OS.boot.state === 'desktop') OS.ui.bsod(BSOD); }, 1500) : null;
    return pageOf(SD.resTitle(q), node, null, { after });
  } };

  /* ================= 4299.com（小游戏） ================= */
  const G4 = {
    title: '4299小游戏 - 好玩的小游戏都在这里', name: '小游戏', slogan: '好玩的小游戏都在这里',
    nav: [['首页', null], ['最新', 'www.4299.com/new.htm'], ['益智', 'www.4299.com/yizhi.htm'], ['动作', 'www.4299.com/dongzuo.htm'], ['休闲', 'www.4299.com/xiuxian.htm']],
    hot: n => '人气：' + n,
    foot: '本站游戏均来自网络，如有侵权请联系删除。',
    home: '4299小游戏',
    need: '此内容需要安装 Flesh 插件才能播放。', install: '点此安装',
    loading: '正在下载 Flesh 插件……',
    fail: '下载失败：您的网速只有 0.3 KB/s，预计还需 48 年。',
    intro: '游戏介绍：', how: '操作说明：', howText: '鼠标左键', more: '相关游戏：',
    // [名字, 小图上的字, 小图颜色, 人气, 介绍]
    games: [
      ['是大虾就下一百层', '虾', '#1e9fc7', 128650, '一层一层往下跳，跳到底就是大虾。'],
      ['暴打老板', '打', '#d9452b', 99999, '老板不在的时候，可以在这里出气。'],
      ['鬼塔', '塔', '#6a3fa0', 52013, '一共 50 层，钥匙永远差一把。'],
      ['超级玛丽苏', '苏', '#e85a9b', 66666, '主角一出场，全世界都爱上了主角。'],
      ['贪吃羊', '羊', '#2fa14f', 88888, '羊吃一张纸，就长一截。'],
      ['疯狂打公鸡', '鸡', '#f0a020', 233333, '一棒子把公鸡打飞，看能飞多远。']
    ]
  };
  const PUZZLE = '<svg viewBox="0 0 24 24"><path d="M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H4v-4a2 2 0 1 0 0-4z" fill="#8fb8e8" stroke="#3a6ea5" stroke-width="1"/></svg>';
  const gameUrl = i => 'www.4299.com/game/' + (i + 1) + '.htm';
  const thumb = g => el('div', { class: 'ie-img g4-thumb', style: { background: g[2] } }, [el('span', { text: g[1] })]);
  function g4Head() {
    return el('div', {}, [
      Img('g4-head', [el('span', { class: 'g4-logo', text: '4299' }), el('b', { text: G4.name }), el('span', { class: 'g4-slogan', text: G4.slogan })]),
      el('div', { class: 'g4-nav' }, G4.nav.map(([t, u]) => A(t, u || 'www.4299.com')))
    ]);
  }
  // ［点此安装］：进度条走一点就卡住 → 下载失败
  function installFlesh(box) {
    box.textContent = '';
    const fill = el('div', { class: 'g4-fill' });
    box.append(el('div', { text: G4.loading }), el('div', { class: 'g4-bar' }, [fill]));
    const my = tok;
    setTimeout(() => { fill.style.width = '3%'; }, 30);
    setTimeout(() => {
      if (!alive(my) || !box.isConnected) return;
      box.textContent = '';
      box.append(el('div', { class: 'g4-failt', text: G4.fail }), Btn(G4.install, () => installFlesh(box)));
      OS.sound.play('error');
    }, 3800);
  }
  SITES['www.4299.com'] = { page(p) {
    if (!p) {
      const grid = el('div', { class: 'g4-grid' }, G4.games.map((g, i) => hook(el('div', { class: 'g4-cell' }, [
        thumb(g), el('div', { class: 'g4-ct' }, [el('div', { class: 'g4-cn', text: g[0] }), el('div', { class: 'g4-hot', text: G4.hot(g[3]) })])
      ]), gameUrl(i))));
      return pageOf(G4.title, el('div', { class: 'g4' }, [g4Head(), grid, el('div', { class: 'g4-foot', text: G4.foot })]));
    }
    const m = /^game\/(\d+)\.htm$/.exec(p);
    const i = m ? +m[1] - 1 : -1;
    const g = G4.games[i];
    if (!g) return null;
    const box = el('div', { class: 'g4-box' }, [el('span', { class: 'g4-puz', html: PUZZLE }), el('div', { text: G4.need })]);
    box.appendChild(Btn(G4.install, () => installFlesh(box)));
    const node = el('div', { class: 'g4' }, [
      g4Head(),
      el('div', { class: 'g4-crumb' }, [A(G4.home, 'www.4299.com'), ' > ' + g[0]]),
      box,
      el('div', { class: 'g4-info' }, [el('b', { text: G4.intro }), g[4]]),
      el('div', { class: 'g4-info' }, [el('b', { text: G4.how }), G4.howText]),
      el('div', { class: 'g4-info g4-more' }, [el('b', { text: G4.more })].concat(G4.games.map((x, j) => (j === i ? null : A(x[0], gameUrl(j)))))),
      el('div', { class: 'g4-foot', text: G4.foot })
    ]);
    return pageOf(g[0] + ' - 4299小游戏', node);
  } };

  /* ================= www.wuliaokeji.com.cn（无聊科技官网） ================= */
  const WL = {
    title: '无聊科技有限公司', name: '无聊科技有限公司', slogan: '专注无聊二十年',
    nav: ['首页', '产品下载', '关于我们', '联系我们'],
    marquee: '热烈祝贺本公司官网开通！　　　本站最佳浏览分辨率 800×600',
    prods: [["Windoesn't XP", 'logo'], ['抠抠2003', 'koukou'], ['千千不听', 'qianqian'], ['2027暴富秘籍', 'rich'], ['弹窗杀手', 'swatter'], ['阳寿余额查询', 'lifespan']],
    dl: '下载', dlFail: '下载失败：服务器在楼下，网线被老鼠咬了。',
    about: '无聊科技有限公司成立于 ' + OS.YEAR + ' 年，专注无聊二十年。',
    contact: '地址：楼下，服务器旁边\n电话：一直占线',
    foot: '© ' + OS.YEAR + ' 无聊科技'
  };
  SITES['www.wuliaokeji.com.cn'] = { collect: true, page(p) {
    if (p) return null;
    const sec = (h, kids) => el('div', { class: 'wl-sec' }, [el('div', { class: 'wl-sech', text: h })].concat(kids));
    const prods = WL.prods.map(([n, id]) => {
      const icon = id === 'logo' ? 'logo' : (OS.apps.byId[id] ? OS.apps.byId[id].icon : 'exe');
      return el('div', { class: 'wl-p' }, [OS.iconEl(icon, 'wl-pico'), el('span', { class: 'wl-pn', text: n }), Btn(WL.dl, say(WL.dl, 'error', WL.dlFail))]);
    });
    const secs = [sec(WL.nav[1], prods), sec(WL.nav[2], [el('div', { class: 'wl-txt', text: WL.about })]), sec(WL.nav[3], [el('div', { class: 'wl-txt', text: WL.contact })])];
    const jump = k => () => { if (ui) ui.page.scrollTop = k < 0 ? 0 : secs[k].offsetTop - 2; };
    const node = el('div', { class: 'wl' }, [
      Img('wl-head', [OS.iconEl('logo', 'wl-logo'), el('div', {}, [el('div', { class: 'wl-name', text: WL.name }), el('div', { class: 'wl-slogan', text: WL.slogan })])]),
      el('div', { class: 'wl-nav' }, WL.nav.map((t, k) => A(t, jump(k - 1)))),
      el('div', { class: 'wl-marq' }, [el('span', { text: WL.marquee })])
    ].concat(secs, [el('div', { class: 'wl-foot', text: WL.foot })]));
    return pageOf(WL.title, node);
  } };

  /* ================= www.dapian.zz（免费看大片） ================= */
  const DP = {
    title: '免费看大片 - 最新大片 免费在线看', name: '免费看大片', sub: '最新大片 免费在线看',
    buf: '缓冲中 0%', playing: t => '正在播放：' + t, slow: '网速太慢，已缓冲 0%。',
    hot: '热门大片', films: ['《56K 之恋》', '《拨号猫》', '《楼下小卖部》', '《一刀 999 级》', '《盗版的盗版》'],
    ad: '恭喜您成为本站第 10000 位幸运访客！', adBtn: '立即领取', adFail: '领奖失败：笔记本已被第 9999 位领走了。',
    foot: '本站所有影片均来自网络'
  };
  SITES['www.dapian.zz'] = { collect: true, page(p) {
    if (p) return null;
    const cap = el('div', { class: 'dp-cap', text: DP.playing(DP.films[0]) });
    const screen = el('div', { class: 'dp-screen' }, [el('div', { class: 'dp-spin' }), el('div', { text: DP.buf })]);
    const node = el('div', { class: 'dp' }, [
      Img('dp-head', [el('span', { text: DP.name }), el('small', { text: DP.sub })]),
      el('div', { class: 'dp-main' }, [
        el('div', { class: 'dp-player' }, [cap, screen, el('div', { class: 'dp-ctl' }, [el('span', { text: '▶' }), el('div', { class: 'dp-line' }), el('span', { text: '00:00 / --:--' })]), el('div', { class: 'dp-note', text: DP.slow })]),
        el('div', { class: 'dp-list' }, [el('div', { class: 'dp-lh', text: DP.hot })].concat(DP.films.map(f => A(f, () => { cap.textContent = DP.playing(f); }))))
      ]),
      el('div', { class: 'dp-ad' }, [DP.ad, Btn(DP.adBtn, say(DP.adBtn, 'error', DP.adFail))]),
      el('div', { class: 'dp-foot', text: DP.foot })
    ]);
    return pageOf(DP.title, node);
  } };

  /* ================= 三个改你主页的流氓网站 ================= */
  const RG = {
    baofu: { title: '暴富2027 - 距离暴富还有 ∞ 天', h: '★ 暴富2027 ★', sub: '距离暴富还有 ∞ 天', btn: '立即暴富', act: say('暴富2027', 'warn', '请先充值 10 抠币。') },
    yangshou: { title: '阳寿网 - 在线查阳寿', h: '阳寿网', sub: '在线查阳寿　全国联网　地府直连', btn: '开始查询', act: () => OS.apps.open('lifespan') },
    bamai: { title: '中医把脉网 - 网上挂号', h: '中医把脉网', sub: '网上挂号　足不出户　在线把脉', btn: '在线把脉', tip: '请把手指按在屏幕上。' }
  };
  function rogue(host, k, cls) {
    SITES[host] = { collect: true, rogue: true, page(p) {
      if (p) return null;
      const r = RG[k];
      const tip = el('div', { class: 'rg-tip' });
      const node = el('div', { class: 'rg ' + cls }, [
        Img('rg-h', [el('span', { text: r.h })]),
        el('div', { class: 'rg-sub', text: r.sub }),
        Btn(r.btn, () => { if (r.act) r.act(); else tip.textContent = r.tip; }, 'rg-btn'),   // 把脉：说完这句就什么都没发生了
        tip
      ]);
      return pageOf(r.title, node);
    } };
  }
  rogue('www.baofu2027.com', 'baofu', 'rg-bf');
  rogue('www.yangshou.net', 'yangshou', 'rg-ys');
  rogue('www.zhongyi-bamai.cn', 'bamai', 'rg-zy');

  /* ================= bbs.xingfu3.zz（幸福小区业主论坛，收藏夹里本来就有） ================= */
  const BB = {
    title: '幸福小区业主论坛', host: 'bbs.xingfu3.zz',
    hello: '欢迎您，游客', login: '登录', reg: '注册', loginText: '请先注册。', regText: '注册已关闭。',
    board: '业主交流', cols: ['标题', '作者', '回复'],
    online: '当前在线 3 人：你、对门王阿姨、物业',
    floors: ['楼主', '沙发', '板凳', '地板'],
    noReply: '你还没有登录，不能回复。',
    forward: '转发',
    noise: n => '本月已记录投诉 ' + n + ' 次。',
    // [标题, [[谁, 说了什么], …]]
    threads: [
      ['[公告] 本论坛禁止发广告', [['版主', '本论坛禁止发广告，违者删帖。'], ['热心网友', '免费看大片 www.dapian.zz'], ['版主', '已删。']]],
      ['停水通知', [['物业', '明天停水。'], ['3号楼住户', '收到。'], ['对门王阿姨', '收到。'], ['楼下住户', '明天是哪天？'], ['物业', '明天。']]],
      ['谁家半夜放 DJ？能不能小点声！', [['楼下住户', '楼上的，小点声！\n天天半夜放《宝贝我爱你爱你爱你》，还是 DJ 劲爆版。'], ['物业', '已记录。'], ['隔壁大学生', '我觉得挺好听的。']]],
      ['楼下小卖部雪糕涨到 1 块了', [['小道消息', '以前 5 毛，现在 1 块。'], ['隔壁大学生', '不吃了。'], ['楼下小卖部老板', '先把账结了。']]],
      ['求种子', [['隔壁大学生', '宿舍网速太慢，谁有种子，发我抠抠。'], ['对门王阿姨', '小区花坛里有，自己去挖。'], ['物业', '花坛里的不许挖。']]],
      ['转发给10个人就能长寿！！！', [['对门王阿姨', '据专家研究，转发本文给 10 个人，\n可以延长寿命 10 年。'], ['3号楼住户', '阿姨，这篇您发过 8 遍了。']]],
      ['新建文件夹(2) 里好像住着人，有人知道吗？', [['3号楼住户', '每次点开都往里走，越走越深，最里面好像亮着灯。'], ['楼下住户', '别进去。'], ['物业', '那户的物业费还没交。']]]
    ]
  };
  const THREAD_DJ = 2, THREAD_LONG = 5;
  const threadUrl = i => BB.host + '/thread-' + (i + 1) + '.html';
  // 千千不听放 DJ 被楼下敲过门：物业那句换成真记了几次
  function postsOf(i) {
    const posts = BB.threads[i][1].slice();
    const n = OS.save.get('qqNoise', 0);
    if (i === THREAD_DJ && n) posts[1] = ['物业', BB.noise(n)];
    return posts;
  }
  function bbHead(crumb) {
    return el('div', {}, [
      Img('xf-head', [el('b', { text: BB.title }), el('span', { text: BB.host })]),
      el('div', { class: 'xf-user' }, [BB.hello, A(BB.login, say(BB.login, 'info', BB.loginText)), A(BB.reg, say(BB.reg, 'info', BB.regText))]),
      el('div', { class: 'xf-crumb' }, crumb)
    ]);
  }
  SITES[BB.host] = { page(p) {
    if (!p) {
      const rows = BB.threads.map((t, i) => el('div', { class: 'xf-tr' }, [
        el('span', { class: 'xf-c0' }, [A(t[0], threadUrl(i))]),
        el('span', { class: 'xf-c1', text: t[1][0][0] }),
        el('span', { class: 'xf-c2', text: String(postsOf(i).length - 1) })
      ]));
      return pageOf(BB.title, el('div', { class: 'xf' }, [
        bbHead([BB.title + ' » ' + BB.board]),
        el('div', { class: 'xf-tab' }, [el('div', { class: 'xf-tr xf-th' }, BB.cols.map((c, k) => el('span', { class: 'xf-c' + k, text: c })))].concat(rows)),
        el('div', { class: 'xf-on', text: BB.online })
      ]));
    }
    const m = /^thread-(\d+)\.html$/.exec(p);
    const i = m ? +m[1] - 1 : -1;
    const t = BB.threads[i];
    if (!t) return null;
    const posts = postsOf(i).map(([who, text], k) => el('div', { class: 'xf-post' }, [
      el('div', { class: 'xf-who', text: who }),
      el('div', { class: 'xf-body' }, [
        el('div', { class: 'xf-floor', text: BB.floors[k] || (k + 1) + '楼' }),
        el('div', { class: 'xf-text' }, linkify(text, u => A(u, u))),
        i === THREAD_LONG && k === 0 && OS.netShared ? Btn(BB.forward, () => OS.netShared.forwardChain()) : null
      ])
    ]));
    return pageOf(t[0] + ' - ' + BB.title, el('div', { class: 'xf' }, [
      bbHead([A(BB.title, BB.host), ' » ' + BB.board]),
      el('div', { class: 'xf-title', text: t[0] })
    ].concat(posts, [el('div', { class: 'xf-noreply', text: BB.noReply })])));
  } };

  /* ================= 给别的软件用 ================= */
  OS.ie = { open: u => openWin(u), options, home: () => home, setHome, HOME,
    // 超级秃子用的：清历史 ／ 主页改回 huai123 ／ 标题栏换字 ／ 开着的浏览器里把海葵工具条当场拆掉
    clearHistory: () => { hist = []; },
    fixHome: () => { if (home === HOME) return false; setHome(HOME); return true; },
    retitle: () => { if (win && !win.isClosed) win.setTitle((curTitle ? curTitle + ' - ' : '') + brand()); },
    dropToolbar: () => {
      if (!ui || !ui.hk) return;
      const bar = ui.hk;
      ui.hk = null; ui.hkOff = false;
      bar.classList.add('ie-hk-gone');
      setTimeout(() => bar.remove(), 450);
    } };
})();
