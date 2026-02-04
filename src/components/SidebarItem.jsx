import React from 'react';
import { NavLink } from 'react-router-dom';

const SidebarItem = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center rounded-lg px-4 py-3 gap-4 transition-all duration-150 ${
          isActive ? 'bg-green-100 text-green-600 font-semibold' : 'text-gray-500 hover:bg-gray-100'
        }`
      }
    >
      <div className="w-6 h-6">{icon}</div>
      <span className="text-sm">{label}</span>
    </NavLink>
  );
};

export default SidebarItem;
