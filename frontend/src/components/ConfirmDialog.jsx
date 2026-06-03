import Modal from './Modal';
import { AlertTriangle, Info } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}) {
  const isDestructive = variant === 'destructive';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <div className="text-center py-2">
        {/* Icon */}
        <div
          className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${
            isDestructive ? 'bg-red-100' : 'bg-amber-100'
          }`}
        >
          {isDestructive ? (
            <AlertTriangle className="w-7 h-7 text-red-600" />
          ) : (
            <Info className="w-7 h-7 text-amber-600" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

        {/* Message */}
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{message}</p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary min-w-[100px]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`min-w-[100px] ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
