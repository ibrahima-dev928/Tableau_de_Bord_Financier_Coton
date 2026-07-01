// src/components/MesActivites.tsx
import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Activite {
  id: string;
  type: 'transformation' | 'vente' | 'rapport';
  date: string;
  montant: number;
  statut: string;          // 'valide', 'en_attente', etc.
  modifiable: boolean;
}

export default function MesActivites() {
  const { token } = useAuth();
  const [activites, setActivites] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transfoRes, ventesRes, rapportsRes] = await Promise.all([
          api.get('/transformations/me'),
          api.get('/ventes/me'),
          api.get('/rapports/me')
        ]);

        const transformations = transfoRes.data.map((t: any) => ({
          id: t.id,
          type: 'transformation',
          date: t.date,
          montant: t.cout_transformation,
          statut: 'valide', // ou un statut si vous en avez
          modifiable: false // ex: on ne modifie pas une transformation validée
        }));

        const ventes = ventesRes.data.map((v: any) => ({
          id: v.id,
          type: 'vente',
          date: v.date,
          montant: v.montant_total,
          statut: v.statut || 'valide',
          modifiable: v.statut !== 'valide' // on peut modifier si non validée
        }));

        const rapports = rapportsRes.data.map((r: any) => ({
          id: r.id,
          type: 'rapport',
          date: r.genere_le,
          montant: 0,
          statut: 'généré',
          modifiable: false
        }));

        setActivites([...transformations, ...ventes, ...rapports]);
      } catch (err) {
        console.error('Erreur chargement activités', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleModifier = (id: string, type: string) => {
    // Rediriger vers le formulaire d'édition correspondant
    // Ex: navigate(`/modifier-${type}/${id}`);
  };

  const handleSupprimer = async (id: string, type: string) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(`/api/${type}s/${id}`);
      // Recharger la liste
      setActivites(activites.filter(a => a.id !== id));
    } catch (err) {
      console.error('Erreur suppression', err);
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>📋 Mes dernières activités</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Montant (FCFA)</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activites.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.type}</TableCell>
                <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                <TableCell align="right">{a.montant.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip label={a.statut} color={a.statut === 'valide' ? 'success' : 'warning'} size="small" />
                </TableCell>
                <TableCell align="center">
                  {a.modifiable && (
                    <>
                      <IconButton size="small" color="primary" onClick={() => handleModifier(a.id, a.type)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleSupprimer(a.id, a.type)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}