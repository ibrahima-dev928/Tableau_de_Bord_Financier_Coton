// src/pages/Utilisateurs.tsx
import { useState, useEffect } from 'react';
import { formatError } from '../utils/formatError';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  Alert, CircularProgress, Chip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  role: string;
  zone_id?: string;
  actif: boolean;
}

interface Zone {
  id: string;
  nom: string;
}

export default function Utilisateurs() {
  const { token } = useAuth();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    role: '',
    zone_id: '',
    actif: true
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, zonesRes] = await Promise.all([
        api.get('/utilisateurs'),
        api.get('/zones')
      ]);
      setUtilisateurs(usersRes.data);
      setZones(zonesRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur de chargement');
      setError(formatError(err));
      setUtilisateurs([
        { id: '1', nom: 'Admin', email: 'admin@sodecoton.com', role: 'Direction', actif: true },
        { id: '2', nom: 'Compta', email: 'compta@sodecoton.com', role: 'Comptabilite', actif: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: Utilisateur) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        nom: user.nom,
        email: user.email,
        mot_de_passe: '',
        role: user.role,
        zone_id: user.zone_id || '',
        actif: user.actif
      });
    } else {
      setEditingId(null);
      setFormData({ nom: '', email: '', mot_de_passe: '', role: '', zone_id: '', actif: true });
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
    try {
      const payload = { ...formData };
      if (!editingId && !payload.mot_de_passe) {
        setError('Mot de passe requis pour un nouvel utilisateur');
        setLoading(false);
        return;
      }
      if (editingId) {
        await api.put(`/utilisateurs/${editingId}`, payload);
        setSuccess('Utilisateur modifié');
      } else {
        await api.post('/utilisateurs', payload);
        setSuccess('Utilisateur ajouté');
      }
      setOpenDialog(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setLoading(true);
    try {
      await api.delete(`/utilisateurs/${id}`);
      setSuccess('Utilisateur supprimé');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Gestion des utilisateurs</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Ajouter
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell><TableCell>Email</TableCell><TableCell>Rôle</TableCell><TableCell>Zone</TableCell><TableCell>Actif</TableCell><TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {utilisateurs.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.nom}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.zone_id || '-'}</TableCell>
                  <TableCell><Chip label={u.actif ? 'Actif' : 'Inactif'} color={u.actif ? 'success' : 'default'} size="small" /></TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleOpenDialog(u)}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(u.id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingId ? 'Modifier' : 'Ajouter'} un utilisateur</DialogTitle>
        <DialogContent>
          <TextField label="Nom" fullWidth margin="normal" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
          <TextField label="Email" type="email" fullWidth margin="normal" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          {!editingId && <TextField label="Mot de passe" type="password" fullWidth margin="normal" value={formData.mot_de_passe} onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })} required />}
          <FormControl fullWidth margin="normal">
            <InputLabel>Rôle</InputLabel>
            <Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} label="Rôle" required>
              <MenuItem value="Direction">Direction</MenuItem>
              <MenuItem value="Comptabilite">Comptabilité</MenuItem>
              <MenuItem value="Responsable_terrain">Responsable terrain</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Zone</InputLabel>
            <Select value={formData.zone_id} onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })} label="Zone">
              <MenuItem value="">Aucune</MenuItem>
              {zones.map(z => <MenuItem key={z.id} value={z.id}>{z.nom}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Actif</InputLabel>
            <Select value={formData.actif ? 'true' : 'false'} onChange={(e) => setFormData({ ...formData, actif: e.target.value === 'true' })} label="Actif">
              <MenuItem value="true">Oui</MenuItem>
              <MenuItem value="false">Non</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}