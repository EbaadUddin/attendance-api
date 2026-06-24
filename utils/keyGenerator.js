function generateKey(databaseName) {

    databaseName = databaseName.toUpperCase();

    let key = "";

    for (const ch of databaseName) {

        if (ch >= "A" && ch <= "Z") {

            key += (ch.charCodeAt(0) - 64);

        }

    }

    return key;
}

module.exports = {
    generateKey
};