import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { RepResult } from '../../types/exercise';

interface AccuracyChartProps {
  data: RepResult[];
}

export const AccuracyChart: React.FC<AccuracyChartProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    rep: `#${d.rep_number}`,
    accuracy: d.accuracy,
    isCorrect: d.is_correct,
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
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="rep" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
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
          <Bar dataKey="accuracy" name="ความแม่นยำ (%)" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.accuracy >= 90 ? '#059669' : entry.accuracy >= 75 ? '#10b981' : '#f43f5e'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
