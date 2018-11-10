
const fs = require('fs');
xml2js = require('xml2js');
const mysqlx = require('@mysql/xdevapi');

const unescoFilePath = './assets/unesco-world-heritage-sites.xml';
const namesFilePath = './assets/first-names.txt';
const surnamesFilePath = './assets/first-names.txt';

const options = {
    host: "localhost",
    port: '33060',
    user: "root",
    password: "root1234",
};

const schemaName = 'unescoScheme';
const tableSites = 'sitesTable';
const colName = 'name';
const colLatitude = 'latitude';
const colLongitude = 'longitude';
const tableAgents = 'agentsTable';


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

        // Prepare tables
        session.sql(`CREATE TABLE ${schemaName}.${tableSites} (_id SERIAL, ${colName} VARCHAR(500), ${colLatitude} VARCHAR(30), ${colLongitude} VARCHAR(30))`)
            .execute();
        session.sql(`CREATE TABLE ${schemaName}.${tableAgents} (_id SERIAL, ${colName} VARCHAR(100))`)
            .execute();

        // Prepare sites, insert in table
        let sites = await parseXMLData();
        let sitesTable = session.getSchema(schemaName).getTable(tableSites);
        for (site of sites) {
            await sitesTable
                .insert([colName, colLatitude, colLongitude])
                .values([site.name, site.latitude, site.longitude])
                .execute();
        }

        // Prepare agents, insert in table
        let agents = prepareAgents(namesFilePath, surnamesFilePath);
        let agentsTable = session.getSchema(schemaName).getTable(tableAgents);
        for (agent of agents) {
            await agentsTable
                .insert([colName])
                .values([agent])
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

function prepareAgents(namesFilePath, surnamesFilePath) {
    let surnamesArray = fs.readFileSync(surnamesFilePath).toString().split("\n");
    let namesArray = fs.readFileSync(namesFilePath).toString().split("\n");
    let namePairs = namesArray.map(name => {
        let randomIndex = Math.floor((Math.random() * surnamesArray.length) + 1);
        let randomLastName = surnamesArray[randomIndex];
        let namePair = `${name} ${randomLastName}`;
        return namePair;
    });
    console.log('Created agents: ', namePairs.length);
    return namePairs
}
