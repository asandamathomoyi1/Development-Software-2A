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
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return 'http://localhost:3001';
  return origin;
})();

let gameState = {
  currentGame: null,
  gameProgress: 0,
  score: 0,
  currentUser: null,
  userStats: { gamesPlayed: 0, totalPoints: 0, badges: [] },
};

let memoryState = { flippedCards: [], matchedPairs: 0, lockBoard: false, moves: 0, cards: [] };
let focusState  = { patternSequence: [], userSequence: [], round: 0, isPlaying: false, timeoutId: null };
let puzzleState = { tiles: [], emptyIndex: 15, moves: 0, canvas: null, ctx: null, img: null };
let triviaState = { currentQuestionIndex: 0, score: 0, questions: [] };

// ─── INIT ────────────────────────────────────────────────────────────────────

export function initGamesHub(currentUser) {
  gameState.currentUser = currentUser;
  loadUserGameStats();
}

export function getRecommendedGames(mood) {
  const recommendation = gameMoodRecommendations[mood];
  if (!recommendation) return games.slice(0, 5);
  return games.filter(g => recommendation.recommended.includes(g.id));
}

// ─── GAMES HUB RENDER ────────────────────────────────────────────────────────

export function renderGamesHub() {
  return `
    <div class="games-hub-container">
      <div class="games-hub-header">
        <h1 class="games-hub-title">🎮 Mental Wellness Games Hub</h1>
        <p class="games-hub-subtitle">Choose a game to relax and boost your mental wellness!</p>
      </div>

      <div class="games-hub-stats">
        <div class="stat-box"><div class="stat-label">Games Played</div><div class="stat-value">${gameState.userStats.gamesPlayed}</div></div>
        <div class="stat-box"><div class="stat-label">Total Points</div><div class="stat-value">${gameState.userStats.totalPoints}</div></div>
        <div class="stat-box"><div class="stat-label">Badges Earned</div><div class="stat-value">${gameState.userStats.badges.length}</div></div>
      </div>

      <div class="games-hub-mood-check">
        <h2 class="section-title">How are you feeling today?</h2>
        <div class="mood-selector">
          ${[1,2,3,4,5].map(mood => `
            <button class="mood-btn" onclick="window.selectGameMood(${mood})" data-mood="${mood}">
              <span class="mood-emoji">${gameMoodRecommendations[mood]?.emoji || ''}</span>
              <span class="mood-label">${moodLabels[mood]}</span>
            </button>`).join('')}
        </div>
      </div>

      <div class="games-hub-content" id="gamesContent">
        <h2 class="section-title">Choose a Game</h2>
        <div class="games-grid">
          ${games.map(game => `
            <div class="game-card" onclick="window.startGame('${game.id}')">
              <div class="game-card-icon">${game.icon}</div>
              <div class="game-card-name">${game.name}</div>
              <div class="game-card-category">${game.category}</div>
              <div class="game-card-duration">⏱️ ${game.duration}</div>
              <div class="game-card-points">💎 ${game.points} pts</div>
              <div class="game-card-difficulty difficulty-${game.difficulty}">${game.difficulty}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="games-hub-badges">
        <h2 class="section-title">🏆 Earned Badges</h2>
        <div class="badges-container">
          ${badges.map(badge => {
            const earned = gameState.userStats.badges.includes(badge.id);
            return `<div class="badge ${earned ? 'earned' : 'locked'}">
              <div class="badge-icon">${badge.icon}</div>
              <div class="badge-name">${badge.name}</div>
              <div class="badge-description">${badge.description}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="motivational-message"><p>${getRandomMotivationalMessage()}</p></div>
    </div>`;
}

// ─── START GAME ──────────────────────────────────────────────────────────────

export function startGame(gameId) {
  const game = games.find(g => g.id === gameId);
  if (!game) return;
  gameState.currentGame = game;
  gameState.gameProgress = 0;
  gameState.score = 0;
  switch (game.category) {
    case gameCategories.MEMORY:   return renderMemoryGame(game);
    case gameCategories.PUZZLE:   return renderPuzzleGame(game);
    case gameCategories.COLORING: return renderColoringGame(game);
    case gameCategories.FOCUS:    return renderFocusGame(game);
    case gameCategories.TRIVIA:   return renderTriviaGame(game);
    default: return renderGamesHub();
  }
}

// ─── MEMORY GAME ─────────────────────────────────────────────────────────────

function renderMemoryGame(game) {
  memoryState = { flippedCards: [], matchedPairs: 0, lockBoard: false, moves: 0, cards: generateMemoryCards() };
  const cardsHtml = memoryState.cards.map((card, i) => `
    <div class="memory-card" onclick="window.flipMemoryCard(${i})" data-index="${i}" data-matched="false">
      <div class="card-inner">
        <div class="card-front">❓</div>
        <div class="card-back">${card}</div>
      </div>
    </div>`).join('');
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
    </div>`;
}

export function flipMemoryCard(index) {
  if (memoryState.lockBoard) return;
  if (memoryState.flippedCards.includes(index)) return;
  const card = document.querySelector(`.memory-card[data-index="${index}"]`);
  if (!card || card.getAttribute('data-matched') === 'true') return;
  card.classList.add('flipped');
  memoryState.flippedCards.push(index);
  if (memoryState.flippedCards.length === 2) {
    memoryState.moves++;
    updateMemoryStats();
    checkMemoryMatch();
  }
}

function updateMemoryStats() {
  const s = document.querySelector('.game-stats');
  if (s) s.innerHTML = `<span>Score: <strong>${gameState.score}</strong></span><span>Moves: <strong>${memoryState.moves}</strong></span><span>Pairs: <strong>${memoryState.matchedPairs}/8</strong></span><button class="btn-secondary" onclick="window.exitGame()">Exit</button>`;
}

function checkMemoryMatch() {
  const [i1, i2] = memoryState.flippedCards;
  if (memoryState.cards[i1] === memoryState.cards[i2]) {
    setTimeout(() => {
      const c1 = document.querySelector(`.memory-card[data-index="${i1}"]`);
      const c2 = document.querySelector(`.memory-card[data-index="${i2}"]`);
      if (c1) { c1.setAttribute('data-matched', 'true'); c1.style.visibility = 'hidden'; }
      if (c2) { c2.setAttribute('data-matched', 'true'); c2.style.visibility = 'hidden'; }
      memoryState.matchedPairs++;
      gameState.score += 10;
      updateMemoryStats();
      if (memoryState.matchedPairs === 8) window.completeGame(50 + Math.max(0, 30 - memoryState.moves));
      memoryState.flippedCards = [];
    }, 500);
  } else {
    memoryState.lockBoard = true;
    setTimeout(() => {
      const c1 = document.querySelector(`.memory-card[data-index="${i1}"]`);
      const c2 = document.querySelector(`.memory-card[data-index="${i2}"]`);
      if (c1) c1.classList.remove('flipped');
      if (c2) c2.classList.remove('flipped');
      memoryState.flippedCards = [];
      memoryState.lockBoard = false;
    }, 1000);
  }
}

// ─── PUZZLE GAME ─────────────────────────────────────────────────────────────

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
    </div>`;
}

function initPuzzleState() {
  puzzleState.tiles = Array.from({ length: 16 }, (_, i) => i);
  puzzleState.emptyIndex = 15;
  puzzleState.moves = 0;
  for (let i = 0; i < 200; i++) {
    const moves = getAdjacentIndices(puzzleState.emptyIndex);
    const r = moves[Math.floor(Math.random() * moves.length)];
    swapTiles(r, puzzleState.emptyIndex);
    puzzleState.emptyIndex = r;
  }
  drawPuzzleCanvas();
}

function getAdjacentIndices(index) {
  const adj = [], row = Math.floor(index / 4), col = index % 4;
  if (row > 0) adj.push(index - 4);
  if (row < 3) adj.push(index + 4);
  if (col > 0) adj.push(index - 1);
  if (col < 3) adj.push(index + 1);
  return adj;
}

function swapTiles(i1, i2) {
  [puzzleState.tiles[i1], puzzleState.tiles[i2]] = [puzzleState.tiles[i2], puzzleState.tiles[i1]];
}

export function puzzleTileClick(index) {
  const adj = getAdjacentIndices(puzzleState.emptyIndex);
  if (adj.includes(index)) {
    swapTiles(index, puzzleState.emptyIndex);
    puzzleState.emptyIndex = index;
    puzzleState.moves++;
    updatePuzzleStats();
    drawPuzzleCanvas();
  }
}

export function shufflePuzzle() {
  for (let i = 0; i < 100; i++) {
    const moves = getAdjacentIndices(puzzleState.emptyIndex);
    const r = moves[Math.floor(Math.random() * moves.length)];
    swapTiles(r, puzzleState.emptyIndex);
    puzzleState.emptyIndex = r;
  }
  puzzleState.moves = 0;
  updatePuzzleStats();
  drawPuzzleCanvas();
}

export function checkPuzzleComplete() {
  if (puzzleState.tiles.every((t, i) => t === i)) {
    window.completeGame(75 + Math.max(0, 50 - puzzleState.moves));
  } else {
    alert('Not yet! Keep arranging the tiles in order from 1 to 15 with the empty space at the bottom right.');
  }
}

export function drawPuzzleCanvas() {
  const canvas = document.getElementById('puzzleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 400, 400);
  for (let i = 0; i < 16; i++) {
    if (puzzleState.tiles[i] === 15) continue;
    const row = Math.floor(i / 4), col = i % 4;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(col * 100, row * 100, 98, 98);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Sora';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(puzzleState.tiles[i] + 1, col * 100 + 49, row * 100 + 49);
  }
}

function updatePuzzleStats() {
  const s = document.querySelector('.game-stats');
  if (s) s.innerHTML = `<span>Score: <strong>${gameState.score}</strong></span><span>Moves: <strong>${puzzleState.moves}</strong></span><button class="btn-secondary" onclick="window.exitGame()">Exit</button>`;
}

export function handlePuzzleCanvasClick(event) {
  const canvas = event.currentTarget;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const col = Math.floor((event.clientX - rect.left) / 100);
  const row = Math.floor((event.clientY - rect.top) / 100);
  if (col < 0 || col > 3 || row < 0 || row > 3) return;
  puzzleTileClick(row * 4 + col);
}

// ─── COLORING GAME ───────────────────────────────────────────────────────────

function renderColoringGame(game) {
  const pattern = coloringPatterns[Math.floor(Math.random() * coloringPatterns.length)];
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
            <circle cx="100" cy="100" r="80" class="colorable-section" onclick="window.colorSection(this)" style="fill:#f0f0f0;stroke:#ccc;stroke-width:2;"></circle>
            <circle cx="300" cy="100" r="80" class="colorable-section" onclick="window.colorSection(this)" style="fill:#f0f0f0;stroke:#ccc;stroke-width:2;"></circle>
            <circle cx="100" cy="300" r="80" class="colorable-section" onclick="window.colorSection(this)" style="fill:#f0f0f0;stroke:#ccc;stroke-width:2;"></circle>
            <circle cx="300" cy="300" r="80" class="colorable-section" onclick="window.colorSection(this)" style="fill:#f0f0f0;stroke:#ccc;stroke-width:2;"></circle>
            <rect x="180" y="180" width="40" height="40" class="colorable-section" onclick="window.colorSection(this)" style="fill:#f0f0f0;stroke:#ccc;stroke-width:2;"></rect>
          </g>
        </svg>
        <div class="color-palette">
          ${pattern.colors.map(color => `<button class="color-btn" style="background-color:${color}" onclick="window.selectColor('${color}')"></button>`).join('')}
        </div>
      </div>
      <div class="coloring-instructions">Click a colour then click a section to fill it. Relax and enjoy! 🎨</div>
      <button class="btn-primary" onclick="window.completeColoringGame()">Done Coloring!</button>
    </div>`;
}

let selectedColor = '#FF69B4';
export function selectColor(color) { selectedColor = color; }
export function colorSection(element) { if (element) element.style.fill = selectedColor; }
export function completeColoringGame() { window.completeGame(50); }

// ─── FOCUS GAME ──────────────────────────────────────────────────────────────

function renderFocusGame(game) {
  focusState = { patternSequence: [], userSequence: [], round: 0, isPlaying: false, timeoutId: null };
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
        <div class="pattern-display" id="patternDisplay" style="font-size:48px;text-align:center;margin:20px;">🎯</div>
        <div class="focus-buttons" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-width:300px;margin:20px auto;">
          <button class="focus-btn" data-color="red"    onclick="window.focusButtonPress('red')"    style="background:#ef4444;padding:40px;border-radius:10px;border:none;cursor:pointer;"></button>
          <button class="focus-btn" data-color="green"  onclick="window.focusButtonPress('green')"  style="background:#22c55e;padding:40px;border-radius:10px;border:none;cursor:pointer;"></button>
          <button class="focus-btn" data-color="blue"   onclick="window.focusButtonPress('blue')"   style="background:#3b82f6;padding:40px;border-radius:10px;border:none;cursor:pointer;"></button>
          <button class="focus-btn" data-color="yellow" onclick="window.focusButtonPress('yellow')" style="background:#eab308;padding:40px;border-radius:10px;border:none;cursor:pointer;"></button>
        </div>
        <div class="focus-instructions">Watch the pattern, then repeat it!</div>
        <div id="focusMessage" style="text-align:center;margin-top:10px;"></div>
      </div>
    </div>`;
}

export function startFocusRound() {
  focusState.round++;
  updateFocusStats();
  const colors = ['red', 'green', 'blue', 'yellow'];
  focusState.patternSequence.push(colors[Math.floor(Math.random() * colors.length)]);
  focusState.userSequence = [];
  playFocusPattern();
}

function playFocusPattern() {
  focusState.isPlaying = true;
  let i = 0;
  function showNext() {
    if (i >= focusState.patternSequence.length) { focusState.isPlaying = false; showFocusMessage('Your turn! Repeat the pattern.'); return; }
    const btn = document.querySelector(`.focus-btn[data-color="${focusState.patternSequence[i]}"]`);
    if (btn) { btn.style.opacity = '0.5'; setTimeout(() => { if (btn) btn.style.opacity = '1'; }, 300); }
    i++;
    setTimeout(showNext, 600);
  }
  showNext();
}

export function focusButtonPress(color) {
  if (focusState.isPlaying) { showFocusMessage('Wait for the pattern to finish!'); return; }
  const btn = document.querySelector(`.focus-btn[data-color="${color}"]`);
  if (btn) { btn.style.opacity = '0.5'; setTimeout(() => { if (btn) btn.style.opacity = '1'; }, 150); }
  focusState.userSequence.push(color);
  const idx = focusState.userSequence.length - 1;
  if (focusState.userSequence[idx] !== focusState.patternSequence[idx]) {
    showFocusMessage(`Wrong! You reached round ${focusState.round - 1}. Starting over...`);
    const pts = Math.max(10, (focusState.round - 1) * 5);
    setTimeout(() => {
      focusState = { patternSequence: [], userSequence: [], round: 0, isPlaying: false, timeoutId: null };
      startFocusRound();
      gameState.score += pts;
      updateFocusStats();
    }, 2000);
    return;
  }
  if (focusState.userSequence.length === focusState.patternSequence.length) {
    showFocusMessage(`Round ${focusState.round} complete! Next round...`);
    gameState.score += 10;
    updateFocusStats();
    if (focusState.round >= 10) window.completeGame(100 + gameState.score);
    else setTimeout(() => startFocusRound(), 1500);
  }
}

function updateFocusStats() {
  const s = document.querySelector('.game-stats');
  if (s) s.innerHTML = `<span>Score: <strong>${gameState.score}</strong></span><span>Round: <strong>${focusState.round}</strong></span><button class="btn-secondary" onclick="window.exitGame()">Exit</button>`;
}

function showFocusMessage(msg) {
  const el = document.getElementById('focusMessage');
  if (el) { el.textContent = msg; el.style.color = '#60a5fa'; el.style.fontSize = '14px'; setTimeout(() => { if (el) el.textContent = ''; }, 2000); }
}

// ─── TRIVIA GAME ─────────────────────────────────────────────────────────────

function renderTriviaGame(game) {
  triviaState = { currentQuestionIndex: 0, score: 0, questions: [...trivia] };
  return renderCurrentTriviaQuestion(game);
}

function renderCurrentTriviaQuestion(game) {
  const question = triviaState.questions[triviaState.currentQuestionIndex];
  if (!question || triviaState.currentQuestionIndex >= 5) {
    setTimeout(() => window.completeGame(50 + triviaState.score), 0);
    return `<div class="loading-overlay"><div style="text-align:center;"><div class="spinner"></div><p class="loading-text">Finishing trivia... Great work.</p></div></div>`;
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
        <div class="trivia-question"><h2>${escapeHtml(question.question)}</h2></div>
        <div class="trivia-options">
          ${question.options.map((opt, i) => `<button class="trivia-option" onclick="window.selectTriviaAnswer(${i})">${escapeHtml(opt)}</button>`).join('')}
        </div>
        <div id="triviaFeedback" class="trivia-feedback"></div>
        <div class="trivia-fact" id="triviaFact" style="margin-top:20px;padding:10px;background:rgba(96,165,250,0.1);border-radius:10px;display:none;"></div>
      </div>
    </div>`;
}

export function selectTriviaAnswer(selectedIndex) {
  const question = triviaState.questions[triviaState.currentQuestionIndex];
  const feedbackEl = document.getElementById('triviaFeedback');
  const factEl     = document.getElementById('triviaFact');
  if (!question) return;
  document.querySelectorAll('.trivia-option').forEach(b => b.disabled = true);
  if (selectedIndex === question.correct) {
    feedbackEl.textContent = '✅ Correct! Great job!';
    feedbackEl.className = 'trivia-feedback correct';
    triviaState.score += 10;
    gameState.score += 10;
  } else {
    feedbackEl.textContent = `❌ Not quite. The correct answer is: ${question.options[question.correct]}`;
    feedbackEl.className = 'trivia-feedback incorrect';
  }
  factEl.style.display = 'block';
  factEl.innerHTML = `📚 Did you know? ${escapeHtml(question.fact)}`;
  const s = document.querySelector('.game-stats');
  if (s) s.innerHTML = `<span>Score: <strong>${triviaState.score}</strong></span><span>Question: <strong>${triviaState.currentQuestionIndex + 1}/5</strong></span><button class="btn-secondary" onclick="window.exitGame()">Exit</button>`;
  setTimeout(() => {
    triviaState.currentQuestionIndex++;
    if (triviaState.currentQuestionIndex >= 5 || triviaState.currentQuestionIndex >= triviaState.questions.length) {
      window.completeGame(50 + triviaState.score);
    } else {
      const r = document.getElementById('gamesHubRoot');
      if (r) r.innerHTML = renderCurrentTriviaQuestion(gameState.currentGame);
    }
  }, 3000);
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

// ─── GAME COMPLETE ───────────────────────────────────────────────────────────

export async function completeGame(points) {
  gameState.userStats.gamesPlayed += 1;
  gameState.userStats.totalPoints += points;
  gameState.score += points;
  checkBadgeUnlocks();
  if (gameState.currentUser) await saveGameStats();
  else localStorage.setItem('ms_game_stats', JSON.stringify(gameState.userStats));
  return showGameComplete(points);
}

function getPlayerMoodLabel() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('ms_mood_'));
    if (keys.length) {
      const history = JSON.parse(localStorage.getItem(keys[0]) || '[]');
      if (history.length) {
        const labels = { 1: 'very low', 2: 'low', 3: 'neutral', 4: 'good', 5: 'great' };
        return labels[history[0]?.mood] || 'neutral';
      }
    }
  } catch(e) {}
  return 'neutral';
}

function showGameComplete(points) {
  const game = gameState.currentGame;
  const moodLabel = getPlayerMoodLabel();

  // Store the message on window so the onclick can safely reference it
  // (avoids quote-escaping bugs inside HTML attribute strings)
  window._pendingGameCompletionMsg = game
    ? 'I just completed the ' + (game.name || 'wellness') + ' game and earned ' + points + ' points! I was feeling ' + moodLabel + ' before I started. It really helped me focus. Can we talk about how I am feeling now?'
    : 'I just finished a wellness game and earned ' + points + ' points! It helped me feel more centered. How can I keep this going?';

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
        <div class="game-complete-actions" style="display:flex;flex-direction:column;gap:12px;align-items:center;margin-top:20px;">
          <button class="btn-primary" onclick="window.showGamesHub()"
            style="width:220px;padding:13px;border-radius:12px;font-size:15px;cursor:pointer;border:none;">
            🎮 Play Another Game
          </button>
          <button
            onclick="if(window.gotoWithMoodMessage){window.gotoWithMoodMessage(window._pendingGameCompletionMsg||'');}"
            style="width:220px;padding:13px;border-radius:12px;font-size:15px;
                   background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(37,99,235,0.2));
                   border:1px solid rgba(96,165,250,0.4);color:#93c5fd;cursor:pointer;
                   font-family:'Sora',sans-serif;font-weight:500;transition:all 0.2s;"
            onmouseover="this.style.background='rgba(59,130,246,0.3)'"
            onmouseout="this.style.background='linear-gradient(135deg,rgba(59,130,246,0.2),rgba(37,99,235,0.2))'">
            💬 Talk to AI Companion
          </button>
        </div>
      </div>
    </div>`;
}

// ─── BADGES ──────────────────────────────────────────────────────────────────

function checkBadgeUnlocks() {
  const s = gameState.userStats;
  const add = id => { if (!s.badges.includes(id)) s.badges.push(id); };
  if (s.gamesPlayed >= 1)  add('first-game');
  if (s.gamesPlayed >= 25) add('game-master');
  if (s.gamesPlayed >= 50) add('wellness-warrior');
  if (s.totalPoints >= 1000) add('calm-collector');
  if ((s.memoryGamesPlayed  || 0) >= 10) add('memory-champion');
  if ((s.puzzleGamesPlayed  || 0) >= 10) add('puzzle-pro');
  if ((s.coloringGamesPlayed|| 0) >= 10) add('color-artist');
  if ((s.focusGamesPlayed   || 0) >= 10) add('focus-finder');
}

// ─── STATS ───────────────────────────────────────────────────────────────────

async function loadUserGameStats() {
  if (!gameState.currentUser) {
    const saved = localStorage.getItem('ms_game_stats');
    if (saved) { try { gameState.userStats = JSON.parse(saved); } catch(e) {} }
    return;
  }
  try {
    const r = await fetch(`${BACKEND_URL}/api/games/stats/${gameState.currentUser.id}`);
    if (r.ok) gameState.userStats = await r.json();
  } catch {
    const saved = localStorage.getItem('ms_game_stats');
    if (saved) { try { gameState.userStats = JSON.parse(saved); } catch(e) {} }
  }
}

async function saveGameStats() {
  if (!gameState.currentUser) { localStorage.setItem('ms_game_stats', JSON.stringify(gameState.userStats)); return; }
  try {
    await fetch(`${BACKEND_URL}/api/games/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: gameState.currentUser.id, stats: gameState.userStats, gameId: gameState.currentGame?.id, points: gameState.score, timestamp: new Date() }),
    });
    localStorage.setItem('ms_game_stats', JSON.stringify(gameState.userStats));
  } catch {
    localStorage.setItem('ms_game_stats', JSON.stringify(gameState.userStats));
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function generateMemoryCards() {
  const symbols = ['🌟', '🎨', '🎭', '🎪', '🎸', '🎬', '🎲', '🎯'];
  let cards = [...symbols, ...symbols];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function getRandomMotivationalMessage() {
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
}

export function getGameState() { return gameState; }
export function exitGame() { return renderGamesHub(); }
