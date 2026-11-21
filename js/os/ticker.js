/* 顶部新闻滚动条
   OS.ticker.push('文字')      —— 排队播
   OS.ticker.interrupt('文字') —— 立刻插播（黄色） */
(function () {
  'use strict';
  const el = OS.el;
  const T = OS.ticker = {};

  const LINES = [
    "本台消息：Windoesn't XP 发布至今，累计帮助用户完成正事 0 件。",
    '气象台预报：今天天黑之后，大概率会迎来夜晚。',
    '本台消息：据统计，没有打开本系统的人，100% 没有看到这条消息。',
    '你知道吗？桌面上的「阳寿余额查询」，其实就是按你几零后的回答加了些数字的 30 到 60 随机数生成器。',
    '专家提醒：你每盯着进度条看 60 秒，进度条就会走 1 分钟。',
    '回收站发表声明：本站拒食一切垃圾，请勿随意投喂。',
    '社会新闻：一网友连续刷新桌面 300 次，鼠标已提出抗议。',
    '科学家发现：把电脑关机后，耗电量竟直降 100%。',
    '本系统已连续安全运行 0 天，成功打破了昨天 0 天的纪录。',
    '温馨提示：你的电脑目前可能处于关机状态。',
    '暴富秘籍下载进度已达 99.9%，预计还需 48 年，请务必活到解压那天。',
    '电子蚊香今日熏晕蚊子 0 只，蚊子没有对此发表任何抗议。',
    '官方辟谣：关于“下个版本会更好玩”的谣言，经核实，确实是谣言。',
    '据说集齐激活码碎片就能激活系统。据说。',
    '新建文件夹(2) 里好像住着人，请勿随意敲门。',
    '哲学研究：把时间浪费在没用的事上，这件事就起到了浪费时间的作用。',
    '网管提醒：12 号机还有 5 分钟下机，请提前存档。',
    '号外：拨号上网期间，请勿接听家里座机。',
    '一只鸭子刚刚被「画图 AI版」认成了土豆。',
    '如果你没看清上一条快讯，不要慌，它已经滚过去了。',
    '计算器声明：1+1 到底等于几，属于个人隐私，拒绝回答。',
    '本系统内存占用：一点点。你的耐心占用：很多。',
    '据可靠消息，开始菜单里那些灰色的程序其实是彩色的，只是它们色盲。',
    '系统小贴士：由于缺乏贴士，本条贴士现由文字填充。',
    '赛博老中医今日坐诊，挂号费：一个三连。'
  ];

  // 跟真实时间挂钩的新闻
  function timeLines() {
    const d = new Date(), h = d.getHours(), wd = d.getDay();
    const hm = OS.pad2(h) + ':' + OS.pad2(d.getMinutes());
    const out = [];
    if (h < 5) out.push('现在是凌晨 ' + hm + '，如果你现在已经睡着了，说明你在梦游。', '深夜提醒：不管你熬不熬夜，太阳都会在同一时间升起。');
    else if (h < 9) out.push('早上好，如果你还没醒，请把这句话留到醒了再看。');
    else if (h >= 11 && h < 13) out.push('午饭时间到。据研究，饿肚子的人通常是因为没吃饭。');
    else if (h >= 17 && h < 19) out.push('天快黑了，太阳正在下班，你呢？');
    else if (h >= 22) out.push('夜深了。屏幕的蓝光正安静地照在你逐渐后移的发际线上。');
    if (wd === 1) out.push('今天是周一，系统检测到你不想上班（上学）的浓度严重超标。');
    if (wd === 5) out.push('今天是周五，再坚持一下，就可以理直气壮地摸鱼了。');
    if (wd === 0 || wd === 6) out.push('周末快乐。本系统周末不放假，因为周一到周五也没上班。');
    return out;
  }

  const pending = [];
  let bag = [];
  let root, track, text, x = 0, last = 0, running = false;
  const SPEED = 42; // 每秒移动多少点

  T.init = function (parent) {
    text = el('span', { class: 'tk-text' });
    track = el('div', { class: 'tk-track' }, [text]);
    root = el('div', { id: 'ticker' }, [
      el('div', { class: 'tk-label' }, [OS.iconEl('speaker', 'tk-ico'), el('span', { text: '快讯' })]),
      track
    ]);
    parent.appendChild(root);
    OS.on('stage:resize', fit);
    fit();
  };

  function fit() {
    const b = OS.stage.tickerBox;
    root.style.left = b.left + 'px';
    root.style.right = b.right + 'px';
  }

  function nextLine() {
    if (pending.length) return pending.shift();
    if (Math.random() < 0.3) {
      const tl = timeLines();
      if (tl.length) return { text: OS.pick(tl) };
    }
    if (!bag.length) bag = OS.shuffle(LINES.slice());
    return { text: bag.pop() };
  }

  function show(item) {
    text.textContent = item.text;
    text.classList.toggle('urgent', !!item.urgent);
    x = track.clientWidth + 8;
  }

  function frame(t) {
    if (!running) return;
    const dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
    last = t;
    x -= SPEED * dt;
    if (x < -text.offsetWidth - 16) show(nextLine());
    text.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
    requestAnimationFrame(frame);
  }

  T.push = function (line) { pending.push({ text: line }); };
  T.interrupt = function (line) {
    pending.unshift({ text: line, urgent: true });
    if (running) show(nextLine());
  };
  T.start = function () {
    if (running) return;
    running = true; last = 0;
    show(nextLine());
    requestAnimationFrame(frame);
  };
  T.stop = function () { running = false; };
})();
