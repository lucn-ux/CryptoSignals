// Trading Signal Engine
// Generates realistic technical analysis signals for BTC/USD and ETH/USD

export type SignalType = 'BUY' | 'SELL' | 'HOLD';
export type TimeFrame = 'intraday' | 'swing';
export type Pair = 'BTCUSD' | 'ETHUSD';
export type SignalStrength = 'Strong' | 'Moderate' | 'Weak';

export interface TechnicalIndicator {
  name: string;
  value: number | string;
  signal: SignalType;
  description: string;
}

export interface TradingSignal {
  id: string;
  pair: Pair;
  type: SignalType;
  strength: SignalStrength;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: string;
  timeframe: TimeFrame;
  indicators: TechnicalIndicator[];
  confidence: number;
  timestamp: Date;
  reasoning: string;
}

export interface PriceData {
  time: string;
  price: number;
  volume: number;
}

// Simulated base prices
const BASE_PRICES: Record<Pair, number> = {
  BTCUSD: 67450,
  ETHUSD: 3520,
};

// Generate realistic price data
export function generatePriceData(pair: Pair, timeframe: TimeFrame): PriceData[] {
  const basePrice = BASE_PRICES[pair];
  const dataPoints = timeframe === 'intraday' ? 48 : 30;
  const data: PriceData[] = [];
  let currentPrice = basePrice * (0.97 + Math.random() * 0.06);
  
  for (let i = 0; i < dataPoints; i++) {
    const change = (Math.random() - 0.48) * (basePrice * 0.008);
    currentPrice += change;
    currentPrice = Math.max(currentPrice, basePrice * 0.92);
    currentPrice = Math.min(currentPrice, basePrice * 1.08);
    
    const time = timeframe === 'intraday' 
      ? `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`
      : `${i + 1}d`;
    
    data.push({
      time,
      price: Math.round(currentPrice * 100) / 100,
      volume: Math.round(Math.random() * 10000 + 5000),
    });
  }
  
  return data;
}

// Calculate RSI (simulated)
function calculateRSI(prices: number[]): number {
  const period = 14;
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - (100 / (1 + rs)));
}

// Calculate MACD (simulated)
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
  const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / Math.min(prices.length, 26);
  const macd = ema12 - ema26;
  const signal = macd * 0.8;
  const histogram = macd - signal;
  
  return {
    macd: Math.round(macd * 100) / 100,
    signal: Math.round(signal * 100) / 100,
    histogram: Math.round(histogram * 100) / 100,
  };
}

// Calculate Moving Averages
function calculateMA(prices: number[], period: number): number {
  const slice = prices.slice(-period);
  return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 100) / 100;
}

// Calculate Bollinger Bands
function calculateBollingerBands(prices: number[]): { upper: number; middle: number; lower: number } {
  const period = 20;
  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / slice.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: Math.round((middle + 2 * stdDev) * 100) / 100,
    middle: Math.round(middle * 100) / 100,
    lower: Math.round((middle - 2 * stdDev) * 100) / 100,
  };
}

// Generate trading signal
export function generateSignal(pair: Pair, timeframe: TimeFrame): TradingSignal {
  const priceData = generatePriceData(pair, timeframe);
  const prices = priceData.map(d => d.price);
  const currentPrice = prices[prices.length - 1];
  
  // Calculate indicators
  const rsi = calculateRSI(prices);
  const macd = calculateMACD(prices);
  const ma20 = calculateMA(prices, 20);
  const ma50 = calculateMA(prices, Math.min(50, prices.length));
  const bb = calculateBollingerBands(prices);
  
  // Generate indicators
  const indicators: TechnicalIndicator[] = [
    {
      name: 'RSI (14)',
      value: rsi,
      signal: rsi < 30 ? 'BUY' : rsi > 70 ? 'SELL' : 'HOLD',
      description: rsi < 30 ? 'Oversold - Potential reversal up' : rsi > 70 ? 'Overbought - Potential reversal down' : 'Neutral zone',
    },
    {
      name: 'MACD',
      value: `${macd.macd}`,
      signal: macd.histogram > 0 ? 'BUY' : macd.histogram < 0 ? 'SELL' : 'HOLD',
      description: macd.histogram > 0 ? 'Bullish momentum' : macd.histogram < 0 ? 'Bearish momentum' : 'Converging',
    },
    {
      name: 'MA 20',
      value: ma20,
      signal: currentPrice > ma20 ? 'BUY' : currentPrice < ma20 ? 'SELL' : 'HOLD',
      description: currentPrice > ma20 ? 'Price above MA20 - Bullish' : 'Price below MA20 - Bearish',
    },
    {
      name: 'MA 50',
      value: ma50,
      signal: currentPrice > ma50 ? 'BUY' : currentPrice < ma50 ? 'SELL' : 'HOLD',
      description: currentPrice > ma50 ? 'Price above MA50 - Bullish' : 'Price below MA50 - Bearish',
    },
    {
      name: 'Bollinger Bands',
      value: `${bb.lower} - ${bb.upper}`,
      signal: currentPrice < bb.lower ? 'BUY' : currentPrice > bb.upper ? 'SELL' : 'HOLD',
      description: currentPrice < bb.lower ? 'Below lower band - Oversold' : currentPrice > bb.upper ? 'Above upper band - Overbought' : 'Within bands',
    },
    {
      name: 'Volume',
      value: `${Math.round(prices.length * 1000 + Math.random() * 5000)}`,
      signal: Math.random() > 0.5 ? 'BUY' : 'HOLD',
      description: Math.random() > 0.5 ? 'Increasing volume confirms trend' : 'Average volume',
    },
  ];
  
  // Determine overall signal
  const buyCount = indicators.filter(i => i.signal === 'BUY').length;
  const sellCount = indicators.filter(i => i.signal === 'SELL').length;
  
  let overallSignal: SignalType;
  let strength: SignalStrength;
  let confidence: number;
  
  if (buyCount >= 4) {
    overallSignal = 'BUY';
    strength = buyCount >= 5 ? 'Strong' : 'Moderate';
    confidence = 65 + Math.random() * 25;
  } else if (sellCount >= 4) {
    overallSignal = 'SELL';
    strength = sellCount >= 5 ? 'Strong' : 'Moderate';
    confidence = 65 + Math.random() * 25;
  } else {
    overallSignal = 'HOLD';
    strength = 'Weak';
    confidence = 40 + Math.random() * 20;
  }
  
  // Calculate targets
  const volatility = pair === 'BTCUSD' ? 0.025 : 0.03;
  const multiplier = timeframe === 'intraday' ? 0.5 : 1.5;
  
  let entryPrice: number, targetPrice: number, stopLoss: number;
  
  if (overallSignal === 'BUY') {
    entryPrice = currentPrice;
    targetPrice = currentPrice * (1 + volatility * multiplier);
    stopLoss = currentPrice * (1 - volatility * 0.6);
  } else if (overallSignal === 'SELL') {
    entryPrice = currentPrice;
    targetPrice = currentPrice * (1 - volatility * multiplier);
    stopLoss = currentPrice * (1 + volatility * 0.6);
  } else {
    entryPrice = currentPrice;
    targetPrice = currentPrice * (1 + volatility * 0.3);
    stopLoss = currentPrice * (1 - volatility * 0.3);
  }
  
  const riskRewardRatio = `1:${(Math.abs(targetPrice - entryPrice) / Math.abs(entryPrice - stopLoss)).toFixed(1)}`;
  
  const reasonings = {
    BUY: `${pair === 'BTCUSD' ? 'Bitcoin' : 'Ethereum'} showing bullish momentum with ${buyCount} out of 6 indicators confirming upward movement. RSI at ${rsi} indicates ${rsi < 40 ? 'room for upside' : 'sustained buying pressure'}. MACD histogram positive confirms trend.`,
    SELL: `${pair === 'BTCUSD' ? 'Bitcoin' : 'Ethereum'} showing bearish pressure with ${sellCount} out of 6 indicators confirming downward movement. RSI at ${rsi} indicates ${rsi > 60 ? 'exhaustion' : 'continued selling'}. Consider reducing exposure.`,
    HOLD: `${pair === 'BTCUSD' ? 'Bitcoin' : 'Ethereum'} in consolidation phase. Mixed signals from indicators suggest waiting for clearer direction. RSI at ${rsi} is neutral. Wait for breakout confirmation.`,
  };
  
  return {
    id: `${pair}-${timeframe}-${Date.now()}`,
    pair,
    type: overallSignal,
    strength,
    entryPrice: Math.round(entryPrice * 100) / 100,
    targetPrice: Math.round(targetPrice * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    riskRewardRatio,
    timeframe,
    indicators,
    confidence: Math.round(confidence),
    timestamp: new Date(),
    reasoning: reasonings[overallSignal],
  };
}

// Get current price
export function getCurrentPrice(pair: Pair): number {
  const base = BASE_PRICES[pair];
  const change = (Math.random() - 0.5) * base * 0.01;
  return Math.round((base + change) * 100) / 100;
}

// Get price change
export function getPriceChange(pair: Pair): { change: number; percent: number } {
  const base = BASE_PRICES[pair];
  const change = (Math.random() - 0.45) * base * 0.03;
  const percent = (change / base) * 100;
  return {
    change: Math.round(change * 100) / 100,
    percent: Math.round(percent * 100) / 100,
  };
}
