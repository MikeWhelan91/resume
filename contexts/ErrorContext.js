import { createContext, useContext, useState } from 'react';
import ErrorModal from '../components/ui/ErrorModal';

const ErrorContext = createContext();

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export const ErrorProvider = ({ children }) => {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error',
    buttonText: 'OK'
  });

  const showError = (message, title = 'Error', buttonText = 'OK') => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'error',
      buttonText
    });
  };

  const showSuccess = (message, title = 'Success', buttonText = 'OK') => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'success',
      buttonText
    });
  };

  const showInfo = (message, title = 'Information', buttonText = 'OK') => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'info',
      buttonText
    });
  };

  const showWarning = (message, title = 'Warning', buttonText = 'OK') => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'warning',
      buttonText
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const value = {
    showError,
    showSuccess,
    showInfo,
    showWarning,
    closeModal
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
      <ErrorModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        buttonText={modal.buttonText}
      />
    </ErrorContext.Provider>
  );
};