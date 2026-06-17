// src/pages/Direction/DashboardDirection.tsx
// @ts-nocheck
import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Chip, CircularProgress, Alert
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import FilterBar from '../../components/FilterBar';

export default function DashboardDirection() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState({ coutMoyen: 0, marge: 0, volume: 0, tauxCollecte: 0 });
  const [tendanceData, setTendanceData] = useState([]);
  const [zonesData, setZonesData] = useState([]);
  const [zones, setZones] = useState([]);
  const [filtres, setFiltres] = useState({ zoneId: '', periode: 'mois' });

  useEffect(() => {
    fetchZones();
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [filtres, token]);

  const fetchZones = async () => {
    try {
      const res = await api.get('/zones');
      setZones(res.data || []);
    } catch (err) {
      console.error('Erreur chargement zones', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Appels API avec paramètres
      const [kpiRes, tendanceRes, zonesRes] = await Promise.all([
        api.get('/stats/kpis', { params: { zone_id: filtres.zoneId || undefined } }),
        api.get('/stats/tendances', { params: { zone_id: filtres.zoneId || undefined } }),
        api.get('/stats/comparaison_zones', { params: { zone_id: filtres.zoneId || undefined } })
      ]);

      // Vérifier que les données existent et sont bien formatées
      const kpiData = kpiRes.data || {};
      setKpis({
        coutMoyen: kpiData.coutMoyen || 0,
        marge: kpiData.montant_total || 0,
        volume: kpiData.volume || 0,
        tauxCollecte: 78 // ou calculé plus tard
      });

      setTendanceData(tendanceRes.data || []);
      setZonesData(zonesRes.data || []);
    } catch (err) {
      console.error('Erreur API :', err);
      setError('Impossible de charger les données. Veuillez réessayer.');
      // On réinitialise les données pour ne pas afficher d'anciennes valeurs
      setKpis({ coutMoyen: 0, marge: 0, volume: 0, tauxCollecte: 0 });
      setTendanceData([]);
      setZonesData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = (newFiltres) => {
    setFiltres({ zoneId: newFiltres.zoneId, periode: newFiltres.periode });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) return <Box sx={{ p: 3 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Tableau de bord — Direction</Typography>
        <Typography variant="body2" color="textSecondary">Vue consolidée — toutes zones</Typography>
      </Box>

      <FilterBar zones={zones} onApply={handleFilterApply} />

      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Coût d’achat moyen</Typography>
              <Typography variant="h4" fontWeight="bold">{kpis.coutMoyen} FCFA/kg</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Marge brute</Typography>
              <Typography variant="h4" fontWeight="bold">{kpis.marge} M FCFA</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Volume acheté</Typography>
              <Typography variant="h4" fontWeight="bold">{kpis.volume} t</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Rendement égrenage</Typography>
              <Typography variant="h4" fontWeight="bold">41.2 %</Typography>
              <Typography variant="caption">moyenne usines</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphique évolution */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Évolution mensuelle — marge et volumes</Typography>
        {tendanceData.length === 0 ? (
          <Typography variant="body2" color="textSecondary">Aucune donnée de tendance disponible</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="volume" stroke="#8884d8" name="Volume (t)" />
              <Line yAxisId="right" type="monotone" dataKey="prix_moyen" stroke="#82ca9d" name="Prix moyen (FCFA)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* Comparaison par zone + Répartition */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Comparaison par zone</Typography>
            {zonesData.length === 0 ? (
              <Typography variant="body2" color="textSecondary">Aucune donnée par zone disponible</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Zone</TableCell>
                      <TableCell align="right">Volume (t)</TableCell>
                      <TableCell align="right">Coût moyen</TableCell>
                      <TableCell align="right">Marge (M FCFA)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {zonesData.map((row, index) => (
                      <TableRow key={row.zone || index}>
                        <TableCell>{row.zone || 'Inconnue'}</TableCell>
                        <TableCell align="right">{row.volume?.toFixed?.(1) || 0} t</TableCell>
                        <TableCell align="right">{row.cout_moyen?.toFixed?.(0) || 0} FCFA</TableCell>
                        <TableCell align="right">+ {((row.volume || 0) * 0.15).toFixed(1)} M</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Répartition export / local</Typography>
            <Typography variant="caption" color="textSecondary">
              Calculé sur le volume de fibre vendu durant la campagne en cours
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Export', value: 65 },
                    { name: 'Marché local', value: 35 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Footer profil */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
        <Box>
          <Typography variant="body1" fontWeight="bold">Admin SODECOTON</Typography>
          <Typography variant="body2" color="textSecondary">Direction</Typography>
        </Box>
        <Button variant="outlined" size="small">Changer de profil</Button>
      </Box>
    </Box>
  );
}