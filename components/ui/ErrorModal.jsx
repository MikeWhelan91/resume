import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export default function ErrorModal({ 
  isOpen, 
  onClose, 
  title = 'Error', 
  message = '', 
  type = 'error', // 'error', 'success', 'info', 'warning'
  buttonText = 'OK'
}) {
  if (!isOpen) return null;

  const getIconAndStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-green-500',
          iconColor: 'text-white'
        };
      case 'info':
        return {
          icon: Info,
          iconBg: 'bg-blue-500',
          iconColor: 'text-white'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-yellow-500',
          iconColor: 'text-white'
        };
      default: // error
        return {
          icon: AlertCircle,
          iconBg: 'bg-red-500',
          iconColor: 'text-white'
        };
    }
  };

  const { icon: Icon, iconBg, iconColor } = getIconAndStyles(type);

  const getButtonStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      default: // error
        return 'bg-red-600 hover:bg-red-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-md w-full bg-surface text-text rounded-2xl shadow-2xl border border-border animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-text transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="p-8">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
              <Icon className={`w-8 h-8 ${iconColor}`} />
            </div>
            <h2 className="text-2xl font-bold text-text mb-2">
              {title}
            </h2>
            <p className="text-muted whitespace-pre-line">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-full text-white py-3 px-6 rounded-lg font-semibold transition-colors ${getButtonStyles(type)}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}