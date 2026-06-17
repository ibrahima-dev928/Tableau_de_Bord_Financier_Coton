import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  TextField, Button, Switch, FormControlLabel, Alert,
  CircularProgress, Divider
} from '@mui/material';
import { Save } from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { formatError } from '../utils/formatError';

export default function Parametres() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [config, setConfig] = useState({
    campagne_active: '2024-2025',
    prix_plancher: 200,
    seuil_alerte: 300,
    delai_paiement: 30,
    notif_email: true,
    notif_sms: false
  });

  useEffect(() => {
    fetchConfig();
  }, [token]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/parametres');
      setConfig(res.data);
    } catch (err: any) {
      setError(formatError(err));
      // Mock
      setConfig({
        campagne_active: '2024-2025',
        prix_plancher: 200,
        seuil_alerte: 300,
        delai_paiement: 30,
        notif_email: true,
        notif_sms: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/parametres', config);
      setSuccess('Paramètres mis à jour');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Paramètres - Page en construction</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Configuration du tableau de bord (campagnes, prix planchers, etc.).
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {loading && <CircularProgress />}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Campagne active"
                name="campagne_active"
                value={config.campagne_active}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Prix plancher (FCFA/kg)"
                name="prix_plancher"
                type="number"
                value={config.prix_plancher}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Seuil d'alerte (FCFA/kg)"
                name="seuil_alerte"
                type="number"
                value={config.seuil_alerte}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Délai de paiement (jours)"
                name="delai_paiement"
                type="number"
                value={config.delai_paiement}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" gutterBottom>Notifications</Typography>
              <FormControlLabel
                control={
                  <Switch
                    name="notif_email"
                    checked={config.notif_email}
                    onChange={handleChange}
                  />
                }
                label="Notifications par email"
              />
              <FormControlLabel
                control={
                  <Switch
                    name="notif_sms"
                    checked={config.notif_sms}
                    onChange={handleChange}
                  />
                }
                label="Notifications par SMS"
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" startIcon={<Save />} disabled={loading}>
                Enregistrer
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}