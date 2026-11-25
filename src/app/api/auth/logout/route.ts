import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {db} from "@/lib/db";
import {hash,isSameOrigin} from "@/lib/auth";
async function clearSession(){const jar=await cookies();const token=jar.get("fit_session")?.value;if(token)await db.session.deleteMany({where:{tokenHash:hash(token)}});jar.delete("fit_session")}
export async function POST(req:Request){if(!isSameOrigin(req))return NextResponse.json({error:"درخواست معتبر نیست."},{status:403});await clearSession();return NextResponse.json({ok:true})}
export async function GET(){return NextResponse.json({error:"از درخواست POST برای خروج استفاده کنید."},{status:405,headers:{Allow:"POST","Cache-Control":"no-store"}})}
