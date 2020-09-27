const cds = require('@sap/cds')
const deploy = require('@sap/cds/lib/db/deploy')

// mock (package|.cdsrc).json entries
cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
    impl: './cds-pg', // hint: not really sure as to why this is, but...
}

describe('QL to PostgreSQL', () => {

    beforeAll(async () => {
        this._model = './__tests__/__assets__/cap-proj/srv/';
        this._dbProperties = {
            kind: 'postgres',
            model: this._model,
            credentials: {
                host: 'localhost',
                port: '5432',
                database: 'beershop',
                username: 'postgres',
                password: 'postgres',
            },
        };
        cds.db = await cds.connect.to(this._dbProperties)
    })

    beforeEach(async () => {
        await deploy(this._model, {}).to(this._dbProperties);
    })

    describe('SELECT', () => {

        test("-> with from", async () => {
            const { Beers } = cds.entities("csw");
            const beers = await cds.run(
                SELECT.from(Beers)
            )
            expect(beers.length).toStrictEqual(2)
            expect(beers).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
        })

        test("-> with from and limit", async () => {
            const { Beers } = cds.entities("csw");
            const beers = await cds.run(
                SELECT.from(Beers).limit(1)
            )
            expect(beers.length).toStrictEqual(1)
        })

        test("-> with one and where", async () => {
            const { Beers } = cds.entities("csw");
            const beer = await cds.run(
                SELECT.one(Beers).where({ ID: '9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b' })
            )
            expect(beer).toHaveProperty("ID", "9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b");
        })

        test("-> with one, columns and where", async () => {
            const { Beers } = cds.entities("csw");
            const beer = await cds.run(
                SELECT.one(Beers).columns(['ID', 'name']).where({ ID: '9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b' })
            )
            expect(beer).toHaveProperty("ID", "9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b");
            expect(beer).not.toHaveProperty("abv");
        })

        test.skip("-> with distinct", () => { })
        test.skip("-> with orderBy", () => { })
        test.skip("-> with groupBy", () => { })
        test.skip("-> with having", () => { })
        test.skip("-> with joins", () => { })

    })

    describe('INSERT', () => {
        test("-> with one, columns and where", async () => {
            const { Beers } = cds.entities("csw");
            const beers = await cds.run(
                INSERT.into(Beers).entries([
                    { name: "Test" },
                    { name: "Test2" },
                ])
            )

        })
    })

})
