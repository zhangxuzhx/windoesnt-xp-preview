/* 阳寿余额查询
   像 2003 年的话费余额自助查询：先答几道傻问题（答什么都不影响结果）→
   拨号连“地府服务器” → 出单子：“您的阳寿还剩余 X 年”。X 其实就是 30~60 的随机数，
   只有最后一题“你是几零后”有用：70后/都不是不加，80后加 10，90后加 20，00后加 30，10后加 40。
   “逆天改命”：放 3 秒 03~06 年闪图风格的“逆天改命中”动画，重摇一次，但结果总是一般般；顶上快讯偷偷说出真相。
   蓝屏彩蛋：同一次查询里逆天改命 5 次，系统的命先用完了。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.lifespan;

  const INTRO = '欢迎使用阳寿余额自助查询。\n为了精确计算，请先回答几个问题。';
  // 傻问题题库：每次随机抽 3 道，最后一道固定问年纪。
  // 第三项：把你的回答变成一句话，小票上的“评估备注”会用它假装算进去了
  const QUESTIONS = [
    ['吃泡面，你先放粉包还是菜包？', ['粉包', '菜包'], a => '吃泡面先放' + a],
    ['小时候有没有用铅笔卷过磁带？', ['卷过', '没卷过'], a => '小时候' + a + '磁带'],
    ['你的个性签名里有没有火星文？', ['有', '没有'], a => '个性签名里' + a + '火星文'],
    ['洗澡时想到一句很厉害的话，出来就忘了。有过吗？', ['有过', '有过'], () => '洗澡时想到过很厉害的话'],
    ['突然停电，你第一反应是？', ['找蜡烛', '大呼“我没保存”', '看看邻居家亮不亮', '钻木取火', '其他'], a => '停电时第一反应是' + a],
    ['你是早上起不来，还是晚上睡不着？', ['早上起不来', '晚上睡不着', '都是'], a => a === '都是' ? '早上起不来、晚上也睡不着' : a],
    ['网吧包夜，你一般干什么？', ['吃饭', '睡觉', '打豆豆', '我是豆豆', '什么鬼？'], a => a === '我是豆豆' ? '是豆豆' : a === '什么鬼？' ? '不知道打豆豆是什么' : '网吧包夜' + a],
    ['你相信这个软件吗？', ['信', '不信'], a => (a === '信' ? '' : '不') + '相信本软件']
  ];
  // 小票底部一句 2003 年营业厅短信风的废话备注（{p} = 上面某一题的回答，假装算进去了）
  const SMS_NOTES = [
    '评估备注：鉴于您{p}，本次额外赠送阳寿 0 天。'
  ];
  const AGE_Q = '最后一题：你是几零后？';
  // [按钮上的字, 加几年]
  const AGES = [['10后', 40], ['00后', 30], ['90后', 20], ['80后', 10], ['70后', 0], ['都不是', 0]];
  const DIAL = '正在拨号连接地府服务器……';
  const QUERY = '连接成功，正在查询……';
  const HELLO = '尊敬的用户，您好！';
  const LEFT = '您的阳寿还剩余 ';
  const SIGN = '—— 地府营业厅';
  // 选了“都不是”：小票上多一句小备注（两句随机一句）
  const ALIEN_NOTES = ['（由于您不属于以上年代，已按地球标准历法估算）', '（非人类用户默认按乌龟寿命折算）'];
  const FATE_WORD = '逆天改命中';
  // 剩余年数：30~60 随机，再加“几零后”那一题的年数；
  // 逆天改命后只给 1~30（不加年代，越改越少），快讯里说“本来”摇出了 55~60（加年代）
  const YEARS = [30, 60], FATE_LO = [1, 30], FATE_HI = [55, 60];
  // 逆天改命后，顶上快讯偷偷说的（{hi} 是“本来摇出来的”，{lo} 是给你的）
  const LEAKS = [
    '本台消息：刚才那一下其实摇出了 {hi} 年，被地府发现，偷偷给你改成了 {lo}。',
    '据知情人士透露，你刚才逆天改命摇出了 {hi} 年，在半路被人截胡抢走了。',
    '本台消息：逆天改命成功率 100%。改成多少，不保证。'
  ];
  const FATE_LIMIT = 5;
  const BSOD = { id: 'lifespan', name: 'OUT_OF_LIVES', text: '你在一次查询里逆天改命了 5 次，系统的命先用完了。' };

  const roll = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  /* “逆天改命中”画面：仿 2003~06 年的 QQ 自制表情 / 闪图。
     所有动画都故意一顿一顿的（低帧率）：光芒转、彩灯边框闪、锦鲤游过去、元宝反光、烟花炸、满屏乱闪、
     中间闪粉字一个个跳。像素小素材是 Codex 画的，在 assets/fate/ 里（每张图横排几帧）。 */
  const FATE_DIR = 'assets/fate/';
  // 名字: [每帧宽, 每帧高, 帧数]
  const SPR = {
    koi: [64, 32, 6], ingot: [40, 28, 4], lotus: [56, 40, 3], cloud: [72, 32, 2],
    sparkle: [24, 24, 4], firework: [64, 64, 6], heart: [20, 18, 2], bubble: [20, 20, 1]
  };
  const SYMBOLS = ['★', '☆', '♥', '✦', '♪'];
  const PALETTE = ['#fff200', '#00f0ff', '#ff3df2', '#7dff3a', '#ffffff', '#ff7a00'];
  const GLITTER = ['rainbow', 'gold', 'rainbow', 'pink', 'rainbow'];   // 每个字用哪种闪粉

  // 先把小图片载进来，免得第一次点改命时素材还没到
  function preloadFate() {
    Object.keys(SPR).concat(['glitter-gold', 'glitter-pink', 'glitter-rainbow', 'bg-tile'])
      .forEach(n => { const im = new Image(); im.src = FATE_DIR + n + '.png'; });
  }

  // 一个原地播帧的小动画（放大 scale 倍，保留锯齿）
  function sprite(name, x, y, o) {
    o = Object.assign({ scale: 2, fps: 6, delay: 0, flip: false, anim: 'fsFrames', dur: 0 }, o);
    const [w, h, n] = SPR[name], s = o.scale;
    const d = el('div', { class: 'fs-sp' });
    Object.assign(d.style, {
      left: x + 'px', top: y + 'px', width: w * s + 'px', height: h * s + 'px',
      backgroundImage: 'url(' + FATE_DIR + name + '.png)', backgroundSize: (w * n * s) + 'px ' + (h * s) + 'px'
    });
    if (n > 1) {
      d.style.setProperty('--to', -(w * n * s) + 'px');
      d.style.animation = o.anim + ' ' + (o.dur || n / o.fps).toFixed(2) + 's steps(' + n + ') ' + o.delay + 's infinite both';
    }
    if (o.flip) d.style.transform = 'scaleX(-1)';
    return d;
  }
  // 会走的东西：外面一层负责一格一格地挪，里面的小图负责播帧
  function mover(child, x, y, anim, dur, stepsN, delay) {
    const m = el('div', { class: 'fs-move' }, [child]);
    m.style.left = x + 'px';
    m.style.top = y + 'px';
    m.style.animation = anim + ' ' + dur + 's steps(' + stepsN + ') ' + delay + 's infinite both';
    child.style.left = '0';
    child.style.top = '0';
    return m;
  }
  // 在四周随便找个位置（避开中间写字的地方），返回画面坐标
  function edgeSpot(w, h) {
    let x, y;
    do { x = 8 + Math.random() * (464 - w); y = 26 + Math.random() * (300 - h); }
    while (x + w > 70 && x < 410 && y + h > 120 && y < 240);
    return [Math.round(x), Math.round(y)];
  }

  // 三套配色（粉红 / 天蓝 / 紫金），每次随机一套，不和上一次一样
  const THEMES = ['th-pink', 'th-blue', 'th-purple'];
  let lastTheme = null;
  function pickTheme() {
    const t = OS.pick(THEMES.filter(x => x !== lastTheme));
    lastTheme = t;
    return t;
  }

  function fateScene(sec) {
    const sp = el('div', { class: 'fs-sprites' });
    const scr = el('div', { class: 'fateshow ' + pickTheme() }, [
      el('div', { class: 'fs-bg' }),
      el('div', { class: 'fs-rays' }),
      el('div', { class: 'fs-glow' }),
      sp,
      el('div', { class: 'fs-frame' })
    ]);
    const add = n => sp.appendChild(n);
    // 顶上两朵祥云，一抖一抖
    add(mover(sprite('cloud', 0, 0, { fps: 3 }), 12, 26, 'fsDrift', 1.2, 2, 0));
    add(mover(sprite('cloud', 0, 0, { fps: 3, delay: -0.3 }), 316, 50, 'fsDrift', 1.2, 2, -0.6));
    // 两条锦鲤，一条往右游、一条往左游
    add(mover(sprite('koi', 0, 0, { fps: 10 }), 0, 84, 'fsSwimR', 3.2, 16, -0.5));
    add(mover(sprite('koi', 0, 0, { fps: 10, flip: true }), 0, 226, 'fsSwimL', 3.6, 18, -1.8));
    // 烟花轮流炸
    [[24, 40, 0.1], [328, 96, 0.6], [176, 6, 1.1], [60, 150, 1.6]].forEach(([x, y, dl]) =>
      add(sprite('firework', x, y, { anim: 'fsBoom', dur: 1.3, delay: dl })));
    // 底下一排：莲花 + 元宝
    add(sprite('lotus', -14, 282, { fps: 4 }));
    add(sprite('lotus', 382, 282, { fps: 4, delay: -0.4 }));
    [[132, 302, 0], [200, 292, -0.3], [268, 302, -0.15]].forEach(([x, y, dl]) =>
      add(sprite('ingot', x, y, { fps: 7, delay: dl })));
    // 满屏的闪光、爱心、往上飘的泡泡
    for (let i = 0; i < 6; i++) { const [x, y] = edgeSpot(48, 48); add(sprite('sparkle', x, y, { fps: 8, delay: -Math.random() })); }
    for (let i = 0; i < 3; i++) { const [x, y] = edgeSpot(40, 36); add(sprite('heart', x, y, { fps: 4, delay: -Math.random() })); }
    for (let i = 0; i < 4; i++) {
      const x = Math.round(20 + Math.random() * 420), y = Math.round(220 + Math.random() * 60);
      add(mover(sprite('bubble', 0, 0), x, y, 'fsRise', 2.1, 7, -Math.random() * 2));
    }
    // 再撒几个老式符号
    for (let i = 0; i < 8; i++) {
      let x, y;
      do { x = 5 + Math.random() * 90; y = 9 + Math.random() * 84; } while (x > 12 && x < 88 && y > 30 && y < 70);
      const s = el('span', { class: 'fs-sym', text: OS.pick(SYMBOLS) });
      s.style.left = x + '%';
      s.style.top = y + '%';
      s.style.color = OS.pick(PALETTE);
      s.style.fontSize = (14 + Math.floor(Math.random() * 3) * 7) + 'px';
      s.style.animationDelay = (-Math.random()).toFixed(2) + 's';
      scr.appendChild(s);
    }
    // 中间的闪字：每个字两层（后面白边黑边，前面闪粉），一个接一个跳
    const word = el('div', { class: 'fs-word' }, FATE_WORD.split('').map((c, i) => {
      const ch = el('span', { class: 'fs-ch' }, [el('span', { class: 'fs-b', text: c }), el('span', { class: 'fs-f g-' + GLITTER[i % GLITTER.length], text: c })]);
      ch.style.animationDelay = (i * 0.1) + 's';
      return ch;
    }));
    scr.appendChild(el('div', { class: 'fs-center' }, [word]));
    scr.appendChild(el('div', { class: 'ba-pill' }, [sec, el('span', { text: ' 秒后改命' })]));
    scr.appendChild(el('div', { class: 'fs-flash' }));
    return scr;
  }

  app.open = function () {
    const stats = Object.assign({ queries: 0, changes: 0 }, OS.save.get('lifespan', {}));
    preloadFate();
    let dead = false, timers = [];
    const later = (fn, ms) => { timers.push(setTimeout(() => { if (!dead) fn(); }, ms)); };

    const body = el('div', { class: 'ls-body' });
    const content = el('div', { class: 'ls' }, [
      el('div', { class: 'ls-head' }, [
        OS.iconEl('hourglass', 'ls-logo'),
        el('div', {}, [el('div', { class: 'ls-name', text: '阳寿余额查询' }), el('div', { class: 'ls-sub', text: '自助查询系统 · 24 小时服务' })])
      ]),
      body
    ]);
    const win = OS.wm.open({
      title: app.name, icon: app.icon, width: 300, appId: app.id, content, maximizable: false,
      onClose: () => { dead = true; timers.forEach(clearTimeout); }
    });

    const btn = (text, fn, cls) => {
      const b = el('button', { class: 'xpbtn' + (cls ? ' ' + cls : ''), text });
      b.addEventListener('click', () => { OS.sound.play('click'); fn(); });
      return b;
    };
    const show = nodes => {
      body.textContent = '';
      nodes.forEach(n => n && body.appendChild(n));
      OS.wm.keepInside(win);   // 内容变高了就把窗口往上挪，别跑出屏幕
    };

    /* ---------- 1. 开场 ---------- */
    function intro() {
      show([
        el('div', { class: 'ls-text', text: INTRO }),
        el('div', { class: 'ls-btns' }, [btn('开始查询', ask, 'default')])
      ]);
    }

    /* ---------- 2. 问傻问题（答什么都一样） ---------- */
    let qs = [], answers = [], bonus = 0, alienNote = null;
    function ask() {
      qs = OS.shuffle(QUESTIONS.slice()).slice(0, 3);
      answers = [];
      question(0);
    }
    function question(i) {
      const total = qs.length + 1;
      const last = i === qs.length;
      const text = last ? AGE_Q : qs[i][0];
      const opts = last ? AGES.map(a => a[0]) : qs[i][1];
      show([
        el('div', { class: 'ls-step', text: '第 ' + (i + 1) + ' / ' + total + ' 题' }),
        el('div', { class: 'ls-q', text }),
        // 选项多就排成几列（免得窗口太高跑出屏幕）：4 个一行 2 个；5 个以上字短的一行 3 个，字长的一行 2 个
        el('div', { class: 'ls-opts' + (opts.length <= 3 ? '' : (opts.length >= 5 && opts.every(o => o.length <= 4) ? ' many' : ' many two')) }, opts.map((o, k) => btn(o, () => {
          if (last) { bonus = AGES[k][1]; alienNote = o === '都不是' ? OS.pick(ALIEN_NOTES) : null; dial(); }
          else { answers.push(qs[i][2](o)); question(i + 1); }
        })))
      ]);
    }

    /* ---------- 3. 拨号查询 ---------- */
    function dial() {
      const line = el('div', { class: 'ls-text', text: DIAL });
      const fill = el('div', { class: 'bc-fill' });
      show([line, el('div', { class: 'bc-bar ls-bar' }, [fill])]);
      OS.sound.play('dialup');
      later(() => { fill.style.width = '35%'; }, 300);
      later(() => { line.textContent = QUERY; fill.style.width = '80%'; }, 2400);
      later(() => { fill.style.width = '100%'; }, 3300);
      later(() => {
        stats.queries++;
        OS.save.set('lifespan', stats);
        result(bonus + roll(YEARS[0], YEARS[1]), 0);
      }, 3800);
    }

    /* ---------- 4. 出单子 ---------- */
    function result(years, changed) {
      const slip = el('div', { class: 'ls-slip' }, [
        el('div', { text: HELLO }),
        el('div', { class: 'ls-main' }, [el('span', { text: LEFT }), el('b', { class: 'ls-years', text: years + ' 年' })]),
        alienNote ? el('div', { class: 'ls-note', text: alienNote }) : null,
        el('div', { class: 'ls-note', text: OS.pick(SMS_NOTES).replace('{p}', OS.pick(answers.length ? answers : ['回答了问题'])) }),
        el('div', { class: 'ls-sign', text: SIGN })
      ]);
      show([
        slip,
        el('div', { class: 'ls-btns' }, [
          btn('逆天改命', () => fate(changed + 1), 'default'),
          btn('重新查询', intro)
        ])
      ]);
    }

    /* ---------- 5. 逆天改命：3 秒 03~06 年闪图风格的动画，然后结果总是一般般 ---------- */
    function fate(changed) {
      const sec = el('span', { text: '3' });
      const scr = fateScene(sec);
      document.getElementById('overlay').appendChild(scr);
      OS.sound.play('fateJingle');
      let n = 3;
      const tick = setInterval(() => {
        n--;
        if (n > 0) { sec.textContent = String(n); return; }
        clearInterval(tick);
        scr.remove();
        if (dead) return;
        stats.changes++;
        OS.save.set('lifespan', stats);
        if (changed >= FATE_LIMIT) { OS.ui.bsod(BSOD); return; }
        const hi = bonus + roll(FATE_HI[0], FATE_HI[1]), lo = roll(FATE_LO[0], FATE_LO[1]);
        OS.sound.play('ding');
        result(lo, changed);
        later(() => OS.ticker.interrupt(OS.pick(LEAKS).replace('{hi}', hi).replace('{lo}', lo)), 600);
      }, 1000);
    }

    intro();
    return win;
  };
})();
