const {
  InsertBuilder,
  SelectBuilder,
  UpdateBuilder,
  DeleteBuilder
} = require('../node_modules/@sap/cds-runtime/lib/db/sql-builder/');

/**
 * csn to Postgres' sql compiler
 * @param {Object} query in csn
 * @returns {String} postgresql sql query
 */
function cqn2pgsql(query, csn) {
  if (process.env.DEBUG || process.env.CDS_DEBUG) {
    console.info('[cds-pg]', '-', 'query >\n', query)
  }

  let sql = ''
  switch (query.cmd) {
    case 'SELECT': {
      const builder = new SelectBuilder(query, {}, csn);
      sql = builder.build();
      sql.sql = _replaceQuestionCounts(sql.sql);
      break
    }
    case 'INSERT': {
      const builder = new InsertBuilder(query, {}, csn);
      sql = builder.build();

      // TODO: Make bulk insert
      if (Array.isArray(sql.values[0])) {
        sql.values = sql.values[0];
      }

      sql.sql = _replaceQuestionCounts(sql.sql);
      break;
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

// TODO: Use this
function _transformToPreparedStatement(options) {
  return {
    name: 'fetch-user',
    text: options.query,
    values: options.values
  }
}

module.exports = cqn2pgsql
