import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CustomizationProvider } from './context/CustomizationContext';
import { TextsProvider } from './context/TextsContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Videos from './pages/Videos';
import Plans from './pages/Plans';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import AdminHome from './pages/admin/AdminHome';
import ManageVideos from './pages/admin/ManageVideos';
import ManageCourses from './pages/admin/ManageCourses';
import ManageUsers from './pages/admin/ManageUsers';
import Notifications from './pages/admin/Notifications';
import Customize from './pages/admin/Customize';
import './App.css';

function App() {
  return (
    <Router>
      <CustomizationProvider>
        <TextsProvider>
          <AuthProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/courses/:courseId"
            element={
              <PrivateRoute>
                <Courses />
              </PrivateRoute>
            }
          />
              <Route
                path="/videos/:videoId"
                element={
                  <PrivateRoute>
                    <Videos />
                  </PrivateRoute>
                }
              />
              <Route
                path="/plans"
                element={
                  <PrivateRoute>
                    <Plans />
                  </PrivateRoute>
                }
              />
              <Route
                path="/checkout/:planId"
                element={
                  <PrivateRoute>
                    <Checkout />
                  </PrivateRoute>
                }
              />
              <Route
                path="/checkout/success"
                element={
                  <PrivateRoute>
                    <CheckoutSuccess />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/admin"
                element={
                  <PrivateRoute requireAdmin>
                    <AdminHome />
                  </PrivateRoute>
                }
              />
          
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AuthProvider>
        </TextsProvider>
      </CustomizationProvider>
    </Router>
  );
}

export default App;
