const deploy = require('@sap/cds/lib/db/deploy')
const liquidbase = require('liquibase')

const reset = async () => {
  const config = {
    //changeLogFile: 'change-log-examples/postgreSQL/changelog.postgresql.sql',
    url: 'jdbc:postgresql://localhost:5432/beershop',
    username: 'postgres',
    password: 'postgres',
    classpath: 'node_modules/liquibase/lib/Drivers/postgresql-42.2.8.jar',
  }

  liquidbase(config)
    .run('--changeLogFile=changelog.postgresql.sql', 'generateChangeLog')
    .then(() => console.log('success'))
    .catch((err) => console.error('fail', err))
}

module.exports = deploy()

cds.db.options.database
;`DROP SCHEMA courses, emp CASCADE`
