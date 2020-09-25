
const { SelectBuilder } = require('@sap/cds-runtime/lib/db/sql-builder')

class PGSelectBuilder extends SelectBuilder {


    get ReferenceBuilder() {
        return this.ReferenceBuilder
    }

    set ReferenceBuilder(resourceBuilder) {
        this.SelectBuilder = resourceBuilder;
    }


    get SelectBuilder() {
        return this.SelectBuilder
    }

    set SelectBuilder(selectBuilder) {
        this.SelectBuilder = selectBuilder;
    }

    constructor(obj, options, csn) {
        super(obj, options, csn);
        Object.defineProperty(this, 'SelectBuilder', { value: PGSelectBuilder })
        const ReferenceBuilder = require('./ReferenceBuilder')
        Object.defineProperty(this, 'ReferenceBuilder', { value: ReferenceBuilder })
    }

    _from() {
        this._outputObj.sql.push('FROM')

        if (this._obj.SELECT.from.hasOwnProperty('join')) {
            return this._fromJoin(this._obj.SELECT.from)
        }

        if (this._obj.SELECT.from.hasOwnProperty('SET')) {
            return this._fromUnion(this._obj.SELECT)
        }

        this._fromElement(this._obj.SELECT.from, this._obj.as)
    }


    _fromJoin(from) {
        for (let i = 0, len = from.args.length; i < len; i++) {
            if (from.args[i].args) {
                // nested joins
                this._fromJoin(from.args[i])
                // Sub select with Union
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

module.exports = PGSelectBuilder;