interface PredictionPoint {
  date: string;
  price: number;
  upperBand: number;
  lowerBand: number;
}

/**
 * Simple linear regression prediction based on last N prices.
 * Returns next 7 days with confidence bands.
 */
export function predict(prices: number[], days = 7): PredictionPoint[] {
  const n = prices.length;
  if (n < 5) return [];

  const xMean = (n - 1) / 2;
  let yMean = 0;
  for (const p of prices) yMean += p;
  yMean /= n;

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const x = i - xMean;
    const y = prices[i] - yMean;
    num += x * y;
    den += x * x;
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;

  const residuals = prices.map((p, i) => Math.abs(p - (slope * i + intercept)));
  const mae = residuals.reduce((a, b) => a + b, 0) / n;

  const lastDate = new Date();
  const result: PredictionPoint[] = [];

  for (let i = 1; i <= days; i++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i);
    const predicted = slope * (n + i - 1) + intercept;
    result.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(predicted * 100) / 100,
      upperBand: Math.round((predicted + mae * 1.5) * 100) / 100,
      lowerBand: Math.round((predicted - mae * 1.5) * 100) / 100,
    });
  }

  return result;
}
