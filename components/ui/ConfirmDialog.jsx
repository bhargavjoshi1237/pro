'use client';

/**
 * Unified Confirm Dialog Component
 * Matches the reference design with dark overlay, centered modal, and styled buttons
 */
export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger' // 'danger' | 'warning' | 'info'
}) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          button: 'bg-red-600 hover:bg-red-700 text-white',
          text: 'text-gray-600 dark:text-gray-400'
        };
      case 'warning':
        return {
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          text: 'text-gray-600 dark:text-gray-400'
        };
      case 'info':
        return {
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          text: 'text-gray-600 dark:text-gray-400'
        };
      default:
        return {
          button: 'bg-red-600 hover:bg-red-700 text-white',
          text: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#212121] rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">
          {title}
        </h3>
        <p className={`text-sm mb-6 ${styles.text}`}>
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
