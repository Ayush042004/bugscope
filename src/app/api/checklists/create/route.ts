import dbConnect from "@/lib/dbConnect";
import { NextRequest } from "next/server";
import TemplateModel from "@/model/checklistTemplate";
import ChecklistModel from "@/model/Checklists";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { User } from "next-auth";


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
    const {scope} = await request.json();
    const template = await TemplateModel.findOne({scope});

try {
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
    Response.json({success: false,message:"Error sending checlists in backend"},{status: 500})
    
}
  
}  