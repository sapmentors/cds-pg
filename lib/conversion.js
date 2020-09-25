const convertToBoolean = boolean => {
  if (boolean === null) {
    return null
  }

  return Boolean(boolean)
}

const convertToDateString = value => {
  if (!value) {
    return null
  }

  return value
}

const convertInt64ToString = int64 => {
  if (int64 === null) {
    return null
  }

  return String(int64)
}

const convertToISOTime = value => {
  if (value === null) {
    return value
  }

  if (!value) {
    value = 0
  }

  return new Date(value).toISOString()
}

const convertToISONoMillis = element => {
  if (element) {
    const dateTime = new Date(element).toISOString()
    return dateTime.slice(0, 19) + dateTime.slice(23)
  }

  return null
}

const SQLITE_TYPE_CONVERSION_MAP = new Map([
  ['cds.Boolean', convertToBoolean],
  ['cds.Date', convertToDateString],
  ['cds.Integer64', convertInt64ToString],
  ['cds.DateTime', convertToISONoMillis],
  ['cds.Timestamp', convertToISOTime]
])

module.exports = { SQLITE_TYPE_CONVERSION_MAP }
