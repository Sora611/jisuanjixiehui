/**
 * 生成演示账号的密码哈希。
 * 用法：node scripts/hash-password.js
 * 仅用于本地课程项目；真实项目应由管理员重置密码，不要把明文写进仓库。
 */
const { randomBytes, scryptSync } = require("node:crypto");
const { writeFileSync } = require("node:fs");
const { join } = require("node:path");

const accounts = [
  { username: "2023010101", password: "demo123", name: "张晨", className: "计科2301" },
  { username: "2023020202", password: "demo123", name: "李雨", className: "软工2302" },
  { username: "2023030303", password: "demo123", name: "许博", className: "网络2301" }
];

const users = accounts.map((account) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(account.password, salt, 64).toString("hex");
  return {
    username: account.username,
    salt,
    hash,
    name: account.name,
    className: account.className
  };
});

const output = join(__dirname, "..", "data", "users.json");
writeFileSync(output, JSON.stringify({ users }, null, 2) + "\n", "utf8");
console.log(`Wrote ${users.length} demo accounts to ${output}`);
