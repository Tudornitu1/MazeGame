const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
let maze = [];
let playerPosition = { x: 0, y: 0 };
let moveCount = 0;
const moveSound = document.getElementById("move-sound");
const winSound = document.getElementById("win-sound");
const music = document.getElementById("music");
const CANVAS_SIZE = 630;
// Timer variables
let timerInterval;
let elapsedTime = 0;


// Get references to the audio elements
music.loop = true; // Set music to loop

// Set initial volumes (default is 1)
let musicVolume = 1;
let soundVolume = 1;

// Update the music volume when the user changes the slider
document.getElementById("music-volume").addEventListener("input", function() {
    musicVolume = this.value;
    music.volume = musicVolume; // Update music volume
});

// Update the sound effects volume when the user changes the slider
document.getElementById("sound-volume").addEventListener("input", function() {
    soundVolume = this.value;
    moveSound.volume = soundVolume; // Update sound effects volume
});

// Function to play the move sound
function playMoveSound() {
    moveSound.play();
}

// Function to play the background music
function playBackgroundMusic() {
    if (music.paused) {
        music.play(); // Start playing music
    }
}

// Start the music when the game starts
playBackgroundMusic();

// Add a listener to the settings button to show the modal
document.getElementById("settings-button").addEventListener("click", function() {
    $('#settingsModal').modal('show'); // Show the settings modal using Bootstrap
});

// Optionally, you can stop or pause music when the game ends or based on user input
function stopBackgroundMusic() {
    music.pause();
}

// Function to reset sound volumes to defaults (optional)
function resetVolumes() {
    music.volume = 1;
    moveSound.volume = 1;
    document.getElementById("music-volume").value = 1;
    document.getElementById("sound-volume").value = 1;
}

// Difficulty settings
const settings = {
    easy: { size: 10, cellSize: 60, moveThresholds: [35, 45], timeThresholds: [30, 60] },
    medium: { size: 15, cellSize: 45, moveThresholds: [75, 95], timeThresholds: [40, 60] },
    hard: { size: 20, cellSize: 35, moveThresholds: [85, 105], timeThresholds: [60, 90] },
    extreme: { size: 25, cellSize: 30, moveThresholds: [105, 125], timeThresholds: [90, 120] }
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
    const { size } = settings[difficulty];
    
    // Set canvas dimensions to a fixed size
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Calculate cell size once based on the canvas size and maze size
    const cellSize = CANVAS_SIZE / size;

    // Ensure valid maze generation
    do {
        maze = generateMaze(size);
    } while (!isPathExists(maze, size));

    playerPosition = { x: 0, y: 0 };
    moveCount = 0;
    document.getElementById("move-count").innerText = moveCount;

    startTimer(); // Start the timer
    renderMaze(size, cellSize); // Render maze with the pre-calculated cellSize
    gameOver = false;
    this.cellSize = cellSize;
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
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    maze.forEach((row, y) => {
        row.forEach((cell, x) => {
            ctx.fillStyle = (x === size - 1 && y === size - 1) ? '#00ff00' : (cell === 1 ? '#333' : '#f8f9fa');
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        });
    });

    // Draw player at current position
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
        renderMaze(maze.length, this.cellSize);
        // Check if player has reached the end
        if (newX === maze.length - 1 && newY === maze.length - 1) {
            stopTimer(); // Stop the timer
            displayWinModal(); // Show win modal
            winSound.play();
            gameOver = true; // Set the game over flag to true
        }
    }
    playMoveSound();
}




function calculateStars(moves, elapsedTime, difficulty) {
    const { moveThresholds, timeThresholds } = settings[difficulty];

    let moveStars = 0;
    let timeStars = 0;

    // Calculate stars based on moves
    if (moves <= moveThresholds[0]) {
        moveStars = 3;
    } else if (moves > moveThresholds[0] && moves <= moveThresholds[1]) {
        moveStars = 2;
    } else {
        moveStars = 1;
    }

    // Calculate stars based on time
    if (elapsedTime <= timeThresholds[0]) {
        timeStars = 3;
    } else if (elapsedTime > timeThresholds[0] && elapsedTime <= timeThresholds[1]) {
        timeStars = 2;
    } else {
        timeStars = 1;
    }

    // Return the lower of the two star counts
    return Math.min(moveStars, timeStars); 
}



function displayWinModal() {
    const finalMoves = moveCount; // Get the move count
    const difficulty = document.getElementById("difficulty").value; // Get the current difficulty

    document.getElementById("final-moves").innerText = finalMoves;

    // Format elapsed time to display in minutes and seconds
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    document.getElementById("final-time").innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Calculate stars based on the current difficulty
    const totalStars = calculateStars(finalMoves, elapsedTime, difficulty);
    console.log("Total Stars:", totalStars);  // Log the star count for debugging
    displayStars(totalStars); // Call function to display stars

    $('#winModal').modal('show'); // Show the modal using Bootstrap
}







// Function to display stars in the modal
function displayStars(starCount) {
    const starContainer = document.getElementById("star-rating");
    starContainer.innerHTML = ''; // Clear previous stars

    setTimeout(() => {
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('span');
            star.innerHTML = '★';
            star.style.color = 'gold';
            star.style.opacity = 0; // Initially hide the star
            starContainer.appendChild(star);

            // Animate the star after a short delay
            setTimeout(() => {
                star.animate([
                    { opacity: 0 },
                    { opacity: 1 }
                ], {
                    duration: 500, // Animation duration in milliseconds
                    fill: 'forwards' // Keep the final state after animation
                });
            }, i * 300); // Delay each star's animation
        }
    }, 300); // Add a slight delay before adding stars (300ms)
}

function playMoveSound() {
    moveSound.play();
}

function toggleDarkMode() {
    const body = document.body;
    const isDarkMode = body.getAttribute('data-theme') === 'dark';
    
    // Toggle dark mode
    if (isDarkMode) {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        document.querySelector("#dark-mode-toggle i").className = "fas fa-moon"; // Moon icon for light mode
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        document.querySelector("#dark-mode-toggle i").className = "fas fa-sun"; // Sun icon for dark mode
    }

    function openSettings() {
    alert("Settings menu coming soon!");
}


    // Apply data-theme to other key elements
    document.querySelector('.game-container').setAttribute('data-theme', isDarkMode ? '' : 'dark');
    document.querySelector('#mazeCanvas').setAttribute('data-theme', isDarkMode ? '' : 'dark');
    document.querySelector('#winModal').setAttribute('data-theme', isDarkMode ? '' : 'dark');
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
    gameOver=false;
}




// Initialize the game on load
initializeGame();