/* ABCSee 大眼看图 V3.1（开始 ▸ 所有程序 ▸ ABCSee 大眼看图）：游戏里所有图片（.jpg .bmp）都用它开
   - 浏览模式：左边文件夹树 + 预览小框，右边一排排真的缩略图；查看模式：一张大图，放大缩小、旋转、全屏、幻灯片、设为墙纸
   - 共享版：每次打开弹“试用期还剩 N 天”，每开一次少一天；减成负数照样能用，右下角：天数变负了也能用，I服了U！
   - 设为墙纸：桌面的蓝天草坡真的换成这张图，云、木牌、羊都还在；重启变回来
   - 蓝屏：网上邻居 ▸ 隔壁大学生 ▸ 电影 里的 ABCSee3.1注册机.exe 生成注册码 → 回来 帮助 ▸ 注册… → 注册成功 → 一秒后蓝屏 KEYGEN_DETECTED
   - 注册机点［生成］就中毒：托盘小虫、新闻条被抢、图标被啃、光驱自己弹、弹广告、抠抠尾巴、标题“已破解”、开始变结束（三拨），重启才好
   创意稿见「ABCSee大眼看图-创意.md」 */
(function () {
  'use strict';
  const el = OS.el, FS = OS.fs;
  const app = OS.apps.byId.abcsee;
  const NAME = 'ABCSee 大眼看图 V3.1';
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const L = {
    trial: n => '欢迎使用 ABCSee 大眼看图 V3.1 共享版\n您的试用期还剩 ' + n + ' 天。' + (n < 0 ? '\n请继续试用。' : ''),
    negative: '天数变负了也能用，I服了U！',
    reg: '注册…', goOn: '继续试用',
    helpTitle: 'ABCSee 帮助', help: '双击图片就能看。\n看完一张，点下一张。',
    about: 'ABCSee 大眼看图 V3.1\n大眼看图，越看眼越大。\n共享版　(C) ' + OS.YEAR + ' 无聊科技',
    open: '打开失败：图片都在我的图片里，去那儿双击。',
    paint: '画图 AI版 正在施工。',
    rename: '重命名失败：示例图片是系统送的，名字是出厂设置。',
    pickOne: '请先选一张图片。',
    noPics: '这个文件夹里没有图片。',
    maxZoom: '已经放到最大了。', minZoom: '已经缩到最小了。',
    sharpen: n => '已锐化 ' + n + ' 次，更糊了。',
    sharpenOther: '锐化完成。看起来没什么变化。',
    dizzy: '雪人有点晕。',
    wallDone: n => '墙纸已更换：' + n,
    wallBack: '墙纸已换回草坡和羊。',
    wallFix: '正在把原来的壁纸贴回去',
    props: p => '文件名：' + p.name + '\n尺寸：' + p.w + ' × ' + p.h + ' 像素\n颜色：24 位色\n文件大小：' + p.kb + ' KB\n拍摄相机：' + p.cam,
    // 注册
    regTitle: '注册 ABCSee', regPick: '点这里选一个', regBtn: '注册', regEmpty: '请先填注册码。',
    codes: [['ABCS-0000-0000', '注册码无效。'], ['8888-8888-8888', '注册码无效。\n吉利也没用。'], ['从网上抄的', '这个注册码已经被一万个人用过了。']],
    keyItem: '注册机算出来的那个', KEY: 'ABCS-6666-8888',
    regOk: '注册成功！感谢您购买 ABCSee。',
    // 注册机
    kgTitle: 'ABCSee 3.1 注册机', kgBy: 'by 某某破解小组',
    kgScroll: '★ ABCSee 3.1 注册机 ★ 向所有通宵破解的兄弟致敬 ★ 本注册机仅供学习交流 ★ 请于下载后 24 小时内删除 ★',
    kgGen: '生成', kgAbout: '关于', kgExit: '退出', kgCopied: '注册码已复制。',
    kgAboutText: 'ABCSee 3.1 注册机\nby 某某破解小组\n仅供学习交流，请于下载后 24 小时内删除。'
  };
  const MENUS = ['文件(F)', '编辑(E)', '查看(V)', '工具(T)', '帮助(H)'];
  const BSOD = { id: 'abcsee', name: 'KEYGEN_DETECTED', text: '注册机里自带的病毒先把系统干掉了。' };
  const ZOOMS = [25, 50, 75, 100, 150, 200, 300, 400, 600, 800, 1200, 1600];
  const KB = { '蓝色的山.jpg': 12, '日落.jpg': 9, '冬天.jpg': 10, '睡莲.jpg': 14, '草坡和羊.bmp': 1266 };
  const CAM = { '蓝色的山.jpg': '画的。', '冬天.jpg': '冻住了。', '日落.jpg': '手机，像素 30 万。', '睡莲.jpg': '青蛙自拍。', '想得美.jpg': '手抖。', '草坡和羊.bmp': '羊自己拍的。', slip: '针式打印机。' };
  const SLIP_ASPECT = 0.85;   // 欠条缩略图、幻灯片里用的宽高比
  const isPic = n => n && !n.folder && (n.kind === 'jpg' || n.kind === 'bmp');
  const picsIn = dir => FS.list(dir).filter(isPic);
  const overlay = () => document.getElementById('overlay');

  /* ================= 一张图：缩略图、大图、幻灯片、墙纸都从这里拿 ================= */
  // 欠条的小样（缩略图、幻灯片、墙纸用；查看模式里是真欠条）
  function drawSlip(g, w, h) {
    g.fillStyle = '#fffdf3'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d8ccb0'; g.lineWidth = Math.max(1, w / 160); g.strokeRect(0.5, 0.5, w - 1, h - 1);
    g.fillStyle = '#b00'; g.textAlign = 'center'; g.textBaseline = 'top';
    g.font = 'bold ' + Math.max(6, Math.round(h * 0.11)) + 'px SimSun, "宋体", serif';
    g.fillText('欠　条', w / 2, h * 0.06);
    g.fillStyle = '#c4c4c4';
    for (let i = 0; i < 6; i++) g.fillRect(w * 0.1, h * (0.27 + i * 0.1), w * (i === 5 ? 0.45 : 0.8), Math.max(1, h * 0.025));
    g.fillStyle = 'rgba(210, 20, 20, .75)';
    g.beginPath(); g.arc(w * 0.78, h * 0.86, h * 0.07, 0, Math.PI * 2); g.fill();
  }
  function picOf(nd) {
    const p = { node: nd, name: nd.name, kb: KB[nd.name] || 8, cam: CAM[nd.name] || '不知道。' };
    if (nd.slip) {
      return Object.assign(p, { w: 300, h: Math.round(300 * SLIP_ASPECT), dom: true, cam: CAM.slip,
        make: () => { const s = OS.slipEl ? OS.slipEl(nd.slip) : el('div'); s.classList.add('ab-slip'); return s; },
        draw: drawSlip });
    }
    // 画图 AI版画的：存的是一张小图；bmp 本来就大，按真 bmp 算大小
    if (nd.img) {
      const im = new Image();
      im.src = nd.img;
      const draw = (g, w, h) => {
        const put = () => g.drawImage(im, 0, 0, w, h);
        if (im.complete && im.naturalWidth) { put(); return; }
        g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
        im.addEventListener('load', put, { once: true });
      };
      return Object.assign(p, { w: 300, h: 190, kb: 167, cam: '你的手指。', draw,
        make: () => { const c = el('canvas'); c.width = 300; c.height = 190; draw(c.getContext('2d'), 300, 190); return c; } });
    }
    if (nd.canvas) {
      const c0 = nd.canvas();
      return Object.assign(p, { w: c0.width, h: c0.height, kb: 3,
        make: () => { const c = el('canvas'); c.width = p.w; c.height = p.h; c.getContext('2d').drawImage(nd.canvas(), 0, 0); return c; },
        draw: (g, w, h) => g.drawImage(nd.canvas(), 0, 0, w, h) });
    }
    const [w, h] = nd.src ? [480, 320] : (nd.picSize || [480, 320]);
    return Object.assign(p, { w, h, src: nd.src,
      make: () => { const c = el('canvas'); c.width = w; c.height = h; nd.draw(c.getContext('2d'), w, h, c); return c; },
      draw: (g, ww, hh) => nd.draw(g, ww, hh) });
  }
  const aspectOf = p => (p.dom ? SLIP_ASPECT : p.h / p.w);
  // 一张小图：按比例塞进 mw × mh 的框里
  function thumbEl(p, mw, mh) {
    const a = aspectOf(p);
    let w = mw, h = w * a;
    if (h > mh) { h = mh; w = h / a; }
    const c = el('canvas', { class: 'ab-tcv' });
    c.width = Math.max(1, Math.round(w * 2)); c.height = Math.max(1, Math.round(h * 2));
    c.style.width = Math.round(w) + 'px'; c.style.height = Math.round(h) + 'px';
    try { p.draw(c.getContext('2d'), c.width, c.height); } catch (e) { /* 画不出来就空着 */ }
    return c;
  }

  /* ================= 主窗口（只开一个；从文件夹里双击图片，就在这个窗口里看） ================= */
  let inst = null;
  app.open = () => openWin(null);
  function openWin(nd) {
    if (inst && !inst.win.isClosed) { OS.wm.focus(inst.win); if (nd) inst.view(nd); return inst.win; }
    inst = build(nd);
    nag();
    return inst.win;
  }

  function build(startNode) {
    let mode = 'browse', dir = FS.PICS, sel = null, lastTap = null, lastT = 0;
    let cur = null, stageEl = null, picEl = null;
    let z = 1, fit = true, rot = 0, panX = 0, panY = 0, sharpened = 0, rightTurns = 0, note = '';
    const tools = el('div', { class: 'ab-tools' });
    const main = el('div', { class: 'ab-main' });
    const status = el('div', { class: 'ab-status' });
    const content = el('div', { class: 'ab' }, [OS.ui.menuBar(MENUS, menuFor, 'ab-mbar'), tools, main, status]);
    const win = OS.wm.open({ title: NAME, icon: 'abcsee', width: 456, height: 286, appId: app.id, content, center: true });
    win.closed.then(() => { if (inst && inst.win === win) inst = null; });
    const curDir = () => (mode === 'view' && cur ? FS.parentOf(cur.list[cur.i].path) : dir);
    const folderName = d => { const n = FS.get(d); return n ? (n.label || n.name) : d; };
    const setTitle = () => win.setTitle(NAME + ' - ' + (mode === 'view' && cur ? cur.pic.name : folderName(dir)));
    function toolbar(items) {
      tools.textContent = '';
      items.forEach(([t, fn]) => {
        const b = el('button', { class: 'ab-tb', text: t });
        b.addEventListener('click', () => { OS.sound.play('click'); fn(); });
        tools.appendChild(b);
      });
    }

    /* ---------- 浏览模式 ---------- */
    function folders() {
      const out = [{ path: FS.MYDOCS, label: '我的文档', depth: 0 }, { path: FS.PICS, label: '我的图片', depth: 1 }];
      FS.list(FS.PICS).filter(n => n.folder).forEach(n => out.push({ path: n.path, label: n.label || n.name, depth: 2 }));
      return out;
    }
    function browse(d) {
      mode = 'browse';
      if (d) dir = d;
      sel = null; lastTap = null;
      setTitle();
      toolbar([['查看', viewSel], ['幻灯片', startShow], ['设为墙纸', () => withPic(setWall)], ['打印', print], ['属性', () => withPic(props)]]);
      main.textContent = '';
      main.className = 'ab-main browse';
      const tree = el('div', { class: 'ab-tree' });
      folders().forEach(f => {
        const r = el('div', { class: 'ab-trow' + (f.path === dir ? ' cur' : ''), style: { paddingLeft: (f.depth * 9 + 2) + 'px' } }, [OS.iconEl(f.path === FS.MYDOCS ? 'mydocs' : 'folder', 'ab-tico'), el('span', { text: f.label })]);
        r.addEventListener('click', () => { OS.sound.play('click'); browse(f.path); });
        tree.appendChild(r);
      });
      const preview = el('div', { class: 'ab-prev' });
      const grid = el('div', { class: 'ab-grid' });
      main.append(el('div', { class: 'ab-left' }, [tree, preview]), grid);
      const subs = FS.list(dir).filter(n => n.folder), pics = picsIn(dir);
      const cell = (inner, label, onOpen, onSel) => {
        const c = el('div', { class: 'ab-cell' }, [el('div', { class: 'ab-frame' }, [inner]), el('div', { class: 'ab-lab', text: label })]);
        c.addEventListener('click', e => {
          e.stopPropagation();
          grid.querySelectorAll('.ab-cell.sel').forEach(n => n.classList.remove('sel'));
          c.classList.add('sel');
          if (onSel) onSel();
          const now = Date.now();
          if (lastTap === c && now - lastT < OS.dblMs()) { lastTap = null; onOpen(); } else { lastTap = c; lastT = now; }
        });
        grid.appendChild(c);
      };
      subs.forEach(n => cell(OS.iconEl('folder', 'ab-ficon'), n.label || n.name, () => { OS.sound.play('click'); browse(n.path); }, () => { sel = null; showPreview(null); }));
      pics.forEach(n => cell(thumbEl(picOf(n), 62, 46), n.name, () => view(n), () => { sel = n; showPreview(n); }));
      if (!subs.length && !pics.length) grid.appendChild(el('div', { class: 'ab-empty', text: L.noPics }));
      grid.addEventListener('click', () => { grid.querySelectorAll('.ab-cell.sel').forEach(n => n.classList.remove('sel')); sel = null; showPreview(null); });
      function showPreview(n) {
        preview.textContent = '';
        if (n) preview.appendChild(thumbEl(picOf(n), 88, 58));
        status.textContent = '共 ' + pics.length + ' 个文件' + (n ? '　选中 1 个　' + picOf(n).kb + ' KB' : '');
      }
      showPreview(null);
    }
    function viewSel() {
      if (mode === 'view') return;
      const first = sel || picsIn(dir)[0];
      if (!first) { OS.ui.dialog({ title: NAME, icon: 'info', text: L.noPics }); return; }
      view(first);
    }
    // 拿“现在这张”：查看模式是正在看的；浏览模式是选中的
    function withPic(fn) {
      if (mode === 'view' && cur) { fn(cur.pic); return; }
      if (!sel) { OS.ui.dialog({ title: NAME, icon: 'info', text: L.pickOne }); return; }
      fn(picOf(sel));
    }

    /* ---------- 查看模式 ---------- */
    function view(nd) {
      const list = picsIn(FS.parentOf(nd.path));
      let i = list.findIndex(n => n.path === nd.path);
      if (i < 0) { list.push(nd); i = list.length - 1; }
      cur = { list, i, pic: null };
      mode = 'view';
      toolbar([['浏览', () => browse(curDir())], ['上一张', () => step(-1)], ['下一张', () => step(1)], ['放大', () => zoom(1)], ['缩小', () => zoom(-1)],
        ['适合窗口', fitWin], ['向左转', () => rotate(-90)], ['向右转', () => rotate(90)], ['全屏', full], ['设为墙纸', () => setWall(cur.pic)]]);
      main.textContent = '';
      main.className = 'ab-main viewing';
      stageEl = el('div', { class: 'ab-stage' });
      main.appendChild(stageEl);
      // 放大了能拖着看
      stageEl.addEventListener('pointerdown', e => {
        if (!canPan()) return;
        e.preventDefault();
        const s = OS.stage.toLocal(e.clientX, e.clientY), x0 = panX, y0 = panY;
        try { stageEl.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        const mv = ev => { const p = OS.stage.toLocal(ev.clientX, ev.clientY); panX = x0 + p.x - s.x; panY = y0 + p.y - s.y; layout(); };
        const up = () => { stageEl.removeEventListener('pointermove', mv); stageEl.removeEventListener('pointerup', up); stageEl.removeEventListener('pointercancel', up); };
        stageEl.addEventListener('pointermove', mv);
        stageEl.addEventListener('pointerup', up);
        stageEl.addEventListener('pointercancel', up);
      });
      show();
    }
    function show() {
      const nd = cur.list[cur.i];
      const pic = cur.pic = picOf(nd);
      z = 1; fit = true; rot = 0; panX = 0; panY = 0; sharpened = 0; rightTurns = 0; note = '';
      stageEl.textContent = '';
      picEl = el('div', { class: 'ab-pic' }, [pic.make()]);
      if (nd.name === '蓝色的山.jpg') picEl.appendChild(el('span', { class: 'ab-secret', text: '其实是绿的' }));   // 放大到 400% 才看得清
      stageEl.appendChild(picEl);
      if (pic.dom) { pic.w = picEl.offsetWidth || pic.w; pic.h = picEl.offsetHeight || pic.h; }
      setTitle();
      layout();
    }
    const side = () => rot % 180 !== 0;
    const area = () => ({ w: stageEl.clientWidth, h: stageEl.clientHeight });
    const shown = () => ({ w: (side() ? cur.pic.h : cur.pic.w) * z, h: (side() ? cur.pic.w : cur.pic.h) * z });
    const canPan = () => { const a = area(), s = shown(); return s.w > a.w || s.h > a.h; };
    function layout() {
      const a = area();
      if (fit) z = Math.min(1, (a.w - 8) / (side() ? cur.pic.h : cur.pic.w), (a.h - 8) / (side() ? cur.pic.w : cur.pic.h));
      const s = shown(), mx = Math.max(0, (s.w - a.w) / 2 + 4), my = Math.max(0, (s.h - a.h) / 2 + 4);
      panX = OS.clamp(panX, -mx, mx); panY = OS.clamp(panY, -my, my);
      picEl.style.transform = 'translate(-50%, -50%) translate(' + panX + 'px, ' + panY + 'px) rotate(' + rot + 'deg) scale(' + z + ')';
      picEl.style.filter = sharpened ? 'blur(' + (sharpened * 0.7) + 'px)' : '';
      picEl.classList.toggle('pix', z > 2);
      stageEl.classList.toggle('grab', canPan());
      const p = cur.pic;
      status.textContent = [p.name, p.w + ' × ' + p.h, '24 位色', p.kb + ' KB', Math.round(z * 100) + '%'].join('　') + (note ? '　' + note : '');
    }
    function step(d) { if (!cur) return; const n = cur.list.length; cur.i = (cur.i + d + n) % n; show(); }
    function zoom(d) {
      const pct = Math.round(z * 100);
      const next = d > 0 ? ZOOMS.find(v => v > pct + 0.5) : ZOOMS.slice().reverse().find(v => v < pct - 0.5);
      if (next == null) { OS.ui.dialog({ title: NAME, icon: 'info', text: d > 0 ? L.maxZoom : L.minZoom }); return; }
      z = next / 100; fit = false; note = '';
      layout();
    }
    function fitWin() { fit = true; panX = 0; panY = 0; note = ''; layout(); }
    function rotate(d) {
      rot = (rot + d + 360) % 360;
      rightTurns = d > 0 ? rightTurns + 1 : 0;
      note = '';
      // 冬天：向右转一整圈回来，雪人晕了
      if (cur.pic.name === '冬天.jpg' && rot === 0 && rightTurns >= 4) { note = L.dizzy; rightTurns = 0; }
      if (fit) { panX = 0; panY = 0; }
      layout();
    }
    function doSharpen() {
      if (mode !== 'view' || !cur) return;
      if (cur.pic.name !== '想得美.jpg') { OS.ui.dialog({ title: NAME, icon: 'info', text: L.sharpenOther }); return; }
      sharpened++;
      note = L.sharpen(sharpened);
      layout();
    }
    // 全屏：整个屏幕黑底只剩这张图，点一下退出
    function full() {
      const o = el('div', { class: 'ab-full' });
      const pe = el('div', { class: 'ab-fpic' }, [cur.pic.make()]);
      o.appendChild(pe);
      overlay().appendChild(o);
      const w = side() ? cur.pic.h : cur.pic.w, h = side() ? cur.pic.w : cur.pic.h;
      const s = Math.min(OS.stage.W / w, OS.stage.H / h) * 0.96;
      pe.style.transform = 'translate(-50%, -50%) rotate(' + rot + 'deg) scale(' + s + ')';
      o.addEventListener('click', () => { OS.sound.play('click'); o.remove(); });
      win.closed.then(() => o.remove());
    }
    function startShow() {
      if (mode === 'view' && cur) { slideshow(cur.list, cur.i, win); return; }
      const pics = picsIn(dir);
      if (!pics.length) { OS.ui.dialog({ title: NAME, icon: 'info', text: L.noPics }); return; }
      slideshow(pics, Math.max(0, sel ? pics.findIndex(n => n.path === sel.path) : 0), win);
    }
    function props(p) { OS.ui.dialog({ title: '图片信息', icon: 'abcsee', text: L.props(p) }); }

    /* ---------- 菜单 ---------- */
    function menuFor(m) {
      const v = mode === 'view';
      if (m === MENUS[0]) return [
        { label: '打开…', action: say(NAME, 'info', L.open) },
        { label: '发送到', sub: [{ label: '邮件收件人', action: () => withPic(p => OS.mail.compose({ name: p.name, icon: 'abcpic', path: p.node && p.node.path })) }] },
        '-',
        { label: '打印…', action: print },
        { label: '属性', action: () => withPic(props) },
        '-',
        { label: '退出', action: () => win.close() }
      ];
      if (m === MENUS[1]) return [
        { label: '锐化', disabled: !v, action: doSharpen },
        { label: '用画图编辑', action: () => withPic(p => (OS.paint ? OS.paint.open(p.node) : OS.ui.dialog({ title: NAME, icon: 'info', text: L.paint }))) },
        '-',
        { label: '设为墙纸', action: () => withPic(setWall) }
      ];
      if (m === MENUS[2]) return [
        { label: '浏览模式', checked: !v, action: () => browse(curDir()) },
        { label: '查看模式', checked: v, action: viewSel },
        '-',
        { label: '全屏', disabled: !v, action: full },
        { label: '幻灯片', action: startShow },
        '-',
        { label: '放大', disabled: !v, action: () => zoom(1) },
        { label: '缩小', disabled: !v, action: () => zoom(-1) },
        { label: '适合窗口', disabled: !v, action: fitWin }
      ];
      if (m === MENUS[3]) return [{ label: '批量重命名…', action: say('批量重命名', 'warn', L.rename) }, { label: '幻灯片', action: startShow }];
      return [{ label: '帮助主题', action: say(L.helpTitle, 'help', L.help) }, { label: '注册…', action: register }, '-', { label: '关于 ABCSee', action: say('关于 ABCSee', 'info', L.about) }];
    }

    // 窗口大小变了（最大化 / 还原）：查看模式重新排一下
    const onResize = () => { if (mode === 'view' && cur && !win.isClosed) layout(); };
    if (window.ResizeObserver) new ResizeObserver(onResize).observe(main);

    if (startNode) view(startNode); else browse(FS.PICS);
    return { win, view };
  }

  function print() {
    [0, 300, 600].forEach(t => setTimeout(() => OS.sound.play('printer'), t));
    setTimeout(() => OS.ui.dialog({ title: OS.PRINT_TITLE, icon: 'error', text: OS.printErr() }), 900);
  }

  /* ================= 幻灯片：一张张自动换，切换效果随机；慢慢切，不闪 ================= */
  const SW = 960, SH = 720, HOLD = 3000, FADE = 1300;
  function slideshow(list, start, win) {
    const o = el('div', { class: 'ab-full' });
    const cv = el('canvas', { class: 'ab-show' });
    cv.width = SW; cv.height = SH;
    o.appendChild(cv);
    overlay().appendChild(o);
    const g = cv.getContext('2d');
    let alive = true;
    const stop = () => { if (!alive) return; alive = false; o.remove(); };
    o.addEventListener('click', () => { OS.sound.play('click'); stop(); });
    win.closed.then(stop);
    OS.on('desktop:reset', stop);
    const snap = nd => {
      const p = picOf(nd), a = aspectOf(p);
      let w = SW * 0.94, h = w * a;
      if (h > SH * 0.94) { h = SH * 0.94; w = h / a; }
      const inner = el('canvas');
      inner.width = Math.round(w); inner.height = Math.round(h);
      try { p.draw(inner.getContext('2d'), inner.width, inner.height); } catch (e) { /* 空着 */ }
      return { inner, x: (SW - w) / 2, y: (SH - h) / 2, w, h, nd };
    };
    const put = s => { if (s) g.drawImage(s.inner, s.x, s.y, s.w, s.h); };
    const reveal = (b, shape) => { g.save(); g.beginPath(); shape(); g.clip(); g.fillStyle = '#000'; g.fillRect(0, 0, SW, SH); put(b); g.restore(); };
    const EFFECTS = [
      (a, b, p) => { put(a); g.globalAlpha = p; g.fillStyle = '#000'; g.fillRect(0, 0, SW, SH); put(b); g.globalAlpha = 1; },          // 溶解
      (a, b, p) => { put(a); reveal(b, () => g.rect(0, 0, SW * p, SH)); },                                                                   // 从左擦除
      (a, b, p) => { put(a); reveal(b, () => { for (let k = 0; k < 8; k++) g.rect(0, k * SH / 8, SW, SH / 8 * p); }); },                     // 百叶窗
      (a, b, p) => { put(a); reveal(b, () => {                                                                                                // 棋盘格
        for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) {
          const q = (r + c) % 2 ? Math.max(0, p * 2 - 1) : Math.min(1, p * 2);
          if (q > 0) g.rect(c * SW / 8, r * SH / 6, SW / 8 * q, SH / 6);
        }
      }); }
    ];
    let i = start, prev = null, next = snap(list[i]), fx = EFFECTS[0], t0 = performance.now();
    if (next.nd.name === '睡莲.jpg') OS.sound.play('frog');
    const frame = now => {
      if (!alive) return;
      const el2 = now - t0;
      g.fillStyle = '#000'; g.fillRect(0, 0, SW, SH);
      if (el2 < FADE) fx(prev, next, el2 / FADE);
      else put(next);
      if (el2 >= FADE + HOLD && list.length > 1) {
        i = (i + 1) % list.length;
        prev = next; next = snap(list[i]);
        fx = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
        t0 = now;
        if (next.nd.name === '睡莲.jpg') OS.sound.play('frog');   // 青蛙“呱”一声
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ================= 设为墙纸：桌面的蓝天草坡换成这张图，云、木牌、羊都还在；重启变回来 ================= */
  let wall = null;
  function setWall(p) {
    if (!p) return;
    // 草坡和羊.bmp 就是原来那张：换回原样
    if (p.name === '草坡和羊.bmp') {
      if (wall) { wall.remove(); wall = null; }
      OS.bootFix.remove('abc-wall');
      OS.ui.notify({ title: NAME, text: L.wallBack, icon: 'info', replace: true });
      return;
    }
    let url = p.src || p.node.img;
    if (!url) {
      const c = el('canvas');
      c.width = 640; c.height = Math.round(640 * aspectOf(p));
      p.draw(c.getContext('2d'), c.width, c.height);
      url = c.toDataURL('image/png');
    }
    setWallUrl(url, p.name);
  }
  function setWallUrl(url, name) {
    const wp = document.getElementById('wallpaper');
    if (!wp) return;
    if (!wall || !wall.isConnected) { wall = el('div', { class: 'ab-wall' }); wp.insertAdjacentElement('afterend', wall); }
    wall.style.backgroundImage = 'url("' + url + '")';
    OS.bootFix.add('abc-wall', L.wallFix);
    OS.ui.notify({ title: NAME, text: L.wallDone(name), icon: 'info', replace: true });
  }
  OS.on('desktop:reset', () => { if (wall) { wall.remove(); wall = null; } });

  /* ================= 共享版：开一次弹一次，每开一次少一天 ================= */
  function nag() {
    const days = OS.save.get('abcTrial', 30);
    OS.save.set('abcTrial', days - 1);
    OS.ui.dialog({ title: NAME, icon: 'abcsee', text: L.trial(days), buttons: [L.reg, L.goOn] }).then(v => {
      if (v === L.reg) register();
      if (days < 0) OS.ui.notify({ title: NAME, text: L.negative, icon: 'info', replace: true });
    });
  }

  /* ================= 注册：选单里的码都注册不上；用注册机算出来的那个 → 注册成功 → 蓝屏 ================= */
  function register() {
    let pick = null;
    const box = el('div', { class: 'ab-code', text: L.regPick });
    box.addEventListener('click', e => {
      e.stopPropagation();
      OS.sound.play('click');
      const r = OS.stage.rectOf(box);
      const items = L.codes.map(([c]) => ({ label: c, action: () => { pick = c; box.textContent = c; } }));
      if (OS.save.get('abcKey', false)) items.push('-', { label: L.keyItem, action: () => { pick = L.KEY; box.textContent = L.KEY; } });
      OS.ui.contextMenu(items, r.left, r.bottom);
    });
    const ok = el('button', { class: 'xpbtn default', text: L.regBtn }), no = el('button', { class: 'xpbtn', text: '取消' });
    const row = (k, v) => el('div', { class: 'ab-rrow' }, [el('span', { text: k }), v]);
    const w = OS.wm.open({ title: L.regTitle, icon: 'abcsee', width: 250, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'ab-reg' }, [row('用户名：', el('div', { class: 'ab-field', text: '你' })), row('注册码：', box), el('div', { class: 'dlg-btns' }, [ok, no])]) });
    no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    ok.addEventListener('click', () => {
      OS.sound.play('click');
      if (!pick) { OS.ui.dialog({ title: L.regTitle, icon: 'warn', text: L.regEmpty }); return; }
      if (pick === L.KEY) {   // 先给你成功，再要你的命
        w.close();
        OS.ui.dialog({ title: L.regTitle, icon: 'info', text: L.regOk });
        setTimeout(() => { if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD); }, 1300);
        return;
      }
      OS.ui.dialog({ title: L.regTitle, icon: 'error', text: L.codes.find(c => c[0] === pick)[1] });
    });
  }

  /* ================= 注册机（网上邻居 ▸ 隔壁大学生 ▸ 电影 里）：黑底、彩色字滚动、8 位机音乐 ================= */
  let kgWin = null;
  function keygen() {
    if (kgWin && !kgWin.isClosed) { OS.wm.focus(kgWin); return kgWin; }
    const code = el('div', { class: 'kg-field kg-code' });
    const btn = t => el('button', { class: 'kg-btn', text: t });
    const gen = btn(L.kgGen), about = btn(L.kgAbout), exit = btn(L.kgExit);
    const content = el('div', { class: 'kg' }, [
      el('div', { class: 'kg-logo', text: L.kgTitle }),
      el('div', { class: 'kg-by', text: L.kgBy }),
      el('div', { class: 'kg-marq' }, [el('span', { text: L.kgScroll })]),
      el('div', { class: 'kg-row' }, [el('span', { text: '用户名：' }), el('div', { class: 'kg-field', text: '你' })]),
      el('div', { class: 'kg-row' }, [el('span', { text: '注册码：' }), code]),
      el('div', { class: 'kg-btns' }, [gen, about, exit])
    ]);
    const w = kgWin = OS.wm.open({ title: L.kgTitle, icon: 'keygen', width: 270, content, maximizable: false, className: 'kg-win', center: true });
    const stopMusic = chiptune();
    w.closed.then(stopMusic);
    let typing = 0;
    gen.addEventListener('click', () => {
      OS.sound.play('click');
      clearInterval(typing);
      code.textContent = '';
      let k = 0;
      typing = setInterval(() => {
        if (w.isClosed) { clearInterval(typing); return; }
        code.textContent = L.KEY.slice(0, ++k);
        OS.sound.play('key');
        if (k >= L.KEY.length) {
          clearInterval(typing);
          OS.save.set('abcKey', true);
          OS.ui.notify({ title: L.kgTitle, text: L.kgCopied, icon: 'info', replace: true });
          infect();   // 注册机里自带的病毒，这一下就进来了
        }
      }, 60);
    });
    about.addEventListener('click', () => { OS.sound.play('click'); OS.ui.dialog({ title: L.kgAbout, icon: 'info', text: L.kgAboutText }); });
    exit.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    return w;
  }
  // 8 位机音乐：Am F C G 琶音 + 一小段旋律，循环
  function chiptune() {
    const STEP = 0.13, CHORDS = [[220, 261.6, 329.6], [174.6, 220, 261.6], [130.8, 164.8, 196], [196, 246.9, 293.7]];
    const LEAD = [880, 0, 1046.5, 2, 987.8, 4, 880, 6, 698.5, 8, 880, 10, 1046.5, 12, 987.8, 14, 784, 16, 659.3, 18, 784, 20, 1046.5, 22, 987.8, 24, 784, 26, 880, 28, 987.8, 30];
    let alive = true, t = 0;
    const bar = () => {
      if (!alive) return;
      const notes = [];
      CHORDS.forEach((c, k) => {
        const base = k * 8 * STEP;
        notes.push([c[0] / 2, base, STEP * 7.6, 'triangle', 0.14]);
        [0, 1, 2, 1, 0, 1, 2, 1].forEach((n, j) => notes.push([c[n] * 2, base + j * STEP, STEP * 0.85, 'square', 0.03]));
      });
      for (let i = 0; i < LEAD.length; i += 2) notes.push([LEAD[i], LEAD[i + 1] * STEP, STEP * 1.8, 'square', 0.035]);
      OS.sound.play('chip', notes);
      t = setTimeout(bar, 32 * STEP * 1000);
    };
    bar();
    return () => { alive = false; clearTimeout(t); };
  }

  /* ================= 注册机里的病毒：在注册机里点［生成］就中毒；分三拨越来越严重；蓝屏或重启才好 =================
     第一拨（马上）：托盘多一只小绿虫 ／ 新闻条被抢
     第二拨（1 分钟后）：桌面图标一个个被虫子啃 ／ 光驱托盘自己弹出来又缩回去
     第三拨（再 1 分钟）：自己弹小广告 ／ 抠抠尾巴（koukou.js）／ 所有窗口标题后面多“ - 已破解” ／ 开始按钮变成“结束”
     第三拨以后还接着用：1 分钟后右下角“接管进度 50%”，再 1 分钟“100%”→ 第二种蓝屏 SYSTEM_TAKEN_OVER
     弹窗杀手这时候扫描：发现病毒 1 个（swatter.js） */
  const VL = {
    proc: 'keygen_helper.exe',
    trayTip: '进程：keygen_helper.exe\n正在运行。别管它，它很忙。',
    killItem: '结束进程', kill: '拒绝访问。\n它不想结束。',
    ticker: '本机已被某某破解小组接管 ★ 向所有通宵破解的兄弟致敬 ★ 请勿关机',
    suffix: ' - 已破解', start: '结束',
    fix: '正在把注册机里的病毒请出去',
    took: n => '接管进度 ' + n + '%。' + (n >= 100 ? '\n谢谢配合。' : '\n请勿关机。'),
    // 自己弹的小广告：［标题, 正文, 按钮, 点按钮以后］
    ads: [
      ['恭喜您！', '恭喜您成为本站第 10000 位幸运访客！\n您获得笔记本电脑一台。', '立即领取', '领奖失败：笔记本已被第 9999 位领走了。'],
      ['免费看大片', '最新大片 免费在线看\nwww.dapian.zz', '马上观看', '网速太慢，已缓冲 0%。'],
      ['新区开放', '一刀 999 级 ★ 今晚 8 点新区开放\n不充钱也能当老大', '进入游戏', '服务器已满，您前面还有 10086 人。'],
      ['系统提示', '检测到您的电脑已中毒！\n请立即下载：杀毒大师 2003', '立即下载', '下载失败：杀毒大师也中毒了。']
    ]
  };
  const V = { on: false, wave: 0, timers: [], tray: null, ads: new Set() };
  // 中毒拖太久：病毒把电脑整个接管了（第二种蓝屏，跟注册成功那个不是一回事）
  const BSOD_TAKEN = { id: 'abcvirus', name: 'SYSTEM_TAKEN_OVER', text: '病毒住得太舒服，把你的电脑当成自己家了。' };
  const vLater = (fn, ms) => V.timers.push(setTimeout(() => { if (V.on) fn(); }, ms));
  const vEvery = (fn, ms) => { const t = setInterval(() => { if (V.on) fn(); }, ms); V.timers.push(t); };
  function infect() {
    if (V.on) return;
    V.on = true;
    OS.bootFix.add('bsod-abcsee', VL.fix);   // 跟蓝屏那条同一个，重启时只显示一行
    wave1();
    vLater(wave2, 60000);
    vLater(wave3, 120000);
  }
  // 重启：全好了
  function cure() {
    if (!V.on) return;
    V.on = false; V.wave = 0;
    V.timers.forEach(t => { clearTimeout(t); clearInterval(t); });
    V.timers = [];
    if (V.tray) { V.tray.remove(); V.tray = null; }
    if (OS.ticker.hijack) OS.ticker.hijack(null);
    document.querySelectorAll('.dicon.bitten').forEach(n => n.classList.remove('bitten'));
    document.querySelectorAll('.vir-bug').forEach(n => n.remove());
    V.ads.forEach(w => { if (!w.isClosed) w.close(); });
    V.ads.clear();
    if (OS.wm.setSuffix) OS.wm.setSuffix('');
    if (OS.taskbar.setStartLabel) OS.taskbar.setStartLabel(null);
  }
  OS.on('desktop:reset', cure);

  // 第一拨：托盘小虫 + 新闻条
  function wave1() {
    V.wave = 1;
    const bug = V.tray = el('span', { class: 'tray-btn vir-tray', title: VL.proc }, [OS.iconEl('bug', 'tray-ico')]);
    bug.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); OS.ui.notify({ title: VL.proc, text: VL.trayTip, icon: 'warn', replace: true }); });
    OS.ui.onContext(bug, () => [{ label: VL.killItem, action: say(VL.proc, 'error', VL.kill) }]);
    if (OS.taskbar.trayAdd) OS.taskbar.trayAdd(bug);
    if (OS.ticker.hijack) OS.ticker.hijack(VL.ticker);
  }
  // 第二拨：图标被啃 + 光驱自己弹
  function wave2() {
    if (V.wave >= 2) return;
    V.wave = 2;
    const bite = () => {
      const left = [...document.querySelectorAll('.dicon:not(.binned):not(.bitten)')];
      if (!left.length) return;
      const n = OS.pick(left);
      n.classList.add('bitten');
      n.appendChild(el('span', { class: 'vir-bug', html: OS.icon('bug') }));
      OS.sound.play('munch');
    };
    bite();
    vEvery(bite, 5000);
    const tray = () => {
      if (!OS.cdTray || OS.cdTray.out()) return;
      OS.cdTray.eject();
      vLater(() => OS.cdTray.close(), 2600);
    };
    vLater(tray, 3000);
    vEvery(tray, 25000);
  }
  // 第三拨：弹广告 + 抠抠尾巴 + 标题 + 开始按钮
  function wave3() {
    if (V.wave >= 3) return;
    V.wave = 3;
    if (OS.wm.setSuffix) OS.wm.setSuffix(VL.suffix);
    if (OS.taskbar.setStartLabel) OS.taskbar.setStartLabel(VL.start);
    popAd();
    vEvery(popAd, 20000);
    // 还接着用：接管进度 50% → 100% → 蓝屏
    vLater(() => OS.ui.notify({ title: VL.proc, text: VL.took(50), icon: 'warn', replace: true }), 60000);
    vLater(() => {
      OS.ui.notify({ title: VL.proc, text: VL.took(100), icon: 'error', replace: true });
      vLater(() => { if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD_TAKEN); }, 3000);
    }, 120000);
  }
  function popAd() {
    if (OS.boot.state !== 'desktop' || V.ads.size >= 3) return;
    const [title, text, btn, after] = OS.pick(VL.ads);
    const b = el('button', { class: 'xpbtn vir-adbtn', text: btn });
    const W = OS.stage.work;
    const w = OS.wm.open({ title, icon: 'ie', width: 210, content: el('div', { class: 'vir-ad' }, [el('div', { class: 'vir-adtext' }, OS.web ? OS.web.linkify(text) : text), b]),
      maximizable: false, x: W.x + 10 + Math.random() * (W.w - 230), y: W.y + 10 + Math.random() * (W.h - 130) });
    V.ads.add(w);
    w.closed.then(() => V.ads.delete(w));
    b.addEventListener('click', () => { OS.sound.play('click'); OS.ui.dialog({ title, icon: 'error', text: after }); });
    OS.sound.play('pop');
  }
  OS.virus = { on: () => V.on, wave: () => V.wave, tail: () => V.on && V.wave >= 3, infect,
    // 测试用：不等，直接来下一拨
    next: () => { if (!V.on) return; if (V.wave === 1) wave2(); else if (V.wave === 2) wave3(); } };

  /* ================= 给别的地方用 ================= */
  OS.abcsee = {
    view: nd => openWin(nd),
    // 画一张图到别人的画布上（写字板插图、画图打开图）；这张图的宽高比；直接拿图片地址设墙纸（画图 ▸ 设为墙纸）
    drawNode: (nd, g, w, h) => picOf(nd).draw(g, w, h),
    aspect: nd => aspectOf(picOf(nd)),
    setWallUrl,
    keygen,
    help: say(L.helpTitle, 'help', L.help)
  };
})();
