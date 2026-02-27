const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/temp_2026-02-26.json', 'utf8'));

// 昵称映射
const nameMap = {
  'wxid_r9c0x4kotomo22': '由纪',
  'wxid_r36i3ouw7wxk22': '老张',
  'wxid_0gdxg7rcxxhi22': '风',
  'wxid_2dfvbbgfhmxr22': 'オタク',
  'wxid_531c1a5cxpuj11': '逆流而上 lu-xh',
  'wxid_mpf7c42aoe7i22': '雾',
  'wxid_cgo9gxywdua022': '范范W',
  'wxid_4f6lp38fkjja21': '图图和憨憨',
  'wxid_re8c8ku74fpj21': '果果',
  'wxid_t29xl7ix83e421': 'kuroiwa hashiakira',
  'wxid_tbqucqc8kqwl22': 'Kelly ZHANG',
  'wxid_kpgoc237amu922': 'Aria清',
  'wxid_r37k69jrumlw21': '孟超超',
  'wxid_de5ma5nvd0a011': 'Elizabeth',
  'wxid_kq9sc4t9s6mp21': '🐡',
  'wxid_pxwnjcb7z9jn22': 'Moon小小',
  'wxid_t6gcayrdhal911': 'AYA',
  'wxid_7301023053611': 'ヒーロー見参！',
  'wxid_ey0lagg1wayu22': '侯萍 Nina',
  'sss_1232006': '小满花开',
  'wozj81': '设计师lucia',
  'wxid_1563185630411': '利敏',
  'wxid_g7kwna6q389a22': '真异',
  'wxid_kcleuqavsehi22': '半日闲君',
  '25984983373303532@openim': 'Andy老师',
  '25984983898501337@openim': '团团老师',
  'unclered': '菩萨',
  'wxid_7p6zbm2s1ydr12': '饮悦小站',
  'wxid_er76lsy7xp0j21': 'CH东X羽',
  'echo_5566': 'Echo',
  'wxid_76hno7nrydvz22': '不设限的烟火Firework',
  'vip138233003': 'Kyrix启析',
  'wxid_58tz4rbjka6922': '森破',
  'tang278941': '阿珂',
  'tiantrose': '甜甜',
  'wxid_nrd5t8wpfhsk21': '某人',
  'wxid_wcv3c8hwt76p22': '学习有问题',
  'wxid_a3uh5ne7snp611': '三月',
  'wxid_7459mwhwiwco22': 'PBS官方',
  'keyue_du': '柯樾',
  'wxid_wkdorxiylwtg21': '某同学',
  'wxid_u8zyda6klf1g21': '某学员',
  'wxid_ketrg0j6sj5q22': '某成员',
  'wxid_27ptlifnoxqm21': '某人2',
  'wxid_qj2p8a19fjhv22': '某人3',
  'wxid_q4k2lmjry7u322': '某人4',
  'wxid_6jnnl3mx4qf621': '某人5',
  'wxid_wqvj54i7c66612': '某人6',
  'wxid_hncv46zl5wgc22': '某人7',
  'wxid_8omel9zdphpt22': '墨墨memory',
  'wxid_42f8374l15t421': '某人8',
  'wxid_xv0m6r6xxo9q12': '某人9',
  'oOfishbabyOo': 'fishbaby',
  'wxid_smuqbgnsv84722': '某人10',
  'wxid_2y6ym7rzn0t712': '某人11',
  'helin966941': '某人12',
  'wxid_tqx4kha912so21': '某人13',
  'wxid_v78vqwgbeso22': '某人14',
  'wxid_9eiybd8leea022': '某人15',
  'tutuer8024': '某人16',
  'wxid_8tgqngk89q9x22': '某人17',
  'wxid_rondij3hbztg11': '某人18',
  'wxid_i21lpxglpprb22': '某人19'
};

// 从引用消息中提取更多昵称
data.forEach(m => {
  if (m.content && m.content.includes('> ')) {
    const match = m.content.match(/> ([^(]+)\(([^)]+)\)/);
    if (match && !nameMap[match[2]]) {
      nameMap[match[2]] = match[1].trim();
    }
  }
});

function getName(sender) {
  if (!sender) return '系统消息';
  return nameMap[sender] || sender.replace(/^wxid_/, '').substring(0, 8);
}

function parseContent(msg) {
  const type = msg.type;
  let content = msg.content || '';

  if (type === 10000) {
    return '[系统消息] ' + content;
  }
  if (type === 3) {
    return '[图片]';
  }
  if (type === 43) {
    return '[视频]';
  }
  if (type === 47) {
    return '[表情包]';
  }
  if (type === 34) {
    return '[语音]';
  }
  if (type === 49) {
    const titleMatch = content.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      return '[分享: ' + titleMatch[1] + ']';
    }
    return '[分享]';
  }
  if (content.startsWith('> ')) {
    const lines = content.split('\n');
    const quoteLine = lines[0];
    const replyLine = lines.slice(1).join(' ').trim();
    return content.replace(/\n/g, ' ').substring(0, 200);
  }

  return content.replace(/\n/g, ' ');
}

// 过滤有效消息
const validMessages = data.filter(m => m.type !== 10000 || m.content);
const senders = new Set(validMessages.map(m => m.sender).filter(s => s));

// 生成 TXT
let txt = '===== 风变野菩萨AI视频社团A班 · 2026年02月26日 聊天记录 =====\n';
txt += '生成时间：' + new Date().toISOString().replace('T', ' ').substring(0, 19) + '\n';
txt += '消息总数：' + validMessages.length + ' 条\n';
txt += '发言人数：' + senders.size + ' 人\n';
txt += '========================================\n\n';

validMessages.forEach(m => {
  const time = new Date(m.time);
  const timeStr = time.toTimeString().substring(0, 5);
  const name = getName(m.sender);
  const content = parseContent(m);
  txt += '[' + timeStr + '] ' + name + '：' + content + '\n';
});

fs.writeFileSync('C:/Users/92860/Desktop/AI编程项目-个人合集/测试ClaudeCode/DailyNews/raw-2026-02-26.txt', txt);
console.log('TXT saved. Messages:', validMessages.length, 'Senders:', senders.size);

// 输出消息内容供分析
console.log('\n=== 文本消息内容 ===');
validMessages.forEach(m => {
  if (m.type === 1) {
    const time = new Date(m.time).toTimeString().substring(0, 5);
    const name = getName(m.sender);
    console.log('[' + time + '] ' + name + ': ' + m.content.substring(0, 150));
  }
});
