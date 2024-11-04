const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
let maze = [];
let playerPosition = { x: 0, y: 0 };
let moveCount = 0;

// Timer variables
let timerInterval;
let elapsedTime = 0;

// Difficulty settings
const settings = {
    easy: { size: 10, cellSize: 50 },
    medium: { size: 15, cellSize: 33 },
    hard: { size: 20, cellSize: 25 },
    extreme: { size: 25, cellSize: 20 }
};

// Function to start the game and remove overlay
function startGame() {
    document.getElementById('start-overlay').style.display = 'none';
    document.getElementById('difficulty').disabled = false; // Enable difficulty selection
    canvas.style.filter = 'none'; // Remove the blur effect from the canvas
    initializeGame();
}

// Initialize the game based on selected difficulty
function initializeGame() {
    clearInterval(timerInterval); // Stop any existing timer
    elapsedTime = 0;
    updateTimerDisplay();
    
    const difficulty = document.getElementById("difficulty").value;
    const { size, cellSize } = settings[difficulty];
    canvas.width = size * cellSize;
    canvas.height = size * cellSize;
    maze = generateMaze(size);
    playerPosition = { x: 0, y: 0 };
    moveCount = 0;
    document.getElementById("move-count").innerText = moveCount;

    startTimer(); // Start the timer
    renderMaze(size, cellSize);
}

// Remaining game functions...


// Start the timer
function startTimer() {
    timerInterval = setInterval(() => {
        elapsedTime++;
        updateTimerDisplay();
    }, 1000); // Update every second
}

// Update timer display in the format minutes:seconds
function updateTimerDisplay() {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    document.getElementById("timer").innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Stop the timer
function stopTimer() {
    clearInterval(timerInterval);
}

// Depth-First Search Maze Generation with Forced End Cell Connection
function generateMaze(size) {
    const maze = Array(size).fill().map(() => Array(size).fill(1)); // Initialize maze with walls
    const directions = [
        { dx: 0, dy: -1 }, // up
        { dx: 1, dy: 0 },  // right
        { dx: 0, dy: 1 },  // down
        { dx: -1, dy: 0 }  // left
    ];

    function dfs(x, y) {
        maze[y][x] = 0; // Mark the current cell as a path

        // Shuffle directions to ensure different maze generation
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]]; // Swap
        }

        for (const { dx, dy } of directions) {
            const nx = x + dx * 2;
            const ny = y + dy * 2;

            // Check if the new cell is within bounds and has not been visited (still a wall)
            if (nx >= 0 && ny >= 0 && nx < size && ny < size && maze[ny][nx] === 1) {
                // Carve a path between the current cell and new cell
                maze[y + dy][x + dx] = 0; // Carve intermediary cell
                maze[ny][nx] = 0; // Carve target cell
                dfs(nx, ny); // Recursive call to continue DFS
            }
        }
    }

    dfs(0, 0); // Start DFS from the top-left corner

    // Ensure bottom-right is a path by connecting it if isolated
    if (maze[size - 2][size - 1] === 0 || maze[size - 1][size - 2] === 0) {
        maze[size - 1][size - 1] = 0;
    } else {
        maze[size - 1][size - 1] = 0;
        maze[size - 2][size - 1] = 0; // Connect directly to avoid isolation
    }

    return maze;
}

// Render the maze and player on the canvas
function renderMaze(size, cellSize) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    maze.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (x === size - 1 && y === size - 1) {
                ctx.fillStyle = '#007bff'; // Blue for end point
            } else if (cell === 1) {
                ctx.fillStyle = '#333'; // Wall
            } else {
                ctx.fillStyle = '#f8f9fa'; // Path
            }
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        });
    });

    // Draw player
    ctx.fillStyle = '#007bff';
    ctx.fillRect(playerPosition.x * cellSize, playerPosition.y * cellSize, cellSize, cellSize);
}

// Update player position and count moves
function movePlayer(dx, dy) {
    const newX = playerPosition.x + dx;
    const newY = playerPosition.y + dy;
    if (
        newX >= 0 && newY >= 0 && newX < maze.length && newY < maze.length &&
        maze[newY][newX] === 0
    ) {
        playerPosition = { x: newX, y: newY };
        moveCount++;
        document.getElementById("move-count").innerText = moveCount;
        renderMaze(maze.length, settings[document.getElementById("difficulty").value].cellSize);

        // Check if player has reached the end
        if (newX === maze.length - 1 && newY === maze.length - 1) {
            stopTimer(); // Stop the timer
            displayWinModal(); // Show win modal
        }
    }
}

// Display win modal with final stats
function displayWinModal() {
    const finalTime = document.getElementById("timer").innerText;
    document.getElementById("final-moves").innerText = moveCount;
    document.getElementById("final-time").innerText = finalTime;
    $('#winModal').modal('show'); // Show the modal using Bootstrap
}

// Keyboard controls for the player
document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowUp":
            movePlayer(0, -1);
            break;
        case "ArrowDown":
            movePlayer(0, 1);
            break;
        case "ArrowLeft":
            movePlayer(-1, 0);
            break;
        case "ArrowRight":
            movePlayer(1, 0);
            break;
    }
});


function playAgain() {
    $('#winModal').modal('hide'); // Hide the modal
    initializeGame(); // Restart the game
}


// Initialize the game on load
initializeGame();
