import React from 'react';
import { motion } from 'framer-motion';
import { Train, Shield, Users, Zap, Clock, Award } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Train,
      title: 'Railway Complaint Management',
      description: 'Streamlined system for managing passenger complaints across the Indian Railway network.'
    },
    {
      icon: Zap,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI automatically categorizes, prioritizes, and analyzes complaints for faster resolution.'
    },
    {
      icon: Users,
      title: 'Multi-Role Support',
      description: 'Dedicated interfaces for passengers, railway staff, and administrators with role-based access.'
    },
    {
      icon: Clock,
      title: 'Real-Time Tracking',
      description: 'Track complaint status in real-time with instant notifications and updates.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with data encryption and secure authentication via Clerk.'
    },
    {
      icon: Award,
      title: 'Smart Assignment',
      description: 'Intelligent staff assignment based on location, specialization, and workload distribution.'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Complaints Resolved' },
    { value: '500+', label: 'Active Staff Members' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'Support Available' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold text-white mb-6">
              About Railway Complaint Management System
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              A comprehensive digital solution designed to revolutionize how railway complaints are managed, 
              tracked, and resolved across the Indian Railway network.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed text-center max-w-4xl mx-auto">
              Our goal is to make it easy for railway passengers to report problems. We use smart technology to help railway staff fix these issues quickly. We want to make traveling by train better for everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gray-100 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Key Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Everything you need for effective complaint management
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900 rounded-2xl shadow-xl p-12"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-white/80 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>



      {/* Call to Action */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-2xl shadow-2xl p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of passengers already using our platform to make their voices heard
            </p>
            <motion.a
              href="/sign-up"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Create Your Account
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
