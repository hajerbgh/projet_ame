import React, { useState, useEffect } from 'react';
import Sidebar from './SideBar';
import Header from './Header';
import AddClient from '../components/AddClient';

// Icons
import nameIcon from '../assets/name.png';
import cinIcon from '../assets/cin.png';
import emailIcon from '../assets/email.jpg';
import phoneIcon from '../assets/phone.png';
import birthDateIcon from '../assets/birth_date.png';
import addressIcon from '../assets/address.png';

const formatDate = (isoDate) => {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = () => {
    fetch('http://localhost:5000/api/clients')
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch((err) => console.error('Erreur lors de la récupération des clients :', err));
  };

  const filtered = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedClients = [...filtered].sort((a, b) => {
    if (sortOrder === 'a-z') return a.name.localeCompare(b.name);
    if (sortOrder === 'z-a') return b.name.localeCompare(a.name);
    return 0;
  });

  const handleRowClick = (client) => {
    setSelectedClient(client);
    setShowActionModal(true);
  };

  const handleDeleteClient = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/clients/${selectedClient.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setClients(clients.filter(client => client.id !== selectedClient.id));
        setShowActionModal(false);
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleClientAdded = (newClient) => {
    if (selectedClient) {
      setClients(clients.map(client => 
        client.id === selectedClient.id ? newClient : client
      ));
    } else {
      setClients([...clients, newClient]);
    }
    setShowAddClient(false);
    setSelectedClient(null);
  };

  return (
    <div className="flex h-screen bg-green-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header userName={localStorage.getItem('userName') || 'Utilisateur'} />

        <main className="p-6 space-y-6 overflow-auto flex-1 w-full relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-semibold text-green-800">Clients List </h2>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Rechercher par nom..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="">Trier par</option>
                <option value="a-z">Nom (A-Z)</option>
                <option value="z-a">Nom (Z-A)</option>
              </select>

             <button
  onClick={() => {
    setSelectedClient(null);
    setShowAddClient(true);
  }}
  className="bg-green-800 text-white px-6 py-2 rounded-lg hover:bg-green-900 transition flex items-center gap-2"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
  </svg>
  Add
</button>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-lg shadow bg-white">
            <table className="w-full divide-y divide-gray-200 text-sm table-auto">
              <thead className="bg-green-100 text-green-800">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">ID</th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={cinIcon} alt="cin" className="w-4 h-4" />
                      CIN
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={nameIcon} alt="name" className="w-4 h-4" />
                      Name
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
                      Phone Number
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={birthDateIcon} alt="birth" className="w-4 h-4" />
                      Birth Date
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={addressIcon} alt="address" className="w-4 h-4" />
                      Address
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedClients.length > 0 ? (
                  sortedClients.map((client) => (
                    <tr 
                      key={client.id} 
                      className="hover:bg-green-50 cursor-pointer transition-colors duration-150"
                      onClick={() => handleRowClick(client)}
                    >
                      <td className="px-6 py-3">{client.id}</td>
                      <td className="px-6 py-3 font-medium">{client.cin}</td>
                      <td className="px-6 py-3">{client.name}</td>
                      <td className="px-6 py-3 ">
                        <a href={`mailto:${client.email}`}>{client.email}</a>
                      </td>
                      <td className="px-6 py-3">{client.phone}</td>
                      <td className="px-6 py-3">{formatDate(client.birth_date)}</td>
                      <td className="px-6 py-3">{client.address}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-gray-500">
                      Aucun client trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Add/Edit Client */}
          {showAddClient && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {selectedClient ? 'Modifier Client' : 'Nouveau Client'}
                      </h3>
                      <div className="h-1 w-12 bg-green-500 rounded-full mt-1"></div>
                    </div>
                    <button 
                      onClick={() => {
                        setShowAddClient(false);
                        setSelectedClient(null);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Fermer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="p-6 pt-4">
                  <AddClient 
                    onClose={() => {
                      setShowAddClient(false);
                      setSelectedClient(null);
                    }} 
                    onClientAdded={handleClientAdded}
                    selectedClient={selectedClient}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          {showActionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-sm transform transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Actions pour {selectedClient?.name}
                      </h3>
                      <div className="h-1 w-12 bg-blue-500 rounded-full mt-1"></div>
                    </div>
                    <button 
                      onClick={() => setShowActionModal(false)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Fermer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setShowAddClient(true);
                        setShowActionModal(false);
                      }}
                      className="w-full bg-blue-50 text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Modifier
                    </button>
                    <button
                      onClick={handleDeleteClient}
                      className="w-full bg-red-50 text-red-600 px-4 py-3 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Supprimer
                    </button>
                    <button
                      onClick={() => setShowActionModal(false)}
                      className="w-full border border-gray-200 px-4 py-3 rounded-lg hover:bg-gray-50 transition mt-4"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Clients;