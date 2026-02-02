import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Minimize2, Maximize2 } from 'lucide-react';
import api from "../../utils/api";

const Chatbot = ({ role = 'passenger', complaintId = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const roleConfig = {
    passenger: {
      title: 'RailMate Assistant',
      subtitle: 'Ask about complaints, tracking, or railway info',
      color: 'blue',
      endpoint: '/chatbot/passenger'
    },
    admin: {
      title: 'Admin Analytics Bot',
      subtitle: 'Get insights, stats, and recommendations',
      color: 'purple',
      endpoint: '/chatbot/admin'
    },
    staff: {
      title: 'Staff Helper',
      subtitle: 'Get help with assignments and resolutions',
      color: 'green',
      endpoint: '/chatbot/staff'
    }
  };

  const config = roleConfig[role];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const payload = { message: input };
      if (role === 'staff' && complaintId) {
        payload.complaintId = complaintId;
      }

      const response = await api.post(config.endpoint, payload);
      console.log('Chatbot API response:', response);
      
      const botMessage = {
        text: response?.data?.response || response?.response || 'No response received',
        sender: 'bot',
        timestamp: new Date(),
        context: response?.data?.stats || response?.data?.context || response?.data?.workload
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        text: error.response?.data?.message || 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = {
    passenger: [
      'How do I file a complaint?',
      'Track my complaint status',
      'What categories are available?',
      'How long does resolution take?'
    ],
    admin: [
      'Show pending complaints',
      'What is the current trend?',
      'Staff allocation status',
      'High priority issues'
    ],
    staff: [
      'Show my pending tasks',
      'How to resolve this complaint?',
      'Priority recommendations',
      'My completed tasks today'
    ]
  };

  if (!isOpen) {
    const buttonColors = {
      blue: 'bg-blue-600 hover:bg-blue-700',
      purple: 'bg-purple-600 hover:bg-purple-700',
      green: 'bg-green-600 hover:bg-green-700'
    };
    
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 ${buttonColors[config.color]} text-white p-3 sm:p-4 rounded-full shadow-lg transition-all transform hover:scale-110 z-50`}
        title={config.title}
      >
        <Bot size={24} className="sm:w-7 sm:h-7" />
      </button>
    );
  }

  const headerColors = {
    blue: 'bg-gradient-to-r from-blue-600 to-blue-700',
    purple: 'bg-gradient-to-r from-purple-600 to-purple-700',
    green: 'bg-gradient-to-r from-green-600 to-green-700'
  };

  const messageColors = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600'
  };

  const buttonBgColors = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    green: 'bg-green-600 hover:bg-green-700'
  };

  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 transition-all ${isMinimized ? 'w-80 sm:w-80 h-16' : 'w-[90vw] max-w-96 sm:w-96 h-[500px] sm:h-[600px]'} flex flex-col`}>
      {/* Header */}
      <div className={`${headerColors[config.color]} text-white p-3 sm:p-4 rounded-t-lg flex items-center justify-between`}>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="bg-white bg-opacity-20 p-1.5 sm:p-2 rounded-full">
            <Bot size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-base sm:text-lg">{config.title}</h3>
            {!isMinimized && <p className="text-xs opacity-90">{config.subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white hover:bg-opacity-20 p-1 rounded"
          >
            {isMinimized ? <Maximize2 size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Minimize2 size={16} className="sm:w-[18px] sm:h-[18px]" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white hover:bg-opacity-20 p-1 rounded"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-4 sm:mt-8">
                <Bot size={40} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm mb-3 sm:mb-4 px-2">Hi! How can I help you today?</p>
                <div className="space-y-2">
                  {quickActions[role].slice(0, 3).map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(action)}
                      className="block w-full text-left text-xs sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[80%] ${msg.sender === 'user' ? `${messageColors[config.color]} text-white` : msg.error ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-white dark:bg-gray-700 dark:text-gray-200'} rounded-lg p-2.5 sm:p-3 shadow`}>
                  <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                  <span className="text-[10px] sm:text-xs opacity-70 mt-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 rounded-lg px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className={`${buttonBgColors[config.color]} text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                <Send size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;
