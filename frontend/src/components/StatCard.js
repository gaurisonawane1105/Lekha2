import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, description, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
      data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold font-heading text-slate-900 mb-1">
            {value}
          </p>
          {description && (
            <p className="text-sm text-slate-600">{description}</p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center">
            <Icon className="w-6 h-6 text-slate-600" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
