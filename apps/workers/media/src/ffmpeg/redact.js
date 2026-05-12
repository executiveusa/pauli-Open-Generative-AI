const secretPattern = /(sk-[A-Za-z0-9_-]+|hf_[A-Za-z0-9_-]+|FAL_[A-Za-z0-9_-]+|MUAPI_[A-Za-z0-9_-]+)/g;
export const redact = (text='') => text.replace(secretPattern, '[REDACTED]');
