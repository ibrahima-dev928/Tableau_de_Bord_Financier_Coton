// src/components/Layout/Sidebar.tsx

import { Box, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import StoreIcon from '@mui/icons-material/Store';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import FactoryIcon from '@mui/icons-material/Factory';   // ← ajout pour transformations
import SellIcon from '@mui/icons-material/Sell';         // ← ajout pour ventes
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
      roles: ['Direction']
    },
    {
      text: 'Saisie Achats',
      icon: <ShoppingCartIcon />,
      path: '/achats',
      roles: ['Responsable_terrain']
    },
    {
      text: 'Validation Achats',
      icon: <CheckCircleIcon />,
      path: '/validation-achats',
      roles: ['Comptabilite']
    },
    // ---------- Nouveaux items pour terrain / comptabilité ----------
    {
      text: 'Saisie Transformations',
      icon: <FactoryIcon />,
      path: '/saisie-transformations',
      roles: ['Responsable_terrain', 'Comptabilite']
    },
    {
      text: 'Saisie Ventes',
      icon: <SellIcon />,
      path: '/saisie-ventes',
      roles: ['Responsable_terrain', 'Comptabilite']
    },
    {
      text: 'Rapports',
      icon: <AssessmentIcon />,
      path: '/rapports',
      roles: ['Direction', 'Comptabilite']
    },
    {
      text: 'Producteurs',
      icon: <PeopleIcon />,
      path: '/producteurs',
      roles: ['Direction', 'Comptabilite']
    },
    {
      text: 'Zones & Usines',
      icon: <StoreIcon />,
      path: '/zones-usines',
      roles: ['Direction']
    },
    // ---------- Nouveaux items pour la Direction ----------
    {
      text: 'Achats',
      icon: <ShoppingCartIcon />,
      path: '/admin-achats',
      roles: ['Direction']
    },
    {
      text: 'Exportations',
      icon: <BarChartIcon />,
      path: '/exportations',
      roles: ['Direction']
    },
    {
      text: 'Utilisateurs',
      icon: <PeopleIcon />,
      path: '/utilisateurs',
      roles: ['Direction']
    },
    {
      text: 'Paramètres',
      icon: <SettingsIcon />,
      path: '/parametres',
      roles: ['Direction']
    }
  ];

  // Filtrer selon le rôle de l'utilisateur
  const filteredMenu = menuItems.filter(
    item => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <Box sx={{ width: 240, height: '100vh', bgcolor: 'primary.dark', color: 'white', flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
      <Toolbar>
        <Typography variant="h6" fontWeight="bold">SODECOTON</Typography>
      </Toolbar>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
      <List>
        {filteredMenu.map((item) => (
          <ListItemButton
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 1 }} />
        <ListItemButton
          onClick={logout}
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <ListItemIcon sx={{ color: 'white' }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Déconnexion" />
        </ListItemButton>
      </List>
    </Box>
  );
}