/* 磁盘清理（控制面板 ▸ 性能和维护；我的电脑 ▸ 本地磁盘 (C:) ▸ 属性；开始 ▸ 所有程序 ▸ 附件 ▸ 系统工具；满 200 个文件的提示框）
   照 XP：先"正在计算"，再弹"(C:) 的磁盘清理"——列出玩家自己弄出来的所有文件（按怎么来的分组，点组名展开，
   一开始全不勾），勾哪些删哪些：永久删除、不进回收站；开着的窗口直接关掉。
   第二页"其他选项"：Windows 组件 ／ 安装的程序 →［清理…］打开 添加或删除程序 对应那一页。
   不算：游戏本来就有的文件（改过内容也不算）、软件本身、桌面上的程序图标。 */
(function () {
  'use strict';
  const el = OS.el;
  const FS = OS.fs;

  /* ================= 文案 ================= */
  const T = '磁盘清理';
  const L = {
    calc: '磁盘清理正在计算可以在 (C:) 上释放多少空间。这可能需要几分钟。',
    scanning: '正在扫描：', spots: ['我的文档', '我的图片', '桌面', '收藏夹', '回收站', '羊肚子'],
    zero: '可以释放 0 字节。羊已经吃干净了。',
    title: '(C:) 的磁盘清理', tabs: ['磁盘清理', '其他选项'],
    top: s => '使用"磁盘清理"可以释放 (C:) 上 ' + s + ' 的磁盘空间。',
    quota: n => '你自己弄出来的文件：' + n + ' 个，最多 ' + OS.fs.CAP + ' 个。',
    listCap: '要删除的文件：', total: '获取的磁盘空间总数：',
    count: n => n + ' 个',
    ok: '确定', cancel: '取消',
    ask: '确实要永久删除这些文件吗？\n删了就找不回来了。', yes: '是', no: '否',
    cleaning: '正在清理驱动器 (C:)……',
    done: (n, s) => '已永久删除 ' + n + ' 个文件，释放了 ' + s + '。',
    // 分组：按是怎么来的
    groups: [
      ['doc', '自己存的文档', 'diary'],
      ['made', '资源管理器里新建的文本文档和文件夹', 'folder'],
      ['copy', '复制出来的文件', 'doc'],
      ['pic', '画图存的画', 'paint'],
      ['slip', '欠条图片', 'abcpic'],
      ['fav', '收藏夹里加的网页', 'ie'],
      ['desk', '桌面上的文本文档', 'txt']
    ],
    inBin: '回收站', onDesk: '桌面',
    // 其他选项（XP 原版就是接到添加或删除程序）
    more: [
      ['logo', 'Windows 组件', '删掉不用的 Windows 组件，能腾出更多地方。', () => OS.addRemove && OS.addRemove(2)],
      ['cd', '安装的程序', '删掉不用的程序，能腾出更多地方。', () => OS.addRemove && OS.addRemove(0)]
    ],
    cleanBtn: '清理…'
  };

  /* ================= 扫：玩家自己弄出来的都有哪些 ================= */
  // 一个文件属于哪一组（老存档里没记"怎么来的"，就看名字猜）
  function groupOf(nd) {
    if (nd.made === 'copy' || nd.copyOf || /^复件 /.test(nd.name)) return 'copy';
    if (nd.temp || nd.made === 'new' || /^新建 文本文档/.test(nd.name)) return 'made';
    if (nd.slip) return 'slip';
    if (nd.kind === 'url') return 'fav';
    if (nd.img) return 'pic';
    return 'doc';
  }
  function kbOf(nd) {
    if (nd.folder) return 0;
    let b = 0;
    if (nd.img) b += nd.img.length * 0.75;
    if (nd.doc) b += JSON.stringify(nd.doc).length * 2;
    if (nd.text) b += nd.text.length * 2;
    if (nd.slip) b += 8192;
    if (nd.sheet) b += JSON.stringify(nd.sheet).length * 2;
    if (nd.deck) b += JSON.stringify(nd.deck).length * 2;
    return Math.max(1, Math.ceil(b / 1024));
  }
  const placeOf = path => { const p = FS.get(FS.parentOf(path)); return p ? (p.label || p.name) : ''; };
  const fmt = kb => (kb < 1024 ? kb + ' KB' : (kb / 1024).toFixed(1) + ' MB');
  const sum = list => list.reduce((s, i) => s + i.kb, 0);
  function scan() {
    const items = FS.mine().map(nd => ({ group: groupOf(nd), name: nd.name, icon: nd.icon, where: placeOf(nd.path), kb: kbOf(nd), path: nd.path, folder: !!nd.folder }));
    // 桌面上的文本文档（羊还没吃的）；扔进回收站还没清的也算
    [false, true].forEach(bin => OS.desktop.tempFiles(bin).forEach(f => items.push({ group: 'desk', name: f.name, icon: 'txt', where: bin ? L.inBin : L.onDesk, kb: 1, deskId: f.id })));
    return items;
  }

  /* ================= 计算框 ================= */
  function calcBox() {
    return new Promise(res => {
      const line = el('div', { class: 'dc-scan' });
      const fill = el('div', { class: 'ml-srf', style: { transition: 'width 2.4s linear' } });
      const cancel = el('button', { class: 'xpbtn', text: L.cancel });
      const w = OS.wm.open({ title: T, icon: 'recycle', width: 270, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
        content: el('div', { class: 'ml-sr dc-calc' }, [el('div', { class: 'ml-srl', text: L.calc }), el('div', { class: 'ml-srb' }, [fill]), line, el('div', { class: 'dlg-btns' }, [cancel])]),
        onClose: () => res(false) });
      cancel.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
      setTimeout(() => { fill.style.width = '100%'; }, 30);
      L.spots.forEach((s, i) => setTimeout(() => { line.textContent = L.scanning + s; }, i * 400));
      setTimeout(() => { if (!w.isClosed) { res(true); w.close(); } }, L.spots.length * 400 + 200);   // 先 res(true)，后面关窗那次 res(false) 不算数
    });
  }

  /* ================= 主窗口 ================= */
  let win = null, busy = false;
  async function open() {
    if (win && !win.isClosed) { OS.wm.focus(win); return win; }
    if (busy) return null;
    busy = true;
    const go = await calcBox();
    busy = false;
    if (!go) return null;
    const items = scan();
    if (!items.length) { OS.ui.dialog({ title: T, icon: 'info', text: L.zero }); return null; }
    return build(items);
  }

  function build(items) {
    const picked = new Set();
    const total = el('b', { text: fmt(0) });
    const syncTotal = () => { total.textContent = fmt(sum([...picked])); };
    const list = el('div', { class: 'dc-list' });
    L.groups.forEach(([g, label, icon]) => {
      const mine = items.filter(i => i.group === g);
      if (!mine.length) return;
      const boxes = [];
      const gb = el('input', { type: 'checkbox' });
      const sub = el('div', { class: 'dc-sub' });
      const wrap = el('div', { class: 'dc-g' });
      const syncG = () => { const n = boxes.filter(b => b.checked).length; gb.checked = n === boxes.length; gb.indeterminate = n > 0 && n < boxes.length; };
      mine.forEach(it => {
        const b = el('input', { type: 'checkbox' });
        b.addEventListener('change', () => { if (b.checked) picked.add(it); else picked.delete(it); syncG(); syncTotal(); });
        boxes.push(b);
        sub.appendChild(el('label', { class: 'dc-file' }, [b, OS.iconEl(it.folder ? 'folder' : it.icon || 'txt', 'dc-fico'), el('span', { class: 'dc-fname', text: it.name }), el('span', { class: 'dc-fwhere', text: it.where }), el('span', { class: 'dc-kb', text: fmt(it.kb) })]));
      });
      gb.addEventListener('change', () => { boxes.forEach((b, k) => { b.checked = gb.checked; if (gb.checked) picked.add(mine[k]); else picked.delete(mine[k]); }); syncG(); syncTotal(); });
      // 点组名展开 ／ 收起里面一个个文件；点勾只勾
      const row = el('div', { class: 'dc-grp' }, [el('span', { class: 'dc-arrow' }), gb, OS.iconEl(icon, 'dc-gico'), el('span', { class: 'dc-gname', text: label }), el('span', { class: 'dc-gn', text: L.count(mine.length) }), el('span', { class: 'dc-kb', text: fmt(sum(mine)) })]);
      row.addEventListener('click', e => { if (e.target === gb) return; OS.sound.play('click'); wrap.classList.toggle('open'); });
      wrap.append(row, sub);
      list.appendChild(wrap);
    });
    OS.ui.scrollable(list);

    const page1 = el('div', { class: 'dc-page' }, [
      el('div', { class: 'dc-top' }, [OS.iconEl('recycle', 'dc-ico'), el('div', {}, [el('div', { text: L.top(fmt(sum(items))) }), el('div', { class: 'dc-quota', text: L.quota(FS.userCount()) })])]),
      el('div', { class: 'dc-cap', text: L.listCap }),
      list,
      el('div', { class: 'dc-total' }, [el('span', { text: L.total }), total])
    ]);
    const page2 = el('div', { class: 'dc-page dc-more' }, L.more.map(([icon, h, t, fn]) => {
      const b = el('button', { class: 'xpbtn', text: L.cleanBtn });
      b.addEventListener('click', () => { OS.sound.play('click'); fn(); });
      return el('div', { class: 'dc-mgrp' }, [el('div', { class: 'dc-mcap', text: h }), el('div', { class: 'dc-mrow' }, [OS.iconEl(icon, 'dc-mico'), el('div', { class: 'dc-mtext', text: t }), b])]);
    }));
    const tabs = L.tabs.map((t, i) => {
      const tb = el('div', { class: 'dc-tab' + (i === 0 ? ' on' : ''), text: t });
      tb.addEventListener('click', () => { OS.sound.play('click'); tabs.forEach((x, k) => x.classList.toggle('on', k === i)); page1.style.display = i === 0 ? '' : 'none'; page2.style.display = i === 1 ? '' : 'none'; });
      return tb;
    });
    page2.style.display = 'none';
    const ok = el('button', { class: 'xpbtn default', text: L.ok });
    const no = el('button', { class: 'xpbtn', text: L.cancel });
    win = OS.wm.open({ title: L.title, icon: 'recycle', width: 372, center: true, maximizable: false, minimizable: false,
      content: el('div', { class: 'dc' }, [el('div', { class: 'dc-tabs' }, tabs), el('div', { class: 'dc-body' }, [page1, page2]), el('div', { class: 'dlg-btns' }, [ok, no])]),
      onClose: () => { win = null; } });
    const w = win;
    no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    ok.addEventListener('click', async () => {
      OS.sound.play('click');
      const list = [...picked];
      if (!list.length) { w.close(); return; }   // 一个没勾：照 XP，直接关
      if (await OS.ui.dialog({ title: L.title, icon: 'warn', text: L.ask, buttons: [L.yes, L.no] }) !== L.yes) return;
      w.close();
      await cleaning();
      wipe(list);
      OS.ui.dialog({ title: T, icon: 'info', text: L.done(list.length, fmt(sum(list))) });
    });
    return win;
  }
  function cleaning() {
    return new Promise(res => {
      const fill = el('div', { class: 'ml-srf', style: { transition: 'width 1.2s linear' } });
      const w = OS.wm.open({ title: T, icon: 'recycle', width: 250, content: el('div', { class: 'ml-sr' }, [el('div', { class: 'ml-srl', text: L.cleaning }), el('div', { class: 'ml-srb' }, [fill])]),
        modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog', noClose: true });
      setTimeout(() => { fill.style.width = '100%'; }, 30);
      setTimeout(() => { if (!w.isClosed) w.close(); res(); }, 1400);
    });
  }

  /* ================= 删：永久删除，不进回收站 ================= */
  function wipe(list) {
    const paths = list.filter(i => i.path).map(i => i.path);
    const desk = list.filter(i => i.deskId);
    const hit = p => paths.some(x => p === x || p.indexOf(x + '\\') === 0);
    // 正开着的（记事本、写字板、画图）：窗口直接关掉，不问保存
    OS.wm.wins.slice().forEach(w => {
      const p = w.filePath && w.filePath();
      if (p && (hit(p) || desk.some(d => p === 'desk:' + d.name))) OS.wm.close(w);
    });
    if (OS.fsClip && OS.fsClip.path && hit(OS.fsClip.path)) OS.fsClip = null;
    // 先删文件夹（里面的跟着没了），再删文件
    list.filter(i => i.path).sort((a, b) => b.folder - a.folder).forEach(i => { if (FS.get(i.path)) FS.remove(i.path); });
    // 桌面上的：图标直接没了；羊正走过去吃的话扑个空
    desk.forEach(d => OS.desktop.dropFile(d.deskId));
  }

  OS.cleanup = { open };
})();
