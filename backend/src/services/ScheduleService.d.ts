export declare class ScheduleService {
    /**
     * Tenta alocar o motoboy para a escala do dia.
     * Utiliza Atomic Update do Prisma (garante segurança contra race condition).
     */
    confirmAttendance(motoboyJid: string, date: Date): Promise<{
        status: string;
        lotou?: undefined;
        motoboyNome?: undefined;
    } | {
        status: string;
        lotou: boolean;
        motoboyNome: string;
    }>;
}
//# sourceMappingURL=ScheduleService.d.ts.map