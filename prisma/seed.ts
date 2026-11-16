import "dotenv/config";
import {PrismaClient} from "../src/generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
const price=(name:string,fallback:string)=>{const value=Number(process.env[name]??fallback);if(!Number.isSafeInteger(value)||value<1000)throw new Error(`${name} باید عدد صحیح و حداقل ۱۰۰۰ ریال باشد.`);return BigInt(value)};
async function main(){const packages=[
 {slug:"nutrition",title:"همراهی تغذیه",description:"برنامه تغذیه متناسب با هدف، ترجیحات و ریتم روزانه شما؛ با امکان بازبینی در طول مسیر.",durationDays:30,priceRials:price("SEED_NUTRITION_PRICE_RIALS","5000000"),requestType:"NUTRITION" as const,deliverables:["برنامه شخصی تغذیه","راهنمای انتخاب‌های روزمره","یک نوبت بازبینی"]},
 {slug:"training",title:"همراهی تمرین",description:"برنامه تمرینی متناسب با تجربه، روزهای در دسترس و امکانات شما.",durationDays:30,priceRials:price("SEED_TRAINING_PRICE_RIALS","5000000"),requestType:"TRAINING" as const,deliverables:["برنامه تمرین شخصی","راهنمای اجرای حرکات","یک نوبت بازبینی"]},
 {slug:"combined",title:"همراهی ترکیبی",description:"برنامه تمرین و تغذیه هماهنگ برای ساختن عادت‌های قابل ادامه.",durationDays:30,priceRials:price("SEED_COMBINED_PRICE_RIALS","8500000"),requestType:"COMBINED" as const,deliverables:["برنامه شخصی تغذیه","برنامه شخصی تمرین","دو نوبت بازبینی"]},
];
for(let i=0;i<packages.length;i++){const p=packages[i];await db.coachingPackage.upsert({where:{slug:p.slug},create:{...p,sortOrder:i},update:{priceRials:p.priceRials}})}
console.log("سه بسته نمونه با قیمت‌های قابل تنظیم ثبت شدند.");}
main().catch(e=>{console.error("Seed failed:",e);process.exitCode=1}).finally(()=>db.$disconnect());
