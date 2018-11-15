const mysqlx = require('@mysql/xdevapi');


const options = {
    host: "localhost",
    port: '33060',
    user: "root",
    password: "root1234",
    schema: "unescoScheme"
};


calculate();

export function calculateDistance() {

    let lat = 46.056946;  // latitude of centre of bounding circle in degrees
    let lon = 14.505751; // longitude of centre of bounding circle in degrees
    let distance = 100; // radius of bounding circle in kilometers

    let R = 6371;  // earth's mean radius, km
    let sqlstatement = `
    SELECT
    name,
    (
       ${R} *
       acos(cos(radians(${lat})) *
       cos(radians(latitude)) *
       cos(radians(longitude) -
       radians(${lon})) +
       sin(radians(${lat})) *
       sin(radians(latitude)))
    ) AS distance
    FROM unescoScheme.sitesTable
    HAVING distance < ${distance}
    ORDER BY distance LIMIT 0, 20;
    `;


    return new Promise(  function(resolve, reject) {

        try {

            // Connect to DB
            var session = await mysqlx.getSession(options)



            await session.sql(sqlstatement)
                .execute(res => {
                    console.log(res);
                    resolve(res);
                });

        } catch (err) {
            console.log(err);
            reject(err);
        } finally {
            // Close the session in any case
            session.close();
        }

     } );


}

