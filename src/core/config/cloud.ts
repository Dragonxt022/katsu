/**
 * URL de produção do cloud/ (Fase 6a). Preencha com o domínio/IP real do seu VPS
 * antes de gerar o instalador para clientes de verdade — sem isso, a sincronização
 * remota fica inativa (o app continua funcionando 100% offline normalmente).
 * `KATSU_SYNC_SERVER_URL` (variável de ambiente) sempre tem prioridade sobre isto,
 * usado pelos testes/dev para apontar para o cloud/ local.
 */
export const PRODUCTION_CLOUD_URL = 'http://localhost:4000';
