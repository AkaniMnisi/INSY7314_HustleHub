import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import BrowseGigs from './pages/BrowseGigs';
import GigDetail from './pages/GigDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GigForm from './pages/GigForm';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';
import Income from './pages/Income';
import Admin from './pages/Admin';
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
              <Route path="/gigs/:id" element={<GigDetail />} />
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
              <Route
                path="/gigs/new"
                element={
                  <ProtectedRoute allowedRoles={['freelancer']}>
                    <GigForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gigs/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['freelancer']}>
                    <GigForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/income"
                element={
                  <ProtectedRoute allowedRoles={['freelancer']}>
                    <Income />
                  </ProtectedRoute>
                }
              />

              {/* Client only */}
              <Route
                path="/book/:gigId"
                element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <Booking />
                  </ProtectedRoute>
                }
              />

              {/* Client + Freelancer */}
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute allowedRoles={['client', 'freelancer']}>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />

              {/* Admin only */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Admin />
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