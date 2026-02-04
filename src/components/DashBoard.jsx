import React, { useState, useEffect } from 'react';
import Sidebar from './SideBar';
import Header from './Header';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#FF69B4',
  '#3CB371',
  '#A28CF4',
  '#F45B69',
];

const positionCarte = [36.8065, 10.1815]; // Exemple : Tunis

const Dashboard = () => {
  const [data, setData] = useState({
    totalSinistres: 0,
    nombreClients: 0,
    coutTotal: 0,
    predictionsRisqueEleve: 45,
    sinistresParType: [],
    evolutionMensuelle: [],
  });

  const [markers, setMarkers] = useState([]); // Déplacer à l'intérieur du composant

  useEffect(() => {
    fetch('http://localhost:5000/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Erreur chargement dashboard:', err));
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/sinistres/carte')
      .then(res => res.json())
      .then(data => setMarkers(data))
      .catch(err => console.error('Erreur chargement données carte:', err));
  }, []);

  // Récupérer user depuis localStorage
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  return (
    <div className="flex h-screen bg-green-50 overflow-hidden">
      {/* Sidebar */}
      <div className="h-full">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-green-50">
          <Header userName={user?.nom || 'Utilisateur'} />
        </div>

        {/* Contenu principal */}
        <main className="p-6 pr-12 space-y-8 overflow-auto flex-1">
          {/* Cartes statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Sinistres" value={data.totalSinistres} />
            <StatCard title="Nombre de Clients" value={data.nombreClients} />
            <StatCard title="Coût Total (mois)" value={data.coutTotal + ' DT'} />
            <StatCard title="Prédictions Risque Élevé" value={data.predictionsRisqueEleve} />
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChart width={400} height={300}>
              <Pie
                data={data.sinistresParType}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {data.sinistresParType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>

            <LineChart
              width={500}
              height={300}
              data={data.evolutionMensuelle}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sinistres" stroke="#82ca9d" activeDot={{ r: 8 }} />
            </LineChart>
          </div>

          {/* Carte */}
          <div style={{ height: '400px', borderRadius: '10px', overflow: 'hidden' }}>
            <MapContainer 
              center={positionCarte} 
              zoom={7} 
              scrollWheelZoom={true} 
              style={{ height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {markers.map((sinistre, index) => (
                <Marker 
                  key={index} 
                  position={[sinistre.latitude, sinistre.longitude]}
                >
                  <Popup>
                    <div>
                      <h4 className="font-bold">Sinistre #{sinistre.id}</h4>
                      <p><strong>Type:</strong> {sinistre.type_sinistre}</p>
                      <p><strong>Date:</strong> {new Date(sinistre.date_sinistre).toLocaleDateString()}</p>
                      <p><strong>Montant:</strong> {sinistre.montant} DT</p>
                      <p><strong>Zone:</strong> {sinistre.zone}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-3xl font-bold text-green-700">{value}</p>
  </div>
);

export default Dashboard;