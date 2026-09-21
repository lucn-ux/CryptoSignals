import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { fetchKlines, type KlineData } from '../utils/cryptoApi';
import type { Pair, TimeFrame } from '../utils/signalEngine';

interface PriceChartProps {
  pair: Pair;
  timeframe: TimeFrame;
}

export default function PriceChart({ pair, timeframe }: PriceChartProps) {
  const [data, setData] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    async function loadData() {
      setLoading(true);
      const klines = await fetchKlines(pair, timeframe);
      if (!cancelled) {
        setData(klines);
        setLoading(false);
      }
    }
    
    loadData();
    
    // Refresh chart data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pair, timeframe]);

  const chartData = useMemo(() => {
    return data.map(k => ({
      time: k.time,
      price: k.close,
      high: k.high,
      low: k.low,
      volume: k.volume,
    }));
  }, [data]);

  if (loading || chartData.length === 0) {
    return (
      <div className="h-72 w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading market data...</p>
        </div>
      </div>
    );
  }

  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  
  const isPositive = prices[prices.length - 1] > prices[0];
  const gradientColor = isPositive ? '#00e676' : '#ff1744';
  const lineColor = isPositive ? '#00e676' : '#ff1744';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a2332] border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-sm font-medium text-white">
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format Y-axis based on price range
  const formatYAxis = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
          <XAxis
            dataKey="time"
            stroke="#4a5568"
            fontSize={11}
            tickLine={false}
            interval={Math.floor(chartData.length / 8)}
          />
          <YAxis
            stroke="#4a5568"
            fontSize={11}
            tickLine={false}
            domain={[minPrice * 0.999, maxPrice * 1.001]}
            tickFormatter={formatYAxis}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={avgPrice}
            stroke="#4a5568"
            strokeDasharray="3 3"
            label={{ value: 'Avg', position: 'right', fill: '#4a5568', fontSize: 10 }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={{ r: 4, fill: lineColor, stroke: '#0a0e17', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
