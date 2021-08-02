const getColumns = require('@sap/cds/libx/_runtime/db/utils/columns')

/**
 * Postgres internally uses lowercase names and returns them when not specified with "as".
 * This function replaces the lowercase with the correct column names.
 *
 * Revisit: Maybe modify the INSERT...RETURNING statement directly.
 *
 * @param {Object} entity
 * @param {Object} result
 */
const remapColumnNames = (entity, result) => {
  if (typeof entity !== 'undefined') {
    const columns = getColumns(entity)
    const resultColumns = Object.keys(result)
    for (const column of columns) {
      if (resultColumns.includes(column.name.toLowerCase())) {
        if (column.name.toLowerCase() !== column.name) {
          result[column.name] = result[column.name.toLowerCase()]
          delete result[column.name.toLowerCase()]
        }
      }
    }
  }
  return result
}

module.exports = {
  remapColumnNames,
}
