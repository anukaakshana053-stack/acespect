-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('QUEUED', 'PROCESSING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "AgentKind" AS ENUM ('PHOTO', 'FORM', 'RISK', 'SUMMARY');

-- CreateEnum
CREATE TYPE "SummaryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EDITED');

-- CreateEnum
CREATE TYPE "DecisionKind" AS ENUM ('APPROVED', 'REJECTED', 'EDITED');

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "version" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "photos" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_jobs" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "review_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_results" (
    "id" TEXT NOT NULL,
    "reviewJobId" TEXT NOT NULL,
    "agent" "AgentKind" NOT NULL,
    "output" JSONB NOT NULL,
    "model" TEXT,
    "tokensUsed" INTEGER,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_summaries" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "riskScore" INTEGER,
    "flags" JSONB,
    "summaryText" TEXT,
    "status" "SummaryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_decisions" (
    "id" TEXT NOT NULL,
    "reviewSummaryId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "DecisionKind" NOT NULL,
    "notes" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspections_inspectorId_idx" ON "inspections"("inspectorId");

-- CreateIndex
CREATE INDEX "review_jobs_status_idx" ON "review_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "review_jobs_inspectionId_version_key" ON "review_jobs"("inspectionId", "version");

-- CreateIndex
CREATE INDEX "agent_results_reviewJobId_idx" ON "agent_results"("reviewJobId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_results_reviewJobId_agent_key" ON "agent_results"("reviewJobId", "agent");

-- CreateIndex
CREATE UNIQUE INDEX "review_summaries_inspectionId_key" ON "review_summaries"("inspectionId");

-- CreateIndex
CREATE INDEX "review_decisions_reviewSummaryId_idx" ON "review_decisions"("reviewSummaryId");

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_jobs" ADD CONSTRAINT "review_jobs_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_results" ADD CONSTRAINT "agent_results_reviewJobId_fkey" FOREIGN KEY ("reviewJobId") REFERENCES "review_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_summaries" ADD CONSTRAINT "review_summaries_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_reviewSummaryId_fkey" FOREIGN KEY ("reviewSummaryId") REFERENCES "review_summaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
