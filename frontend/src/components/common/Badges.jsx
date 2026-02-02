import React from 'react';
import { getStatusColor, getPriorityColor } from '../../utils/helpers';

const StatusBadge = ({ status }) => {
  return (
    <span className={`badge ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  return (
    <span className={`badge ${getPriorityColor(priority)}`}>
      {priority}
    </span>
  );
};

export const CategoryBadge = ({ category }) => {
  return (
    <span className="badge bg-gray-100 text-gray-800">
      {category}
    </span>
  );
};

export default StatusBadge;
