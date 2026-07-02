// src/theme.ts
import { createTheme } from '@mui/material';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2E7D32' },
    secondary: { main: '#FFA000' },
    background: { default: '#f5f6fa' },
  },
  typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4CAF50' },
    secondary: { main: '#FFB300' },
    background: { default: '#1a1a2e', paper: '#16213e' },
  },
  typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
});