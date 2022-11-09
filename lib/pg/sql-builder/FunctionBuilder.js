const FunctionBuilder = require('@sap/cds/libx/_runtime/db/sql-builder/FunctionBuilder')

/**
 * FunctionBuilder is used to take a part of a CQN object as an input and to build an object representing a function
 * with SQL string and values.
 *
 */
class PGFunctionBuilder extends FunctionBuilder {
  // wire in PG.*Builder()

  get ReferenceBuilder() {
    const PGReferenceBuilder = require('./ReferenceBuilder')
    Object.defineProperty(this, 'ReferenceBuilder', { value: PGReferenceBuilder })
    return PGReferenceBuilder
  }

  get SelectBuilder() {
    const PGSelectBuilder = require('./SelectBuilder')
    Object.defineProperty(this, 'SelectBuilder', { value: PGSelectBuilder })
    return PGSelectBuilder
  }

  /**
   * PostgreSQL's handling of finding a specified substring within a string
   * OData: indexof
   * SQL: locate()
   * PostgreSQL: position()
   *
   * @see this._outputObj.sql
   * @see this._outputObj.values
   *
   * @param {*} args
   */
  handleLocate(args) {
    // use framework for values only
    const { values } = new this.ReferenceBuilder(this._obj, this._options, this._csn).build()
    const haystack = this._columns(args)[0].ref.join('')
    const needle = values[0]
    const sql = `position(? in ${haystack})`
    this._outputObj.sql.push(sql)
    this._outputObj.values.push(needle)
    return
  }

  _handleFunction() {
    const functionName = this._functionName(this._obj)

    let args = this._functionArgs(this._obj)
    if (functionName.includes('startswith') || functionName.includes('endswith')) {
      this._handleLikewiseFunc(args)
      return
    }
    // pg-specific: locate -> position
    if (functionName.toLowerCase() === 'locate') {
      this.handleLocate(args)
      return
    }
    if (functionName.toLowerCase().includes('contains')) {
      this._handleContains(args)
      return
    }
    if (functionName === 'concat') {
      this._addFunctionArgs(args, true, ' || ')
      return
    }
    this._outputObj.sql.push(functionName, '(')
    if (typeof args === 'string') {
      this._outputObj.sql.push(args, ')')
    } else {
      this._addFunctionArgs(args)
      this._outputObj.sql.push(')')
    }
  }

  _createLikeComparisonForColumn(not, left, right) {
    if (not) {
      this._outputObj.sql.push('(', left, 'IS NULL', 'OR')
    }

    this._outputObj.sql.push(left, `${not}ILIKE`) // This 'ILIKE' change case-sensitive issue #358.
    this._addFunctionArgs(right, true, ' || ')
    this._outputObj.sql.push('ESCAPE', "'^'")
    if (not) this._outputObj.sql.push(')')
  }
}

module.exports = PGFunctionBuilder
