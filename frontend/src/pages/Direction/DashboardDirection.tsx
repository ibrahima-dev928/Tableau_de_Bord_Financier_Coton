// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Download } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Recharts from 'recharts';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import AgricultureView from '../../components/AgricultureView';
import EgrenageView from '../../components/EgrenageView';
import VentesView from '../../components/VentesView';
import DateFilter from '../../components/DateFilter';

// ==================== INTERFACES ====================
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

interface PrevisionVente {
  produit: string;
  volume_prevu_tonnes: number;
  prix_vente_prevu: number;
  cout_logistique_estime: number;
}

// ==================== COMPOSANT PRINCIPAL ====================
export default function DashboardDirection() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Données principales
  const [campagne, setCampagne] = useState<CampagneData>({
    prevu: 0, collecte: 0, reste: 0, taux: 0
  });
  const [tendanceData, setTendanceData] = useState<TendanceItem[]>([]);
  const [zonesData, setZonesData] = useState<ZoneItem[]>([]);

  // États pour les vues détaillées
  const [activeView, setActiveView] = useState<'agriculture' | 'egrenage' | 'ventes'>('agriculture');
  const [dateFilter, setDateFilter] = useState('1year');

  // Prévisions
  const [egrenagePrevu, setEgrenagePrevu] = useState(0);
  const [egrenageRendement, setEgrenageRendement] = useState(0);
  const [egrenageCout, setEgrenageCout] = useState(0);
  const [ventesPrevisions, setVentesPrevisions] = useState<PrevisionVente[]>([]);

  // Sélecteur de campagne
  const [campagnes, setCampagnes] = useState<{ id: string, libelle: string, est_active: boolean }[]>([]);
  const [selectedCampagneId, setSelectedCampagneId] = useState<string | null>(null);

  // Données réelles Export/Local
  const [exportLocalData, setExportLocalData] = useState<{ name: string, value: number }[]>([]);
  const PIE_COLORS = ['#3B82F6', '#F59E0B'];

  // ✅ Nouvel état : format d'export
  const [exportFormat, setExportFormat] = useState<'PDF' | 'Excel'>('Excel');

  // ==================== DÉTECTION DU PARAMÈTRE "refresh" DANS L'URL ====================
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('refresh')) {
      setRefreshKey(prev => prev + 1);
      window.history.replaceState({}, '', '/');
    }
  }, [location]);

  // ==================== CHARGEMENT DES CAMPAGNES ====================
  useEffect(() => {
    const fetchCampagnes = async () => {
      try {
        const res = await api.get('/campagnes');
        setCampagnes(res.data);
        const active = res.data.find((c: any) => c.est_active);
        if (active) {
          setSelectedCampagneId(active.id);
        } else if (res.data.length > 0) {
          setSelectedCampagneId(res.data[0].id);
        }
      } catch (err) {
        console.error('Erreur chargement campagnes', err);
      }
    };
    fetchCampagnes();
  }, []);

  // ==================== CHARGEMENT DES DONNÉES ====================
  useEffect(() => {
    if (!selectedCampagneId) return;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [campagneRes, tendanceRes, zonesRes, egreRes, ventesRes, exportRes] = await Promise.all([
          api.get(`/stats/suivi_campagne?campagne_id=${selectedCampagneId}`),
          api.get('/stats/tendances'),
          api.get('/stats/comparaison_zones'),
          api.get(`/parametres/previsions/egrenage?campagne_id=${selectedCampagneId}`),
          api.get(`/parametres/previsions/ventes?campagne_id=${selectedCampagneId}`),
          api.get('/stats/export_local')
        ]);

        setCampagne(campagneRes.data);
        setTendanceData(tendanceRes.data || []);
        setZonesData(zonesRes.data || []);

        setEgrenagePrevu(egreRes.data.coton_graine_prevu_tonnes || 0);
        setEgrenageRendement(egreRes.data.rendement_attendu_pourcent || 0);
        setEgrenageCout(egreRes.data.cout_transformation_estime || 0);
        setVentesPrevisions(ventesRes.data || []);

        const exportVal = exportRes.data?.export || 0;
        const localVal = exportRes.data?.local || 0;
        setExportLocalData([
          { name: 'Export', value: exportVal },
          { name: 'Marché local', value: localVal }
        ]);

      } catch (err) {
        console.error('Erreur chargement données :', err);
        setError('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [selectedCampagneId, refreshKey]);

  // ==================== RAFRAÎCHISSEMENT MANUEL ====================
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
  };

  // ==================== EXPORT DU DASHBOARD ====================
  const handleExportDashboard = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCampagneId) {
        params.append('campagne_id', selectedCampagneId);
      }
      params.append('format', exportFormat.toLowerCase());

      const response = await api.get('/dashboard/export', {
        params: params,
        responseType: 'blob',
      });

      const contentType = exportFormat === 'PDF'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const blob = new Blob([response.data], { type: contentType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `dashboard_${dateStr}.${exportFormat.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Erreur export dashboard', err);
      setError('Erreur lors de l\'export du dashboard');
    }
  };

  // ==================== RENDU ====================
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      {/* En-tête avec sélecteur de format et boutons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Tableau de bord — Direction
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refreshDashboard}>
            Rafraîchir
          </Button>

          {/* ✅ Sélecteur de format */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'PDF' | 'Excel')}
              label="Format"
            >
              <MenuItem value="Excel">Excel</MenuItem>
              <MenuItem value="PDF">PDF</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportDashboard}
          >
            Exporter
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ===== LE RESTE DU DASHBOARD (identique) ===== */}
      {/* Sélecteur de campagne */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Campagne</InputLabel>
          <Select
            value={selectedCampagneId || ''}
            onChange={(e) => setSelectedCampagneId(e.target.value)}
            label="Campagne"
          >
            {campagnes.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.libelle} {c.est_active && '⭐'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Suivi campagne */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">📈 Campagne sélectionnée</Typography>
          <Typography variant="body2" sx={{ bgcolor: 'success.light', px: 2, py: 0.5, borderRadius: 2 }}>
            Objectif : {campagne.prevu} t
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined"><CardContent><Typography variant="body2" color="textSecondary">Prévu</Typography><Typography variant="h4">{campagne.prevu.toLocaleString()} t</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ borderColor: 'success.main' }}><CardContent><Typography variant="body2" color="textSecondary">Collecté / Payé</Typography><Typography variant="h4" color="success.main">{campagne.collecte.toLocaleString()} t</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ borderColor: 'warning.main' }}><CardContent><Typography variant="body2" color="textSecondary">Reste à collecter</Typography><Typography variant="h4" color="warning.main">{campagne.reste.toLocaleString()} t</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined"><CardContent><Typography variant="body2" color="textSecondary">Taux de réalisation</Typography><Typography variant="h4">{campagne.taux.toFixed(1)}%</Typography><LinearProgress variant="determinate" value={Math.min(campagne.taux, 100)} sx={{ mt: 1, height: 8, borderRadius: 4 }} /></CardContent></Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Prévisions Égrenage / Ventes */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary">⚙️ Prévision Égrenage</Typography>
              <Typography variant="h6">Coton graine: {egrenagePrevu} t</Typography>
              <Typography variant="body2">Rendement attendu: {egrenageRendement}%</Typography>
              <Typography variant="body2">Coût estimé: {egrenageCout.toLocaleString()} FCFA</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary">📦 Prévision Ventes</Typography>
              {ventesPrevisions.length > 0 ? (
                ventesPrevisions.map((v) => (
                  <Typography key={v.produit} variant="body2">
                    {v.produit}: {v.volume_prevu_tonnes} t à {v.prix_vente_prevu} FCFA/kg
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">Aucune prévision enregistrée</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphique tendance */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>📊 Évolution mensuelle — Volume et Marge</Typography>
        <Recharts.ResponsiveContainer width="100%" height={300}>
          <Recharts.LineChart data={tendanceData}>
            <Recharts.CartesianGrid strokeDasharray="3 3" />
            <Recharts.XAxis dataKey="mois" />
            <Recharts.YAxis yAxisId="left" label={{ value: 'Volume (t)', angle: -90, position: 'insideLeft' }} />
            <Recharts.YAxis yAxisId="right" orientation="right" label={{ value: 'Marge (FCFA/kg)', angle: 90, position: 'insideRight' }} />
            <Recharts.Tooltip />
            <Recharts.Legend />
            <Recharts.Line yAxisId="left" type="monotone" dataKey="volume" stroke="#3B82F6" name="Volume (t)" strokeWidth={2} />
            <Recharts.Line yAxisId="right" type="monotone" dataKey="marge" stroke="#F97316" name="Marge (FCFA/kg)" strokeWidth={2} />
          </Recharts.LineChart>
        </Recharts.ResponsiveContainer>
      </Paper>

      {/* Camembert Export/Local */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>🌍 Répartition Export / Local</Typography>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
              Calculé sur le volume de fibre vendu durant la campagne en cours (devise USD/EUR = Export)
            </Typography>
            {exportLocalData.length > 0 && exportLocalData.some(d => d.value > 0) ? (
              <Recharts.ResponsiveContainer width="100%" height={250}>
                <Recharts.PieChart>
                  <Recharts.Pie
                    data={exportLocalData}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Recharts.Cell fill={PIE_COLORS[0]} />
                    <Recharts.Cell fill={PIE_COLORS[1]} />
                  </Recharts.Pie>
                  <Recharts.Tooltip />
                </Recharts.PieChart>
              </Recharts.ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="textSecondary">Aucune donnée de vente disponible</Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#3B82F6', borderRadius: 1 }} />
                <Typography variant="caption">Export</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#F59E0B', borderRadius: 1 }} />
                <Typography variant="caption">Marché local</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>🔄 Flux de la Chaîne de Valeur</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '1px solid #c8e6c9' }}>
                <Typography fontWeight="bold">🌱 Producteurs</Typography>
                <Typography variant="body2">{campagne.collecte} t / {campagne.prevu} t</Typography>
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
                <Typography variant="body2">Export {exportLocalData[0]?.value || 0}% • Local {exportLocalData[1]?.value || 0}%</Typography>
                <Typography variant="caption">Revenu estimé: 2.9 M FCFA</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Vues détaillées */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant={activeView === 'agriculture' ? 'contained' : 'outlined'} onClick={() => setActiveView('agriculture')}>🌾 Agriculture</Button>
            <Button variant={activeView === 'egrenage' ? 'contained' : 'outlined'} onClick={() => setActiveView('egrenage')}>⚙️ Égrenage</Button>
            <Button variant={activeView === 'ventes' ? 'contained' : 'outlined'} onClick={() => setActiveView('ventes')}>📦 Ventes</Button>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <DateFilter value={dateFilter} onChange={setDateFilter} />
          </Box>
        </Box>
        {activeView === 'agriculture' && selectedCampagneId && (
          <AgricultureView dateFilter={dateFilter} campagneId={selectedCampagneId} />
        )}
        {activeView === 'egrenage' && selectedCampagneId && (
          <EgrenageView dateFilter={dateFilter} campagneId={selectedCampagneId} />
        )}
        {activeView === 'ventes' && selectedCampagneId && (
          <VentesView dateFilter={dateFilter} campagneId={selectedCampagneId} />
        )}
      </Paper>

      {/* Tableau zones */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>📋 Détail par Zone avec taux de réalisation</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Zone</TableCell>
                <TableCell align="right">Volume (t)</TableCell>
                <TableCell align="right">Coût moyen (FCFA/kg)</TableCell>
                <TableCell align="right">Marge (FCFA)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {zonesData.map((row) => (
                <TableRow key={row.zone}>
                  <TableCell>{row.zone}</TableCell>
                  <TableCell align="right">{row.volume.toFixed(1)}</TableCell>
                  <TableCell align="right">{row.cout_moyen.toFixed(0)}</TableCell>
                  <TableCell align="right" sx={{ color: row.marge > 0 ? 'success.main' : 'error.main' }}>{row.marge.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
        <Box><Typography variant="body1" fontWeight="bold">Directeur Financier</Typography><Typography variant="body2" color="textSecondary">Admin SODECOTON</Typography></Box>
      </Box>
    </Box>
  );
}