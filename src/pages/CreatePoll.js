import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { FaArrowLeft, FaArrowRight, FaCheck, FaTimes, FaPlus, FaTrash, FaGripLines } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { createPoll } from '../services/poll.service';

// Poll option types
const POLL_TYPES = [
  { id: 'single-choice', name: 'Single Choice', description: 'Voters can select only one option' },
  { id: 'multiple-choice', name: 'Multiple Choice', description: 'Voters can select multiple options' },
  { id: 'ranked-choice', name: 'Ranked Choice', description: 'Voters rank options in order of preference' }
];

// Privacy options
const PRIVACY_OPTIONS = [
  { id: 'public', name: 'Public', description: 'Anyone can view and vote' },
  { id: 'private', name: 'Private', description: 'Only people with the link can view and vote' },
  { id: 'password-protected', name: 'Password Protected', description: 'Requires a password to vote' }
];

// Result visibility options
const RESULT_OPTIONS = [
  { id: 'always', name: 'Always Visible', description: 'Results are always visible to voters' },
  { id: 'after-vote', name: 'After Voting', description: 'Results are visible only after voting' },
  { id: 'after-close', name: 'After Closing', description: 'Results are visible only after poll closes' }
];

const CreatePoll = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    options: [{ text: '' }, { text: '' }],
    votingSystem: 'single-choice',
    privacy: 'public',
    password: '',
    expiresAt: '',
    allowGuestVoting: true,
    showResults: 'always',
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // Create poll mutation
  const createPollMutation = useMutation({
    mutationFn: createPoll,
    onSuccess: (data) => {
      // Navigate to the poll page
      navigate(`/polls/${data.data._id}`);
    },
    onError: (error) => {
      console.error('Failed to create poll:', error);
    }
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Add a new option
  const addOption = () => {
    setFormValues(prev => ({
      ...prev,
      options: [...prev.options, { text: '' }]
    }));
  };
  
  // Remove an option
  const removeOption = (index) => {
    setFormValues(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };
  
  // Handle option input change
  const handleOptionChange = (index, value) => {
    const newOptions = [...formValues.options];
    newOptions[index].text = value;
    setFormValues(prev => ({
      ...prev,
      options: newOptions
    }));
    
    // Clear error
    if (errors.options?.[index]) {
      const newErrors = { ...errors };
      if (newErrors.options) {
        newErrors.options[index] = null;
      }
      setErrors(newErrors);
    }
  };
  
  // Reorder options using drag and drop (simplified version without actual DnD)
  const moveOption = (fromIndex, toIndex) => {
    const newOptions = [...formValues.options];
    const [movedItem] = newOptions.splice(fromIndex, 1);
    newOptions.splice(toIndex, 0, movedItem);
    setFormValues(prev => ({
      ...prev,
      options: newOptions
    }));
  };
  
  // Validate current step
  const validateCurrentStep = () => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formValues.title.trim()) {
        newErrors.title = 'Title is required';
      } else if (formValues.title.length > 100) {
        newErrors.title = 'Title cannot exceed 100 characters';
      }
      
      if (formValues.description.length > 500) {
        newErrors.description = 'Description cannot exceed 500 characters';
      }
    }
    
    if (step === 2) {
      const optionErrors = [];
      formValues.options.forEach((option, index) => {
        if (!option.text.trim()) {
          optionErrors[index] = 'Option text is required';
        }
      });
      
      if (optionErrors.length > 0 && optionErrors.some(err => err)) {
        newErrors.options = optionErrors;
      }
      
      if (formValues.options.length < 2) {
        newErrors.optionsLength = 'At least 2 options are required';
      }
    }
    
    if (step === 3) {
      if (formValues.privacy === 'password-protected' && !formValues.password) {
        newErrors.password = 'Password is required for password-protected polls';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step
  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep(prevStep => prevStep + 1);
    }
  };
  
  // Handle previous step
  const prevStep = () => {
    setStep(prevStep => prevStep - 1);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateCurrentStep()) {
      createPollMutation.mutate({
        ...formValues,
        options: formValues.options.map(option => option.text)
      });
    }
  };
  
  // Render step indicators
  const renderStepIndicators = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center">
            <div 
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                ${step === i 
                  ? 'border-mpesa-green bg-mpesa-green text-white' 
                  : step > i 
                    ? 'border-mpesa-green bg-white text-mpesa-green' 
                    : 'border-gray-300 bg-white text-gray-500'
                }`}
            >
              {step > i ? <FaCheck /> : i}
            </div>
            {i < 4 && (
              <div 
                className={`w-16 h-1 ${
                  step > i ? 'bg-mpesa-green' : 'bg-gray-300'
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Render step 1: Basic Information
  const renderStepOne = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <label 
            htmlFor="title" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Poll Title*
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formValues.title}
            onChange={handleInputChange}
            placeholder="e.g., What's your favorite programming language?"
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-mpesa-green focus:border-mpesa-green dark:bg-dark-bg-secondary dark:border-gray-600 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>
        
        <div>
          <label 
            htmlFor="description" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formValues.description}
            onChange={handleInputChange}
            placeholder="Add more context to your poll question"
            rows={4}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-mpesa-green focus:border-mpesa-green dark:bg-dark-bg-secondary dark:border-gray-600 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
        </div>
      </div>
    );
  };
  
  // Render step 2: Poll Options
  const renderStepTwo = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Poll Options*
            </label>
            <button
              type="button"
              onClick={addOption}
              className="flex items-center text-sm text-mpesa-green hover:text-mpesa-dark"
            >
              <FaPlus size={12} className="mr-1" />
              Add Option
            </button>
          </div>
          
          {errors.optionsLength && (
            <p className="mt-1 text-sm text-red-500 mb-2">{errors.optionsLength}</p>
          )}
          
          <div className="space-y-2">
            {formValues.options.map((option, index) => (
              <div 
                key={index}
                className="flex items-center space-x-2"
              >
                <div className="p-2 text-gray-500 cursor-move">
                  <FaGripLines />
                </div>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className={`flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-mpesa-green focus:border-mpesa-green dark:bg-dark-bg-secondary dark:border-gray-600 ${
                    errors.options?.[index] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formValues.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Voting System
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {POLL_TYPES.map((type) => (
              <label 
                key={type.id}
                className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                  formValues.votingSystem === type.id
                    ? 'border-mpesa-green bg-mpesa-green/10 dark:bg-mpesa-green/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    name="votingSystem"
                    value={type.id}
                    checked={formValues.votingSystem === type.id}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-mpesa-green"
                  />
                  <span className="ml-2 font-medium">{type.name}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{type.description}</p>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Render step 3: Advanced Settings
  const renderStepThree = () => {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Privacy Settings
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRIVACY_OPTIONS.map((option) => (
              <label 
                key={option.id}
                className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                  formValues.privacy === option.id
                    ? 'border-mpesa-green bg-mpesa-green/10 dark:bg-mpesa-green/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    name="privacy"
                    value={option.id}
                    checked={formValues.privacy === option.id}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-mpesa-green"
                  />
                  <span className="ml-2 font-medium">{option.name}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{option.description}</p>
              </label>
            ))}
          </div>
        </div>
        
        {formValues.privacy === 'password-protected' && (
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Poll Password*
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formValues.password}
              onChange={handleInputChange}
              placeholder="Enter a password for your poll"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-mpesa-green focus:border-mpesa-green dark:bg-dark-bg-secondary dark:border-gray-600 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>
        )}
        
        <div>
          <label 
            htmlFor="expiresAt" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Expiry Date (Optional)
          </label>
          <input
            type="datetime-local"
            id="expiresAt"
            name="expiresAt"
            value={formValues.expiresAt}
            onChange={handleInputChange}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-mpesa-green focus:border-mpesa-green dark:bg-dark-bg-secondary dark:border-gray-600"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            If set, voting will automatically close at this time
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Result Visibility
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {RESULT_OPTIONS.map((option) => (
              <label 
                key={option.id}
                className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                  formValues.showResults === option.id
                    ? 'border-mpesa-green bg-mpesa-green/10 dark:bg-mpesa-green/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    name="showResults"
                    value={option.id}
                    checked={formValues.showResults === option.id}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-mpesa-green"
                  />
                  <span className="ml-2 font-medium">{option.name}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{option.description}</p>
              </label>
            ))}
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allowGuestVoting"
            name="allowGuestVoting"
            checked={formValues.allowGuestVoting}
            onChange={handleInputChange}
            className="w-4 h-4 text-mpesa-green border-gray-300 rounded focus:ring-mpesa-green"
          />
          <label 
            htmlFor="allowGuestVoting" 
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            Allow guest voting (users without accounts)
          </label>
        </div>
      </div>
    );
  };
  
  // Render step 4: Review and Publish
  const renderStepFour = () => {
    return (
      <div className="space-y-8 animate-fade-in">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Review Your Poll</h3>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {formValues.title || 'Untitled Poll'}
          </h2>
          {formValues.description && (
            <p className="text-gray-700 dark:text-gray-300 mb-4">{formValues.description}</p>
          )}
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options:</h4>
            <ul className="space-y-1 ml-5 list-disc">
              {formValues.options.map((option, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300">
                  {option.text || `Option ${index + 1}`}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Voting System:
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {POLL_TYPES.find(type => type.id === formValues.votingSystem)?.name}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Privacy:
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {PRIVACY_OPTIONS.find(option => option.id === formValues.privacy)?.name}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Results Visibility:
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {RESULT_OPTIONS.find(option => option.id === formValues.showResults)?.name}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Guest Voting:
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {formValues.allowGuestVoting ? 'Allowed' : 'Not allowed'}
              </p>
            </div>
            
            {formValues.expiresAt && (
              <div className="col-span-full">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expires:
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date(formValues.expiresAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render current step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderStepOne();
      case 2:
        return renderStepTwo();
      case 3:
        return renderStepThree();
      case 4:
        return renderStepFour();
      default:
        return null;
    }
  };
  
  // Render navigation buttons
  const renderNavButtons = () => {
    return (
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="flex items-center px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
        ) : (
          <div></div>
        )}
        
        {step < 4 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex items-center px-6 py-2 bg-mpesa-green text-white rounded-md shadow-sm text-sm font-medium hover:bg-mpesa-dark"
          >
            Next
            <FaArrowRight className="ml-2" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={createPollMutation.isPending}
            className={`flex items-center px-6 py-2 bg-mpesa-green text-white rounded-md shadow-sm text-sm font-medium ${
              createPollMutation.isPending 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:bg-mpesa-dark'
            }`}
          >
            {createPollMutation.isPending ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Creating...
              </>
            ) : (
              <>
                Publish Poll
                <FaCheck className="ml-2" />
              </>
            )}
          </button>
        )}
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicators */}
      {renderStepIndicators()}
      
      {/* Main form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-bg-secondary shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 pb-3 border-b dark:border-gray-700">
          {step === 1 && 'Basic Information'}
          {step === 2 && 'Poll Options'}
          {step === 3 && 'Advanced Settings'}
          {step === 4 && 'Review & Publish'}
        </h2>
        
        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation buttons */}
        {renderNavButtons()}
      </form>
    </div>
  );
};

export default CreatePoll;
