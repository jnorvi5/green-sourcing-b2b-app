# Quote Comparison Page UI Mockup

## Desktop View (≥768px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                                     │
│  Compare Quotes                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────── RFQ Summary ─────────────────────────────────────┐ │
│  │  Project Name        Material Category       Quantity              │ │
│  │  Green Office Bldg   insulation              5000 sqft             │ │
│  │                                                                     │ │
│  │  Details                                                            │ │
│  │  Need FSC certified insulation for LEED Gold project...           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                                           [📥 Export to CSV]            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ Supplier Name  │ Price ↑↓    │ Lead Time ↑↓ │ Sustain... │ Notes │ Actions │
│  ├────────────────┼─────────────┼──────────────┼────────────┼───────┼─────────┤
│  │ EcoMaterials   │ $15,000     │ 14 days      │ Verified   │ We... │ [Accept]│
│  │ Co.            │ [Lowest]    │              │ [Best]     │ Show  │         │
│  ├────────────────┼─────────────┼──────────────┼────────────┼───────┼─────────┤
│  │ GreenSupply    │ $16,500     │ 10 days      │ Standard   │ Fast..│ [Accept]│
│  │ Inc.           │             │              │            │ Show  │ [📄 PDF]│
│  ├────────────────┼─────────────┼──────────────┼────────────┼───────┼─────────┤
│  │ Sustainable    │ $18,200     │ 21 days      │ Free       │ No    │ [Accept]│
│  │ Materials      │             │              │            │ notes │         │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Mobile View (<768px)

```
┌──────────────────────────────┐
│ ← Back to Dashboard          │
│ Compare Quotes               │
├──────────────────────────────┤
│                              │
│ ┌─── RFQ Summary ──────────┐ │
│ │ Project Name             │ │
│ │ Green Office Building    │ │
│ │                          │ │
│ │ Material Category        │ │
│ │ insulation               │ │
│ │                          │ │
│ │ Quantity                 │ │
│ │ 5000 sqft                │ │
│ └──────────────────────────┘ │
│                              │
│        [📥 Export to CSV]    │
│                              │
│ ┌──────────────────────────┐ │
│ │ EcoMaterials Co.         │ │
│ ├──────────────────────────┤ │
│ │ Price:                   │ │
│ │ $15,000 [Lowest]         │ │
│ │                          │ │
│ │ Lead Time: 14 days       │ │
│ │                          │ │
│ │ Sustainability:          │ │
│ │ Verified [Best]          │ │
│ │                          │ │
│ │ Notes:                   │ │
│ │ We can meet your...      │ │
│ │ [Show more]              │ │
│ │                          │ │
│ │ [Accept Quote]           │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ GreenSupply Inc.         │ │
│ ├──────────────────────────┤ │
│ │ Price: $16,500           │ │
│ │ Lead Time: 10 days       │ │
│ │ Sustainability: Standard │ │
│ │                          │ │
│ │ Notes:                   │ │
│ │ Fast delivery, high...   │ │
│ │ [Show more]              │ │
│ │                          │ │
│ │ [📄 Download PDF]        │ │
│ │ [Accept Quote]           │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

## Empty State

```
┌──────────────────────────────────────────┐
│  ← Back to Dashboard                     │
│  Compare Quotes                          │
├──────────────────────────────────────────┤
│                                          │
│  ┌─── RFQ Summary ────────────────────┐  │
│  │  Project Name   Material   Quantity│  │
│  │  ...                                │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │             📭                     │  │
│  │                                    │  │
│  │        No quotes yet               │  │
│  │                                    │  │
│  │   Suppliers haven't responded      │  │
│  │   to this RFQ yet.                 │  │
│  │   Check back later!                │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Color Scheme (Dark Theme)

### Background Colors
- **Main Background**: `bg-gradient-to-br from-gray-950 via-gray-900 to-black`
- **Cards/Panels**: `bg-white/5 backdrop-blur-sm border border-white/10`
- **Table Header**: `bg-white/5`
- **Hover State**: `hover:bg-white/5`

### Text Colors
- **Primary Text**: `text-white`
- **Secondary Text**: `text-gray-400`
- **Link Text**: `text-teal-400 hover:text-teal-300`
- **Price**: `font-semibold text-white`

### Badge Colors
- **Lowest Price Badge**: `bg-green-500/10 text-green-400`
- **Best Sustainability Badge**: `bg-teal-500/10 text-teal-400`
- **Accepted Status**: `bg-green-500/10 text-green-400`
- **Rejected Status**: `bg-red-500/10 text-red-400`

### Button Colors
- **Primary Action (Accept)**: `bg-teal-500 hover:bg-teal-400 text-black`
- **Secondary Action (PDF)**: `bg-gray-500/10 hover:bg-gray-500/20 text-gray-300`
- **Export Button**: `bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30`

### Interaction States
- **Disabled Button**: `opacity-50 cursor-not-allowed`
- **Loading Spinner**: `border-teal-500 border-t-transparent animate-spin`
- **Sortable Header**: `hover:text-teal-400`

## Component Hierarchy

```
QuoteComparisonPage
├─ Loading State (conditional)
│  └─ Spinner + Message
├─ Error State (conditional)
│  └─ Error Message + Back Link
└─ Main Content
   ├─ Header
   │  ├─ Back Link
   │  └─ Page Title
   ├─ RFQ Summary Card
   │  ├─ Project Details Grid
   │  └─ Message Text
   ├─ Export Button (if quotes exist)
   └─ Quotes Display
      ├─ Empty State (if no quotes)
      ├─ Desktop Table View (≥768px)
      │  ├─ Table Header (sortable)
      │  └─ Quote Rows
      │     ├─ Supplier Link
      │     ├─ Price + Badge
      │     ├─ Lead Time
      │     ├─ Sustainability + Badge
      │     ├─ Notes (expandable)
      │     └─ Actions (PDF, Accept)
      └─ Mobile Card View (<768px)
         └─ Quote Cards
            ├─ Supplier Name
            ├─ Details Grid
            ├─ Notes (expandable)
            └─ Action Buttons
```

## Key Interactive Elements

### Sortable Columns
- Click "Price" header: Toggles asc/desc sort
- Click "Lead Time" header: Toggles asc/desc sort
- Shows arrow indicator (↑/↓) for current sort
- Hover effect on sortable headers

### Expandable Notes
- Shows truncated text (2-3 lines)
- "Show more" button expands full text
- "Show less" button collapses text
- State tracked per quote independently

### Accept Quote Flow
1. User clicks "Accept Quote" button
2. Confirmation dialog appears
3. Button shows "Accepting..." with disabled state
4. Server action updates database
5. Email logged for supplier notification
6. Success alert shown
7. Page data refreshes
8. Button changes to "✓ Accepted" badge

### CSV Export
1. User clicks "📥 Export to CSV" button
2. CSV file generated from quote data
3. Browser downloads file as `rfq-{id}-quotes.csv`
4. No page navigation/refresh

## Responsive Breakpoints

- **Mobile**: < 768px (card layout)
- **Desktop**: ≥ 768px (table layout)

Uses Tailwind's `md:` prefix for responsive classes:
- `hidden md:block` - Show only on desktop
- `md:hidden` - Show only on mobile
- `md:grid-cols-3` - 3-column grid on desktop

## Accessibility Features

- Semantic HTML (`<table>`, `<th>`, `<td>`, `<button>`)
- Proper button types (`type="button"`)
- Disabled states for buttons
- Loading states with visual feedback
- Alt text for status badges
- Keyboard-navigable interface
- Focus states on interactive elements
