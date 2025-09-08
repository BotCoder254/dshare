import React, { useState } from 'react';
import { FaCode, FaCheck, FaCopy } from 'react-icons/fa';

const EmbedCodeGenerator = ({ pollId, pollTitle }) => {
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [responsive, setResponsive] = useState(true);
  
  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/embed/${pollId}`;
  
  // Generate secure iframe embed code
  const generateEmbedCode = () => {
    // Base parameters
    let width = responsive ? '100%' : '400px';
    let height = '450px';
    
    // Dark mode parameter
    const theme = darkMode ? '#theme=dark' : '';
    
    // Sandbox attributes for security:
    // allow-scripts: Let the iframe run scripts (required for the poll to function)
    // allow-same-origin: For accessing localStorage for vote tracking
    // allow-forms: For the voting form
    // allow-popups: For the "View on DShare" link
    // We specifically don't include allow-top-navigation to prevent the iframe from navigating the parent page
    const sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';
    
    return `<iframe 
  src="${embedUrl}${theme ? '?' + theme : ''}"
  width="${width}" 
  height="${height}" 
  style="border:none; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1);" 
  title="${pollTitle || 'DShare Poll'}"
  sandbox="${sandbox}"
  loading="lazy">
</iframe>`;
  };
  
  // Copy embed code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FaCode className="text-mpesa-green" />
        <h3 className="font-medium">Embed Poll</h3>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700 dark:text-gray-300">
            Dark Mode
          </label>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
              darkMode ? 'bg-mpesa-green' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700 dark:text-gray-300">
            Responsive Width
          </label>
          <button
            onClick={() => setResponsive(!responsive)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
              responsive ? 'bg-mpesa-green' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                responsive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div className="bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-3">
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">
            {generateEmbedCode()}
          </pre>
        </div>
        
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 p-2 text-gray-500 hover:text-mpesa-green"
          aria-label="Copy to clipboard"
        >
          {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
        </button>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Paste this code into your website to embed the poll. The iframe is secure and sandboxed to protect both your site and users.
      </p>
    </div>
  );
};

export default EmbedCodeGenerator;
