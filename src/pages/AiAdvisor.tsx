import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Bot, User, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const FAQ_DB = [
  { keywords: ['chocolate', 'dog'], answer: "Chocolate is highly toxic to dogs. It contains theobromine, which dogs cannot metabolize well. If your dog ate chocolate, please contact a veterinarian immediately. The darker the chocolate, the more dangerous it is." },
  { keywords: ['parvo', 'symptoms'], answer: "Common symptoms of parvovirus in dogs include severe, bloody diarrhea, lethargy, anorexia, fever, vomiting, and extreme weight loss. Parvo is highly contagious and life-threatening. Seek emergency veterinary care immediately if you suspect parvo." },
  { keywords: ['scratching', 'flea'], answer: "Excessive scratching can be caused by fleas, ticks, allergies, or dry skin. Check your pet's fur for small black specks (flea dirt). If you suspect fleas, consult your vet for safe flea treatment options." },
  { keywords: ['cat', 'not eating'], answer: "If your cat hasn't eaten for more than 24 hours, it evaluates as a medical emergency. Cats are prone to hepatic lipidosis (fatty liver disease) when they stop eating. Please consult a vet promptly." },
  { keywords: ['vaccination', 'puppy'], answer: "Puppies typically need core vaccines for Parvovirus, Distemper, Canine Hepatitis, and Rabies. The initial series usually starts at 6-8 weeks of age. Consult your vet to set up a proper vaccination schedule." }
];

const checkFAQ = (query: string) => {
  const q = query.toLowerCase();
  for (const faq of FAQ_DB) {
    if (faq.keywords.every(kw => q.includes(kw))) {
      return faq.answer;
    }
  }
  return null;
};

const fetchWikipedia = async (query: string) => {
  try {
    const searchTerms = query.split(' ').filter(w => w.length > 3).join(' ');
    if (!searchTerms) return null;
    
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerms + ' pet animal')}&utf8=&format=json&origin=*`);
    const data = await res.json();
    if (data.query?.search?.length > 0) {
      const snippet = data.query.search[0].snippet.replace(/(<([^>]+)>)/gi, ""); // strip HTML
      return `Based on general knowledge: ${snippet}... \n\n(Note: I am an AI pulling from general sources. Always consult a vet for medical issues.)`;
    }
  } catch (e) {
    return null;
  }
  return null;
};

const fetchHuggingFace = async (query: string) => {
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          inputs: `<|system|>\nYou are PetSphere AI, a helpful veterinary health advisor. Provide a short, practical, and reassuring answer. Always recommend seeing a vet for medical emergencies.<|end|>\n<|user|>\n${query}<|end|>\n<|assistant|>\n`,
          parameters: {
            max_new_tokens: 150,
            return_full_text: false,
            temperature: 0.5
          }
        })
      }
    );
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (errData.error && errData.error.includes('loading')) {
        return "The AI model is currently waking up... Please wait about 30 seconds and ask your question again.";
      }
      throw new Error('API Error: ' + res.statusText);
    }
    
    const data = await res.json();
    return data[0]?.generated_text?.trim();
  } catch (e) {
    console.error('HF Error', e);
    return null;
  }
};

export const AiAdvisor = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Tier 1: Local FAQ
      let aiText = checkFAQ(userMessage.content);
      
      // Tier 2: Hugging Face AI 
      if (!aiText) {
        aiText = await fetchHuggingFace(userMessage.content);
      }

      // Tier 3: Wikipedia Fallback
      if (!aiText) {
        aiText = await fetchWikipedia(userMessage.content);
      }

      if (!aiText) {
        aiText = "I'm sorry, I couldn't find specific information on that right now. If this is a medical emergency, please contact your local veterinarian immediately.";
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiText as string, timestamp: new Date() }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `Sorry, I encountered an error. Please try again later.`, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "My dog has been scratching a lot, what could it be?",
    "What vaccinations does a puppy need?",
    "My cat isn't eating, should I be worried?",
    "How do I know if my pet has fleas?",
  ];

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Pet Advisor</h1>
          <p className="text-gray-400 text-sm">Powered by Gemini AI — Ask anything about pet health</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="glass-light rounded-lg p-3 mb-4 flex items-start gap-2.5 flex-shrink-0">
        <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400">AI provides general guidance only. Always consult a qualified veterinarian for medical decisions.</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto glass rounded-xl p-4 mb-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-purple-400" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-1">How can I help your pet?</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md">Ask me about symptoms, nutrition, behavior, vaccinations, or any pet health concern.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {suggestedQuestions.map((q, i) => (
                <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                  onClick={() => { setInput(q); }}
                  className="text-left px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-gray-300 hover:bg-white/[0.06] hover:border-purple-500/30 transition-all">
                  {q}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : 'glass-light text-gray-200'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="glass-light rounded-xl px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-3 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your pet's symptoms or ask a question..."
          className="input-dark flex-1 px-4 py-3 rounded-xl text-sm"
          disabled={isLoading}
        />
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit" disabled={isLoading || !input.trim()}
          className="px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/20 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
          <Send className="h-4 w-4" />
        </motion.button>
      </form>
    </div>
  );
};
