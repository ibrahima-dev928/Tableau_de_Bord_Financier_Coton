// src/pages/Rapports.tsx
import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, TextField,
  MenuItem, Select, FormControl, InputLabel, Alert,
  CircularProgress, IconButton, Grid, Chip
} from '@mui/material';
import { Download, Schedule } from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { formatError } from '../utils/formatError';

interface Rapport {
  id: string;
  type: string;
  periode_debut: string;
  periode_fin: string;
  format: string;
  fichier_path: string;
  genere_par_id: string;
  genere_le: string;
}

export default function Rapports() {
  const { token } = useAuth();
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    type: '',
    periode_debut: '',
    periode_fin: '',
    format: ''
  });
  const [frequence, setFrequence] = useState('');

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rapports');
      setRapports(res.data);
    } catch (err) {
      setError(formatError(err));
      setRapports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) setFormData({ ...formData, [name]: value as string });
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    if (name) setFormData({ ...formData, [name]: value as string });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.periode_debut || !formData.periode_fin || !formData.format) {
      setError('Veuillez remplir tous les champs');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setLoading(true);
    try {
      await api.post('/rapports', formData);
      setSuccess('Rapport généré avec succès');
      fetchData();
      setFormData({ type: '', periode_debut: '', periode_fin: '', format: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string, format: string) => {
    try {
      const response = await api.get(`/rapports/download/${id}`, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const extension = format.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx';
      link.download = `rapport_${id}.${extension}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setError('Erreur lors du téléchargement');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Génération de rapports</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Nouveau rapport</Typography>
            <form onSubmit={handleGenerate}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleSelectChange}
                  label="Type"
                >
                  <MenuItem value="KPIMensuel">KPIs mensuels</MenuItem>
                  <MenuItem value="BilanCampagne">Bilan campagne</MenuItem>
                  <MenuItem value="EtatAchats">État des achats</MenuItem>
                  <MenuItem value="ReleveEpargne">Relevé épargne</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Période début"
                type="date"
                name="periode_debut"
                value={formData.periode_debut}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                label="Période fin"
                type="date"
                name="periode_fin"
                value={formData.periode_fin}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Format</InputLabel>
                <Select
                  name="format"
                  value={formData.format}
                  onChange={handleSelectChange}
                  label="Format"
                >
                  <MenuItem value="PDF">PDF</MenuItem>
                  <MenuItem value="Excel">Excel</MenuItem>
                </Select>
              </FormControl>
              <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 2 }}>
                {loading ? <CircularProgress size={24} /> : 'Générer'}
              </Button>
            </form>

            {/* Planification (optionnelle) */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #ddd' }}>
              <Typography variant="subtitle2">Planifier</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                <FormControl sx={{ minWidth: 150 }} size="small" disabled>
                  <InputLabel>Fréquence</InputLabel>
                  <Select value={frequence} onChange={(e) => setFrequence(e.target.value)} label="Fréquence">
                    <MenuItem value="0 8 * * *">Quotidien (8h)</MenuItem>
                    <MenuItem value="0 8 * * 1">Hebdomadaire (lundi)</MenuItem>
                    <MenuItem value="0 8 1 * *">Mensuel (1er du mois)</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="outlined" startIcon={<Schedule />} disabled>
                  Planifier (bientôt disponible)
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Rapports générés</Typography>
            {loading && <CircularProgress />}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Période</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rapports.length === 0 && !loading && (
                    <TableRow><TableCell colSpan={5} align="center">Aucun rapport</TableCell></TableRow>
                  )}
                  {rapports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>
                        {new Date(r.periode_debut).toLocaleDateString()} - {new Date(r.periode_fin).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={r.format}
                          size="small"
                          color={r.format === 'PDF' ? 'primary' : 'success'}
                        />
                      </TableCell>
                      <TableCell>{new Date(r.genere_le).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleDownload(r.id, r.format)} color="primary">
                          <Download />
                        </IconButton>
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