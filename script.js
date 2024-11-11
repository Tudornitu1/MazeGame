const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
let maze = [];
let playerPosition = { x: 0, y: 0 };
let moveCount = 0;
const CANVAS_SIZE = 630;
// Timer variables
let timerInterval;
let elapsedTime = 0;

// Difficulty settings
const settings = {
    easy: { size: 10, cellSize: 60, moveThresholds: [10, 15], timeThresholds: [30, 60] },
    medium: { size: 15, cellSize: 45, moveThresholds: [15, 20], timeThresholds: [90, 180] },
    hard: { size: 20, cellSize: 35, moveThresholds: [20, 25], timeThresholds: [120, 240] },
    extreme: { size: 25, cellSize: 30, moveThresholds: [25, 30], timeThresholds: [180, 360] }
};

// Function to start the game and remove overlay
function startGame() {
    document.getElementById('start-overlay').style.display = 'none';
    document.getElementById('difficulty').disabled = false; // Enable difficulty selection
    canvas.style.filter = 'none'; // Remove the blur effect from the canvas
    initializeGame();
}

// Initialize the game based on selected difficulty
// Check if there’s a path from start to end in the maze
function isPathExists(maze, size) {
    const directions = [
        { dx: 0, dy: -1 }, // up
        { dx: 1, dy: 0 },  // right
        { dx: 0, dy: 1 },  // down
        { dx: -1, dy: 0 }  // left
    ];

    const queue = [{ x: 0, y: 0 }];
    const visited = Array(size).fill().map(() => Array(size).fill(false));
    visited[0][0] = true;

    while (queue.length > 0) {
        const { x, y } = queue.shift();

        // If we reached the end point, there’s a path
        if (x === size - 1 && y === size - 1) return true;

        // Explore neighbors
        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (
                nx >= 0 && ny >= 0 && nx < size && ny < size && // Stay within bounds
                !visited[ny][nx] && maze[ny][nx] === 0          // Not visited and path cell
            ) {
                visited[ny][nx] = true;
                queue.push({ x: nx, y: ny });
            }
        }
    }

    // No path found
    return false;
}

// Initialize the game based on selected difficulty
function initializeGame() {
    clearInterval(timerInterval); // Stop any existing timer
    elapsedTime = 0;
    updateTimerDisplay();

    const difficulty = document.getElementById("difficulty").value;
    const { size } = settings[difficulty]; // Use only 'size' now, not 'cellSize'
    
    // Set canvas dimensions to a fixed size
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Dynamically calculate cell size based on maze size
    const cellSize = CANVAS_SIZE / size;

    do {
        maze = generateMaze(size); // Generate until a valid path exists
    } while (!isPathExists(maze, size));

    playerPosition = { x: 0, y: 0 };
    moveCount = 0;
    document.getElementById("move-count").innerText = moveCount;

    startTimer(); // Start the timer
    renderMaze(size, cellSize); 

    // Center the canvas after rendering
    const mazeContainer = document.getElementById('maze-container');
    mazeContainer.style.width = CANVAS_SIZE + 'px';
}



function startTimer() {
    elapsedTime = 0; // Reset elapsed time at the start
    timerInterval = setInterval(() => {
        elapsedTime++;
        updateTimerDisplay(); // Update the display every second
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
let gameOver = false; // Flag to track if the game has ended

function movePlayer(dx, dy) {
    // Prevent movement if the game is over
    if (gameOver) return;
    
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
            gameOver = true; // Set the game over flag to true
        }
    }
}


// Display win modal with final stats
function displayWinModal() {
    const finalTime = document.getElementById("timer").innerText;
    document.getElementById("final-moves").innerText = moveCount;
    document.getElementById("final-time").innerText = finalTime;

    // Calculate stars
    const totalStars = calculateStars(moveCount, elapsedTime);
    displayStars(totalStars); // Call function to display stars

    $('#winModal').modal('show'); // Show the modal using Bootstrap
}

function calculateStars(moves, elapsedTime, difficulty) {
    const { moveThresholds, timeThresholds } = settings[difficulty]; // Get thresholds for the current difficulty

    let moveStars = 0;
    let timeStars = 0;

    // Calculate stars based on moves
    if (moves <= moveThresholds[0]) {
        moveStars = 3; // 3 stars for less than or equal to the first threshold
    } else if (moves > moveThresholds[0] && moves <= moveThresholds[1]) {
        moveStars = 2; // 2 stars for between the two thresholds
    } else {
        moveStars = 1; // 1 star for more than the second threshold
    }

    // Calculate stars based on time
    if (elapsedTime <= timeThresholds[0]) {
        timeStars = 3; // 3 stars for less than or equal to the first threshold
    } else if (elapsedTime > timeThresholds[0] && elapsedTime <= timeThresholds[1]) {
        timeStars = 2; // 2 stars for between the two thresholds
    } else {
        timeStars = 1; // 1 star for more than the second threshold
    }

    return Math.max(moveStars, timeStars); // Return the higher of the two star counts
}



// Update displayWinModal function
function displayWinModal() {
    const finalTime = elapsedTime; // Use elapsed time directly in seconds
    const finalMoves = moveCount; // Get the move count
    const difficulty = document.getElementById("difficulty").value; // Get the current difficulty

    document.getElementById("final-moves").innerText = finalMoves;
    
    // Format elapsed time to display in seconds
    document.getElementById("final-time").innerText = `${finalTime}`; // Show time in seconds

    // Calculate stars based on the current difficulty
    const totalStars = calculateStars(finalMoves, finalTime, difficulty);
    displayStars(totalStars); // Call function to display stars

    $('#winModal').modal('show'); // Show the modal using Bootstrap
}




// Function to display stars in the modal
function displayStars(starCount) {
    const starContainer = document.getElementById("star-rating");
    starContainer.innerHTML = ''; // Clear previous stars

    // Add star images or characters based on starCount
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('span');
        star.innerHTML = '★'; // You can replace this with an image of a star if needed
        star.style.color = 'gold'; // Style the stars as needed
        starContainer.appendChild(star);
    }
}


// Function to display stars in the modal
function displayStars(starCount) {
    const starContainer = document.getElementById("star-rating");
    starContainer.innerHTML = ''; // Clear previous stars

    // Add star images or characters based on starCount
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('span');
        star.innerHTML = '★'; // You can replace this with an image of a star if needed
        star.style.color = 'gold'; // Style the stars as needed
        starContainer.appendChild(star);
    }
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