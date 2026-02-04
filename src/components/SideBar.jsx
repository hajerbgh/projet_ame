import React from 'react';
import logo from '../assets/logo.png';
import logoutIcon from '../assets/logout.png';
import defaultUserImg from '../assets/user.png'; 
import OverviewIcon from '../assets/icons/OverviewIcon';
import ClientsIcon from '../assets/icons/ClientsIcon';
import ContractsIcon from '../assets/icons/ContractsIcon';
import SinistresIcon from '../assets/icons/SinistresIcon';
import PredictionsIcon from '../assets/icons/PredictionsIcon';
import ProfileIcon from '../assets/icons/ProfileIcon'; 
import UsersIcon from '../assets/icons/UsersIcon';
import SidebarItem from './SidebarItem';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="w-[250px] h-screen bg-white shadow-md px-6 pt-6 flex flex-col justify-between">
      {/* Haut : Logo + Navigation */}
      <div>
        <img
          src={logo}
          alt="Logo"
          className="w-[120px] h-[80px] object-contain mb-6"
        />

        <div className="flex flex-col gap-2">
          <SidebarItem to="/overview" icon={<OverviewIcon />} label="Overview" />
          <SidebarItem to="/clients" icon={<ClientsIcon />} label="Clients" />
          <SidebarItem to="/contracts" icon={<ContractsIcon />} label="Contracts" />
          <SidebarItem to="/claims" icon={<SinistresIcon />} label="Claims" />
          <SidebarItem to="/predictions" icon={<PredictionsIcon />} label="Predictions" />
          <SidebarItem to="/users" icon={<UsersIcon />} label="Users" /> 
          <SidebarItem to="/profile" icon={<ProfileIcon />} label="Profile" /> 
        </div>
      </div>

      {/* Bas : Utilisateur + Logout */}
      <div className="mt-auto mb-4">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={user?.photo ? `http://localhost:5000/uploads/${user.photo}` : defaultUserImg}
            alt="User"
            className="w-[55px] h-[55px] rounded-full object-cover border-4 border-white"
          />
          <div className="flex flex-col">
            <span className="text-green-700 font-bold text-sm">{user?.nom || 'Utilisateur'}</span>
            <span className="text-gray-500 text-xs">{user?.role || 'Employé'}</span>
            <span className="text-gray-400 text-[10px] underline">{user?.email}</span>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('user');
            navigate('/signin');
          }}
          className="w-full flex items-center gap-2 px-3 py-1 bg-red-100 rounded-md justify-center text-red-500 font-semibold text-sm"
        >
          <img src={logoutIcon} alt="logout" className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;