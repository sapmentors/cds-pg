const { InsertBuilder } = require('@sap/cds-runtime/lib/db/sql-builder/');
const Placeholder = require('../../utils/Placeholder');

// TODO: PG is able to handle inserting multipe values at once https://www.postgresql.org/docs/9.2/sql-insert.html
class CustomInsertBuilder extends InsertBuilder {

    /**
     * @override
     * @param {*} placeholderNum 
     * @param {*} valuesAndSQLs 
     */
    _createPlaceholderString(placeholderNum, valuesAndSQLs = []) {
        const placeholders = []

        // Postgres requires numbered placeholders
        for (let i = 0, length = placeholderNum - this._columnIndexesToDelete.length; i < length; i++) {
            placeholders.push(Placeholder.increment())
        }

        for (const val of valuesAndSQLs) {
            placeholders.push(val && val.sql ? val.sql : this._options.placeholder)
        }

        return ['VALUES', '(', placeholders.join(', '), ')']
    }

}

module.exports = CustomInsertBuilder
