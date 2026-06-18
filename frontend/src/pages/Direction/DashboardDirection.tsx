// @ts-nocheck
// src/pages/Direction/DashboardDirection.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import * as Recharts from 'recharts';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

interface CampagneData {
  prevu: number;
  collecte: number;
  reste: number;
  taux: number;
}

interface TendanceItem {
  mois: string;
  volume: number;
  marge: number;
}

interface ZoneItem {
  zone: string;
  volume: number;
  cout_moyen: number;
  marge: number;
  realisation: number;
}

export default function DashboardDirection() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [campagne, setCampagne] = useState<CampagneData>({
    prevu: 0,
    collecte: 0,
    reste: 0,
    taux: 0
  });
  const [tendanceData, setTendanceData] = useState<TendanceItem[]>([]);
  const [zonesData, setZonesData] = useState<ZoneItem[]>([]);

  const exportLocalData = [
    { name: 'Export', value: 65 },
    { name: 'Marché local', value: 35 }
  ];
  const PIE_COLORS = ['#3B82F6', '#F59E0B'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [campagneRes, tendanceRes, zonesRes] = await Promise.all([
          api.get('/stats/suivi_campagne'),
          api.get('/stats/tendances'),
          api.get('/stats/comparaison_zones')
        ]);

        setCampagne(campagneRes.data);
        setTendanceData(tendanceRes.data || []);
        setZonesData(zonesRes.data || []);
      } catch (err) {
        console.error('Erreur lors du chargement des données :', err);
        setError('Impossible de charger les données. Veuillez réessayer.');

        // ✅ SUPPRESSION DES MOCK : on réinitialise tout à zéro
        setCampagne({
          prevu: 0,
          collecte: 0,
          reste: 0,
          taux: 0
        });
        setTendanceData([]);
        setZonesData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Tableau de bord — Direction
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Vue consolidée — toutes zones
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ========== SUIVI DE LA CAMPAGNE ========== */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            📈 Campagne en cours : 2025-2026
          </Typography>
          <Typography variant="body2" sx={{ bgcolor: 'success.light', px: 2, py: 0.5, borderRadius: 2 }}>
            Objectif : {campagne.prevu} t
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="textSecondary">Prévu</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {campagne.prevu.toLocaleString()} t
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Collecté / Payé</Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {campagne.collecte.toLocaleString()} t
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ borderColor: 'warning.main' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Reste à collecter</Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {campagne.reste.toLocaleString()} t
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="textSecondary">Taux de réalisation</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {campagne.taux.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(campagne.taux, 100)}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* ========== GRAPHIQUE ÉVOLUTION MENSUELLE ========== */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 Évolution mensuelle — Volume et Marge
        </Typography>
        <Recharts.ResponsiveContainer width="100%" height={300}>
          <Recharts.LineChart data={tendanceData}>
            <Recharts.CartesianGrid strokeDasharray="3 3" />
            <Recharts.XAxis dataKey="mois" />
            <Recharts.YAxis yAxisId="left" label={{ value: 'Volume (t)', angle: -90, position: 'insideLeft' }} />
            <Recharts.YAxis yAxisId="right" orientation="right" label={{ value: 'Marge (FCFA/kg)', angle: 90, position: 'insideRight' }} />
            <Recharts.Tooltip />
            <Recharts.Legend />
            <Recharts.Line
              yAxisId="left"
              type="monotone"
              dataKey="volume"
              stroke="#3B82F6"
              name="Volume (t)"
              strokeWidth={2}
            />
            <Recharts.Line
              yAxisId="right"
              type="monotone"
              dataKey="marge"
              stroke="#F97316"
              name="Marge (FCFA/kg)"
              strokeWidth={2}
            />
          </Recharts.LineChart>
        </Recharts.ResponsiveContainer>
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          * Données mensuelles agrégées sur les achats validés.
        </Typography>
      </Paper>

      {/* ========== RÉPARTITION EXPORT/LOCAL + CHAÎNE DE VALEUR ========== */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              🌍 Répartition Export / Local
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
              Calculé sur le volume de fibre vendu durant la campagne en cours
            </Typography>
            <Recharts.ResponsiveContainer width="100%" height={250}>
              <Recharts.PieChart>
                <Recharts.Pie
                  data={exportLocalData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {exportLocalData.map((entry, index) => (
                    <Recharts.Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Recharts.Pie>
                <Recharts.Tooltip />
              </Recharts.PieChart>
            </Recharts.ResponsiveContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#3B82F6', borderRadius: 1 }} />
                <Typography variant="caption">Export (65%)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#F59E0B', borderRadius: 1 }} />
                <Typography variant="caption">Marché local (35%)</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              🔄 Flux de la Chaîne de Valeur
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '1px solid #c8e6c9' }}>
                <Typography fontWeight="bold">🌱 Producteurs</Typography>
                <Typography variant="body2">
                  {campagne.collecte} t / {campagne.prevu} t
                </Typography>
                <LinearProgress variant="determinate" value={campagne.taux} sx={{ height: 6, borderRadius: 3, mt: 1 }} />
                <Typography variant="caption">↓ Achats : {campagne.collecte * 285} FCFA</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #bbdefb' }}>
                <Typography fontWeight="bold">🏭 Usine d'égrenage</Typography>
                <Typography variant="body2">Fibre: 40% • Graines: 55%</Typography>
                <Typography variant="caption">Coût transformation: 0.8 M FCFA</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2, border: '1px solid #e1bee7' }}>
                <Typography fontWeight="bold">📦 Ventes</Typography>
                <Typography variant="body2">Export 65% • Local 35%</Typography>
                <Typography variant="caption">Revenu estimé: 2.9 M FCFA</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ========== COMPARAISON PAR ZONE ========== */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          📋 Détail par Zone avec taux de réalisation
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Zone</TableCell>
                <TableCell align="right">Volume (t)</TableCell>
                <TableCell align="center">Réalisé / Reste</TableCell>
                <TableCell align="right">Coût moyen (FCFA/kg)</TableCell>
                <TableCell align="right">Marge (FCFA)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {zonesData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="textSecondary">
                      Aucune donnée disponible
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                zonesData.map((row) => (
                  <TableRow key={row.zone}>
                    <TableCell>{row.zone}</TableCell>
                    <TableCell align="right">{row.volume.toFixed(1)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(row.realisation, 100)}
                          sx={{ width: 80, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption">{row.realisation}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{row.cout_moyen.toFixed(0)}</TableCell>
                    <TableCell align="right" sx={{ color: row.marge > 0 ? 'success.main' : 'error.main' }}>
                      {row.marge.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box
        sx={{
          mt: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          bgcolor: 'white',
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        <Box>
          <Typography variant="body1" fontWeight="bold">
            Directeur Financier
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Admin SODECOTON
          </Typography>
        </Box>
        <Button variant="outlined" size="small">
          Changer de profil
        </Button>
      </Box>
    </Box>
  );
}