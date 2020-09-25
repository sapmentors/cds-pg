const { SQLITE_TYPE_CONVERSION_MAP } = require('./conversion')
const CustomBuilder = require('./customBuilder')
const { sqlFactory } = require('@sap/cds-runtime/lib/db/sql-builder/');
const { createJoinCQNFromExpanded, hasExpand, rawToExpanded } = require('@sap/cds-runtime/lib/db/expand')
const { getPostProcessMapper, postProcess } = require('@sap/cds-runtime/lib/db/data-conversion/post-processing')

const Placeholder = require('./utils/Placeholder');

function executeSelectSQL(dbc, sql, values, isOne, postMapper) {
    sql = _replaceQuestionCounts(sql);
    return dbc.query(sql, values).then((result) => {
        return postProcess(result.rows, postMapper);
    });
}

function executeSelectCQN(model, dbc, query, user, locale, txTimestamp) {
    if (hasExpand(query)) {
        return _processExpand(model, dbc, query, user, locale, txTimestamp)
    }
    Placeholder.reset()
    const { sql, values = [] } = sqlFactory(
        query,
        {
            user: user,
            customBuilder: CustomBuilder,
            now: txTimestamp || { sql: "strftime('%Y-%m-%dT%H:%M:%fZ','now')" } // '2012-12-03T07:16:23.574Z'
        },
        model
    )

    return executeSelectSQL(
        dbc,
        sql,
        values,
        query.SELECT.one,
        getPostProcessMapper(SQLITE_TYPE_CONVERSION_MAP, model, query)
    )
}



function _processExpand(model, dbc, cqn, user, locale, txTimestamp) {
    const queries = []
    const expandQueries = createJoinCQNFromExpanded(cqn, model, false, locale)

    for (const cqn of expandQueries.queries) {
        cqn._conversionMapper = getPostProcessMapper(SQLITE_TYPE_CONVERSION_MAP, model, cqn)

        // REVISIT
        // Why is the post processing in expand different?
        const { sql, values } = sqlFactory(cqn, {
            user,
            now: txTimestamp,
            customBuilder: CustomBuilder
        })
        queries.push(executeSelectSQL(dbc, sql, values, false))
    }

    return rawToExpanded(expandQueries, queries, cqn.SELECT.one)
}


async function executeInsertCQN(model, dbc, query, user, locale, txTimestamp) {
    const { sql, values = [] } = sqlFactory(
        query,
        {
            user: user,
            customBuilder: CustomBuilder,
            now: txTimestamp || { sql: "strftime('%Y-%m-%dT%H:%M:%fZ','now')" } // '2012-12-03T07:16:23.574Z'
        },
        model
    )
    //const vals = await _convertStreamValues(values)
    return executeInsertSQL(dbc, sql, values)
}

function executeInsertSQL(dbc, sql, values) {
    return new Promise((resolve, reject) =>
        dbc.run(sql, values, function (err) {
            err ? reject(Object.assign(err, { query: sql })) : resolve([this.lastID])
        })
    )
}

function _executeSimpleSQL(dbc, sql, values) {
    return new Promise((resolve, reject) => {
        dbc.run(sql, values, function (err) {
            if (err) {
                err.query = sql
                return reject(err)
            }
            resolve(this.changes)
        })
    })
}

function executePlainSQL(dbc, sql, values, isOne, postMapper) {
    // support named binding parameters
    if (values && typeof values === 'object' && !Array.isArray(values)) {
        values = new Proxy(values, {
            getOwnPropertyDescriptor: (o, p) => Object.getOwnPropertyDescriptor(o, p.slice(1)),
            get: (o, p) => o[p.slice(1)],
            ownKeys: o => Reflect.ownKeys(o).map(k => `:${k}`)
        })
    }

    if (/^\s*(select|pragma)/i.test(sql)) {
        return executeSelectSQL(dbc, sql, values, isOne, postMapper)
    }

    if (/^\s*insert/i.test(sql)) {
        return executeInsertSQL(dbc, sql, values)
    }

    return _executeSimpleSQL(dbc, sql, Array.isArray(values[0]) ? values[0] : values)
}

function executeGenericCQN(model, dbc, cqn, user, locale, txTimestamp) {
    const { sql, values = [] } = sqlFactory(
        cqn,
        {
            user: user,
            customBuilder: CustomBuilder,
            now: txTimestamp || { sql: "strftime('%Y-%m-%dT%H:%M:%fZ','now')" } // '2012-12-03T07:16:23.574Z'
        },
        model
    )

    return executePlainSQL(dbc, sql, values)
}


/**
 * Replaces all ? in the sql string with indexed placeholders require for Postgres.
 * 
 * @param {string} sql 
 */
function _replaceQuestionCounts(sql) {
    var questionCount = 0;
    return sql.replace(/(\\*)(\?)/g, (match, escapes) => {
        if (escapes.length % 2) {
            return '?';
        } else {
            questionCount++;
            return '$' + questionCount;
        }
    });
}


module.exports = {
    insert: executeInsertCQN,
    select: executeSelectCQN,
    cqn: executeGenericCQN,
    sql: executePlainSQL
}