/* 计算器（开始 ▸ 所有程序 ▸ 附件；开始菜单左栏）——照 XP 的计算器，真能算
   - 标准型 ／ 科学型（sin cos tan ln log x² x^y n! pi 括号，十六 ／ 十 ／ 八 ／ 二进制）；跟 XP 一样不分先乘除，连按 = 重复上一步
   - 默认"语音报数"：那几年小卖部的真人发音计算器，按一个键念一个（assets/calc/voice.mp3，Windows 自带中文女声做的，压成芯片味）
   - 查看 ▸ 音乐模式：数字键是 do re mi，按 = 放《致爱丽丝》开头；按出 1155665 是《小星星》
   - 笑点：1+1 拒绝回答；除以零连按 = 越来越急 → 蓝屏；负数开方；520 这些数字暗号；连按 C；一直开方开到 1；结果按 Backspace；连按 = 30 下
   - n! 算太大的数：窗口 (未响应) 15 秒，任务管理器里能结束它
   - 编辑 ▸ 复制 ／ 粘贴：跟记事本互通（粘贴照 XP 原样，一个字一个字当按键按下去） */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.calc;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const NAME = '计算器';
  const L = {
    menus: ['编辑(E)', '查看(V)', '帮助(H)'],
    copy: '复制', paste: '粘贴', std: '标准型', sci: '科学型', group: '数字分组', music: '音乐模式', voice: '语音报数',
    helpTopics: '帮助主题', helpText: '这是计算器。\n用法：按数字，按等号，看结果。\n不会用的话，建议用手指。',
    about: '关于计算器', aboutText: '计算器\n版本 5.1\n(C) ' + OS.YEAR + ' 无聊科技\n本计算器保证 1+1 不等于 3。',
    pasteFail: '粘贴失败：计算器只认数字。', pasteLiantong: '"联通"不是数字。',
    privacy: '属于个人隐私，拒绝回答。',
    zero: ['除数不能为零。', '说了不能为零。', '你是不是想把宇宙搞出一个洞？', '计算器正在认真考虑你的要求……', '计算器决定试一试。'],
    invalid: '函数输入无效。',
    negSqrt: '函数输入无效。负数开不了方，就像你的存款取不出钱。',
    big: '数字太大了，计算器的手指不够数了。',
    tooLong: n => '结果太长，写不下。光是数位就有 ' + n + ' 位。',
    c5: '已经是零了，不能更零了。',
    one: '你就这么想当1吗？',
    bs: '结果删不掉。说出去的话也是。',
    eq30: '你是在跟计算器比耐心吗？',
    // 那几年的数字暗号：算出来正好是这个数，显示框左边闪一下小字
    codes: { 520: '我爱你', 1314: '一生一世', 5201314: '我爱你一生一世', 88: '拜拜', 250: '你说谁呢', 7456: '气死我了', 9420: '就是爱你' },
    star: '一闪一闪亮晶晶',
    bases: [[16, '十六进制'], [10, '十进制'], [8, '八进制'], [2, '二进制']]
  };
  const BSOD = { id: 'calc', name: 'UNIVERSE_DIVIDED_BY_ZERO', text: '计算器真的把一个数除以了零，宇宙出现了一个洞。' };
  const HANG_MS = 15000;
  const VOICE = 'assets/calc/voice.mp3';

  /* ================= 声音 ================= */
  // 语音：念什么（键 → voice.json 里的名字）
  const SAY_KEY = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', '.': 'dot', c: 'clear', ce: 'ce', sqrt: 'sqrt', pct: 'pct', inv: 'inv', sign: 'sign',
    ms: 'ms', mr: 'mr', mplus: 'mplus', mc: 'mc', fact: 'fact', sq: 'sq', pow: 'pow', pi: 'pi' };
  let voiceReady = null;
  function loadVoice() {
    if (voiceReady) return voiceReady;
    voiceReady = fetch('assets/calc/voice.json').then(r => r.json()).then(j => OS.sound.voice(VOICE, j.clips, j.lag)).catch(() => { voiceReady = null; });
    return voiceReady;
  }
  const speak = words => { if (mode() === 'voice' && words && words.length) OS.sound.say(VOICE, words, 0.015); };
  // 中文念数：12 位以内照"一万零一十"念；更长的、科学计数法的，一个数字一个数字念
  function readNum(s) {
    const w = [];
    if (s[0] === '-') { w.push('neg'); s = s.slice(1); }
    const [ip, fp] = s.split('.');
    if (/e/i.test(s) || ip.length > 12) { for (const ch of s) { if (/\d/.test(ch)) w.push(ch); else if (ch === '.') w.push('dot'); } return w; }
    w.push(...readInt(ip));
    if (fp) { w.push('dot'); for (const ch of fp) w.push(ch); }
    return w;
  }
  function readInt(str) {
    const n = str.replace(/^0+(?=\d)/, '');
    if (n === '0' || !n) return ['0'];
    const U = ['', 'shi', 'bai', 'qian'], BIG = ['', 'wan', 'yi'];
    const secs = [];
    for (let i = n.length; i > 0; i -= 4) secs.unshift(n.slice(Math.max(0, i - 4), i).padStart(4, '0'));
    const out = [];
    let zero = false;
    secs.forEach((s, si) => {
      let has = false;
      for (let i = 0; i < 4; i++) {
        if (s[i] === '0') { zero = true; continue; }
        if (zero && out.length) out.push('0');
        zero = false;
        out.push(s[i]);
        if (U[3 - i]) out.push(U[3 - i]);
        has = true;
      }
      if (has && BIG[secs.length - 1 - si]) out.push(BIG[secs.length - 1 - si]);
    });
    if (out[0] === '1' && out[1] === 'shi') out.shift();   // 十五，不念一十五
    return out;
  }
  // 音乐计算器：1 do … 7 si，8 9 高音 do re，0 空一拍
  const NOTE = { 1: 523.25, 2: 587.33, 3: 659.25, 4: 698.46, 5: 783.99, 6: 880, 7: 987.77, 8: 1046.5, 9: 1174.66 };
  const beep = d => { if (NOTE[d]) OS.sound.play('chip', [[NOTE[d], 0, 0.22, 'square', 0.05]]); };
  // 《致爱丽丝》开头（贝多芬，早就没有版权了）
  const ELISE = [[659.25, 1], [622.25, 1], [659.25, 1], [622.25, 1], [659.25, 1], [493.88, 1], [587.33, 1], [523.25, 1], [440, 2], [0, 1],
    [261.63, 1], [329.63, 1], [440, 1], [493.88, 2], [0, 1], [329.63, 1], [415.3, 1], [493.88, 1], [523.25, 2]];
  function elise() {
    const notes = [];
    let t = 0;
    ELISE.forEach(([f, n]) => { if (f) notes.push([f, t, 0.16 * n, 'square', 0.045]); t += 0.17 * n; });
    OS.sound.play('chip', notes);
  }

  /* ================= 设置（记住） ================= */
  const mode = () => OS.save.get('calcSound', 'voice');   // voice ／ music ／ off，默认语音报数
  const setMode = m => { OS.save.set('calcSound', m); if (m === 'voice') loadVoice(); else OS.sound.hush(VOICE); };

  /* ================= 算 ================= */
  const fix = r => (r === 0 || !isFinite(r) ? r : (Math.abs(r) < 1e-15 ? 0 : +r.toPrecision(15)));   // 0.1+0.2 显示 0.3
  function fmt10(v) {
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a >= 1e16) return v.toExponential(14).replace(/\.?0+e/, 'e');
    if (a < 1e-6) {
      if (a < 1e-15) return v.toExponential(14).replace(/\.?0+e/, 'e');
      return v.toFixed(Math.min(20, 15 + Math.ceil(-Math.log10(a)))).replace(/\.?0+$/, '');
    }
    return String(v);
  }
  function gamma(z) {
    const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1;
    let x = p[0];
    for (let i = 1; i < 9; i++) x += p[i] / (z + i);
    const t = z + 7.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }
  // n! 有几位：一百万以内一个个加 log，再大用斯特林公式
  function factDigits(n) {
    if (n <= 1e6) { let s = 0; for (let k = 2; k <= n; k++) s += Math.log10(k); return Math.floor(s) + 1; }
    return Math.floor((n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n) + 1 / (12 * n)) / Math.LN10) + 1;
  }

  /* ================= 窗口 ================= */
  let win = null;
  app.open = function () {
    if (win && !win.isClosed) { if (win.minimized) OS.wm.restore(win); OS.wm.focus(win); return win; }
    if (mode() === 'voice') loadVoice();
    let sci = !!OS.save.get('calcSci', false), group = !!OS.save.get('calcGroup', false), base = 10;
    let hung = false, hangTimer = 0, flashTimer = 0;
    // 状态：disp 显示框里的字；acc ／ op 等着算的；fresh 下一个数字重新开始；typed 这个数是一个个按出来的
    const S = { disp: '0', acc: 0, op: null, fresh: true, typed: false, result: false, lastOp: null, lastArg: 0, msg: null, err: null,
      mem: 0, memOn: !!0, stack: [], chain: [] };
    let cRun = 0, eqRun = 0, zeroN = 0, sqrtRun = 0;

    const dispText = el('div', { class: 'calc-dtext' });
    const flash = el('div', { class: 'calc-flash' });
    const disp = el('div', { class: 'calc-disp' }, [flash, dispText]);
    const memBox = el('div', { class: 'calc-mbox' });
    const parenBox = el('div', { class: 'calc-pbox' });
    const keys = {};
    const box = el('div', { class: 'calc' });
    const bar = OS.ui.menuBar(L.menus, menuFor, 'calc-mbar');
    const body = el('div', { class: 'calc-body' });
    box.append(bar, body);

    win = OS.wm.open({
      title: NAME, icon: 'calc', width: sci ? 476 : 236, appId: app.id, content: box, maximizable: false, center: sci,
      onClose: () => { clearTimeout(hangTimer); clearTimeout(flashTimer); document.removeEventListener('keydown', onKey, true); OS.sound.hush(VOICE); win = null; }
    });
    document.addEventListener('keydown', onKey, true);

    /* ---------- 摆按钮 ---------- */
    const STD = [
      [['MC', 'mc', 'm'], ['7'], ['8'], ['9'], ['/', '/', 'o'], ['sqrt', 'sqrt', 'f']],
      [['MR', 'mr', 'm'], ['4'], ['5'], ['6'], ['*', '*', 'o'], ['%', 'pct', 'f']],
      [['MS', 'ms', 'm'], ['1'], ['2'], ['3'], ['-', '-', 'o'], ['1/x', 'inv', 'f']],
      [['M+', 'mplus', 'm'], ['0'], ['+/-', 'sign'], ['.'], ['+', '+', 'o'], ['=', '=', 'o']]
    ];
    const SCI = [
      [['sin', 'sin', 's'], ['x^2', 'sq', 's'], ['(', '(', 's'], ['A', 'A', 'h'], ['B', 'B', 'h']],
      [['cos', 'cos', 's'], ['x^y', 'pow', 's'], [')', ')', 's'], ['C', 'C', 'h'], ['D', 'D', 'h']],
      [['tan', 'tan', 's'], ['n!', 'fact', 's'], ['pi', 'pi', 's'], ['E', 'E', 'h'], ['F', 'F', 'h']],
      [['ln', 'ln', 's'], ['log', 'log', 's'], null, null, null]
    ];
    function key(spec) {
      if (!spec) return el('span', { class: 'calc-gap' });
      const [label, k = label, cls = 'd'] = spec;
      const b = el('button', { class: 'calc-k calc-' + cls, text: label });
      b.addEventListener('click', () => press(k));
      keys[k] = b;
      return b;
    }
    function layout() {
      body.textContent = '';
      Object.keys(keys).forEach(k => delete keys[k]);
      box.classList.toggle('sci', sci);
      const top = el('div', { class: 'calc-top' });
      if (sci) {
        const radios = el('div', { class: 'calc-bases' }, L.bases.map(([b, label]) => {
          const r = el('label', { class: 'calc-radio' }, [el('input', { type: 'radio', name: 'cb' + win.id }), el('span', { text: label })]);
          const inp = r.firstChild;
          inp.checked = base === b;
          inp.addEventListener('change', () => { if (inp.checked) setBase(b); });
          return r;
        }));
        top.append(radios, parenBox);
      }
      top.append(memBox, el('div', { class: 'calc-edit' }, [key(['Backspace', 'bs', 'r']), key(['CE', 'ce', 'r']), key(['C', 'c', 'r'])]));
      const grid = el('div', { class: 'calc-grid' });
      STD.forEach((row, i) => {
        if (sci) SCI[i].forEach(s => grid.appendChild(key(s)));
        row.forEach((s, j) => { const k = key(s); if (j === 0) k.classList.add('calc-mcol'); grid.appendChild(k); });
      });
      body.append(disp, top, grid);
      refreshKeys();
      render();
    }
    function refreshKeys() {
      const decOnly = ['.', 'sin', 'cos', 'tan', 'ln', 'log', 'pi', 'sqrt', 'inv', 'pct'];
      Object.keys(keys).forEach(k => {
        let off = false;
        if (/^[0-9]$/.test(k)) off = +k >= base;
        else if (/^[A-F]$/.test(k)) off = base !== 16;
        else if (decOnly.includes(k)) off = base !== 10;
        keys[k].disabled = off;
      });
    }
    function setBase(b) {
      const v = Math.trunc(cur());
      base = b;
      S.typed = false;
      show(v);
      S.fresh = true;
      refreshKeys();
    }

    /* ---------- 显示 ---------- */
    const groupify = s => (base === 10 && group && !/e/.test(s) ? s.replace(/^(-?)(\d+)/, (m, sg, d) => sg + d.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) : s);
    function render() {
      dispText.textContent = S.msg || groupify(S.disp);
      disp.classList.toggle('msg', !!S.msg);
      memBox.textContent = S.memOn ? 'M' : '';
      parenBox.textContent = S.stack.length ? '(=' + S.stack.length : '';
    }
    function fmt(v) { return base === 10 ? fmt10(v) : (v < 0 ? '-' : '') + Math.abs(Math.trunc(v)).toString(base).toUpperCase(); }
    function cur() {
      if (base === 10) return parseFloat(S.disp) || 0;
      const neg = S.disp[0] === '-';
      const v = parseInt(neg ? S.disp.slice(1) : S.disp, base) || 0;
      return neg ? -v : v;
    }
    // 显示一个算出来的数；太大了就报错。返回 false = 出错了
    function show(v) {
      v = base === 10 ? fix(v) : Math.trunc(v);
      if (!isFinite(v) || Math.abs(v) > 1.7e308) { message(L.big, 'big', true); return false; }
      S.disp = fmt(v);
      S.msg = null;
      render();
      return true;
    }
    function message(text, clip, isErr) {
      S.msg = text;
      if (isErr) S.err = isErr === true ? 'err' : isErr;
      render();
      speak(clip ? [clip] : null);
    }
    function flashText(t) {
      flash.textContent = t;
      flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => flash.classList.remove('on'), 1000);
    }
    function resetAll() {
      Object.assign(S, { disp: '0', acc: 0, op: null, fresh: true, typed: false, result: false, lastOp: null, lastArg: 0, msg: null, err: null, stack: [], chain: [] });
      zeroN = 0;
    }

    /* ---------- 按键 ---------- */
    function apply(a, op, b) {
      if (op === '+') return a + b;
      if (op === '-') return a - b;
      if (op === '*') return a * b;
      if (op === '/') return b === 0 ? NaN : a / b;
      if (op === 'pow') return Math.pow(a, b);
      return b;
    }
    function divZero() { zeroN = 0; message(L.zero[0], 'z0', 'div0'); }
    function press(k) {
      if (hung || !win || win.isClosed) return;
      if (k !== 'c') cRun = 0;
      if (k !== '=') eqRun = 0;
      if (k !== 'sqrt') sqrtRun = 0;
      // 除以零以后接着按 =：一次比一次急，最后蓝屏
      if (S.err === 'div0' && k === '=') {
        zeroN++;
        if (zeroN >= L.zero.length) { OS.ui.bsod(BSOD); return; }
        message(L.zero[zeroN], 'z' + zeroN, 'div0');
        return;
      }
      // 报错以后按别的：清掉重来；冒了一句话以后按别的：恢复显示
      if (S.err) { resetAll(); render(); if (k === 'c' || k === 'ce') { speak([SAY_KEY[k]]); return; } }
      else if (S.msg) { S.msg = null; render(); }

      if (/^[0-9A-F.]$/.test(k)) return digit(k);
      if (['+', '-', '*', '/', 'pow'].includes(k)) return operator(k);
      switch (k) {
        case '=': return equals();
        case 'c':
          cRun++;
          resetAll();
          if (cRun >= 5) { cRun = 0; message(L.c5, 'c5'); return; }
          render(); speak(['clear']); return;
        case 'ce': S.disp = '0'; S.fresh = true; S.typed = false; render(); speak(['ce']); return;
        case 'bs':
          if (S.result) { message(L.bs, 'bs'); return; }
          if (!S.fresh) { S.disp = S.disp.length > 1 && !/^-.$/.test(S.disp) ? S.disp.slice(0, -1) : '0'; render(); }
          return;
        case 'sign':
          if (!S.fresh) S.disp = S.disp[0] === '-' ? S.disp.slice(1) : (S.disp === '0' ? '0' : '-' + S.disp);
          else show(-cur());
          render(); speak(['sign']); return;
        case 'mc': S.mem = 0; S.memOn = false; render(); speak(['mc']); return;
        case 'ms': S.mem = cur(); S.memOn = S.mem !== 0; S.fresh = true; render(); speak(['ms']); return;
        case 'mplus': S.mem = fix(S.mem + cur()); S.memOn = true; S.fresh = true; render(); speak(['mplus']); return;
        case 'mr': show(S.mem); after(); speak(['mr']); return;
        case 'pct': show(S.op ? S.acc * cur() / 100 : 0); after(); speak(['pct']); return;
        case 'inv': { const v = cur(); if (v === 0) { divZero(); return; } show(1 / v); after(); speak(['inv']); return; }
        case 'sqrt': {
          const v = cur();
          if (v < 0) { message(L.negSqrt, 'negsqrt', true); return; }
          sqrtRun++;
          const r = fix(Math.sqrt(v));
          if (!show(r)) return;
          after();
          if (r === 1 && v !== 1 && sqrtRun >= 2) { message(L.one, 'one'); return; }
          speak(['sqrt']);
          return;
        }
        case 'sq': if (show(cur() * cur())) { after(); speak(['sq']); } return;
        case 'pi': show(Math.PI); after(); speak(['pi']); return;
        case 'sin': case 'cos': case 'tan': {
          const v = cur() * Math.PI / 180;
          const r = k === 'sin' ? Math.sin(v) : k === 'cos' ? Math.cos(v) : Math.tan(v);
          if (k === 'tan' && Math.abs(Math.cos(v)) < 1e-12) { message(L.invalid, 'err', true); return; }
          show(r); after(); return;
        }
        case 'ln': case 'log': {
          const v = cur();
          if (v <= 0) { message(L.invalid, 'err', true); return; }
          show(k === 'ln' ? Math.log(v) : Math.log10(v)); after(); return;
        }
        case 'fact': return factorial();
        case '(': S.stack.push({ acc: S.acc, op: S.op }); S.acc = 0; S.op = null; S.fresh = true; S.typed = false; render(); return;
        case ')': {
          if (!S.stack.length) return;
          let r = cur();
          if (S.op) { if (S.op === '/' && r === 0) { divZero(); return; } r = apply(S.acc, S.op, r); }
          const top = S.stack.pop();
          S.acc = top.acc; S.op = top.op;
          show(r); after(); return;
        }
      }
    }
    // 算出了一个数（不是按出来的）
    function after() { S.fresh = true; S.typed = false; S.result = false; }
    function digit(d) {
      if (S.fresh) { S.disp = d === '.' ? '0.' : d; S.fresh = false; S.typed = true; S.result = false; }
      else if (d === '.') { if (S.disp.includes('.')) return; S.disp += '.'; }
      else if (S.disp.replace(/[-.]/g, '').length >= 16) return;
      else S.disp = S.disp === '0' ? d : (S.disp === '-0' ? '-' + d : S.disp + d);
      render();
      if (mode() === 'music') {
        beep(d);
        if (S.disp === '1155665') flashText(L.star);
      } else speak([SAY_KEY[d] || d]);
    }
    function operator(op) {
      const v = cur();
      S.chain.push(S.typed ? S.disp : '#', op);
      if (S.op && !S.fresh) {
        if (S.op === '/' && v === 0) { divZero(); return; }
        const r = apply(S.acc, S.op, v);
        if (!show(r)) return;
        S.acc = fix(r);
      } else if (!S.op || !S.fresh) S.acc = v;
      S.op = op;
      S.fresh = true; S.typed = false; S.result = false;
      speak([SAY_KEY[op]]);
    }
    function equals() {
      eqRun++;
      const v = cur();
      S.chain.push(S.typed ? S.disp : '#');
      const isPrivacy = S.chain.join(' ') === '1 + 1';
      S.chain = [];
      let r;
      if (S.op) {
        if (S.op === '/' && v === 0) { divZero(); return; }
        r = apply(S.acc, S.op, v);
        S.lastOp = S.op; S.lastArg = v; S.op = null;
      } else if (S.lastOp) {
        if (S.lastOp === '/' && S.lastArg === 0) { divZero(); return; }
        r = apply(v, S.lastOp, S.lastArg);
      } else r = v;
      if (!show(r)) return;
      S.acc = fix(r);
      S.fresh = true; S.typed = false; S.result = true;
      if (mode() === 'music') elise();
      // 1+1：明明算出来了（是 2），就是不说
      if (isPrivacy) { message(L.privacy, 'privacy'); return; }
      if (eqRun >= 30) { eqRun = 0; message(L.eq30, 'eq30'); return; }
      const n = base === 10 ? S.acc : null;
      if (n != null && L.codes[n]) flashText(L.codes[n]);
      if (base === 10) speak(['eq'].concat(readNum(S.disp)));
      else speak(['eq']);
    }
    // n!：170 以内真算；不是整数用 gamma；再大就 (未响应) 15 秒，然后告诉你有几位
    function factorial() {
      const n = cur();
      if (n < 0) { message(L.invalid, 'err', true); return; }
      if (n > 170) {
        const digits = factDigits(Math.floor(n));
        hang(() => message(L.tooLong(fmt10(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ',')), 'toolong', true));
        return;
      }
      let r;
      if (Number.isInteger(n)) { r = 1; for (let i = 2; i <= n; i++) r *= i; } else r = gamma(n + 1);
      if (show(r)) { after(); speak(['fact']); }
    }
    function hang(done) {
      hung = true;
      win.setTitle(NAME + ' (未响应)');
      win.el.classList.add('calc-hung');
      hangTimer = setTimeout(() => {
        if (!win || win.isClosed) return;
        hung = false;
        win.setTitle(NAME);
        win.el.classList.remove('calc-hung');
        done();
      }, HANG_MS);
    }

    /* ---------- 键盘（电脑上） ---------- */
    function onKey(e) {
      if (!win || win.isClosed || OS.wm.active !== win) return;
      const a = document.activeElement;
      if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.type !== 'radio') return;
      const map = { Enter: '=', '=': '=', Escape: 'c', Delete: 'ce', Backspace: 'bs', '%': 'pct', '+': '+', '-': '-', '*': '*', '/': '/', '.': '.', ',': '.', '(': '(', ')': ')', '!': 'fact', '@': 'sqrt' };
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) { copy(); e.preventDefault(); return; }
      if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) { paste(); e.preventDefault(); return; }
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      let k = map[e.key];
      if (!k && /^[0-9]$/.test(e.key)) k = e.key;
      if (!k && base === 16 && /^[a-fA-F]$/.test(e.key)) k = e.key.toUpperCase();
      if (!k || (keys[k] && keys[k].disabled)) return;
      e.preventDefault();
      press(k);
    }

    /* ---------- 编辑：复制 ／ 粘贴 ---------- */
    function copy() { OS.textClip = { text: S.msg ? S.msg : S.disp, at: Date.now() }; }
    function paste() {
      const g = OS.textClip;
      if (!g || !g.text) return;
      const t = g.text.trim();
      if (/[^0-9A-Fa-f.+\-*/=()%\s]/.test(t) || /[g-zG-Z]/.test(t)) {
        OS.ui.dialog({ title: NAME, icon: 'warn', text: L.pasteFail + (t === '联通' ? '\n' + L.pasteLiantong : '') });
        return;
      }
      // 照 XP 原样：一个字一个字当成按键按下去
      for (const ch of t.replace(/\s+/g, '')) {
        const k = ch === '%' ? 'pct' : /[a-f]/.test(ch) ? ch.toUpperCase() : ch;
        if (keys[k] && keys[k].disabled) continue;
        press(k);
        if (!win || win.isClosed || hung) break;
      }
    }

    /* ---------- 菜单 ---------- */
    function menuFor(name) {
      if (name === L.menus[0]) return [
        { label: L.copy, action: copy },
        { label: L.paste, disabled: !(OS.textClip && OS.textClip.text), action: paste }
      ];
      if (name === L.menus[1]) return [
        { label: L.std, checked: !sci, action: () => switchView(false) },
        { label: L.sci, checked: sci, action: () => switchView(true) },
        '-',
        { label: L.group, checked: group, action: () => { group = !group; OS.save.set('calcGroup', group); render(); } },
        '-',
        { label: L.music, checked: mode() === 'music', action: () => setMode(mode() === 'music' ? 'off' : 'music') },
        { label: L.voice, checked: mode() === 'voice', action: () => setMode(mode() === 'voice' ? 'off' : 'voice') }
      ];
      if (name === L.menus[2]) return [
        { label: L.helpTopics, action: say(NAME, 'help', L.helpText) },
        '-',
        { label: L.about, action: say(L.about, 'info', L.aboutText) }
      ];
      return null;
    }
    function switchView(toSci) {
      if (sci === toSci) return;
      sci = toSci;
      OS.save.set('calcSci', sci);
      if (!sci && base !== 10) setBase(10);
      layout();
      OS.wm.setWidth(win, sci ? 476 : 236);
    }

    layout();
    OS.wm.setWidth(win, sci ? 476 : 236);   // 按钮摆好以后窗口才有真高度：底下出界就往上挪
    return win;
  };
})();
