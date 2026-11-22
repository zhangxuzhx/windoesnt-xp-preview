/* 文件夹窗口（我的电脑、我的文档、共享文档、C 盘里每一层都用它）：照 XP 的资源管理器
   - 顶上菜单栏 + 工具栏［后退］［向上］［搜索］［文件夹］+ 地址栏 + 左边（蓝色任务栏 或 能展开的目录树）+ 右边图标 + 状态栏
   - 查看：缩略图 ／ 平铺 ／ 图标 ／ 列表 ／ 详细信息；工具 ▸ 文件夹选项 能显示隐藏文件
   - 右键：打开 ／ 剪切 ／ 复制 ／ 删除 ／ 重命名 ／ 属性；空白处：查看、刷新、粘贴、新建 ▸ 文件夹 / 文本文档
   - 玩家自己的东西能删能改名能搬；我们放好的各有一句删不掉。删除不进回收站，直接扔到外太空。
   - 文件长什么样、双击干嘛，都看 fs.js 的总清单 */
(function () {
  'use strict';
  const el = OS.el;
  const FS = OS.fs;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const L = {
    del: '确实要彻底删除吗？回收站比较懒不想挪窝，文件会被直接扔到外太空里去，再也无法找回',
    noDelete: '删不掉：这是电脑自带的，删了它会不高兴。',
    noRename: '重命名失败：这个名字是厂家起的，改不了。',
    noCut: '剪切失败：这个不是你的，搬不动。',
    noCopyFolder: '复制失败：文件夹太沉了，一次只能复制一个文件。',
    noPaste: '粘贴失败：这个文件夹不归你管。',
    noNew: '新建失败：这个文件夹不归你管。',
    nameTaken: '重命名失败：这里已经有一个叫这个名字的了。',
    nameEmpty: '名字不能是空的。',
    cantOpen: 'Windoesn\'t 无法打开此文件。\n它可能不想被打开。',
    search: '搜索完毕，没找到。\n你要找的东西可能在你自己心里。',
    fav: '已添加到收藏夹。\n收藏夹里又多了一个你再也不会点开的东西。',
    help: '帮助：文件夹就是用来装文件的。\n文件就是用来被装进文件夹的。',
    hiddenOpt: '显示隐藏的文件和文件夹',
    optTitle: '文件夹选项',
    mapDrive: '映射失败：建议可以给拨号猫喂食。',
    empty: '此文件夹为空。',
    pathTooLong: n => '路径太长了，系统在第 ' + n + ' 层迷路了。',
    renameAsk: '新名字：'
  };
  const VIEWS = ['缩略图', '平铺', '图标', '列表', '详细信息'];
  const BSOD_PATH = n => ({ id: 'mydocs', name: 'PATH_TOO_LONG', text: L.pathTooLong(n) });
  const PATH_MAX = 260;

  /* ================= 别的模块往这里挂东西 ================= */
  const EX = OS.explorer = {};
  const tasks = new Map();         // 路径 → ctx => [{ title, links: [[文字, 动作]] }]
  EX.setTasks = (path, fn) => tasks.set(path, fn);
  const groupsFor = new Map();     // 路径 → () => [{ title, nodes }]（我的电脑那种分组显示）
  EX.setGroups = (path, fn) => groupsFor.set(path, fn);
  const live = new Set();          // 开着的窗口，清单一变就重画
  OS.on('fs:change', () => live.forEach(fn => fn()));
  OS.fsClip = null;

  // 显示的名字：盘符、特殊文件夹有自己的名字
  const labelOf = n => n.label || n.name;
  const showHidden = () => !!OS.save.get('fsShowHidden', false);

  /* ================= 打开一个文件夹窗口 ================= */
  EX.open = function (path, o) {
    o = o || {};
    let cur = null, hist = [], sel = null, lastTap = null, lastT = 0, viewMode = '图标', paneMode = 'tasks', busy = false;
    const expanded = new Set([FS.ROOT, '桌面']);
    const arrowBtn = (dir, label, fn) => {
      const b = el('button', { class: 'ex-btn' }, [el('span', { class: 'ex-arrow ' + dir }), label ? el('span', { text: label }) : null]);
      b.addEventListener('click', () => { if (busy) return; OS.sound.play('click'); fn(); });
      return b;
    };
    const backBtn = arrowBtn('left', '后退', () => { if (hist.length) go(hist.pop(), true); });
    const upBtn = arrowBtn('up', '', () => { const p = FS.parentOf(cur); if (p) go(p); });
    const toolBtn = (icon, label, fn) => { const b = el('button', { class: 'ex-btn' }, [OS.iconEl(icon, 'ex-bico'), el('span', { text: label })]); b.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return b; };
    const searchBtn = toolBtn('search', '搜索', say('搜索', 'info', L.search));
    const folderBtn = toolBtn('folder', '文件夹', () => { paneMode = paneMode === 'tasks' ? 'tree' : 'tasks'; folderBtn.classList.toggle('on', paneMode === 'tree'); drawPane(); });
    const addrText = el('span', { class: 'ex-addr-text' });
    const addrIco = el('span', { class: 'ex-aico-wrap' });
    const pane = el('div', { class: 'ex-pane fx-pane' });
    const viewEl = el('div', { class: 'ex-view fx-view' });
    const status = el('div', { class: 'ex-status' });
    const content = el('div', { class: 'ex' }, [
      OS.ui.menuBar(OS.ui.EX_MENUS, name => barMenu(name), 'ex-menu'),
      el('div', { class: 'ex-tools' }, [backBtn, upBtn, el('span', { class: 'ex-sep' }), searchBtn, folderBtn]),
      el('div', { class: 'ex-addr' }, [el('span', { text: '地址(D)' }), el('div', { class: 'ex-addr-box' }, [addrIco, addrText])]),
      el('div', { class: 'ex-main' }, [pane, viewEl]),
      status
    ]);
    const win = OS.wm.open({ title: '', icon: 'folder', width: 456, height: 270, appId: o.appId || null, content, center: true,
      onClose: () => live.delete(redraw) });
    const ctx = { win, go: p => go(p), get path() { return cur; }, refresh: () => render() };
    const redraw = () => { if (win.isClosed) return; if (!FS.get(cur)) { cur = FS.parentOf(cur) || FS.ROOT; } render(); };
    live.add(redraw);

    function go(p, isBack) {
      const n = FS.get(p);
      if (!n) return;
      const enter = () => { if (!isBack && cur) hist.push(cur); cur = p; render(); };
      // 有的文件夹进去前先拦一下（WINDOWS 的提示、管理员的文件夹进不去……）
      if (n.gate && !isBack) n.gate(n, ctx, enter); else enter();
    }
    function title() { const n = FS.get(cur); return n ? labelOf(n) : cur; }
    function addr() { return cur === FS.ROOT ? FS.ROOT : /^[A-Z]:$/.test(cur) ? cur + '\\' : cur; }

    /* ---------- 画右边 ---------- */
    function render() {
      const n = FS.get(cur);
      win.setTitle(title());
      addrText.textContent = addr();
      addrIco.textContent = '';
      addrIco.appendChild(OS.iconEl(n ? n.icon : 'folder', 'ex-aico'));
      const ti = win.titleEl.querySelector('.win-ticon');   // 窗口左上角的小图标跟着换
      if (ti && n) ti.innerHTML = OS.icon(n.icon);
      backBtn.disabled = !hist.length;
      upBtn.disabled = !FS.parentOf(cur);
      viewEl.textContent = '';
      viewEl.className = 'ex-view fx-view fx-' + (viewMode === '列表' ? 'list' : viewMode === '详细信息' ? 'details' : 'icons');
      sel = null; lastTap = null;
      const groups = groupsFor.has(cur) ? groupsFor.get(cur)() : [{ nodes: FS.list(cur, showHidden()) }];
      let count = 0;
      if (viewMode === '详细信息') {
        viewEl.appendChild(el('div', { class: 'fx-drow fx-dhead' }, ['名称', '大小', '类型', '修改日期'].map(t => el('span', { text: t }))));
      }
      groups.forEach(g => {
        if (g.title) viewEl.appendChild(el('div', { class: 'fx-group', text: g.title }));
        g.nodes.filter(Boolean).forEach(nd => { viewEl.appendChild(itemEl(nd)); count++; });
      });
      if (!count && !groupsFor.has(cur)) viewEl.appendChild(el('div', { class: 'fx-empty', text: L.empty }));
      status.textContent = n && n.status ? n.status(n) : count + ' 个对象';
      drawPane();
    }
    function itemEl(nd) {
      let node;
      if (viewMode === '详细信息') {
        node = el('div', { class: 'ex-item fx-drow' + (nd.hidden ? ' fx-hidden' : '') }, [
          el('span', { class: 'fx-dname' }, [OS.iconEl(nd.icon, 'fx-dico'), el('span', { text: labelOf(nd) })]),
          el('span', { text: nd.folder ? '' : (nd.size || sizeOf(nd)) }),
          el('span', { text: nd.typeName || FS.kindName(nd.kind) }),
          el('span', { text: nd.folder && !nd.date ? '' : FS.dateText(nd.date || nd.at || fixedDate) })
        ]);
      } else node = el('div', { class: 'ex-item' + (nd.hidden ? ' fx-hidden' : '') }, [OS.iconEl(nd.icon, 'ex-iico'), el('div', { class: 'ex-ilabel', text: labelOf(nd) })]);
      node.addEventListener('click', e => {
        e.stopPropagation();
        if (busy) return;
        pick(node, nd);
        const now = Date.now();
        if (lastTap === node && now - lastT < 450) { lastTap = null; openNode(nd); } else { lastTap = node; lastT = now; }
      });
      OS.ui.onContext(node, () => { if (busy) return null; pick(node, nd); lastTap = null; return itemMenu(nd); });
      return node;
    }
    function pick(node, nd) {
      viewEl.querySelectorAll('.ex-item.sel').forEach(x => x.classList.remove('sel'));
      node.classList.add('sel');
      sel = nd;
      drawDetails();
    }
    viewEl.addEventListener('click', () => { if (sel) { viewEl.querySelectorAll('.ex-item.sel').forEach(x => x.classList.remove('sel')); sel = null; drawDetails(); } });
    OS.ui.onContext(viewEl, () => (busy ? null : bgMenu()));

    /* ---------- 左边：任务栏 或 目录树 ---------- */
    let detBox = null;
    function drawPane() {
      pane.textContent = '';
      pane.classList.toggle('fx-tree', paneMode === 'tree');
      if (paneMode === 'tree') { drawTree(); return; }
      const link = (text, fn) => { const a = el('div', { class: 'ex-link', text }); a.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return a; };
      const secs = tasks.has(cur) ? tasks.get(cur)(ctx) : defaultTasks();
      secs.forEach(s => pane.appendChild(el('div', { class: 'ex-sec' }, [el('div', { class: 'ex-sec-h', text: s.title }), el('div', { class: 'ex-sec-b' }, s.links.map(([t, fn]) => link(t, fn)))])));
      detBox = el('div', { class: 'ex-sec-b' });
      pane.appendChild(el('div', { class: 'ex-sec' }, [el('div', { class: 'ex-sec-h', text: '详细信息' }), detBox]));
      drawDetails();
    }
    function defaultTasks() {
      const out = [];
      if (FS.writable(cur)) out.push({ title: '文件和文件夹任务', links: [['创建一个新文件夹', newFolder], ['共享此文件夹', say('共享此文件夹', 'info', '共享失败：系统替你拦下了。\n你的文件不适合给全楼看。')]] });
      const others = [];
      const up = FS.parentOf(cur);
      if (up) others.push([labelOf(FS.get(up)), () => go(up)]);
      [[FS.MYDOCS, '我的文档'], [FS.SHARED, '共享文档'], [FS.ROOT, '我的电脑']].forEach(([p, t]) => { if (p !== up && p !== cur) others.push([t, () => go(p)]); });
      others.push(['网上邻居', () => OS.apps.open('network')]);
      out.push({ title: '其他位置', links: others });
      return out;
    }
    function drawDetails() {
      if (!detBox) return;
      const n = sel || FS.get(cur);
      detBox.textContent = '';
      if (!n) return;
      detBox.appendChild(el('div', { class: 'ex-det-name', text: labelOf(n) }));
      detBox.appendChild(el('div', { class: 'ex-det-note', text: n.detail ? n.detail(n) : (n.typeName || FS.kindName(n.kind)) + (n.folder ? '' : '\n修改日期：' + FS.dateText(n.date || n.at || fixedDate)) }));
    }
    // 目录树：桌面 ▸ 我的文档 / 我的电脑 ▸ A: C: D: / 网上邻居 / 回收站，点 + 展开
    function drawTree() {
      const box = el('div', { class: 'fx-treebox' });
      const row = (depth, icon, label, path, kidsFn, onClick) => {
        const open = expanded.has(path);
        const kids = kidsFn ? kidsFn() : [];
        const tog = el('span', { class: 'fx-tog', text: kids.length ? (open ? '−' : '+') : '' });
        const r = el('div', { class: 'fx-trow' + (path === cur ? ' cur' : ''), style: { paddingLeft: (depth * 9) + 'px' } }, [tog, OS.iconEl(icon, 'fx-tico'), el('span', { text: label })]);
        tog.addEventListener('click', e => { e.stopPropagation(); if (!kids.length) return; if (open) expanded.delete(path); else expanded.add(path); drawPane(); });
        r.addEventListener('click', () => { OS.sound.play('click'); onClick(); });
        box.appendChild(r);
        if (open) kids.forEach(k => k());
      };
      const sub = (depth, p) => () => FS.list(p, showHidden()).filter(n => n.folder).map(n => () => row(depth, n.icon, labelOf(n), n.path, sub(depth + 1, n.path), () => go(n.path)));
      row(0, 'computer', '桌面', '桌面', () => [
        () => row(1, 'mydocs', '我的文档', FS.MYDOCS, sub(2, FS.MYDOCS), () => go(FS.MYDOCS)),
        () => row(1, 'computer', FS.ROOT, FS.ROOT, () => ['A:', 'C:', 'D:'].map(d => () => { const n = FS.get(d); row(2, n.icon, labelOf(n), d, sub(3, d), () => openNode(n)); }), () => go(FS.ROOT)),
        () => row(1, 'network', '网上邻居', '网上邻居', null, () => OS.apps.open('network')),
        () => row(1, 'recycle', '回收站', '回收站', null, () => OS.apps.open('recycle'))
      ], () => go(FS.DESKTOP));
      expanded.add('桌面');
      pane.appendChild(box);
      OS.ui.scrollable(box);
    }

    /* ---------- 打开 ---------- */
    function openNode(nd) {
      OS.sound.play('click');
      if (nd.open) return nd.open(nd, ctx);
      if (nd.copyOf) { const src = FS.get(nd.copyOf); if (src && src.open) return src.open(Object.assign({}, src, { name: nd.name, path: nd.path }), ctx); }
      if (nd.folder) return go(nd.path);
      EX.openFile(nd, ctx);
    }

    /* ---------- 右键 ---------- */
    function itemMenu(nd) {
      const base = [
        { label: '打开', bold: true, action: () => openNode(nd) },
        '-',
        { label: '剪切', action: () => cut(nd) },
        { label: '复制', action: () => copy(nd) },
        '-',
        { label: '删除', action: () => del(nd) },
        { label: '重命名', action: () => rename(nd) },
        '-',
        { label: '属性', action: () => props(nd) }
      ];
      return nd.menu ? nd.menu(nd, ctx, base) : base;
    }
    function bgMenu() {
      if (cur === FS.ROOT) return [viewItem(), '-', { label: '刷新', action: refresh }, '-', { label: '属性', action: OS.menus.systemProps }];
      return [
        viewItem(),
        { label: '排列图标', sub: [{ label: '名称', action: refresh }, { label: '大小', action: refresh }, { label: '类型', action: refresh }, { label: '修改时间', action: refresh }] },
        { label: '刷新', action: refresh },
        '-',
        { label: '粘贴', disabled: !OS.fsClip, action: paste },
        '-',
        { label: '新建', sub: [{ label: '文件夹', action: newFolder }, '-', { label: '文本文档', action: newText }] },
        '-',
        { label: '属性', action: () => props(FS.get(cur)) }
      ];
    }
    const viewItem = () => ({ label: '查看', sub: () => VIEWS.map(v => ({ label: v, checked: v === viewMode, action: () => { viewMode = v; render(); } })) });
    function barMenu(name) {
      if (busy) return null;
      if (name === '文件(F)') return [
        { label: '打开', bold: true, disabled: !sel, action: () => sel && openNode(sel) },
        '-',
        { label: '新建', sub: [{ label: '文件夹', action: newFolder }, '-', { label: '文本文档', action: newText }] },
        '-',
        { label: '删除', disabled: !sel, action: () => sel && del(sel) },
        { label: '重命名', disabled: !sel, action: () => sel && rename(sel) },
        { label: '属性', action: () => props(sel || FS.get(cur)) },
        '-',
        { label: '关闭', action: () => win.close() }
      ];
      if (name === '编辑(E)') return [
        { label: '剪切', disabled: !sel, action: () => sel && cut(sel) },
        { label: '复制', disabled: !sel, action: () => sel && copy(sel) },
        { label: '粘贴', disabled: !OS.fsClip, action: paste },
        '-',
        { label: '全部选定', action: () => { const all = viewEl.querySelectorAll('.ex-item'); all.forEach(x => x.classList.add('sel')); status.textContent = '选定 ' + all.length + ' 个对象'; } }
      ];
      if (name === '查看(V)') return VIEWS.map(v => ({ label: v, checked: v === viewMode, action: () => { viewMode = v; render(); } })).concat(['-', { label: '刷新', action: refresh }]);
      if (name === '收藏(A)') return [{ label: '添加到收藏夹…', action: say('添加到收藏夹', 'info', L.fav) }];
      if (name === '工具(T)') return [
        { label: '映射网络驱动器…', action: say('映射网络驱动器', 'warn', L.mapDrive) },
        '-',
        { label: '文件夹选项…', action: folderOptions }
      ];
      return [{ label: '帮助和支持中心', action: say('帮助和支持中心', 'info', L.help) }, '-', { label: "关于 Windoesn't", action: OS.ui.about }];
    }
    function refresh() {
      busy = true;
      viewEl.classList.add('refreshing');
      setTimeout(() => { busy = false; viewEl.classList.remove('refreshing'); if (!win.isClosed) render(); }, 250);
    }

    /* ---------- 剪切 / 复制 / 粘贴 / 删除 / 重命名 / 新建 ---------- */
    function cut(nd) {
      if (!nd.user) { OS.ui.dialog({ title: '剪切', icon: 'warn', text: nd.noCut || L.noCut }); return; }
      OS.fsClip = { mode: 'cut', path: nd.path };
    }
    function copy(nd) {
      if (nd.folder) { OS.ui.dialog({ title: '复制', icon: 'warn', text: nd.noCopy || L.noCopyFolder }); return; }
      if (nd.noCopy) { OS.ui.dialog({ title: '复制', icon: 'warn', text: nd.noCopy }); return; }
      OS.fsClip = { mode: 'copy', path: nd.path };
    }
    function paste() {
      const clip = OS.fsClip;
      if (!clip) return;
      if (!FS.writable(cur)) { OS.ui.dialog({ title: '粘贴', icon: 'warn', text: L.noPaste }); return; }
      const src = FS.get(clip.path);
      if (!src) { OS.fsClip = null; return; }
      if (clip.mode === 'cut') {
        if (cur === src.path || cur.indexOf(src.path + FS.SEP) === 0 || FS.parentOf(src.path) === cur) return;
        if (FS.move(src, cur)) OS.fsClip = null;
      } else FS.copy(src, cur);
    }
    function del(nd) {
      if (nd.del) { nd.del(nd, ctx); return; }
      if (!nd.user) { OS.ui.dialog({ title: '删除', icon: 'error', text: nd.noDelete || L.noDelete }); return; }
      OS.ui.dialog({ title: '确认删除', icon: 'warn', text: L.del, buttons: ['是', '否'] }).then(v => {
        if (v !== '是') return;
        if (OS.fsClip && OS.fsClip.path === nd.path) OS.fsClip = null;
        FS.remove(nd.path);
      });
    }
    function rename(nd) {
      if (!nd.user) { OS.ui.dialog({ title: '重命名', icon: 'warn', text: nd.noRename || L.noRename }); return; }
      askText('重命名', L.renameAsk, nd.name, v => {
        if (v == null) return;
        v = v.trim().replace(/[\\/:*?"<>|]/g, '');
        if (!v) { OS.ui.dialog({ title: '重命名', icon: 'warn', text: L.nameEmpty }); return; }
        if (v === nd.name) return;
        if (!FS.rename(nd, v)) OS.ui.dialog({ title: '重命名', icon: 'warn', text: L.nameTaken });
      });
    }
    function newFolder() {
      if (!FS.writable(cur)) { OS.ui.dialog({ title: '新建', icon: 'warn', text: L.noNew }); return; }
      const name = FS.freeName(cur, '新建文件夹');
      // XP 的老规矩：路径不能超过 260（按 GBK 算，一个汉字两个）→ 套娃套太深就蓝屏
      if (FS.pathBytes(FS.join(cur, name)) > PATH_MAX) {
        const depth = cur.slice(FS.MYDOCS.length).split(FS.SEP).filter(Boolean).length + 1;
        OS.ui.bsod(BSOD_PATH(depth));
        return;
      }
      FS.createFolder(cur, name);
    }
    function newText() {
      if (!FS.writable(cur)) { OS.ui.dialog({ title: '新建', icon: 'warn', text: L.noNew }); return; }
      FS.createFile(cur, '新建 文本文档.txt', 'txt', { text: '' });
    }
    function props(nd) {
      if (!nd) return;
      if (nd.props) { nd.props(nd, ctx); return; }
      const lines = ['类型：' + (nd.typeName || FS.kindName(nd.kind)), '位置：' + (FS.parentOf(nd.path) || '')];
      if (!nd.folder) lines.push('大小：' + (nd.size || sizeOf(nd)));
      else lines.push('包含：' + FS.list(nd.path, showHidden()).length + ' 个对象');
      lines.push('修改时间：' + FS.dateText(nd.date || nd.at || fixedDate));
      if (nd.user) lines.push('创建者：你');
      OS.ui.dialog({ title: '「' + labelOf(nd) + '」属性', icon: 'info', text: lines.join('\n') });
    }
    function folderOptions() {
      const box = el('input', { type: 'checkbox' });
      box.checked = showHidden();
      const ok = el('button', { class: 'xpbtn default', text: '确定' });
      const no = el('button', { class: 'xpbtn', text: '取消' });
      const w = OS.wm.open({ title: L.optTitle, width: 250, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
        content: el('div', { class: 'fx-opt' }, [el('div', { class: 'fx-opt-h', text: '查看' }), el('label', { class: 'fx-opt-row' }, [box, el('span', { text: L.hiddenOpt })]), el('div', { class: 'dlg-btns' }, [ok, no])]) });
      ok.addEventListener('click', () => { OS.sound.play('click'); OS.save.set('fsShowHidden', box.checked); w.close(); OS.emit('fs:change'); });
      no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    }

    go(path || FS.ROOT);
    if (!cur) { cur = FS.ROOT; render(); }
    return win;
  };

  const fixedDate = new Date(2003, 3, 1, 12, 0).getTime();   // 我们放好的文件统一的修改日期（显示时年份写 200X）
  function sizeOf(nd) {
    const t = FS.text(nd);
    if (nd.kind === 'txt' || nd.kind === 'doc') return Math.max(1, Math.ceil(t.length * 2 / 1024)) + ' KB';
    return '1 KB';
  }

  /* ================= 小输入框（重命名用；手机上会弹输入法） ================= */
  function askText(title, label, value, done) {
    const input = el('input', { class: 'xl-input', type: 'text', maxlength: '40' });
    input.value = value || '';
    const ok = el('button', { class: 'xpbtn default', text: '确定' });
    const no = el('button', { class: 'xpbtn', text: '取消' });
    let finished = false;
    const finish = v => { if (finished) return; finished = true; w.close(); done(v); };
    const w = OS.wm.open({ title, width: 230, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'xl-ask' }, [el('div', { text: label }), input, el('div', { class: 'xl-ask-btns' }, [ok, no])]),
      onClose: () => { if (!finished) { finished = true; done(null); } } });
    ok.addEventListener('click', () => { OS.sound.play('click'); finish(input.value); });
    no.addEventListener('click', () => { OS.sound.play('click'); finish(null); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(input.value); if (e.key === 'Escape') finish(null); });
    setTimeout(() => { input.focus(); const dot = input.value.lastIndexOf('.'); try { input.setSelectionRange(0, dot > 0 ? dot : input.value.length); } catch (_) { /* ignore */ } }, 50);
  }
  EX.askText = askText;

  /* ================= 按类型打开文件 ================= */
  EX.openFile = function (nd, ctx) {
    const kind = nd.kind;
    // 文字类：记事本；.doc：写字板。别人的 / 系统的只读，保存时各有一句
    if (['txt', 'ini', 'inf', 'dmp', 'url', 'dat', 'tmp'].indexOf(kind) >= 0 || kind === 'doc') {
      let text = FS.text(nd);
      // 日记的 .LOG：每打开一次，最后自动加一行现在的时间（XP 记事本真有这功能）
      if (nd.log && /^\.LOG/.test(text)) {
        const d = new Date();
        text = text.replace(/\s+$/, '') + '\n\n' + OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes()) + ' ' + OS.YEAR + '/' + (d.getMonth() + 1) + '/' + d.getDate() + '\n';
        FS.setText(nd.path, text);
      }
      if (nd.user && kind === 'txt' && OS.notepad.garble) text = OS.notepad.garble(text);   // 联通乱码
      const where = FS.writable(FS.parentOf(nd.path)) ? { type: 'fs', path: nd.path } : { type: 'ro', msg: nd.roMsg };
      OS.notepad.open({ name: nd.name, text, where, wordpad: kind === 'doc', redLast: nd.redLast });
      return;
    }
    if (kind === 'jpg' || kind === 'bmp') {
      if (nd.slip && OS.showSlip) { OS.showSlip(nd.slip, nd.name); return; }
      if (nd.draw) { EX.viewImage(nd.name, nd.draw, nd.picSize); return; }
    }
    if (kind === 'mp3' && nd.track != null && OS.qianqian) { OS.qianqian.play(nd.track); return; }
    if ((kind === 'exe' || kind === 'lnk') && nd.app) { OS.apps.open(nd.app); return; }
    OS.ui.dialog({ title: nd.name, icon: 'error', text: nd.cantOpen || L.cantOpen });
  };

  /* ================= 图片和传真查看器 ================= */
  EX.viewImage = function (name, draw, size) {
    size = size || [240, 160];
    const c = el('canvas', { class: 'fx-pic' });
    c.width = size[0]; c.height = size[1];
    try { draw(c.getContext('2d'), size[0], size[1], c); } catch (e) { console.error(e); }
    const content = el('div', { class: 'rv' }, [el('div', { class: 'rv-stage' }, [c]), el('div', { class: 'rv-bar', text: name + '　' + size[0] + ' × ' + size[1] + ' 像素' })]);
    return OS.wm.open({ title: name + ' - 图片和传真查看器', icon: 'paint', width: 300, content, maximizable: false });
  };
})();
