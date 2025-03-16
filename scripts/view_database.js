const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');

// Função para listar tabelas
function listTables(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        reject(err);
      } else {
        resolve(tables);
      }
    });
  });
}

// Função para obter dados de uma tabela
function getTableData(db, tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Função principal
async function viewDatabase() {
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, async (err) => {
    if (err) {
      console.error('Erro ao abrir o banco de dados:', err.message);
      return;
    }

    try {
      const tables = await listTables(db);
      console.log('Tabelas no banco de dados:');
      
      for (const table of tables) {
        console.log(`\n--- Tabela: ${table.name} ---`);
        
        // Obter estrutura da tabela
        db.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
          if (err) {
            console.error(`Erro ao obter colunas da tabela ${table.name}:`, err.message);
          } else {
            console.log('Colunas:');
            columns.forEach(column => {
              console.log(`- ${column.name} (${column.type})`);
            });
          }
        });

        // Obter dados da tabela
        const tableData = await getTableData(db, table.name);
        console.log('Registros:');
        console.log(JSON.stringify(tableData, null, 2));
      }
    } catch (error) {
      console.error('Erro ao processar banco de dados:', error);
    } finally {
      db.close((err) => {
        if (err) {
          console.error('Erro ao fechar o banco de dados:', err.message);
        }
      });
    }
  });
}

viewDatabase();