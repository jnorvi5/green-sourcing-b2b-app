import csv
import re

# Define MasterFormat Divisions (Major Material Divisions)
MASTERFORMAT_DIVISIONS = {
    "03": "Concrete",
    "04": "Masonry",
    "05": "Metals",
    "06": "Wood, Plastics, and Composites",
    "07": "Thermal and Moisture Protection",
    "08": "Openings",
    "09": "Finishes"
}

# Map CSV categories to MasterFormat
CATEGORY_MAPPING = {
    "INSULATION": "07",
    "CONCRETE & CEMENT": "03",
    "ENGINEERED WOOD & LUMBER": "06",
    "STEEL & METAL": "05",
    "FLOORING": "09",
    "WINDOWS & GLAZING": "08",
    "ROOFING": "07"
}

def parse_target_suppliers(filepath):
    suppliers = {}
    current_category = None

    with open(filepath, 'r') as f:
        lines = f.readlines()

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check for category header (e.g., "# INSULATION (10)")
        match = re.match(r'^#\s*([A-Z\s&]+)\s*\((\d+)\)', line)
        if match:
            current_category = match.group(1).strip()
            if current_category not in suppliers:
                suppliers[current_category] = []
            continue

        # Check for URL
        if line.startswith("http"):
            if current_category:
                suppliers[current_category].append(line)

    return suppliers

def analyze_gaps(suppliers):
    covered_divisions = set()
    division_counts = {code: 0 for code in MASTERFORMAT_DIVISIONS}

    for category, links in suppliers.items():
        if category in CATEGORY_MAPPING:
            div_code = CATEGORY_MAPPING[category]
            covered_divisions.add(div_code)
            division_counts[div_code] += len(links)
        else:
            print(f"Warning: Category '{category}' not mapped to a division.")

    gaps = []
    for code, name in MASTERFORMAT_DIVISIONS.items():
        status = "Covered" if code in covered_divisions else "Missing"
        # Special check for Division 09 which has multiple sub-categories
        notes = ""
        if code == "09" and status == "Covered":
            # Check if only Flooring is covered
            has_paint = any("PAINT" in cat for cat in suppliers)
            has_ceiling = any("CEILING" in cat for cat in suppliers)
            if not has_paint and not has_ceiling:
                notes = "Partial (Flooring only) - Missing Paints, Ceilings"
                status = "Partial"

        gaps.append({
            "Division": code,
            "Division Name": name,
            "Status": status,
            "Supplier Count": division_counts[code],
            "Notes": notes
        })

    return gaps

def write_csv(gaps, output_file):
    with open(output_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["Division", "Division Name", "Status", "Supplier Count", "Notes", "Proposed Suppliers"])
        writer.writeheader()
        for gap in gaps:
            writer.writerow(gap)

if __name__ == "__main__":
    suppliers = parse_target_suppliers("scripts/target-suppliers.csv")
    gaps = analyze_gaps(suppliers)
    write_csv(gaps, "gap_analysis_prelim.csv")
    print("Gap analysis preliminary report created: gap_analysis_prelim.csv")
