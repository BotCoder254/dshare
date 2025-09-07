import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaTwitter, 
  FaFacebookF, 
  FaLinkedinIn, 
  FaWhatsapp, 
  FaEnvelope,
  FaCopy,
  FaCheck,
  FaCode
} from 'react-icons/fa';
import { sharePoll, getEmbedCode } from '../services/search.service';

const ShareButtons = ({ pollId, title = 'Check out this poll!' }) => {
  const [copied, setCopied] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  
  // Copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      const url = await sharePoll(pollId, 'copy');
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL', error);
    }
  };
  
  // Show embed code
  const handleShowEmbed = () => {
    const code = getEmbedCode(pollId, { width: '100%', height: '500px' });
    setEmbedCode(code);
    setShowEmbed(true);
  };
  
  // Copy embed code
  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy embed code', error);
    }
  };
  
  return (
    <div className="w-full">
      <h3 className="font-medium mb-3">Share this poll</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Social Media Share Buttons */}
        <button
          onClick={() => sharePoll(pollId, 'twitter')}
          className="bg-[#1DA1F2] text-white p-2 rounded-full hover:bg-opacity-80 transition-all"
          aria-label="Share on Twitter"
        >
          <FaTwitter />
        </button>
        
        <button
          onClick={() => sharePoll(pollId, 'facebook')}
          className="bg-[#1877F2] text-white p-2 rounded-full hover:bg-opacity-80 transition-all"
          aria-label="Share on Facebook"
        >
          <FaFacebookF />
        </button>
        
        <button
          onClick={() => sharePoll(pollId, 'linkedin')}
          className="bg-[#0A66C2] text-white p-2 rounded-full hover:bg-opacity-80 transition-all"
          aria-label="Share on LinkedIn"
        >
          <FaLinkedinIn />
        </button>
        
        <button
          onClick={() => sharePoll(pollId, 'whatsapp')}
          className="bg-[#25D366] text-white p-2 rounded-full hover:bg-opacity-80 transition-all"
          aria-label="Share on WhatsApp"
        >
          <FaWhatsapp />
        </button>
        
        <button
          onClick={() => sharePoll(pollId, 'email')}
          className="bg-gray-600 text-white p-2 rounded-full hover:bg-opacity-80 transition-all"
          aria-label="Share via Email"
        >
          <FaEnvelope />
        </button>
        
        <button
          onClick={copyToClipboard}
          className={`bg-gray-200 text-gray-700 p-2 rounded-full hover:bg-gray-300 transition-all`}
          aria-label="Copy Link"
        >
          {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
        </button>
        
        <button
          onClick={handleShowEmbed}
          className="bg-gray-200 text-gray-700 p-2 rounded-full hover:bg-gray-300 transition-all"
          aria-label="Embed Poll"
        >
          <FaCode />
        </button>
      </div>
      
      {/* Embed Code Modal */}
      {showEmbed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border rounded-md p-3 bg-gray-50 dark:bg-dark-bg-primary mb-4"
        >
          <h4 className="text-sm font-medium mb-2">Embed this poll</h4>
          <div className="relative">
            <textarea
              value={embedCode}
              readOnly
              rows={3}
              className="w-full p-2 bg-white dark:bg-dark-bg-secondary border rounded text-xs font-mono"
            />
            <button
              onClick={copyEmbedCode}
              className="absolute right-2 top-2 text-sm text-mpesa-green hover:text-mpesa-dark"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={() => setShowEmbed(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ShareButtons;
