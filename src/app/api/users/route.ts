import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface PublicMetadata {
    admin?: boolean;
    controller?: boolean;
}

export async function GET() {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const isAdmin = (sessionClaims?.publicMetadata as PublicMetadata)?.admin === true;
    if (!isAdmin) { 
        return new NextResponse('Forbidden: Must be an admin', { status: 403 });
    }

    try {
        const client = await clerkClient();
        const response = await client.users.getUserList({
            limit: 500,
            orderBy: '-updated_at',
        });
        const userList = response.data.map((user) => ({
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            username: user.externalAccounts[0]?.username,
            isController: user.publicMetadata.controller ?? false,
        }));
        return NextResponse.json(userList, { status: 200 });
    } catch (error) {
        console.error('Error fetching users:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const isAdmin = (sessionClaims?.publicMetadata as PublicMetadata)?.admin === true
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Must be an admin to change roles' }, { status: 403 })
    }
    try {
        const body = await request.json()
        const client = await clerkClient()
        const user = await client.users?.getUser(body.userId)
        const isController = user?.publicMetadata?.controller === true
        if (!isController) {
            await client.users?.updateUserMetadata(body.userId, {
                publicMetadata: {
                    controller: true,
                }
            })
        } else {
            await client.users?.updateUserMetadata(body.userId, {
                publicMetadata: {
                    controller: null,
                }
            })
        }
        return NextResponse.json({ message: 'User updated successfully' }, { status: 200 })
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}