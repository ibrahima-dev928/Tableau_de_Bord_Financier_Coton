// src/pages/Terrain/SaisieAchats.tsx
import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, MenuItem, Select, FormControl, InputLabel,
  Chip, Alert, Divider, Avatar, CircularProgress
} from '@mui/material';
import { Save, History } from '@mui/icons-material';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

interface Producteur {
  id: string;
  nom: string;
  prenom: string;
}

interface Zone {
  id: string;
  nom: string;
}

interface Achat {
  id: string;
  date_achat: string;
  producteur_id: string;
  producteur_nom?: string;
  quantite_kg: number;
  prix_kg: number;
  montant_total: number;
  statut: string;
}

export default function SaisieAchats() {
  const { token } = useAuth();
  const [producteurs, setProducteurs] = useState<Producteur[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [mesAchats, setMesAchats] = useState<Achat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    producteur_id: '',
    zone_id: '',
    quantite_kg: '',
    prix_kg: '',
    date_achat: new Date().toISOString().split('T')[0]
  });

  // Chargement initial
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, zonesRes, achatsRes] = await Promise.all([
          api.get('/producteurs'),
          api.get('/zones'),
          api.get('/achats')
        ]);
        setProducteurs(prodRes.data);
        setZones(zonesRes.data);
        setMesAchats(achatsRes.data);
      } catch (err) {
        console.error(err);
        // Mock en cas d'erreur
        setProducteurs([{ id: '1', nom: 'Diallo', prenom: 'Amadou' }]);
        setZones([{ id: 'zone1', nom: 'Extrême-Nord' }]);
        setMesAchats([
          { id: 'a1', date_achat: '2026-06-14', producteur_id: '1', quantite_kg: 500, prix_kg: 250, montant_total: 125000, statut: 'en_attente', producteur_nom: 'Diallo Amadou' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        producteur_id: formData.producteur_id,
        zone_id: formData.zone_id,
        quantite_kg: parseFloat(formData.quantite_kg),
        prix_kg: parseFloat(formData.prix_kg),
        date_achat: formData.date_achat
      };
      await api.post('/achats', payload);
      setSuccess('Achat enregistré avec succès');
      setFormData({
        producteur_id: '',
        zone_id: '',
        quantite_kg: '',
        prix_kg: '',
        date_achat: new Date().toISOString().split('T')[0]
      });
      const achatsRes = await api.get('/achats');
      setMesAchats(achatsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const montantTotal = formData.quantite_kg && formData.prix_kg
    ? parseFloat(formData.quantite_kg) * parseFloat(formData.prix_kg)
    : 0;

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="primary">SODECOTON</Typography>
          <Typography variant="body2" color="textSecondary">
            Tableau de bord financier — Saisie
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">Responsable terrain</Typography>
          <Avatar sx={{ bgcolor: 'primary.main' }}>AM</Avatar>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Nouvel achat de coton graine</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Producteur</InputLabel>
                    <Select
                      name="producteur_id"
                      value={formData.producteur_id}
                      onChange={(e) => setFormData({ ...formData, producteur_id: e.target.value })}
                      label="Producteur"
                    >
                      {producteurs.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.nom} {p.prenom}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Zone</InputLabel>
                    <Select
                      name="zone_id"
                      value={formData.zone_id}
                      onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
                      label="Zone"
                    >
                      {zones.map((z) => (
                        <MenuItem key={z.id} value={z.id}>{z.nom}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date d'achat"
                    type="date"
                    fullWidth
                    name="date_achat"
                    value={formData.date_achat}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Quantité (kg)"
                    type="number"
                    fullWidth
                    name="quantite_kg"
                    placeholder="ex: 1200"
                    value={formData.quantite_kg}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Prix au kg (FCFA)"
                    type="number"
                    fullWidth
                    name="prix_kg"
                    placeholder="ex: 285"
                    value={formData.prix_kg}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">Montant total calculé</Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {montantTotal.toLocaleString()} FCFA
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<Save />}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Enregistrer la saisie'}
                  </Button>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    La saisie sera transmise à la Comptabilité pour validation.
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Mes saisies récentes</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Producteur</TableCell>
                    <TableCell align="right">Qté (kg)</TableCell>
                    <TableCell align="right">Montant</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
                  )}
                  {!loading && mesAchats.length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center">Aucune saisie</TableCell></TableRow>
                  )}
                  {!loading && mesAchats.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{new Date(row.date_achat).toLocaleDateString()}</TableCell>
                      <TableCell>{row.producteur_nom || row.producteur_id}</TableCell>
                      <TableCell align="right">{row.quantite_kg}</TableCell>
                      <TableCell align="right">{row.montant_total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.statut === 'en_attente' ? 'En attente' : row.statut}
                          size="small"
                          color={row.statut === 'valide' ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}