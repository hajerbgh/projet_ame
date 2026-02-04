import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import logo from '../assets/assurance.ico';
import welcome from '../assets/forgetPassword.png';
import bgImage from '../assets/signUpBackground.jpg';

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/request-reset-code', {
        email,
      });
      alert(response.data.message);
      setCodeSent(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de l’envoi du code');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/reset-password', {
        email,
        code,
        newPassword,
      });
      alert(response.data.message);
      // Optionnel : redirection vers /signin
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la réinitialisation');
    }
  };

  return (
    <div className="w-screen h-screen bg-[#f5f5f5] flex items-center justify-center overflow-hidden">
      <div className="w-[90vw] h-[90vh] max-w-[1600px] max-h-[900px] flex rounded-lg shadow-xl  overflow-y-auto">
        {/* Left Side - Background */}
        <div
          className="w-1/2 h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>

        {/* Right Side - Form */}
        <div className="w-1/2 h-full bg-white p-8 flex flex-col items-center overflow-y-auto">
          {/* Logo */}
          <img src={logo} alt="Logo" className="w-[150px] h-[120px] mt-8" />

          {/* Title Image */}
          <img src={welcome} alt="Forget Password" className="mt-8 w-[360px]" />

          {/* Subtitle */}
          <p className="text-center text-[16px] text-[#898E97] mt-4">
            {codeSent
              ? 'Entrez le code reçu par email et choisissez un nouveau mot de passe'
              : 'Entrez votre Email et Numéro de téléphone pour recevoir un code'}
          </p>

          {/* Form */}
          <form
  onSubmit={codeSent ? handleResetPassword : handleSendCode}
  className="mt-8 w-full max-w-[500px] pb-12" /* pb-12 ajoute un padding en bas */
>
            {/* Email */}
            <div className="mb-6">
              <label className="block mb-2 text-[16px] text-black">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-[50px] px-4 border border-[#C4C4C4] rounded-[10px] text-[16px]"
              />
            </div>

            {/* Phone */}
            {!codeSent && (
              <div className="mb-6">
                <label className="block mb-2 text-[16px] text-black">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full h-[50px] px-4 border border-[#C4C4C4] rounded-[10px] text-[16px]"
                />
              </div>
            )}

            {/* Code */}
            {codeSent && (
              <div className="mb-6">
                <label className="block mb-2 text-[16px] text-black">Code reçu par email</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full h-[50px] px-4 border border-[#C4C4C4] rounded-[10px] text-[16px]"
                />
              </div>
            )}

            {/* New Password */}
            {codeSent && (
              <div className="mb-6">
                <label className="block mb-2 text-[16px] text-black">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full h-[50px] px-4 border border-[#C4C4C4] rounded-[10px] text-[16px]"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full h-[45px] bg-[#466D1D] text-white rounded-[10px] font-semibold hover:bg-[#3a5817] transition"
            >
              {codeSent ? 'Réinitialiser le mot de passe' : 'Envoyer le code'}
            </button>

            {/* Back link */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <span className="material-symbols-rounded text-[#898E97] text-[21px]">
                arrow_back_ios_new
              </span>
              <Link
                to="/signin"
                className="text-[#898E97] text-[20px] font-medium font-lato hover:underline"
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
