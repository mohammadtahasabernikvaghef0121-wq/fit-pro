import type {MetadataRoute} from "next";import {siteConfig} from "@/lib/config";
export default function robots():MetadataRoute.Robots{return{rules:[{userAgent:"*",allow:["/","/pricing","/about","/faq","/privacy","/terms"],disallow:["/dashboard","/admin","/api","/login","/payment"]}],sitemap:`${siteConfig.siteUrl}/sitemap.xml`}}
