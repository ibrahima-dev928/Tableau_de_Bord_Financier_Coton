import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid, MenuItem,
  Select, FormControl, InputLabel, Alert, CircularProgress,
  Divider, IconButton, Chip
} from '@mui/material';
import { Add, Delete, Save } from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { formatError } from '../utils/formatError';

// ========== INTERFACES ==========
interface Campagne {
  id: string;
  libelle: string;        // nom de la campagne
  est_active: boolean;
  date_debut?: string;    // au format YYYY-MM-DD
  date_fin?: string;
}

interface AgricultureData {
  campagne_id: string;
  volume_prevu_tonnes: number;
  prix_plancher: number;
  seuil_alerte: number;
  delai_paiement_jours: number;
}

interface EgrenageData {
  campagne_id: string;
  coton_graine_prevu_tonnes: number;
  rendement_attendu_pourcent: number;
  cout_transformation_estime: number;
}

interface VenteData {
  produit: string;
  volume_prevu_tonnes: number;
  prix_vente_prevu: number;
  cout_logistique_estime: number;
}

const PRODUITS_VENTE = ['Fibre', 'Graines', 'Huile', 'Tourteau'];

export default function Parametres() {
  const { token } = useAuth();
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [selectedCampagne, setSelectedCampagne] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // États pour les champs de la campagne
  const [campagneLibelle, setCampagneLibelle] = useState('');
  const [campagneDateDebut, setCampagneDateDebut] = useState('');
  const [campagneDateFin, setCampagneDateFin] = useState('');

  // États pour les prévisions
  const [agriculture, setAgriculture] = useState<AgricultureData>({
    campagne_id: '',
    volume_prevu_tonnes: 0,
    prix_plancher: 250,
    seuil_alerte: 300,
    delai_paiement_jours: 30
  });

  const [egrenage, setEgrenage] = useState<EgrenageData>({
    campagne_id: '',
    coton_graine_prevu_tonnes: 0,
    rendement_attendu_pourcent: 41.2,
    cout_transformation_estime: 0
  });

  const [ventes, setVentes] = useState<VenteData[]>(
    PRODUITS_VENTE.map(p => ({
      produit: p,
      volume_prevu_tonnes: 0,
      prix_vente_prevu: 0,
      cout_logistique_estime: 0
    }))
  );

  // ========== CHARGEMENT DES CAMPAGNES ==========
  useEffect(() => {
    const fetchCampagnes = async () => {
      try {
        const res = await api.get('/campagnes');
        setCampagnes(res.data);
        const active = res.data.find((c: Campagne) => c.est_active);
        if (active) {
          setSelectedCampagne(active.id);
        } else if (res.data.length > 0) {
          setSelectedCampagne(res.data[0].id);
        }
      } catch (err) {
        console.error('Erreur chargement campagnes', err);
      }
    };
    fetchCampagnes();
  }, []);

  // ========== CHARGEMENT DES PRÉVISIONS ==========
  useEffect(() => {
    if (selectedCampagne) {
      loadPrevisions(selectedCampagne);
      // Mettre à jour les champs de la campagne
      const campagne = campagnes.find(c => c.id === selectedCampagne);
      if (campagne) {
        setCampagneLibelle(campagne.libelle || '');
        setCampagneDateDebut(campagne.date_debut || '');
        setCampagneDateFin(campagne.date_fin || '');
      }
    }
  }, [selectedCampagne, campagnes]);

  const loadPrevisions = async (campagneId: string) => {
    setLoading(true);
    setError('');
    try {
      // Agriculture
      const agriRes = await api.get(`/parametres/previsions/agriculture?campagne_id=${campagneId}`);
      if (agriRes.data && agriRes.data.id) {
        setAgriculture({ ...agriRes.data, campagne_id: campagneId });
      } else {
        setAgriculture({
          campagne_id: campagneId,
          volume_prevu_tonnes: 0,
          prix_plancher: 250,
          seuil_alerte: 300,
          delai_paiement_jours: 30
        });
      }

      // Égrenage
      const egreRes = await api.get(`/parametres/previsions/egrenage?campagne_id=${campagneId}`);
      if (egreRes.data && egreRes.data.id) {
        setEgrenage({ ...egreRes.data, campagne_id: campagneId });
      } else {
        setEgrenage({
          campagne_id: campagneId,
          coton_graine_prevu_tonnes: 0,
          rendement_attendu_pourcent: 41.2,
          cout_transformation_estime: 0
        });
      }

      // Ventes
      const ventesRes = await api.get(`/parametres/previsions/ventes?campagne_id=${campagneId}`);
      if (ventesRes.data && ventesRes.data.length > 0) {
        const newVentes = PRODUITS_VENTE.map(p => {
          const found = ventesRes.data.find((v: any) => v.produit === p);
          return found
            ? { ...found }
            : { produit: p, volume_prevu_tonnes: 0, prix_vente_prevu: 0, cout_logistique_estime: 0 };
        });
        setVentes(newVentes);
      } else {
        setVentes(PRODUITS_VENTE.map(p => ({
          produit: p,
          volume_prevu_tonnes: 0,
          prix_vente_prevu: 0,
          cout_logistique_estime: 0
        })));
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  // ========== SAUVEGARDE ==========
  const handleSave = async () => {
    if (!selectedCampagne) {
      setError('Veuillez sélectionner une campagne.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Sauvegarder les informations de la campagne (libellé, dates)
      await api.put(`/campagnes/${selectedCampagne}`, {
        libelle: campagneLibelle,
        date_debut: campagneDateDebut || null,
        date_fin: campagneDateFin || null,
        est_active: true // ou laisser l'état actuel
      });

      // Agriculture
      await api.put('/parametres/previsions/agriculture', {
        campagne_id: selectedCampagne,
        volume_prevu_tonnes: agriculture.volume_prevu_tonnes,
        prix_plancher: agriculture.prix_plancher,
        seuil_alerte: agriculture.seuil_alerte,
        delai_paiement_jours: agriculture.delai_paiement_jours
      });

      // Égrenage
      await api.put('/parametres/previsions/egrenage', {
        campagne_id: selectedCampagne,
        coton_graine_prevu_tonnes: egrenage.coton_graine_prevu_tonnes,
        rendement_attendu_pourcent: egrenage.rendement_attendu_pourcent,
        cout_transformation_estime: egrenage.cout_transformation_estime
      });

      // Ventes
      const ventesPayload = ventes.map(v => ({
        campagne_id: selectedCampagne,
        produit: v.produit,
        volume_prevu_tonnes: v.volume_prevu_tonnes,
        prix_vente_prevu: v.prix_vente_prevu,
        cout_logistique_estime: v.cout_logistique_estime
      }));
      await api.put('/parametres/previsions/ventes', ventesPayload);

      setSuccess('✅ Toutes les prévisions ont été enregistrées avec succès !');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  // ========== GESTION DES CHAMPS DE VENTE ==========
  const handleVenteChange = (index: number, field: keyof VenteData, value: number) => {
    const newVentes = [...ventes];
    newVentes[index] = { ...newVentes[index], [field]: value };
    setVentes(newVentes);
  };

  // ========== RENDU ==========
  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        📊 Prévisions & Paramètres
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Configurez les prévisions par campagne pour l'agriculture, l'égrenage et les ventes.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ p: 3 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Campagne</InputLabel>
          <Select
            value={selectedCampagne}
            onChange={(e) => setSelectedCampagne(e.target.value)}
            label="Campagne"
          >
            {campagnes.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.libelle} {c.est_active && '⭐ (Active)'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* ========== NOUVEAU : CHAMPS DE LA CAMPAGNE ========== */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Libellé de la campagne"
              value={campagneLibelle}
              onChange={(e) => setCampagneLibelle(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Date de début"
              type="date"
              value={campagneDateDebut}
              onChange={(e) => setCampagneDateDebut(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Date de fin"
              type="date"
              value={campagneDateFin}
              onChange={(e) => setCampagneDateFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* ========== AGRICULTURE ========== */}
            <Typography variant="h6" sx={{ mt: 2, color: '#2E7D32' }}>
              🌾 Prévisions Agriculture
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Volume prévu (tonnes)"
                  type="number"
                  value={agriculture.volume_prevu_tonnes}
                  onChange={(e) => setAgriculture({ ...agriculture, volume_prevu_tonnes: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prix plancher (FCFA/kg)"
                  type="number"
                  value={agriculture.prix_plancher}
                  onChange={(e) => setAgriculture({ ...agriculture, prix_plancher: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Seuil d'alerte (FCFA/kg)"
                  type="number"
                  value={agriculture.seuil_alerte}
                  onChange={(e) => setAgriculture({ ...agriculture, seuil_alerte: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Délai de paiement (jours)"
                  type="number"
                  value={agriculture.delai_paiement_jours}
                  onChange={(e) => setAgriculture({ ...agriculture, delai_paiement_jours: parseInt(e.target.value) || 0 })}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* ========== ÉGRENAGE ========== */}
            <Typography variant="h6" sx={{ color: '#1565C0' }}>
              ⚙️ Prévisions Égrenage (Transformation)
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Coton graine prévu (tonnes)"
                  type="number"
                  value={egrenage.coton_graine_prevu_tonnes}
                  onChange={(e) => setEgrenage({ ...egrenage, coton_graine_prevu_tonnes: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Rendement attendu (%)"
                  type="number"
                  value={egrenage.rendement_attendu_pourcent}
                  onChange={(e) => setEgrenage({ ...egrenage, rendement_attendu_pourcent: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Coût transformation estimé (FCFA)"
                  type="number"
                  value={egrenage.cout_transformation_estime}
                  onChange={(e) => setEgrenage({ ...egrenage, cout_transformation_estime: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* ========== VENTES ========== */}
            <Typography variant="h6" sx={{ color: '#E65100' }}>
              📦 Prévisions Ventes
            </Typography>

            {ventes.map((v, index) => (
              <Box key={v.produit} sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">{v.produit}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Volume prévu (tonnes)"
                      type="number"
                      size="small"
                      value={v.volume_prevu_tonnes}
                      onChange={(e) => handleVenteChange(index, 'volume_prevu_tonnes', parseFloat(e.target.value) || 0)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Prix de vente prévu (FCFA/kg)"
                      type="number"
                      size="small"
                      value={v.prix_vente_prevu}
                      onChange={(e) => handleVenteChange(index, 'prix_vente_prevu', parseFloat(e.target.value) || 0)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Coût logistique estimé (FCFA)"
                      type="number"
                      size="small"
                      value={v.cout_logistique_estime}
                      onChange={(e) => handleVenteChange(index, 'cout_logistique_estime', parseFloat(e.target.value) || 0)}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Button
              variant="contained"
              size="large"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={loading}
              sx={{ mt: 3 }}
              fullWidth
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Enregistrer toutes les prévisions'}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}