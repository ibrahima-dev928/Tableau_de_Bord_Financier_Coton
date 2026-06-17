import React from 'react';
import { Card, CardContent, Typography, Box, SxProps, Theme } from '@mui/material';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  color?: string;
  sx?: SxProps<Theme>;
}

export default function KpiCard({ title, value, icon, trend, color = 'primary.main', sx }: KpiCardProps) {
  const isPositive = trend && trend > 0;
  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="textSecondary">{title}</Typography>
          {icon && <Box sx={{ color }}>{icon}</Box>}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>{value}</Typography>
        {trend !== undefined && (
          <Typography variant="caption" sx={{ color: isPositive ? 'success.main' : 'error.main' }}>
            {isPositive ? `+${trend}%` : `${trend}%`} vs période précédente
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}