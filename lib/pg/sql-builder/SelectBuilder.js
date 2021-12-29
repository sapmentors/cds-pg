// use custom expression builder only as "bridge"
// to custom function builder
const ExpressionBuilder = require('./ExpressionBuilder')
const FunctionBuilder = require('./FunctionBuilder')
const { SelectBuilder } = require('@sap/cds/libx/_runtime/db/sql-builder')
const ReferenceBuilder = require('./ReferenceBuilder')

class PGSelectBuilder extends SelectBuilder {
  // Getters and setters have to be overwritten becasue the originals only use the builders passes in the
  // first round of processing after that the refer back to the original builders.

  get ReferenceBuilder() {
    return this.ReferenceBuilder
  }

  set ReferenceBuilder(resourceBuilder) {
    this.SelectBuilder = resourceBuilder
  }

  get SelectBuilder() {
    return this.SelectBuilder
  }

  set SelectBuilder(selectBuilder) {
    this.SelectBuilder = selectBuilder
  }

  get FunctionBuilder() {
    return this.FunctionBuilder
  }
  set FunctionBuilder(functionBuilder) {
    this.FunctionBuilder = functionBuilder
  }

  // use custom expression builder only as "bridge"
  // to custom function builder
  get ExpressionBuilder() {
    return this.ExpressionBuilder
  }
  set ExpressionBuilder(expressionBuilder) {
    this.ExpressionBuilder = expressionBuilder
  }

  constructor(obj, options, csn) {
    super(obj, options, csn)
    Object.defineProperty(this, 'SelectBuilder', { value: PGSelectBuilder })
    Object.defineProperty(this, 'ReferenceBuilder', { value: ReferenceBuilder })
    Object.defineProperty(this, 'FunctionBuilder', { value: FunctionBuilder })
    Object.defineProperty(this, 'ExpressionBuilder', { value: ExpressionBuilder })
    this.excludedColumnTypes = ['cds.Association', 'cds.Composition']
  }

  /**
   * Override method and add "AS" part to the column name so that it matches the CDS model
   * in order to make the mapping simpler we always add the column name as its found in the
   * cds model. That way the returning data is directly mapped to the model
   */
  _columns(noQuoting) {
    if (this._obj.SELECT.columns) {
      // Special handling for $count requests to avoid
      // could not determine data type of parameter $1
      // described in issue #223
      if (this._obj.SELECT.columns.length === 1 && this._obj.SELECT.columns[0].func === 'count') {
        this._obj.SELECT.columns[0].args[0].val = 1
      } else {
        for (let index = 0; index < this._obj.SELECT.columns.length; index++) {
          const element = this._obj.SELECT.columns[index]
          if (!element.as) {
            if (element.ref && element.ref.length) {
              this._obj.SELECT.columns[index].as = element.ref[element.ref.length - 1]
            }
          }
        }
      }
    } else {
      // fill columns from entity definition
      // to avoid "does not exist in the given entity" error for a SELECT *
      this._obj.SELECT.columns = []
      if (this._obj.SELECT.from.ref[0]) {
        let name = this._obj.SELECT.from.ref[0].split('_')[0]
        if (!name) {
          name = this._obj.SELECT.from.ref[0]
        }
        let entity = this._csn.definitions[name]
        if (entity) {
          for (var prop in entity.elements) {
            if (!this.excludedColumnTypes.includes(entity.elements[prop].type)) {
              let column = {
                ref: [prop],
                as: prop
              }
              this._obj.SELECT.columns.push(column)
            }
          }
        }
      }
    }
    super._columns(noQuoting)
  }

  /**
   * overwriting the where builder to eliminate ref field aliases (x as "x") -
   * introduced rightfully via @see this.ReferenceBuilder._parseReference(),
   * they break OData string functions SQL generation
   */
  _where() {
    const where = new this.ExpressionBuilder(this._obj.SELECT.where, this._options, this._csn).build()
    // eliminate any ref field aliases (x as "x") in order not to break sql function handling
    where.sql = where.sql.replace(/(.*)(AS ".*")(.*)/gi, '$1$3')
    this._outputObj.sql.push('WHERE', where.sql)
    this._outputObj.values.push(...where.values)
  }

  _forUpdate() {
    this._outputObj.sql.push('FOR UPDATE')
    const sqls = []

    if (this._obj.SELECT.forUpdate.of) {
      for (const element of this._obj.SELECT.forUpdate.of) {
        const { sql } = new this.ReferenceBuilder(element, this._options, this._csn).build()
        sqls.push(sql)
      }

      if (sqls.length > 0) {
        this._outputObj.sql.push('OF', sqls.join(', '))
      }
    }

    if (Number.isInteger(this._obj.SELECT.forUpdate.wait)) {
      // PostgreSQL doesn't support UPDATE WAIT
      // https://www.postgresql.org/docs/current/sql-select.html
      // so we check we add NOWAIT when wait is zero
      if (this._obj.SELECT.forUpdate.wait === 0) {
        this._outputObj.sql.push('NOWAIT')
      }
    }
  }

  _from() {
    this._outputObj.sql.push('FROM')

    if (Object.prototype.hasOwnProperty.call(this._obj.SELECT.from, 'join')) {
      return this._fromJoin(this._obj.SELECT.from)
    }

    if (Object.prototype.hasOwnProperty.call(this._obj.SELECT.from, 'SET')) {
      return this._fromUnion(this._obj.SELECT)
    }
    // Pass from statement and as statement to ensure we have an alias for the table
    this._fromElement(this._obj.SELECT.from, this._obj.as)
  }

  _fromJoin(from) {
    for (let i = 0, len = from.args.length; i < len; i++) {
      if (from.args[i].args) {
        // nested joins
        this._fromJoin(from.args[i])
        // Sub select with Union
        /* Postgres always needs an alias for subqueries. The "as" parameter is not always by the 
      cqn object as the element and therefore has to be passed seperately 
      we could look into finding a better solution for this  */
      } else if (from.args[i].SELECT && from.args[i].SELECT.from.SET) {
        this._fromUnion(from.args[i].SELECT, from.args[i].as, from, i !== 0)
      } else {
        this._fromElement(from.args[i], from.args[i].as, from, i)
      }
    }
  }

  _fromElement(element, as, parent, i = 0) {
    let res

    if (element.ref) {
      // ref
      res = new this.ReferenceBuilder(element, this._options, this._csn).build()
    } else {
      // select
      res = new this.SelectBuilder(element, this._options, this._csn).build(true)
      res.sql = `(${res.sql})`
    }

    // an as (alias) should always be passed Postgres need it for its select statements
    if (element.as || as) {
      // identifier
      res.sql += ` ${this._quoteElement(element.as || as)}`
    }

    this._outputObj.values.push(...res.values)

    if (i === 0) {
      // first element
      this._outputObj.sql.push(res.sql)
    } else {
      // join
      this._outputObj.sql.push(parent.join.toUpperCase(), 'JOIN', res.sql)

      if (parent.on) {
        const { sql, values } = new this.ExpressionBuilder(parent.on, this._options, this._csn).build()

        this._outputObj.sql.push('ON', sql)
        this._outputObj.values.push(...values)
      }
    }
  }
}

module.exports = PGSelectBuilder
