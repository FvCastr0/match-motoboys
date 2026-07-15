import { prisma } from '../prisma';

export class ScheduleService {
  /**
   * Tenta alocar o motoboy para a escala do dia.
   * Utiliza Atomic Update do Prisma (garante segurança contra race condition).
   */
  async confirmAttendance(motoboyJid: string, date: Date, pushName?: string) {
    // 1. Acha o motoboy pelo JID (número do whatsapp)
    let motoboy = await prisma.motoboy.findUnique({ where: { telefone: motoboyJid } });
    
    if (!motoboy) {
      const nomeCriado = pushName || `Motoboy ${motoboyJid.split('@')[0]}`;
      motoboy = await prisma.motoboy.create({
        data: {
          nome: nomeCriado,
          telefone: motoboyJid,
          ativo: true,
        },
      });
      console.log(`🆕 Novo motoboy criado dinamicamente via WhatsApp: ${nomeCriado} (${motoboyJid})`);
    } else if (!motoboy.ativo) {
      throw new Error('Motoboy está inativo no sistema.');
    }

    // 2. Busca a escala do dia que está ABERTA
    const dataAjustada = new Date(date);
    dataAjustada.setHours(0, 0, 0, 0); // Garante ser a data sem horas

    const schedule = await prisma.schedule.findFirst({
      where: { data: dataAjustada, status: 'ABERTO' },
    });

    if (!schedule) {
      throw new Error('Não há escala aberta para hoje.');
    }

    // 3. Verifica se ele já está alocado para evitar double booking
    const alreadyAttending = await prisma.attendance.findUnique({
      where: {
        scheduleId_motoboyId: { scheduleId: schedule.id, motoboyId: motoboy.id },
      },
    });

    if (alreadyAttending) {
      return { status: 'ALREADY_CONFIRMED' };
    }

    // 4. ATOMIC UPDATE CONCORRENTE:
    // Atualiza apenas se vagasPreenchidas < vagasTotais. 
    // Em BDs como Postgres, isso roda numa transação otimista protegida.
    const updatedSchedule = await prisma.schedule.updateMany({
      where: {
        id: schedule.id,
        vagasPreenchidas: { lt: schedule.vagasTotais },
        status: 'ABERTO',
      },
      data: {
        vagasPreenchidas: { increment: 1 },
      },
    });

    // Se count for 0, quer dizer que alguém pegou a última vaga segundos antes,
    // ou a escala fechou.
    if (updatedSchedule.count === 0) {
      // Fecha a escala para garantir
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { status: 'FECHADO' },
      });
      return { status: 'FULL' };
    }

    // 5. Deu certo, aloca o motoboy.
    await prisma.attendance.create({
      data: {
        scheduleId: schedule.id,
        motoboyId: motoboy.id,
      },
    });

    // Verifica se após nossa reserva a escala lotou (para avisar o grupo)
    const currentSchedule = await prisma.schedule.findUnique({ where: { id: schedule.id } });
    let lotou = false;
    if (currentSchedule && currentSchedule.vagasPreenchidas >= currentSchedule.vagasTotais) {
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { status: 'FECHADO' },
      });
      lotou = true;
    }

    return { status: 'SUCCESS', lotou, motoboyNome: motoboy.nome };
  }

  /**
   * Finaliza a escala ativa (busca a escala com status 'ABERTO' mais recente e fecha).
   */
  async closeActiveSchedule() {
    const activeSchedule = await prisma.schedule.findFirst({
      where: { status: 'ABERTO' },
      orderBy: { data: 'desc' },
    });

    if (!activeSchedule) {
      return null;
    }

    const updated = await prisma.schedule.update({
      where: { id: activeSchedule.id },
      data: { status: 'FECHADO' },
    });

    return updated;
  }
}
