import React, { useState, useEffect, useMemo } from "react";
import Sidebar from './SideBar';
import Header from './Header';

const Predictions = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  useEffect(() => {
    fetch("http://127.0.0.1:8000/predictions")
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getRiskColor = (risk) => {
    const riskLower = (risk || '').toLowerCase();
    if (riskLower === 'low' || riskLower === 'bas') return 'bg-green-100 text-green-800 font-semibold px-3 py-1 rounded-full';
    if (riskLower === 'medium' || riskLower === 'moyen') return 'bg-yellow-100 text-yellow-800 font-semibold px-3 py-1 rounded-full';
    if (riskLower === 'high' || riskLower === 'élevé') return 'bg-red-100 text-red-800 font-semibold px-3 py-1 rounded-full';
    return 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full';
  };

  const getProbabilityBar = (prob, color) => {
    const percentage = prob * 100;
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div 
            className={`${color} h-2 rounded-full`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-xs font-medium">{percentage.toFixed(1)}%</span>
      </div>
    );
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];
    
    // Filtrage
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(row => 
        (row.name?.toLowerCase() || '').includes(search) ||
        (row.risk_label?.toLowerCase() || '').includes(search) ||
        row.id?.toString().includes(search)
      );
    }
    
    // Tri
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'nombre_sinistres' || sortConfig.key === 'montant_total') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortConfig.key === 'prob_low' || sortConfig.key === 'prob_medium' || sortConfig.key === 'prob_high') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [data, searchTerm, sortConfig]);

  const requestSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const formatMontant = (montant) => {
  return new Intl.NumberFormat('fr-TN', { 
    style: 'currency', 
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(montant || 0).replace('TND', 'DT');
};
  // Icônes SVG inline
  const RiskIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const ProbIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const SearchIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  return (
    <div className="flex h-screen bg-green-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header userName={localStorage.getItem('userName') || 'Utilisateur'} />
        
        <main className="p-6 space-y-6 overflow-auto flex-1 w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-green-800">Prédictions des risques</h2>
            <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow">
              Total: {filteredAndSortedData.length} clients
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Rechercher par ID, nom ou niveau de risque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <div className="absolute left-3 top-2.5">
                <SearchIcon />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select 
                className="border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                onChange={(e) => {
                  const [key, direction] = e.target.value.split('-');
                  setSortConfig({ key, direction });
                }}
                value={`${sortConfig.key}-${sortConfig.direction}`}
              >
                <option value="id-asc">Trier par ID (croissant)</option>
                <option value="id-desc">Trier par ID (décroissant)</option>
                <option value="nombre_sinistres-desc">Plus de sinistres</option>
                <option value="nombre_sinistres-asc">Moins de sinistres</option>
                <option value="montant_total-desc">Montant + élevé</option>
                <option value="montant_total-asc">Montant - élevé</option>
                <option value="prob_high-desc">Risque élevé</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800"></div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-lg shadow bg-white">
              <table className="w-full divide-y divide-gray-200 text-sm table-auto">
                <thead className="bg-green-100 text-green-800">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left font-medium cursor-pointer hover:bg-green-200"
                      onClick={() => requestSort('id')}
                    >
                      ID {getSortIcon('id')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left font-medium cursor-pointer hover:bg-green-200"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        <span>Nom du client</span> {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left font-medium cursor-pointer hover:bg-green-200"
                      onClick={() => requestSort('nombre_sinistres')}
                    >
                      <div className="flex items-center gap-2">
                        <span># Sinistres</span> {getSortIcon('nombre_sinistres')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left font-medium cursor-pointer hover:bg-green-200"
                      onClick={() => requestSort('montant_total')}
                    >
                      <div className="flex items-center gap-2">
                        <span>Montant Total</span> {getSortIcon('montant_total')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left font-medium">
                      <div className="flex items-center gap-2">
                        <RiskIcon />
                        <span>Niveau de risque</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left font-medium" colSpan="3">
                      <div className="flex items-center gap-2">
                        <ProbIcon />
                        <span>Probabilités</span>
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-green-50 text-xs">
                    <th colSpan="5"></th>
                    <th className="px-2 py-2 text-center font-medium text-green-700">Faible</th>
                    <th className="px-2 py-2 text-center font-medium text-yellow-700">Moyen</th>
                    <th className="px-2 py-2 text-center font-medium text-red-700">Élevé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAndSortedData.length > 0 ? (
                    filteredAndSortedData.map((row) => (
                      <tr key={row.id} className="hover:bg-green-50 transition-colors">
                        <td className="px-6 py-4 font-medium">#{row.id}</td>
                        <td className="px-6 py-4">{row.name || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                            {row.nombre_sinistres || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {formatMontant(row.montant_total)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={getRiskColor(row.risk_label)}>
                            {row.risk_label || 'Non défini'}
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          {getProbabilityBar(row.prob_low || 0, 'bg-green-500')}
                        </td>
                        <td className="px-2 py-4">
                          {getProbabilityBar(row.prob_medium || 0, 'bg-yellow-500')}
                        </td>
                        <td className="px-2 py-4">
                          {getProbabilityBar(row.prob_high || 0, 'bg-red-500')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-4xl">📊</span>
                          <span className="text-lg font-medium">Aucune prédiction trouvée</span>
                          <span className="text-sm">Essayez de modifier vos critères de recherche</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {/* Pied de tableau avec statistiques */}
              {filteredAndSortedData.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Affichage de {filteredAndSortedData.length} résultat(s)</span>
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        Bas risque: {filteredAndSortedData.filter(d => d.risk_label?.toLowerCase() === 'low').length}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                        Risque moyen: {filteredAndSortedData.filter(d => d.risk_label?.toLowerCase() === 'medium').length}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        Haut risque: {filteredAndSortedData.filter(d => d.risk_label?.toLowerCase() === 'high').length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Predictions;