import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './SideBar';
import Header from './Header';
import typeIcon from '../assets/type.png';
import statusIcon from '../assets/status.png';
import nameIcon from '../assets/name.png';
import cinIcon from '../assets/cin.png';
import startDateIcon from '../assets/start_date.png';
import endDateIcon from '../assets/end_date.png';

const formatDate = (isoDate) => {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
};

const Contracts = () => {
  const [contracts, setContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortRecent, setSortRecent] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/contracts')
      .then((res) => res.json())
      .then((data) => setContracts(data))
      .catch((err) => console.error('Erreur fetch contracts:', err));
  }, []);

  const statusColor = (status) => {
    const safeStatus = (status || '').toLowerCase();
    if (safeStatus === 'actif') return 'bg-yellow-100 text-yellow-800 font-semibold px-2 py-1 rounded';
    if (safeStatus === 'expiré') return 'bg-red-100 text-red-800 font-semibold px-2 py-1 rounded';
    return 'bg-gray-100 text-gray-800 px-2 py-1 rounded';
  };

  const filteredContracts = useMemo(() => {
    const search = searchTerm.toLowerCase();

    let filtered = contracts.filter((contract) => {
      return (
        (contract?.type || '').toLowerCase().includes(search) ||
        (contract?.status || '').toLowerCase().includes(search) ||
        (contract?.client_name || '').toLowerCase().includes(search) ||
        (contract?.cin || '').includes(search)
      );
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return sortRecent ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [contracts, searchTerm, sortRecent]);

  return (
    <div className="flex h-screen bg-green-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header userName={localStorage.getItem('userName') || 'Utilisateur'} />

        <main className="p-6 space-y-6 overflow-auto flex-1 w-full">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">Liste des contrats</h2>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Recherche par nom, CIN, type ou statut..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <svg
                className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </div>
            <button
              onClick={() => setSortRecent(!sortRecent)}
              className="bg-green-800 hover:bg-green-900 text-white font-semibold px-4 py-2 rounded"
            >
              Trier par date: {sortRecent ? 'Récent → Ancien' : 'Ancien → Récent'}
            </button>
          </div>

          <div className="w-full overflow-x-auto rounded-lg shadow bg-white">
            <table className="w-full divide-y divide-gray-200 text-sm table-auto">
              <thead className="bg-green-100 text-green-800">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">ID</th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={nameIcon} alt="name" className="w-4 h-4" />
                      Client
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
                      <img src={typeIcon} alt="type" className="w-4 h-4" />
                      Type
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={startDateIcon} alt="start" className="w-4 h-4" />
                      Start Date
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={endDateIcon} alt="end" className="w-4 h-4" />
                      End Date
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <img src={statusIcon} alt="status" className="w-4 h-4" />
                      Status
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContracts.length > 0 ? (
                  filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-green-50">
                      <td className="px-6 py-3">{contract.id}</td>
                      <td className="px-6 py-3">{contract.client_name || '—'}</td>
                      <td className="px-6 py-3">{contract.cin || '—'}</td>
                      <td className="px-6 py-3">{contract.type || '—'}</td>
                      <td className="px-6 py-3">{formatDate(contract.start_date)}</td>
                      <td className="px-6 py-3">{formatDate(contract.end_date)}</td>
                      <td className="px-6 py-3">
                        <span className={statusColor(contract.status)}>{contract.status || '—'}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-gray-500">
                      Aucun contrat trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Contracts;
