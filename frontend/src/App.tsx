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

// ==================== PRIVATE ROUTE (simple token) ====================
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

// ==================== PROTECTED ROUTE (avec vérification de rôle) ====================
function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Récupérer le rôle : d'abord depuis le contexte, sinon depuis le token
  let role = user?.role;
  if (!role) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      role = payload.role || ''; // valeur par défaut si absent
    } catch (e) {
      return <Navigate to="/login" />;
    }
  }

  // Si toujours pas de rôle, on redirige vers login
  if (!role) {
    return <Navigate to="/login" />;
  }

  // Vérification des droits
  if (!allowedRoles.includes(role)) {
    if (role === 'Responsable_terrain') {
      return <Navigate to="/achats" />;
    } else if (role === 'Comptabilite') {
      return <Navigate to="/validation-achats" />;
    } else {
      return <Navigate to="/login" />;
    }
  }

  return children;
}

// ==================== APP ====================
function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Page de connexion (publique) */}
            <Route path="/login" element={<Login />} />

            {/* Routes protégées par authentification (token requis) */}
            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
              {/* Page d'accueil - réservée à la Direction */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={['Direction']}>
                    <DashboardDirection />
                  </ProtectedRoute>
                }
              />

              {/* Autres pages accessibles selon les rôles (gérées par le menu) */}
              <Route path="/achats" element={<SaisieAchats />} />
              <Route path="/validation-achats" element={<ValidationAchats />} />
              <Route path="/rapports" element={<Rapports />} />
              <Route path="/zones" element={<ZonesUsines />} />
              <Route path="/zones-usines" element={<ZonesUsines />} />
              <Route path="/utilisateurs" element={<Utilisateurs />} />
              <Route path="/producteurs" element={<Producteurs />} />
              <Route path="/exportations" element={<Exportations />} />
              <Route path="/saisie-transformations" element={<SaisieTransformations />} />
              <Route path="/saisie-ventes" element={<SaisieVentes />} />
              <Route path="/parametres" element={<Parametres />} />
              <Route path="/admin-achats" element={<AdminAchats />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;