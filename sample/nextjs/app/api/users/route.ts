import { NextRequest, NextResponse } from "next/server";

/**
 * App Router route handler -- task-fw-01 fixture: GET export.
 * @param {NextRequest} request
 * @returns {Promise<NextResponse>}
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    return NextResponse.json({ users: [] });
}

/**
 * App Router route handler -- task-fw-01 fixture: POST export.
 * @param {NextRequest} request
 * @returns {Promise<NextResponse>}
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    /**
     * @constant body
     * @type {any}
     */
    const body = await request.json();
    return NextResponse.json({ created: true, body }, { status: 201 });
}
