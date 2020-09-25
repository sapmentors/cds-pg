const convertToBoolean = boolean => {
  if (boolean === null) {
    return null
  }

  return Boolean(boolean)
}

const convertInt64ToString = int64 => {
  if (int64 === null) {
    return null
  }

  return String(int64)
}

const convertToISO = element => {
  if (element) {
    return new Date(element + 'Z').toISOString()
  }

  return null
}

const convertToISONoMillis = element => {
  if (element) {
    const dateTime = new Date(element + 'Z').toISOString()
    return dateTime.slice(0, 19) + dateTime.slice(23)
  }

  return null
}

const convertToString = element => {
  if (element) {
    return element instanceof Buffer ? Buffer.from(element, 'base64').toString() : element
  }

  return null
}

const PG_TYPE_CONVERSION_MAP = new Map([
  ['cds.Boolean', convertToBoolean],
  ['cds.Integer64', convertInt64ToString],
  ['cds.DateTime', convertToISONoMillis],
  ['cds.Timestamp', convertToISO],
  ['cds.LargeString', convertToString]
])

module.exports = {
  PG_TYPE_CONVERSION_MAP
}
