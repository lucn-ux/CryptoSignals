// Trading Signal Engine
// Uses real market data to generate technical analysis signals for BTC/USD and ETH/USD
// Supports multiple Risk:Reward ratio variants (1:2, 1:3, 1:4)

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
  rrMultiple: number; // The R:R multiplier (e.g., 2 for 1:2, 3 for 1:3)
  timeframe: TimeFrame;
  indicators: TechnicalIndicator[];
  confidence: number;
  probability: number; // Estimated win probability based on R:R
  timestamp: Date;
  reasoning: string;
  potentialProfit: number; // % potential profit
  potentialLoss: number; // % potential loss
}

export interface SignalAnalysis {
  baseSignal: SignalType;
  strength: SignalStrength;
  indicators: TechnicalIndicator[];
  confidence: number;
  reasoning: string;
  atr: number;
  currentPrice: number;
  buyCount: number;
  sellCount: number;
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

// Analyze market conditions (shared across all R:R variants)
function analyzeMarket(pair: Pair, klines: KlineData[]): SignalAnalysis | null {
  if (klines.length < 10) return null;
  
  const closes = klines.map(k => k.close);
  const currentPrice = closes[closes.length - 1];
  
  const rsi = calculateRSI(closes);
  const macd = calculateMACD(closes);
  const ma20 = calculateSMA(closes, 20);
  const ma50 = calculateSMA(closes, Math.min(50, closes.length));
  const bb = calculateBollingerBands(closes);
  const stoch = calculateStochastic(klines);
  const atr = calculateATR(klines);
  
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
  
  const buyCount = indicators.filter(i => i.signal === 'BUY').length;
  const sellCount = indicators.filter(i => i.signal === 'SELL').length;
  
  let baseSignal: SignalType;
  let strength: SignalStrength;
  let confidence: number;
  
  if (buyCount >= 4) {
    baseSignal = 'BUY';
    strength = buyCount >= 5 ? 'Strong' : 'Moderate';
    confidence = Math.min(92, 65 + buyCount * 5);
  } else if (sellCount >= 4) {
    baseSignal = 'SELL';
    strength = sellCount >= 5 ? 'Strong' : 'Moderate';
    confidence = Math.min(92, 65 + sellCount * 5);
  } else {
    baseSignal = 'HOLD';
    strength = 'Weak';
    confidence = 40 + Math.round(Math.random() * 15);
  }
  
  const pairName = pair === 'BTCUSD' ? 'Bitcoin' : 'Ethereum';
  const reasoning = baseSignal === 'BUY'
    ? `${pairName} showing bullish momentum with ${buyCount}/6 indicators confirming upward movement. RSI at ${rsi} indicates ${rsi < 40 ? 'room for upside' : 'sustained buying pressure'}. MACD histogram at ${macd.histogram} confirms trend direction.`
    : baseSignal === 'SELL'
    ? `${pairName} showing bearish pressure with ${sellCount}/6 indicators confirming downward movement. RSI at ${rsi} indicates ${rsi > 60 ? 'exhaustion' : 'continued selling'}. Consider reducing exposure.`
    : `${pairName} in consolidation phase. Mixed signals from indicators suggest waiting for clearer direction. RSI at ${rsi} is neutral.`;
  
  return {
    baseSignal,
    strength,
    indicators,
    confidence,
    reasoning,
    atr: atr || currentPrice * 0.015,
    currentPrice,
    buyCount,
    sellCount,
  };
}

// Generate multiple signal variants with different R:R ratios
export function generateSignalVariants(
  pair: Pair,
  timeframe: TimeFrame,
  klines: KlineData[]
): TradingSignal[] {
  const analysis = analyzeMarket(pair, klines);
  
  if (!analysis || analysis.baseSignal === 'HOLD') {
    // Return a single HOLD signal if market is neutral
    return [{
      id: `${pair}-${timeframe}-hold-${Date.now()}`,
      pair,
      type: 'HOLD',
      strength: 'Weak',
      entryPrice: analysis?.currentPrice || 0,
      targetPrice: 0,
      stopLoss: 0,
      riskRewardRatio: 'N/A',
      rrMultiple: 0,
      timeframe,
      indicators: analysis?.indicators || [],
      confidence: analysis?.confidence || 0,
      probability: 0,
      timestamp: new Date(),
      reasoning: analysis?.reasoning || 'Market in consolidation. Wait for clearer direction.',
      potentialProfit: 0,
      potentialLoss: 0,
    }];
  }
  
  const { baseSignal, strength, indicators, confidence, reasoning, atr, currentPrice } = analysis;
  const isBuy = baseSignal === 'BUY';
  
  // Define R:R variants with their characteristics
  const rrVariants = [
    { 
      multiple: 2, 
      label: '1:2',
      // Conservative - tighter stop, moderate target
      stopMultiplier: 1.0,
      targetMultiplier: 2.0,
      // Higher win probability, lower reward
      probabilityBoost: 10,
      description: 'Conservative approach with tighter risk management'
    },
    { 
      multiple: 3, 
      label: '1:3',
      // Balanced - standard stop, good target
      stopMultiplier: 1.2,
      targetMultiplier: 3.6,
      probabilityBoost: 0,
      description: 'Balanced approach - optimal risk/reward ratio'
    },
    { 
      multiple: 4, 
      label: '1:4',
      // Aggressive - wider stop, large target
      stopMultiplier: 1.5,
      targetMultiplier: 6.0,
      probabilityBoost: -10,
      description: 'Aggressive approach targeting larger moves'
    },
  ];
  
  const timeframeMultiplier = timeframe === 'intraday' ? 0.8 : 1.5;
  
  return rrVariants.map((variant, index) => {
    const stopDistance = atr * variant.stopMultiplier * timeframeMultiplier;
    const targetDistance = atr * variant.targetMultiplier * timeframeMultiplier;
    
    const entryPrice = currentPrice;
    const stopLoss = isBuy 
      ? currentPrice - stopDistance 
      : currentPrice + stopDistance;
    const targetPrice = isBuy 
      ? currentPrice + targetDistance 
      : currentPrice - targetDistance;
    
    const potentialProfit = (targetDistance / entryPrice) * 100;
    const potentialLoss = (stopDistance / entryPrice) * 100;
    
    // Adjust confidence based on R:R (higher R:R = lower probability)
    const adjustedConfidence = Math.max(35, Math.min(90, confidence + variant.probabilityBoost));
    
    // Estimated win probability (simplified model)
    // Base probability from signal strength, adjusted by R:R
    const baseProbability = isBuy 
      ? 50 + (analysis.buyCount * 5) 
      : 50 + (analysis.sellCount * 5);
    const probability = Math.max(30, Math.min(85, baseProbability + variant.probabilityBoost));
    
    return {
      id: `${pair}-${timeframe}-rr${variant.multiple}-${Date.now()}-${index}`,
      pair,
      type: baseSignal,
      strength,
      entryPrice: Math.round(entryPrice * 100) / 100,
      targetPrice: Math.round(targetPrice * 100) / 100,
      stopLoss: Math.round(stopLoss * 100) / 100,
      riskRewardRatio: variant.label,
      rrMultiple: variant.multiple,
      timeframe,
      indicators,
      confidence: adjustedConfidence,
      probability,
      timestamp: new Date(),
      reasoning: `${reasoning} ${variant.description}. Risk: $${stopDistance.toFixed(2)} per unit, Potential Reward: $${targetDistance.toFixed(2)} per unit.`,
      potentialProfit: Math.round(potentialProfit * 100) / 100,
      potentialLoss: Math.round(potentialLoss * 100) / 100,
    };
  });
}

// Fetch real kline data and generate signal variants
export async function fetchAndGenerateSignals(
  pair: Pair,
  timeframe: TimeFrame
): Promise<TradingSignal[]> {
  try {
    const klines = await fetchKlines(pair, timeframe);
    if (klines.length === 0) {
      return [generateFallbackSignal(pair, timeframe)];
    }
    return generateSignalVariants(pair, timeframe, klines);
  } catch (error) {
    console.error('Error generating signals:', error);
    return [generateFallbackSignal(pair, timeframe)];
  }
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
    rrMultiple: 0,
    timeframe,
    indicators: [],
    confidence: 0,
    probability: 0,
    timestamp: new Date(),
    reasoning: 'Unable to fetch market data. Please check your internet connection and try again.',
    potentialProfit: 0,
    potentialLoss: 0,
  };
}

// Get kline data for chart
export async function fetchChartData(
  pair: Pair,
  timeframe: TimeFrame
): Promise<KlineData[]> {
  return fetchKlines(pair, timeframe);
}
