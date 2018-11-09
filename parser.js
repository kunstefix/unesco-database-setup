
const fs = require('fs');
xml2js = require('xml2js');
const mysqlx = require('@mysql/xdevapi');

const unescoFilePath = './assets/unesco-world-heritage-sites.xml';

const options = {
    host: "localhost",
    port: '33060',
    user: "root",
    password: "root1234",
};

const schemaName = 'unescoScheme';
const tableName = 'sitesTable';
const colName = 'name';
const colLatitude = 'latitude';
const colLongitude = 'longitude';


prepareDatabase();

async function prepareDatabase() {

    try {

        // Connect to DB
        var session = await mysqlx.getSession(options)

        // Create schema
        let exists = await session.getSchema(schemaName).existsInDatabase()
        if (!exists) {
            session.createSchema(schemaName);
        }

        // Create table
        session.sql(`CREATE TABLE ${schemaName}.${tableName} (_id SERIAL, ${colName} VARCHAR(500), ${colLatitude} VARCHAR(30), ${colLongitude} VARCHAR(30))`)
            .execute();

        // Parse data
        let sites = await parseXMLData();

        // Insert parsed data in table
        let table = session.getSchema(schemaName).getTable(tableName);
        for (site of sites) {
            await table
                .insert([colName, colLatitude, colLongitude])
                .values([site.name, site.latitude, site.longitude])
                .execute();
        }

    } catch (err) {
        console.log(err);
    } finally {
        // Close the session in any case
        session.close();
    }
}

async function parseXMLData() {
    return new Promise(function (resolve) {

        var parser = new xml2js.Parser();

        fs.readFile(unescoFilePath, function (err, data) {
            parser.parseString(data, function (err, result) {
                let row = result.query.row;
                let sites = row.map((r, i) => {
                    return {
                        name: r.site.join(),
                        longitude: r.longitude.join(),
                        latitude: r.latitude.join()
                    }
                });
                console.log('Mapped sites: ', sites.length);
                resolve(sites);
            });
        });
    })
}


