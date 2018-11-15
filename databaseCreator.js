
const fs = require('fs');
const xml2js = require('xml2js');
const mysqlx = require('@mysql/xdevapi');

const unescoFilePath = './assets/unesco-world-heritage-sites.xml';
const namesFilePath = './assets/first-names.txt';
const surnamesFilePath = './assets/first-names.txt';

// For the sake of projects purpose and simplicity this top secret data is placed here
const options = {
    host: "localhost",
    port: '33060',
    user: "root",
    password: "root1234",
};

const schemaName = 'unescoScheme';
const tableSites = 'sitesTable';
const colID = '_id';
const colName = 'name';
const colAgentID = 'agentID';
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
        await session.sql(`CREATE TABLE ${schemaName}.${tableAgents} (${colID} SERIAL, ${colName} VARCHAR(100), PRIMARY KEY (${colID}))`)
            .execute();
        await session.sql(`CREATE TABLE ${schemaName}.${tableSites} (${colID} SERIAL, ${colAgentID}  BIGINT UNSIGNED UNIQUE, ${colName} VARCHAR(500), ${colLatitude} double(9,6), ${colLongitude} double(9,6), PRIMARY KEY (${colID}), FOREIGN KEY (${colAgentID}) REFERENCES ${tableAgents}(${colID}))`)
            .execute();

        // Prepare agents, insert in table
        let agents = prepareAgents(namesFilePath, surnamesFilePath);
        let agentsTable = session.getSchema(schemaName).getTable(tableAgents);
        for (agent of agents) {
            await agentsTable
                .insert([colName])
                .values([agent])
                .execute();
        }

        // Retrieve agent IDs
        let agentIDs = [];
        await session.getSchema(schemaName).getTable(tableAgents)
            .select([colID])
            .execute(id => {
                agentIDs.push(id[0]);
            });

        // Prepare sites, insert in table
        let sites = await parseXMLData();
        let sitesTable = session.getSchema(schemaName).getTable(tableSites);

        let randomAgentIDindex;
        let selectedID;

        for (site of sites) {
            // Randomly select agent ID
            randomAgentIDindex = Math.floor((Math.random() * agentIDs.length) - 1);
            selectedID = agentIDs.splice(randomAgentIDindex, 1)[0];
            await sitesTable
                .insert([colName, colLatitude, colLongitude, colAgentID])
                .values([site.name, site.latitude, site.longitude, selectedID])
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
                let sites = row.map((r) => {
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
