export const badgeCatalog = [
  { key: 'first-topic', label: 'First Topic Completed', requirement: 'Complete one topic' },
  { key: 'streak-3', label: '3 Day Streak', requirement: 'Reach a 3 day streak' },
  { key: 'streak-7', label: '7 Day Streak', requirement: 'Reach a 7 day streak' },
  { key: 'python-basics', label: 'Python Basics Completed', requirement: 'Complete 10 Python topics' },
  { key: 'quiz-master', label: 'Quiz Master', requirement: 'Score 80%+ on quizzes' },
  { key: 'code-runner', label: 'Code Runner', requirement: 'Run code in the compiler' },
  { key: 'challenge-solver', label: 'Challenge Solver', requirement: 'Pass a coding challenge' },
];

export const buildGamificationProfile = (summary = {}, user = {}) => {
  const overall = summary.overall || {};
  const completedTopics = overall.completedTopics || 0;
  const currentStreak = overall.currentStreak || 0;
  const totalLearningMinutes = overall.totalLearningMinutes || 0;
  const averageQuizScore = overall.averageQuizScore || 0;
  const solvedChallenges = overall.solvedChallenges || 0;
  const xp = overall.xp ?? (completedTopics * 100 + currentStreak * 40 + Math.round(totalLearningMinutes / 5) + Math.round(averageQuizScore * 2) + solvedChallenges * 150);
  const rank = overall.rank || (xp >= 3000 ? 'Diamond' : xp >= 2000 ? 'Platinum' : xp >= 1000 ? 'Gold' : xp >= 400 ? 'Silver' : 'Bronze');
  const unlockedKeys = new Set([
    completedTopics >= 1 ? 'first-topic' : '',
    currentStreak >= 3 ? 'streak-3' : '',
    currentStreak >= 7 ? 'streak-7' : '',
    completedTopics >= 10 ? 'python-basics' : '',
    averageQuizScore >= 80 ? 'quiz-master' : '',
    totalLearningMinutes > 0 || completedTopics > 0 ? 'code-runner' : '',
    solvedChallenges >= 1 ? 'challenge-solver' : '',
  ].filter(Boolean));

  const badges = badgeCatalog.map((badge) => ({
    ...badge,
    unlocked: unlockedKeys.has(badge.key),
  }));

  return {
    xp,
    rank,
    nextRankXp: rank === 'Diamond' ? 4000 : rank === 'Platinum' ? 3000 : rank === 'Gold' ? 2000 : rank === 'Silver' ? 1000 : 400,
    badges,
    dailyChallenge: {
      title: completedTopics ? 'Keep your streak alive' : 'Complete your first topic',
      progress: completedTopics ? 100 : 0,
      reward: 75,
    },
    weeklyGoal: {
      title: 'Learn on 5 days this week',
      completed: Math.min(5, overall.weeklyActiveDays || 0),
      target: 5,
      reward: 250,
    },
    achievement: badges.find((badge) => badge.unlocked)?.label || 'Start your first achievement',
    leaderboard: (summary.leaderboard || [])
      .sort((first, second) => second.xp - first.xp)
      .slice(0, 10),
  };
};
