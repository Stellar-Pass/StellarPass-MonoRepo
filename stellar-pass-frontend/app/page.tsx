"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Ticket,
  Shield,
  Zap,
  Globe,
  QrCode,
  Award,
  ArrowRight,
  Check,
  Users,
  BarChart3,
  Smartphone,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

const features = [
  {
    icon: Ticket,
    title: "NFT Tickets",
    description:
      "Every ticket is a unique NFT on the Stellar blockchain, ensuring authenticity and preventing counterfeits.",
  },
  {
    icon: Shield,
    title: "Secure & Verifiable",
    description:
      "Tickets are cryptographically secured and can be verified instantly without a central authority.",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    description:
      "Payments settle in seconds with minimal fees thanks to Stellar's fast and low-cost network.",
  },
  {
    icon: QrCode,
    title: "QR Check-in",
    description:
      "Fast and reliable QR code scanning for venue entry. Works offline with automatic sync.",
  },
  {
    icon: Award,
    title: "POAP Badges",
    description:
      "Mint Proof of Attendance Protocol badges for attendees to commemorate their participation.",
  },
  {
    icon: Globe,
    title: "Global Access",
    description:
      "Anyone with a Stellar wallet can purchase tickets, enabling truly borderless events.",
  },
];

const stats = [
  { value: "10K+", label: "Tickets Minted" },
  { value: "500+", label: "Events Hosted" },
  { value: "50K+", label: "Attendees" },
  { value: "99.9%", label: "Uptime" },
];

const steps = [
  {
    step: "1",
    title: "Create Your Event",
    description:
      "Set up your event with details, ticket tiers, and pricing in minutes.",
  },
  {
    step: "2",
    title: "Mint NFT Tickets",
    description:
      "Tickets are automatically minted as NFTs when purchased by attendees.",
  },
  {
    step: "3",
    title: "Manage & Check-in",
    description:
      "Track sales, manage attendees, and scan QR codes at the venue.",
  },
  {
    step: "4",
    title: "Issue POAPs",
    description:
      "Reward attendees with verifiable proof of attendance badges.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-stellar">
          <div className="absolute inset-0 bg-grid-white/[0.05]" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm mb-6">
                <Zap className="h-4 w-4" />
                Built on Stellar Blockchain
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl font-display">
                Event Ticketing
                <br />
                <span className="text-white/80">Reimagined</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70 sm:text-xl">
                NFT-powered tickets that are secure, verifiable, and tradeable.
                Create unforgettable events with blockchain technology.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard/events/new">
                  <Button size="lg" className="bg-white text-stellar-700 hover:bg-white/90 shadow-xl">
                    Create an Event
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/tickets">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Browse Events
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Decorative gradient orbs */}
          <div className="absolute top-1/2 -left-32 h-96 w-96 -translate-y-1/2 rounded-full bg-accent-500/30 blur-3xl" />
          <div className="absolute top-1/2 -right-32 h-96 w-96 -translate-y-1/2 rounded-full bg-stellar-400/30 blur-3xl" />
        </section>

        {/* Stats Section */}
        <section className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <p className="text-3xl font-bold text-stellar-600 dark:text-stellar-400">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-gray-50 dark:bg-gray-900/50 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl font-display">
                Everything You Need
              </h2>
              <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                A complete toolkit for creating, managing, and attending events
                with blockchain-powered tickets.
              </p>
            </motion.div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card hover className="h-full">
                      <CardContent className="p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stellar-50 dark:bg-stellar-950 mb-4">
                          <Icon className="h-6 w-6 text-stellar-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl font-display">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                Get started in minutes with our simple four-step process.
              </p>
            </motion.div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-stellar text-white text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* For Organizers & Attendees */}
        <section className="bg-gray-50 dark:bg-gray-900/50 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Organizers */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stellar-50 dark:bg-stellar-950 mb-6">
                      <BarChart3 className="h-7 w-7 text-stellar-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      For Event Organizers
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Create events with multiple ticket tiers",
                        "Real-time sales analytics and charts",
                        "QR code check-in with offline support",
                        "POAP badge minting for attendees",
                        "Webhook integrations for automation",
                        "Payout configuration and tracking",
                      ].map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <Check className="h-5 w-5 text-stellar-500 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link href="/dashboard" className="mt-6 inline-block">
                      <Button>
                        Organizer Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Attendees */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 dark:bg-accent-950 mb-6">
                      <Users className="h-7 w-7 text-accent-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      For Attendees
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Browse and discover upcoming events",
                        "Connect any Stellar wallet to purchase",
                        "Own your ticket as an NFT",
                        "Transfer or resell tickets easily",
                        "Collect POAP badges as memories",
                        "One-tap check-in at venues",
                      ].map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <Check className="h-5 w-5 text-accent-500 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link href="/tickets" className="mt-6 inline-block">
                      <Button variant="secondary">
                        My Tickets
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Scanner PWA */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Card className="inline-block">
                <CardContent className="p-8 sm:p-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50 dark:bg-success-950 mx-auto mb-6">
                    <Smartphone className="h-8 w-8 text-success-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Check-in Scanner PWA
                  </h2>
                  <p className="text-gray-500 max-w-lg mx-auto mb-6">
                    A lightweight Progressive Web App for venue door staff.
                    Install it on any device - no app store needed.
                    Works offline with automatic sync.
                  </p>
                  <Link href="/scan">
                    <Button>
                      Open Scanner
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-stellar py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl font-display">
                Ready to Get Started?
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Create your first event in minutes. No credit card required.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard/events/new">
                  <Button
                    size="lg"
                    className="bg-white text-stellar-700 hover:bg-white/90"
                  >
                    Create Free Event
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Read Documentation
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
