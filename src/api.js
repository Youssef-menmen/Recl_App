// ─────────────────────────────────────────────
// api.js — Service API pour connecter React au backend Spring Boot
//
// Placez ce fichier dans : src/api.js
// Puis importez dans App.js : import { complaintApi } from './api';
// ─────────────────────────────────────────────

const BASE_URL = "http://localhost:8080/api";

// Utilitaire pour les requêtes fetch avec gestion d'erreur
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Erreur HTTP ${response.status}`);
  }

  // 204 No Content → pas de corps JSON
  if (response.status === 204) return null;
  return response.json();
}

export const complaintApi = {

  // ─── Récupérer toutes les réclamations (admin) ───
  // Avec filtres optionnels : { platform, status, keyword }
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.platform && filters.platform !== "Tous") params.set("platform", filters.platform);
    if (filters.status   && filters.status   !== "Tous") params.set("status",   filters.status);
    if (filters.keyword)  params.set("keyword", filters.keyword);

    const query = params.toString() ? `?${params}` : "";
    return fetchJSON(`${BASE_URL}/complaints${query}`);
  },

  // ─── Récupérer les statistiques (admin) ───
  getStats: () =>
    fetchJSON(`${BASE_URL}/complaints/stats`),

  // ─── Récupérer les réclamations d'un étudiant ───
  getByEmail: (email) =>
    fetchJSON(`${BASE_URL}/complaints/by-email?email=${encodeURIComponent(email)}`),

  // ─── Récupérer une réclamation par ID ───
  getById: (id) =>
    fetchJSON(`${BASE_URL}/complaints/${id}`),

  // ─── Créer une réclamation (formulaire étudiant) ───
  create: (data) =>
    fetchJSON(`${BASE_URL}/complaints`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ─── Mettre à jour le statut (admin) ───
  updateStatus: (id, status) =>
    fetchJSON(`${BASE_URL}/complaints/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // ─── Supprimer une réclamation ───
  delete: (id) =>
    fetchJSON(`${BASE_URL}/complaints/${id}`, {
      method: "DELETE",
    }),
};


// ─────────────────────────────────────────────
// GUIDE D'INTÉGRATION DANS App.js
// ─────────────────────────────────────────────
//
// ÉTAPE 1 — Importer l'API en haut de App.js :
//   import { complaintApi } from './api';
//
// ÉTAPE 2 — Changer l'état initial pour charger depuis le backend :
//
//   const [complaints, setComplaints] = useState([]);
//
//   useEffect(() => {
//     complaintApi.getAll()
//       .then(data => setComplaints(data))
//       .catch(err => console.error("Erreur chargement:", err));
//   }, []);
//
// ÉTAPE 3 — Modifier handleFormSubmit pour appeler le backend :
//
//   const handleFormSubmit = useCallback(async (data) => {
//     try {
//       const created = await complaintApi.create(data);
//       setComplaints(prev => [created, ...prev]);
//       setLastId(created.id);
//       setView("success");
//     } catch (err) {
//       alert("Erreur lors de la soumission : " + err.message);
//     }
//   }, []);
//
// ÉTAPE 4 — Modifier handleChangeStatus pour appeler le backend :
//
//   const handleChangeStatus = useCallback(async (id, newStatus) => {
//     try {
//       const updated = await complaintApi.updateStatus(id, newStatus);
//       setComplaints(prev => prev.map(c => c.id === id ? updated : c));
//     } catch (err) {
//       console.error("Erreur mise à jour statut:", err);
//     }
//   }, []);
//
// ÉTAPE 5 — Dans ListView, charger les réclamations de l'étudiant :
//
//   useEffect(() => {
//     if (studentEmail) {
//       complaintApi.getByEmail(studentEmail)
//         .then(data => setMyComplaints(data))
//         .catch(err => console.error(err));
//     }
//   }, [studentEmail]);
