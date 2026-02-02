import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Alert = ({ type = 'info', title, message, onClose }) => {
  const styles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-700/50',
      text: 'text-blue-800 dark:text-blue-300',
      icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-700/50',
      text: 'text-green-800 dark:text-green-300',
      icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      border: 'border-yellow-200 dark:border-yellow-700/50',
      text: 'text-yellow-800 dark:text-yellow-300',
      icon: <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-700/50',
      text: 'text-red-800 dark:text-red-300',
      icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    },
  };

  const style = styles[type] || styles.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`${style.bg} ${style.border} border-2 rounded-xl p-4 shadow-lg backdrop-blur-sm`}
    >
      <div className="flex items-start">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="flex-shrink-0"
        >
          {style.icon}
        </motion.div>
        <div className="ml-3 flex-1">
          {title && (
            <motion.h3
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className={`text-sm font-bold ${style.text}`}
            >
              {title}
            </motion.h3>
          )}
          {message && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-sm ${style.text} ${title ? 'mt-1' : ''}`}
            >
              {message}
            </motion.p>
          )}
        </div>
        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`ml-3 flex-shrink-0 ${style.text} hover:opacity-75 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default Alert;
