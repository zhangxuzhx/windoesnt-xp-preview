/* 电脑里的文件“总清单”：我的电脑、我的文档、记事本另存为……都照这张清单显示
   - 每个文件 / 文件夹一行：在哪（路径）、叫什么、什么类型、双击干嘛。我们一开始放好的用 FS.add 挂上去；
     会变的（桌面上有什么、收集到哪些蓝屏、装没装游戏）用 FS.provide 现算。
   - 玩家自己弄出来的（记事本存的、复制出来的、欠条图片、新建文件夹）记在存档里；全电脑最多 80 个（见 player-file-cap）。
     新建文件夹重启就没了（套娃蓝屏用），别的重启还在。
   - 以后主线加东西：往清单上 FS.add 一行就行，所有地方自动都有。 */
(function () {
  'use strict';
  const FS = OS.fs = {};
  const SEP = '\\';
  FS.SEP = SEP;
  FS.ME = 'C:\\Documents and Settings\\你';
  FS.MYDOCS = FS.ME + '\\我的文档';
  FS.DESKTOP = FS.ME + '\\桌面';
  FS.SHARED = 'C:\\Documents and Settings\\All Users\\共享文档';
  FS.PICS = FS.MYDOCS + '\\我的图片';
  FS.ROOT = '我的电脑';   // 我的电脑本身（里面是几个盘）

  /* ---------- 文案 ---------- */
  const CAP = 80;
  const CAP_TITLE = '提示';
  const CAP_TEXT = '由于性能限制，不能创建80个以上的自定义文件，您可以先删除您创建的老文件再创建新文件，谢谢支持！';
  // 类型：图标、类型名
  const KINDS = {
    folder: ['folder', '文件夹'], txt: ['txt', '文本文档'], doc: ['doc', 'Word 文档'], jpg: ['abcpic', 'ABCSee JPEG 图像'], bmp: ['abcpic', 'ABCSee BMP 图像'],
    mp3: ['mp3file', 'MP3 音频文件'], exe: ['exe', '应用程序'], lnk: ['exe', '快捷方式'], dll: ['control', '应用程序扩展'], sys: ['control', '系统文件'],
    dmp: ['txt', '故障转储文件'], ttf: ['doc', '字体文件'], tmp: ['txt', '临时文件'], ini: ['control', '配置设置'], inf: ['txt', '安装信息'],
    url: ['ie', 'Internet 快捷方式'], rtf: ['doc', 'RTF 文档'], dat: ['txt', 'DAT 文件'], rmvb: ['video', 'RealMedia 文件'], drive: ['computer', '本地磁盘']
  };
  FS.kindName = k => (KINDS[k] || ['', '文件'])[1];
  FS.kindIcon = k => (KINDS[k] || ['exe'])[0];

  /* ---------- 清单 ---------- */
  const fixed = new Map();      // 路径 → 我们放好的
  const providers = new Map();  // 文件夹路径 → () => [节点]
  const parentOf = p => (p.lastIndexOf(SEP) > 0 ? p.slice(0, p.lastIndexOf(SEP)) : (p === FS.ROOT ? null : FS.ROOT));
  FS.parentOf = parentOf;
  FS.join = (dir, name) => dir + SEP + name;
  const extOf = n => { const i = n.lastIndexOf('.'); return i > 0 ? n.slice(i + 1).toLowerCase() : ''; };
  function make(path, o) {
    const name = o.name || path.slice(path.lastIndexOf(SEP) + 1);
    const kind = o.kind || (o.folder ? 'folder' : extOf(name) || 'txt');
    return Object.assign({ path, name, kind, folder: kind === 'folder' || kind === 'drive', icon: o.icon || FS.kindIcon(kind) }, o, { path, name, kind });
  }
  // o: { kind, icon, text, open(node, ctx), gate(node, ctx, go), hidden, noDelete, size, date, when(), writable, label, props, menu(node, ctx) }
  FS.add = function (path, o) { fixed.set(path, make(path, o || {})); return fixed.get(path); };
  FS.provide = function (dir, fn) { providers.set(dir, fn); };

  /* ---------- 玩家自己弄出来的 ---------- */
  // 存档 fsUser：[{ path, kind, text, slip, at }]；新建文件夹只放在内存里（重启就没）
  let user = OS.save.get('fsUser', []);
  let temp = [];   // 新建的文件夹：[{ path, kind: 'folder', at }]
  const saveUser = () => { OS.save.set('fsUser', user); OS.emit('fs:change'); };
  const userNode = u => make(u.path, Object.assign({ user: true, writable: true }, u, { temp: undefined }));
  OS.on('desktop:reset', () => { temp = []; user = OS.save.get('fsUser', []).filter(u => exists(parentOf(u.path))); OS.emit('fs:change'); });

  /* ---------- 查 ---------- */
  function exists(path) { return !!FS.get(path); }
  FS.get = function (path) {
    if (path === FS.ROOT) return { path, name: FS.ROOT, folder: true, kind: 'root', icon: 'computer', typeName: '系统文件夹', detail: () => '系统文件夹' };
    const f = fixed.get(path);
    if (f) return !f.when || f.when() ? f : null;
    const t = temp.find(x => x.path === path);
    if (t) return make(t.path, { kind: 'folder', user: true, temp: true, writable: true, date: t.at });
    const u = user.find(x => x.path === path);
    if (u) return userNode(u);
    const dir = parentOf(path);
    const pv = dir && providers.get(dir);
    if (pv) return pv().find(n => n.path === path) || null;
    return null;
  };
  // 一个文件夹里有什么：文件夹在前，再按名字
  FS.list = function (dir, showHidden) {
    const out = [];
    fixed.forEach(n => { if (parentOf(n.path) === dir && (!n.when || n.when())) out.push(n); });
    if (providers.has(dir)) providers.get(dir)().forEach(n => out.push(n));
    temp.forEach(t => { if (parentOf(t.path) === dir) out.push(FS.get(t.path)); });
    user.forEach(u => { if (parentOf(u.path) === dir) out.push(userNode(u)); });
    return out.filter(n => showHidden || !n.hidden)
      .sort((a, b) => (a.order || 0) - (b.order || 0) || (b.folder - a.folder) || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  };
  // 能不能在这个文件夹里新建 / 粘贴：自己标了 writable，或者在一个 writable 的文件夹里面
  FS.writable = function (dir) {
    for (let p = dir; p; p = parentOf(p)) { const n = FS.get(p); if (n && n.writable != null) return !!n.writable; }
    return false;
  };

  /* ---------- 名额：全电脑最多 80 个玩家自己弄出来的 ---------- */
  FS.userCount = function () {
    const desk = OS.desktop && OS.desktop.tempFiles ? OS.desktop.tempFiles().length + OS.desktop.tempFiles(true).length : 0;
    return user.length + temp.length + desk;
  };
  FS.room = () => FS.userCount() < CAP;
  FS.capFail = () => OS.ui.dialog({ title: CAP_TITLE, icon: 'warn', text: CAP_TEXT });
  FS.capNotify = () => OS.ui.notify({ title: CAP_TITLE, text: CAP_TEXT, icon: 'warn', wide: true, timeout: 7000 });

  /* ---------- 改 ---------- */
  // 同一个地方重名：新建的叫“新建文件夹 (2)”，复制的叫“复件 xx”
  FS.freeName = function (dir, name) {
    if (!exists(FS.join(dir, name))) return name;
    const i = name.lastIndexOf('.'), base = i > 0 ? name.slice(0, i) : name, ext = i > 0 ? name.slice(i) : '';
    for (let n = 2; n < 999; n++) { const c = base + ' (' + n + ')' + ext; if (!exists(FS.join(dir, c))) return c; }
    return name;
  };
  // 新建一个文件：返回节点；满 80 个返回 null（quiet = 不弹框，调用的自己处理）
  FS.createFile = function (dir, name, kind, data, quiet) {
    if (!FS.room()) { if (!quiet) FS.capFail(); return null; }
    const path = FS.join(dir, FS.freeName(dir, name));
    user.push(Object.assign({ path, kind, at: Date.now() }, data || {}));
    saveUser();
    return FS.get(path);
  };
  // 新建文件夹（重启就没了）
  FS.createFolder = function (dir, name) {
    if (!FS.room()) { FS.capFail(); return null; }
    const path = FS.join(dir, FS.freeName(dir, name || '新建文件夹'));
    temp.push({ path, kind: 'folder', at: Date.now() });
    OS.emit('fs:change');
    return FS.get(path);
  };
  // 删掉玩家自己的东西（连里面的一起）
  FS.remove = function (path) {
    const inside = p => p === path || p.indexOf(path + SEP) === 0;
    temp = temp.filter(t => !inside(t.path));
    user = user.filter(u => !inside(u.path));
    saveUser();
  };
  // 文件的字：玩家改过（记事本保存）就用改过的
  FS.text = function (node) {
    const edits = OS.save.get('fsText', {});
    if (edits[node.path] != null) return edits[node.path];
    return node.text || '';
  };
  FS.setText = function (path, text) {
    const u = user.find(x => x.path === path);
    if (u) { u.text = text; saveUser(); return; }
    const edits = OS.save.get('fsText', {});
    edits[path] = text;
    OS.save.set('fsText', edits);
    OS.emit('fs:change');
  };
  // 复制一个文件到 dir：同一个地方叫“复件 xx”
  FS.copy = function (node, dir) {
    if (!FS.room()) { FS.capFail(); return null; }
    const name = exists(FS.join(dir, node.name)) ? FS.freeName(dir, '复件 ' + node.name) : node.name;
    const data = { text: FS.text(node) };
    if (node.slip) data.slip = node.slip;
    const doc = FS.docOf(node);
    if (doc) data.doc = doc;
    if (node.copyOf || node.open) data.copyOf = node.copyOf || node.path;   // 复制出来的还能照原样打开（比如游戏、歌）
    user.push(Object.assign({ path: FS.join(dir, name), kind: node.kind, at: Date.now() }, data));
    saveUser();
    return FS.get(FS.join(dir, name));
  };
  // 剪切过去（只有玩家自己的能搬）
  FS.move = function (node, dir) {
    const to = FS.join(dir, FS.freeName(dir, node.name));
    user.forEach(u => { if (u.path === node.path) u.path = to; else if (u.path.indexOf(node.path + SEP) === 0) u.path = to + u.path.slice(node.path.length); });
    temp.forEach(t => { if (t.path === node.path) t.path = to; else if (t.path.indexOf(node.path + SEP) === 0) t.path = to + t.path.slice(node.path.length); });
    saveUser();
    return FS.get(to);
  };
  FS.rename = function (node, name) {
    const to = FS.join(parentOf(node.path), name);
    if (exists(to)) return null;
    const fix = p => (p === node.path ? to : p.indexOf(node.path + SEP) === 0 ? to + p.slice(node.path.length) : p);
    user.forEach(u => { u.path = fix(u.path); });
    temp.forEach(t => { t.path = fix(t.path); });
    saveUser();
    return FS.get(to);
  };

  // 写字板的文章（一段一段带排版）：玩家改过就用改过的
  FS.docOf = function (node) {
    const u = user.find(x => x.path === node.path);
    if (u && u.doc) return u.doc;
    const docs = OS.save.get('fsDoc', {});
    if (docs[node.path]) return docs[node.path];
    return node.doc || null;
  };
  // 画图 AI版 存的画：只改玩家自己的
  FS.setImg = function (path, img) {
    const u = user.find(x => x.path === path);
    if (u) { u.img = img; saveUser(); }
  };
  FS.setDoc = function (path, doc) {
    doc = JSON.parse(JSON.stringify(doc));
    const u = user.find(x => x.path === path);
    if (u) { u.doc = doc; saveUser(); return; }
    const docs = OS.save.get('fsDoc', {});
    docs[path] = doc;
    OS.save.set('fsDoc', docs);
    OS.emit('fs:change');
  };

  /* ---------- 日期：年份一律 200X ---------- */
  FS.dateText = function (t) {
    const d = t ? new Date(t) : OS.clock.now();
    return OS.YEAR + '-' + OS.pad2(d.getMonth() + 1) + '-' + OS.pad2(d.getDate()) + ' ' + OS.pad2(d.getHours()) + ':' + OS.pad2(d.getMinutes());
  };
  // 文件路径按 GBK 算的长度（一个汉字两个字节）：XP 路径不能超过 260
  FS.pathBytes = p => { let n = 0; for (const ch of p) n += ch.charCodeAt(0) > 127 ? 2 : 1; return n; };
})();
