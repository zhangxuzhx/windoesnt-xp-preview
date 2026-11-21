/* 赛博把脉
   赛博中医馆，老中医在线坐诊。把手指按在“脉枕”上 5 秒别动（手机长按、电脑按住鼠标），
   右边小屏幕跳心电图、嘀嘀响；动了或者松手就重来。
   把完脉，底下的针式打印机“滋滋滋”打诊断单。第一次一定卡纸（之后偶尔卡），拍两下打印机才继续。
   打完弹出一张诊断单：脉象 / 诊断 / 医嘱都是随机的假病，带老中医签名和红章。
   蓝屏彩蛋：打印机被拍太多次会冒烟，拍到第 8 下着火。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.pulse;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  const CLINIC = '赛博中医馆';
  const HEAD = '老中医在线坐诊 · 挂号费：一个三连';
  const HOLD_MS = 5000;
  const ST_IDLE = '请把手指按在脉枕上，5 秒别动。';
  const ST_HOLD = n => '正在把脉……别动（' + n + '）';
  const ST_MOVED = '别动！老中医的手都被你带歪了。';
  const ST_LEFT = '手松开了，老中医还没摸清楚。';
  const ST_PRINT = '把脉完毕，正在打印诊断单……';
  const ST_JAM = '打印机卡纸了。';
  const ST_DONE = '诊断单已打印。';
  const JAM_TIP = ['打印机卡纸', '请清除卡纸后继续打印。'];
  const JAM_SELF = '打印机自己好了。';
  const SMOKE_AT = 5, FIRE_AT = 8;
  const BSOD = { id: 'pulse', name: 'PRINTER_ON_FIRE', text: '打印机着火了。建议用刚打印的诊断单灭火。' };

  // 诊断单内容：每次随机（全是假病）
  const PULSES = [
    '浮而无力，像周一早上的你',
    '沉而迟缓，像 56K 拨号上网',
    '时有时无，跟 UP 主更新一样',
    '弦紧如绷，甲方又改需求了',
    '滑而不实，全是虚的'
  ];
  const ILLS = [
    '间歇性踌躇满志，持续性混吃等死',
    '周一综合征（重度）',
    '熬夜成瘾，作息已与地球另一边同步',
    '手机依赖症：手机离身 3 米即心慌',
    '选择困难症：中午吃什么想了一上午',
    '拖延症：本诊断单本应昨天打印',
    '穷'
  ];
  const ADVICES = [
    '多喝热水。',
    '今晚 11 点前睡觉。（医生自己也做不到）',
    '立刻截图发给朋友，让他请你喝奶茶冲喜。',
    '少看手机，多看本系统。',
    '建议去「阳寿余额查询」看看还剩多少。',
    '建议把「2027暴富秘籍.rar」解压完，穷病自愈。'
  ];

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
    const printer = el('div', { class: 'pz-printer' }, [paper, el('div', { class: 'pz-pbody' }, [el('div', { class: 'pz-slot' }), el('div', { class: 'pz-led' })]), smoke]);
    const content = el('div', { class: 'pz' }, [
      el('div', { class: 'pz-head' }, [OS.iconEl('pulse', 'pz-logo'), el('div', {}, [el('div', { class: 'pz-name', text: CLINIC }), el('div', { class: 'pz-sub', text: HEAD })])]),
      el('div', { class: 'pz-main' }, [pad, screen]),
      status,
      printer
    ]);
    const win = OS.wm.open({
      title: app.name + ' - ' + CLINIC, icon: app.icon, width: 330, appId: app.id, content, maximizable: false,
      onClose: () => { dead = true; timers.forEach(clearTimeout); cancelAnimationFrame(raf); }
    });

    /* ---------- 心电图 ---------- */
    const ctx = cv.getContext('2d');
    function idleScreen() {
      ctx.fillStyle = '#031a08'; ctx.fillRect(0, 0, 160, 72);
      ctx.fillStyle = '#1f7a2e'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('请按住脉枕', 80, 40);
      bpm.textContent = '心率 --';
    }
    idleScreen();
    let ecgX = 0, lastY = 36, rate = 80, nextBeat = 0, beat = [];
    const BEAT = [33, 38, 8, 64, 40, 34, 36];   // 一次心跳的形状：小起伏 → 往上一戳 → 往下一戳 → 回平
    function ecgFrame() {
      if (dead || !holding) return;
      // 一格一格往右画，画到头从左边重来（老监护仪那样）
      for (let i = 0; i < 2; i++) {
        const now = performance.now();
        if (!beat.length && now >= nextBeat) {
          nextBeat = now + 60000 / rate;
          beat = BEAT.slice();
          OS.sound.play('beep');
        }
        const y = beat.length ? beat.shift() : 36 + Math.round(Math.sin(ecgX / 6));
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
      ecgX = 0; lastY = 36; nextBeat = performance.now() + 400;
      bpm.textContent = '心率 ' + rate;
      pad.classList.add('on');
      status.textContent = ST_HOLD(5);
      const tick = () => {
        if (!holding) return;
        const left = Math.ceil((HOLD_MS - (Date.now() - holding.t0)) / 1000);
        if (left <= 0) { done(); return; }
        status.textContent = ST_HOLD(left);
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
      printTick = setInterval(printStep, 260);
      timers.push(printTick);
    }
    function printStep() {
      if (dead) return;
      printed++;
      OS.sound.play('printer');
      paper.style.height = Math.min(44, printed * 5) + 'px';
      paper.appendChild(el('div', { class: 'pz-line' }));
      if (printed === jamAt) { jam(); return; }
      if (printed >= 9) {
        clearInterval(printTick);
        phase = 'idle';
        status.textContent = ST_DONE;
        const s = stats(); s.done++; saveStats(s);
        later(() => { slip(); paper.style.height = '0px'; paper.textContent = ''; status.textContent = ST_IDLE; idleScreen(); }, 500);
      }
    }
    function jam() {
      clearInterval(printTick);
      phase = 'jam';
      jamSlaps = 0;
      printer.classList.add('jam');
      status.textContent = ST_JAM;
      OS.sound.play('error');
      OS.ui.notify({ title: JAM_TIP[0], text: JAM_TIP[1], icon: 'warn', replace: true, timeout: 4000 });
      // 一直没人管，过一会儿它自己好了（免得卡死）
      jamTimer = later(() => { if (phase === 'jam') { status.textContent = JAM_SELF; resume(); } }, 8000);
    }
    function resume() {
      clearTimeout(jamTimer);
      printer.classList.remove('jam');
      phase = 'print';
      printTick = setInterval(printStep, 260);
      timers.push(printTick);
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
      if (phase === 'jam' && ++jamSlaps >= 2) later(() => { status.textContent = ST_PRINT; resume(); }, 300);
    });

    return win;
  };

  /* ---------- 诊断单 ---------- */
  let slipNo = 0;
  function slip() {
    slipNo++;
    const d = new Date();
    const date = d.getFullYear() + '-' + OS.pad2(d.getMonth() + 1) + '-' + OS.pad2(d.getDate());
    const row = (k, v) => el('div', { class: 'dx-row' }, [el('span', { class: 'dx-k', text: k }), el('span', { class: 'dx-v', text: v })]);
    const content = el('div', { class: 'dx' }, [
      el('div', { class: 'dx-title', text: CLINIC + ' · 门诊诊断单' }),
      el('div', { class: 'dx-meta' }, [el('span', { text: 'No. ' + String(1000 + Math.floor(Math.random() * 9000)) }), el('span', { text: '日期：' + date })]),
      el('div', { class: 'dx-meta' }, [el('span', { text: '姓名：你' }), el('span', { text: '年龄：去问阳寿余额查询' })]),
      el('div', { class: 'dx-hr' }),
      row('脉象：', OS.pick(PULSES)),
      row('诊断：', OS.pick(ILLS)),
      row('医嘱：', OS.pick(ADVICES)),
      el('div', { class: 'dx-hr' }),
      el('div', { class: 'dx-foot' }, [
        el('span', { text: '医师：' }),
        el('span', { class: 'dx-sign', html: '<svg viewBox="0 0 80 24"><path d="M2 16 C8 2 12 22 18 10 S26 4 30 14 S38 22 42 8 S52 18 56 12 S66 4 70 16 L78 10" fill="none" stroke="#1d2b6b" stroke-width="1.6"/></svg>' }),
        el('span', { class: 'dx-stamp', text: CLINIC })
      ])
    ]);
    OS.wm.open({ title: '诊断单 - ' + CLINIC, icon: 'sheet', width: 268, content, maximizable: false });
    OS.sound.play('ding');
  }

  /* ---------- 桌面右键：跟普通软件一样，属性换成诊所的 ---------- */
  app.menu = function () {
    const P = OS.menus.iconParts(app);
    return [
      P.open, '-', P.cut, P.copy, '-', P.shortcut, P.del, P.rename, '-',
      { label: '属性', action: say('「' + app.name + '」属性', 'info', '类型：赛博中医馆\n营业时间：24 小时（老中医不睡觉）\n挂号费：一个三连\n医保：不支持') }
    ];
  };
})();
