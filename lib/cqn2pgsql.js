function cqn2pgsql(query) {
  let sql = ''
  switch (query.cmd) {
    case 'SELECT': {
      /*
CQN:
{ SELECT: {
  from: {ref:['BeershopService.Beers']},
  columns: [ {ref:['ID']}, {ref:['name']} ],
  orderBy: [ {ref:[ 'ID' ], sort: 'asc' } ],
  limit: { rows: {val:1000} }
}}
Needed SQL
'SELECT "ID", "name" FROM "BeershopService_Beers" AS "Beers";'
*/
      const cqn = query.SELECT
      sql = `${query.cmd} ${cqn.columns.map((col) => `"${col.ref[0]}"`).join(', ')} FROM "${cqn.from.ref[0].replace(
        '.',
        '_'
      )}"`
      break
    }
    default: {
      break
    }
  }
  return sql
}

module.exports = cqn2pgsql
