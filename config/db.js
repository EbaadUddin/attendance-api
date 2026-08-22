require("dotenv").config();

const sql = require("mssql");

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,

    options: {
        trustServerCertificate: true,
        encrypt: false
    },

    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

module.exports = {
    sql,
    config
};
