import React, { useState, useEffect } from 'react';
import Sidebar from './SideBar';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import defaultUserImg from '../assets/user.png';

// Icons
import nameIcon from '../assets/name.png';
import cinIcon from '../assets/cin.png';
import emailIcon from '../assets/email.jpg';
import phoneIcon from '../assets/phone.png';

// Components
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users');
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = (query) => {
    setSearchTerm(query);
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.cin.includes(query) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleEdit = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        setUsers(users.filter(user => user.id !== id));
        setFilteredUsers(filteredUsers.filter(user => user.id !== id));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleSubmit = async (userData) => {
    try {
      let updatedUser;
      if (currentUser) {
        // Update existing user
        const response = await axios.put(
          `http://localhost:5000/api/users/${currentUser.id}`, 
          userData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        updatedUser = response.data;
        setUsers(users.map(user => user.id === currentUser.id ? updatedUser : user));
      } else {
        // Create new user
        const response = await axios.post(
          'http://localhost:5000/api/users', 
          userData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        updatedUser = response.data;
        setUsers([...users, updatedUser]);
      }
      
      setFilteredUsers([...filteredUsers, updatedUser]);
      setIsModalOpen(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="flex h-screen bg-green-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header userName={localStorage.getItem('userName') || 'Utilisateur'} />

        <main className="p-6 space-y-6 overflow-auto flex-1 w-full relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-semibold text-green-800">Gestion des Utilisateurs</h2>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Rechercher par nom, CIN ou email..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />

              <button
                onClick={() => {
                  setCurrentUser(null);
                  setIsModalOpen(true);
                }}
                className="bg-green-800 text-white px-6 py-2 rounded-lg hover:bg-green-900 transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Ajouter
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-lg shadow bg-white">
            <table className="w-full divide-y divide-gray-200 text-sm table-auto">
              <thead className="bg-green-100 text-green-800">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={nameIcon} alt="photo" className="w-4 h-4" />
                      Photo
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={nameIcon} alt="name" className="w-4 h-4" />
                      Nom
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={cinIcon} alt="cin" className="w-4 h-4" />
                      CIN
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={emailIcon} alt="email" className="w-4 h-4" />
                      Email
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={phoneIcon} alt="phone" className="w-4 h-4" />
                      Téléphone
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-green-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={user.photo ? `http://localhost:5000/uploads/${user.photo}` : defaultUserImg}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.cin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal pour ajouter/modifier un utilisateur */}
          <Modal isOpen={isModalOpen} onClose={() => {
            setIsModalOpen(false);
            setCurrentUser(null);
          }}>
            <UserForm 
              user={currentUser} 
              onSubmit={handleSubmit} 
              onCancel={() => {
                setIsModalOpen(false);
                setCurrentUser(null);
              }} 
            />
          </Modal>
        </main>
      </div>
    </div>
  );
};

export default Users;