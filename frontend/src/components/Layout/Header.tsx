// src/components/Layout/Header.tsx
import { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Avatar,
  Menu, MenuItem, Badge, Popover, List, ListItem, ListItemText,
  Divider, useTheme
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';

interface Notification {
  id: string;
  message: string;
  date: string;
  lu: boolean;
}

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { toggleTheme, darkMode } = useThemeContext();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Récupérer les notifications (polling)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/me');
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n: Notification) => !n.lu).length);
      } catch (err) {
        console.error('Erreur chargement notifications', err);
        // Mock pour le test
        const mockNotifs: Notification[] = [
          { id: '1', message: 'Nouvel achat enregistré par Terrain Nord', date: new Date().toISOString(), lu: false },
          { id: '2', message: 'Transformation validée par Comptabilité', date: new Date().toISOString(), lu: false },
          { id: '3', message: 'Rapport mensuel généré', date: new Date().toISOString(), lu: true },
        ];
        setNotifications(mockNotifs);
        setUnreadCount(mockNotifs.filter(n => !n.lu).length);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30 secondes
    return () => clearInterval(interval);
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
    // Marquer comme lues
    const updated = notifications.map(n => ({ ...n, lu: true }));
    setNotifications(updated);
    setUnreadCount(0);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const userInitial = user?.nom ? user.nom.charAt(0).toUpperCase() : 'U';
  const openNotif = Boolean(notifAnchorEl);

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
          SODECOTON – Tableau de bord financier
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* 🌙 Mode sombre */}
          <IconButton color="inherit" onClick={toggleTheme}>
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          {/* 🔔 Notifications */}
          <IconButton color="inherit" onClick={handleNotifClick}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Popover
            open={openNotif}
            anchorEl={notifAnchorEl}
            onClose={handleNotifClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
              <Typography variant="subtitle1" sx={{ p: 2 }}>Notifications</Typography>
              <Divider />
              {notifications.length === 0 ? (
                <Typography variant="body2" sx={{ p: 2 }}>Aucune notification</Typography>
              ) : (
                <List dense>
                  {notifications.map((n) => (
                    <ListItem key={n.id} sx={{ bgcolor: n.lu ? 'inherit' : 'action.hover' }}>
                      <ListItemText
                        primary={n.message}
                        secondary={new Date(n.date).toLocaleString()}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Popover>

          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.nom || 'Utilisateur'}
          </Typography>
          <IconButton onClick={handleMenu} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {userInitial}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem onClick={handleLogout}>Déconnexion</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}