-- CreateTable
CREATE TABLE "Ministerio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "ministerioId" TEXT NOT NULL,
    CONSTRAINT "Usuario_ministerioId_fkey" FOREIGN KEY ("ministerioId") REFERENCES "Ministerio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Escala" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" DATETIME NOT NULL,
    "ministerioId" TEXT NOT NULL,
    CONSTRAINT "Escala_ministerioId_fkey" FOREIGN KEY ("ministerioId") REFERENCES "Ministerio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Musica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "letra" TEXT NOT NULL,
    "ministerioId" TEXT NOT NULL,
    CONSTRAINT "Musica_ministerioId_fkey" FOREIGN KEY ("ministerioId") REFERENCES "Ministerio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Funcao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ministerioId" TEXT NOT NULL,
    CONSTRAINT "Funcao_ministerioId_fkey" FOREIGN KEY ("ministerioId") REFERENCES "Ministerio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Nota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conteudo" TEXT NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "_EscalaToUsuario" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EscalaToUsuario_A_fkey" FOREIGN KEY ("A") REFERENCES "Escala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EscalaToUsuario_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_FuncaoToUsuario" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_FuncaoToUsuario_A_fkey" FOREIGN KEY ("A") REFERENCES "Funcao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FuncaoToUsuario_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_EscalaToUsuario_AB_unique" ON "_EscalaToUsuario"("A", "B");

-- CreateIndex
CREATE INDEX "_EscalaToUsuario_B_index" ON "_EscalaToUsuario"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FuncaoToUsuario_AB_unique" ON "_FuncaoToUsuario"("A", "B");

-- CreateIndex
CREATE INDEX "_FuncaoToUsuario_B_index" ON "_FuncaoToUsuario"("B");
