"use server"

import { db } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"


export const onBoardUser = async () => {
    try {
        const user = await currentUser();
        // console.log(user.emailAddresses[0].emailAddress);

        if(!user){
            return {
                success: false,
                error: "No authenticated user found"
            }
        }

        const { id, firstName, lastName, imageUrl, emailAddresses } = user;

        const newUser = await db.user.upsert({
            where:{
                clerkId: id
            },
            update:{
                firstName: firstName || null,
                lastName: lastName || null,
                imageUrl: imageUrl || null,
                email: emailAddresses?.[0]?.emailAddress || "",
            },
            create:{
                clerkId: id,
                firstName: firstName || null,
                lastName: lastName || null,
                imageUrl: imageUrl || null,
                email: emailAddresses?.[0]?.emailAddress || "",
            }
        })

        return {
            success: true,
            message: "User onBoarded successfully",
            data: newUser
        }
    } catch (error) {
        console.error("❌ Error on boarding user : ", error);
        return {
            success: false,
            error: `Failed to onBoard user : ${error.message}`
        }
    }
}

export const currentUserRole = async () => {
    try {
        const user = await currentUser();

        if(!user){
            return {
                success: false,
                error: "No authenticated user found"
            }
        }

        const {id} = user;

        const userRole = await db.user.findUnique({
            where: {
                clerkId: id
            },
            select: {
               role: true     
            }
        })
        // console.log(userRole.role)
        return userRole?.role?? null;
    } catch (error) {
        console.error("❌Error fetching user role : ",error);
        return {
            success: false,
            error: `Failed to fetch user role : ${error.message}`
        }
    }
}

export const getCurrentUser = async () => {
    try {
        const user = await currentUser();

        const dbUser = await db.user.findUnique({
            where: {
                clerkId: user.id
            },
            select: {
                id: true,
            }
        }) 

        if(!dbUser){
            return {
                success: false,
                error: "User not found",
            }
        }

        return dbUser
    } catch (error) {
        console.error("Failed to fetch current user : ", error);
        return {
            success: false,
            error: error.message || "Failed to fetch current user"
        }
    }
}