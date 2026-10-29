import React, { useEffect } from "react";

// Reusable confirmation popup styled to match the site theme
const ConfirmModal = ({
  open,
  title = "Are you sure?",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  // Close with the Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white shadow-xl border-t-4 border-[#c586a5] p-6 sm:p-8"
      >
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="border border-gray-300 text-gray-700 px-5 py-2 text-sm cursor-pointer hover:bg-gray-100"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="bg-[#c586a5] text-white px-5 py-2 text-sm cursor-pointer hover:opacity-90"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
