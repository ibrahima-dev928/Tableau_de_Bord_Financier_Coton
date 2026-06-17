import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Alert,
  CircularProgress, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { formatError } from '../utils/formatError';

interface Zone {
  id: string;
  nom: string;
  type: string;
  parent_id?: string;
}

interface Usine {
  id: string;
  nom: string;
  zone_id: string;
  capacite_kg_jour: number;
  zone_nom?: string;
}

export default function ZonesUsines() {
  const { token } = useAuth();
  const [tab, setTab] = useState(0);
  const [zones, setZones] = useState<Zone[]>([]);
  const [usines, setUsines] = useState<Usine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({ nom: '', type: '', parent_id: '' });
  const [zoneList, setZoneList] = useState<Zone[]>([]);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [zonesRes, usinesRes] = await Promise.all([
        api.get('/zones'),
        api.get('/usines')
      ]);
      setZones(zonesRes.data || []);
      setUsines(usinesRes.data || []);
      setZoneList(zonesRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError(formatError(err));
      // Données mockées pour test
      const mockZones: Zone[] = [
        { id: 'z1', nom: 'Extrême-Nord', type: 'Region' },
        { id: 'z2', nom: 'Nord', type: 'Region' },
        { id: 'z3', nom: 'Adamawa', type: 'Region' }
      ];
      const mockUsines: Usine[] = [
        { id: 'u1', nom: 'Usine Garoua', zone_id: 'z1', capacite_kg_jour: 50000, zone_nom: 'Extrême-Nord' },
        { id: 'u2', nom: 'Usine Ngaoundéré', zone_id: 'z3', capacite_kg_jour: 30000, zone_nom: 'Adamawa' }
      ];
      setZones(mockZones);
      setUsines(mockUsines);
      setZoneList(mockZones);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: any, type?: string) => {
    if (type === 'zone' && item) {
      setEditingId(item.id);
      setFormData({ nom: item.nom, type: item.type, parent_id: item.parent_id || '' });
    } else if (type === 'usine' && item) {
      setEditingId(item.id);
      setFormData({ nom: item.nom, zone_id: item.zone_id, capacite_kg_jour: item.capacite_kg_jour || '' });
    } else {
      setEditingId(null);
      setFormData(tab === 0 ? { nom: '', type: '', parent_id: '' } : { nom: '', zone_id: '', capacite_kg_jour: '' });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  // ✅ Fonction handleSubmit corrigée
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = tab === 0 ? '/zones' : '/usines';

      // Construction du payload avec gestion de parent_id
      let payload: any = {};
      if (tab === 0) {
        payload = {
          nom: formData.nom,
          type: formData.type || null,
          // parent_id: si vide, on envoie null
          parent_id: formData.parent_id && formData.parent_id.trim() !== '' ? formData.parent_id : null
        };
      } else {
        payload = {
          nom: formData.nom,
          zone_id: formData.zone_id,
          capacite_kg_jour: parseFloat(formData.capacite_kg_jour) || 0
        };
      }

      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, payload);
        setSuccess(`${tab === 0 ? 'Zone' : 'Usine'} modifiée`);
      } else {
        await api.post(endpoint, payload);
        setSuccess(`${tab === 0 ? 'Zone' : 'Usine'} ajoutée`);
      }

      setOpenDialog(false);
      await fetchData(); // Recharge les données
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Erreur submit:', err);
      setError(formatError(err));
    } finally {
      setLoading(false); // ← Indispensable pour arrêter le spinner
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!window.confirm(`Confirmer la suppression de cette ${type} ?`)) return;
    setLoading(true);
    try {
      const endpoint = type === 'zone' ? '/zones' : '/usines';
      await api.delete(`${endpoint}/${id}`);
      setSuccess(`${type} supprimée`);
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
      <Typography variant="h5" fontWeight="bold" gutterBottom>Gestion des zones et usines</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Zones" />
          <Tab label="Usines" />
        </Tabs>

        {tab === 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog(null, 'zone')}>
                Ajouter une zone
              </Button>
            </Box>
            {loading && <CircularProgress />}
            {!loading && zones.length === 0 && (
              <Typography variant="body1" sx={{ my: 2 }}>Aucune zone enregistrée.</Typography>
            )}
            {!loading && zones.length > 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell><TableCell>Type</TableCell><TableCell>Parent</TableCell><TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {zones.map((z) => (
                      <TableRow key={z.id}>
                        <TableCell>{z.nom}</TableCell>
                        <TableCell>{z.type}</TableCell>
                        <TableCell>{z.parent_id ? zoneList.find(zt => zt.id === z.parent_id)?.nom || z.parent_id : '-'}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleOpenDialog(z, 'zone')}><Edit /></IconButton>
                          <IconButton onClick={() => handleDelete(z.id, 'zone')}><Delete /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {tab === 1 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog(null, 'usine')}>
                Ajouter une usine
              </Button>
            </Box>
            {loading && <CircularProgress />}
            {!loading && usines.length === 0 && (
              <Typography variant="body1" sx={{ my: 2 }}>Aucune usine enregistrée.</Typography>
            )}
            {!loading && usines.length > 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell><TableCell>Zone</TableCell><TableCell>Capacité (kg/jour)</TableCell><TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usines.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.nom}</TableCell>
                        <TableCell>{u.zone_nom || u.zone_id}</TableCell>
                        <TableCell>{u.capacite_kg_jour}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleOpenDialog(u, 'usine')}><Edit /></IconButton>
                          <IconButton onClick={() => handleDelete(u.id, 'usine')}><Delete /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>

      {/* Dialogue d'ajout/modification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Modifier' : 'Ajouter'} {tab === 0 ? 'une zone' : 'une usine'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Nom"
            fullWidth
            margin="normal"
            value={formData.nom || ''}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
          {tab === 0 ? (
            <>
              <TextField
                label="Type"
                fullWidth
                margin="normal"
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Zone parente</InputLabel>
                <Select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  label="Zone parente"
                >
                  <MenuItem value="">Aucune</MenuItem>
                  {zoneList.map(z => <MenuItem key={z.id} value={z.id}>{z.nom}</MenuItem>)}
                </Select>
              </FormControl>
            </>
          ) : (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Zone</InputLabel>
                <Select
                  value={formData.zone_id || ''}
                  onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
                  label="Zone"
                  required
                >
                  {zoneList.map(z => <MenuItem key={z.id} value={z.id}>{z.nom}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                label="Capacité (kg/jour)"
                type="number"
                fullWidth
                margin="normal"
                value={formData.capacite_kg_jour || ''}
                onChange={(e) => setFormData({ ...formData, capacite_kg_jour: e.target.value })}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}