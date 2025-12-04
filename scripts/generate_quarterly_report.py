#!/usr/bin/env python3
"""
Quarterly Report Generator for Data Licensing

Generates PDF and CSV reports from aggregated analytics data.
Run on Jan 1, Apr 1, Jul 1, Oct 1 or manually for specific quarters.

Usage:
    python generate_quarterly_report.py [--quarter Q] [--year YYYY] [--tier TIER] [--output-dir DIR]

Example:
    python generate_quarterly_report.py --quarter 4 --year 2024 --tier Basic --output-dir ./reports
"""

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timedelta
from typing import Any

# For PDF generation - install with: pip install reportlab
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
    from reportlab.graphics.shapes import Drawing
    from reportlab.graphics.charts.barcharts import VerticalBarChart
    from reportlab.graphics.charts.piecharts import Pie
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False
    print("Warning: reportlab not installed. PDF generation disabled.")
    print("Install with: pip install reportlab")

# For Supabase connection
try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    print("Warning: supabase not installed. Using mock data.")
    print("Install with: pip install supabase")


class QuarterlyReportGenerator:
    """Generates quarterly analytics reports for data licensing customers."""

    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        self.supabase_url = supabase_url or os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
        self.supabase_key = supabase_key or os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
        
        if HAS_SUPABASE and self.supabase_url and self.supabase_key:
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        else:
            self.supabase = None
            print("Using mock data - Supabase not configured")

    def get_quarter_dates(self, quarter: int, year: int) -> tuple[datetime, datetime]:
        """Get start and end dates for a quarter."""
        quarter_start_month = (quarter - 1) * 3 + 1
        start_date = datetime(year, quarter_start_month, 1)
        
        # End of quarter
        if quarter == 4:
            end_date = datetime(year, 12, 31)
        else:
            end_date = datetime(year, quarter_start_month + 3, 1) - timedelta(days=1)
        
        return start_date, end_date

    def fetch_report_data(self, quarter: int, year: int, tier: str) -> dict[str, Any]:
        """Fetch report data from Supabase."""
        start_date, end_date = self.get_quarter_dates(quarter, year)
        
        if not self.supabase:
            return self._get_mock_data(quarter, year, tier)
        
        data = {
            'metadata': {
                'quarter': quarter,
                'year': year,
                'tier': tier,
                'generated_at': datetime.now().isoformat(),
                'date_range': {
                    'start': start_date.strftime('%Y-%m-%d'),
                    'end': end_date.strftime('%Y-%m-%d'),
                }
            }
        }
        
        # Top keywords
        keywords_response = self.supabase.table('search_keywords_aggregated')\
            .select('keyword, search_count, material_type_category, trend_direction')\
            .order('search_count', desc=True)\
            .limit(100)\
            .execute()
        data['top_keywords'] = keywords_response.data if keywords_response.data else []
        
        # Certification demand
        certs_response = self.supabase.table('certification_preferences')\
            .select('certification_name, filter_count, rfq_conversion_rate, average_order_value')\
            .order('filter_count', desc=True)\
            .execute()
        data['certification_demand'] = certs_response.data if certs_response.data else []
        
        # Geographic gaps
        geo_response = self.supabase.table('geographic_demand')\
            .select('region, material_type_category, demand_supply_gap, search_volume, rfq_volume, supplier_count')\
            .gte('demand_supply_gap', 1.5)\
            .order('demand_supply_gap', desc=True)\
            .execute()
        data['geographic_gaps'] = geo_response.data if geo_response.data else []
        
        # Premium/Enterprise data
        if tier in ['Professional', 'Enterprise']:
            # Certification performance
            perf_response = self.supabase.table('certification_rfq_performance')\
                .select('certification_name, rfq_count, win_rate, premium_percentage, average_time_to_close')\
                .gte('time_period', start_date.strftime('%Y-%m-%d'))\
                .lte('time_period', end_date.strftime('%Y-%m-%d'))\
                .execute()
            data['certification_performance'] = perf_response.data if perf_response.data else []
            
            # RFQ analytics
            rfq_response = self.supabase.table('rfq_analytics')\
                .select('material_type_category, rfq_count, conversion_rate, average_time_to_close, average_order_value')\
                .gte('time_period', start_date.strftime('%Y-%m-%d'))\
                .lte('time_period', end_date.strftime('%Y-%m-%d'))\
                .execute()
            data['rfq_analytics'] = rfq_response.data if rfq_response.data else []
        
        return data

    def _get_mock_data(self, quarter: int, year: int, tier: str) -> dict[str, Any]:
        """Return mock data for testing."""
        start_date, end_date = self.get_quarter_dates(quarter, year)
        
        return {
            'metadata': {
                'quarter': quarter,
                'year': year,
                'tier': tier,
                'generated_at': datetime.now().isoformat(),
                'date_range': {
                    'start': start_date.strftime('%Y-%m-%d'),
                    'end': end_date.strftime('%Y-%m-%d'),
                }
            },
            'top_keywords': [
                {'keyword': 'recycled insulation', 'search_count': 1250, 'material_type_category': 'insulation', 'trend_direction': 'rising'},
                {'keyword': 'FSC certified wood', 'search_count': 980, 'material_type_category': 'structural', 'trend_direction': 'stable'},
                {'keyword': 'low carbon concrete', 'search_count': 875, 'material_type_category': 'structural', 'trend_direction': 'rising'},
                {'keyword': 'bamboo flooring', 'search_count': 720, 'material_type_category': 'flooring', 'trend_direction': 'rising'},
                {'keyword': 'LEED certified', 'search_count': 650, 'material_type_category': None, 'trend_direction': 'stable'},
            ],
            'certification_demand': [
                {'certification_name': 'FSC', 'filter_count': 2450, 'rfq_conversion_rate': 0.12, 'average_order_value': 15000},
                {'certification_name': 'LEED', 'filter_count': 2100, 'rfq_conversion_rate': 0.15, 'average_order_value': 25000},
                {'certification_name': 'Cradle to Cradle', 'filter_count': 1800, 'rfq_conversion_rate': 0.18, 'average_order_value': 30000},
                {'certification_name': 'EPD', 'filter_count': 1500, 'rfq_conversion_rate': 0.10, 'average_order_value': 12000},
                {'certification_name': 'GreenGuard', 'filter_count': 1200, 'rfq_conversion_rate': 0.08, 'average_order_value': 8000},
            ],
            'geographic_gaps': [
                {'region': 'Texas', 'material_type_category': 'insulation', 'demand_supply_gap': 3.2, 'search_volume': 5200, 'rfq_volume': 320, 'supplier_count': 8},
                {'region': 'Florida', 'material_type_category': 'roofing', 'demand_supply_gap': 2.8, 'search_volume': 4800, 'rfq_volume': 280, 'supplier_count': 12},
                {'region': 'Colorado', 'material_type_category': 'windows', 'demand_supply_gap': 2.5, 'search_volume': 3200, 'rfq_volume': 180, 'supplier_count': 6},
            ],
            'certification_performance': [
                {'certification_name': 'Cradle to Cradle', 'rfq_count': 450, 'win_rate': 0.65, 'premium_percentage': 18.5, 'average_time_to_close': 72},
                {'certification_name': 'FSC', 'rfq_count': 380, 'win_rate': 0.58, 'premium_percentage': 12.0, 'average_time_to_close': 48},
                {'certification_name': 'LEED', 'rfq_count': 320, 'win_rate': 0.52, 'premium_percentage': 15.0, 'average_time_to_close': 96},
            ] if tier in ['Professional', 'Enterprise'] else [],
            'rfq_analytics': [
                {'material_type_category': 'insulation', 'rfq_count': 850, 'conversion_rate': 0.22, 'average_time_to_close': 56, 'average_order_value': 18500},
                {'material_type_category': 'flooring', 'rfq_count': 720, 'conversion_rate': 0.18, 'average_time_to_close': 72, 'average_order_value': 22000},
                {'material_type_category': 'structural', 'rfq_count': 680, 'conversion_rate': 0.25, 'average_time_to_close': 120, 'average_order_value': 85000},
            ] if tier in ['Professional', 'Enterprise'] else [],
        }

    def generate_csv(self, data: dict[str, Any], output_dir: str, filename_prefix: str) -> list[str]:
        """Generate CSV files from report data."""
        os.makedirs(output_dir, exist_ok=True)
        generated_files = []
        
        for key, value in data.items():
            if key == 'metadata' or not isinstance(value, list) or len(value) == 0:
                continue
            
            filepath = os.path.join(output_dir, f"{filename_prefix}_{key}.csv")
            
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                if value:
                    writer = csv.DictWriter(f, fieldnames=value[0].keys())
                    writer.writeheader()
                    writer.writerows(value)
            
            generated_files.append(filepath)
            print(f"Generated: {filepath}")
        
        return generated_files

    def generate_pdf(self, data: dict[str, Any], output_dir: str, filename: str) -> str:
        """Generate PDF report from data."""
        if not HAS_REPORTLAB:
            print("Skipping PDF generation - reportlab not installed")
            return ""
        
        os.makedirs(output_dir, exist_ok=True)
        filepath = os.path.join(output_dir, filename)
        
        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#166534')  # Green
        )
        
        metadata = data.get('metadata', {})
        quarter = metadata.get('quarter', 'Q?')
        year = metadata.get('year', datetime.now().year)
        tier = metadata.get('tier', 'Basic')
        
        story.append(Paragraph(f"GreenChainz Market Intelligence Report", title_style))
        story.append(Paragraph(f"Q{quarter} {year} - {tier} Edition", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        # Date range
        date_range = metadata.get('date_range', {})
        story.append(Paragraph(
            f"Report Period: {date_range.get('start', 'N/A')} to {date_range.get('end', 'N/A')}",
            styles['Normal']
        ))
        story.append(Paragraph(
            f"Generated: {metadata.get('generated_at', 'N/A')[:10]}",
            styles['Normal']
        ))
        story.append(Spacer(1, 24))
        
        # Executive Summary
        story.append(Paragraph("Executive Summary", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        top_keywords = data.get('top_keywords', [])
        cert_demand = data.get('certification_demand', [])
        geo_gaps = data.get('geographic_gaps', [])
        
        summary_text = f"""
        This quarterly report provides comprehensive market intelligence on sustainable building 
        materials demand across the GreenChainz platform. Key findings:
        
        • <b>{len(top_keywords)}</b> unique material keywords tracked
        • <b>{len(cert_demand)}</b> certifications analyzed for demand patterns
        • <b>{len(geo_gaps)}</b> geographic regions identified with supply-demand gaps
        """
        story.append(Paragraph(summary_text, styles['Normal']))
        story.append(Spacer(1, 24))
        
        # Top Keywords Section
        story.append(Paragraph("Top Searched Materials", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        if top_keywords:
            keyword_data = [['Rank', 'Keyword', 'Search Volume', 'Category', 'Trend']]
            for i, kw in enumerate(top_keywords[:20], 1):
                keyword_data.append([
                    str(i),
                    kw.get('keyword', 'N/A'),
                    str(kw.get('search_count', 0)),
                    kw.get('material_type_category', 'General') or 'General',
                    kw.get('trend_direction', 'stable').capitalize()
                ])
            
            keyword_table = Table(keyword_data, colWidths=[0.5*inch, 2*inch, 1*inch, 1.2*inch, 0.8*inch])
            keyword_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#166534')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0fdf4')),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#86efac')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
            ]))
            story.append(keyword_table)
        
        story.append(Spacer(1, 24))
        
        # Certification Demand Section
        story.append(Paragraph("Certification Demand Analysis", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        if cert_demand:
            cert_data = [['Certification', 'Search Volume', 'RFQ Conversion', 'Avg Order Value']]
            for cert in cert_demand[:10]:
                conversion = cert.get('rfq_conversion_rate', 0)
                aov = cert.get('average_order_value', 0)
                cert_data.append([
                    cert.get('certification_name', 'N/A'),
                    str(cert.get('filter_count', 0)),
                    f"{conversion * 100:.1f}%" if conversion else 'N/A',
                    f"${aov:,.0f}" if aov else 'N/A'
                ])
            
            cert_table = Table(cert_data, colWidths=[1.5*inch, 1.2*inch, 1.2*inch, 1.2*inch])
            cert_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#166534')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#86efac')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
            ]))
            story.append(cert_table)
        
        story.append(PageBreak())
        
        # Geographic Analysis Section
        story.append(Paragraph("Geographic Market Opportunities", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        story.append(Paragraph(
            "Regions with high demand and limited supplier coverage represent significant market opportunities:",
            styles['Normal']
        ))
        story.append(Spacer(1, 12))
        
        if geo_gaps:
            geo_data = [['Region', 'Material', 'Demand/Supply Gap', 'Search Volume', 'Suppliers']]
            for gap in geo_gaps[:15]:
                geo_data.append([
                    gap.get('region', 'N/A'),
                    gap.get('material_type_category', 'General') or 'General',
                    f"{gap.get('demand_supply_gap', 0):.1f}x",
                    str(gap.get('search_volume', 0)),
                    str(gap.get('supplier_count', 0))
                ])
            
            geo_table = Table(geo_data, colWidths=[1.2*inch, 1.2*inch, 1.2*inch, 1*inch, 0.8*inch])
            geo_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#166534')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#86efac')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
            ]))
            story.append(geo_table)
        
        # Premium/Enterprise Sections
        if tier in ['Professional', 'Enterprise']:
            story.append(Spacer(1, 24))
            story.append(Paragraph("Certification Performance Analysis", styles['Heading2']))
            story.append(Spacer(1, 12))
            
            cert_perf = data.get('certification_performance', [])
            if cert_perf:
                perf_data = [['Certification', 'RFQs', 'Win Rate', 'Price Premium', 'Avg Close Time']]
                for perf in cert_perf:
                    perf_data.append([
                        perf.get('certification_name', 'N/A'),
                        str(perf.get('rfq_count', 0)),
                        f"{perf.get('win_rate', 0) * 100:.1f}%",
                        f"+{perf.get('premium_percentage', 0):.1f}%",
                        f"{perf.get('average_time_to_close', 0):.0f}h"
                    ])
                
                perf_table = Table(perf_data, colWidths=[1.5*inch, 0.8*inch, 0.9*inch, 1*inch, 1*inch])
                perf_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#166534')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#86efac')),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
                ]))
                story.append(perf_table)
            
            story.append(Spacer(1, 24))
            story.append(Paragraph("RFQ Market Analysis", styles['Heading2']))
            story.append(Spacer(1, 12))
            
            rfq_analytics = data.get('rfq_analytics', [])
            if rfq_analytics:
                rfq_data = [['Material Category', 'RFQ Volume', 'Conversion', 'Avg Close Time', 'Avg Order']]
                for rfq in rfq_analytics:
                    rfq_data.append([
                        rfq.get('material_type_category', 'N/A'),
                        str(rfq.get('rfq_count', 0)),
                        f"{rfq.get('conversion_rate', 0) * 100:.1f}%",
                        f"{rfq.get('average_time_to_close', 0):.0f}h",
                        f"${rfq.get('average_order_value', 0):,.0f}"
                    ])
                
                rfq_table = Table(rfq_data, colWidths=[1.3*inch, 0.9*inch, 0.9*inch, 1.1*inch, 1*inch])
                rfq_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#166534')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#86efac')),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
                ]))
                story.append(rfq_table)
        
        # Footer
        story.append(Spacer(1, 48))
        story.append(Paragraph("---", styles['Normal']))
        story.append(Paragraph(
            "This report is confidential and intended for licensed data customers only. "
            "All data is aggregated and anonymized.",
            styles['Normal']
        ))
        story.append(Paragraph(
            "© 2024-2025 GreenChainz, Inc. All rights reserved.",
            styles['Normal']
        ))
        
        doc.build(story)
        print(f"Generated: {filepath}")
        return filepath

    def generate_json(self, data: dict[str, Any], output_dir: str, filename: str) -> str:
        """Generate JSON export of report data."""
        os.makedirs(output_dir, exist_ok=True)
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
        
        print(f"Generated: {filepath}")
        return filepath


def main():
    parser = argparse.ArgumentParser(description='Generate quarterly analytics report')
    parser.add_argument('--quarter', type=int, choices=[1, 2, 3, 4],
                        help='Quarter number (1-4). Defaults to previous quarter.')
    parser.add_argument('--year', type=int, 
                        help='Year. Defaults to current year (or previous year if Q4).')
    parser.add_argument('--tier', type=str, choices=['Basic', 'Professional', 'Enterprise'],
                        default='Basic', help='Report tier')
    parser.add_argument('--output-dir', type=str, default='./reports',
                        help='Output directory for generated files')
    parser.add_argument('--format', type=str, choices=['all', 'pdf', 'csv', 'json'],
                        default='all', help='Output format')
    
    args = parser.parse_args()
    
    # Determine quarter and year
    now = datetime.now()
    current_quarter = (now.month - 1) // 3 + 1
    
    if args.quarter is None:
        # Default to previous quarter
        if current_quarter == 1:
            quarter = 4
            year = now.year - 1
        else:
            quarter = current_quarter - 1
            year = now.year
    else:
        quarter = args.quarter
        year = args.year if args.year else now.year
    
    print(f"\n{'='*60}")
    print(f"GreenChainz Quarterly Report Generator")
    print(f"{'='*60}")
    print(f"Quarter: Q{quarter} {year}")
    print(f"Tier: {args.tier}")
    print(f"Output: {args.output_dir}")
    print(f"{'='*60}\n")
    
    generator = QuarterlyReportGenerator()
    
    # Fetch data
    print("Fetching report data...")
    data = generator.fetch_report_data(quarter, year, args.tier)
    
    # Generate outputs
    filename_prefix = f"greenchainz_q{quarter}_{year}_{args.tier.lower()}"
    
    generated_files = []
    
    if args.format in ['all', 'csv']:
        print("\nGenerating CSV files...")
        csv_files = generator.generate_csv(data, args.output_dir, filename_prefix)
        generated_files.extend(csv_files)
    
    if args.format in ['all', 'pdf']:
        print("\nGenerating PDF report...")
        pdf_file = generator.generate_pdf(data, args.output_dir, f"{filename_prefix}_report.pdf")
        if pdf_file:
            generated_files.append(pdf_file)
    
    if args.format in ['all', 'json']:
        print("\nGenerating JSON export...")
        json_file = generator.generate_json(data, args.output_dir, f"{filename_prefix}_data.json")
        generated_files.append(json_file)
    
    print(f"\n{'='*60}")
    print(f"Generated {len(generated_files)} files:")
    for f in generated_files:
        print(f"  - {f}")
    print(f"{'='*60}\n")
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
