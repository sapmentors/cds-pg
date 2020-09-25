const { createJoinCQNFromExpanded, rawToExpanded } = require('@sap/cds-runtime/lib/db/expand')
const { sqlFactory } = require('@sap/cds-runtime/lib/db/sql-builder')
const { PGSelectBuilder, PGResourceBuilder } = require('./sql-builder')
const { postProcess, getPostProcessMapper } = require('./data-conversion/post-processing')
const { PG_TYPE_CONVERSION_MAP } = require('./converters/conversion')


/**
 * Create Sql factory
 * @param {csn definition} model 
 * @param {cqn } query 
 * @param {called with expand} isExpand 
 */
function _cqnToSQL(model, query, isExpand = false) {
    return sqlFactory(
        query,
        {
            customBuilder: {
                SelectBuilder: PGSelectBuilder,
                ResourceBuilder: PGResourceBuilder,
            },
            isExpand
        },
        model,
        isExpand
    )
}

/**
 * Value formatter String values must be surrounded by sindle quotes
 *  -- REVISIT should be optimized --
 * @param {*} value 
 */
const _formatValues = (value) => {
    switch (typeof value) {
        case 'string': {
            return `'${value}'`
        }
        default:
            return value
    }
}

/**
 * SQL query returns with ? as a placeholder this is replaced here 
 * --- FUNCTIONAL BUT NOT IDEAL  CHANGE PLACEHOLDER TO PG placeholders  eg. $1 $2
 * @param {*} sql 
 * @param {*} values 
 */
const _populatePlaceholders = (sql, values) => {
    return sql.split('?')
        .filter(part => part && part !== 'undefined')
        .map((part, i) => part + _formatValues(values[i])).join('');
}

/**
 * Execute sql statement
 *  -- TODO  in the future we should pass text and values to the query
 * @param {*} dbc 
 * @param {*} sql 
 * @param {*} values 
 * @param {*} isOne 
 * @param {*} postMapper 
 * @param {*} propertyMapper 
 * @param {*} objStructMapper 
 */
function _executeSelectSQL(dbc, sql, values, isOne, postMapper, propertyMapper, objStructMapper) {
    return dbc.query(sql).then(result => {
        if (isOne) {
            result = result.length > 0 ? result[0] : null
        }

        return postProcess(result.rows, postMapper, propertyMapper, objStructMapper)
    })
}



/**
 * process requests with expand 
 * @param {*} dbc 
 * @param {*} cqn 
 * @param {*} model 
 */
const processExpand = (dbc, cqn, model) => {
    let queries = [];
    const expandQueries = createJoinCQNFromExpanded(cqn, model, true)
    for (const cqn of expandQueries.queries) {

        // REVISIT
        // Why is the post processing in expand different?
        const { sql, values } = _cqnToSQL(model, cqn, true)

        let query = _populatePlaceholders(sql, values);

        if (process.env.DEBUG || process.env.CDS_DEBUG) {
            console.info('[cds-pg]', '-', 'sql > ', query)
        }
        const postPropertyMapper = getPostProcessMapper(PG_TYPE_CONVERSION_MAP, model, cqn)

        queries.push(_executeSelectSQL(dbc, query, values, false, postPropertyMapper))
    }

    return rawToExpanded(expandQueries, queries, cqn.SELECT.one)
}


/**
 *  Process nomal select statement
 * @param {} dbc 
 * @param {*} cqn 
 * @param {*} model 
 */
const processSimpleSQL = (dbc, cqn, model) => {
    const { sql, values = [] } = _cqnToSQL(model, cqn)
    let query = _populatePlaceholders(sql, values);
    if (process.env.DEBUG || process.env.CDS_DEBUG) {
        console.info('[cds-pg]', '-', 'sql > ', query);
    }
    const postPropertyMapper = getPostProcessMapper(PG_TYPE_CONVERSION_MAP, model, cqn);
    return _executeSelectSQL(dbc, query, values, cqn.SELECT.one, postPropertyMapper);
}





module.exports = {
    processExpand,
    processSimpleSQL
}