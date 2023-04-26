const { getEntityNameFromCQN, traverseFroms } = require('@sap/cds/libx/_runtime/common/utils/entityFromCqn')
const { ensureNoDraftsSuffix } = require('@sap/cds/libx/_runtime/common/utils/draft')
const { proxifyIfFlattened } = require('@sap/cds/libx/common/utils/ucsn')
const cds = global.cds || require('@sap/cds/lib')

const _getCastFunction = ({ type }) => {
  switch (type) {
    case 'cds.Boolean':
      return Boolean
    case 'cds.Integer':
    case 'cds.UInt8':
    case 'cds.Int16':
    case 'cds.Int32':
      return Number
    default:
      return String
  }
}

const _structElement = (definition, structPath) => {
  if (definition.elements) {
    return _structElement(definition.elements[structPath[0]], structPath.slice(1))
  }

  return definition
}

const _getNestedElement = (entity, key) => {
  if (entity.elements[key]) return entity.elements[key]

  const structPath = entity._flat2struct[key]
  if (!structPath) return

  return _structElement(entity, structPath)
}

const _structure = (csnEntity) => (value, key, row, unaliasedKey) => {
  proxifyIfFlattened(csnEntity, row)
  const effectiveKey = unaliasedKey || key
  delete row[effectiveKey]
  row[effectiveKey] = value
}

const _addConverter = (mapper, name, converter) => {
  if (mapper.has(name)) {
    const oldConverter = mapper.get(name)
    mapper.set(name, (val, key, row, unaliasedKey) => {
      oldConverter(val, key, row, unaliasedKey)
      converter(row[unaliasedKey || key], key, row, unaliasedKey)
    })
  } else {
    mapper.set(name, converter)
  }
}

/**
 * Get a map of to be converted elements and their conversion functions.
 *
 * @param {Map} conversionMap - Mapping instructions for data conversions based on CDS data types
 * @param {object} csn - Reflected CSN
 * @param {object} cqn - CQN that is used to query the DB.
 * @returns {Map<any, any>}
 * @private
 */
// eslint-disable-next-line complexity
const _getMapperForListedElements = (conversionMap, csn, cqn) => {
  const mapper = new Map()

  const alias2entity = {}
  if (cqn.SELECT.from.args) {
    for (const each of cqn.SELECT.from.args) {
      const { entityName, alias } = getEntityNameFromCQN(each)
      let as = each.as || alias
      if (as) as = ensureNoDraftsSuffix(as) // > in comp2one, the alias gets suffixed with "_drafts"
      alias2entity[as] =
        csn.definitions[ensureNoDraftsSuffix(entityName)] || csn.definitions[entityName.replace(/\.drafts$/, '')]
    }
    // additionally, for deeply nested args, find pairs of single-element ref + as and build alias to entity mapping
    const ref2as = []
    traverseFroms(cqn.SELECT.from, (from) => ref2as.push({ ref: from.ref, as: from.as }))
    for (const each of ref2as) {
      alias2entity[each.as] =
        csn.definitions[ensureNoDraftsSuffix(each.ref[0])] || csn.definitions[each.ref[0].replace(/\.drafts$/, '')]
    }
  } else {
    const { entityName } = getEntityNameFromCQN(cqn)
    alias2entity[0] = csn.definitions[ensureNoDraftsSuffix(entityName)]
  }

  for (const col of cqn.SELECT.columns) {
    if (col.cast) {
      const name = col.as ? col.as : col.ref[col.ref.length - 1]
      const type = col.cast.type

      _addConverter(mapper, name, (val, key, row, unaliasedKey) => {
        if (conversionMap.has(type)) {
          row[unaliasedKey || key] = conversionMap.get(type)(val)
        } else {
          row[unaliasedKey || key] = _getCastFunction(col.cast)(val)
        }
      })

      continue
    }
    if (col.ref) {
      const name = col.ref[col.ref.length - 1]

      const entity =
        col.ref.length > 1
          ? alias2entity[col.ref[0]] || alias2entity[0]
          : alias2entity[0] || alias2entity[getEntityNameFromCQN(cqn).alias]
      if (!entity) {
        // REVISIT: should not be necessary, but HasActiveEntity is not always prefixed with alias
        if (col.ref.length === 1 && col.ref[0] === 'HasActiveEntity')
          _addConverter(mapper, col.as ? col.as : name, (val, key, row, unaliasedKey) => {
            row[unaliasedKey || key] = conversionMap.get('cds.Boolean')(val)
          })
        continue
      }

      const element = _getNestedElement(entity, name)
      if (!element) continue

      // REVISIT: _type is undefined for cds.hana.CLOB etc.
      const type = element._type || element.type
      if (conversionMap.has(type)) {
        _addConverter(mapper, col.as ? col.as : name, (val, key, row, unaliasedKey) => {
          row[unaliasedKey || key] = conversionMap.get(type)(val)
        })
      } else if (element.items) {
        _addConverter(mapper, col.as ? col.as : name, (val, key, row, unaliasedKey) => {
          const effectiveKey = unaliasedKey || key
          row[effectiveKey] = JSON.parse(val)
        }) // > arrayed elements
      }

      if (
        cds.env.features.ucsn_struct_conversion &&
        element.parent &&
        element.parent._isStructured &&
        !element._isStructured
      ) {
        _addConverter(mapper, col.as ? col.as : name, _structure(entity))
      }
    }
  }

  return mapper
}

/**
 * Based on CSN and CQN get a map on how to map the result.
 *
 * @param {Map} conversionMap - Mapping instructions for data conversions based on CDS data types
 * @param {object} csn - Reflected CSN
 * @param {object} cqn - CQN that is used to query the DB.
 * @returns {Map<any, any>}
 * @private
 */
const getPostProcessMapper = (conversionMap, csn = {}, cqn = {}) => {
  // No mapper defined or irrelevant as no READ request
  if (!Object.prototype.hasOwnProperty.call(cqn, 'SELECT')) {
    return new Map()
  }

  return cqn.SELECT.columns ? _getMapperForListedElements(conversionMap, csn, cqn) : new Map()
}

const _processRow = (mapper, row) => {
  if (!row) return
  for (const [columnName, converter] of mapper.entries()) {
    converter(row[columnName], columnName, row)
  }
}

/**
 * Post process the result as given by the db driver.
 *
 * @param {*} result - The result as returned by the db driver.
 * @param {Map} mapper - Instructions, how to transform.
 * @param {Map} propertyMapper - Instructions, how to rename properties.
 * @param {Map} objStructMapper - Instructions, how to rename properties.
 * @returns {*}
 * @private
 */
const postProcess = (result, mapper = new Map()) => {
  if (mapper.size === 0) return result

  if (Array.isArray(result)) for (const each of result) _processRow(mapper, each)
  else _processRow(mapper, result)

  return result
}

/*
 * this module is required by cds-pg. -> in case of incompatible changes, we should let them know.
 */
module.exports = {
  getPostProcessMapper,
  postProcess
}
