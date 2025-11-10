import dbConnect from "@/lib/dbConnect";
import { NextRequest } from "next/server";
import TemplateModel from "@/model/checklistTemplate";
import ChecklistModel from "@/model/Checklists";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { User } from "next-auth";
import { ChecklistCreateSchema } from "@/lib/validation";
import sanitize from "mongo-sanitize";


export async function POST(request:NextRequest){
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
    const parsed = ChecklistCreateSchema.safeParse(body);
    if(!parsed.success){
      return Response.json({success:false,message: parsed.error.flatten()},{status:400});
    }
    const scope = sanitize(parsed.data.scope);
    const template = await TemplateModel.findOne({scope});

 try {
     if(!template){
       return Response.json({success:false,message:"Template not found for provided scope"},{status:404});
     }
     const checklist = new ChecklistModel({
       userId,
       scope,
       categories: template.categories.map((cat: { name: string; items: { text: string; tooltip?: string }[] }) => ({
         name: cat.name,
         items: cat.items.map((item: { text: string; tooltip?: string }) => ({
           text: item.text,
           tooltip: item.tooltip,
           checked: false,
           note: ''
         }))
       }))
     });
      await checklist.save();
      return Response.json({
        success: true,
        checklist
      });
    
} catch (error) {
    console.error("Error in user checlists",error);
    return Response.json({success: false,message:"Error creating checklist"},{status: 500})
}
  
}  