import React from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: 'error' | 'warning' | 'info';
}

export default function ErrorMessage({
  title = 'Bir Hata Oluştu',
  message,
  action,
  icon = 'error',
}: ErrorMessageProps) {
  const getIconConfig = () => {
    switch (icon) {
      case 'warning':
        return {
          bg: 'from-yellow-50 to-orange-50',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          borderColor: 'border-yellow-200',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700',
          emoji: '⚠️',
        };
      case 'info':
        return {
          bg: 'from-blue-50 to-cyan-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700',
          emoji: 'ℹ️',
        };
      default: // error
        return {
          bg: 'from-red-50 to-pink-50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700',
          emoji: '❌',
        };
    }
  };

  const config = getIconConfig();

  return (
    <div
      className={`bg-gradient-to-r ${config.bg} border-2 ${config.borderColor} rounded-2xl p-6 shadow-lg`}
    >
      <div className="flex items-start gap-4">
        {/* İkon */}
        <div
          className={`flex-shrink-0 w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center`}
        >
          <span className="text-2xl">{config.emoji}</span>
        </div>

        {/* İçerik */}
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${config.titleColor} mb-2`}>
            {title}
          </h3>
          <p className={`${config.messageColor} leading-relaxed`}>{message}</p>

          {/* Action Button */}
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-4 px-6 py-2 bg-gradient-to-r ${
                icon === 'error'
                  ? 'from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
                  : icon === 'warning'
                  ? 'from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
                  : 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
              } text-white rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105`}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
