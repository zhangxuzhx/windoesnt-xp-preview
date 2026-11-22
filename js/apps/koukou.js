/* 抠抠2003（桌面 + 开始 ▸ 所有程序 ▸ 抠抠软件）：仿那几年的聊天软件，原创的铁公鸡（一毛不拔 = 抠门）
   - 开机自动弹登录框；号码、密码都填好了，不用打字。下拉框里另外几个号点了都报错。
   - 登录后：右边竖长条主面板（分组、好友、状态、等级），右下角托盘一只铁公鸡头，来消息一闪一闪。
   - 聊天：不用打字，下面三句候选回复点一句就发出去；表情、窗口抖动（抖多了被拉黑）、发送文件、聊天记录。
   - 群「高三(2)班」：消息自己刷；欠条的［发到群里］发到这里，被写在欠条上的人退群 / 删你，进 Excuse 的“绝交名单”。
   - 系统消息：有人加你好友送抠币；抠币永远是 0。
   - 蓝屏彩蛋：在群里发窗口抖动，全班跟着回抖，抖到第 3 次整个桌面抖散架 → GROUP_SHAKE_COLLAPSE。
   - 拉黑、退群、绝交都只在这次开机里有效，重启就恢复（开机自检多一行修复句）。
   铁公鸡、头像、表情、抠秀都是 Codex 画的（assets/koukou/）。 */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.koukou;
  const say = (title, icon, text) => () => OS.ui.dialog({ title, icon, text });

  /* ================= 文案 ================= */
  const SOFT = '抠抠2003';
  const SLOGAN = '抠抠2003 全新体验　抠人类、抠生活！';
  const MY_NUM = '8008208820';
  // 号码下拉框：除了自己的号，点了都报错
  const NUMS = [
    [MY_NUM, ''],
    ['114514', '这么臭的账号有必要登陆吗'],
    ['88888', '醒醒，五位号也是你能拥有的？'],
    ['10001', '这是马老板的号，你登不进去'],
    ['5201314', '该号码已被葬恨家族包场'],
    ['6543210', '引爆已紧急中止！好险，这串倒计时差点把您的 C 盘当场炸穿']
  ];
  const L = {
    clear: '别呀，号码你记得住我记不住呀。',
    unremember: '别取消，我就是记不住密码才勾选的这个！',
    forgot: '密码是你的生日。\n不对的话，是你暗恋对象的生日。',
    protect: '密码保护问题：你小学体育老师姓什么？\n（你也忘了吧）',
    register: '号码已经被注册完了，\n请等明年。',
    // 登录方式标签：手机号码（只有一个按钮“那算了……”）、电子邮箱
    tabPhone: { icon: 'warn', text: '使用手机号登录将默认为您捆绑开通\n《冷笑话大全》《星座运势》\n《母猪产后护理》三项包月彩信\n（合计 15 元/月，\n从您爸的手机话费里静默扣除，\n发送 TD 退订无效）', buttons: ['那算了……'] },
    tabMail: { icon: 'error', text: '切换失败：由于常年没人点这一栏，\n这个选项卡的铁皮合页已经生锈焊死，\n系统刚刚滴了两滴缝纫机油也没撬开。' },
    logging: '正在登录……',
    find: '查找条件：在线、聊得来、不借钱。\n找到 0 人。\n建议降低要求。',
    coin: '抠币余额：0\n本软件很抠，不送抠币。',
    dress: '换装需要 10 抠币。\n你有 0 抠币。',
    level: '当前等级：1 颗星星\n再挂 2190 天升一个太阳。',
    profile: '抠抠号码：' + MY_NUM + '\n昵称：你\n个性签名：{sig}\n等级：1 颗星星',
    noSig: '（还没想好）',
    setCap: '登录设置',
    setAuto: '开机自动登录',
    noMsg: '没有新消息。\n（没人找你）',
    font: '字体只有宋体 9 号。\n颜色可以选非主流粉。',
    file: '发送失败：对方用拨号上网，56K 收不动。',
    history: '为了防止您侵犯您的个人隐私权，\n聊天记录已被清空。',
    historyBtn: '？？？',   // 唯一的按钮
    away: '自动回复已开启：\n我妈叫我回家吃饭了，886。',
    autoReply: '[自动回复] 我妈叫我回家吃饭了，886。',
    delAsk: n => '确定要删除好友「' + n + '」吗？',
    toBlack: '移不动：拉黑别人要 10 抠币。\n你有 0 抠币。',
    needLogin: '请先登录抠抠。',
    uninstall: '卸载失败：抠抠很抠，\n舍不得离开你的电脑。'
  };
  const SHAKE_SENT = '你发送了一个窗口抖动。';
  const SHAKE_LINES = ['干嘛？', '别抖了！', '再抖拉黑你！'];
  const BLOCKED = '对方已将你拉黑。';
  const BLOCKED_SEND = '对方已将你拉黑，消息发送失败。';
  const OFFLINE_SEND = '对方已下线，消息将在对方上线后送达。\n（对方不会上线了）';
  const FIX_BLOCK = '正在把你从好友的黑名单里放出来';
  const FIX_QUIT = '正在劝退群的同学回来';
  const FIX_MUTE = '正在求班长解除禁言';
  // 切到隐身几秒后，班长或小卖部老板来一句（那几年的“显隐身外挂”）
  const INV_CAUGHT = '别隐身了，我装了显隐身外挂，看见你在线呢。';
  const INV_SPIES = ['monitor', 'boss'];
  // 自动登录：登录框里默认勾上；登录那一刻记进存档（重启、刷新都算数），托盘右键能改
  const AUTO_KEY = 'kkAutoLogin';
  const autoOn = () => OS.save.get(AUTO_KEY, false) === true;
  const MUTED = '你已被管理员 班长 禁言。';
  const MUTE_SEND = '你已被禁言，无法发言。';
  const BSOD = { id: 'koukou', name: 'GROUP_SHAKE_COLLAPSE', text: '全班同时发送窗口抖动，系统被抖散架了。' };
  // 聊完了之后的闲聊
  const GENERIC_CHIPS = ['呵呵', '在吗', '886'];
  const GENERIC_REPLY = ['呵呵', '嗯', '……', '偶去吃饭了，一会儿聊', '酱紫啊', '886~'];

  /* ================= 好友 =================
     av：临时头像（发色、发型、衣服……）；turns：聊天剧本 [{ say, choices: [[你说的, 对方回的], ×3], after }]；
     debt：欠条里的名字（发到群里时认人）；quit：欠条发到群里后，这人的反应 */
  const F = {
    deskmate: { name: '同桌', group: 'friends', num: '12345678', sig: '作业借我抄，友谊地久天长。', inClass: true, debt: '同桌',
      turns: [
        { say: '在吗', choices: [['在', '在就好。'], ['不在', '不在你回什么。'], ['你猜', '猜你个头。']] },
        { say: '明天数学作业借我抄一下', choices: [['没写', '……那我抄谁的？'], ['一包干脆面', '成交！卡片归我。'], ['知识产权费另算', '你跟谁学的这个词？']] },
        { say: '下课去小卖部不？', choices: [['去', '走！'], ['不去', '切。'], ['你请客', '……我突然不饿了。']] }
      ],
      quit: '我什么时候欠你钱了？？' },
    faxiao: { name: '发小', group: 'friends', num: '23456789', sig: '走自己的路，让别人打车去吧。', inClass: true, debt: '发小',
      turns: [
        { say: '在干嘛', choices: [['上网', '又上网，你妈知道吗？'], ['写作业', '骗鬼呢。'], ['想你', '……你没事吧？']] },
        { say: '你妈让我问你，什么时候回家吃饭', choices: [['马上', '我跟她说，你说的“马上”是一小时。'], ['不回了', '好，我这就转告。'], ['我妈怎么有你号', '我俩一直有联系啊。']] }
      ],
      quit: '你等着，我告诉你妈。' },
    roommate: { name: '上铺的室友', group: 'friends', num: '34567890', sig: '饭卡余额：0.5', inClass: true, debt: '上铺的室友',
      turns: [
        { say: '帮我带份饭', choices: [['好', '要两个荤菜。'], ['不好', '那我饿死了你负责。'], ['钱先给', '……就当我没说。']] },
        { say: '晚上打牌，三缺一', choices: [['来', '够意思！'], ['不来', '那你帮我们看着宿管。'], ['明天考试', '考试？哪门？']] }
      ],
      quit: '今晚别想睡了。' },
    boss: { name: '楼下小卖部老板', group: 'friends', num: '10000001', sig: '小本生意，概不赊账。', debt: '楼下小卖部老板', note: '（备注：赊账）',
      turns: [
        { say: '上个月的冰棍钱什么时候结？', choices: [['886', '886 也得结账。'], ['886', '886 也得结账。'], ['886', '886 也得结账。']] },
        { say: '新到了干脆面，集卡的那种', choices: [['来一包', '五毛，现金。'], ['来一箱', '先把冰棍钱结了。'], ['赊着', '赊账免谈。']] }
      ],
      quit: '你先把上个月的冰棍钱还了。' },
    nextdoor: { name: '隔壁班的', group: 'class', num: '45678901', sig: '这个人很懒，什么都没留下。', inClass: true, debt: '隔壁班的',
      turns: [
        { say: '你是？', choices: [['我是你隔壁班的', '哦……'], ['你猜', '不猜。'], ['你加错人了', '那你通过干嘛？']] },
        { say: '算了，没事。', choices: [['？', '。'], ['？？', '。'], ['？？？', '。']] }
      ],
      quit: '你谁啊？' },
    monitor: { name: '班长', group: 'class', num: '56789012', sig: '非淡泊无以明志，非宁静无以致远。', inClass: true,
      turns: [
        { say: '交作业了！！！', choices: [['在写了', '明早七点前！'], ['写完了', '那快交！'], ['什么作业', '……你完了。']] },
        { say: '班费每人 10 块', choices: [['交', '好，记上了。'], ['没钱', '那我先帮你垫着，记账上。'], ['上次交过了', '那是上学期的。']] }
      ],
      // 欠条发到群里：班长是群管理员，不退群，直接把你禁言
      debt: '班长', quit: '班费还没交呢你先找我要钱？', mute: true },
    feiyang: { name: '轻舞飞扬', group: 'net', num: '52013140', sig: '想要一个懂我的人。', debt: '网友“轻舞飞扬”',
      turns: [
        { say: '你是 GG 还是 MM？', choices: [['GG', '哦~'], ['MM', '那我们做好姐妹吧！'], ['你猜', '好神秘哦~']] },
        { say: '我们见个面吧？', choices: [['好', '……我妈叫我吃饭了，886'], ['不好', '……我妈叫我吃饭了，886'], ['你先发张照片', '……我妈叫我吃饭了，886']], after: 'offline' }
      ],
      quit: '原来你是这种人……' },
    yanhua: { name: '╰☆ゞ寂寞の烟花ゞ☆╮', group: 'net', num: '13141314', sig: '莪哋卋堺，伱鈈慬。',
      turns: [
        { say: '伱恏~', choices: [['你好', '莪哋惢，伱鈈慬……'], ['？', '嗯，伱鈈慬。'], ['说人话', '迣堺仩朂遙逺哋距離……']] },
        { say: '伱噯過①個亽嗎？', choices: [['爱过', '噯過，迣痛。'], ['没有', '迣恏，鈈噯僦鈈傷。'], ['说人话', '……']] }
      ],
      // 连着两轮都选［说人话］：破功，打出一句正常字（白度 = 山寨的搜索网站，跟 Internot Explorer 一样不用真名）
      twice: { pick: 2, line: '别催了，我刚在白度找的火星文转换器，复制粘贴很累的' } },
    taxue: { name: '≮踏雪无痕≯', group: 'net', num: '66666666', sig: '高手寂寞。', away: true,
      turns: [
        { say: '高手，带我练级！', choices: [['好', '那我等你！'], ['没空', '高手都这么说。'], ['我也是新手', '……那你加我干嘛？']] },
        { say: '你等级多少了？', choices: [['1 颗星星', '我也是！'], ['保密', '高手！'], ['你呢', '我挂了三年，刚一个太阳。']] }
      ] },
    // 系统消息里来加你的（同意了才出现在“陌生人”里）
    guimi: { name: '轻舞飞扬的闺蜜', group: 'stranger', num: '99999999', sig: '抠币充值，九折。', hidden: true,
      turns: [
        { say: '抠币充值找我，九折。', choices: [['不要', '那八折？'], ['多少钱', '原价 100，九折 99 块，童叟无欺。'], ['你是骗子吧', '你怎么知道？']] }
      ],
      generic: ['八折也行', '加我好友送抠币', '点击领取：抠币大礼包'] }
  };
  /* 删了好友：1–3 分钟后对方发好友申请要加回来。ask = 附加消息（每拒绝一次往下走一句，走到最后一句就一直重复）；
     back = 同意以后对方先说的一句 */
  const READD = {
    deskmate: { ask: ['你怎么把我删了？', '作业我不抄你的了还不行吗？？'], back: '吓死我了，还以为你号被盗了。' },
    faxiao: { ask: ['你怎么把我删了？', '再不加，我去你家当面问。'], back: '你妈说你今天心情不好，原谅你了。' },
    roommate: { ask: ['你怎么把我删了？我们还睡上下铺呢。', '今晚我的脚丫子对着你的头睡。'], back: '饭卡借我刷一下，就当赔礼了。' },
    boss: { ask: ['删我好友，冰棍钱就不用还了？', '账本上还记着你呢。'], back: '冰棍钱，月底结。' },
    nextdoor: { ask: ['你是？我好像被你删了。', '……算了，没事。'], back: '。' },
    monitor: { ask: ['你怎么把我删了？班费还交不交了？', '再不通过，我告诉班主任。'], back: '作业明早七点前交，别以为删了我就不用交。' },
    feiyang: { ask: ['你怎么把我删了？是因为我没发照片吗……', '再不加我，我就去找踏雪无痕了！'], back: '那我们还是做好朋友吧~' },
    yanhua: { ask: ['伱為什庅紦莪刪孒？', '莪哋惢，碎孒①哋。'], back: '伱還湜茬乎莪哋。' },
    taxue: { ask: ['高手，你怎么把我删了？', '我还在新手村等你呢。'], back: '高手，带我练级！' },
    guimi: { ask: ['删了也没用，加我送 200 抠币。', '那 300？'], back: '抠币充值找我，八折。' }
  };
  const READD_MIN = 60000, READD_MAX = 180000;
  const GROUPS = [['friends', '我的好友'], ['class', '同学'], ['net', '网友'], ['qun', '我的群'], ['stranger', '陌生人'], ['black', '黑名单']];
  const SYS_ASK = '「轻舞飞扬的闺蜜」请求加你为好友。\n附加消息：加我，送你 100 抠币';

  /* ================= 群：高三(2)班 ================= */
  const QUN = '高三(2)班';
  const NPCS = ['课代表', '体委', '后排睡觉的'];   // 不是好友的同学
  const QUN_FRIENDS = ['deskmate', 'faxiao', 'roommate', 'nextdoor', 'monitor'];
  const QUN_LINES = [
    ['课代表', '物理作业交到我这儿'], ['体委', '明天跑操别迟到！'], ['后排睡觉的', 'zzz'],
    ['deskmate', '作业是啥？'], ['monitor', '安静！！'], ['faxiao', '放学打球不？'],
    ['roommate', '谁有新歌的 MP3？'], ['课代表', '数学卷子是第几页？'], ['体委', '下午体育课改自习了'],
    ['后排睡觉的', '老班来了吗'], ['nextdoor', '你们班作业是啥？'], ['deskmate', '+1'], ['faxiao', '顶'],
    ['monitor', '刷屏的注意点'], ['roommate', '沙发'], ['课代表', '楼上的别刷屏'], ['体委', '哈哈哈哈'], ['后排睡觉的', '？']
  ];
  const QUN_CHIPS = ['哈哈哈', '+1', '楼上说得对'];
  const SLIP_CHEER = ['哈哈哈哈', '楼主好人', '围观', '+1', '截图了', '我倒', '汗', '晕', '强！', '顶！'];   // 都用那几年贴吧 / 群里的高频词
  const SLIP_STRANGER = '这人不在群里啊，那你发出来干嘛？';
  const SLIP_NOBODY = '这谁啊？';
  const SLIP_ALREADY = '人家早退群了。';
  const QUN_SHAKE = [
    ['谁抖的？', '抖回去！'],
    ['全体抖动！！！', '别抖了我电脑卡了', '抖抖抖'],
    ['啊啊啊啊啊', '我屏幕裂了', '老班来了！！！']
  ];

  /* ================= 状态（只在这次开机里有效） ================= */
  let S;
  function fresh() {
    return {
      logged: false, status: 'online', tray: null, login: null, panel: null, panelParts: null, chats: {}, qun: null, sysWin: null,
      log: {}, turn: {}, wait: {}, unread: {}, shakes: {}, blocked: new Set(), offline: new Set(), left: new Set(),
      gone: [], guimi: 'none', sysQueue: [], sysCur: null, deleted: new Set(), reqN: {}, qunShake: 0, muted: false, picks: {}, autoReplied: new Set(), timers: [], intervals: [], open: { friends: true, class: true, net: true, qun: true, stranger: false, black: false }, sel: null
    };
  }
  S = fresh();
  const later = (fn, ms) => { S.timers.push(setTimeout(fn, ms)); };
  const clock = () => { const d = new Date(); return OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes()) + ':' + OS.pad2(d.getSeconds()); };
  const alive = w => w && !w.isClosed;
  const nameOf = id => (F[id] ? F[id].name : id);

  /* ================= 头像 / 表情 / 抠秀：Codex 画的图（assets/koukou/，图是显示大小的 2 倍） =================
     图是横排的一长条，用百分比定位，头像不管显示多大都能取对那一格 */
  const ART = 'assets/koukou/';
  ['logo', 'tray', 'avatars', 'emo', 'show'].forEach(n => { const im = new Image(); im.src = ART + n + '.webp'; });
  const AV_IDX = { me: 0, deskmate: 1, faxiao: 2, roommate: 3, boss: 4, nextdoor: 5, monitor: 6, feiyang: 7, yanhua: 8, taxue: 9, guimi: 10, '课代表': 11, '体委': 12, '后排睡觉的': 13, qun: 14 };
  const AV_N = 15, EMO_N = 16, SHOW_N = 6;
  // 抠秀：普通男生 0 ／ 普通女生 1 ／ 非主流男生 2 ／ 非主流女生 3 ／ 小卖部老板 4 ／ 网游高手 5
  const SHOW_IDX = { me: 0, deskmate: 0, faxiao: 0, roommate: 0, monitor: 1, nextdoor: 2, yanhua: 2, feiyang: 3, guimi: 3, boss: 4, taxue: 5 };
  const cell = (i, n) => (n > 1 ? (i / (n - 1)) * 100 : 0) + '% 0';
  function avEl(id, cls) {
    const off = F[id] && S.offline.has(id);
    return el('span', { class: 'kk-av' + (cls ? ' ' + cls : '') + (off ? ' off' : ''), style: { backgroundPosition: cell(AV_IDX[id] || 0, AV_N) } });
  }
  const emoEl = i => el('span', { class: 'kk-emo', style: { backgroundPosition: cell(i, EMO_N) } });
  // 抠秀（聊天窗右边的形象）
  function showEl(id) {
    return el('div', { class: 'kk-show' }, [el('span', { class: 'kk-show-img', style: { backgroundPosition: cell(SHOW_IDX[id] || 0, SHOW_N) } })]);
  }

  /* ================= 托盘：铁公鸡头 ================= */
  function ensureTray() {
    if (S.tray) return;
    S.tray = OS.taskbar.trayAdd(el('span', { class: 'tray-btn kk-tray off', title: SOFT }, [el('i', { class: 'tray-ico kk-tray-ico' })]));
    S.tray.addEventListener('click', () => { OS.sound.play('click'); trayClick(); });
    OS.ui.onContext(S.tray, () => trayMenu());
    updateTray();
  }
  function updateTray() {
    if (!S.tray) return;
    const unread = S.sysQueue.length > 0 || Object.keys(S.unread).some(k => S.unread[k] > 0);
    S.tray.classList.toggle('off', !S.logged);
    S.tray.classList.toggle('away', S.logged && S.status === 'away');
    S.tray.classList.toggle('inv', S.logged && S.status === 'invisible');
    S.tray.classList.toggle('flash', S.logged && unread);
  }
  function trayClick() {
    if (!S.logged) { openLogin(); return; }
    if (S.sysQueue.length) { openSys(); return; }
    const id = Object.keys(S.unread).find(k => S.unread[k] > 0);
    if (id) { id === 'qun' ? openQun() : openChat(id); return; }
    // 没消息：主面板收在顶上就滑下来；不然点一下藏起主面板，再点一下叫出来
    if (alive(S.panel) && S.panel.kkDock && S.panel.kkDock.hidden()) { S.panel.kkDock.show(); OS.wm.focus(S.panel); return; }
    if (alive(S.panel) && !S.panel.minimized && OS.wm.active === S.panel) { OS.wm.minimize(S.panel); return; }
    openPanel();
  }
  // 托盘右键里的“自动登录”开关（存档里记着，下次开机用）
  const autoItem = () => ({ label: '自动登录', checked: autoOn(), action: () => OS.save.set(AUTO_KEY, !autoOn()) });
  function trayMenu() {
    if (!S.logged) return [{ label: '登录', bold: true, action: openLogin }, '-', autoItem(), '-', { label: '退出', action: quit }];
    return [
      { label: '打开主面板', bold: true, action: openPanel },
      '-',
      { label: '我在线上', checked: S.status === 'online', action: () => setStatus('online') },
      { label: '离开', checked: S.status === 'away', action: () => setStatus('away') },
      { label: '隐身', checked: S.status === 'invisible', action: () => setStatus('invisible') },
      '-',
      autoItem(),
      '-',
      { label: '退出', action: quit }
    ];
  }

  // 勾选框（登录框、系统设置都用）
  const chk = (label, on, onClick) => {
    const box = el('span', { class: 'kk-box' + (on ? ' on' : '') });
    const c = el('span', { class: 'kk-chk' }, [box, el('span', { text: label })]);
    c.addEventListener('click', () => { OS.sound.play('click'); onClick(box); });
    return c;
  };

  /* ================= 系统设置：开机自动登录（跟登录框、托盘右键里的“自动登录”是同一个开关） ================= */
  let setWin = null;
  function openSettings() {
    if (alive(setWin)) { OS.wm.focus(setWin); return; }
    let on = autoOn();
    const ok = el('button', { class: 'xpbtn default', text: '确定' });
    const no = el('button', { class: 'xpbtn', text: '取消' });
    const content = el('div', { class: 'kk-set' }, [
      el('div', { class: 'kk-set-cap', text: L.setCap }),
      el('div', { class: 'kk-set-box' }, [chk(L.setAuto, on, box => { on = !on; box.classList.toggle('on', on); })]),
      el('div', { class: 'kk-sysbtns' }, [ok, no])
    ]);
    setWin = OS.wm.open({ title: '系统设置', icon: 'koukou', width: 220, content, maximizable: false, minimizable: false, taskbar: false, center: true, onClose: () => { setWin = null; } });
    ok.addEventListener('click', () => { OS.sound.play('click'); OS.save.set(AUTO_KEY, on); setWin.close(); });
    no.addEventListener('click', () => { OS.sound.play('click'); setWin.close(); });
  }

  /* ================= 登录框 ================= */
  function openLogin() {
    if (S.logged) return openPanel();
    if (alive(S.login)) { OS.wm.focus(S.login); return S.login; }
    ensureTray();
    let inv = false, auto = OS.save.get(AUTO_KEY, true) !== false;   // 自动登录：第一次默认勾上；在托盘里关掉过，这里就显示没勾
    const link = (text, fn) => { const a = el('span', { class: 'kk-link', text }); a.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return a; };
    const btn = (text, fn, cls) => { const b = el('button', { class: 'xpbtn' + (cls ? ' ' + cls : ''), text }); b.addEventListener('click', () => { OS.sound.play('click'); fn(); }); return b; };
    // 号码下拉框（游戏里自己画的菜单，跟着画面放大）
    const numText = el('span', { class: 'xl-pick-text', text: MY_NUM });
    const numBox = el('div', { class: 'xl-pick kk-num' }, [numText, el('span', { class: 'xl-pick-arrow' })]);
    numBox.addEventListener('click', e => {
      e.stopPropagation();
      OS.sound.play('click');
      const r = numBox.getBoundingClientRect(), p = OS.stage.toLocal(r.left, r.bottom);
      OS.ui.contextMenu(NUMS.map(([n, err]) => ({ label: n, checked: n === MY_NUM, action: err ? say(SOFT, 'error', err) : () => {} })), p.x, p.y);
    });
    const tabs = el('div', { class: 'kk-ltabs' }, [['抠抠号码', null], ['手机号码', L.tabPhone], ['电子邮箱', L.tabMail]].map(([t, joke], i) => {
      const s = el('span', { class: 'kk-ltab' + (i === 0 ? ' on' : ''), text: t });
      if (joke) s.addEventListener('click', () => { OS.sound.play('click'); OS.ui.dialog(Object.assign({ title: SOFT }, joke)); });
      return s;
    }));
    const form = el('div', { class: 'kk-form' }, [
      tabs,
      el('div', { class: 'kk-row' }, [el('span', { class: 'kk-lab', text: '抠抠号码：' }), numBox, btn('清除', say(SOFT, 'info', L.clear), 'kk-sbtn')]),
      el('div', { class: 'kk-row' }, [el('span', { class: 'kk-lab', text: '抠抠密码：' }), el('div', { class: 'kk-pw', text: '●●●●●●●●' }), link('忘记密码', say('忘记密码', 'info', L.forgot))]),
      el('div', { class: 'kk-row kk-checks' }, [
        chk('记住密码', true, say(SOFT, 'warn', L.unremember)),
        chk('隐身登录', false, box => { inv = !inv; box.classList.toggle('on', inv); }),
        chk('自动登录', auto, box => { auto = !auto; box.classList.toggle('on', auto); })
      ])
    ]);
    const body = el('div', { class: 'kk-lbody' }, [form]);
    const goBtn = btn('登录', () => go(), 'default');
    const content = el('div', { class: 'kk-login' }, [
      el('div', { class: 'kk-banner' }, [OS.iconEl('koukou', 'kk-logo'), el('span', { class: 'kk-slogan', text: SLOGAN })]),
      body,
      el('div', { class: 'kk-lfoot' }, [link('申请密码保护', say('申请密码保护', 'info', L.protect)), el('span', { class: 'kk-sp' }), goBtn, btn('取消', () => win.close()), btn('注册向导', say('注册向导', 'info', L.register))])
    ]);
    const win = OS.wm.open({ title: '抠抠用户登录', icon: 'koukou', width: 300, appId: app.id, content, maximizable: false, center: true, onClose: () => { S.login = null; } });
    S.login = win;
    let going = false;
    function go() {
      if (going) return;
      going = true;
      goBtn.disabled = true;
      const fill = el('div', { class: 'kk-pfill' });
      body.textContent = '';
      body.appendChild(el('div', { class: 'kk-logging' }, [OS.iconEl('koukou', 'kk-spin'), el('div', { text: L.logging }), el('div', { class: 'kk-pbar' }, [fill])]));
      requestAnimationFrame(() => { fill.style.width = '100%'; });
      setTimeout(() => { if (!alive(win)) return; OS.save.set(AUTO_KEY, auto); login(inv); win.close(); }, 1700);
    }
    return win;
  }
  function login(invisible) {
    S.logged = true;
    S.status = invisible ? 'invisible' : 'online';
    OS.sound.play('kkCrow');
    updateTray();
    openPanel();
    // 上线一会儿：同桌来找你；过一阵班长催作业；再过一阵系统消息有人加你
    later(() => { if (S.turn.deskmate == null) { S.turn.deskmate = 0; friendSay('deskmate'); } }, 6000);
    later(() => { if (S.turn.monitor == null) { S.turn.monitor = 0; friendSay('monitor'); } }, 40000);
    later(sysRequest, 25000);
    S.deleted.forEach(id => later(() => sysRequest(id), readdDelay()));   // 删掉的好友：上线后照样来加你
    if (invisible) caughtInvisible();
  }
  // 隐身也没用：几秒后有人装了外挂看见你
  let invN = 0;
  function caughtInvisible() {
    const n = ++invN;
    later(() => {
      if (n !== invN || S.status !== 'invisible') return;
      const spies = INV_SPIES.filter(id => !S.blocked.has(id) && !S.offline.has(id) && !S.deleted.has(id));
      if (spies.length) deliver(OS.pick(spies), INV_CAUGHT);
    }, 3500);
  }
  function quit() {
    Object.values(S.chats).forEach(c => alive(c.win) && c.win.close());
    [S.panel, S.qun, S.login, S.sysWin].forEach(w => alive(w) && w.close());
    const keep = { deleted: S.deleted, blocked: S.blocked, offline: S.offline, left: S.left, gone: S.gone, qunShake: S.qunShake, muted: S.muted };
    S.timers.forEach(clearTimeout);
    if (S.tray) S.tray.remove();
    S = Object.assign(fresh(), keep);   // 退出再登录：拉黑、退群这些这次开机里还算数
  }

  /* ================= 主面板 ================= */
  function openPanel() {
    if (!S.logged) return openLogin();
    if (alive(S.panel)) { OS.wm.focus(S.panel); return S.panel; }
    const W = OS.stage.work;
    const head = el('div', { class: 'kk-head' });
    const list = el('div', { class: 'kk-list' });
    const fbtn = (text, fn) => { const b = el('span', { class: 'kk-fbtn', text }); b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); fn(b); }); return b; };
    const foot = el('div', { class: 'kk-foot' }, [
      fbtn('查找', say('查找', 'info', L.find)),
      fbtn('消息', () => (S.sysQueue.length ? openSys() : OS.ui.dialog({ title: '消息', icon: 'info', text: L.noMsg }))),
      fbtn('抠币', say('抠币', 'info', L.coin)),
      fbtn('菜单', b => {
        const r = b.getBoundingClientRect(), p = OS.stage.toLocal(r.left, r.top);
        OS.ui.contextMenu([
          { label: '个人资料', action: () => OS.ui.dialog({ title: '个人资料', icon: 'info', text: L.profile.replace('{sig}', listening ? '♪ 正在听：' + listening : L.noSig) }) },
          { label: '系统设置', action: openSettings },
          '-',
          { label: '退出', action: quit }
        ], p.x, p.y - 64);
      })
    ]);
    const content = el('div', { class: 'kk-panel' }, [head, list, foot]);
    // 主面板不占任务栏（那几年就是这样：主面板只待在托盘里，聊天窗口才上任务栏）
    const win = OS.wm.open({ title: SOFT, icon: 'koukou', width: 150, height: 300, x: W.x + W.w - 154, y: W.y + 4, appId: app.id, content, maximizable: false, taskbar: false, onClose: () => { S.panel = null; S.panelParts = null; } });
    S.panel = win;
    S.panelParts = { head, list };
    dockable(win);
    list.addEventListener('click', () => { S.sel = null; renderPanel(); });
    renderPanel();
    return win;
  }
  /* 靠边自动隐藏（那几年就有）：主面板拖到屏幕最上面松手 → 往上收，只露一条细边；
     鼠标移到细边上滑下来，移开又收回去。手机上没有“移过去”：点一下细边滑下来，点别处收回去。往下拖离顶边就不收了。 */
  const DOCK_STRIP = 6, DOCK_HIDE_MS = 600;
  function dockable(win) {
    const top = () => OS.stage.work.y;
    let docked = false, shown = false, dragging = false, hideT = 0, slideT = 0;
    const slide = y => {
      win.el.classList.add('kk-sliding');
      win.y = y;
      win.el.style.top = y + 'px';
      clearTimeout(slideT);
      slideT = setTimeout(() => win.el.classList.remove('kk-sliding'), 260);
    };
    const hideUp = () => {
      if (!docked || dragging || win.isClosed) return;
      if (OS.ui.menuOpen()) { hideT = setTimeout(hideUp, DOCK_HIDE_MS); return; }   // 右键菜单开着先别收
      shown = false;
      slide(top() - win.el.offsetHeight + DOCK_STRIP);
      // 收好以后只留最下面那一条细边，其余部分整个藏掉（不然顶上快讯条是半透明的，会透出面板底下的按钮，像 bug）
      setTimeout(() => { if (docked && !shown) win.el.classList.add('kk-tucked'); }, 240);
    };
    const showDown = () => {
      if (!docked) return;
      clearTimeout(hideT);
      if (!shown) { shown = true; win.el.classList.remove('kk-tucked'); slide(top()); }
    };
    const later = ms => { clearTimeout(hideT); hideT = setTimeout(hideUp, ms); };
    // 拖完松手：贴着最上面就停靠，离开顶边就取消
    const t = win.titleEl;
    t.addEventListener('pointerdown', e => { if (!e.target.closest('.wb')) { dragging = true; clearTimeout(hideT); } }, true);
    const dropped = () => {
      if (!dragging) return;
      dragging = false;
      setTimeout(() => {
        if (win.isClosed || win.minimized) return;
        if (win.y <= top() + 1) { docked = true; shown = true; later(500); }
        else { docked = false; shown = false; win.el.classList.remove('kk-tucked'); }
      }, 0);
    };
    t.addEventListener('pointerup', dropped);
    t.addEventListener('pointercancel', dropped);
    // 鼠标：移上去滑下来，移开收回去
    win.el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') showDown(); });
    win.el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && docked && !dragging) later(DOCK_HIDE_MS); });
    // 手机：点细边滑下来；点别处收回去
    win.el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && docked && !shown) showDown(); }, true);
    const outside = e => {
      if (win.isClosed) { document.removeEventListener('pointerdown', outside, true); return; }
      if (docked && shown && !win.el.contains(e.target) && !e.target.closest('.ctx')) later(150);
    };
    document.addEventListener('pointerdown', outside, true);
    // 托盘点铁公鸡：收着就滑下来，过一会儿没碰它再收回去
    win.kkDock = { hidden: () => docked && !shown, show: () => { showDown(); later(2500); } };
  }

  const STATUS_NAME = { online: '在线', away: '离开', invisible: '隐身' };
  function setStatus(s) {
    S.status = s;
    S.autoReplied.clear();
    updateTray();
    renderPanel();
    if (s === 'away') OS.ui.notify({ title: SOFT, text: L.away, icon: 'info', replace: true });
    if (s === 'invisible') caughtInvisible();
  }
  function renderPanel() {
    if (!S.panelParts) return;
    const { head, list } = S.panelParts;
    head.textContent = '';
    const st = el('span', { class: 'kk-st', text: '（' + STATUS_NAME[S.status] + '）▾' });
    const star = el('span', { class: 'kk-star', text: '★' });
    const me = avEl('me', 'kk-me' + (S.status === 'invisible' ? ' inv' : ''));
    const statusMenu = () => {
      const r = st.getBoundingClientRect(), p = OS.stage.toLocal(r.left, r.bottom);
      OS.sound.play('click');
      OS.ui.contextMenu([
        { label: '我在线上', checked: S.status === 'online', action: () => setStatus('online') },
        { label: '离开', checked: S.status === 'away', action: () => setStatus('away') },
        { label: '隐身', checked: S.status === 'invisible', action: () => setStatus('invisible') },
        '-', { label: '离线', action: quit }
      ], p.x, p.y);
    };
    st.addEventListener('click', e => { e.stopPropagation(); statusMenu(); });
    me.addEventListener('click', e => { e.stopPropagation(); statusMenu(); });
    star.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); OS.ui.dialog({ title: '等级', icon: 'info', text: L.level }); });
    head.appendChild(me);
    head.appendChild(el('div', { class: 'kk-me-info' }, [el('div', { class: 'kk-me-num', text: MY_NUM }), el('div', {}, [st, star])]));
    // 分组
    const scroll = list.scrollTop;
    list.textContent = '';
    GROUPS.forEach(([g, label]) => {
      let ids = [];
      if (g === 'qun') ids = ['qun'];
      else if (g === 'black') ids = Object.keys(F).filter(id => S.blocked.has(id) && !S.deleted.has(id));
      else ids = Object.keys(F).filter(id => F[id].group === g && !S.blocked.has(id) && !S.deleted.has(id) && !(F[id].hidden && S.guimi !== 'friend'));
      const on = id => id === 'qun' || !S.offline.has(id);
      ids.sort((a, b) => on(b) - on(a));
      const cnt = g === 'qun' ? '' : ' [' + ids.filter(on).length + '/' + ids.length + ']';
      const gh = el('div', { class: 'kk-gh', text: (S.open[g] ? '▼ ' : '▶ ') + label + cnt });
      gh.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); S.open[g] = !S.open[g]; renderPanel(); });
      list.appendChild(gh);
      if (!S.open[g]) return;
      ids.forEach(id => {
        const isQun = id === 'qun';
        const f = F[id];
        const unread = S.unread[id] > 0;
        const row = el('div', { class: 'kk-fr' + (S.sel === id ? ' sel' : '') + (unread ? ' jump' : '') + (!isQun && S.offline.has(id) ? ' offl' : '') }, [
          avEl(id, 'kk-fav'),
          el('span', { class: 'kk-fname', text: isQun ? QUN : f.name + (S.blocked.has(id) ? '' : (f.away ? '（离开）' : '') + (f.note || '')) })
        ]);
        let lastT = 0;
        row.addEventListener('click', e => {
          e.stopPropagation();
          S.sel = id;
          list.querySelectorAll('.kk-fr.sel').forEach(n => n.classList.remove('sel'));
          row.classList.add('sel');
          const t = Date.now();
          if (t - lastT < 450) { lastT = 0; isQun ? openQun() : openChat(id); } else lastT = t;
        });
        OS.ui.onContext(row, () => {
          S.sel = id;
          if (isQun) return [{ label: '进入群', bold: true, action: openQun }, { label: '退出该群', action: say('退出该群', 'warn', '退不了：班主任在群里。') }];
          return [
            { label: '发送即时消息', bold: true, action: () => openChat(id) },
            { label: '查看资料', action: say(f.name + ' 的资料', 'info', '昵称：' + f.name + '\n抠抠号码：' + f.num + '\n个性签名：' + f.sig) },
            '-',
            { label: '移至黑名单', action: say(SOFT, 'info', L.toBlack) },
            { label: '删除好友', action: () => askDelete(id) }
          ];
        });
        list.appendChild(row);
      });
    });
    list.scrollTop = scroll;
  }

  /* ================= 消息 ================= */
  // 对方说一句：窗口开着就直接显示，没开着就记未读（托盘闪、面板里头像跳）
  function deliver(id, text, o) {
    o = o || {};
    push(id, { who: o.from || id, text, emo: o.emo });
    const open = id === 'qun' ? alive(S.qun) : (S.chats[id] && alive(S.chats[id].win));
    if (!open) { S.unread[id] = (S.unread[id] || 0) + 1; renderPanel(); updateTray(); }
    if (!o.quiet) OS.sound.play('kkMsg');
    // 离开状态：私聊自动回一句（每人一次）
    if (id !== 'qun' && S.status === 'away' && !S.autoReplied.has(id)) { S.autoReplied.add(id); push(id, { who: 'me', text: L.autoReply }); }
  }
  function push(id, m) {
    m.time = clock();
    (S.log[id] = S.log[id] || []).push(m);
    const c = id === 'qun' ? S.qunParts : S.chats[id];
    if (c && c.logEl && document.body.contains(c.logEl)) { c.logEl.appendChild(msgEl(m)); c.logEl.scrollTop = c.logEl.scrollHeight; }
  }
  const sys = (id, text) => push(id, { who: 'sys', text });
  function msgEl(m) {
    if (m.who === 'sys') return el('div', { class: 'kk-sys', text: m.text });
    const mine = m.who === 'me';
    const name = mine ? '你' : nameOf(m.who);
    const body = m.file ? fileEl(m.file) : m.card ? cardEl(m.card) : m.emo != null ? emoEl(m.emo) : el('div', { class: 'kk-mtext', text: m.text });
    return el('div', { class: 'kk-msg' + (mine ? ' me' : '') }, [el('div', { class: 'kk-mh', text: name + '  ' + m.time }), body]);
  }
  function cardEl(c) {
    return el('div', { class: 'kk-card' }, [
      el('div', { class: 'kk-card-cap', text: '[图片] 欠条.jpg' }),
      el('div', { class: 'kk-card-p' }, [el('b', { text: '欠　条' }), el('div', { text: '欠款人：' + c.who }), el('div', { text: '共计 ¥' + c.total })])
    ]);
  }

  // 发过去的文件：灰条写文件名，下面图标 + 开头几句
  function fileEl(f) {
    return el('div', { class: 'kk-card kk-file' }, [
      el('div', { class: 'kk-card-cap', text: '[文件] ' + f.name }),
      el('div', { class: 'kk-file-row' }, [OS.iconEl(f.icon || 'doc', 'kk-file-ico'), el('div', { class: 'kk-file-t', text: f.text })])
    ]);
  }

  /* ================= 聊天剧本 ================= */
  function friendSay(id) {
    const f = F[id];
    if (!f || S.blocked.has(id) || S.offline.has(id) || S.deleted.has(id)) return;
    const t = f.turns[S.turn[id]];
    if (t) deliver(id, t.say);
    S.wait[id] = true;
    refreshChips(id);
  }
  function chipsFor(id) {
    if (!S.wait[id] || S.blocked.has(id) || S.offline.has(id)) return [];
    const t = F[id].turns[S.turn[id]];
    return t ? t.choices.map(c => c[0]) : GENERIC_CHIPS;
  }
  function choose(id, i) {
    const f = F[id];
    if (S.blocked.has(id)) { sys(id, BLOCKED_SEND); return; }
    if (S.offline.has(id)) { sys(id, OFFLINE_SEND); return; }
    const t = f.turns[S.turn[id]];
    const mine = t ? t.choices[i][0] : GENERIC_CHIPS[i];
    push(id, { who: 'me', text: mine });
    S.wait[id] = false;
    refreshChips(id);
    // 记下每轮选了第几个；连着两轮都选同一个“特殊选项”，对方有专门的一句（比如火星文网友破功）
    const picks = S.picks[id] = S.picks[id] || [];
    if (t) picks.push(i);
    let reply = t ? t.choices[i][1] : OS.pick(f.generic || GENERIC_REPLY);
    if (t && f.twice && picks.length >= 2 && picks.slice(-2).every(p => p === f.twice.pick)) reply = f.twice.line;
    later(() => {
      if (S.blocked.has(id)) return;
      deliver(id, reply);
      if (t && t.after === 'offline') { later(() => goOffline(id), 900); return; }
      if (t) { S.turn[id]++; later(() => friendSay(id), 1300); }
      else { S.wait[id] = true; refreshChips(id); }
    }, 900 + Math.random() * 500);
  }
  function goOffline(id) {
    S.offline.add(id);
    sys(id, '（对方已下线）');
    refreshChips(id);
    renderPanel();
  }
  function refreshChips(id) {
    const c = S.chats[id];
    if (!c || !alive(c.win)) return;
    c.chipsEl.textContent = '';
    chipsFor(id).forEach((t, i) => {
      const ch = el('div', { class: 'kk-chip', text: t });
      ch.addEventListener('click', () => { OS.sound.play('click'); choose(id, i); });
      c.chipsEl.appendChild(ch);
    });
  }

  /* ================= 聊天窗口 ================= */
  function spot(w, h) {
    const W = OS.stage.work, n = Object.keys(S.chats).length;
    return { x: W.x + 8 + (n % 5) * 16, y: W.y + 6 + (n % 5) * 12 };
  }
  function chatTools(id, c, isQun) {
    const tb = (label, fn) => { const b = el('span', { class: 'kk-tb', text: label }); b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); fn(b); }); return b; };
    const pick = el('div', { class: 'kk-epick' }, Array.from({ length: EMO_N }, (_, i) => {
      const b = emoEl(i);
      b.addEventListener('click', e => { e.stopPropagation(); OS.sound.play('click'); pick.classList.remove('on'); sendEmo(id, i); });
      return b;
    }));
    c.body.addEventListener('click', () => pick.classList.remove('on'));
    return { bar: el('div', { class: 'kk-tools' }, [
      tb('字体', say('字体', 'info', L.font)),
      tb('表情', () => pick.classList.toggle('on')),
      tb('窗口抖动', () => (isQun ? qunShake() : shake(id))),
      tb('发送文件', say('发送文件', 'error', L.file))
    ]), pick };
  }
  function openChat(id, o) {
    o = o || {};
    const f = F[id];
    if (!f) return null;
    if (S.chats[id] && alive(S.chats[id].win)) { OS.wm.focus(S.chats[id].win); if (o.shake) shakeWin(S.chats[id].win); return S.chats[id].win; }
    const c = { id };
    const logEl = el('div', { class: 'kk-log' });
    const chipsEl = el('div', { class: 'kk-chips' });
    const body = el('div', { class: 'kk-chat' });
    c.body = body;
    const tools = chatTools(id, c, false);
    const sendBtn = el('button', { class: 'xpbtn kk-send', text: '发送(S)' });
    const closeBtn = el('button', { class: 'xpbtn', text: '关闭(C)' });
    const histBtn = el('span', { class: 'kk-link', text: '聊天记录(H)' });
    const dressBtn = el('button', { class: 'xpbtn kk-dress', text: '换装' });
    body.appendChild(el('div', { class: 'kk-chead' }, [avEl(id, 'kk-cav'), el('div', {}, [el('div', { class: 'kk-cname', text: f.name + '（' + f.num + '）' }), el('div', { class: 'kk-csig', text: f.sig })])]));
    body.appendChild(el('div', { class: 'kk-cmain' }, [
      el('div', { class: 'kk-cleft' }, [logEl, tools.bar, chipsEl, el('div', { class: 'kk-cbtns' }, [histBtn, el('span', { class: 'kk-sp' }), closeBtn, sendBtn])]),
      el('div', { class: 'kk-cright' }, [el('div', { class: 'kk-cap', text: '抠秀形象' }), showEl(id), dressBtn])
    ]));
    body.appendChild(tools.pick);
    const p = o.x != null ? o : spot();
    const win = OS.wm.open({ title: '与 ' + f.name + ' 聊天中', icon: 'koukou', width: 300, height: 250, x: p.x, y: p.y, content: body, maximizable: false, onClose: () => { if (S.chats[id] === c) delete S.chats[id]; } });
    Object.assign(c, { win, logEl, chipsEl });
    S.chats[id] = c;
    (S.log[id] || []).forEach(m => logEl.appendChild(msgEl(m)));
    logEl.scrollTop = logEl.scrollHeight;
    closeBtn.addEventListener('click', () => { OS.sound.play('click'); win.close(); });
    sendBtn.addEventListener('click', () => { OS.sound.play('click'); const first = chipsFor(id); if (first.length) choose(id, 0); });
    histBtn.addEventListener('click', () => { OS.sound.play('click'); S.log[id] = []; logEl.textContent = ''; OS.ui.dialog({ title: '聊天记录', icon: 'info', text: L.history, buttons: [L.historyBtn] }); });
    dressBtn.addEventListener('click', () => { OS.sound.play('click'); OS.ui.dialog({ title: '换装', icon: 'info', text: L.dress }); });
    S.unread[id] = 0;
    updateTray();
    renderPanel();
    if (S.blocked.has(id)) sys(id, BLOCKED_SEND);
    else if (S.turn[id] == null) { S.turn[id] = 0; later(() => friendSay(id), 600); }
    refreshChips(id);
    if (o.shake) shakeWin(win);
    return win;
  }
  function shakeWin(win, loop) {
    if (!alive(win)) return;
    win.el.classList.remove('kk-shaking');
    void win.el.offsetWidth;
    win.el.classList.add(loop ? 'kk-shaking-loop' : 'kk-shaking');
    OS.sound.play('kkShake');
  }
  function sendEmo(id, i) {
    if (id === 'qun' && S.muted) { sys('qun', MUTE_SEND); return; }
    if (id !== 'qun' && (S.blocked.has(id) || S.offline.has(id))) { sys(id, S.blocked.has(id) ? BLOCKED_SEND : OFFLINE_SEND); return; }
    push(id, { who: 'me', emo: i });
    later(() => {
      if (id === 'qun') deliver('qun', '', { from: OS.pick(members()), emo: Math.floor(Math.random() * EMO_N), quiet: true });
      else if (!S.blocked.has(id) && !S.offline.has(id)) deliver(id, '', { emo: Math.floor(Math.random() * EMO_N) });
    }, 900);
  }
  // 私聊窗口抖动：抖 3 次警告，第 4 次拉黑
  let shakeT = 0;
  function shake(id) {
    if (Date.now() - shakeT < 400) return;
    shakeT = Date.now();
    const c = S.chats[id];
    if (S.blocked.has(id)) { sys(id, BLOCKED_SEND); return; }
    sys(id, SHAKE_SENT);
    if (c) shakeWin(c.win);
    if (S.offline.has(id)) { sys(id, OFFLINE_SEND); return; }
    const n = S.shakes[id] = (S.shakes[id] || 0) + 1;
    later(() => {
      if (n <= SHAKE_LINES.length) { deliver(id, SHAKE_LINES[n - 1]); return; }
      sys(id, BLOCKED);
      S.blocked.add(id);
      S.wait[id] = false;
      refreshChips(id);
      OS.bootFix.add('kk-block', FIX_BLOCK);
      OS.sound.play('error');
      later(() => { const cc = S.chats[id]; if (cc && alive(cc.win)) cc.win.close(); renderPanel(); }, 1400);
    }, 700);
  }

  /* ================= 群 ================= */
  const members = () => QUN_FRIENDS.filter(id => !S.left.has(id)).concat(NPCS);
  function openQun() {
    if (alive(S.qun)) { OS.wm.focus(S.qun); return S.qun; }
    const c = { id: 'qun' };
    const logEl = el('div', { class: 'kk-log' });
    const chipsEl = el('div', { class: 'kk-chips' });
    const body = el('div', { class: 'kk-chat kk-qun' });
    c.body = body;
    const tools = chatTools('qun', c, true);
    const memEl = el('div', { class: 'kk-mem' });
    const closeBtn = el('button', { class: 'xpbtn', text: '关闭(C)' });
    body.appendChild(el('div', { class: 'kk-chead' }, [avEl('qun', 'kk-cav'), el('div', {}, [el('div', { class: 'kk-cname', text: QUN + '（群）' }), el('div', { class: 'kk-csig', text: '群公告：作业按时交，不许刷屏。' })])]));
    body.appendChild(el('div', { class: 'kk-cmain' }, [
      el('div', { class: 'kk-cleft' }, [logEl, tools.bar, chipsEl, el('div', { class: 'kk-cbtns' }, [el('span', { class: 'kk-sp' }), closeBtn])]),
      el('div', { class: 'kk-cright' }, [el('div', { class: 'kk-cap', text: '群成员' }), memEl])
    ]));
    body.appendChild(tools.pick);
    const W = OS.stage.work;
    const win = OS.wm.open({ title: QUN + ' - 群', icon: 'koukou', width: 310, height: 260, x: W.x + 10, y: W.y + 20, content: body, maximizable: false, onClose: () => { S.qun = null; S.qunParts = null; clearInterval(flood); } });
    S.qun = win;
    S.qunParts = { logEl, memEl, chipsEl };
    (S.log.qun || []).forEach(m => logEl.appendChild(msgEl(m)));
    logEl.scrollTop = logEl.scrollHeight;
    QUN_CHIPS.forEach(t => {
      const ch = el('div', { class: 'kk-chip', text: t });
      ch.addEventListener('click', () => { OS.sound.play('click'); if (S.muted) { sys('qun', MUTE_SEND); return; } push('qun', { who: 'me', text: t }); });
      chipsEl.appendChild(ch);
    });
    closeBtn.addEventListener('click', () => { OS.sound.play('click'); win.close(); });
    renderMembers();
    S.unread.qun = 0;
    updateTray();
    renderPanel();
    // 群消息自己往上刷
    const flood = setInterval(() => {
      if (!alive(win)) { clearInterval(flood); return; }
      if (Math.random() < 0.45) return;
      const pool = QUN_LINES.filter(([who]) => members().includes(who));
      const [who, text] = OS.pick(pool);
      deliver('qun', text, { from: who, quiet: true });
    }, 1300);
    return win;
  }
  function renderMembers() {
    const p = S.qunParts;
    if (!p) return;
    p.memEl.textContent = '';
    members().forEach(id => p.memEl.appendChild(el('div', { class: 'kk-mrow' }, [avEl(id, 'kk-fav'), el('span', { text: nameOf(id) })])));
  }
  // 欠条［发到群里］
  function postSlip(info) {
    if (!S.logged) { OS.ui.dialog({ title: SOFT, icon: 'warn', text: L.needLogin }).then(openLogin); return; }
    openQun();
    if (S.muted) { sys('qun', MUTE_SEND); return; }
    push('qun', { who: 'me', card: info });
    OS.sound.play('pop');
    const id = Object.keys(F).find(k => F[k].debt === info.who);
    // 起哄的是别人（被写在欠条上的那位不跟着起哄）
    const cheer = OS.shuffle(SLIP_CHEER.slice()).slice(0, 3);
    const crowd = () => OS.pick(members().filter(m => m !== id));
    cheer.forEach((t, i) => later(() => deliver('qun', t, { from: crowd(), quiet: i > 0 }), 1000 + i * 800));
    const at = 1000 + cheer.length * 800 + 600;
    later(() => {
      if (!id) { deliver('qun', SLIP_STRANGER, { from: OS.pick(members()) }); return; }
      const f = F[id];
      if (S.left.has(id) || S.blocked.has(id)) { deliver('qun', SLIP_ALREADY, { from: OS.pick(members()) }); return; }
      if (f.mute) {
        // 班长：群管理员，回一句然后把你禁言（重启才解除）
        deliver('qun', f.quit, { from: id });
        later(() => {
          sys('qun', MUTED);
          S.muted = true;
          OS.bootFix.add('kk-mute', FIX_MUTE);
          OS.sound.play('error');
        }, 1100);
      } else if (f.inClass) {
        // 在群里：当场回一句，然后退群
        deliver('qun', f.quit, { from: id });
        later(() => {
          sys('qun', f.name + ' 已退出该群。');
          S.left.add(id);
          S.gone.push({ name: info.who, why: '退群了' });
          OS.bootFix.add('kk-quit', FIX_QUIT);
          renderMembers();
        }, 1100);
      } else {
        // 不在群里：群友不认识；本人私聊你一句，然后把你拉黑
        deliver('qun', SLIP_NOBODY, { from: OS.pick(members()) });
        later(() => {
          S.turn[id] = S.turn[id] == null ? 99 : S.turn[id];
          deliver(id, f.quit);
          later(() => {
            sys(id, BLOCKED);
            S.blocked.add(id);
            S.wait[id] = false;
            refreshChips(id);
            S.gone.push({ name: info.who, why: '拉黑了你' });
            OS.bootFix.add('kk-block', FIX_BLOCK);
            renderPanel();
          }, 1200);
        }, 1000);
      }
    }, at);
  }
  // 群里窗口抖动：全班回抖，第 3 次整个桌面抖散架 → 蓝屏
  let qunShakeT = 0;
  function qunShake() {
    if (Date.now() - qunShakeT < 900) return;
    qunShakeT = Date.now();
    if (S.muted) { sys('qun', MUTE_SEND); return; }
    const n = ++S.qunShake;
    sys('qun', '你向全群发送了窗口抖动。');
    shakeWin(S.qun);
    const lines = QUN_SHAKE[Math.min(n, QUN_SHAKE.length) - 1];
    lines.forEach((t, i) => later(() => deliver('qun', t, { from: OS.pick(members()), quiet: true }), 400 + i * 350));
    // 回抖：同学们一个个弹窗口过来抖你
    const count = n === 1 ? 2 : n === 2 ? 5 : 9;
    const W = OS.stage.work;
    const who = OS.shuffle(members().slice());
    for (let i = 0; i < count; i++) {
      later(() => {
        const m = who[i % who.length];
        const x = W.x + Math.random() * (W.w - 300), y = W.y + Math.random() * (W.h - 250);
        if (F[m]) {
          sys(m, nameOf(m) + ' 向你发送了一个窗口抖动。');
          openChat(m, { shake: true, x, y });
          if (n >= 3) shakeWin(S.chats[m] && S.chats[m].win, true);
        } else tempShake(m, x, y, n >= 3);
      }, 500 + i * (n >= 3 ? 160 : 300));
    }
    if (n >= 3) {
      later(() => {
        OS.stage.el.classList.add('kk-quake');
        if (S.qun) shakeWin(S.qun, true);
      }, 500 + count * 160);
      later(() => OS.ui.bsod(BSOD), 500 + count * 160 + 2200);
    }
  }
  // 不是好友的同学（课代表、体委……）：临时会话窗口来抖你
  function tempShake(name, x, y, loop) {
    const body = el('div', { class: 'kk-chat kk-temp' }, [
      el('div', { class: 'kk-chead' }, [avEl(name, 'kk-cav'), el('div', { class: 'kk-cname', text: name + '（临时会话）' })]),
      el('div', { class: 'kk-log' }, [el('div', { class: 'kk-sys', text: name + ' 向你发送了一个窗口抖动。' })])
    ]);
    const win = OS.wm.open({ title: '与 ' + name + ' 临时会话', icon: 'koukou', width: 200, height: 110, x, y, content: body, maximizable: false });
    shakeWin(win, loop);
  }

  /* ================= 系统消息：好友申请（闺蜜来加你；删掉的好友要加回来） ================= */
  const readdDelay = () => READD_MIN + Math.random() * (READD_MAX - READD_MIN);
  // 有人来加你：排进队里，托盘闪；点托盘 /［消息］一条条看
  function sysRequest(id) {
    id = id || 'guimi';
    if (!S.logged) return;
    if (id === 'guimi' ? S.guimi === 'friend' : !S.deleted.has(id)) return;
    if (S.sysQueue.includes(id) || S.sysCur === id) return;
    S.sysQueue.push(id);
    updateTray();
    OS.sound.play('notify');
  }
  function openSys() {
    if (alive(S.sysWin)) { OS.wm.focus(S.sysWin); return; }
    const id = S.sysQueue.shift();
    if (!id) return;
    S.sysCur = id;
    updateTray();
    const n = S.reqN[id] || 0;
    const r = READD[id];
    const text = S.deleted.has(id) && r ? '「' + nameOf(id) + '」请求加你为好友。\n附加消息：' + r.ask[Math.min(n, r.ask.length - 1)] : SYS_ASK;
    const yes = el('button', { class: 'xpbtn default', text: '同意' });
    const no = el('button', { class: 'xpbtn', text: '拒绝' });
    const body = el('div', { class: 'kk-sysbox' }, [
      el('div', { class: 'kk-sysmain' }, [avEl(id, 'kk-cav'), el('div', { class: 'kk-systext', text })]),
      el('div', { class: 'kk-sysbtns' }, [yes, no])
    ]);
    let answered = false;
    // 拒绝 / 直接关掉：过一会儿又来加你（闺蜜头一回 40 秒，删掉的好友 1–3 分钟），附加消息换下一句
    const refuse = () => {
      S.reqN[id] = n + 1;
      later(() => sysRequest(id), id === 'guimi' && !S.deleted.has(id) ? 40000 : readdDelay());
    };
    const win = OS.wm.open({ title: '系统消息', icon: 'koukou', width: 250, content: body, maximizable: false, minimizable: false, taskbar: false, center: true,
      onClose: () => { S.sysWin = null; S.sysCur = null; if (!answered) refuse(); } });
    S.sysWin = win;
    yes.addEventListener('click', () => { OS.sound.play('click'); answered = true; win.close(); accept(id); });
    no.addEventListener('click', () => { OS.sound.play('click'); answered = true; win.close(); refuse(); });
  }
  function accept(id) {
    const back = S.deleted.has(id) && READD[id] ? READD[id].back : null;
    S.deleted.delete(id);
    S.blocked.delete(id);   // 人家主动来加你，之前的拉黑也一笔勾销
    S.reqN[id] = 0;
    if (id === 'guimi') { S.guimi = 'friend'; S.open.stranger = true; }
    S.open[F[id].group] = true;
    renderPanel();
    if (back) later(() => deliver(id, back), 1500);
    else if (id === 'guimi') later(() => { S.turn.guimi = 0; friendSay('guimi'); }, 1500);
  }
  // 删除好友：确认 → 从列表里消失、聊天窗关掉 → 1–3 分钟后对方来加你
  function askDelete(id) {
    OS.ui.dialog({ title: '删除好友', icon: 'warn', text: L.delAsk(F[id].name), buttons: ['确定', '取消'] }).then(v => {
      if (v !== '确定' || !S.logged || S.deleted.has(id)) return;
      S.deleted.add(id);
      if (id === 'guimi') S.guimi = 'none';
      S.wait[id] = false;
      S.unread[id] = 0;
      S.reqN[id] = 0;
      const c = S.chats[id];
      if (c && alive(c.win)) c.win.close();
      if (S.sel === id) S.sel = null;
      S.sysQueue = S.sysQueue.filter(x => x !== id);
      renderPanel();
      updateTray();
      later(() => sysRequest(id), readdDelay());
    });
  }

  /* ================= 打开 / 重启 ================= */
  app.open = function () { return S.logged ? openPanel() : openLogin(); };
  // 开机：上次登录时勾了“自动登录”（托盘右键也能开关）→ 直接登录；没勾 / 从没登录过 → 弹登录框（那几年装了它都这样）
  OS.on('desktop:ready', () => {
    setTimeout(() => {
      if (OS.boot.state !== 'desktop' || S.logged || alive(S.login)) return;
      if (autoOn()) { ensureTray(); login(false); } else openLogin();
    }, 2600);
  });
  // 重启：全部恢复（拉黑、退群、绝交名单都清掉）
  OS.on('desktop:reset', () => {
    S.timers.forEach(clearTimeout);
    if (S.tray) S.tray.remove();
    OS.stage.el.classList.remove('kk-quake');
    S = fresh();
  });

  // 千千不听放歌时，个性签名变成“♪ 正在听：歌名”（停了就恢复）
  let listening = null;

  // 给别的软件用：欠条的［发到群里］、Excuse 的“绝交名单”
  OS.koukou = {
    setListening: t => { listening = t || null; },
    postSlip,
    gone: () => S.gone.slice(),
    loggedIn: () => S.logged,
    // 别的软件让某个好友发来一句（网上邻居：转发“长寿”文章后有人回）；没登录 / 被拉黑 / 下线了就发不到
    // 别的软件替你给所有好友发一个文件（网上邻居：转发“长寿”文章）；拉黑你的不发，下线的照发但提示对方不在
    sendFile: file => {
      if (!S.logged) return 0;
      let n = 0;
      Object.keys(F).forEach(id => {
        if (S.blocked.has(id) || S.deleted.has(id) || (F[id].hidden && S.guimi !== 'friend')) return;
        push(id, { who: 'me', file });
        if (S.offline.has(id)) sys(id, OFFLINE_SEND);
        n++;
      });
      return n;
    },
    receive: (id, text) => { if (!S.logged || !F[id] || S.blocked.has(id) || S.offline.has(id) || S.deleted.has(id)) return false; deliver(id, text); return true; },
    uninstall: say('卸载 抠抠2003', 'warn', L.uninstall)
  };
})();
