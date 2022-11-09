const { createJoinCQNFromExpanded, rawToExpanded, hasExpand } = require('@sap/cds/libx/_runtime/db/expand')
const { sqlFactory } = require('@sap/cds/libx/_runtime/db/sql-builder')
const { PGSelectBuilder, PGResourceBuilder, PGFunctionBuilder, PGExpressionBuilder } = require('./sql-builder')
const { postProcess, getPostProcessMapper } = require('@sap/cds/libx/_runtime/db/data-conversion/post-processing')
const { PG_TYPE_CONVERSION_MAP } = require('./converters/conversion')
const { flattenArray } = require('./utils/deep')
const { remapColumnNames } = require('./utils/columns')
const DEBUG = cds.debug('cds-pg|sql')

/*
 * Those are the custom execution functions that generate and/or modify the SQL to run on Postgres.
 * The functionality is derived from the SQLite and HANA adapters (@see @sap/cds-runtime)
 */

/**
 * Processes a generic CQN statement and executes the query against the database.
 * The result rows are processed and returned.
 * @param {Object} model
 * @param {import('pg').PoolClient} dbc
 * @param {Object} query
 * @param {*} user
 * @param {String} locale
 * @param {*} txTimestamp
 * @return {import('pg').QueryArrayResult}
 */
const executeGenericCQN = (model, dbc, query, user, locale, txTimestamp) => {
  const { sql, values = [] } = _cqnToSQL(model, query, user, locale, txTimestamp)
  if (/^\s*insert/i.test(sql)) {
    return executeInsertCQN(model, dbc, query, user, locale, txTimestamp)
  }
  const isOne = query.SELECT && query.SELECT.one
  const postPropertyMapper = getPostProcessMapper(PG_TYPE_CONVERSION_MAP, model, query)
  return _executeSQLReturningRows(dbc, sql, values, isOne, postPropertyMapper)
}

/**
 * Processes a SELECT CQN statement and executes the query against the database.
 * The result rows are processed and returned.
 * @param {Object} model
 * @param {import('pg').PoolClient} dbc
 * @param {Object} query
 * @param {*} user
 * @param {String} locale
 * @param {*} txTimestamp
 * @return {import('pg').QueryArrayResult}
 */
const executeSelectCQN = (model, dbc, query, user, locale, txTimestamp) => {
  if (hasExpand(query)) {
    return processExpand(dbc, query, model, user, locale, txTimestamp)
  } else {
    const { sql, values = [] } = _cqnToSQL(model, query, user, locale, txTimestamp)
    const isOne = query.SELECT && query.SELECT.one
    const postPropertyMapper = getPostProcessMapper(PG_TYPE_CONVERSION_MAP, model, query)
    return _executeSQLReturningRows(dbc, sql, values, isOne, postPropertyMapper)
  }
}

/**
 * Handles INSERT statements which require a special treatment because batch
 * inserts are currently not supported by the node-postgres library.
 *
 * @see https://github.com/brianc/node-postgres/issues/2257
 * @param {Object} model
 * @param {import('pg').PoolClient} dbc
 * @param {Object} query
 * @param {*} user
 * @param {String} locale
 * @param {*} txTimestamp
 * @return {Array}
 */
const executeInsertCQN = async (model, dbc, cqn, user, locale, txTimestamp) => {
  const { sql, values = [] } = _cqnToSQL(model, cqn, user, locale, txTimestamp)
  const postPropertyMapper = getPostProcessMapper(PG_TYPE_CONVERSION_MAP, model, cqn)
  const resultPromises = []

  // Only bulk inserts will have arrays in arrays
  if (Array.isArray(values[0])) {
    for (const value of values) {
      resultPromises.push(_executeSQLReturningRows(dbc, _appendReturning(sql), value, false, postPropertyMapper))
    }
  } else {
    resultPromises.push(_executeSQLReturningRows(dbc, _appendReturning(sql), values, false, postPropertyMapper))
  }

  let results = await Promise.all(resultPromises)
  results = flattenArray(results)
  const entity = cqn.INSERT?.into?.ref?.[0] ? cqn.INSERT.into.ref[0] : cqn.INSERT.into
  results = results.map((result) => remapColumnNames(model.definitions[entity], result))
  return results
}

/**
 * Executes a raw SQL statement against the database.
 *
 * @param {import('pg').PoolClient} dbc
 * @param {String} sql
 * @param {String} [values]
 * @return {Array} the result rows
 */
async function executePlainSQL(dbc, rawSql, rawValues) {
  const { sql, values } = _replacePlaceholders({
    sql: rawSql,
    values: rawValues
  })

  DEBUG && DEBUG(sql, values)

  // values will be often undefined but is required for potential queries using placeholders
  const result = await dbc.query(sql, values)
  return result.rows
}

/**
 * Processes requests with expands.
 *
 * @param {import('pg').PoolClient} dbc
 * @param {Object} cqn
 * @param {Object} model
 * @param {*} user
 * @return {import('pg').QueryArrayResult} the
 */
const processExpand = (dbc, cqn, model, user, locale, txTimestamp) => {
  let queries = []
  const expandQueries = createJoinCQNFromExpanded(cqn, model, true)
  for (const cqn of expandQueries.queries) {
    // REVISIT
    // Why is the post processing in expand different?
    const { sql, values } = _cqnToSQL(model, cqn, user, locale, txTimestamp, true)
    const postPropertyMapper = getPostProcessMapper(PG_TYPE_CONVERSION_MAP, model, cqn)

    queries.push(_executeSQLReturningRows(dbc, sql, values, false, postPropertyMapper))
  }

  return rawToExpanded(expandQueries, queries, cqn.SELECT.one, cqn._target)
}

/**
 * Transforms the CQN notation to SQL
 *
 * @param {Object} model
 * @param {Object} cqn
 * @param {*} user
 * @param {Boolean} isExpand
 * @return {Object} the query object containing sql and values
 */
function _cqnToSQL(model, cqn, user, locale, txTimestamp, isExpand = false) {
  return _replacePlaceholders(
    sqlFactory(
      cqn,
      {
        customBuilder: {
          SelectBuilder: PGSelectBuilder,
          ResourceBuilder: PGResourceBuilder,
          ExpressionBuilder: PGExpressionBuilder,
          FunctionBuilder: PGFunctionBuilder
        },
        isExpand, // Passed to inform the select builder that we are dealing with an expand call
        now: txTimestamp || { sql: 'NOW ()' },
        user,
        locale
      },
      model,
      isExpand
    )
  )
}

/**
 * Placeholders in Postgres don't use ? but $1 $2, etc.
 * We just replace them here.
 *
 * @param {Object} query
 * @return {Object} the modified query
 */
const _replacePlaceholders = (query) => {
  var questionCount = 0
  query.sql = query.sql.replace(/(\\*)(\?)/g, (match, escapes) => {
    if (escapes.length % 2) {
      return '?'
    } else {
      questionCount++
      return '$' + questionCount
    }
  })
  return query
}

/**
 * Enriches INSERT statements with a Returning clause to enable
 * returning the inserted IDs.
 *
 * @param {Object} query
 * @return {Object} the modified query
 */
const _appendReturning = (query) => {
  query += ' Returning *'
  return query
}

/**
 * Executes a sql statement againt the database.
 *
 * @param {import('pg').PoolClient} dbc
 * @param {String} sql
 * @param {Array} values
 * @param {Boolean} isOne
 * @param {Function} postMapper
 * @param {Function} propertyMapper
 * @param {Function} objStructMapper
 * @returns {import('pg').QueryResult} the executed and processed result
 */
async function _executeSQLReturningRows(dbc, sql, values, isOne, postMapper, propertyMapper, objStructMapper) {
  DEBUG && DEBUG(sql, values)

  let rawResult = await dbc.query(sql, values)
  let result
  if (rawResult.command === 'UPDATE') {
    result = rawResult.rowCount
  } else if (isOne && rawResult.rows.length > 0) {
    result = rawResult.rows[0]
  } else if (isOne && rawResult.rows.length === 0) {
    result = null
  } else {
    result = rawResult.rows
  }
  return postProcess(result, postMapper, propertyMapper, objStructMapper)
}

const executeUpdateCQN = async (model, dbc, cqn, user, locale, txTimestamp) => {
  const result = await executeGenericCQN(model, dbc, cqn, user, locale, txTimestamp)
  return Array.isArray(result) ? result.length : result
}

module.exports = {
  delete: executeGenericCQN,
  insert: executeInsertCQN,
  update: executeUpdateCQN,
  read: executeSelectCQN,
  //stream: executeSelectStreamCQN,
  cqn: executeGenericCQN,
  sql: executePlainSQL
}
