import { Nav } from './Nav.js';
import {
  renderGamesHub,
  startGame,
  completeGame,
  exitGame,
  getRecommendedGames,
  initGamesHub,
} from '../games-hub.js';

export function GamesHubPage() {
  return `${Nav('games', null)}
    <div id="gamesHubContent" style="padding-top: 90px; padding-bottom: 60px;">
      ${renderGamesHub()}
    </div>
  `;
}

export function renderGamePage(gameId) {
  return `${Nav('games', null)}
    <div id="gamesHubContent" style="padding-top: 90px; padding-bottom: 60px;">
      ${startGame(gameId)}
    </div>
  `;
}

export function renderGameCompletePage(points) {
  return `${Nav('games', null)}
    <div id="gamesHubContent" style="padding-top: 90px; padding-bottom: 60px;">
      ${completeGame(points)}
    </div>
  `;
}
