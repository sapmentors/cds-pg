const { UpdateBuilder } = require('@sap/cds-runtime/lib/db/sql-builder/');
const Placeholder = require('../../utils/Placeholder');

class CustomUpdateBuilder extends UpdateBuilder {
  get ReferenceBuilder() {
    const ReferenceBuilder = require('./CustomReferenceBuilder')
    Object.defineProperty(this, 'ReferenceBuilder', { value: ReferenceBuilder })
    return ReferenceBuilder
  }
  get ExpressionBuilder() {
    const ExpressionBuilder = require('./CustomExpressionBuilder')
    Object.defineProperty(this, 'ExpressionBuilder', { value: ExpressionBuilder })
    return ExpressionBuilder
  }

  _data(annotatedColumns) {
    const sql = []
    const data = this._obj.UPDATE.data || {}
    const withObj = this._obj.UPDATE.with || {}
    const dataObj = Object.assign({}, data, withObj) // with overwrites data, save in new object so CQN still looks the same
    const resMap = this._getFlattenColumnValues(dataObj)
    this._removeAlreadyExistingUpdateAnnotatedColumnsFromMap(annotatedColumns, resMap)

    this._addAnnotatedUpdateColumns(resMap, annotatedColumns)

    resMap.forEach((value, key, map) => {
      if (value && value.sql) {
        sql.push(`${this._quoteElement(key)} = ${value.sql}`)
        this._outputObj.values.push(...value.values)
      } else {
        sql.push(`${this._quoteElement(key)} = ${Placeholder.increment()}`)
        this._outputObj.values.push(value)
      }
    })

    this._outputObj.sql.push(`SET ${sql.join(', ')}`)
  }

}

module.exports = CustomUpdateBuilder
