// Real-time cryptocurrency data from Binance Public API
// No API key required for public endpoints

export interface TickerData {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
}

export interface KlineData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const BINANCE_BASE = 'https://api.binance.com/api/v3';

const SYMBOL_MAP: Record<string, string> = {
  BTCUSD: 'BTCUSDT',
  ETHUSD: 'ETHUSDT',
};

// Fetch current 24hr ticker data
export async function fetchTicker(pair: string): Promise<TickerData | null> {
  try {
    const symbol = SYMBOL_MAP[pair] || pair;
    const response = await fetch(`${BINANCE_BASE}/ticker/24hr?symbol=${symbol}`);
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    return {
      symbol: data.symbol,
      lastPrice: parseFloat(data.lastPrice),
      priceChange: parseFloat(data.priceChange),
      priceChangePercent: parseFloat(data.priceChangePercent),
      highPrice: parseFloat(data.highPrice),
      lowPrice: parseFloat(data.lowPrice),
      volume: parseFloat(data.volume),
      quoteVolume: parseFloat(data.quoteVolume),
    };
  } catch (error) {
    console.error('Failed to fetch ticker data:', error);
    return null;
  }
}

// Fetch historical kline/candlestick data
export async function fetchKlines(
  pair: string,
  timeframe: 'intraday' | 'swing'
): Promise<KlineData[]> {
  try {
    const symbol = SYMBOL_MAP[pair] || pair;
    // Intraday: 30-minute candles for last 24h (48 candles)
    // Swing: daily candles for last 30 days
    const interval = timeframe === 'intraday' ? '30m' : '1d';
    const limit = timeframe === 'intraday' ? 48 : 30;
    
    const response = await fetch(
      `${BINANCE_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    return data.map((kline: any[]) => {
      const timestamp = kline[0];
      const date = new Date(timestamp);
      const timeStr = timeframe === 'intraday'
        ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        : `${date.getMonth() + 1}/${date.getDate()}`;
      
      return {
        time: timeStr,
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
      };
    });
  } catch (error) {
    console.error('Failed to fetch kline data:', error);
    return [];
  }
}

// Fetch multiple pairs at once
export async function fetchMultipleTickers(pairs: string[]): Promise<Record<string, TickerData>> {
  try {
    const symbols = pairs.map(p => SYMBOL_MAP[p] || p);
    const response = await fetch(
      `${BINANCE_BASE}/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`
    );
    
    if (!response.ok) return {};
    
    const data = await response.json();
    const result: Record<string, TickerData> = {};
    
    data.forEach((item: any) => {
      // Reverse map to find original pair
      const pairKey = Object.entries(SYMBOL_MAP).find(([, v]) => v === item.symbol)?.[0];
      if (pairKey) {
        result[pairKey] = {
          symbol: item.symbol,
          lastPrice: parseFloat(item.lastPrice),
          priceChange: parseFloat(item.priceChange),
          priceChangePercent: parseFloat(item.priceChangePercent),
          highPrice: parseFloat(item.highPrice),
          lowPrice: parseFloat(item.lowPrice),
          volume: parseFloat(item.volume),
          quoteVolume: parseFloat(item.quoteVolume),
        };
      }
    });
    
    return result;
  } catch (error) {
    console.error('Failed to fetch multiple tickers:', error);
    return {};
  }
}
