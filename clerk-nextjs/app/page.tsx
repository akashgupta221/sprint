import { Navbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { Architecture } from '@/components/landing/architecture'
import { Walkthrough } from '@/components/landing/walkthrough'
import { Faq } from '@/components/landing/faq'
import { FinalCta, Footer } from '@/components/landing/cta-footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Architecture />
        <Walkthrough />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
