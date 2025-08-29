import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import ChecklistModel from "@/model/Checklists";
import { NextRequest } from "next/server";
import { User } from "next-auth";

export async function GET(request: NextRequest, { params }: { params: { scope: string } }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const user:User = session?.user as User 
  
     if(!session || !session?.user) {
        return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );}
   const userId = user._id;
   try {
     const checklist = await ChecklistModel.findOne({
    userId,
    scope:  params.scope
  });

  if (!checklist) return Response.json({  success:false,message:"Error getting checklist" }, { status: 404 });
  return Response.json(checklist);
    
   } catch (error) {
    console.error("Error getting user checlist",error)
    
   }
 
}