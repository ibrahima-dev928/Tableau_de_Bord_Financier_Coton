// src/components/AgricultureView.tsx
import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, LinearProgress, CircularProgress, Box } from '@mui/material';
import api from '../api/client';

interface AgricultureData {
  total_volume: number;
  cout_moyen: number;
  nb_producteurs: number;
  paye: number;
  reste: number;
  taux_collecte: number;
}

export default function AgricultureView({ dateFilter }: { dateFilter: string }) {
  const [data, setData] = useState<AgricultureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/stats/agriculture?date=${dateFilter}`);
        setData(res.data);
      } catch (err) {
        setError('Erreur de chargement des données');
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
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">Volume collecté</Typography>
            <Typography variant="h5">{data.total_volume.toFixed(1)} kg</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">Coût moyen</Typography>
            <Typography variant="h5">{data.cout_moyen.toFixed(2)} FCFA/kg</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">Producteurs distincts</Typography>
            <Typography variant="h5">{data.nb_producteurs}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">Taux de paiement</Typography>
            <Typography variant="h5">{data.taux_collecte.toFixed(1)}%</Typography>
            <LinearProgress variant="determinate" value={data.taux_collecte} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
          <CardContent>
            <Typography variant="body2">✅ Montant payé</Typography>
            <Typography variant="h5">{data.paye.toLocaleString()} FCFA</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
          <CardContent>
            <Typography variant="body2">⏳ Reste à payer</Typography>
            <Typography variant="h5">{data.reste.toLocaleString()} FCFA</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}