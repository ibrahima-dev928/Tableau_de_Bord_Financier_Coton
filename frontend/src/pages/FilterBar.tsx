// src/components/FilterBar.tsx
import { useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, SelectChangeEvent } from '@mui/material';

interface Zone {
  id: string;
  nom: string;
}

interface FilterBarProps {
  zones: Zone[];
  onApply: (filters: { zoneId: string; periode: string }) => void;
}

export default function FilterBar({ zones, onApply }: FilterBarProps) {
  const [zoneId, setZoneId] = useState<string>('');
  const [periode, setPeriode] = useState<string>('mois');

  const handleZoneChange = (e: SelectChangeEvent) => {
    setZoneId(e.target.value);
  };

  const handlePeriodeChange = (e: SelectChangeEvent) => {
    setPeriode(e.target.value);
  };

  const handleApply = () => {
    onApply({ zoneId, periode });
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <FormControl sx={{ minWidth: 150 }}>
        <InputLabel>Zone</InputLabel>
        <Select value={zoneId} onChange={handleZoneChange} label="Zone">
          <MenuItem value="">Toutes</MenuItem>
          {zones.map((z) => (
            <MenuItem key={z.id} value={z.id}>{z.nom}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl sx={{ minWidth: 150 }}>
        <InputLabel>Période</InputLabel>
        <Select value={periode} onChange={handlePeriodeChange} label="Période">
          <MenuItem value="mois">Mois</MenuItem>
          <MenuItem value="semaine">Semaine</MenuItem>
          <MenuItem value="annee">Année</MenuItem>
        </Select>
      </FormControl>
      <Button variant="contained" onClick={handleApply}>
        Appliquer
      </Button>
    </Box>
  );
}