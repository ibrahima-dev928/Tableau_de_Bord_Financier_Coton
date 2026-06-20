// src/components/DateFilter.tsx
import { Box, ToggleButton, ToggleButtonGroup, TextField } from '@mui/material';

interface DateFilterProps {
  value: string;                    // valeur contrôlée par le parent
  onChange: (value: string) => void; // callback pour mettre à jour
}

export default function DateFilter({ value, onChange }: DateFilterProps) {
  const handleToggleChange = (_event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  const handleCustomDate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (newValue) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
      <ToggleButtonGroup
        value={value}          // ✅ contrôlé par le parent
        exclusive
        onChange={handleToggleChange}
        size="small"
        color="primary"
      >
        <ToggleButton value="today">Aujourd'hui</ToggleButton>
        <ToggleButton value="yesterday">Hier</ToggleButton>
        <ToggleButton value="3months">3 mois</ToggleButton>
        <ToggleButton value="1year">1 an</ToggleButton>
      </ToggleButtonGroup>
      <TextField
        type="date"
        size="small"
        label="Personnalisé"
        InputLabelProps={{ shrink: true }}
        onChange={handleCustomDate}
      />
    </Box>
  );
}