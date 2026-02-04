import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/assurance.ico';
import welcome from '../assets/welcomeBack.png';
import eye from '../assets/eye.png';
import eyeSlash from '../assets/eye-slash.jpg';
import bgImage from '../assets/signUpBackground.jpg';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/overview');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Erreur réseau ou serveur.');
      console.error(error);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#f5f5f5] flex items-center justify-center overflow-hidden">
      <div className="w-[90vw] h-[90vh] max-w-[1600px] max-h-[900px] flex rounded-lg shadow-xl overflow-hidden">
        {/* Left Side - Form */}
        <div className="w-1/2 h-full bg-white p-8 flex flex-col items-center justify-start">
          <img src={logo} alt="Logo" className="w-[150px] h-[120px] mt-8" />
          <img src={welcome} alt="Welcome" className="mt-8 w-[300px]" />
          <p className="text-center text-[16px] text-[#898E97] mt-4">
            Welcome back! Please enter your details to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 w-full max-w-[400px] px-2">
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

            <div className="mb-4">
              <label className="block mb-2 text-[16px] text-black">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-[50px] px-4 border border-[#C4C4C4] rounded-[10px] text-[16px]"
                />
                <div
                  className="absolute top-[13px] right-4 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <img
                    src={showPassword ? eye : eyeSlash}
                    alt="toggle"
                    className="w-[22px] h-[22px] mr-2"
                  />
                  <span className="text-[14px] text-[#666666CC]">
                    {showPassword ? 'Hide' : 'Show'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right mb-6">
              <Link to="/forget-password" className="text-[#B2D3C2] text-[16px] hover:underline">
                Forget Password ?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full h-[45px] bg-[#466D1D] text-white rounded-[10px] font-semibold hover:bg-[#3a5817] transition"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Right Side - Background Image */}
        <div
          className="w-1/2 h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
      </div>
    </div>
  );
};

export default SignIn;
