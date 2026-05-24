import { Nav } from './Nav.js';
import {
  renderGamesHub,
  startGame,
  completeGame,
  exitGame,
  getRecommendedGames,
  initGamesHub,
} from '../games-hub.js';

export function GamesHubPage(currentUser) {
  return `${Nav('games', currentUser)}
    <div class="games-hub-wrapper">
      <div id="gamesHubRoot" style="padding-top: 90px; padding-bottom: 60px;">
        ${renderGamesHub()}
      </div>
    </div>
  `;
}

export function renderGamePage(currentUser, gameId) {
  return `${Nav('games', currentUser)}
    <div class="games-hub-wrapper">
      <div id="gamesHubRoot" style="padding-top: 90px; padding-bottom: 60px;">
        ${startGame(gameId)}
      </div>
    </div>
  `;
}

export function renderGameCompletePage(currentUser, points) {
  return `${Nav('games', currentUser)}
    <div class="games-hub-wrapper">
      <div id="gamesHubRoot" style="padding-top: 90px; padding-bottom: 60px;">
        ${completeGame(points)}
      </div>
    </div>
  `;
}
