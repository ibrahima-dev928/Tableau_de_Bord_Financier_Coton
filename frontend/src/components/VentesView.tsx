// src/components/VentesView.tsx
import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, CircularProgress, Box } from '@mui/material';
import api from '../api/client';

interface VentesData {
  total_volume: number;
  total_revenu: number;
  total_logistique: number;
}

export default function VentesView({ dateFilter }: { dateFilter: string }) {
  const [data, setData] = useState<VentesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/stats/ventes?date=${dateFilter}`);
        setData(res.data);
      } catch (err) {
        setError('Erreur de chargement');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateFilter]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!data) return <Typography>Aucune donnée</Typography>;

  return (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">Volume total vendu</Typography>
            <Typography variant="h5">{data.total_volume.toFixed(1)} kg</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
          <CardContent>
            <Typography variant="body2">💰 Revenu total</Typography>
            <Typography variant="h5">{data.total_revenu.toLocaleString()} FCFA</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          <CardContent>
            <Typography variant="body2">🚚 Coûts logistiques</Typography>
            <Typography variant="h5">{data.total_logistique.toLocaleString()} FCFA</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}