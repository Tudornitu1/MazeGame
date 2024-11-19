const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
let maze = [];
let playerPosition = { x: 0, y: 0 };
let moveCount = 0;
const moveSound = document.getElementById("move-sound");
const winSound = document.getElementById("win-sound");
const music = document.getElementById("music");

const CANVAS_SIZE = 630;
let cellsize;
// Timer variables
let timerInterval;
let elapsedTime = 0;



let musicVolume = 1;
let soundVolume = 1;

music.loop = true;

// Function to play the background music
function playBackgroundMusic() {
    if (music.paused) {
        music.play(); // Start playing music if it's paused
    }
}

// Start the music when the game starts
playBackgroundMusic();





document.getElementById("music-volume").addEventListener("input", function () {
    musicVolume = this.value; // Get the value from the slider
    music.volume = musicVolume; // Set the music volume
});

// Event listener to update sound effects volume
document.getElementById("sound-volume").addEventListener("input", function () {
    soundVolume = this.value; // Get the value from the slider
    moveSound.volume = soundVolume; // Set the sound effects volume
});

// Event listener to show the settings modal
// Show the modal when the settings button is clicked
document.getElementById("settings-button").addEventListener("click", function () {
    var myModal = new bootstrap.Modal(document.getElementById('settingsModal'), {
        keyboard: true // Allow closing with the keyboard
    });
    myModal.show(); // Show the modal
});

const character1 = new Image();
character1.src = 'Dude_Monster.png'; 
const character2 = new Image();
character2.src = 'Pink_Monster.png';
const character3 = new Image();
character3.src = 'Owlet_Monster.png';

let selectedCharacter = null; 

// Show character selection screen
function showCharacterSelectionScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ensure images have loaded, then draw them
    ctx.drawImage(character1, 60, 200, character1.width * 5, character1.height * 5);
    ctx.drawImage(character2, 240, 200, character2.width * 5, character2.height * 5);
    ctx.drawImage(character3, 420, 200, character3.width * 5, character3.height * 5);

    ctx.font = '30px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText('Select your character', canvas.width / 2 - 150, 100);
}

// Wait for all images to load before showing the selection screen
character1.onload = function() {
    character2.onload = function() {
        character3.onload = function() {
            showCharacterSelectionScreen(); // Show screen once all images are loaded
        };
    };
};
let gamestatus="begin";
// Handle character selection via click
canvas.addEventListener('click', (event) => {
    if (gamestatus === "begin") {
        // Get canvas bounds relative to the viewport
        const rect = canvas.getBoundingClientRect();

        // Adjust the click coordinates relative to the canvas
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // Check if the click falls within character1's area
        if (clickX >= 60 && clickX <= 60 + character1.width * 5 &&
            clickY >= 200 && clickY <= 200 + character1.height * 5) {
            selectedCharacter = 'character1';
            gamestatus = "started";
        } 
        // Check if the click falls within character2's area
        else if (clickX >= 240 && clickX <= 240 + character2.width * 5 &&
                 clickY >= 200 && clickY <= 200 + character2.height * 5) {
            selectedCharacter = 'character2';
            gamestatus = "started";
        } 
        // Check if the click falls within character3's area
        else if (clickX >= 420 && clickX <= 420 + character3.width * 5 &&
                 clickY >= 200 && clickY <= 200 + character3.height * 5) {
            selectedCharacter = 'character3';
            gamestatus = "started";
        }

        if (selectedCharacter) {
            console.log('Character selected:', selectedCharacter);
            initializeGame(selectedCharacter); // Pass character to initializeGame
        }
    }
});




// Character sprites
let playerSprite = new Image();

// Start the game with the selected character
function startGameC(character) {
    if (character === 'character1') {
        playerSprite.src = 'Dude_Monster.png';
    } else if (character === 'character2') {
        playerSprite.src = 'Pink_Monster.png';
    } else if (character === 'character3') {
        playerSprite.src = 'Owlet_Monster.png';
    }

    // Wait for the sprite to load before starting the game
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


// Game loop to draw the maze and player sprite
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    renderMaze(maze.length, cellSize); // Ensure renderMaze() works properly with your maze data
    ctx.drawImage(playerSprite, playerPosition.x * cellSize, playerPosition.y * cellSize, cellSize, cellSize);

    requestAnimationFrame(gameLoop);
}

// Make sure you define `renderMaze`, `playerPosition`, `moveCount`, and `maze` elsewhere in your code


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
function initializeGame(selectedCharacter) {
    // Reset timer and move counter
    clearInterval(timerInterval);
    elapsedTime = 0;
    updateTimerDisplay();
    const difficulty = document.getElementById("difficulty").value;
    const { size, cellSize: cellSizeFromDifficulty } = settings[difficulty];

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    cellSize = CANVAS_SIZE / size;

    // Generate a solvable maze
    do {
        maze = generateMaze(size);
    } while (!isPathExists(maze, size));

    // Initialize game state
    playerPosition = { x: 0, y: 0 };
    moveCount = 0;
    document.getElementById("move-count").innerText = moveCount;
    gameOver = false;

    // Load the selected character sprite
    if (selectedCharacter === 'character1') {
        playerSprite.src = 'Dude_Monster.png';
    } else if (selectedCharacter === 'character2') {
        playerSprite.src = 'Pink_Monster.png';
    } else if (selectedCharacter === 'character3') {
        playerSprite.src = 'Owlet_Monster.png';
    }

    playerSprite.onload = function () {
        // Start timer and render initial game state
        startTimer();
        renderMaze(size, cellSize);
        renderPlayer();
    };

    playerSprite.onerror = function () {
        console.error('Error loading character sprite:', playerSprite.src);
    };
    renderMaze(size, cellSize); // Draw the maze
    renderPlayer(); 
}

// Function to render the player on the maze
function renderPlayer() {
    ctx.drawImage(
        playerSprite,
        playerPosition.x * cellSize,
        playerPosition.y * cellSize,
        cellSize,
        cellSize
    );
}


// Function to render the maze
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
}





// Update player position and count moves
let gameOver = false; // Flag to track if the game has ended


function movePlayer(direction) {
    const { x, y } = playerPosition;
    let newX = x, newY = y;

    if (direction === 'up') newY--;
    else if (direction === 'down') newY++;
    else if (direction === 'left') newX--;
    else if (direction === 'right') newX++;

    // Check if the new position is within bounds and not a wall
    if (newX >= 0 && newX < maze.length && newY >= 0 && newY < maze.length && maze[newY][newX] === 0) {
        playerPosition = { x: newX, y: newY };
        moveCount++;
        document.getElementById("move-count").innerText = moveCount;

        // Check for game over condition
        if (newX === maze.length - 1 && newY === maze.length - 1) {
            gameOver = true;
            console.log('Congratulations! You reached the goal!');
            displayWinModal();
            winSound.play();
        }

        // Re-render the maze and player
        renderMaze(maze.length, cellSize);
        renderPlayer();
        document.getElementById("difficulty").disabled = true;

    }
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

const restartBnt = document.getElementById('restartBtn');
restartBnt.addEventListener('click', () => {
    document.getElementById("difficulty").disabled = false;
});

function playAgain() {
    $('#winModal').modal('hide');
    document.getElementById("difficulty").disabled = false;

    moveCount = 0;
    document.getElementById("move-count").innerText = moveCount;
    elapsedTime=0;
    initializeGame(); // Regenerate the maze and reset the game state

    playerPosition = { x: 0, y: 0 }; // Reset the player position AFTER initializing the maze
    gameOver = false; // Ensure the game can continue
}




// Initialize the game on load
initializeGame();