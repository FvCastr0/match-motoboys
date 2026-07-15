export declare class WhatsAppService {
    private scheduleService;
    private evolutionUrl;
    private evolutionKey;
    private instanceName;
    constructor();
    /**
     * Conecta o serviço e inicializa o worker de envio enfileirado (BullMQ)
     */
    connect(): Promise<void>;
    /**
     * Trata o webhook recebido da Evolution API quando uma nova mensagem é gerada
     */
    handleWebhook(body: any): Promise<void>;
    /**
     * Abre a escala diária no banco de dados e dispara a mensagem no grupo de WhatsApp
     */
    openDailySchedule(vagasTotais?: number): Promise<void>;
    /**
     * Envia uma mensagem HTTP POST para a Evolution API no grupo
     */
    sendGroupMessage(text: string): Promise<void>;
    /**
     * Envia uma mensagem HTTP POST para a Evolution API em DM (utilizada pelo worker)
     */
    sendDirectMessage(jid: string, text: string): Promise<void>;
    /**
     * Auxiliar para fazer chamadas autenticadas na Evolution API
     */
    private postToEvolution;
}
//# sourceMappingURL=WhatsAppService.d.ts.map