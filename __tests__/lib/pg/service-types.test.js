const cds = require('@sap/cds')

// mock (package|.cdsrc).json entries
cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
    impl: './cds-pg', // hint: not really sure as to why this is, but...
}

describe('OData to Postgres dialect', () => {
    const app = require('express')()
    const request = require('supertest')(app)

    // custom bootstrap
    // docker pg server needs to be started first!
    beforeAll(async () => {
        cds.db = await cds.connect.to({
            kind: 'postgres',
            credentials: {
                host: 'localhost',
                port: '5432',
                database: 'beershop',
                username: 'postgres',
                password: 'postgres',
            },
        })
        // serve only a plain beershop
        // that matches the db content/setup in dockered pg
        await cds.serve('BeershopService').from(`${__dirname}/../../__assets__/cap-proj/srv/beershop-service`).in(app)

        // TODO: Reset the DB
    })


    describe('OData types: CREATE', () => {
        test(' -> Boolean', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Boolean: true
            });
            expect(response.status).toStrictEqual(201)
        })

        test(' -> Int32', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Int32: 10
            });
            expect(response.status).toStrictEqual(201)
        })

        test(' -> Int64', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Int64: 1000000000000
            });
            expect(response.status).toStrictEqual(201)
        })

        test.skip(' -> Decimal', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Decimal: 32.1
            });
            expect(response.status).toStrictEqual(201)
        })

        test.skip(' -> Double', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Decimal: '12312332.134234324'
            });
            expect(response.status).toStrictEqual(201)
        })

        test.skip(' -> Date', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Date: "2015-12-31"
            });
            expect(response.status).toStrictEqual(201)
        })

        test.skip(' -> Time', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Time: "2015-12-31"
            });
            expect(response.status).toStrictEqual(201)
        })

        test.skip(' -> DateTime', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_DateTime: "2015-12-31"
            });
            expect(response.status).toStrictEqual(201)
        })

        test.skip(' -> Timestamp', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Timestamp: "2015-12-31"
            });
            expect(response.status).toStrictEqual(201)
        })

        test(' -> String', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_String: "Hello World"
            });
            expect(response.status).toStrictEqual(201)
        })

        test.skip(' -> Binary', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Binary: "Hello World"
            });
            expect(response.status).toStrictEqual(201)
        })

        test.skip(' -> LargeBinary', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_LargeBinary: "Hello World"
            });
            expect(response.status).toStrictEqual(201)
        })

        test(' -> LargeString', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_LargeString: "Magna sit do quis culpa elit laborum culpa laboris excepteur. Proident qui culpa mollit ut ad enim. Reprehenderit aute occaecat ut ut est nostrud aliquip."
            });
            expect(response.status).toStrictEqual(201)
        })

    })
})
