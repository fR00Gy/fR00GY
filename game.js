
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 600;

const frog = { x: 175, y: 500, width: 50, height: 50, speed: 5 };
const gifts = [];
let score = 0;
let gameOver = false;

function drawFrog() {
    ctx.fillStyle = "green";
    ctx.fillRect(frog.x, frog.y, frog.width, frog.height);
}

function drawGifts() {
    ctx.fillStyle = "red";
    gifts.forEach(gift => ctx.fillRect(gift.x, gift.y, 20, 20));
}

function update() {
    if (gameOver) return;
    gifts.forEach(gift => {
        gift.y += gift.speed;
        if (gift.y > canvas.height) {
            gameOver = true;
            console.log("Счёт отправлен:", score);
            if (window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.sendData(JSON.stringify({ score }));
            }
        }
        if (
            gift.y + 20 >= frog.y &&
            gift.x >= frog.x &&
            gift.x <= frog.x + frog.width
        ) {
            score++;
            gifts.splice(gifts.indexOf(gift), 1);
        }
    });
    if (Math.random() < 0.02) {
        gifts.push({ x: Math.random() * 380, y: 0, speed: 2 + Math.random() * 3 });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFrog();
    drawGifts();
    ctx.fillStyle = "black";
    ctx.fillText(`Очки: ${score}`, 10, 20);
    if (gameOver) ctx.fillText("Игра окончена", 150, 300);
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && frog.x > 0) frog.x -= frog.speed;
    if (e.key === "ArrowRight" && frog.x < canvas.width - frog.width) frog.x += frog.speed;
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
gameLoop();
// Получение имени игрока
let user = { id: "anonymous", name: "Гость" };
if (window.Telegram && Telegram.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
  const tg = Telegram.WebApp.initDataUnsafe;
  user = {
    id: tg?.user?.id?.toString() || "anonymous",
    name: tg?.user?.first_name || "Гость"
  };
}

// Сохраняем результат в Supabase
async function saveScoreToSupabase(score) {
  await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ user_id: user.id, username: user.name, score })
  });
  fetchLeaderboardFromSupabase();  // Обновляем лидерборд после сохранения
}

// Отображение Топа игроков
async function fetchLeaderboardFromSupabase() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scores?select=username,score&order=score.desc&limit=10`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const data = await res.json();
  renderLeaderboard(data);
}

function renderLeaderboard(data) {
  const container = document.getElementById("leaderboard");
  container.innerHTML = '<h3>Топ игроков</h3>';
  const table = document.createElement("table");
  table.innerHTML = `<tr><th>Имя</th><th>Очки</th></tr>` +
    data.map(row => `<tr><td>${row.username}</td><td>${row.score}</td></tr>`).join('');
  container.appendChild(table);
}
