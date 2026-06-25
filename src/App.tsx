/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { WhatIs } from "./components/WhatIs";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { WhyTanvelo } from "./components/WhyTanvelo";
import { BuiltFor } from "./components/BuiltFor";
import { ProductShowcase } from "./components/ProductShowcase";
import { Waitlist } from "./components/Waitlist";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <WhatIs />
        <Features />
        <HowItWorks />
        <WhyTanvelo />
        <BuiltFor />
        <ProductShowcase />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
}
