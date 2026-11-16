import dotenv from "dotenv";
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });
import {PrismaClient} from "../src/generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
function phone(input:string){const digits=input.replace(/[\s()-]/g,"").replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));const value=digits.startsWith("+98")?`0${digits.slice(3)}`:digits.startsWith("0098")?`0${digits.slice(4)}`:digits;if(!/^09\d{9}$/.test(value))throw new Error("شماره همراه معتبر نیست.");return value}
async function main(){const input=process.argv[2];if(!input)throw new Error("استفاده: npm run admin:provision -- 09xxxxxxxxx");const normalized=phone(input);const user=await db.user.upsert({where:{phone:normalized},create:{phone:normalized,role:"ADMIN"},update:{role:"ADMIN"}});console.log(`کاربر ${user.phone} به نقش مدیر ارتقا یافت.`)}
main().catch(e=>{console.error(e instanceof Error?e.message:"خطا در ایجاد مدیر");process.exitCode=1}).finally(()=>db.$disconnect());
