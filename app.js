const PLAN_URL = "data/reading-plan.json";
const STORAGE_KEY = "sschBible365Progress";
let plan = [];
let todayItem = null;
let completed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
const $ = (id) => document.getElementById(id);

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}
function formatDate() {
  return new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
}
function saveProgress() { localStorage.setItem(STORAGE_KEY, JSON.stringify(completed)); }
function isDone(day) { return completed[String(day)] === true; }
function badgeName(count) {
  if (count >= 365) return "Bible Master";
  if (count >= 100) return "말씀 챔피언";
  if (count >= 30) return "말씀나무";
  if (count >= 7) return "말씀 루틴";
  if (count >= 3) return "새싹 성장";
  return "새싹";
}
function calculateStreak() {
  let streak = 0;
  const today = getDayOfYear();
  for (let day = today; day >= 1; day--) {
    if (isDone(day)) streak++;
    else break;
  }
  return streak;
}
function updateStats() {
  const count = Object.values(completed).filter(Boolean).length;
  $("streak").textContent = `${calculateStreak()}일`;
  $("progress").textContent = `${count} / 365`;
  $("badge").textContent = badgeName(count);
}
function renderToday() {
  const day = getDayOfYear();
  todayItem = plan.find(item => item.day === day) || plan[(day - 1) % plan.length];
  $("dayNumber").textContent = `Day ${todayItem.day}`;
  $("todayDate").textContent = formatDate();
  $("todayTitle").textContent = todayItem.title;
  $("readings").innerHTML = todayItem.readings.map(r => `<div class="reading-item">📖 ${r}</div>`).join("");
  $("question").textContent = `💭 ${todayItem.question}`;
  $("quizQuestion").textContent = todayItem.quiz.question;
  const done = isDone(todayItem.day);
  $("completeBtn").textContent = done ? "오늘 읽기 완료 🙌" : "읽었어요 ✅";
  $("completeBtn").classList.toggle("done", done);
  renderQuiz();
}
function renderQuiz() {
  $("quizResult").textContent = "";
  $("quizOptions").innerHTML = todayItem.quiz.options.map((option, index) => `<button onclick="checkQuiz(${index})">${index + 1}. ${option}</button>`).join("");
}
function checkQuiz(index) {
  $("quizResult").textContent = index === todayItem.quiz.answerIndex ? "정답입니다! 🎉" : "아쉬워요. 다시 생각해볼까요? 🙂";
}
function renderPlanList() {
  const day = getDayOfYear();
  const list = plan.slice(Math.max(0, day - 1), Math.max(0, day - 1) + 7);
  $("planList").innerHTML = list.map(item => `
    <div class="plan-row ${isDone(item.day) ? "done" : ""}">
      <strong>Day ${item.day}</strong>
      <span>${item.readings.join(" / ")}</span>
    </div>
  `).join("");
}
$("completeBtn").addEventListener("click", () => {
  completed[String(todayItem.day)] = true;
  saveProgress();
  renderToday();
  updateStats();
  renderPlanList();
  if (navigator.vibrate) navigator.vibrate(80);
});
async function init() {
  const res = await fetch(PLAN_URL);
  plan = await res.json();
  renderToday();
  updateStats();
  renderPlanList();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}
init();
