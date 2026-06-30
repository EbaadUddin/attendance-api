const { getConnection, sql } = require("../services/databaseService");
const { generateKey } = require("../utils/keyGenerator");

// get by date
exports.getPunches = async (req, res) => {

    try {

        const databaseName = req.params.dbname;
        const date = req.params.date;
        const apiKey = req.header("api-key");

        // Validate database name
        if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {

            return res.status(400).json({
                success: false,
                message: "Invalid database name."
            });

        }

        // Validate date
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {

            return res.status(400).json({
                success: false,
                message: "Invalid date."
            });

        }

        // Connect to realsoftwebuser
        const master = await getConnection("realsoftwebuser");

        const check = await master
            .request()
            .input("dbname", sql.VarChar, databaseName)
            .query(`
                SELECT sqlcon
                FROM user_info
                WHERE sqlcon=@dbname
            `);

        if (check.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Database not registered."
            });

        }

        const expectedKey = generateKey(databaseName);

        if (apiKey !== expectedKey) {

            return res.status(401).json({
                success: false,
                message: "Invalid API Key."
            });

        }

        const db = await getConnection(databaseName);

        const punches = await db
            .request()
            .input("date", sql.Date, date)
            .query(`
                SELECT
                    CardNo,
                    CONVERT(VARCHAR(10), PunchDateTime, 103) + ' ' +
                    CONVERT(VARCHAR(8), PunchDateTime, 108) AS PunchDateTime,
                    MachineNo, inout
                FROM ${databaseName}.dbo.tran_machinerawpunch
                WHERE CAST(PunchDateTime AS DATE)=@date
                ORDER BY PunchDateTime
            `);

        res.json({

            total: punches.recordset.length,

            data: punches.recordset

        });

    }
    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};


//get by date range
exports.getPunchesByDateRange = async (req, res) => {

    try {

        const databaseName = req.params.dbname;
        const fromDate = req.params.fromDate;
        const toDate = req.params.toDate;
        const apiKey = req.header("api-key");

        // Validate database name
        if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {

            return res.status(400).json({
                success: false,
                message: "Invalid database name."
            });

        }

        // Validate dates
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(fromDate) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(toDate)
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid date format."
            });

        }

        // Connect to realsoftwebuser
        const master = await getConnection("realsoftwebuser");

        const check = await master
            .request()
            .input("dbname", sql.VarChar, databaseName)
            .query(`
                SELECT sqlcon
                FROM user_info
                WHERE sqlcon=@dbname
            `);

        if (check.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Database not registered."
            });

        }

        const expectedKey = generateKey(databaseName);

        if (apiKey !== expectedKey) {

            return res.status(401).json({
                success: false,
                message: "Invalid API Key."
            });

        }

        const db = await getConnection(databaseName);

        const punches = await db
            .request()
            .input("fromDate", sql.Date, fromDate)
            .input("toDate", sql.Date, toDate)
            .query(`
                SELECT
                    CardNo,
                    CONVERT(VARCHAR(10), PunchDateTime, 103) + ' ' +
                    CONVERT(VARCHAR(8), PunchDateTime, 108) AS PunchDateTime,
                    MachineNo,
                    InOut
                FROM ${databaseName}.dbo.tran_machinerawpunch
                WHERE CAST(PunchDateTime AS DATE) BETWEEN @fromDate AND @toDate
                ORDER BY PunchDateTime
            `);

        res.json({

            total: punches.recordset.length,

            data: punches.recordset

        });

    }
    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};