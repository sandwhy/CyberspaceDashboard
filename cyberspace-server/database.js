const fs = require('fs');
const db = require('./db'); // references your project db connection

async function exportSchema() {
    try {
        db.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'cyberspace_db'", async (err, tables) => {
            if (err) throw err;

            let compiled = "USE cyberspace_db;\n\n";

            for (const row of tables) {
                const tableName = row.TABLE_NAME;
                db.query(`SHOW CREATE TABLE \`${tableName}\``, (err, res) => {
                    if (!err && res[0]) {
                        compiled += `/* Table structure for table \`${tableName}\` */\n`;
                        compiled += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
                        compiled += `${res[0]['Create Table']};\n\n`;
                        
                        fs.writeFileSync('compiled_schema.sql', compiled);
                    }
                });
            }
            console.log('Schema successfully exported to compiled_schema.sql');
        });
    } catch (e) {
        console.error(e);
    }
}

module.exports = exportSchema;