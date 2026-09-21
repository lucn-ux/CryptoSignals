import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TradingSignal, SignalType } from '../utils/signalEngine';

interface SignalCardProps {
  signal: TradingSignal;
  compact?: boolean;
}

function getSignalColor(type: SignalType) {
  switch (type) {
    case 'BUY': return 'text-green-400';
    case 'SELL': return 'text-red-400';
    default: return 'text-yellow-400';
  }
}

function getSignalBg(type: SignalType) {
  switch (type) {
    case 'BUY': return 'bg-green-500/10 border-green-500/20';
    case 'SELL': return 'bg-red-500/10 border-red-500/20';
    default: return 'bg-yellow-500/10 border-yellow-500/20';
  }
}

function getSignalIcon(type: SignalType) {
  switch (type) {
    case 'BUY': return <TrendingUp className="w-4 h-4" />;
    case 'SELL': return <TrendingDown className="w-4 h-4" />;
    default: return <Minus className="w-4 h-4" />;
  }
}

export default function SignalCard({ signal, compact = false }: SignalCardProps) {
  if (compact) {
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg border ${getSignalBg(signal.type)}`}>
        <div className="flex items-center gap-2">
          <span className={getSignalColor(signal.type)}>
            {getSignalIcon(signal.type)}
          </span>
          <div>
            <span className="text-sm font-medium text-gray-200">{signal.pair}</span>
            <span className="text-xs text-gray-500 ml-2">
              {signal.timeframe === 'intraday' ? 'Intraday' : 'Swing'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${getSignalColor(signal.type)}`}>
            {signal.type}
          </span>
          <span className="text-xs text-gray-500">
            {signal.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-xl border ${getSignalBg(signal.type)} signal-card`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={getSignalColor(signal.type)}>
            {getSignalIcon(signal.type)}
          </span>
          <span className="font-medium text-gray-200">{signal.pair}</span>
        </div>
        <span className={`text-lg font-bold ${getSignalColor(signal.type)}`}>
          {signal.type}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-gray-500">Entry</p>
          <p className="text-sm font-medium text-white">${signal.entryPrice.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Target</p>
          <p className="text-sm font-medium text-green-400">${signal.targetPrice.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Stop Loss</p>
          <p className="text-sm font-medium text-red-400">${signal.stopLoss.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
