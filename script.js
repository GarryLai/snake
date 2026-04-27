const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const livesElement = document.getElementById("lives");

let gridSize = 20;
let tileCountX = 0;
let tileCountY = 0;

let targetDNASequence = [];
let snakeHeadEnds = "3'";
let targetDNAEnds = "5'";
const COMPLEMENTS = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
const BASES = ['A', 'T', 'C', 'G'];
let foods = [];

let snake = [];
let dx = 0;
let dy = 0;
let score = 0;
let level = 1;
let lives = 3;
let gameLoop;
let speed = 250;
let changingDirection = false;
let isPaused = false;
let isGameRunning = false;
let extraLifeMsgTimer = 0;

function resizeCanvas() {
    // 預留一些空間給標題、分數和按鈕
    const maxWidth = Math.min(window.innerWidth - 40, 800);
    const maxHeight = window.innerHeight - 200;
    
    // 讓畫布大小是 grid size 的整數倍，以保持像素完美
    canvas.width = Math.floor(maxWidth / gridSize) * gridSize;
    canvas.height = Math.floor(maxHeight / gridSize) * gridSize;
    
    tileCountX = canvas.width / gridSize;
    tileCountY = canvas.height / gridSize;
    
    if (isGameRunning) {
        drawGame(); // 重新描繪以適應新大小
    } else {
        clearCanvas();
        ctx.fillStyle = "#0f0";
        ctx.font = "20px 'Courier New', Courier, monospace";
        ctx.textAlign = "center";
        ctx.fillText("PRESS START", canvas.width / 2, canvas.height / 2);
    }
}

window.addEventListener('resize', resizeCanvas);

function initGame() {
    snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
    dx = 1;
    dy = 0;
    score = 0;
    level = 1;
    lives = 3;
    speed = 250; // Slower initial speed
    isPaused = false;
    isGameRunning = true;
    extraLifeMsgTimer = 0;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    livesElement.textContent = lives;
    
    // DNA Mechanics init
    snakeHeadEnds = Math.random() < 0.5 ? "3'" : "5'";
    targetDNAEnds = snakeHeadEnds === "3'" ? "5'" : "3'";
    targetDNASequence = generateDNASequenceForLevel(level);
    updateDNAUI();

    document.getElementById("overlay").classList.remove("show");
    
    placeFood();
    
    if(gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(drawGame, speed);
}

function generateDNASequenceForLevel(lv) {
    const length = lv * 2 + 1; // 第一關3個，第二關5個...
    let seq = [];
    for (let i = 0; i < length; i++) {
        seq.push(BASES[Math.floor(Math.random() * BASES.length)]);
    }
    return seq;
}

function updateDNAUI() {
    const endLabel = targetDNAEnds === "5'" ? "3'" : "5'";
    const displayedSeq = targetDNASequence;
    document.getElementById("dna-sequence").textContent = 
        `${targetDNAEnds} - ${displayedSeq.join(' - ')} - ${endLabel}`;
}

function die() {
    lives--;
    livesElement.textContent = lives;
    if (lives <= 0) {
        gameOver();
    } else {
        // Reset position on death
        snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
        dx = 0;
        dy = 0;
        
        // Reset DNA sequence as well
        snakeHeadEnds = Math.random() < 0.5 ? "3'" : "5'";
        targetDNAEnds = snakeHeadEnds === "3'" ? "5'" : "3'";
        targetDNASequence = generateDNASequenceForLevel(level);
        updateDNAUI();
        placeFood();
    }
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    const overlay = document.getElementById("overlay");
    overlay.innerHTML = `
        <pre class="ascii-title" style="color: #cc0000; text-shadow: 2px 2px 0px #550000;">
   ____    _    __  __ _____     
  / ___|  / \\  |  \\/  | ____|    
 | |  _  / _ \\ | |\\/| |  _|      
 | |_| |/ ___ \\| |  | | |___     
  \\____/_/   \\_\\_|  |_|_____|    
  / _ \\ \\   / / ____|  _ \\      
 | | | \\ \\ / /|  _| | |_) |     
 | |_| |\\ V / | |___|  _ <      
  \\___/  \\_/  |_____|_| \\_\\     
        </pre>
        <div class="instructions" style="color: #ffd700;">
            <p>Level: ${level}</p>
            <p>Punkte: ${score}</p>
        </div>
        <h2 class="blink">PRESS ENTER TO RESTART</h2>
    `;
    overlay.classList.add("show");
}

function togglePause() {
    if (!isGameRunning) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameLoop);
        ctx.fillStyle = "#ffd700";
        ctx.font = "24px 'Courier New', Courier, monospace";
        ctx.textAlign = "center";
        ctx.fillText("--- PAUSED ---", canvas.width / 2, canvas.height / 2);
    } else {
        gameLoop = setInterval(drawGame, speed);
    }
}

document.addEventListener("keydown", handleKeyDown);

function handleKeyDown(event) {
    // 阻止方向鍵和空白鍵/Enter導致的捲動
    if ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
        event.preventDefault();
    }

    if (event.key === 'Enter') {
        initGame();
        return;
    }
    
    if (event.key === 'p' || event.key === 'P') {
        togglePause();
        return;
    }

    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    if (event.keyCode === LEFT_KEY) setDirection(-1, 0);
    if (event.keyCode === UP_KEY) setDirection(0, -1);
    if (event.keyCode === RIGHT_KEY) setDirection(1, 0);
    if (event.keyCode === DOWN_KEY) setDirection(0, 1);
}

function setDirection(newDx, newDy) {
    if (changingDirection || isPaused || !isGameRunning) return;

    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (newDx === -1 && !goingRight) {
        dx = -1;
        dy = 0;
        changingDirection = true;
    }
    if (newDy === -1 && !goingDown) {
        dx = 0;
        dy = -1;
        changingDirection = true;
    }
    if (newDx === 1 && !goingLeft) {
        dx = 1;
        dy = 0;
        changingDirection = true;
    }
    if (newDy === 1 && !goingUp) {
        dx = 0;
        dy = 1;
        changingDirection = true;
    }
}

function drawGame() {
    changingDirection = false;
    
    if (hasGameEnded()) {
        die();
        if (lives <= 0) return;
    }

    clearCanvas();
    drawBorder();
    
    if (extraLifeMsgTimer > 0) {
        ctx.fillStyle = "#ff00ff";
        ctx.font = "bold 20px 'Courier New', Courier, monospace";
        ctx.textAlign = "left";
        ctx.fillText("Extra Life !!!", gridSize, gridSize * 2);
        extraLifeMsgTimer--;
    }

    drawFood();
    moveSnake();
    drawSnake();
    drawOtherPlayers();
    checkPlayerCollisions();
}

function drawBorder() {
    ctx.fillStyle = "#888"; // 亮灰色模擬邊框
    
    // 上下邊界
    for (let i = 0; i < tileCountX; i++) {
        drawBorderBlock(i, 0);
        drawBorderBlock(i, tileCountY - 1);
    }
    
    // 左右邊界 (預留出口給穿牆)
    for (let i = 1; i < tileCountY - 1; i++) {
        // 留一個通道，假設在中間
        if (i !== Math.floor(tileCountY / 2)) {
            drawBorderBlock(0, i);
            drawBorderBlock(tileCountX - 1, i);
        }
    }
}

function drawBorderBlock(x, y) {
    let px = x * gridSize;
    let py = y * gridSize;
    // 畫出類似圖片的網底圖案
    ctx.fillRect(px, py, gridSize, gridSize);
    ctx.fillStyle = "#ccc"; // 白色點綴
    ctx.fillRect(px + 4, py + 4, 4, 4);
    ctx.fillRect(px + 12, py + 12, 4, 4);
    ctx.fillStyle = "#888"; // 恢復基本色
}

function clearCanvas() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    snake.forEach((part, index) => drawSnakePart(part, index));
}

function drawSnakePart(snakePart, index) {
    if (index === 0) {
        // 頭部：紅色方塊加上笑臉
        ctx.fillStyle = "#cc0000"; // 紅色
        ctx.fillRect(snakePart.x * gridSize, snakePart.y * gridSize, gridSize, gridSize);
        
        ctx.fillStyle = "#fff";
        ctx.font = "12px 'Courier New', Courier, monospace";
        ctx.textAlign = "center";
        ctx.fillText(snakeHeadEnds, snakePart.x * gridSize + gridSize/2, snakePart.y * gridSize + gridSize/2 + 4);
    } else {
        // 身體：藍色星形 / 十字形
        ctx.fillStyle = "#4444ff"; // 藍色
        ctx.fillRect(snakePart.x * gridSize, snakePart.y * gridSize, gridSize, gridSize);
        
        ctx.fillStyle = "#fff";
        ctx.font = "12px 'Courier New', Courier, monospace";
        ctx.textAlign = "center";
        const complementBase = COMPLEMENTS[targetDNASequence[snake.length - 1 - index]];
        if(complementBase) {
            ctx.fillText(complementBase, snakePart.x * gridSize + gridSize/2, snakePart.y * gridSize + gridSize/2 + 4);
        }
    }
}

function moveSnake() {
    let nextX = snake[0].x + dx;
    let nextY = snake[0].y + dy;

    // 穿牆處理 (從邊界的通道穿過)
    if (nextX < 0) nextX = tileCountX - 1;
    if (nextX >= tileCountX) nextX = 0;
    if (nextY < 0) nextY = tileCountY - 1;
    if (nextY >= tileCountY) nextY = 0;

    const head = { x: nextX, y: nextY };
    snake.unshift(head);

    let eatenFood = null;
    for (let f of foods) {
        if (head.x === f.x && head.y === f.y) {
            eatenFood = f;
            break;
        }
    }

    if (eatenFood) {
        const requiredTargetBase = targetDNASequence[snake.length - 2]; // length is already +1 after unshift, so new head plus bodies
        const requiredEatenBase = COMPLEMENTS[requiredTargetBase];
        
        if (eatenFood.base === requiredEatenBase) {
            // 吃對了
            score += 15;
            scoreElement.textContent = score;
            
            updateDNAUI();

            // 只要把題目接完就能晉級
            if (snake.length - 1 === targetDNASequence.length) {
                level++;
                levelElement.textContent = level;
                
                // 展示 Extra Life 特效
                if (level % 3 === 0) {
                    lives++;
                    livesElement.textContent = lives;
                    extraLifeMsgTimer = 30; // 顯示 30 幀
                }
                
                if (speed > 50) {
                    clearInterval(gameLoop);
                    speed -= 10;
                    gameLoop = setInterval(drawGame, speed);
                }

                // Reset snake for new level
                snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
                dx = 0; // 可以暫停讓玩家準備
                dy = 0;
                
                // 初始化下一關 DNA
                snakeHeadEnds = Math.random() < 0.5 ? "3'" : "5'";
                targetDNAEnds = snakeHeadEnds === "3'" ? "5'" : "3'";
                targetDNASequence = generateDNASequenceForLevel(level);
                updateDNAUI();
            }
            
            placeFood();
        } else {
            // 吃錯鹼基
            snake.pop();
            die();
        }
    } else {
        snake.pop();
    }
}

function placeFood() {
    let padding = 1; 
    if (level < 3) {
        padding = 2; // 低等級時內縮兩格，避免出現在牆邊和牆角
    }
    
    foods = [];
    const basesToPlace = [...BASES];
    
    // 將 A, T, C, G 打亂或直接依序放置
    for (let base of basesToPlace) {
        let valid = false;
        let newX, newY;
        while (!valid) {
            newX = padding + Math.floor(Math.random() * (tileCountX - 2 * padding));
            newY = padding + Math.floor(Math.random() * (tileCountY - 2 * padding));

            valid = true;

            // 稍微提昇等級後(level 3~5)可以出現在牆邊，但還不能出現在牆角
            if (level >= 3 && level < 6) {
                let isCorner = (newX === 1 || newX === tileCountX - 2) && 
                               (newY === 1 || newY === tileCountY - 2);
                if (isCorner) {
                    valid = false;
                    continue;
                }
            }

            // 檢查與蛇身是否重疊
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === newX && snake[i].y === newY) {
                    valid = false;
                    break;
                }
            }
            // 檢查與其他食物是否重疊
            for (let f of foods) {
                if (f.x === newX && f.y === newY) {
                    valid = false;
                    break;
                }
            }
        }
        foods.push({ x: newX, y: newY, base: base });
    }
    
    if (isMultiplayer && conn) {
        conn.send({ type: 'foodSync', foods: foods });
    }
}

function drawFood() {
    for (let f of foods) {
        // 設定各自的顏色 A, T, C, G
        if (f.base === 'A') ctx.fillStyle = "#ff5555";
        else if (f.base === 'T') ctx.fillStyle = "#55ff55";
        else if (f.base === 'C') ctx.fillStyle = "#5555ff";
        else if (f.base === 'G') ctx.fillStyle = "#ffff55";
        else ctx.fillStyle = "#ff00ff";

        ctx.fillRect(f.x * gridSize + 2, f.y * gridSize + 2, gridSize - 4, gridSize - 4);
        
        ctx.fillStyle = "#000";
        ctx.font = "bold 14px 'Courier New', Courier, monospace";
        ctx.textAlign = "center";
        ctx.fillText(f.base, f.x * gridSize + gridSize/2, f.y * gridSize + gridSize/2 + 5);
    }
}

function hasGameEnded() {
    // 判斷撞到預設邊框死亡 (除了預留的通道外)
    if (snake[0].x <= 0 || snake[0].x >= tileCountX - 1 || snake[0].y <= 0 || snake[0].y >= tileCountY - 1) {
        // 例外處理通道 (左右兩側的通道)
        if ((snake[0].x === 0 || snake[0].x === tileCountX - 1) && snake[0].y === Math.floor(tileCountY / 2)) {
            // 在通道中，不死
        } else {
            return true;
        }
    }

    // 自身碰撞判斷
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    return false;
}

// 首次載入時初始化畫布大小
resizeCanvas();

clearCanvas();
drawSnake();
let myPeer;
let conn = null;
let isMultiplayer = false;
let playerID = "";
let players = {};

function initPeer() {
    myPeer = new Peer();
    
    myPeer.on('open', function(id) {
        playerID = id;
        document.getElementById('my-id').textContent = id;
    });

    myPeer.on('connection', function(connection) {
        setupConnection(connection);
        document.getElementById('conn-status').textContent = 'Connected as Host!';
    });
}

document.getElementById('connect-btn').addEventListener('click', () => {
    const targetId = document.getElementById('target-id').value;
    if (!targetId) return;
    const connection = myPeer.connect(targetId);
    setupConnection(connection);
    document.getElementById('conn-status').textContent = 'Connected as Client!';
});

function setupConnection(connection) {
    conn = connection;
    isMultiplayer = true;
    
    conn.on('data', function(data) {
        if(data.type === 'gameState') {
            players[data.id] = data.snake;
        } else if (data.type === 'youDied') {
            die();
        } else if (data.type === 'foodSync') {
            food = data.food;
        }
    });

    setInterval(() => {
        if (isGameRunning && isMultiplayer) {
            conn.send({ type: 'gameState', id: playerID, snake: snake });
            // Host sends food
            if (myPeer.connections && Object.keys(myPeer.connections).length > 0 && playerID < Object.keys(myPeer.connections)[0]) {
                 // Simple host resolution or just send food if we place it
            }
        }
    }, 100); 
}

initPeer();
function drawOtherPlayers() {
    if (!isMultiplayer) return;
    for (const [id, otherSnake] of Object.entries(players)) {
        if (id === playerID || !otherSnake || otherSnake.length === 0) continue;
        
        // Draw other snake differently (e.g. green or purple)
        otherSnake.forEach((part, index) => {
            if (index === 0) {
                ctx.fillStyle = "#00cc00"; // Green head
                ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
                ctx.fillStyle = "#000"; 
                ctx.fillRect(part.x * gridSize + 4, part.y * gridSize + 4, 2, 2); 
                ctx.fillRect(part.x * gridSize + 14, part.y * gridSize + 4, 2, 2); 
            } else {
                ctx.fillStyle = "#44ff44"; // Green body
                let px = part.x * gridSize;
                let py = part.y * gridSize;
                ctx.fillRect(px + 8, py + 2, 4, 16);
                ctx.fillRect(px + 2, py + 8, 16, 4);
            }
        });
    }
}

function checkPlayerCollisions() {
    if (!isMultiplayer || !snake[0]) return;

    let head = snake[0];

    for (const [otherId, otherSnake] of Object.entries(players)) {
        if (otherId === playerID) continue;

        for (let i = 0; i < otherSnake.length; i++) {
            let part = otherSnake[i];
            if (head.x === part.x && head.y === part.y) {
                if (snake.length > otherSnake.length) {
                    for(let j = 0; j < otherSnake.length; j++) {
                        snake.push({...snake[snake.length - 1]}); 
                    }
                    score += otherSnake.length * 10;
                    scoreElement.textContent = score;
                    if (conn) conn.send({ type: 'youDied' });
                    // Remove them locally until they respawn
                    players[otherId] = [];
                } else {
                    die();
                }
            }
        }
    }
}
