// @ts-nocheck
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  data: any[];
  lines: { key: string; stroke: string; name: string }[];
  xAxisKey: string;
  height?: number;
}

export default function CustomLineChart({ data, lines, xAxisKey, height = 300 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {lines.map((line) => (
          <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.stroke} name={line.name} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}