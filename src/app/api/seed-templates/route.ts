
import fs from "fs";
import path from "path";
import dbConnect from "@/lib/dbConnect";
import TemplateModel from "@/model/checklistTemplate";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function POST(){
  // Require authenticated session + optional admin check via env list
  const session = await getServerSession(authOptions);
  if(!session?.user){
    return Response.json({success:false,message:"Not authenticated"},{status:401});
  }
  const adminList = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  const userEmail = (session.user.email || '').toLowerCase();
  if(adminList.length && !adminList.includes(userEmail)){
    return Response.json({success:false,message:"Forbidden"},{status:403});
  }
    await dbConnect();
    try {
        const filePath = path.join(process.cwd(),"src","scripts","templates","web.json");
        const fileContent = fs.readFileSync(filePath,"utf-8");
        const webTemplate = JSON.parse(fileContent);

        const exists = await TemplateModel.findOne({scope: webTemplate.scope});
        if(exists){
            return Response.json({
                success: false,
                message:  `Template for '${webTemplate.scope}' already exists`,
            },{status: 409})
        }
        await TemplateModel.create(webTemplate);
           return Response.json({
                success: true,
                message:   `Template for '${webTemplate.scope}' seeded`,
            },{status: 201})
    } catch (error) {
         console.error("Seeding error:", error);
           return Response.json({
                success: false,
                message:  "Failed to seed template",
            },{status: 500})
    }
}