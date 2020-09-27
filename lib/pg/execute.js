const { createJoinCQNFromExpanded, rawToExpanded } = require('@sap/cds-runtime/lib/db/expand')
const { sqlFactory } = require('@sap/cds-runtime/lib/db/sql-builder')
const { PGSelectBuilder, PGResourceBuilder } = require('./sql-builder')
const { postProcess, getPostProcessMapper } = require('./data-conversion/post-processing')
const { PG_TYPE_CONVERSION_MAP } = require('./converters/conversion')

/**
 * Transforms the CQN notation to SQL
 *
 * @param {csn definition} model
 * @param {cqn } query
 * @param {called with expand} isExpand
 */
function _cqnToSQL(model, query, isExpand = false) {
  return _replacePlaceholders(
    sqlFactory(
      query,
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
 * @param {*} sql
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
  return dbc.query(sql, values).then((result) => {
    result = isOne && result.rows.length > 0 ? result.rows[0] : result.rows

    return postProcess(result, postMapper, propertyMapper, objStructMapper)
  })
}

/**
 * process requests with expand
 * @param {*} dbc
 * @param {*} cqn
 * @param {*} model
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

    queries.push(_executeSelectSQL(dbc, sql, values, false, postPropertyMapper))
  }

  return rawToExpanded(expandQueries, queries, cqn.SELECT.one)
}

/**
 *  Process nomal select statement
 * @param {} dbc
 * @param {*} cqn
 * @param {*} model
 */
const processSelectSQL = (dbc, cqn, model) => {
  const { sql, values = [] } = _cqnToSQL(model, cqn)
  if (process.env.DEBUG || process.env.CDS_DEBUG) {
    console.info('[cds-pg]', '-', 'sql > ', sql)
  }
  const postPropertyMapper = getPostProcessMapper(PG_TYPE_CONVERSION_MAP, model, cqn)
  return _executeSelectSQL(dbc, sql, values, cqn.SELECT.one, postPropertyMapper)
}

/**
 *  Process nomal select statement
 * @param {} dbc
 * @param {*} cqn
 * @param {*} model
 */
const processSimpleSQL = (dbc, cqn, model) => {
  const { sql, values = [] } = _cqnToSQL(model, cqn)
  if (process.env.DEBUG || process.env.CDS_DEBUG) {
    console.info('[cds-pg]', '-', 'sql > ', sql)
  }
  const postPropertyMapper = getPostProcessMapper(PG_TYPE_CONVERSION_MAP, model, cqn)
  return _executeSelectSQL(dbc, sql, values, false, postPropertyMapper)
}

/**
 * Executes an SQL statement against the datbase.
 * @param {*} dbc
 * @param {*} sql
 * @param {*} values
 */
function executeRawSQL(dbc, sql, values) {
  if (process.env.DEBUG || process.env.CDS_DEBUG) {
    console.info('[cds-pg]', '-', 'sql > ', sql)
  }
  return dbc.query(sql, values)
}

module.exports = {
  processExpand,
  processSelectSQL,
  processCQN: processSimpleSQL,
  processSQL: executeRawSQL,
}
