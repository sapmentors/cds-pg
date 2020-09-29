const { createJoinCQNFromExpanded, rawToExpanded } = require('@sap/cds-runtime/lib/db/expand')
const { sqlFactory } = require('@sap/cds-runtime/lib/db/sql-builder')
const { PGSelectBuilder, PGResourceBuilder } = require('./sql-builder')
const { postProcess, getPostProcessMapper } = require('./data-conversion/post-processing')
const { PG_TYPE_CONVERSION_MAP } = require('./converters/conversion')

// REVISIT
// This is based on the internal @sap/cds-runtime client and should work fow now. It definitly should be
// refactored, but propably after the next @sap/cds-runtime update, because it looks the internal structure
// there will also be subject to change.

/**
 * Processes a generic CQN statement and executes the query against the database.
 * The result rows are processed and returned.
 *
 * @param {import('pg').PoolClient} dbc
 * @param {Object} cqn
 * @param {Object} model
 * @return {import('pg').QueryArrayResult} the
 */
const processCQN = (dbc, cqn, model) => {
  const { sql, values = [] } = _cqnToSQL(model, cqn)
  const isOne = cqn.SELECT && cqn.SELECT.one

  if (process.env.DEBUG || process.env.CDS_DEBUG) {
    console.info('[cds-pg]', '-', 'sql > ', sql)
  }
  const postPropertyMapper = getPostProcessMapper(PG_TYPE_CONVERSION_MAP, model, cqn)
  return _executeSQLReturningRows(dbc, sql, values, isOne, postPropertyMapper)
}

/**
 * Processes an INSERT CQN statement which is modified to return the inserted rows.
 * The result rows are processed and returned.
 *
 * @param {import('pg').PoolClient} dbc
 * @param {Object} cqn
 * @param {Object} model
 * @return {import('pg').QueryArrayResult} the
 */
const processInsertCQN = (dbc, cqn, model) => {
  const { sql, values = [] } = _cqnToSQL(model, cqn)
  if (process.env.DEBUG || process.env.CDS_DEBUG) {
    console.info('[cds-pg]', '-', 'sql > ', sql)
  }
  const postPropertyMapper = getPostProcessMapper(PG_TYPE_CONVERSION_MAP, model, cqn)
  return _executeSQLReturningRows(dbc, _appendReturning(sql), values, false, postPropertyMapper)
}

/**
 * Executes a raw SQL statement against the database.
 *
 * @param {import('pg').PoolClient} dbc
 * @param {String} sql
 * @param {String} [values]
 * @return {Array} the result rows
 */
async function processRawSQL(dbc, sql, values) {
  if (process.env.DEBUG || process.env.CDS_DEBUG) {
    console.info('[cds-pg]', '-', 'sql > ', sql)
    values ? console.info('[cds-pg]', '-', 'values > ', values) : null
  }
  const result = await dbc.query(sql)
  return result.rows
}

/**
 * Processes requests with expands.
 *
 * @param {import('pg').PoolClient} dbc
 * @param {Object} cqn
 * @param {Object} model
 * @return {import('pg').QueryArrayResult} the
 */
const processExpand = (dbc, cqn, model) => {
  let queries = []
  const expandQueries = createJoinCQNFromExpanded(cqn, model, true)
  for (const cqn of expandQueries.queries) {
    // REVISIT
    // Why is the post processing in expand different?
    const { sql, values } = _cqnToSQL(model, cqn, true)

    if (process.env.DEBUG || process.env.CDS_DEBUG) {
      console.info('[cds-pg]', '-', 'sql > ', sql)
    }
    const postPropertyMapper = getPostProcessMapper(PG_TYPE_CONVERSION_MAP, model, cqn)

    queries.push(_executeSQLReturningRows(dbc, sql, values, false, postPropertyMapper))
  }

  return rawToExpanded(expandQueries, queries, cqn.SELECT.one)
}

/**
 * Transforms the CQN notation to SQL
 *
 * @param {Object} model
 * @param {Object} cqn
 * @param {Boolean} isExpand
 * @return {Object} the query object containing sql and values
 */
function _cqnToSQL(model, cqn, isExpand = false) {
  return _replacePlaceholders(
    sqlFactory(
      cqn,
      {
        customBuilder: {
          SelectBuilder: PGSelectBuilder,
          ResourceBuilder: PGResourceBuilder,
        },
        isExpand,
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
  query.sql += ' Returning *'
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
  let rawResult = await dbc.query(sql, values)
  const result = isOne && rawResult.rows.length > 0 ? rawResult.rows[0] : rawResult.rows
  return postProcess(result, postMapper, propertyMapper, objStructMapper)
}

module.exports = {
  processExpand,
  processCQN,
  processInsertCQN,
  processRawSQL,
}
