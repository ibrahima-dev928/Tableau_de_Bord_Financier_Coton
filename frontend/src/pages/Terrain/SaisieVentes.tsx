// frontend/src/pages/Terrain/SaisieVentes.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, MenuItem, Select,
  FormControl, InputLabel, Alert, CircularProgress, Grid, Card, CardContent,
  SelectChangeEvent
} from '@mui/material';
import { Save } from '@mui/icons-material';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

export default function SaisieVentes() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    type_vente: '',
    quantite_kg: '',
    prix_unitaire: '',
    devise: 'FCFA',
    couts_logistiques: '0',
    date: new Date().toISOString().split('T')[0]
  });

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        type_vente: formData.type_vente,
        quantite_kg: parseFloat(formData.quantite_kg),
        prix_unitaire: parseFloat(formData.prix_unitaire),
        devise: formData.devise,
        couts_logistiques: parseFloat(formData.couts_logistiques) || 0,
        date: formData.date || new Date().toISOString().split('T')[0]
      };
      await api.post('/ventes', payload);
      setSuccess('Vente enregistrée avec succès');
      setFormData({
        type_vente: '',
        quantite_kg: '',
        prix_unitaire: '',
        devise: 'FCFA',
        couts_logistiques: '0',
        date: new Date().toISOString().split('T')[0]
      });
      // ✅ Redirection vers le dashboard avec rafraîchissement
      navigate('/?refresh=' + Date.now());
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
        Saisie d'une vente
      </Typography>

      <Paper sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type de vente</InputLabel>
                <Select
                  name="type_vente"
                  value={formData.type_vente}
                  onChange={handleSelectChange}
                  label="Type de vente"
                >
                  <MenuItem value="Fibre">Fibre</MenuItem>
                  <MenuItem value="Graines">Graines</MenuItem>
                  <MenuItem value="Huile">Huile</MenuItem>
                  <MenuItem value="Tourteau">Tourteau</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleTextFieldChange}
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
                onChange={handleTextFieldChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prix unitaire (FCFA/kg)"
                type="number"
                name="prix_unitaire"
                value={formData.prix_unitaire}
                onChange={handleTextFieldChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Devise</InputLabel>
                <Select
                  name="devise"
                  value={formData.devise}
                  onChange={handleSelectChange}
                  label="Devise"
                >
                  <MenuItem value="FCFA">FCFA</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Coûts logistiques (FCFA)"
                type="number"
                name="couts_logistiques"
                value={formData.couts_logistiques}
                onChange={handleTextFieldChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Enregistrer la vente'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}