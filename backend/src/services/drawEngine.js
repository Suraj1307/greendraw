const DRAW_SIZE = 5;
const MIN_NUMBER = 1;
const MAX_NUMBER = 45;

const getRandomUniqueNumbers = () => {
  const values = new Set();

  while (values.size < DRAW_SIZE) {
    values.add(Math.floor(Math.random() * MAX_NUMBER) + MIN_NUMBER);
  }

  return [...values].sort((a, b) => a - b);
};

export const generateRandomDrawNumbers = () => getRandomUniqueNumbers();

export const generateAlgorithmicDrawNumbers = (scores = []) => {
  if (scores.length === 0) {
    return getRandomUniqueNumbers();
  }

  const frequency = new Map();
  for (const score of scores) {
    frequency.set(score.value, (frequency.get(score.value) || 0) + 1);
  }

  const sortedByFrequency = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .map(([value]) => value);

  const leastFrequent = [...frequency.entries()]
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .map(([value]) => value);

  const combined = [...new Set([...sortedByFrequency.slice(0, 3), ...leastFrequent.slice(0, 2)])]
    .filter((value) => value >= MIN_NUMBER && value <= MAX_NUMBER);

  while (combined.length < DRAW_SIZE) {
    const candidate = Math.floor(Math.random() * MAX_NUMBER) + MIN_NUMBER;
    if (!combined.includes(candidate)) {
      combined.push(candidate);
    }
  }

  return combined.slice(0, DRAW_SIZE).sort((a, b) => a - b);
};

export const generateDrawNumbers = (mode, scores = []) => {
  if (mode === "algorithmic") {
    return generateAlgorithmicDrawNumbers(scores);
  }

  return generateRandomDrawNumbers();
};

export const getMatchResult = (drawNumbers, userNumbers) => {
  const matchedNumbers = userNumbers
    .filter((value) => drawNumbers.includes(value))
    .sort((a, b) => a - b);
  const matchedCount = matchedNumbers.length;

  let prizeTier = null;
  if (matchedCount === 5) {
    prizeTier = "5-match";
  } else if (matchedCount === 4) {
    prizeTier = "4-match";
  } else if (matchedCount === 3) {
    prizeTier = "3-match";
  }

  return {
    matchedNumbers,
    matchedCount,
    prizeTier
  };
};

export const buildWinnerSummary = ({ userId, userName, userEmail, drawNumbers, userNumbers }) => {
  const match = getMatchResult(drawNumbers, userNumbers);

  return {
    userId,
    userName,
    userEmail,
    userNumbers,
    matchedCount: match.matchedCount,
    matchedNumbers: match.matchedNumbers,
    prizeTier: match.prizeTier
  };
};
