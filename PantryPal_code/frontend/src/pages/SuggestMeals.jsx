import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import RecipeCard from '../components/RecipeCard';
import { useAuth } from '../context/AuthContext';


const SuggestMeals = () => {
  const [pantryItems, setPantryItems] = useState([{ name: '', quantity: '', unit: '' }]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteEmailError, setDeleteEmailError] = useState('');
  const { userEmail } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const addItem = () => {
    setPantryItems([...pantryItems, { name: '', quantity: '', unit: '' }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...pantryItems];
    newItems[index][field] = value;
    setPantryItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Transform pantryItems to ingredients array of strings
      const ingredients = pantryItems
        .filter(item => item.name.trim())
        .map(item => item.name.trim());
      
      // Use email from auth context as UserID
      const payload = {
        ingredients,
        UserID: userEmail
      };
      
      const response = await api.post('/suggest', payload);
      setSuggestions(response.data.recipes || []);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteEmailError('');
    setDeleteError('');

    // Validate email matches
    if (deleteEmail !== userEmail) {
      console.log('Email mismatch:', deleteEmail, userEmail);
      setDeleteEmailError('Email does not match your account email');
      return;
    }

    setDeleteLoading(true);
    try {
      await api.post('/delete_account', {
        UserID: userEmail,
        confirmDelete: true
      });
        alert('Account deleted successfully');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userEmail');
        navigate('/');
    } catch (err) {
        console.error('Delete account error:', err);
        setDeleteError(err.response?.data?.message || 'Failed to delete account');
    } finally {
        setDeleteLoading(false);
        setShowDeleteConfirm(false);
        setDeleteEmail('');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>What Can I Cook?</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>My Pantry</h3>
        {pantryItems.map((item, index) => (
          <div key={index} style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Ingredient name"
              value={item.name}
              onChange={(e) => updateItem(index, 'name', e.target.value)}
              required
              style={{
                flex: 2,
                padding: 8,
                border: "1px solid #ccc",
                borderRadius: 4,
                fontSize: 14,
              }}
            />
            <input
              type="number"
              placeholder="Quantity"
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
              style={{
                flex: 1,
                padding: 8,
                border: "1px solid #ccc",
                borderRadius: 4,
                fontSize: 14,
              }}
            />
            <input
              type="text"
              placeholder="Unit"
              value={item.unit}
              onChange={(e) => updateItem(index, 'unit', e.target.value)}
              style={{
                flex: 1,
                padding: 8,
                border: "1px solid #ccc",
                borderRadius: 4,
                fontSize: 14,
              }}
            />
          </div>
        ))}
        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={addItem}
            style={{
              padding: "10px 16px",
              borderRadius: 6,
              border: "1px solid #0366d6",
              background: "transparent",
              color: "#0366d6",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Add Item
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 6,
              border: "none",
              background: "#0366d6",
              color: "white",
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? 'Getting Suggestions...' : 'Suggest Meals'}
          </button>
        </div>
      </form>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      <div style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Suggestions</h3>
        {suggestions.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
            {suggestions.map((suggestion, index) => (
              <RecipeCard key={index} recipe={suggestion} />
            ))}
          </div>
        ) : (
          <p style={{ color: "#666" }}>No suggestions yet. Add some pantry items and click "Suggest Meals".</p>
        )}
      </div>

      {isAuthenticated && (
        <div style={{ marginTop: 24, borderTop: '1px solid #ddd', paddingTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(true);
                setDeleteError('');
              }}
              title="Permanently delete your account"
              style={{
                background: 'transparent',
                color: '#d73a49',
                border: 'none',
                padding: '6px 8px',
                cursor: 'pointer',
                fontSize: 14,
                textDecoration: 'underline',
                opacity: 0.95,
              }}
            >
              ⚠️ Delete account
            </button>
          </div>

          {showDeleteConfirm && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Confirm account deletion"
            >
              {/* Backdrop */}
              <div
                onClick={() => {
                  if (!deleteLoading) {
                    setShowDeleteConfirm(false);
                    setDeleteError('');
                  }
                }}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  zIndex: 1200,
                }}
              />

              {/* Modal box */}
              <div style={{
                position: 'fixed',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                borderRadius: 8,
                padding: 20,
                width: '90%',
                maxWidth: 480,
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                zIndex: 1201,
              }}
                onClick={(e) => e.stopPropagation()}
              >
                <p style={{ margin: 0, marginBottom: 8, color: '#611214', fontWeight: 700, fontSize: 16 }}>
                  Are you sure you want to delete your account?
                </p>
                <p style={{ marginTop: 8, marginBottom: 12, color: '#333' }}>
                  Deleting your account will permanently remove your PantryPal account and associated personal data. This action cannot be undone.
                </p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#333' }}>Type your email to confirm deletion</label>
                  <input
                    type="email"
                    value={deleteEmail}
                    onChange={(e) => setDeleteEmail(e.target.value)}
                    placeholder={userEmail || 'your email'}
                    style={{
                      width: '100%',
                      padding: 8,
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                    disabled={deleteLoading}
                  />
                  {deleteEmailError && (
                    <p style={{ color: 'red', marginTop: 8, marginBottom: 0 }}>{deleteEmailError}</p>
                  )}
                  {deleteError && (
                    <p style={{ color: 'red', marginTop: 8 }}>{deleteError}</p>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteError('');
                    }}
                    disabled={deleteLoading}
                    style={{
                      background: 'transparent',
                      color: '#0366d6',
                      border: '1px solid #0366d6',
                      padding: '8px 12px',
                      cursor: deleteLoading ? 'default' : 'pointer',
                      borderRadius: 6,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    style={{
                      background: '#d73a49',
                      color: 'white',
                      border: 'none',
                      padding: '8px 14px',
                      cursor: deleteLoading ? 'default' : 'pointer',
                      borderRadius: 6,
                    }}
                  >
                    {deleteLoading ? 'Deleting…' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuggestMeals;