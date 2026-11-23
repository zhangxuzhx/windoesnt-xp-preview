/* 黑心大战（XP 红心大战 → 黑心大战；开始 ▸ 所有程序 ▸ 游戏）——四个人一桌抽乌龟，黑桃 Q 就是乌龟
   - 51 张（拿掉梅花 Q），点数一样就是一对，黑桃 Q 谁也不配；开局对子扔掉（你点中间的［扔掉对子］）
   - 一局从左家抽、一局从右家抽，箭头跟着变；每局第一个抽的人轮着换
   - 轮到你：那家的牌伸到桌子中间摊成一排，点一下指着（它会有反应），再点一下抽走；凑成对自动扔
   - 最后拿着黑桃 Q 的是乌龟，记 13 分；有人到 52 分这一盘就结束，分最少的赢
   - 性格库：小猫、小狗、小鱼、小羊每盘随机三个上桌（你自己的头像不上桌），每家从自己四种心态里随机抽一种；
     头像下面的框能标"我觉得它是哪种"，一盘打完一家家揭晓，猜对、猜错、没标、全对各有反应，记进统计
   - 你自己的牌：点一下翘起来给下家看，按住拖能换位置
   - 蓝屏：轮到你抽时 10 秒内指来指去 30 下 → OPPONENT_FLIPPED_TABLE */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.hearts;
  const C = OS.cards;

  /* ================= 文案 ================= */
  const NAME = '黑心大战';
  const L = {
    menus: ['游戏(G)', '帮助(H)'],
    newGame: '新游戏　F2', score: '得分　F4', stats: '统计信息…', options: '选项…　F5', back: '牌背…', quit: '退出',
    help: '目录', about: '关于黑心大战',
    helpText: '黑心大战\n\n黑桃 Q 是乌龟，谁也不跟它配对。\n开局先把手里的对子扔掉：点数一样就是一对。\n轮到你，从旁边那家手里抽一张：点一下指着，再点一下抽走。凑成对就扔掉。\n牌先扔光的先走，最后拿着黑桃 Q 的就是乌龟，记 13 分。\n有人到 52 分就结束，分最少的赢。',
    aboutText: '黑心大战\n版本 2003\n别当乌龟。\n(C) ' + OS.YEAR + ' 无聊科技',
    welcome: '欢迎使用黑心大战。你叫什么名字？', me: '你',
    discard: '扔掉对子',
    stDiscard: '点中间的［扔掉对子］。',
    stYou: n => '轮到你了：从' + n + '手里抽一张。',
    stCpu: (a, b) => a + '正在从' + b + '手里抽牌……',
    stOut: n => n + '走了。',
    stTurtle: n => '这一局的乌龟是：' + n + '。',
    stPerfect: '火眼金睛：三家全看穿了！',
    out: '我走啦！',
    scoreTitle: '得分', total: '总分', ok: '确定', cancel: '取消',
    over: (loser, n, winners) => '游戏结束\n' + loser + '当了 ' + n + ' 回乌龟。\n分最少的赢：' + winners + '！',
    again: '再来一盘', quitGame: '不玩了',
    statsTitle: '统计信息', clear: '清除',
    statsText: t => '盘数：' + t.matches + '　赢：' + t.wins + ' 盘\n你当乌龟：' + t.turtles + ' 回\n猜心态：标了 ' + t.marked + ' 家，猜对 ' + t.right + ' 家（' +
      (t.marked ? Math.round(t.right / t.marked * 100) : 0) + '%）\n全看穿：' + t.perfect + ' 盘',
    optTitle: '选项', speed: '动画速度', speeds: ['慢', '正常', '快'], names: '电脑玩家的名字',
    noMark: '不标', unknown: '？'
  };
  const BSOD = n => ({ id: 'hearts', name: 'OPPONENT_FLIPPED_TABLE', text: n + '被你指烦了，把桌子掀了。' });

  /* ================= 角色和心态 ================= */
  // tell：你指着它的牌时的反应。turtle：指着乌龟才有（比例）；any：指哪张都有；middle：指正中间那张就有；flip：说反话
  // raise：它自己翘起一张给你看（turtle 翘乌龟 ／ decoy 翘一张不是乌龟的）；hide：乌龟藏在哪（right 最右 ／ middle 正中）
  // draw：它从你手里怎么抽（raised 翘起来的就抽 ／ avoid 专挑没翘的 ／ left 最左 ／ right 最右 ／ grudge 记仇 ／ random）
  const ROSTER = {
    cat: { name: '小猫', icon: 'ava-cat', ok: '被你看穿了……喵。', bad: '喵哈哈，猜错啦！', plain: m => '喵，这盘我是"' + m + '"。',
      minds: [
        { id: '慌张', note: '你指着乌龟，它会吓一跳', tell: { turtle: 0.8, say: '喵！', mood: 'shake' }, draw: 'raised' },
        { id: '嘴硬', note: '你指着乌龟，它反倒说"随便抽"', tell: { turtle: 0.85, say: '随便抽啊～' }, draw: 'random' },
        { id: '爱藏', note: '乌龟总塞在最右边', hide: 'right', draw: 'raised' },
        { id: '好心', note: '翘起来的那张就是乌龟', raise: 'turtle', raiseSay: '这张别抽哦', draw: 'random' }
      ] },
    dog: { name: '小狗', icon: 'ava-dog', ok: '汪！你好厉害！', bad: '汪汪！不是哦～', plain: m => '汪，这盘我是"' + m + '"。',
      minds: [
        { id: '傻乐', note: '指哪张都叫，看不出来', tell: { any: 1, say: '汪！', mood: 'hop' }, draw: 'random' },
        { id: '实诚', note: '你指着乌龟，它会耷拉耳朵', tell: { turtle: 0.7, say: '呜……', mood: 'droop' }, draw: 'raised' },
        { id: '护食', note: '有乌龟就攥在正中间', hide: 'middle', tell: { middle: 1, say: '汪汪汪！', mood: 'shake' }, draw: 'random' },
        { id: '好奇', note: '总抽你最左边那张', draw: 'left' }
      ] },
    fish: { name: '小鱼', icon: 'ava-fish', ok: '……算你狠。', bad: '……呵。', plain: m => '……"' + m + '"。',
      minds: [
        { id: '扑克脸', note: '看不出来，专抽你没翘的', tell: { any: 1, say: '……' }, draw: 'avoid' },
        { id: '下套', note: '翘起来的那张一定不是乌龟', raise: 'decoy', raiseSay: '这张可别抽', draw: 'avoid' },
        { id: '说反话', note: '它说"别抽"的多半能抽', tell: { flip: 0.6, yes: '随便抽', no: '哎呀别' }, draw: 'random' },
        { id: '七秒记忆', note: '总抽你最右边那张', draw: 'right' }
      ] },
    sheep: { name: '小羊', icon: 'ava-sheep', ok: '咩，被发现了。', bad: '咩～猜错了也没关系。', plain: m => '咩，这盘我是"' + m + '"呀。',
      minds: [
        { id: '发呆', note: '什么都看不出来', draw: 'random' },
        { id: '老好人', note: '你指着乌龟，它会劝你换一张', tell: { turtle: 0.9, say: '咩……换一张吧' }, draw: 'raised' },
        { id: '记仇', note: '抽到过你的乌龟就不再上当', draw: 'grudge' },
        { id: '犹豫', note: '你指着乌龟，它会想半天才松手', tell: { turtle: 0.7, say: '嗯……', slow: true }, draw: 'random' }
      ] }
  };
  const ICON2KEY = { 'ava-cat': 'cat', 'ava-dog': 'dog', 'ava-fish': 'fish', 'ava-sheep': 'sheep' };

  /* ================= 存档 ================= */
  const KEY = 'hearts';
  const S = Object.assign({ name: null, speed: 1, names: {} }, OS.save.get(KEY, {}));
  S.stats = Object.assign({ matches: 0, wins: 0, turtles: 0, marked: 0, right: 0, perfect: 0 }, S.stats || {});
  const persist = () => OS.save.set(KEY, S);
  const nameOf = k => (S.names && S.names[k]) || ROSTER[k].name;
  const SPEED = [1.6, 1, 0.5];

  /* ================= 牌 ================= */
  const isTurtle = c => c.r === 12 && c.s === 0;
  // 拿走所有对子（点数一样两张一对，黑桃 Q 不算），返回扔掉的
  function stripPairs(hand) {
    const out = [], seen = new Map();
    for (const c of hand.slice()) {
      if (isTurtle(c)) continue;
      if (seen.has(c.r)) { const o = seen.get(c.r); seen.delete(c.r); out.push([o, c]); }
      else seen.set(c.r, c);
    }
    out.forEach(([a, b]) => { hand.splice(hand.indexOf(a), 1); hand.splice(hand.indexOf(b), 1); });
    return out;
  }
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  const turtleFace = card => { const n = C.face(card); if (isTurtle(card)) n.innerHTML = n.innerHTML.replace('q-spade.webp', 'q-spade-turtle.webp'); return n; };

  /* ================= 窗口 ================= */
  let win = null, ui = null, G = null;
  const ABORT = {};
  app.open = function () {
    if (win && !win.isClosed) { if (win.minimized) OS.wm.restore(win); OS.wm.focus(win); return win; }
    ui = {};
    ui.layer = el('div', { class: 'hd-layer' });
    ui.fx = el('div', { class: 'hd-fx' });
    ui.table = el('div', { class: 'hd-table' }, [ui.layer, ui.fx]);
    ui.status = el('div', { class: 'hd-status' });
    ui.box = el('div', { class: 'hd-win' }, [OS.ui.menuBar(L.menus, menuFor, 'hd-mbar'), ui.table, ui.status]);
    win = OS.wm.open({ title: NAME, icon: 'hearts', width: 462, content: ui.box, appId: app.id, maximizable: false, center: true,
      onClose: () => {
        if (G) G.tok++;
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('pointermove', onMove, true);
        document.removeEventListener('pointerup', onUp, true);
        document.removeEventListener('pointercancel', onUp, true);
        OS.off('cards:back', onBack);
        win = null; ui = null; G = null; drag = null;
      } });
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('pointercancel', onUp, true);
    OS.on('cards:back', onBack);
    ui.table.addEventListener('pointerdown', onDown);
    if (S.name == null) {
      // 第一次：问名字（照原版）
      OS.explorer.askText(NAME, L.welcome, L.me, v => { S.name = (v || '').trim() || L.me; persist(); if (win) newMatch(); });
    } else newMatch();
    return win;
  };
  const onBack = () => { if (G) render(); };
  function onKey(e) {
    if (!win || win.isClosed || OS.wm.active !== win) return;
    const k = { F2: () => newMatch(), F4: scoreSheet, F5: optionsDialog }[e.key];
    if (k) { e.preventDefault(); k(); }
  }

  /* ---------- 一盘：谁上桌、各是什么心态 ---------- */
  function newMatch() {
    if (G) G.tok++;
    const mine = ICON2KEY[OS.save.get('avatar', 'duck')];
    const pool = shuffle(Object.keys(ROSTER).filter(k => k !== mine)).slice(0, 3);
    const seats = [null].concat(pool.map(k => ({ key: k, mind: ROSTER[k].minds[Math.floor(Math.random() * 4)], mark: null, grudge: false })));
    G = { tok: (G ? G.tok : 0) + 1, seats, scores: [0, 0, 0, 0], rounds: [], handNo: 0, hands: [[], [], [], []], pile: [], phase: '', dir: 1,
      pointed: -1, raised: null, says: {}, moods: {}, tells: new Map(), points: [], newId: null, src: -1 };
    nextHand();
  }
  const seatName = i => i === 0 ? S.name || L.me : nameOf(G.seats[i].key);
  const wait = ms => {
    if (!G || !win) return Promise.reject(ABORT);
    const tok = G.tok;
    return new Promise((res, rej) => setTimeout(() => (G && win && G.tok === tok ? res() : rej(ABORT)), ms * SPEED[S.speed]));
  };
  const status = t => { if (ui) ui.status.textContent = t; };

  /* ---------- 一局 ---------- */
  async function nextHand() {
    try {
      G.handNo++;
      G.dir = G.handNo % 2 ? 1 : -1;   // 一局从左家抽、一局从右家抽
      const d = [];
      for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) if (!(s === 2 && r === 12)) d.push({ r, s, id: s * 13 + r });
      shuffle(d);
      G.hands = [[], [], [], []];
      const first = (G.handNo - 1) % 4;
      d.forEach((c, i) => G.hands[(first + i) % 4].push(c));
      G.hands[0].sort((a, b) => a.r - b.r || a.s - b.s);
      G.pile = []; G.raised = null; G.pointed = -1; G.src = -1; G.says = {}; G.moods = {}; G.newId = null; G.gone = new Set(); G.loser = null;
      for (let p = 1; p < 4; p++) arrange(p);
      G.phase = 'deal';
      render();
      await wait(500);
      // 电脑的对子先扔
      for (let p = 1; p < 4; p++) { stripPairs(G.hands[p]).forEach(pair => toPile(pair)); arrange(p); }
      render();
      await wait(400);
      // 你的对子亮起来，点［扔掉对子］
      G.phase = 'discard';
      status(L.stDiscard);
      render();
      await new Promise((res, rej) => { const tok = G.tok; G.onDiscard = () => (G && G.tok === tok ? res() : rej(ABORT)); });
      stripPairs(G.hands[0]).forEach(pair => toPile(pair));
      G.phase = 'play';
      render();
      await wait(300);
      let p = first;
      if (!G.hands[p].length) p = nextActive(p);
      while (active() > 1) {
        const q = nextActive(p);
        if (p === 0) await yourTurn(q); else await cpuTurn(p, q);
        p = nextActive(p);
      }
      await endHand();
    } catch (e) { if (e !== ABORT) throw e; }
  }
  const active = () => G.hands.filter(h => h.length).length;
  function nextActive(p) { let q = p; for (let k = 0; k < 4; k++) { q = (q + G.dir + 4) % 4; if (G.hands[q].length) return q; } return p; }
  function toPile(pair) { pair.forEach(c => G.pile.push({ c, x: (Math.random() - 0.5) * 70, y: (Math.random() - 0.5) * 26, a: (Math.random() - 0.5) * 50 })); }
  // 电脑手里的牌怎么摆：心态决定乌龟藏在哪
  function arrange(p) {
    const h = G.hands[p], m = G.seats[p] && G.seats[p].mind, t = h.find(isTurtle);
    if (!m || !t) return;
    if (m.hide === 'right') { h.splice(h.indexOf(t), 1); h.push(t); }
    if (m.hide === 'middle') { h.splice(h.indexOf(t), 1); h.splice(Math.floor(h.length / 2), 0, t); }
  }
  // 电脑自己翘起来给你看的那张（好心翘乌龟、下套翘一张不是乌龟的）
  function cpuRaised(p) {
    const h = G.hands[p], m = G.seats[p].mind;
    if (m.raise === 'turtle') return h.findIndex(isTurtle);
    if (m.raise === 'decoy') {
      if (G.decoy && G.decoy.p === p && h.indexOf(G.decoy.c) >= 0) return h.indexOf(G.decoy.c);
      const others = h.filter(c => !isTurtle(c));
      if (!others.length) return -1;
      G.decoy = { p, c: others[Math.floor(Math.random() * others.length)] };
      return h.indexOf(G.decoy.c);
    }
    return -1;
  }
  // p 从 q 手里抽第 i 张；凑成对就扔；没牌了就走
  async function take(p, q, i) {
    const card = G.hands[q].splice(i, 1)[0];
    if (p === 0) { G.hands[0].push(card); G.newId = card.id; }
    else G.hands[p].splice(Math.floor(Math.random() * (G.hands[p].length + 1)), 0, card);
    if (G.raised === card.id) G.raised = null;
    if (q === 0 && p > 0 && isTurtle(card) && G.seats[p].mind.draw === 'grudge') G.seats[p].grudge = true;
    render();
    await fly(q, p, p === 0 ? card : null);
    const pairs = stripPairs(G.hands[p]);
    if (pairs.length) { await wait(250); pairs.forEach(pair => toPile(pair)); if (p === 0) G.newId = null; }
    arrange(p); if (q > 0) arrange(q);
    render();
    for (const x of [q, p]) if (!G.hands[x].length && !G.gone.has(x)) { G.gone.add(x); if (x > 0) say(x, L.out); status(L.stOut(seatName(x))); }
  }
  // 轮到你：那家的牌伸到中间，点一下指、再点一下抽
  async function yourTurn(q) {
    G.phase = 'draw'; G.src = q; G.pointed = -1; G.tells = new Map();
    status(L.stYou(seatName(q)));
    const m = G.seats[q].mind;
    render();
    if (m.raise && cpuRaised(q) >= 0) say(q, m.raiseSay);
    const i = await new Promise((res, rej) => { const tok = G.tok; G.onPick = k => (G && G.tok === tok ? res(k) : rej(ABORT)); });
    const card = G.hands[q][i], tell = G.tells.get(card.id);
    if (tell && tell.slow) { say(q, tell.say); await wait(900); }   // 犹豫：想半天才松手
    G.phase = 'play'; G.src = -1; G.pointed = -1;
    await take(0, q, i);
    await wait(250);
  }
  async function cpuTurn(p, q) {
    status(L.stCpu(seatName(p), seatName(q)));
    await wait(650);
    let i;
    const h = G.hands[q];
    if (q === 0) i = pickFromYou(p);
    else i = Math.floor(Math.random() * h.length);
    await take(p, q, i);
    await wait(250);
  }
  // 电脑从你手里怎么抽：看它这盘的心态
  function pickFromYou(p) {
    const h = G.hands[0], n = h.length, r = G.raised != null ? h.findIndex(c => c.id === G.raised) : -1, seat = G.seats[p];
    const any = list => list[Math.floor(Math.random() * list.length)];
    const all = [...h.keys()], notRaised = all.filter(k => k !== r);
    switch (seat.mind.draw) {
      case 'raised': return r >= 0 ? r : any(all);
      case 'avoid': return any(notRaised.length ? notRaised : all);
      case 'left': return 0;
      case 'right': return n - 1;
      case 'grudge': {
        if (!seat.grudge) return any(all);
        const safe = notRaised.filter(k => k !== 0 && k !== n - 1);
        return any(safe.length ? safe : notRaised.length ? notRaised : all);
      }
      default: return any(all);
    }
  }
  // 你指着 q 手里第 i 张：它有没有反应（同一轮指同一张，反应不变）
  function point(i) {
    const q = G.src, card = G.hands[q][i], m = G.seats[q].mind, t = m.tell;
    const now = Date.now();
    G.points = G.points.filter(x => now - x < 10000).concat(now);
    if (G.points.length >= 30) { G.points = []; G.tok++; setTimeout(() => { if (OS.boot.state === 'desktop') OS.ui.bsod(BSOD(seatName(q))); }, 400); return; }
    G.pointed = i;
    render();
    if (!t) return;
    if (!G.tells.has(card.id)) {
      let r = null;
      const mid = Math.floor(G.hands[q].length / 2);
      if (t.any) r = { say: t.say, mood: t.mood };
      else if (t.middle) r = i === mid ? { say: t.say, mood: t.mood } : null;
      else if (t.flip) { const lie = Math.random() < t.flip; r = { say: isTurtle(card) === lie ? t.yes : t.no }; }
      else if (t.turtle && isTurtle(card) && Math.random() < t.turtle) r = { say: t.say, mood: t.mood, slow: t.slow };
      G.tells.set(card.id, r);
    }
    const r = G.tells.get(card.id);
    if (r && !r.slow) { say(q, r.say); if (r.mood) mood(q, r.mood); }
    if (r && r.slow) say(q, r.say);
  }

  /* ---------- 一局打完：乌龟爬过桌子，记分 ---------- */
  async function endHand() {
    const loser = G.hands.findIndex(h => h.length);
    G.phase = 'reveal';
    G.loser = loser;
    status(L.stTurtle(seatName(loser)));
    render();
    crawl();
    await wait(2600);
    G.scores[loser] += 13;
    if (loser === 0) { S.stats.turtles++; persist(); }
    const row = [0, 0, 0, 0]; row[loser] = 13; G.rounds.push(row);
    await new Promise(res => scoreSheet(res));
    await wait(0);   // 看得分表的时候换了一盘 ／ 关了窗口：这一盘就不往下走了
    if (G.scores.some(s => s >= 52)) { await revealMinds(); return; }
    nextHand();
  }

  /* ---------- 一盘打完：一家家揭晓心态，跟你标的比 ---------- */
  async function revealMinds() {
    G.phase = 'over';
    render();
    let marked = 0, right = 0;
    for (let p = 1; p < 4; p++) {
      const seat = G.seats[p], R = ROSTER[seat.key];
      seat.shown = true;
      if (!seat.mark) { seat.result = 'plain'; say(p, R.plain(seat.mind.id), 2200); }
      else {
        marked++;
        if (seat.mark === seat.mind.id) { right++; seat.result = 'ok'; say(p, R.ok, 2200); mood(p, 'hop'); OS.sound.play('ding'); }
        else { seat.result = 'bad'; say(p, R.bad, 2200); mood(p, 'shake'); OS.sound.play('error'); }
      }
      render();
      await wait(1800);
    }
    const perfect = right === 3;
    if (perfect) {
      for (let p = 1; p < 4; p++) { say(p, '服了！', 2600); mood(p, 'hop'); }
      status(L.stPerfect);
      OS.sound.play('clap');
      confetti();
      await wait(2600);
    }
    const t = S.stats, min = Math.min(...G.scores);
    t.matches++; t.marked += marked; t.right += right; if (perfect) t.perfect++;
    if (G.scores[0] === min) t.wins++;
    persist();
    const loser = G.scores.indexOf(Math.max(...G.scores));
    const winners = [0, 1, 2, 3].filter(i => G.scores[i] === min).map(seatName).join('、');
    const tok = G.tok;
    const v = await OS.ui.dialog({ title: NAME, icon: 'info', text: L.over(seatName(loser), G.scores[loser] / 13, winners), buttons: [L.again, L.quitGame] });
    if (v === L.again && win && G && G.tok === tok) newMatch();
  }

  /* ================= 画 ================= */
  const CW = 44, CH = 59, SW = 26, SH = 35;
  const TW = () => ui.table.clientWidth, TH = () => ui.table.clientHeight;
  const place = (n, x, y) => { n.style.left = x + 'px'; n.style.top = y + 'px'; return n; };
  // 每家的位置：头像、名字、标记框、手里牌背的起点
  function seatGeo(p) {
    const w = TW(), h = TH();
    if (p === 1) return { ax: 8, ay: 60, tx: 2, ty: 92, align: 'left', fan: (k) => ({ x: 80, y: 40 + k * 8 }), bub: { x: 40, y: 58 } };
    if (p === 2) return { ax: w / 2 - 110, ay: 4, tx: w / 2 - 78, ty: 4, align: 'left', fan: (k) => ({ x: w / 2 - 6 + k * 8, y: 4 }), bub: { x: w / 2 - 78, y: 42 } };
    if (p === 3) return { ax: w - 36, ay: 60, tx: w - 78, ty: 92, align: 'right', fan: (k) => ({ x: w - 80 - SW, y: 40 + k * 8 }), bub: { x: w - 168, y: 58 } };
    return { ax: 8, ay: h - 52, tx: 2, ty: h - 22, align: 'left' };
  }
  function handGeo(n) {
    const w = TW(), s = n > 1 ? Math.min(26, (w - 120 - CW) / (n - 1)) : 0;
    return { x0: Math.round((w - (CW + s * (n - 1))) / 2) + 20, s, y: TH() - CH - 6 };
  }
  function rowGeo(n) {
    const w = TW(), s = n > 1 ? Math.min(50, (w - 180 - CW) / (n - 1)) : 0;
    return { x0: Math.round((w - (CW + s * (n - 1))) / 2), s, y: 78 };
  }
  function render() {
    if (!ui || !G) return;
    const t = ui.layer;
    t.textContent = '';
    // 桌子中间：扔掉的对子、方向箭头
    const cx = TW() / 2, cy = 128;
    G.pile.slice(-24).forEach(o => { const n = place(C.face(o.c), cx - SW / 2 + o.x, cy - SH / 2 + o.y); n.classList.add('hd-small'); n.style.transform = 'rotate(' + o.a + 'deg)'; t.appendChild(n); });
    t.appendChild(place(el('div', { class: 'hd-arrow' + (G.dir < 0 ? ' r' : ''), html: '<svg viewBox="0 0 40 20"><path d="M2 10l10-8v5h26v6H12v5z" fill="#fff" stroke="#035" stroke-width="1"/></svg>' }), cx - 20, 50));
    if (G.phase === 'discard') {
      const b = el('button', { class: 'xpbtn hd-go', text: L.discard });
      b.dataset.go = 1;
      t.appendChild(place(b, cx - 45, 112));
    }
    // 三家：头像、名字、标记框、手里的牌背
    for (let p = 1; p < 4; p++) {
      const g = seatGeo(p), seat = G.seats[p], h = G.hands[p];
      const av = place(OS.iconEl(ROSTER[seat.key].icon, 'hd-ava' + (G.moods[p] ? ' m-' + G.moods[p] : '') + (G.loser === p && G.phase === 'reveal' ? ' turtle' : '')), g.ax, g.ay);
      t.appendChild(av);
      t.appendChild(place(el('div', { class: 'hd-name ' + g.align, text: seatName(p) + '　' + G.scores[p] }), g.tx, g.ty));
      const slot = el('div', { class: 'hd-mark ' + g.align + (seat.result ? ' ' + seat.result : ''), text: seat.shown ? (seat.result === 'bad' ? '✗ ' : seat.result === 'ok' ? '✓ ' : '') + seat.mind.id : (seat.mark || L.unknown) + ' ▾' });
      slot.dataset.mark = p;
      t.appendChild(place(slot, g.tx, g.ty + 14));
      if (G.src !== p) h.forEach((c, k) => { const f = g.fan(k), b = C.back(); b.classList.add('hd-small'); t.appendChild(place(b, f.x, f.y)); });
      if (G.says[p]) t.appendChild(place(el('div', { class: 'hd-say ' + g.align, text: G.says[p] }), g.bub.x, g.bub.y));
    }
    // 你：头像、名字，手里的牌
    const g0 = seatGeo(0);
    t.appendChild(place(OS.iconEl(OS.save.get('avatar', 'duck'), 'hd-ava' + (G.loser === 0 && G.phase === 'reveal' ? ' turtle' : '')), g0.ax, g0.ay));
    t.appendChild(place(el('div', { class: 'hd-name', text: seatName(0) + '　' + G.scores[0] }), g0.tx, g0.ty));
    const hg = handGeo(G.hands[0].length);
    const pairsLit = G.phase === 'discard' ? new Set([].concat(...stripPairs(G.hands[0].slice()).map(pr => pr.map(c => c.id)))) : null;
    G.hands[0].forEach((c, k) => {
      const n = turtleFace(c);
      let y = hg.y;
      if (G.raised === c.id) y -= 12;
      if (pairsLit && pairsLit.has(c.id)) n.classList.add('hd-lit');
      if (G.newId === c.id) n.classList.add('hd-new');
      n.classList.add('hd-mine');
      n.dataset.mine = k;
      t.appendChild(place(n, hg.x0 + k * hg.s, y));
    });
    // 轮到你抽：那家的牌伸到中间摊成一排
    if (G.phase === 'draw' && G.src > 0) {
      const h = G.hands[G.src], rg = rowGeo(h.length), cr = cpuRaised(G.src);
      h.forEach((c, k) => {
        const b = C.back();
        b.classList.add('hd-row');
        if (k === cr) b.classList.add('hd-up');
        if (k === G.pointed) b.classList.add('hd-pointed');
        b.dataset.row = k;
        t.appendChild(place(b, rg.x0 + k * rg.s, rg.y - (k === G.pointed ? 14 : k === cr ? 8 : 0)));
      });
    }
    // 乌龟亮出来
    if (G.phase === 'reveal' && G.loser != null) {
      const q = G.hands[G.loser][0];
      if (q) { const n = turtleFace(q); n.classList.add('hd-big'); t.appendChild(place(n, TW() / 2 - CW / 2, 80)); }
    }
  }
  // 冒一句话
  function say(p, text, ms) {
    G.says[p] = text;
    render();
    const tok = G.tok;
    clearTimeout(G['sayT' + p]);
    G['sayT' + p] = setTimeout(() => { if (G && G.tok === tok && G.says[p] === text) { delete G.says[p]; render(); } }, ms || 1500);
  }
  function mood(p, m) {
    G.moods[p] = m;
    render();
    const tok = G.tok;
    setTimeout(() => { if (G && G.tok === tok && G.moods[p] === m) { delete G.moods[p]; render(); } }, 700);
  }
  // 一张牌从一家飞到另一家（电脑之间是牌背）
  function anchor(p) {
    const g = seatGeo(p);
    if (p === 0) return { x: TW() / 2, y: TH() - CH };
    if (G.src === p) return { x: TW() / 2 - CW / 2, y: 78 };
    return g.fan(Math.max(0, G.hands[p].length - 1));
  }
  function fly(from, to, faceCard) {
    const a = anchor(from), b = anchor(to);
    const n = faceCard ? turtleFace(faceCard) : C.back();
    n.classList.add('hd-small', 'hd-fly');
    place(n, a.x, a.y);
    ui.fx.appendChild(n);
    void n.offsetWidth;
    place(n, b.x, b.y);
    return wait(330).then(() => n.remove(), e => { n.remove(); throw e; });
  }
  // 乌龟慢慢爬过桌子
  function crawl() {
    const n = el('div', { class: 'hd-turtle' });
    ui.fx.appendChild(place(n, -70, 92));
    void n.offsetWidth;
    n.style.transform = 'translateX(' + (TW() + 80) + 'px)';
    setTimeout(() => n.remove(), 3400);
  }
  // 全看穿：撒彩纸
  function confetti() {
    const w = TW(), h = TH(), k = Math.min(3, (window.devicePixelRatio || 1) * (OS.stage.scale || 1));
    const cv = el('canvas', { class: 'hd-confetti' });
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    ui.fx.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.scale(k, k);
    const COL = ['#ff4040', '#ffd700', '#40c0ff', '#ff80ff', '#80ff80', '#ff9a30'];
    const bits = Array.from({ length: 90 }, () => ({ x: Math.random() * w, y: -Math.random() * h, vy: 0.8 + Math.random() * 1.6, vx: (Math.random() - 0.5) * 0.8, a: Math.random() * 6, c: COL[Math.floor(Math.random() * COL.length)] }));
    let f = 0;
    const step = () => {
      if (!ui || ++f > 170) { cv.remove(); return; }
      ctx.clearRect(0, 0, w, h);
      bits.forEach(b => { b.y += b.vy; b.x += b.vx; b.a += 0.15; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillStyle = b.c; ctx.fillRect(-3, -1.5, 6, 3); ctx.restore(); });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- 点 ／ 拖 ---------- */
  let drag = null;
  function onDown(e) {
    if (!G) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const go = e.target.closest('[data-go]');
    if (go) { OS.sound.play('click'); if (G.onDiscard) { const f = G.onDiscard; G.onDiscard = null; f(); } return; }
    const mk = e.target.closest('[data-mark]');
    if (mk) { markMenu(+mk.dataset.mark, mk); return; }
    const row = e.target.closest('[data-row]');
    if (row && G.phase === 'draw') {
      const i = +row.dataset.row;
      if (i === G.pointed && G.onPick) { const f = G.onPick; G.onPick = null; f(i); }
      else point(i);
      return;
    }
    const mine = e.target.closest('[data-mine]');
    if (mine && G.phase !== 'deal' && G.phase !== 'reveal' && G.phase !== 'over') {
      drag = { id: e.pointerId, k: +mine.dataset.mine, n: mine, p0: OS.stage.toLocal(e.clientX, e.clientY), x0: parseFloat(mine.style.left), y0: parseFloat(mine.style.top), moved: false };
    }
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const p = OS.stage.toLocal(e.clientX, e.clientY), dx = p.x - drag.p0.x;
    if (!drag.moved && Math.abs(dx) < 5) return;
    drag.moved = true;
    drag.dx = dx;
    drag.n.classList.add('hd-drag');
    place(drag.n, drag.x0 + dx, drag.y0);
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!G || e.type !== 'pointerup') { render(); return; }
    const h = G.hands[0];
    if (!d.moved) {
      // 点一下：翘起来给下家看（再点放下）
      const id = h[d.k] && h[d.k].id;
      G.raised = G.raised === id ? null : id;
      render();
      return;
    }
    // 拖：按落下的位置换顺序
    const hg = handGeo(h.length), to = Math.max(0, Math.min(h.length - 1, Math.round((d.x0 + d.dx - hg.x0) / (hg.s || 1))));
    const c = h.splice(d.k, 1)[0];
    h.splice(to, 0, c);
    render();
  }
  // 头像下面的框：标"我觉得它是哪种"
  function markMenu(p, node) {
    if (G.phase === 'over') return;
    const seat = G.seats[p], r = OS.stage.rectOf(node);
    const items = [{ label: L.noMark, checked: !seat.mark, action: () => { seat.mark = null; render(); } }, '-']
      .concat(ROSTER[seat.key].minds.map(m => ({ label: m.id + '——' + m.note, checked: seat.mark === m.id, action: () => { seat.mark = m.id; render(); } })));
    OS.ui.contextMenu(items, r.left, r.bottom);
  }

  /* ---------- 菜单 ---------- */
  const sayDlg = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });
  function menuFor(m) {
    if (m === '游戏(G)') return [
      { label: L.newGame, action: () => newMatch() },
      '-',
      { label: L.score, disabled: !G, action: () => scoreSheet() },
      { label: L.stats, action: statsDialog },
      { label: L.options, action: optionsDialog },
      { label: L.back, action: () => C.pickBack() },
      '-',
      { label: L.quit, action: () => win && win.close() }
    ];
    return [{ label: L.help, action: sayDlg(L.help, 'help', L.helpText) }, '-', { label: L.about, action: sayDlg(L.about, 'info', L.aboutText) }];
  }
  // 得分表：一行一局，最后一行总分（照原版）
  function scoreSheet(done) {
    if (!G) { if (done) done(); return; }
    const names = [0, 1, 2, 3].map(seatName);
    const tbl = el('table', { class: 'hd-sheet' }, [el('tr', {}, names.map(n => el('th', { text: n })))]
      .concat(G.rounds.map(r => el('tr', {}, r.map(v => el('td', { text: String(v) })))))
      .concat([el('tr', { class: 'sum' }, G.scores.map(v => el('td', { text: String(v) })))]));
    const ok = el('button', { class: 'xpbtn default', text: L.ok });
    const w = OS.wm.open({ title: L.scoreTitle, width: 260, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'hd-sheetw' }, [tbl, el('div', { class: 'dlg-btns' }, [ok])]), onClose: () => { if (done) done(); } });
    ok.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
  }
  function statsDialog() {
    OS.ui.dialog({ title: L.statsTitle, icon: 'info', text: L.statsText(S.stats), buttons: [L.clear, L.ok] }).then(v => {
      if (v !== L.clear) return;
      S.stats = { matches: 0, wins: 0, turtles: 0, marked: 0, right: 0, perfect: 0 };
      persist();
    });
  }
  function optionsDialog() {
    const nm = 'hd' + Date.now();
    const radios = L.speeds.map((s, k) => { const i = el('input', { type: 'radio', name: nm }); i.checked = S.speed === k; return i; });
    const inputs = Object.keys(ROSTER).map(k => { const i = el('input', { class: 'xl-input hd-nm', type: 'text', maxlength: '8' }); i.value = nameOf(k); i.dataset.k = k; return i; });
    const ok = el('button', { class: 'xpbtn default', text: L.ok }), no = el('button', { class: 'xpbtn', text: L.cancel });
    const w = OS.wm.open({ title: L.optTitle, width: 270, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog',
      content: el('div', { class: 'jp-opts' }, [
        el('fieldset', { class: 'cp-group' }, [el('legend', { text: L.speed }), el('div', { class: 'hd-speeds' }, radios.map((r, k) => el('label', { class: 'jp-opt' }, [r, el('span', { text: L.speeds[k] })])))]),
        el('fieldset', { class: 'cp-group' }, [el('legend', { text: L.names }), el('div', { class: 'hd-names' }, inputs)]),
        el('div', { class: 'dlg-btns' }, [ok, no])
      ]) });
    no.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
    ok.addEventListener('click', () => {
      OS.sound.play('click');
      S.speed = radios.findIndex(r => r.checked);
      S.names = {};
      inputs.forEach(i => { const v = i.value.trim(); if (v && v !== ROSTER[i.dataset.k].name) S.names[i.dataset.k] = v; });
      persist();
      w.close();
      render();
    });
  }
})();
