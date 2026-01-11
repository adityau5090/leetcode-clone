import { Button } from '@/components/ui/button';
import { currentUserRole } from '@/modules/auth/actions';
import { UserRole } from '@/src/generated/prisma';
import { currentUser } from '@clerk/nextjs/server'
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import React from 'react'
import Link from 'next/link';
import { ModeToggle } from '@/components/ui/mode-toggle';
import CreateProblemForm from '@/modules/problem/components/createProblemForm';

const CreateProblem = async () => {
    const user = await currentUser();
    const userRole = await currentUserRole();

    if(userRole !== UserRole.ADMIN) return redirect("/");


  return (
    <section className='container mx-auto my-4  flex flex-col justify-center items-center'>
        <div className='flex flex-row justify-between items-center w-full'>
            <Link href={"/"}> 
                <Button variant='outline' size='icon'>
                    <ArrowLeft className='size-4' />
                </Button>            
            </Link>
            <h1 className='text-2xl font-bold text-amber-600'>Welcome {user.firstName}! Create a Problem</h1>
            <ModeToggle />
        </div>
        <CreateProblemForm />
    </section>
  )
}

export default CreateProblem
