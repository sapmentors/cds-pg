const { ReferenceBuilder } = require('@sap/cds-runtime/lib/db/sql-builder')

class PGReferenceBuilder extends ReferenceBuilder {
  constructor(col, options, csn, isExpand) {
    super(col, options, csn)
    Object.defineProperty(this, 'isExpand', { value: isExpand })
  }

  /**
   * Builds an Object based on the properties of the input object in the constructor.
   * @example <caption>Example output</caption>
   * {
   *    sql: '"X" as "X",
   *    values: []
   * }
   * {
   *    sql: '"func_name(?,?)"',
   *    values: [1, 'a']
   * }
   *
   *
   * @param {boolean} [doAlias=true] whether to add the "AS" alias of a field in SQL via the param reference parseer
   *
   * @returns {{sql: string, values: Array}} Object with two properties.
   * SQL string for prepared statement and an empty array of values.
   */
  build(doAlias = true) {
    this._outputObj = {
      sql: [],
      values: [],
    }

    if (this._isFunction()) {
      const { sql, values } = new this.FunctionBuilder(this._obj, this._options, this._csn).build()
      this._outputObj.sql.push(sql)
      this._outputObj.values.push(...values)
    } else if (this._obj.ref) {
      // reference
      if (this._obj.param) {
        this._parseParamReference(this._obj.ref)
        // expand only call override if not expand
        // we pass an extra parameter isExpand to the options object to signal that we
        // are handling an expand call and will have subselects
      } else if (Object.keys(this._obj).length === 1 && !this._options.isExpand) {
        this._parseReference(this._obj.ref, doAlias)
      } else {
        ReferenceBuilder.prototype._parseReference.call(this, this._obj.ref, doAlias)
      }
    } else {
      this._outputObj.sql.push(this._obj)
    }

    if (Object.prototype.hasOwnProperty.call(this._obj, 'sort')) {
      this._outputObj.sql.push(this._obj.sort === 'desc' ? 'DESC' : 'ASC')
    }

    this._outputObj.sql = this._outputObj.sql.join(' ')
    return this._outputObj
  }

  /**
   * Override method and add "AS" part do the column name so that it matches the CDS model
   * in order to make the mapping simpler we always add the column name as its found in the
   * cds model. That way the returning data is directly mapped to the model
   * @param {*} refArray
   * @param {boolean} [doAlias=true] whether to add the "AS" alias of a field in SQL
   * @override
   */
  _parseReference(refArray, doAlias = true) {
    if (refArray[0].id) {
      throw new Error(`${refArray[0].id}: Views with parameters supported only on HANA`)
    }

    const entity = this._csn && this._csn.definitions[this._options.entityName]
    const element = entity && entity.elements[refArray[0]]
    if (element && element.elements) {
      // REVISIT we assume that structured elements are already unfolded here
      this._outputObj.sql.push(refArray.join('_'))
      return
    }

    // don't add the AS part when we're working a function
    if (doAlias) {
      this._outputObj.sql.push(refArray.map((el) => `${this._quoteElement(el)} AS "${el}" `).join('.'))
    } else {
      this._outputObj.sql.push(refArray.map((el) => this._quoteElement(el)).join('.'))
    }
  }
}

module.exports = PGReferenceBuilder
