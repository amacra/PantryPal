import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  return <header><Link to="/">PantryPal</Link>{isAuthenticated && <button onClick={logout}>Log out</button>}</header>;
}
