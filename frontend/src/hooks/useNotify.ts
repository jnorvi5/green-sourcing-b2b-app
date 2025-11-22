import { toast } from "sonner";

export const useNotify = () => {
  const notifySuccess = (message: string, description?: string) => {
    toast.success(message, {
      description,
      className: "border-l-4 border-green-500 bg-green-50 text-green-900",
    });
  };

  const notifyError = (message: string, description?: string) => {
    toast.error(message, {
      description,
      className: "border-l-4 border-red-500 bg-red-50 text-red-900",
    });
  };

  const notifyInfo = (message: string, description?: string) => {
    toast.info(message, {
      description,
      className: "border-l-4 border-blue-500 bg-blue-50 text-blue-900",
    });
  };

  return { notifySuccess, notifyError, notifyInfo };
};
