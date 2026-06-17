// src/pages/Producteurs.tsx

import { useState, useEffect } from 'react';
import { formatError } from '../utils/formatError';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Producteur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  zone_id: string;
  zone_nom?: string;
}

interface Zone {
  id: string;
  nom: string;
}

export default function Producteurs() {
  const { token } = useAuth();
  const [producteurs, setProducteurs] = useState<Producteur[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    zone_id: ''
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  // ✅ fetchData corrigée : plus de données mockées, erreur affichée et listes vidées
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prodRes, zonesRes] = await Promise.all([
        api.get('/producteurs'),
        api.get('/zones')
      ]);
      setProducteurs(prodRes.data);
      setZones(zonesRes.data);
    } catch (err: any) {
      console.error('Erreur API :', err);
      setError(formatError(err));
      // ⚠️ Ne pas mettre de données mockées – on vide les listes pour voir l'erreur réelle
      setProducteurs([]);
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (producteur?: Producteur) => {
    if (producteur) {
      setEditingId(producteur.id);
      setFormData({
        nom: producteur.nom,
        prenom: producteur.prenom || '',
        telephone: producteur.telephone || '',
        zone_id: producteur.zone_id
      });
    } else {
      setEditingId(null);
      setFormData({ nom: '', prenom: '', telephone: '', zone_id: '' });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/producteurs/${editingId}`, formData);
        setSuccess('Producteur modifié');
      } else {
        await api.post('/producteurs', formData);
        setSuccess('Producteur ajouté');
      }
      setOpenDialog(false);
      await fetchData(); // rafraîchissement immédiat
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setLoading(true);
    setError('');
    try {
      await api.delete(`/producteurs/${id}`);
      setSuccess('Producteur supprimé');
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Gestion des producteurs</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Nouveau producteur
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ p: 2 }}>
        {loading && <CircularProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Prénom</TableCell>
                <TableCell>Téléphone</TableCell>
                <TableCell>Zone</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {producteurs.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.nom}</TableCell>
                  <TableCell>{p.prenom}</TableCell>
                  <TableCell>{p.telephone}</TableCell>
                  <TableCell>{p.zone_nom || p.zone_id}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleOpenDialog(p)}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(p.id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingId ? 'Modifier' : 'Ajouter'} un producteur</DialogTitle>
        <DialogContent>
          <TextField
            label="Nom"
            fullWidth
            margin="normal"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
          <TextField
            label="Prénom"
            fullWidth
            margin="normal"
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
          />
          <TextField
            label="Téléphone"
            fullWidth
            margin="normal"
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Zone</InputLabel>
            <Select
              value={formData.zone_id}
              onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
              label="Zone"
              required
            >
              {zones.map(z => <MenuItem key={z.id} value={z.id}>{z.nom}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}