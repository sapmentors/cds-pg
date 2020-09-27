const { hasExpand } = require('@sap/cds-runtime/lib/db/expand')
const { processExpand, processSelectSQL } = require('../execute')

/**
 * Attaches the count to the result.
 *
 * @see @sap/cds-runtime/lib/db/query/read.js
 * @param {*} a
 * @param {*} count
 */
function _arrayWithCount(a, count) {
  const _map = a.map
  const map = (..._) => _arrayWithCount(_map.call(a, ..._), count)
  return Object.defineProperties(a, {
    $count: { value: count, enumerable: false, configurable: true, writable: true },
    map: { value: map, enumerable: false, configurable: true, writable: true },
  })
}

/**
 * Clones a query and creates one with count.
 *
 * @see @sap/cds-runtime/lib/db/query/read.js
 * @param {cqn} query
 */
function _createCountQuery(query) {
  const _query = JSON.parse(JSON.stringify(query))
  _query.SELECT.columns = [{ func: 'count', args: [{ ref: ['1'] }], as: 'counted' }]
  delete _query.SELECT.groupBy
  delete _query.SELECT.limit
  delete _query.SELECT.orderBy // not necessary to keep that
  // Also change columns in sub queries
  if (_query.SELECT.from.SET) {
    _query.SELECT.from.SET.args.forEach((subCountQuery) => {
      subCountQuery.SELECT.columns = [{ ref: ['1'] }]
    })
  }
  return _query
}

/**
 *
 * @param {*} dbc
 * @param {*} cqn
 * @param {*} model
 */
async function handleRead(dbc, cqn, model) {
  // Count handling borrowed from @sap/cds-runtime/lib/db/query/read.js
  if (cqn.SELECT.count) {
    if (cqn.SELECT.limit) {
      const countQuery = _createCountQuery(cqn)
      return Promise.all([
        processSelectSQL(dbc, countQuery, model),
        processSelectSQL(dbc, cqn, dbc),
      ]).then(([countResult, result]) => _arrayWithCount(result, countResult[0].counted))
    } else {
      return processSelectSQL(dbc, cqn, model).then((result) => _arrayWithCount(result, result.length))
    }
  }

  if (hasExpand(cqn)) {
    return processExpand(dbc, cqn, model)
  }
  return processSelectSQL(dbc, cqn, model)
}

module.exports = handleRead
