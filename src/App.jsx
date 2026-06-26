import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Stock from './pages/Stock';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route 
          path="/stock" 
          element={
            <ProtectedRoute>
              <Stock />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/stock" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
