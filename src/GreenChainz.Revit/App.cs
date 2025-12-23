using System;
using Autodesk.Revit.UI;
using GreenChainz.Revit.Services;
using GreenChainz.Revit.Commands;

namespace GreenChainz.Revit
{
    public class App : IExternalApplication
    {
        public static readonly Guid MaterialBrowserPaneId = new Guid("98327B66-419F-4916-8D9E-C89C19D8329A");

        public Result OnStartup(UIControlledApplication application)
        {
            try
            {
                // 1. Init Telemetry
                TelemetryService.Initialize();
                TelemetryService.LogInfo("GreenChainz Plugin Starting...");

                // 2. Create Ribbon Panel
                string tabName = "GreenChainz";
                application.CreateRibbonTab(tabName);
                RibbonPanel panel = application.CreateRibbonPanel(tabName, "Sustainability");

                // 3. Register Commands
                // Note: Ensure your Assembly path logic is robust
                string assemblyPath = System.Reflection.Assembly.GetExecutingAssembly().Location;

                // Button: Material Browser
                PushButtonData btnData = new PushButtonData(
                    "cmdGreenChainzBrowser",
                    "Material\nBrowser",
                    assemblyPath,
                    "GreenChainz.Revit.Commands.MaterialBrowserCmd");
                panel.AddItem(btnData);

                // Button: Carbon Audit
                PushButtonData auditBtnData = new PushButtonData(
                    "cmdGreenChainzAudit",
                    "Project\nAudit",
                    assemblyPath,
                    "GreenChainz.Revit.Commands.CarbonAuditCommand");
                panel.AddItem(auditBtnData);

                // 4. Register Dockable Pane (The UI)
                // Note: You need a Page/WPF UserControl 'MaterialBrowserPanel' created in UI folder
                // application.RegisterDockablePane(MaterialBrowserPaneId, "Green Materials", new UI.MaterialBrowserPanel());

                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                // If we crash on startup, log it and fail gracefully
                TelemetryService.LogError(ex, "OnStartup");
                return Result.Failed;
            }
        }

        public Result OnShutdown(UIControlledApplication application)
        {
            TelemetryService.LogInfo("GreenChainz Plugin Shutting Down.");
            return Result.Succeeded;
        }
    }
}
