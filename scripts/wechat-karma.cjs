#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * 微信小程序 karma 测试的一键执行器（模板自带，无外部依赖）。
 *
 * 为什么需要它：
 *   karma 的 `miniprogram` launcher 是占位实现，只等客户端连回来，
 *   自己不会拉起微信开发者工具。直接 `ng test` 会卡在
 *   `Starting browser miniprogram` 直到 captureTimeout。
 *   这个脚本负责把「karma server」和「开发者工具自动化会话」两端串起来。
 *
 * 流程：
 *   1. 预检 CLI 存在 + 开发者工具已登录
 *   2. 关掉残留的自动化项目窗口，等自动化端口释放
 *   3. 清掉占着 karma 端口的残留进程（端口漂了产物里烧的还是旧端口）
 *   4. 后台起 `ng test <target>`，等 karma server ready
 *   5. 用开发者工具 CLI 打开测试产物并开自动化端口
 *   6. 抓日志判定成败（错误优先，不靠「等够多久」）
 *   7. 收尾：杀 ng 进程树 + 关闭项目窗口释放会话
 *
 * 用法：
 *   npm run test:wechat
 *   node ./scripts/wechat-karma.cjs [--target first] [--dist <产物目录>]
 *        [--cli <cli 路径>] [--karma-port 9876] [--auto-port 9420]
 *        [--ide-port <IDE 服务端口>] [--timeout 180] [--keep-open]
 *
 * 前置条件（脚本会检查，但先说清楚省得来回试）：
 *   - 微信开发者工具已启动，且「设置 → 安全设置 → 服务端口」已开启
 *   - 已扫码登录（CLI 自己拉起的实例是登出态，等不会恢复）
 */

const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { spawn, spawnSync, execSync } = require('node:child_process');

// ---------------------------------------------------------------- 参数

const DEFAULTS = {
  target: 'first',
  karmaPort: 9876,
  autoPort: 9420,
  idePort: 0,
  timeout: 180,
};

function parseArgs(argv) {
  const opt = { ...DEFAULTS, cli: process.env.WX_DEVTOOLS_CLI || defaultCliPath() };
  for (let i = 0; i < argv.length; i++) {
    const next = () => argv[++i];
    switch (argv[i]) {
      case '--target':
        opt.target = next();
        break;
      case '--dist':
        opt.dist = next();
        break;
      case '--cli':
        opt.cli = next();
        break;
      case '--karma-port':
        opt.karmaPort = Number(next());
        break;
      case '--auto-port':
        opt.autoPort = Number(next());
        break;
      case '--ide-port':
        opt.idePort = Number(next());
        break;
      case '--timeout':
        opt.timeout = Number(next());
        break;
      case '--keep-open':
        opt.keepOpen = true;
        break;
      case '-h':
      case '--help':
        opt.help = true;
        break;
      default:
        throw new Error(`未知参数: ${argv[i]}`);
    }
  }
  if (!opt.dist) {
    opt.dist = path.join(process.cwd(), 'dist', 'karma', opt.target);
  }
  opt.dist = path.resolve(opt.dist);
  return opt;
}

function defaultCliPath() {
  const win = 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat';
  if (fs.existsSync(win)) return win;
  const mac = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';
  if (fs.existsSync(mac)) return mac;
  throw new Error('找不到微信开发者工具 CLI，用 --cli 或环境变量 WX_DEVTOOLS_CLI 指定');
}

// ---------------------------------------------------------------- 小工具

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

const fmtMs = (ms) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`);

function tail(text, n) {
  return stripAnsi(text).trimEnd().split('\n').slice(-n).join('\n');
}

function portInUse(port) {
  return new Promise((resolve) => {
    const s = net.connect(port, '127.0.0.1');
    s.once('connect', () => {
      s.destroy();
      resolve(true);
    });
    s.once('error', () => resolve(false));
    s.setTimeout(800, () => {
      s.destroy();
      resolve(false);
    });
  });
}

/** Windows 按端口找 PID；其它平台用 lsof。返回 PID 数组。 */
function pidsOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
      const pids = new Set();
      for (const line of out.split('\n')) {
        if (/LISTENING/.test(line) && new RegExp(`:${port}\\s`).test(line)) {
          const pid = line.trim().split(/\s+/).pop();
          if (/^\d+$/.test(pid)) pids.add(pid);
        }
      }
      return [...pids];
    }
    const out = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' });
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

async function freePort(port) {
  const pids = pidsOnPort(port);
  if (!pids.length) return;
  console.log(`[karma] 端口 ${port} 被占用，清理 PID: ${pids.join(', ')}`);
  for (const pid of pids) {
    killTree(Number(pid));
  }
  for (let i = 0; i < 20 && (await portInUse(port)); i++) {
    await sleep(500);
  }
}

/**
 * 连进程树一起杀。
 *
 * `ng test` 是 npx 的子孙进程，只 kill 最外层 shell 的话 karma server
 * 会活下来占着 9876，下一轮就端口漂移、客户端连不上。
 */
function killTree(pid) {
  if (!pid || Number.isNaN(pid)) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      /* 已退出 */
    }
  }
}

/**
 * 带反馈的等待：每打一行「在等什么 · 等了多久 · 现在卡在哪」。
 * check() 返回 { done:true, info } 或 { done:false, waiting }。
 */
async function waitUntil(label, { check, timeoutMs, heartbeatMs = 3000, hint = '' }) {
  const started = Date.now();
  let lastBeat = 0;
  let lastWaiting = '';
  for (;;) {
    let obs;
    try {
      obs = await check();
    } catch (e) {
      obs = { done: false, waiting: `check 抛错: ${e.message}` };
    }
    const now = Date.now();
    if (obs && obs.done) {
      console.log(`  ✓ ${label}  ${fmtMs(now - started)}` + (obs.info ? `  · ${obs.info}` : ''));
      return true;
    }
    const waiting = (obs && obs.waiting) || '尚未就绪';
    if (waiting !== lastWaiting) {
      lastWaiting = waiting;
      console.log(`  · ${label}  ${fmtMs(now - started)}  · ${waiting}`);
      lastBeat = now;
    } else if (now - lastBeat >= heartbeatMs) {
      lastBeat = now;
      console.log(`  · ${label}  已等 ${fmtMs(now - started)}  · ${waiting}`);
    }
    if (now - started >= timeoutMs) {
      console.error(`  ✗ ${label}  ${fmtMs(now - started)} 超时`);
      if (hint) console.error(`      排查: ${hint}`);
      return false;
    }
    await sleep(200);
  }
}

function reportFailure(phase, facts) {
  console.error('');
  console.error('──────── 失败诊断 ────────');
  console.error(`  卡在阶段: ${phase}`);
  for (const [k, v] of Object.entries(facts)) {
    console.error(`  ${k}: ${v}`);
  }
  console.error('──────────────────────────');
}

// ---------------------------------------------------------------- 开发者工具 CLI

/**
 * 跑一次 cli，返回 stdout（失败不抛，返回空串）。
 *
 * 必须 shell:true —— Node 18+ 直接 exec .bat 会 EINVAL。
 * shell 模式下路径得自己加引号，否则 `C:\Program Files (x86)\...`
 * 会被拆成 `C:\Program`。
 */
function cliRun(opt, actionArgs) {
  const args = ['--lang', 'zh'];
  if (opt.idePort) args.push('--port', String(opt.idePort));
  args.push(...actionArgs);
  try {
    const r = spawnSync([`"${opt.cli}"`, ...args].join(' '), {
      encoding: 'utf8',
      timeout: 90_000,
      shell: true,
    });
    return String(r.stdout || '');
  } catch {
    return '';
  }
}

function cliLogin(opt) {
  const m = /\{[^{}]*"login"[^{}]*\}/.exec(cliRun(opt, ['islogin']));
  return m ? JSON.parse(m[0]) : null;
}

// ---------------------------------------------------------------- 判定辅助

/**
 * 运行时致命错误特征。
 * 故意不含 DeprecationWarning / [EVAL]：那是构建警告，通过时也会出现。
 */
const RUNTIME_ERROR_RE =
  /(小程序 ERROR|An error was thrown in afterAll|TypeError:|ReferenceError:|RangeError:|Cannot read properties|Cannot find module|is not a function|is not defined)/;

function pickLine(log, re) {
  for (const line of stripAnsi(log).split('\n')) {
    if (re.test(line)) return line.trim().slice(0, 200);
  }
  return null;
}

/**
 * 解析 karma 汇总行。
 *
 * 权威格式（karma/lib/reporters/base.js renderBrowser）：
 *   Executed <N> of <total>[ (K FAILED)] [SUCCESS|ERROR|DISCONNECTED] (<totalTime> / <netTime>)
 *
 * 第一个括号是服务端自己的耗时：跑动中恒为 0，收到 complete 后才非零。
 * 所以「第一个括号非零」= 服务端已收尾，不用猜静默窗口。
 */
function parseSummary(line) {
  const clean = stripAnsi(line);
  const m = /Executed (\d+) of (null|\d+)/.exec(clean);
  if (!m) return null;
  const failedM = /\((\d+) FAILED\)/.exec(clean);
  const state = /\bERROR\b/.test(clean)
    ? 'ERROR'
    : /\bDISCONNECTED\b/.test(clean)
      ? 'DISCONNECTED'
      : /\bSUCCESS\b/.test(clean)
        ? 'SUCCESS'
        : null;
  const t = /\(([\d.]+) secs \/ ([\d.]+) secs\)/.exec(clean);
  const serverSecs = t ? Number(t[1]) : null;
  return {
    executed: Number(m[1]),
    total: m[2] === 'null' ? null : Number(m[2]),
    failed: failedM ? Number(failedM[1]) : 0,
    state,
    serverSecs,
    finalized: serverSecs !== null && serverSecs > 0,
  };
}

function summaryLines(log) {
  return stripAnsi(log).split('\n').filter((l) => /Executed \d+/.test(l));
}

function lastSummaryLine(log) {
  const lines = summaryLines(log);
  return lines.length ? lines[lines.length - 1].trim().slice(0, 200) : '';
}

/** 优先返回已收尾（finalized）的那条，避免被自己打的汇总行污染成 finalized=false。 */
function lastParsedSummary(log) {
  const lines = summaryLines(log);
  let last = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    const s = parseSummary(lines[i]);
    if (!s) continue;
    if (s.finalized) return s;
    if (!last) last = s;
  }
  return last;
}

/**
 * 扫出可能占着自动化会话的项目目录。
 *
 * DevTools 的自动化会话整个实例全局唯一，别的项目窗口开着照样会抢，
 * 所以把 dist/karma 下所有「像小程序工程的目录」都收进来逐个 close。
 */
function collectAutomationDists(distDir) {
  const found = new Set();
  const isProject = (dir) => {
    try {
      return fs.statSync(path.join(dir, 'app.json')).isFile();
    } catch {
      return false;
    }
  };
  const karmaRoot = path.dirname(distDir);
  try {
    for (const e of fs.readdirSync(karmaRoot, { withFileTypes: true })) {
      if (e.isDirectory() && isProject(path.join(karmaRoot, e.name))) {
        found.add(path.join(karmaRoot, e.name));
      }
    }
  } catch {
    /* 没构建过，正常 */
  }
  if (fs.existsSync(distDir)) found.add(distDir);
  return [...found];
}

// ---------------------------------------------------------------- 主流程

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.help) {
    console.log(
      [
        '用法: npm run test:wechat [-- <参数>]',
        '',
        '  --target <name>       ng test 的目标（默认 first）',
        '  --dist <dir>          测试产物目录（默认 ./dist/karma/<target>）',
        '  --cli <path>          微信开发者工具 cli 路径（或环境变量 WX_DEVTOOLS_CLI）',
        '  --karma-port <n>      karma 端口（默认 9876）',
        '  --auto-port <n>       开发者工具自动化端口（默认 9420）',
        '  --ide-port <n>        IDE 服务端口（不传则读 CLI 自己记录的 .ide 值）',
        '  --timeout <sec>       等结果上限（默认 180）',
        '  --keep-open           跑完不关开发者工具里的项目窗口',
      ].join('\n'),
    );
    process.exit(0);
  }

  if (!fs.existsSync(opt.cli)) {
    throw new Error(`开发者工具 CLI 不存在: ${opt.cli}`);
  }
  if (!fs.existsSync(opt.dist)) {
    throw new Error(
      `测试产物目录不存在: ${opt.dist}\n  先跑一次 ng test（本脚本会自己起），或确认 --target / --dist 写对`,
    );
  }

  console.log(`[karma] target=${opt.target}  dist=${opt.dist}`);
  console.log(`[karma] cli=${opt.cli}`);

  // ---- 0. 预检登录态
  //
  // 必须在起 karma 之前查。未登录时 `cli auto` 会**假成功**：
  // 照样回 `✔ auto`，但小程序永远不连 karma，整轮白等到超时，
  // 日志里完全看不到登录线索。提前查一次，把「白等 3 分钟」变成「1 秒告诉你去登录」。
  const login = cliLogin(opt);
  if (login === null) {
    throw new Error(
      '连不上开发者工具的服务端口。\n' +
        '  • 确认微信开发者工具已启动\n' +
        '  • 确认 设置 → 安全设置 → 服务端口 已开启\n' +
        '  • 端口对不上时用 --ide-port <端口> 指定',
    );
  }
  if (login.login !== true) {
    throw new Error(
      '开发者工具未登录。\n' +
        'CLI 拉起的实例是登出状态（同 profile 也不带登录态，等不会恢复），\n' +
        '必须手动打开微信开发者工具并扫码登录。',
    );
  }
  console.log('[precheck] 登录态 OK');

  // ---- 0.5 关掉可能残留的自动化项目窗口
  //
  // 自动化会话同一时刻只能有一个。上一轮跑完项目窗口还开在 IDE 里，
  // 本轮 `cli auto` 去抢会话，旧连接被强制 close，karma 刚连上就断，
  // 表现是 `Executed 0` + `transport close`。
  const dists = collectAutomationDists(opt.dist);
  console.log(`[precheck] 关闭残留项目窗口（${dists.length} 个候选）`);
  for (const d of dists) {
    cliRun(opt, ['close', '--project', `"${d}"`]);
  }
  const released = await waitUntil('等自动化会话释放', {
    timeoutMs: 20_000,
    heartbeatMs: 1500,
    hint: `端口 ${opt.autoPort} 一直占着 = 有项目窗口没关掉，去开发者工具里手动关，或换个 --auto-port。`,
    check: async () => {
      const busy = await portInUse(opt.autoPort);
      return busy
        ? { done: false, waiting: `端口 ${opt.autoPort} 仍被占` }
        : { done: true, info: `端口 ${opt.autoPort} 已释放` };
    },
  });
  if (!released) {
    // 端口没释放就 auto，本轮根本绑不上；日志里的 "Connected" 是上一个
    // 窗口的客户端，拿它等结果只会误报「零推进」。必须在这里断掉。
    reportFailure('自动化会话没释放', {
      卡住端口: opt.autoPort,
      已尝试关闭: `${dists.length} 个候选目录`,
      怎么办: '开发者工具里把占着的项目窗口关掉；关不掉就 --auto-port 换一个',
    });
    process.exit(1);
  }

  await freePort(opt.karmaPort);

  // ---- 1. 起 karma server
  const ng = spawn('npx', ['ng', 'test', opt.target], {
    cwd: process.cwd(),
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  let log = '';
  const onData = (buf) => {
    log += buf.toString();
    process.stdout.write(buf);
  };
  ng.stdout.on('data', onData);
  ng.stderr.on('data', onData);

  const serverReady = await waitUntil('karma server 启动', {
    timeoutMs: 120_000,
    heartbeatMs: 2000,
    hint: '没听到 server started，看上面的报错。常见：builder 依赖缺、tsconfig 错、端口被占。',
    check: () => {
      if (/Karma v[\d.]+ server started/.test(log)) return { done: true, info: 'server 已监听' };
      if (ng.exitCode !== null) {
        console.error(tail(log, 25));
        return { done: true, info: `ng 已退出(code=${ng.exitCode})，未起来` };
      }
      const lastLine = tail(log, 1).trim() || '无输出';
      return { done: false, waiting: lastLine.slice(0, 120) };
    },
  });
  if (!serverReady || ng.exitCode !== null) {
    killTree(ng.pid);
    reportFailure('karma server 启动', {
      原因:
        ng.exitCode !== null
          ? `ng test 直接退出，code=${ng.exitCode}`
          : '120s 内没听到 server started',
      最后日志: tail(log, 15),
    });
    process.exit(1);
  }

  // 产物是现编的，server ready 不代表文件写完了，盯 app.json 出现且非空。
  await waitUntil('等产物写完', {
    timeoutMs: 60_000,
    heartbeatMs: 2000,
    hint: `${opt.dist} 下迟迟没有 app.json = 构建没产出，看上面 ng test 的报错。`,
    check: () => {
      const appJson = path.join(opt.dist, 'app.json');
      if (!fs.existsSync(appJson)) return { done: false, waiting: '还没生成 app.json' };
      const size = fs.statSync(appJson).size;
      if (size <= 0) return { done: false, waiting: 'app.json 大小为 0，还在写' };
      return { done: true, info: `app.json ${size} 字节` };
    },
  });

  // ---- 2. 拉起开发者工具自动化
  console.log(`[devtools] auto --project ${opt.dist} --auto-port ${opt.autoPort}`);
  const dev = spawn(
    `"${opt.cli}"`,
    [
      '--lang',
      'zh',
      ...(opt.idePort ? ['--port', String(opt.idePort)] : []),
      'auto',
      '--project',
      `"${opt.dist}"`,
      '--auto-port',
      String(opt.autoPort),
    ],
    { shell: true, env: process.env },
  );
  dev.stdout.on('data', (b) => process.stdout.write(b));
  dev.stderr.on('data', (b) => process.stdout.write(b));

  // ---- 3. 判定：看日志已经说了什么，而不是等了多久
  const startedAt = Date.now();
  const noSpecMs = 8000; // 连上后这么久一条 spec 都没跑 = 没起来

  const verdict = await (async () => {
    let lastExecuted = -1;
    let prevLen = log.length;
    let connectedTs = null;

    for (;;) {
      // ① 错误优先：日志里已经有异常，立刻定死，不再等
      const errLine = pickLine(log, RUNTIME_ERROR_RE);
      if (errLine) return { ok: false, why: '运行时报错', detail: errLine };

      if (connectedTs === null && /Connected on socket/.test(log)) {
        connectedTs = Date.now();
        console.log(`  ✓ 小程序连上 karma  ${fmtMs(connectedTs - startedAt)}`);
      }

      const s = lastParsedSummary(log);
      const executed = s ? s.executed : 0;
      const total = s ? s.total : null;
      const failed = s ? s.failed : 0;

      // ② 明确失败
      if (failed > 0) {
        return {
          ok: false,
          why: `${failed} 个 spec 失败`,
          executed,
          total,
          detail: lastSummaryLine(log),
        };
      }

      // ③ 跑满即通过（executed = success + failed，跑满说明都记过账了）
      if (total !== null && executed >= total) {
        return { ok: true, why: 'executed >= total', executed, total };
      }

      // ④ 收尾定性。⚠️ 「收尾」不等于「跑完」：
      //    实测过 `Executed 1 of 2 SUCCESS` —— 第二个 spec 根本没跑，
      //    karma 照样收尾并挂 SUCCESS。没跑满就是不完整运行，算失败。
      if (s && s.finalized) {
        if (s.total !== null && s.executed < s.total) {
          return {
            ok: false,
            why: `收尾了但只跑了 ${s.executed}/${s.total}，有 ${s.total - s.executed} 个 spec 没执行到`,
            executed: s.executed,
            total: s.total,
            detail: lastSummaryLine(log),
          };
        }
        return {
          ok: s.state === 'SUCCESS' && s.failed === 0,
          why: `终态 ${s.state}（服务端耗时 ${s.serverSecs}s${s.failed ? `，失败 ${s.failed}` : ''}）`,
          executed: s.executed,
          total: s.total,
          detail: lastSummaryLine(log),
        };
      }

      // 跟踪推进（executed 变了、或日志有新增内容都算）
      if (executed !== lastExecuted) {
        lastExecuted = executed;
      } else if (log.length !== prevLen) {
        prevLen = log.length;
      }

      // ⑤ 连上了但一条 spec 都没跑
      if (connectedTs !== null && executed === 0 && Date.now() - connectedTs > noSpecMs) {
        return {
          ok: false,
          why: `连上后 ${noSpecMs}ms 内没有任何 spec 执行`,
          executed: 0,
          total: null,
          detail: lastSummaryLine(log),
        };
      }

      // ⑥ ng 自己退了
      if (ng.exitCode !== null) {
        return {
          ok: executed > 0 && failed === 0,
          why: `ng 退出(code=${ng.exitCode})`,
          executed,
          total,
          detail: lastSummaryLine(log),
        };
      }

      if (Date.now() - startedAt > opt.timeout * 1000) return null;
      await sleep(100);
    }
  })();

  // ---- 4. 收尾
  killTree(ng.pid);
  try {
    dev.kill('SIGKILL');
  } catch {
    /* 已退出 */
  }
  if (!opt.keepOpen) {
    // 只关项目窗口，不杀 IDE —— 保住登录态，下一轮不用重新扫码
    cliRun(opt, ['close', '--project', `"${opt.dist}"`]);
  }

  if (!verdict) {
    reportFailure('等结果', {
      超时上限: `${opt.timeout}s`,
      实际等待: fmtMs(Date.now() - startedAt),
      最后日志: tail(log, 6),
      排查: '既没报错也没跑完。看最后一个 Executed 卡在哪个 spec，有没有反复重连。',
    });
    process.exit(1);
  }
  if (!verdict.ok) {
    reportFailure('测试未通过', {
      判定: verdict.why,
      执行: `${verdict.executed ?? 0} / ${verdict.total ?? '未知'}`,
      耗时: fmtMs(Date.now() - startedAt),
      关键日志: verdict.detail || tail(log, 6),
    });
    process.exit(1);
  }
  console.log(
    `\n[PASS] Executed ${verdict.executed} of ${verdict.total} SUCCESS` +
      `  （${fmtMs(Date.now() - startedAt)}，判定：${verdict.why}）`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error('[wechat-karma] 失败:', e.message || e);
  process.exit(1);
});
