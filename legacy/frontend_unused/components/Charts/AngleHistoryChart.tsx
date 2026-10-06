import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { RepResult } from '../../types/exercise';

interface AngleHistoryChartProps {
  data: RepResult[];
  targetAngle: number;
}

export const AngleHistoryChart: React.FC<AngleHistoryChartProps> = ({ data, targetAngle }) => {
  const chartData = data.map((d) => ({
    rep: `Rep ${d.rep_number}`,
    angle: d.angle,
    accuracy: d.accuracy,
    target: targetAngle,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 font-mono text-xs">
        ยังไม่มีข้อมูล Repetition
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="angleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="rep" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 'dataMax + 20']} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#a7f3d0',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#0f172a',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
            }}
          />
          <ReferenceLine
            y={targetAngle}
            stroke="#059669"
            strokeDasharray="4 4"
            label={{ value: `Target ${targetAngle}°`, fill: '#059669', fontSize: 11, position: 'right' }}
          />
          <Area
            type="monotone"
            dataKey="angle"
            name="องศาที่ทำได้"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#angleGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
