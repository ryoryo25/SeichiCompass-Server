import { NextRequest } from 'next/server'
import { createSeichi, listSeichis } from '@/lib/operateDatabase';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    return await listSeichis(searchParams)
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    return await createSeichi(body)
}
