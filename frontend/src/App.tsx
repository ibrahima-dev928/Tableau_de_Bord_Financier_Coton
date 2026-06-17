import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import DashboardDirection from './pages/Direction/DashboardDirection';
import ValidationAchats from './pages/Comptabilite/ValidationAchats';
import SaisieAchats from './pages/Terrain/SaisieAchats';
import Rapports from './pages/Rapports';
import ZonesUsines from './pages/ZonesUsines';
import Utilisateurs from './pages/Utilisateurs';
import Producteurs from './pages/Producteurs';
import Exportations from './pages/Exportations';
import Parametres from './pages/Parametres';
import Login from './pages/Login';
import { theme } from './theme';
import AdminAchats from './pages/AdminAchats';
import SaisieTransformations from './pages/Terrain/SaisieTransformations';
import SaisieVentes from './pages/Terrain/SaisieVentes';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route path="/" element={<DashboardDirection />} />
              <Route path="/achats" element={<SaisieAchats />} />
              <Route path="/validation-achats" element={<ValidationAchats />} />
              <Route path="/rapports" element={<Rapports />} />
              <Route path="/zones" element={<ZonesUsines />} />
              <Route path="/admin-achats" element={<AdminAchats />} />
              <Route path="/zones-usines" element={<ZonesUsines />} />
              <Route path="/utilisateurs" element={<Utilisateurs />} />
              <Route path="/producteurs" element={<Producteurs />} />
              <Route path="/exportations" element={<Exportations />} />
              <Route path="/saisie-transformations" element={<SaisieTransformations />} />
              <Route path="/saisie-ventes" element={<SaisieVentes />} />
              <Route path="/parametres" element={<Parametres />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;