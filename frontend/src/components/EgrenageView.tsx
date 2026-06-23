// src/components/EgrenageView.tsx
import { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, CircularProgress,
  Box, Alert
} from '@mui/material';
import api from '../api/client';

interface EgrenageData {
  total_coton_graine: number;
  total_fibre: number;
  total_graines: number;
  cout_transformation: number;
  rendement: number;
}

interface EgrenageViewProps {
  dateFilter: string;
  campagneId: string;
}

export default function EgrenageView({ dateFilter, campagneId }: EgrenageViewProps) {
  const [data, setData] = useState<EgrenageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = `/stats/egrenage?date_filter=${dateFilter}&campagne_id=${campagneId}`;
        const res = await api.get(url);
        setData(res.data);
      } catch (err) {
        setError('Erreur de chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateFilter, campagneId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return <Typography sx={{ mt: 2 }}>Aucune donnée disponible</Typography>;
  }

  return (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">Coton graine entrant</Typography>
            <Typography variant="h5">{data.total_coton_graine.toFixed(1)} kg</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">Fibre produite</Typography>
            <Typography variant="h5">{data.total_fibre.toFixed(1)} kg</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">Graines produites</Typography>
            <Typography variant="h5">{data.total_graines.toFixed(1)} kg</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">Rendement égrenage</Typography>
            <Typography variant="h5">{data.rendement.toFixed(1)}%</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">Coût total de transformation</Typography>
            <Typography variant="h5">{data.cout_transformation.toLocaleString()} FCFA</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}