const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "data");

function readJson(file) {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
  return JSON.parse(raw);
}

function loadData() {
  const db = readJson("db.json");
  const users = readJson("users.json").users;

  if (!Array.isArray(db.members) || !Array.isArray(db.homeworks)) {
    throw new Error("db.json 缺少 members 或 homeworks");
  }
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error("users.json 没有可用账号");
  }

  return { db, users };
}

/**
 * 只把可以公开的内容发给浏览器。
 * members 严格只保留 name + className：这是作业要求，也是隐私边界。
 */
function publicPayload(db) {
  return {
    meta: db.meta,
    departments: db.departments,
    members: db.members.map(({ name, className }) => ({ name, className })),
    materials: db.materials,
    exchange: db.exchange,
    photos: db.photos
  };
}

function homeworkStatus(deadline, now = new Date()) {
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diff / 86400000));
  if (diff < 0) return { status: "closed", daysLeft: 0 };
  if (diff <= 3 * 86400000) return { status: "soon", daysLeft };
  return { status: "open", daysLeft };
}

/**
 * 作业只按班级返回。调用前必须已经通过登录校验。
 */
function homeworkForClass(db, className, now = new Date()) {
  return db.homeworks
    .filter((item) => item.className === className)
    .map((item) => ({ ...item, ...homeworkStatus(item.deadline, now) }))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
}

function publicMember(user) {
  return { name: user.name, className: user.className };
}

module.exports = {
  loadData,
  publicPayload,
  homeworkForClass,
  homeworkStatus,
  publicMember
};
