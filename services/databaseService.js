const { sql, config } = require("../config/db");

async function getConnection(databaseName) {

    const dbConfig = {
        ...config,
        database: databaseName
    };

    return await sql.connect(dbConfig);
}

module.exports = {
    getConnection,
    sql
};