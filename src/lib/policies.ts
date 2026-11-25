import type {Role} from "@/generated/prisma/client";
export function canSendOtp(recentCount:number,lastSentAt:Date|undefined,now=Date.now()){return recentCount<3&&(!lastSentAt||now-lastSentAt.getTime()>=45_000)}
export function isOtpUsable(expiresAt:Date,attempts:number,now=Date.now()){return expiresAt.getTime()>now&&attempts<5}
export function hasRole(role:Role|undefined,required:Role){return role===required}
export function mayReadPlan(role:Role|undefined,requestOwnerId:string,viewerId:string,paid:boolean){return Boolean(paid&&(role==="ADMIN"||viewerId===requestOwnerId))}
export function isVerifiedPayment(result:number,verifiedAmount:number,expectedAmount:number){return result===100&&verifiedAmount===expectedAmount}
export function canFinalizePayment(status:string){return status==="PENDING"}
export function countsAsRevenue(status:string){return status==="PAID"}
export function isRequestSameOrigin(requestUrl:string,origin:string|null){
 if(!origin)return false;
 try{return new URL(origin).origin===new URL(requestUrl).origin}catch{return false}
}
export function trustedPublicOrigin(configuredUrl:string|undefined,requestUrl:string,isProduction:boolean){
 const configured=configuredUrl?.trim();
 if(!configured){if(isProduction)throw new Error("NEXT_PUBLIC_SITE_URL is required in production");return new URL(requestUrl).origin}
 const parsed=new URL(configured);
 if(!["https:","http:"].includes(parsed.protocol)||parsed.username||parsed.password||(isProduction&&parsed.protocol!=="https:"))throw new Error("NEXT_PUBLIC_SITE_URL must be a valid HTTPS origin in production");
 return parsed.origin;
}
export function tehranStartOfDay(now=new Date()){const shifted=new Date(now.getTime()+210*60_000);return new Date(Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),shifted.getUTCDate())-210*60_000)}
export function tehranStartOfWeek(now=new Date()){const start=tehranStartOfDay(now);const shifted=new Date(start.getTime()+210*60_000);const daysSinceSaturday=(shifted.getUTCDay()+1)%7;return new Date(start.getTime()-daysSinceSaturday*86400_000)}
export function tehranStartOfMonth(now=new Date()){const shifted=new Date(now.getTime()+210*60_000);return new Date(Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),1)-210*60_000)}
export function tehranStartOfYear(now=new Date()){const shifted=new Date(now.getTime()+210*60_000);return new Date(Date.UTC(shifted.getUTCFullYear(),0,1)-210*60_000)}
