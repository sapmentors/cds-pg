/**
 * csn to Postgres' sql compiler
 * @param {Object} query in csn
 * @returns {String} postgresql sql query
 */
function cqn2pgsql(query) {
  if (process.env.DEBUG || process.env.CDS_DEBUG) {
    console.info('[cds-pg]', '-', 'query >\n', query)
  }

  let sql = ''
  switch (query.cmd) {
    case 'SELECT': {
      const cqn = query.SELECT
      sql =
        `${query.cmd} ${cqn.columns.map((col) => `${col.ref[0]} AS "${col.ref[0]}"`).join(', ')} ` +
        `FROM ${cqn.from.ref[0].replace('.', '_')}`
      if (cqn.where) {
        // <key> = '<value>', e.g. ID='some-guid-here'
        sql += ` WHERE ${cqn.where
          .map((cond) => {
            if (cond.ref) {
              return cond.ref[0]
            } else if (cond.val) {
              return `'${cond.val}'`
            } else {
              return cond
            }
          })
          .join('')}`
      }
      if (cqn.limit && cqn.limit.rows) {
        sql += ` LIMIT ${cqn.limit.rows.val}`
      }
      if (cqn.limit && cqn.limit.offset) {
        sql += ` OFFSET ${cqn.limit.offset.val}`
      }
      break
    }
    default: {
      break
    }
  }
  if (process.env.DEBUG || process.env.CDS_DEBUG) {
    console.info('[cds-pg]', '-', 'sql > ', sql)
  }
  return sql
}

module.exports = cqn2pgsql
