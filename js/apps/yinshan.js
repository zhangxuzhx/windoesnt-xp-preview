/* 银山打字通 2003（照那几年的打字练习软件做的；创意稿见「银山打字通-创意.md」）
   - 桌面上顶掉弹窗杀手那一格；开始 ▸ 所有程序 ▸ 银山打字通
   - 进门先登录（用户名"你"）；左边一排：英文打字 ／ 拼音打字 ／ 二笔测试 ／ 速度测试 ／ 打字游戏 ／ 个人成绩
   - 手机和电脑一样玩（作者定 2B）：电脑敲键盘；手机点屏幕——
     键位练习：屏幕键盘只亮这一课的键；一长串字母（单词、文章、速度测试、班主任抓逃课）：下面一排字母块，
     下一个字母 + 几个捣乱的，5 选 1，连对 10 个 4 选 1、30 个 3 选 1、50 个 2 选 1，打错或停太久连击清零
   - 拼音打字：选字（选错了句子很好笑）；二笔测试：弱智吧式笑话单选题，四档鉴定结果（作者写的）
   - 五个打字小游戏在 yinshan-games.js；这里放共用的东西（OS.yinshanKit）
   OS.yinshan：open ／ closeAll */
(function () {
  'use strict';
  const el = OS.el;
  const app = OS.apps.byId.yinshan;
  if (!app) return;
  const NAME = '银山打字通 2003';
  const ART = 'assets/yinshan/';
  const PF = 'C:\\Program Files\\银山打字通';
  const LESSON_DIR = PF + '\\游戏\\班主任抓逃课';
  const LESSON_PATH = LESSON_DIR + '\\课文.txt';

  /* ================= 文案 ================= */
  const L = {
    slogan: '天天练打字，月月涨工资。',
    login: '用户登录', user: '用户名：', loginBtn: '登录', loginTip: '第一次来？用户名就叫"你"吧。',
    tabs: [['en', '英文打字'], ['py', '拼音打字'], ['eb', '二笔测试'], ['speed', '速度测试'], ['game', '打字游戏'], ['me', '个人成绩']],
    enTabs: [['key', '键位练习'], ['word', '单词练习'], ['art', '文章练习']],
    lessons: ['第 1 课', '第 2 课', '第 3 课', '第 4 课', '第 5 课'],
    lessonTip: ['ASDFJKL：手指放中间那一排。', '加上 GH：食指往里伸一下。', '上面一排：Q W E R T Y U I O P', '下面一排：Z X C V B N M', '全部：26 个字母一起来。'],
    stat: (cpm, acc, n, all) => '速度 ' + cpm + ' 字/分　正确率 ' + acc + '%　' + n + ' / ' + all,
    again: '再来一组', next: '下一篇', keyDone: '练完了！',
    done: (cpm, acc) => '练完了！速度 ' + cpm + ' 字/分，正确率 ' + acc + '%。',
    combo: n => '连击 ' + n,
    space: '空格',
    pyTip: '看拼音，选字。电脑上按数字键。',
    pyOut: '你打出来的：', pyRight: '本来应该是：', pyNext: '下一句',
    pyAllRight: '一个字都没选错，你的输入法很听话。', pyWrong: '那几年的拼音输入法，打出来就是这样。',
    ebIntro: '二笔测试\n本测试共 10 题，每题 10 分。\n请凭你的第一直觉作答。', ebStart: '开始测试', ebQ: (i, n) => '第 ' + i + ' 题 ／ 共 ' + n + ' 题',
    ebScore: n => '你的成绩：' + n + ' 分', ebAgain: '再测一次', cert: '打印证书',
    speedPick: '限时 60 秒，看你一分钟能打多少字。', speedEn: '英文', speedPy: '拼音', speedGo: '开始测试', left: s => '还剩 ' + s + ' 秒',
    speedRes: (cpm, acc) => '速度 ' + cpm + ' 字/分　正确率 ' + acc + '%',
    speedSay: [[30, '一指禅大师。'], [60, '二指禅，还行。'], [120, '合格的网虫。'], [200, '打字员水平！'], [1e9, '你是不是开了外挂？']],
    gameTip: '挑一个玩。电脑按键盘，手机直接点。',
    welcome: '欢迎您使用银山打字通 2003！', hello: '当前用户：你', back: '返回主界面', enter: '进入', records: '个人记录', change: '更改用户',
    gTitle: '打字游戏', exit: '退出', pickLv: '选难度：',
    tutTitle: '手指放哪里：每种颜色是一根手指管的键。', fingers: ['左手小指', '左手无名指', '左手中指', '左手食指', '右手食指', '右手中指', '右手无名指', '右手小指'],
    tutTips: ['坐正，眼睛看屏幕，别低头看键盘；空格键用大拇指按。', '两个食指放在 F 和 J 上：这两个键上有小凸起，摸得到。', '每根手指只管自己那一列，打完回到中间那一排。'],
    best: n => '最高分 ' + n, level: ['初级', '中级', '高级'], play: '开始',
    meEmpty: '还没有成绩，先去练练。', meTitle: '最近 20 次的速度（字/分）',
    modes: { key: '键位', word: '单词', art: '文章', py: '拼音', sEn: '测速·英文', sPy: '测速·拼音' },
    sSpeed: '速度', sTime: '时间', sAcc: '正确率', sProg: '进度', perMin: ' 字/分',
    pyTab: '选字练习', ebTab: '二笔测试', tutTab: '手指分工', meTab: '练习记录',
    speedTabs: [['en', '英文测试'], ['py', '拼音测试'], ['rank', '排行榜']], rankBtn: '排行榜',
    rankHead: ['名次', '用户名', '速度', '正确率', '日期'], rankEmpty: '还没有成绩，先测一次。', you: '你',
    meHead: ['编号', '详细记录', '时间'],
    gameSub: '五个打字小游戏，挑一个玩。', exitAsk: '真的不玩了？', yes: '是', no: '否'
  };
  // 二笔测试：作者写的四档鉴定结果（2026-11-24 作者换过一版，现实里的牌子都去掉了）
  const EB_RES = [
    [60, '【鉴定结果：不合格】', '狂晕 -_-||| 你的大脑光滑得像刚拿抹布擦过的纯平显示器，半点二笔灵气都米有！老实交代，是不是拿 HB 铅笔混进来涂卡的正常人？出去表说自己练过二笔，偶替你感到郁闷！'],
    [80, '【鉴定结果：菜鸟级二笔】', '马马虎虎啦 ^_^ 二笔得已经像模像样了！虽然做题时偶尔还会不小心动一下正常人的脑筋，但只要坚持每天拿脑门撞两下机箱巩固一下，离大虾境界指日可待，我看好你哟！'],
    [100, '【鉴定结果：走召弓虽！】', '瀑布汗……I 服了 You！看你骨骼惊奇、脑回路清奇，绝对是万中无一的二笔奇才！地球对你的智商来说已经太危险了，赶紧收拾包袱回火星当球长吧 Orz'],
    [101, '【鉴定结果：免检真二笔！！】', '绝倒 Orz……五体投地拜强人！！连一道题都没蒙错，你是从小把 2B 铅笔芯当干脆面啃长大的吧？！连本软件的 CPU 都宣布甘拜下风——啥也别说了，你是真二笔呀！']
  ];
  // 题库（作者写的 20 题；第 4、8 题里的"网吧"换成了同学 ／ 表哥）：[题目, [四个选项], 最二的是第几个]
  const EB_Q = [
    ['家里刚连上宽带，原本好好的鼠标突然滑不动了，最可能的原因是？', ['鼠标底下的橡胶滚球粘满灰泥了', '机箱后面的鼠标插头松了', '桌角刚摆了一台拨号用的"猫"，鼠标吓僵了', '桌面太光滑反光了'], 2],
    ['下载电影卡在 99.9% 死活不动了，怎么补齐最后那 0.1%？', ['把显示器往右边垫高一点，让进度条顺着斜坡流满', '断开宽带重新拨号连接', '换个下载链接重头再下', '等半夜没人抢网速再试'], 0],
    ['为什么大冬天坐在书房玩电脑，总觉得后背嗖嗖发凉？', ['屋里暖气片没烧热', '坐太久血液不循环', '机箱风扇转速太快了', '桌面上同时开了十几个"窗口"，漏风'], 3],
    ['怎么用一张 1.44MB 的小软盘，把同学电脑里好几个 G 的大型游戏拷回家玩？', ['切成几千个分卷压缩包慢慢搬', '直接把桌面上那个 1KB 的游戏快捷方式拖进软盘，轻便又省地儿', '软盘容量太小，根本装不下', '攒钱买个大容量移动硬盘'], 1],
    ['开机黑屏报错"未检测到键盘，请按 F1 键继续"，此时最标准的操作是？', ['关机把机箱后面的键盘圆口插紧', '去邻居家借个好键盘插上试试', '拿螺丝刀把别人键盘上的 F1 键帽抠下来，摆在自家桌上用力按下去', '按机箱上的重启小按钮'], 2],
    ['大屁股显示器的玻璃屏幕右上角磕裂了一道缝，怎么让修电脑的师傅帮忙看一眼？', ['按一下键盘上的截屏键，截张全屏图发过去', '借台相机拍张照片洗出来', '抱去电脑城现场给他看', '打电话用嘴描述裂纹形状'], 0],
    ['双击桌面上的"网上邻居"图标，为什么打开后里面空空如也？', ['局域网网线水晶头没插好', '没有设置同一个工作组', '网卡驱动程序没装好', '对门那户人家刚买房，还没搬进来住'], 3],
    ['怎样才能最快把聊天软件的在线等级从"星星"升到"太阳"？', ['每天挂满十几个小时慢慢熬', '大中午把显示器抱到阳台上暴晒两个钟头', '开通会员享受等级加速', '拜托表哥帮忙通宵挂机'], 1],
    ['杀毒软件突然报警"您的电脑同时中了 8 个木马"，怎么处理最划算？', ['把它们首尾连成一圈改建成"旋转木马"，拉去小区门口收门票回本', '立即拔掉网线进安全模式查杀', '格式化硬盘重装系统', '把报警框关掉假装没看见'], 0],
    ['电脑不幸感染了恶性"蠕虫病毒"，以下哪种偏方最对症？', ['下载专杀工具彻底清理', '删掉所有来历不明的文件', '对着机箱散热孔喷两下杀虫气雾剂，拿塑料袋闷五分钟', '关机断电晾三天把虫饿死'], 2],
    ['半夜在电脑上写五千字检讨还没保存，突然全楼停电黑屏了，第一件事该干嘛？', ['拔掉电源插排防来电烧坏主机', '认命上床睡觉，明天早起重写', '去窗边看看是不是整栋楼都停了', '赶紧点一根蜡烛凑近屏幕照一照，看看刚打的字还在不在'], 3],
    ['同学递给你一张空白光盘让你帮他"烧一张盘"，正确的操作步骤是？', ['打开刻录程序添加数据文件', '用火钳夹住光盘架在煤气灶上，小火慢烤至两面金黄', '先看自家光驱支不支持刻录功能', '把文件直接复制粘贴进光驱盘符'], 1],
    ['为了检验电脑里的"防火墙"到底管不管用，最严谨的测试方法是？', ['掏出打火机点一下机箱外壳，看看能不能烧着', '断开外网测试端口连接拦截', '查看右下角安全图标有没有亮', '故意打开陌生网页看会不会报警'], 0],
    ['电脑课老师要求期末必须练成打字"盲打"，速成秘诀是？', ['把食指老老实实放在键盘有小凸起的定位键上', '每天默写一遍键盘字母排列顺序', '盯着屏幕打字，强迫自己不低头看手', '拿黑布条把眼睛蒙死，抡起双手摸到哪个键算哪个键'], 3],
    ['音箱没声音了，电脑提示"找不到声卡驱动"，原因通常是？', ['音箱背后的音频线插错孔了', '这台电脑出厂未满 18 周岁，考不了驾照没法"驱动"', '主板附送的驱动光盘没装', '右下角的小喇叭被勾了静音'], 1],
    ['电脑老是提示"内存不足"、记不住刚复制的东西，怎么给它补补脑子？', ['去电脑城加装一根内存条', '关掉后台没用的程序腾空间', '往光驱托盘里摆两颗核桃，按关门键给它夹碎了吃', '重启电脑清空剪贴板缓存'], 2],
    ['桌面上的"回收站"已经塞满了，怎么处理收益最高？', ['右键点击选择"清空回收站"', '等楼下收废品大爷路过时，抱起机箱冲下去卖五块钱', '删文件时直接彻底删除绕过回收站', '进属性设置里调大回收站空间'], 1],
    ['期末涂答题卡规定必须用"2B铅笔"，进考场发现忘带了怎么办？', ['举手向监考老师求助借一支', '找前排同学把铅笔掰半截分你', '先拿圆珠笔在草稿纸上记答案', '拿两支 1B 铅笔用橡皮筋捆在一起涂，1B 加 1B 刚好等于 2B'], 3],
    ['泡红烧牛肉面时，怎样才能吃出包装袋上印着的那几大块牛肉？', ['直接把印着牛肉的塑料包装袋剪碎了，泡进面汤里一起吃', '让老妈切两片熟牛肉放进去', '多放半包调料粉提味', '死心吧，袋子底下印着"图案仅供参考"'], 0],
    ['爸妈花两百块钱买的"英语磁带复读机"，怎样才能发挥它的最大潜能？', ['每天早上六点跟读课文练发音', '塞进流行歌曲磁带躲被窝里偷听', '跟老妈顶嘴吵累了，录一句"我不听"按死复读键，摆在桌上替自己接着吵', '用圆珠笔插进磁带孔里练习手摇倒带'], 2]
  ];
  // 拼音打字：一句话拆成几个词，每个词 [拼音, 候选字（第一个是对的，显示时打乱）]
  const PY = [
    [['wo', ['我', '窝', '握', '卧', '沃']], ['xiang', ['想', '像', '向', '香', '箱']], ['chi fan', ['吃饭', '迟返', '赤贩', '持帆']]],
    [['jin tian', ['今天', '金田', '禁天', '进添']], ['zuo ye', ['作业', '昨夜', '坐椰', '做也']], ['hao duo', ['好多', '号舵', '耗夺', '豪躲']]],
    [['wang su', ['网速', '王素', '往诉', '忘塑']], ['tai man', ['太慢', '泰曼', '胎馒', '态蛮']], ['le', ['了', '乐', '勒', '肋']]],
    [['wo', ['我', '窝', '握', '卧']], ['shi', ['是', '事', '市', '狮']], ['ni', ['你', '泥', '尼', '逆']], ['tong zhuo', ['同桌', '铜桌', '童捉', '痛啄']]],
    [['xia ke', ['下课', '虾壳', '吓客', '峡刻']], ['qu', ['去', '区', '趣', '曲']], ['da qiu', ['打球', '大球', '搭裘', '达秋']]],
    [['ma ma', ['妈妈', '麻麻', '马马', '蚂蚂']], ['jiao', ['叫', '教', '脚', '饺']], ['ni', ['你', '泥', '尼']], ['hui jia', ['回家', '灰夹', '会佳', '汇嘉']], ['chi fan', ['吃饭', '迟返', '赤贩']]],
    [['dian nao', ['电脑', '点脑', '店闹', '垫恼']], ['you', ['又', '有', '油', '右']], ['zhong du', ['中毒', '重读', '钟都', '肿肚']], ['le', ['了', '乐', '勒']]],
    [['ming tian', ['明天', '鸣田', '命添', '铭甜']], ['kao shi', ['考试', '烤柿', '靠石', '拷事']], ['bie', ['别', '憋', '鳖']], ['chi dao', ['迟到', '吃到', '赤道', '池稻']]]
  ];
  // 英文单词练习：[单词, 意思]
  const WORDS = [['mouse', '鼠标'], ['virus', '病毒'], ['format', '格式化'], ['download', '下载'], ['password', '密码'], ['keyboard', '键盘'], ['monitor', '显示器'],
    ['online', '在线'], ['offline', '离线'], ['restart', '重启'], ['delete', '删除'], ['copy', '复制'], ['paste', '粘贴'], ['folder', '文件夹'], ['desktop', '桌面'],
    ['shutdown', '关机'], ['modem', '猫'], ['email', '电子邮件'], ['print', '打印'], ['error', '错误']];
  // 英文文章练习（原创）
  const ARTICLES = [
    "Windoesn't XP is not a virus. It is a feature. If your computer is slow, please wait. If it is still slow, please wait more.",
    'My mouse is not a real mouse. It does not eat cheese. It only eats my time. Every day I click and click and click.',
    'The download is at ninety nine percent. My mother is on the phone. The modem is singing a sad song. I will go to bed now.'
  ];
  // 班主任抓逃课的课文（游戏文件夹里的课文.txt；玩家可以拿记事本改）
  const LESSON_DEFAULT = 'Tom does not want to go to class today. He puts on his cap and runs out of the school gate. ' +
    'He runs past the small shop, past the park, and over the bridge. His teacher sees him from the window. ' +
    'The teacher takes his book and runs after him. Tom runs faster. The teacher runs faster too. ' +
    'Who will win? Type faster and you will see.';

  /* ================= 共用小零件 ================= */
  const fingerOf = {};
  [['qaz', 0], ['wsx', 1], ['edc', 2], ['rfvtgb', 3], ['yhnujm', 4], ['ik', 5], ['ol', 6], ['p', 7]].forEach(([s, f]) => { for (const ch of s) fingerOf[ch] = f; });
  const FINGER_COL = ['#f4a6c0', '#ffbf6b', '#ffe37a', '#9be07c', '#7fd8e8', '#8fb4ff', '#c9a2ff', '#f4a6c0'];
  const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const LESSON_KEYS = ['asdfjkl', 'asdfghjkl', 'qwertyuiopasdfghjkl', 'zxcvbnmasdfghjkl', 'abcdefghijklmnopqrstuvwxyz'];
  const pick = OS.pick;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // 蓝色胶囊按钮（2026-11-24 作者定 23）；icon：next 箭头 ／ again 转圈 ／ print 打印机 ／ rank 小奖杯
  const BTN_ICON = {
    next: '<svg viewBox="0 0 12 12"><path d="M2 6h7M6 3l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    again: '<svg viewBox="0 0 12 12"><path d="M9.5 6A3.5 3.5 0 1 1 8.4 3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1v3h3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    print: '<svg viewBox="0 0 12 12"><rect x="3" y="1.5" width="6" height="3" fill="#fff"/><rect x="1.5" y="4.5" width="9" height="4" rx="1" fill="#ffd23a" stroke="#a87a00" stroke-width=".6"/><rect x="3" y="7.5" width="6" height="3" fill="#fff"/></svg>',
    rank: '<svg viewBox="0 0 12 12"><path d="M3 1.5h6v3a3 3 0 0 1-6 0Z" fill="#ffd23a" stroke="#a87a00" stroke-width=".6"/><rect x="5" y="7" width="2" height="2" fill="#ffd23a"/><rect x="3.5" y="9" width="5" height="1.6" fill="#ffd23a"/></svg>'
  };
  const btn = (text, cls, icon) => el('button', { class: 'ys-cap' + (cls ? ' ' + cls : '') }, (icon ? [el('i', { html: BTN_ICON[icon] })] : []).concat([el('span', { text })]));
  const sfx = n => OS.sound.play(n);
  // 成绩：[{ at, mode, cpm, acc }]，最多记 50 条
  const stats = () => OS.save.get('ysStats', []);
  function record(mode, cpm, acc) { OS.save.set('ysStats', stats().concat([{ at: Date.now(), mode, cpm, acc }]).slice(-50)); }
  // 速度：打对的字 ／ 用了几分钟
  const cpmOf = (n, ms) => (ms > 500 ? Math.round(n / (ms / 60000)) : 0);

  /* ---------- 键盘：哪个窗口在前面，就把按键给它 ---------- */
  const keyTargets = new Map();   // 窗口 → (字符, 按键事件) => void
  document.addEventListener('keydown', e => {
    const fn = keyTargets.get(OS.wm.active);
    if (!fn || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    let ch = e.key;
    if (ch === ' ' || ch === 'Spacebar') ch = ' ';
    else if (ch.length !== 1) return;
    e.preventDefault();
    fn(ch.toLowerCase(), e);
  }, true);
  const listenKeys = (win, fn) => { keyTargets.set(win, fn); };
  const unlistenKeys = win => keyTargets.delete(win);

  /* ---------- 字母块（手机用；电脑也能点）：下一个字母 + 几个捣乱的，连击越高块越少 ----------
     o.next() 返回下一个要打的字符；o.hit(字符) 交给外面去判断对错并返回 true/false；o.repeat 按住不放连着打（班主任抓逃课） */
  function Tiles(o) {
    const box = el('div', { class: 'ys-tiles' });
    const comboEl = el('div', { class: 'ys-combo' });
    const row = el('div', { class: 'ys-trow' });
    box.append(comboEl, row);
    let combo = 0, lastOk = 0, holdT = 0, holdIv = 0;
    const count = () => (combo >= 50 ? 2 : combo >= 30 ? 3 : combo >= 10 ? 4 : 5);
    const label = ch => (ch === ' ' ? L.space : ch.toUpperCase());
    function render() {
      const nx = o.next();
      row.textContent = '';
      comboEl.textContent = combo >= 3 ? L.combo(combo) : '';
      if (nx == null) return;
      const pool = (o.pool ? o.pool() : 'abcdefghijklmnopqrstuvwxyz').split('').filter(c => c !== nx);
      const opts = shuffle([nx].concat(shuffle([...new Set(pool)]).slice(0, count() - 1)));
      opts.forEach(ch => {
        const t = el('div', { class: 'ys-tile' + (ch === ' ' ? ' sp' : ''), text: label(ch) });
        const press = () => {
          const ok = o.hit(ch);
          const now = Date.now();
          if (ok) { combo = (now - lastOk < 1500 || !lastOk) ? combo + 1 : 1; lastOk = now; }
          else { combo = 0; lastOk = 0; t.classList.add('bad'); }
          if (ok) render();
        };
        t.addEventListener('pointerdown', e => {
          e.preventDefault();
          press();
          if (!o.repeat) return;
          // 按住不放：0.35 秒后一秒按 25 下（键盘按住也是这样）
          clearTimeout(holdT); clearInterval(holdIv);
          holdT = setTimeout(() => { holdIv = setInterval(() => { if (o.next() === ch) { o.hit(ch); lastOk = Date.now(); combo++; comboEl.textContent = L.combo(combo); } else { clearInterval(holdIv); render(); } }, 40); }, 350);
        });
        row.appendChild(t);
      });
    }
    const stopHold = () => { clearTimeout(holdT); if (holdIv) { clearInterval(holdIv); holdIv = 0; render(); } };
    document.addEventListener('pointerup', stopHold, true);
    document.addEventListener('pointercancel', stopHold, true);
    return { el: box, render, miss: () => { combo = 0; lastOk = 0; comboEl.textContent = ''; }, ok: () => { const now = Date.now(); combo = (now - lastOk < 1500 || !lastOk) ? combo + 1 : 1; lastOk = now; },
      destroy: () => { stopHold(); document.removeEventListener('pointerup', stopHold, true); document.removeEventListener('pointercancel', stopHold, true); } };
  }

  /* ---------- 一长串字打下去（单词、文章、速度测试共用）：上面显示原文，打对变绿、打错闪红 ---------- */
  function Stream(text, o) {
    const chars = text.toLowerCase().replace(/[^a-z ]/g, '').replace(/ +/g, ' ').trim().split('');
    const S = { i: 0, ok: 0, bad: 0, t0: 0, done: false };
    const line = el('div', { class: 'ys-line' });
    const stat = statRow();
    const tiles = Tiles({ next: () => (S.done ? null : chars[S.i]), hit: ch => press(ch), pool: () => [...new Set(chars)].join('') });
    function paint() {
      line.textContent = '';
      const from = Math.max(0, S.i - 8), to = Math.min(chars.length, from + 26);
      for (let k = from; k < to; k++) line.appendChild(el('span', { class: k < S.i ? 'ok' : k === S.i ? 'cur' : '', text: chars[k] === ' ' ? '␣' : chars[k] }));
      const ms = S.t0 ? (S.end || Date.now()) - S.t0 : 0;
      stat.set(cpmOf(S.ok, ms), S.ok + S.bad ? Math.round(S.ok / (S.ok + S.bad) * 100) : 100, ms, S.i, chars.length);
    }
    function press(ch) {
      if (S.done) return false;
      if (!S.t0) S.t0 = Date.now();
      if (ch === chars[S.i]) {
        S.i++; S.ok++; sfx('ysKey');
        if (S.i >= chars.length) { S.done = true; S.end = Date.now(); sfx('ysDing'); if (o.done) o.done(result()); }
        paint();
        return true;
      }
      S.bad++; sfx('ysErr');
      line.classList.remove('err'); void line.offsetWidth; line.classList.add('err');
      paint();
      return false;
    }
    const result = () => ({ cpm: cpmOf(S.ok, (S.end || Date.now()) - S.t0), acc: S.ok + S.bad ? Math.round(S.ok / (S.ok + S.bad) * 100) : 100, n: S.ok });
    paint(); tiles.render();
    const iv = setInterval(() => { if (S.t0 && !S.done) paint(); }, 500);
    return { el: el('div', { class: 'ys-stream' }, [line, stat.el, tiles.el]), key: ch => { const ok = press(ch); if (ok) tiles.ok(); else tiles.miss(); tiles.render(); }, result, S, destroy: () => { clearInterval(iv); tiles.destroy(); } };
  }

  /* ================= 主窗口：照那几年打字软件的样子，整个窗口是一张主题界面 =================
     （2026-11-24 作者：风格完全不对——原版是整窗口的主界面，不是普通窗口加一排标签）
     主界面：左上大字招牌；左边一竖排大按钮；中间一个大椭圆，写着点中的那一项是干什么的［进入］；右下角仓鼠；左下 个人记录 ／ 更改用户
     进了某一项：上面一条（这一项的名字 ［返回主界面］），下面是那一项的页面；打字游戏是单独一张花花绿绿的选游戏界面 */
  const MODS = [['en', '英文打字'], ['py', '拼音打字'], ['eb', '二笔测试'], ['speed', '速度测试'], ['tut', '打字教程'], ['game', '打字游戏']];
  const MOD_SAY = {
    en: '从中间那一排键开始，一课一组键，再练单词、练文章。\n手指放对了，速度自然就上来了。',
    py: '看拼音，选字。\n选错了，打出来的句子会很好笑——那几年的拼音输入法就是这样。',
    eb: '本软件独家。\n十道单选题，测一测你的二笔指数。',
    speed: '限时 60 秒，\n测出你一分钟能打多少字，还能打印证书。',
    tut: '键盘上每个键该用哪根手指，\n看这一张图就够了。',
    game: '五个小游戏，边玩边练。\n电脑按键盘，手机直接点。'
  };
  let V = null;      // { win, root, body, tab, pick, sub, cleanup }
  let logged = false;
  OS.on('desktop:reset', () => { logged = false; });
  function open(tab) {
    if (V && V.win && !V.win.isClosed) {
      if (V.win.minimized) OS.wm.restore(V.win);
      OS.wm.focus(V.win);
      if (tab && logged) show(tab);
      return V.win;
    }
    const root = el('div', { class: 'ys2' });
    V = { win: null, root, body: null, tab: null, pick: 'en', sub: { en: 'key' }, cleanup: null };
    const my = V;
    // 桌面能放的窗口最高 308：里面按 400×300 排版，整体缩到 376×282 显示
    V.win = OS.wm.open({ title: NAME, icon: 'yinshan', width: 382, content: el('div', { class: 'ys2-wrap' }, [root]), appId: app.id, maximizable: false, center: true, className: 'ys-skin',
      onClose: () => { if (my.cleanup) my.cleanup(); unlistenKeys(my.win); if (V === my) V = null; } });
    home();
    if (logged && tab) show(tab);
    return V.win;
  }
  function mascotEl(cls) {
    const img = el('img', { class: cls || 'ys-mascot', src: ART + 'mascot.webp', alt: '', draggable: 'false' });
    img.addEventListener('error', () => img.replaceWith(OS.iconEl('yinshan', cls || 'ys-mascot')));
    return img;
  }
  const logoEl = small => el('div', { class: 'ys2-logo' + (small ? ' small' : '') }, [el('span', { class: 'ys2-l1', text: '银山打字' }), el('span', { class: 'ys2-l2', text: '2003' })]);
  function clearBody() {
    if (V.cleanup) { V.cleanup(); V.cleanup = null; }
    unlistenKeys(V.win);
    V.root.textContent = '';
    V.body = null;
  }
  // 主界面
  function home() {
    clearBody();
    V.tab = null;
    const say = el('div', { class: 'ys2-say' });
    const btns = el('div', { class: 'ys2-btns' + (logged ? '' : ' off') });
    function paintSay() {
      say.textContent = '';
      if (!logged) {
        const input = el('input', { type: 'text', class: 'ys-user', value: '你', readonly: 'readonly' });
        const go = btn(L.loginBtn, 'default');
        go.addEventListener('click', () => { OS.sound.play('click'); logged = true; home(); });
        say.append(el('div', { class: 'ys2-sayh', text: L.login }), el('div', { class: 'ys-lrow' }, [el('span', { text: L.user }), input]), go, el('div', { class: 'ys-note', text: L.loginTip }));
        return;
      }
      const go = btn(L.enter, 'default');
      go.addEventListener('click', () => { OS.sound.play('click'); show(V.pick); });
      say.append(el('div', { class: 'ys2-sayh', text: MODS.find(m => m[0] === V.pick)[1] }), el('div', { class: 'ys2-sayt', text: MOD_SAY[V.pick] }), go);
    }
    MODS.forEach(([id, label]) => {
      const b = el('div', { class: 'ys2-btn' + (logged && id === V.pick ? ' on' : ''), text: label });
      b.addEventListener('click', () => {
        if (!logged) return;
        OS.sound.play('click');
        if (V.pick === id) { show(id); return; }   // 点中的再点一下就进去
        V.pick = id;
        btns.querySelectorAll('.ys2-btn').forEach(x => x.classList.toggle('on', x === b));
        paintSay();
      });
      btns.appendChild(b);
    });
    const rec = el('span', { class: 'ys2-link', text: L.records }), chg = el('span', { class: 'ys2-link', text: L.change });
    rec.addEventListener('click', () => { if (!logged) return; OS.sound.play('click'); show('me'); });
    chg.addEventListener('click', () => { OS.sound.play('click'); logged = false; home(); });
    V.root.appendChild(el('div', { class: 'ys2-home' }, [
      logoEl(), el('div', { class: 'ys2-hello', text: logged ? L.welcome + '　' + L.hello : L.welcome }),
      btns, el('div', { class: 'ys2-oval' }, [say]), mascotEl('ys2-ham'), el('div', { class: 'ys2-links' }, [rec, el('span', { text: '｜' }), chg])
    ]));
    paintSay();
  }
  // 进某一项：上面一条 + 那一项的页面；打字游戏单独一张界面
  function show(tab) {
    if (!V) return;
    if (!logged) { home(); return; }
    if (tab === 'game') { gameHome(); return; }
    clearBody();
    V.tab = tab;
    const back = el('div', { class: 'ys2-back', text: L.back });
    back.addEventListener('click', () => { OS.sound.play('click'); home(); });
    const title = tab === 'me' ? L.records : MODS.find(m => m[0] === tab)[1];
    V.body = el('div', { class: 'ys-body ys2-body' });
    V.root.append(el('div', { class: 'ys2-bar' }, [logoEl(true), el('span', { class: 'ys2-bart', text: title }), back]), V.body);
    ({ en: enPage, py: pyPage, eb: ebPage, speed: speedPage, tut: tutPage, me: mePage })[tab]();
  }
  // 斜着的彩色标签（绿 ／ 蓝 ／ 金 ／ 紫，选中的变白）——2026-11-24 作者定 21A，照那几年打字软件里面各页的样子
  function subTabs(list, cur, onPick) {
    return el('div', { class: 'ys3-tabs' }, list.map(([k, label], i) => {
      const t = el('div', { class: 'ys3-tab c' + (i % 4) + (k === cur ? ' on' : '') }, [el('span', { text: label })]);
      t.addEventListener('click', () => { if (k === cur) return; OS.sound.play('click'); onPick(k); });
      return t;
    }));
  }
  // 一页：上面标签，下面银灰色的圆角面板
  function page(tabs, cur, onPick) {
    const pane = el('div', { class: 'ys-pane' });
    V.body.append(subTabs(tabs, cur, onPick || (() => {})), pane);
    return pane;
  }
  const mmss = ms => { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  // 下面那行成绩：四个小图标 + 字（速度 ／ 时间 ／ 正确率 ／ 进度）+ 一根蓝色进度条（作者定 24）
  const ICON = {
    speed: '<svg viewBox="0 0 16 16"><path d="M2 12a6 6 0 1 1 12 0Z" fill="#dfe9ff" stroke="#2a5ab8" stroke-width="1.3"/><path d="M8 12 11.4 6.6" stroke="#e0301c" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="12" r="1.4" fill="#2a5ab8"/></svg>',
    time: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.3" fill="#fff" stroke="#2a7ad8" stroke-width="1.6"/><path d="M8 4.2V8l2.6 1.6" stroke="#223" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>',
    acc: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.3" fill="#7ad04a" stroke="#3a8a1a" stroke-width="1"/><path d="M8 8V1.7A6.3 6.3 0 0 1 14.2 9.2Z" fill="#ffcf3a" stroke="#c88a00" stroke-width="1"/></svg>',
    prog: '<svg viewBox="0 0 16 16"><rect x="1.5" y="9" width="4" height="5.5" fill="#f05a3a"/><rect x="6" y="5.5" width="4" height="9" fill="#3a9af0"/><rect x="10.5" y="2" width="4" height="12.5" fill="#5ac83a"/></svg>'
  };
  function statRow() {
    const v = {};
    const item = (k, label) => el('div', { class: 'ys-si' }, [el('i', { html: ICON[k] }), el('span', { text: label }), (v[k] = el('b', { text: '' }))]);
    const fill = el('i', { class: 'ys-pfill' });
    const box = el('div', { class: 'ys-srow' }, [el('div', { class: 'ys-sis' }, [item('speed', L.sSpeed), item('time', L.sTime), item('acc', L.sAcc), item('prog', L.sProg)]), el('div', { class: 'ys-pbar' }, [fill])]);
    const set = (cpm, acc, ms, n, all) => { v.speed.textContent = cpm + L.perMin; v.time.textContent = mmss(ms); v.acc.textContent = acc + '%'; v.prog.textContent = n + '/' + all; fill.style.width = (all ? Math.min(100, n / all * 100) : 0) + '%'; };
    set(0, 100, 0, 0, 1);
    return { el: box, set };
  }
  // 一双手：下一个要按的键是哪根手指管的，那根手指尖就亮（作者定 25A；Codex 的 hands.webp 来了就换成画的手）
  //   手指顺序：左小指 0、左无名指 1、左中指 2、左食指 3、右食指 4、右中指 5、右无名指 6、右小指 7、大拇指 8（空格）
  // 手的图：先用 hands2.webp，没有再用第一版 hands.webp（第一版是照我们给的扁框画的，手被压扁了）
  const HAND_ART = [
    // hands2.webp：用 Codex 原来那只正常的手等比缩小、左右翻一只拼的（作者：原图是正常的手，别压扁），手腕从下边出去
    { file: 'hands2.webp', w: 220, h: 88, tips: [[12, 34], [36, 17], [55, 8.5], [77, 17.5], [142.5, 17.5], [164.5, 8.5], [184, 17], [208, 34], [100, 60], [119.5, 60]] },
    { file: 'hands.webp', w: 240, h: 64, tips: [[26, 22], [46, 12], [66, 8], [86, 14], [154, 14], [174, 8], [194, 12], [214, 22], [111, 44], [129, 44]] }
  ];
  const TIPS = HAND_ART[1].tips;
  HAND_ART.forEach(a => { const i = new Image(); i.onload = () => { a.ok = true; }; i.src = ART + a.file; });
  function handsEl() {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    const art = HAND_ART.find(a => a.ok && a.tips);
    const vw = art ? art.w : 240, vh = art ? art.h : 64, tipsXY = art ? art.tips : TIPS;
    svg.setAttribute('viewBox', '0 0 ' + vw + ' ' + vh);
    svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');   // 贴着下边
    svg.setAttribute('class', 'ys-hands');
    const add = (tag, at) => { const n = document.createElementNS(NS, tag); Object.keys(at).forEach(k => n.setAttribute(k, at[k])); svg.appendChild(n); return n; };
    if (art) add('image', { href: ART + art.file, x: 0, y: 0, width: vw, height: vh });
    else {
      const skin = { fill: '#f6d4ac', stroke: '#c8966a', 'stroke-width': 1.2 };
      [[0, 1], [1, -1]].forEach(([side]) => {
        const fx = side ? [154, 174, 194, 214] : [26, 46, 66, 86];
        const ty = side ? [14, 8, 12, 22] : [22, 12, 8, 14];
        add('rect', Object.assign({ x: side ? 146 : 14, y: 38, width: 82, height: 34, rx: 14 }, skin));
        fx.forEach((x, k) => add('rect', Object.assign({ x: x - 8, y: ty[k] - 6, width: 16, height: 52 - ty[k], rx: 8 }, skin)));
        add('rect', Object.assign({ x: side ? 122 : 104, y: 30, width: 14, height: 34, rx: 7, transform: 'rotate(' + (side ? 28 : -28) + ' ' + (side ? 129 : 111) + ' 48)' }, skin));
      });
    }
    const tips = tipsXY.map(([x, y], i) => add('circle', { cx: x, cy: y, r: 6.5, class: 'ys-tip', fill: FINGER_COL[Math.min(7, i)], 'data-f': i > 7 ? 8 : i }));
    return {
      el: svg,
      light(f) { tips.forEach(t => t.classList.toggle('on', +t.getAttribute('data-f') === f)); },
      all() { tips.forEach(t => t.classList.add('soft')); }
    };
  }
  const fingerFor = ch => (ch === ' ' ? 8 : fingerOf[ch] == null ? -1 : fingerOf[ch]);

  /* ---------- 英文打字 ---------- */
  function enPage() {
    const sub = V.sub.en;
    const pane = page(L.enTabs, sub, k => { V.sub.en = k; show('en'); });
    ({ key: keyPane, word: wordPane, art: artPane })[sub](pane);
  }
  // 键位练习：一课一组键；屏幕键盘只亮这一课的键，下一个要按的键发光，下面那双手对应的手指尖亮
  function keyPane(pane, lesson) {
    lesson = lesson == null ? (V.lesson || 0) : lesson;
    V.lesson = lesson;
    if (V.keyIv) clearInterval(V.keyIv);
    const keys = LESSON_KEYS[lesson];
    const seq = Array.from({ length: 24 }, () => keys[Math.floor(Math.random() * keys.length)]);
    const S = { i: 0, ok: 0, bad: 0, t0: 0, end: 0 };
    const pick = el('div', { class: 'ys-lessons' }, L.lessons.map((t, k) => { const b = el('div', { class: 'ys-lb' + (k === lesson ? ' on' : ''), text: t }); b.addEventListener('click', () => { OS.sound.play('click'); pane.textContent = ''; keyPane(pane, k); }); return b; }));
    const tip = el('div', { class: 'ys-note ys-ltip', text: L.lessonTip[lesson] });
    const line = el('div', { class: 'ys-line big' });
    const stat = statRow();
    const kb = el('div', { class: 'ys-kb' });
    const hands = handsEl();
    const keyEls = {};
    ROWS.forEach((r, ri) => {
      const rowEl = el('div', { class: 'ys-kr r' + ri });
      for (const ch of r) {
        const on = keys.indexOf(ch) >= 0;
        const k = el('div', { class: 'ys-k' + (on ? ' on' : ''), text: ch.toUpperCase() });
        if (on) k.style.background = FINGER_COL[fingerOf[ch]];
        if (on) k.addEventListener('pointerdown', e => { e.preventDefault(); press(ch); });
        keyEls[ch] = k;
        rowEl.appendChild(k);
      }
      kb.appendChild(rowEl);
    });
    const again = btn(L.again, '', 'again');
    again.style.display = 'none';
    again.addEventListener('click', () => { OS.sound.play('click'); pane.textContent = ''; keyPane(pane, lesson); });
    const acc = () => (S.ok + S.bad ? Math.round(S.ok / (S.ok + S.bad) * 100) : 100);
    const paintStat = () => { const ms = S.t0 ? (S.end || Date.now()) - S.t0 : 0; stat.set(cpmOf(S.ok, ms), acc(), ms, S.i, seq.length); };
    function paint() {
      line.textContent = '';
      seq.forEach((ch, k) => line.appendChild(el('span', { class: k < S.i ? 'ok' : k === S.i ? 'cur' : '', text: ch.toUpperCase() })));
      Object.keys(keyEls).forEach(c => keyEls[c].classList.toggle('next', S.i < seq.length && c === seq[S.i]));
      hands.light(S.i < seq.length ? fingerFor(seq[S.i]) : -1);
      paintStat();
    }
    function press(ch) {
      if (S.i >= seq.length) return;
      if (!S.t0) S.t0 = Date.now();
      const k = keyEls[ch];
      if (k) { k.classList.remove('hit'); void k.offsetWidth; k.classList.add('hit'); }
      if (ch === seq[S.i]) { S.i++; S.ok++; sfx('ysKey'); }
      else { S.bad++; sfx('ysErr'); line.classList.remove('err'); void line.offsetWidth; line.classList.add('err'); }
      if (S.i >= seq.length) S.end = Date.now();
      paint();
      if (S.i >= seq.length) {
        const cpm = cpmOf(S.ok, S.end - S.t0);
        record('key', cpm, acc()); sfx('ysDing');
        tip.textContent = L.keyDone; tip.classList.add('ys-done');   // 速度、正确率下面那行已经写着了
        again.style.display = '';
      }
    }
    // 2026-11-24 作者：手变形、没贴底——课的提示和［再来一组］挪到第几课那一排，腾出地方，手贴着面板最下面
    pick.append(tip, again);
    hands.el.classList.add('bottom');
    pane.append(pick, line, stat.el, kb, hands.el);
    paint();
    V.keyIv = setInterval(() => { if (!pane.isConnected) { clearInterval(V.keyIv); return; } if (S.t0 && !S.end) paintStat(); }, 500);
    listenKeys(V.win, ch => press(ch));
  }
  function wordPane(pane) {
    const list = shuffle(WORDS).slice(0, 8);
    let k = 0, tot = { ok: 0, bad: 0, t0: 0 };
    const head = el('div', { class: 'ys-word' }), mean = el('div', { class: 'ys-mean' }), holder = el('div');
    const again = btn(L.again, '', 'again');
    again.style.display = 'none';
    again.addEventListener('click', () => { OS.sound.play('click'); show('en'); });
    pane.append(head, mean, holder, again);
    let st = null;
    function nextWord() {
      if (st) { tot.ok += st.S.ok; tot.bad += st.S.bad; if (!tot.t0) tot.t0 = st.S.t0; st.destroy(); }
      if (k >= list.length) {
        const cpm = cpmOf(tot.ok, Date.now() - tot.t0), acc = tot.ok + tot.bad ? Math.round(tot.ok / (tot.ok + tot.bad) * 100) : 100;
        record('word', cpm, acc);
        holder.textContent = ''; head.textContent = ''; mean.textContent = L.done(cpm, acc); again.style.display = '';
        unlistenKeys(V.win);
        return;
      }
      const [w, m] = list[k++];
      head.textContent = w; mean.textContent = m;
      st = Stream(w, { done: () => setTimeout(nextWord, 350), progress: [k - 1, list.length] });
      holder.textContent = '';
      holder.appendChild(st.el);
      listenKeys(V.win, ch => st.key(ch));
    }
    nextWord();
    V.cleanup = () => { if (st) st.destroy(); };
  }
  function artPane(pane) {
    V.art = ((V.art == null ? -1 : V.art) + 1) % ARTICLES.length;
    const nxt = btn(L.next, '', 'next');
    nxt.style.display = 'none';
    nxt.addEventListener('click', () => { OS.sound.play('click'); show('en'); });
    const st = Stream(ARTICLES[V.art], { done: r => { record('art', r.cpm, r.acc); nxt.style.display = ''; } });
    pane.append(st.el, nxt);
    listenKeys(V.win, ch => st.key(ch));
    V.cleanup = () => st.destroy();
  }

  /* ---------- 拼音打字：选字 ---------- */
  function pyPage() {
    const pane = page([['py', L.pyTab]], 'py');
    V.py = ((V.py == null ? -1 : V.py) + 1) % PY.length;
    pyRound(pane, PY[V.py], null);
  }
  // 一句一句选；speed：速度测试用（{ onWord(对不对), onDone() }）
  function pyRound(pane, sent, speed) {
    let w = 0;
    const got = [];
    const tip = el('div', { class: 'ys-note', text: L.pyTip });
    const out = el('div', { class: 'ys-pyout' });
    const pinyin = el('div', { class: 'ys-pinyin' });
    const cands = el('div', { class: 'ys-cands' });
    const res = el('div', { class: 'ys-pyres' });
    pane.append(tip, out, pinyin, cands, res);
    const paintOut = () => { out.textContent = ''; got.forEach(([t, ok]) => out.appendChild(el('span', { class: ok ? '' : 'bad', text: t }))); out.appendChild(el('span', { class: 'ys-caret', text: '|' })); };
    function step() {
      paintOut();
      if (w >= sent.length) { finish(); return; }
      const [py, list] = sent[w];
      pinyin.textContent = py;
      cands.textContent = '';
      const opts = shuffle(list);
      opts.forEach((t, k) => {
        const b = el('div', { class: 'ys-cand', text: (k + 1) + '. ' + t });
        b.addEventListener('click', () => choose(t));
        cands.appendChild(b);
      });
      listenKeys(V.win, ch => { const n = parseInt(ch, 10); if (n >= 1 && n <= opts.length) choose(opts[n - 1]); });
      function choose(t) {
        const ok = t === list[0];
        sfx(ok ? 'ysKey' : 'ysErr');
        got.push([t, ok]);
        if (speed) speed.onWord(ok, t.length);
        w++;
        step();
      }
    }
    function finish() {
      unlistenKeys(V.win);
      pinyin.textContent = ''; cands.textContent = '';
      if (speed) { speed.onDone(); return; }
      const wrong = got.some(([, ok]) => !ok);
      const right = sent.map(x => x[1][0]).join('');
      const acc = Math.round(got.filter(([, ok]) => ok).length / got.length * 100);
      record('py', 0, acc);
      const nxt = btn(L.pyNext, 'default', 'next');
      nxt.addEventListener('click', () => { OS.sound.play('click'); show('py'); });
      res.append(el('div', { text: wrong ? L.pyRight + right : L.pyAllRight }), wrong ? el('div', { class: 'ys-note', text: L.pyWrong }) : '', nxt);
      sfx(wrong ? 'ysErr' : 'ysDing');
    }
    step();
  }

  /* ---------- 二笔测试 ---------- */
  function ebPage() {
    const pane = page([['eb', L.ebTab]], 'eb');
    pane.classList.add('ys-eb');
    const go = btn(L.ebStart, 'default', 'next');
    go.addEventListener('click', () => { OS.sound.play('click'); ebRun(pane); });
    pane.append(el('div', { class: 'ys-ebintro', text: L.ebIntro }), go);
  }
  function ebRun(pane) {
    const qs = shuffle(EB_Q).slice(0, 10);
    let i = 0, score = 0;
    function ask() {
      pane.textContent = '';
      if (i >= qs.length) { result(); return; }
      const [q, opts, two] = qs[i];
      const order = shuffle(opts.map((t, k) => [t, k]));
      pane.append(el('div', { class: 'ys-note', text: L.ebQ(i + 1, qs.length) }), el('div', { class: 'ys-ebq', text: q }));
      const box = el('div', { class: 'ys-ebopts' });
      order.forEach(([t, k], n) => {
        const b = el('div', { class: 'ys-ebo', text: 'ABCD'[n] + '. ' + t });
        b.addEventListener('click', () => answer(k));
        box.appendChild(b);
      });
      pane.appendChild(box);
      listenKeys(V.win, ch => { const n = parseInt(ch, 10) || ('abcd'.indexOf(ch) + 1); if (n >= 1 && n <= 4) answer(order[n - 1][1]); });
      function answer(k) { OS.sound.play('click'); if (k === two) score += 10; i++; ask(); }
    }
    function result() {
      unlistenKeys(V.win);
      const r = EB_RES.find(x => score < x[0]);
      const again = btn(L.ebAgain, 'default', 'again'), cert = btn(L.cert, '', 'print');
      again.addEventListener('click', () => { OS.sound.play('click'); ebRun(pane); });
      cert.addEventListener('click', () => { OS.sound.play('click'); OS.ui.dialog({ title: OS.PRINT_TITLE, icon: 'error', text: OS.printErr() }); });
      sfx(score >= 80 ? 'ysWin' : 'ysLose');
      pane.append(el('div', { class: 'ys-ebscore', text: L.ebScore(score) }), el('div', { class: 'ys-ebres', text: r[1] }), el('div', { class: 'ys-ebtxt', text: r[2] }), el('div', { class: 'ys-btns' }, [again, cert]));
    }
    ask();
  }

  /* ---------- 速度测试：英文 ／ 拼音 ／ 排行榜 ---------- */
  function speedPage() {
    const sub = V.sub.speed || 'en';
    const pane = page(L.speedTabs, sub, k => { V.sub.speed = k; show('speed'); });
    if (sub === 'rank') { rankTable(pane); return; }
    const go = btn(L.speedGo, 'default', 'next');
    go.addEventListener('click', () => { OS.sound.play('click'); pane.textContent = ''; speedRun(pane, sub); });
    pane.append(el('div', { class: 'ys-note', text: L.speedPick }), go);
  }
  // 排行榜：速度测试的成绩，前 10 名，用户名一律是"你"（作者定 26A）
  function rankTable(pane) {
    const list = stats().filter(s => (s.mode === 'sEn' || s.mode === 'sPy') && s.cpm > 0).sort((a, b) => b.cpm - a.cpm).slice(0, 10);
    const rows = [];
    for (let k = 0; k < 10; k++) {
      const s = list[k], d = s ? new Date(s.at) : null;
      rows.push(el('div', { class: 'ys-tr' }, [String(k + 1), s ? L.you : '', s ? s.cpm + L.perMin : '', s ? s.acc + '%' : '', d ? (d.getMonth() + 1) + '-' + d.getDate() : ''].map(t => el('span', { text: t }))));
    }
    pane.append(el('div', { class: 'ys-table rank' }, [el('div', { class: 'ys-tr head' }, L.rankHead.map(t => el('span', { text: t })))].concat(rows)));
    if (!list.length) pane.appendChild(el('div', { class: 'ys-note', text: L.rankEmpty }));
  }
  function speedRun(pane, mode) {
    const clock = el('div', { class: 'ys-clock', text: L.left(60) });
    const holder = el('div');
    pane.append(clock, holder);
    const t0 = Date.now();
    let ok = 0, bad = 0, st = null, timer = 0, over = false;
    const finish = () => {
      if (over) return;
      over = true;
      clearInterval(timer);
      unlistenKeys(V.win);
      if (st) { ok = st.S.ok; bad = st.S.bad; st.destroy(); }
      const cpm = Math.round(ok * 60000 / Math.max(1000, Math.min(60000, Date.now() - t0))), acc = ok + bad ? Math.round(ok / (ok + bad) * 100) : 0;
      record(mode === 'en' ? 'sEn' : 'sPy', cpm, acc);
      pane.textContent = '';
      const again = btn(L.again, 'default', 'again'), cert = btn(L.cert, '', 'print'), rank = btn(L.rankBtn, '', 'rank');
      again.addEventListener('click', () => { OS.sound.play('click'); show('speed'); });
      cert.addEventListener('click', () => { OS.sound.play('click'); OS.ui.dialog({ title: OS.PRINT_TITLE, icon: 'error', text: OS.printErr() }); });
      rank.addEventListener('click', () => { OS.sound.play('click'); V.sub.speed = 'rank'; show('speed'); });
      pane.append(el('div', { class: 'ys-ebscore', text: L.speedRes(cpm, acc) }), el('div', { class: 'ys-ebres', text: L.speedSay.find(x => cpm < x[0])[1] }), el('div', { class: 'ys-btns' }, [again, cert, rank]));
      sfx('ysDing');
    };
    timer = setInterval(() => { const s = 60 - Math.floor((Date.now() - t0) / 1000); clock.textContent = L.left(Math.max(0, s)); if (s <= 0) finish(); }, 250);
    V.cleanup = () => { clearInterval(timer); if (st) st.destroy(); };
    if (mode === 'en') {
      st = Stream(shuffle(ARTICLES).join(' '), { done: finish });
      holder.appendChild(st.el);
      listenKeys(V.win, ch => st.key(ch));
    } else {
      const next = () => { if (over) return; holder.textContent = ''; pyRound(holder, pick(PY), { onWord: (good, n) => { if (good) ok += n; else bad += n; }, onDone: next }); };
      next();
    }
  }

  /* ---------- 打字游戏：单独一张界面（作者定 16A：左边一大块预览，右边绿底星星、五个游戏斜着排） ----------
     点一下某个游戏，左边换成那个游戏的画面 + 玩法 +［开始］；再点一下就进（电脑上鼠标移上去也会换） */
  const G_ORDER = ['chase', 'earth', 'nap', 'river', 'egg'];
  const G_POS = [[216, 46], [198, 94], [184, 142], [198, 190], [216, 238]];
  // 圆图标：Codex 画的 game-icons.webp（一排 5 个，顺序 打瞌睡 ／ 接鸡蛋 ／ 保卫地球 ／ 班主任抓逃课 ／ 小鸭过河）；还没来就先用一个字顶着
  const G_ICON = { nap: 0, egg: 1, earth: 2, chase: 3, river: 4 }, G_CHAR = { nap: '睡', egg: '蛋', earth: '飞', chase: '追', river: '鸭' };
  let iconsOk = false;
  (() => { const i = new Image(); i.onload = () => { iconsOk = true; }; i.src = ART + 'game-icons.webp'; })();
  function gameHome() {
    clearBody();
    V.tab = 'game';
    const G = OS.yinshanGames;
    let sel = null;
    const pv = el('div', { class: 'ys2-pv' });
    function paintPv(id) {
      pv.textContent = '';
      pv.className = 'ys2-pv' + (id ? ' on' : '');
      if (!id || !G) { pv.append(logoEl(), el('div', { class: 'ys2-pvsub', text: L.gameSub }), mascotEl('ys2-pvham')); return; }
      const g = G.list.find(x => x.id === id);
      const cv = el('canvas', { class: 'ys2-pvcv', width: '400', height: '300' });
      G.preview(id, cv.getContext('2d'), 400, 300);
      const tint = el('div', { class: 'ys2-pvtint' });
      tint.style.background = G.theme[id].col;
      const go = btn(L.play, 'default', 'next');
      go.addEventListener('click', () => { OS.sound.play('click'); G.open(id); });
      pv.append(cv, tint, el('div', { class: 'ys2-pvbox' }, [el('div', { class: 'ys2-pvname', text: g.name }), el('div', { class: 'ys2-pvtxt', text: g.rules }), el('div', { class: 'ys2-pvbest', text: L.best(G.best(id)) }), go]));
    }
    const pageEl = el('div', { class: 'ys2-games' }, [pv, el('div', { class: 'ys2-gtitle', text: L.gTitle })]);
    const rows = [];
    if (G) G_ORDER.forEach((id, k) => {
      const g = G.list.find(x => x.id === id);
      const ico = el('div', { class: 'ys2-gico' + (iconsOk ? ' art' : '') }, iconsOk ? [] : [el('span', { text: G_CHAR[id] })]);
      if (iconsOk) ico.style.backgroundPosition = (G_ICON[id] * 25) + '% 0';
      const pill = el('div', { class: 'ys2-gpill' }, [el('span', { class: 'ys2-gname', text: g.name }), el('span', { class: 'ys2-gbest', text: L.best(G.best(id)) })]);
      const row = el('div', { class: 'ys2-grow' }, [pill, ico]);
      row.style.left = G_POS[k][0] + 'px'; row.style.top = G_POS[k][1] + 'px';
      row.addEventListener('click', () => {
        OS.sound.play('click');
        if (sel === id) { G.open(id); return; }
        sel = id;
        rows.forEach(r => r.classList.toggle('on', r === row));
        paintPv(id);
      });
      row.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') paintPv(id); });
      row.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') paintPv(sel); });
      rows.push(row);
      pageEl.appendChild(row);
    });
    // 退出：先问一句（作者定 17）
    const exit = el('div', { class: 'ys2-exit', text: L.exit });
    exit.addEventListener('click', () => {
      OS.sound.play('click');
      if (pageEl.querySelector('.ys2-ask')) return;
      const yes = btn(L.yes, 'default'), no = btn(L.no);
      const ask = el('div', { class: 'ys2-askbg' }, [el('div', { class: 'ys2-ask' }, [el('div', { class: 'ys2-asktop' }, [mascotEl('ys2-askham'), el('div', { class: 'ys2-askt', text: L.exitAsk })]), el('div', { class: 'ys2-askbot' }, [yes, no])])]);
      yes.addEventListener('click', () => { OS.sound.play('click'); home(); });
      no.addEventListener('click', () => { OS.sound.play('click'); ask.remove(); });
      pageEl.appendChild(ask);
    });
    pageEl.appendChild(exit);
    paintPv(null);
    V.root.appendChild(pageEl);
  }

  /* ---------- 打字教程：手指图 ---------- */
  function tutPage() {
    const pane = page([['tut', L.tutTab]], 'tut');
    const kb = el('div', { class: 'ys-kb' });
    ROWS.forEach((r, ri) => {
      const rowEl = el('div', { class: 'ys-kr r' + ri });
      for (const ch of r) { const k = el('div', { class: 'ys-k on', text: ch.toUpperCase() }); k.style.background = FINGER_COL[fingerOf[ch]]; if (ch === 'f' || ch === 'j') k.classList.add('bump'); rowEl.appendChild(k); }
      kb.appendChild(rowEl);
    });
    const hands = handsEl();
    hands.all();
    hands.el.classList.add('bottom', 'tut');   // 跟键位练习一样，手贴着面板最下面
    const legend = el('div', { class: 'ys-legend' }, L.fingers.map((t, f) => el('span', {}, [el('i', { style: { background: FINGER_COL[f] } }), t])));
    pane.append(kb, legend, el('div', { class: 'ys-tips' }, L.tutTips.map(t => el('div', { text: '· ' + t }))), hands.el);
  }

  /* ---------- 个人记录：上面一张折线图，下面一张表（作者定 26A） ---------- */
  function mePage() {
    const pane = page([['me', L.meTab]], 'me');
    const all = stats();
    const list = all.filter(s => s.cpm > 0).slice(-20);
    if (!all.length) { pane.appendChild(el('div', { class: 'ys-note', text: L.meEmpty })); return; }
    if (list.length) {
      const cv = el('canvas', { class: 'ys-chart', width: '560', height: '180' });
      pane.append(el('div', { class: 'ys-note', text: L.meTitle }), cv);
      const c = cv.getContext('2d'), max = Math.max(60, ...list.map(s => s.cpm)) * 1.15;
      c.scale(2, 2);
      c.fillStyle = '#fff'; c.fillRect(0, 0, 280, 90);
      c.strokeStyle = '#e2e6ee'; c.lineWidth = 1;
      for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(24, k * 21 + 4); c.lineTo(276, k * 21 + 4); c.stroke(); }
      c.fillStyle = '#7a8090'; c.font = '8px Tahoma'; c.textAlign = 'right';
      for (let k = 0; k < 4; k++) c.fillText(String(Math.round(max * (1 - k / 4))), 20, k * 21 + 8);
      const x = i => 28 + i * (244 / Math.max(1, list.length - 1)), y = v => 86 - v / max * 82;
      c.strokeStyle = '#2b6fd6'; c.lineWidth = 2; c.beginPath();
      list.forEach((s, i) => (i ? c.lineTo(x(i), y(s.cpm)) : c.moveTo(x(i), y(s.cpm)))); c.stroke();
      c.fillStyle = '#f07a10';
      list.forEach((s, i) => { c.beginPath(); c.arc(x(i), y(s.cpm), 2.5, 0, Math.PI * 2); c.fill(); });
    }
    const last = all.slice(-6).reverse();
    const pad = n => String(n).padStart(2, '0');
    const rows = last.map((s, i) => { const d = new Date(s.at); return el('div', { class: 'ys-tr' }, [String(all.length - i), (L.modes[s.mode] || s.mode) + '　' + (s.cpm ? s.cpm + L.perMin + '　' : '') + L.sAcc + ' ' + s.acc + '%', (d.getMonth() + 1) + '-' + d.getDate() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())].map(t => el('span', { text: t }))); });
    pane.append(el('div', { class: 'ys-table me' }, [el('div', { class: 'ys-tr head' }, L.meHead.map(t => el('span', { text: t })))].concat(rows)));
  }

  /* ================= 游戏文件夹：课文.txt（班主任抓逃课读它；拿记事本改成一堆 A 就能作弊） ================= */
  const FS = OS.fs;
  const here = () => !OS.soft || OS.soft.present('yinshan');
  const keep = { noDelete: '删不掉：要卸载软件，去 添加/删除程序。' };
  FS.add(PF, Object.assign({ kind: 'folder' }, keep));
  FS.add(PF + '\\银山打字通.exe', Object.assign({ kind: 'exe', icon: 'yinshan', app: 'yinshan', when: here }, keep));
  FS.add(PF + '\\说明.txt', { text: '银山打字通 2003 使用说明\n\n先登录，再练习。\n每天练半小时，打字速度蹭蹭涨。\n游戏的课文放在 游戏 文件夹里。', roMsg: '保存失败：说明书是厂家的。', when: here, noDelete: '删不掉：说明书是厂家的。' });
  FS.add(PF + '\\游戏', Object.assign({ kind: 'folder', when: here }, keep));
  FS.add(LESSON_DIR, Object.assign({ kind: 'folder', when: here }, keep));
  FS.add(LESSON_PATH, Object.assign({ kind: 'txt', icon: 'txt', text: LESSON_DEFAULT, when: here, open: () => openLesson() }, keep));
  function openLesson() {
    const node = FS.get(LESSON_PATH);
    OS.notepad.open({ name: '课文.txt', text: node ? FS.text(node) : LESSON_DEFAULT, where: { type: 'fs', path: LESSON_PATH },
      lines: [{ label: '全部改成 AAAAAAAAAAAAAAAAAAAA', text: 'A'.repeat(300), replace: true }, { label: '恢复原来的课文', text: LESSON_DEFAULT, replace: true }] });
  }
  // 课文里的字母（班主任抓逃课用）
  function lessonLetters() {
    const node = FS.get(LESSON_PATH);
    const t = (node ? FS.text(node) : LESSON_DEFAULT).toLowerCase().replace(/[^a-z]/g, '');
    return t || LESSON_DEFAULT.toLowerCase().replace(/[^a-z]/g, '');
  }

  app.open = () => open();
  OS.yinshan = { open, closeAll: () => { if (V && V.win && !V.win.isClosed) V.win.close(); if (OS.yinshanGames) OS.yinshanGames.closeAll(); } };
  // 给 yinshan-games.js 用
  OS.yinshanKit = { L, ART, NAME, Tiles, listenKeys, unlistenKeys, record, shuffle, sfx, lessonLetters, LESSON_PATH };
})();
