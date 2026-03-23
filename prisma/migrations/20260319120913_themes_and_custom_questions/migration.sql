-- AlterTable
ALTER TABLE "Hunt" ADD COLUMN "themeAccentColor" TEXT;
ALTER TABLE "Hunt" ADD COLUMN "themePreset" TEXT DEFAULT 'EASTER';
ALTER TABLE "Hunt" ADD COLUMN "themePrimaryColor" TEXT;

-- CreateTable
CREATE TABLE "RegistrationQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "huntId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistrationQuestion_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistrationAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistrationAnswer_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RegistrationAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "RegistrationQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
