import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import ForgetPassword from './components/ForgetPassword';
import Dashboard from './components/DashBoard';
import Sidebar from './components/SideBar';
import Clients from './components/Clients';
import Contracts from './components/Contracts';
import Claims from './components/Claims'; 
import AddClient from './components/AddClient';
import Users from './components/users';
import Profile from './components/Profile';
import Predictions from './components/Predictions';
const PageWrapper = ({ children }) => (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    <main className="flex-1 p-6">{children}</main>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages (centrées) */}
        <Route
          path="/signin"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <SignIn />
            </div>
          }
        />
        <Route path="/clients" element={<Clients />} />
<Route path="/add-client" element={<AddClient />} />
<Route path="/edit-client/:id" element={<AddClient />} />
        <Route
  path="/profile"
  element={
    <PageWrapper>
      <Profile />
    </PageWrapper>
  }
/>
        <Route
          path="/signup"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <SignUp />
            </div>
          }
        />
         <Route path="/clients" element={<Clients />} />
        <Route path="/overview" element={<Dashboard />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/claims" element={<Claims />} />
        <Route path="/users" element={<Users />} />
        <Route
          path="/forget-password"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <ForgetPassword />
            </div>
          }
        />

        {/* Pages internes avec sidebar */}
        <Route
          path="/overview"
          element={
            <PageWrapper>
              <h1 className="text-xl font-bold text-green-700">Dashboard Overview</h1>
            </PageWrapper>
          }
        />
        <Route
          path="/clients"
          element={
            <PageWrapper>
              <h1 className="text-xl font-bold text-green-700">Gestion des Clients</h1>
            </PageWrapper>
          }
        />
        <Route
          path="/contrats"
          element={
            <PageWrapper>
              <h1 className="text-xl font-bold text-green-700">Contrats</h1>
            </PageWrapper>
          }
        />
        <Route
          path="/sinistres"
          element={
            <PageWrapper>
              <h1 className="text-xl font-bold text-green-700">Sinistres</h1>
            </PageWrapper>
          }
        />
    <Route
  path="/predictions"
  element={
    
      <Predictions />
    
  }
/>

        <Route
          path="/statistiques"
          element={
            <PageWrapper>
              <h1 className="text-xl font-bold text-green-700">Statistiques</h1>
            </PageWrapper>
          }
        />
        <Route
          path="/utilisateurs"
          element={
            <PageWrapper>
              <h1 className="text-xl font-bold text-green-700">Utilisateurs</h1>
            </PageWrapper>
          }
        />

        {/* Redirection par défaut */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <SignIn />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
