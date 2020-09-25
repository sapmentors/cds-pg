const {
    DeleteBuilder,
    InsertBuilder,
    SelectBuilder,
    UpdateBuilder,
    CreateBuilder,
    DropBuilder
} = require('@sap/cds-runtime/lib/db/sql-builder/');
const Placeholder = require('./utils/Placeholder');

const _getCustomBuilderIfExists = (options, type) => {

    if (options && options.customBuilder) {
        switch (type) {
            case 'SELECT': {
                return options.customBuilder.SelectBuilder
            }

            case 'INSERT': {
                return options.customBuilder.InsertBuilder
            }

            case 'UPDATE': {
                return options.customBuilder.UpdateBuilder
            }

            case 'DELETE': {
                return options.customBuilder.DeleteBuilder
            }

            case 'CREATE': {
                return options.customBuilder.CreateBuilder
            }

            case 'DROP': {
                return options.customBuilder.DropBuilder
            }
        }
    }
}

/**
 * Factory method to build a SQL string from a CQN object.
 * @param {Select|Insert|Update|Delete|Create|Drop} cqn The CQN object used to build the SQL string
 * @param [options] The configuration object for delimiters and placeholders.
 * @param {string} [options.delimiter] - The delimiter string.
 * @param {string} [options.placeholder] - The placeholder for prepared statement.
 * @param {Object} [options.customBuilder] - Custom SQL Builders
 * @param {Object} [options.customBuilder.SelectBuilder] - Custom SelectBuilder
 * @param {Object} [options.customBuilder.UpdateBuilder] - Custom UpdateBuilder
 * @param {Object} [options.customBuilder.DeleteBuilder] - Custom DeleteBuilder
 * @param {Object} [options.customBuilder.CreateBuilder] - Custom CreateBuilder
 * @param {Object} [options.customBuilder.DropBuilder] - Custom DropBuilder
 * @param {Map} [options.typeConversion] - Map for database specific type conversion. Only relevant for CREATE.
 * @param {Object} [csn] CSN
 * @returns {string} The SQL string
 * * @throws Error if no valid CQN object provided
 */
const build = (cqn, options, csn) => {
    if (!cqn) {
        throw new Error('Cannot build SQL. No CQN object provided.')
    }

    const build = Builder => {
        Placeholder.reset()
        return new Builder(cqn, options, csn).build()
    }

    if (options && options.definitions) {
        csn = options
        options = {}
    }

    if (cqn.SELECT) {
        return build(_getCustomBuilderIfExists(options, 'SELECT') || SelectBuilder)
    }

    if (cqn.INSERT) {
        return build(_getCustomBuilderIfExists(options, 'INSERT') || InsertBuilder)
    }

    if (cqn.UPDATE) {
        return build(_getCustomBuilderIfExists(options, 'UPDATE') || UpdateBuilder)
    }

    if (cqn.DELETE) {
        return build(_getCustomBuilderIfExists(options, 'DELETE') || DeleteBuilder)
    }

    if (cqn.CREATE) {
        return build(_getCustomBuilderIfExists(options, 'CREATE') || CreateBuilder)
    }

    if (cqn.DROP) {
        return build(_getCustomBuilderIfExists(options, 'DROP') || DropBuilder)
    }

    throw new Error(`Cannot build SQL. Invalid CQN object provided: ${JSON.stringify(cqn)}`)
}

module.exports = build
