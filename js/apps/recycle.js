/* 回收站
   - 只收桌面上的东西：把图标拖到回收站上（或者右键 ▸ 删除）。「我的电脑」「新建文件夹(2)」塞不进去。
   - 双击打开是 XP 的回收站窗口：选中能看原位置、删除日期；右键能还原、删除、看属性。
   - 还原：图标从回收站飞回原来的位置（被占了就落到最近的空格）。
   - 在里面删除（永久删除）：回收站不敢删，“呸”一声把它吐回桌面。
   - 清空回收站（里面有东西时）：回收站自己跑到屏幕上方，倒过来，把东西全倒回桌面，再跑回去。
   - 塞到第 8 个：回收站越鼓越大，撑爆，东西全掉出来，然后蓝屏。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.recycle;
  const D = OS.desktop;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  const NAME = '回收站';
  const BURST_AT = 8;
  const REFUSE = {
    mycomputer: '删不掉：删了「我的电脑」，你就没有电脑了。',
    folder2: '删不掉：里面有人不能删。'
  };
  const FULL_SAY = { 6: '有点撑……', 7: '别塞了！进不去！\n怎么想都进不去吧？！' };   // 塞到第几个时回收站自己说一句
  const SPIT = '呸！不好吃！';
  const DUMP_DONE = '倒干净了。';
  const EMPTY_EMPTY = '已成功清空空回收站。';
  const ASK_EMPTY = n => '确实要删除这 ' + n + ' 项吗？';
  const ASK_DELETE = name => '确实要永久删除「' + name + '」吗？';
  const CUT_FAIL = '剪切失败：回收站里的东西只能还原，不能偷偷拿走。';
  const ITEM_PROPS = (name, at) => '原位置：桌面\n删除日期：' + at + '\n类型：废物（已回收）';
  const BIN_PROPS = n => '最大容量：无限（自称）\n当前存货：' + n + ' 件\n挑食程度：严重';
  // 顶上菜单栏里的几句
  const M_UNDO = '撤销不了：扔都扔了。';
  const M_FAV = '回收站里的东西也配收藏？';
  const M_OPTS = '文件夹选项：\n本回收站不支持“自动倒垃圾”，\n请手动。';
  const M_HELP = '垃圾分类问题，请咨询保洁阿姨。';
  const VIEWS = ['缩略图', '平铺', '图标', '列表', '详细信息'];
  const BSOD = { id: 'recycle', name: 'RECYCLE_BIN_EXPLODED', text: '回收站被撑爆了。清洁工正在打扫，请重启后再试。' };

  let busy = false;      // 正在倒东西 / 正在撑爆
  let win = null, render = null;

  const items = () => D.binList().filter(b => OS.apps.byId[b.id] && OS.apps.byId[b.id].desktop);
  const when = t => { const d = new Date(t); return '今天 ' + OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes()); };
  // 回收站图标在画面上的中心
  function binCenter() {
    const n = D.iconNode('recycle');
    return { x: parseFloat(n.style.left) + n.offsetWidth / 2, y: parseFloat(n.style.top) + 20 };
  }
  // 有东西就换成“冒纸”的图，越塞越鼓
  function refreshIcon() {
    const n = items().length;
    D.setIcon('recycle', n ? 'recycleFull' : 'recycle');
    const node = D.iconNode('recycle');
    if (node) node.style.setProperty('--swell', (1 + n * 0.045).toFixed(3));
  }
  OS.on('desktop:ready', refreshIcon);
  setTimeout(refreshIcon, 0);
  OS.on('recycle:change', () => { refreshIcon(); if (render) render(); });

  /* ---------- 往里塞 ---------- */
  let refusedAt = 0;
  OS.on('icon:drop', d => {
    if (!d.target || d.target.id !== 'recycle') return;
    const id = d.app.id;
    if (busy) return;
    if (REFUSE[id]) {
      // 一次拖好几个时只说一遍
      if (Date.now() - refusedAt > 300) OS.ui.dialog({ title: '删除', icon: 'error', text: REFUSE[id] });
      refusedAt = Date.now();
      return;
    }
    if (id === 'recycle' || !D.toBin(id)) return;
    OS.sound.play('thud');
    const n = items().length;
    if (n >= BURST_AT) { explode(); return; }
    if (FULL_SAY[n]) D.iconSay('recycle', FULL_SAY[n], 3500);
  });

  /* ---------- 打开：XP 的回收站窗口 ---------- */
  app.open = function () {
    let sel = null, lastTap = null, viewMode = '图标';
    const detName = el('div', { class: 'ex-det-name' });
    const detNote = el('div', { class: 'ex-det-note' });
    const tasks = el('div', { class: 'ex-sec-b' });
    const view = el('div', { class: 'ex-view' });
    const status = el('div', { class: 'ex-status' });
    const link = (text, fn) => { const a = el('div', { class: 'ex-link', text }); a.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return a; };
    const content = el('div', { class: 'ex' }, [
      OS.ui.menuBar(OS.ui.EX_MENUS, name => barMenu(name), 'ex-menu'),
      el('div', { class: 'ex-addr' }, [el('span', { text: '地址(D)' }), el('div', { class: 'ex-addr-box' }, [OS.iconEl('recycle', 'ex-aico'), el('span', { class: 'ex-addr-text', text: NAME })])]),
      el('div', { class: 'ex-main' }, [
        el('div', { class: 'ex-pane' }, [
          el('div', { class: 'ex-sec' }, [el('div', { class: 'ex-sec-h', text: '回收站任务' }), tasks]),
          el('div', { class: 'ex-sec' }, [el('div', { class: 'ex-sec-h', text: '详细信息' }), el('div', { class: 'ex-sec-b' }, [detName, detNote])])
        ]),
        view
      ]),
      status
    ]);
    win = OS.wm.open({
      title: NAME, icon: 'recycle', width: 384, height: 250, appId: app.id, content,
      onClose: () => { win = null; render = null; }
    });

    function showDetails(b) {
      if (!b) {
        detName.textContent = NAME;
        detNote.textContent = items().length ? '选中一项可以看它从哪儿来。' : '回收站是空的。';
        return;
      }
      detName.textContent = OS.apps.byId[b.id].name;
      detNote.textContent = '原位置：桌面\n删除日期：' + when(b.at);
    }
    function select(b, node) {
      view.querySelectorAll('.ex-item.sel').forEach(n => n.classList.remove('sel'));
      sel = b;
      if (node) node.classList.add('sel');
      showDetails(b);
      fillTasks();
    }
    function fillTasks() {
      tasks.textContent = '';
      tasks.appendChild(link('清空回收站', emptyBin));
      if (sel) tasks.appendChild(link('还原此项目', () => restore(sel.id)));
      else tasks.appendChild(link('还原所有项目', restoreAll));
    }
    render = function () {
      view.textContent = '';
      const list = items();
      if (sel && !list.some(b => b.id === sel.id)) sel = null;
      list.forEach(b => {
        const a = OS.apps.byId[b.id];
        const node = el('div', { class: 'ex-item' + (sel && sel.id === b.id ? ' sel' : '') }, [OS.iconEl(a.icon, 'ex-iico'), el('div', { class: 'ex-ilabel', text: a.name })]);
        node.addEventListener('click', e => {
          e.stopPropagation();
          select(b, node);
          const now = Date.now();
          if (lastTap === b.id && now - lastTapT < OS.dblMs()) { lastTap = null; itemProps(b)(); } else { lastTap = b.id; lastTapT = now; }
        });
        OS.ui.onContext(node, () => { select(b, node); lastTap = null; return itemMenu(b); });
        view.appendChild(node);
      });
      status.textContent = list.length + ' 个对象';
      showDetails(sel);
      fillTasks();
    };
    let lastTapT = 0;
    view.addEventListener('click', () => select(null));
    OS.ui.onContext(view, () => [
      { label: '清空回收站', action: emptyBin },
      { label: '还原所有项目', disabled: !items().length, action: restoreAll },
      '-',
      { label: '刷新', action: () => render && render() },
      '-',
      { label: '属性', action: binProps }
    ]);
    // 顶上菜单栏：选中了东西时，“文件”里先是对它的操作（跟 XP 一样）
    function barMenu(name) {
      if (busy) return null;
      if (name === '文件(F)') return (sel ? [
        { label: '还原', bold: true, action: () => restore(sel.id) },
        { label: '删除', action: () => deleteForever(sel.id) },
        '-'
      ] : []).concat([
        { label: '清空回收站', action: emptyBin },
        { label: '还原所有项目', disabled: !items().length, action: restoreAll },
        '-',
        { label: '属性', action: sel ? itemProps(sel) : binProps },
        '-',
        { label: '关闭', action: () => win && win.close() }
      ]);
      if (name === '编辑(E)') return [
        { label: '撤销', action: say('撤销', 'warn', M_UNDO) },
        '-',
        { label: '剪切', disabled: !sel, action: say('剪切', 'warn', CUT_FAIL) },
        '-',
        { label: '全部选定', disabled: !items().length, action: () => {
          select(null);
          view.querySelectorAll('.ex-item').forEach(n => n.classList.add('sel'));
          status.textContent = '选定 ' + items().length + ' 个对象';
        } }
      ];
      if (name === '查看(V)') return VIEWS.map(v => ({ label: v, checked: v === viewMode, action: () => { viewMode = v; } }))
        .concat(['-', { label: '刷新', action: () => render && render() }]);
      if (name === '收藏(A)') return [{ label: '添加到收藏夹…', action: say('添加到收藏夹', 'info', M_FAV) }];
      if (name === '工具(T)') return [{ label: '文件夹选项…', action: say('文件夹选项', 'info', M_OPTS) }];
      return [{ label: '帮助和支持中心', action: say('帮助和支持中心', 'info', M_HELP) }, '-', { label: "关于 Windoesn't", action: OS.ui.about }];
    }
    render();
    return win;
  };

  function itemMenu(b) {
    return [
      { label: '还原', bold: true, action: () => restore(b.id) },
      '-',
      { label: '剪切', action: say('剪切', 'warn', CUT_FAIL) },
      '-',
      { label: '删除', action: () => deleteForever(b.id) },
      '-',
      { label: '属性', action: itemProps(b) }
    ];
  }
  const itemProps = b => say('「' + OS.apps.byId[b.id].name + '」属性', 'info', ITEM_PROPS(OS.apps.byId[b.id].name, when(b.at)));
  const binProps = () => OS.ui.dialog({ title: NAME + ' 属性', icon: 'info', text: BIN_PROPS(items().length) });

  /* ---------- 还原 / 永久删除（= 吐出来） ---------- */
  function restore(id) {
    if (busy) return;
    OS.sound.play('pop');
    D.fromBin(id, { from: binCenter(), home: true });
  }
  function restoreAll() {
    if (busy) return;
    items().forEach((b, i) => setTimeout(() => restore(b.id), i * 140));
  }
  function deleteForever(id) {
    if (busy) return;
    const name = OS.apps.byId[id].name;
    OS.ui.dialog({ title: '确认删除文件', icon: 'help', text: ASK_DELETE(name), buttons: ['是', '否'] }).then(v => {
      if (v !== '是' || busy) return;
      const node = D.iconNode('recycle');
      node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
      setTimeout(() => node.classList.remove('shake'), 450);
      OS.sound.play('burst');
      D.fromBin(id, { from: binCenter(), spin: true });
      setTimeout(() => D.iconSay('recycle', SPIT, 3000), 300);
    });
  }

  /* ---------- 清空回收站：跑到屏幕上方，倒过来，全倒回桌面 ---------- */
  function emptyBin() {
    if (busy) return;
    const n = items().length;
    if (!n) { OS.ui.dialog({ title: '清空回收站', icon: 'info', text: EMPTY_EMPTY }); return; }
    OS.ui.dialog({ title: '确认删除多个文件', icon: 'help', text: ASK_EMPTY(n), buttons: ['是', '否'] }).then(v => {
      if (v === '是') dump();
    });
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function dump() {
    if (busy) return;
    busy = true;
    const node = D.iconNode('recycle');
    const W = OS.stage.work;
    node.classList.add('bin-run');
    node.style.left = (W.x + (W.w - node.offsetWidth) / 2) + 'px';
    node.style.top = (W.y + 4) + 'px';
    OS.sound.play('thud');
    await wait(450);
    OS.sound.play('thud');
    await wait(400);
    node.classList.add('bin-flip');
    OS.sound.play('crtOff');
    await wait(350);
    const from = binCenter();
    from.y += 16;
    const ids = items().map(b => b.id);
    for (const id of ids) {
      D.fromBin(id, { from, spin: true });
      OS.sound.play('pop');
      await wait(170);
    }
    await wait(300);
    node.classList.remove('bin-flip');
    await wait(250);
    D.placeIcon('recycle');   // 跑回自己的格子
    await wait(850);
    node.classList.remove('bin-run');
    busy = false;
    D.iconSay('recycle', DUMP_DONE, 2500);
  }

  /* ---------- 塞到第 8 个：撑爆 → 东西全掉出来 → 蓝屏 ---------- */
  function explode() {
    busy = true;
    const node = D.iconNode('recycle');
    node.classList.add('bin-swell');
    OS.sound.play('crtOn');
    setTimeout(() => {
      const c = binCenter();
      node.classList.remove('bin-swell');
      node.classList.add('bin-gone');
      OS.sound.play('burst');
      D.burstAt(c.x, c.y, 1.3, 'paper');
      items().forEach((b, i) => setTimeout(() => D.fromBin(b.id, { from: c, spin: true }), i * 70));
      setTimeout(() => OS.ui.bsod(BSOD), 1700);
    }, 1100);
  }
  // 重新开机：回收站完好如初
  OS.on('desktop:reset', () => {
    const node = D.iconNode('recycle');
    if (node) node.classList.remove('bin-gone', 'bin-swell', 'bin-run', 'bin-flip');
    D.placeIcon('recycle');
    busy = false;
    refreshIcon();
  });

  /* ---------- 桌面上回收站的右键 ---------- */
  app.menu = function () {
    return [
      { label: '打开', bold: true, action: () => OS.apps.open(app.id) },
      { label: '资源管理器', action: () => OS.apps.open(app.id) },
      { label: '清空回收站', action: emptyBin },
      '-',
      { label: '创建快捷方式', action: say('创建快捷方式', 'info', '人生没有快捷方式。') },
      { label: '重命名', action: say('重命名', 'warn', '重命名失败：它很满意现在的名字。') },
      '-',
      { label: '属性', action: binProps }
    ];
  };
})();
