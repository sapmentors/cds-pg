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

        test(' -> Decimal', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Decimal: '3.1'
            }).set('content-type', "application/json;charset=UTF-8;IEEE754Compatible=true");
            expect(response.status).toStrictEqual(201)
        })

        test(' -> Double', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Double: 23423.1234234
            });
            expect(response.status).toStrictEqual(201)
        })

        test(' -> Date', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Date: "2015-12-31"
            });
            expect(response.status).toStrictEqual(201)
        })

        test(' -> Time', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Time: "10:21:15"
            });
            expect(response.status).toStrictEqual(201)
        })

        test(' -> DateTime', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_DateTime: "2012-12-03T07:16:23.574Z"
            });
            expect(response.status).toStrictEqual(201)
        })

        test(' -> Timestamp', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Timestamp: "2012-12-03T07:16:23.574Z"
            });
            expect(response.status).toStrictEqual(201)
        })

        test(' -> String', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_String: "Hello World"
            });
            expect(response.status).toStrictEqual(201)
        })

        test(' -> Binary', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_Binary: "SGVsbG8gV29ybGQ="
            });
            expect(response.status).toStrictEqual(201)
        })

        test(' -> LargeBinary', async () => {
            const response = await request.post('/beershop/TypeChecks').send({
                type_LargeBinary: "SGVsbG8gV29ybGQ="
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
