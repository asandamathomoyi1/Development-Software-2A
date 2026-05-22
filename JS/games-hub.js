/**
 * Mental Wellness Games Hub - Main Logic
 * Handles game initialization, play, scoring, and Firebase integration
 */

import {
  games,
  gameCategories,
  badges,
  trivia,
  motivationalMessages,
  gameMoodRecommendations,
  coloringPatterns,
  pointsPerGame,
  rewards,
  moodLabels,
} from './games-data.js';

const BACKEND_URL = (() => {
  const origin = window.location.origin;
  if (origin.includes(':3001')) return origin;
  if (
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1')
  ) {
    return 'http://localhost:3001';
  }
  return origin;
})();

let gameState = {
  currentGame: null,
  gameProgress: 0,
  score: 0,
  currentUser: null,
  userStats: {
    gamesPlayed: 0,
    totalPoints: 0,
    badges: [],
  },
};

// Memory game state
let memoryState = {
  flippedCards: [],
  matchedPairs: 0,
  lockBoard: false,
  moves: 0,
  cards: [],
};

// Focus game state
let focusState = {
  patternSequence: [],
  userSequence: [],
  round: 0,
  isPlaying: false,
  timeoutId: null,
};

// Puzzle game state
let puzzleState = {
  tiles: [],
  emptyIndex: 15,
  moves: 0,
  canvas: null,
  ctx: null,
  img: null,
};

// Trivia game state
let triviaState = {
  currentQuestionIndex: 0,
  score: 0,
  questions: [],
};

/**
 * Initialize the games hub
 */
export function initGamesHub(currentUser) {
  gameState.currentUser = currentUser;
  loadUserGameStats();
}

/**
 * Get recommended games based on user's mood
 */
export function getRecommendedGames(mood) {
  const recommendation = gameMoodRecommendations[mood];
  if (!recommendation) return games.slice(0, 5);

  const recommendedIds = recommendation.recommended;
  return games.filter((g) => recommendedIds.includes(g.id));
}

/**
 * Render the games hub selection screen
 */
export function renderGamesHub() {
  const html = `
    <div class="games-hub-container">
      <div class="games-hub-header">
        <h1 class="games-hub-title">🎮 Mental Wellness Games Hub</h1>
        <p class="games-hub-subtitle">Choose a game to relax and boost your mental wellness!</p>
      </div>

      <div class="games-hub-stats">
        <div class="stat-box">
          <div class="stat-label">Games Played</div>
          <div class="stat-value">${gameState.userStats.gamesPlayed}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total Points</div>
          <div class="stat-value">${gameState.userStats.totalPoints}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Badges Earned</div>
          <div class="stat-value">${gameState.userStats.badges.length}</div>
        </div>
      </div>

      <div class="games-hub-mood-check">
        <h2 class="section-title">How are you feeling today?</h2>
        <div class="mood-selector">
          ${[1, 2, 3, 4, 5]
            .map(
              (mood) => `
            <button class="mood-btn" onclick="window.selectGameMood(${mood})" data-mood="${mood}">
              <span class="mood-emoji">${gameMoodRecommendations[mood]?.emoji || ''}</span>
              <span class="mood-label">${moodLabels[mood]}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="games-hub-content" id="gamesContent">
        <h2 class="section-title">Choose a Game</h2>
        <div class="games-grid">
          ${games
            .map(
              (game) => `
            <div class="game-card" onclick="window.startGame('${game.id}')">
              <div class="game-card-icon">${game.icon}</div>
              <div class="game-card-name">${game.name}</div>
              <div class="game-card-category">${game.category}</div>
              <div class="game-card-duration">⏱️ ${game.duration}</div>
              <div class="game-card-points">💎 ${game.points} pts</div>
              <div class="game-card-difficulty difficulty-${game.difficulty}">${game.difficulty}</div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="games-hub-badges">
        <h2 class="section-title">🏆 Earned Badges</h2>
        <div class="badges-container">
          ${badges
            .map((badge) => {
              const earned = gameState.userStats.badges.includes(badge.id);
              return `
            <div class="badge ${earned ? 'earned' : 'locked'}">
              <div class="badge-icon">${badge.icon}</div>
              <div class="badge-name">${badge.name}</div>
              <div class="badge-description">${badge.description}</div>
            </div>
          `;
            })
            .join('')}
        </div>
      </div>

      <div class="motivational-message">
        <p>${getRandomMotivationalMessage()}</p>
      </div>
    </div>
  `;
  return html;
}

/**
 * Start a specific game
 */
export function startGame(gameId) {
  const game = games.find((g) => g.id === gameId);
  if (!game) return;

  gameState.currentGame = game;
  gameState.gameProgress = 0;
  gameState.score = 0;

  switch (game.category) {
    case gameCategories.MEMORY:
      return renderMemoryGame(game);
    case gameCategories.PUZZLE:
      return renderPuzzleGame(game);
    case gameCategories.COLORING:
      return renderColoringGame(game);
    case gameCategories.FOCUS:
      return renderFocusGame(game);
    case gameCategories.TRIVIA:
      return renderTriviaGame(game);
    default:
      return renderGamesHub();
  }
}

/**
 * Memory game implementation
 */
function renderMemoryGame(game) {
  // Reset memory state
  memoryState = {
    flippedCards: [],
    matchedPairs: 0,
    lockBoard: false,
    moves: 0,
    cards: generateMemoryCards(),
  };

  const cardsHtml = memoryState.cards
    .map(
      (card, i) => `
      <div class="memory-card" onclick="window.flipMemoryCard(${i})" data-index="${i}" data-matched="false">
        <div class="card-inner">
          <div class="card-front">❓</div>
          <div class="card-back">${card}</div>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <div class="game-container">
      <div class="game-header">
        <h1>${game.name}</h1>
        <div class="game-stats">
          <span>Score: <strong>${gameState.score}</strong></span>
          <span>Moves: <strong>${memoryState.moves}</strong></span>
          <span>Pairs: <strong>${memoryState.matchedPairs}/8</strong></span>
          <button class="btn-secondary" onclick="window.exitGame()">Exit</button>
        </div>
      </div>
      <div class="memory-grid">${cardsHtml}</div>
      <div class="game-instructions">Match all pairs to win! 🎯</div>
    </div>
  `;
}

// Memory card flip logic
export function flipMemoryCard(index) {
  if (memoryState.lockBoard) return;
  if (memoryState.flippedCards.includes(index)) return;

  const card = document.querySelector(`.memory-card[data-index="${index}"]`);
  if (!card || card.getAttribute('data-matched') === 'true') return;

  // Flip the card
  card.classList.add('flipped');
  memoryState.flippedCards.push(index);

  if (memoryState.flippedCards.length === 2) {
    memoryState.moves++;
    updateMemoryStats();
    checkMemoryMatch();
  }
}

function updateMemoryStats() {
  const statsDiv = document.querySelector('.game-stats');
  if (statsDiv) {
    statsDiv.innerHTML = `
      <span>Score: <strong>${gameState.score}</strong></span>
      <span>Moves: <strong>${memoryState.moves}</strong></span>
      <span>Pairs: <strong>${memoryState.matchedPairs}/8</strong></span>
      <button class="btn-secondary" onclick="window.exitGame()">Exit</button>
    `;
  }
}

function checkMemoryMatch() {
  const [index1, index2] = memoryState.flippedCards;
  const card1 = memoryState.cards[index1];
  const card2 = memoryState.cards[index2];

  if (card1 === card2) {
    // Match found
    setTimeout(() => {
      const cardEl1 = document.querySelector(
        `.memory-card[data-index="${index1}"]`
      );
      const cardEl2 = document.querySelector(
        `.memory-card[data-index="${index2}"]`
      );
      if (cardEl1) cardEl1.setAttribute('data-matched', 'true');
      if (cardEl2) cardEl2.setAttribute('data-matched', 'true');
      cardEl1.style.visibility = 'hidden';
      cardEl2.style.visibility = 'hidden';

      memoryState.matchedPairs++;
      gameState.score += 10;
      updateMemoryStats();

      if (memoryState.matchedPairs === 8) {
        const points = 50 + Math.max(0, 30 - memoryState.moves);
        window.completeGame(points);
      }

      memoryState.flippedCards = [];
    }, 500);
  } else {
    // No match
    memoryState.lockBoard = true;
    setTimeout(() => {
      const cardEl1 = document.querySelector(
        `.memory-card[data-index="${index1}"]`
      );
      const cardEl2 = document.querySelector(
        `.memory-card[data-index="${index2}"]`
      );
      if (cardEl1) cardEl1.classList.remove('flipped');
      if (cardEl2) cardEl2.classList.remove('flipped');
      memoryState.flippedCards = [];
      memoryState.lockBoard = false;
    }, 1000);
  }
}

/**
 * Puzzle game implementation (15-puzzle)
 */
function renderPuzzleGame(game) {
  initPuzzleState();

  return `
    <div class="game-container">
      <div class="game-header">
        <h1>${game.name}</h1>
        <div class="game-stats">
          <span>Score: <strong>${gameState.score}</strong></span>
          <span>Moves: <strong>${puzzleState.moves}</strong></span>
          <button class="btn-secondary" onclick="window.exitGame()">Exit</button>
        </div>
      </div>
      <div class="puzzle-game-area">
        <canvas id="puzzleCanvas" width="400" height="400" class="puzzle-canvas" onclick="window.handlePuzzleCanvasClick(event)"></canvas>
        <div class="puzzle-instructions">Click on tiles adjacent to the empty space to move them!</div>
        <button class="btn-secondary" onclick="window.shufflePuzzle()">Shuffle</button>
      </div>
      <button class="btn-primary" onclick="window.checkPuzzleComplete()">Check Solution</button>
    </div>
  `;
}

function initPuzzleState() {
  puzzleState.tiles = Array.from({ length: 16 }, (_, i) => i);
  puzzleState.emptyIndex = 15;
  puzzleState.moves = 0;

  // Shuffle puzzle
  for (let i = 0; i < 200; i++) {
    const possibleMoves = getAdjacentIndices(puzzleState.emptyIndex);
    const randomMove =
      possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    swapTiles(randomMove, puzzleState.emptyIndex);
    puzzleState.emptyIndex = randomMove;
  }

  drawPuzzleCanvas();
}

function getAdjacentIndices(index) {
  const adjacent = [];
  const row = Math.floor(index / 4);
  const col = index % 4;

  if (row > 0) adjacent.push(index - 4);
  if (row < 3) adjacent.push(index + 4);
  if (col > 0) adjacent.push(index - 1);
  if (col < 3) adjacent.push(index + 1);

  return adjacent;
}

function swapTiles(index1, index2) {
  [puzzleState.tiles[index1], puzzleState.tiles[index2]] = [
    puzzleState.tiles[index2],
    puzzleState.tiles[index1],
  ];
}

export function puzzleTileClick(index) {
  const adjacent = getAdjacentIndices(puzzleState.emptyIndex);
  if (adjacent.includes(index)) {
    swapTiles(index, puzzleState.emptyIndex);
    puzzleState.emptyIndex = index;
    puzzleState.moves++;
    updatePuzzleStats();
    drawPuzzleCanvas();
  }
}

export function shufflePuzzle() {
  for (let i = 0; i < 100; i++) {
    const possibleMoves = getAdjacentIndices(puzzleState.emptyIndex);
    const randomMove =
      possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    swapTiles(randomMove, puzzleState.emptyIndex);
    puzzleState.emptyIndex = randomMove;
  }
  puzzleState.moves = 0;
  updatePuzzleStats();
  drawPuzzleCanvas();
}

export function checkPuzzleComplete() {
  const isComplete = puzzleState.tiles.every((tile, index) => tile === index);
  if (isComplete) {
    const points = 75 + Math.max(0, 50 - puzzleState.moves);
    window.completeGame(points);
  } else {
    alert(
      'Not yet! Keep arranging the tiles in order from 1 to 15 with the empty space at the bottom right.'
    );
  }
}

export function drawPuzzleCanvas() {
  const canvas = document.getElementById('puzzleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const tileSize = 100;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 400, 400);

  for (let i = 0; i < 16; i++) {
    if (puzzleState.tiles[i] === 15) continue;

    const row = Math.floor(i / 4);
    const col = i % 4;
    const number = puzzleState.tiles[i] + 1;

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(col * tileSize, row * tileSize, tileSize - 2, tileSize - 2);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Sora';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number, col * tileSize + 49, row * tileSize + 49);
  }
}

function updatePuzzleStats() {
  const statsDiv = document.querySelector('.game-stats');
  if (statsDiv) {
    statsDiv.innerHTML = `
      <span>Score: <strong>${gameState.score}</strong></span>
      <span>Moves: <strong>${puzzleState.moves}</strong></span>
      <button class="btn-secondary" onclick="window.exitGame()">Exit</button>
    `;
  }
}

export function handlePuzzleCanvasClick(event) {
  const canvas = event.currentTarget;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const col = Math.floor(x / 100);
  const row = Math.floor(y / 100);
  if (col < 0 || col > 3 || row < 0 || row > 3) return;
  const index = row * 4 + col;
  puzzleTileClick(index);
}

/**
 * Coloring game implementation
 */
function renderColoringGame(game) {
  const pattern =
    coloringPatterns[Math.floor(Math.random() * coloringPatterns.length)];

  return `
    <div class="game-container">
      <div class="game-header">
        <h1>${game.name}</h1>
        <div class="game-stats">
          <span>Score: <strong>${gameState.score}</strong></span>
          <button class="btn-secondary" onclick="window.exitGame()">Exit</button>
        </div>
      </div>
      <div class="coloring-game-area">
        <svg class="coloring-canvas" width="400" height="400" viewBox="0 0 400 400">
          <g id="coloringElements">
            <circle cx="100" cy="100" r="80" class="colorable-section" onclick="window.colorSection(this)" style="fill: #f0f0f0; stroke: #ccc; stroke-width: 2;"></circle>
            <circle cx="300" cy="100" r="80" class="colorable-section" onclick="window.colorSection(this)" style="fill: #f0f0f0; stroke: #ccc; stroke-width: 2;"></circle>
            <circle cx="100" cy="300" r="80" class="colorable-section" onclick="window.colorSection(this)" style="fill: #f0f0f0; stroke: #ccc; stroke-width: 2;"></circle>
            <circle cx="300" cy="300" r="80" class="colorable-section" onclick="window.colorSection(this)" style="fill: #f0f0f0; stroke: #ccc; stroke-width: 2;"></circle>
            <rect x="180" y="180" width="40" height="40" class="colorable-section" onclick="window.colorSection(this)" style="fill: #f0f0f0; stroke: #ccc; stroke-width: 2;"></rect>
          </g>
        </svg>
        <div class="color-palette">
          ${pattern.colors
            .map(
              (color) => `
            <button class="color-btn" style="background-color: ${color}" onclick="window.selectColor('${color}')"></button>
          `
            )
            .join('')}
        </div>
      </div>
      <div class="coloring-instructions">Click colors, then click sections to color them. Relax and enjoy! 🎨</div>
      <button class="btn-primary" onclick="window.completeColoringGame()">Done Coloring!</button>
    </div>
  `;
}

let selectedColor = '#FF69B4';

export function selectColor(color) {
  selectedColor = color;
}

export function colorSection(element) {
  if (element) element.style.fill = selectedColor;
}

export function completeColoringGame() {
  window.completeGame(50);
}

/**
 * Focus game implementation (Simon Says style)
 */
function renderFocusGame(game) {
  focusState = {
    patternSequence: [],
    userSequence: [],
    round: 0,
    isPlaying: false,
    timeoutId: null,
  };

  return `
    <div class="game-container">
      <div class="game-header">
        <h1>${game.name}</h1>
        <div class="game-stats">
          <span>Score: <strong>${gameState.score}</strong></span>
          <span>Round: <strong>${focusState.round}</strong></span>
          <button class="btn-secondary" onclick="window.exitGame()">Exit</button>
        </div>
      </div>
      <div class="focus-game-area">
        <div class="pattern-display" id="patternDisplay" style="font-size: 48px; text-align: center; margin: 20px;">
          🎯
        </div>
        <div class="focus-buttons" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; max-width: 300px; margin: 20px auto;">
          <button class="focus-btn" data-color="red" onclick="window.focusButtonPress('red')" style="background: #ef4444; padding: 40px; border-radius: 10px;"></button>
          <button class="focus-btn" data-color="green" onclick="window.focusButtonPress('green')" style="background: #22c55e; padding: 40px; border-radius: 10px;"></button>
          <button class="focus-btn" data-color="blue" onclick="window.focusButtonPress('blue')" style="background: #3b82f6; padding: 40px; border-radius: 10px;"></button>
          <button class="focus-btn" data-color="yellow" onclick="window.focusButtonPress('yellow')" style="background: #eab308; padding: 40px; border-radius: 10px;"></button>
        </div>
        <div class="focus-instructions">Watch the pattern, then repeat it!</div>
        <div id="focusMessage" style="text-align: center; margin-top: 10px;"></div>
      </div>
    </div>
  `;
}

export function startFocusRound() {
  focusState.round++;
  updateFocusStats();

  const colors = ['red', 'green', 'blue', 'yellow'];
  const nextColor = colors[Math.floor(Math.random() * colors.length)];
  focusState.patternSequence.push(nextColor);
  focusState.userSequence = [];

  playFocusPattern();
}

function playFocusPattern() {
  focusState.isPlaying = true;
  let i = 0;

  function showNext() {
    if (i >= focusState.patternSequence.length) {
      focusState.isPlaying = false;
      showFocusMessage('Your turn! Repeat the pattern.');
      return;
    }

    const color = focusState.patternSequence[i];
    const btn = document.querySelector(`.focus-btn[data-color="${color}"]`);
    if (btn) {
      btn.style.opacity = '0.5';
      setTimeout(() => {
        if (btn) btn.style.opacity = '1';
      }, 300);
    }
    i++;
    setTimeout(showNext, 600);
  }

  showNext();
}

export function focusButtonPress(color) {
  if (focusState.isPlaying) {
    showFocusMessage('Wait for the pattern to finish!');
    return;
  }

  // Flash effect
  const btn = document.querySelector(`.focus-btn[data-color="${color}"]`);
  if (btn) {
    btn.style.opacity = '0.5';
    setTimeout(() => {
      if (btn) btn.style.opacity = '1';
    }, 150);
  }

  focusState.userSequence.push(color);
  const currentIndex = focusState.userSequence.length - 1;

  if (
    focusState.userSequence[currentIndex] !==
    focusState.patternSequence[currentIndex]
  ) {
    // Wrong sequence - game over but give points for round reached
    showFocusMessage(
      `Wrong! You reached round ${focusState.round - 1}. Starting over...`
    );
    const points = Math.max(10, (focusState.round - 1) * 5);
    setTimeout(() => {
      focusState = {
        patternSequence: [],
        userSequence: [],
        round: 0,
        isPlaying: false,
        timeoutId: null,
      };
      startFocusRound();
      gameState.score += points;
      updateFocusStats();
    }, 2000);
    return;
  }

  if (focusState.userSequence.length === focusState.patternSequence.length) {
    // Round complete
    showFocusMessage(`Round ${focusState.round} complete! Next round...`);
    gameState.score += 10;
    updateFocusStats();

    if (focusState.round >= 10) {
      window.completeGame(100 + gameState.score);
    } else {
      setTimeout(() => startFocusRound(), 1500);
    }
  }
}

function updateFocusStats() {
  const statsDiv = document.querySelector('.game-stats');
  if (statsDiv) {
    statsDiv.innerHTML = `
      <span>Score: <strong>${gameState.score}</strong></span>
      <span>Round: <strong>${focusState.round}</strong></span>
      <button class="btn-secondary" onclick="window.exitGame()">Exit</button>
    `;
  }
}

function showFocusMessage(msg) {
  const msgDiv = document.getElementById('focusMessage');
  if (msgDiv) {
    msgDiv.textContent = msg;
    msgDiv.style.color = '#60a5fa';
    msgDiv.style.fontSize = '14px';
    setTimeout(() => {
      if (msgDiv) msgDiv.textContent = '';
    }, 2000);
  }
}

/**
 * Trivia game implementation
 */
function renderTriviaGame(game) {
  triviaState = {
    currentQuestionIndex: 0,
    score: 0,
    questions: [...trivia],
  };

  return renderCurrentTriviaQuestion(game);
}

function renderCurrentTriviaQuestion(game) {
  const question = triviaState.questions[triviaState.currentQuestionIndex];
  if (!question || triviaState.currentQuestionIndex >= 5) {
    // Game complete
    const points = 50 + triviaState.score;
    setTimeout(() => window.completeGame(points), 0);
    return `
      <div class="loading-overlay">
        <div style="text-align:center;">
          <div class="spinner"></div>
          <p class="loading-text">Finishing trivia... Great work.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="game-container">
      <div class="game-header">
        <h1>${game.name}</h1>
        <div class="game-stats">
          <span>Score: <strong>${triviaState.score}</strong></span>
          <span>Question: <strong>${triviaState.currentQuestionIndex + 1}/5</strong></span>
          <button class="btn-secondary" onclick="window.exitGame()">Exit</button>
        </div>
      </div>
      <div class="trivia-game-area">
        <div class="trivia-question">
          <h2>${escapeHtml(question.question)}</h2>
        </div>
        <div class="trivia-options">
          ${question.options
            .map(
              (option, i) => `
            <button class="trivia-option" onclick="window.selectTriviaAnswer(${i})">
              ${escapeHtml(option)}
            </button>
          `
            )
            .join('')}
        </div>
        <div id="triviaFeedback" class="trivia-feedback"></div>
        <div class="trivia-fact" id="triviaFact" style="margin-top: 20px; padding: 10px; background: rgba(96,165,250,0.1); border-radius: 10px; display: none;"></div>
      </div>
    </div>
  `;
}

export function selectTriviaAnswer(selectedIndex) {
  const question = triviaState.questions[triviaState.currentQuestionIndex];
  const feedbackEl = document.getElementById('triviaFeedback');
  const factEl = document.getElementById('triviaFact');

  if (!question) return;

  // Disable all option buttons
  document.querySelectorAll('.trivia-option').forEach((btn) => {
    btn.disabled = true;
  });

  if (selectedIndex === question.correct) {
    // Correct answer
    feedbackEl.textContent = '✅ Correct! Great job!';
    feedbackEl.className = 'trivia-feedback correct';
    triviaState.score += 10;
    gameState.score += 10;
  } else {
    // Wrong answer
    const correctAnswer = question.options[question.correct];
    feedbackEl.textContent = `❌ Not quite. The correct answer is: ${correctAnswer}`;
    feedbackEl.className = 'trivia-feedback incorrect';
  }

  // Show fact
  factEl.style.display = 'block';
  factEl.innerHTML = `📚 Did you know? ${escapeHtml(question.fact)}`;

  // Update stats
  const statsDiv = document.querySelector('.game-stats');
  if (statsDiv) {
    statsDiv.innerHTML = `
      <span>Score: <strong>${triviaState.score}</strong></span>
      <span>Question: <strong>${triviaState.currentQuestionIndex + 1}/5</strong></span>
      <button class="btn-secondary" onclick="window.exitGame()">Exit</button>
    `;
  }

  // Move to next question after delay
  setTimeout(() => {
    triviaState.currentQuestionIndex++;

    if (
      triviaState.currentQuestionIndex >= 5 ||
      triviaState.currentQuestionIndex >= triviaState.questions.length
    ) {
      const points = 50 + triviaState.score;
      window.completeGame(points);
    } else {
      const game = gameState.currentGame;
      const newHtml = renderCurrentTriviaQuestion(game);
      const gamesRoot = document.getElementById('gamesHubRoot');
      if (gamesRoot) {
        gamesRoot.innerHTML = newHtml;
      }
    }
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Complete game and save stats
 */
export async function completeGame(points) {
  gameState.userStats.gamesPlayed += 1;
  gameState.userStats.totalPoints += points;
  gameState.score += points;

  // Check for badge unlocks
  checkBadgeUnlocks();

  // Save to Firebase
  if (gameState.currentUser) {
    await saveGameStats();
  } else {
    localStorage.setItem('ms_game_stats', JSON.stringify(gameState.userStats));
  }

  return showGameComplete(points);
}

/**
 * Show game completion screen
 */
function showGameComplete(points) {
  return `
    <div class="game-complete-container">
      <div class="game-complete-content">
        <h1 class="game-complete-title">🎉 Game Complete!</h1>
        <div class="game-complete-stats">
          <div class="stat-display">
            <div class="stat-number">${points}</div>
            <div class="stat-label">Points Earned</div>
          </div>
          <div class="stat-display">
            <div class="stat-number">${gameState.userStats.gamesPlayed}</div>
            <div class="stat-label">Games Played</div>
          </div>
          <div class="stat-display">
            <div class="stat-number">${gameState.userStats.totalPoints}</div>
            <div class="stat-label">Total Points</div>
          </div>
        </div>
        <p class="encouragement-message">${getRandomMotivationalMessage()}</p>
        <div class="game-complete-actions">
          <button class="btn-primary" onclick="window.showGamesHub()">Play Another Game</button>
          <button class="btn-secondary" onclick="window.exitGame()">Back to Dashboard</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Check and unlock badges
 */
function checkBadgeUnlocks() {
  const newBadges = [];

  if (
    gameState.userStats.gamesPlayed === 1 &&
    !gameState.userStats.badges.includes('first-game')
  ) {
    newBadges.push('first-game');
  }
  if (
    gameState.userStats.gamesPlayed >= 25 &&
    !gameState.userStats.badges.includes('game-master')
  ) {
    newBadges.push('game-master');
  }
  if (
    gameState.userStats.gamesPlayed >= 50 &&
    !gameState.userStats.badges.includes('wellness-warrior')
  ) {
    newBadges.push('wellness-warrior');
  }
  if (
    gameState.userStats.totalPoints >= 1000 &&
    !gameState.userStats.badges.includes('calm-collector')
  ) {
    newBadges.push('calm-collector');
  }

  // Check memory champion badge
  const memoryGamesPlayed = gameState.userStats.memoryGamesPlayed || 0;
  if (
    memoryGamesPlayed >= 10 &&
    !gameState.userStats.badges.includes('memory-champion')
  ) {
    newBadges.push('memory-champion');
  }

  // Check puzzle pro badge
  const puzzleGamesPlayed = gameState.userStats.puzzleGamesPlayed || 0;
  if (
    puzzleGamesPlayed >= 10 &&
    !gameState.userStats.badges.includes('puzzle-pro')
  ) {
    newBadges.push('puzzle-pro');
  }

  newBadges.forEach((badgeId) => {
    if (!gameState.userStats.badges.includes(badgeId)) {
      gameState.userStats.badges.push(badgeId);
    }
  });
}

/**
 * Load user game statistics from Firebase
 */
async function loadUserGameStats() {
  if (!gameState.currentUser) {
    const saved = localStorage.getItem('ms_game_stats');
    if (saved) {
      try {
        gameState.userStats = JSON.parse(saved);
      } catch (e) {}
    }
    return;
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/games/stats/${gameState.currentUser.id}`
    );
    if (response.ok) {
      const stats = await response.json();
      gameState.userStats = stats;
    }
  } catch (err) {
    console.warn('Could not load game stats:', err);
    const saved = localStorage.getItem('ms_game_stats');
    if (saved) {
      try {
        gameState.userStats = JSON.parse(saved);
      } catch (e) {}
    }
  }
}

/**
 * Save user game statistics to Firebase
 */
async function saveGameStats() {
  if (!gameState.currentUser) {
    localStorage.setItem('ms_game_stats', JSON.stringify(gameState.userStats));
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/games/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: gameState.currentUser.id,
        stats: gameState.userStats,
        gameId: gameState.currentGame?.id,
        points: gameState.score,
        timestamp: new Date(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save stats');
    }

    localStorage.setItem('ms_game_stats', JSON.stringify(gameState.userStats));
  } catch (err) {
    console.error('Error saving game stats:', err);
    localStorage.setItem('ms_game_stats', JSON.stringify(gameState.userStats));
  }
}

/**
 * Helper: Generate memory game cards
 */
function generateMemoryCards() {
  const symbols = ['🌟', '🎨', '🎭', '🎪', '🎸', '🎬', '🎲', '🎯'];
  let cards = [...symbols, ...symbols];
  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/**
 * Helper: Get random motivational message
 */
export function getRandomMotivationalMessage() {
  return motivationalMessages[
    Math.floor(Math.random() * motivationalMessages.length)
  ];
}

/**
 * Export game state for external access
 */
export function getGameState() {
  return gameState;
}

/**
 * Exit game and return to hub
 */
export function exitGame() {
  return renderGamesHub();
}

// Functions are exported inline where declared; no final aggregated export needed.
