const PLAN_URL = "data/reading-plan.json";
const STORAGE_KEY = "sschBible365ProgressV2";

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
  return new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long"
  });
}
function saveProgress() { localStorage.setItem(STORAGE_KEY, JSON.stringify(completed)); }
function isDone(day) { return completed[String(day)] === true; }
function badgeName(count) {
  if (count >= 365) return "👑 Bible Master";
  if (count >= 200) return "🔥 말씀 마라토너";
  if (count >= 100) return "🏆 말씀 챔피언";
  if (count >= 30) return "🌳 말씀나무";
  if (count >= 7) return "🌿 말씀 루틴";
  if (count >= 3) return "🌱 새싹 성장";
  return "🌱 새싹";
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
  const percent = Math.round((count / 365) * 100);
  $("streak").textContent = `${calculateStreak()}일`;
  $("progress").textContent = `${count} / 365`;
  $("badge").textContent = badgeName(count);
  $("percent").textContent = `${percent}%`;
  $("circleProgress").style.background = `conic-gradient(var(--green) ${percent * 3.6}deg, rgba(255,255,255,0.13) 0deg)`;
}
function renderToday() {
  const day = getDayOfYear();
  todayItem = plan.find(item => item.day === day) || plan[(day - 1) % plan.length];

  $("dayBadge").textContent = `Day ${todayItem.day}`;
  $("todayDate").textContent = formatDate();

  $("readings").innerHTML = todayItem.readings.map((r, idx) => `
    <div class="reading-item">
      <span>📖 ${r}</span>
      <small>${idx + 1}</small>
    </div>
  `).join("");

  $("keyVerse").textContent = todayItem.keyVerse;
  $("question").textContent = todayItem.question;
  $("quizQuestion").textContent = todayItem.quiz.question;

  const done = isDone(todayItem.day);
  $("completeBtn").textContent = done ? "오늘 읽기 완료 🙌" : "읽었어요 ✅";
  $("completeBtn").classList.toggle("done", done);

  renderQuiz();
}
function renderQuiz() {
  $("quizResult").textContent = "";
  $("quizOptions").innerHTML = todayItem.quiz.options.map((option, index) =>
    `<button onclick="checkQuiz(${index}, this)">${index + 1}. ${option}</button>`
  ).join("");
}
function checkQuiz(index, btn) {
  const buttons = [...document.querySelectorAll(".quiz-options button")];
  buttons.forEach(b => b.disabled = true);
  if (index === todayItem.quiz.answerIndex) {
    btn.classList.add("correct");
    $("quizResult").textContent = "정답입니다! 말씀을 마음에 새겨요 🎉";
  } else {
    btn.classList.add("wrong");
    buttons[todayItem.quiz.answerIndex].classList.add("correct");
    $("quizResult").textContent = "아쉬워요. 정답을 확인하고 다시 기억해봐요 🙂";
  }
}
function renderPlanList() {
  const day = getDayOfYear();
  const start = Math.max(0, day - 1);
  const list = plan.slice(start, start + 7);
  $("planList").innerHTML = list.map(item => `
    <div class="plan-row ${isDone(item.day) ? "done" : ""}">
      <strong>Day ${item.day}</strong>
      <span>${item.readings.join(" / ")}</span>
    </div>
  `).join("");
}
function renderCalendar() {
  const today = getDayOfYear();
  $("calendarGrid").innerHTML = plan.map(item =>
    `<div class="day-cell ${isDone(item.day) ? "done" : ""} ${item.day === today ? "today" : ""}" title="Day ${item.day}"></div>`
  ).join("");
}
function completeToday() {
  completed[String(todayItem.day)] = true;
  saveProgress();
  renderAll();
  if (navigator.vibrate) navigator.vibrate(80);
}
function resetToday() {
  if (!confirm("오늘 읽기 체크를 취소할까요?")) return;
  delete completed[String(todayItem.day)];
  saveProgress();
  renderAll();
}
function resetAll() {
  if (!confirm("모든 읽기 기록을 초기화할까요?")) return;
  completed = {};
  saveProgress();
  renderAll();
}
function renderAll() {
  renderToday();
  updateStats();
  renderPlanList();
  renderCalendar();
}
function scrollToTop() { window.scrollTo({top:0, behavior:"smooth"}); }
function scrollToSection(id) { $(id).scrollIntoView({behavior:"smooth", block:"center"}); }

$("completeBtn").addEventListener("click", completeToday);
$("resetTodayBtn").addEventListener("click", resetToday);
$("resetAllBtn").addEventListener("click", resetAll);

async function init() {
  const res = await fetch(PLAN_URL);
  plan = await res.json();
  renderAll();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
init();
