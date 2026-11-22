/* 赛博把脉（按 Gemini 的方案改过）
   赛博中医馆，老中医在线坐诊。把手指按在“脉枕”上 5 秒别动（手机长按、电脑按住鼠标），
   每秒换一句离谱的状态，右边小屏幕跳心电图、嘀嘀响；动了或者松手就重来。
   把完脉，针式打印机“滋滋滋”打诊断单。第一次一定卡纸（之后 30%），拍两下打印机才继续；
   一直不拍它就冒气泡说它脾气倔。
   诊断单：脉象 / 确诊 / 处方或医嘱随机；玩过别的软件还有隐藏诊断（炸过羊、被开机检测器证实没开机）。
   底下两个按钮：去药房抓药、我有医保。
   蓝屏彩蛋：打印机被拍太多次会冒烟，拍到第 8 下着火。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.pulse;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  const CLINIC = '赛博中医馆';
  const HEAD = '老中医在线坐诊 · 挂号费：一个三连';
  const HOLD_MS = 5000;
  // 挂号：把脉前先问年龄，用屏幕上的数字键输入（不用调输入法）
  const AGE_Q = '老中医：把脉前先问一句，\n今年多大年龄了？';
  const AGE_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '←'];
  const AGE_MAX_DIGITS = 3;
  const ST_IDLE = '请把手指按在脉枕上，5 秒别动。\n（电脑用户请按住鼠标，不要真的去戳显示器）';
  // 按住之后每秒换一句（下标 0 = 还剩 5 秒）
  const ST_STEPS = [
    '正在通过 56K 拨号猫传导脉象……',
    '没摸到脉，摸到一块像素画的红缎子。',
    '心率：0（经核实，屏幕没有心跳）。',
    '正在翻阅《赤脚医生手册》……',
    '差不多了，准备开方。'
  ];
  const ZERO_AT = 2;   // 说“心率：0”那一秒，屏幕上的心率也显示 0
  const ST_MOVED = '别乱动，刚才差点给你把出喜脉。';
  const ST_LEFT = '松开太快了，老中医还没摸清楚。';
  const ST_PRINT = '把脉完毕，正在打印诊断单……';
  const ST_JAM = '打印机卡纸了。';
  const ST_DONE = '诊断单已打印。';
  const JAM_TIP = ['打印机卡纸', '请清除卡纸后继续打印。'];
  const JAM_STUBBORN = '你不拍它，它就不动。\n这台打印机脾气比较倔。';
  // 拍好卡纸那一下有 5% 概率打印机发疯：不继续打印，一口气吐 8 张诊断单
  const SPEW_CHANCE = 0.05, SPEW_N = 8;
  const ST_SPEW = '拍狠了，打印机停不下来了！';
  const SPEW_TIP = '我晕！打印机疯了';   // 发疯时右下角气泡，免得玩家以为是 bug
  const ST_SPEW_DONE = '打印机总算停了。8 张诊断单，一张一个三连。';
  const SMOKE_AT = 5, FIRE_AT = 8;
  const BSOD = { id: 'pulse', name: 'PRINTER_ON_FIRE', text: '打印机着火了。建议用刚打印的诊断单灭火。' };

  // 诊断单内容：每条都是“标签：内容”，每次随机
  const PULSES = [
    '脉象：无脉。原因：这里面只有像素，没有血管。',
    '脉象：脉象平稳，说明你目前大概率还活着。',
    '脉象：滑脉，且带着一股隔夜方便面的味儿。',
    '脉象：摸不出来，刚才家里有人接座机，把你的脉象挤掉线了。',
    '脉象：喜脉。（恭喜。如果你是男的，那更恭喜了。）'
  ];
  const ILLS = [
    '确诊：活人。',
    '确诊：重度无聊（否则你不会对着脉枕按五秒）。',
    '确诊：玉玉症（这个病要 2020 年以后才流行，你得早了）。',
    '确诊：千禧年综合症，建议少上网多喝热水。',
    '确诊：穷。'
  ];
  const ADVICES = [
    '处方：急支糖浆半口、脑白金两盒、板蓝根（干吃）。',
    '医嘱：多喝水。如果喝完还渴，说明喝少了。',
    '医嘱：建议每天游玩本系统 10 分钟以上。',
    '医嘱：老中医也不知道怎么治，要不你重启试试？',
    '医嘱：建议去「阳寿余额查询」看看还剩多少阳寿。',
    '医嘱：建议把「2027暴富秘籍.rar」解压完，穷病自愈。'
  ];
  // 跨软件隐藏诊断：满足条件时一半概率出现，直接换掉脉象和诊断
  const HIDDEN = [
    { when: () => OS.save.get('sheepPops', 0) > 0, pulse: '脉象：暴戾，指尖带煞。', ill: '诊断：大夫问你：刚才是不是把什么毛茸茸的东西点炸了？' },
    { when: () => (OS.save.get('bootcheck', {}).proved || 0) > 0, pulse: '脉象：全无。', ill: '诊断：大夫表示：电脑都没开机，我是怎么给你把的脉？' }
  ];
  const HIDDEN_CHANCE = 0.5;
  const DRUG = '抓药失败：\n药房看了半天大夫的草书签名，\n一个字没认出来，\n自作主张给你抓了两包板蓝根。';
  const INSURANCE = '本诊所是从电线杆小广告上找来的，\n不走医保。';

  const stats = () => Object.assign({ visits: 0, done: 0, slaps: 0 }, OS.save.get('pulse', {}));
  const saveStats = s => OS.save.set('pulse', s);

  app.open = function () {
    const st = stats(); st.visits++; saveStats(st);
    let dead = false, holding = null, raf = 0, phase = 'idle', slaps = 0, jamSlaps = 0, jamTimer = 0;
    const timers = [];
    const later = (fn, ms) => { const t = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(t); return t; };

    // 脉枕
    const pad = el('div', { class: 'pz-pad' }, [el('div', { class: 'pz-print' }), el('div', { class: 'pz-padtxt', text: '脉枕' })]);
    // 心电图小屏幕
    const cv = el('canvas', { class: 'pz-ecg', width: '160', height: '72' });
    const bpm = el('div', { class: 'pz-bpm', text: '心率 --' });
    const screen = el('div', { class: 'pz-screen' }, [cv, bpm]);
    const status = el('div', { class: 'pz-status', text: ST_IDLE });
    // 针式打印机
    const paper = el('div', { class: 'pz-paper' });
    const smoke = el('div', { class: 'pz-smoke' });
    const printer = el('div', { class: 'pz-printer' }, [paper, el('div', { class: 'pz-pbody' }), smoke]);   // 打印机是 assets/pulse 里 Codex 画的图
    // 同一个窗口分两步：第一步挂号（问年龄），确定后换成第二步把脉
    const askStep = el('div', { class: 'pz-step ag' });
    const pulseStep = el('div', { class: 'pz-step hide' }, [el('div', { class: 'pz-main' }, [pad, screen]), status, printer]);
    const content = el('div', { class: 'pz' }, [
      el('div', { class: 'pz-head' }, [OS.iconEl('pulse', 'pz-logo'), el('div', {}, [el('div', { class: 'pz-name', text: CLINIC }), el('div', { class: 'pz-sub', text: HEAD })])]),
      askStep,
      pulseStep
    ]);
    let onKey = null;
    const win = OS.wm.open({
      title: app.name + ' - ' + CLINIC, icon: app.icon, width: 330, appId: app.id, content, maximizable: false,
      onClose: () => { dead = true; timers.forEach(clearTimeout); cancelAnimationFrame(raf); if (onKey) document.removeEventListener('keydown', onKey); }
    });

    /* ---------- 第一步 挂号：先问年龄（计算器那样的数字键） ---------- */
    let age = null;
    (function ask() {
      let val = '';
      const lcd = el('div', { class: 'ag-lcd' });
      const show = () => { lcd.textContent = (val || '__') + ' 岁'; lcd.classList.toggle('empty', !val); };
      const press = k => {
        OS.sound.play('click');
        lcd.classList.remove('bad');
        if (k === 'C') val = '';
        else if (k === '←') val = val.slice(0, -1);
        else if (val.length < AGE_MAX_DIGITS) val = val === '0' ? k : val + k;
        show();
      };
      const keys = el('div', { class: 'ag-keys' }, AGE_KEYS.map(k => {
        const b = el('button', { class: 'xpbtn ag-key' + (/\d/.test(k) ? '' : ' fn'), text: k });
        b.addEventListener('click', () => press(k));
        return b;
      }));
      const ok = el('button', { class: 'xpbtn default', text: '确定' });
      const confirm = () => {
        if (!val) { OS.sound.play('error'); lcd.classList.remove('bad'); void lcd.offsetWidth; lcd.classList.add('bad'); return; }
        age = +val;
        OS.sound.play('ding');
        // 进第二步：把脉
        document.removeEventListener('keydown', onKey);
        onKey = null;
        askStep.classList.add('hide');
        pulseStep.classList.remove('hide');
        OS.wm.keepInside(win);
      };
      ok.addEventListener('click', confirm);
      // 电脑上直接按键盘数字也行
      onKey = e => {
        if (OS.wm.active !== win) return;
        if (/^\d$/.test(e.key)) press(e.key);
        else if (e.key === 'Backspace') press('←');
        else if (e.key === 'Delete') press('C');
        else if (e.key === 'Enter') confirm();
        else return;
        e.preventDefault();
      };
      document.addEventListener('keydown', onKey);
      show();
      [el('div', { class: 'ag-q', text: AGE_Q }), lcd, keys, el('div', { class: 'ag-btns' }, [ok])].forEach(n => askStep.appendChild(n));
      OS.wm.keepInside(win);   // 内容填进去变高了，窗口别钻到任务栏下面
    })();

    /* ---------- 心电图 ---------- */
    const ctx = cv.getContext('2d');
    function idleScreen() {
      ctx.fillStyle = '#031a08'; ctx.fillRect(0, 0, 160, 72);
      ctx.fillStyle = '#1f7a2e'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('请按住脉枕', 80, 40);
      bpm.textContent = '心率 --';
    }
    idleScreen();
    let ecgX = 0, lastY = 36, rate = 80, nextBeat = 0, beat = [], flat = false;   // flat：说“心率 0”那一秒，心电图拉直线、不嘀
    const BEAT = [33, 38, 8, 64, 40, 34, 36];   // 一次心跳的形状：小起伏 → 往上一戳 → 往下一戳 → 回平
    function ecgFrame() {
      if (dead || !holding) return;
      // 一格一格往右画，画到头从左边重来（老监护仪那样）
      for (let i = 0; i < 2; i++) {
        const now = performance.now();
        if (!beat.length && now >= nextBeat && !flat) {
          nextBeat = now + 60000 / rate;
          beat = BEAT.slice();
          OS.sound.play('beep');
        }
        const y = beat.length ? beat.shift() : flat ? 36 : 36 + Math.round(Math.sin(ecgX / 6));
        const x0 = ecgX;
        ecgX = (ecgX + 1) % 160;
        ctx.fillStyle = '#031a08'; ctx.fillRect(ecgX, 0, 6, 72);
        if (ecgX > 0) {
          ctx.strokeStyle = '#3cff5a'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x0, lastY); ctx.lineTo(ecgX, y); ctx.stroke();
        }
        lastY = y;
      }
      raf = requestAnimationFrame(ecgFrame);
    }

    /* ---------- 按住脉枕 5 秒 ---------- */
    pad.addEventListener('pointerdown', e => {
      if (phase !== 'idle' || (e.button != null && e.button !== 0)) return;
      e.preventDefault();
      try { pad.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      const p0 = OS.stage.toLocal(e.clientX, e.clientY);
      holding = { id: e.pointerId, x: p0.x, y: p0.y, t0: Date.now(), timer: 0 };
      rate = 60 + Math.floor(Math.random() * 60);
      ctx.fillStyle = '#031a08'; ctx.fillRect(0, 0, 160, 72);
      ecgX = 0; lastY = 36; flat = false; beat = []; nextBeat = performance.now() + 400;
      bpm.textContent = '心率 ' + rate;
      pad.classList.add('on');
      status.textContent = ST_STEPS[0];
      const tick = () => {
        if (!holding) return;
        const left = Math.ceil((HOLD_MS - (Date.now() - holding.t0)) / 1000);
        if (left <= 0) { done(); return; }
        const i = 5 - left;
        status.textContent = ST_STEPS[i];
        flat = i === ZERO_AT;
        bpm.textContent = '心率 ' + (flat ? 0 : rate);
        holding.timer = setTimeout(tick, 200);
      };
      holding.timer = setTimeout(tick, 200);
      raf = requestAnimationFrame(ecgFrame);
    });
    pad.addEventListener('pointermove', e => {
      if (!holding || e.pointerId !== holding.id) return;
      const p = OS.stage.toLocal(e.clientX, e.clientY);
      if (Math.hypot(p.x - holding.x, p.y - holding.y) > 12) stop(ST_MOVED, 'error');
    });
    const up = e => { if (holding && e.pointerId === holding.id) stop(ST_LEFT, 'click'); };
    pad.addEventListener('pointerup', up);
    pad.addEventListener('pointercancel', up);
    function stop(text, sound) {
      clearTimeout(holding.timer);
      holding = null;
      cancelAnimationFrame(raf);
      pad.classList.remove('on');
      status.textContent = text;
      OS.sound.play(sound);
      idleScreen();
    }
    function done() {
      clearTimeout(holding.timer);
      holding = null;
      cancelAnimationFrame(raf);
      pad.classList.remove('on');
      OS.sound.play('ding');
      startPrint();
    }

    /* ---------- 针式打印机：滋滋滋 ---------- */
    let printed = 0, printTick = 0, jamAt = -1;
    function startPrint() {
      phase = 'print';
      status.textContent = ST_PRINT;
      printed = 0;
      paper.textContent = '';
      paper.style.height = '0px';
      const s = stats();
      jamAt = s.done === 0 || Math.random() < 0.3 ? 4 : -1;   // 第一次一定卡纸，之后 30% 卡
      printer.classList.add('printing');
      printTick = setInterval(printStep, 260);
      timers.push(printTick);
    }
    function printStep() {
      if (dead) return;
      printed++;
      OS.sound.play('printer');
      paper.style.height = Math.min(44, printed * 5) + 'px';
      if (printed === jamAt) { jam(); return; }
      if (printed >= 9) {
        clearInterval(printTick);
        printer.classList.remove('printing');
        phase = 'idle';
        status.textContent = ST_DONE;
        const s = stats(); s.done++; saveStats(s);
        later(() => { slip(age); paper.style.height = '0px'; paper.textContent = ''; status.textContent = ST_IDLE; idleScreen(); }, 500);
      }
    }
    function jam() {
      clearInterval(printTick);
      phase = 'jam';
      jamSlaps = 0;
      printer.classList.remove('printing');
      printer.classList.add('jam');
      status.textContent = ST_JAM;
      OS.sound.play('error');
      OS.ui.notify({ title: JAM_TIP[0], text: JAM_TIP[1], icon: 'warn', replace: true, timeout: 4000 });
      // 一直没人拍：冒个气泡说它脾气倔（还是卡着，非拍不可）
      jamTimer = later(() => { if (phase === 'jam') stubborn(); }, 8000);
    }
    let bubble = null;
    function stubborn() {
      if (bubble) bubble.remove();
      bubble = el('div', { class: 'say-bubble above pz-say', text: JAM_STUBBORN });
      bubble.style.setProperty('--tail', '90px');
      printer.appendChild(bubble);
      OS.sound.play('pop');
    }
    function unjam() {
      clearTimeout(jamTimer);
      if (bubble) { bubble.remove(); bubble = null; }
      printer.classList.remove('jam');
    }
    function resume() {
      unjam();
      phase = 'print';
      clearInterval(printTick);   // 只留一个打印节拍，免得几个叠在一起停不下来
      printer.classList.add('printing');
      printTick = setInterval(printStep, 260);
      timers.push(printTick);
    }
    // 打印机发疯：一张接一张往外吐诊断单，满屏都是
    function spew() {
      unjam();
      phase = 'spew';
      status.textContent = ST_SPEW;
      printer.classList.add('spew');
      paper.style.height = '0px';
      OS.ui.notify({ title: SPEW_TIP, icon: 'warn', replace: true, timeout: 4500 });
      let n = 0;
      const one = () => {
        OS.sound.play('printer');
        flySheet();
        slip(age, true);
        if (++n < SPEW_N) { later(one, 380); return; }
        later(() => {
          printer.classList.remove('spew');
          paper.style.height = '0px'; paper.textContent = '';
          phase = 'idle';
          status.textContent = ST_SPEW_DONE;
          const s = stats(); s.done++; saveStats(s);
          idleScreen();
        }, 600);
      };
      later(one, 200);
    }
    // 发疯时从出纸口飞出去一张纸，边飞边翻
    function flySheet() {
      const f = el('div', { class: 'pz-fly' });
      f.style.setProperty('--dx', Math.round(Math.random() * 140 - 70) + 'px');
      f.style.setProperty('--rot', Math.round(Math.random() * 360 - 180) + 'deg');
      printer.appendChild(f);
      setTimeout(() => f.remove(), 950);
    }
    // 拍打印机：卡纸时拍两下就好；拍多了冒烟，拍到第 8 下着火（蓝屏）
    printer.addEventListener('click', () => {
      slaps++;
      const s = stats(); s.slaps++; saveStats(s);
      OS.sound.play('slap');
      printer.classList.remove('hit');
      void printer.offsetWidth;
      printer.classList.add('hit');
      if (slaps >= SMOKE_AT) printer.classList.add('smoking');
      if (slaps >= FIRE_AT) { later(() => OS.ui.bsod(BSOD), 500); return; }
      // 拍够两下就不算卡纸了（再多拍也只继续一次）
      if (phase === 'jam' && ++jamSlaps >= 2) {
        phase = 'unjam';
        const crazy = Math.random() < SPEW_CHANCE;
        later(() => { if (crazy) spew(); else { status.textContent = ST_PRINT; resume(); } }, 300);
      }
    });

    return win;
  };

  /* ---------- 诊断单 ---------- */
  let slipNo = 0;
  // 印章：3 种盖法（清楚 / 一边淡 / 印泥快没了）随机挑一个，再随机歪一点
  function stamp() {
    const s = el('span', { class: 'dx-stamp', title: CLINIC });
    s.style.backgroundPosition = (-64 * Math.floor(Math.random() * 3)) + 'px 0';
    s.style.transform = 'rotate(' + Math.round(Math.random() * 35 - 25) + 'deg)';
    return s;
  }
  // age：挂号时填的岁数；scatter：打印机发疯时，诊断单在屏幕上随便乱摆
  function slip(age, scatter) {
    slipNo++;
    const d = new Date();
    const date = OS.YEAR + '-' + OS.pad2(d.getMonth() + 1) + '-' + OS.pad2(d.getDate());
    // 每条是“标签：内容”，拆成粗体标签 + 内容
    const line = s => { const i = s.indexOf('：'); return el('div', { class: 'dx-row' }, [el('span', { class: 'dx-k', text: s.slice(0, i + 1) }), el('span', { class: 'dx-v', text: s.slice(i + 1) })]); };
    // 玩过别的软件：一半概率出隐藏诊断，换掉脉象和诊断
    const hits = HIDDEN.filter(h => h.when());
    const hidden = hits.length && Math.random() < HIDDEN_CHANCE ? OS.pick(hits) : null;
    const pulse = hidden ? hidden.pulse : OS.pick(PULSES);
    const ill = hidden ? hidden.ill : OS.pick(ILLS);
    const btn = (text, fn) => { const b = el('button', { class: 'xpbtn', text }); b.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return b; };
    const content = el('div', { class: 'dx' }, [
      el('div', { class: 'dx-title', text: CLINIC + ' · 门诊诊断单' }),
      el('div', { class: 'dx-meta' }, [el('span', { text: 'No. ' + String(1000 + Math.floor(Math.random() * 9000)) }), el('span', { text: '日期：' + date })]),
      el('div', { class: 'dx-meta' }, [el('span', { text: '姓名：你' }), el('span', { text: '年龄：' + age + ' 岁' })]),
      el('div', { class: 'dx-hr' }),
      line(pulse), line(ill), line(OS.pick(ADVICES)),
      el('div', { class: 'dx-hr' }),
      el('div', { class: 'dx-foot' }, [
        el('span', { text: '医师：' }),
        el('span', { class: 'dx-sign', html: '<svg viewBox="0 0 80 24"><path d="M2 16 C8 2 12 22 18 10 S26 4 30 14 S38 22 42 8 S52 18 56 12 S66 4 70 16 L78 10" fill="none" stroke="#1d2b6b" stroke-width="1.6"/></svg>' }),
        stamp()
      ]),
      el('div', { class: 'dx-btns' }, [
        btn('去药房抓药', say('药房', 'warn', DRUG)),
        btn('我有医保', say('医保', 'error', INSURANCE))
      ])
    ]);
    const W = OS.stage.work, w = 310;
    const pos = scatter ? { x: W.x + Math.random() * Math.max(0, W.w - w), y: W.y + Math.random() * 40 } : {};
    OS.wm.open(Object.assign({ title: '诊断单 - ' + CLINIC, icon: 'sheet', width: w, content, maximizable: false }, pos));
    OS.sound.play('ding');
  }

  /* ---------- 桌面右键：跟普通软件一样，属性换成诊所的 ---------- */
  app.menu = function () {
    const P = OS.menus.iconParts(app);
    return [
      P.open, '-', P.cut, P.copy, '-', P.shortcut, P.del, P.rename, '-',
      { label: '属性', action: say('「' + app.name + '」属性', 'info', '类型：赛博中医馆\n营业时间：24 小时（老中医不睡觉）\n挂号费：一个三连\n医保：不支持（电线杆找的）') }
    ];
  };
})();
