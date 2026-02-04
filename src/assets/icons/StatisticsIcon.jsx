import React from 'react';

const StatisticsIcon = ({ className = "w-6 h-6", color = "#6b7280" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24" className={className}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

export default StatisticsIcon;
