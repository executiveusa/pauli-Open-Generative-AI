// ai-agent stub
'use client';
import React from 'react';
const Stub = ({ label }) => React.createElement('div', { style: { padding: 32, color: '#71717a', fontSize: 14 } }, label || 'Module unavailable in this build.');
export const AiAgent = () => React.createElement(Stub, { label: 'AI Agent unavailable.' });
export const CreateAgentPage = () => React.createElement(Stub, { label: 'Create Agent unavailable.' });
export const EditAgentPage = () => React.createElement(Stub, { label: 'Edit Agent unavailable.' });
export default Stub;
