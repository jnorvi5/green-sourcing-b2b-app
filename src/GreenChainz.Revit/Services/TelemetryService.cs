using System;
using System.IO;

namespace GreenChainz.Revit.Services
{
    public static class TelemetryService
    {
        private static readonly string LogPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "GreenChainz",
            "logs.txt");

        public static void Initialize()
        {
            var dir = Path.GetDirectoryName(LogPath);
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
        }

        public static void LogError(Exception ex, string context)
        {
            try
            {
                string message = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [ERROR] [{context}] {ex.Message}\n{ex.StackTrace}\n-----------------\n";
                File.AppendAllText(LogPath, message);
            }
            catch
            {
                // Fail silently - never crash the app because logging failed
            }
        }

        public static void LogInfo(string message)
        {
            try
            {
                File.AppendAllText(LogPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [INFO] {message}\n");
            }
            catch { }
        }
    }
}
