import { registerService } from '../../core/services/registry';
import { registerRecomputeHook } from '../../core/sync/registry';
import { moveStock, moveStockRaw, listMovements, recomputeStockForProducts } from './stock';

/** Serviços que o módulo commercial oferece aos outros Apps (via Core). */
export interface CommercialStockService {
  move: typeof moveStock;
  /** Sem transação própria — use quando já estiver dentro de uma transação. */
  moveRaw: typeof moveStockRaw;
  listMovements: typeof listMovements;
}

export default function setup(): void {
  registerService('commercial.stock', { move: moveStock, moveRaw: moveStockRaw, listMovements } satisfies CommercialStockService);
  registerRecomputeHook('stock_movements', recomputeStockForProducts);
}
