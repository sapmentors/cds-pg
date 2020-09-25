
const { ReferenceBuilder } = require('@sap/cds-runtime/lib/db/sql-builder')


class PGReferenceBuilder extends ReferenceBuilder {

    constructor(col, options, csn, isExpand) {
        super(col, options, csn)
        Object.defineProperty(this, 'isExpand', { value: isExpand });
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
      * @returns {{sql: string, values: Array}} Object with two properties.
      * SQL string for prepared statement and an empty array of values.
      */
    build() {
        this._outputObj = {
            sql: [],
            values: []
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
            } else if (Object.keys(this._obj).length === 1 && !this._options.isExpand) {
                this._parseReference(this._obj.ref)
            }
            else {
                ReferenceBuilder.prototype._parseReference.call(this, this._obj.ref)
            }
        } else {
            this._outputObj.sql.push(this._obj)
        }

        if (this._obj.hasOwnProperty('sort')) {
            this._outputObj.sql.push(this._obj.sort === 'desc' ? 'DESC' : 'ASC')
        }

        this._outputObj.sql = this._outputObj.sql.join(' ')
        return this._outputObj
    }

    /**
     * Override method and add "AS" part do the column name so that it matches the CDS model
     * @param {*} refArray 
     */
    _parseReference(refArray) {
        if (refArray[0].id) {
            throw new Error(`${refArray[0].id}: Views with parameters supported only on HANA`)
        }
        this._outputObj.sql.push(refArray.map(el => `${this._quoteElement(el)} AS "${el}" `).join('.'))
    }

}



module.exports = PGReferenceBuilder;