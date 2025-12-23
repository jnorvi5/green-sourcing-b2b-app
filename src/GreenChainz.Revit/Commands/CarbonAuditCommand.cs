using System;
using System.Threading.Tasks;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using GreenChainz.Revit.Services;
using GreenChainz.Revit.Utils; 

namespace GreenChainz.Revit.Commands
{
    [Transaction(TransactionMode.Manual)]
    public class CarbonAuditCommand : IExternalCommand
    {
        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            // 1. Show "Processing" Window immediately (Modeless)
            // Note: In a real app, use a proper Loading Window. For now, we use a TaskDialog as a placeholder
            // but the logic below prepares for the async switch.
            
            var doc = commandData.Application.ActiveUIDocument.Document;

            // 2. Run the Heavy Audit on a Background Thread
            Task.Run(async () => 
            {
                try 
                {
                    // Placeholder for actual service
                    // var service = new AuditService(); 
                    // var results = await service.RunFullProjectAuditAsync(doc); 

                    // Simulation of work
                    await Task.Delay(2000); 

                    // 3. Marshal back to UI Thread (Revit Requirement)
                    // Trigger the 'AuditCompletedHandler'
                    AuditCompletedHandler.Instance.Raise();
                }
                catch (Exception ex)
                {
                    TelemetryService.LogError(ex, "CarbonAuditCommand-Background");
                }
            });

            return Result.Succeeded;
        }
    }
}
