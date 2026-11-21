/* 新建文件夹(2)：套娃文件夹
   双击打开是 XP 的文件夹窗口，里面只有一个文件夹，名字越来越离谱：
   学习资料 → 真的是高数 → 别翻了没东西 → 再点我报警了 → …… → 请勿敲门 → 家
   最后一层“家”里住着个穿背心裤衩、吹着空调看电视的像素小人。你把人家屋顶掀了：
   他气急败坏冲出来，窗口被他关上，跑到桌面上把你的图标一个个踢飞，再跑回去把门反锁。
   反锁之后再双击 = 敲门，里面的人回嘴；敲到第 5 次，邻居投诉，蓝屏。重新开机后门就开了。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.folder2;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  const BASE = 'C:\\Documents and Settings\\你\\桌面';
  // 楼主家的门牌号 = 暴富秘籍的解压密码（rich.js 用它核对）
  const HOUSE_NO = OS.HOUSE_NO = '404';
  // 一层层往里点。note 是左边“详细信息”里那句
  const LEVELS = [
    { name: '新建文件夹(2)', note: '修改日期：2003 年 2 月 30 日' },
    { name: '学习资料', note: '修改日期：期末考试前一晚' },
    { name: '真的是高数', note: '修改日期：从来没打开过' },
    { name: '别翻了没东西', note: '修改日期：刚刚（有人在动）' },
    { name: '再点我报警了', note: '修改日期：你点进来的那一刻' },
    { name: '已报警', note: '修改日期：电话占线中' },
    { name: '警察说这事不归他管', note: '修改日期：建议找物业' },
    { name: '新建文件夹', note: '修改日期：跟外面那个一模一样' },
    { name: '新建文件夹(3)', note: '修改日期：(2) 的弟弟' },
    { name: '最后一层', note: '修改日期：骗你的' },
    { name: '真的是最后一层', note: '修改日期：这次是真的（吧）' },
    { name: '请勿敲门', note: '修改日期：里面有电视的声音' },
    { name: '家', note: '修改日期：别点了', selNote: '门牌号：' + HOUSE_NO }   // selNote：在外面一层选中它时，详细信息里显示的
  ];
  const HOME = LEVELS.length - 1;
  const HOME_STATUS = '2 个人（一个看电视，一个织毛衣）';
  const HOME_WIFE = '老公，有人在看我们！';
  // 进“家”之前要先敲门：前几次双击只有敲门声、文件夹在抖，第 DOOR_KNOCKS 次才进得去
  const DOOR_KNOCKS = 5;
  const HOME_ANGRY = '谁允许你进来了？！';
  const LOCK_LINE = '门我从里面反锁了，别再来了！';
  const LOCK_NOTE = '里面的人把门反锁了。';
  const KNOCKS = ['谁啊？', '不在家。', '说了不在家！', '再敲我报警了！'];
  const BSOD = { id: 'folder2', name: 'NEIGHBOR_COMPLAINT', text: '邻居投诉你一直敲门，物业已把本系统拉闸。' };
  const NOT_FOUND = say('搜索结果', 'info', '搜索完毕，共找到 0 项。\n你要找的东西，大概在你上次放它的地方。');

  /* ---------- 像素素材（Codex 画的，在 assets/home/，每张横排几帧，放大 2 倍显示） ---------- */
  const HOME_DIR = 'assets/home/';
  const SPR = {   // 名字: [每帧宽, 每帧高, 帧数]
    'room-bg': [136, 73, 1], tv: [30, 26, 3], fan: [14, 30, 4], table: [40, 12, 1],
    man: [20, 26, 4], 'man-run': [18, 24, 2], woman: [20, 26, 3]
  };
  const Z = 2;   // 放大倍数
  function preloadHome() {
    Object.keys(SPR).forEach(n => { const im = new Image(); im.src = HOME_DIR + n + '.png'; });
  }
  // 一个小图：x, y 是素材里的像素坐标；loop = [从第几帧, 播几帧, 每秒几帧]
  function sprite(name, x, y, loop) {
    const [w, h, n] = SPR[name];
    const d = el('div', { class: 'nf-sp' });
    Object.assign(d.style, {
      left: x * Z + 'px', top: y * Z + 'px', width: w * Z + 'px', height: h * Z + 'px',
      backgroundImage: 'url(' + HOME_DIR + name + '.png)', backgroundSize: (w * n * Z) + 'px ' + (h * Z) + 'px'
    });
    d.frame = i => { d.style.animation = 'none'; d.style.backgroundPosition = (-i * w * Z) + 'px 0'; };
    d.loop = (from, count, fps) => {
      d.style.backgroundPosition = (-from * w * Z) + 'px 0';
      d.style.setProperty('--from', (-from * w * Z) + 'px');
      d.style.setProperty('--to', (-(from + count) * w * Z) + 'px');
      d.style.animation = 'nfFrames ' + (count / fps).toFixed(2) + 's steps(' + count + ') infinite';
    };
    if (loop) d.loop(loop[0], loop[1], loop[2]);
    return d;
  }

  /* ---------- 反锁 / 敲门 ---------- */
  let locked = false, knocks = 0, rampaging = false;
  OS.on('desktop:reset', () => { locked = false; knocks = 0; });   // 重新开机，门就开了
  const stats = () => Object.assign({ visits: 0, deepest: 0, roofs: 0, knocks: 0 }, OS.save.get('folder2', {}));
  const saveStats = s => OS.save.set('folder2', s);

  function knock() {
    const s = stats(); s.knocks++; saveStats(s);
    knocks++;
    OS.sound.play('thud');
    setTimeout(() => OS.sound.play('thud'), 170);
    if (knocks >= KNOCKS.length + 1) { setTimeout(() => OS.ui.bsod(BSOD), 600); return; }
    const line = KNOCKS[knocks - 1];
    setTimeout(() => OS.desktop.iconSay('folder2', line, 2600), 450);
  }

  /* ---------- 文件夹窗口 ---------- */
  app.open = function () {
    if (rampaging) return null;
    if (locked) { knock(); return null; }
    const st = stats(); st.visits++; saveStats(st);
    preloadHome();
    let depth = 0, hist = [], sel = null, lastTap = null, busy = false, dead = false, doorKnocks = 0;
    let viewMode = '图标';
    const timers = [];
    const later = (fn, ms) => { timers.push(setTimeout(() => { if (!dead) fn(); }, ms)); };

    const arrowBtn = (dir, label, fn) => {
      const b = el('button', { class: 'ex-btn' }, [el('span', { class: 'ex-arrow ' + dir }), label ? el('span', { text: label }) : null]);
      b.addEventListener('click', () => { if (busy) return; OS.sound.play('click'); fn(); });
      return b;
    };
    const backBtn = arrowBtn('left', '后退', () => { if (hist.length) { depth = hist.pop(); render(); } });
    const upBtn = arrowBtn('up', '', () => { if (depth > 0) { hist.push(depth); depth--; render(); } });
    const searchBtn = el('button', { class: 'ex-btn' }, [OS.iconEl('search', 'ex-bico'), el('span', { text: '搜索' })]);
    searchBtn.addEventListener('click', () => { OS.sound.play('click'); NOT_FOUND(); });
    const addrText = el('span', { class: 'ex-addr-text' });
    const detName = el('div', { class: 'ex-det-name' });
    const detNote = el('div', { class: 'ex-det-note' });
    const link = (text, fn) => { const a = el('div', { class: 'ex-link', text }); a.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return a; };
    const view = el('div', { class: 'ex-view' });
    const status = el('div', { class: 'ex-status' });
    const content = el('div', { class: 'ex' }, [
      el('div', { class: 'ex-menu', text: '文件(F)　编辑(E)　查看(V)　收藏(A)　工具(T)　帮助(H)' }),
      el('div', { class: 'ex-tools' }, [backBtn, upBtn, el('span', { class: 'ex-sep' }), searchBtn]),
      el('div', { class: 'ex-addr' }, [el('span', { text: '地址(D)' }), el('div', { class: 'ex-addr-box' }, [OS.iconEl('folder', 'ex-aico'), addrText])]),
      el('div', { class: 'ex-main' }, [
        el('div', { class: 'ex-pane' }, [
          el('div', { class: 'ex-sec' }, [
            el('div', { class: 'ex-sec-h', text: '文件夹任务' }),
            el('div', { class: 'ex-sec-b' }, [
              link('新建文件夹', say('新建文件夹', 'warn', '新建失败：这里已经住满了。')),
              link('共享此文件夹', say('共享', 'warn', '共享失败：里面住着人，分享不好吧。'))
            ])
          ]),
          el('div', { class: 'ex-sec' }, [el('div', { class: 'ex-sec-h', text: '详细信息' }), el('div', { class: 'ex-sec-b' }, [detName, detNote])])
        ]),
        view
      ]),
      status
    ]);
    const win = OS.wm.open({
      title: LEVELS[0].name, icon: 'folder', width: 384, height: 264, appId: app.id, content,
      onClose: () => { dead = true; timers.forEach(clearTimeout); }
    });
    const path = () => BASE + '\\' + LEVELS.slice(0, depth + 1).map(l => l.name).join('\\');

    function render() {
      const L = LEVELS[depth];
      win.setTitle(L.name);
      addrText.textContent = path();
      showDetails(L);
      backBtn.disabled = busy || !hist.length;
      upBtn.disabled = busy || depth === 0;
      view.textContent = '';
      sel = null; lastTap = null;
      if (depth === HOME) { home(); return; }
      // 这一层里只有一个文件夹
      const child = LEVELS[depth + 1].name;
      const item = el('div', { class: 'ex-item' }, [OS.iconEl('folder', 'ex-iico'), el('div', { class: 'ex-ilabel', text: child })]);
      item.addEventListener('click', e => {
        e.stopPropagation();
        if (busy) return;
        item.classList.add('sel'); sel = item;
        showDetails(LEVELS[depth + 1], true);   // 跟 XP 一样：选中谁，左边“详细信息”就显示谁
        const now = Date.now();
        if (lastTap && now - lastTap < 450) { lastTap = null; enter(); } else lastTap = now;
      });
      OS.ui.onContext(item, () => { item.classList.add('sel'); sel = item; lastTap = null; showDetails(LEVELS[depth + 1], true); return itemMenu(child); });
      view.appendChild(item);
      status.textContent = '1 个对象';
    }
    function enter() {
      // 要进“家”：先敲门。前几次只有“咚咚”、文件夹抖（越敲抖得越厉害），敲够了门才开
      if (depth + 1 === HOME && doorKnocks < DOOR_KNOCKS - 1) {
        doorKnocks++;
        OS.sound.play('thud');
        setTimeout(() => OS.sound.play('thud'), 170);
        const it = view.querySelector('.ex-item');
        if (it) {
          it.style.setProperty('--k', doorKnocks);
          it.classList.remove('knock');
          void it.offsetWidth;
          it.classList.add('knock');
        }
        return;
      }
      OS.sound.play('click');
      hist.push(depth);
      depth++;
      const s = stats(); if (depth > s.deepest) { s.deepest = depth; saveStats(s); }
      render();
    }
    view.addEventListener('click', () => { if (sel) { sel.classList.remove('sel'); sel = null; showDetails(LEVELS[depth]); } });
    function showDetails(L, selected) {
      detName.textContent = L.name;
      detNote.textContent = (selected && L.selNote) || L.note;
    }
    OS.ui.onContext(view, () => busy ? null : viewMenu());

    // 文件夹图标的右键
    function itemMenu(child) {
      return [
        { label: '打开', bold: true, action: enter },
        { label: '资源管理器', action: enter },
        { label: '搜索…', action: NOT_FOUND },
        '-',
        { label: '共享和安全…', action: say('共享', 'warn', '共享失败：里面住着人，分享不好吧。') },
        '-',
        {
          label: '发送到', sub: [
            { label: '压缩(zipped)文件夹', action: say('发送到', 'error', '压缩失败：这个文件夹里有人，不敢压。') },
            { label: '桌面快捷方式', action: say('创建快捷方式', 'info', '人生没有快捷方式。') },
            { label: '3½ 软盘 (A:)', action: say('发送到', 'error', '软盘装不下有人的文件夹。') }
          ]
        },
        '-',
        { label: '剪切', action: say('剪切', 'warn', '剪切失败：它不想搬家。') },
        { label: '复制', action: say('复制', 'warn', '复制失败：里面有人呢，法律禁止克隆人。') },
        '-',
        { label: '创建快捷方式', action: say('创建快捷方式', 'info', '人生没有快捷方式。') },
        { label: '删除', action: say('删除', 'error', '删不掉：里面有人不能删。') },
        { label: '重命名', action: say('重命名', 'warn', '重命名失败：你不能给其他人的住所重命名。') },
        '-',
        { label: '属性', action: child === LEVELS[HOME].name
          ? say('「' + child + '」属性', 'info', '类型：住宅\n门牌号：' + HOUSE_NO + '\n住户：2 人\n创建时间：2003 年 2 月 30 日')
          : say('「' + child + '」属性', 'info', '类型：文件夹\n包含：1 个文件夹\n创建时间：2003 年 2 月 30 日') }
      ];
    }
    // 窗口空白处的右键
    function viewMenu() {
      return [
        { label: '查看', sub: () => ['缩略图', '平铺', '图标', '列表', '详细信息'].map(v => ({ label: v, checked: v === viewMode, action: () => { viewMode = v; } })) },
        { label: '排列图标', sub: () => ['名称', '大小', '类型', '修改时间'].map(v => ({ label: v, action: say('排列图标', 'info', '只有一个，怎么排都一样。') })) },
        '-',
        { label: '刷新', action: () => { view.classList.add('refreshing'); setTimeout(() => view.classList.remove('refreshing'), 120); } },
        '-',
        {
          label: '新建', sub: [
            { label: '文件夹', action: say('新建文件夹', 'warn', '新建失败：这里已经住满了。') },
            { label: '文本文档', action: say('新建文本文档', 'warn', '新建失败：你上次新建的文本文档，到现在已经写了多少字呢？') }
          ]
        },
        '-',
        { label: '属性', action: say('「' + LEVELS[depth].name + '」属性', 'info', '类型：文件夹\n位置：' + path() + '\n包含：1 个文件夹\n创建时间：2003 年 2 月 30 日') }
      ];
    }

    /* ---------- 最后一层：家（Codex 画的 2003 年客厅，一男一女） ---------- */
    function home() {
      busy = true;
      backBtn.disabled = true; upBtn.disabled = true;
      const s = stats(); s.roofs++; saveStats(s);
      status.textContent = HOME_STATUS;
      const woman = sprite('woman', 27, 29, [0, 2, 3]);   // 织毛衣
      const man = sprite('man', 56, 29, [0, 2, 2]);       // 看电视，晃脚
      const scene = el('div', { class: 'nf-scene' }, [
        sprite('room-bg', 0, 0),
        sprite('tv', 100, 16, [0, 3, 6]),
        sprite('fan', 84, 33, [0, 4, 4]),
        woman, man,
        sprite('table', 36, 52)
      ]);
      const roomEl = el('div', { class: 'nf-room' }, [scene]);
      view.appendChild(roomEl);
      const bubble = (text, x, tail) => {
        const b = el('div', { class: 'say-bubble above nf-say', text });
        b.style.left = x + 'px';
        b.style.setProperty('--tail', tail + 'px');
        scene.appendChild(b);
      };
      const mark = (text, x) => {
        const m = el('div', { class: 'nf-mark show', text });
        m.style.left = x + 'px';
        scene.appendChild(m);
      };
      const clear = sel => scene.querySelectorAll(sel).forEach(n => n.remove());
      // 女的先发现有人在看
      later(() => { mark('？', 68); OS.sound.play('pop'); }, 900);
      later(() => { clear('.nf-mark'); woman.frame(2); bubble(HOME_WIFE, 8, 66); OS.sound.play('error'); }, 1700);
      // 男的扭头瞪眼，站起来叉腰
      later(() => { man.frame(2); mark('！', 126); }, 2800);
      later(() => { clear('.nf-say, .nf-mark'); man.frame(3); bubble(HOME_ANGRY, 60, 72); roomEl.classList.add('shake'); OS.sound.play('error'); }, 3400);
      // 冲出去：往左跑出窗口
      later(() => {
        clear('.nf-say');
        const runner = sprite('man-run', 56, 31, [0, 2, 9]);
        runner.classList.add('nf-run-left');
        man.replaceWith(runner);
        requestAnimationFrame(() => requestAnimationFrame(() => { runner.style.left = '-50px'; }));
      }, 4900);
      later(() => { OS.sound.play('slap'); win.close(); rampage(); }, 5600);
    }

    render();
    return win;
  };

  /* ---------- 冲到桌面上把图标踢飞，再跑回去反锁 ---------- */
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function rampage() {
    const D = OS.desktop;
    const homeBox = D.iconBox('folder2');
    if (!homeBox) {   // 图标都藏起来了：只反锁
      locked = true;
      OS.ui.notify({ title: '新建文件夹(2)', text: LOCK_NOTE, icon: 'warn', timeout: 4000 });
      return;
    }
    rampaging = true;
    const MW = 36;
    const man = el('div', { class: 'nf-runner' });
    man.style.backgroundImage = 'url(' + HOME_DIR + 'man-run.png)';
    const put = (b, flip) => {
      man.style.left = (b.x + b.w / 2 - MW / 2) + 'px';
      man.style.top = (b.y + 4) + 'px';
      man.classList.toggle('flip', !!flip);
    };
    put(homeBox);
    D.layer().appendChild(man);
    await wait(60);
    let cur = homeBox;
    const targets = OS.shuffle(D.ids().filter(id => id !== 'folder2')).slice(0, 6);
    for (const id of targets) {
      const b = D.iconBox(id);
      if (!b) continue;
      put(b, b.x < cur.x);
      cur = b;
      await wait(380);
      OS.sound.play('thud');
      D.kick(id);
      await wait(200);
    }
    put(homeBox, homeBox.x < cur.x);
    await wait(420);
    man.remove();
    rampaging = false;
    locked = true;
    OS.sound.play('slap');
    D.iconSay('folder2', LOCK_LINE, 3200);
  }

  /* ---------- 桌面上：文件夹的右键菜单 ---------- */
  app.menu = function () {
    const P = OS.menus.iconParts(app);
    const open = () => OS.apps.open(app.id);
    return [
      P.open,
      { label: '资源管理器', action: open },
      { label: '搜索…', action: NOT_FOUND },
      '-',
      { label: '共享和安全…', action: say('共享', 'warn', '共享失败：里面住着人，分享不好吧。') },
      '-',
      {
        label: '发送到', sub: [
          { label: '压缩(zipped)文件夹', action: say('发送到', 'error', '压缩失败：这个文件夹里有人，不敢压。') },
          { label: '桌面快捷方式', action: P.shortcut.action },
          { label: '3½ 软盘 (A:)', action: say('发送到', 'error', '软盘装不下有人的文件夹。') }
        ]
      },
      '-',
      P.cut, P.copy,
      '-',
      P.shortcut,
      { label: '删除', action: say('删除', 'error', '删不掉：里面有人不能删。') },
      P.rename,
      '-',
      { label: '属性', action: say('「新建文件夹(2)」属性', 'info', '类型：文件夹\n位置：桌面\n包含：1 个文件夹（据说很深的地方住着人）\n创建时间：2003 年 2 月 30 日') }
    ];
  };
})();
