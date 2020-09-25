const { InsertBuilder } = require('@sap/cds-runtime/lib/db/sql-builder/');
const Placeholder = require('../utils/Placeholder');

// TODO: PG is able to handle inserting multipe values at once https://www.postgresql.org/docs/9.2/sql-insert.html
class CustomInsertBuilder extends InsertBuilder {


}

module.exports = CustomInsertBuilder
