import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, TextField, MenuItem, Select, FormControl,
  InputLabel, Button, IconButton, Alert, CircularProgress, Grid
} from '@mui/material';
import { Download, Refresh } from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { formatError } from '../utils/formatError';

interface Achat {
  id: string;
  date_achat: string;
  producteur_id: string;
  producteur_nom?: string;
  zone_id: string;
  zone_nom?: string;
  quantite_kg: number;
  prix_kg: number;
  montant_total: number;
  statut: 'en_attente' | 'valide' | 'rejete';
  saisi_par_id: string;
}

export default function AdminAchats() {
  const { token } = useAuth();
  const [achats, setAchats] = useState<Achat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filtres, setFiltres] = useState({
    zone_id: '',
    statut: '',
    date_debut: '',
    date_fin: ''
  });
  const [zones, setZones] = useState<{ id: string; nom: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Charger les zones (pour les filtres)
      const zonesRes = await api.get('/zones');
      setZones(zonesRes.data || []);

      // Charger les achats (avec filtres)
      const params = new URLSearchParams();
      if (filtres.zone_id) params.append('zone_id', filtres.zone_id);
      if (filtres.statut) params.append('statut', filtres.statut);
      if (filtres.date_debut) params.append('date_debut', filtres.date_debut);
      if (filtres.date_fin) params.append('date_fin', filtres.date_fin);
      const url = `/achats?${params.toString()}`;
      const achatsRes = await api.get(url);
      setAchats(achatsRes.data || []);
    } catch (err: any) {
      setError(formatError(err));
      // Mock en cas d'erreur
      setAchats([
        { id: '1', date_achat: '2026-06-15', producteur_id: 'p1', producteur_nom: 'Diallo Amadou', zone_id: 'z1', zone_nom: 'Extrême-Nord', quantite_kg: 500, prix_kg: 250, montant_total: 125000, statut: 'valide', saisi_par_id: 'u1' },
        { id: '2', date_achat: '2026-06-14', producteur_id: 'p2', producteur_nom: 'Sow Moussa', zone_id: 'z2', zone_nom: 'Nord', quantite_kg: 300, prix_kg: 255, montant_total: 76500, statut: 'en_attente', saisi_par_id: 'u2' }
      ]);
      setZones([{ id: 'z1', nom: 'Extrême-Nord' }, { id: 'z2', nom: 'Nord' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: any) => {
    setFiltres({ ...filtres, [e.target.name]: e.target.value });
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleExport = () => {
    alert('Export Excel en cours de développement');
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'valide': return 'success';
      case 'en_attente': return 'warning';
      case 'rejete': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'valide': return 'Validé';
      case 'en_attente': return 'En attente';
      case 'rejete': return 'Rejeté';
      default: return statut;
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Gestion des achats (Admin)</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Zone</InputLabel>
              <Select
                name="zone_id"
                value={filtres.zone_id}
                onChange={handleFilterChange}
                label="Zone"
              >
                <MenuItem value="">Toutes</MenuItem>
                {zones.map(z => <MenuItem key={z.id} value={z.id}>{z.nom}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                name="statut"
                value={filtres.statut}
                onChange={handleFilterChange}
                label="Statut"
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="en_attente">En attente</MenuItem>
                <MenuItem value="valide">Validé</MenuItem>
                <MenuItem value="rejete">Rejeté</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Date début"
              type="date"
              name="date_debut"
              value={filtres.date_debut}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Date fin"
              type="date"
              name="date_fin"
              value={filtres.date_fin}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3} sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleRefresh} startIcon={<Refresh />}>
              Actualiser
            </Button>
            <Button variant="outlined" onClick={handleExport} startIcon={<Download />}>
              Exporter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau */}
      <Paper sx={{ p: 2 }}>
        {loading && <CircularProgress />}
        {!loading && achats.length === 0 && <Typography>Aucun achat trouvé.</Typography>}
        {!loading && achats.length > 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Producteur</TableCell>
                  <TableCell>Zone</TableCell>
                  <TableCell align="right">Volume (kg)</TableCell>
                  <TableCell align="right">Prix (FCFA/kg)</TableCell>
                  <TableCell align="right">Montant total</TableCell>
                  <TableCell>Saisi par</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {achats.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.date_achat).toLocaleDateString()}</TableCell>
                    <TableCell>{a.producteur_nom || a.producteur_id}</TableCell>
                    <TableCell>{a.zone_nom || a.zone_id}</TableCell>
                    <TableCell align="right">{a.quantite_kg}</TableCell>
                    <TableCell align="right">{a.prix_kg}</TableCell>
                    <TableCell align="right">{a.montant_total.toLocaleString()} FCFA</TableCell>
                    <TableCell>{a.saisi_par_id?.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(a.statut)}
                        color={getStatusColor(a.statut)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}