import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'confirm' | 'info';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export function Modal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText = 'Cancel'
}: ModalProps) {
    if (!isOpen) return null;

    const isConfirm = type === 'confirm' || type === 'warning';
    const isDangerous = type === 'error' || type === 'warning' || type === 'confirm';
    const colorClasses = {
        error: 'text-red-500',
        warning: 'text-yellow-500',
        confirm: 'text-blue-500',
        info: 'text-primary'
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative glass-card rounded-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="space-y-4">
                    <h2 className={`text-xl font-bold ${colorClasses[type]}`}>
                        {title}
                    </h2>
                    <p className="text-muted-foreground">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        {isConfirm ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={handleCancel}
                                >
                                    {cancelText}
                                </Button>
                                <Button 
                                    className={`flex-1 ${isDangerous ? 'bg-red-500 hover:bg-red-600' : ''}`}
                                    onClick={handleConfirm}
                                >
                                    {confirmText}
                                </Button>
                            </>
                        ) : (
                            <Button 
                                className="w-full"
                                onClick={onClose}
                            >
                                {confirmText}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
