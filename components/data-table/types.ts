import type { RowData } from '@tanstack/react-table';

/**
 * Extra per-column configuration.
 *
 * `mobileLabel` / `primary` / `hideOnMobile` let the mobile card renderer reuse the
 * exact same column definitions as the desktop table, so the two views can never
 * drift out of sync.
 */
declare module '@tanstack/react-table' {
  // Type parameters must match the library's own declaration exactly, including the
  // `RowData` constraint, or TypeScript rejects the merge.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Label shown beside the value on mobile cards. Defaults to the header text. */
    mobileLabel?: string;
    /** Rendered as the card title rather than a labelled row. */
    primary?: boolean;
    /** Omitted from mobile cards entirely. */
    hideOnMobile?: boolean;
    /** Sort key sent to the API; presence makes the header clickable. */
    sortKey?: string;
    /** Right-aligns the cell (numbers, actions). */
    align?: 'left' | 'right';
  }
}

export {};
