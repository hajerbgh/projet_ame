import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './SideBar';
import Header from './Header';

// Icônes image
import nameIcon from '../assets/name.png';
import cinIcon from '../assets/cin.png';

// Icônes SVG personnalisées
import AgeIcon from '../assets/icons/AgeIcon';
import ContractsIcon from '../assets/icons/ContractsIcon';
import RiskIcon from '../assets/icons/RiskIcon';
import SinistresIcon from '../assets/icons/SinistresIcon';

const Predictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortByScore, setSortByScore] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/predictions')
      .then((res) => res.json())
      .then((data) => setPredictions(data))
      .catch((err) => console.error('Erreur fetch predictions:', err));
  }, []);

  const riskColor = (score) => {
    if (score >= 0.8) return 'bg-red-100 text-red-800 px-2 py-1 rounded font-bold';
    if (score >= 0.5) return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold';
    return 'bg-green-100 text-green-800 px-2 py-1 rounded';
  };

  const filteredPredictions = useMemo(() => {
    const search = searchTerm.toLowerCase();
    let filtered = predictions.filter((item) =>
      (item.name || '').toLowerCase().includes(search) ||
      (item.cin || '').toLowerCase().includes(search) ||
      (item.type_contrat || '').toLowerCase().includes(search)
    );

    filtered.sort((a, b) => (sortByScore ? b.score - a.score : a.score - b.score));
    return filtered;
  }, [predictions, searchTerm, sortByScore]);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Header />

        <main className="p-6 space-y-6 overflow-y-auto overflow-x-hidden w-full bg-gray-50">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">Liste des prédictions</h2>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Recherche par nom, CIN ou contrat..."
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </div>

            <button
              onClick={() => setSortByScore(!sortByScore)}
              className="bg-green-800 hover:bg-green-900 text-white font-semibold px-4 py-2 rounded"
            >
              Trier par risque: {sortByScore ? 'Élevé → Faible' : 'Faible → Élevé'}
            </button>
          </div>

          <div className="w-full overflow-x-auto rounded-lg shadow bg-white">
            <table className="w-full divide-y divide-gray-200 text-sm table-auto">
              <thead className="bg-green-100 text-green-800">
                <tr>
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
                      <AgeIcon className="w-4 h-4 text-green-700" />
                      Âge
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <ContractsIcon className="w-4 h-4 text-green-700" />
                      Contrat
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <SinistresIcon className="w-4 h-4 text-red-600" />
                      # Sinistres
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <RiskIcon className="w-4 h-4 text-yellow-600" />
                      Score Risque
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPredictions.length > 0 ? (
                  filteredPredictions.map((item, index) => (
                    <tr key={index} className="hover:bg-green-50">
                      <td className="px-6 py-3">{item.name || '—'}</td>
                      <td className="px-6 py-3">{item.cin || '—'}</td>
                      <td className="px-6 py-3">{item.age}</td>
                      <td className="px-6 py-3">{item.type_contrat || '—'}</td>
                      <td className="px-6 py-3">{item.nombre_sinistres}</td>
                      <td className="px-6 py-3">
                        <span className={riskColor(item.score)}>
                          {(item.score * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-gray-500">
                      Aucune prédiction trouvée.
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

export default Predictions;
