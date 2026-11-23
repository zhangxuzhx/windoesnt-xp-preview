/* 2027暴富秘籍.rar
   双击 = 用“解压专家 2003”打开压缩包，看到里面有 3 个文件。
   双击里面的文件 → 提示“要查看需要先解压” → [解压] → 解压到临时文件夹（所以桌面上不会多出文件）：
     3 秒冲到 99.69%，然后卡死，剩余时间 48 年。
     [拍显示器]：整个屏幕一震，进度掉回 98%，再爬回 99.69% 卡住（没用）。
     [给拨号猫磕一个]：涨 0.01%，磕 31 个才到 100%。
   秘籍那张图会卡在 99.69%；两个 txt 直接解压完。解压完打开你点的那个文件：秘籍是一张糊图“想得美”，txt 用记事本打开。
   “解压到……”这类会真往桌面放文件的操作，一律失败（不然桌面上该多出文件了）。
   蓝屏彩蛋：同一次解压里拍显示器 5 次，显示器申请工伤。
   桌面上的右键菜单是压缩包专属的；压缩包窗口里每个文件也能右键。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.rich;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  const TOOL = '解压专家 2003';
  const RAR = '2027暴富秘籍.rar';
  const WIN_TITLE = RAR + ' - ' + TOOL;
  const STATUS = '共 3 个文件　压缩后 2.7 GB（评估版已过期 8000 天，请购买正版）';
  const NEED_UNZIP = name => '要查看「' + name + '」，\n需要先解压。\n\n现在解压吗？';
  const EX_TITLE = '正在解压 - ' + RAR;
  const FROM_TO = '从「' + RAR + '」到「临时文件夹」';
  // 往外解压的，一律失败（压缩包现在住在「新建文件夹(2)」最外面那层）
  const FAIL_EXTRACT = say('解压文件', 'error', '解压失败：磁盘空间不足。\n需要 2.7 GB，你的硬盘只剩 3 KB。');
  const FAIL_HERE = say('解压到当前文件夹', 'warn', '解压失败：当前文件夹是「新建文件夹(2)」。\n这里已经住满了。');
  const FAIL_FOLDER = say('解压到 2027暴富秘籍\\', 'error', '解压失败：无法创建文件夹「2027暴富秘籍」。\n这个文件夹要等到 2027 年才能建。');
  const DONE = '解压完成。';
  const STUCK = 99.69, SLAP_TO = 98, KOWTOW = 0.01;   // 卡在 99.69%，要磕 31 个头
  const STUCK_MONTHS = 48 * 12 + 3;            // 卡住时：剩余 48 年 3 个月
  const SLAP_LIMIT = 5;
  const CANCEL_Q = p => '已经 ' + p + ' 了，\n现在放弃，马上就能暴富了。\n确定不再坚持一下吗？';
  const NEWS = '本台消息：一网友刚刚解压出暴富秘籍，经鉴定，内容只有三个艺术字，甚至不如葫芦娃。';
  const BSOD = { id: 'rich', name: 'MONITOR_WORK_INJURY', text: '检测到显像管被连续拍打 5 次。大屁股显示器已申请工伤。' };
  const TEST_OK = '测试完成：压缩包完好无损。\n不含木马，只含惊喜。';
  const INFO = '类型：RAR 压缩文件\n大小：2.7 GB\n压缩率：烫烫烫烫烫烫烫烫烫烫烫烫烫\n创建时间：2027 年 4 月 1 日\n打开方式：' + TOOL + '（40 天试用版）';

  // 压缩包里的文件
  const FILES = [
    { name: '2027暴富秘籍_珍藏高清版.jpg', icon: 'paint', size: '3 KB', packed: '2.7 GB', type: 'JPEG 图像', pic: true, locked: true },
    { name: '解压前必看.txt', icon: 'diary', size: '1 KB', packed: '1 KB', type: '文本文档', text: '解压前必看：\n\n请先解压。\n\n—— 楼主好人一生平安' },
    { name: '下载后24小时内请删除.txt', icon: 'diary', size: '1 KB', packed: '1 KB', type: '文本文档', text: '本秘籍仅供个人学习研究，\n请在暴富后 24 小时内自觉删除。\n\n如果没暴富，请一直留着。' }
  ];
  const SECRET = FILES[0];
  // 秘籍加了密：密码是“楼主家的门牌号”，在新建文件夹(2) 最里面“家”的详细信息 / 属性里（OS.HOUSE_NO，folder2.js 里定的）
  const COMMENT = '注释：解压密码是楼主家的门牌号。';
  const PW_TITLE = '输入密码';
  const PW_TEXT = name => '请为加密文件输入密码：\n' + name;
  const PW_WRONG = '解压失败：密码错误。\n文件已加密，或者你根本不知道密码。';
  const PW_WRONG_HINT = '解压失败：密码又错了。\n提示：看看压缩文件下面的注释。';
  const pwKnown = () => !!OS.save.get('rich', {}).pw;

  const fmt = p => p.toFixed(2) + '%';
  function remain(p) {
    if (p < STUCK) return '约 ' + Math.max(1, Math.ceil((STUCK - p) / 33)) + ' 秒';
    const m = Math.round((100 - p) / (100 - STUCK) * STUCK_MONTHS);
    if (m <= 0) return '马上就好';
    const y = Math.floor(m / 12), mm = m % 12;
    return '约 ' + (y ? y + ' 年' : '') + (y && mm ? ' ' : '') + (mm ? mm + ' 个月' : '');
  }

  /* ---------- 1. 压缩包窗口：工具栏 + 文件列表 ---------- */
  app.open = function () {
    let sel = null, lastTap = null;
    const tool = (icon, label, fn) => {
      const b = el('button', { class: 'ar-tool' }, [OS.iconEl(icon, 'ar-tico'), el('span', { text: label })]);
      b.addEventListener('click', () => { OS.sound.play('click'); fn(); });
      return b;
    };
    const rows = FILES.map(f => {
      const r = el('div', { class: 'ar-row' }, [
        el('span', { class: 'ar-name' }, [OS.iconEl(f.icon, 'ar-ico'), el('span', { text: f.name + (f.locked ? '*' : '') })]),   // 加 * 的是加密文件（老解压软件就这么标）
        el('span', { class: 'ar-c', text: f.size }),
        el('span', { class: 'ar-c', text: f.packed }),
        el('span', { class: 'ar-t', text: f.type })
      ]);
      // 跟桌面一样：点一下选中，连点两下打开
      r.addEventListener('click', () => {
        select(r);
        const now = Date.now();
        if (lastTap && lastTap.f === f && now - lastTap.t < OS.dblMs()) { lastTap = null; askUnzip(f); }
        else lastTap = { f, t: now };
      });
      OS.ui.onContext(r, () => { select(r); lastTap = null; return rowMenu(f); });
      return r;
    });
    function select(r) { if (sel) sel.classList.remove('sel'); sel = r; r.classList.add('sel'); }

    const content = el('div', { class: 'ar' }, [
      el('div', { class: 'ar-tools' }, [
        tool('folder', '解压到', FAIL_EXTRACT),
        tool('detector', '测试', say('测试压缩文件', 'info', TEST_OK)),
        tool('info', '信息', say(RAR + ' 属性', 'info', INFO))
      ]),
      el('div', { class: 'ar-path' }, [OS.iconEl('rar', 'ar-ico'), el('span', { text: RAR + '\\' })]),
      el('div', { class: 'ar-list' }, [
        el('div', { class: 'ar-row ar-head' }, [el('span', { class: 'ar-name', text: '名称' }), el('span', { class: 'ar-c', text: '大小' }), el('span', { class: 'ar-c', text: '压缩后' }), el('span', { class: 'ar-t', text: '类型' })])
      ].concat(rows)),
      el('div', { class: 'ar-comment', text: COMMENT }),
      el('div', { class: 'ar-status', text: STATUS })
    ]);
    return OS.wm.open({ title: WIN_TITLE, icon: app.icon, width: 376, appId: app.id, content });
  };

  function askUnzip(f) {
    OS.sound.play('click');
    OS.ui.dialog({ title: TOOL, icon: 'info', text: NEED_UNZIP(f.name), buttons: ['解压', '取消'] })
      .then(v => {
        if (v !== '解压') return;
        if (f.locked && !pwKnown()) askPassword(f); else extract(f);
      });
  }

  // 输入密码框（像老解压软件那样：密码打出来是一串点，可以勾“显示密码”）
  let pwWrong = 0;
  function askPassword(f) {
    const input = el('input', { class: 'pw-input', type: 'password', autocomplete: 'off', inputmode: 'numeric' });
    const show = el('input', { type: 'checkbox' });
    show.addEventListener('change', () => { input.type = show.checked ? 'text' : 'password'; });
    const ok = el('button', { class: 'xpbtn default', text: '确定' });
    const cancel = el('button', { class: 'xpbtn', text: '取消' });
    const content = el('div', { class: 'dlg pw' }, [
      el('div', { class: 'dlg-main' }, [OS.iconEl('lock', 'dlg-icon'), el('div', { class: 'dlg-text', text: PW_TEXT(f.name) })]),
      el('div', { class: 'pw-row' }, [el('span', { text: '输入密码：' }), input]),
      el('label', { class: 'pw-show' }, [show, el('span', { text: '显示密码' })]),
      el('div', { class: 'dlg-btns' }, [ok, cancel])
    ]);
    const w = OS.wm.open({ title: PW_TITLE, width: 300, content, modal: true, taskbar: false, minimizable: false, maximizable: false, className: 'is-dialog' });
    OS.sound.play('ding');
    setTimeout(() => { try { input.focus(); } catch (_) { /* ignore */ } }, 50);
    const submit = () => {
      OS.sound.play('click');
      const v = input.value.trim();
      w.close();
      if (v === OS.HOUSE_NO) {
        const s = OS.save.get('rich', {});
        s.pw = true;
        OS.save.set('rich', s);
        extract(f);
      } else {
        pwWrong++;
        OS.ui.dialog({ title: TOOL, icon: 'error', text: pwWrong >= 2 ? PW_WRONG_HINT : PW_WRONG });
      }
    };
    ok.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    cancel.addEventListener('click', () => { OS.sound.play('click'); w.close(); });
  }

  // 压缩包窗口里，文件的右键菜单
  function rowMenu(f) {
    return [
      { label: '查看文件', bold: true, action: () => askUnzip(f) },
      { label: '解压文件…', action: FAIL_EXTRACT },
      '-',
      { label: '删除文件', action: say('删除文件', 'error', '删不掉：秘籍受到保护。') },
      { label: '重命名', action: say('重命名', 'warn', '压缩包里的文件不能改名。\n改了就不灵了。') },
      '-',
      { label: '属性', action: say('「' + f.name + '」属性', 'info', '类型：' + f.type + '\n大小：' + f.size + '\n压缩后：' + f.packed + (f.locked ? '\n加密：是' : '') + '\n修改时间：2027-04-01') }
    ];
  }

  /* ---------- 2. 解压：冲到 99.9% 卡死 ---------- */
  let running = null;   // 同一时间只开一个解压窗口
  function extract(file) {
    if (running && !running.isClosed) { OS.wm.focus(running); return running; }
    const stats = Object.assign({ runs: 0, done: 0, kowtows: 0, slaps: 0 }, OS.save.get('rich', {}));
    stats.runs++;
    OS.save.set('rich', stats);
    let p = 0, busy = true, slaps = 0, dead = false, tick = 0;

    const fill = el('div', { class: 'bc-fill rx-fill' });
    const pct = el('span', { class: 'rx-pct', text: fmt(0) });
    const left = el('span', { class: 'rx-left' });
    const plus = el('div', { class: 'rx-plus' });
    const slapBtn = el('button', { class: 'xpbtn', text: '拍显示器' });
    const kowBtn = el('button', { class: 'xpbtn default', text: '给拨号猫磕一个' });
    const cancelBtn = el('button', { class: 'xpbtn', text: '取消' });
    const content = el('div', { class: 'rx' }, [
      // 两个图标之间飞纸片（XP 复制文件的那个动画）
      el('div', { class: 'rx-anim' }, [OS.iconEl('rar', 'rx-from'), el('div', { class: 'rx-paper' }), OS.iconEl('folder', 'rx-to')]),
      el('div', { class: 'rx-name', text: '正在解压：' + file.name }),
      el('div', { class: 'rx-sub', text: FROM_TO }),
      el('div', { class: 'bc-bar rx-bar' }, [fill]),
      el('div', { class: 'rx-row' }, [pct, left]),
      el('div', { class: 'rx-btns' }, [slapBtn, kowBtn, cancelBtn]),
      plus
    ]);
    const win = running = OS.wm.open({
      title: EX_TITLE, icon: app.icon, width: 320, content, maximizable: false,
      onClose: () => { dead = true; clearInterval(tick); }
    });

    // 只有秘籍那张图会卡在 99.69%；两个 txt 直接解压完
    const quick = !file.pic;
    function render() {
      fill.style.width = Math.min(100, p) + '%';
      pct.textContent = fmt(p);
      left.textContent = '剩余时间：' + (quick ? '约 1 秒' : remain(p));
      [slapBtn, kowBtn].forEach(b => { b.disabled = busy; });
    }
    // 往上冲：秘籍冲到 99.9% 卡住（第一次 3 秒，拍完显示器之后 1.2 秒）；txt 1.5 秒冲到 100%
    function rush(ms) {
      busy = true;
      const to = quick ? 100 : STUCK;
      const from = p, t0 = Date.now();
      clearInterval(tick);
      tick = setInterval(() => {
        if (dead) { clearInterval(tick); return; }
        const k = Math.min(1, (Date.now() - t0) / ms);
        p = from + (to - from) * (1 - Math.pow(1 - k, 3));
        if (k >= 1) {
          p = to;
          clearInterval(tick);
          if (quick) { finish(); return; }
          busy = false;
        }
        render();
      }, 100);
    }

    kowBtn.addEventListener('click', () => {
      if (busy) return;
      p = Math.min(100, Math.round((p + KOWTOW) * 100) / 100);
      stats.kowtows++;
      OS.save.set('rich', stats);
      OS.sound.play('thud');
      win.el.classList.remove('kowtow');
      void win.el.offsetWidth;
      win.el.classList.add('kowtow');
      plus.textContent = '+0.01%';
      plus.classList.remove('up');
      void plus.offsetWidth;
      plus.classList.add('up');
      render();
      if (p >= 100) finish();
    });

    slapBtn.addEventListener('click', () => {
      if (busy) return;
      slaps++;
      stats.slaps++;
      OS.save.set('rich', stats);
      OS.sound.play('slap');
      crtHit();
      if (slaps >= SLAP_LIMIT) { busy = true; render(); setTimeout(() => { if (!dead) OS.ui.bsod(BSOD); }, 450); return; }
      p = SLAP_TO;
      busy = true;
      render();
      setTimeout(() => { if (!dead) rush(1200); }, 500);
    });

    cancelBtn.addEventListener('click', () => {
      OS.sound.play('click');
      OS.ui.dialog({ title: TOOL, icon: 'help', text: CANCEL_Q(fmt(p)), buttons: ['放弃', '再等等'] })
        .then(v => { if (v === '放弃') win.close(); });
    });

    function finish() {
      busy = true;
      render();
      left.textContent = DONE;
      stats.done++;
      OS.save.set('rich', stats);
      setTimeout(() => {
        if (dead) return;
        win.close();
        openFile(file);
        if (file.pic) setTimeout(() => OS.ticker.interrupt(NEWS), 1500);
      }, 700);
    }

    render();
    rush(quick ? 1500 : 3000);
    return win;
  }

  /* ---------- 拍显示器的特效：整个屏幕一震，像显像管被拍花了 ----------
     红绿蓝三色错开、闪一下白、扫描线、一道亮条乱跳，再留一块彩虹色的“磁化斑”慢慢褪掉 */
  function ensureSplitFilter() {
    if (document.getElementById('crtSplit')) return;
    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    holder.innerHTML =
      '<svg width="0" height="0"><filter id="crtSplit" x="-5%" y="0" width="110%" height="100%" color-interpolation-filters="sRGB">' +
      '<feColorMatrix in="SourceGraphic" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/><feOffset in="r" dx="-5" result="r2"/>' +
      '<feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/><feOffset in="g" dy="2" result="g2"/>' +
      '<feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/><feOffset in="b" dx="5" result="b2"/>' +
      '<feBlend in="r2" in2="g2" mode="screen" result="rg"/><feBlend in="rg" in2="b2" mode="screen"/></filter></svg>';
    document.body.appendChild(holder);
  }
  function crtHit() {
    ensureSplitFilter();
    const st = OS.stage.el;
    st.classList.remove('slapped', 'crt-split');
    void st.offsetWidth;
    st.classList.add('slapped', 'crt-split');
    setTimeout(() => st.classList.remove('crt-split'), 380);
    setTimeout(() => st.classList.remove('slapped'), 500);
    // 磁化斑直接放在屏幕上（要给底下的画面“染色”，不能包在别的层里）
    const blot = el('div', { class: 'ch-blot' });
    blot.style.left = (160 + Math.random() * 200) + 'px';
    blot.style.top = (130 + Math.random() * 120) + 'px';
    const hit = el('div', { class: 'crt-hit' }, [el('div', { class: 'ch-fx' }, [el('div', { class: 'ch-lines' }), el('div', { class: 'ch-bar' })])]);
    st.appendChild(blot);
    st.appendChild(hit);
    setTimeout(() => { hit.remove(); blot.remove(); }, 2000);
  }

  /* ---------- 3. 解压出来的文件 ---------- */
  function openFile(f) {
    if (f.pic) viewer(f);
    else notepad(f);
  }
  // “珍藏高清版”秘籍：一张糊图。中间是 Word 2003 那种彩虹立体艺术字“想得美”，角落一行小水印
  const PIC_WORD = '想得美';
  const PIC_MARK = 'www.wuliaokeji.com.cn';
  function blurryPic() {
    const W = 240, H = 150, SHRINK = 3;
    // 1. 先按原尺寸画：米黄底 + 彩虹立体艺术字
    const art = document.createElement('canvas');
    art.width = W; art.height = H;
    const a = art.getContext('2d');
    const bg = a.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#fff6c8'); bg.addColorStop(1, '#ffd98a');
    a.fillStyle = bg; a.fillRect(0, 0, W, H);
    a.save();
    a.translate(W / 2, H / 2 + 4);
    a.transform(1, -0.12, 0.08, 1, 0, 0);          // 往右上斜一点，像艺术字的“上升”效果
    a.font = '900 54px "Microsoft YaHei", "PingFang SC", "Heiti SC", sans-serif';
    a.textAlign = 'center'; a.textBaseline = 'middle';
    for (let i = 9; i >= 1; i--) {                  // 立体：往右下叠一层层灰色
      a.fillStyle = 'rgb(' + (70 + i * 9) + ',' + (70 + i * 9) + ',' + (90 + i * 9) + ')';
      a.fillText(PIC_WORD, i, i);
    }
    const rb = a.createLinearGradient(-80, 0, 80, 0);
    ['#ff1a1a', '#ff9900', '#ffee00', '#22cc22', '#1a8cff', '#7a3cff'].forEach((c, i) => rb.addColorStop(i / 5, c));
    a.fillStyle = rb;
    a.fillText(PIC_WORD, 0, 0);
    a.lineWidth = 1.5;
    a.strokeStyle = '#3a2a66';
    a.strokeText(PIC_WORD, 0, 0);
    a.restore();
    // 2. 缩小再放大，糊掉
    const small = document.createElement('canvas');
    small.width = W / SHRINK; small.height = H / SHRINK;
    small.getContext('2d').drawImage(art, 0, 0, small.width, small.height);
    const big = document.createElement('canvas');
    big.width = W; big.height = H;
    const b = big.getContext('2d');
    b.imageSmoothingEnabled = true;
    b.drawImage(small, 0, 0, W, H);
    // 3. 角落的小水印（后加的，所以比图清楚一点）
    b.font = '9px Arial, sans-serif';
    b.textAlign = 'right'; b.textBaseline = 'bottom';
    b.fillStyle = 'rgba(90, 70, 40, .55)';
    b.fillText(PIC_MARK, W - 5, H - 3);
    b.fillStyle = 'rgba(255, 255, 255, .7)';
    b.fillText(PIC_MARK, W - 6, H - 4);
    // 假装是压缩过头的 JPG：一块一块的色斑
    for (let y = 0; y < H; y += 8) {
      for (let x = 0; x < W; x += 8) {
        if (Math.random() < 0.35) {
          b.fillStyle = 'rgba(' + (120 + Math.random() * 135 | 0) + ',' + (90 + Math.random() * 120 | 0) + ',' + (60 + Math.random() * 100 | 0) + ',0.12)';
          b.fillRect(x, y, 8, 8);
        }
      }
    }
    return big;
  }
  function viewer(f) {
    const pic = blurryPic();
    pic.className = 'rv-pic';
    // 角落的小水印：点一下把网址采集进 Internot Explorer 的地址栏（ie.js）
    const mark = el('span', { class: 'rv-mark' });
    mark.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); if (OS.web) OS.web.collect(PIC_MARK); });
    const content = el('div', { class: 'rv' }, [
      el('div', { class: 'rv-stage' }, [el('div', { class: 'rv-picw' }, [pic, mark])]),
      el('div', { class: 'rv-bar', text: f.name + '　240 × 150 像素　' + f.size })
    ]);
    OS.wm.open({ title: f.name + ' - 图片和传真查看器', icon: 'paint', width: 300, content, maximizable: false });
  }
  OS.richViewer = name => viewer({ name, size: '3 KB' });
  OS.richPic = () => blurryPic();   // 写字板 ▸ 插入 ▸ 对象 ▸ 我的图片 ▸ 想得美.jpg   // 我的图片 ▸ 想得美.jpg
  // txt：用记事本打开（notepad.js）
  function notepad(f) {
    OS.notepad.open({ name: f.name, text: f.text, where: { type: 'rar' } });
  }

  /* ---------- 桌面上：压缩包专属右键菜单 ---------- */
  app.menu = function () {
    const P = OS.menus.iconParts(app);
    const open = () => OS.apps.open(app.id);
    return [
      P.open,
      { label: '用「' + TOOL + '」打开', action: open },
      '-',
      { label: '解压文件…', action: FAIL_EXTRACT },
      { label: '解压到当前文件夹', action: FAIL_HERE },
      { label: '解压到 2027暴富秘籍\\', action: FAIL_FOLDER },
      { label: '添加到压缩文件…', action: say('添加到压缩文件', 'info', '它已经是压缩文件了，\n再压就碎了。') },
      { label: '测试压缩文件', action: say('测试压缩文件', 'info', TEST_OK) },
      '-',
      {
        label: '发送到', sub: [
          { label: '3½ 软盘 (A:)', action: say('发送到', 'error', '软盘只有 1.44 MB，装不下暴富。') },
          { label: '邮件接收者', action: say('发送到', 'warn', '发送失败：你的抠抠邮箱附件上限只有 5 MB。') },
          { label: '桌面快捷方式', action: P.shortcut.action }
        ]
      },
      '-',
      P.cut, P.copy,
      '-',
      P.shortcut, P.del, P.rename,
      '-',
      { label: '属性', action: say('「' + RAR + '」属性', 'info', INFO) }
    ];
  };
})();
