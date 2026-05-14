import React from 'react';
 import { Link, useLocation } from 'react-router-dom';
 import './Landing.css';

 const Landing = () => {
   const location = useLocation();
   const accountDeleted = location.state?.accountDeleted;

   return (
     <div className="landing-container">
       {accountDeleted && (
         <div className="landing-banner">
           Your account has been deleted.
         </div>
       )}
       <h1>Welcome to PantryPal</h1>
       <p>Your personal pantry recipe recommender</p>
       <div className="landing-buttons">
        <Link to="/login">
          <button className="landing-button">Login</button>
        </Link>
        <Link to="/signup">
          <button className="landing-button">Sign Up</button>
        </Link>
      </div>
    </div>
  );
};
export default Landing;