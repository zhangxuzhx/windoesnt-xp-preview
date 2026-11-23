/* 网上邻居（桌面）：你家这栋楼的局域网 —— 工作组「幸福小区 3 号楼」，全楼的电脑都能互相翻共享文件夹（2003 年小区宽带 / 宿舍局域网）
   - 打开是 XP 的文件夹窗口，一排邻居的电脑；双击先“正在连接……”，然后进去。
   - 每家共享了一个文件夹，里面的文件各有笑点，好几个跟别的软件联动：
     熊孩子的便利贴（物业电脑的密码）、王阿姨的“转发长寿”（发给抠抠好友）、大学生的电影（全下到 99%）、
     小卖部老板的账本（反过来是你欠老板的，能打欠条）、物业的投诉记录（你在新建文件夹(2) 敲门、掀屋顶的真实次数）、
     大学生的千万别点.exe（60 秒关机倒计时）和物业电脑里教你解除的转帖（学会 shutdown -a，见 cmd.js）、
     新建文件夹(2) 那户人家的“监控”（拍的是你的桌面）、你自己的电脑。
   - 物业的电脑要密码：屏幕上的数字键盘输入（也能直接敲键盘），密码是熊孩子便利贴上的物业手机号。
   - 蓝屏彩蛋：列表里有两台“你”。双击第二台：IP 地址冲突气泡 → 再点两台电脑打起来 → 第三次蓝屏 IP_ADDRESS_CONFLICT。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.network;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const NAME = '网上邻居';
  const GROUP = '幸福小区 3 号楼';
  const PHONE = '13804040404';   // 物业的手机号 = 物业电脑的密码（写在熊孩子的便利贴上）
  const L = {
    connecting: n => '正在连接 \\\\' + n + ' ……',
    locked: '\\\\家 无法访问。\n门从里面反锁了。',
    me: '你正在访问你自己。',
    addPlace: '邻居不是你想加就能加的。',
    connView: '本地连接：已连接\n网线被老鼠咬了一半，速度 1.5 KB/s。',
    find: '搜索完毕，共找到 0 台。\n邻居的隐私都在你眼前了。',
    copy: '复制失败：网速 1.5 KB/s，\n复制完要等到明年。',
    mapDrive: '映射失败：建议可以给拨号猫喂食。',
    unmapDrive: '已成功断开一条并不存在的网络驱动器。',
    fav: '已收藏。\n邻居们并不知道。',
    opts: '文件夹选项：\n☑ 显示邻居共享的东西\n☐ 假装没看见',
    help: '网络问题，请咨询楼下物业。\n（物业下午不在）',
    refreshing: '正在搜索 ' + GROUP + ' ……',
    readonly: '只读'
  };
  // 设置家庭网络向导：一路“下一步”，最后让你去找物业
  const WIZARD = [
    '欢迎使用网络安装向导。',
    '请确认网线已经插好。',
    '请确认网线的另一头也插好了。',
    '请确认网线中间没有被老鼠咬断。'
  ];
  const WIZARD_END = '设置完成。\n网速没有任何变化。\n如有问题，请去楼下找物业。';
  // 物业的密码框
  const PW = { title: '连接到 物业', cap: '连接到 物业', user: '用户名：', pass: '密码：', remember: '记住我的密码', bad: '登录失败：未知的用户名或错误密码。' };
  // 物业电脑里的转帖：教你 shutdown -a（点那一行才算学会，见 cmd.js）。CMD_LINE 那一行单独拎出来、能点
  const POST_NAME = '[转帖]冲击波病毒临时救急必看(附命令).txt';
  const CMD_LINE = 'shutdown -a';
  const POST = [
    '【转帖】冲击波病毒临时救急必看！！！（附命令）',
    '转自：某论坛　原帖已经被删了　我也是转的',
    '',
    '最近好多人的电脑一上网就弹“系统关机”，',
    '倒计时 60 秒，怎么点都关不掉，',
    '这就是中了冲击波！！',
    '',
    '临时救急办法（亲测有效，楼主已经被关了十几次）：',
    '1. 看到倒计时先别慌，也别去拔电源。',
    '2. 打开那个小黑窗（命令提示符），在里面输入：',
    '',
    CMD_LINE,
    '',
    '3. 回车。倒计时框没了就说明成功了！',
    '',
    '切记！！shutdown 后面有一个空格，然后才是小横杠 a ！！敲错了神仙也救不了！！',
    '',
    '注意：这招只是临时的！！治标不治本！！',
    '下次上网还会弹，要彻底好得打补丁，',
    '补丁地址我也不知道，知道的回一下。',
    '',
    '————————————',
    '回复：楼主好人！！一生平安！！',
    '回复：顶！！救了我的毕业论文',
    '回复：我照着打了，打成 shutdown-a，没用，已经关了',
    '回复：有没有不用打字的办法？我不会打字',
    '回复：转给我爸了，我爸说他看不懂'
  ];
  // 转发长寿
  const LONGEVITY = '据专家研究，转发本文给 10 个人，\n可以延长寿命 10 年。\n不转发的人……（后面被撕掉了）';
  const FORWARD_PREVIEW = '据专家研究，转发本文给 10 个人，可以延长寿命 10 年……';
  const FORWARD_REPLIES = [['deskmate', '？？？'], ['faxiao', '你妈也发我了'], ['monitor', '这种东西别转了']];
  const FORWARD_TIP = '转发给 10 个人才灵。';
  // 隔夜水致癌.txt：也能转发
  const OVERNIGHT = '隔夜水致癌，隔夜茶致癌，\n隔夜的电脑也致癌。\n（转发给 10 个人可以解毒）';
  const OVERNIGHT_TIP = '转发给 10 个人可以解毒。';
  const OVERNIGHT_PREVIEW = '隔夜水致癌，隔夜茶致癌，隔夜的电脑也致癌……';
  const OVERNIGHT_REPLIES = [['roommate', '那我床底下那桶隔夜泡面……'], ['boss', '隔夜的冰棍不致癌，买不买？'], ['faxiao', '你妈说隔夜不睡觉的人也致癌']];
  // 监控：新建文件夹(2) 那户人家装的，拍的是你
  const CCTV_SAY = { title: '家', text: '老公快看，那个人又在翻别人电脑了！' };
  // IP 地址冲突 → 蓝屏
  const IP_TITLE = 'IP 地址冲突';
  const IP_TEXT = '系统检测到网络上另一台计算机\n与你的 IP 地址相同。';
  const BSOD = { id: 'network', name: 'IP_ADDRESS_CONFLICT', text: '网上出现了另一个你，你们俩只能留一个。' };
  const MOVIE = '下载到 99% 卡住了。\n预计剩余时间：等全楼都睡了再说。';

  /* ================= 楼里的电脑 =================
     note：计算机注释（左边“详细信息”、属性里显示）；share：共享的文件夹；files：里面的文件 */
  const PCS = [
    { id: 'kid', name: '楼上熊孩子', note: '别动我电脑！！', share: '作业答案（家长勿看）', files: [
      { name: '数学答案.txt', icon: 'txt', text: '全选 C' },
      { name: '便利贴.txt', icon: 'txt', text: '物业电话：' + PHONE + '\n（物业大爷说他电脑密码也是这个，\n怕忘了让我帮他记着）' }
    ] },
    { id: 'aunt', name: '对门王阿姨', note: '王阿姨的电脑，有事打电话', share: '养生资料', files: [
      { name: '转发给10个人就能长寿.doc', icon: 'doc', open: longevity },
      { name: '隔夜水致癌.txt', icon: 'txt', open: overnight }
    ] },
    { id: 'student', name: '隔壁大学生', note: '求种子', share: '电影', files: [
      { name: '武侠大片（枪版）.rmvb', icon: 'video', text: MOVIE },
      { name: '英语听力（其实是电影）.rmvb', icon: 'video', text: MOVIE },
      { name: '高数网课（其实也是电影）.rmvb', icon: 'video', text: MOVIE },
      { name: '千万别点.exe', icon: 'exe', open: dontClick },
      { name: 'ABCSee3.1注册机.exe', icon: 'keygen', open: () => OS.abcsee && OS.abcsee.keygen() },
      // 海葵抠抠补丁（koukou.js）：装上能看见谁把你拉黑了；自己带病毒，这次不发作
      { name: '海葵抠抠2003显IP版.exe', icon: 'exe', open: () => OS.koukou && OS.koukou.patchInstaller() }
    ] },
    { id: 'boss', name: '楼下小卖部老板', note: '收银台旁边那台', share: '账本', files: [
      { name: '账本.xls', icon: 'sheet', open: ledger }
    ] },
    { id: 'wuye', name: '物业', note: '物业办公室（下午不在）', share: '物业文件', password: true, files: [
      { name: '投诉记录.xls', icon: 'sheet', open: complaints },
      { name: '停水通知.txt', icon: 'txt', text: '明天停水。\n（这张通知是去年贴的）' },
      { name: POST_NAME, icon: 'txt', open: blasterPost }
    ] },
    { id: 'home', name: '家', note: '请勿敲门', share: '监控', files: [
      { name: '客厅.avi', icon: 'video', text: '画面：沙发、电视、一盘瓜子。\n电视在放天气预报。' },
      { name: '门口.avi', icon: 'video', text: '画面：门口。\n有个人一直在敲门。（好像是你）' },
      { name: '你.avi', icon: 'video', open: cctv }
    ] },
    { id: 'me', name: '你', note: '这是你的电脑', open: () => { OS.ui.notify({ title: NAME, text: L.me, icon: 'info', replace: true }); OS.explorer.open(OS.fs.SHARED); } },
    { id: 'me2', name: '你 (2)', note: '这也是你？', open: ipConflict }
  ];

  /* ================= 状态（重启就恢复） ================= */
  let ipHits = 0, wuyeOK = false, view = null;
  OS.on('desktop:reset', () => { ipHits = 0; wuyeOK = false; });
  const wuyeRemembered = () => !!OS.save.get('netWuyePw', false);

  /* ================= 窗口 ================= */
  app.open = function () {
    // where：null = 工作组里的电脑；{ pc } = 某台电脑的共享；{ pc, share: true } = 共享文件夹里的文件
    let where = null, hist = [], sel = null, lastTap = null, lastTapT = 0, busy = false, viewMode = '图标';
    const arrowBtn = (dir, label, fn) => {
      const b = el('button', { class: 'ex-btn' }, [el('span', { class: 'ex-arrow ' + dir }), label ? el('span', { text: label }) : null]);
      b.addEventListener('click', () => { if (busy) return; OS.sound.play('click'); fn(); });
      return b;
    };
    const backBtn = arrowBtn('left', '后退', () => { if (hist.length) go(hist.pop(), true); });
    const upBtn = arrowBtn('up', '', () => { if (where) go(where.share ? { pc: where.pc } : null); });
    const searchBtn = el('button', { class: 'ex-btn' }, [OS.iconEl('search', 'ex-bico'), el('span', { text: '搜索' })]);
    searchBtn.addEventListener('click', () => { OS.sound.play('click'); OS.ui.dialog({ title: '搜索计算机', icon: 'info', text: L.find }); });
    const addrText = el('span', { class: 'ex-addr-text' });
    const addrIco = el('span', { class: 'ex-aico-wrap' });
    const detName = el('div', { class: 'ex-det-name' });
    const detNote = el('div', { class: 'ex-det-note' });
    const link = (text, fn) => { const a = el('div', { class: 'ex-link', text }); a.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return a; };
    const viewEl = el('div', { class: 'ex-view net-view' });
    const status = el('div', { class: 'ex-status' });
    const content = el('div', { class: 'ex' }, [
      OS.ui.menuBar(OS.ui.EX_MENUS, name => barMenu(name), 'ex-menu'),
      el('div', { class: 'ex-tools' }, [backBtn, upBtn, el('span', { class: 'ex-sep' }), searchBtn]),
      el('div', { class: 'ex-addr' }, [el('span', { text: '地址(D)' }), el('div', { class: 'ex-addr-box' }, [addrIco, addrText])]),
      el('div', { class: 'ex-main' }, [
        el('div', { class: 'ex-pane' }, [
          el('div', { class: 'ex-sec' }, [
            el('div', { class: 'ex-sec-h', text: '网络任务' }),
            el('div', { class: 'ex-sec-b' }, [
              link('添加网上邻居', say('添加网上邻居', 'info', L.addPlace)),
              link('查看网络连接', say('网络连接', 'info', L.connView)),
              link('设置家庭网络', wizard)
            ])
          ]),
          el('div', { class: 'ex-sec' }, [el('div', { class: 'ex-sec-h', text: '详细信息' }), el('div', { class: 'ex-sec-b' }, [detName, detNote])])
        ]),
        viewEl
      ]),
      status
    ]);
    // 宽一点：一排放 4 台电脑，8 台正好两排
    const win = OS.wm.open({ title: NAME, icon: 'network', width: 456, height: 270, appId: app.id, content, center: true, onClose: () => { view = null; } });
    view = { win };

    function go(w, isBack) {
      if (!isBack) hist.push(where);
      where = w;
      render();
    }
    function title() {
      if (!where) return GROUP;
      return where.share ? where.pc.share + ' 在 ' + where.pc.name + ' 上' : where.pc.name;
    }
    function path() {
      if (!where) return NAME + '\\整个网络\\' + GROUP;
      return '\\\\' + where.pc.name + (where.share ? '\\' + where.pc.share : '');
    }
    function render() {
      win.setTitle(title());
      addrText.textContent = path();
      addrIco.textContent = '';
      addrIco.appendChild(OS.iconEl(!where ? 'network' : where.share ? 'share' : 'computer', 'ex-aico'));
      backBtn.disabled = !hist.length;
      upBtn.disabled = !where;
      viewEl.textContent = '';
      sel = null; lastTap = null;
      const items = !where ? PCS.map(p => ({ icon: 'computer', label: p.name, pc: p }))
        : !where.share ? [{ icon: 'share', label: where.pc.share, share: true }]
          : where.pc.files.map(f => ({ icon: f.icon, label: f.name, file: f }));
      items.forEach(it => {
        const node = el('div', { class: 'ex-item' + (it.pc ? ' net-pc-' + it.pc.id : '') }, [OS.iconEl(it.icon, 'ex-iico'), el('div', { class: 'ex-ilabel', text: it.label })]);
        node.addEventListener('click', e => {
          e.stopPropagation();
          if (busy) return;
          pick(node, it);
          const now = Date.now();
          if (lastTap === node && now - lastTapT < OS.dblMs()) { lastTap = null; openItem(it); } else { lastTap = node; lastTapT = now; }
        });
        OS.ui.onContext(node, () => { if (busy) return null; pick(node, it); lastTap = null; return itemMenu(it); });
        viewEl.appendChild(node);
      });
      status.textContent = items.length + ' 个对象';
      showDetails(null);
    }
    function pick(node, it) {
      viewEl.querySelectorAll('.ex-item.sel').forEach(n => n.classList.remove('sel'));
      node.classList.add('sel');
      sel = it;
      showDetails(it);
    }
    function showDetails(it) {
      if (!it) {
        detName.textContent = where ? where.pc.name : GROUP;
        detNote.textContent = where ? where.pc.note : '工作组';
      } else if (it.pc) { detName.textContent = it.pc.name; detNote.textContent = it.pc.note; }
      else if (it.share) { detName.textContent = where.pc.share; detNote.textContent = '共享文件夹'; }
      else { detName.textContent = it.file.name; detNote.textContent = '在 ' + where.pc.name + ' 上'; }
    }
    viewEl.addEventListener('click', () => { if (sel) { viewEl.querySelectorAll('.ex-item.sel').forEach(n => n.classList.remove('sel')); sel = null; showDetails(null); } });
    OS.ui.onContext(viewEl, () => busy ? null : [
      { label: '查看', sub: () => VIEWS.map(v => ({ label: v, checked: v === viewMode, action: () => { viewMode = v; } })) },
      '-',
      { label: '刷新', action: refresh },
      '-',
      { label: '属性', action: say('「' + title() + '」属性', 'info', where ? '计算机名：' + where.pc.name + '\n注释：' + where.pc.note + '\n工作组：' + GROUP : '工作组：' + GROUP + '\n计算机：' + PCS.length + ' 台') }
    ]);

    // 双击：电脑 → 先连接；共享文件夹 → 进去；文件 → 打开
    function openItem(it) {
      if (it.pc) return connect(it.pc);
      if (it.share) { OS.sound.play('click'); return go({ pc: where.pc, share: true }); }
      const f = it.file;
      OS.sound.play('click');
      if (f.open) f.open(win);
      else if (f.icon === 'txt') OS.notepad.open({ name: f.name, text: f.text, where: { type: 'net', pc: where.pc.name } });
      else OS.ui.dialog({ title: f.name, icon: 'info', text: f.text });
    }
    function connect(pc) {
      if (pc.open) {
        // 你、你 (2)：也要先“连接”一下
        busy = true;
        status.textContent = L.connecting(pc.name);
        setTimeout(() => { busy = false; if (!win.isClosed) { status.textContent = PCS.length + ' 个对象'; pc.open(win); } }, 700);
        return;
      }
      busy = true;
      status.textContent = L.connecting(pc.name);
      win.el.classList.add('net-wait');
      setTimeout(() => {
        busy = false;
        win.el.classList.remove('net-wait');
        if (win.isClosed) return;
        status.textContent = PCS.length + ' 个对象';
        // 新建文件夹(2) 的门反锁了：“家”也连不上
        if (pc.id === 'home' && OS.folder2 && OS.folder2.locked()) { OS.ui.dialog({ title: NAME, icon: 'error', text: L.locked }); return; }
        if (pc.password && !wuyeOK && !wuyeRemembered()) { askPassword(ok => { if (ok && !win.isClosed) go({ pc }); }); return; }
        OS.sound.play('click');
        go({ pc });
      }, 900);
    }
    function refresh() {
      busy = true;
      status.textContent = L.refreshing;
      viewEl.classList.add('refreshing');
      setTimeout(() => { busy = false; viewEl.classList.remove('refreshing'); if (!win.isClosed) render(); }, 700);
    }

    // 右键
    function itemMenu(it) {
      if (it.pc) return [
        { label: '打开', bold: true, action: () => openItem(it) },
        { label: '搜索计算机…', action: say('搜索计算机', 'info', L.find) },
        '-',
        { label: '映射网络驱动器…', action: say('映射网络驱动器', 'warn', L.mapDrive) },
        '-',
        { label: '属性', action: say('「' + it.pc.name + '」属性', 'info', '计算机名：' + it.pc.name + '\n注释：' + it.pc.note + '\n工作组：' + GROUP) }
      ];
      if (it.share) return [
        { label: '打开', bold: true, action: () => openItem(it) },
        { label: '映射网络驱动器…', action: say('映射网络驱动器', 'warn', L.mapDrive) },
        '-',
        { label: '属性', action: say('「' + where.pc.share + '」属性', 'info', '共享名：' + where.pc.share + '\n共享者：' + where.pc.name + '\n权限：只读') }
      ];
      return [
        { label: '打开', bold: true, action: () => openItem(it) },
        '-',
        { label: '复制', action: say('复制', 'warn', L.copy) },
        '-',
        { label: '属性', action: say('「' + it.file.name + '」属性', 'info', '位置：' + path() + '\n来自：' + where.pc.name + '\n属性：只读') }
      ];
    }
    // 顶上菜单栏
    function barMenu(name) {
      if (busy) return null;
      if (name === '文件(F)') return [
        { label: '打开', bold: true, disabled: !sel, action: () => sel && openItem(sel) },
        '-',
        { label: '映射网络驱动器…', action: say('映射网络驱动器', 'warn', L.mapDrive) },
        { label: '断开网络驱动器…', action: say('断开网络驱动器', 'info', L.unmapDrive) },
        '-',
        { label: '关闭', action: () => win.close() }
      ];
      if (name === '编辑(E)') return [
        { label: '复制', disabled: !sel, action: say('复制', 'warn', L.copy) },
        '-',
        { label: '全部选定', action: () => { const all = viewEl.querySelectorAll('.ex-item'); all.forEach(n => n.classList.add('sel')); status.textContent = '选定 ' + all.length + ' 个对象'; } }
      ];
      if (name === '查看(V)') return VIEWS.map(v => ({ label: v, checked: v === viewMode, action: () => { viewMode = v; } })).concat(['-', { label: '刷新', action: refresh }]);
      if (name === '收藏(A)') return [{ label: '添加到收藏夹…', action: say('添加到收藏夹', 'info', L.fav) }];
      if (name === '工具(T)') return [
        { label: '映射网络驱动器…', action: say('映射网络驱动器', 'warn', L.mapDrive) },
        { label: '断开网络驱动器…', action: say('断开网络驱动器', 'info', L.unmapDrive) },
        '-',
        { label: '文件夹选项…', action: say('文件夹选项', 'info', L.opts) }
      ];
      return [{ label: '帮助和支持中心', action: say('帮助和支持中心', 'info', L.help) }, '-', { label: "关于 Windoesn't", action: OS.ui.about }];
    }

    render();
    return win;
  };
  const VIEWS = ['缩略图', '平铺', '图标', '列表', '详细信息'];

  /* ================= 设置家庭网络：向导一路“下一步” ================= */
  function wizard() {
    let i = 0;
    const step = () => {
      if (i >= WIZARD.length) { OS.ui.dialog({ title: '网络安装向导', icon: 'info', text: WIZARD_END, buttons: ['完成'] }); return; }
      OS.ui.dialog({ title: '网络安装向导', icon: 'info', text: WIZARD[i], buttons: ['下一步 >', '取消'] }).then(v => { if (v === '下一步 >') { i++; step(); } });
    };
    step();
  }

  /* ================= 物业电脑的密码框：屏幕数字键盘（也能直接敲键盘） ================= */
  let pwWin = null;
  function askPassword(done) {
    if (pwWin && !pwWin.isClosed) { OS.wm.focus(pwWin); return; }
    let digits = '', remember = false, finished = false;
    const dots = el('div', { class: 'net-pw-field' });
    const msg = el('div', { class: 'net-pw-msg' });
    const box = el('span', { class: 'kk-box' });
    const rem = el('span', { class: 'kk-chk' }, [box, el('span', { text: PW.remember })]);
    rem.addEventListener('click', () => { OS.sound.play('click'); remember = !remember; box.classList.toggle('on', remember); });
    const showDots = () => { dots.textContent = '●'.repeat(digits.length); };
    const press = k => {
      msg.textContent = '';
      if (k === '←') digits = digits.slice(0, -1);
      else if (k === '清空') digits = '';
      else if (digits.length < 16) digits += k;
      OS.sound.play('click');
      showDots();
    };
    const keys = el('div', { class: 'net-keys' }, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '清空', '0', '←'].map(k => {
      const b = el('button', { class: 'net-key' + (k.length > 1 ? ' fn' : ''), text: k });
      b.addEventListener('click', () => press(k));
      return b;
    }));
    const ok = el('button', { class: 'xpbtn default', text: '确定' });
    const no = el('button', { class: 'xpbtn', text: '取消' });
    const content = el('div', { class: 'net-pw' }, [
      el('div', { class: 'net-pw-top' }, [OS.iconEl('key', 'net-pw-ico'), el('b', { text: PW.cap })]),
      el('div', { class: 'net-pw-row' }, [el('span', { class: 'net-pw-lab', text: PW.user }), el('div', { class: 'net-pw-field user', text: 'Guest' })]),
      el('div', { class: 'net-pw-row' }, [el('span', { class: 'net-pw-lab', text: PW.pass }), dots]),
      el('div', { class: 'net-pw-row' }, [el('span', { class: 'net-pw-lab' }), rem]),
      keys, msg,
      el('div', { class: 'kk-sysbtns' }, [ok, no])
    ]);
    const finish = v => { if (finished) return; finished = true; document.removeEventListener('keydown', onKey, true); if (pwWin && !pwWin.isClosed) pwWin.close(); done(v); };
    pwWin = OS.wm.open({ title: PW.title, icon: 'key', width: 230, content, maximizable: false, minimizable: false, taskbar: false, center: true, onClose: () => { pwWin = null; if (!finished) { finished = true; document.removeEventListener('keydown', onKey, true); done(false); } } });
    ok.addEventListener('click', () => {
      OS.sound.play('click');
      if (digits === PHONE) {
        wuyeOK = true;
        if (remember) OS.save.set('netWuyePw', true);
        finish(true);
        return;
      }
      OS.sound.play('error');
      msg.textContent = PW.bad;
      digits = '';
      showDots();
      pwWin.el.classList.remove('kk-shaking'); void pwWin.el.offsetWidth; pwWin.el.classList.add('kk-shaking');
    });
    no.addEventListener('click', () => { OS.sound.play('click'); finish(false); });
    // 电脑上直接敲键盘也行
    function onKey(e) {
      if (!pwWin || OS.wm.active !== pwWin) return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); press(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); press('←'); }
      else if (e.key === 'Enter') { e.preventDefault(); ok.click(); }
      else if (e.key === 'Escape') { e.preventDefault(); no.click(); }
    }
    document.addEventListener('keydown', onKey, true);
  }

  /* ================= 各家的文件 ================= */
  // 千万别点.exe：先安静 1 秒（让人以为“就这？”），然后弹出《系统关机》60 秒倒计时（cmd.js）
  function dontClick() {
    if (OS.shutdown.running()) { OS.shutdown.dont(); return; }
    setTimeout(() => { if (OS.boot.state === 'desktop') OS.shutdown.dont(); }, 1000);
  }
  // 物业电脑里的转帖：记事本打开；shutdown -a 那一行能点（学会这条指令）
  function blasterPost() {
    OS.notepad.open({ name: POST_NAME, text: POST.join('\n'), where: { type: 'net', pc: '物业' },
      link: { line: CMD_LINE, onClick: () => OS.cmd.learn(CMD_LINE) } });
  }
  // 转发：发给你的抠抠好友（有人回）
  // 转发：不弹框，只有抠抠那边有动静（文件发出去、好友陆续回）；没登录抠抠 = 右下角提示先登录
  function forward(name, icon, preview, replies) {
    if (OS.soft && !OS.soft.has('koukou')) { OS.ui.notify({ title: '转发', text: '转发失败：请先安装 抠抠2003。', icon: 'warn', replace: true }); return; }   // 在 添加或删除程序 里卸掉了
    if (!OS.koukou || !OS.koukou.loggedIn()) { OS.ui.notify({ title: '转发', text: '转发失败：需要先登录抠抠。', icon: 'warn', replace: true }); return; }
    OS.koukou.sendFile({ name, icon, text: preview });
    replies.forEach(([id, t], i) => setTimeout(() => OS.koukou.receive(id, t), 1500 + i * 1800));
  }
  // 打开以后右下角弹气泡：［转发］［不转发］（不转发 = 气泡收起，什么也不弹：气泡本身就是冲着玩家说的）
  function askForward(name, tip, onYes) {
    setTimeout(() => OS.ui.notify({ title: name, text: tip, icon: 'info', replace: true, timeout: 15000, actions: [['转发', onYes], ['不转发', () => {}]] }), 700);
  }
  // 转发给10个人就能长寿.doc：写字板打开（王阿姨排的版：七彩大标题、红字）；转发 = 发给抠抠好友；不转发 = 气泡收起
  const LONG_NAME = '转发给10个人就能长寿.doc';
  function longevity() {
    const P = (text, o) => Object.assign({ text, font: '宋体', size: 12 }, o || {});
    const lines = LONGEVITY.split('\n');
    (OS.docEditor ? OS.docEditor() : OS.wordpad).open({ name: LONG_NAME, where: { type: 'ro', msg: '保存失败：这是王阿姨的文件，你改不了。' },
      doc: [P('转发给10个人就能长寿！！！', { align: 'center', b: true, size: 18, color: 'rainbow', font: '华文彩云' }), P(''),
        P(lines[0], { color: '#ff0000', size: 14 }), P(lines[1], { color: '#ff0000', size: 14, b: true }), P(lines[2], { size: 12, color: '#808080' })] });
    askForward(LONG_NAME, FORWARD_TIP,
      () => forward(LONG_NAME, 'doc', FORWARD_PREVIEW, FORWARD_REPLIES));
  }
  // 隔夜水致癌.txt：记事本打开，也能转发
  function overnight() {
    OS.notepad.open({ name: '隔夜水致癌.txt', text: OVERNIGHT, where: { type: 'net', pc: '对门王阿姨' } });
    askForward('隔夜水致癌.txt', OVERNIGHT_TIP,
      () => forward('隔夜水致癌.txt', 'txt', OVERNIGHT_PREVIEW, OVERNIGHT_REPLIES));
  }
  // 我的电脑 ▸ 共享文档 里也有王阿姨这篇；Outluck Excess 里王阿姨那封转发链点［转发］也走这里
  OS.netShared = { longevity, forwardChain: () => forward(LONG_NAME, 'doc', FORWARD_PREVIEW, FORWARD_REPLIES) };
  // 只读的小表格（账本、投诉记录）：仿 Excuse 2003
  // 别人的表：Excuse 2003 只读打开（debt.js）
  function sheet(o) {
    if (OS.excuse) return OS.excuse.view(o);
    const head = el('tr', {}, o.cols.map(c => el('th', { text: c })));
    const rows = o.rows.map((r, k) => el('tr', o.total && k === o.rows.length - 1 ? { class: 'net-total' } : null, r.map((c, i) => el('td', { class: o.align && o.align[i] ? 'xl-' + o.align[i] : null, text: c }))));
    const body = [el('div', { class: 'net-sheet-cap', text: o.cap }), el('table', { class: 'xl-grid net-sheet' }, [head].concat(rows))];
    if (o.foot) body.push(el('div', { class: 'net-sheet-foot', text: o.foot }));
    const tools = o.tools ? el('div', { class: 'xl-tools' }, o.tools) : null;
    const content = el('div', { class: 'xl net-xl' }, [tools, el('div', { class: 'net-sheet-wrap' }, body), el('div', { class: 'xl-status' }, [el('span', { text: L.readonly }), el('span', { text: '数字' })])]);
    return OS.wm.open({ title: 'Excuse 2003 - ' + o.name + ' [只读]', icon: 'sheet', width: o.width || 330, content, maximizable: false });
  }
  // 小卖部老板的账本：你欠老板的（合计 250），能反过来打一张欠条
  const LEDGER = [
    ['老冰棍', '30 根', 15], ['辣条', '20 包', 10], ['干脆面（集卡的那种）', '40 包', 20],
    ['汽水（瓶子没还）', '12 瓶', 36], ['泡泡糖', '50 块', 5], ['作业本', '10 本', 8], ['赊账利息（按复利算）', '1 次', 156]
  ];
  const LEDGER_TOTAL = LEDGER.reduce((s, r) => s + r[2], 0);
  function ledger() {
    const btn = el('button', { class: 'xl-tb xl-tb-main' }, [OS.iconEl('exe', 'xl-tbico'), el('span', { text: '打印欠条' })]);
    btn.addEventListener('click', () => {
      OS.sound.play('click');
      if (!OS.printSlip) return;
      OS.printSlip({ to: '楼下小卖部老板', who: '你', rows: LEDGER.map(([what, qty, amt]) => ({ what, qty, amt })), total: LEDGER_TOTAL, note: '手印是老板替你按的。', post: false, title: '账本.xls' });
    });
    sheet({
      name: '账本.xls', cap: '楼下小卖部 · 赊账本　　欠款人：你',
      cols: ['商品', '数量', '金额'], align: [null, 'c', 'r'],
      rows: LEDGER.map(([a, b, c]) => [a, b, '¥' + c.toFixed(2)]).concat([['合计', '', '¥' + LEDGER_TOTAL.toFixed(2)]]),
      foot: '概不赊账。除了你。', tools: [btn], total: true, widths: [150, 60, 84]
    });
  }
  // 物业的投诉记录：你在新建文件夹(2) 掀屋顶、敲门的真实次数
  function complaints() {
    const st = OS.folder2 ? OS.folder2.stats() : { roofs: 0, knocks: 0 };
    sheet({
      name: '投诉记录.xls', cap: '幸福小区 3 号楼 · 物业投诉记录', width: 360, widths: [104, 58, 116, 52],
      cols: ['投诉人', '被投诉人', '事由', '次数'], align: [null, null, null, 'c'],
      rows: [
        ['新建文件夹(2) 住户', '你', '有人掀我家屋顶', st.roofs + ' 次'],
        ['新建文件夹(2) 住户', '你', '有人一直敲门', st.knocks + ' 次'],
        ['新建文件夹(2) 住户', '你', '噪音扰民', OS.save.get('qqNoise', 0) + ' 次'],
        ['对门王阿姨', '楼上熊孩子', '半夜跳绳', '365 次'],
        ['楼下小卖部老板', '你', '赊账不还', '见账本'],
        ['全楼', '隔壁大学生', '晚上网速太慢', '每天']
      ],
      foot: '处理结果：已登记，暂不处理。'
    });
  }
  // 监控：新建文件夹(2) 那户人家装的摄像头，拍的是……你的桌面
  function cctv() {
    const src = OS.desktop.root();
    const shot = src.cloneNode(true);
    shot.removeAttribute('id');
    shot.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    shot.classList.add('net-cctv-desk');
    const stamp = el('span', { class: 'net-cctv-time' });
    const tick = () => { const d = OS.clock.now(); stamp.textContent = OS.YEAR + '-' + OS.pad2(d.getMonth() + 1) + '-' + OS.pad2(d.getDate()) + ' ' + OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes()) + ':' + OS.pad2(d.getSeconds()); };
    tick();
    const t = setInterval(tick, 1000);
    const screen = el('div', { class: 'net-cctv' }, [
      el('div', { class: 'net-cctv-view' }, [shot]),
      el('div', { class: 'net-cctv-rec' }, [el('i'), el('span', { text: 'REC' })]),
      el('span', { class: 'net-cctv-cam', text: 'CAM 03' }),
      stamp
    ]);
    OS.wm.open({ title: '你.avi - 监控', icon: 'video', width: 236, content: screen, maximizable: false, onClose: () => clearInterval(t) });
    setTimeout(() => OS.ui.notify({ title: CCTV_SAY.title, text: CCTV_SAY.text, icon: 'warn', replace: true }), 900);
  }
  // 你 (2)：IP 地址冲突 —— 第 1 次气泡；第 2 次两台“你”打起来；第 3 次蓝屏
  function ipConflict() {
    ipHits++;
    OS.sound.play('error');
    OS.ui.notify({ title: IP_TITLE, text: IP_TEXT, icon: 'warn', replace: true });
    if (ipHits >= 2 && view && !view.win.isClosed) view.win.el.classList.add('net-fight');
    if (ipHits >= 3) setTimeout(() => OS.ui.bsod(BSOD), 900);
  }
})();
