import { toast } from "sonner";

export const useNotify = () => {
  const success = (message: string, description?: string) => {
    toast.success(message, {
      description,
      className: "border-l-4 border-[#21808D] bg-[#32B8C6]/10 text-[#13343B]",
      style: {
        borderLeftColor: '#21808D',
      },
    });
  };

  const error = (message: string, description?: string) => {
    toast.error(message, {
      description,
      className: "border-l-4 border-[#DC2626] bg-[#FEE2E2] text-[#7F1D1D]",
      style: {
        borderLeftColor: '#DC2626',
      },
    });
  };

  const info = (message: string, description?: string) => {
    toast.info(message, {
      description,
      className: "border-l-4 border-[#21808D] bg-[#DBEAFE] text-[#1E3A8A]",
      style: {
        borderLeftColor: '#21808D',
      },
    });
  };

  // Export with both naming conventions for backward compatibility
  return { 
    success, 
    error, 
    info,
    notifySuccess: success,
    notifyError: error,
    notifyInfo: info,
  };
};

