import React, { useState, useEffect } from 'react';
import { WpConfig } from '../types';
import { Input, PasswordInput } from './Input';
import { Button } from './Controls';
import { XIcon, SaveIcon, LoaderIcon, CheckCircleIcon, XCircleIcon, WifiIcon } from './Icons';
import { testConnection, validateWordPressUrl } from '../services/wpUploader';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WpConfig) => void;
  initialConfig: WpConfig;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialConfig }) => {
  const [config, setConfig] = useState<WpConfig>(initialConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ message: string; success: boolean | null } | null>(null);

  useEffect(() => {
    if (isOpen) {
        setConfig(initialConfig);
        setTestStatus(null);
        setIsTesting(false);
    }
  }, [initialConfig, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const urlValidation = validateWordPressUrl(config.url);
    if (!urlValidation.valid) {
      setTestStatus({ message: `Invalid URL: ${urlValidation.error}`, success: false });
      return;
    }
    onSave(config);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus({ message: 'Testing connection...', success: null });
    try {
      await testConnection(config);
      setTestStatus({ message: 'Connection successful! Credentials are valid.', success: true });
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
          errorMessage = 'Authentication failed. Please check your credentials.';
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          errorMessage = 'Network error. Could not connect to the URL. Check CORS or if the URL is correct.';
      } else if (errorMessage.includes('CORS')) {
          errorMessage = 'CORS error. Please ensure your WordPress site allows requests from this domain.';
      }
      setTestStatus({ message: `Connection failed: ${errorMessage}`, success: false });
    } finally {
      setIsTesting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">WordPress Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <XIcon className="h-6 w-6 text-slate-500" />
          </button>
        </header>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <main className="p-6 flex-grow overflow-y-auto space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    These settings are saved in your browser's local storage and are not sent to any server.
                </p>
                <Input label="WordPress URL" name="url" value={config.url} onChange={handleChange} placeholder="https://example.com" required />
                <Input label="WordPress Username" name="username" value={config.username} onChange={handleChange} required/>
                <PasswordInput label="WordPress Application Password" name="password" value={config.password} onChange={handleChange} required/>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  An <a href="https://wordpress.org/documentation/article/application-passwords/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">Application Password</a> is required for API access. Your normal password will not work.
                </p>
                {testStatus && (
                    <div className={`flex items-center p-3 rounded-md text-sm ${
                        testStatus.success === true ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                        testStatus.success === false ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' :
                        'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                    }`}>
                        {testStatus.success === true && <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />}
                        {testStatus.success === false && <XCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />}
                        {isTesting && <LoaderIcon className="animate-spin h-5 w-5 mr-2 flex-shrink-0" />}
                        <span>{testStatus.message}</span>
                    </div>
                )}
            </main>
            <footer className="p-4 bg-slate-100 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center gap-3">
                <Button 
                  type="button" 
                  onClick={handleTestConnection} 
                  disabled={isTesting || !config.url || !config.username || !config.password}
                  className="bg-slate-600 hover:bg-slate-500"
                >
                  {isTesting ? <LoaderIcon className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <WifiIcon className="mr-2 h-5 w-5"/>}
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </Button>
                <div className="flex gap-3">
                  <Button type="button" onClick={onClose} className="bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">Cancel</Button>
                  <Button type="submit">
                      <SaveIcon className="mr-2 h-5 w-5"/>
                      Save Settings
                  </Button>
                </div>
            </footer>
        </form>
      </div>
    </div>
  );
};