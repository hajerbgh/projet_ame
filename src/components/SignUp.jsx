import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/assurance.ico';
import welcome from '../assets/welcomeBack.png';
import bgImage from '../assets/signUpBackground.jpg'; 
import { CloudUpload } from 'lucide-react'; 

const SignUp = () => {
  const [fullName, setFullName] = useState('');
  const [cin, setCin] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('cin', cin);
      formData.append('phoneNumber', phoneNumber);
      formData.append('email', email);
      formData.append('password', password);
      if (photo) formData.append('photo', photo);

      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert('Erreur réseau ou serveur.');
      console.error(error);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#f5f5f5] flex items-center justify-center overflow-hidden">
      <div className="w-[90vw] h-[90vh] max-w-[1600px] max-h-[950px] flex rounded-lg shadow-xl overflow-hidden">
        {/* Left Side - Background */}
        <div
          className="w-1/2 h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>

        {/* Right Side - Form */}
        <div className="w-1/2 h-full bg-white p-10 overflow-y-auto flex flex-col items-center">
          {/* Logo */}
          <img src={logo} alt="Logo" className="w-[150px] h-[120px] mt-2" />

          {/* Welcome image */}
          <img src={welcome} alt="Welcome Back" className="mt-6 w-[320px]" />

          <p className="text-center text-[16px] text-[#898E97] mt-4 mb-8">
            Create your account by filling all the required fields.
          </p>

          <form onSubmit={handleSubmit} className="w-full max-w-[450px]">
            {/* Full Name */}
            <div className="mb-4">
              <label className="block mb-1 text-black text-[16px]">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full h-[45px] px-4 border border-[#C4C4C4] rounded-[10px]"
              />
            </div>

            {/* CIN */}
            <div className="mb-4">
              <label className="block mb-1 text-black text-[16px]">CIN</label>
              <input
                type="text"
                value={cin}
                onChange={(e) => setCin(e.target.value)}
                required
                className="w-full h-[45px] px-4 border border-[#C4C4C4] rounded-[10px]"
              />
            </div>

            {/* Phone Number */}
            <div className="mb-4">
              <label className="block mb-1 text-black text-[16px]">Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full h-[45px] px-4 border border-[#C4C4C4] rounded-[10px]"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block mb-1 text-black text-[16px]">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[45px] px-4 border border-[#C4C4C4] rounded-[10px]"
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block mb-1 text-black text-[16px]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-[45px] px-4 border border-[#C4C4C4] rounded-[10px]"
              />
            </div>

            {/* Upload Photo with Icon */}
            <div className="mb-6">
              <label className="block mb-2 text-black text-[16px]">Upload Photo</label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="upload-photo"
                  className="flex items-center gap-2 cursor-pointer text-[#466D1D] hover:underline"
                >
                  <CloudUpload className="w-6 h-6" />
                  <span>Choose image</span>
                </label>
                {photo && <span className="text-sm text-gray-600">{photo.name}</span>}
              </div>
              <input
                type="file"
                id="upload-photo"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="hidden"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-[45px] bg-[#466D1D] text-white rounded-[10px] font-semibold hover:bg-[#3a5817] transition"
            >
              Sign Up
            </button>

            {/* Already have an account */}
            <div className="mt-4 text-center">
              <p className="text-[16px] text-[#B2D3C2]">
                Already have an account?{' '}
                <Link to="/signin" className="text-green-400 hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
