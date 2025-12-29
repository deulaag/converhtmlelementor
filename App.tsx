import React, { useState, useRef } from 'react';
import { generateLandingPage } from './services/geminiService';
import { convertHtmlToElementor } from './services/parser.ts';
import { ParserResult } from './types';
import { 
  CodeBracketIcon, 
  SparklesIcon, 
  ArrowPathIcon, 
  EyeIcon, 
  CpuChipIcon,
  ArrowDownTrayIcon,
  Square2StackIcon
} from '@heroicons/react/24/solid';

const App: React.FC = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [conversionResult, setConversionResult] = useState<ParserResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt && !image) return;
    setIsGenerating(true);
    setError(null);
    setConversionResult(null);

    try {
      const html = await generateLandingPage(prompt, image);
      setGeneratedHtml(html);
    } catch (err: any) {
      setError(err.message || 'Falha ao gerar o design.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConvert = () => {
    if (!generatedHtml) return;
    setIsConverting(true);
    
    setTimeout(() => {
        try {
            const result = convertHtmlToElementor(generatedHtml);
            setConversionResult(result);
        } catch (e) {
            console.error(e);
            setError("Falha no Motor de Conversão");
        } finally {
            setIsConverting(false);
        }
    }, 800);
  };

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-cyber-900 text-gray-200 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-cyber-700 bg-cyber-800 flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-2">
           <CpuChipIcon className="w-8 h-8 text-cyber-accent" />
           <h1 className="text-xl font-bold tracking-wider text-white">
             AI ARCHITECT <span className="text-cyber-accent">2026</span>
           </h1>
        </div>
        <div className="text-xs font-mono text-gray-500">
          STATUS: <span className="text-green-400">ONLINE</span> | ENGINE: <span className="text-purple-400">GEMINI + DOM_PARSER</span>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Column 1: Input & Chat */}
        <section className="w-1/4 min-w-[320px] bg-cyber-800 border-r border-cyber-700 flex flex-col p-6 overflow-y-auto">
          <h2 className="text-sm uppercase tracking-widest text-gray-400 mb-6 font-bold flex items-center gap-2">
            <SparklesIcon className="w-4 h-4" /> Núcleo Gerador
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-cyber-accent mb-2">INSTRUÇÃO DO PROMPT</label>
              <textarea
                className="w-full h-32 bg-cyber-900 border border-cyber-600 rounded p-3 text-sm focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent outline-none transition-all placeholder-gray-600"
                placeholder="Descreva a sessão... ex: 'Uma hero section cyberpunk para dentista com bordas neon azul e formulário glassmorphism.'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-cyber-accent mb-2">REFERÊNCIA VISUAL (IMAGEM)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyber-600 rounded h-24 flex items-center justify-center cursor-pointer hover:border-cyber-accent hover:bg-cyber-900/50 transition-all"
              >
                {image ? (
                  <span className="text-xs text-white">{image.name}</span>
                ) : (
                  <span className="text-xs text-gray-500">Clique para upload de referência</span>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => e.target.files && setImage(e.target.files[0])}
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || (!prompt && !image)}
              className={`w-full py-4 rounded font-bold tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyber-accent/20
                ${isGenerating || (!prompt && !image)
                  ? 'bg-cyber-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-cyber-accent text-cyber-900 hover:bg-white'
                }`}
            >
              {isGenerating ? (
                <><ArrowPathIcon className="w-5 h-5 animate-spin" /> GERANDO...</>
              ) : (
                <><SparklesIcon className="w-5 h-5" /> EXECUTAR IA</>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-xs rounded">
                ERRO: {error}
              </div>
            )}
          </div>
        </section>

        {/* Column 2: Live Preview */}
        <section className="flex-1 bg-cyber-900 flex flex-col relative border-r border-cyber-700">
          <div className="h-10 bg-cyber-800 border-b border-cyber-700 flex items-center justify-between px-4">
             <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
               <EyeIcon className="w-4 h-4" /> PREVIEW AO VIVO
             </span>
             <span className="text-[10px] text-gray-600 bg-cyber-900 px-2 py-1 rounded">1280px VIEWPORT</span>
          </div>
          
          <div className="flex-1 w-full h-full relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
             {generatedHtml ? (
               <iframe
                 title="Preview"
                 className="w-full h-full border-none"
                 srcDoc={generatedHtml}
                 sandbox="allow-scripts"
               />
             ) : (
               <div className="absolute inset-0 flex items-center justify-center text-gray-700 flex-col gap-4">
                 <div className="w-16 h-16 border-4 border-cyber-700 border-t-cyber-accent rounded-full animate-pulse opacity-50"></div>
                 <p className="font-mono text-sm">AGUARDANDO COMANDO...</p>
               </div>
             )}
          </div>
        </section>

        {/* Column 3: Elementor Result & Downloads */}
        <section className="w-1/4 min-w-[350px] bg-cyber-800 flex flex-col">
          <div className="p-6 border-b border-cyber-700">
            <h2 className="text-sm uppercase tracking-widest text-gray-400 mb-6 font-bold flex items-center gap-2">
              <CodeBracketIcon className="w-4 h-4" /> Motor de Conversão
            </h2>
            
            <button
              onClick={handleConvert}
              disabled={!generatedHtml || isConverting}
              className={`w-full py-4 rounded font-bold tracking-widest text-sm flex items-center justify-center gap-2 transition-all mb-4
                ${!generatedHtml 
                  ? 'bg-cyber-700 text-gray-600 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyber-secondary to-purple-600 text-white hover:scale-[1.02] shadow-lg shadow-purple-500/20'
                }`}
            >
              {isConverting ? (
                <><ArrowPathIcon className="w-5 h-5 animate-spin" /> PROCESSANDO DOM...</>
              ) : (
                'CONVERTER PARA ELEMENTOR'
              )}
            </button>

            {conversionResult && (
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mb-2">
                <div className="bg-cyber-900 p-2 rounded border border-cyber-700 text-center">
                  <span className="block text-cyber-accent text-lg font-bold">{conversionResult.stats.sections}</span>
                  SESSÕES
                </div>
                <div className="bg-cyber-900 p-2 rounded border border-cyber-700 text-center">
                  <span className="block text-cyber-accent text-lg font-bold">{conversionResult.stats.widgets}</span>
                  WIDGETS
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 bg-[#1e1e1e] p-6 overflow-auto">
            {conversionResult ? (
              <div className="flex flex-col gap-4">
                <div className="bg-cyber-900 rounded-lg p-4 border border-cyber-700">
                    <h3 className="text-xs font-bold text-cyber-accent mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Square2StackIcon className="w-4 h-4" /> Pacote Completo
                    </h3>
                    <button
                        onClick={() => downloadJson(conversionResult.full_site, 'site-completo.json')}
                        className="w-full bg-cyber-600 hover:bg-cyber-500 text-white py-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" /> 📥 BAIXAR SITE COMPLETO
                    </button>
                    <p className="text-[10px] text-gray-500 mt-2 text-center leading-tight">
                        Cuidado: Arquivos grandes podem falhar na importação.
                    </p>
                </div>

                <div className="bg-cyber-900 rounded-lg p-4 border border-cyber-700 flex-1">
                    <h3 className="text-xs font-bold text-cyber-accent mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Square2StackIcon className="w-4 h-4" /> Baixar por Sessões
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {conversionResult.sections.map((section, idx) => (
                            <button
                                key={idx}
                                onClick={() => downloadJson(section.json_content, `${section.id}.json`)}
                                className="w-full bg-black/40 hover:bg-cyber-700 border border-cyber-600 text-gray-300 py-2 px-3 rounded text-xs text-left transition-all flex items-center justify-between group"
                            >
                                <span className="truncate max-w-[180px]">{section.name}</span>
                                <ArrowDownTrayIcon className="w-3 h-3 text-gray-500 group-hover:text-cyber-accent" />
                            </button>
                        ))}
                    </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 text-xs font-mono text-center px-4">
                GERE O HTML E CONVERTA PARA LIBERAR OS DOWNLOADS
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;
