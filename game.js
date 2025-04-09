
const SUPABASE_URL = "https://uhrmsevxbnqjptpuhprp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocm1zZXZ4Ym5xanB0cHVocHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTQzODksImV4cCI6MjA1OTc3MDM4OX0.odCOrZw7JZHzFyKYtTBYhUbPfH_6ieynTmW7AfwBJpM"; // обрежь на проде

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
            saveScoreToSupabase(score);
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
    if (gameOver) {
        ctx.fillText("Игра окончена", 150, 300);
        drawLeaderboard();
    }
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

// ===== Supabase =====

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
    fetchLeaderboard();
}

async function fetchLeaderboard() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/scores?select=username,score&order=score.desc&limit=10`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    const data = await res.json();
    leaderboardData = data;
}

let leaderboardData = [];

function drawLeaderboard() {
    ctx.fillStyle = "black";
    ctx.fillText("Топ игроков:", 10, 50);
    leaderboardData.forEach((player, i) => {
        ctx.fillText(`${i + 1}. ${player.username}: ${player.score}`, 10, 70 + i * 20);
    });
}
    requestAnimationFrame(gameLoop);
}
gameLoop();

