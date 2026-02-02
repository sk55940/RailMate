import React from 'react';
import { Link } from 'react-router-dom';
import { Train, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Github } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-black dark:via-gray-900 dark:to-black text-gray-300 mt-auto border-t border-gray-800 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-primary-600 to-primary-700 p-2 rounded-xl shadow-lg shadow-primary-500/30"
              >
                <Train className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-white">
                Rail<span className="gradient-text">Mate</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Making railway travel better through efficient complaint management and resolution.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-white font-bold mb-4 text-lg">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/about', label: 'About Us' },
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/sign-in', label: 'Sign In' },
              ].map((link, index) => (
                <motion.li key={link.to} whileHover={{ x: 4 }}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-primary-400 transition-colors inline-flex items-center group"
                  >
                    <span className="w-0 h-0.5 bg-primary-400 group-hover:w-4 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-white font-bold mb-4 text-lg">Support</h3>
            <ul className="space-y-3">
              {[
                { label: 'Help Center' },
                { label: 'FAQs' },
                { label: 'Privacy Policy' },
                { label: 'Terms of Service' },
              ].map((link, index) => (
                <motion.li key={index} whileHover={{ x: 4 }}>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-primary-400 transition-colors inline-flex items-center group"
                  >
                    <span className="w-0 h-0.5 bg-primary-400 group-hover:w-4 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-white font-bold mb-4 text-lg">Contact</h3>
            <ul className="space-y-4">
              <motion.li whileHover={{ x: 4 }} className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">support@railmate.com</span>
              </motion.li>
              <motion.li whileHover={{ x: 4 }} className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">1800-XXX-XXXX</span>
              </motion.li>
              <motion.li whileHover={{ x: 4 }} className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">Railway Board Office, Navi-Mumbai</span>
              </motion.li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="border-t border-gray-800 dark:border-gray-700 mt-12 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm text-gray-400"
            >
              © {currentYear} <span className="font-semibold text-white">RailMate</span>. All rights reserved.
            </motion.p>

            {/* Social Links */}
            <div className="flex space-x-3">
              {[
                { Icon: Facebook, href: '#' },
                { Icon: Twitter, href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: Github, href: '#' },
              ].map(({ Icon, href }, index) => (
                <motion.a
                  key={index}
                  href={href}
                  whileHover={{ scale: 1.2, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-xl bg-gray-800 dark:bg-gray-700 text-gray-400 hover:text-primary-400 hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
