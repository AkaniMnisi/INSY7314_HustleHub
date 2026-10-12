import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import BrowseGigs from './pages/BrowseGigs';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Forbidden from './pages/Forbidden';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main className="app-main">
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/gigs" element={<BrowseGigs />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Freelancer only */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['freelancer']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Errors */}
              <Route path="/403" element={<Forbidden />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}