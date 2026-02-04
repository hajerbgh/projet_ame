import React from 'react';

const ContractsIcon = ({ className = "w-6 h-6", color = "#6b7280" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24" className={className}>
    <path d="M16 3H5a2 2 0 0 0-2 2v16l4-4h9a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
    <line x1="8" y1="9" x2="16" y2="9" />
    <line x1="8" y1="13" x2="14" y2="13" />
  </svg>
);

export default ContractsIcon;
