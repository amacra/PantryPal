import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Header = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  console.log('[Header] Render - isAuthenticated:', isAuthenticated);

  const handleDeleteAccount = async () => {
    // Ask the user to type their email to confirm deletion
    const enteredEmail = window.prompt('To confirm deletion, please enter your account email:');
    if (!enteredEmail) return;

    const typed = window.prompt('Type DELETE to confirm account deletion');
    if (typed !== 'DELETE') return;

    // Use the email the user entered as the UserID in the payload
    const payload = { UserID: enteredEmail, confirmDelete: true };

    // Log token and payload to help diagnose frontend/backend mismatch
    const token = localStorage.getItem('sessionToken');
    console.debug('Delete account token:', token ? 'present' : 'missing');
    console.debug('Delete account payload:', payload);

    setLoading(true);
    return (
      <div className="header">
        <button
          className="delete-account-btn"
          onClick={handleDeleteAccount}
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>
    );
    }
  };

  return (
    <div className="header">
      {authChecked && isAuthenticated === true && (
        <button
          className="delete-account-btn"
          onClick={handleDeleteAccount}
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete Account'}
        </button>
      )}
      {!authChecked && <div style={{ fontSize: '12px', color: '#999' }}>Loading...</div>}
    </div>
  );
};

export default Header;
