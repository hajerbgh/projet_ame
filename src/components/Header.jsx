import React from 'react';
import calendarIcon from '../assets/icons/calendar_green.svg';
import wavingHand from '../assets/waving-hand.png';

const Header = () => {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Récupérer le user depuis localStorage
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userName = user?.nom || 'Utilisateur';

  return (
    <div
      style={{
        width: '1346px',
        height: '135px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 48px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
        position: 'relative',
        left: '0px',
      }}
    >
      {/* Date à gauche */}
      <div className="flex items-center gap-3" style={{ position: 'relative', top: '9px' }}>
        <img src={calendarIcon} alt="Calendar" style={{ width: '24px', height: '24px' }} />
        <span
          style={{
            fontFamily: 'Lato',
            fontSize: '20px',
            fontWeight: 500,
            lineHeight: '100%',
            color: '#466D1D',
            width: '142px',
            height: '26px',
          }}
        >
          {today}
        </span>
      </div>

      {/* Welcome à droite */}
      <div className="flex items-center gap-3">
        <img src={wavingHand} alt="Hello" style={{ width: '28px', height: '28px' }} />
        <span
  style={{
    fontFamily: 'Lato',
    fontWeight: 700,
    fontSize: '24px',
    lineHeight: '100%',
    color: '#192D45',
    maxWidth: '300px',  // largeur max flexible
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis', // ajoute "..." si trop long
  }}
>
  Welcome back, {userName}
</span>

      </div>
    </div>
  );
};

export default Header;
