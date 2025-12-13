import { FaLeaf, FaCheckCircle, FaInfoCircle, FaClock } from 'react-icons/fa';

interface MaterialPassportProps {
  carbonFootprint: number | null; // kg CO2e
  certifications: string[] | null;
  supplierVerified: boolean;
  dataSource: string | null;
  lastUpdated: string;
}

export default function MaterialPassportCard({
  carbonFootprint,
  certifications,
  supplierVerified,
  dataSource,
  lastUpdated
}: MaterialPassportProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <FaLeaf className="text-emerald-400" />
        Material Passport
      </h3>

      <div className="space-y-4">
        {/* Embodied Carbon */}
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-400">Embodied Carbon</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400">
              {carbonFootprint !== null ? `${carbonFootprint} kg CO2e` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">per declared unit</div>
          </div>
        </div>

        {/* Certifications */}
        <div className="border-b border-white/5 pb-3">
          <span className="text-gray-400 block mb-2">Certifications</span>
          <div className="flex flex-wrap gap-2">
            {certifications && certifications.length > 0 ? (
              certifications.map((cert, idx) => (
                <span key={idx} className="px-2 py-1 bg-white/10 rounded text-sm text-gray-300">
                  {cert}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">None listed</span>
            )}
          </div>
        </div>

        {/* Verification Status */}
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-400">Supplier Verification</span>
          <div className="flex items-center gap-2">
            {supplierVerified ? (
              <>
                <FaCheckCircle className="text-blue-400" />
                <span className="text-blue-400 font-medium">Verified</span>
              </>
            ) : (
              <span className="text-gray-500">Unverified</span>
            )}
          </div>
        </div>

        {/* Data Source & Timestamp */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1 text-gray-500">
            <FaInfoCircle />
            <span>Source: {dataSource || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <FaClock />
            <span>Updated: {new Date(lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
