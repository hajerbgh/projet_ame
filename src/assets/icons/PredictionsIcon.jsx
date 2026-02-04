import React from 'react';

const PredictionsIcon = ({ className = "w-6 h-6", color = "#6b7280" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export default PredictionsIcon;
