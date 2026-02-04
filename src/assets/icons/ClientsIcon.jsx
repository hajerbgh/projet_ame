import React from 'react';

const ClientsIcon = ({ className = "w-6 h-6", color = "#6b7280" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M7 21v-2a4 4 0 0 1 3-3.87" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default ClientsIcon;
