import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button';

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              relative w-full ${sizeClasses[size]}
              bg-card border border-border rounded-2xl shadow-2xl
              max-h-[90vh] flex flex-col overflow-hidden
            `}
          >
            <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl shrink-0">
              <h3 className="text-lg font-bold text-heading">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-border rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-body mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
        Confirm
      </Button>
    </div>
  </Modal>
);

export default Modal;
