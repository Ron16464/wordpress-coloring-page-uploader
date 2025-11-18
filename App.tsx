import React, { useState, useCallback, useEffect } from 'react';
import { processImages } from './services/imageProcessor';
import { generatePostHtml } from './services/htmlGenerator';
import { uploadImage, findOrCreateCategory, createPost } from './services/wpUploader';
import { generateArticle } from './services/geminiService';
import { Input } from './components/Input';
import { TextArea } from './components/TextArea';
import { Button, Select } from './components/Controls';
import { ResultModal } from './components/ResultModal';
import { ProcessedImage, WpConfig, WpMedia } from './types';
import { UploadIcon, ZapIcon, LoaderIcon, SettingsIcon, SparklesIcon } from './components/Icons';
import { SettingsModal } from './components/SettingsModal';

interface Result {
  postUrl: string;
  editUrl: string;
  images: ProcessedImage[]; // for download zip
}

const DEFAULT_GEMINI_PROMPT = `Write a comprehensive, engaging, and SEO-optimized blog post of approximately 1200-1500 words with the title "{{POST_TITLE}}".

The target audience is parents looking for coloring activities for their children. The tone should be friendly, helpful, and slightly playful.

The article should include:
1.  A captivating introduction that hooks the reader and introduces the topic.
2.  Several sections with clear, descriptive headings.
3.  Content that explores the benefits of coloring, fun facts related to the subject of the coloring pages, and creative ideas for using the finished pages.
4.  Bulleted or numbered lists to improve readability.
5.  A warm and encouraging conclusion that prompts readers to download the coloring pages.

Ensure the content is original, high-quality, and provides real value to the reader. Format the output as plain text.`;

export default function App() {
  const [postData, setPostData] = useState({
    postTitle: '',
    category: '',
    tags: '',
    article: '',
    faq: '',
    status: 'draft',
  });
  const [wpConfig, setWpConfig] = useState<WpConfig>({
    url: '',
    username: '',
    password: '',
  });
  const [geminiPrompt, setGeminiPrompt] = useState<string>('');

  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState('Ready.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('wpUploaderConfig');
      if (savedConfig) {
        setWpConfig(JSON.parse(savedConfig));
      }
      const savedPrompt = localStorage.getItem('geminiPromptTemplate');
      setGeminiPrompt(savedPrompt || DEFAULT_GEMINI_PROMPT);
    } catch (error) {
      console.error("Failed to parse config from localStorage", error);
    }
  }, []);

  const handleSaveSettings = (newConfig: WpConfig) => {
    setWpConfig(newConfig);
    localStorage.setItem('wpUploaderConfig', JSON.stringify(newConfig));
    setIsSettingsOpen(false);
    setStatus('Settings saved successfully.');
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPostData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleGeminiPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setGeminiPrompt(newPrompt);
    localStorage.setItem('geminiPromptTemplate', newPrompt);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleGenerateArticle = async () => {
    if (!postData.postTitle) {
      setStatus("Error: Please enter a Post Title before generating an article.");
      return;
    }
    setIsGeneratingArticle(true);
    setStatus("Generating article with Gemini...");
    try {
      const articleText = await generateArticle(postData.postTitle, geminiPrompt);
      setPostData(prev => ({ ...prev, article: articleText }));
      setStatus("Article generated successfully!");
    } catch (err: any) {
      console.error(err);
      setStatus(`Error generating article: ${err.message}`);
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wpConfig.url || !wpConfig.username || !wpConfig.password) {
      setStatus('Error: WordPress settings are incomplete. Please configure them first.');
      setIsSettingsOpen(true);
      return;
    }
    if (files.length === 0) {
      setStatus('Error: Please select at least one image.');
      return;
    }
    setIsProcessing(true);
    setStatus('Starting process...');
    try {
      const processedImages = await processImages(files, (progress) => {
        setStatus(`Resizing image ${progress.current} of ${progress.total}...`);
      });

      const uploadedMedia: WpMedia[] = [];
      for (let i = 0; i < processedImages.length; i++) {
        setStatus(`Uploading image ${i + 1} of ${processedImages.length} to WordPress...`);
        const media = await uploadImage(processedImages[i], wpConfig);
        uploadedMedia.push(media);
      }
      const mediaIds = uploadedMedia.map(m => m.id);

      setStatus('Finding WordPress category...');
      const categoryId = await findOrCreateCategory(postData.category, wpConfig);

      setStatus('Generating post content...');
      const postHtml = generatePostHtml(postData, mediaIds);

      setStatus('Creating post in WordPress...');
      const newPost = await createPost({
        title: postData.postTitle,
        content: postHtml,
        status: postData.status as 'draft' | 'publish',
        categories: categoryId ? [categoryId] : undefined,
        tags: postData.tags,
      }, wpConfig);

      setResult({
        postUrl: newPost.link,
        editUrl: `${wpConfig.url.replace(/\/$/, '')}/wp-admin/post.php?post=${newPost.id}&action=edit`,
        images: processedImages
      });
      setStatus('Process completed successfully!');
    } catch (err: any) {
      console.error(err);
      let errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('401')) {
          errorMessage = 'Authentication failed. Please check your WordPress credentials in Settings.';
      } else if (errorMessage.includes('Failed to fetch')) {
          errorMessage = 'Network error. Could not connect to WordPress URL. Check CORS settings and URL.';
      }
      setStatus(`An error occurred: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
       <button 
        onClick={() => setIsSettingsOpen(true)} 
        title="Settings" 
        className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-slate-800 shadow-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-20 border border-slate-200 dark:border-slate-700"
      >
        <SettingsIcon className="h-6 w-6 text-slate-500" />
      </button>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            WordPress Coloring Page Uploader
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Automate image processing, AI content generation, and publishing for your coloring pages.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-6">Post Metadata</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input label="Post Title" name="postTitle" value={postData.postTitle} onChange={handleInputChange} placeholder="e.g., Cute Puppy Coloring Pages" required />
                <Input label="Post Category" name="category" value={postData.category} onChange={handleInputChange} placeholder="e.g., Animals" required />
                <Input label="Post Tags" name="tags" value={postData.tags} onChange={handleInputChange} placeholder="puppy, dog, cute, pets (comma-separated)" />
                <Select label="Post Status" name="status" value={postData.status} onChange={handleInputChange}>
                  <option value="draft">Draft</option>
                  <option value="publish">Published</option>
                </Select>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-6">AI Content Generation</h2>
                <TextArea 
                    label="Gemini Prompt Template" 
                    name="geminiPrompt" 
                    value={geminiPrompt} 
                    onChange={handleGeminiPromptChange} 
                    rows={8}
                />
                <p className="text-xs mt-2 text-slate-500 dark:text-slate-400">
                    Use <code>{"{{POST_TITLE}}"}</code> as a placeholder for the post title. The generated article will appear in the "Article Content" box below.
                </p>
            </div>
          
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Content</h2>
                <Button 
                    type="button" 
                    onClick={handleGenerateArticle}
                    disabled={isGeneratingArticle || !postData.postTitle}
                    className="bg-purple-600 hover:bg-purple-500 focus-visible:outline-purple-600"
                >
                    {isGeneratingArticle ? <LoaderIcon className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <SparklesIcon className="mr-2 h-5 w-5" />}
                    {isGeneratingArticle ? 'Generating...' : 'Generate Article'}
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TextArea label="Article Content (1000-1500 words)" name="article" value={postData.article} onChange={handleInputChange} rows={15} required/>
                <TextArea label="FAQ Section" name="faq" value={postData.faq} onChange={handleInputChange} rows={15} placeholder="Q: What is the first question?&#10;A: This is the first answer.&#10;Q: What is the second question?&#10;A: This is the second answer."/>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-6">Image Upload</h2>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-900/25 dark:border-slate-100/25 px-6 py-10">
              <div className="text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-slate-400">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-indigo-600 dark:text-indigo-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900 hover:text-indigo-500">
                    <span>Select images</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/jpeg, image/png" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">JPG or PNG files</p>
                {files.length > 0 && <p className="text-sm mt-4 text-green-600 dark:text-green-400 font-medium">{files.length} image{files.length > 1 ? 's' : ''} selected.</p>}
              </div>
            </div>
          </div>
          
          <div className="sticky bottom-0 z-10 py-4 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm -mx-4 -mb-4 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <p className="text-sm font-mono text-slate-600 dark:text-slate-400 flex items-center">
                        {(isProcessing || isGeneratingArticle) && <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />}
                        Status: {status}
                    </p>
                    <Button type="submit" disabled={isProcessing || isGeneratingArticle} className="w-56">
                        {isProcessing ? 'Processing...' : 'Generate & Upload Post'}
                        {!isProcessing && <ZapIcon className="ml-2 -mr-1 h-5 w-5" />}
                    </Button>
                </div>
            </div>
          </div>
        </form>
      </main>
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        initialConfig={wpConfig}
      />

      {result && (
        <ResultModal
          postUrl={result.postUrl}
          editUrl={result.editUrl}
          images={result.images}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  );
}