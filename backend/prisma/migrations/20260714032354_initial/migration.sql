-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('ABERTO', 'FECHADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "motoboys" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motoboys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "vagasTotais" INTEGER NOT NULL,
    "vagasPreenchidas" INTEGER NOT NULL DEFAULT 0,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "motoboyId" TEXT NOT NULL,
    "confirmadoAs" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compareceu" BOOLEAN NOT NULL DEFAULT false,
    "horarioCheckIn" TIMESTAMP(3),

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_sessions" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_rules" (
    "id" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "vagasPadrao" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "motoboys_telefone_key" ON "motoboys"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_data_key" ON "schedules"("data");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_scheduleId_motoboyId_key" ON "attendances"("scheduleId", "motoboyId");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_rules_diaSemana_key" ON "schedule_rules"("diaSemana");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_motoboyId_fkey" FOREIGN KEY ("motoboyId") REFERENCES "motoboys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
