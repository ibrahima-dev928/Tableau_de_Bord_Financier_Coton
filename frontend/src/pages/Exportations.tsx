// @ts-nocheck
import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert
} from '@mui/material';
import {
  TrendingUp, TrendingDown, Public, AttachMoney
} from '@mui/icons-material';
import {
  LineChart, Line, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { formatError } from '../utils/formatError';

interface Statistiques {
  total_exporte: number;
  valeur_totale: number;
  nombre_pays: number;
  variation: number;
}

interface EvolutionItem {
  mois: string;
  volume: number;
}

interface RepartitionItem {
  name: string;
  value: number;
}

interface PaysItem {
  pays: string;
  volume: number;
}

export default function Exportations() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Statistiques | null>(null);
  const [evolution, setEvolution] = useState<EvolutionItem[]>([]);
  const [repartition, setRepartition] = useState<RepartitionItem[]>([]);
  const [parPays, setParPays] = useState<PaysItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/exportations');
        const data = res.data;
        setStats(data.statistiques);
        setEvolution(data.evolution || []);
        setRepartition(data.repartition || []);
        setParPays(data.par_pays || []);
      } catch (err: any) {
        console.error('Erreur exportations :', err);
        setError(formatError(err));
        // Données mockées si l'API échoue
        setStats({ total_exporte: 24500, valeur_totale: 18500000000, nombre_pays: 12, variation: 8.5 });
        setEvolution([
          { mois: 'Jan', volume: 3200 },
          { mois: 'Fév', volume: 2800 },
          { mois: 'Mar', volume: 4100 },
          { mois: 'Avr', volume: 3800 },
          { mois: 'Mai', volume: 5200 },
          { mois: 'Juin', volume: 5400 }
        ]);
        setRepartition([
          { name: 'Chine', value: 35 },
          { name: 'Bangladesh', value: 25 },
          { name: 'Turquie', value: 20 },
          { name: 'Inde', value: 12 },
          { name: 'Autres', value: 8 }
        ]);
        setParPays([
          { pays: 'Chine', volume: 8575 },
          { pays: 'Bangladesh', volume: 6125 },
          { pays: 'Turquie', volume: 4900 },
          { pays: 'Inde', volume: 2940 },
          { pays: 'Autres', volume: 1960 }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) return <Box sx={{ p: 3 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Statistiques exportations</Typography>

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Volume total exporté</Typography>
              <Typography variant="h4">{stats?.total_exporte?.toLocaleString()} t</Typography>
              <Typography variant="caption" color={stats?.variation && stats.variation > 0 ? 'success.main' : 'error.main'}>
                {stats?.variation && stats.variation > 0 ? '+' : ''}{stats?.variation}% vs mois précédent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Valeur totale</Typography>
              <Typography variant="h4">{(stats?.valeur_totale / 1e9).toFixed(1)} Mds FCFA</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Nombre de pays</Typography>
              <Typography variant="h4">{stats?.nombre_pays}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Volume moyen par expédition</Typography>
              <Typography variant="h4">{stats?.total_exporte ? Math.round(stats.total_exporte / stats.nombre_pays).toLocaleString() : 0} t</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphique évolution */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Évolution des exportations (tonnes)</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={evolution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="volume" stroke="#8884d8" name="Volume (t)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Répartition par pays + Tableau */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Répartition par pays</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={repartition}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {repartition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Détail par pays</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pays</TableCell>
                    <TableCell align="right">Volume (t)</TableCell>
                    <TableCell align="right">Part (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parPays.map((row) => {
                    const total = parPays.reduce((sum, r) => sum + r.volume, 0);
                    const pourcentage = total > 0 ? (row.volume / total) * 100 : 0;
                    return (
                      <TableRow key={row.pays}>
                        <TableCell>{row.pays}</TableCell>
                        <TableCell align="right">{row.volume.toLocaleString()}</TableCell>
                        <TableCell align="right">{pourcentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}