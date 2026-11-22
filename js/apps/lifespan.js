/* 阳寿余额查询
   像 2003 年的话费余额自助查询：先答几道傻问题（答什么都不影响结果）→
   拨号连“地府服务器” → 出单子：“您的阳寿还剩余 X 年”。X 其实就是 30~60 的随机数，
   只有最后一题“你是几零后”有用：70后/都不是不加，80后加 10，90后加 20，00后加 30，10后加 40。
   “逆天改命”：小票那块地方变成 3 秒“逆天改命中”的动画（锦鲤跃出水面、元宝莲花，Codex 第一版那套图），
   播完在同一个地方出新结果，但结果总是一般般；顶上快讯偷偷说出真相。
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
    ['周末在家，你一般干什么？', ['吃饭', '睡觉', '打豆豆', '我是豆豆', '什么鬼？'], a => a === '我是豆豆' ? '是豆豆' : a === '什么鬼？' ? '不知道打豆豆是什么' : '周末在家' + a],
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

  /* “逆天改命中”动画：就在查询窗口里播（小票那块地方），播完原地出结果。
     背景是 Codex 第一版画的那三套（粉 / 蓝 / 紫，锦鲤跃出水面、元宝、莲花），压成了小动图；
     中间是 QQ 闪图那种一跳一跳的闪粉字。 */
  const FATE_DIR = 'assets/fate/';
  const THEMES = ['fate-1', 'fate-2', 'fate-3'];   // 粉红 / 天蓝 / 紫金：每次随机一套，不和上一次一样
  const GLITTER = ['rainbow', 'gold', 'rainbow', 'pink', 'rainbow'];   // 每个字用哪种闪粉
  let lastTheme = null;
  function pickTheme() {
    const t = OS.pick(THEMES.filter(x => x !== lastTheme));
    lastTheme = t;
    return t;
  }
  // 先把动图载进来，免得第一次点改命时还没到
  function preloadFate() { THEMES.forEach(n => { const im = new Image(); im.src = FATE_DIR + n + '.webp'; }); }

  function fateBox(sec) {
    const word = el('div', { class: 'fs-word' }, FATE_WORD.split('').map((c, i) => {
      const ch = el('span', { class: 'fs-ch' }, [el('span', { class: 'fs-b', text: c }), el('span', { class: 'fs-f g-' + GLITTER[i % GLITTER.length], text: c })]);
      ch.style.animationDelay = (i * 0.1) + 's';
      return ch;
    }));
    return el('div', { class: 'fate-box' }, [
      el('img', { class: 'fate-anim', src: FATE_DIR + pickTheme() + '.webp', alt: '' }),
      el('div', { class: 'fs-center' }, [word]),
      el('div', { class: 'ba-pill' }, [sec, el('span', { text: ' 秒后改命' })]),
      el('div', { class: 'fs-flash' })
    ]);
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

    /* ---------- 5. 逆天改命：窗口里播 3 秒动画，播完原地出结果（总是一般般） ---------- */
    function fate(changed) {
      const sec = el('span', { text: '3' });
      show([fateBox(sec)]);   // 小票那块地方变成动画
      OS.sound.play('fateJingle');
      let n = 3;
      const tick = setInterval(() => {
        if (dead) { clearInterval(tick); return; }
        n--;
        if (n > 0) { sec.textContent = String(n); return; }
        clearInterval(tick);
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
