/**
 * Mental Wellness Games Hub - Data Configuration
 * Mood-based game recommendations and game definitions
 */

export const moodEmojis = {
  1: '😢', // Very Low
  2: '😔', // Low
  3: '😐', // Neutral
  4: '😊', // Good
  5: '😄', // Great
};

export const moodLabels = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Great',
};

export const gameCategories = {
  MEMORY: 'Memory Challenge',
  PUZZLE: 'Puzzle Master',
  COLORING: 'Digital Coloring',
  FOCUS: 'Focus Challenge',
  TRIVIA: 'Positive Trivia',
};

export const games = [
  {
    id: 'memory-1',
    name: 'Memory Match',
    category: gameCategories.MEMORY,
    description: 'Flip cards to find matching pairs',
    icon: '🧠',
    difficulty: 'easy',
    duration: '5 mins',
    points: 50,
    moods: [1, 2, 3, 4, 5],
    bestFor: ['Stressed', 'Sad', 'Tired'],
    benefits: 'Improves concentration and memory',
  },
  {
    id: 'memory-2',
    name: 'Sequence Challenge',
    category: gameCategories.MEMORY,
    description: 'Remember and repeat increasingly complex sequences',
    icon: '🎯',
    difficulty: 'medium',
    duration: '8 mins',
    points: 75,
    moods: [1, 2, 3, 4],
    bestFor: ['Stressed', 'Angry'],
    benefits: 'Enhances focus and patience',
  },
  {
    id: 'puzzle-1',
    name: 'Block Puzzle',
    category: gameCategories.PUZZLE,
    description: 'Arrange blocks to complete rows and columns',
    icon: '🧩',
    difficulty: 'easy',
    duration: '10 mins',
    points: 60,
    moods: [2, 3, 4, 5],
    bestFor: ['Tired', 'Sad', 'Stressed'],
    benefits: 'Logical thinking and problem-solving',
  },
  {
    id: 'puzzle-2',
    name: 'Sliding Puzzle',
    category: gameCategories.PUZZLE,
    description: 'Rearrange tiles to complete the picture',
    icon: '📸',
    difficulty: 'medium',
    duration: '8 mins',
    points: 70,
    moods: [1, 2, 3, 4, 5],
    bestFor: ['All moods'],
    benefits: 'Spatial reasoning and patience',
  },
  {
    id: 'coloring-1',
    name: 'Relaxing Coloring',
    category: gameCategories.COLORING,
    description: 'Color beautiful digital art designs',
    icon: '🎨',
    difficulty: 'easy',
    duration: '15 mins',
    points: 40,
    moods: [1, 2, 3, 4, 5],
    bestFor: ['Stressed', 'Angry', 'Sad'],
    benefits: 'Stress relief and creative expression',
  },
  {
    id: 'coloring-2',
    name: 'Mandala Art',
    category: gameCategories.COLORING,
    description: 'Create symmetrical mandala patterns',
    icon: '✨',
    difficulty: 'medium',
    duration: '12 mins',
    points: 55,
    moods: [1, 2, 3, 4, 5],
    bestFor: ['Stressed', 'Sad'],
    benefits: 'Mindfulness and relaxation',
  },
  {
    id: 'focus-1',
    name: 'Spot the Difference',
    category: gameCategories.FOCUS,
    description: 'Find all the differences between two images',
    icon: '👀',
    difficulty: 'easy',
    duration: '7 mins',
    points: 45,
    moods: [2, 3, 4, 5],
    bestFor: ['Tired', 'Stressed'],
    benefits: 'Sharpens observation and attention',
  },
  {
    id: 'focus-2',
    name: 'Pattern Rush',
    category: gameCategories.FOCUS,
    description: 'React quickly to changing patterns',
    icon: '⚡',
    difficulty: 'hard',
    duration: '6 mins',
    points: 85,
    moods: [3, 4, 5],
    bestFor: ['Good mood', 'Great mood'],
    benefits: 'Reflexes and quick thinking',
  },
  {
    id: 'trivia-1',
    name: 'Positivity Quiz',
    category: gameCategories.TRIVIA,
    description: 'Uplifting questions about wellness and happiness',
    icon: '✨',
    difficulty: 'easy',
    duration: '8 mins',
    points: 50,
    moods: [1, 2, 3, 4, 5],
    bestFor: ['Sad', 'Low', 'Tired'],
    benefits: 'Mood boost and mental health awareness',
  },
  {
    id: 'trivia-2',
    name: 'Wellness Wisdom',
    category: gameCategories.TRIVIA,
    description: 'Learn interesting facts about mental wellness',
    icon: '🧠',
    difficulty: 'medium',
    duration: '10 mins',
    points: 65,
    moods: [1, 2, 3, 4, 5],
    bestFor: ['All moods'],
    benefits: 'Mental health education',
  },
];

// Helper function to get games by category
export const getGamesByCategory = (category) => {
  return games.filter((game) => game.category === category);
};

// Helper function to get games by mood
export const getGamesByMood = (mood) => {
  return games.filter((game) => game.moods.includes(mood));
};

// Helper function to get game by ID
export const getGameById = (id) => {
  return games.find((game) => game.id === id);
};

// Helper function to get total points available
export const getTotalPointsAvailable = () => {
  return games.reduce((total, game) => total + game.points, 0);
};

export const badges = [
  {
    id: 'first-game',
    name: 'Game Starter',
    icon: '🎮',
    requirement: 1,
    description: 'Play your first wellness game',
  },
  {
    id: 'game-master',
    name: 'Game Master',
    icon: '👑',
    requirement: 25,
    description: 'Complete 25 games',
  },
  {
    id: 'wellness-warrior',
    name: 'Wellness Warrior',
    icon: '⚔️',
    requirement: 50,
    description: 'Complete 50 games',
  },
  {
    id: 'calm-collector',
    name: 'Calm Collector',
    icon: '🧘',
    requirement: 100,
    description: 'Earn 1000 points',
  },
  {
    id: 'memory-champion',
    name: 'Memory Champion',
    icon: '🧠',
    requirement: 10,
    description: 'Complete 10 memory games',
  },
  {
    id: 'puzzle-pro',
    name: 'Puzzle Pro',
    icon: '🧩',
    requirement: 10,
    description: 'Complete 10 puzzle games',
  },
  {
    id: 'color-artist',
    name: 'Color Artist',
    icon: '🎨',
    requirement: 10,
    description: 'Complete 10 coloring games',
  },
  {
    id: 'focus-finder',
    name: 'Focus Finder',
    icon: '👀',
    requirement: 10,
    description: 'Complete 10 focus games',
  },
];

// Helper function to check if user qualifies for a badge
export const checkBadgeEligibility = (badgeId, userStats) => {
  const badge = badges.find((b) => b.id === badgeId);
  if (!badge) return false;

  switch (badgeId) {
    case 'first-game':
      return userStats.gamesPlayed >= 1;
    case 'game-master':
      return userStats.gamesPlayed >= 25;
    case 'wellness-warrior':
      return userStats.gamesPlayed >= 50;
    case 'calm-collector':
      return userStats.totalPoints >= 1000;
    case 'memory-champion':
      return (userStats.memoryGamesPlayed || 0) >= 10;
    case 'puzzle-pro':
      return (userStats.puzzleGamesPlayed || 0) >= 10;
    case 'color-artist':
      return (userStats.coloringGamesPlayed || 0) >= 10;
    case 'focus-finder':
      return (userStats.focusGamesPlayed || 0) >= 10;
    default:
      return false;
  }
};

export const trivia = [
  {
    id: 0,
    question: 'What is the best way to manage stress?',
    options: ['Deep breathing', 'Exercise', 'Mindfulness', 'All of the above'],
    correct: 3,
    fact: 'A combination of breathing exercises, regular exercise, and mindfulness can effectively manage stress!',
  },
  {
    id: 1,
    question: 'How many minutes of exercise is recommended daily?',
    options: ['10 minutes', '15 minutes', '30 minutes', '60 minutes'],
    correct: 2,
    fact: 'The WHO recommends at least 30 minutes of moderate-intensity exercise most days of the week.',
  },
  {
    id: 2,
    question: 'What does "mindfulness" mean?',
    options: [
      'Being very intelligent',
      'Being present in the moment',
      'Having a good memory',
      'All of the above',
    ],
    correct: 1,
    fact: 'Mindfulness is the practice of focusing on the present moment without judgment.',
  },
  {
    id: 3,
    question: 'Which activity best promotes better sleep?',
    options: [
      'Watching TV before bed',
      'Regular exercise during the day',
      'Drinking coffee in the evening',
      'Using your phone late at night',
    ],
    correct: 1,
    fact: 'Regular daytime exercise can significantly improve sleep quality and duration.',
  },
  {
    id: 4,
    question: 'What is a healthy way to express emotions?',
    options: [
      'Bottling them up',
      'Journaling or talking to someone',
      'Ignoring them',
      'Only sharing negative emotions',
    ],
    correct: 1,
    fact: 'Journaling and talking about your feelings are proven healthy ways to manage emotions.',
  },
  {
    id: 5,
    question: 'How much water should you drink daily?',
    options: ['2 cups', '4 cups', '8 cups', '16 cups'],
    correct: 2,
    fact: 'Drinking about 8 glasses (2 liters) of water daily is a good general guideline for most people.',
  },
  {
    id: 6,
    question: 'What is a symptom of good mental health?',
    options: [
      'Never feeling stressed',
      'Ability to cope with stress',
      'Avoiding all challenges',
      'Having no emotions',
    ],
    correct: 1,
    fact: 'Good mental health includes the ability to manage stress and emotions effectively.',
  },
  {
    id: 7,
    question: 'How can you improve your mood quickly?',
    options: [
      'Go for a walk',
      'Listen to music',
      'Spend time with friends',
      'All of the above',
    ],
    correct: 3,
    fact: 'Multiple activities like walking, music, and socializing can boost your mood!',
  },
];

// Helper function to get random trivia questions
export const getRandomTriviaQuestions = (count = 5) => {
  const shuffled = [...trivia];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
};

// Helper function to get trivia by ID
export const getTriviaById = (id) => {
  return trivia.find((t) => t.id === id);
};

export const motivationalMessages = [
  'Take 5 minutes to relax and breathe.',
  'Great job taking care of your mental health!',
  'You are doing amazing! Keep it up! 💪',
  'Remember to take breaks between activities.',
  'Your well-being matters. Rest when you need to.',
  'Small steps lead to big changes! 🌟',
  'You deserve to feel good about yourself.',
  'Taking care of your mind is taking care of yourself.',
  'Progress over perfection! 🎯',
  'Every moment is a chance to reset and restart.',
  'Your mental health is a priority. 🌿',
  'You are stronger than you think! 💪',
  'This too shall pass. ✨',
  'Be kind to yourself today. 💖',
];

// Helper function to get random motivational message
export const getRandomMotivationalMessage = () => {
  return motivationalMessages[
    Math.floor(Math.random() * motivationalMessages.length)
  ];
};

export const gameMoodRecommendations = {
  1: {
    // Very Low
    emoji: '😢',
    label: 'Very Low',
    message: 'You might need something calming right now.',
    recommended: [
      'coloring-1',
      'coloring-2',
      'trivia-1',
      'memory-1',
      'puzzle-1',
    ],
    tip: "Take your time. There's no rush. Try a relaxing coloring game or uplifting trivia.",
  },
  2: {
    // Low
    emoji: '😔',
    label: 'Low',
    message: "Let's find something to lift your mood.",
    recommended: ['trivia-1', 'coloring-1', 'memory-1', 'puzzle-1', 'trivia-2'],
    tip: 'Positive trivia or coloring might help you feel better!',
  },
  3: {
    // Neutral
    emoji: '😐',
    label: 'Neutral',
    message: "Let's engage your mind with a fun challenge.",
    recommended: ['memory-1', 'puzzle-1', 'focus-1', 'memory-2', 'puzzle-2'],
    tip: 'Try a memory game or puzzle to keep your mind sharp!',
  },
  4: {
    // Good
    emoji: '😊',
    label: 'Good',
    message: "You're in a great mood to tackle some challenges!",
    recommended: ['focus-2', 'memory-2', 'puzzle-2', 'trivia-2', 'focus-1'],
    tip: 'Why not try a more challenging game?',
  },
  5: {
    // Great
    emoji: '😄',
    label: 'Great',
    message: "You're feeling amazing! Let's challenge yourself!",
    recommended: ['focus-2', 'memory-2', 'puzzle-2', 'trivia-2', 'focus-1'],
    tip: "You're ready for the hardest challenges. Let's go!",
  },
};

// Helper function to get mood recommendation by mood value
export const getMoodRecommendation = (mood) => {
  return gameMoodRecommendations[mood] || gameMoodRecommendations[3];
};

export const coloringPatterns = [
  { name: 'Flower', colors: ['#FF69B4', '#FFB6C1', '#FFC0CB'] },
  { name: 'Ocean', colors: ['#0066CC', '#3399FF', '#66CCFF'] },
  { name: 'Sunset', colors: ['#FF6B35', '#FF8C42', '#FFB340'] },
  { name: 'Forest', colors: ['#228B22', '#32CD32', '#90EE90'] },
  { name: 'Galaxy', colors: ['#4B0082', '#9370DB', '#DDA0DD'] },
];

// Helper function to get random coloring pattern
export const getRandomColoringPattern = () => {
  return coloringPatterns[Math.floor(Math.random() * coloringPatterns.length)];
};

export const pointsPerGame = {
  easy: 50,
  medium: 75,
  hard: 100,
};

export const rewards = {
  gameComplete: 10,
  perfectScore: 25,
  streakBonus: 50,
  dailyBonus: 100,
};

// Default export for convenience
export default {
  moodEmojis,
  moodLabels,
  gameCategories,
  games,
  getGamesByCategory,
  getGamesByMood,
  getGameById,
  getTotalPointsAvailable,
  badges,
  checkBadgeEligibility,
  trivia,
  getRandomTriviaQuestions,
  getTriviaById,
  motivationalMessages,
  getRandomMotivationalMessage,
  gameMoodRecommendations,
  getMoodRecommendation,
  coloringPatterns,
  getRandomColoringPattern,
  pointsPerGame,
  rewards,
};
