import dbConnect from "@/lib/dbConnect";
import ChecklistModel from "@/model/Checklists";
import { NextRequest } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { User } from "next-auth";

export async function PATCH(request:NextRequest){
    await dbConnect();
     const session = await getServerSession(authOptions);
    const user:User = session?.user as User 

     if(!session || !session?.user) {
        return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );}
    const userId = user._id;
    
  const { scope, categoryName, itemText, checked, note } = await request.json();
  try {
    const checklist = await ChecklistModel.findOne({
        userId,
        scope
    })
    if(!checklist) return Response.json({success: false,message:"Error getting checlists of user"},{status: 404})
      const category = checklist.categories.find(cat => cat.name === categoryName);
      const item = category?.items.find(it => it.text === itemText);

      if(item){
        item.checked = checked;
        item.note = note;
        await checklist.save();
      }
      return Response.json({success:true,message: "user checlist updated"},{status: 200})

  } catch (error) {
    console.error("Error updating user checlist",error)
  }

}