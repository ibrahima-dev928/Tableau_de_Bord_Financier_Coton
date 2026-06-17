// src/pages/Terrain/SaisieTransformations.tsx
import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, MenuItem, Select,
  FormControl, InputLabel, Alert, CircularProgress, Grid, SelectChangeEvent
} from '@mui/material';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { formatError } from '../../utils/formatError';

interface Usine {
  id: string;
  nom: string;
}

export default function SaisieTransformations() {
  const { token } = useAuth();
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
    date: ''
  });

  useEffect(() => {
    const fetchUsines = async () => {
      try {
        const res = await api.get('/usines');
        setUsines(res.data);
      } catch (err) {
        console.error(err);
        setUsines([{ id: 'u1', nom: 'Usine Garoua' }]);
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
      setSuccess('Transformation enregistrée');
      setFormData({
        usine_id: '',
        qte_coton_graine_kg: '',
        qte_fibre_kg: '',
        qte_graine_kg: '',
        cout_transformation: '',
        date: ''
      });
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Saisie transformation (égrenage)</Typography>
      <Paper sx={{ p: 3 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Usine</InputLabel>
                <Select
                  name="usine_id"
                  value={formData.usine_id}
                  onChange={handleSelectChange}
                  label="Usine"
                  required
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
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Enregistrer'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}