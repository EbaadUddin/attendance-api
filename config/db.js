const sql = require("mssql");

const config = {
    user: "sa",
    password: "",
    server: "62.171.184.216",

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