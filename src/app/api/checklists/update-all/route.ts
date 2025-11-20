import dbConnect from '@/lib/dbConnect';
import ChecklistModel from '@/model/Checklists';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import sanitize from 'mongo-sanitize';

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user._id as string;
    const body = await request.json();
    const { scope, action } = body as { scope: string; action: 'checkAll' | 'clearAll' };
    if (!scope || !action) return Response.json({ success: false, message: 'Missing parameters' }, { status: 400 });

    const checklist = await ChecklistModel.findOne({ userId, scope: sanitize(scope) });
    if (!checklist) return Response.json({ success: false, message: 'Checklist not found' }, { status: 404 });

    const newChecked = action === 'checkAll';
    for (const cat of checklist.categories) {
      for (const it of cat.items) {
        it.checked = newChecked;
      }
    }
    await checklist.save();
    return Response.json({ success: true, checklist });
  } catch (error) {
    console.error('Error in bulk update checklist', error);
    return Response.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
