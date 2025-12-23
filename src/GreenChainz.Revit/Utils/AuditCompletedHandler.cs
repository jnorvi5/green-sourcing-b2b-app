using Autodesk.Revit.UI;
// using GreenChainz.Revit.Views; // Your Results Window namespace would go here

namespace GreenChainz.Revit.Utils
{
    public class AuditCompletedHandler : IExternalEventHandler
    {
        // Singleton pattern for easy access
        public static AuditCompletedHandler Instance { get; private set; } = new AuditCompletedHandler();
        public ExternalEvent _externalEvent;
        
        public AuditCompletedHandler()
        {
           _externalEvent = ExternalEvent.Create(this);
        }

        public void Raise()
        {
            _externalEvent.Raise();
        }

        public void Execute(UIApplication app)
        {
            // This runs on the Main Revit Thread! Safe to open windows here.
            // var window = new AuditResultsWindow();
            // window.Show();
            TaskDialog.Show("Carbon Audit", "Audit Completed Successfully!");
        }

        public string GetName()
        {
            return "GreenChainz Audit Completed Handler";
        }
    }
}
