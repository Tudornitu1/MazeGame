const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
let maze = [];
let playerPosition = { x: 0, y: 0 };
let moveCount = 0;
const moveSound = document.getElementById("move-sound");
const winSound = document.getElementById("win-sound");
const CANVAS_SIZE = 630;
let cellsize;

let timerInterval;
let elapsedTime = 0;

const music = document.getElementById("music");
let musicVolume = 1;
let soundVolume = 1;
music.loop = true;

function playBackgroundMusic() {
    if (music.paused) {
        music.play(); 
    }
}



playBackgroundMusic();

document.addEventListener('DOMContentLoaded', function () {
    document.body.setAttribute('data-theme', 'light');
    document.querySelector("#dark-mode-toggle i").className = "fas fa-moon"; 
    document.querySelector('.game-container').setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : 'light');
    document.querySelector('#mazeCanvas').setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : 'light');
    document.querySelector('#winModal').setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : 'light');
    playBackgroundMusic();
});


document.getElementById("music-volume").addEventListener("input", function () {
    musicVolume = this.value; 
    music.volume = musicVolume; 
});

document.getElementById("sound-volume").addEventListener("input", function () {
    soundVolume = this.value; 
    moveSound.volume = soundVolume; 
});

document.getElementById("settings-button").addEventListener("click", function () {
    var myModal = new bootstrap.Modal(document.getElementById('settingsModal'), {
        keyboard: true 
    });
    myModal.show(); 
});

const character1 = new Image();
character1.src = 'Dude_Monster.png'; 
const character2 = new Image();
character2.src = 'Pink_Monster.png';
const character3 = new Image();
character3.src = 'Owlet_Monster.png';

let selectedCharacter = null; 

function showCharacterSelectionScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(character1, 60, 200, character1.width * 5, character1.height * 5);
    ctx.drawImage(character2, 240, 200, character2.width * 5, character2.height * 5);
    ctx.drawImage(character3, 420, 200, character3.width * 5, character3.height * 5);

    ctx.font = '30px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText('Select your character', canvas.width / 2 - 150, 100);
}

character1.onload = function() {
    character2.onload = function() {
        character3.onload = function() {
            showCharacterSelectionScreen(); 
        };
    };
};
let gamestatus="begin";
canvas.addEventListener('click', (event) => {
    if (gamestatus === "begin") {
        const rect = canvas.getBoundingClientRect();

        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        if (clickX >= 60 && clickX <= 60 + character1.width * 5 &&
            clickY >= 200 && clickY <= 200 + character1.height * 5) {
            selectedCharacter = 'character1';
            gamestatus = "started";
        } 
        else if (clickX >= 240 && clickX <= 240 + character2.width * 5 &&
                 clickY >= 200 && clickY <= 200 + character2.height * 5) {
            selectedCharacter = 'character2';
            gamestatus = "started";
        } 
        else if (clickX >= 420 && clickX <= 420 + character3.width * 5 &&
                 clickY >= 200 && clickY <= 200 + character3.height * 5) {
            selectedCharacter = 'character3';
            gamestatus = "started";
        }

        if (selectedCharacter) {
            console.log('Character selected:', selectedCharacter);
            initializeGame(selectedCharacter); 
        }
    }
});


let playerSprite = new Image();

function startGameC(character) {
    if (character === 'character1') {
        playerSprite.src = 'Dude_Monster.png';
    } else if (character === 'character2') {
        playerSprite.src = 'Pink_Monster.png';
    } else if (character === 'character3') {
        playerSprite.src = 'Owlet_Monster.png';
    }

    playerSprite.onload = function () {
        playerPosition = { x: 0, y: 0 };
        moveCount = 0;
        gameLoop();
    };
}

document.addEventListener('keydown', (event) => {
    if (!gameOver) {
        switch (event.key) {
            case 'ArrowUp':
                movePlayer('up');
                playMoveSound();
                break;
            case 'ArrowDown':
                movePlayer('down');
                playMoveSound();
                break;
            case 'ArrowLeft':
                movePlayer('left');
                playMoveSound();
                break;
            case 'ArrowRight':
                movePlayer('right');
                playMoveSound();
                break;
        }
    }
});


function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    renderMaze(maze.length, cellSize); 
    ctx.drawImage(playerSprite, playerPosition.x * cellSize, playerPosition.y * cellSize, cellSize, cellSize);

    requestAnimationFrame(gameLoop);
}


const settings = {
    easy: { size: 10, cellSize: 60, moveThresholds: [35, 45], timeThresholds: [30, 60] },
    medium: { size: 15, cellSize: 45, moveThresholds: [75, 95], timeThresholds: [40, 60] },
    hard: { size: 20, cellSize: 35, moveThresholds: [85, 105], timeThresholds: [60, 90] },
    extreme: { size: 25, cellSize: 30, moveThresholds: [105, 125], timeThresholds: [90, 120] }
};

function startGame() {
    document.getElementById('start-overlay').style.display = 'none';
    document.getElementById('difficulty').disabled = false; 
    canvas.style.filter = 'none'; 
    initializeGame();
    
}

function isPathExists(maze, size) {
    const directions = [
        { dx: 0, dy: -1 }, 
        { dx: 1, dy: 0 },  
        { dx: 0, dy: 1 },  
        { dx: -1, dy: 0 }  
    ];

    const queue = [{ x: 0, y: 0 }];
    const visited = Array(size).fill().map(() => Array(size).fill(false));
    visited[0][0] = true;

    while (queue.length > 0) {
        const { x, y } = queue.shift();

        if (x === size - 1 && y === size - 1) return true;

        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (
                nx >= 0 && ny >= 0 && nx < size && ny < size && 
                !visited[ny][nx] && maze[ny][nx] === 0          
            ) {
                visited[ny][nx] = true;
                queue.push({ x: nx, y: ny });
            }
        }
    }

    return false;
}
function initializeGame(selectedCharacter) {
    clearInterval(timerInterval);
    elapsedTime = 0;
    updateTimerDisplay();
    const difficulty = document.getElementById("difficulty").value;
    const { size, cellSize: cellSizeFromDifficulty } = settings[difficulty];

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    cellSize = CANVAS_SIZE / size;

    do {
        maze = generateMaze(size);
    } while (!isPathExists(maze, size));

    playerPosition = { x: 0, y: 0 };
    moveCount = 0;
    document.getElementById("move-count").innerText = moveCount;
    gameOver = false;

    if (selectedCharacter === 'character1') {
        playerSprite.src = 'Dude_Monster.png';
    } else if (selectedCharacter === 'character2') {
        playerSprite.src = 'Pink_Monster.png';
    } else if (selectedCharacter === 'character3') {
        playerSprite.src = 'Owlet_Monster.png';
    }

    playerSprite.onload = function () {
        startTimer();
        renderMaze(size, cellSize);
        renderPlayer();
    };

    playerSprite.onerror = function () {
        console.error('Error loading character sprite:', playerSprite.src);
    };
    renderMaze(size, cellSize); 
    renderPlayer(); 
}

function renderPlayer() {
    ctx.drawImage(
        playerSprite,
        playerPosition.x * cellSize,
        playerPosition.y * cellSize,
        cellSize,
        cellSize
    );
}


function renderMaze(size, cellSize) {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    maze.forEach((row, y) => {
        row.forEach((cell, x) => {
            ctx.fillStyle = (x === size - 1 && y === size - 1) ? '#00ff00' : (cell === 1 ? '#333' : '#f8f9fa');
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        });
    });
}

function startTimer() {
    elapsedTime = 0; 
    timerInterval = setInterval(() => {
        elapsedTime++;
        updateTimerDisplay(); 
    }, 1000); 
}


function updateTimerDisplay() {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    document.getElementById("timer").innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function stopTimer() {
    clearInterval(timerInterval);
}

function generateMaze(size) {
    const maze = Array(size).fill().map(() => Array(size).fill(1)); 
    const directions = [
        { dx: 0, dy: -1 }, 
        { dx: 1, dy: 0 },  
        { dx: 0, dy: 1 },  
        { dx: -1, dy: 0 }  
    ];

    function dfs(x, y) {
        maze[y][x] = 0;

        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        for (const { dx, dy } of directions) {
            const nx = x + dx * 2;
            const ny = y + dy * 2;

            if (nx >= 0 && ny >= 0 && nx < size && ny < size && maze[ny][nx] === 1) {
                maze[y + dy][x + dx] = 0; 
                maze[ny][nx] = 0;
                dfs(nx, ny); 
            }
        }
    }

    dfs(0, 0); 

    if (maze[size - 2][size - 1] === 0 || maze[size - 1][size - 2] === 0) {
        maze[size - 1][size - 1] = 0;
    } else {
        maze[size - 1][size - 1] = 0;
        maze[size - 2][size - 1] = 0; 
    }

    return maze;
}

function renderMaze(size, cellSize) {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    maze.forEach((row, y) => {
        row.forEach((cell, x) => {
            ctx.fillStyle = (x === size - 1 && y === size - 1) ? '#00ff00' : (cell === 1 ? '#333' : '#f8f9fa');
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        });
    });
}





let gameOver = false; 


function movePlayer(direction) {
    const { x, y } = playerPosition;
    let newX = x, newY = y;

    if (direction === 'up') newY--;
    else if (direction === 'down') newY++;
    else if (direction === 'left') newX--;
    else if (direction === 'right') newX++;

    if (newX >= 0 && newX < maze.length && newY >= 0 && newY < maze.length && maze[newY][newX] === 0) {
        playerPosition = { x: newX, y: newY };
        moveCount++;
        document.getElementById("move-count").innerText = moveCount;

        if (newX === maze.length - 1 && newY === maze.length - 1) {
            gameOver = true;
            console.log('Congratulations! You reached the goal!');
            displayWinModal();
            winSound.play();
        }

        renderMaze(maze.length, cellSize);
        renderPlayer();
        document.getElementById("difficulty").disabled = true;

    }
}

function calculateStars(moves, elapsedTime, difficulty) {
    const { moveThresholds, timeThresholds } = settings[difficulty];

    let moveStars = 0;
    let timeStars = 0;

    if (moves <= moveThresholds[0]) {
        moveStars = 3;
    } else if (moves > moveThresholds[0] && moves <= moveThresholds[1]) {
        moveStars = 2;
    } else {
        moveStars = 1;
    }

    if (elapsedTime <= timeThresholds[0]) {
        timeStars = 3;
    } else if (elapsedTime > timeThresholds[0] && elapsedTime <= timeThresholds[1]) {
        timeStars = 2;
    } else {
        timeStars = 1;
    }

    return Math.min(moveStars, timeStars); 
}

function displayWinModal() {
    const finalMoves = moveCount; 
    const difficulty = document.getElementById("difficulty").value; 

    document.getElementById("final-moves").innerText = finalMoves;

    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    document.getElementById("final-time").innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const totalStars = calculateStars(finalMoves, elapsedTime, difficulty);
    console.log("Total Stars:", totalStars);  
    displayStars(totalStars); 
    $('#winModal').modal('show'); 
}

function displayStars(starCount) {
    const starContainer = document.getElementById("star-rating");
    starContainer.innerHTML = ''; 
    setTimeout(() => {
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('span');
            star.innerHTML = '★';
            star.style.color = 'gold';
            star.style.opacity = 0; 
            starContainer.appendChild(star);

            setTimeout(() => {
                star.animate([
                    { opacity: 0 },
                    { opacity: 1 }
                ], {
                    duration: 500, 
                    fill: 'forwards' 
                });
            }, i * 300); 
        }
    }, 300); 
}

function playMoveSound() {
    moveSound.play();
}

function toggleDarkMode() {
    const body = document.body;
    const isDarkMode = body.getAttribute('data-theme') === 'dark';
    
    if (isDarkMode) {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        document.querySelector("#dark-mode-toggle i").className = "fas fa-moon"; 
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        document.querySelector("#dark-mode-toggle i").className = "fas fa-sun"; 
    }

    document.querySelector('.game-container').setAttribute('data-theme', isDarkMode ? '' : 'dark');
    document.querySelector('#mazeCanvas').setAttribute('data-theme', isDarkMode ? '' : 'dark');
    document.querySelector('#winModal').setAttribute('data-theme', isDarkMode ? '' : 'dark');
}

const restartBnt = document.getElementById('restartBtn');
restartBnt.addEventListener('click', () => {
    document.getElementById("difficulty").disabled = false;
});

function playAgain() {
    $('#winModal').modal('hide');
    document.getElementById("difficulty").disabled = false;

    moveCount = 0;
    document.getElementById("move-count").innerText = moveCount;
    startTimer();
    initializeGame(); 

    playerPosition = { x: 0, y: 0 }; 
    gameOver = false; 
}




initializeGame();