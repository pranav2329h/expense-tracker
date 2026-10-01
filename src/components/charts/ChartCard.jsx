import { useState } from 'react';
import { ChartColumn, Table2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { cn } from '@/utils/cn';

function DataTable({ caption, columns, rows }) {
  return (
    <div className="max-h-80 overflow-auto rounded-lg border border-line">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-subtle">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn('px-3 py-2 text-xs font-medium text-ink-3', column.align === 'right' ? 'text-right' : 'text-left')}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key ?? index} className="border-t border-line">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('px-3 py-2 text-ink', column.align === 'right' && 'text-right tabular')}
                >
                  {column.format ? column.format(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Card wrapper for a chart. Every chart offers a table view with the same numbers,
 * so values never depend on hovering a tooltip or telling colours apart.
 */
export function ChartCard({ title, description, table, action, children, className, refreshing = false }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card className={cn('flex min-w-0 flex-col p-4 sm:p-5', className)}>
      <CardHeader
        title={title}
        description={description}
        action={
          <>
            {action}
            {table && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={showTable ? ChartColumn : Table2}
                aria-pressed={showTable}
                onClick={() => setShowTable((value) => !value)}
              >
                {showTable ? 'Chart' : 'Table'}
              </Button>
            )}
          </>
        }
      />
      <div className={cn('mt-4 flex-1 transition-opacity', refreshing && 'opacity-60')}>
        {showTable && table ? <DataTable caption={title} {...table} /> : children}
      </div>
    </Card>
  );
}
