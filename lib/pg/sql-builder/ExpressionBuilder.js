const ExpressionBuilder = require('@sap/cds/libx/_runtime/db/sql-builder/ExpressionBuilder')

/**
 * ExpressionBuilder is used to take a part of a CQN object as an input and to build an object representing an expression
 * with SQL string and values to be used with a prepared statement.
 * The outer property 'xpr' can be omitted.
 * @example <caption>Example of xpr part of CQN </caption>
 * {
 *  xpr: [{ref: ['x']}, '<', {val: 9}]
 * }
 *
 * Each operand of the xpr can be a nested xpr.
 */
class PGExpressionBuilder extends ExpressionBuilder {
  /**
   * The constructor of the ExpressionBuilder.
   * If the options parameter is not specified, " are used as delimiter and ? as placeholders.
   *
   * @param {object} obj - Part of the CQN object that represents an expression
   * @param {object} [options] - The configuration object.
   * @param {string} [options.delimiter] - The delimiter string.
   * @param {string} [options.placeholder] - The placeholder for prepared statement.
   * @param {string} [options.objectKey] - The object key for the expression. It can be either "xpr" or empty string.
   * @param {object} csn - The csn object
   * Default is an empty string.
   */
  constructor(obj, options, csn) {
    super(obj, options, csn)
  }

  // hook in our *builder for Postgres

  get SelectBuilder() {
    const SelectBuilder = require('./SelectBuilder')
    Object.defineProperty(this, 'SelectBuilder', { value: SelectBuilder })
    return SelectBuilder
  }

  get ReferenceBuilder() {
    const ReferenceBuilder = require('./ReferenceBuilder')
    Object.defineProperty(this, 'ReferenceBuilder', { value: ReferenceBuilder })
    return ReferenceBuilder
  }

  // here we finally reach the PG function builder
  get FunctionBuilder() {
    const FunctionBuilder = require('./FunctionBuilder')
    Object.defineProperty(this, 'FunctionBuilder', { value: FunctionBuilder })
    return FunctionBuilder
  }
}

module.exports = PGExpressionBuilder
