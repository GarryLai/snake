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
