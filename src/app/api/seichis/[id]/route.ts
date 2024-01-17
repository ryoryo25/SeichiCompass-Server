import { NextRequest } from 'next/server'
import { getSeichi } from '@/lib/operateDatabase'

type Params = {
    params: {
        id: number
    }
}

export async function GET(request: NextRequest, { params }: Params) {
    return await getSeichi(params.id)
}

export async function PUT(request: NextRequest, { params }: Params) {
}

export async function DELETE(request: NextRequest, { params }: Params) {
}
