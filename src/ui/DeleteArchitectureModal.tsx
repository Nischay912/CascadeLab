import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export interface DeleteArchitectureModalProps {
  isOpen: boolean;
  architectureName: string;
  servicesCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteArchitectureModal: React.FC<DeleteArchitectureModalProps> = ({
  isOpen,
  architectureName,
  servicesCount,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-surface-raised border border-border rounded-2xl shadow-2xl p-6 flex flex-col text-text-primary animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-arch-title"
      >
        {/* Top Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          title="Close dialog (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
          <Trash2 className="w-6 h-6" />
        </div>

        {/* Modal Title & Subtitle */}
        <h3
          id="delete-arch-title"
          className="text-lg font-bold text-center text-text-primary tracking-tight"
        >
          Delete Custom Architecture?
        </h3>
        <p className="text-xs text-text-muted text-center mt-1.5 leading-relaxed">
          Are you sure you want to permanently delete{' '}
          <span className="font-semibold text-text-primary">{architectureName}</span>
          {servicesCount > 0 && ` (${servicesCount} services)`}?
        </p>

        {/* Warning Callout Box */}
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-semibold text-rose-200">Permanent Action:</span> This architecture
            will be removed from your catalog and browser storage. CascadeLab will immediately revert
            to the baseline <strong className="text-white">ShopFast</strong> benchmark.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-xs font-semibold text-text-secondary hover:text-text-primary transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/40 flex items-center gap-1.5 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Architecture</span>
          </button>
        </div>
      </div>
    </div>
  );
};
