const { FunctionBuilder } = require('@sap/cds-runtime/lib/db/sql-builder/');

class CustomFunctionBuilder extends FunctionBuilder {
  get ExpressionBuilder() {
    const ExpressionBuilder = require('./CustomExpressionBuilder')
    Object.defineProperty(this, 'ExpressionBuilder', { value: ExpressionBuilder })
    return ExpressionBuilder
  }

  get ReferenceBuilder() {
    const ReferenceBuilder = require('./CustomReferenceBuilder')
    Object.defineProperty(this, 'ReferenceBuilder', { value: ReferenceBuilder })
    return ReferenceBuilder
  }

  get SelectBuilder() {
    const SelectBuilder = require('./CustomSelectBuilder')
    Object.defineProperty(this, 'SelectBuilder', { value: SelectBuilder })
    return SelectBuilder
  }

}

module.exports = CustomFunctionBuilder
