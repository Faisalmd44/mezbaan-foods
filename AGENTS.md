# Project Rules & Master Design Lock

## Master Version UI Lock
The current preview is the official visual source of truth and Master Version for MEZBAAN POS.

### Strict Negative Constraints:
- **DO NOT** redesign, restyle, simplify, or replace any existing screen or component.
- **DO NOT** change:
  - Layout
  - Colors and brand accents (`#FF6B35`, `#1E1E24`, `#6B6B75`, `#E2E4E8`, etc.)
  - Typography and text sizing
  - Spacing and container padding
  - Card designs and borders
  - Buttons and action styling
  - Lucide icons selection and positioning
  - Navigation bar (header and bottom bar)
  - Modals (Thermal Receipt, Bluetooth Printer, Staff PIN, etc.)
  - Food images and image mappings
  - Billing UI (PosScreen)
  - Checkout UI and sidebar / mobile bottom sheet
  - Receipt UI (ReceiptModal & print templates)
  - Sales UI (SalesScreen)
  - Staff UI (StaffScreen)
  - Printer UI (BluetoothPrinterModal)
  - Settings UI (SettingsScreen)

### Permitted Actions:
- Make **ONLY** functional fixes, data logic improvements, or bug fixes explicitly requested by the user.
- Maintain existing visual elements, states, styling classes, and structural hierarchies without modification.
- Never make unsolicited visual or design modifications.
