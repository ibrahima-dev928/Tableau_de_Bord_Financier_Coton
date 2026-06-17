// src/pages/Comptabilite/ValidationAchats.tsx
import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Chip, IconButton, TextField, MenuItem, Select, FormControl, InputLabel,
  Tabs, Tab, CircularProgress, Alert
} from '@mui/material';
import { Check, Close, Visibility, PictureAsPdf, Download } from '@mui/icons-material';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

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

export default function ValidationAchats() {
  const { token } = useAuth();
  const [achats, setAchats] = useState<Achat[]>([]);
  const [filteredAchats, setFilteredAchats] = useState<Achat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filtreZone, setFiltreZone] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('en_attente');
  const [zones, setZones] = useState<{ id: string; nom: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    let temp = [...achats];
    if (filtreZone) temp = temp.filter(a => a.zone_id === filtreZone);
    if (filtreStatut) temp = temp.filter(a => a.statut === filtreStatut);
    setFilteredAchats(temp);
  }, [achats, filtreZone, filtreStatut]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [achatsRes, zonesRes] = await Promise.all([
        api.get('/achats'),
        api.get('/zones')
      ]);
      setAchats(achatsRes.data);
      setZones(zonesRes.data);
    } catch (err) {
      console.error(err);
      // Mock en cas d'erreur
      setAchats([
        { id: '1', date_achat: '2026-06-15', producteur_id: 'p1', producteur_nom: 'Diallo Amadou', zone_id: 'z1', zone_nom: 'Extrême-Nord', quantite_kg: 500, prix_kg: 250, montant_total: 125000, statut: 'en_attente', saisi_par_id: 'u1' },
        { id: '2', date_achat: '2026-06-14', producteur_id: 'p2', producteur_nom: 'Sow Moussa', zone_id: 'z2', zone_nom: 'Nord', quantite_kg: 300, prix_kg: 255, montant_total: 76500, statut: 'en_attente', saisi_par_id: 'u2' }
      ]);
      setZones([{ id: 'z1', nom: 'Extrême-Nord' }, { id: 'z2', nom: 'Nord' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (id: string, action: 'valider' | 'rejeter') => {
    setLoading(true);
    try {
      const endpoint = action === 'valider' ? `/achats/${id}/valider` : `/achats/${id}/rejeter`;
      await api.put(endpoint);
      setSuccess(`Achat ${action === 'valider' ? 'validé' : 'rejeté'} avec succès`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    enAttente: achats.filter(a => a.statut === 'en_attente').length,
    valideesAujourdhui: achats.filter(a => a.statut === 'valide' && new Date(a.date_achat).toDateString() === new Date().toDateString()).length,
    montantSemaine: achats.filter(a => a.statut === 'valide' && new Date(a.date_achat) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).reduce((sum, a) => sum + a.montant_total, 0)
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Espace Comptabilité</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Validation des saisies & génération de rapports
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">En attente de validation</Typography>
              <Typography variant="h3" fontWeight="bold" color="warning.main">{stats.enAttente}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Validées aujourd'hui</Typography>
              <Typography variant="h3" fontWeight="bold" color="success.main">{stats.valideesAujourdhui}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Montant total (semaine)</Typography>
              <Typography variant="h3" fontWeight="bold">{(stats.montantSemaine / 1e6).toFixed(1)} M FCFA</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Zone</InputLabel>
              <Select value={filtreZone} onChange={(e) => setFiltreZone(e.target.value)} label="Zone">
                <MenuItem value="">Toutes</MenuItem>
                {zones.map(z => <MenuItem key={z.id} value={z.id}>{z.nom}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Statut</InputLabel>
              <Select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} label="Statut">
                <MenuItem value="en_attente">En attente</MenuItem>
                <MenuItem value="valide">Validé</MenuItem>
                <MenuItem value="rejete">Rejeté</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Button variant="outlined" startIcon={<Download />}>Exporter</Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Zone</TableCell>
                <TableCell align="right">Montant</TableCell><TableCell>Saisi par</TableCell>
                <TableCell>Statut</TableCell><TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow>
              )}
              {!loading && filteredAchats.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center">Aucune saisie</TableCell></TableRow>
              )}
              {!loading && filteredAchats.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{new Date(a.date_achat).toLocaleDateString()}</TableCell>
                  <TableCell>Achat</TableCell>
                  <TableCell>{a.zone_nom}</TableCell>
                  <TableCell align="right">{a.montant_total.toLocaleString()} FCFA</TableCell>
                  <TableCell>{a.saisi_par_id?.slice(0, 8)}</TableCell>
                  <TableCell>
                    <Chip label={a.statut} color={a.statut === 'en_attente' ? 'warning' : a.statut === 'valide' ? 'success' : 'error'} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    {a.statut === 'en_attente' ? (
                      <>
                        <IconButton color="success" onClick={() => handleValidation(a.id, 'valider')} disabled={loading}>
                          <Check />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleValidation(a.id, 'rejeter')} disabled={loading}>
                          <Close />
                        </IconButton>
                      </>
                    ) : (
                      <IconButton color="info"><Visibility /></IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}