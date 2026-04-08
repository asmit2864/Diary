import React from 'react';
import { 
  FaGoogle, FaInstagram, FaApple, FaFacebook, FaTwitter, 
  FaGithub, FaAmazon, FaSpotify, FaDiscord, FaTwitch, FaLinkedin, FaSnapchatGhost,
  FaPaypal, FaYoutube, FaUniversity, FaCreditCard, FaGlobe, FaGamepad, FaFilm
} from 'react-icons/fa';
import { Shield } from 'lucide-react';

export function getIconForTitle(title) {
  if (!title || typeof title !== 'string') {
    return <Shield size={18} strokeWidth={2} />;
  }

  const t = title.toLowerCase();

  // Brand exact or partial matches
  if (t.includes('google') || t.includes('gmail')) return <FaGoogle size={16} />;
  if (t.includes('youtube')) return <FaYoutube size={16} />;
  if (t.includes('instagram') || t.includes('ig')) return <FaInstagram size={16} />;
  if (t.includes('apple') || t.includes('icloud') || t.includes('mac')) return <FaApple size={16} />;
  if (t.includes('netflix') || t.includes('hulu') || t.includes('prime')) return <FaFilm size={16} />;
  if (t.includes('facebook') || t.includes('fb')) return <FaFacebook size={16} />;
  if (t.includes('twitter') || t.includes('x.com')) return <FaTwitter size={16} />;
  if (t.includes('github') || t.includes('git')) return <FaGithub size={16} />;
  if (t.includes('amazon') || t.includes('aws')) return <FaAmazon size={16} />;
  if (t.includes('spotify')) return <FaSpotify size={16} />;
  if (t.includes('discord')) return <FaDiscord size={18} />; 
  if (t.includes('twitch')) return <FaTwitch size={16} />;
  if (t.includes('linkedin')) return <FaLinkedin size={16} />;
  if (t.includes('snapchat')) return <FaSnapchatGhost size={16} />;
  if (t.includes('paypal') || t.includes('stripe')) return <FaPaypal size={16} />;
  
  // Generic matches
  if (t.includes('bank') || t.includes('chase') || t.includes('citi') || t.includes('wells') || t.includes('hdfc')) return <FaUniversity size={16} />;
  if (t.includes('card') || t.includes('visa') || t.includes('mastercard')) return <FaCreditCard size={16} />;
  if (t.includes('game') || t.includes('steam') || t.includes('epic') || t.includes('xbox') || t.includes('playstation') || t.includes('riot') || t.includes('valorant')) return <FaGamepad size={18} />;
  if (t.includes('web') || t.includes('site') || t.includes('.com') || t.includes('host') || t.includes('domain')) return <FaGlobe size={16} />;

  // Default fallback
  return <Shield size={18} strokeWidth={2} />;
}
