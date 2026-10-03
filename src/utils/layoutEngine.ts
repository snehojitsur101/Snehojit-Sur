import { LayoutDefinition, PageLayoutType } from '../types';

export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  {
    id: 'single_fit',
    name: '1 Image Full A4',
    description: 'Single large document scaled to maximize A4 page space',
    capacity: 1,
    iconName: 'Square',
    category: '1-Image',
  },
  {
    id: 'split_vertical',
    name: '2 Side-by-Side (Columns)',
    description: '2 documents arranged in vertical side-by-side columns',
    capacity: 2,
    iconName: 'Columns2',
    category: '2-Images',
  },
  {
    id: 'split_horizontal',
    name: '2 Top & Bottom (Rows)',
    description: '2 documents stacked horizontally top and bottom',
    capacity: 2,
    iconName: 'Rows2',
    category: '2-Images',
  },
  {
    id: 'id_duo',
    name: 'ID Card Duo (Front & Back)',
    description: 'Centered credit-card/ID ratio with neat center cutting mark',
    capacity: 2,
    iconName: 'CreditCard',
    category: 'Specialty',
  },
  {
    id: 'hero_top_2_bottom',
    name: '3 Images (1 Top + 2 Bottom)',
    description: '1 wide master document on top and 2 sub-documents below',
    capacity: 3,
    iconName: 'LayoutGrid',
    category: '3-Images',
  },
  {
    id: 'hero_left_2_right',
    name: '3 Images (1 Left + 2 Right)',
    description: '1 large vertical document on left and 2 stacked on right',
    capacity: 3,
    iconName: 'PanelLeftClose',
    category: '3-Images',
  },
  {
    id: 'tri_column',
    name: '3 Columns Strip',
    description: '3 equal vertical slices side by side',
    capacity: 3,
    iconName: 'Columns3',
    category: '3-Images',
  },
  {
    id: 'tri_row',
    name: '3 Horizontal Rows',
    description: '3 stacked receipts / slips from top to bottom',
    capacity: 3,
    iconName: 'Rows3',
    category: '3-Images',
  },
  {
    id: 'grid_2x2',
    name: '4 Images (2x2 Grid)',
    description: 'Classic 4-quadrant grid for invoices, receipts, and photos',
    capacity: 4,
    iconName: 'Grid2x2',
    category: '4-Images',
  },
  {
    id: 'hero_left_3_right',
    name: '4 Images (1 Left + 3 Stacked)',
    description: '1 master image on left with 3 supporting cards on right',
    capacity: 4,
    iconName: 'LayoutList',
    category: '4-Images',
  },
  {
    id: 'quad_horizontal',
    name: '4 Horizontal Strips',
    description: '4 neat stacked receipt strips or checks',
    capacity: 4,
    iconName: 'Rows4',
    category: '4-Images',
  },
  {
    id: 'passport_grid',
    name: '6 Mini Grid (Passport / Photos)',
    description: '6 evenly spaced passport/stamp sized photo frames',
    capacity: 6,
    iconName: 'LayoutDashboard',
    category: 'Specialty',
  },
];

export function getLayoutDefinition(layoutId: PageLayoutType): LayoutDefinition {
  const found = LAYOUT_DEFINITIONS.find((l) => l.id === layoutId);
  return (
    found || {
      id: 'single_fit',
      name: 'Single Document',
      description: 'Single document',
      capacity: 1,
      iconName: 'Square',
      category: '1-Image',
    }
  );
}

/**
 * Returns slot count for a layout
 */
export function getLayoutCapacity(layoutId: PageLayoutType): number {
  return getLayoutDefinition(layoutId).capacity;
}

/**
 * Automatically picks the best layout ID based on image count and document types
 */
export function getAutoLayout(count: number, hasIdCards = false): PageLayoutType {
  if (count <= 1) return 'single_fit';
  if (count === 2) return hasIdCards ? 'id_duo' : 'split_vertical';
  if (count === 3) return 'hero_top_2_bottom';
  if (count === 4) return 'grid_2x2';
  return 'passport_grid';
}
