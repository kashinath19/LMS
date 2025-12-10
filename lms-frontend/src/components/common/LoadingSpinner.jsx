import React from 'react';
import './LoadingSpinner.css'; // fixed: remove module import

const LoadingSpinner = () => {
  return (
    <div className="loadingSpinnerContainer">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
};

export default LoadingSpinner;
