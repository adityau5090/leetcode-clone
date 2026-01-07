import React from 'react'

const AuthLayout = ({children}) => {
  return (
    <main className='flex items-center justify-center h-screen flex-col'>
        {children}
    </main>
  )
}

export default AuthLayout
