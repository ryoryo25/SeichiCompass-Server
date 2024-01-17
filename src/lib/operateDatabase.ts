import { PoolConnection, createPool } from 'mariadb';
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_USER, DEFAULT_RESPONSE, TABLE_NAME } from './constants';
import urlToCoordinate from './coodinate';

const pool = createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    connectionLimit: 5,
    trace: true,
})

function makePoint(lat: string, lng: string): string {
    return `'POINT(${lng} ${lat})'`
}

function makeGeometry(pointText: string): string {
    return `GeomFromText(${pointText}, 4326)`
}

function makeGeomPoint(lat: string, lng: string): string {
    return makeGeometry(makePoint(lat, lng))
}

async function query(queryToResponse: (connection: PoolConnection) => Promise<Response>) {
    let connection = null
    let result = DEFAULT_RESPONSE

    try {
        connection = await pool.getConnection()
        result = await queryToResponse(connection)
    } catch (err) {
        result = new Response(`internal error: ${err}`, { status: 500 })
    } finally {
        if (connection) {
            connection.end()
        }
        return result
    }
}

export async function listSeichis(params: URLSearchParams) {
    return await query(async connection => {
        let q = 'SELECT *, '
        if (params.get('lat') !== null && params.get('lng') !== null) {
            const lat = connection.escape(Number(params.get('lat')))
            const lng = connection.escape(Number(params.get('lng')))
            q += `ST_Distance_Sphere(${makeGeomPoint(lat, lng)}, ${makeGeometry('ST_AsText(coordinate)')})`
        } else {
            q += '0'
        }
        q += ` AS distance FROM ${TABLE_NAME}`
        if (params.get('range') !== null) {
            const r = connection.escape(Number(params.get('range')))
            q += ` HAVING distance <= ${r}`
        }
        q += ' ORDER BY distance'
        console.log(q)

        const res: Array<any> = await connection.query(q);
        const resultObj = res.map(info => {
            const { id, title, description, infoSource, coordinate, distance } = info
            const [longitude, latitude] = coordinate.coordinates

            return { id, title, description, infoSource, coordinate: { latitude, longitude }, distance }
        })
        console.log(resultObj)
        return Response.json(resultObj)
    })
}

export async function getSeichi(idIn: number) {
    return await query(async connection => {
        const res: Array<any> = await connection.query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [idIn]);
        if (res.length < 1) {
            throw new Error(`No items corresponding to id ${idIn}`)
        }

        const { id, title, description, infoSource, coordinate } = res[0]
        const [longitude, latitude] = coordinate.coordinates
        const resultObj = { id, title, description, infoSource, coordinate: { latitude, longitude } }
        console.log(resultObj)

        return Response.json(resultObj)
    })
}

export async function createSeichi(body: any) {
    return await query(async connection => {
        console.log(body)
        const coordinate = await urlToCoordinate(body.coordinateUrl)
        if (coordinate.latitude === null || coordinate.longitude === null) {
            throw new Error(`Coordinate cannot be extraced from ${body.coordinateUrl}`)
        }

        const lat = connection.escape(coordinate.latitude)
        const lng = connection.escape(coordinate.longitude)
        const q = `INSERT INTO ${TABLE_NAME} (title, description, infoSource, coordinate)`
                + `VALUES (?, ?, ?, ${makeGeomPoint(lat, lng)}})`
        const res = await connection.query(q, [
            body.title,
            body.description,
            body.infoSource,
        ]);
        res.insertId = Number(res.insertId) // bigint
        console.log(res)

        return Response.json(res)
    })
}

export async function updateSeichi() {
    return new Response('not implemented', { status: 501 })
}

export async function deleteSeichi(id: number) {
    return new Response('not implemented', { status: 501 })
}