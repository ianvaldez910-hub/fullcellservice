import { Equipment, STATUS_CONFIG } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Printer, Download } from 'lucide-react';
import { useRef } from 'react';

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  item: Equipment | null;
}

export function ReceiptDialog({ open, onClose, item }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!item) return null;

  const remaining = item.budget - item.deposit;

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Recibo #${item.id}</title>
      <style>
        body { font-family: 'Courier New', monospace; max-width: 400px; margin: 0 auto; padding: 20px; }
        h1 { text-align: center; font-size: 18px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; }
        .label { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        .total { font-size: 16px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style></head><body>
      <h1>🔧 ORDEN DE SERVICIO</h1>
      <div class="row"><span class="label">Orden:</span><span>#${item.id}</span></div>
      <div class="row"><span class="label">Fecha:</span><span>${item.dateIn}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Cliente:</span><span>${item.clientName}</span></div>
      <div class="row"><span class="label">Equipo:</span><span>${item.brand} ${item.model}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Problema:</span></div>
      <div style="padding: 4px 0;">${item.problem}</div>
      <div class="divider"></div>
      <div class="row"><span class="label">Presupuesto:</span><span>$${item.budget.toLocaleString()}</span></div>
      <div class="row"><span class="label">Seña:</span><span>$${item.deposit.toLocaleString()}</span></div>
      <div class="row total"><span>Saldo:</span><span>$${remaining.toLocaleString()}</span></div>
      ${item.dateEstimated ? `<div class="divider"></div><div class="row"><span class="label">Entrega est.:</span><span>${item.dateEstimated}</span></div>` : ''}
      <div class="row"><span class="label">Estado:</span><span>${item.status}</span></div>
      <div class="footer">Gracias por confiar en nuestro servicio</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Recibo - Orden #{item.id}</DialogTitle>
        </DialogHeader>
        <div ref={receiptRef} className="space-y-4 font-mono text-sm border rounded-lg p-5 bg-card">
          <div className="text-center border-b border-dashed pb-3">
            <p className="text-lg font-bold">🔧 ORDEN DE SERVICIO</p>
            <p className="text-xs text-muted-foreground">Orden #{item.id} · {item.dateIn}</p>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span><span className="font-semibold">{item.clientName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Equipo:</span><span>{item.brand} {item.model}</span></div>
          </div>

          <div className="border-t border-dashed pt-3">
            <p className="text-muted-foreground text-xs mb-1">Problema:</p>
            <p>{item.problem}</p>
          </div>

          <div className="border-t border-dashed pt-3 space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Presupuesto:</span><span>${item.budget.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Seña:</span><span>${item.deposit.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>Saldo:</span><span>${remaining.toLocaleString()}</span></div>
          </div>

          {item.dateEstimated && (
            <div className="flex justify-between border-t border-dashed pt-3">
              <span className="text-muted-foreground">Entrega est.:</span><span>{item.dateEstimated}</span>
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground pt-2">
            Gracias por confiar en nuestro servicio
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir / PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
