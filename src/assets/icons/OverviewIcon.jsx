import React from 'react';

const OverviewIcon = ({ className = "w-6 h-6", color = "#6b7280" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24" className={className}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

export default OverviewIcon;
