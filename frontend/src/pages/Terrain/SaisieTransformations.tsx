// frontend/src/pages/Terrain/SaisieTransformations.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, MenuItem, Select,
  FormControl, InputLabel, Alert, CircularProgress, Grid, Card, CardContent,
  SelectChangeEvent
} from '@mui/material';
import { Save } from '@mui/icons-material';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

interface Usine {
  id: string;
  nom: string;
}

export default function SaisieTransformations() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [usines, setUsines] = useState<Usine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    usine_id: '',
    qte_coton_graine_kg: '',
    qte_fibre_kg: '',
    qte_graine_kg: '',
    cout_transformation: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchUsines = async () => {
      try {
        const res = await api.get('/usines');
        setUsines(res.data);
      } catch (err) {
        console.error(err);
        setError('Erreur de chargement des usines');
      }
    };
    fetchUsines();
  }, [token]);

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
        usine_id: formData.usine_id,
        qte_coton_graine_kg: parseFloat(formData.qte_coton_graine_kg),
        qte_fibre_kg: parseFloat(formData.qte_fibre_kg),
        qte_graine_kg: parseFloat(formData.qte_graine_kg),
        cout_transformation: parseFloat(formData.cout_transformation),
        date: formData.date || new Date().toISOString().split('T')[0]
      };
      await api.post('/transformations', payload);
      setSuccess('Transformation enregistrée avec succès');
      setFormData({
        usine_id: '',
        qte_coton_graine_kg: '',
        qte_fibre_kg: '',
        qte_graine_kg: '',
        cout_transformation: '',
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
        Saisie transformation (égrenage)
      </Typography>

      <Paper sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Usine</InputLabel>
                <Select
                  name="usine_id"
                  value={formData.usine_id}
                  onChange={handleSelectChange}
                  label="Usine"
                >
                  {usines.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.nom}</MenuItem>
                  ))}
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
                label="Coton graine entrant (kg)"
                type="number"
                name="qte_coton_graine_kg"
                value={formData.qte_coton_graine_kg}
                onChange={handleTextFieldChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fibre produite (kg)"
                type="number"
                name="qte_fibre_kg"
                value={formData.qte_fibre_kg}
                onChange={handleTextFieldChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Graines produites (kg)"
                type="number"
                name="qte_graine_kg"
                value={formData.qte_graine_kg}
                onChange={handleTextFieldChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Coût transformation (FCFA)"
                type="number"
                name="cout_transformation"
                value={formData.cout_transformation}
                onChange={handleTextFieldChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Enregistrer la transformation'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}