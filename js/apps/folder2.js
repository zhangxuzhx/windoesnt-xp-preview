/* 新建文件夹(2)：套娃文件夹
   就是资源管理器里 桌面 ▸ 新建文件夹(2) 这个普通文件夹（桌面双击、从我的电脑点进来都一样，同一个窗口往里走）。
   每层只有一个文件夹，名字越来越离谱（最外面那层还放着暴富秘籍.rar 和欠条 .xls）：
   学习资料 → 真的是高数 → 别翻了没东西 → 再点我报警了 → …… → 请勿敲门 → 家
   最后一层“家”里住着个穿背心裤衩、吹着空调看电视的像素小人。你把人家屋顶掀了：
   他气急败坏冲出来，窗口被他关上，跑到桌面上把你的图标一个个踢飞，再跑回去把门反锁。
   反锁之后再双击 = 敲门，里面的人回嘴；敲到第 5 次，邻居投诉，蓝屏。重新开机后门就开了。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.folder2;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

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
  const LOCK_FIX = '开锁师傅正在给新建文件夹(2) 开门';   // 下次开机自检时修
  const KNOCKS = ['谁啊？', '不在家。', '说了不在家！', '再敲我报警了！'];
  const BSOD = { id: 'folder2', name: 'NEIGHBOR_COMPLAINT', text: '邻居投诉你一直敲门，物业已把本系统拉闸。' };
  // 最外面那层里的两个文件（双击打开，右键是它们自己的菜单）；note 是选中时左边“详细信息”里那句
  const FILES = ['rich', 'debt'];
  const FILE_NOTES = { rich: '类型：压缩文件\n大小：看起来很值钱', debt: '类型：Excuse 工作表\n最后修改者：欠你钱的那位' };
  const NOT_FOUND = say('搜索结果', 'info', '搜索完毕，共找到 0 项。\n你要找的东西，大概在你上次放它的地方。');

  /* ---------- 素材（Codex 画的 2003 年 Flash 卡通风，在 assets/home/，每张横排几帧）
     下面 SPR 的尺寸是“一半大小”，乘 Z 就是网页上显示的大小；图片本身是显示大小的 2 倍，手机上更清楚 ---------- */
  const HOME_DIR = 'assets/home/';
  const SPR = {   // 名字: [每帧宽, 每帧高, 帧数]
    'room-bg': [136, 73, 1], tv: [30, 26, 3], fan: [14, 30, 4], table: [40, 12, 1],
    man: [20, 26, 4], 'man-run': [18, 24, 2], woman: [20, 26, 3]
  };
  const Z = 2;   // 放大倍数
  function preloadHome() {
    Object.keys(SPR).forEach(n => { const im = new Image(); im.src = HOME_DIR + n + '.webp'; });
  }
  // 一个小图：x, y 是素材里的像素坐标；loop = [从第几帧, 播几帧, 每秒几帧]
  function sprite(name, x, y, loop) {
    const [w, h, n] = SPR[name];
    const d = el('div', { class: 'nf-sp' });
    Object.assign(d.style, {
      left: x * Z + 'px', top: y * Z + 'px', width: w * Z + 'px', height: h * Z + 'px',
      backgroundImage: 'url(' + HOME_DIR + name + '.webp)', backgroundSize: (w * n * Z) + 'px ' + (h * Z) + 'px'
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
  // 给网上邻居用：门反锁了没（反锁了，“家”那台电脑也连不上）；敲门、掀屋顶的次数（物业的投诉记录）
  OS.folder2 = { locked: () => locked, stats };

  function knock() {
    const s = stats(); s.knocks++; saveStats(s);
    knocks++;
    OS.sound.play('thud');
    setTimeout(() => OS.sound.play('thud'), 170);
    if (knocks >= KNOCKS.length + 1) { setTimeout(() => OS.ui.bsod(BSOD), 600); return; }
    const line = KNOCKS[knocks - 1];
    setTimeout(() => OS.desktop.iconSay('folder2', line, 2600), 450);
  }

  /* ---------- 每一层都是资源管理器（explorer.js）里的普通文件夹 ----------
     桌面上双击、从我的电脑一路点到 桌面 ▸ 新建文件夹(2)，都在同一个文件夹窗口里往里走，不另开窗口 */
  const FS = OS.fs, EX = OS.explorer;
  const pathOf = i => FS.DESKTOP + '\\' + LEVELS.slice(0, i + 1).map(l => l.name).join('\\');
  const TOP = pathOf(0);
  const LV_MSG = {
    noDelete: '删不掉：里面有人不能删。',
    noRename: '重命名失败：你不能给其他人的住所重命名。',
    noCut: '剪切失败：它不想搬家。',
    noCopy: '复制失败：里面有人呢，法律禁止克隆人。',
    noNew: '新建失败：这里已经住满了。'
  };
  const SHARE = say('共享', 'warn', '共享失败：里面住着人，分享不好吧。');
  const SHORTCUT = say('创建快捷方式', 'info', '人生没有快捷方式。');
  const SEND_TO = [
    { label: '压缩(zipped)文件夹', action: say('发送到', 'error', '压缩失败：这个文件夹里有人，不敢压。') },
    { label: '桌面快捷方式', action: SHORTCUT },
    { label: '3½ 软盘 (A:)', action: say('发送到', 'error', '软盘装不下有人的文件夹。') }
  ];
  // 文件夹的右键：资源管理器那套 + 这几层自己的几句
  const levelMenu = base => [base[0], { label: '搜索…', action: NOT_FOUND }, '-', { label: '共享和安全…', action: SHARE }, '-', { label: '发送到', sub: SEND_TO }, '-']
    .concat(base.slice(2, 4), ['-', { label: '创建快捷方式', action: SHORTCUT }], base.slice(5));
  LEVELS.forEach((L, i) => {
    FS.add(pathOf(i), Object.assign({
      kind: 'folder',
      detail: (n, selected) => (selected && L.selNote) || L.note,   // 跟 XP 一样：选中谁，左边“详细信息”就显示谁
      status: i === HOME ? () => HOME_STATUS : null,
      gate: (n, ctx, go) => enterLevel(i, ctx, go),
      menu: (n, ctx, base) => levelMenu(base),
      props: () => OS.ui.dialog({ title: '「' + L.name + '」属性', icon: 'info', text: i === HOME
        ? '类型：住宅\n门牌号：' + HOUSE_NO + '\n住户：2 人\n创建时间：2003 年 2 月 30 日'
        : '类型：文件夹\n包含：' + (i === 0 ? '1 个文件夹，2 个文件' : '1 个文件夹') + '\n创建时间：2003 年 2 月 30 日' })
    }, LV_MSG));
    EX.setTasks(pathOf(i), ctx => [
      { title: '文件夹任务', links: [['新建文件夹', say('新建文件夹', 'warn', LV_MSG.noNew)], ['共享此文件夹', SHARE]] },
      { title: '其他位置', links: [['桌面', () => ctx.go(FS.DESKTOP)], ['我的文档', () => ctx.go(FS.MYDOCS)], ['我的电脑', () => ctx.go(FS.ROOT)]] }
    ]);
  });
  // 最外面那层还放着两个文件：双击打开，右键是它们自己的菜单
  const FILE_KIND = { rich: ['rar', '压缩文件'], debt: ['xls', 'Excuse 工作表'] };
  FILES.forEach(id => {
    const a = OS.apps.byId[id];
    if (!a) return;
    FS.add(TOP + '\\' + a.name, { kind: FILE_KIND[id][0], typeName: FILE_KIND[id][1], icon: a.icon, detail: () => FILE_NOTES[id],
      open: () => OS.apps.open(id), menu: () => OS.menus.icon(a),
      noDelete: '删不掉：这是楼主的东西。', noRename: '重命名失败：这是楼主的东西。', noCut: '剪切失败：这是楼主的东西。', noCopy: '复制失败：这是楼主的东西。' });
  });

  // 往里走一层之前：门反锁了就是敲门；进“家”之前先敲几下门
  function enterLevel(i, ctx, go) {
    if (rampaging) return;
    if (locked) { knock(); return; }
    if (i === 0) { const s = stats(); s.visits++; saveStats(s); preloadHome(); }
    if (i === HOME) {
      ctx.doorKnocks = (ctx.doorKnocks || 0) + 1;
      if (ctx.doorKnocks < DOOR_KNOCKS) {   // 前几次只有“咚咚”、文件夹在抖（越敲抖得越厉害），敲够了门才开
        OS.sound.play('thud');
        setTimeout(() => OS.sound.play('thud'), 170);
        const it = ctx.win.el.querySelector('.ex-item.sel');
        if (it) { it.style.setProperty('--k', ctx.doorKnocks); it.classList.remove('knock'); void it.offsetWidth; it.classList.add('knock'); }
        return;
      }
    }
    const s = stats(); if (i > s.deepest) { s.deepest = i; saveStats(s); }
    OS.sound.play('click');
    go();
  }

  // 桌面上双击：跟从我的电脑点进来一样，开一个文件夹窗口
  app.open = function () {
    if (rampaging) return null;
    if (locked) { knock(); return null; }
    return EX.open(TOP, { appId: app.id });
  };

  /* ---------- 最后一层：家（Codex 画的 2003 年客厅，一男一女）：窗口右边不放图标，放这间屋子 ---------- */
  EX.setView(pathOf(HOME), (view, ctx) => {
    const win = ctx.win;
    let dead = false;
    win.closed.then(() => { dead = true; });
    const later = (fn, ms) => setTimeout(() => { if (!dead) fn(); }, ms);
    ctx.setBusy(true);
    const s = stats(); s.roofs++; saveStats(s);
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
  });

  /* ---------- 冲到桌面上把图标踢飞，再跑回去反锁 ---------- */
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function rampage() {
    const D = OS.desktop;
    const homeBox = D.iconBox('folder2');
    if (!homeBox) {   // 图标都藏起来了：只反锁
      locked = true;
      OS.bootFix.add('folder2-lock', LOCK_FIX);
      OS.ui.notify({ title: '新建文件夹(2)', text: LOCK_NOTE, icon: 'warn', timeout: 4000 });
      return;
    }
    rampaging = true;
    const MW = 36;
    const man = el('div', { class: 'nf-runner' });
    man.style.backgroundImage = 'url(' + HOME_DIR + 'man-run.webp)';
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
    OS.bootFix.add('folder2-lock', LOCK_FIX);
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
      { label: '属性', action: say('「新建文件夹(2)」属性', 'info', '类型：文件夹\n位置：桌面\n包含：1 个文件夹（据说很深的地方住着人），2 个文件\n创建时间：2003 年 2 月 30 日') }
    ];
  };
})();
