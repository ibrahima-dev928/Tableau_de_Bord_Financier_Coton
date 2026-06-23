// src/components/VentesView.tsx
import { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, CircularProgress,
  Box, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from '@mui/material';
import api from '../api/client';

interface PrevisionVente {
  produit: string;
  volume_prevu_tonnes: number;
  prix_vente_prevu: number;
  cout_logistique_estime: number;
}

interface VentesData {
  total_volume: number;
  total_revenu: number;
  total_logistique: number;
  previsions?: PrevisionVente[];
}

interface VentesViewProps {
  dateFilter: string;
  campagneId: string;
}

export default function VentesView({ dateFilter, campagneId }: VentesViewProps) {
  const [data, setData] = useState<VentesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = `/stats/ventes?date_filter=${dateFilter}&campagne_id=${campagneId}`;
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
    <Box>
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

      {data.previsions && data.previsions.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            📦 Prévisions par produit
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Produit</TableCell>
                  <TableCell align="right">Volume (t)</TableCell>
                  <TableCell align="right">Prix (FCFA/kg)</TableCell>
                  <TableCell align="right">Logistique (FCFA)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.previsions.map((p) => (
                  <TableRow key={p.produit}>
                    <TableCell>{p.produit}</TableCell>
                    <TableCell align="right">{p.volume_prevu_tonnes}</TableCell>
                    <TableCell align="right">{p.prix_vente_prevu}</TableCell>
                    <TableCell align="right">{p.cout_logistique_estime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}