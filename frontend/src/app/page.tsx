"use client"

import dynamic from 'next/dynamic'

const RLConfigInterface = dynamic(() => import('@/components/RLConfigInterface'), {
    ssr: false
})

export default function Home() {
    return <RLConfigInterface />
}