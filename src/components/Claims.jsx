import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './SideBar';
import Header from './Header';

import {
  FaHashtag, FaIdCard, FaUser, FaCalendarAlt, FaClipboardList,
  FaMapMarkerAlt, FaMoneyBillWave, FaInfoCircle, FaSearch,
  FaEdit, FaTrash, FaCheck, FaTimes, FaFilePdf, FaEnvelope, FaPen
} from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';

const formatPhone = (phone) => {
  return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
};

const Claims = () => {
  const [claims, setClaims] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [action, setAction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const sigPadRef = useRef(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = () => {
    fetch('http://localhost:5000/api/claims')
      .then((res) => res.json())
      .then((data) => setClaims(data))
      .catch((err) => console.error('Erreur fetch claims:', err));
  };

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) =>
      (claim.client_name?.toLowerCase().includes(search.toLowerCase()) ||
       claim.type_sinistre?.toLowerCase().includes(search.toLowerCase()) ||
       claim.zone?.toLowerCase().includes(search.toLowerCase()) ||
       claim.statut?.toLowerCase().includes(search.toLowerCase()) ||
       claim.description?.toLowerCase().includes(search.toLowerCase()) ||
       claim.id.toString().includes(search) ||
       claim.contrat_id.toString().includes(search)
      )
    );
  }, [search, claims]);

  const getStatusColor = (statut) => {
    if (statut === 'traité') return 'bg-green-100 text-green-800';
    if (statut === 'en attente') return 'bg-yellow-100 text-yellow-800';
    if (statut === 'rejeté') return 'bg-red-100 text-red-800';
    return '';
  };

  const handleAction = (claim, actionType) => {
    setSelectedClaim(claim);
    setAction(actionType);
    setStatus('');
    setIsSignatureEmpty(true);
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
    setIsModalOpen(true);
  };

  const clearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      setIsSignatureEmpty(true);
    }
  };

  const processClaim = async () => {
  if (status === 'traité' && isSignatureEmpty) {
    alert('Veuillez ajouter votre signature pour accepter le sinistre');
    return;
  }

  setIsProcessing(true);
  try {
    
      const signatureData = sigPadRef.current?.toDataURL('image/png') || null;

    const response = await fetch(`http://localhost:5000/api/claims/${selectedClaim.id}/process`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        statut: status,
        signatureData: status === 'traité' ? signatureData : null
      })
    });

    const result = await response.json();
    if (result.success) {
      alert(`Sinistre ${status} avec succès! Un email a été envoyé au client.`);
      fetchClaims();
      setIsModalOpen(false);
    }
  } catch (err) {
    console.error('Erreur:', err);
    alert('Une erreur est survenue');
  } finally {
    setIsProcessing(false);
  }
};


  const deleteClaim = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce sinistre?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/claims/${selectedClaim.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Sinistre supprimé avec succès');
        fetchClaims();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Une erreur est survenue');
    }
  };

  return (
    <div className="flex h-screen bg-green-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header userName={localStorage.getItem('userName') || 'Utilisateur'} />

        <main className="p-6 space-y-6 overflow-auto flex-1 w-full">
          <h2 className="text-2xl font-semibold text-green-800 mb-4 flex items-center gap-2">
            <FaClipboardList /> Gestion des Sinistres
          </h2>

          <div className="mb-4 relative max-w-md">
            <input
              type="text"
              placeholder="Rechercher par client, type, zone..."
              className="border px-10 py-2 rounded w-full focus:ring-2 focus:ring-green-600 focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="w-full overflow-x-auto rounded-lg shadow">
            <table className="w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-green-100 text-green-800">
                <tr>
                   <th className="px-6 py-3 text-left font-medium">
      <div className="flex items-center gap-2">
        <FaHashtag className="text-green-600" />
        ID
      </div>
    </th>
    <th className="px-6 py-3 text-left font-medium">
      <div className="flex items-center gap-2">
        <FaUser className="text-green-600" />
        Client
      </div>
    </th>
    <th className="px-6 py-3 text-left font-medium">
      <div className="flex items-center gap-2">
        <FaIdCard className="text-green-600" />
        CIN
      </div>
    </th>
    <th className="px-6 py-3 text-left font-medium">
      <div className="flex items-center gap-2">
        <FaCalendarAlt className="text-green-600" />
        Date
      </div>
    </th>
    <th className="px-6 py-3 text-left font-medium">
      <div className="flex items-center gap-2">
        <FaClipboardList className="text-green-600" />
        Type
      </div>
    </th>
    <th className="px-6 py-3 text-left font-medium">
      <div className="flex items-center gap-2">
        <FaMapMarkerAlt className="text-green-600" />
        Zone
      </div>
    </th>
    <th className="px-6 py-3 text-left font-medium">
      <div className="flex items-center gap-2">
        <FaMoneyBillWave className="text-green-600" />
        Montant
      </div>
    </th>
    <th className="px-6 py-3 text-left font-medium">
      <div className="flex items-center gap-2">
        <FaInfoCircle className="text-green-600" />
        Statut
      </div>
    </th>
    <th className="px-6 py-3 text-left font-medium">
      <div className="flex items-center gap-2">
        <FaPen className="text-green-600" />
        Actions
      </div>
    </th>
  </tr>
</thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredClaims.length > 0 ? (
                  filteredClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-green-50 transition-colors">
                      <td className="px-6 py-4">{claim.id}</td>
                      <td className="px-6 py-4">{claim.client_name}</td>
                      <td className="px-6 py-4">{claim.cin}</td>
                      <td className="px-6 py-4">{new Date(claim.date_sinistre).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{claim.type_sinistre}</td>
                      <td className="px-6 py-4">{claim.zone}</td>
                      <td className="px-6 py-4">{Number(claim.montant).toFixed(2)} DT</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(claim.statut)}`}>
                          {claim.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleAction(claim, 'process')}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                          title="Traiter"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={() => handleAction(claim, 'delete')}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500">
                      Aucun sinistre trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Modal de traitement */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-green-800 text-white p-4">
              <h3 className="text-lg font-semibold">
                {action === 'process' && 'Traiter le sinistre'}
                {action === 'delete' && 'Supprimer le sinistre'}
              </h3>
            </div>

            <div className="p-6">
              {action === 'process' && (
                <div className="space-y-4">
                  <p className="text-gray-700">Sélectionnez l'action pour le sinistre <strong>#{selectedClaim?.id}</strong>:</p>

                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => setStatus('traité')}
                      className={`flex-1 py-2 rounded-lg border ${status === 'traité' ? 'bg-green-100 border-green-600 text-green-800' : 'border-gray-300'}`}
                    >
                      <FaCheck className="inline mr-2" /> Accepter
                    </button>
                    <button
                      onClick={() => setStatus('rejeté')}
                      className={`flex-1 py-2 rounded-lg border ${status === 'rejeté' ? 'bg-red-100 border-red-600 text-red-800' : 'border-gray-300'}`}
                    >
                      <FaTimes className="inline mr-2" /> Rejeter
                    </button>
                  </div>

                  {status === 'traité' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Signature électronique
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
                        <SignatureCanvas
                          ref={sigPadRef}
                          penColor="black"
                          canvasProps={{
                            width: 400,
                            height: 150,
                            className: 'signature-canvas bg-white w-full'
                          }}
                          onEnd={() => setIsSignatureEmpty(sigPadRef.current.isEmpty())}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <button
                          onClick={clearSignature}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <FaTimes /> Effacer
                        </button>
                        <span className="text-xs text-gray-500">
                          Signez dans la zone ci-dessus
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={processClaim}
                      disabled={isProcessing || !status}
                      className={`px-4 py-2 rounded-lg text-white ${status === 'rejeté' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} flex items-center gap-2`}
                    >
                      {isProcessing ? (
                        'Traitement...'
                      ) : (
                        <>
                          <FaEnvelope /> Confirmer et Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {action === 'delete' && (
                <div className="space-y-4">
                  <p className="text-gray-700">Êtes-vous sûr de vouloir supprimer définitivement le sinistre <strong>#{selectedClaim?.id}</strong> ?</p>
                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={deleteClaim}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <FaTrash /> Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Claims;
