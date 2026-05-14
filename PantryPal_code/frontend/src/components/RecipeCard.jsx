import React from 'react';

const RecipeCard = ({ recipe }) => {
  const containerStyle = {
    background: '#ffffff',
    borderRadius: 10,
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    color: '#111827',
    minHeight: 220,
  };

  const titleStyle = {
    fontSize: 16,
    fontWeight: 700,
    margin: 0,
    color: '#0f172a',
  };

  const imgStyle = {
    width: '100%',
    height: 140,
    objectFit: 'cover',
    borderRadius: 8,
    border: '1px solid #eef2f7',
  };

  const metaStyle = {
    fontSize: 13,
    color: '#4b5563',
    margin: 0,
    lineHeight: 1.4,
  };

  const linkBtnStyle = {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    background: '#0366d6',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
  };

  const listToString = (v) => {
    if (!v) return 'None';
    if (Array.isArray(v)) return v.length ? v.join(', ') : 'None';
    return String(v);
  };

  return (
    <div style={containerStyle}>
      <h4 style={titleStyle}>{recipe.title}</h4>
      {recipe.image && <img src={recipe.image} alt={recipe.title} style={imgStyle} />}
      <p style={metaStyle}>Used: {listToString(recipe.usedIngredients)}</p>
      <p style={metaStyle}>Missing: {listToString(recipe.missingIngredients)}</p>
      {recipe.spoonacularSourceUrl && (
        <a
          href={recipe.spoonacularSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={linkBtnStyle}
        >
          View Recipe
        </a>
      )}
    </div>
  );
};

export default RecipeCard;