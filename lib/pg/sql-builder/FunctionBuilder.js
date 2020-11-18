const FunctionBuilder = require('@sap/cds-runtime/lib/db/sql-builder/FunctionBuilder')

/**
 * FunctionBuilder is used to take a part of a CQN object as an input and to build an object representing a function
 * with SQL string and values.
 *
 */
class PGFunctionBuilder extends FunctionBuilder {
  // wire in pg-*
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

  /**
   * overwriting original handling of odata's concat() call
   * in order to un-AS the inclusion of a field via the reference builder
   *
   * @param {*} args
   */
  _handleConcat(args) {
    const res = []
    for (const arg of args) {
      if (arg.ref) {
        const { sql, values } = new this.ReferenceBuilder(arg, this._options, this._csn).build(
          false /* don't add AS field aliases */
        )
        res.push(sql)
        this._outputObj.values.push(...values)
      } else if (arg.val) {
        if (typeof arg.val === 'number') {
          res.push(arg.val)
        } else {
          this._outputObj.values.push(arg.val)
          res.push(this._options.placeholder)
        }
      } else if (typeof arg === 'string') {
        res.push(arg)
      } else if (arg.func) {
        const { sql, values } = new FunctionBuilder(arg, this._options, this._csn).build()
        res.push(sql)
        this._outputObj.values.push(...values)
      }
    }
    this._outputObj.sql.push('(')
    this._outputObj.sql.push(res.join(' || '))
    this._outputObj.sql.push(')')
  }

  _handleFunction() {
    const functionName = this._functionName(this._obj)

    let args = this._functionArgs(this._obj)
    // pg-specific: flag
    // pg-specific: locate -> POSITION
    if (functionName.toLowerCase() === 'locate') {
      this.handleLocate(args)
      return
    }
    if (functionName.toLowerCase().includes('contains')) {
      this._handleContains(args)
      return
    }
    if (functionName.toLowerCase() === 'concat') {
      this._handleConcat(args)
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
}

module.exports = PGFunctionBuilder
