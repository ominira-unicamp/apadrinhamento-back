-- AlterTable
ALTER TABLE "users" ADD COLUMN     "selectedGodparentsIds" UUID[];

-- CreateTable
CREATE TABLE "_selectedGodparents" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_selectedGodparents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_selectedGodparents_B_index" ON "_selectedGodparents"("B");

-- AddForeignKey
ALTER TABLE "_selectedGodparents" ADD CONSTRAINT "_selectedGodparents_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_selectedGodparents" ADD CONSTRAINT "_selectedGodparents_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
