// Trading Signal Engine
// Uses real market data to generate technical analysis signals for BTC/USD and ETH/USD

import { fetchKlines, type KlineData } from './cryptoApi';

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

// Calculate RSI
function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - (100 / (1 + rs)));
}

// Calculate EMA
function calculateEMA(data: number[], period: number): number {
  if (data.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

// Calculate MACD
function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
  if (closes.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  
  const ema12 = calculateEMA(closes.slice(-26), 12);
  const ema26 = calculateEMA(closes.slice(-26), 26);
  const macd = ema12 - ema26;
  const signal = macd * 0.85;
  const histogram = macd - signal;
  
  return {
    macd: Math.round(macd * 100) / 100,
    signal: Math.round(signal * 100) / 100,
    histogram: Math.round(histogram * 100) / 100,
  };
}

// Calculate Simple Moving Average
function calculateSMA(data: number[], period: number): number {
  const slice = data.slice(-period);
  if (slice.length === 0) return 0;
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

// Calculate Bollinger Bands
function calculateBollingerBands(closes: number[], period: number = 20): { upper: number; middle: number; lower: number } {
  const slice = closes.slice(-period);
  if (slice.length < period) {
    const middle = slice.reduce((a, b) => a + b, 0) / slice.length;
    return { upper: middle * 1.02, middle, lower: middle * 0.98 };
  }
  
  const middle = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / slice.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: Math.round((middle + 2 * stdDev) * 100) / 100,
    middle: Math.round(middle * 100) / 100,
    lower: Math.round((middle - 2 * stdDev) * 100) / 100,
  };
}

// Calculate Stochastic Oscillator
function calculateStochastic(klines: KlineData[], period: number = 14): number {
  if (klines.length < period) return 50;
  
  const slice = klines.slice(-period);
  const highestHigh = Math.max(...slice.map(k => k.high));
  const lowestLow = Math.min(...slice.map(k => k.low));
  const currentClose = slice[slice.length - 1].close;
  
  if (highestHigh === lowestLow) return 50;
  
  return Math.round(((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100);
}

// Calculate ATR (Average True Range) for volatility
function calculateATR(klines: KlineData[], period: number = 14): number {
  if (klines.length < period + 1) return 0;
  
  let totalTR = 0;
  for (let i = klines.length - period; i < klines.length; i++) {
    const high = klines[i].high;
    const low = klines[i].low;
    const prevClose = klines[i - 1]?.close || klines[i].open;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    totalTR += tr;
  }
  
  return totalTR / period;
}

// Generate trading signal from real kline data
export function generateSignalFromData(
  pair: Pair,
  timeframe: TimeFrame,
  klines: KlineData[]
): TradingSignal {
  if (klines.length < 10) {
    // Fallback if insufficient data
    return generateFallbackSignal(pair, timeframe);
  }
  
  const closes = klines.map(k => k.close);
  const currentPrice = closes[closes.length - 1];
  
  // Calculate indicators from real data
  const rsi = calculateRSI(closes);
  const macd = calculateMACD(closes);
  const ma20 = calculateSMA(closes, 20);
  const ma50 = calculateSMA(closes, Math.min(50, closes.length));
  const bb = calculateBollingerBands(closes);
  const stoch = calculateStochastic(klines);
  const atr = calculateATR(klines);
  
  // Build indicators array
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
      value: Math.round(ma20 * 100) / 100,
      signal: currentPrice > ma20 ? 'BUY' : currentPrice < ma20 ? 'SELL' : 'HOLD',
      description: currentPrice > ma20 ? 'Price above MA20 - Bullish' : 'Price below MA20 - Bearish',
    },
    {
      name: 'MA 50',
      value: Math.round(ma50 * 100) / 100,
      signal: currentPrice > ma50 ? 'BUY' : currentPrice < ma50 ? 'SELL' : 'HOLD',
      description: currentPrice > ma50 ? 'Price above MA50 - Bullish' : 'Price below MA50 - Bearish',
    },
    {
      name: 'Bollinger Bands',
      value: `${Math.round(bb.lower)} - ${Math.round(bb.upper)}`,
      signal: currentPrice < bb.lower ? 'BUY' : currentPrice > bb.upper ? 'SELL' : 'HOLD',
      description: currentPrice < bb.lower ? 'Below lower band - Oversold' : currentPrice > bb.upper ? 'Above upper band - Overbought' : 'Within bands',
    },
    {
      name: 'Stochastic',
      value: stoch,
      signal: stoch < 20 ? 'BUY' : stoch > 80 ? 'SELL' : 'HOLD',
      description: stoch < 20 ? 'Oversold territory' : stoch > 80 ? 'Overbought territory' : 'Neutral range',
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
    confidence = Math.min(92, 65 + buyCount * 5);
  } else if (sellCount >= 4) {
    overallSignal = 'SELL';
    strength = sellCount >= 5 ? 'Strong' : 'Moderate';
    confidence = Math.min(92, 65 + sellCount * 5);
  } else {
    overallSignal = 'HOLD';
    strength = 'Weak';
    confidence = 40 + Math.round(Math.random() * 15);
  }
  
  // Calculate targets using ATR for realistic stop/target placement
  const multiplier = timeframe === 'intraday' ? 1 : 2;
  const riskATR = atr || currentPrice * 0.015;
  
  let entryPrice: number, targetPrice: number, stopLoss: number;
  
  if (overallSignal === 'BUY') {
    entryPrice = currentPrice;
    targetPrice = currentPrice + riskATR * multiplier * 1.5;
    stopLoss = currentPrice - riskATR * multiplier;
  } else if (overallSignal === 'SELL') {
    entryPrice = currentPrice;
    targetPrice = currentPrice - riskATR * multiplier * 1.5;
    stopLoss = currentPrice + riskATR * multiplier;
  } else {
    entryPrice = currentPrice;
    targetPrice = currentPrice + riskATR * 0.5;
    stopLoss = currentPrice - riskATR * 0.5;
  }
  
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(targetPrice - entryPrice);
  const rrRatio = risk > 0 ? (reward / risk).toFixed(1) : '1.0';
  
  const pairName = pair === 'BTCUSD' ? 'Bitcoin' : 'Ethereum';
  const reasonings = {
    BUY: `${pairName} showing bullish momentum with ${buyCount}/6 indicators confirming upward movement. RSI at ${rsi} indicates ${rsi < 40 ? 'room for upside' : 'sustained buying pressure'}. MACD histogram at ${macd.histogram} confirms trend direction. ATR-based targets provide realistic risk management.`,
    SELL: `${pairName} showing bearish pressure with ${sellCount}/6 indicators confirming downward movement. RSI at ${rsi} indicates ${rsi > 60 ? 'exhaustion' : 'continued selling'}. Consider reducing exposure with proper risk management.`,
    HOLD: `${pairName} in consolidation phase. Mixed signals from indicators suggest waiting for clearer direction. RSI at ${rsi} is neutral. Wait for breakout confirmation before entering positions.`,
  };
  
  return {
    id: `${pair}-${timeframe}-${Date.now()}`,
    pair,
    type: overallSignal,
    strength,
    entryPrice: Math.round(entryPrice * 100) / 100,
    targetPrice: Math.round(targetPrice * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    riskRewardRatio: `1:${rrRatio}`,
    timeframe,
    indicators,
    confidence,
    timestamp: new Date(),
    reasoning: reasonings[overallSignal],
  };
}

// Fallback signal when API data is unavailable
function generateFallbackSignal(pair: Pair, timeframe: TimeFrame): TradingSignal {
  return {
    id: `${pair}-${timeframe}-${Date.now()}`,
    pair,
    type: 'HOLD',
    strength: 'Weak',
    entryPrice: 0,
    targetPrice: 0,
    stopLoss: 0,
    riskRewardRatio: 'N/A',
    timeframe,
    indicators: [],
    confidence: 0,
    timestamp: new Date(),
    reasoning: 'Unable to fetch market data. Please check your internet connection and try again.',
  };
}

// Fetch real kline data and generate signal
export async function fetchAndGenerateSignal(
  pair: Pair,
  timeframe: TimeFrame
): Promise<TradingSignal> {
  try {
    const klines = await fetchKlines(pair, timeframe);
    if (klines.length === 0) {
      return generateFallbackSignal(pair, timeframe);
    }
    return generateSignalFromData(pair, timeframe, klines);
  } catch (error) {
    console.error('Error generating signal:', error);
    return generateFallbackSignal(pair, timeframe);
  }
}

// Get kline data for chart
export async function fetchChartData(
  pair: Pair,
  timeframe: TimeFrame
): Promise<KlineData[]> {
  return fetchKlines(pair, timeframe);
}
