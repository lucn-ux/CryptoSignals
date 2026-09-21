import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { generatePriceData, type Pair, type TimeFrame } from '../utils/signalEngine';

interface PriceChartProps {
  pair: Pair;
  timeframe: TimeFrame;
}

export default function PriceChart({ pair, timeframe }: PriceChartProps) {
  const data = useMemo(() => generatePriceData(pair, timeframe), [pair, timeframe]);
  
  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));
  const avgPrice = data.reduce((sum, d) => sum + d.price, 0) / data.length;
  
  const isPositive = data[data.length - 1].price > data[0].price;
  const gradientColor = isPositive ? '#00e676' : '#ff1744';
  const lineColor = isPositive ? '#00e676' : '#ff1744';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a2332] border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-sm font-medium text-white">
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            interval={Math.floor(data.length / 8)}
          />
          <YAxis
            stroke="#4a5568"
            fontSize={11}
            tickLine={false}
            domain={[minPrice * 0.999, maxPrice * 1.001]}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            width={80}
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
