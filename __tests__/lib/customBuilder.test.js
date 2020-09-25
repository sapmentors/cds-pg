const CustomBuilder = require('../../lib/customBuilder');
const sqlFactory = require('../../lib/sqlFactory');

describe('CQN to PostgreSQL', () => {

    beforeAll(async () => {
        this.csn = await cds.load('./__tests__/__assets__/cap-proj/db/schema.cds');

        // Helper function 
        this.runQuery = (query) => sqlFactory(
            query,
            {
                user: cds.user,
                customBuilder: CustomBuilder,
                now: { sql: "strftime('%Y-%m-%dT%H:%M:%fZ','now')" } // '2012-12-03T07:16:23.574Z'
            },
            cds.model
        )
    })

    describe('SelectBuilder', () => {
        test('+ should return valid SELECT statement with a given from', async () => {

            const query = {
                cmd: 'SELECT',
                SELECT: {
                    from: { ref: ['BeershopService.Beers'] }
                }
            }

            const { sql, values = [] } = this.runQuery(query)

            expect(sql).toMatch('SELECT * FROM BeershopService_Beers');
            expect(values).toEqual([])
        })

        test('+ should return valid SELECT statement with given from and columns', async () => {

            const query = {
                cmd: 'SELECT',
                SELECT: {
                    from: { ref: ['BeershopService.Beers'] },
                    columns: [{ ref: ['ID'] }, { ref: ['name'] }]
                },
            }

            const { sql, values = [] } = this.runQuery(query)

            expect(sql).toMatch('SELECT ID AS \"ID\", name AS \"name\" FROM BeershopService_Beers AS \"BeershopService.Beers\"');
            expect(values).toEqual([])
        })

        test('+ should return valid SELECT statement with given from, columns, orderBy and limit', async () => {

            const query = {
                cmd: 'SELECT',
                SELECT: {
                    from: { ref: ['BeershopService.Beers'] },
                    columns: [{ ref: ['ID'] }, { ref: ['name'] }],
                    orderBy: [{ ref: ['ID'], sort: 'asc' }],
                    limit: { rows: { val: 1 }, offset: { val: 1 } },
                },
            }

            const { sql, values = [] } = this.runQuery(query)

            expect(sql).toMatch('SELECT ID, name FROM BeershopService_Beers ORDER BY ID ASC LIMIT $1 OFFSET $2');
            expect(values).toEqual([1, 1])
        })

        test('+ should return valid SELECT statement with given from, columns, groupBy', async () => {

            const query = {
                cmd: 'SELECT',
                SELECT: {
                    from: { ref: ['BeershopService.Beers'] },
                    columns: [{ ref: ['ID'] }, { ref: ['name'] }],
                    groupBy: [{ ref: ['ID'] }, { ref: ['name'] }]
                },
            }

            const { sql, values = [] } = this.runQuery(query)

            expect(sql).toMatch('SELECT ID, name FROM BeershopService_Beers GROUP BY ID, name');
            expect(values).toEqual([])
        })

        test('+ should return valid SELECT statement with given from, columns, where, orderBy and limit', async () => {

            const query = {
                cmd: 'SELECT',
                SELECT: {
                    from: { ref: ['BeershopService.Beers'] },
                    columns: [{ ref: ['ID'] }, { ref: ['name'] }],
                    where: [{ ref: ["ID"] }, "=", { val: 111 }],
                    orderBy: [{ ref: ['ID'], sort: 'asc' }],
                    limit: { rows: { val: 1 }, offset: { val: 1 } },
                },
            }

            const { sql, values = [] } = this.runQuery(query)

            expect(sql).toMatch('SELECT ID, name FROM BeershopService_Beers WHERE ID = $1 ORDER BY ID ASC LIMIT $2 OFFSET $3');
            expect(values).toEqual([111, 1, 1])
        })
    })

    // Examples taken from: https://cap.cloud.sap/docs/cds/cqn#insert
    describe('InsertBuilder', () => {

        beforeAll(async () => {
            this.csn = await cds.load('./__tests__/__assets__/cap-proj/db/schema.cds');
        })

        it("should return a valid INSERT statement with given columns and values", () => {
            const query = {
                cmd: 'INSERT',
                INSERT: {
                    into: 'csw.Beers',
                    columns: ['ID', 'name'],
                    values: [201, "MyBeer"]
                }
            }

            const { sql, values = [] } = this.runQuery(query)

            expect(sql).toMatch(`INSERT INTO csw_Beers ( ID, name ) VALUES ( $1, $2 )`)
            expect(values).toEqual([201, "MyBeer"])
        })

        it("should return a valid INSERT statement with given columns and rows", () => {
            const query = {
                cmd: 'INSERT',
                INSERT: {
                    into: 'csw.Beers',
                    columns: ['ID', 'name'],
                    rows: [
                        [201, "MyBeer"],
                        [202, "MyOtherBeer"]
                    ],
                }
            }

            const { sql, values = [] } = this.runQuery(query)

            expect(sql).toMatch(`INSERT INTO csw_Beers ( ID, name ) VALUES ( $1, $2 )`)
            expect(values).toEqual([[201, "MyBeer"], [202, "MyOtherBeer"]])
        })

        it("should return a valid INSERT statement with given entries", () => {
            const query = {
                cmd: 'INSERT',
                INSERT: {
                    into: 'csw.Beers',
                    entries: [
                        { ID: 201, name: "MyBeer" },
                        { ID: 202, name: "MyOtherBeer" }
                    ],
                }
            }

            const { sql, values = [] } = this.runQuery(query)

            expect(sql).toMatch(`INSERT INTO csw_Beers ( ID, name ) VALUES ( $1, $2 )`)
            expect(values).toEqual([[201, "MyBeer"], [202, "MyOtherBeer"]])
        })

    })

    describe('UpdateBuilder', () => {
        test('+ should return a valid UPDATE statement with given data', async () => {

            const query = {
                cmd: 'UPDATE',
                UPDATE: {
                    entity: { ref: ['BeershopService.Beers'] },
                    data: { name: 'The Raven' }
                }
            }

            const { sql, values = [] } = this.runQuery(query)

            expect(sql).toMatch('UPDATE BeershopService_Beers SET name = $1');
            expect(values).toEqual(["The Raven"])
        })

        test('+ should return a valid UPDATE statement with given data and where', async () => {

            const query = {
                cmd: 'UPDATE',
                UPDATE: {
                    entity: { ref: ['BeershopService.Beers'] },
                    data: { name: 'The Raven' },
                    where: [{ ref: ["ID"] }, "=", { val: 111 }]
                }
            }

            const { sql, values = [] } = this.runQuery(query)

            expect(sql).toMatch('UPDATE BeershopService_Beers SET name = $1 WHERE ID = $2');
            expect(values).toEqual(["The Raven", 111])
        })
    })

    describe('DeleteBuilder', () => {
        test('+ should return a valid DELETE statement with given from', async () => {

            const query = {
                cmd: 'DELETE',
                DELETE: {
                    from: { ref: ['BeershopService.Beers'] }
                }
            }

            const { sql, values = [] } = this.runQuery(query)

            expect(sql).toMatch('DELETE FROM BeershopService_Beers');
            expect(values).toEqual([])
        })

        test('+ should return a valid DELETE statement with given from and where', async () => {

            const query = {
                cmd: 'DELETE',
                DELETE: {
                    from: { ref: ['BeershopService.Beers'] },
                    where: [{ ref: ["ID"] }, "=", { val: 111 }]
                }
            }

            const { sql, values = [] } = this.runQuery(query)

            expect(sql).toMatch('DELETE FROM BeershopService_Beers WHERE ID = $1');
            expect(values).toEqual([111])
        })
    })

    test.todo("CreateBuilder")

    test.todo("DropBuilder")
})
