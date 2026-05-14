import React from 'react';

const ErrorMessage = ({ message }) => (
  <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
    <p>Error: {message}</p>
  </div>
);

export default ErrorMessage;