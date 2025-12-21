"use client";

import React, { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FiChevronRight, FiChevronDown, FiCheckSquare, FiSquare } from "react-icons/fi";

type CSIItem = {
  id: string;
  name: string;
  children?: CSIItem[];
};

const csiData: CSIItem[] = [
  {
    id: "03",
    name: "03 00 00 Concrete",
    children: [
      { id: "033000", name: "03 30 00 Cast-in-Place Concrete" },
      { id: "034000", name: "03 40 00 Precast Concrete" },
      { id: "035000", name: "03 50 00 Cast Decks and Underlayment" },
      { id: "037000", name: "03 70 00 Mass Concrete" },
      { id: "030500", name: "03 05 00 Common Work Results for Concrete" },
      { id: "032000", name: "03 20 00 Concrete Reinforcing" },
      { id: "039000", name: "03 90 00 Mass Concrete" },
    ],
  },
  {
    id: "06",
    name: "06 00 00 Wood, Plastics, and Composites",
    children: [
      { id: "061000", name: "06 10 00 Rough Carpentry" },
      { id: "061500", name: "06 15 00 Wood Decking" },
      { id: "061800", name: "06 18 00 Glued-Laminated Construction" },
      { id: "062000", name: "06 20 00 Finish Carpentry" },
      { id: "064000", name: "06 40 00 Architectural Woodwork" },
      { id: "066000", name: "06 60 00 Plastic Fabrications" },
    ],
  },
  {
    id: "07",
    name: "07 00 00 Thermal and Moisture Protection",
    children: [
      { id: "072100", name: "07 21 00 Thermal Insulation" },
      { id: "072200", name: "07 22 00 Roof and Deck Insulation" },
      { id: "072400", name: "07 24 00 Exterior Insulation and Finish Systems" },
      { id: "073100", name: "07 31 00 Shingles and Shakes" },
      { id: "074000", name: "07 40 00 Roofing and Siding Panels" },
      { id: "075000", name: "07 50 00 Membrane Roofing" },
      { id: "078000", name: "07 80 00 Fire and Smoke Protection" },
    ],
  },
];

interface MasterFormatFilterProps {
  className?: string;
}

export default function MasterFormatFilter({ className }: MasterFormatFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const selectedCodes = useMemo(() => {
    const csi = searchParams.get("csi");
    return csi ? csi.split(",") : [];
  }, [searchParams]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = useCallback(
    (code: string) => {
      const current = new Set(selectedCodes);
      if (current.has(code)) {
        current.delete(code);
      } else {
        current.add(code);
      }

      const newParams = new URLSearchParams(searchParams.toString());
      if (current.size > 0) {
        newParams.set("csi", Array.from(current).join(","));
      } else {
        newParams.delete("csi");
      }

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [selectedCodes, searchParams, pathname, router]
  );

  const renderItem = (item: CSIItem, level: number = 0) => {
    const isExpanded = expanded[item.id];
    const isSelected = selectedCodes.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    // Auto-expand if a child is selected and it wasn't explicitly collapsed (initial state)
    // For simplicity, we stick to manual expansion for now unless desired.

    return (
      <div key={item.id} className="select-none">
        <div
          className={cn(
            "flex items-center py-1 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-0",
            level > 0 && "pl-4",
             "text-xs font-mono"
          )}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }}
              className="mr-1 text-gray-500 hover:text-gray-800 focus:outline-none"
            >
              {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
            </button>
          ) : (
            <div className="w-[14px] mr-1" /> // Spacer
          )}

          <div
            className="flex-1 flex items-center"
            onClick={() => !hasChildren && handleSelect(item.id)}
          >
            {!hasChildren && (
                <div className="mr-2 text-gray-600">
                    {isSelected ? <FiCheckSquare size={14} /> : <FiSquare size={14} />}
                </div>
            )}
            <span className={cn(isSelected && "font-bold text-black", "truncate")}>
              {item.name}
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-gray-300 ml-2">
            {item.children!.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("w-full border border-gray-400 bg-gray-50 text-gray-800 shadow-sm", className)}>
      <div className="bg-gray-200 border-b border-gray-400 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-700">
        CSI MasterFormat Filter
      </div>
      <div className="p-1 max-h-[400px] overflow-y-auto">
        {csiData.map((item) => renderItem(item))}
      </div>
      <div className="bg-gray-100 border-t border-gray-400 px-3 py-1 text-[10px] text-gray-500 flex justify-between">
        <span>{selectedCodes.length} selected</span>
        {selectedCodes.length > 0 && (
          <button
            onClick={() => router.push(pathname, { scroll: false })}
            className="text-blue-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
