
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FlightData, ChatMessage } from '../types';
import { X, Minus, Send, Paperclip, MessageSquare, ChevronRight, Sparkles } from 'lucide-react';

interface FlightChatWindowProps {
  flight: FlightData;
  onClose: () => void;
  isOpen: boolean;
}

// Sugestões para quando o Gestor vai INICIAR ou CONTINUAR falando (Perguntas/Ordens)
const SUGGESTED_QUESTIONS = [
    "Já começou a abastecer?",
    "Que horas termina aí?",
    "Confirma o volume total.",
    "Tudo certo no painel?",
    "Torre pediu pra segurar.",
    "Falta muito ainda?",
    "Verifica o calço."
];

// Sugestões para quando o Operador acabou de falar (Respostas)
const SUGGESTED_RESPONSES = [
    "Ok, entendido.",
    "Pode seguir.",
    "Espera um pouco.",
    "Beleza.",
    "Negativo.",
    "Vou ver aqui e te falo.",
    "Valeu.",
    "Liberado."
];

export const FlightChatWindow: React.FC<FlightChatWindowProps> = ({ flight, onClose, isOpen }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(flight.messages || []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized, isOpen]);

  // Load initial messages from flight data if changed
  useEffect(() => {
    setMessages(flight.messages || []);
  }, [flight]);

  // Determine which suggestions to show based on context
  const currentSuggestions = useMemo(() => {
    if (messages.length === 0) return SUGGESTED_QUESTIONS;
    
    const lastMessage = messages[messages.length - 1];
    
    // Se a última mensagem foi minha (Manager), provavelmente quero perguntar outra coisa -> QUESTIONS
    // Se a última mensagem foi do Operador, preciso responder -> RESPONSES
    return lastMessage.isManager ? SUGGESTED_QUESTIONS : SUGGESTED_RESPONSES;
  }, [messages]);

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
        // Reset height to auto to get the correct scrollHeight for shrinking
        textareaRef.current.style.height = 'auto';
        
        // Calculate new height, capped at 120px
        const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
        
        // Apply new height
        textareaRef.current.style.height = `${newHeight}px`;
        
        // Toggle overflow-y based on whether we hit the max height
        textareaRef.current.style.overflowY = newHeight >= 120 ? 'auto' : 'hidden';
    }
  }, [inputText]);

  const handleSendMessage = (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'MESA',
      text: textToSend,
      timestamp: new Date(),
      isManager: true,
    };

    setMessages(prev => [...prev, newMessage]);
    
    if (!textOverride) {
        setInputText('');
        // Reset height manually after send
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; 
        }
    }
  };

  const handleQuickSend = (text: string) => {
      // Envia diretamente
      handleSendMessage(text);
      // Foca no input caso queira complementar
      textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  // --- MINIMIZED STATE ---
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-20 z-[60] animate-in slide-in-from-bottom-5 duration-300">
        <button 
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-t-lg shadow-2xl hover:bg-slate-800 transition-colors w-72"
        >
          <div className="relative">
             <MessageSquare size={16} className="text-emerald-500" />
             <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
          </div>
          <div className="flex flex-col items-start overflow-hidden">
            <span className="text-xs font-bold font-mono truncate w-full text-left">
                {flight.operator} | {flight.flightNumber}
            </span>
          </div>
          <div className="ml-auto" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X size={14} className="text-slate-500 hover:text-white" />
          </div>
        </button>
      </div>
    );
  }

  // --- EXPANDED STATE ---
  return (
    <div className="fixed bottom-4 right-20 z-[60] w-96 bg-slate-900 border border-slate-700 rounded-t-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 duration-300 h-[700px] max-h-[85vh]">
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white p-3 rounded-t-xl flex justify-between items-center border-b border-slate-700 shrink-0 cursor-pointer" onClick={() => setIsMinimized(true)}>
        <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                {flight.operator?.charAt(0) || '?'}
            </div>
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold font-mono truncate">
                    {flight.operator || 'N/A'} | {flight.flightNumber}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                    {flight.registration}
                </span>
            </div>
        </div>
        <div className="flex items-center gap-1">
            <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="Minimizar"
            >
                <Minus size={16} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-400 transition-colors"
                title="Fechar"
            >
                <X size={16} />
            </button>
        </div>
      </div>

      {/* MESSAGES BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0B1120] scrollbar-thin scrollbar-thumb-slate-700">
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                <MessageSquare size={32} className="mb-2" />
                <p className="text-xs">Canal aberto com {flight.operator}.</p>
            </div>
        ) : (
            messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isManager ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-3 text-sm relative group shadow-sm ${
                        msg.isManager 
                        ? 'bg-emerald-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    }`}>
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                        <div className={`text-[9px] mt-1 opacity-70 flex items-center gap-1 ${msg.isManager ? 'justify-end text-emerald-100' : 'text-slate-400'}`}>
                             {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER (Minimalist with Smart Suggestions) */}
        <div className="bg-slate-900 border-t border-slate-700 shrink-0 flex flex-col">
         
         {/* Smart Suggestions Strip */}
         <div className="flex flex-col gap-1 px-3 py-2 border-b border-slate-800/50 bg-slate-950/30">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                <Sparkles size={10} className="text-indigo-500" />
                Respostas Rápidas
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {currentSuggestions.map((reply, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleQuickSend(reply)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap shadow-sm border ${
                            messages.length > 0 && !messages[messages.length - 1].isManager 
                            ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800 hover:bg-emerald-900/40' // Style for Responses
                            : 'bg-indigo-900/20 text-indigo-400 border-indigo-800 hover:bg-indigo-900/40' // Style for Questions
                        }`}
                    >
                        {reply}
                    </button>
                ))}
            </div>
         </div>
 
         {/* Minimalist Input Area */}
         <div className="p-3">
            <div className="flex items-end gap-2 bg-slate-800/70 p-2 rounded-2xl border border-slate-700 transition-all focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/20 focus-within:bg-slate-800 shadow-sm">
                
                {/* Input Field */}
                <textarea
                    ref={textareaRef}
                    className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-slate-400 focus:ring-0 resize-none py-1.5 px-2 leading-relaxed custom-scrollbar max-h-[120px] min-h-[24px]"
                    placeholder="Escreva aqui..."
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ overflow: 'hidden' }} // Starts hidden, toggles to auto in useEffect
                />

                {/* Actions */}
                <div className="flex items-center gap-1 pb-0.5">
                    <button 
                        className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-colors"
                        title="Anexar arquivo"
                    >
                        <Paperclip size={18} />
                    </button>
                    <button 
                        onClick={() => handleSendMessage()}
                        disabled={!inputText.trim()}
                        className={`p-2 rounded-full transition-all shadow-sm ${
                            inputText.trim() 
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105' 
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
         </div>
      </div>

    </div>
  );
};
