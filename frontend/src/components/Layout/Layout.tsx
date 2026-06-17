import { Box, CssBaseline } from '@mui/material';
import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header onMenuToggle={handleDrawerToggle} />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          bgcolor: '#f5f6fa',
          minHeight: '100vh',
          width: { xs: '100%', sm: `calc(100% - 240px)` }
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}