#!/usr/bin/env node
/**
 * 源码 → 构建 → pack → 装进本工程。
 *
 * 用法：node scripts/use-local-lib.cjs [源码仓库目录]
 * 默认同级 ../angular-miniprogram。
 */

const { spawnSync } = require('node:child_process');
const path = require('path');

const source = path.resolve(process.argv[2] ?? path.join(__dirname, '..', '..', 'angular-miniprogram'));
const dist = path.join(source, 'dist');
const template = path.join(__dirname, '..');

const run = (cmd, cwd) => {
  console.log(`\n$ ${cmd}   (${cwd})`);
  const r = spawnSync(cmd, { cwd, shell: true, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run('npm run build', source);

const packed = spawnSync('npm pack', { cwd: dist, shell: true, encoding: 'utf8' });
if (packed.status !== 0) process.exit(packed.status ?? 1);

const tgz = packed.stdout.split(/\r?\n/).map((s) => s.trim()).filter((s) => s.endsWith('.tgz')).pop();
if (!tgz) {
  console.error('npm pack 没吐出 tgz 名：\n' + packed.stdout);
  process.exit(1);
}

run(`npm install "${path.join(dist, tgz)}"`, template);
