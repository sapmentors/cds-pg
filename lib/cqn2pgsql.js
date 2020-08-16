function cqn2pgsql(query) {
  let sql = ''
  switch (query.cmd) {
    case 'SELECT': {
      /*
CQN:
{ SELECT: {
  from: {ref:['BeershopService.Beers']},
  columns: [ {ref:['ID']}, {ref:['name']} ],
  where: [ {ref:['abv']}, '>', {val:5} ],
  orderBy: [ {ref:[ 'ID' ], sort: 'asc' } ],
  limit: { rows: {val:1}, offset: {val:1} }
}}
Needed SQL
'SELECT "ID", "name" FROM "BeershopService_Beers" AS "Beers";'
*/
      const cqn = query.SELECT
      sql =
        `${query.cmd} ${cqn.columns.map((col) => `${col.ref[0]} AS "${col.ref[0]}"`).join(', ')} ` +
        `FROM ${cqn.from.ref[0].replace('.', '_')}`
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
  return sql
}

module.exports = cqn2pgsql
