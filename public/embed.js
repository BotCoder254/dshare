/**
 * DShare Embedded Poll Widget Loader
 * This script dynamically loads and initializes embedded polls.
 */
(function() {
  const BASE_URL = document.currentScript.src.replace('/embed.js', '');
  
  // Poll configuration from script attributes
  const pollId = document.currentScript.getAttribute('data-poll-id');
  const theme = document.currentScript.getAttribute('data-theme') || 'auto';
  const width = document.currentScript.getAttribute('data-width') || '100%';
  const height = document.currentScript.getAttribute('data-height') || 'auto';
  
  // Target container (next to script or specified by id)
  let container = document.getElementById('dshare-poll-' + pollId);
  if (!container) {
    console.error('DShare Poll Widget: Container element not found for poll ID ' + pollId);
    return;
  }

  // Set up container styles
  container.style.width = width;
  if (height !== 'auto') {
    container.style.height = height;
  }
  container.style.overflow = 'hidden';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
  
  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = `${BASE_URL}/embed/${pollId}`;
  iframe.style.width = '100%';
  iframe.style.height = height === 'auto' ? '400px' : height;
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.title = 'DShare Poll';
  iframe.allowtransparency = 'true';
  
  // Append iframe to container
  container.appendChild(iframe);
  
  // Apply theme
  if (theme === 'dark') {
    setTimeout(() => {
      iframe.contentWindow.postMessage('enable-dark-mode', '*');
    }, 100);
  } else if (theme === 'light') {
    setTimeout(() => {
      iframe.contentWindow.postMessage('disable-dark-mode', '*');
    }, 100);
  } else {
    // Auto theme detection
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTimeout(() => {
      iframe.contentWindow.postMessage(
        isDarkMode ? 'enable-dark-mode' : 'disable-dark-mode', 
        '*'
      );
    }, 100);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      iframe.contentWindow.postMessage(
        e.matches ? 'enable-dark-mode' : 'disable-dark-mode',
        '*'
      );
    });
  }
  
  // Handle iframe resizing when content changes
  window.addEventListener('message', (event) => {
    if (event.data === 'poll-embedded' && height === 'auto') {
      // Add resize observer to adjust height
      const resizeObserver = new ResizeObserver(entries => {
        // Get the first observed element
        const rect = entries[0].contentRect;
        iframe.style.height = `${rect.height + 20}px`; // Add padding
      });
      
      // Observe iframe content size changes
      try {
        resizeObserver.observe(iframe.contentDocument.body);
      } catch (e) {
        // Fallback if we can't access the contentDocument due to CORS
        iframe.style.height = '450px';
      }
    }
  });
  
  // Track embed view
  fetch(`${BASE_URL}/api/polls/${pollId}/track-embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      referrer: document.referrer || 'unknown',
      url: window.location.href
    })
  }).catch(() => {
    // Silent fail if tracking fails
  });
  
})();
