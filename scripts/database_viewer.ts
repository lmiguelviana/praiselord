import { PrismaClient } from '@prisma/client'

async function viewDatabase() {
  const prisma = new PrismaClient()

  try {
    console.log('Visualizando dados do banco de dados:')

    // Usuários
    const usuarios = await prisma.usuario.findMany()
    console.log('\n--- Usuários ---')
    console.log(JSON.stringify(usuarios, null, 2))

    // Ministérios
    const ministerios = await prisma.ministerio.findMany()
    console.log('\n--- Ministérios ---')
    console.log(JSON.stringify(ministerios, null, 2))

    // Escalas
    const escalas = await prisma.escala.findMany()
    console.log('\n--- Escalas ---')
    console.log(JSON.stringify(escalas, null, 2))

    // Músicas
    const musicas = await prisma.musica.findMany()
    console.log('\n--- Músicas ---')
    console.log(JSON.stringify(musicas, null, 2))

    // Funções
    const funcoes = await prisma.funcao.findMany()
    console.log('\n--- Funções ---')
    console.log(JSON.stringify(funcoes, null, 2))

    // Notas
    const notas = await prisma.nota.findMany()
    console.log('\n--- Notas ---')
    console.log(JSON.stringify(notas, null, 2))

  } catch (error) {
    console.error('Erro ao visualizar o banco de dados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

viewDatabase()