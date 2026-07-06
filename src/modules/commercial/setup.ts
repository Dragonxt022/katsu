import { registerService } from '../../core/services/registry';
import { moveStock, listMovements } from './stock';

/** Serviços que o módulo commercial oferece aos outros Apps (via Core). */
export interface CommercialStockService {
  move: typeof moveStock;
  listMovements: typeof listMovements;
}

export default function setup(): void {
  registerService('commercial.stock', { move: moveStock, listMovements } satisfies CommercialStockService);
}
