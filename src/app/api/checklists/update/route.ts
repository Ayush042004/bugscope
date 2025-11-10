import dbConnect from "@/lib/dbConnect";
import ChecklistModel from "@/model/Checklists";
import { NextRequest } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { User } from "next-auth";
import { ChecklistUpdateSchema } from "@/lib/validation";
import sanitize from "mongo-sanitize";

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
    const body = await request.json();
    const parsed = ChecklistUpdateSchema.safeParse(body);
    if(!parsed.success){
      return Response.json({success:false,message: parsed.error.flatten()},{status:400});
    }
    const { scope, categoryName, itemText, checked, note } = parsed.data;
  try {
    const checklist = await ChecklistModel.findOne({ userId, scope: sanitize(scope) });
    if(!checklist) return Response.json({success: false,message:"Checklist not found"},{status: 404});

    const category = checklist.categories.find(cat => cat.name === categoryName);
    if(!category) return Response.json({success:false,message:"Category not found"},{status:404});

    const item = category.items.find(it => it.text === itemText);
    if(!item) return Response.json({success:false,message:"Item not found"},{status:404});

    item.checked = checked;
    if(typeof note === 'string') item.note = note;
    await checklist.save();

    return Response.json({success:true,message: "Checklist updated"},{status: 200})

  } catch (error) {
    console.error("Error updating user checklist",error);
    return Response.json({success:false,message:"Server error"},{status:500});
  }

}