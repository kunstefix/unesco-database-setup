const fs = require('fs');
xml2js = require('xml2js');
const mysqlx = require('@mysql/xdevapi');



const options = {
    host: "localhost",
    port: '33060',
    user: "root",
    password: "root1234",
    //schema: 'mySchema' // created by default
};

mysqlx.getSession(options)
  .then(session => {
    console.log("this is the session! ", session);
  })
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });

/* var parser = new xml2js.Parser();
fs.readFile('./assets/unesco-world-heritage-sites.xml', function (err, data) {
    parser.parseString(data, function (err, result) {
        let row = result.query.row;
        row.map((r, i) => { console.log(r.site, r.longitude, r.latitude); console.log("=============================") });
//        console.dir(result.query.row);
        console.log('Done');
    });
}); */