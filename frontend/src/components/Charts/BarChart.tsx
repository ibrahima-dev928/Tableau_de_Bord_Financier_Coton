import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data: any[];
  bars: { key: string; color: string; name: string }[];
  xKey: string;
}

export default function ChartBar({ data, bars, xKey }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {bars.map(bar => (
          <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}