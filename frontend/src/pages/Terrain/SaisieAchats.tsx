// frontend/src/pages/Terrain/SaisieAchats.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, TextField, Button, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert, CircularProgress,
  MenuItem, FormControl, InputLabel, Select, Chip, Grid, Card, CardContent
} from '@mui/material';
import { Save } from '@mui/icons-material';
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
  const navigate = useNavigate();
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
        setError('Erreur de chargement des données');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: any) => {
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
      navigate('/?refresh=' + Date.now());
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
        <Typography variant="h5" fontWeight="bold" color="primary">
          SODECOTON – Tableau de bord financier
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Responsable terrain
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Formulaire */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Nouvel achat de coton graine</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Producteur</InputLabel>
                    <Select
                      name="producteur_id"
                      value={formData.producteur_id}
                      onChange={handleSelectChange}
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
                      onChange={handleSelectChange}
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
                    name="date_achat"
                    value={formData.date_achat}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Quantité (kg)"
                    type="number"
                    name="quantite_kg"
                    value={formData.quantite_kg}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Prix au kg (FCFA)"
                    type="number"
                    name="prix_kg"
                    value={formData.prix_kg}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">Montant total calculé</Typography>
                      <Typography variant="h5">{montantTotal.toLocaleString()} FCFA</Typography>
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

        {/* Historique */}
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
                      <TableCell align="right">{row.montant_total.toLocaleString()} FCFA</TableCell>
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