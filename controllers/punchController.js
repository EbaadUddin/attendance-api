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
                    MachineNo, inout, DeviceIp_SRNo
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
                    InOut, DeviceIp_SRNo
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



// Get company punches - incremental
exports.getCompanyPunches = async (req, res) => {

    try {

        const databaseName = req.params.dbname;
        const company = req.params.company;
        const apiKey = req.header("api-key");

        // ==============================
        // VALIDATE DATABASE NAME
        // ==============================

        if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {

            return res.status(400).json({
                success: false,
                message: "Invalid database name."
            });

        }

        // ==============================
        // VALIDATE COMPANY
        // ==============================

        if (!/^\d+$/.test(company)) {

            return res.status(400).json({
                success: false,
                message: "Invalid company."
            });

        }

        const companyId = parseInt(company, 10);

        // ==============================
        // CHECK DATABASE
        // ==============================

        const master = await getConnection("realsoftwebuser");

        const check = await master
            .request()
            .input("dbname", sql.VarChar, databaseName)
            .query(`
                SELECT sqlcon
                FROM user_info
                WHERE sqlcon = @dbname
            `);

        if (check.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Database not registered."
            });

        }

        // ==============================
        // CHECK API KEY
        // ==============================

        const expectedKey = generateKey(databaseName);

        if (apiKey !== expectedKey) {

            return res.status(401).json({
                success: false,
                message: "Invalid API Key."
            });

        }

        // ==============================
        // CONNECT TO CUSTOMER DATABASE
        // ==============================

        const db = await getConnection(databaseName);

        // ==============================
        // GET COMPANY'S LAST PUNCH ID
        // ==============================

        const syncResult = await db
            .request()
            .input("companyId", sql.Int, companyId)
            .query(`
                SELECT LastPunchId
                FROM ${databaseName}.dbo.ApiPunchSyncState
                WHERE CompanyId = @companyId
            `);

        let lastPunchId = 0n;

        if (syncResult.recordset.length > 0) {

            lastPunchId = BigInt(
                syncResult.recordset[0].LastPunchId
            );

        }

        // ==============================
        // GET ONLY NEW PUNCHES
        // FOR THIS COMPANY'S MACHINES
        // ==============================

        const punches = await db
            .request()
            .input("companyId", sql.Int, companyId)
            .input("lastPunchId", sql.BigInt, lastPunchId.toString())
            .query(`
                SELECT
                    p.Tran_MachineRawPunchId,

                    p.CardNo,

                    CONVERT(VARCHAR(10), p.PunchDateTime, 103)
                    + ' ' +
                    CONVERT(VARCHAR(8), p.PunchDateTime, 108)
                    AS PunchDateTime,

                    p.MachineNo,

                    p.InOut,

                    p.DeviceIp_SRNo

                FROM ${databaseName}.dbo.tran_machinerawpunch p

                INNER JOIN ${databaseName}.dbo.mst_machineType1 m
                    ON m.MachineIp = p.DeviceIp_SRNo

                WHERE
                    m.BranchId = @companyId
                    AND p.Tran_MachineRawPunchId > @lastPunchId

                ORDER BY
                    p.Tran_MachineRawPunchId ASC
            `);

        // ==============================
        // UPDATE COMPANY CHECKPOINT
        // ==============================

        if (punches.recordset.length > 0) {

            const newLastPunchId = BigInt(
                punches.recordset[
                    punches.recordset.length - 1
                ].Tran_MachineRawPunchId
            );

            await db
                .request()
                .input("companyId", sql.Int, companyId)
                .input(
                    "lastPunchId",
                    sql.BigInt,
                    newLastPunchId.toString()
                )
                .query(`
                    MERGE ${databaseName}.dbo.ApiPunchSyncState AS target

                    USING
                    (
                        SELECT
                            @companyId AS CompanyId,
                            @lastPunchId AS LastPunchId
                    ) AS source

                    ON target.CompanyId = source.CompanyId

                    WHEN MATCHED THEN

                        UPDATE SET
                            LastPunchId = source.LastPunchId,
                            UpdatedAt = GETDATE()

                    WHEN NOT MATCHED THEN

                        INSERT
                        (
                            CompanyId,
                            LastPunchId,
                            CreatedAt,
                            UpdatedAt
                        )

                        VALUES
                        (
                            source.CompanyId,
                            source.LastPunchId,
                            GETDATE(),
                            GETDATE()
                        );
                `);
        }

        // ==============================
        // RESPONSE
        // ==============================

        return res.json({

            success: true,

            company: companyId,

            total: punches.recordset.length,

            data: punches.recordset

        });

    }
    catch (err) {

        console.log(err);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};