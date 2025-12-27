import React from "react";
import { Product, ScorecardData } from "@/types/schema";
import {
  ShieldCheck,
  Recycle,
  FileCheck,
  Leaf,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ScorecardProps {
  product: Product;
}

export function Scorecard({ product }: ScorecardProps) {
  const scorecard = product.sustainability_data || ({} as ScorecardData);
  const metrics = [
    {
      label: "GWP (Embodied Carbon)",
      value: product.carbon_footprint_a1a3
        ? `${product.carbon_footprint_a1a3} kg CO2e`
        : "N/A",
      status: scorecard.data_source_gwp || "missing",
      subtext: "A1-A3 Phase",
    },
    {
      label: "EPD Status",
      value: product.epd_id ? "Verified Type III" : "Self-Declared",
      status: product.epd_id ? "epd" : "manufacturer",
      subtext: "LEED v5 / Buy Clean Compliant",
    },
    {
      label: "Recycled Content",
      value: product.recycled_content_pct
        ? `${product.recycled_content_pct}%`
        : "N/A",
      status: "manufacturer", // Usually manufacturer declared unless specific EPD data parsing confirms it
      subtext: "Contributes to MR Credit 2",
    },
    {
      label: "Circularity",
      value: scorecard.circularity_recyclable_pct
        ? `${scorecard.circularity_recyclable_pct}% Recyclable`
        : "Unknown",
      status: scorecard.data_source_circularity || "missing",
      subtext: scorecard.circularity_recovery_plan
        ? "♻️ Recovery Plan Included"
        : "No Recovery Plan",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "epd":
      case "verified":
        return "bg-green-100 text-green-800 border-green-200";
      case "manufacturer":
      case "self-declared":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "missing":
      case "unknown":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "epd":
      case "verified":
        return <ShieldCheck className="w-4 h-4 ml-1" />;
      case "manufacturer":
      case "self-declared":
        return <AlertTriangle className="w-4 h-4 ml-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 font-sans">
      {/* 🏗️ Product Identity */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {product.product_name}
            </h2>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              Manufacturer:{" "}
              <span className="font-semibold">
                {product.suppliers?.company_name || "Unknown"}
              </span>
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
              Data Veracity: ⭐⭐⭐⭐⭐
            </div>
            <p className="text-xs text-gray-400 mt-1">
              5/5 = 3rd Party Verified EPD
            </p>
          </div>
        </div>
      </div>

      {/* 📊 The Core Metrics */}
      <div className="p-6">
        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">
          📊 Core Metrics (The "Must-Haves")
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${getStatusColor(
                metric.status
              )} flex justify-between items-center`}
            >
              <div>
                <p className="text-xs font-semibold opacity-70 uppercase">
                  {metric.label}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold">{metric.value}</span>
                  {getStatusIcon(metric.status)}
                </div>
                {metric.subtext && (
                  <p className="text-xs mt-1 opacity-80">{metric.subtext}</p>
                )}
              </div>
              <div className="h-8 w-8 rounded-full bg-white/50 flex items-center justify-center">
                {/* Status Indicator Dot */}
                <div
                  className={`h-3 w-3 rounded-full ${
                    metric.status === "epd"
                      ? "bg-green-500"
                      : metric.status === "manufacturer"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🛡️ Risk & Verification */}
      <div className="p-6 border-t border-gray-100 bg-slate-50">
        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">
          🛡️ Risk & Verification (The "Safety Net")
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Recycle className="w-5 h-5 text-green-600 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Chain of Custody
              </p>
              <p className="text-sm text-gray-600">
                {scorecard.chain_of_custody || "Not Certified"}
              </p>
              {scorecard.chain_of_custody && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                  Identity Preserved
                </span>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Health Transparency
              </p>
              <p className="text-sm text-gray-600">
                {scorecard.health_transparency_type || "None Available"}
              </p>
              {scorecard.hpd_url && (
                <a
                  href={scorecard.hpd_url}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View HPD
                </a>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            {scorecard.red_list_free ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400 mt-1" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">Red List Free</p>
              <p className="text-sm text-gray-600">
                {scorecard.red_list_free
                  ? "Yes (No Toxic Additives)"
                  : "Unknown / No"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🏆 LEED v5 Contribution */}
      <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-emerald-100">
        <div className="flex items-center gap-3 mb-4">
          <Leaf className="w-6 h-6 text-emerald-600" />
          <h3 className="text-lg font-bold text-emerald-900">
            LEED v5 Contribution (The "Win")
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg border border-emerald-100">
            <span className="text-sm font-medium text-emerald-900">
              [Low Carbon Procurement]
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-emerald-700">
                {scorecard.leed_contribution?.low_carbon_procurement
                  ? "2 Points"
                  : "0 Points"}
              </span>
              {scorecard.leed_contribution?.low_carbon_procurement && (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              )}
            </div>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg border border-emerald-100">
            <span className="text-sm font-medium text-emerald-900">
              [Material Transparency]
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-emerald-700">
                {scorecard.leed_contribution?.material_transparency
                  ? "1 Point"
                  : "0 Points"}
              </span>
              {scorecard.leed_contribution?.material_transparency && (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              )}
            </div>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg border border-emerald-100">
            <span className="text-sm font-medium text-emerald-900">
              [Regional Sourcing]
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-emerald-700">
                {scorecard.leed_contribution?.sourcing_raw_materials
                  ? "1 Point"
                  : "Calculated by ZIP"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
