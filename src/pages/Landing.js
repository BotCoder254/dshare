import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPoll, FaVoteYea, FaChartBar, FaUserShield, FaGithub } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.6
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const Landing = () => {
  // Mock data for GitHub stars and contributors
  const [githubStats, setGithubStats] = useState({
    stars: '1.2k',
    contributors: 32
  });

  // Sample poll for demo widget
  const [demoPoll, setDemoPoll] = useState({
    question: 'What feature should we build next?',
    options: [
      { id: 1, text: 'Advanced analytics', votes: 35 },
      { id: 2, text: 'Mobile app', votes: 28 },
      { id: 3, text: 'AI-powered insights', votes: 42 },
      { id: 4, text: 'API integrations', votes: 19 }
    ],
    totalVotes: 124
  });
  
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = () => {
    if (selectedOption !== null) {
      setDemoPoll(prev => {
        const newOptions = prev.options.map(opt => 
          opt.id === selectedOption ? {...opt, votes: opt.votes + 1} : opt
        );
        return {
          ...prev,
          options: newOptions,
          totalVotes: prev.totalVotes + 1
        };
      });
      setHasVoted(true);
    }
  };

  // Calculate max votes for percentage display
  const maxVotes = Math.max(...demoPoll.options.map(option => option.votes));

  return (
    <MainLayout>
      {/* Hero Section */}
      <motion.section 
        className="relative py-16 md:py-24 bg-gradient-to-br from-white to-gray-100 dark:from-dark-bg-primary dark:to-dark-bg-secondary overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          {/* Hero Content */}
          <div className="md:w-1/2 mb-10 md:mb-0">
            <motion.div
              className="max-w-lg"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.h1 
                className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight"
                variants={fadeIn}
              >
                Create polls, run fair votes, share results —
                <span className="text-mpesa-green"> open source</span>
              </motion.h1>
              
              <motion.p 
                className="text-lg mb-8 text-gray-700 dark:text-gray-300"
                variants={fadeIn}
              >
                A modern, secure platform for creating polls and gathering feedback.
                Free forever, privacy-focused, and built by the community.
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap gap-4"
                variants={fadeIn}
              >
                <Link to="/create">
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="shadow-lg shadow-mpesa-green/20"
                  >
                    Create Free Poll
                  </Button>
                </Link>
                <a 
                  href="https://github.com/dshare-project" 
                  target="_blank" 
                  rel="noreferrer"
                >
                  <Button 
                    variant="secondary" 
                    size="lg"
                    leftIcon={<FaGithub />}
                  >
                    Contribute on GitHub
                  </Button>
                </a>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Hero Image/Demo Widget */}
          <motion.div 
            className="md:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl p-6 mx-auto max-w-md">
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">{demoPoll.question}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {demoPoll.totalVotes} votes • Demo poll
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                {demoPoll.options.map(option => (
                  <div key={option.id} className="relative">
                    <button
                      onClick={() => !hasVoted && setSelectedOption(option.id)}
                      className={`
                        relative w-full p-3 rounded-lg border transition-all duration-200 text-left
                        ${hasVoted 
                          ? 'cursor-default' 
                          : 'hover:border-mpesa-green cursor-pointer'
                        }
                        ${selectedOption === option.id 
                          ? 'border-mpesa-green ring-2 ring-mpesa-green/20' 
                          : 'border-gray-200 dark:border-gray-700'
                        }
                      `}
                      disabled={hasVoted}
                    >
                      {hasVoted && (
                        <div 
                          className="absolute top-0 left-0 h-full bg-mpesa-green/10 rounded-lg"
                          style={{ width: `${(option.votes / maxVotes) * 100}%` }}
                        ></div>
                      )}
                      <div className="flex justify-between relative z-10">
                        <span>{option.text}</span>
                        {hasVoted && (
                          <span className="font-medium">
                            {Math.round((option.votes / demoPoll.totalVotes) * 100)}%
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
              
              <Button
                onClick={handleVote}
                disabled={selectedOption === null || hasVoted}
                fullWidth
                className="mt-2"
              >
                {hasVoted ? 'Thanks for your vote!' : 'Vote'}
              </Button>
            </div>
          </motion.div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" fill="currentColor" className="text-white dark:text-dark-bg-primary">
            <path d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,80C1120,85,1280,75,1360,69.3L1440,64L1440,100L0,100Z"></path>
          </svg>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            variants={fadeIn}
          >
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to create engaging polls and make better decisions together.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <motion.div
              className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
              variants={fadeIn}
            >
              <div className="bg-mpesa-green/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <FaPoll className="text-mpesa-green text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Polls</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create beautiful polls in seconds. No account required to get started.
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div
              className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
              variants={fadeIn}
            >
              <div className="bg-mpesa-green/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <FaVoteYea className="text-mpesa-green text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple Voting Systems</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Single choice, multiple choice, or ranked voting for different needs.
              </p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div
              className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
              variants={fadeIn}
            >
              <div className="bg-mpesa-green/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <FaChartBar className="text-mpesa-green text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Results</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Watch results update in real-time as votes come in. Beautiful visualizations.
              </p>
            </motion.div>
            
            {/* Feature 4 */}
            <motion.div
              className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
              variants={fadeIn}
            >
              <div className="bg-mpesa-green/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <FaUserShield className="text-mpesa-green text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Privacy Controls</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Public, private or password-protected polls with customizable settings.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>
      
      {/* Social Proof */}
      <motion.section 
        className="py-16 bg-gray-50 dark:bg-dark-bg-secondary"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Trusted by the Community</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join thousands of users who create and participate in polls every day.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <div className="bg-white dark:bg-dark-bg-primary rounded-xl p-6 shadow-md w-full md:w-64 text-center">
              <h3 className="text-3xl font-bold text-mpesa-green mb-2">{githubStats.stars}</h3>
              <p className="text-gray-600 dark:text-gray-300">GitHub Stars</p>
            </div>
            
            <div className="bg-white dark:bg-dark-bg-primary rounded-xl p-6 shadow-md w-full md:w-64 text-center">
              <h3 className="text-3xl font-bold text-mpesa-green mb-2">{githubStats.contributors}</h3>
              <p className="text-gray-600 dark:text-gray-300">Contributors</p>
            </div>
            
            <div className="bg-white dark:bg-dark-bg-primary rounded-xl p-6 shadow-md w-full md:w-64 text-center">
              <h3 className="text-3xl font-bold text-mpesa-green mb-2">100%</h3>
              <p className="text-gray-600 dark:text-gray-300">Open Source</p>
            </div>
          </div>
        </div>
      </motion.section>
      
      {/* Developer & Community */}
      <motion.section 
        className="py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              DShare is built with love by developers for developers. Contribute, suggest features, or deploy your own instance.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <a 
              href="https://github.com/dshare-project" 
              target="_blank" 
              rel="noreferrer"
              className="px-6 py-3 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition duration-200 flex items-center space-x-2"
            >
              <FaGithub />
              <span>GitHub Repository</span>
            </a>
            
            <Link 
              to="/docs" 
              className="px-6 py-3 rounded-md border border-mpesa-green text-mpesa-green hover:bg-mpesa-green/10 transition duration-200"
            >
              Documentation
            </Link>
            
            <Link 
              to="/roadmap" 
              className="px-6 py-3 rounded-md border border-gray-300 dark:border-gray-700 hover:border-mpesa-green hover:text-mpesa-green transition duration-200"
            >
              Roadmap
            </Link>
          </div>
          
          <div className="mt-16 bg-gray-50 dark:bg-dark-bg-secondary p-8 rounded-xl max-w-3xl mx-auto">
            <h3 className="text-xl font-bold mb-4">Deploy Your Own Instance</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Self-host DShare on your own servers with one click using Docker Compose.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-200 flex items-center space-x-2">
                <span>Deploy to DigitalOcean</span>
              </button>
              <button className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition duration-200 flex items-center space-x-2">
                <span>Deploy to Heroku</span>
              </button>
              <button className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 transition duration-200 flex items-center space-x-2">
                <span>Deploy to Vercel</span>
              </button>
            </div>
          </div>
        </div>
      </motion.section>
    </MainLayout>
  );
};

export default Landing;
