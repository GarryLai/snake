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
