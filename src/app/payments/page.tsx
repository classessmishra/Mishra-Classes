"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import CheckoutButton from "@/components/CheckoutButton";

export default function PaymentsPage() {
  const plans = [
    {
      name: "Basic Plan",
      price: 2499,
      duration: "Per Course",
      description: "Access to recorded lectures and PDF notes.",
      features: ["HD Recorded Video Lectures", "Downloadable PDF Notes", "Chapter-wise Quizzes", "Email Support"],
      isPopular: false,
    },
    {
      name: "Premium Live",
      price: 4999,
      duration: "Per Batch",
      description: "Full access to live classes and premium doubt solving.",
      features: ["Everything in Basic", "Interactive Live Classes", "1-on-1 Doubt Solving", "Full Mock Test Series", "Priority WhatsApp Support"],
      isPopular: true,
    },
  ];

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 md:py-16 max-w-5xl"
    >
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-foreground mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that best fits your learning style. No hidden fees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan, idx) => (
          <div 
            key={idx} 
            className={`relative p-8 rounded-3xl border flex flex-col ${
              plan.isPopular ? "bg-card border-primary shadow-2xl shadow-primary/10" : "bg-card border-border shadow-sm"
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                Most Popular
              </div>
            )}
            
            <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
            <p className="text-muted-foreground mb-6 h-12">{plan.description}</p>
            
            <div className="mb-8">
              <span className="text-5xl font-extrabold text-foreground">₹{plan.price}</span>
              <span className="text-muted-foreground font-medium"> / {plan.duration}</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="font-medium text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="w-full">
              <CheckoutButton courseId={`plan_${idx}`} amount={plan.price} />
            </div>
          </div>
        ))}
      </div>
    </motion.main>
  );
}
